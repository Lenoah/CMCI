// Routes pour les tableaux de bord
const router = require('express').Router();
const auth = require('../middlewares/auth');
const { disciple, dirigeant, leader } = require('../controllers/dashboard');

router.get('/disciple', auth, disciple);
router.get('/dirigeant', auth, dirigeant);
router.get('/leader', auth, leader);

module.exports = router;
