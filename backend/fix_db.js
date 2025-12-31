const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const pool = require('./conexion');

console.log('DB URL Length:', (process.env.DATABASE_URL || '').length);

async function run() {
    try {
        await pool.query('ALTER TABLE progresivas ADD COLUMN IF NOT EXISTS fecha_ejecucion DATE;');
        await pool.query("ALTER TABLE progresivas ALTER COLUMN estado SET DEFAULT 'pendiente';");
        // Also ensure kml_trazado_id is present as per previous context mentions, just in case
        await pool.query('ALTER TABLE progresivas ADD COLUMN IF NOT EXISTS kml_trazado_id INTEGER;');

        console.log('SUCCESS: Schema updated');
    } catch (e) {
        console.error('FAIL:', e.message);
    } finally {
        pool.end();
    }
}
run();
