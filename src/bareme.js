/**
 * bareme.js — BARÈME TARIFAIRE OFFICIEL NEOTRAVEL
 * =====================================================================
 *  Transcription fidèle de « REGLES_DE_CALCUL_COTATION_DEVIS_NEOTRAVEL ».
 *
 *  Tout est PILOTABLE depuis ce seul fichier (exigence : ajustable en
 *  temps réel pour suivre le marché). Aucun tarif n'est codé ailleurs.
 *
 *  Modèle tarifaire :
 *    1. Forfait de base = grille au km (≤180 km) OU formule au-delà.
 *    2. Aller-retour     = forfait simple × 2.
 *    3. Coefficients     = saison × anticipation × capacité.
 *    4. Marge            = +15 %.
 *    5. (Options : couche additionnelle PROVISOIRE — voir note plus bas.)
 *    6. TVA              = 10 % (taux réduit transport de personnes, FR).
 *
 *  Montants en EUR HORS TAXES, sauf taux_tva / coefficients.
 * =====================================================================
 */

module.exports = {
  devise: 'EUR',
  taux_tva: 0.10,        // hypothèse : taux réduit FR transport de personnes
  marge: 0.15,           // MARGE 15 %
  aller_retour_facteur: 2, // « TRANSFERT SIMPLE × 2 »

  // ---- Forfait de base (transfert simple, distance ALLER en km) ----
  // Grille au forfait jusqu'à 180 km : on retient la 1re ligne dont
  // `max` >= distance (arrondi au palier de 10 km supérieur).
  grille_max_km: 180,
  grille: [
    { max: 10, prix: 250 }, { max: 20, prix: 250 }, { max: 30, prix: 250 },
    { max: 40, prix: 320 }, { max: 50, prix: 350 }, { max: 60, prix: 390 },
    { max: 70, prix: 430 }, { max: 80, prix: 500 }, { max: 90, prix: 540 },
    { max: 100, prix: 580 }, { max: 110, prix: 620 }, { max: 120, prix: 660 },
    { max: 130, prix: 700 }, { max: 140, prix: 740 }, { max: 150, prix: 780 },
    { max: 160, prix: 820 }, { max: 170, prix: 860 }, { max: 180, prix: 900 },
  ],
  // Au-delà de 180 km : (KM × 2) × 2,5 €/km parcourue  ==  KM × 5.
  au_dela: { km_facteur: 2, prix_km: 2.5 },

  // ---- Capacité (pondération selon nb_passagers) ----
  // Au-delà de capacite_max_auto -> « envoi au commercial : flux manuel ».
  capacite_max_auto: 85,
  capacite: [
    { max: 19, coef: 0.95, libelle: '≤ 19 (-5 %)' },
    { max: 53, coef: 1.00, libelle: '20-53 (0 %)' },
    { max: 63, coef: 1.15, libelle: '54-63 (+15 %)' },
    { max: 67, coef: 1.20, libelle: '64-67 (+20 %)' },
    { max: 85, coef: 1.40, libelle: '68-85 (+40 %)' },
  ],

  // ---- Saison (coefficient selon le mois de départ) ----
  saison: {
    coefficients: { baisse: 0.93, moyenne: 1.00, haute: 1.10, tres_haute: 1.15 },
    mois: {
      1: 'baisse', 2: 'baisse',                 // janvier, février
      3: 'haute', 4: 'haute',                   // mars, avril
      5: 'tres_haute', 6: 'tres_haute',         // mai, juin
      7: 'haute',                               // juillet
      8: 'baisse',                              // août
      9: 'moyenne', 10: 'moyenne',              // septembre, octobre
      11: 'baisse',                             // novembre
      12: 'moyenne',                            // décembre
    },
  },

  // ---- Anticipation (date_depart - date_demande, en jours) ----
  // 1er palier dont `max_jours` >= anticipation.
  anticipation: [
    { max_jours: 14,       coef: 1.10, libelle: 'Prioritaire (≤ 14 j, +10 %)' },
    { max_jours: 30,       coef: 1.05, libelle: 'Urgent (15-30 j, +5 %)' },
    { max_jours: 90,       coef: 0.95, libelle: 'Normal (31-90 j, -5 %)' },
    { max_jours: Infinity, coef: 0.90, libelle: '3 mois et + (>90 j, -10 %)' },
  ],

  // ---- Plafond de distance optionnel (null = pas de plafond officiel) ----
  // Si défini, une distance au-delà déclenche ERR_HORS_ZONE (escalade).
  distance_max_km: null,

  // ---- Options : COUCHE PROVISOIRE ----
  // ⚠️ NON présentes dans les règles officielles. Conservées car demandées
  // par le brief ; valeurs à valider. Appliquées en lignes additionnelles
  // APRÈS marge (non soumises aux coefficients de transport).
  options: {
    guide:          { libelle: 'Guide accompagnateur', type: 'forfait', montant_ht: 150 },
    nuit_chauffeur: { libelle: 'Nuitée chauffeur',     type: 'forfait', montant_ht: 130 },
    peages:         { libelle: 'Péages (estimation)',  type: 'par_km',  montant_ht: 0.15 },
  },
};
