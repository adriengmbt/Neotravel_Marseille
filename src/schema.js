/**
 * schema.js — CONTRAT TYPÉ (Structured Outputs)
 * =====================================================================
 *  Schéma Zod du contrat d'entrée de calculer_devis(), à valider AVANT
 *  tout calcul (exigence « sorties structurées », fiche projet §4.1 et
 *  livret technique notion 03).
 *
 *  Le type de véhicule n'est PAS un paramètre de pricing : la grille
 *  officielle tarifie au km, et la capacité est un coefficient dérivé du
 *  nombre de passagers. Le trajet est « aller-retour » dès qu'une
 *  date_retour est fournie (sinon « transfert simple »).
 * =====================================================================
 */

const { z } = require('zod');

const OPTIONS = ['guide', 'nuit_chauffeur', 'peages'];
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date ISO YYYY-MM-DD attendue');

const DevisInputSchema = z
  .object({
    nb_passagers: z.number().int().positive(),
    date_depart: isoDate,
    date_demande: isoDate,
    distance_km: z.number().positive(),
    date_retour: isoDate.nullable().optional(), // présent => aller-retour
    options: z.array(z.enum(OPTIONS)).default([]),
  })
  .strict(); // rejette tout champ non prévu (anti-injection de données parasites)

module.exports = { DevisInputSchema, OPTIONS };
