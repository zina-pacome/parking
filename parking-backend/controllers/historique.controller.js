const pool = require('../config/db');

exports.getHistorique = async (req, res) => {
  const { date, plaque, type, limite = 50 } = req.query;

  let conditions = [];
  let params     = [];

  if (date) {
    conditions.push('DATE(es.heure_entree) = ?');
    params.push(date);
  }
  if (plaque) {
    conditions.push('v.plaque LIKE ?');
    params.push(`%${plaque.toUpperCase()}%`);
  }
  if (type) {
    conditions.push('v.type = ?');
    params.push(type);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const [rows] = await pool.query(`
      SELECT
        es.id,
        es.heure_entree,
        es.heure_sortie,
        es.duree_minutes,
        es.statut,
        v.plaque,
        v.type        AS type_vehicule,
        v.nom_conducteur,
        p.numero      AS place_numero,
        p.zone,
        pay.montant,
        pay.methode,
        u.nom         AS agent
      FROM entrees_sorties es
      JOIN vehicules   v   ON es.vehicule_id    = v.id
      JOIN places      p   ON es.place_id       = p.id
      LEFT JOIN paiements  pay ON pay.entree_sortie_id = es.id
      LEFT JOIN utilisateurs u ON es.utilisateur_id   = u.id
      ${where}
      ORDER BY es.heure_entree DESC
      LIMIT ?
    `, [...params, parseInt(limite)]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [today] = await pool.query(`
      SELECT
        COUNT(*)                                     AS total_entrees,
        SUM(CASE WHEN statut='termine' THEN 1 END)   AS total_sorties,
        SUM(CASE WHEN statut='en_cours' THEN 1 END)  AS en_cours,
        COALESCE(SUM(pay.montant), 0)                AS revenu_jour
      FROM entrees_sorties es
      LEFT JOIN paiements pay ON pay.entree_sortie_id = es.id
      WHERE DATE(es.heure_entree) = CURDATE()
    `);

    const [semaine] = await pool.query(`
      SELECT
        DATE(es.heure_entree)      AS jour,
        COUNT(*)                   AS entrees,
        COALESCE(SUM(pay.montant), 0) AS revenu
      FROM entrees_sorties es
      LEFT JOIN paiements pay ON pay.entree_sortie_id = es.id
      WHERE es.heure_entree >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(es.heure_entree)
      ORDER BY jour ASC
    `);

    res.json({ today: today[0], semaine });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};