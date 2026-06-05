// Contrôleur pour les validations d'avancement des disciples
const { ValidationAvancement, Disciple, EgliseDeMaison } = require('../models');

const LEADERS = ['LeaderNat', 'LeaderReg', 'LeaderMon'];

// GET /api/validations — liste filtrée selon le rôle de l'utilisateur connecté
async function getAll(req, res) {
  try {
    const where = {};
    const role = req.user.role;

    // Filtre sur le disciple concerné (sert au cloisonnement géographique des leaders)
    const inclureDisciple = {
      model: Disciple, as: 'disciple',
      attributes: ['idDisciple', 'nom', 'prenom', 'niveauFormation', 'pays', 'zoneCouverture'],
    };

    if (role === 'Disciple') {
      where.idDisciple = req.user.id; // ses propres demandes
    } else if (role === 'Dirigeant') {
      where.idEvaluateur = req.user.id; // les demandes qu'il doit évaluer
    } else if (LEADERS.includes(role)) {
      // Demandes déjà approuvées par le dirigeant et en attente de validation finale
      where.statutDirigeant = 'Approuve';
      where.statutLeader = 'EnAttente';

      // Cloisonnement géographique : un leader ne voit que les demandes de SA zone
      const moi = await Disciple.findByPk(req.user.id, { attributes: ['pays', 'zoneCouverture'] });
      if (role === 'LeaderNat' && moi?.pays) {
        inclureDisciple.required = true;           // INNER JOIN : exclut les autres pays
        inclureDisciple.where = { pays: moi.pays };
      } else if (role === 'LeaderReg' && moi?.zoneCouverture) {
        inclureDisciple.required = true;
        inclureDisciple.where = { zoneCouverture: moi.zoneCouverture };
      }
      // LeaderMon : vue mondiale, aucun filtre géographique
    }

    const validations = await ValidationAvancement.findAll({
      where,
      include: [
        inclureDisciple,
        { model: Disciple, as: 'evaluateur', attributes: ['idDisciple', 'nom', 'prenom'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(validations);
  } catch (err) {
    console.error('Erreur getAll validations:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// POST /api/validations — créer une demande (Dirigeant uniquement, vu en route)
// Vérifie que le disciple visé appartient bien à l'église du Dirigeant
async function create(req, res) {
  try {
    const { idDisciple, niveauDemande } = req.body;
    if (!idDisciple || !niveauDemande) {
      return res.status(400).json({ message: 'Disciple et niveau demandé sont requis' });
    }

    const monEglise = await EgliseDeMaison.findOne({ where: { idDirigeant: req.user.id } });
    if (!monEglise) {
      return res.status(403).json({ message: 'Vous ne dirigez aucune église' });
    }

    const cible = await Disciple.findByPk(idDisciple);
    if (!cible || cible.idEglise !== monEglise.idEglise) {
      return res.status(403).json({ message: 'Ce disciple n\'appartient pas à votre église' });
    }

    // NOTE : le modèle ValidationAvancement n'a pas de champ "demandeur_id" distinct.
    // C'est idEvaluateur qui porte l'identité du dirigeant qui INITIE et évalue la demande
    // (idLeader sera renseigné plus tard, lors de la validation finale par le leader).
    const validation = await ValidationAvancement.create({
      idDisciple,
      niveauDemande,
      idEvaluateur: req.user.id,
      statutDirigeant: 'EnAttente',
      statutLeader: 'EnAttente',
      statutFinal: 'EnAttente',
    });
    res.status(201).json(validation);
  } catch (err) {
    console.error('Erreur create validation:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/validations/:id/evaluer — Dirigeant uniquement, et doit être l'évaluateur désigné
async function evaluer(req, res) {
  try {
    const validation = await ValidationAvancement.findByPk(req.params.id);
    if (!validation) return res.status(404).json({ message: 'Validation introuvable' });

    if (validation.idEvaluateur !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas l\'évaluateur de cette demande' });
    }

    const { decision } = req.body; // 'Approuve' ou 'Rejete'
    if (!['Approuve', 'Rejete'].includes(decision)) {
      return res.status(400).json({ message: 'Décision invalide. Valeurs: Approuve ou Rejete' });
    }

    await validation.update({ statutDirigeant: decision });
    res.json(validation);
  } catch (err) {
    console.error('Erreur evaluer validation:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/validations/:id/valider — Leader uniquement (vu en route)
async function valider(req, res) {
  try {
    const validation = await ValidationAvancement.findByPk(req.params.id);
    if (!validation) return res.status(404).json({ message: 'Validation introuvable' });

    if (validation.statutDirigeant !== 'Approuve') {
      return res.status(400).json({ message: 'La validation du dirigeant est requise d\'abord' });
    }

    const { decision } = req.body;
    if (!['Approuve', 'Rejete'].includes(decision)) {
      return res.status(400).json({ message: 'Décision invalide. Valeurs: Approuve ou Rejete' });
    }

    await validation.update({
      statutLeader: decision,
      statutFinal: decision,
      idLeader: req.user.id,
    });

    // Si approuvé, on monte le niveau du disciple
    if (decision === 'Approuve') {
      await Disciple.update(
        { niveauFormation: validation.niveauDemande },
        { where: { idDisciple: validation.idDisciple } }
      );
    }

    res.json(validation);
  } catch (err) {
    console.error('Erreur valider validation:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { getAll, create, evaluer, valider };
