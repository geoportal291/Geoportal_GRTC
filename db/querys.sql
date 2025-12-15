
ALTER TABLE invvial_canteras ADD COLUMN item_number INTEGER;
ALTER TABLE invvial_fuentes ADD COLUMN item_number INTEGER;

-- Tabla para Se�ales Informativas
CREATE TABLE IF NOT EXISTS senales_informativas (
    id_senal_informativa SERIAL PRIMARY KEY,
    id_proyecto INTEGER,
    codigo VARCHAR(255),
    tipo VARCHAR(255),
    clasificacion VARCHAR(255),
    progresiva VARCHAR(255),
    lado VARCHAR(50),
    soporte VARCHAR(255),
    material VARCHAR(255),
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    altitud DOUBLE PRECISION,
    panel_fotografico_codigo VARCHAR(255),
    entregable VARCHAR(50),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id)
);
    CREATE TABLE senales_preventivas (id_senal_preventiva SERIAL PRIMARY KEY, codigo VARCHAR(255), progresiva VARCHAR(50), lado VARCHAR(50), tipo VARCHAR(100), clasificacion VARCHAR(100), material VARCHAR(100), latitud DECIMAL(10, 8), longitud DECIMAL(11, 8), altitud DECIMAL(10, 2), condicion VARCHAR(100), observaciones TEXT, panel_fotografico_codigo VARCHAR(255), id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE);


CREATE TABLE IF NOT EXISTS hitos_kilometricos (
    id_hito_kilometrico SERIAL PRIMARY KEY,
    codigo VARCHAR(255),
    progresiva VARCHAR(255),
    lado VARCHAR(255),
    tipo VARCHAR(255),
    clasificacion VARCHAR(255),
    material VARCHAR(255),
    latitud NUMERIC,
    longitud NUMERIC,
    altitud NUMERIC,
    observaciones TEXT,
    panel_fotografico_codigo VARCHAR(255),
    id_proyecto INTEGER REFERENCES proyectos(id)
);