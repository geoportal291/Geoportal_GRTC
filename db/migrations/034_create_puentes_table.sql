CREATE TABLE IF NOT EXISTS puentes (
  id_puente SERIAL PRIMARY KEY,
  id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
  entregable VARCHAR(255), -- Col A
  panel_fotografico_codigo VARCHAR(100), -- Col B
  progresiva VARCHAR(50), -- Col C
  nombre VARCHAR(255), -- Col D (Nombre del puente)
  clase VARCHAR(50), -- Col E (Keyword column)
  tipo VARCHAR(50), -- Col F
  estado VARCHAR(50), -- Col G
  numero_vias INTEGER, -- Col H
  tablero VARCHAR(100), -- Col I
  longitud_puente NUMERIC(10, 2), -- Col J
  ancho NUMERIC(10, 2), -- Col K
  latitud NUMERIC(10, 8),
  longitud NUMERIC(11, 8),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_puentes_proyecto ON puentes(id_proyecto);
