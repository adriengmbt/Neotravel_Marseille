/**
 * code-node.js — VERSION AUTONOME POUR NODE "CODE" n8n (Option A)
 * =====================================================================
 *  À coller dans un node Code (JavaScript), mode « Run Once for Each Item ».
 *  Barème + moteur inlinés (le node Code n'importe pas de fichiers locaux).
 *  Source de vérité : src/bareme.js + src/calculer_devis.js — garder en phase.
 *
 *  Entrée ($input.item.json) : { nb_passagers, date_depart, date_demande,
 *    distance_km, date_retour?, options? }   (déjà validée par l'agent)
 *  Sortie : { ok:true, devis } ou { ok:false, erreur:{ code, message } }.
 * =====================================================================
 */

const BAREME = {
  devise: 'EUR', taux_tva: 0.10, marge: 0.15, aller_retour_facteur: 2,
  grille_max_km: 180,
  grille: [
    { max: 10, prix: 250 }, { max: 20, prix: 250 }, { max: 30, prix: 250 },
    { max: 40, prix: 320 }, { max: 50, prix: 350 }, { max: 60, prix: 390 },
    { max: 70, prix: 430 }, { max: 80, prix: 500 }, { max: 90, prix: 540 },
    { max: 100, prix: 580 }, { max: 110, prix: 620 }, { max: 120, prix: 660 },
    { max: 130, prix: 700 }, { max: 140, prix: 740 }, { max: 150, prix: 780 },
    { max: 160, prix: 820 }, { max: 170, prix: 860 }, { max: 180, prix: 900 },
  ],
  au_dela: { km_facteur: 2, prix_km: 2.5 },
  capacite_max_auto: 85,
  capacite: [
    { max: 19, coef: 0.95, libelle: '≤ 19 (-5 %)' }, { max: 53, coef: 1.00, libelle: '20-53 (0 %)' },
    { max: 63, coef: 1.15, libelle: '54-63 (+15 %)' }, { max: 67, coef: 1.20, libelle: '64-67 (+20 %)' },
    { max: 85, coef: 1.40, libelle: '68-85 (+40 %)' },
  ],
  saison: {
    coefficients: { baisse: 0.93, moyenne: 1.00, haute: 1.10, tres_haute: 1.15 },
    mois: { 1:'baisse',2:'baisse',3:'haute',4:'haute',5:'tres_haute',6:'tres_haute',7:'haute',8:'baisse',9:'moyenne',10:'moyenne',11:'baisse',12:'moyenne' },
  },
  anticipation: [
    { max_jours: 14, coef: 1.10, libelle: 'Prioritaire (≤ 14 j, +10 %)' },
    { max_jours: 30, coef: 1.05, libelle: 'Urgent (15-30 j, +5 %)' },
    { max_jours: 90, coef: 0.95, libelle: 'Normal (31-90 j, -5 %)' },
    { max_jours: Infinity, coef: 0.90, libelle: '3 mois et + (>90 j, -10 %)' },
  ],
  distance_max_km: null,
  options: {
    guide: { libelle: 'Guide accompagnateur', type: 'forfait', montant_ht: 150 },
    nuit_chauffeur: { libelle: 'Nuitée chauffeur', type: 'forfait', montant_ht: 130 },
    peages: { libelle: 'Péages (estimation)', type: 'par_km', montant_ht: 0.15 },
  },
};

class DevisError extends Error { constructor(code, m) { super(m); this.name = 'DevisError'; this.code = code; } }
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
function parseDateUTC(v, c) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new DevisError('ERR_DATE_INVALIDE', `${c} doit être YYYY-MM-DD (reçu: ${v})`);
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new DevisError('ERR_DATE_INVALIDE', `${c} invalide: ${v}`);
  return d;
}
const joursEntre = (a, b) => Math.round((b - a) / 86400000);
function forfaitSimple(km, b) {
  if (km <= b.grille_max_km) return b.grille.find((r) => km <= r.max).prix;
  return km * b.au_dela.km_facteur * b.au_dela.prix_km;
}

