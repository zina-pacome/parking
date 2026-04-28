const mysql = require('mysql2/promise');

const url = process.env.DATABASE_URL || 
  'mysql://root:bNSgjwJeOEgIxwFKNolPJZpDpUMkMYTN@switchback.proxy.rlwy.net:54804/railway';

console.log('=== DB DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL présente:', !!process.env.DATABASE_URL);
console.log('URL utilisée:', url.substring(0, 30));
console.log('================');

const pool = mysql.createPool({
  uri:                url,
  waitForConnections: true,
  connectionLimit:    10,
  ssl:                { rejectUnauthorized: false }
});

module.exports = pool;