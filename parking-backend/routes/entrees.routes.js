const router = require('express').Router();
const ctrl   = require('../controllers/entrees.controller');
const auth   = require('../middleware/auth.middleware');

router.get('/',              auth, ctrl.getEntreesEnCours);
router.post('/',             auth, ctrl.enregistrerEntree);
router.post('/:id/sortie',   auth, ctrl.enregistrerSortie);

module.exports = router;