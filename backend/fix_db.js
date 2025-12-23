const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const pool = require('./conexion');

console.log('DB URL Length:', (process.env.DATABASE_URL || '').length);

async function run() {
    try {
        await pool.query('ALTER TABLE alcantarillas_graficos ADD COLUMN IF NOT EXISTS entregable VARCHAR(50);');
        console.log('SUCCESS');
    } catch (e) {
        console.error('FAIL:', e.message);
    } finally {
        pool.end();
    }
}
run();
