-- ============================================================
-- Migración 049 — Parámetros MTC en el motor de cálculo
-- Fecha: 2026-09-15
-- Propósito:
--   1) Granulometría (config_key='granulometria'): añadir D10/D30/D50/D60
--      (interpolación semilog con calcular_dx), Cu, Cc y TMN
--      (obtener_tmn), según MTC E 107 y los formatos oficiales.
--   2) Límites (config_key='limites'): el Límite Líquido final pasa a
--      método MTC multi-punto: regresión semilog a 25 golpes × 0.996
--      (curva de fluidez), con fallback al método anterior (fila con
--      25 golpes o promedio de ll_corregido) cuando hay <2 puntos.
-- Idempotente: las claves nuevas se agregan por concatenación jsonb y
-- la de límites se reemplaza por jsonb_set (mismo resultado si se
-- re-ejecuta).
-- NOTA: requiere las funciones calcular_dx / obtener_tmn /
-- safeDivide ya registradas en ensayos.calculos.js (motor frontend).
-- ============================================================

-- 1) Granulometría: coeficientes de gradación y TMN
UPDATE tipo_ensayo
SET config_calculos = config_calculos || '{
  "calculated_values.gradacion.d10": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 10)",
  "calculated_values.gradacion.d30": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 30)",
  "calculated_values.gradacion.d50": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 50)",
  "calculated_values.gradacion.d60": "= calcular_dx(tableConfig.tables.granulometria.rows, tables.granulometria, 60)",
  "calculated_values.gradacion.cu": "= safeDivide(calculated_values.gradacion.d60, calculated_values.gradacion.d10, 0)",
  "calculated_values.gradacion.cc": "= safeDivide(pow(calculated_values.gradacion.d30, 2), calculated_values.gradacion.d10 * calculated_values.gradacion.d60, 0)",
  "calculated_values.gradacion.tmn": "= obtener_tmn(tableConfig.tables.granulometria.rows, tables.granulometria, ''acum_retenido_porcentaje'')"
}'::jsonb
WHERE config_key = 'granulometria';

-- 2) Límites: LL final por regresión MTC multi-punto (× 0.996)
UPDATE tipo_ensayo
SET config_calculos = jsonb_set(
    config_calculos,
    '{calculated_values,finales,limite_liquido}',
    '"= (_intermediate.ll_count >= 2 ? (resultados.regresion_ll.ll_25 * 0.996) : (_intermediate.ll_row_25 > 0 ? _intermediate.ll_row_25 : (_intermediate.ll_count > 0 ? _intermediate.ll_sum / _intermediate.ll_count : 0)))"'::jsonb,
    true
)
WHERE config_key = 'limites';
