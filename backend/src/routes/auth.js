// Routes d'authentification
const router = require('express').Router();
const { login, me, updateProfile, changePassword } = require('../controllers/auth');
const authMiddleware = require('../middlewares/auth');

router.post('/login', login);
router.get('/me', authMiddleware, me);              // profil du disciple connecté
router.put('/me', authMiddleware, updateProfile);   // modifier son propre profil (+ photo)
router.put('/password', authMiddleware, changePassword); // changer son mot de passe

module.exports = router;
