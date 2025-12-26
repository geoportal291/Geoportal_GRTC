const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('ERROR de conexión con PostgreSQL:', err);
  } else {
    console.log('Conectado a PostgreSQL y listo para recibir consultas.');
  }
});

module.exports = pool;
