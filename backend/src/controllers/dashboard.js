// Contrôleur pour les tableaux de bord statistiques
const { Op } = require('sequelize');
const {
  Disciple, EgliseDeMaison, Reunion, RoutineSpirituelle,
  ValidationAvancement, ContenuSpirituel, Consultation, Presence,
} = require('../models');

// Calcule le début de la semaine actuelle (lundi)
function debutSemaine() {
  const d = new Date();
  const jour = d.getDay(); // 0=dim, 1=lun...
  const diff = d.getDate() - jour + (jour === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Calcule le début du mois actuel
function debutMois() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// GET /api/dashboard/disciple — stats pour le disciple connecté
async function disciple(req, res) {
  try {
    const idDisciple = req.user.id;

    const routinesSemaine = await RoutineSpirituelle.count({
      where: { idDisciple, dateRoutine: { [Op.gte]: debutSemaine() } },
    });

    const contenusConsultes = await Consultation.count({
      where: { idDisciple },
    });

    const moi = await Disciple.findByPk(idDisciple, {
      attributes: ['niveauFormation', 'role', 'statut'],
    });

    const dernieresRoutines = await RoutineSpirituelle.findAll({
      where: { idDisciple },
      order: [['dateRoutine', 'DESC']],
      limit: 5,
    });

    const prochainesReunions = await Reunion.findAll({
      where: {
        dateHeureDebut: { [Op.gte]: new Date() },
        statutReunion: 'Planifiee',
      },
      include: [{ model: EgliseDeMaison, as: 'eglise', attributes: ['nomEglise'] }],
      order: [['dateHeureDebut', 'ASC']],
      limit: 5,
    });

    res.json({
      routinesSemaine,
      contenusConsultes,
      niveauFormation: moi?.niveauFormation || 1,
      dernieresRoutines,
      prochainesReunions,
    });
  } catch (err) {
    console.error('Erreur dashboard disciple:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// GET /api/dashboard/dirigeant — stats pour le dirigeant et son église
async function dirigeant(req, res) {
  try {
    // Trouver l'église que dirige cet utilisateur
    const eglise = await EgliseDeMaison.findOne({
      where: { idDirigeant: req.user.id },
    });
    if (!eglise) return res.json({ message: 'Aucune église assignée', totalMembres: 0 });

    const totalMembres = await Disciple.count({
      where: { idEglise: eglise.idEglise },
    });

    const reunionsMois = await Reunion.count({
      where: {
        idEglise: eglise.idEglise,
        dateHeureDebut: { [Op.gte]: debutMois() },
      },
    });

    const avancements = await ValidationAvancement.count({
      where: { idEvaluateur: req.user.id, statutDirigeant: 'EnAttente' },
    });

    const membres = await Disciple.findAll({
      where: { idEglise: eglise.idEglise },
      attributes: ['idDisciple', 'nom', 'prenom', 'role', 'niveauFormation', 'statut'],
    });

    const reunionsAvenir = await Reunion.findAll({
      where: {
        idEglise: eglise.idEglise,
        dateHeureDebut: { [Op.gte]: new Date() },
        statutReunion: 'Planifiee',
      },
      order: [['dateHeureDebut', 'ASC']],
      limit: 5,
    });

    res.json({ eglise, totalMembres, reunionsMois, avancements, membres, reunionsAvenir });
  } catch (err) {
    console.error('Erreur dashboard dirigeant:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// GET /api/dashboard/leader — stats globales pour le leader
async function leader(req, res) {
  try {
    const totalDisciples = await Disciple.count({ where: { statut: 'Actif' } });
    const totalEglises = await EgliseDeMaison.count({ where: { statutEglise: 'Active' } });
    const totalReunions = await Reunion.count({
      where: { dateHeureDebut: { [Op.gte]: debutMois() } },
    });
    const avancementsAttente = await ValidationAvancement.count({
      where: { statutDirigeant: 'Approuve', statutLeader: 'EnAttente' },
    });

    // Répartition des disciples par pays
    const parPays = await Disciple.findAll({
      attributes: ['pays', [require('sequelize').fn('COUNT', require('sequelize').col('id_disciple')), 'total']],
      where: { statut: 'Actif' },
      group: ['pays'],
      raw: true,
    });

    res.json({ totalDisciples, totalEglises, totalReunions, avancementsAttente, parPays });
  } catch (err) {
    console.error('Erreur dashboard leader:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { disciple, dirigeant, leader };
