// Contrôleur pour les routines spirituelles
// Chaque disciple gère ses propres routines
const { RoutineSpirituelle } = require('../models');

// GET /api/routines — liste des routines du disciple connecté
async function getAll(req, res) {
  try {
    const routines = await RoutineSpirituelle.findAll({
      where: { idDisciple: req.user.id },
      order: [['dateRoutine', 'DESC']],
    });
    res.json(routines);
  } catch (err) {
    console.error('Erreur getAll routines:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// POST /api/routines — créer une routine
async function create(req, res) {
  try {
    const { typeRoutine, dateRoutine, dureeMinutes, notes } = req.body;
    if (!typeRoutine || !dateRoutine) {
      return res.status(400).json({ message: 'Type et date de routine sont requis' });
    }

    const routine = await RoutineSpirituelle.create({
      typeRoutine,
      dateRoutine,
      dureeMinutes,
      notes,
      idDisciple: req.user.id, // attribué automatiquement au disciple connecté
    });
    res.status(201).json(routine);
  } catch (err) {
    console.error('Erreur create routine:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/routines/:id — modifier une routine (uniquement la sienne)
async function update(req, res) {
  try {
    const routine = await RoutineSpirituelle.findOne({
      where: { idRoutine: req.params.id, idDisciple: req.user.id },
    });
    if (!routine) return res.status(404).json({ message: 'Routine introuvable' });

    const { typeRoutine, dateRoutine, dureeMinutes, notes } = req.body;
    await routine.update({ typeRoutine, dateRoutine, dureeMinutes, notes });
    res.json(routine);
  } catch (err) {
    console.error('Erreur update routine:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// DELETE /api/routines/:id — supprimer une routine (uniquement la sienne)
async function remove(req, res) {
  try {
    const routine = await RoutineSpirituelle.findOne({
      where: { idRoutine: req.params.id, idDisciple: req.user.id },
    });
    if (!routine) return res.status(404).json({ message: 'Routine introuvable' });
    await routine.destroy();
    res.json({ message: 'Routine supprimée avec succès' });
  } catch (err) {
    console.error('Erreur remove routine:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { getAll, create, update, remove };
