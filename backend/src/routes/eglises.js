// Routes pour les églises de maison
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { getAll, getById, create, update, remove } = require('../controllers/eglises');

// Lecture : tout utilisateur connecté
router.get('/', auth, getAll);
router.get('/:id', auth, getById);

// Création / modification / suppression : LeaderMon uniquement.
// (C'est lui qui crée les églises et nomme leurs dirigeants.)
router.post('/', auth, requireRole('LeaderMon'), create);
router.put('/:id', auth, requireRole('LeaderMon'), update);
router.delete('/:id', auth, requireRole('LeaderMon'), remove);

module.exports = router;
