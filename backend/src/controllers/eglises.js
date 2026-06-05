// Contrôleur pour la gestion des églises de maison
const bcrypt = require('bcryptjs');
const { EgliseDeMaison, Disciple, Reunion } = require('../models');
const { nomPaysFr, sousRegionDuPays } = require('../config/geographie');

// Désigne le dirigeant d'une église : soit un disciple existant, soit un
// nouveau compte créé à la volée. Renvoie { dirigeant } ou { erreur }.
// pays/region sont ceux de l'église pour garder la cohérence géographique.
async function resoudreDirigeant({ idDirigeant, nouveauDirigeant }, pays, region) {
  if (idDirigeant) {
    const cible = await Disciple.findByPk(idDirigeant);
    if (!cible) return { erreur: 'Disciple à nommer dirigeant introuvable' };
    // Règle métier : un dirigeant ne dirige qu'UNE seule église
    const dejaDirigee = await EgliseDeMaison.findOne({ where: { idDirigeant } });
    if (dejaDirigee) return { erreur: 'Ce disciple dirige déjà une église' };
    return { dirigeant: cible };
  }
  if (nouveauDirigeant) {
    const { nom, prenom, telephone, motDePasse } = nouveauDirigeant;
    if (!nom || !prenom || !telephone || !motDePasse) {
      return { erreur: 'Nom, prénom, téléphone et mot de passe du dirigeant sont requis' };
    }
    if (await Disciple.findOne({ where: { telephone } })) {
      return { erreur: 'Ce numéro de téléphone est déjà utilisé' };
    }
    const dirigeant = await Disciple.create({
      nom, prenom, telephone, motDePasse: await bcrypt.hash(motDePasse, 10),
      role: 'Dirigeant', statut: 'Actif', pays, region,
    });
    return { dirigeant };
  }
  return { erreur: 'Un dirigeant (existant ou nouveau) est requis' };
}

// GET /api/eglises — liste des églises, filtrée selon le rôle de l'utilisateur
async function getAll(req, res) {
  try {
    const where = {};
    if (req.query.pays) where.pays = req.query.pays;
    if (req.query.ville) where.ville = req.query.ville;
    if (req.query.statut) where.statutEglise = req.query.statut;

    // Cloisonnement par rôle
    const role = req.user.role;
    if (role === 'Dirigeant') {
      // Un dirigeant ne voit QUE l'église qu'il dirige
      where.idDirigeant = req.user.id;
    } else if (role === 'LeaderNat') {
      // Un leader national ne voit que les églises de son pays
      const moi = await Disciple.findByPk(req.user.id, { attributes: ['pays'] });
      if (moi?.pays) where.pays = moi.pays;
    } else if (role === 'LeaderReg') {
      // Un leader régional ne voit que les églises de sa région (zone de couverture)
      const moi = await Disciple.findByPk(req.user.id, { attributes: ['zoneCouverture'] });
      where.region = moi?.zoneCouverture || '__aucune__';
    }
    // LeaderMon / RespContenus / Disciple : pas de filtre supplémentaire (vue globale).

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

// POST /api/eglises — créer une église (LeaderMon uniquement, vu en route).
// Le pays est choisi par son code ISO ; la sous-région est DÉDUITE côté serveur.
// Le dirigeant est désigné (existant) ou créé à la volée, puis rattaché à l'église.
async function create(req, res) {
  try {
    const { nomEglise, ville, paysCode, capaciteMax } = req.body;
    if (!nomEglise) return res.status(400).json({ message: 'Le nom de l\'église est requis' });

    const pays = nomPaysFr(paysCode);
    const region = sousRegionDuPays(paysCode);
    if (!pays || !region) return res.status(400).json({ message: 'Pays invalide' });

    // On résout le dirigeant AVANT de créer l'église (clé étrangère idDirigeant)
    const { dirigeant, erreur } = await resoudreDirigeant(req.body, pays, region);
    if (erreur) return res.status(400).json({ message: erreur });

    const eglise = await EgliseDeMaison.create({
      nomEglise, ville, pays, region, capaciteMax,
      statutEglise: 'Active', idDirigeant: dirigeant.idDisciple,
    });

    // Le dirigeant devient membre de SON église (role + rattachement + géo)
    await dirigeant.update({ role: 'Dirigeant', idEglise: eglise.idEglise, pays, region });

    res.status(201).json(eglise);
  } catch (err) {
    console.error('Erreur create eglise:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/eglises/:id — modifier une église (LeaderMon uniquement)
async function update(req, res) {
  try {
    const eglise = await EgliseDeMaison.findByPk(req.params.id);
    if (!eglise) return res.status(404).json({ message: 'Église introuvable' });

    const { nomEglise, ville, paysCode, capaciteMax, statutEglise } = req.body;
    const payload = { nomEglise, ville, capaciteMax, statutEglise };

    // Si on change le pays, la sous-région suit automatiquement
    if (paysCode) {
      payload.pays = nomPaysFr(paysCode);
      payload.region = sousRegionDuPays(paysCode);
      if (!payload.pays) return res.status(400).json({ message: 'Pays invalide' });
    }

    await eglise.update(payload);
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
