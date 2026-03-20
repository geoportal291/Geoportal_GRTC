const pool = require('./conexion');

async function check() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'proyectos_secciones_kml';
        `);
        if (res.rows.length > 0) {
            console.log('TABLE EXISTS');
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'proyectos_secciones_kml';
            `);
            cols.rows.forEach(c => console.log(`- ${c.column_name}: ${c.data_type}`));
        } else {
            console.log('TABLE DOES NOT EXIST');
        }
    } catch (e) {
        console.error('FAIL:', e.message);
    } finally {
        pool.end();
    }
}
check();
