-- ============================================================
-- Migración 050 — Curva de Proctor por método MTC (cúbica)
-- Fecha: 2026-09-15 13:05
-- Propósito: results.curva del Proctor pasa de regresion_cuadratica
--   (parábola) a proctor_mtc (polinomio cúbico evaluado sobre grilla,
--   igual que el formato oficial MTC E 115). Con <4 puntos la función
--   cae sola al ajuste cuadrático. Mantiene las claves results.curva.x
--   (OCH) y results.curva.y (MDS) para no romper visores ni gráficos.
-- Idempotente: jsonb_set deja el mismo resultado al re-ejecutar.
-- ============================================================

-- OJO: clave plana "results.curva" -> se actualiza por concatenación.
-- El '- 'results'' limpia un artefacto anidado si existiera.
UPDATE tipo_ensayo
SET config_calculos = (config_calculos - 'results') || '{
  "results.curva": "= proctor_mtc([tables.calculo_humedad.m1.humedad, tables.calculo_humedad.m2.humedad, tables.calculo_humedad.m3.humedad, tables.calculo_humedad.m4.humedad], [tables.calculo_humedad.m1.densidad_seca, tables.calculo_humedad.m2.densidad_seca, tables.calculo_humedad.m3.densidad_seca, tables.calculo_humedad.m4.densidad_seca])"
}'::jsonb
WHERE config_key = 'proctor';
