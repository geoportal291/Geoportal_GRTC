-- Script de Recuperación de Esquema - Geoportal
-- Objetivo: Reconstruir tablas PROYECTOS, PROGRESIVAS, KML y configuraciones faltantes.

BEGIN;

-- 1. Tabla kml_trazados (Dependencia de proyectos)
CREATE TABLE IF NOT EXISTS public.kml_trazados (
    id SERIAL PRIMARY KEY,
    datos_kml TEXT,
    kml_filename VARCHAR(255),
    kml_uploaded_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER
);

-- 2. Tabla proyectos (Core)
CREATE TABLE IF NOT EXISTS public.proyectos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(100),
    nombre_proyecto TEXT,
    descripcion_proyecto TEXT,
    estado VARCHAR(50) DEFAULT 'Activo',
    nombre_tramo VARCHAR(255),
    proyecto_nom VARCHAR(255),
    solicitante VARCHAR(255),
    departamento VARCHAR(100),
    provincia VARCHAR(100),
    distrito VARCHAR(100),
    localidad VARCHAR(255),
    longitud_total NUMERIC,
    progresiva_inicial NUMERIC,
    tipo_via VARCHAR(50),
    intervalo_manual NUMERIC,
    is_interval_manual BOOLEAN DEFAULT FALSE,
    descripcion_larga TEXT,
    create_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    kml_trazado_id INTEGER REFERENCES public.kml_trazados(id) ON DELETE SET NULL,
    url_kml TEXT
);

-- 3. Tabla proyecto_usuarios (Asignaciones)
CREATE TABLE IF NOT EXISTS public.proyecto_usuarios (
    proyecto_id INTEGER NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL,
    rol_proyecto VARCHAR(50) DEFAULT 'view',
    asignado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (proyecto_id, usuario_id)
);

-- 4. Tabla progresivas (Tramos/Sub-tramos)
CREATE TABLE IF NOT EXISTS public.progresivas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES public.proyectos(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES public.progresivas(id) ON DELETE CASCADE,
    codigo VARCHAR(100),
    nombre VARCHAR(255),
    descripcion TEXT,
    progresiva_inicial NUMERIC,
    progresiva_final NUMERIC,
    estado VARCHAR(50) DEFAULT 'pendiente',
    coordenada_este NUMERIC,
    coordenada_norte NUMERIC,
    linea VARCHAR(50),
    longitud_total NUMERIC,
    tipo_via VARCHAR(50),
    intervalo_manual NUMERIC,
    es_principal BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estrato_id INTEGER
);

-- 5. Tabla proyecto_calibracion_tramos
CREATE TABLE IF NOT EXISTS public.proyecto_calibracion_tramos (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES public.proyectos(id) ON DELETE CASCADE,
    nombre_tramo VARCHAR(255),
    progresiva_inicio NUMERIC,
    progresiva_fin NUMERIC
);

-- 6. Tabla system_settings (Configuración Global / 2FA)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Insertar valor por defecto si no existe
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('require_2fa_global', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- 7. Tabla observaciones_invvial
CREATE TABLE IF NOT EXISTS public.observaciones_invvial (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES public.proyectos(id) ON DELETE CASCADE,
    elemento_id INTEGER,
    tipo_elemento VARCHAR(50),
    observacion TEXT,
    usuario_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla senales_reguladoras
CREATE TABLE IF NOT EXISTS public.senales_reguladoras (
    id_senal_reguladora SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES public.proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    progresiva VARCHAR(50),
    lado VARCHAR(50),
    tipo VARCHAR(100),
    clasificacion VARCHAR(100),
    material VARCHAR(100),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    altitud DECIMAL(10,2),
    condicion VARCHAR(50),
    observaciones TEXT,
    panel_fotografico_codigo VARCHAR(100),
    entregable VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Restaurar Foreign Keys faltantes en tablas existentes (ej. Alcantarillas)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alcantarillas') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_alcantarillas_proyecto') THEN
            ALTER TABLE public.alcantarillas 
            ADD CONSTRAINT fk_alcantarillas_proyecto 
            FOREIGN KEY (id_proyecto) REFERENCES public.proyectos(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

COMMIT;


UPDATE usuariost
SET mail_cu_104 = 'renzospro12@gmail.com'
WHERE id = 14;

select * from usuariost


SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'proyectos' 
AND column_name IN ('kml_trazado_id', 'url_kml');

-- Agregar columnas faltantes para 2FA en tabla usuariost
ALTER TABLE public.usuariost
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS verification_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_2fa_verification TIMESTAMP WITH TIME ZONE;