function calculer_devis(params, bareme = BAREME) {
  const p = params || {};
  const { nb_passagers, date_depart, date_demande, distance_km } = p;
  const date_retour = p.date_retour ?? null;
  const options = Array.isArray(p.options) ? p.options : [];

  if (!Number.isInteger(nb_passagers) || nb_passagers <= 0) throw new DevisError('ERR_PASSAGERS_INVALIDE', 'nb_passagers entier > 0 requis');
  if (nb_passagers > bareme.capacite_max_auto) throw new DevisError('ERR_CAPACITE_DEPASSEE', `${nb_passagers} > ${bareme.capacite_max_auto} — flux manuel / escalade`);
  if (typeof distance_km !== 'number' || !Number.isFinite(distance_km) || distance_km <= 0) throw new DevisError('ERR_DISTANCE_INVALIDE', 'distance_km > 0 requis');
  if (bareme.distance_max_km != null && distance_km > bareme.distance_max_km) throw new DevisError('ERR_HORS_ZONE', `distance ${distance_km}km > max ${bareme.distance_max_km}km — escalade`);
  const dDepart = parseDateUTC(date_depart, 'date_depart');
  const dDemande = parseDateUTC(date_demande, 'date_demande');
  if (dDepart < dDemande) throw new DevisError('ERR_DATES_INCOHERENTES', 'date_depart antérieure à date_demande');
  let aller_retour = false;
  if (date_retour != null) {
    const dRetour = parseDateUTC(date_retour, 'date_retour');
    if (dRetour < dDepart) throw new DevisError('ERR_DATES_INCOHERENTES', 'date_retour antérieure à date_depart');
    aller_retour = true;
  }
  for (const o of options) if (!bareme.options[o]) throw new DevisError('ERR_OPTION_INCONNUE', `option inconnue: ${o}`);

  const base_simple = forfaitSimple(distance_km, bareme);
  const base = base_simple * (aller_retour ? bareme.aller_retour_facteur : 1);

  const coefficients = [];
  const saisonKey = bareme.saison.mois[dDepart.getUTCMonth() + 1];
  const coefSaison = bareme.saison.coefficients[saisonKey];
  coefficients.push({ libelle: `Saison (${saisonKey})`, valeur: coefSaison });
  const anticipation = joursEntre(dDemande, dDepart);
  const palierAnt = bareme.anticipation.find((x) => anticipation <= x.max_jours);
  coefficients.push({ libelle: `Anticipation — ${palierAnt.libelle} (${anticipation} j)`, valeur: palierAnt.coef });
  const palierCap = bareme.capacite.find((t) => nb_passagers <= t.max);
  coefficients.push({ libelle: `Capacité — ${palierCap.libelle}`, valeur: palierCap.coef });
  coefficients.push({ libelle: `Marge (${Math.round(bareme.marge * 100)} %)`, valeur: round2(1 + bareme.marge) });

  const transport_ht = round2(base * coefSaison * palierAnt.coef * palierCap.coef * (1 + bareme.marge));
  const lignes = [];
  const ligneBase = round2(base);
  lignes.push({ libelle: `Transfert ${aller_retour ? 'aller-retour' : 'simple'} — ${distance_km} km (forfait)`, montant: ligneBase });
  lignes.push({ libelle: 'Coefficients (saison × anticipation × capacité) + marge', montant: round2(transport_ht - ligneBase) });
  for (const o of options) {
    const opt = bareme.options[o];
    const montant = opt.type === 'par_km' ? opt.montant_ht * distance_km : opt.montant_ht;
    lignes.push({ libelle: `${opt.libelle} (option)`, montant: round2(montant) });
  }
  const prix_ht = round2(lignes.reduce((s, l) => s + l.montant, 0));
  const tva = round2(prix_ht * bareme.taux_tva);
  const prix_ttc = round2(prix_ht + tva);

  return {
    devise: bareme.devise, prix_ht, tva, prix_ttc, taux_tva: bareme.taux_tva, lignes, coefficients,
    meta: { trajet: aller_retour ? 'aller-retour' : 'simple', aller_retour, distance_km, base_forfait_simple: round2(base_simple), nb_passagers, anticipation_jours: anticipation, saison: saisonKey, marge: bareme.marge },
  };
}

// ----------------------- ADAPTATEUR n8n ---------------------------
try {
  const devis = calculer_devis($input.item.json);
  return { json: { ok: true, devis } };
} catch (e) {
  return { json: { ok: false, erreur: { code: e.code || 'ERR_INCONNUE', message: e.message } } };
}
