// Routes pour les routines spirituelles
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { getAll, suivi, create, update, remove } = require('../controllers/routines');

router.get('/', auth, getAll);
// Suivi des disciples : réservé aux responsables (dirigeant + leaders)
router.get('/suivi', auth, requireRole('Dirigeant', 'LeaderNat', 'LeaderReg', 'LeaderMon'), suivi);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
