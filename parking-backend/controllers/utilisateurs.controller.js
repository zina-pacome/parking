const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const logger = require('../middleware/logger.middleware');

// GET /api/utilisateurs
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id, nom, email, role, actif, created_at
      FROM utilisateurs
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/utilisateurs — créer un utilisateur
exports.create = async (req, res) => {
  const { nom, email, mot_de_passe, role } = req.body;

  if (!nom || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Nom, email et mot de passe obligatoires' });
  }

  if (mot_de_passe.length < 6) {
    return res.status(400).json({ message: 'Mot de passe minimum 6 caractères' });
  }

  try {
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const [result] = await pool.query(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
      [nom, email.toLowerCase(), hash, role || 'agent']
    );
    await logger('USER_CREATION', `Utilisateur ${email} créé`, req.user.id, req.ip);
    res.status(201).json({ message: 'Utilisateur créé', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Cet email existe déjà' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/utilisateurs/:id — modifier un utilisateur
exports.update = async (req, res) => {
  const { id }   = req.params;
  const { nom, email, role, mot_de_passe } = req.body;

  try {
    if (mot_de_passe) {
      if (mot_de_passe.length < 6) {
        return res.status(400).json({ message: 'Mot de passe minimum 6 caractères' });
      }
      const hash = await bcrypt.hash(mot_de_passe, 10);
      await pool.query(
        'UPDATE utilisateurs SET nom=?, email=?, role=?, mot_de_passe=? WHERE id=?',
        [nom, email.toLowerCase(), role, hash, id]
      );
    } else {
      await pool.query(
        'UPDATE utilisateurs SET nom=?, email=?, role=? WHERE id=?',
        [nom, email.toLowerCase(), role, id]
      );
    }
    await logger('USER_MODIFICATION', `Utilisateur ${id} modifié`, req.user.id, req.ip);
    res.json({ message: 'Utilisateur modifié' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Cet email existe déjà' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/utilisateurs/:id/toggle — activer/désactiver
exports.toggleActif = async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous désactiver vous-même' });
  }

  try {
    await pool.query(
      'UPDATE utilisateurs SET actif = NOT actif WHERE id = ?',
      [id]
    );
    await logger('USER_TOGGLE', `Utilisateur ${id} activé/désactivé`, req.user.id, req.ip);
    res.json({ message: 'Statut modifié' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/utilisateurs/:id
exports.delete = async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous supprimer vous-même' });
  }

  try {
    await pool.query('DELETE FROM utilisateurs WHERE id = ?', [id]);
    await logger('USER_SUPPRESSION', `Utilisateur ${id} supprimé`, req.user.id, req.ip);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};