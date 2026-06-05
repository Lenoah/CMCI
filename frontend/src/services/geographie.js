// Service géographique du frontend : alimente les listes déroulantes
// (pays, villes) et déduit la sous-région d'un pays.
//   • country-state-city → liste des pays (code ISO) et des villes
//   • world-countries     → nom français et sous-région de chaque pays
import { Country, City } from 'country-state-city';
import paysMonde from 'world-countries';

// Traduction des sous-régions ONU (anglais → français). Doit rester identique
// à la table du backend (src/config/geographie.js) pour que tout corresponde.
const SOUS_REGIONS_FR = {
  'Northern Africa': 'Afrique du Nord',
  'Middle Africa': 'Afrique Centrale',
  'Western Africa': 'Afrique de l\'Ouest',
  'Eastern Africa': 'Afrique de l\'Est',
  'Southern Africa': 'Afrique Australe',
  'Western Europe': 'Europe de l\'Ouest',
  'Northern Europe': 'Europe du Nord',
  'Southern Europe': 'Europe du Sud',
  'Eastern Europe': 'Europe de l\'Est',
  'Northern America': 'Amérique du Nord',
  'South America': 'Amérique du Sud',
  'Central America': 'Amérique Centrale',
  'Caribbean': 'Caraïbes',
  'Western Asia': 'Asie de l\'Ouest',
  'Southern Asia': 'Asie du Sud',
  'South-Eastern Asia': 'Asie du Sud-Est',
  'Eastern Asia': 'Asie de l\'Est',
  'Central Asia': 'Asie Centrale',
  'Australia and New Zealand': 'Océanie',
  'Melanesia': 'Océanie', 'Polynesia': 'Océanie', 'Micronesia': 'Océanie',
};

// Index code ISO → données world-countries (nom FR + sous-région)
const parCode = {};
for (const p of paysMonde) parCode[p.cca2] = p;

// Liste des pays { code, nom (français) }, triée par nom
export function listePays() {
  return Country.getAllCountries()
    .map((c) => ({ code: c.isoCode, nom: parCode[c.isoCode]?.translations.fra.common || c.name }))
    .sort((a, b) => a.nom.localeCompare(b.nom));
}

// Villes d'un pays (par code ISO), triées par nom
export function villesDuPays(code) {
  if (!code) return [];
  return City.getCitiesOfCountry(code).map((v) => v.name).sort((a, b) => a.localeCompare(b));
}

// Sous-région française d'un pays (ex : « CM » → « Afrique Centrale »)
export function sousRegionDuPays(code) {
  const p = parCode[code];
  if (!p) return '';
  return SOUS_REGIONS_FR[p.subregion] || p.subregion;
}
