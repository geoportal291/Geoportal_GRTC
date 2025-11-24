BEGIN;

-- Step 1: Rename old tables as a safety measure instead of dropping them.
-- This must happen BEFORE migrating data from them.
ALTER TABLE progresiva_perfil_estratos RENAME TO _old_progresiva_perfil_estratos;
ALTER TABLE cantera_estratos RENAME TO _old_cantera_estratos;
ALTER TABLE estratos RENAME TO _old_lookup_estratos; -- This is the old lookup table with just names

-- Step 2: Create the new unified 'estratos' table.
CREATE TABLE estratos_new (
    id SERIAL PRIMARY KEY,
    parent_type VARCHAR(50) NOT NULL, -- e.g., 'progresiva', 'cantera'
    parent_id INTEGER NOT NULL,
    nombre VARCHAR(255),
    descripcion TEXT,
    cota_inicial DECIMAL(10, 2),
    cota_final DECIMAL(10, 2),
    orden INTEGER,
    -- Temporarily store old ID for mapping purposes
    _old_progresiva_perfil_estratos_id INTEGER,
    _old_cantera_estratos_id INTEGER
);
CREATE INDEX idx_estratos_parent ON estratos_new (parent_type, parent_id);

COMMENT ON TABLE estratos_new IS 'Tabla unificada para todos los estratos de cualquier entidad (progresivas, canteras, etc.).';
COMMENT ON COLUMN estratos_new.parent_type IS 'El tipo de entidad a la que pertenece el estrato (ej: ''progresiva'', ''cantera'').';
COMMENT ON COLUMN estratos_new.parent_id IS 'El ID de la entidad padre en su tabla correspondiente.';

-- Step 3: Migrate data from '_old_progresiva_perfil_estratos' into the new table.
INSERT INTO estratos_new (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden, _old_progresiva_perfil_estratos_id)
SELECT 
    'progresiva', 
    ppe.progresiva_id, 
    e.nombre, 
    ppe.descripcion, 
    ppe.profundidad_inicial, 
    ppe.profundidad_final, 
    ppe.orden,
    ppe.id -- Store the old ID here
FROM _old_progresiva_perfil_estratos ppe
LEFT JOIN _old_lookup_estratos e ON ppe.estrato_id = e.id;

-- Step 4: Migrate data from '_old_cantera_estratos' into the new table.
INSERT INTO estratos_new (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, _old_cantera_estratos_id)
SELECT 
    'cantera', 
    ce.id_cantera, 
    ce.nombre_estrato, 
    ce.descripcion_material, 
    ce.cota_superior, 
    ce.cota_inferior,
    ce.id -- Store the old ID here
FROM _old_cantera_estratos ce;

-- Step 5: Update the 'ensayos' table to point to the new 'estratos_new' table.
-- Add a new column to hold the new foreign key.
ALTER TABLE ensayos ADD COLUMN new_estrato_id INTEGER;

-- Update the new column for progresiva-related ensayos
UPDATE ensayos
SET new_estrato_id = em.id
FROM estratos_new em
WHERE ensayos.estrato_id = em._old_progresiva_perfil_estratos_id
  AND em.parent_type = 'progresiva';

-- Step 6: Finalize the 'ensayos' table changes.
ALTER TABLE ensayos DROP CONSTRAINT IF EXISTS ensayos_estrato_id_fkey;
ALTER TABLE ensayos DROP COLUMN estrato_id;
ALTER TABLE ensayos RENAME COLUMN new_estrato_id TO estrato_id;
ALTER TABLE ensayos ALTER COLUMN estrato_id SET NOT NULL;
ALTER TABLE ensayos ADD CONSTRAINT ensayos_estrato_id_fkey
FOREIGN KEY (estrato_id) REFERENCES estratos_new(id) ON DELETE CASCADE;

-- Step 7: Clean up the temporary old ID columns from estratos_new
ALTER TABLE estratos_new DROP COLUMN _old_progresiva_perfil_estratos_id, DROP COLUMN _old_cantera_estratos_id;

-- Step 8: Rename the new table to become the official 'estratos' table.
ALTER TABLE estratos_new RENAME TO estratos;

COMMIT;
