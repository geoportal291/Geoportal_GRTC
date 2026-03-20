const db = require('./conexion');

async function alter() {
    try {
        await db.query(`
            ALTER TABLE modelos_3d 
            ADD COLUMN IF NOT EXISTS metadata JSONB, 
            ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'COMPLETADO';
        `);
        console.log("Tabla modelos_3d actualizada con metadata y estado.");
        process.exit(0);
    } catch (e) {
        console.error("Error actualizando DB:", e);
        process.exit(1);
    }
}

alter();
