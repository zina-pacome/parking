const pool      = require('../config/db');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const logger    = require('../middleware/logger.middleware');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM utilisateurs WHERE email = ? AND actif = TRUE',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = rows[0];
    const valide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!valide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, nom: user.nom, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expire }
    );

    await logger('LOGIN', `Connexion de ${user.email}`, user.id, req.ip);

    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nom, email, role FROM utilisateurs WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};