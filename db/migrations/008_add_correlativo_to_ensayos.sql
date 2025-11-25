-- Adds the correlativo_tipo_ensayo column to the ensayos table
-- This column will store a sequential number for each ensayo within its type.
ALTER TABLE ensayos ADD COLUMN correlativo_tipo_ensayo INTEGER;
