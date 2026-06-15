const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/geoportal_local',
  ssl: false
});

async function check() {
  try {
    const tables = [
      'tipo_ensayo',
      'formulario_secciones',
      'progresivas',
      'canteras',
      'estratos',
      'progresiva_perfil_estratos',
      'cantera_estratos',
      'ensayos'
    ];
    
    console.log("=== REPORTE DE REGISTROS POR TABLA ===");
    for (let table of tables) {
      try {
        const res = await pool.query(`SELECT COUNT(*) FROM public."${table}"`);
        console.log(`Tabla ${table}: ${res.rows[0].count} registros`);
      } catch (err) {
        console.log(`Tabla ${table}: ERROR (${err.message})`);
      }
    }
    
    console.log("\n=== CONTENIDO DE TIPO_ENSAYO ===");
    const tipoEnsayoRes = await pool.query(`SELECT id, codigo, descripcion, config_key FROM public.tipo_ensayo`);
    console.table(tipoEnsayoRes.rows);
    
  } catch (err) {
    console.error("Error general:", err);
  } finally {
    await pool.end();
  }
}

check();
