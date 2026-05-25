// Routes d'authentification
const router = require('express').Router();
const { login, register, me } = require('../controllers/auth');
const authMiddleware = require('../middlewares/auth');

router.post('/login', login);
router.post('/register', register);           // inscription d'un nouveau disciple
router.get('/me', authMiddleware, me);         // profil du disciple connecté

module.exports = router;
