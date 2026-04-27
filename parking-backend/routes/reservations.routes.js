const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/reservations.controller');

router.get('/',              auth, ctrl.getAll);
router.post('/',             auth, ctrl.create);
router.put('/:id/confirmer', auth, ctrl.confirmer);
router.put('/:id/annuler',   auth, ctrl.annuler);

module.exports = router;