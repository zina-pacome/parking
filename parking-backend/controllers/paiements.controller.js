const pool   = require('../config/db');
const logger = require('../middleware/logger.middleware');

// GET /api/paiements — tous les paiements avec filtres
exports.getAll = async (req, res) => {
  const { date, methode, limite = 50 } = req.query;

  let conditions = [];
  let params     = [];

  if (date) {
    conditions.push('DATE(pay.created_at) = ?');
    params.push(date);
  }
  if (methode) {
    conditions.push('pay.methode = ?');
    params.push(methode);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const [rows] = await pool.query(`
      SELECT
        pay.id,
        pay.montant,
        pay.methode,
        pay.statut,
        pay.created_at,
        v.plaque,
        v.type        AS type_vehicule,
        v.nom_conducteur,
        p.numero      AS place_numero,
        p.zone,
        es.heure_entree,
        es.heure_sortie,
        es.duree_minutes,
        t.nom         AS tarif_nom,
        t.montant     AS tarif_unitaire,
        u.nom         AS agent
      FROM paiements pay
      JOIN entrees_sorties es ON pay.entree_sortie_id = es.id
      JOIN vehicules       v  ON es.vehicule_id       = v.id
      JOIN places          p  ON es.place_id          = p.id
      LEFT JOIN tarifs     t  ON pay.tarif_id         = t.id
      LEFT JOIN utilisateurs u ON pay.utilisateur_id  = u.id
      ${where}
      ORDER BY pay.created_at DESC
      LIMIT ?
    `, [...params, parseInt(limite)]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/paiements/stats — statistiques financières
exports.getStats = async (req, res) => {
  try {
    // Revenus par jour sur 7 jours
    const [parJour] = await pool.query(`
      SELECT
        DATE(created_at)       AS jour,
        COUNT(*)               AS nb_paiements,
        SUM(montant)           AS total,
        AVG(montant)           AS moyenne
      FROM paiements
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND statut = 'paye'
      GROUP BY DATE(created_at)
      ORDER BY jour ASC
    `);

    // Revenus par méthode de paiement
    const [parMethode] = await pool.query(`
      SELECT
        methode,
        COUNT(*)     AS nb,
        SUM(montant) AS total
      FROM paiements
      WHERE DATE(created_at) = CURDATE()
        AND statut = 'paye'
      GROUP BY methode
    `);

    // Totaux globaux
    const [totaux] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE()
          THEN montant END), 0)                              AS aujourd_hui,
        COALESCE(SUM(CASE WHEN WEEK(created_at) = WEEK(NOW())
          THEN montant END), 0)                              AS cette_semaine,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW())
          THEN montant END), 0)                              AS ce_mois,
        COALESCE(SUM(montant), 0)                           AS total_global,
        COUNT(*)                                            AS nb_total
      FROM paiements
      WHERE statut = 'paye'
    `);

    res.json({
      par_jour:    parJour,
      par_methode: parMethode,
      totaux:      totaux[0],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/paiements/:id — détail d'un paiement
exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        pay.*,
        v.plaque, v.type AS type_vehicule, v.nom_conducteur,
        p.numero AS place_numero, p.zone,
        es.heure_entree, es.heure_sortie, es.duree_minutes,
        t.nom AS tarif_nom, t.montant AS tarif_unitaire,
        u.nom AS agent
      FROM paiements pay
      JOIN entrees_sorties es ON pay.entree_sortie_id = es.id
      JOIN vehicules       v  ON es.vehicule_id = v.id
      JOIN places          p  ON es.place_id    = p.id
      LEFT JOIN tarifs     t  ON pay.tarif_id   = t.id
      LEFT JOIN utilisateurs u ON pay.utilisateur_id = u.id
      WHERE pay.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};