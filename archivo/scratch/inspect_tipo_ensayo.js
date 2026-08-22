const db = require('../backend/conexion');

async function main() {
    try {
        console.log("Consultando la tabla tipo_ensayo...");
        const result = await db.query(`
            SELECT id, descripcion, config_key, 
                   jsonb_pretty(config_calculos) as calculos
            FROM tipo_ensayo
            ORDER BY id
        `);
        console.log(`Se encontraron ${result.rows.length} registros:`);
        for (const row of result.rows) {
            console.log(`----------------------------------------`);
            console.log(`ID: ${row.id}`);
            console.log(`Descripción: ${row.descripcion}`);
            console.log(`Config Key: ${row.config_key}`);
            console.log(`Config Cálculos:`);
            console.log(row.calculos);
        }
        db.end();
    } catch (err) {
        console.error("Error al consultar:", err);
        db.end();
    }
}

main();
