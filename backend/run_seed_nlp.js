const db = require('./conexion');
const fs = require('fs');
const path = require('path');

async function applySeed() {
    const seedPath = path.join(__dirname, '..', 'db', 'seed_suelos_nlp.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');

    try {
        console.log('Aplicando semillas del diccionario NLP...');
        await db.query(sql);
        console.log('✅ Semillas aplicadas correctamente.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al aplicar semillas:', err.message);
        process.exit(1);
    }
}

applySeed();
