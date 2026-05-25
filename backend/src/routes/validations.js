// Routes pour les validations d'avancement
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const { getAll, create, evaluer, valider } = require('../controllers/validations');

const LEADERS = ['LeaderNat', 'LeaderReg', 'LeaderMon'];

// Lecture : filtrée dans le controller selon le rôle
router.get('/', auth, getAll);

// Création d'une demande : seul le Dirigeant initie pour un de ses membres
router.post('/', auth, requireRole('Dirigeant'), create);

// Étape 1 : le Dirigeant évalue
router.put('/:id/evaluer', auth, requireRole('Dirigeant'), evaluer);

// Étape 2 : un Leader valide en dernier
router.put('/:id/valider', auth, requireRole(...LEADERS), valider);

module.exports = router;
