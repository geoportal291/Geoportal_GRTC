
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;

CREATE TABLE public.anuncios (
    id integer NOT NULL,
    titulo character varying(200) NOT NULL,
    contenido text NOT NULL,
    fecha_publicacion timestamp without time zone DEFAULT now(),
    duracion_horas integer NOT NULL,
    fecha_expiracion timestamp without time zone NOT NULL,
    usuario_id integer,
    archivo_url text
);
CREATE SEQUENCE public.anuncios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.anuncios_id_seq OWNED BY public.anuncios.id;

CREATE TABLE public.auditoria (
    id integer NOT NULL,
    usuario_id integer,
    accion character varying(100),
    detalles text,
    creado_en timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;

CREATE TABLE public.changelogs (
    id integer NOT NULL,
    version character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    release_date timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.changelogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.changelogs_id_seq OWNED BY public.changelogs.id;

CREATE TABLE public.codigo_departamentos (
    codigo_departamento character(2) NOT NULL,
    nombre character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.distritos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo_distrito character(6) NOT NULL,
    codigo_provincia character(4) NOT NULL
);
CREATE SEQUENCE public.distritos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.distritos_id_seq OWNED BY public.distritos.id;

CREATE TABLE public.elementos_trafico (
    id character varying(10) NOT NULL,
    tipo character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    ubicacion character varying(255),
    coordenadas character varying(255),
    altitud numeric(10,2),
    descripcion text
);

CREATE TABLE public.ensayos (
    id integer NOT NULL,
    ubicacion character varying(100),
    fecha date,
    resultado character varying(100),
    estado character varying(100),
    id_departamento integer,
    codigo_tramo integer,
    tipo_via integer,
    tipo_ensayo_codigo integer,
    progresiva integer,
    estrato_id integer,
    codigo_generado character varying(25),
    tipo_ensayo integer
);
CREATE SEQUENCE public.ensayos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.ensayos_id_seq OWNED BY public.ensayos.id;

CREATE TABLE public.especialidad_visibilidad (
    id integer NOT NULL,
    codigo_esp integer,
    nivel integer,
    tipo_user character varying(50)
);
CREATE SEQUENCE public.especialidad_visibilidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.especialidad_visibilidad_id_seq OWNED BY public.especialidad_visibilidad.id;

CREATE TABLE public.especialidades (
    codigo_esp integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean
);
CREATE SEQUENCE public.especialidades_codigo_esp_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.especialidades_codigo_esp_seq OWNED BY public.especialidades.codigo_esp;

CREATE TABLE public.especialidades_navbar_options (
    id integer NOT NULL,
    especialidad_id integer,
    navbar_option_id integer,
    visible boolean DEFAULT true
);
CREATE SEQUENCE public.especialidades_navbar_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.especialidades_navbar_options_id_seq OWNED BY public.especialidades_navbar_options.id;

CREATE SEQUENCE public.estratos_codigo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.estratos (
    id integer NOT NULL,
    codigo character(7) DEFAULT lpad((nextval('public.estratos_codigo_seq'::regclass))::text, 7, '0'::text) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    color character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    profundidad_inicial numeric(10,3),
    profundidad_final numeric(10,3)
);
CREATE SEQUENCE public.estratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.estratos_id_seq OWNED BY public.estratos.id;

CREATE TABLE public.navbar_options (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    link character varying(255) NOT NULL,
    descripcion text,
    icono character varying(255)
);
CREATE SEQUENCE public.navbar_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.navbar_options_id_seq OWNED BY public.navbar_options.id;

CREATE TABLE public.permisos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);
CREATE SEQUENCE public.permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;

CREATE TABLE public.progresiva_perfil_estratos (
    id integer NOT NULL,
    progresiva_id integer,
    estrato_id integer,
    profundidad_inicial numeric(10,3) NOT NULL,
    profundidad_final numeric(10,3) NOT NULL,
    orden integer NOT NULL,
    tipo_via integer,
    descripcion text
);
CREATE SEQUENCE public.progresiva_perfil_estratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.progresiva_perfil_estratos_id_seq OWNED BY public.progresiva_perfil_estratos.id;

CREATE TABLE public.progresivas (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    progresiva_inicial character varying(20) NOT NULL,
    progresiva_final character varying(20) NOT NULL,
    estado character varying(20) NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    creado_por integer,
    proyecto_id integer,
    estrato_id integer,
    tipo_via integer,
    tipo_ensayo integer,
    batch_uuid uuid,
    parent_id integer,
    coordenada_este numeric(10,6),
    coordenada_norte numeric(10,6),
    linea character varying(255),
    intervalo_manual numeric,
    longitud_total numeric,
    CONSTRAINT progresivas_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying, 'completado'::character varying])::text[])))
);
CREATE SEQUENCE public.progresivas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.progresivas_id_seq OWNED BY public.progresivas.id;

