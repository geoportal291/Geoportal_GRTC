const pool = require('./conexion');

async function runMigration() {
    try {
        console.log('Running migration: Adding "entregable" column to "alcantarillas_graficos"...');
        await pool.query('ALTER TABLE alcantarillas_graficos ADD COLUMN IF NOT EXISTS entregable VARCHAR(50);');
        console.log('Migration successful: Column added (or already exists).');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        pool.end();
    }
}

runMigration();
