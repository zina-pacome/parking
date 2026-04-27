const pool   = require('../config/db');
const logger = require('../middleware/logger.middleware');

// GET /api/reservations
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.id, r.debut, r.fin, r.statut, r.created_at,
        v.plaque, v.type AS type_vehicule, v.nom_conducteur, v.telephone,
        p.numero AS place_numero, p.zone, p.type AS type_place,
        u.nom AS agent
      FROM reservations r
      JOIN vehicules     v ON r.vehicule_id    = v.id
      JOIN places        p ON r.place_id       = p.id
      LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
      ORDER BY r.debut DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reservations — créer une réservation
exports.create = async (req, res) => {
  const { plaque, type_vehicule, nom_conducteur, telephone, place_id, debut, fin } = req.body;

  if (!plaque || !place_id || !debut || !fin) {
    return res.status(400).json({ message: 'Plaque, place, début et fin obligatoires' });
  }

  if (new Date(debut) >= new Date(fin)) {
    return res.status(400).json({ message: 'La date de fin doit être après le début' });
  }

  if (new Date(debut) < new Date()) {
    return res.status(400).json({ message: 'La date de début doit être dans le futur' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Vérifier que la place est libre ou pas déjà réservée sur ce créneau
    const [conflits] = await conn.query(`
      SELECT id FROM reservations
      WHERE place_id = ?
        AND statut IN ('active', 'confirmee')
        AND NOT (fin <= ? OR debut >= ?)
    `, [place_id, debut, fin]);

    if (conflits.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Place déjà réservée sur ce créneau' });
    }

    // Vérifier que la place n'est pas occupée
    const [place] = await conn.query(
      'SELECT * FROM places WHERE id = ? AND statut != "occupee"',
      [place_id]
    );
    if (place.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Place non disponible' });
    }

    // Chercher ou créer le véhicule
    let vehicule_id;
    const [vehicules] = await conn.query(
      'SELECT id FROM vehicules WHERE plaque = ?',
      [plaque.toUpperCase()]
    );
    if (vehicules.length > 0) {
      vehicule_id = vehicules[0].id;
    } else {
      const [result] = await conn.query(
        'INSERT INTO vehicules (plaque, type, nom_conducteur, telephone) VALUES (?, ?, ?, ?)',
        [plaque.toUpperCase(), type_vehicule || 'voiture', nom_conducteur || null, telephone || null]
      );
      vehicule_id = result.insertId;
    }

    // Créer la réservation
    const [resa] = await conn.query(`
      INSERT INTO reservations (vehicule_id, place_id, utilisateur_id, debut, fin, statut)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [vehicule_id, place_id, req.user.id, debut, fin]);

    // Marquer la place comme réservée
    await conn.query(
      'UPDATE places SET statut = "reservee" WHERE id = ?',
      [place_id]
    );

    await conn.commit();

    await logger(
      'RESERVATION_CREATION',
      `Réservation place ${place[0].numero} — ${plaque} — ${debut} à ${fin}`,
      req.user.id, req.ip
    );

    res.status(201).json({
      message: 'Réservation créée',
      id: resa.insertId,
      place: place[0].numero,
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

// PUT /api/reservations/:id/confirmer
exports.confirmer = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE reservations SET statut = "confirmee" WHERE id = ? AND statut = "active"',
      [id]
    );
    await logger('RESERVATION_CONFIRMATION', `Réservation ${id} confirmée`, req.user.id, req.ip);
    res.json({ message: 'Réservation confirmée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/reservations/:id/annuler
exports.annuler = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT * FROM reservations WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    await conn.query(
      'UPDATE reservations SET statut = "annulee" WHERE id = ?',
      [id]
    );

    // Remettre la place libre si plus aucune réservation active
    const [autresResas] = await conn.query(`
      SELECT id FROM reservations
      WHERE place_id = ? AND statut IN ('active', 'confirmee') AND id != ?
    `, [rows[0].place_id, id]);

    if (autresResas.length === 0) {
      await conn.query(
        'UPDATE places SET statut = "libre" WHERE id = ?',
        [rows[0].place_id]
      );
    }

    await conn.commit();
    await logger('RESERVATION_ANNULATION', `Réservation ${id} annulée`, req.user.id, req.ip);
    res.json({ message: 'Réservation annulée' });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};

// Tâche automatique : annuler les réservations expirées
exports.annulerExpirees = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [expirees] = await conn.query(`
      SELECT r.id, r.place_id FROM reservations r
      WHERE r.statut IN ('active', 'confirmee')
        AND r.fin < NOW()
    `);

    for (const r of expirees) {
      await conn.query(
        'UPDATE reservations SET statut = "expiree" WHERE id = ?',
        [r.id]
      );

      const [autres] = await conn.query(`
        SELECT id FROM reservations
        WHERE place_id = ? AND statut IN ('active', 'confirmee')
      `, [r.place_id]);

      if (autres.length === 0) {
        await conn.query(
          'UPDATE places SET statut = "libre" WHERE id = ?',
          [r.place_id]
        );
      }
    }

    await conn.commit();
    if (expirees.length > 0) {
      console.log(`✅ ${expirees.length} réservation(s) expirée(s) annulées automatiquement`);
    }
  } catch (err) {
    await conn.rollback();
    console.error('Erreur cron réservations :', err.message);
  } finally {
    conn.release();
  }
};