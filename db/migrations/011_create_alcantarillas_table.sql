CREATE TABLE IF NOT EXISTS alcantarillas (
    id_alcantarilla SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    tipo VARCHAR(50),
    material VARCHAR(50),
    diametro_lado VARCHAR(50),
    longitud_alcantarilla NUMERIC,
    estado VARCHAR(50),
    observaciones TEXT,
    progresiva VARCHAR(50),
    latitud NUMERIC NOT NULL,
    longitud NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alcantarillas_id_proyecto ON alcantarillas(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_alcantarillas_progresiva ON alcantarillas(progresiva);
