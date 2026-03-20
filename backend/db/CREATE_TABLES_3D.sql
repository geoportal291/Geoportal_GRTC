-- Tabla para almacenar el listado de modelos 3D (LandXML, IFC, etc.)
CREATE TABLE IF NOT EXISTS modelos_3d (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    tramo_id INTEGER, -- Puede dejarse libre o referenciar a progresivas(id)/tramos(id) dependiendo de la necesidad estricta
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- ej. 'IFC', 'LANDXML'
    url_archivo TEXT NOT NULL,
    tamano_bytes BIGINT,
    metadata JSONB, -- Almacenar resultados de volumetría o de topografía aquí.
    estado VARCHAR(50) DEFAULT 'COMPLETADO', -- EJ: 'PROCESANDO', 'COMPLETADO', 'ERROR'
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subido_por INTEGER REFERENCES usuariost(id) ON DELETE SET NULL
);

-- Ejemplos de índices para optimizar las consultas si hay muchos modelos
CREATE INDEX IF NOT EXISTS idx_modelos3d_proyecto ON modelos_3d(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_modelos3d_tramo ON modelos_3d(tramo_id);
