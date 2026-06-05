// Contrôleur pour les routines spirituelles.
// Un disciple gère SES routines ; un responsable (dirigeant/leader) VOIT celles
// des disciples placés sous sa responsabilité (mais ne les modifie pas).
const { RoutineSpirituelle, Disciple, EgliseDeMaison } = require('../models');

// Types de routine autorisés (doivent correspondre à l'ENUM du modèle)
const TYPES_ROUTINE = ['Lecture', 'Meditation', 'PriereSeule', 'PriereCollective', 'Jeune'];

// Renvoie la liste des id de disciples visibles par l'utilisateur connecté,
// ou `null` pour « tous » (Leader Mondial). Respecte la hiérarchie :
// Mondial → tout · Régional → sa région · National → son pays · Dirigeant → son église.
async function idsDisciplesEnPortee(req) {
  const role = req.user.role;
  if (role === 'LeaderMon') return null; // aucune restriction

  let where;
  if (role === 'Dirigeant') {
    const eglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
    where = { idEglise: eglise ? eglise.idEglise : -1 };
  } else if (role === 'LeaderNat') {
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['pays'] });
    where = { pays: moi?.pays || '__aucun__' };
  } else if (role === 'LeaderReg') {
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['zoneCouverture'] });
    where = { region: moi?.zoneCouverture || '__aucune__' };
  } else {
    return [req.user.id]; // Disciple / RespContenus : uniquement les siennes
  }

  const disciples = await Disciple.findAll({ where, attributes: ['idDisciple'] });
  return disciples.map((d) => d.idDisciple);
}

// GET /api/routines — MES routines (toujours celles du compte connecté).
// Vaut pour tout le monde : un leader est aussi un disciple qui enregistre les siennes.
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

// GET /api/routines/suivi — routines des disciples placés sous ma responsabilité
// (supervision, lecture seule). Périmètre selon le rôle (église/pays/région/monde).
async function suivi(req, res) {
  try {
    const ids = await idsDisciplesEnPortee(req);
    const where = ids === null ? {} : { idDisciple: ids };

    const routines = await RoutineSpirituelle.findAll({
      where,
      include: [{ model: Disciple, as: 'disciple', attributes: ['idDisciple', 'nom', 'prenom'] }],
      order: [['dateRoutine', 'DESC']],
    });
    res.json(routines);
  } catch (err) {
    console.error('Erreur suivi routines:', err);
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
    // On valide le type AVANT d'écrire en base, pour renvoyer un 400 clair (et non une erreur SQL 500)
    if (!TYPES_ROUTINE.includes(typeRoutine)) {
      return res.status(400).json({ message: `Type de routine invalide. Valeurs autorisées : ${TYPES_ROUTINE.join(', ')}` });
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

module.exports = { getAll, suivi, create, update, remove };
