const db = require('./conexion');

async function main() {
    try {
        await db.query(`
            ALTER TABLE estratos
            ADD COLUMN IF NOT EXISTS clasificacion_sucs VARCHAR(255),
            ADD COLUMN IF NOT EXISTS clasificacion_aashto VARCHAR(255),
            ADD COLUMN IF NOT EXISTS color VARCHAR(50);
        `);
        console.log('Columnas NLP agregadas a la tabla estratos correctamente.');
    } catch (err) {
        console.error('Error al alterar tabla estratos:', err);
    } finally {
        process.exit();
    }
}

main();
