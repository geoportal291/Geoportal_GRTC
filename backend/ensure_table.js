require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('Checking table proyectos_secciones_kml...');
        const res = await pool.query(`
            CREATE TABLE IF NOT EXISTS proyectos_secciones_kml (
                id SERIAL PRIMARY KEY,
                id_proyecto INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
                seccion VARCHAR(50) NOT NULL,
                kml_url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_proyecto, seccion)
            );
        `);
        console.log('Table ensured.');
        
        const count = await pool.query('SELECT count(*) FROM proyectos_secciones_kml');
        console.log('Current rows:', count.rows[0].count);
        
    } catch (e) {
        console.error('FAIL:', e.message);
    } finally {
        pool.end();
    }
}
check();
