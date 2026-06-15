require('dotenv').config();
const db = require('./conexion');

async function test() {
    try {
        const res = await db.query(`
            SELECT id, descripcion, config_key, 
                   (config_tabla IS NOT NULL) AS has_tabla, 
                   (config_calculos IS NOT NULL) AS has_calculos, 
                   (results_config IS NOT NULL) AS has_results,
                   results_config, config_calculos
            FROM tipo_ensayo
            ORDER BY id
        `);
        console.log("=== TIPOS DE ENSAYO EN BASE DE DATOS ===");
        res.rows.forEach(r => {
            console.log(`ID: ${r.id} | Desc: ${r.descripcion} | Key: ${r.config_key} | Tabla: ${r.has_tabla} | Calculos: ${r.has_calculos} | Results: ${r.has_results}`);
            if (r.config_key === 'limites_consistencia' || r.descripcion.includes('Límit')) {
                console.log("--- CONFIG CALC LIMITES ---", JSON.stringify(r.config_calculos)?.substring(0, 150));
            }
        });
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

test();
