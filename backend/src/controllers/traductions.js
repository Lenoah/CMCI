// Contrôleur pour les traductions de contenus spirituels
const { Traduction, ContenuSpirituel } = require('../models');

// POST /api/traductions — créer une traduction
async function create(req, res) {
  try {
    const { idContenu, langueCible, titreTraduit, fichierUrl } = req.body;
    if (!idContenu || !langueCible) {
      return res.status(400).json({ message: 'Contenu source et langue cible sont requis' });
    }

    // Vérifier que le contenu source existe
    const contenu = await ContenuSpirituel.findByPk(idContenu);
    if (!contenu) return res.status(404).json({ message: 'Contenu source introuvable' });

    const traduction = await Traduction.create({
      idContenu,
      langueCible,
      titreTraduit,
      fichierUrl,
      idTraducteur: req.user.id, // le traducteur = disciple connecté
    });
    res.status(201).json(traduction);
  } catch (err) {
    console.error('Erreur create traduction:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

// PUT /api/traductions/:id — modifier une traduction
async function update(req, res) {
  try {
    const traduction = await Traduction.findByPk(req.params.id);
    if (!traduction) return res.status(404).json({ message: 'Traduction introuvable' });

    const { langueCible, titreTraduit, fichierUrl } = req.body;
    await traduction.update({ langueCible, titreTraduit, fichierUrl });
    res.json(traduction);
  } catch (err) {
    console.error('Erreur update traduction:', err);
    res.status(500).json({ message: 'Erreur interne' });
  }
}

module.exports = { create, update };
