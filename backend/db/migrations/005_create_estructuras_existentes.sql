CREATE TABLE IF NOT EXISTS estructuras_existentes (
    id_estructura SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    progresiva_inicio VARCHAR(20),
    progresiva_final VARCHAR(20),
    latitud_inicio DOUBLE PRECISION,
    longitud_inicio DOUBLE PRECISION,
    latitud_final DOUBLE PRECISION,
    longitud_final DOUBLE PRECISION,
    ancho_calzada VARCHAR(50),
    observaciones TEXT,
    panel_fotografico VARCHAR(50),
    entregable VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_estructuras_existentes_proyecto ON estructuras_existentes(id_proyecto);