CREATE TABLE public.provincias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo_provincia character(4) NOT NULL,
    codigo_departamento character(2) NOT NULL
);
CREATE SEQUENCE public.provincias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.provincias_id_seq OWNED BY public.provincias.id;

CREATE TABLE public.proyectos (
    id integer NOT NULL,
    codigo character varying(255),
    nombre_proyecto character varying(255),
    descripcion_proyecto text,
    estado character varying(50),
    nombre_tramo character varying(255),
    proyecto_nom character varying(255),
    solicitante character varying(255),
    departamento character varying(255),
    provincia character varying(255),
    distrito character varying(255),
    localidad character varying(255),
    longitud_total numeric,
    progresiva_inicial character varying(50),
    tipo_via character varying(50),
    intervalo_manual numeric,
    descripcion_larga text,
    create_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE SEQUENCE public.proyectos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.proyectos_id_seq OWNED BY public.proyectos.id;

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);
CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;

CREATE TABLE public.roles_navbar_options (
    id integer NOT NULL,
    role_id integer,
    navbar_option_id integer,
    visible boolean DEFAULT true
);
CREATE SEQUENCE public.roles_navbar_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.roles_navbar_options_id_seq OWNED BY public.roles_navbar_options.id;

CREATE TABLE public.roles_permisos (
    id integer NOT NULL,
    rol_id integer,
    permiso_id integer,
    tipo_acceso character varying(20) DEFAULT 'lectura'::character varying NOT NULL
);
CREATE SEQUENCE public.roles_permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.roles_permisos_id_seq OWNED BY public.roles_permisos.id;

CREATE TABLE public.rutas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    geom public.geometry(LineString,4326) NOT NULL
);
CREATE SEQUENCE public.rutas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.rutas_id_seq OWNED BY public.rutas.id;

