const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // Railway utilise une URL complète
  pool = mysql.createPool(process.env.DATABASE_URL + '?ssl={"rejectUnauthorized":false}');
} else {
  // Développement local avec variables séparées
  pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit:    10,
  });
}

module.exports = pool;