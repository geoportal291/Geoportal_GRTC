const { Pool } = require('pg');
require('dotenv').config();

// Lee la cadena de conexión directamente de la variable de entorno DATABASE_URL.
// La librería 'pg' interpretará automáticamente el parámetro sslmode de la URL.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // Fly.io requiere conexiones SSL.
  // Es una buena práctica ser explícito con esta configuración.
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
