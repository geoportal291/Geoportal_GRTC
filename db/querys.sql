
CREATE TABLE invvial (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER UNIQUE NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    kml_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


	 SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'navbar_options';
select * from invvial


 ALTER TABLE public.elementos_trafico ADD COLUMN proyecto_id INTEGER;


 ALTER TABLE public.elementos_trafico 
   ADD CONSTRAINT fk_proyecto 
  FOREIGN KEY (proyecto_id) 
REFERENCES public.proyectos(id);

 UPDATE public.c SET proyecto_id = 24;


 CREATE TABLE IF NOT EXISTS alcantarillas (
    id_alcantarilla SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    tipo VARCHAR(50),
    material VARCHAR(50),
    diametro_lado VARCHAR(50),
    longitud_alcantarilla NUMERIC,
    estado VARCHAR(50),
    observaciones TEXT,
    progresiva VARCHAR(50),
    latitud NUMERIC NOT NULL,
    longitud NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alcantarillas_id_proyecto ON alcantarillas(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_alcantarillas_progresiva ON alcantarillas(progresiva);
ALTER TABLE invvial
ADD COLUMN IF NOT EXISTS alcantarillas_excel_url TEXT;

ALTER TABLE alcantarillas ADD COLUMN entregable VARCHAR(255);

ALTER USER postgres WITH PASSWORD 'admin1234';

select * from alcantarillas

drop table alcantarillas 

CREATE TABLE alcantarillas_graficos (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    image_index VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Add an index for faster lookups by project and index
CREATE INDEX idx_alcantarillas_graficos_proyecto_id ON alcantarillas_graficos(proyecto_id);
CREATE INDEX idx_alcantarillas_graficos_image_index ON alcantarillas_graficos(image_index);




select * from alcantarillas_graficos 

CREATE TABLE alcantarillas_graficos (
 id SERIAL PRIMARY KEY,
 proyecto_id INTEGER NOT NULL,
 image_index VARCHAR(255) NOT NULL,
 image_url TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

 FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
 );

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'alcantarillas_graficos';

select * from alcantarillas_graficos

delete from alcantarillas_graficos












-- Tabla para almacenar los resultados del OCR de las imágenes de alcantarillas
CREATE TABLE ocr_resultados_alcantarillas (
    id SERIAL PRIMARY KEY,
    alcantarilla_grafico_id INTEGER,
    proyecto_id INTEGER,
    image_url TEXT,
    numero_indice INTEGER,
    fecha_hora TEXT,
    coordenadas_identificador TEXT,
    ubicacion TEXT,
    estacion TEXT,
    ruta TEXT,
    altitud TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alcantarilla_grafico
        FOREIGN KEY(alcantarilla_grafico_id)
        REFERENCES alcantarillas_graficos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_proyecto
        FOREIGN KEY(proyecto_id)
        REFERENCES proyectos(id)
        ON DELETE SET NULL
);

-- Comentario sobre la tabla
COMMENT ON TABLE ocr_resultados_alcantarillas IS 'Almacena los datos extraídos por el proceso de OCR de las imágenes de gráficos de alcantarillas.';

-- Comentarios sobre las columnas
COMMENT ON COLUMN ocr_resultados_alcantarillas.id IS 'Identificador único para cada registro de OCR.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.alcantarilla_grafico_id IS 'ID del registro en la tabla alcantarillas_graficos al que corresponde este OCR.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.proyecto_id IS 'ID del proyecto al que pertenece la imagen.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.image_url IS 'URL de la imagen en Vercel Blob, usada para enlazar con alcantarillas_graficos.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.numero_indice IS 'Número de índice extraído de la imagen.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.fecha_hora IS 'Fecha y hora extraída de la imagen.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.coordenadas_identificador IS 'Coordenadas o identificador geográfico extraído.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.ubicacion IS 'Ubicación (ciudad, región) extraída de la imagen.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.estacion IS 'Código de la estación extraído de la imagen.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.ruta IS 'Nombre o código de la ruta extraído de la imagen.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.altitud IS 'Altitud extraída de la imagen.';
COMMENT ON COLUMN ocr_resultados_alcantarillas.created_at IS 'Fecha y hora de creación del registro.';

select * df
DELETE FROM alcantarillas_graficos



CREATE TABLE processing_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(255) NOT NULL,
    project_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    payload JSONB,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';


CREATE TRIGGER update_processing_jobs_updated_at
BEFORE UPDATE ON processing_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


COMMENT ON COLUMN processing_jobs.job_type IS 'Type of the job, e.g., ''graphics_excel_processing''';
COMMENT ON COLUMN processing_jobs.status IS 'Current status of the job (pending, processing, completed, failed)';
COMMENT ON COLUMN processing_jobs.payload IS 'Data required for the job, e.g., { "fileUrl": "..." }';
COMMENT ON COLUMN processing_jobs.result IS 'Result of the job, e.g., { "message": "..." } or { "error": "..." }';




CREATE TABLE IF NOT EXISTS alcantarillas (
    id_alcantarilla SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    n_de_alcantarilla VARCHAR(50) NOT NULL,
    clase VARCHAR(50),
    tipo VARCHAR(50),
    diametro_seccion VARCHAR(50),
    longitud_metros NUMERIC,
    estado VARCHAR(50),
    observaciones TEXT,
    progresiva VARCHAR(50),
    latitud NUMERIC NOT NULL,
    longitud NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alcantarillas_id_proyecto ON alcantarillas(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_alcantarillas_progresiva ON alcantarillas(progresiva);

ALTER TABLE alcantarillas
ADD COLUMN luz VARCHAR(255),
ADD COLUMN alto VARCHAR(255),
ADD COLUMN ancho VARCHAR(255),
ADD COLUMN altitud VARCHAR(255),
ADD COLUMN caracteristicas TEXT;
DROP TABLE IF EXISTS alcantarillas;



CREATE TABLE alcantarillas (
    id_alcantarilla SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    tipo VARCHAR(50),
    material VARCHAR(50),
    diametro_lado VARCHAR(50),
    longitud_alcantarilla NUMERIC,
    estado VARCHAR(50),
    observaciones TEXT,
    progresiva VARCHAR(50),
    latitud NUMERIC NOT NULL,
    longitud NUMERIC NOT NULL,
    luz VARCHAR(255),
    alto VARCHAR(255),
    ancho VARCHAR(255),
    altitud VARCHAR(255),
    caracteristicas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alcantarillas_id_proyecto ON alcantarillas(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_alcantarillas_progresiva ON alcantarillas(progresiva);
ALTER TABLE alcantarillas
ADD COLUMN IF NOT EXISTS luz VARCHAR(255),
ADD COLUMN IF NOT EXISTS alto VARCHAR(255),
ADD COLUMN IF NOT EXISTS ancho VARCHAR(255),
ADD COLUMN IF NOT EXISTS altitud VARCHAR(255),
ADD COLUMN IF NOT EXISTS caracteristicas TEXT;
ALTER TABLE alcantarillas ADD COLUMN clase VARCHAR(255);



ALTER TABLE alcantarillas ADD COLUMN panel_fotografico_codigo VARCHAR(255);


delete from alcantarillas_graficos
select * from alcantarillas_graficos

select * from navbar_options

INSERT INTO navbar_options (id, nombre, link, descripcion, icono)
VALUES (24, 'Eventos', 'eventos', 'Menu principal de Eventos', 'fas fa-calendar-check');


INSERT INTO navbar_options (id, nombre, link, descripcion, icono)
VALUES (25, 'Amigo Secreto', '/eventos/amigo-secreto', 'Submenu de Amigo Secreto', 'fas fa-gift');

SELECT ID FROM usuariost WHERE nombre LIKE '%WALDIR%';


select id,dni,nombre,ap_paterno,ap_materno from usuariost WHERE dni LIKE '%70316684%';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'amigo_secreto_asignaciones';

	UPDATE usuariost
	SET 
	    dni = '00023000',
	    usuario = 'visitante',
	    password = 'visitante'
	WHERE id = 80;

SELECT * FROM usuariost 
WHERE dni LIKE '%73186884%';

select * from amigo_secreto_asignaciones

SELECT * FROM usuariost 
WHERE nombre LIKE '%NIRELY%';





INSERT INTO usuariost (
    tramo, dni, usuario, password, nombre, ap_paterno, ap_materno,
    correo, mail_cu_104, fecha_ingreso, codigo_esp,
    nivel, subnivel, tipo_user, rol_id,
    creado_en, fecha_nacimiento, telefono, profesion, otros_detalles
) VALUES
('CU-104','70316684','70316684','H70316684','MELANIA','HUMPIRI','SANTUYO',
NULL,NULL,NULL,NULL,3,2,'ASISTENTE',3,NULL,NULL,NULL,NULL,NULL);

INSERT INTO amigo_secreto_asignaciones (evento_id, dador_usuario_id, receptor_usuario_id, creado_en) 
VALUES (1, 77, 55, NOW());


select * from especialidad_visibilidad



INSERT INTO usuariost (
    tramo, dni, usuario, password, nombre, ap_paterno, ap_materno,
    correo, mail_cu_104, fecha_ingreso, codigo_esp, nivel, subnivel,
    tipo_user, rol_id, creado_en, fecha_nacimiento, telefono, profesion, otros_detalles
) VALUES (
    'INV-0001',           -- tramo
    '00023000',           -- dni
    'invitado',           -- usuario
    'invitado',           -- password
    'INVITADO',           -- nombre
    'VISITANTE',          -- ap_paterno
    'TEMPORAL',           -- ap_materno
    NULL,                 -- correo
    NULL,                 -- mail_cu_104
    NOW(),                -- fecha_ingreso
    NULL,                 -- codigo_esp
    3,                    -- nivel
    3,                    -- subnivel
    'VISITANTE',          -- tipo_user
    8,                    -- rol_id
    NOW(),                -- creado_en
    NULL,                 -- fecha_nacimiento
    NULL,                 -- telefono
    NULL,                 -- profesion
    'Usuario visitante del sistema'
);

select * from roles_permisos
select * from user_permisos


INSERT INTO usuariost (
    tramo, dni, usuario, password, nombre, ap_paterno, ap_materno,
    correo, mail_cu_104, fecha_ingreso, codigo_esp, nivel, subnivel,
    tipo_user, rol_id, creado_en, fecha_nacimiento, telefono, profesion, otros_detalles
) VALUES
('CU-104','70567952','70567952','L70567952','WILSON GREGORIO','LOZANO','QUISPE',
NULL,NULL,NOW(),NULL,2,3,'ASISTENTE',3,NOW(),NULL,NULL,NULL,NULL),

('CU-104','43264750','43264750','H43264750','MARIO','HUAMAN','FLORES',
NULL,NULL,NOW(),NULL,2,3,'ASISTENTE',3,NOW(),NULL,NULL,NULL,NULL),

('CU-104','43264750','43264750','R43264750','ALEXANDRA','RUIZ','QUISPE',
NULL,NULL,NOW(),NULL,2,3,'ASISTENTE',3,NOW(),NULL,NULL,NULL,NULL);




INSERT INTO usuariost (
    tramo, dni, usuario, password, nombre, ap_paterno, ap_materno,
    correo, mail_cu_104, fecha_ingreso, codigo_esp, nivel, subnivel,
    tipo_user, rol_id, creado_en, fecha_nacimiento, telefono, profesion, otros_detalles
) VALUES
('CU-104','43264750','43264750','H43264750','MARIO','HUAMAN','FLORES',
NULL,NULL,NULL,NULL,3,2,'ASISTENTE',3,NOW(),NULL,NULL,NULL,NULL),
('CU-104','73897368','73897368','R73897368','ALEXANDRA','RUIZ','QUISPE',
NULL,NULL,NULL,NULL,3,2,'ASISTENTE',3,NOW(),NULL,NULL,NULL,NULL),
('CU-1596','46696846','46696846','Q46696846','KATHYA','QUISPE','PALOMINO',
NULL,NULL,NULL,NULL,3,2,'ASISTENTE',3,NOW(),NULL,NULL,NULL,NULL),
('CU-104','70567952','70567952','L70567952','WILSON GREGORIO','LOZANO','QUISPE',
NULL,NULL,NULL,NULL,3,2,'ASISTENTE',3,NOW(),NULL,NULL,NULL,NULL);


sele

select id,dni,nombre,ap_paterno,ap_materno from usuariost


INSERT INTO amigo_secreto_asignaciones (evento_id, dador_usuario_id, receptor_usuario_id, creado_en) VALUES
(1, 93, 65, NOW()),
(1, 92, 53, NOW()),
(1, 90, 11, NOW()),
(1, 91, 74, NOW()); 


-- 1. Quitamos a quien le estaba regalando a MOISES (ID 72) antes (era el 74)
DELETE FROM amigo_secreto_asignaciones WHERE evento_id = 1 AND receptor_usuario_id = 72;

-- 2. Quitamos a quien le estaba regalando JOEL (ID 65) antes (era el 5)
DELETE FROM amigo_secreto_asignaciones WHERE evento_id = 1 AND dador_usuario_id = 65;

-- 3. Insertamos la pareja correcta: JOEL (65) -> MOISES (72)
INSERT INTO amigo_secreto_asignaciones (evento_id, dador_usuario_id, receptor_usuario_id, creado_en) 
VALUES (1, 65, 72, NOW());

SELECT * FROM usuariost WHERE id = 76;



INSERT INTO amigo_secreto_asignaciones (evento_id, dador_usuario_id, receptor_usuario_id, creado_en) 
VALUES (1, 68, 91, NOW());



select * from usuariost

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'badenes';


-- 1. Borramos a quien le estuviera regalando Elvis antes
DELETE FROM amigo_secreto_asignaciones WHERE evento_id = 1 AND dador_usuario_id = 76;

-- 2. Insertamos la pareja correcta: ELVIS (76) -> KATIA (92)
INSERT INTO amigo_secreto_asignaciones (evento_id, dador_usuario_id, receptor_usuario_id, creado_en) 
VALUES (1, 76, 92, NOW());


-- db/migrations/030_create_calibration_table.sql

CREATE TABLE proyecto_calibracion_tramos (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre_tramo TEXT NOT NULL,
    progresiva_inicio VARCHAR(255) NOT NULL,
    progresiva_fin VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a unique constraint to prevent duplicate entries for the same tramo in the same project
ALTER TABLE proyecto_calibracion_tramos
ADD CONSTRAINT unique_proyecto_tramo UNIQUE (id_proyecto, nombre_tramo);

-- Optional: Add a trigger to automatically update the 'actualizado_en' timestamp
CREATE OR REPLACE FUNCTION update_actualizado_en_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = a.m.NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proyecto_calibracion_tramos_actualizado_en
BEFORE UPDATE ON proyecto_calibracion_tramos
FOR EACH ROW
EXECUTE FUNCTION update_actualizado_en_column();

COMMENT ON TABLE proyecto_calibracion_tramos IS 'Stores the official stationing (progresiva) calibration for KML sections (tramos) of a project.';
COMMENT ON COLUMN proyecto_calibracion_tramos.id_proyecto IS 'Foreign key to the project this calibration belongs to.';
COMMENT ON COLUMN proyecto_calibracion_tramos.nombre_tramo IS 'Name of the section (tramo), e.g., ''TRAMO 1'', which should match the KML feature name.';
COMMENT ON COLUMN proyecto_calibracion_tramos.progresiva_inicio IS 'Official start stationing as a string, e.g., ''0+000''.';
COMMENT ON COLUMN proyecto_calibracion_tramos.progresiva_fin IS 'Official end stationing as a string, e.g., ''34+000''.';

select * from proyecto_calibracion_tramos

select * from invvial_excels



-- 031_create_invvial_excels_table.sql

CREATE TABLE invvial_excels (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL,
    excel_url VARCHAR(255) NOT NULL,
    entregable_num INTEGER NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by_user_id INTEGER,
    original_filename VARCHAR(255),
    CONSTRAINT fk_proyecto
        FOREIGN KEY(id_proyecto)
        REFERENCES proyectos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY(uploaded_by_user_id)
        REFERENCES usuariost(id)
        ON DELETE SET NULL
);

-- Adding a unique constraint to prevent duplicate entries for the same project and entregable number
ALTER TABLE invvial_excels
ADD CONSTRAINT uq_proyecto_entregable UNIQUE (id_proyecto, entregable_num);

COMMENT ON TABLE invvial_excels IS 'Stores URLs of Excel files related to invvial projects, uploaded via the system.';
COMMENT ON COLUMN invvial_excels.id IS 'Unique identifier for the Excel file record.';
COMMENT ON COLUMN invvial_excels.id_proyecto IS 'Foreign key to the projects table, linking the file to a specific project.';
COMMENT ON COLUMN invvial_excels.excel_url IS 'URL of the uploaded Excel file, typically stored on a cloud service like Vercel Blob.';
COMMENT ON COLUMN invvial_excels.entregable_num IS 'Identifier for the deliverable number (e.g., 1, 2, 3).';
COMMENT ON COLUMN invvial_excels.uploaded_at IS 'Timestamp of when the file was uploaded.';
COMMENT ON COLUMN invvial_excels.uploaded_by_user_id IS 'Foreign key to the users table, identifying who uploaded the file.';
COMMENT ON COLUMN invvial_excels.original_filename IS 'The original name of the uploaded file.';





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
ALTER TABLE badenes ADD COLUMN entregable VARCHAR(255);

select * from badenes


ALTER TABLE badenes
DROP COLUMN IF EXISTS material,
DROP COLUMN IF EXISTS diametro_lado,
DROP COLUMN IF EXISTS longitud_baden,
DROP COLUMN IF EXISTS alto,
DROP COLUMN IF EXISTS altitud,
DROP COLUMN IF EXISTS caracteristicas;

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

select * from invvial

select * from kml_trazados


-- Creación de tabla para Canteras
CREATE TABLE IF NOT EXISTS invvial_canteras (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL,
    entregable VARCHAR(255),
    panel_fotografico VARCHAR(255),
    progresiva VARCHAR(255),
    latitud NUMERIC(15, 8),
    longitud NUMERIC(15, 8),
    altitud VARCHAR(255),
    lado VARCHAR(255),
    propietario VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de tabla para Fuentes de Agua
CREATE TABLE IF NOT EXISTS invvial_fuentes (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL,
    entregable VARCHAR(255),
    panel_fotografico VARCHAR(255),
    progresiva VARCHAR(255),
    latitud NUMERIC(15, 8),
    longitud NUMERIC(15, 8),
    altitud VARCHAR(255),
    ubicacion VARCHAR(255),
    lado VARCHAR(255),
    propietario VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
select * from invvial_fuentes


ALTER TABLE invvial_canteras ADD COLUMN item_number INTEGER;
ALTER TABLE invvial_fuentes ADD COLUMN item_number INTEGER;



CREATE TABLE zonas_criticas (
    id_zona_critica SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL,
    codigo VARCHAR(50),
    progresiva VARCHAR(50),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    altitud VARCHAR(50),
    lado VARCHAR(50),
    longitud_zona VARCHAR(50),
    observaciones TEXT,
    tipo VARCHAR(255),
    clase_dano VARCHAR(50),
    condicion VARCHAR(50),
    panel_fotografico_codigo VARCHAR(255),
    entregable VARCHAR(50)
);


select * from zonas_criticas
DELETE FROM alcantarillas
WHERE id_alcantarilla = 24;


ALTER TABLE zonas_criticas
ADD COLUMN numero_seguimiento INTEGER DEFAULT 1;

-- If 'tipo' was missing or needed changes, we would do it here, but it exists.
-- Adding comment to verify connection.
COMMENT ON COLUMN zonas_criticas.numero_seguimiento IS '1 for Left Zone (B-G), 2 for Right Zone (L-P)';


select * from alcantarillas



CREATE TABLE IF NOT EXISTS estructuras_existentes (
    id_estructura SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    progresiva_inicio VARCHAR(20),
    progresiva_final VARCHAR(20),
    latitud_inicio DOUBLE PRECISION,
    longitud_inicio DOUBLE PRECISION,
    latitud_final DOUBLE PRECISION,
    longitud_final DOUBLE PRECISION,
    ancho_calzada VARCHAR(50),
    observaciones TEXT,
    panel_fotografico VARCHAR(50),
    entregable VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_estructuras_existentes_proyecto ON estructuras_existentes(id_proyecto);


CREATE TABLE IF NOT EXISTS interferencias_electricas (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    entregable VARCHAR(50),
    panel_fotografico VARCHAR(50),
    progresiva VARCHAR(20),
    tipo_interferencia VARCHAR(100),
    material VARCHAR(100),
    tension VARCHAR(50),
    lado VARCHAR(20),
    latitud DECIMAL(10, 7),
    longitud DECIMAL(10, 7),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interferencias_proyectos_id ON interferencias_electricas(id_proyecto);





select * from proyectos



	 SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'proyectos';

CREATE TABLE IF NOT EXISTS senales_informativas (
    id_senal_informativa SERIAL PRIMARY KEY,
    id_proyecto INTEGER,
    codigo VARCHAR(255),
    tipo VARCHAR(255),
    clasificacion VARCHAR(255),
    progresiva VARCHAR(255),
    lado VARCHAR(50),
    soporte VARCHAR(255),
    material VARCHAR(255),
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    altitud DOUBLE PRECISION,
    panel_fotografico_codigo VARCHAR(255),
    entregable VARCHAR(50),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id)
);




drop table senales_informativas

select * from senales_informativas


CREATE TABLE senales_preventivas (
    id_senal_preventiva SERIAL PRIMARY KEY,
    codigo VARCHAR(255),
    progresiva VARCHAR(50),
    lado VARCHAR(50),
    tipo VARCHAR(100),
    clasificacion VARCHAR(100),
    material VARCHAR(100),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    altitud DECIMAL(10, 2),
    condicion VARCHAR(100),
    observaciones TEXT,
    panel_fotografico_codigo VARCHAR(255),
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE
);


select * from senales_preventivas





CREATE TABLE IF NOT EXISTS hitos_kilometricos (
    id_hito_kilometrico SERIAL PRIMARY KEY,
    codigo VARCHAR(255),
    progresiva VARCHAR(255),
    lado VARCHAR(255),
    tipo VARCHAR(255),
    clasificacion VARCHAR(255),
    material VARCHAR(255),
    latitud NUMERIC,
    longitud NUMERIC,
    altitud NUMERIC,
    observaciones TEXT,
    panel_fotografico_codigo VARCHAR(255),
    id_proyecto INTEGER REFERENCES proyectos(id)
);

ALTER TABLE senales_preventivas ADD COLUMN entregable VARCHAR(255);

select * from hitos_kilometricos

select * from invvial

select * from proyectos

ALTER TABLE alcantarillas ADD COLUMN entregable VARCHAR(255);
ALTER TABLE senales_preventivas ADD COLUMN entregable VARCHAR(255);
ALTER TABLE hitos_kilometricos ADD COLUMN entregable VARCHAR(255);

-- Creaci�n de tabla para Se�ales Reguladoras (Faltante)
CREATE TABLE IF NOT EXISTS senales_reguladoras (
    id_senal_reguladora SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fix para endpoint POST /anuncios - Eliminaci�n de campo duracion_horas
INSERT INTO anuncios (titulo, contenido, fecha_inicio, fecha_fin, usuario_id, creador_id, archivo_url)
VALUES (, , , , , , )
RETURNING *;

-- Query para obtener solo anuncios activos (dentro del rango de fechas)
SELECT a.id, a.titulo, a.contenido,
    a.fecha_inicio,
    a.fecha_fin,
    COALESCE(creador.nombre, '') || ' ' || COALESCE(creador.ap_paterno, '') || ' ' || COALESCE(creador.ap_materno, '') as autor,
    COALESCE(asignado.nombre, '') || ' ' || COALESCE(asignado.ap_paterno, '') || ' ' || COALESCE(asignado.ap_materno, '') as asignado_a,
    a.archivo_url,
    a.usuario_id
FROM anuncios a
LEFT JOIN usuariost creador ON a.creador_id = creador.id
LEFT JOIN usuariost asignado ON a.usuario_id = asignado.id
WHERE CURRENT_DATE BETWEEN a.fecha_inicio::date AND a.fecha_fin::date
ORDER BY a.fecha_inicio DESC;
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


-- =========================================================================
-- MODULO GEOLOGIA (Nuevas Tablas Dinamicas)
-- =========================================================================

-- Tabla de Canteras
CREATE TABLE IF NOT EXISTS geo_canteras (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(150),
    material_tipo VARCHAR(100),
    uso_previsto VARCHAR(150),
    volumen_estimado VARCHAR(50),
    estado_ambiental VARCHAR(50),
    latitud NUMERIC(10, 6),
    longitud NUMERIC(10, 6),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Fuentes de Agua
CREATE TABLE IF NOT EXISTS geo_fuentes_agua (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre_cuerpo VARCHAR(150),
    caudal VARCHAR(50),
    calidad_obs TEXT,
    uso_previsto VARCHAR(150),
    tipo_fuente VARCHAR(50), -- Permanente / Estacional
    latitud NUMERIC(10, 6),
    longitud NUMERIC(10, 6)
);

-- Tabla de DMEs (Depositos de Material Excedente)
CREATE TABLE IF NOT EXISTS geo_dmes (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    ubicacion VARCHAR(100),
    area_ha NUMERIC(10, 2),
    capacidad_m3 NUMERIC(15, 2),
    tipo_terreno VARCHAR(150),
    latitud NUMERIC(10, 6),
    longitud NUMERIC(10, 6)
);

-- Tabla de Puntos Criticos (Geodinamica)
CREATE TABLE IF NOT EXISTS geo_puntos_criticos (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    tipo_proceso VARCHAR(100), -- Deslizamiento, Huayco, Derrumbe
    nivel_riesgo VARCHAR(50),  -- Alto, Medio, Bajo
    descripcion TEXT,
    control_estructural BOOLEAN DEFAULT false,
    latitud NUMERIC(10, 6),
    longitud NUMERIC(10, 6)
);

-- Tabla de Taludes Criticos (Estabilidad de Taludes)
CREATE TABLE IF NOT EXISTS geo_taludes_criticos (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    ubicacion_progresiva VARCHAR(50),
    fs_estatico NUMERIC(5, 2),
    fs_pseudoestatico NUMERIC(5, 2),
    condicion_estabilidad VARCHAR(50), -- Estable, Marginal, Inestable
    recomendacion_obra TEXT,
    latitud NUMERIC(10, 6),
    longitud NUMERIC(10, 6)
);



-- Geologia Capas
CREATE TABLE IF NOT EXISTS geologia_capas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    tab_name VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proyecto_id, tab_name)
);


-- Tabla para almacenar las capas (KML/KMZ) del módulo de Geología
CREATE TABLE IF NOT EXISTS geologia_capas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    tab_name VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proyecto_id, tab_name)
);


-- GEOLOGIA: Agregar columna geojson_data para shapefiles convertidos
ALTER TABLE geologia_capas ADD COLUMN IF NOT EXISTS geojson_data JSONB;
- -   A c t u a l i z a c i � n   d e   g e o l o g i a _ m u e s t r a s 
 A L T E R   T A B L E   g e o l o g i a _ m u e s t r a s   R E N A M E   C O L U M N   t i p o   T O   t i p o _ r o c a ; 
 A L T E R   T A B L E   g e o l o g i a _ m u e s t r a s   R E N A M E   C O L U M N   p r o f u n d i d a d   T O   f o r m a c i o n _ l i t o l o g i c a ; 
 A L T E R   T A B L E   g e o l o g i a _ m u e s t r a s   A L T E R   C O L U M N   f o r m a c i o n _ l i t o l o g i c a   T Y P E   V A R C H A R ( 1 5 0 ) ;  
 
-- ==========================================
-- CLASIFICACION DE MATERIALES
-- ==========================================
CREATE TABLE IF NOT EXISTS clasificacion_materiales (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    prog_inicio VARCHAR(20),
    prog_fin VARCHAR(20),
    descripcion_geotecnica VARCHAR(150),
    simbolo VARCHAR(10),
    tramo_m NUMERIC(10,2),
    pct_roca_fija NUMERIC(5,2),
    pct_roca_suelta NUMERIC(5,2),
    pct_material_suelto NUMERIC(5,2),
    corte_talud VARCHAR(100),
    long_roca_fija NUMERIC(10,2),
    long_roca_suelta NUMERIC(10,2),
    long_material_suelto NUMERIC(10,2),
    porcentaje NUMERIC(5,2),
    grupo_formacion TEXT,
    descripcion_detallada TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para gestionar KMLs por sección (Tráfico, Inventario Vial, etc)
CREATE TABLE IF NOT EXISTS proyectos_secciones_kml (
    id SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL,
    seccion VARCHAR(50) NOT NULL,
    kml_url TEXT NOT NULL,
    UNIQUE(id_proyecto, seccion)
);

-- INSERT KML trafico en proyectos_secciones_kml (2026-03-19)
INSERT INTO proyectos_secciones_kml (id_proyecto, seccion, kml_url)
VALUES (1, 'trafico', 'https://6ytk0cgnuwntlh3t.public.blob.vercel-storage.com/tramoinv/1764685078654_tramofinalinvvial.kml');

-- INSERT KML trafico corregido para id_proyecto=24 (Proyecto Quellouno) (2026-03-19)
INSERT INTO proyectos_secciones_kml (id_proyecto, seccion, kml_url)
VALUES (24, 'trafico', 'https://6ytk0cgnuwntlh3t.public.blob.vercel-storage.com/tramoinv/1764685078654_tramofinalinvvial.kml');

-- INSERT KML geologia para id_proyecto=24 (Proyecto Quellouno) (2026-03-19)
INSERT INTO proyectos_secciones_kml (id_proyecto, seccion, kml_url)
VALUES (24, 'geologia', 'https://6ytk0cgnuwntlh3t.public.blob.vercel-storage.com/tramoinv/1764685078654_tramofinalinvvial.kml');

-- [PANEL FOTOGRAFICO] Tabla para registro de fotos georeferenciadas extra�das de KMZ
CREATE TABLE IF NOT EXISTS geologia_fotos_panel (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre TEXT,
    descripcion TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    image_url TEXT NOT NULL,
    original_filename TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MODIFICACIÓN PARA PERMITIR MÚLTIPLES CAPAS GEOLÓGICAS POR PESTAÑA (25/03/2026)
-- 1. Buscar el nombre de la restricción única:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'geologia_capas'::regclass AND contype = 'u';

-- 2. Eliminar la restricción (el nombre estándar suele ser geologia_capas_proyecto_id_tab_name_key):
ALTER TABLE geologia_capas DROP CONSTRAINT IF EXISTS geologia_capas_proyecto_id_tab_name_key;
[ M O D U L O  
 G E O L O G � A ]  
 R e n o m b r a r  
 u n a  
 c a p a  
 e s p e c � f i c a  
 U s o :  
 C a m b i a  
 N u e v o   N o m b r e  
 p o r  
 e l  
 n o m b r e  
 d e s e a d o  
 : p r o y e c t o _ i d  
 p o r  
 e l  
 I D  
 d e l  
 p r o y e c t o  
 y  
 : t a b _ n a m e  
 p o r  
 e l  
 i d e n t i f i c a d o r  
 d e  
 l a  
 c a p a .  
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
 -- Agregar columna drive_url a la tabla geologia_capas si no existe
ALTER TABLE geologia_capas ADD COLUMN IF NOT EXISTS drive_url TEXT;

-- Ejemplo para actualizar el link de la carpeta de Geotecnia para un proyecto espec�fico
-- Reemplazar 'LINK_AQUI' por la URL de Google Drive y :proyecto_id por el ID real
UPDATE geologia_capas 
SET drive_url = 'LINK_AQUI' 
WHERE proyecto_id = :proyecto_id AND tab_name = 'GEOTECNIA';
