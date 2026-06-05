// Routes pour les contenus spirituels
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { getAll, getById, create, update, consulter, remove } = require('../controllers/contenus');

// Lecture : tout utilisateur connecté peut consulter
router.get('/', auth, getAll);
router.get('/:id', auth, getById);

// Publication / modification / suppression : RespContenus uniquement
router.post('/', auth, requireRole('RespContenus'), create);
router.put('/:id', auth, requireRole('RespContenus'), update);
router.delete('/:id', auth, requireRole('RespContenus'), remove);

// Marquer comme consulté : ouvert à tous les rôles
router.post('/:id/consulter', auth, consulter);

module.exports = router;
