// Référence géographique du serveur (source de vérité).
// On s'appuie sur la librairie `world-countries` pour obtenir, à partir du
// code ISO d'un pays (ex : « CM »), son nom français et sa sous-région.
// La sous-région détermine quel Leader Régional supervise une église.
const pays = require('world-countries');

// Traduction des sous-régions ONU (en anglais dans la librairie) vers le français.
// Une seule table : tout le système parle la même langue → aucun écart possible.
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
  'Melanesia': 'Océanie',
  'Polynesia': 'Océanie',
  'Micronesia': 'Océanie',
};

// Retrouve un pays par son code ISO à 2 lettres (insensible à la casse)
function trouverPays(code) {
  if (!code) return null;
  return pays.find((p) => p.cca2 === code.toUpperCase()) || null;
}

// Nom français du pays (ex : « CM » → « Cameroun »)
function nomPaysFr(code) {
  const p = trouverPays(code);
  return p ? p.translations.fra.common : null;
}

// Sous-région française du pays (ex : « CM » → « Afrique Centrale »)
function sousRegionDuPays(code) {
  const p = trouverPays(code);
  if (!p) return null;
  return SOUS_REGIONS_FR[p.subregion] || p.subregion;
}

module.exports = { nomPaysFr, sousRegionDuPays };
