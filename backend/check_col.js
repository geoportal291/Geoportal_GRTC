const pool = require('./conexion');

async function check() {
    try {
        await pool.query('SELECT entregable FROM alcantarillas_graficos LIMIT 1');
        console.log('CHECK_RESULT: EXISTS');
    } catch (error) {
        if (error.message.includes('does not exist')) {
            console.log('CHECK_RESULT: MISSING');
        } else {
            console.log('CHECK_RESULT: ERROR - ' + error.message);
        }
    } finally {
        pool.end();
    }
}
check();
