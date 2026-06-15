-- db/migrations/045_create_fuentes_agua_tables.sql
BEGIN;

-- Tabla para almacenar la información principal de las fuentes de agua
CREATE TABLE fuentes_agua_suelos (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'Activa', -- 'Activa', 'Potencial', 'Inactiva'
    coordenada_este DECIMAL(12, 3),
    coordenada_norte DECIMAL(12, 3),
    id_progresiva_referencia INTEGER REFERENCES progresivas(id) ON DELETE SET NULL,
    desplazamiento_km DECIMAL(8, 2),
    lado VARCHAR(20), -- 'Izquierda', 'Derecha', 'Eje'
    kml_id INTEGER,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    tramo_id INTEGER REFERENCES progresivas(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    propietario VARCHAR(255),
    CONSTRAINT uq_fuentes_agua_tramo_codigo UNIQUE (tramo_id, codigo)
);

-- Tabla para almacenar imágenes de las fuentes de agua
CREATE TABLE fuente_agua_imagenes_suelos (
    id SERIAL PRIMARY KEY,
    fuente_agua_id INTEGER REFERENCES fuentes_agua_suelos(id) ON DELETE CASCADE,
    imagen_url VARCHAR(255) NOT NULL,
    descripcion TEXT,
    nombre_archivo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fuentes_agua_suelos IS 'Almacena información sobre las fuentes de agua asociadas a un proyecto de suelos.';
COMMENT ON TABLE fuente_agua_imagenes_suelos IS 'Almacena las referencias de imágenes para el registro fotográfico de fuentes de agua.';

COMMIT;
