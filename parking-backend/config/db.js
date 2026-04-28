const mysql = require('mysql2/promise');

// Ne pas appeler dotenv ici — Railway injecte directement les variables
const url = process.env.DATABASE_URL;

console.log('=== DB DEBUG ===');
console.log('DATABASE_URL présente:', !!url);
console.log('Toutes les vars:', Object.keys(process.env).filter(k => k.includes('DATA') || k.includes('MYSQL') || k.includes('DB')));
console.log('================');

let pool;

if (url) {
  pool = mysql.createPool({
    uri:                url,
    waitForConnections: true,
    connectionLimit:    10,
    ssl:                { rejectUnauthorized: false }
  });
} else {
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