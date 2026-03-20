const db = require('./conexion');

async function createTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS geologia_capas (
                id SERIAL PRIMARY KEY,
                proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
                tab_name VARCHAR(50) NOT NULL,
                file_url TEXT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (proyecto_id, tab_name)
            );
        `;
        await db.query(query);
        console.log("Tabla geologia_capas creada exitosamente.");
    } catch (err) {
        console.error("Error al crear tabla:", err);
    } finally {
        process.exit(0);
    }
}

createTable();
