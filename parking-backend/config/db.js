const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (url) {
  pool = mysql.createPool({
    uri:                url,
    waitForConnections: true,
    connectionLimit:    10,
    ssl:                { rejectUnauthorized: false }
  });
} else {
  pool = mysql.createPool({
    host:               process.env.DB_HOST,
    port:               parseInt(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    database:           process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit:    10,
  });
}

module.exports = pool;