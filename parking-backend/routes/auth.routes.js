const router = require('express').Router();
const auth   = require('../controllers/auth.controller');
const verify = require('../middleware/auth.middleware');

router.post('/login', auth.login);
router.get('/me',    verify, auth.me);

module.exports = router;