// Routes pour les réunions
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { getAll, getById, create, update, enregistrerPresences } = require('../controllers/reunions');

// Lecture : tout utilisateur connecté
router.get('/', auth, getAll);
router.get('/:id', auth, getById);

// Création / modification / appel des présences : Dirigeant uniquement
// (l'organisateur d'une réunion doit être Dirigeant)
router.post('/', auth, requireRole('Dirigeant'), create);
router.put('/:id', auth, requireRole('Dirigeant'), update);
router.post('/:id/presences', auth, requireRole('Dirigeant'), enregistrerPresences);

module.exports = router;
