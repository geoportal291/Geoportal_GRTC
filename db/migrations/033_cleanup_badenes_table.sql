-- 033_cleanup_badenes_table.sql
-- This migration removes unused columns from the 'badenes' table as they are no longer populated by the backend service.

ALTER TABLE badenes
DROP COLUMN IF EXISTS material,
DROP COLUMN IF EXISTS diametro_lado,
DROP COLUMN IF EXISTS longitud_baden,
DROP COLUMN IF EXISTS alto,
DROP COLUMN IF EXISTS altitud,
DROP COLUMN IF EXISTS caracteristicas;