CREATE TABLE public.tipo_ensayo (
    id integer NOT NULL,
    codigo integer NOT NULL,
    descripcion character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE SEQUENCE public.tipo_ensayo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tipo_ensayo_id_seq OWNED BY public.tipo_ensayo.id;

CREATE TABLE public.tipo_via (
    id integer NOT NULL,
    descripcion character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    codigo character(7) NOT NULL
);
CREATE SEQUENCE public.tipo_via_codigo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tipo_via_codigo_seq OWNED BY public.tipo_via.codigo;
CREATE SEQUENCE public.tipo_via_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tipo_via_id_seq OWNED BY public.tipo_via.id;

CREATE TABLE public.trafico_imagenes (
    id integer NOT NULL,
    station_id character varying(10) NOT NULL,
    image_url text NOT NULL,
    description text,
    upload_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    source_type character varying(50) DEFAULT 'estacion_control'::character varying
);
CREATE SEQUENCE public.trafico_imagenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.trafico_imagenes_id_seq OWNED BY public.trafico_imagenes.id;

CREATE TABLE public.tusuarios (
    id integer NOT NULL,
    usuario character varying(50),
    password character varying(50)
);
CREATE SEQUENCE public.tusuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tusuarios_id_seq OWNED BY public.tusuarios.id;

CREATE TABLE public.user_permisos (
    id integer NOT NULL,
    user_id integer,
    permiso_id integer,
    tipo_acceso character varying(20) NOT NULL
);
CREATE SEQUENCE public.user_permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.user_permisos_id_seq OWNED BY public.user_permisos.id;

CREATE TABLE public.usuariost (
    id integer NOT NULL,
    tramo character varying(10),
    dni character varying(15) NOT NULL,
    usuario character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    nombre character varying(100),
    ap_paterno character varying(100),
    ap_materno character varying(100),
    correo character varying(150),
    mail_cu_104 character varying(150),
    fecha_ingreso date,
    codigo_esp integer,
    nivel integer,
    subnivel integer,
    tipo_user character varying(50),
    rol_id integer,
    creado_en timestamp without time zone DEFAULT now()
);
CREATE SEQUENCE public.usuariost_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.usuariost_id_seq OWNED BY public.usuariost.id;

ALTER TABLE ONLY public.anuncios ALTER COLUMN id SET DEFAULT nextval('public.anuncios_id_seq'::regclass);
ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);
ALTER TABLE ONLY public.changelogs ALTER COLUMN id SET DEFAULT nextval('public.changelogs_id_seq'::regclass);
ALTER TABLE ONLY public.distritos ALTER COLUMN id SET DEFAULT nextval('public.distritos_id_seq'::regclass);
ALTER TABLE ONLY public.ensayos ALTER COLUMN id SET DEFAULT nextval('public.ensayos_id_seq'::regclass);
ALTER TABLE ONLY public.especialidad_visibilidad ALTER COLUMN id SET DEFAULT nextval('public.especialidad_visibilidad_id_seq'::regclass);
ALTER TABLE ONLY public.especialidades ALTER COLUMN codigo_esp SET DEFAULT nextval('public.especialidades_codigo_esp_seq'::regclass);
ALTER TABLE ONLY public.especialidades_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.especialidades_navbar_options_id_seq'::regclass);
ALTER TABLE ONLY public.estratos ALTER COLUMN id SET DEFAULT nextval('public.estratos_id_seq'::regclass);
ALTER TABLE ONLY public.navbar_options ALTER COLUMN id SET DEFAULT nextval('public.navbar_options_id_seq'::regclass);
ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);
ALTER TABLE ONLY public.progresiva_perfil_estratos ALTER COLUMN id SET DEFAULT nextval('public.progresiva_perfil_estratos_id_seq'::regclass);
ALTER TABLE ONLY public.progresivas ALTER COLUMN id SET DEFAULT nextval('public.progresivas_id_seq'::regclass);
ALTER TABLE ONLY public.provincias ALTER COLUMN id SET DEFAULT nextval('public.provincias_id_seq'::regclass);
ALTER TABLE ONLY public.proyectos ALTER COLUMN id SET DEFAULT nextval('public.proyectos_id_seq'::regclass);
ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);
ALTER TABLE ONLY public.roles_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.roles_navbar_options_id_seq'::regclass);
ALTER TABLE ONLY public.roles_permisos ALTER COLUMN id SET DEFAULT nextval('public.roles_permisos_id_seq'::regclass);
ALTER TABLE ONLY public.rutas ALTER COLUMN id SET DEFAULT nextval('public.rutas_id_seq'::regclass);
ALTER TABLE ONLY public.tipo_ensayo ALTER COLUMN id SET DEFAULT nextval('public.tipo_ensayo_id_seq'::regclass);
ALTER TABLE ONLY public.tipo_via ALTER COLUMN id SET DEFAULT nextval('public.tipo_via_id_seq'::regclass);
ALTER TABLE ONLY public.tipo_via ALTER COLUMN codigo SET DEFAULT lpad((nextval('public.tipo_via_codigo_seq'::regclass))::text, 7, '0');
ALTER TABLE ONLY public.trafico_imagenes ALTER COLUMN id SET DEFAULT nextval('public.trafico_imagenes_id_seq'::regclass);
ALTER TABLE ONLY public.tusuarios ALTER COLUMN id SET DEFAULT nextval('public.tusuarios_id_seq'::regclass);
ALTER TABLE ONLY public.user_permisos ALTER COLUMN id SET DEFAULT nextval('public.user_permisos_id_seq'::regclass);
ALTER TABLE ONLY public.usuariost ALTER COLUMN id SET DEFAULT nextval('public.usuariost_id_seq'::regclass);

