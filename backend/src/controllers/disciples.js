// Contrôleur pour la gestion des disciples
const bcrypt = require('bcryptjs');
const { Disciple, EgliseDeMaison, RoutineSpirituelle, ValidationAvancement } = require('../models');

const LEADERS = ['LeaderNat', 'LeaderReg', 'LeaderMon'];
const LIBELLE_ROLE = { LeaderMon: 'Leader Mondial', LeaderNat: 'Leader National', LeaderReg: 'Leader Régional' };

// Cherche le leader déjà en place pour le périmètre que viserait `disciple`.
// Unicité : 1 LeaderMon (monde), 1 LeaderNat par pays, 1 LeaderReg par région.
async function leaderEnPlace(role, disciple) {
  if (role === 'LeaderMon') return Disciple.findOne({ where: { role: 'LeaderMon' } });
  if (role === 'LeaderNat') return Disciple.findOne({ where: { role: 'LeaderNat', pays: disciple.pays } });
  if (role === 'LeaderReg') return Disciple.findOne({ where: { role: 'LeaderReg', region: disciple.region } });
  return null;
}

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
  // Un LeaderReg voit les disciples de sa région (sa zone de couverture).
  // On compare la zone du leader à la région d'appartenance des disciples.
  if (role === 'LeaderReg') {
    const moi = await Disciple.findByPk(req.user.id, { attributes: ['zoneCouverture'] });
    where.region = moi?.zoneCouverture || '__aucune__'; // valeur impossible si zone non définie
    return where;
  }
  // LeaderMon et RespContenus voient tous les disciples
  return where;
}

// POST /api/disciples — un Dirigeant inscrit un nouveau membre dans SON église.
// Le rôle ('Disciple') et l'église sont imposés par le serveur : le dirigeant
// ne saisit que nom, prénom, téléphone et un mot de passe temporaire.
async function create(req, res) {
  try {
    const { nom, prenom, telephone, motDePasse } = req.body;
    if (!nom || !prenom || !telephone || !motDePasse) {
      return res.status(400).json({ message: 'Nom, prénom, téléphone et mot de passe sont requis' });
    }

    // Le disciple est rattaché à l'église dirigée par l'utilisateur connecté
    const monEglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
    if (!monEglise) {
      return res.status(400).json({ message: 'Vous ne dirigez aucune église de maison' });
    }

    // Le téléphone sert d'identifiant de connexion : il doit être unique
    const existe = await Disciple.findOne({ where: { telephone } });
    if (existe) {
      return res.status(409).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
    }

    const hash = await bcrypt.hash(motDePasse, 10);
    const disciple = await Disciple.create({
      nom, prenom, telephone,
      motDePasse: hash,
      idEglise: monEglise.idEglise, // rattachement automatique à l'église du dirigeant
      // Cohérence géographique : un membre hérite TOUJOURS du pays et de la
      // région de son église. Impossible d'avoir un disciple « Belgique » dans
      // une église de Paris (France).
      pays: monEglise.pays,
      region: monEglise.region,
      role: 'Disciple',             // rôle imposé : pas de choix possible
      statut: 'Actif',
    });

    res.status(201).json({ idDisciple: disciple.idDisciple, message: 'Disciple inscrit avec succès' });
  } catch (err) {
    console.error('Erreur create disciple:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
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

    // Un dirigeant ne consulte (donc ne voit les routines incluses) que les disciples
    // de SON église. Cela cloisonne la consultation des routines par église.
    if (req.user.role === 'Dirigeant') {
      const monEglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
      if (!monEglise || disciple.idEglise !== monEglise.idEglise) {
        return res.status(403).json({ message: 'Ce disciple n\'appartient pas à votre église' });
      }
    }

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

    // Un dirigeant ne peut modifier que les disciples de SA propre église
    if (req.user.role === 'Dirigeant') {
      const monEglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
      if (!monEglise || disciple.idEglise !== monEglise.idEglise) {
        return res.status(403).json({ message: 'Vous ne pouvez modifier que les disciples de votre église' });
      }
    }

    const { nom, prenom, telephone, niveauFormation, statut, idEglise } = req.body;
    const payload = { nom, prenom, telephone, niveauFormation, statut, idEglise };

    // Cohérence géographique : si on rattache le disciple à une (autre) église,
    // son pays et sa région suivent automatiquement ceux de l'église.
    if (idEglise) {
      const nouvelleEglise = await EgliseDeMaison.findByPk(idEglise);
      if (nouvelleEglise) {
        payload.pays = nouvelleEglise.pays;
        payload.region = nouvelleEglise.region;
      }
    }

    // Changement de rôle : SEUL le Leader Mondial attribue/retire les titres.
    if (req.body.role !== undefined && req.body.role !== disciple.role) {
      if (req.user.role !== 'LeaderMon') {
        return res.status(403).json({ message: 'Seul le Leader Mondial peut changer le rôle d\'un disciple' });
      }
      const nouveauRole = req.body.role;

      if (LEADERS.includes(nouveauRole)) {
        // Un leader est toujours rattaché à une église locale
        if (!disciple.idEglise) {
          return res.status(400).json({ message: 'Ce disciple doit appartenir à une église avant de devenir leader' });
        }
        // Unicité du périmètre : on prévient si le poste est déjà occupé
        const existant = await leaderEnPlace(nouveauRole, disciple);
        if (existant && existant.idDisciple !== disciple.idDisciple) {
          if (!req.body.remplacer) {
            return res.status(409).json({
              besoinConfirmation: true,
              message: `${LIBELLE_ROLE[nouveauRole]} déjà occupé par ${existant.prenom} ${existant.nom}. Confirmez pour le remplacer.`,
              leaderExistant: { idDisciple: existant.idDisciple, nom: existant.nom, prenom: existant.prenom },
            });
          }
          // Remplacement confirmé : l'ancien redevient simple Disciple (garde son église)
          await existant.update({ role: 'Disciple', zoneCouverture: null });
        }
        payload.role = nouveauRole;
        // La zone de couverture découle du périmètre du disciple
        payload.zoneCouverture = nouveauRole === 'LeaderMon' ? 'Monde'
          : nouveauRole === 'LeaderReg' ? disciple.region : disciple.pays;
      } else {
        // Rôle non-leader : on efface la zone de couverture
        payload.role = nouveauRole;
        payload.zoneCouverture = null;
      }
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

module.exports = { create, getAll, getById, update, remove };
