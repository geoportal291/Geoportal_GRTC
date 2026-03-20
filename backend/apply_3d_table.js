const fs = require('fs');
const path = require('path');
const db = require('./conexion');

async function applyMigration() {
    try {
        console.log('Aplicando migracion 3D...');
        const sqlPath = path.join(__dirname, 'db', 'CREATE_TABLES_3D.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await db.query(sql);
        console.log('Migracion aplicada correctamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error aplicando migracion:', err);
        process.exit(1);
    }
}

applyMigration();
