// Contrôleur pour la gestion des disciples
const { Disciple, EgliseDeMaison, RoutineSpirituelle, ValidationAvancement } = require('../models');

const LEADERS = ['LeaderNat', 'LeaderReg', 'LeaderMon'];

// Construit un filtre `where` qui scope la visibilité au rôle connecté
async function whereSelonRole(req) {
  const role = req.user.role;
  const where = {};

  if (req.query.eglise_id) where.idEglise = req.query.eglise_id;
  if (req.query.role) where.role = req.query.role;
  if (req.query.pays) where.pays = req.query.pays;

  // Un disciple simple ne voit que son propre profil
  if (role === 'Disciple') {
    where.idDisciple = req.user.id;
    return where;
  }
  // Un dirigeant ne voit que les membres de SON église
  if (role === 'Dirigeant') {
    const monEglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
    where.idEglise = monEglise ? monEglise.idEglise : -1; // -1 = aucune correspondance si pas d'église
    return where;
  }
  // Un LeaderNat voit les disciples de son pays
  if (role === 'LeaderNat') {
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['pays'] });
    if (moi?.pays) where.pays = moi.pays;
    return where;
  }
  // Un LeaderReg voit les disciples de sa zone
  if (role === 'LeaderReg') {
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['zoneCouverture'] });
    if (moi?.zoneCouverture) where.zoneCouverture = moi.zoneCouverture;
    return where;
  }
  // LeaderMon et RespContenus voient tous les disciples
  return where;
}

// GET /api/disciples — liste filtrée selon le rôle
async function getAll(req, res) {
  try {
    const where = await whereSelonRole(req);
    const disciples = await Disciple.findAll({
      where,
      attributes: { exclude: ['motDePasse'] },
      include: [
        { model: EgliseDeMaison, as: 'eglise', attributes: ['idEglise', 'nomEglise', 'ville', 'pays'] },
      ],
      order: [['nom', 'ASC']],
    });
    res.json(disciples);
  } catch (err) {
    console.error('Erreur getAll disciples:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// GET /api/disciples/:id — détail d'un disciple (un Disciple ne voit que lui-même)
async function getById(req, res) {
  try {
    const idDemande = Number(req.params.id);
    if (req.user.role === 'Disciple' && idDemande !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez consulter que votre propre profil' });
    }

    const disciple = await Disciple.findByPk(idDemande, {
      attributes: { exclude: ['motDePasse'] },
      include: [
        { model: EgliseDeMaison, as: 'eglise' },
        { model: RoutineSpirituelle, as: 'routines', separate: true, order: [['dateRoutine', 'DESC']], limit: 20 },
        { model: ValidationAvancement, as: 'demandesAvancement', separate: true, limit: 10 },
      ],
    });
    if (!disciple) return res.status(404).json({ message: 'Disciple introuvable' });
    res.json(disciple);
  } catch (err) {
    console.error('Erreur getById disciple:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/disciples/:id — modifier un disciple
// Seul un Leader peut changer le rôle ; un disciple ne peut pas modifier son propre rôle
async function update(req, res) {
  try {
    const disciple = await Disciple.findByPk(req.params.id);
    if (!disciple) return res.status(404).json({ message: 'Disciple introuvable' });

    const estLeader = LEADERS.includes(req.user.role);
    const { nom, prenom, telephone, pays, zoneCouverture, niveauFormation, statut, idEglise } = req.body;
    const payload = { nom, prenom, telephone, pays, zoneCouverture, niveauFormation, statut, idEglise };

    // Si on tente de changer le rôle, seul un Leader peut le faire
    if (req.body.role !== undefined && req.body.role !== disciple.role) {
      if (!estLeader) {
        return res.status(403).json({ message: 'Seul un Leader peut changer le rôle d\'un disciple' });
      }
      payload.role = req.body.role;
    }

    await disciple.update(payload);

    const updated = await Disciple.findByPk(req.params.id, {
      attributes: { exclude: ['motDePasse'] },
    });
    res.json(updated);
  } catch (err) {
    console.error('Erreur update disciple:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// DELETE /api/disciples/:id — supprimer un disciple (Leader uniquement, vu en route)
async function remove(req, res) {
  try {
    const disciple = await Disciple.findByPk(req.params.id);
    if (!disciple) return res.status(404).json({ message: 'Disciple introuvable' });
    await disciple.destroy();
    res.json({ message: 'Disciple supprimé avec succès' });
  } catch (err) {
    console.error('Erreur remove disciple:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { getAll, getById, update, remove };
