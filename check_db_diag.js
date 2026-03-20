const db = require('./backend/conexion');

async function checkDb() {
    try {
        console.log("--- Verificando esquema de geologia_capas ---");
        const schema = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'geologia_capas'
        `);
        console.table(schema.rows);

        console.log("\n--- Verificando datos de la última capa subida ---");
        const data = await db.query(`
            SELECT id, proyecto_id, tab_name, file_url, file_name, 
                   (geojson_data IS NOT NULL) as has_geojson
            FROM geologia_capas 
            ORDER BY creado_en DESC 
            LIMIT 1
        `);
        console.table(data.rows);

        process.exit(0);
    } catch (err) {
        console.error("Error en diagnóstico:", err);
        process.exit(1);
    }
}

checkDb();
