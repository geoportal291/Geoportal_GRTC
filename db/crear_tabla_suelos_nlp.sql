-- Tabla para entrenar y alimentar el Motor de Inteligencia Artificial (NLP)
-- Contiene el mapeo de nombres "sucios" o de Excel hacia clasificaciones matemáticas SUCS y AASHTO.

CREATE TABLE IF NOT EXISTS public.suelos_diccionario_nlp (
    id SERIAL PRIMARY KEY,
    nombre_original_excel VARCHAR(255) NOT NULL, -- Ej: "Arcila con grava" o "Piedra de 2 pulgadas"
    
    -- Clasificaciones Objetivo Estándar
    clasificacion_sucs VARCHAR(100),             -- Ej: "SC" o "Arena arcillosa"
    clasificacion_aashto VARCHAR(100),           -- Ej: "A-2-4"
    
    -- Visualización en 3D
    color_hex_sugerido VARCHAR(10) DEFAULT '#FFFFFF', -- Color correspondiente (Ej: #A0522D para Arcilla)
    
    -- Control de Aprendizaje y Auditoría
    es_verificado_por_humano BOOLEAN DEFAULT false,   -- True si ya pasó por el ojo de un ingeniero (match 100% seguro)
    fuente_origen_datos VARCHAR(100) DEFAULT 'EXCEL_UPLOADER', 
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Regla para que el NLP no sea engañado con duplicados de la misma palabra mal escrita
    CONSTRAINT uk_nombre_original UNIQUE (nombre_original_excel)
);

-- Índices B-Tree para acelerar las búsquedas de los Workers (Python y Backend Node)
CREATE INDEX IF NOT EXISTS idx_nombre_excel ON public.suelos_diccionario_nlp (nombre_original_excel);
CREATE INDEX IF NOT EXISTS idx_clasificacion_sucs ON public.suelos_diccionario_nlp (clasificacion_sucs);

-- Comentarios documentando la tabla
COMMENT ON TABLE public.suelos_diccionario_nlp IS 'Diccionario de entrenamiento y memoria RAM constante para el motor NLP de suelos. Mapea textos reales a clasificaciones estándar SUCS/AASHTO.';
COMMENT ON COLUMN public.suelos_diccionario_nlp.es_verificado_por_humano IS 'El flujo es: El modelo NLP propone. Si la confianza es alta, el backend lo graba como verificado. Si no, queda en "False" para aprobación.';
