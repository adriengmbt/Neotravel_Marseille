/**
 * calculer_devis.js — MOTEUR DE DEVIS DÉTERMINISTE (règles officielles)
 * =====================================================================
 *  « L'IA assiste, comprend et rédige — le code calcule, trace et sécurise. »
 *
 *  Fonction pure, déterministe, auditable. AUCUN appel LLM. Sans dépendance
 *  (collable dans un node Code n8n). Ne lit que des variables typées :
 *  aucun texte libre ne peut influencer le prix (résistance prompt injection).
 *
 *  Contrat :
 *    calculer_devis({ nb_passagers, date_depart, date_demande,
 *                     distance_km, date_retour?, options? })
 *      -> { devise, prix_ht, tva, prix_ttc, taux_tva,
 *           lignes:[{libelle, montant}], coefficients:[{libelle, valeur}], meta }
 *
 *  Pipeline (cf. bareme.js) :
 *    base = forfait_grille(distance) [× 2 si aller-retour]
 *    transport_ht = base × saison × anticipation × capacité × (1 + marge)
 *    prix_ht = transport_ht + options(provisoire)
 *    tva = prix_ht × taux_tva ; prix_ttc = prix_ht + tva
 * =====================================================================
 */

const BAREME = require('./bareme');

class DevisError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DevisError';
    this.code = code;
  }
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function parseDateUTC(valeur, champ) {
  if (typeof valeur !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
    throw new DevisError('ERR_DATE_INVALIDE', `${champ} doit être une date ISO YYYY-MM-DD (reçu: ${valeur})`);
  }
  const d = new Date(`${valeur}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    throw new DevisError('ERR_DATE_INVALIDE', `${champ} est une date invalide: ${valeur}`);
  }
  return d;
}
const joursEntre = (a, b) => Math.round((b - a) / 86_400_000);

/** Forfait de base d'un transfert simple, selon la distance ALLER (km). */
function forfaitSimple(distance_km, bareme) {
  if (distance_km <= bareme.grille_max_km) {
    const palier = bareme.grille.find((r) => distance_km <= r.max);
    return palier.prix;
  }
  // Au-delà de 180 km : (KM × km_facteur) × prix_km.
  return distance_km * bareme.au_dela.km_facteur * bareme.au_dela.prix_km;
}

/**
 * @param {object} params - cf. contrat.
 * @param {object} [bareme=BAREME] - barème injectable (tests).
 * @returns {object} devis structuré et auditable.
 * @throws {DevisError}
 */
function calculer_devis(params, bareme = BAREME) {
  const p = params || {};
  const { nb_passagers, date_depart, date_demande, distance_km } = p;
  const date_retour = p.date_retour ?? null;
  const options = Array.isArray(p.options) ? p.options : [];

  // ---------------------------------------------------------------
  // 1) VALIDATION (typée, déterministe)
  // ---------------------------------------------------------------
  if (!Number.isInteger(nb_passagers) || nb_passagers <= 0) {
    throw new DevisError('ERR_PASSAGERS_INVALIDE', 'nb_passagers doit être un entier strictement positif');
  }
  if (nb_passagers > bareme.capacite_max_auto) {
    throw new DevisError('ERR_CAPACITE_DEPASSEE',
      `${nb_passagers} passagers > limite automatisable (${bareme.capacite_max_auto}) — flux manuel / escalade commercial`);
  }
  if (typeof distance_km !== 'number' || !Number.isFinite(distance_km) || distance_km <= 0) {
    throw new DevisError('ERR_DISTANCE_INVALIDE', 'distance_km doit être un nombre strictement positif');
  }
  if (bareme.distance_max_km != null && distance_km > bareme.distance_max_km) {
    throw new DevisError('ERR_HORS_ZONE',
      `distance ${distance_km} km > maximum automatisable ${bareme.distance_max_km} km — escalade humaine requise`);
  }
  const dDepart = parseDateUTC(date_depart, 'date_depart');
  const dDemande = parseDateUTC(date_demande, 'date_demande');
  if (dDepart < dDemande) {
    throw new DevisError('ERR_DATES_INCOHERENTES', 'date_depart ne peut pas être antérieure à date_demande');
  }
  let aller_retour = false;
  if (date_retour != null) {
    const dRetour = parseDateUTC(date_retour, 'date_retour');
    if (dRetour < dDepart) {
      throw new DevisError('ERR_DATES_INCOHERENTES', 'date_retour ne peut pas être antérieure à date_depart');
    }
    aller_retour = true;
  }
  for (const o of options) {
    if (!bareme.options[o]) throw new DevisError('ERR_OPTION_INCONNUE', `option inconnue: ${o}`);
  }

  // ---------------------------------------------------------------
  // 2) BASE FORFAITAIRE
  // ---------------------------------------------------------------
  const base_simple = forfaitSimple(distance_km, bareme);
  const base = base_simple * (aller_retour ? bareme.aller_retour_facteur : 1);

  // ---------------------------------------------------------------
  // 3) COEFFICIENTS (tracés pour audit)
  // ---------------------------------------------------------------
  const coefficients = [];

  const mois = dDepart.getUTCMonth() + 1;
  const saisonKey = bareme.saison.mois[mois];
  const coefSaison = bareme.saison.coefficients[saisonKey];
  coefficients.push({ libelle: `Saison (${saisonKey})`, valeur: coefSaison });

  const anticipation = joursEntre(dDemande, dDepart);
  const palierAnt = bareme.anticipation.find((x) => anticipation <= x.max_jours);
  coefficients.push({ libelle: `Anticipation — ${palierAnt.libelle} (${anticipation} j)`, valeur: palierAnt.coef });

  const palierCap = bareme.capacite.find((t) => nb_passagers <= t.max);
  coefficients.push({ libelle: `Capacité — ${palierCap.libelle}`, valeur: palierCap.coef });

  coefficients.push({ libelle: `Marge (${Math.round(bareme.marge * 100)} %)`, valeur: round2(1 + bareme.marge) });

  // ---------------------------------------------------------------
  // 4) LIGNES DU DEVIS (leur somme = prix_ht, à auditer)
  // ---------------------------------------------------------------
  const transport_ht = round2(base * coefSaison * palierAnt.coef * palierCap.coef * (1 + bareme.marge));

  const lignes = [];
  const ligneBase = round2(base);
  lignes.push({
    libelle: `Transfert ${aller_retour ? 'aller-retour' : 'simple'} — ${distance_km} km (forfait)`,
    montant: ligneBase,
  });
  lignes.push({
    libelle: 'Coefficients (saison × anticipation × capacité) + marge',
    montant: round2(transport_ht - ligneBase),
  });

  for (const o of options) {
    const opt = bareme.options[o];
    const montant = opt.type === 'par_km' ? opt.montant_ht * distance_km : opt.montant_ht;
    lignes.push({ libelle: `${opt.libelle} (option)`, montant: round2(montant) });
  }

  // ---------------------------------------------------------------
  // 5) TOTAUX
  // ---------------------------------------------------------------
  const prix_ht = round2(lignes.reduce((s, l) => s + l.montant, 0));
  const tva = round2(prix_ht * bareme.taux_tva);
  const prix_ttc = round2(prix_ht + tva);

  return {
    devise: bareme.devise,
    prix_ht,
    tva,
    prix_ttc,
    taux_tva: bareme.taux_tva,
    lignes,
    coefficients,
    meta: {
      trajet: aller_retour ? 'aller-retour' : 'simple',
      aller_retour,
      distance_km,
      base_forfait_simple: round2(base_simple),
      nb_passagers,
      anticipation_jours: anticipation,
      saison: saisonKey,
      marge: bareme.marge,
    },
  };
}

module.exports = { calculer_devis, DevisError, BAREME, round2, forfaitSimple };
