// Contrôleur pour la gestion des églises de maison
const { EgliseDeMaison, Disciple, Reunion } = require('../models');

// Vérifie qu'un disciple peut être dirigeant (rôle = Dirigeant)
async function verifierDirigeant(idDirigeant) {
  if (!idDirigeant) return { ok: true };
  const cible = await Disciple.findByPk(idDirigeant);
  if (!cible) return { ok: false, message: 'Disciple à assigner introuvable' };
  if (cible.role !== 'Dirigeant') {
    return { ok: false, message: 'Le disciple assigné doit avoir le rôle Dirigeant' };
  }
  return { ok: true };
}

// GET /api/eglises — liste de toutes les églises
async function getAll(req, res) {
  try {
    const where = {};
    if (req.query.pays) where.pays = req.query.pays;
    if (req.query.ville) where.ville = req.query.ville;
    if (req.query.statut) where.statutEglise = req.query.statut;

    const eglises = await EgliseDeMaison.findAll({
      where,
      include: [
        { model: Disciple, as: 'dirigeant', attributes: ['idDisciple', 'nom', 'prenom', 'telephone'] },
      ],
      order: [['nomEglise', 'ASC']],
    });
    res.json(eglises);
  } catch (err) {
    console.error('Erreur getAll eglises:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// GET /api/eglises/:id — détail d'une église
async function getById(req, res) {
  try {
    const eglise = await EgliseDeMaison.findByPk(req.params.id, {
      include: [
        { model: Disciple, as: 'dirigeant', attributes: ['idDisciple', 'nom', 'prenom', 'telephone', 'role'] },
        { model: Disciple, as: 'membres', attributes: ['idDisciple', 'nom', 'prenom', 'telephone', 'role', 'niveauFormation'] },
        { model: Reunion, as: 'reunions', separate: true, limit: 10, order: [['dateHeureDebut', 'DESC']] },
      ],
    });
    if (!eglise) return res.status(404).json({ message: 'Église introuvable' });
    res.json(eglise);
  } catch (err) {
    console.error('Erreur getById eglise:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// POST /api/eglises — créer une église (Leader uniquement, vu en route)
async function create(req, res) {
  try {
    const { nomEglise, ville, pays, capaciteMax, idDirigeant } = req.body;
    if (!nomEglise) return res.status(400).json({ message: 'Le nom de l\'église est requis' });

    // Le dirigeant assigné doit exister et avoir role = 'Dirigeant'
    const verif = await verifierDirigeant(idDirigeant);
    if (!verif.ok) return res.status(400).json({ message: verif.message });

    const eglise = await EgliseDeMaison.create({
      nomEglise, ville, pays, capaciteMax, idDirigeant,
      statutEglise: 'Active',
    });
    res.status(201).json(eglise);
  } catch (err) {
    console.error('Erreur create eglise:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/eglises/:id — modifier une église (Leader uniquement)
async function update(req, res) {
  try {
    const eglise = await EgliseDeMaison.findByPk(req.params.id);
    if (!eglise) return res.status(404).json({ message: 'Église introuvable' });

    const { nomEglise, ville, pays, capaciteMax, statutEglise, idDirigeant } = req.body;

    if (idDirigeant !== undefined) {
      const verif = await verifierDirigeant(idDirigeant);
      if (!verif.ok) return res.status(400).json({ message: verif.message });
    }

    await eglise.update({ nomEglise, ville, pays, capaciteMax, statutEglise, idDirigeant });
    res.json(eglise);
  } catch (err) {
    console.error('Erreur update eglise:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// DELETE /api/eglises/:id (Leader uniquement)
async function remove(req, res) {
  try {
    const eglise = await EgliseDeMaison.findByPk(req.params.id);
    if (!eglise) return res.status(404).json({ message: 'Église introuvable' });
    await eglise.destroy();
    res.json({ message: 'Église supprimée avec succès' });
  } catch (err) {
    console.error('Erreur remove eglise:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { getAll, getById, create, update, remove };
