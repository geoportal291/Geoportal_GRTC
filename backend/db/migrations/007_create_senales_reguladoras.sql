-- Up
CREATE TABLE IF NOT EXISTS senales_reguladoras (
    id_senal_reguladora SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    progresiva VARCHAR(50),
    lado VARCHAR(50),
    tipo VARCHAR(100),
    clasificacion VARCHAR(100),
    material VARCHAR(100),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    altitud DECIMAL(10,2),
    condicion VARCHAR(50),
    observaciones TEXT,
    panel_fotografico_codigo VARCHAR(100),
    entregable VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down
DROP TABLE IF EXISTS senales_reguladoras;
