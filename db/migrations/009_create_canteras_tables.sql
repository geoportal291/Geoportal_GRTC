-- 009_create_canteras_tables.sql

-- Tabla para almacenar la información principal de las canteras
CREATE TABLE canteras (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    material VARCHAR(255),
    estado VARCHAR(50),
    accesibilidad VARCHAR(100),
    
    -- Ubicación Absoluta (UTM)
    coordenada_este DECIMAL(12, 3),
    coordenada_norte DECIMAL(12, 3),
    
    -- Ubicación Relativa a una Progresiva
    id_progresiva_referencia INTEGER REFERENCES progresivas(id) ON DELETE SET NULL,
    desplazamiento_km DECIMAL(8, 2),
    lado VARCHAR(20) -- 'Izquierda' o 'Derecha'
);

-- Tabla para almacenar los diferentes estratos o mantos dentro de una cantera
CREATE TABLE cantera_estratos (
    id SERIAL PRIMARY KEY,
    id_cantera INTEGER NOT NULL REFERENCES canteras(id) ON DELETE CASCADE,
    nombre_estrato VARCHAR(255) NOT NULL,
    cota_superior DECIMAL(10, 2),
    cota_inferior DECIMAL(10, 2),
    descripcion_material TEXT
);

-- Comentarios para clarificar el propósito de las tablas y columnas
COMMENT ON TABLE canteras IS 'Almacena información sobre las fuentes de materiales (canteras) asociadas a un proyecto.';
COMMENT ON COLUMN canteras.id_progresiva_referencia IS 'ID de la progresiva más cercana usada como punto de referencia.';
COMMENT ON COLUMN canteras.desplazamiento_km IS 'Distancia en kilómetros desde la progresiva de referencia hasta la cantera.';
COMMENT ON COLUMN canteras.lado IS 'Lado de la vía (Izquierda/Derecha) en el que se encuentra la cantera respecto al sentido del kilometraje.';

COMMENT ON TABLE cantera_estratos IS 'Define los diferentes estratos, mantos u horizontes de material dentro de una cantera.';
COMMENT ON COLUMN cantera_estratos.id_cantera IS 'La cantera a la que pertenece este estrato.';
COMMENT ON COLUMN cantera_estratos.cota_superior IS 'Elevación en metros sobre el nivel del mar del techo del estrato.';
COMMENT ON COLUMN cantera_estratos.cota_inferior IS 'Elevación en metros sobre el nivel del mar de la base del estrato.';