COPY public.anuncios (id, titulo, contenido, fecha_publicacion, duracion_horas, fecha_expiracion, usuario_id, archivo_url) FROM stdin;
25	aaa	aa	2025-07-22 17:49:49.881	1	2025-07-22 18:49:49.882	1	https://res.cloudinary.com/dbobw1xh4/raw/upload/v1753206588/anuncios/458cbac1-fa5a-475f-a899-ce91c4177a18.pdf
\.
COPY public.auditoria (id, usuario_id, accion, detalles, creado_en) FROM stdin;
\.
COPY public.changelogs (id, version, title, content, release_date) FROM stdin;
1	0.1.0-alpha.1	probando	-prueba\n-prueba\n-prueba\n-prueba\n-prueba	2025-07-18 23:56:02.704914
\.
COPY public.codigo_departamentos (codigo_departamento, nombre, created_at, updated_at) FROM stdin;
01	Amazonas	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
\.
COPY public.distritos (id, nombre, codigo_distrito, codigo_provincia) FROM stdin;
\.
COPY public.elementos_trafico (id, tipo, nombre, ubicacion, coordenadas, altitud, descripcion) FROM stdin;
E-01	estacion	Estación 01 (E-01)	Kilómetro 0+000 - Intersección con carretera CU-105	767536.33 E, 8604420.13 N	927.00	Se localiza en el kilómetro 0+000 km, definida como el punto de inicio del tramo en estudio. Corresponde a la intersección con la carretera departamental CU-105.
\.
COPY public.ensayos (id, ubicacion, fecha, resultado, estado, id_departamento, codigo_tramo, tipo_via, tipo_ensayo_codigo, progresiva, estrato_id, codigo_generado, tipo_ensayo) FROM stdin;
24	Cusco	2025-07-25	45%	Pendiente	\N	\N	\N	\N	\N	\N	\N	20
\.
COPY public.especialidad_visibilidad (id, codigo_esp, nivel, tipo_user) FROM stdin;
\.
COPY public.especialidades (codigo_esp, nombre, descripcion, activo) FROM stdin;
1	TOPOGRAFICO		t
\.
COPY public.especialidades_navbar_options (id, especialidad_id, navbar_option_id, visible) FROM stdin;
\.
COPY public.estratos (id, codigo, nombre, descripcion, color, created_at, updated_at, profundidad_inicial, profundidad_final) FROM stdin;
1	0000001	Capa Vegetal	Estrato superficial compuesto por tierra orgánica, raíces y vegetación.	Marrón oscuro	2025-07-21 22:04:21.551312	2025-07-21 22:04:21.551312	\N	\N
\.
COPY public.navbar_options (id, nombre, link, descripcion, icono) FROM stdin;
1	Inicio	/coordinador/cordinadords	Página principal del coordinador	fas fa-home
\.
COPY public.permisos (id, nombre, descripcion) FROM stdin;
1	crear_usuarios	Puede crear usuarios y asignar nivel de acceso
\.
COPY public.progresiva_perfil_estratos (id, progresiva_id, estrato_id, profundidad_inicial, profundidad_final, orden, tipo_via, descripcion) FROM stdin;
21	861	2	0.000	5.000	1	\N	tierra
\.
COPY public.progresivas (id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, creado_en, actualizado_en, creado_por, proyecto_id, estrato_id, tipo_via, tipo_ensayo, batch_uuid, parent_id, coordenada_este, coordenada_norte, linea, intervalo_manual, longitud_total) FROM stdin;
861	PROG-ntyw9-43c			0+000	78+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	500	\N	\N	\N	\N	\N	18L	\N	\N
\.
COPY public.provincias (id, nombre, codigo_provincia, codigo_departamento) FROM stdin;
\.
COPY public.proyectos (id, codigo, nombre_proyecto, descripcion_proyecto, estado, nombre_tramo, proyecto_nom, solicitante, departamento, provincia, distrito, localidad, longitud_total, progresiva_inicial, tipo_via, intervalo_manual, descripcion_larga, create_at, update_at) FROM stdin;
1	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	85520	0+000	500	\N		2025-08-07 20:42:53.739003	2025-08-07 20:42:53.739003
\.
COPY public.roles (id, nombre, descripcion) FROM stdin;
1	COORDINADOR PROYECTO	Usuario con acceso completo a todas las especialidades
\.
COPY public.roles_navbar_options (id, role_id, navbar_option_id, visible) FROM stdin;
206	6	16	f
\.
COPY public.roles_permisos (id, rol_id, permiso_id, tipo_acceso) FROM stdin;
17	2	2	lectura
\.
COPY public.rutas (id, nombre, descripcion, geom) FROM stdin;
1	Ruta Principal CU-104	Trazado de la carretera CU-104 desde el km 0+000 hasta el km 86+364.66	0102000020E610000058000000A3E6ABE4632252C0162F1686C83929C0F90E23298E2252C0E86E3205C63929C0B7AD77C9492252C0FC7E7BE8CC3729C03348669A552252C04D350E50753729C0BBB4E1B0342252C0A7CF0EB8AE3429C069465046262252C0DCEFF55A753229C0C693933FCE2152C0B9D5BD5F163029C0D53439C65F2152C0637AC2120F3029C088ABB992532152C071C63027682F29C00D648742952152C05BC70270FD2D29C0688709B4052252C071E5EC9DD12E29C083D08B248B2252C05287CBE8DE2F29C0CE458D53BE2252C0672783A3E43129C0F697DD93872252C08A0C61EB082E29C06A0B19D95F2252C0E2804C21462A29C0291197D2692252C0CB30EE06D12629C0FBA42435FE2152C0BB9A3C65352529C0BE61ECCEA42152C0E131F268992329C0F90E23298E2252C0E86E3205C63929C0B7AD77C9492252C0FC7E7BE8CC3729C03348669A552252C04D350E50753729C0BBB4E1B0342252C0A7CF0EB8AE3429C069465046262252C0DCEFF55A753229C0C693933FCE2152C0B9D5BD5F163029C0D53439C65F2152C0637AC2120F3029C088ABB992532152C071C63027682F29C00D648742952152C05BC70270FD2D29C0688709B4052252C071E5EC9DD12E29C083D08B248B2252C05287CBE8DE2F29C0CE458D53BE2252C0672783A3E43129C0F697DD93872252C08A0C61EB082E29C06A0B19D95F2252C0E2804C21462A29C0291197D2692252C0CB30EE06D12629C0FBA42435FE2152C0BB9A3C65352529C0BE61ECCEA42152C0E131F268992329C0
\.
COPY public.tipo_ensayo (id, codigo, descripcion, created_at) FROM stdin;
2	1	ANALISIS GRANULOMETRICO DE AGREGADOS	2025-07-14 16:23:14
\.
COPY public.tipo_via (id, descripcion, created_at, codigo) FROM stdin;
100	TIPO I - Autopistas (100m)	2025-08-15 16:20:32.498593	T1     
\.
COPY public.trafico_imagenes (id, station_id, image_url, description, upload_date, created_at, updated_at, source_type) FROM stdin;
67	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/reportconteo/E-01_1755106278796.xlsx	Excel Conteo Vehicular	2025-08-13	2025-08-13 17:31:20.270592+00	2025-08-13 17:31:20.270592+00	conteo_vehicular_excel
\.
COPY public.tusuarios (id, usuario, password) FROM stdin;
1	admin	1234
\.
COPY public.user_permisos (id, user_id, permiso_id, tipo_acceso) FROM stdin;
4	26	7	lectura
\.
COPY public.usuariost (id, tramo, dni, usuario, password, nombre, ap_paterno, ap_materno, correo, mail_cu_104, fecha_ingreso, codigo_esp, nivel, subnivel, tipo_user, rol_id, creado_en) FROM stdin;
1	CU - 104	72538918	72538918	M72538918	EDSON FERNANDO	MEZA	DUMAN	fernando.duman1993@gmail.com	bim.coordinador.cu104@gmail.com	2025-07-01	\N	1	1	COORDINADOR PROYECTO	1	2025-07-03 21:24:16.668899
\.

