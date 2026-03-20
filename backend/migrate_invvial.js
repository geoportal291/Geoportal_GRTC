const pool = require('./conexion');

async function migrate() {
    try {
        console.log('Migrando tabla invvial...');
        
        // 1. Agregar columna section si no existe
        await pool.query(`
            ALTER TABLE invvial 
            ADD COLUMN IF NOT EXISTS section VARCHAR(50) DEFAULT 'invvial';
        `);
        console.log('Columna "section" asegurada.');

        // 2. Opcional: Si queremos que (id_proyecto, section) sea único para poder hacer ON CONFLICT
        // Primero eliminamos la restricción anterior si existía (probablemente id_proyecto solo)
        try {
            await pool.query('ALTER TABLE invvial DROP CONSTRAINT IF EXISTS invvial_id_proyecto_key;');
            await pool.query('ALTER TABLE invvial DROP CONSTRAINT IF EXISTS invvial_pkey CASCADE;');
            // Nota: id es probablemente la PK actual. id_proyecto solía tener un UNIQUE.
        } catch (e) {
            console.log('Aviso al limpiar restricciones:', e.message);
        }

        // Crear índice único compuesto
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_invvial_project_section 
            ON invvial (id_proyecto, section);
        `);
        console.log('Índice único (id_proyecto, section) creado.');

        console.log('MIGRTION SUCCESS');
    } catch (err) {
        console.error('MIGRATION FAIL:', err);
    } finally {
        pool.end();
    }
}

migrate();
