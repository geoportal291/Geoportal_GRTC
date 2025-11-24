-- ===================================================================================
-- !! IMPORTANTE !! EJECUTAR ESTE SCRIPT UNA ÚNICA VEZ.
-- !! NO VOLVER A EJECUTARLO BAJO NINGUNA CIRCUNSTANCIA !!
--
-- Propósito:
-- Este script actualiza los 'codigo_ensayo' de los ensayos existentes que pertenecen
-- a TRAMOS (aquellos vinculados a 'progresivas') para insertar el código de gestor '1'.
-- Esto alinea los códigos antiguos con la nueva estructura de generación de códigos.
--
-- Lógica de la Actualización:
-- La lógica se basa en la estructura de código definida en el backend (ensayosService.js),
-- que determina que los últimos 11 caracteres de un código de ensayo de tramo corresponden a:
--   - Identificador de Progresiva (5 caracteres)
--   - Orden del Estrato (1 caracter)
--   - Código del Tipo de Ensayo (2 caracteres)
--   - Correlativo del Ensayo (3 caracteres)
--
-- El script inserta el código de gestor '1' (para Tramos) justo antes de estos 11 caracteres.
--
-- Ejemplo de transformación:
-- - Código Antiguo: [PrefijoVariable][SufijoDe11Caracteres]
-- - Código Nuevo:   [PrefijoVariable]1[SufijoDe11Caracteres]
--
-- ===================================================================================

BEGIN;

-- Actualiza los códigos de ensayo para los ensayos asociados a progresivas.
UPDATE ensayos
SET
    codigo_ensayo = LEFT(codigo_ensayo, LENGTH(codigo_ensayo) - 11) || '1' || RIGHT(codigo_ensayo, 11)
WHERE
    id IN (
        -- Selecciona los IDs de los ensayos que pertenecen a un estrato de tipo 'progresiva'
        SELECT e.id
        FROM ensayos e
        JOIN estratos est ON e.estrato_id = est.id
        WHERE est.parent_type = 'progresiva'
    );

-- Si necesitas verificar qué se cambiaría ANTES de confirmar, puedes ejecutar
-- la siguiente consulta en lugar del bloque BEGIN/COMMIT/UPDATE:
/*
SELECT
    e.id,
    e.codigo_ensayo AS codigo_antiguo,
    LEFT(e.codigo_ensayo, LENGTH(codigo_ensayo) - 11) || '1' || RIGHT(e.codigo_ensayo, 11) AS codigo_nuevo
FROM
    ensayos e
JOIN
    estratos est ON e.estrato_id = est.id
WHERE
    est.parent_type = 'progresiva';
*/

COMMIT;
