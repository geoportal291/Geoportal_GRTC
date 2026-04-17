const db = require('./conexion');

async function run() {
    try {
        console.log('--- Iniciando migración: Añadiendo columna es_tramo_completo a modelos_3d ---');
        
        await db.query(`
            ALTER TABLE modelos_3d 
            ADD COLUMN IF NOT EXISTS es_tramo_completo BOOLEAN DEFAULT FALSE;
        `);
        
        console.log('--- Migración completada con éxito ---');
        process.exit(0);
    } catch (err) {
        console.error('Error durante la migración:', err);
        process.exit(1);
    }
}

run();
