// Contrôleur pour les tableaux de bord statistiques
const { Op } = require('sequelize');
const {
  Disciple, EgliseDeMaison, Reunion, RoutineSpirituelle,
  ValidationAvancement, Consultation,
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
      attributes: ['niveauFormation', 'role', 'statut', 'idEglise'],
    });

    const dernieresRoutines = await RoutineSpirituelle.findAll({
      where: { idDisciple },
      order: [['dateRoutine', 'DESC']],
      limit: 5,
    });

    // Réunions à venir de SON église uniquement (cloisonnement)
    const prochainesReunions = await Reunion.findAll({
      where: {
        idEglise: moi?.idEglise || -1,
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

// GET /api/dashboard/leader — stats pour le leader, cloisonnées selon son périmètre
// LeaderMon : monde entier · LeaderNat : son pays · LeaderReg : sa région.
async function leader(req, res) {
  try {
    // On construit un filtre géographique commun aux disciples et aux églises
    const filtreDisciple = { statut: 'Actif' };
    const filtreEglise = { statutEglise: 'Active' };
    if (req.user.role === 'LeaderNat') {
      const moi = await Disciple.findByPk(req.user.id, { attributes: ['pays'] });
      filtreDisciple.pays = moi?.pays || '__aucun__';
      filtreEglise.pays = moi?.pays || '__aucun__';
    } else if (req.user.role === 'LeaderReg') {
      const moi = await Disciple.findByPk(req.user.id, { attributes: ['zoneCouverture'] });
      filtreDisciple.region = moi?.zoneCouverture || '__aucune__';
      filtreEglise.region = moi?.zoneCouverture || '__aucune__';
    }

    const totalDisciples = await Disciple.count({ where: filtreDisciple });
    const totalEglises = await EgliseDeMaison.count({ where: filtreEglise });
    const totalReunions = await Reunion.count({
      where: { dateHeureDebut: { [Op.gte]: debutMois() } },
    });
    const avancementsAttente = await ValidationAvancement.count({
      where: { statutDirigeant: 'Approuve', statutLeader: 'EnAttente' },
    });

    // Répartition des disciples par pays (sur le même périmètre)
    const parPays = await Disciple.findAll({
      attributes: ['pays', [require('sequelize').fn('COUNT', require('sequelize').col('id_disciple')), 'total']],
      where: filtreDisciple,
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
