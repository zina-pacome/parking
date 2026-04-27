const pool   = require('../config/db');
const logger = require('../middleware/logger.middleware');

// GET /api/places
exports.getAll = async (req, res) => {
  try {
    const [places] = await pool.query(
      'SELECT * FROM places ORDER BY zone, numero'
    );

    // Entrées en cours (places occupées)
    const [entrees] = await pool.query(`
      SELECT
        es.place_id,
        es.id        AS entree_id,
        es.heure_entree,
        v.plaque,
        v.nom_conducteur,
        v.type       AS type_vehicule
      FROM entrees_sorties es
      JOIN vehicules v ON v.id = es.vehicule_id
      WHERE es.statut = 'en_cours'
    `);

    // NOUVEAU : réservations actives (places réservées)
    const [reservations] = await pool.query(`
      SELECT
        r.place_id,
        r.id         AS reservation_id,
        r.debut,
        r.fin,
        r.statut     AS statut_resa,
        v.plaque,
        v.nom_conducteur,
        v.type       AS type_vehicule
      FROM reservations r
      JOIN vehicules v ON v.id = r.vehicule_id
      WHERE r.statut IN ('active', 'confirmee')
    `);

    // Maps pour fusion rapide
    const entreesMap      = {};
    const reservationsMap = {};
    entrees.forEach(e      => { entreesMap[e.place_id]      = e; });
    reservations.forEach(r => { reservationsMap[r.place_id] = r; });

    const resultat = places.map(p => ({
      ...p,
      // Données entrée (place occupée)
      plaque:         entreesMap[p.id]?.plaque         || reservationsMap[p.id]?.plaque         || null,
      nom_conducteur: entreesMap[p.id]?.nom_conducteur || reservationsMap[p.id]?.nom_conducteur || null,
      heure_entree:   entreesMap[p.id]?.heure_entree   || null,
      entree_id:      entreesMap[p.id]?.entree_id      || null,
      // Données réservation (place réservée)
      reservation_id: reservationsMap[p.id]?.reservation_id || null,
      debut_resa:     reservationsMap[p.id]?.debut           || null,
      fin_resa:       reservationsMap[p.id]?.fin             || null,
    }));

    res.json(resultat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/places — ajouter une place
exports.create = async (req, res) => {
  const { numero, zone, etage, type } = req.body;
  if (!numero || !zone) {
    return res.status(400).json({ message: 'Numéro et zone obligatoires' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO places (numero, zone, etage, type) VALUES (?, ?, ?, ?)',
      [numero.toUpperCase(), zone.toUpperCase(), etage || 0, type || 'standard']
    );
    await logger('PLACE_AJOUT', `Place ${numero} ajoutée`, req.user.id, req.ip);
    res.status(201).json({ message: 'Place ajoutée', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Ce numéro de place existe déjà' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/places/:id — modifier le statut
exports.updateStatut = async (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;
  const statutsValides = ['libre', 'occupee', 'reservee', 'hors_service'];
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }
  try {
    await pool.query('UPDATE places SET statut = ? WHERE id = ?', [statut, id]);
    await logger('PLACE_STATUT', `Place ${id} → ${statut}`, req.user.id, req.ip);
    res.json({ message: 'Statut mis à jour' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/places/:id
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const [entrees] = await pool.query(
      'SELECT id FROM entrees_sorties WHERE place_id = ? AND statut = "en_cours"',
      [id]
    );
    if (entrees.length > 0) {
      return res.status(400).json({ message: 'Place occupée, impossible de supprimer' });
    }
    await pool.query('DELETE FROM places WHERE id = ?', [id]);
    await logger('PLACE_SUPPRESSION', `Place ${id} supprimée`, req.user.id, req.ip);
    res.json({ message: 'Place supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};