CREATE TABLE IF NOT EXISTS interferencias_electricas (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    entregable VARCHAR(50),
    panel_fotografico VARCHAR(50),
    progresiva VARCHAR(20),
    tipo_interferencia VARCHAR(100),
    material VARCHAR(100),
    tension VARCHAR(50),
    lado VARCHAR(20),
    latitud DECIMAL(10, 7),
    longitud DECIMAL(10, 7),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interferencias_proyectos_id ON interferencias_electricas(id_proyecto);
