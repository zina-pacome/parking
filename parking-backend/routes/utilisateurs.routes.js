const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const admin  = require('../middleware/admin.middleware');
const ctrl   = require('../controllers/utilisateurs.controller');

router.get('/',              auth, admin, ctrl.getAll);
router.post('/',             auth, admin, ctrl.create);
router.put('/:id',           auth, admin, ctrl.update);
router.put('/:id/toggle',    auth, admin, ctrl.toggleActif);
router.delete('/:id',        auth, admin, ctrl.delete);

module.exports = router;