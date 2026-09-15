

-- =========================================================================
-- CATALOGO DE PATRONES DE ESTRATOS (Perfil estratigrafico estilo Autodesk)
-- Fecha: 2026-09-08  Hora: 11:30
-- Proposito: Tabla de catalogo `estrato_patrones` que mapea el texto libre
-- de `estratos.nombre` a patron SVG, colores USCS y etiqueta corta para el
-- render del perfil estratigrafico. Incluye seed idempotente con los
-- materiales reales del dump (ON CONFLICT DO NOTHING sobre nombre_material).
-- =========================================================================

CREATE TABLE IF NOT EXISTS estrato_patrones (
  id SERIAL PRIMARY KEY,
  nombre_material VARCHAR(255) NOT NULL UNIQUE,
  patron_svg VARCHAR(50) NOT NULL DEFAULT 'generico',
  color_fondo VARCHAR(10) NOT NULL DEFAULT '#FFFFFF',
  color_patron VARCHAR(10) NOT NULL DEFAULT '#333333',
  color_borde VARCHAR(10) NOT NULL DEFAULT '#333333',
  texto_etiqueta VARCHAR(20),
  sinonimos TEXT[] NOT NULL DEFAULT '{}',
  prioridad INTEGER NOT NULL DEFAULT 100,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_estrato_patrones_patron_svg CHECK (
    patron_svg IN (
      'grava', 'grava_arena', 'arena', 'limo', 'arcilla',
      'roca', 'roca_fracturada', 'relleno', 'afirmado', 'generico'
    )
  )
);

-- Indice parcial sobre filas activas, ordenado por prioridad de matching
CREATE INDEX IF NOT EXISTS idx_estrato_patrones_prioridad
  ON estrato_patrones (prioridad) WHERE activo;

-- SEED IDEMPOTENTE (sinonimos en minusculas, sin acentos; prioridad menor = gana)
INSERT INTO estrato_patrones
  (nombre_material, patron_svg, color_fondo, color_patron, color_borde, texto_etiqueta, sinonimos, prioridad)
VALUES
  ('Roca', 'roca', '#FFFFFF', '#C0392B', '#7B241C', 'ROCA',
   ARRAY['roca', 'roca sana', 'afloramiento rocoso', 'piedra'], 10),
  ('Roca fracturada', 'roca_fracturada', '#FFFFFF', '#E74C3C', '#922B21', 'ROCA FRACT.',
   ARRAY['roca fracturada', 'afloramiento de piedras fracturadas', 'fracturada', 'roca fuertemente fracturada'], 5),
  ('Grava limosa (GP-GM)', 'grava', '#FDEBD0', '#E67E22', '#A04000', 'GP-GM',
   ARRAY['gp-gm', 'gp gm', 'grava limosa', 'grava con limo'], 20),
  ('Grava arcillosa (GC)', 'grava', '#FDF2E9', '#D35400', '#873600', 'GC',
   ARRAY['gc', 'grava arcillosa', 'suelo arcilla + grava', 'granular gc', 'suelo arcilla'], 20),
  ('Grava bien graduada (GW)', 'grava', '#F5CBA7', '#B9770E', '#7E5109', 'GW',
   ARRAY['gw', 'grava bien graduada'], 20),
  ('Grava pobremente graduada (GP)', 'grava', '#FAD7A0', '#CA6F1E', '#873600', 'GP',
   ARRAY['gp', 'grava pobremente graduada', 'boloneria', 'boloneria (piedra)'], 25),
  ('Arena limosa (SM)', 'arena', '#FEF9E7', '#B7950B', '#7D6608', 'SM',
   ARRAY['sm', 'arena limosa', 'arena con limo'], 20),
  ('Arena (SP)', 'arena', '#FEF5E7', '#D4AC0D', '#9A7D0A', 'SP',
   ARRAY['sp', 'arena', 'arena bien graduada', 'sw'], 30),
  ('Arcilla (CL)', 'arcilla', '#E8F6F3', '#117A65', '#0B5345', 'CL',
   ARRAY['cl', 'arcilla', 'arcilla de baja plasticidad', 'arcilla de alta plasticidad', 'ch', 'tierra'], 30),
  ('Limo (ML)', 'limo', '#F4ECF7', '#7D3C98', '#4A235A', 'ML',
   ARRAY['ml', 'limo', 'limo de baja plasticidad', 'mh'], 30),
  ('Afirmado', 'afirmado', '#EBE6DD', '#7F6000', '#4A3B10', 'AF',
   ARRAY['afirmado'], 15),
  ('Material suelto', 'relleno', '#F4F6F7', '#909497', '#566573', 'MS',
   ARRAY['material suelto', 'materia suelto', 'relleno', 'suelo granular', 'materia suelto grava'], 25),
  ('Suelo granular / CBR', 'relleno', '#F8F9F9', '#99A3A4', '#566573', 'SG',
   ARRAY['suelo granular / cbr', 'suelo granular/cbr'], 35)
ON CONFLICT (nombre_material) DO NOTHING;

-- Verificacion del seed
SELECT count(*) AS total_patrones FROM estrato_patrones;
