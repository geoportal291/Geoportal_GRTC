-- 013_add_kml_to_canteras.sql

-- Añadir la columna para almacenar la referencia al KML en la tabla de canteras
ALTER TABLE canteras
ADD COLUMN kml_id INTEGER REFERENCES kml_trazados(id) ON DELETE SET NULL;

-- Comentario para clarificar el propósito de la nueva columna
COMMENT ON COLUMN canteras.kml_id IS 'ID del KML asociado a la cantera, almacenado en la tabla kml_trazados.';
