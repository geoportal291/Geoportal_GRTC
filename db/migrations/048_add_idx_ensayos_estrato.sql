-- =========================================================================
-- MIGRACION 048: Indice sobre ensayos(estrato_id)
-- Fecha: 2026-09-08
-- Proposito: El endpoint GET /api/tramos/:tramoId/perfil-estratigrafico
--   consulta ensayos con WHERE ens.estrato_id = ANY($1::int[]) y puede
--   llegar a ~200 progresivas por request (limit maximo 200). Sin indice,
--   cada request fuerza un seq scan sobre toda la tabla ensayos.
--   Idempotente (IF NOT EXISTS). Sin DROP/DELETE.
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_ensayos_estrato
    ON public.ensayos (estrato_id);
