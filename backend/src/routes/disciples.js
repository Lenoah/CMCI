// Routes pour les disciples
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { getAll, getById, update, remove } = require('../controllers/disciples');

const LEADERS = ['LeaderNat', 'LeaderReg', 'LeaderMon'];

// Lecture : visibilité réelle filtrée dans le controller selon le rôle
router.get('/', auth, getAll);
router.get('/:id', auth, getById);

// Modification : Dirigeant (membres de son église) + Leaders
// Le contrôle "qui peut changer le rôle" est fait dans le controller
router.put('/:id', auth, requireRole('Dirigeant', ...LEADERS), update);

// Suppression : Leaders uniquement
router.delete('/:id', auth, requireRole(...LEADERS), remove);

module.exports = router;
