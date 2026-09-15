-- =========================================================================
-- MIGRACION 047: Columna patron_svg en suelos_diccionario_nlp
-- Soporte para el visor de "perfil estratigrafico" estilo Autodesk.
-- La tabla suelos_diccionario_nlp ya mapea material -> clasificacion ->
-- color; se le anade UNA columna con el patron visual de rayado para el
-- render del perfil estratigrafico.
-- Fecha: 2026-09-08
-- Idempotente: ADD COLUMN IF NOT EXISTS + UPDATE con WHERE patron_svg =
-- 'generico' + constraint agregado condicionalmente via DO block.
-- Sin DROP/TRUNCATE/DELETE.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Nueva columna con DEFAULT 'generico' (las filas existentes heredan
--    el valor por defecto al agregarse la columna NOT NULL).
-- -------------------------------------------------------------------------
ALTER TABLE public.suelos_diccionario_nlp
  ADD COLUMN IF NOT EXISTS patron_svg VARCHAR(50) NOT NULL DEFAULT 'generico';

-- -------------------------------------------------------------------------
-- 2. Clasificacion de las filas existentes segun clasificacion_sucs y
--    nombre_original_excel. Ordenadas de lo mas especifico a lo mas
--    general. Cada UPDATE es idempotente: solo toca filas que siguen
--    en 'generico' (equivale a "no clasificada todavia").
-- -------------------------------------------------------------------------

-- 2.1 Roca fracturada ANTES que roca (mas especifica)
UPDATE public.suelos_diccionario_nlp
SET patron_svg = 'roca_fracturada'
WHERE patron_svg = 'generico'
  AND nombre_original_excel ILIKE '%fracturada%';

-- 2.2 Roca: clasificacion SUCS 'R' o nombre contiene 'roca'
UPDATE public.suelos_diccionario_nlp
SET patron_svg = 'roca'
WHERE patron_svg = 'generico'
  AND (clasificacion_sucs = 'R' OR nombre_original_excel ILIKE '%roca%');

-- 2.3 Afirmado
UPDATE public.suelos_diccionario_nlp
SET patron_svg = 'afirmado'
WHERE patron_svg = 'generico'
  AND nombre_original_excel ILIKE '%afirmado%';

-- 2.4 Relleno / material suelto (antes de la regla general de 'grava',
--     porque "material suelto grava" debe ser relleno, no grava)
UPDATE public.suelos_diccionario_nlp
SET patron_svg = 'relleno'
WHERE patron_svg = 'generico'
  AND nombre_original_excel ILIKE ANY (ARRAY['%material suelto%', '%materia suelto%', '%relleno%']);

-- 2.5 Grava: nombre boloneria (con o sin tilde), nombre contiene 'grava',
--     o clasificacion SUCS GW/GP
UPDATE public.suelos_diccionario_nlp
SET patron_svg = 'grava'
WHERE patron_svg = 'generico'
  AND (
        nombre_original_excel ILIKE ANY (ARRAY['%boloneria%', '%bolonería%', '%grava%'])
     OR clasificacion_sucs LIKE 'GW%'
     OR clasificacion_sucs LIKE 'GP%'
      );

-- 2.6 Arena: clasificacion SUCS SW/SP/SM o nombre contiene 'arena'
UPDATE public.suelos_diccionario_nlp
SET patron_svg = 'arena'
WHERE patron_svg = 'generico'
  AND (
        clasificacion_sucs LIKE ANY (ARRAY['SW%', 'SP%', 'SM%'])
     OR nombre_original_excel ILIKE '%arena%'
      );

-- 2.7 Limo: clasificacion SUCS ML/MH o nombre contiene 'limo'
--     (MH = limo de alta plasticidad, tambien es limo)
UPDATE public.suelos_diccionario_nlp
SET patron_svg = 'limo'
WHERE patron_svg = 'generico'
  AND (
        clasificacion_sucs LIKE ANY (ARRAY['ML%', 'MH%'])
     OR nombre_original_excel ILIKE '%limo%'
      );

