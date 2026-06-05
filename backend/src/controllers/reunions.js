// Contrôleur pour la gestion des réunions
const { Reunion, EgliseDeMaison, Disciple, Presence } = require('../models');

// Renvoie la liste des id d'églises visibles par l'utilisateur connecté,
// ou `null` pour « toutes » (Leader Mondial). Respecte la hiérarchie :
// Mondial → tout · Régional → sa région · National → son pays · sinon → son église.
async function eglisesEnPortee(req) {
  const role = req.user.role;
  if (role === 'LeaderMon') return null; // aucune restriction

  let where;
  if (role === 'LeaderNat') {
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['pays'] });
    where = { pays: moi?.pays || '__aucun__' };
  } else if (role === 'LeaderReg') {
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['zoneCouverture'] });
    where = { region: moi?.zoneCouverture || '__aucune__' };
  } else if (role === 'Dirigeant') {
    const eglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
    return eglise ? [eglise.idEglise] : [-1];
  } else {
    // Disciple / RespContenus : uniquement les réunions de SON église
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['idEglise'] });
    return moi?.idEglise ? [moi.idEglise] : [-1];
  }

  const eglises = await EgliseDeMaison.findAll({ where, attributes: ['idEglise'] });
  return eglises.map((e) => e.idEglise);
}

// GET /api/reunions — réunions visibles selon le rôle (cloisonnement géographique)
async function getAll(req, res) {
  try {
    const portee = await eglisesEnPortee(req);
    const where = portee === null ? {} : { idEglise: portee };

    if (req.query.type) where.typeReunion = req.query.type;
    if (req.query.statut) where.statutReunion = req.query.statut;
    // Un filtre église explicite ne peut pas élargir le périmètre autorisé
    if (req.query.eglise_id && (portee === null || portee.includes(Number(req.query.eglise_id)))) {
      where.idEglise = req.query.eglise_id;
    }

    const reunions = await Reunion.findAll({
      where,
      include: [
        { model: EgliseDeMaison, as: 'eglise', attributes: ['idEglise', 'nomEglise', 'ville'] },
        { model: Disciple, as: 'organisateur', attributes: ['idDisciple', 'nom', 'prenom'] },
      ],
      order: [['dateHeureDebut', 'DESC']],
    });
    res.json(reunions);
  } catch (err) {
    console.error('Erreur getAll reunions:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// GET /api/reunions/:id — détail d'une réunion
async function getById(req, res) {
  try {
    const reunion = await Reunion.findByPk(req.params.id, {
      include: [
        { model: EgliseDeMaison, as: 'eglise' },
        { model: Disciple, as: 'organisateur', attributes: ['idDisciple', 'nom', 'prenom'] },
        {
          model: Disciple,
          as: 'participants',
          attributes: ['idDisciple', 'nom', 'prenom'],
          through: { attributes: ['present'] },
        },
      ],
    });
    if (!reunion) return res.status(404).json({ message: 'Réunion introuvable' });

    // Cloisonnement : on n'autorise la consultation que dans son périmètre
    const portee = await eglisesEnPortee(req);
    if (portee !== null && !portee.includes(reunion.idEglise)) {
      return res.status(403).json({ message: 'Cette réunion n\'est pas dans votre périmètre' });
    }

    res.json(reunion);
  } catch (err) {
    console.error('Erreur getById reunion:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// POST /api/reunions — créer une réunion (Dirigeant uniquement, vu en route)
// Le dirigeant doit organiser une réunion DANS son église
async function create(req, res) {
  try {
    const { typeReunion, dateHeureDebut, dateHeureFin, idEglise } = req.body;
    if (!typeReunion || !dateHeureDebut || !idEglise) {
      return res.status(400).json({ message: 'Type, date de début et église sont requis' });
    }

    // Vérifier que le dirigeant connecté dirige bien cette église
    const monEglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
    if (!monEglise || monEglise.idEglise !== Number(idEglise)) {
      return res.status(403).json({ message: 'Vous ne pouvez organiser une réunion que dans votre église' });
    }

    const reunion = await Reunion.create({
      typeReunion,
      dateHeureDebut,
      dateHeureFin,
      idEglise,
      idOrganisateur: req.user.id,
      statutReunion: 'Planifiee',
    });
    res.status(201).json(reunion);
  } catch (err) {
    console.error('Erreur create reunion:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/reunions/:id — modifier une réunion (seul l'organisateur)
async function update(req, res) {
  try {
    const reunion = await Reunion.findByPk(req.params.id);
    if (!reunion) return res.status(404).json({ message: 'Réunion introuvable' });

    if (reunion.idOrganisateur !== req.user.id) {
      return res.status(403).json({ message: 'Seul l\'organisateur peut modifier cette réunion' });
    }

    const { typeReunion, dateHeureDebut, dateHeureFin, statutReunion } = req.body;
    await reunion.update({ typeReunion, dateHeureDebut, dateHeureFin, statutReunion });
    res.json(reunion);
  } catch (err) {
    console.error('Erreur update reunion:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// POST /api/reunions/:id/presences — enregistrer les présences
// Seul le dirigeant organisateur de la réunion peut faire l'appel
async function enregistrerPresences(req, res) {
  try {
    const reunion = await Reunion.findByPk(req.params.id);
    if (!reunion) return res.status(404).json({ message: 'Réunion introuvable' });

    if (reunion.idOrganisateur !== req.user.id) {
      return res.status(403).json({ message: 'Seul l\'organisateur peut enregistrer les présences' });
    }

    const { presences } = req.body;
    if (!Array.isArray(presences)) {
      return res.status(400).json({ message: 'Format invalide : presences doit être un tableau' });
    }

    // On supprime les anciennes présences puis on recrée
    await Presence.destroy({ where: { idReunion: req.params.id } });
    const records = presences.map((p) => ({
      idReunion: req.params.id,
      idDisciple: p.idDisciple,
      present: p.present === true,
    }));
    await Presence.bulkCreate(records);

    res.json({ message: 'Présences enregistrées avec succès' });
  } catch (err) {
    console.error('Erreur enregistrerPresences:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { getAll, getById, create, update, enregistrerPresences };
