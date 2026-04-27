const pool = require('../config/db');

module.exports = async (action, details, userId, ip) => {
  try {
    await pool.query(
      'INSERT INTO logs (utilisateur_id, action, details, ip) VALUES (?, ?, ?, ?)',
      [userId || null, action, details || null, ip || null]
    );
  } catch (err) {
    console.error('Erreur log :', err.message);
  }
};