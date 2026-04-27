const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/paiements.controller');

router.get('/stats', auth, ctrl.getStats);
router.get('/',      auth, ctrl.getAll);
router.get('/:id',   auth, ctrl.getOne);

module.exports = router;