ALTER TABLE ONLY public.anuncios ADD CONSTRAINT anuncios_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.auditoria ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.changelogs ADD CONSTRAINT changelogs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.changelogs ADD CONSTRAINT changelogs_version_key UNIQUE (version);
ALTER TABLE ONLY public.codigo_departamentos ADD CONSTRAINT codigo_departamentos_pkey PRIMARY KEY (codigo_departamento);
ALTER TABLE ONLY public.distritos ADD CONSTRAINT distritos_codigo_distrito_key UNIQUE (codigo_distrito);
ALTER TABLE ONLY public.distritos ADD CONSTRAINT distritos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.elementos_trafico ADD CONSTRAINT elementos_trafico_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ensayos ADD CONSTRAINT ensayos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.especialidad_visibilidad ADD CONSTRAINT especialidad_visibilidad_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.especialidades_navbar_options ADD CONSTRAINT especialidades_navbar_options_especialidad_id_navbar_option_key UNIQUE (especialidad_id, navbar_option_id);
ALTER TABLE ONLY public.especialidades_navbar_options ADD CONSTRAINT especialidades_navbar_options_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.especialidades ADD CONSTRAINT especialidades_pkey PRIMARY KEY (codigo_esp);
ALTER TABLE ONLY public.estratos ADD CONSTRAINT estratos_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.estratos ADD CONSTRAINT estratos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.navbar_options ADD CONSTRAINT navbar_options_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.permisos ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.progresiva_perfil_estratos ADD CONSTRAINT progresiva_perfil_estratos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.progresiva_perfil_estratos ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_orden_key UNIQUE (progresiva_id, orden);
ALTER TABLE ONLY public.progresivas ADD CONSTRAINT progresivas_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.progresivas ADD CONSTRAINT progresivas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.provincias ADD CONSTRAINT provincias_codigo_provincia_key UNIQUE (codigo_provincia);
ALTER TABLE ONLY public.provincias ADD CONSTRAINT provincias_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.proyectos ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.roles_navbar_options ADD CONSTRAINT roles_navbar_options_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.roles_permisos ADD CONSTRAINT roles_permisos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rutas ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tipo_ensayo ADD CONSTRAINT tipo_ensayo_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tipo_via ADD CONSTRAINT tipo_via_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.trafico_imagenes ADD CONSTRAINT trafico_imagenes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tusuarios ADD CONSTRAINT tusuarios_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.navbar_options ADD CONSTRAINT unique_navbar_option_link UNIQUE (link);
ALTER TABLE ONLY public.roles_navbar_options ADD CONSTRAINT unique_role_navbar_option UNIQUE (role_id, navbar_option_id);
ALTER TABLE ONLY public.tipo_via ADD CONSTRAINT uq_tipo_via_codigo UNIQUE (codigo);
ALTER TABLE ONLY public.user_permisos ADD CONSTRAINT user_permisos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_permisos ADD CONSTRAINT user_permisos_user_id_permiso_id_tipo_acceso_key UNIQUE (user_id, permiso_id, tipo_acceso);
ALTER TABLE ONLY public.usuariost ADD CONSTRAINT usuariost_dni_key UNIQUE (dni);
ALTER TABLE ONLY public.usuariost ADD CONSTRAINT usuariost_pkey PRIMARY KEY (id);
CREATE INDEX idx_trafico_imagenes_station_id ON public.trafico_imagenes USING btree (station_id);
ALTER TABLE ONLY public.anuncios ADD CONSTRAINT anuncios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);
ALTER TABLE ONLY public.auditoria ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);
ALTER TABLE ONLY public.distritos ADD CONSTRAINT distritos_codigo_provincia_fkey FOREIGN KEY (codigo_provincia) REFERENCES public.provincias(codigo_provincia);
ALTER TABLE ONLY public.especialidad_visibilidad ADD CONSTRAINT especialidad_visibilidad_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);
ALTER TABLE ONLY public.especialidades_navbar_options ADD CONSTRAINT especialidades_navbar_options_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(codigo_esp);
ALTER TABLE ONLY public.especialidades_navbar_options ADD CONSTRAINT especialidades_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);
ALTER TABLE ONLY public.progresivas ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.progresivas ADD CONSTRAINT fk_progresivas_tipo_ensayo FOREIGN KEY (tipo_ensayo) REFERENCES public.tipo_ensayo(id);
ALTER TABLE ONLY public.progresivas ADD CONSTRAINT fk_progresivas_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);
ALTER TABLE ONLY public.trafico_imagenes ADD CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES public.elementos_trafico(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ensayos ADD CONSTRAINT fk_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);
ALTER TABLE ONLY public.progresiva_perfil_estratos ADD CONSTRAINT progresiva_perfil_estratos_estrato_id_fkey FOREIGN KEY (estrato_id) REFERENCES public.estratos(id);
ALTER TABLE ONLY public.progresiva_perfil_estratos ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_fkey FOREIGN KEY (progresiva_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.progresivas ADD CONSTRAINT progresivas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuariost(id);
ALTER TABLE ONLY public.progresivas ADD CONSTRAINT progresivas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.progresivas(id);
ALTER TABLE ONLY public.provincias ADD CONSTRAINT provincias_codigo_departamento_fkey FOREIGN KEY (codigo_departamento) REFERENCES public.codigo_departamentos(codigo_departamento);
ALTER TABLE ONLY public.roles_navbar_options ADD CONSTRAINT roles_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);
ALTER TABLE ONLY public.roles_navbar_options ADD CONSTRAINT roles_navbar_options_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE ONLY public.roles_permisos ADD CONSTRAINT roles_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id);
ALTER TABLE ONLY public.roles_permisos ADD CONSTRAINT roles_permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);
ALTER TABLE ONLY public.user_permisos ADD CONSTRAINT user_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_permisos ADD CONSTRAINT user_permisos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuariost(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.usuariost ADD CONSTRAINT usuariost_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);
ALTER TABLE ONLY public.usuariost ADD CONSTRAINT usuariost_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);

