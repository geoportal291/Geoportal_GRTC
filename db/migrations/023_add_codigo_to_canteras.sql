-- 023_refactor_canteras_codigo_per_tramo.sql
-- Reemplaza la migración anterior para implementar correctamente códigos secuenciales por tramo para las canteras.

BEGIN;

-- 1. Añadir la columna 'tramo_id' que puede ser nula temporalmente.
-- Esta columna referenciará directamente al tramo (que es una progresiva con parent_id NULL).
ALTER TABLE canteras ADD COLUMN tramo_id INTEGER REFERENCES progresivas(id) ON DELETE SET NULL;

-- 2. Rellenar la nueva columna 'tramo_id' para las canteras existentes.
-- Se busca el tramo a través de la progresiva de referencia que ya existe.
UPDATE canteras c
SET tramo_id = p.parent_id
FROM progresivas p
WHERE c.id_progresiva_referencia = p.id AND c.tramo_id IS NULL;

-- 3. Si la columna 'codigo' no existe de una migración anterior, la añadimos.
-- Usamos DO para evitar errores si el script se corre sobre un estado intermedio.
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='canteras' AND column_name='codigo') THEN
      ALTER TABLE canteras ADD COLUMN codigo VARCHAR(50);
   END IF;
END $$;


-- 4. Rellenar la columna 'codigo' con un número secuencial por tramo.
-- Usamos una CTE (Common Table Expression) con ROW_NUMBER() para generar la secuencia.
WITH numeracion AS (
    SELECT
        id,
        -- ROW_NUMBER() genera un número secuencial para cada grupo (PARTITION BY) de tramo_id, ordenado por id.
        ROW_NUMBER() OVER(PARTITION BY tramo_id ORDER BY id) as rn
    FROM canteras
)
UPDATE canteras c
SET codigo = n.rn::VARCHAR(50)
FROM numeracion n
WHERE c.id = n.id;

-- 5. Ahora que están pobladas, hacer que las columnas no puedan ser nulas.
-- NOTA: Esto fallará si alguna cantera no pudo ser asociada a un tramo.
ALTER TABLE canteras ALTER COLUMN tramo_id SET NOT NULL;
ALTER TABLE canteras ALTER COLUMN codigo SET NOT NULL;

-- 6. Eliminar la restricción de unicidad global si existiera de una versión anterior.
ALTER TABLE canteras DROP CONSTRAINT IF EXISTS uq_canteras_codigo;
ALTER TABLE canteras DROP CONSTRAINT IF EXISTS canteras_codigo_unique;


-- 7. Añadir la restricción de unicidad compuesta para (tramo_id, codigo).
ALTER TABLE canteras ADD CONSTRAINT uq_canteras_tramo_codigo UNIQUE (tramo_id, codigo);

COMMIT;