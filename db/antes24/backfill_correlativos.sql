-- SCRIPT DE ACTUALIZACIÓN PARA ENSAYOS EXISTENTES (VERSIÓN ROBUSTA)
-- Ejecutar DESPUÉS de aplicar la migración 008 y DESPUÉS de desplegar el nuevo código del backend.

BEGIN;

-- Usamos Common Table Expressions (CTEs) para calcular todo en un solo paso.
WITH correlativos AS (
    -- 1. Se calcula el número secuencial para cada ensayo dentro de su tipo.
    SELECT
        id,
        ROW_NUMBER() OVER(PARTITION BY tipo_ensayo ORDER BY id) as nuevo_correlativo
    FROM ensayos
),
nuevos_codigos AS (
    -- 2. Se une todo para generar el nuevo código de ensayo.
    SELECT
        e.id as ensayo_id,
        c.nuevo_correlativo,
        CONCAT(
            COALESCE(p.codigo, 'CU'),
            LPAD((CASE WHEN POSITION('-' IN tr.codigo) > 0 THEN SPLIT_PART(tr.codigo, '-', 2) ELSE tr.codigo END), 3, '0'),
            LPAD((CASE WHEN POSITION('-' IN prog.codigo) > 0 THEN SPLIT_PART(prog.codigo, '-', 2) ELSE prog.codigo END), 5, '0'),
            LPAD(ppe.orden::text, 1, '0'),
            LPAD(te.codigo::text, 2, '0'),
            LPAD(c.nuevo_correlativo::text, 3, '0') -- Se usa el correlativo calculado en el paso 1.
        ) as nuevo_codigo_ensayo
    FROM ensayos e
    JOIN correlativos c ON e.id = c.id
    JOIN progresiva_perfil_estratos ppe ON e.estrato_id = ppe.id
    JOIN progresivas prog ON ppe.progresiva_id = prog.id
    JOIN progresivas tr ON prog.parent_id = tr.id
    JOIN proyectos p ON prog.proyecto_id = p.id
    JOIN tipo_ensayo te ON e.tipo_ensayo = te.id
)
-- 3. Se actualiza la tabla ensayos con los datos calculados en los CTEs.
-- Esto se hace en una sola operación para evitar problemas de visibilidad en la transacción.
UPDATE ensayos
SET
    correlativo_tipo_ensayo = nuevos_codigos.nuevo_correlativo,
    codigo_ensayo = nuevos_codigos.nuevo_codigo_ensayo
FROM nuevos_codigos
WHERE ensayos.id = nuevos_codigos.ensayo_id;

COMMIT;

-- FIN DEL SCRIPT