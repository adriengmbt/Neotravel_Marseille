/**
 * demo.js — Démonstration lisible de calculer_devis() (règles officielles).
 * Lancement : `npm run demo`
 */

const { calculer_devis, DevisError } = require('./src/calculer_devis');
const eur = (n) => `${n.toFixed(2)} €`;

function afficher(titre, params) {
  console.log('\n' + '='.repeat(66));
  console.log(titre);
  console.log('='.repeat(66));
  try {
    const d = calculer_devis(params);
    console.log(`Trajet      : ${d.meta.trajet} — ${d.meta.distance_km} km — ${d.meta.nb_passagers} pax`);
    console.log(`Saison      : ${d.meta.saison} | Anticipation : ${d.meta.anticipation_jours} j | Forfait base : ${eur(d.meta.base_forfait_simple)}`);
    console.log('\nCoefficients appliqués :');
    d.coefficients.forEach((c) => console.log(`  · ${c.libelle.padEnd(44)} ×${c.valeur}`));
    console.log('\nLignes du devis :');
    d.lignes.forEach((l) => console.log(`  · ${l.libelle.padEnd(52)} ${eur(l.montant).padStart(12)}`));
    console.log('  ' + '-'.repeat(66));
    console.log(`  ${'Total HT'.padEnd(52)} ${eur(d.prix_ht).padStart(12)}`);
    console.log(`  ${`TVA (${d.taux_tva * 100} %)`.padEnd(52)} ${eur(d.tva).padStart(12)}`);
    console.log(`  ${'TOTAL TTC'.padEnd(52)} ${eur(d.prix_ttc).padStart(12)}`);
  } catch (e) {
    if (e instanceof DevisError) console.log(`⛔ ${e.code} : ${e.message}`);
    else throw e;
  }
}

afficher('1) Transfert simple complet (sortie scolaire)', {
  nb_passagers: 45, date_demande: '2025-09-01', date_depart: '2025-09-20',
  distance_km: 120, options: [],
});

afficher('2) Aller-retour, longue distance, dernière minute (séminaire)', {
  nb_passagers: 30, date_demande: '2025-07-14', date_depart: '2025-07-15',
  date_retour: '2025-07-17', distance_km: 260, options: ['guide', 'nuit_chauffeur', 'peages'],
});

afficher('3) Petit groupe très anticipé (réduction)', {
  nb_passagers: 12, date_demande: '2025-01-01', date_depart: '2025-05-01',
  distance_km: 60, options: [],
});

afficher('4) Cas limite — plus de 85 passagers (flux manuel / escalade)', {
  nb_passagers: 90, date_demande: '2025-05-01', date_depart: '2025-06-01',
  distance_km: 150, options: [],
});

console.log('');
