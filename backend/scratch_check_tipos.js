const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/geoportal_local',
  ssl: false
});

async function check() {
  try {
    const res = await pool.query('SELECT id, descripcion, config_key, config_tabla IS NOT NULL as has_tabla, config_calculos IS NOT NULL as has_calculos FROM tipo_ensayo');
    console.log('=== TIPOS DE ENSAYO EN BASE DE DATOS ===');
    console.table(res.rows);
    
    // Consultar detalles de todos los tipos para ver qué config tienen
    const details = await pool.query('SELECT id, descripcion, config_key, config_tabla, config_calculos FROM tipo_ensayo');
    for (const row of details.rows) {
      console.log(`\n--- ${row.descripcion} (${row.config_key}) ---`);
      if (row.config_tabla) {
        console.log('  Tablas:', Object.keys(row.config_tabla.tables || {}));
      } else {
        console.log('  No tiene config_tabla.');
      }
      if (row.config_calculos) {
        console.log('  Cálculos definidos:', Object.keys(row.config_calculos || {}).slice(0, 10), '...');
      } else {
        console.log('  No tiene config_calculos.');
      }
    }
  } catch (err) {
    console.error('Error al consultar tipo_ensayo:', err);
  } finally {
    await pool.end();
  }
}

check();
