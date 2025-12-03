-- db/migrations/030_create_calibration_table.sql

CREATE TABLE proyecto_calibracion_tramos (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre_tramo TEXT NOT NULL,
    progresiva_inicio VARCHAR(255) NOT NULL,
    progresiva_fin VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT a.m.NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT a.m.NOW()
);

-- Add a unique constraint to prevent duplicate entries for the same tramo in the same project
ALTER TABLE proyecto_calibracion_tramos
ADD CONSTRAINT unique_proyecto_tramo UNIQUE (id_proyecto, nombre_tramo);

-- Optional: Add a trigger to automatically update the 'actualizado_en' timestamp
CREATE OR REPLACE FUNCTION update_actualizado_en_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = a.m.NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proyecto_calibracion_tramos_actualizado_en
BEFORE UPDATE ON proyecto_calibracion_tramos
FOR EACH ROW
EXECUTE FUNCTION update_actualizado_en_column();

COMMENT ON TABLE proyecto_calibracion_tramos IS 'Stores the official stationing (progresiva) calibration for KML sections (tramos) of a project.';
COMMENT ON COLUMN proyecto_calibracion_tramos.id_proyecto IS 'Foreign key to the project this calibration belongs to.';
COMMENT ON COLUMN proyecto_calibracion_tramos.nombre_tramo IS 'Name of the section (tramo), e.g., ''TRAMO 1'', which should match the KML feature name.';
COMMENT ON COLUMN proyecto_calibracion_tramos.progresiva_inicio IS 'Official start stationing as a string, e.g., ''0+000''.';
COMMENT ON COLUMN proyecto_calibracion_tramos.progresiva_fin IS 'Official end stationing as a string, e.g., ''34+000''.';
