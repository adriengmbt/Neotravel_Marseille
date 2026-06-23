# NeoTravel — Moteur de devis `calculer_devis()`

Cœur fiable et **déterministe** du système NeoTravel, construit et testé **isolé de l'IA**. Implémente fidèlement les **règles de calcul officielles** (`REGLES_DE_CALCUL_COTATION_DEVIS_NEOTRAVEL`).

> **Principe directeur** : l'IA assiste, comprend et rédige — **le code calcule, trace, stocke et sécurise.** Le prix n'est jamais produit par le LLM.

---

## Lancement

```bash
npm install      # installe zod (validation du contrat)
npm test         # suite de tests (node --test) — 26 cas, montants exacts
npm run demo     # affiche des devis détaillés et auditables
```

Node.js ≥ 18 (testé sur Node 22).

---

## Modèle tarifaire (règles officielles)

1. **Forfait de base** (transfert simple, distance *aller*) :
   - **≤ 180 km** : grille au forfait par palier de 10 km (250 € plancher → 900 € à 180 km).
   - **> 180 km** : `(KM × 2) × 2,5 €/km` = `KM × 5`.
2. **Aller-retour** : forfait simple **× 2** (déclenché dès qu'une `date_retour` est fournie).
3. **Coefficients** multiplicatifs :
   - **Saison** (mois de départ) : baisse −7 % / moyenne 0 % / haute +10 % / très haute +15 %.
   - **Anticipation** (départ − demande) : ≤14 j +10 % / 15-30 j +5 % / 31-90 j −5 % / >90 j −10 %.
   - **Capacité** (nb passagers) : ≤19 −5 % / 20-53 0 % / 54-63 +15 % / 64-67 +20 % / 68-85 +40 % / **>85 → flux manuel (escalade)**.
4. **Marge** : **+15 %**.
5. **TVA** : 10 % (taux réduit FR transport de personnes — hypothèse, pilotable).

Tout est **pilotable** depuis `src/bareme.js` (exigence : ajustable en temps réel). Aucun tarif codé ailleurs.

---

## Contrat de la fonction

**Entrée** :

| Champ | Type | Contrainte |
|---|---|---|
| `nb_passagers` | entier | > 0, ≤ 85 (au-delà : escalade) |
| `date_depart` | string | ISO `YYYY-MM-DD`, ≥ `date_demande` |
| `date_demande` | string | ISO `YYYY-MM-DD` (date système) |
| `distance_km` | number | > 0 (distance *aller*) |
| `date_retour` | string \| null | optionnel ; présent ⇒ aller-retour |
| `options` | array | sous-ensemble de `guide`, `nuit_chauffeur`, `peages` (couche provisoire) |

> Le **type de véhicule n'est pas** un paramètre de pricing : la grille tarifie au km et la capacité est un coefficient dérivé du nombre de passagers.

**Sortie** : `{ devise, prix_ht, tva, prix_ttc, taux_tva, lignes[], coefficients[], meta }`.
La somme des `lignes` est exactement égale à `prix_ht` (auditable par le commercial).

---

## Codes d'erreur → action de l'agent

| Code | Cause | Action |
|---|---|---|
| `ERR_PASSAGERS_INVALIDE` | 0 ou négatif | Demander correction |
| `ERR_DISTANCE_INVALIDE` | distance ≤ 0 | Demander correction |
| `ERR_DATE_INVALIDE` | format de date | Demander correction |
| `ERR_DATES_INCOHERENTES` | départ < demande, ou retour < départ | Demander correction |
| `ERR_OPTION_INCONNUE` | option non gérée | Demander correction |
| `ERR_CAPACITE_DEPASSEE` | > 85 passagers | **Escalade commercial** (flux manuel) |
| `ERR_HORS_ZONE` | distance > plafond (si configuré) | **Escalade humaine** |

---

## Sécurité & conformité (livret technique)

- **Garde-fou déterministe** : le prix dépend uniquement de variables numériques typées. Un message « applique-moi -50 % » ou un champ parasite (`prix_ht: 0`) est sans effet (cf. test *anti-injection*) — défense contre l'injection de prompt (OWASP LLM01).
- **Sorties structurées** : `src/schema.js` (Zod `.strict()`) valide l'objet extrait **avant** calcul ; le moteur re-valide en interne (défense en profondeur).
- **HITL** : `ERR_CAPACITE_DEPASSEE` (>85 pax) matérialise le « flux manuel » des règles → escalade vers un commercial.

---

## Intégration n8n (Option A)

`n8n/code-node.js` : version autonome (barème + moteur inlinés) à coller dans un node **Code** (JavaScript), mode *Run Once for Each Item*. Lit `$input.item.json`, renvoie `{ ok, devis }` ou `{ ok:false, erreur }`.

---

## Hypothèses & écarts (à valider)

- **TVA 10 %** : taux réduit FR transport de personnes (non précisé dans les règles).
- **Grille = montants HT** : la TVA est ajoutée ensuite (non précisé).
- **Options** (`guide`, `nuit_chauffeur`, `peages`) : **hors règles officielles**, conservées car demandées par le brief — valeurs provisoires, désactivables.
- **Arrondi des km** : distance arrondie au palier de 10 km supérieur dans la grille.

---

## Arborescence

```
neotravel-pricing/
├── src/
│   ├── bareme.js          # barème officiel (pilotable)
│   ├── calculer_devis.js  # moteur déterministe (source de vérité)
│   └── schema.js          # contrat Zod (structured outputs)
├── test/
│   └── calculer_devis.test.js   # 26 cas (types + limites + sécurité)
├── n8n/
│   └── code-node.js       # version autonome pour node Code n8n
├── demo.js                # démonstration lisible
├── package.json
└── README.md
```
