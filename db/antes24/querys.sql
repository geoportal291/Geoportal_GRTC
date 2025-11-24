-- Â¡CUIDADO! Este script eliminarÃ¡ todos los datos existentes en la tabla alcantarillas.
DROP TABLE IF EXISTS alcantarillas;

-- Crea la tabla con la estructura corregida y todas las columnas nuevas.
CREATE TABLE alcantarillas (
    id_alcantarilla SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    tipo VARCHAR(50),
    material VARCHAR(50),
    diametro_lado VARCHAR(50),
    longitud_alcantarilla NUMERIC,
    estado VARCHAR(50),
    observaciones TEXT,
    progresiva VARCHAR(50),
    latitud NUMERIC NOT NULL,
    longitud NUMERIC NOT NULL,
    luz VARCHAR(255),
    alto VARCHAR(255),
    ancho VARCHAR(255),
    altitud VARCHAR(255),
    caracteristicas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Re-crea los Ã­ndices
CREATE INDEX IF NOT EXISTS idx_alcantarillas_id_proyecto ON alcantarillas(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_alcantarillas_progresiva ON alcantarillas(progresiva);

-- Script de actualizaciÃ³n para la tabla alcantarillas
-- Agrega las nuevas columnas si la tabla ya existe y no quieres borrarla.
ALTER TABLE alcantarillas
ADD COLUMN IF NOT EXISTS luz VARCHAR(255),
ADD COLUMN IF NOT EXISTS alto VARCHAR(255),
ADD COLUMN IF NOT EXISTS ancho VARCHAR(255),
ADD COLUMN IF NOT EXISTS altitud VARCHAR(255),
ADD COLUMN IF NOT EXISTS caracteristicas TEXT;

-- =======================================================================
-- INSERCIONES PARA NUEVA OPCIÓN DE MENÚ 'EVENTOS'
-- =======================================================================

-- Asumiendo que el nombre de la tabla es 'navbar_items' (ajustar si es otro)
-- y que los IDs 24 y 25 están disponibles.

-- 1. Inserción para el menú principal "Eventos"
-- El 'link' se establece como 'eventos' para que actúe como un desplegable,
-- siguiendo el patrón de "Ingeniería Básica" y "Configuración".
INSERT INTO navbar_items (id, nombre, link, descripcion, icono)
VALUES (24, 'Eventos', 'eventos', 'Menú principal de Eventos', 'fas fa-calendar-check');

-- 2. Inserción para el submenú "Amigo Secreto"
-- Este apunta a la ruta final que deberá ser configurada en el frontend.
INSERT INTO navbar_items (id, nombre, link, descripcion, icono)
VALUES (25, 'Amigo Secreto', '/eventos/amigo-secreto', 'Submenú de Amigo Secreto', 'fas fa-gift');



-- Obtener usuarios agrupados por proyecto para la selección de participantes del Amigo Secreto
SELECT
    p.id as proyecto_id,
    p.nombre_tramo as proyecto_nombre,
    COALESCE(json_agg(
        json_build_object(
            'id', u.id,
            'nombre', TRIM(CONCAT(u.nombre, ' ', u.ap_paterno, ' ', u.ap_materno))
        ) ORDER BY u.nombre, u.ap_paterno
    ) FILTER (WHERE u.id IS NOT NULL), '[]'::json) as usuarios
FROM
    proyectos p
LEFT JOIN
    proyecto_usuarios pu ON p.id = pu.proyecto_id
LEFT JOIN
    usuariost u ON pu.usuario_id = u.id
GROUP BY
    p.id, p.nombre_tramo

UNION ALL

SELECT
    NULL as proyecto_id,
    'Sin Asignar' as proyecto_nombre,
    COALESCE(json_agg(
        json_build_object(
            'id', u.id,
            'nombre', TRIM(CONCAT(u.nombre, ' ', u.ap_paterno, ' ', u.ap_materno))
        ) ORDER BY u.nombre, u.ap_paterno
    ), '[]'::json) as usuarios
FROM
    usuariost u
WHERE NOT EXISTS (
    SELECT 1 FROM proyecto_usuarios pu WHERE pu.usuario_id = u.id
)
ORDER BY
    proyecto_nombre;
