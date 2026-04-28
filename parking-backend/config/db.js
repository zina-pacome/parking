const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('DATABASE_URL présente:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL début:', process.env.DATABASE_URL?.substring(0, 20));

let pool;

const url = process.env.DATABASE_URL;

if (url) {
  pool = mysql.createPool({
    uri:                url,
    waitForConnections: true,
    connectionLimit:    10,
    ssl:                { rejectUnauthorized: false }
  });
} else {
  console.error('❌ DATABASE_URL manquante !');
  pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'parking_db',
    waitForConnections: true,
    connectionLimit:    10,
  });
}

module.exports = pool;