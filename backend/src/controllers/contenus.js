// Contrôleur pour les contenus spirituels (messages des 3B)
const {
  ContenuSpirituel,
  Disciple,
  Traduction,
  Consultation,
} = require("../models");

// GET /api/contenus — liste de tous les contenus
async function getAll(req, res) {
  try {
    const contenus = await ContenuSpirituel.findAll({
      include: [
        {
          model: Disciple,
          as: "publieur",
          attributes: ["idDisciple", "nom", "prenom"],
        },
      ],
      order: [["datePublication", "DESC"]],
    });
    res.json(contenus);
  } catch (err) {
    console.error("Erreur getAll contenus:", err);
    res.status(500).json({ message: "Erreur interne" });
  }
}

// GET /api/contenus/:id — détail d'un contenu avec ses traductions
async function getById(req, res) {
  try {
    const contenu = await ContenuSpirituel.findByPk(req.params.id, {
      include: [
        {
          model: Disciple,
          as: "publieur",
          attributes: ["idDisciple", "nom", "prenom"],
        },
        {
          model: Traduction,
          as: "traductions",
          include: [
            {
              model: Disciple,
              as: "traducteur",
              attributes: ["idDisciple", "nom", "prenom"],
            },
          ],
        },
      ],
    });
    if (!contenu)
      return res.status(404).json({ message: "Contenu introuvable" });
    res.json(contenu);
  } catch (err) {
    console.error("Erreur getById contenu:", err);
    res.status(500).json({ message: "Erreur interne" });
  }
}

// POST /api/contenus — créer un contenu (le publieur = disciple connecté)
async function create(req, res) {
  try {
    const { titreContenu, langueOriginale, datePublication, fichierUrl } =
      req.body;
    if (!titreContenu || !langueOriginale) {
      return res
        .status(400)
        .json({ message: "Titre et langue originale sont requis" });
    }
    const contenu = await ContenuSpirituel.create({
      titreContenu,
      langueOriginale,
      datePublication: datePublication || new Date(),
      fichierUrl,
      idPublieur: req.user.id,
    });
    res.status(201).json(contenu);
  } catch (err) {
    console.error("Erreur create contenu:", err);
    res.status(500).json({ message: "Erreur interne" });
  }
}

// PUT /api/contenus/:id — modifier un contenu
async function update(req, res) {
  try {
    const contenu = await ContenuSpirituel.findByPk(req.params.id);
    if (!contenu)
      return res.status(404).json({ message: "Contenu introuvable" });

    const { titreContenu, langueOriginale, datePublication, fichierUrl } =
      req.body;
    await contenu.update({
      titreContenu,
      langueOriginale,
      datePublication,
      fichierUrl,
    });
    res.json(contenu);
  } catch (err) {
    console.error("Erreur update contenu:", err);
    res.status(500).json({ message: "Erreur interne" });
  }
}

// POST /api/contenus/:id/consulter — marquer ce contenu comme consulté
async function consulter(req, res) {
  try {
    const contenu = await ContenuSpirituel.findByPk(req.params.id);
    if (!contenu)
      return res.status(404).json({ message: "Contenu introuvable" });

    // Vérifier si déjà consulté
    const existe = await Consultation.findOne({
      where: { idDisciple: req.user.id, idContenu: req.params.id },
    });
    if (existe) {
      return res.json({ message: "Déjà consulté", consultation: existe });
    }

    const consultation = await Consultation.create({
      idDisciple: req.user.id,
      idContenu: req.params.id,
      dateLecture: new Date(),
    });
    res.status(201).json(consultation);
  } catch (err) {
    console.error("Erreur consulter contenu:", err);
    res.status(500).json({ message: "Erreur interne" });
  }
}

// DELETE /api/contenus/:id — supprimer un contenu (RespContenus uniquement, vu en route)
async function remove(req, res) {
  try {
    const contenu = await ContenuSpirituel.findByPk(req.params.id);
    if (!contenu)
      return res.status(404).json({ message: "Contenu introuvable" });
    await contenu.destroy();
    res.json({ message: "Contenu supprimé avec succès" });
  } catch (err) {
    console.error("Erreur remove contenu:", err);
    res.status(500).json({ message: "Erreur interne" });
  }
}

module.exports = { getAll, getById, create, update, consulter, remove };
