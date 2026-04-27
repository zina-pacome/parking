const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {

    // Stats des places
    const [places] = await pool.query(`
      SELECT
        COUNT(*)                                                AS total,
        SUM(CASE WHEN statut = 'libre'        THEN 1 ELSE 0 END) AS libres,
        SUM(CASE WHEN statut = 'occupee'      THEN 1 ELSE 0 END) AS occupees,
        SUM(CASE WHEN statut = 'reservee'     THEN 1 ELSE 0 END) AS reservees,
        SUM(CASE WHEN statut = 'hors_service' THEN 1 ELSE 0 END) AS hors_service
      FROM places
    `);

    // Revenu du jour
    const [revenuJour] = await pool.query(`
      SELECT COALESCE(SUM(montant), 0) AS total
      FROM paiements
      WHERE DATE(created_at) = CURDATE()
        AND statut = 'paye'
    `);

    // Revenu de la semaine
    const [revenuSemaine] = await pool.query(`
      SELECT COALESCE(SUM(montant), 0) AS total
      FROM paiements
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND statut = 'paye'
    `);

    // Activité des 7 derniers jours
    const [activite] = await pool.query(`
      SELECT
        DATE(heure_entree)                             AS jour,
        COUNT(*)                                       AS entrees,
        SUM(CASE WHEN statut = 'termine' THEN 1 ELSE 0 END) AS sorties
      FROM entrees_sorties
      WHERE heure_entree >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(heure_entree)
      ORDER BY jour ASC
    `);

    // Historique récent
    const [historique] = await pool.query(`
      SELECT
        es.id,
        es.heure_entree,
        es.heure_sortie,
        es.statut,
        v.plaque,
        v.type      AS type_vehicule,
        p.numero    AS place_numero,
        pay.montant
      FROM entrees_sorties es
      JOIN vehicules  v   ON es.vehicule_id       = v.id
      JOIN places     p   ON es.place_id          = p.id
      LEFT JOIN paiements pay ON pay.entree_sortie_id = es.id
      ORDER BY es.heure_entree DESC
      LIMIT 6
    `);

    res.json({
      places:           places[0],
      revenu_jour:      Number(revenuJour[0].total),
      revenu_semaine:   Number(revenuSemaine[0].total),
      activite_semaine: activite,
      historique:       historique,
    });

  } catch (err) {
    console.error('Erreur dashboard:', err);
    res.status(500).json({ message: err.message });
  }
};