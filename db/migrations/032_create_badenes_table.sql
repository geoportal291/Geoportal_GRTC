CREATE TABLE IF NOT EXISTS badenes (
  id_baden SERIAL PRIMARY KEY,
  id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
  codigo VARCHAR(50),
  tipo VARCHAR(50),
  material VARCHAR(50),
  diametro_lado VARCHAR(50),
  longitud_baden NUMERIC(10, 2),
  estado VARCHAR(50),
  observaciones TEXT,
  progresiva VARCHAR(50),
  latitud NUMERIC(10, 8),
  longitud NUMERIC(11, 8),
  luz NUMERIC(10, 2),
  alto NUMERIC(10, 2),
  ancho NUMERIC(10, 2),
  altitud NUMERIC(10, 2),
  caracteristicas TEXT,
  clase VARCHAR(50),
  panel_fotografico_codigo VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_badenes_proyecto ON badenes(id_proyecto);
