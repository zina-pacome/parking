const pool   = require('../config/db');
const logger = require('../middleware/logger.middleware');

// GET /api/entrees — toutes les entrées en cours
exports.getEntreesEnCours = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        es.id, es.heure_entree, es.statut,
        v.plaque, v.type AS type_vehicule, v.nom_conducteur,
        p.numero AS place_numero, p.zone,
        u.nom AS agent
      FROM entrees_sorties es
      JOIN vehicules v ON es.vehicule_id = v.id
      JOIN places    p ON es.place_id    = p.id
      LEFT JOIN utilisateurs u ON es.utilisateur_id = u.id
      WHERE es.statut = 'en_cours'
      ORDER BY es.heure_entree DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// POST /api/entrees — enregistrer une entrée
exports.enregistrerEntree = async (req, res) => {
  const { plaque, type_vehicule, nom_conducteur, telephone, place_id } = req.body;

  if (!plaque) {
    return res.status(400).json({ message: 'La plaque est obligatoire' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Chercher ou créer le véhicule
    let vehicule_id;
    const [vehicules] = await conn.query(
      'SELECT id FROM vehicules WHERE plaque = ?',
      [plaque.toUpperCase()]
    );

    if (vehicules.length > 0) {
      vehicule_id = vehicules[0].id;
      await conn.query(
        'UPDATE vehicules SET nom_conducteur = ?, telephone = ? WHERE id = ?',
        [nom_conducteur || null, telephone || null, vehicule_id]
      );
    } else {
      const [result] = await conn.query(
        'INSERT INTO vehicules (plaque, type, nom_conducteur, telephone) VALUES (?, ?, ?, ?)',
        [plaque.toUpperCase(), type_vehicule || 'voiture', nom_conducteur || null, telephone || null]
      );
      vehicule_id = result.insertId;
    }

    // Chercher une réservation active pour ce véhicule
    const [reservations] = await conn.query(`
      SELECT r.*, p.numero AS place_numero, p.id AS place_id_resa
      FROM reservations r
      JOIN places p ON r.place_id = p.id
      WHERE r.vehicule_id = ?
        AND r.statut IN ('active', 'confirmee')
        AND r.debut <= NOW()
        AND r.fin    >= NOW()
      ORDER BY r.debut ASC
      LIMIT 1
    `, [vehicule_id]);

    let place_finale_id = place_id || null;
    let reservation_id  = null;
    let place_numero    = null;
    let message_resa    = null;

    if (reservations.length > 0) {
      // Réservation trouvée → place automatique
      const resa      = reservations[0];
      place_finale_id = resa.place_id_resa;
      reservation_id  = resa.id;
      place_numero    = resa.place_numero;
      message_resa    = `Place ${resa.place_numero} attribuée automatiquement`;

      // Confirmer la réservation
      await conn.query(
        'UPDATE reservations SET statut = "confirmee" WHERE id = ?',
        [resa.id]
      );

    } else {
      // Pas de réservation → place obligatoire
      if (!place_finale_id) {
        await conn.rollback();
        return res.status(400).json({
          message: 'Aucune réservation active — veuillez choisir une place'
        });
      }

      // Vérifier que la place est disponible (libre OU réservée)
      const [places] = await conn.query(
        `SELECT * FROM places
         WHERE id = ? AND statut IN ('libre', 'reservee')`,
        [place_finale_id]
      );

      if (places.length === 0) {
        await conn.rollback();
        return res.status(400).json({ message: 'Place non disponible' });
      }
      place_numero = places[0].numero;
    }

    // Vérifier qu'il n'y a pas déjà une entrée en cours pour ce véhicule
    const [dejaPresent] = await conn.query(
      `SELECT id FROM entrees_sorties
       WHERE vehicule_id = ? AND statut = 'en_cours'`,
      [vehicule_id]
    );

    if (dejaPresent.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        message: 'Ce véhicule est déjà dans le parking'
      });
    }

    // Créer l'entrée
    const [entree] = await conn.query(
      `INSERT INTO entrees_sorties
        (vehicule_id, place_id, utilisateur_id, heure_entree)
       VALUES (?, ?, ?, NOW())`,
      [vehicule_id, place_finale_id, req.user.id]
    );

    // Marquer la place comme occupée
    await conn.query(
      'UPDATE places SET statut = "occupee" WHERE id = ?',
      [place_finale_id]
    );

    await conn.commit();

    await logger(
      'ENTREE',
      `Entrée ${plaque} — place ${place_numero}${reservation_id
        ? ' (réservation #' + reservation_id + ')' : ''}`,
      req.user.id, req.ip
    );

    res.status(201).json({
      message:     'Entrée enregistrée',
      entree_id:   entree.insertId,
      place:       place_numero,
      reservation: reservation_id
        ? { id: reservation_id, message: message_resa }
        : null,
    });

  } catch (err) {
    await conn.rollback();
    console.error('Erreur entrée:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  } finally {
    conn.release();
  }
};

// POST /api/entrees/:id/sortie — enregistrer la sortie
exports.enregistrerSortie = async (req, res) => {
  const { id } = req.params;
  const { methode_paiement } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Récupérer l'entrée en cours
    const [entrees] = await conn.query(`
      SELECT es.*, v.plaque, p.numero AS place_numero, p.id AS place_id
      FROM entrees_sorties es
      JOIN vehicules v ON es.vehicule_id = v.id
      JOIN places    p ON es.place_id    = p.id
      WHERE es.id = ? AND es.statut = 'en_cours'
    `, [id]);

    if (entrees.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Entrée non trouvée ou déjà terminée' });
    }

    const entree    = entrees[0];
    const maintenant = new Date();
    const entree_at  = new Date(entree.heure_entree);

    // Durée en minutes (minimum 1 minute)
    const duree_minutes = Math.max(1, Math.ceil(
      (maintenant - entree_at) / (1000 * 60)
    ));

    // Récupérer le tarif horaire actif
    const [tarifs] = await conn.query(
      'SELECT * FROM tarifs WHERE type = "heure" AND actif = TRUE LIMIT 1'
    );

    if (tarifs.length === 0) {
      await conn.rollback();
      return res.status(500).json({ message: 'Aucun tarif horaire configuré' });
    }

    const tarif   = tarifs[0];
    const heures  = Math.max(1, Math.ceil(duree_minutes / 60));
    const montant = heures * Number(tarif.montant);

    // Mettre à jour l'entrée → terminée
    await conn.query(`
      UPDATE entrees_sorties
      SET heure_sortie  = NOW(),
          duree_minutes = ?,
          statut        = 'termine'
      WHERE id = ?
    `, [duree_minutes, id]);

    // Insérer le paiement
    const [paiement] = await conn.query(`
      INSERT INTO paiements
        (entree_sortie_id, tarif_id, montant, methode, statut, utilisateur_id)
      VALUES (?, ?, ?, ?, 'paye', ?)
    `, [
      id,
      tarif.id,
      montant,
      methode_paiement || 'especes',
      req.user.id
    ]);

    // Libérer la place
    await conn.query(
      'UPDATE places SET statut = "libre" WHERE id = ?',
      [entree.place_id]
    );

    await conn.commit();

    await logger(
      'SORTIE',
      `Sortie ${entree.plaque} — ${duree_minutes}min — ${montant} Ar`,
      req.user.id,
      req.ip
    );

    res.json({
      message:      'Sortie enregistrée avec succès',
      plaque:       entree.plaque,
      place:        entree.place_numero,
      heure_entree: entree.heure_entree,
      heure_sortie: maintenant,
      duree_minutes,
      heures,
      montant,
      paiement_id:  paiement.insertId,
    });

  } catch (err) {
    await conn.rollback();
    console.error('Erreur sortie :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  } finally {
    conn.release();
  }
};