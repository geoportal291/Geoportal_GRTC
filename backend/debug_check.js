require('dotenv').config();
const db = require('./conexion');

async function run() {
    try {
        console.log("--- PROJECT 24 DATA ---");
        const proj = await db.query('SELECT * FROM proyectos WHERE id = 24');
        console.log(proj.rows[0]);

        console.log("\n--- USUARIOS WITH 'C-104' OR 'CU - 104' ---");
        // Checking if these values exist in tramo or mail_cu_104 columns as suggested by user
        const users = await db.query(`
            SELECT id, usuario, nombre, ap_paterno, tramo, mail_cu_104 
            FROM usuariost 
            WHERE tramo LIKE '%104%' OR mail_cu_104 LIKE '%104%'
            LIMIT 10
        `);
        console.log(users.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

run();
