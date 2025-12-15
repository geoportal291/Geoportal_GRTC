-- Add 'identificador' column to 'ensayos' table to support manual linking of assays
-- This column will store values like 'M-1', 'C-1' manually entered by the user
ALTER TABLE ensayos ADD COLUMN identificador VARCHAR(50);

-- Optional: Add an index for faster lookups during import
CREATE INDEX idx_ensayos_identificador ON ensayos(identificador);