-- 2.8 Arcilla: clasificacion SUCS CL/CH o nombre contiene 'arcilla' o
--     'tierra'. Va despues de limo para que "Limo arcilloso" (ML-CL,
--     empieza con ML) quede como limo y "Arcilla limosa" (CL-ML) quede
--     como arcilla.
UPDATE public.suelos_diccionario_nlp
SET patron_svg = 'arcilla'
WHERE patron_svg = 'generico'
  AND (
        clasificacion_sucs LIKE ANY (ARRAY['CL%', 'CH%'])
     OR nombre_original_excel ILIKE ANY (ARRAY['%arcilla%', '%tierra%'])
      );

-- -------------------------------------------------------------------------
-- 3. Constraint CHECK de valores permitidos. PostgreSQL no soporta
--    ADD CONSTRAINT IF NOT EXISTS, por eso se valida primero en
--    pg_constraint (la tabla no tenia ningun CHECK previo, solo la PK y
--    la UNIQUE de nombre_original_excel).
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_suelos_nlp_patron_svg'
      AND conrelid = 'public.suelos_diccionario_nlp'::regclass
  ) THEN
    ALTER TABLE public.suelos_diccionario_nlp
      ADD CONSTRAINT chk_suelos_nlp_patron_svg
      CHECK (patron_svg IN (
        'grava', 'grava_arena', 'arena', 'limo', 'arcilla',
        'roca', 'roca_fracturada', 'relleno', 'afirmado', 'generico'
      ));
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- 4. Seed complementario: nombres de material TAL CUAL aparecen en la
--    columna estratos.nombre (texto libre de campo) y NO existen en el
--    diccionario. Sin estas filas, materiales muy comunes ('Roca',
--    'Afirmado', 'GC', 'GP-GM', 'Material suelto', ...) caerian al patron
--    generico porque el matching no alcanza a los nombres canonicos.
--    Idempotente: ON CONFLICT DO NOTHING (no pisa ediciones previas).
--    Ajustes futuros de color/patron se hacen con UPDATE directo sobre
--    esta tabla (en DB, no en codigo).
-- -------------------------------------------------------------------------
INSERT INTO public.suelos_diccionario_nlp
    (nombre_original_excel, clasificacion_sucs, clasificacion_aashto, color_hex_sugerido, patron_svg, es_verificado_por_humano, fuente_origen_datos)
VALUES
    ('Roca',                        'R',     'N/A',   '#C0392B', 'roca',     true, 'seed_perfil_estratigrafico'),
    ('Afirmado',                    NULL,    'N/A',   '#8B7355', 'afirmado', true, 'seed_perfil_estratigrafico'),
    ('Material suelto',             NULL,    'N/A',   '#909497', 'relleno',  true, 'seed_perfil_estratigrafico'),
    ('Materia suelto grava / CBR',  NULL,    'N/A',   '#85929E', 'relleno',  true, 'seed_perfil_estratigrafico'),
    ('Suelo granular / CBR',        NULL,    'N/A',   '#99A3A4', 'relleno',  true, 'seed_perfil_estratigrafico'),
    ('GP-GM',                       'GP-GM', 'A-1-b', '#E67E22', 'grava',    true, 'seed_perfil_estratigrafico'),
    ('GP-GC',                       'GP-GC', 'A-1-b', '#D35400', 'grava',    true, 'seed_perfil_estratigrafico'),
    ('GC',                          'GC',    'A-2-4', '#5C4033', 'grava',    true, 'seed_perfil_estratigrafico'),
    ('SM',                          'SM',    'A-2-4', '#D4A373', 'arena',    true, 'seed_perfil_estratigrafico'),
    ('SC',                          'SC',    'A-2-6', '#BC6C25', 'arena',    true, 'seed_perfil_estratigrafico'),
    ('Afloramiento rocoso',         'R',     'N/A',   '#A93226', 'roca',     true, 'seed_perfil_estratigrafico')
ON CONFLICT (nombre_original_excel) DO NOTHING;

-- -------------------------------------------------------------------------
-- 5. Verificacion: distribucion de filas por patron_svg
-- -------------------------------------------------------------------------
SELECT patron_svg, count(*) AS total
FROM public.suelos_diccionario_nlp
GROUP BY patron_svg
ORDER BY total DESC, patron_svg;
