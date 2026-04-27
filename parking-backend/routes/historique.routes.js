const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/historique.controller');

router.get('/',       auth, ctrl.getHistorique);
router.get('/stats',  auth, ctrl.getStats);

module.exports = router;