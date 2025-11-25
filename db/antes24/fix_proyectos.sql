-- 1. Elimina la tabla 'proyectos' y sus dependencias (como la llave foránea en 'progresivas')
DROP TABLE IF EXISTS proyectos CASCADE;

-- 2. Crea la tabla 'proyectos' con la estructura correcta que necesita la aplicación
CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(255),
    nombre_proyecto VARCHAR(255),
    descripcion_proyecto TEXT,
    estado VARCHAR(50),
    nombre_tramo VARCHAR(255),
    proyecto_nom VARCHAR(255),
    solicitante VARCHAR(255),
    departamento VARCHAR(255),
    provincia VARCHAR(255),
    distrito VARCHAR(255),
    localidad VARCHAR(255),
    longitud_total NUMERIC,
    progresiva_inicial VARCHAR(50),
    tipo_via VARCHAR(50),
    intervalo_manual NUMERIC,
    descripcion_larga TEXT,
    create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);