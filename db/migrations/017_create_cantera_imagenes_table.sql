CREATE TABLE cantera_imagenes (
    id SERIAL PRIMARY KEY,
    cantera_id INTEGER NOT NULL REFERENCES canteras(id) ON DELETE CASCADE,
    imagen_url TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);