// Routes pour les églises de maison
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { getAll, getById, create, update, remove } = require('../controllers/eglises');

const LEADERS = ['LeaderNat', 'LeaderReg', 'LeaderMon'];

// Lecture : tout utilisateur connecté
router.get('/', auth, getAll);
router.get('/:id', auth, getById);

// Création / modification / suppression : Leaders uniquement
router.post('/', auth, requireRole(...LEADERS), create);
router.put('/:id', auth, requireRole(...LEADERS), update);
router.delete('/:id', auth, requireRole(...LEADERS), remove);

module.exports = router;
