// Routes pour les traductions
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { create, update } = require('../controllers/traductions');

// Création / modification d'une traduction : RespContenus uniquement
router.post('/', auth, requireRole('RespContenus'), create);
router.put('/:id', auth, requireRole('RespContenus'), update);

module.exports = router;
