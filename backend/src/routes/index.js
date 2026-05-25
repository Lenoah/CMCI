// Point central de toutes les routes de l'API
const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/disciples', require('./disciples'));
router.use('/eglises', require('./eglises'));
router.use('/reunions', require('./reunions'));
router.use('/routines', require('./routines'));
router.use('/contenus', require('./contenus'));
router.use('/traductions', require('./traductions'));
router.use('/validations', require('./validations'));
router.use('/dashboard', require('./dashboard'));

module.exports = router;
