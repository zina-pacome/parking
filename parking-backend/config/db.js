const mysql = require('mysql2/promise');

// Ne jamais appeler dotenv ici
const url = process.env.DATABASE_URL;

console.log('=== DB DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL présente:', !!url);
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
    host:               'localhost',
    port:               3306,
    user:               'root',
    password:           '',
    database:           'parking_db',
    waitForConnections: true,
    connectionLimit:    10,
  });
}

module.exports = pool;