-- Add metadata columns to alcantarillas_graficos table
ALTER TABLE alcantarillas_graficos
ADD COLUMN latitud NUMERIC(10, 8),
ADD COLUMN longitud NUMERIC(11, 8),
ADD COLUMN altitud NUMERIC(10, 2),
ADD COLUMN fecha_hora TIMESTAMP WITH TIME ZONE;

-- Add a comment to describe the change
COMMENT ON COLUMN alcantarillas_graficos.latitud IS 'Latitud extraída de los metadatos EXIF de la imagen.';
COMMENT ON COLUMN alcantarillas_graficos.longitud IS 'Longitud extraída de los metadatos EXIF de la imagen.';
COMMENT ON COLUMN alcantarillas_graficos.altitud IS 'Altitud extraída de los metadatos EXIF de la imagen.';
COMMENT ON COLUMN alcantarillas_graficos.fecha_hora IS 'Fecha y hora de captura extraída de los metadatos EXIF de la imagen.';