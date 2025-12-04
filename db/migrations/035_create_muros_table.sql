CREATE TABLE IF NOT EXISTS muros (
  id_muro SERIAL PRIMARY KEY,
  id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
  entregable VARCHAR(255), -- Col AP
  panel_fotografico_codigo VARCHAR(100), -- Col AQ
  progresiva VARCHAR(50), -- Col AR
  clase VARCHAR(50), -- Col AS (Obra de Arte / Keyword column)
  material VARCHAR(100), -- Col AT (Tipo de material)
  estado VARCHAR(50), -- Col AU
  lado VARCHAR(50), -- Col AV
  longitud_muro NUMERIC(10, 2), -- Col AW
  alto NUMERIC(10, 2), -- Col AX (Altura)
  ancho NUMERIC(10, 2), -- Col AY
  latitud NUMERIC(10, 8),
  longitud NUMERIC(11, 8),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_muros_proyecto ON muros(id_proyecto);
