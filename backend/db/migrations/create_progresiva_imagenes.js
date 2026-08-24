const db = require('../conexion');

const createTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS progresiva_imagenes (
                id SERIAL PRIMARY KEY,
                progresiva_id INTEGER REFERENCES progresivas(id) ON DELETE CASCADE,
                imagen_url TEXT NOT NULL,
                descripcion TEXT,
                nombre_archivo TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;
        await db.query(query);
        console.log("Tabla 'progresiva_imagenes' creada o verificada correctamente.");
        process.exit(0);
    } catch (err) {
        console.error("Error creando tabla:", err);
        process.exit(1);
    }
};

createTable();
