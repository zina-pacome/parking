const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const admin  = require('../middleware/admin.middleware');
const ctrl   = require('../controllers/places.controller');
const pool   = require('../config/db');

router.get('/libres', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM places
       WHERE statut IN ('libre', 'reservee')
       ORDER BY zone, numero`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/',       auth,        ctrl.getAll);
router.post('/',      auth, admin, ctrl.create);
router.put('/:id',    auth, admin, ctrl.updateStatut);
router.delete('/:id', auth, admin, ctrl.delete);

module.exports = router;