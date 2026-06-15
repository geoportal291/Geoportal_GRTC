const pool = require('./conexion.js');

async function run() {
  try {
    // 1. Ver config_graficos de tipo_ensayo id = 4
    console.log("=== CONFIG GRAFICOS PROCTOR (id=4) ===");
    const resConfig = await pool.query(`SELECT config_graficos FROM public.tipo_ensayo WHERE id = 4`);
    console.log(JSON.stringify(resConfig.rows[0]?.config_graficos, null, 2));

    // 2. Ver algunos Ensayos de Proctor
    console.log("\n=== ENSAYOS PROCTOR REGISTRADOS (MUESTRAS) ===");
    const resEnsayos = await pool.query(`
      SELECT id, nombre_ensayo, codigo_ensayo, datos_formulario, resultado 
      FROM public.ensayos 
      WHERE tipo_ensayo = 4 OR tipo_ensayo_id = 4
      LIMIT 3
    `);
    
    resEnsayos.rows.forEach(row => {
      console.log(`\nEnsayo ID: ${row.id} - ${row.nombre_ensayo} (${row.codigo_ensayo})`);
      console.log("datos_formulario:", JSON.stringify(row.datos_formulario, null, 2));
      console.log("resultado:", JSON.stringify(row.resultado, null, 2));
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
