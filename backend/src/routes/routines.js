// Routes pour les routines spirituelles
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { getAll, create, update, remove } = require('../controllers/routines');

router.get('/', auth, getAll);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;
