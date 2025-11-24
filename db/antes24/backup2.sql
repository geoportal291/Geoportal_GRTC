--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Debian 17.0-1.pgdg110+1)
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: repmgr; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA repmgr;


ALTER SCHEMA repmgr OWNER TO postgres;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anuncios; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.anuncios OWNER TO postgres;

--
-- Name: anuncios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.anuncios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.anuncios_id_seq OWNER TO postgres;

--
-- Name: anuncios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anuncios_id_seq OWNED BY public.anuncios.id;


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditoria (
    id integer NOT NULL,
    usuario_id integer,
    accion character varying(100),
    detalles text,
    creado_en timestamp without time zone DEFAULT now()
);


ALTER TABLE public.auditoria OWNER TO postgres;

--
-- Name: auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_id_seq OWNER TO postgres;

--
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- Name: changelogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.changelogs (
    id integer NOT NULL,
    version character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    release_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.changelogs OWNER TO postgres;

--
-- Name: changelogs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.changelogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.changelogs_id_seq OWNER TO postgres;

--
-- Name: changelogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.changelogs_id_seq OWNED BY public.changelogs.id;


--
-- Name: codigo_departamentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.codigo_departamentos (
    codigo_departamento character(2) NOT NULL,
    nombre character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.codigo_departamentos OWNER TO postgres;

--
-- Name: distritos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.distritos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo_distrito character(6) NOT NULL,
    codigo_provincia character(4) NOT NULL
);


ALTER TABLE public.distritos OWNER TO postgres;

--
-- Name: distritos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.distritos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.distritos_id_seq OWNER TO postgres;

--
-- Name: distritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.distritos_id_seq OWNED BY public.distritos.id;


--
-- Name: elementos_trafico; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.elementos_trafico (
    id character varying(10) NOT NULL,
    tipo character varying(50) NOT NULL,
    nombre character varying(255) NOT NULL,
    ubicacion character varying(255),
    coordenadas character varying(255),
    altitud numeric(10,2),
    descripcion text
);


ALTER TABLE public.elementos_trafico OWNER TO postgres;

--
-- Name: ensayos; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.ensayos OWNER TO postgres;

--
-- Name: ensayos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ensayos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ensayos_id_seq OWNER TO postgres;

--
-- Name: ensayos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ensayos_id_seq OWNED BY public.ensayos.id;


--
-- Name: especialidad_visibilidad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.especialidad_visibilidad (
    id integer NOT NULL,
    codigo_esp integer,
    nivel integer,
    tipo_user character varying(50)
);


ALTER TABLE public.especialidad_visibilidad OWNER TO postgres;

--
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.especialidad_visibilidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.especialidad_visibilidad_id_seq OWNER TO postgres;

--
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidad_visibilidad_id_seq OWNED BY public.especialidad_visibilidad.id;


--
-- Name: especialidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.especialidades (
    codigo_esp integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean
);


ALTER TABLE public.especialidades OWNER TO postgres;

--
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.especialidades_codigo_esp_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.especialidades_codigo_esp_seq OWNER TO postgres;

--
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_codigo_esp_seq OWNED BY public.especialidades.codigo_esp;


--
-- Name: especialidades_navbar_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.especialidades_navbar_options (
    id integer NOT NULL,
    especialidad_id integer,
    navbar_option_id integer,
    visible boolean DEFAULT true
);


ALTER TABLE public.especialidades_navbar_options OWNER TO postgres;

--
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.especialidades_navbar_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.especialidades_navbar_options_id_seq OWNER TO postgres;

--
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_navbar_options_id_seq OWNED BY public.especialidades_navbar_options.id;


--
-- Name: estratos_codigo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.estratos_codigo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estratos_codigo_seq OWNER TO postgres;

--
-- Name: estratos; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.estratos OWNER TO postgres;

--
-- Name: estratos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.estratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estratos_id_seq OWNER TO postgres;

--
-- Name: estratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estratos_id_seq OWNED BY public.estratos.id;


--
-- Name: navbar_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.navbar_options (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    link character varying(255) NOT NULL,
    descripcion text,
    icono character varying(255)
);


ALTER TABLE public.navbar_options OWNER TO postgres;

--
-- Name: navbar_options_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.navbar_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.navbar_options_id_seq OWNER TO postgres;

--
-- Name: navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.navbar_options_id_seq OWNED BY public.navbar_options.id;


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permisos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);


ALTER TABLE public.permisos OWNER TO postgres;

--
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permisos_id_seq OWNER TO postgres;

--
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;


--
-- Name: progresiva_perfil_estratos; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.progresiva_perfil_estratos OWNER TO postgres;

--
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.progresiva_perfil_estratos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progresiva_perfil_estratos_id_seq OWNER TO postgres;

--
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresiva_perfil_estratos_id_seq OWNED BY public.progresiva_perfil_estratos.id;


--
-- Name: progresivas; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.progresivas OWNER TO postgres;

--
-- Name: progresivas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.progresivas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progresivas_id_seq OWNER TO postgres;

--
-- Name: progresivas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresivas_id_seq OWNED BY public.progresivas.id;


--
-- Name: provincias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provincias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo_provincia character(4) NOT NULL,
    codigo_departamento character(2) NOT NULL
);


ALTER TABLE public.provincias OWNER TO postgres;

--
-- Name: provincias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.provincias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.provincias_id_seq OWNER TO postgres;

--
-- Name: provincias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provincias_id_seq OWNED BY public.provincias.id;


--
-- Name: proyectos; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.proyectos OWNER TO postgres;

--
-- Name: proyectos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proyectos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proyectos_id_seq OWNER TO postgres;

--
-- Name: proyectos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proyectos_id_seq OWNED BY public.proyectos.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: roles_navbar_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_navbar_options (
    id integer NOT NULL,
    role_id integer,
    navbar_option_id integer,
    visible boolean DEFAULT true
);


ALTER TABLE public.roles_navbar_options OWNER TO postgres;

--
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_navbar_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_navbar_options_id_seq OWNER TO postgres;

--
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_navbar_options_id_seq OWNED BY public.roles_navbar_options.id;


--
-- Name: roles_permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_permisos (
    id integer NOT NULL,
    rol_id integer,
    permiso_id integer,
    tipo_acceso character varying(20) DEFAULT 'lectura'::character varying NOT NULL
);


ALTER TABLE public.roles_permisos OWNER TO postgres;

--
-- Name: roles_permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_permisos_id_seq OWNER TO postgres;

--
-- Name: roles_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_permisos_id_seq OWNED BY public.roles_permisos.id;


--
-- Name: rutas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rutas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    geom public.geometry(LineString,4326) NOT NULL
);


ALTER TABLE public.rutas OWNER TO postgres;

--
-- Name: rutas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rutas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rutas_id_seq OWNER TO postgres;

--
-- Name: rutas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rutas_id_seq OWNED BY public.rutas.id;


--
-- Name: tipo_ensayo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_ensayo (
    id integer NOT NULL,
    codigo integer NOT NULL,
    descripcion character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tipo_ensayo OWNER TO postgres;

--
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipo_ensayo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipo_ensayo_id_seq OWNER TO postgres;

--
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_ensayo_id_seq OWNED BY public.tipo_ensayo.id;


--
-- Name: tipo_via; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipo_via (
    id integer NOT NULL,
    descripcion character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    codigo character(7) NOT NULL
);


ALTER TABLE public.tipo_via OWNER TO postgres;

--
-- Name: tipo_via_codigo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipo_via_codigo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipo_via_codigo_seq OWNER TO postgres;

--
-- Name: tipo_via_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_via_codigo_seq OWNED BY public.tipo_via.codigo;


--
-- Name: tipo_via_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipo_via_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipo_via_id_seq OWNER TO postgres;

--
-- Name: tipo_via_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_via_id_seq OWNED BY public.tipo_via.id;


--
-- Name: trafico_imagenes; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.trafico_imagenes OWNER TO postgres;

--
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trafico_imagenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trafico_imagenes_id_seq OWNER TO postgres;

--
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trafico_imagenes_id_seq OWNED BY public.trafico_imagenes.id;


--
-- Name: tusuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tusuarios (
    id integer NOT NULL,
    usuario character varying(50),
    password character varying(50)
);


ALTER TABLE public.tusuarios OWNER TO postgres;

--
-- Name: tusuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tusuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tusuarios_id_seq OWNER TO postgres;

--
-- Name: tusuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tusuarios_id_seq OWNED BY public.tusuarios.id;


--
-- Name: user_permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permisos (
    id integer NOT NULL,
    user_id integer,
    permiso_id integer,
    tipo_acceso character varying(20) NOT NULL
);


ALTER TABLE public.user_permisos OWNER TO postgres;

--
-- Name: user_permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_permisos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permisos_id_seq OWNER TO postgres;

--
-- Name: user_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permisos_id_seq OWNED BY public.user_permisos.id;


--
-- Name: usuariost; Type: TABLE; Schema: public; Owner: postgres
--

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


ALTER TABLE public.usuariost OWNER TO postgres;

--
-- Name: usuariost_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuariost_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuariost_id_seq OWNER TO postgres;

--
-- Name: usuariost_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuariost_id_seq OWNED BY public.usuariost.id;


--
-- Name: anuncios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios ALTER COLUMN id SET DEFAULT nextval('public.anuncios_id_seq'::regclass);


--
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- Name: changelogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs ALTER COLUMN id SET DEFAULT nextval('public.changelogs_id_seq'::regclass);


--
-- Name: distritos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos ALTER COLUMN id SET DEFAULT nextval('public.distritos_id_seq'::regclass);


--
-- Name: ensayos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos ALTER COLUMN id SET DEFAULT nextval('public.ensayos_id_seq'::regclass);


--
-- Name: especialidad_visibilidad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad ALTER COLUMN id SET DEFAULT nextval('public.especialidad_visibilidad_id_seq'::regclass);


--
-- Name: especialidades codigo_esp; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades ALTER COLUMN codigo_esp SET DEFAULT nextval('public.especialidades_codigo_esp_seq'::regclass);


--
-- Name: especialidades_navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.especialidades_navbar_options_id_seq'::regclass);


--
-- Name: estratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos ALTER COLUMN id SET DEFAULT nextval('public.estratos_id_seq'::regclass);


--
-- Name: navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options ALTER COLUMN id SET DEFAULT nextval('public.navbar_options_id_seq'::regclass);


--
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);


--
-- Name: progresiva_perfil_estratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos ALTER COLUMN id SET DEFAULT nextval('public.progresiva_perfil_estratos_id_seq'::regclass);


--
-- Name: progresivas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas ALTER COLUMN id SET DEFAULT nextval('public.progresivas_id_seq'::regclass);


--
-- Name: provincias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias ALTER COLUMN id SET DEFAULT nextval('public.provincias_id_seq'::regclass);


--
-- Name: proyectos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos ALTER COLUMN id SET DEFAULT nextval('public.proyectos_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: roles_navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.roles_navbar_options_id_seq'::regclass);


--
-- Name: roles_permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos ALTER COLUMN id SET DEFAULT nextval('public.roles_permisos_id_seq'::regclass);


--
-- Name: rutas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas ALTER COLUMN id SET DEFAULT nextval('public.rutas_id_seq'::regclass);


--
-- Name: tipo_ensayo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_ensayo ALTER COLUMN id SET DEFAULT nextval('public.tipo_ensayo_id_seq'::regclass);


--
-- Name: tipo_via id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via ALTER COLUMN id SET DEFAULT nextval('public.tipo_via_id_seq'::regclass);


--
-- Name: tipo_via codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via ALTER COLUMN codigo SET DEFAULT lpad((nextval('public.tipo_via_codigo_seq'::regclass))::text, 7, '0'::text);


--
-- Name: trafico_imagenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes ALTER COLUMN id SET DEFAULT nextval('public.trafico_imagenes_id_seq'::regclass);


--
-- Name: tusuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tusuarios ALTER COLUMN id SET DEFAULT nextval('public.tusuarios_id_seq'::regclass);


--
-- Name: user_permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos ALTER COLUMN id SET DEFAULT nextval('public.user_permisos_id_seq'::regclass);


--
-- Name: usuariost id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost ALTER COLUMN id SET DEFAULT nextval('public.usuariost_id_seq'::regclass);


--
-- Data for Name: anuncios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anuncios (id, titulo, contenido, fecha_publicacion, duracion_horas, fecha_expiracion, usuario_id, archivo_url) FROM stdin;
25	aaa	aa	2025-07-22 17:49:49.881	1	2025-07-22 18:49:49.882	1	https://res.cloudinary.com/dbobw1xh4/raw/upload/v1753206588/anuncios/458cbac1-fa5a-475f-a899-ce91c4177a18.pdf
26	PRUEBA	PRUEBA	2025-07-24 21:01:55.93	1	2025-07-24 22:01:55.931	1	https://res.cloudinary.com/dbobw1xh4/image/upload/v1753390915/anuncios/cd2509c2-f06a-417c-8b24-69239055667d.png
37	aa	aa	2025-07-25 17:40:06.907	1	2025-07-25 18:40:06.908	1	https://res.cloudinary.com/dbobw1xh4/image/upload/s--XtMxWRd8--/v1/anuncios/115c22b3-e285-4dfb-b12b-027091464a10.pdf?_a=BAMAK+fi0
38	aaxdxdxd	aaa	2025-07-25 17:41:50.654	1	2025-07-25 18:41:50.654	1	https://res.cloudinary.com/dbobw1xh4/image/upload/s--7Wt3o9vf--/v1/anuncios/0050a444-b268-43d7-ba90-b0ccd65f427c.pdf?_a=BAMAK+fi0
39	aaa	aaa	2025-07-26 02:10:35.875	1	2025-07-26 03:10:35.875	1	https://www.dropbox.com/scl/fi/qc7zq5uf6b91e1dh7ygdr/880854a7-e3bf-4e8b-a1a6-5668842a2e9d.pdf?rlkey=ysn9aqob6k9etu9p0mbzbp7qb&dl=0
49	aa	a	2025-07-29 17:06:48.025	1	2025-07-29 18:06:48.025	1	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/Informe_Agente_Seguridad_FIN.pdf
50	XDDXD	1	2025-07-29 17:09:20.919	1	2025-07-29 18:09:20.919	1	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/aaxd.xlsx
51	aa	aaa	2025-07-29 17:16:18.758	1	2025-07-29 18:16:18.758	1	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/Formato%20MTC%20Tramo%202%20Rev1%20R0.1%20%281%29.xlsx
52	aaaxdxddx	aaa	2025-07-29 17:23:36.317	1	2025-07-29 18:23:36.317	1	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/imagen_2025-07-29_122333112.png
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, usuario_id, accion, detalles, creado_en) FROM stdin;
\.


--
-- Data for Name: changelogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.changelogs (id, version, title, content, release_date) FROM stdin;
1	0.1.0-alpha.1	probando	-prueba\n-prueba\n-prueba\n-prueba\n-prueba	2025-07-18 23:56:02.704914
3	0.1.0-alpha.2	PROBANDO	PROBANDO\nPROBANDO\nPROBANDO	2025-07-18 23:59:48.765531
5	0.1.0-alpha.3	Version alpha 18 de julio de 2025	Añadido\n-coordinador nuevas opciones en cofiguracion\n-#permisos ahora es capaz de controlar los permisos ya sea solo lectura\n  o lectura y edicion ya sea por usuario directo o rol.\n-#visibilidad Navbar: coordinador es capaz de quitar opciones del navbar \n  detallado sea por su rol(cargo) o especialidad.\n-ingeneria basica seccion de trafico a nivel visual (en desarrollo)\n-Mi perfil capaz de visualizar sus datos (en desarrollo)\n-dashboard de inicio en desarrollo las funciones de proyectos,ensayos y progresivas	2025-07-19 00:48:20.047564
\.


--
-- Data for Name: codigo_departamentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.codigo_departamentos (codigo_departamento, nombre, created_at, updated_at) FROM stdin;
01	Amazonas	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
02	Áncash	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
03	Apurímac	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
04	Arequipa	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
05	Ayacucho	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
06	Cajamarca	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
07	Callao	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
08	Cusco	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
09	Huancavelica	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
10	Huánuco	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
11	Ica	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
12	Junín	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
13	La Libertad	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
14	Lambayeque	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
15	Lima	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
16	Loreto	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
17	Madre de Dios	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
18	Moquegua	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
19	Pasco	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
20	Piura	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
21	Puno	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
22	San Martín	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
23	Tacna	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
24	Tumbes	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
25	Ucayali	2025-08-07 18:19:27.086132	2025-08-07 18:19:27.086132
\.


--
-- Data for Name: distritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.distritos (id, nombre, codigo_distrito, codigo_provincia) FROM stdin;
\.


--
-- Data for Name: elementos_trafico; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.elementos_trafico (id, tipo, nombre, ubicacion, coordenadas, altitud, descripcion) FROM stdin;
E-01	estacion	Estación 01 (E-01)	Kilómetro 0+000 - Intersección con carretera CU-105	767536.33 E, 8604420.13 N	927.00	Se localiza en el kilómetro 0+000 km, definida como el punto de inicio del tramo en estudio. Corresponde a la intersección con la carretera departamental CU-105.
E-02	estacion	Estación 02 (E-02)	Kilómetro 22+700 - Puente Lampachaca	772509.12 E, 8608996.44 N	1486.00	Se localiza en el kilómetro 22+700 del proyecto, en el puente denominado Lampachaca, seleccionada por su relevancia funcional, al constituir un nodo de conexión con sectores poblacionales de importancia dentro del área de influencia directa del proyecto.
E-03	estacion	Estación 03 (E-03)	Kilómetro 71+800 - Intersección con Túpac Amaru	767536.33 E, 8604420.13 N	993.00	Se localiza en el kilómetro 71+800 del proyecto, en el punto donde se localiza la intersección vial hacia el centro poblado de Túpac Amaru, y las comunidades de Penetración y La Estrella.
E-04	estacion	Estación 04 (E-04)	Kilómetro 86+364 - C.P. San Martín	767536.33 E, 8604420.13 N	927.00	Se localiza en el kilómetro 86+364 del vial en estudio, correspondiente al centro poblado de San Martín. Esta estación ha sido definida como el punto de culminación del proyecto.
T-1	tramo	Tramo T-1	E-1 A E-2 - 0+000 km Inicio de vía (desvío Lorohuachana) - 22+700 km Puente Lampachaca	767536.33 E, 8604420.13 N-772509.12 E, 8608996.44 N	\N	El tramo en evaluación se extiende desde el kilómetro 0+000 hasta el kilómetro 22+700 del eje vial. A lo largo de este recorrido se localizan puntos de interés como el Abra Reyna del Carmen, en las cuales se encuentran algunas ramificaciones y desvíos que conducen a haciendas, y áreas de actividad agrícola. El análisis de campo evidencia que, en este segmento, las condiciones orográficas y el volumen vehicular mantienen una configuración relativamente constante, sin variaciones significativas en términos de flujo ni tipología de tránsito. En base a estos criterios, se da definido el tramo 01 como un tramo homogéneo, apto para su análisis unificado dentro del estudio de tráfico.
T-2	tramo	Tramo T-2	E-2 A E-3 - 22+700 km Puente Lampachaca - 71+800 km Desvío C.P. La Estrella y Penetración	772509.12 E, 8608996.44 N-767536.33 E, 8604420.13 N	\N	El tramo en evaluación se extiende desde el kilómetro 22+700 hasta el kilómetro 71+800 del eje vial. A lo largo de este recorrido se localizan puntos de interés como las comunidades de Tinkuri y Yavero Chico, así como múltiples ramificaciones y desvíos que conducen a haciendas y áreas de actividad agrícola. El análisis de campo evidencia que, en este segmento, las condiciones orográficas y el volumen vehicular mantienen una configuración relativamente constante, sin variaciones significativas en términos de flujo ni tipología de tránsito. En base a estos criterios técnicos, se ha definido el tramo 02 como un tramo homogéneo, apto para su análisis unificado dentro del estudio de tráfico.
T-3	tramo	Tramo T-3	E-3 A E-4 - 71+800 km Desvío C.P. La Estrella y Penetración - 86+364 km C.P. San Martín	767536.33 E, 8604420.13 N-767536.33 E, 8604420.13 N	\N	El tramo en evaluación se desarrolla desde el kilómetro 71+800 hasta el kilómetro 86+364, correspondiente al segmento final del corredor vial en estudio. A lo largo de este sector, las condiciones orográficas, geométricas y de volumen vehicular presentan características estables y uniformes, sin evidenciarse variaciones significativas que alteren la funcionalidad del tránsito. En función de estos parámetros de análisis, y conforme a los lineamientos técnicos de segmentación vial, se define este sector como un tramo homogéneo, adecuado para ser considerado como una sola unidad de estudio en la modelación y proyección del flujo vehicular.
\.


--
-- Data for Name: ensayos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ensayos (id, ubicacion, fecha, resultado, estado, id_departamento, codigo_tramo, tipo_via, tipo_ensayo_codigo, progresiva, estrato_id, codigo_generado, tipo_ensayo) FROM stdin;
24	Cusco	2025-07-25	45%	Pendiente	\N	\N	\N	\N	\N	\N	\N	20
25	Wanchaq	2025-07-14	21%	Pendiente	\N	\N	\N	\N	\N	\N	\N	5
29	Wanchaq	2025-07-30	21%	Completado	\N	\N	\N	\N	\N	\N	\N	12
28	Wanchaq	2025-07-07	21%	Completado	\N	\N	\N	\N	\N	\N	\N	7
23	Cusco	2025-07-24	45%	Revicion	\N	\N	\N	\N	\N	\N	\N	27
39	Wanchaq	2025-08-11	45%	Completado	\N	\N	\N	\N	\N	\N	\N	8
\.


--
-- Data for Name: especialidad_visibilidad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidad_visibilidad (id, codigo_esp, nivel, tipo_user) FROM stdin;
\.


--
-- Data for Name: especialidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidades (codigo_esp, nombre, descripcion, activo) FROM stdin;
1	TOPOGRAFICO		t
2	GEOLOGIA Y GEOTECNIA		t
3	HIDROLOGIA E HIDRAULICA		t
4	TRAFICO		t
5	INVENTARIO VIAL		t
6	MECANICA DE SUELOS		t
7	METRADOS		t
8	PRESUPUESTOS		t
9	OBRAS DE ARTE		t
10	ESTRUCTURAS		t
11	DISEÑO GEOMETRICO		t
12	PAVIMENTOS		t
13	SEGURIDAD VIAL Y SEÑALIZACION		t
14	AMBIENTAL		t
15	ARQUEOLOGO		t
16	ESPECIALISTA PAC		t
17	ASISTENTE ADMINISTRATIVO	Apoyo administrativo especializado	t
18	VISITANTE		t
\.


--
-- Data for Name: especialidades_navbar_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidades_navbar_options (id, especialidad_id, navbar_option_id, visible) FROM stdin;
\.


--
-- Data for Name: estratos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estratos (id, codigo, nombre, descripcion, color, created_at, updated_at, profundidad_inicial, profundidad_final) FROM stdin;
1	0000001	Capa Vegetal	Estrato superficial compuesto por tierra orgánica, raíces y vegetación.	Marrón oscuro	2025-07-21 22:04:21.551312	2025-07-21 22:04:21.551312	\N	\N
2	0000002	Arcilla Limosa	Material fino de baja plasticidad, color café claro.	Café claro	2025-07-21 22:04:21.551312	2025-07-21 22:04:21.551312	\N	\N
3	0000003	Grava Arenosa	Mezcla de gravas y arenas gruesas, bien graduada.	Grisáceo	2025-07-21 22:04:21.551312	2025-07-21 22:04:21.551312	\N	\N
4	0000004	Roca Madre	Lecho rocoso competente y firme, final de la excavación.	Gris oscuro	2025-07-21 22:04:21.551312	2025-07-21 22:04:21.551312	\N	\N
5	0000005	Limo Arenoso	Suelo de grano fino con presencia de arena, color amarillento.	Amarillento	2025-07-21 22:04:21.551312	2025-07-21 22:04:21.551312	\N	\N
\.


--
-- Data for Name: navbar_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.navbar_options (id, nombre, link, descripcion, icono) FROM stdin;
1	Inicio	/coordinador/cordinadords	Página principal del coordinador	fas fa-home
2	Ingeniería Básica	ingenieria_basica	Menú principal de Ingeniería Básica	fas fa-project-diagram
3	Geoportal	/ingenieria/basica	Submenú de Geoportal	fas fa-drafting-compass
4	Topografía	/ingenieria/topografia	Submenú de Topografía	fas fa-map-marked-alt
5	Geología	/ingenieria/geologia	Submenú de Geología	fas fa-mountain
6	Hidrología	/ingenieria/hidrologia	Submenú de Hidrología	fas fa-water
7	Tráfico	/coordinador/ingenieria/trafico/trafico	Submenú de Tráfico	fas fa-car-alt
8	Seguridad Vial	/ingenieria/seguridad-vial	Submenú de Seguridad Vial	fas fa-traffic-light
9	Inventario Vial	/ingenieria/inventario-vial	Submenú de Inventario Vial	fas fa-road
10	Mecánica de Suelos	/coordinador/ingenieria/mecanicadesuelos	Submenú de Mecánica de Suelos	fas fa-layer-group
11	Reportes	/reportes	Sección de Reportes	fas fa-chart-bar
12	Calendario	/coordinador/calendario/calendar	Sección de Calendario	fas fa-calendar-alt
13	Tareas	/coordinador/tareas/tareas	Sección de Tareas	fas fa-tasks
14	Configuración	configuracion	Menú principal de Configuración	fas fa-cog
15	Usuarios	/coordinador/config/frmusuarios	Gestión de Usuarios	fas fa-users
16	Permisos	/coordinador/config/PermisosManagement	Gestión de Permisos	fas fa-key
17	Visibilidad Navbar	/coordinador/config/NavbarVisibility	Gestión de Visibilidad de Navbar	fas fa-eye
18	Integraciones	/configuracion/integraciones	Configuración de Integraciones	fas fa-plug
19	Preferencias	/configuracion/preferencias	Configuración de Preferencias	fas fa-tools
20	Mi Perfil	/perfil	Ver y editar mi perfil	fas fa-user
21	Cerrar sesión	cerrar_sesion	Cerrar la sesión actual	fas fa-sign-out-alt
22	Gestión de Novedades	/coordinador/config/ChangelogManagement	Gestión de las novedades de la aplicación	fas fa-clipboard-list
\.


--
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permisos (id, nombre, descripcion) FROM stdin;
1	crear_usuarios	Puede crear usuarios y asignar nivel de acceso
2	modificar_archivos	Puede modificar archivos subidos
3	subir_archivos	Puede subir nuevos archivos
4	eliminar_archivos	Puede eliminar o editar archivos
5	aprobar_archivos	Puede aprobar o desaprobar archivos
6	control_versiones	Puede manejar versiones de archivos
7	comentar	Puede hacer comentarios en archivos
8	visualizacion_completa	Puede ver todo sin restricción
9	usuarios	Permite gestionar usuarios
\.


--
-- Data for Name: progresiva_perfil_estratos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresiva_perfil_estratos (id, progresiva_id, estrato_id, profundidad_inicial, profundidad_final, orden, tipo_via, descripcion) FROM stdin;
108	693	2	0.000	7.000	1	\N	ñ{lñjhgf
109	693	2	7.000	14.000	2	\N	kjhgfx
110	724	2	0.000	5.000	1	\N	pruebaas
167	1218	2	0.000	5.000	1	\N	wefeisbibdsf
169	1536	1	0.000	6.000	1	\N	wer56uy
170	1695	2	0.000	5.000	1	\N	WERTH
171	1695	2	5.000	10.000	2	\N	WAESRDTFYH
172	1854	2	0.000	222.000	1	\N	asdasd
173	1905	1	0.000	1.000	1	\N	
174	1905	1	1.000	0.000	2	\N	
175	2012	1	0.000	1.000	1	\N	
176	2012	1	1.000	0.000	2	\N	
177	2150	1	0.000	1.000	1	\N	
178	2150	1	1.000	0.000	2	\N	
179	2349	1	0.000	1.000	1	\N	
180	2349	1	1.000	0.000	2	\N	
181	2494	1	0.000	1.000	1	\N	
182	2494	1	1.000	0.000	2	\N	
89	490	2	0.000	5.000	1	\N	fesfdsefdsef
90	490	2	5.000	10.000	2	\N	rgre
\.


--
-- Data for Name: progresivas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresivas (id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, creado_en, actualizado_en, creado_por, proyecto_id, estrato_id, tipo_via, tipo_ensayo, batch_uuid, parent_id, coordenada_este, coordenada_norte, linea, intervalo_manual, longitud_total) FROM stdin;
490	prueba 3	prueba 3	rsgergrwegg	0+000	88+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	\N	-72.537347	-12.612858	18L	\N	\N
491	0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
492	0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
493	1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
494	1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
495	2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
496	2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
497	3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
498	3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
499	4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
500	4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
501	5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
502	5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
503	6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
504	6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
505	7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
506	7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
507	8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
508	8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
509	9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
510	9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
511	10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
512	10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
513	11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
514	11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
515	12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
516	12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
517	13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
518	13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
519	14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
520	14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
521	15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
522	15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
523	16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
524	16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
525	17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
526	17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
527	18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
528	18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
529	19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
530	19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
531	20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
532	20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
533	21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
534	21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
535	22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
536	22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
537	23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
538	23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
539	24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
540	24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
541	25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
542	25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
543	26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
544	26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
545	27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
546	27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
547	28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
548	28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
549	29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
550	29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
551	30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
552	30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
553	31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
554	31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
555	32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
556	32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
557	33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
558	33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
559	34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
560	34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
561	35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
562	35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
563	36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
564	36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
565	37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
566	37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
567	38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
568	38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
569	39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
570	39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
571	40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
572	40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
573	41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
574	41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
575	42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
576	42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
577	43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
578	43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
579	44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
580	44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
581	45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
582	45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
583	46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
584	46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
585	47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
586	47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
587	48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
588	48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
589	49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
590	49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
591	50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
592	50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
593	51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
594	51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
595	52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
596	52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
597	53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
598	53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
599	54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
600	54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
601	55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
602	55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
603	56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
604	56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
605	57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
606	57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
607	58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
608	58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
609	59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
610	59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
611	60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
612	60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
613	61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
614	61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
615	62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
616	62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
617	63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
618	63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
619	64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
620	64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
621	65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
622	65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
623	66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
624	66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
625	67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
626	67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
627	68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
628	68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
629	69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
630	69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
631	70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
632	70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
633	71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
634	71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
635	72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
636	72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
637	73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
638	73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
639	74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
640	74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
641	75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
642	75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
643	76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
644	76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
645	77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
646	77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
647	78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
648	78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
649	79+000	Progresiva 79+000	Progresiva generada automáticamente: 79+000	79+000	79+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
650	79+500	Progresiva 79+500	Progresiva generada automáticamente: 79+500	79+500	79+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
651	80+000	Progresiva 80+000	Progresiva generada automáticamente: 80+000	80+000	80+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
652	80+500	Progresiva 80+500	Progresiva generada automáticamente: 80+500	80+500	80+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
653	81+000	Progresiva 81+000	Progresiva generada automáticamente: 81+000	81+000	81+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
654	81+500	Progresiva 81+500	Progresiva generada automáticamente: 81+500	81+500	81+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
655	82+000	Progresiva 82+000	Progresiva generada automáticamente: 82+000	82+000	82+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
656	82+500	Progresiva 82+500	Progresiva generada automáticamente: 82+500	82+500	82+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
657	83+000	Progresiva 83+000	Progresiva generada automáticamente: 83+000	83+000	83+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
658	83+500	Progresiva 83+500	Progresiva generada automáticamente: 83+500	83+500	83+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
659	84+000	Progresiva 84+000	Progresiva generada automáticamente: 84+000	84+000	84+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
660	84+500	Progresiva 84+500	Progresiva generada automáticamente: 84+500	84+500	84+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
661	85+000	Progresiva 85+000	Progresiva generada automáticamente: 85+000	85+000	85+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
662	85+500	Progresiva 85+500	Progresiva generada automáticamente: 85+500	85+500	85+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
663	86+000	Progresiva 86+000	Progresiva generada automáticamente: 86+000	86+000	86+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
664	86+500	Progresiva 86+500	Progresiva generada automáticamente: 86+500	86+500	86+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
665	87+000	Progresiva 87+000	Progresiva generada automáticamente: 87+000	87+000	87+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
666	87+500	Progresiva 87+500	Progresiva generada automáticamente: 87+500	87+500	87+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
667	88+000	Progresiva 88+000	Progresiva generada automáticamente: 88+000	88+000	88+000	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
668	88+500	Progresiva 88+500	Progresiva generada automáticamente: 88+500	88+500	88+500	activo	2025-08-07 19:51:28.230185+00	2025-08-07 19:51:28.230185+00	\N	\N	2	\N	\N	\N	490	-72.537347	-12.612858	18L	\N	\N
1695	LOLQMAL--oaln1-b09	lolqmal 89	aSGHJ,	0+000	78+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	\N	-72.537347	-12.612858	18L	\N	\N
1696	1695-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1697	1695-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1698	1695-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1699	1695-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1700	1695-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1701	1695-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1702	1695-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1703	1695-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1704	1695-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1705	1695-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1706	1695-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1707	1695-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1708	1695-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1709	1695-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1710	1695-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1711	1695-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1712	1695-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1713	1695-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1714	1695-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1715	1695-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1716	1695-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1717	1695-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1718	1695-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
693	PRUEBA-1-me2yjfpw	prueba 1	eufbuoebofjsafw	0+000	14+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	\N	-72.537347	-12.612858	18L	\N	\N
694	14-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
695	14-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
696	14-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
697	14-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
698	14-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
699	14-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
700	14-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
701	14-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
702	14-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
703	14-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
704	14-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
705	14-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
706	14-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
707	14-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
708	14-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
709	14-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
710	14-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
711	14-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
712	14-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
713	14-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
714	14-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
715	14-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
716	14-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
717	14-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
718	14-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
719	14-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
720	14-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
721	14-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
722	14-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
723	14-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-08 15:05:08.946268+00	2025-08-08 15:05:08.946268+00	\N	14	2	\N	\N	\N	693	-72.537347	-12.612858	18L	\N	\N
724	PRUEBA-212-me2yvik7	prueba 21291	waesrfghwwerg	0+000	44+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	\N	-72.537347	-12.612858	18L	\N	\N
725	15-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
726	15-0+100	Progresiva 0+100	Progresiva generada automáticamente: 0+100	0+100	0+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
727	15-0+200	Progresiva 0+200	Progresiva generada automáticamente: 0+200	0+200	0+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
728	15-0+300	Progresiva 0+300	Progresiva generada automáticamente: 0+300	0+300	0+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
729	15-0+400	Progresiva 0+400	Progresiva generada automáticamente: 0+400	0+400	0+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
730	15-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
731	15-0+600	Progresiva 0+600	Progresiva generada automáticamente: 0+600	0+600	0+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
732	15-0+700	Progresiva 0+700	Progresiva generada automáticamente: 0+700	0+700	0+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
733	15-0+800	Progresiva 0+800	Progresiva generada automáticamente: 0+800	0+800	0+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
734	15-0+900	Progresiva 0+900	Progresiva generada automáticamente: 0+900	0+900	0+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
735	15-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
736	15-1+100	Progresiva 1+100	Progresiva generada automáticamente: 1+100	1+100	1+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
737	15-1+200	Progresiva 1+200	Progresiva generada automáticamente: 1+200	1+200	1+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
738	15-1+300	Progresiva 1+300	Progresiva generada automáticamente: 1+300	1+300	1+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
739	15-1+400	Progresiva 1+400	Progresiva generada automáticamente: 1+400	1+400	1+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
740	15-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
741	15-1+600	Progresiva 1+600	Progresiva generada automáticamente: 1+600	1+600	1+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
742	15-1+700	Progresiva 1+700	Progresiva generada automáticamente: 1+700	1+700	1+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
743	15-1+800	Progresiva 1+800	Progresiva generada automáticamente: 1+800	1+800	1+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
744	15-1+900	Progresiva 1+900	Progresiva generada automáticamente: 1+900	1+900	1+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
745	15-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
746	15-2+100	Progresiva 2+100	Progresiva generada automáticamente: 2+100	2+100	2+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
747	15-2+200	Progresiva 2+200	Progresiva generada automáticamente: 2+200	2+200	2+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
748	15-2+300	Progresiva 2+300	Progresiva generada automáticamente: 2+300	2+300	2+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
749	15-2+400	Progresiva 2+400	Progresiva generada automáticamente: 2+400	2+400	2+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
750	15-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
751	15-2+600	Progresiva 2+600	Progresiva generada automáticamente: 2+600	2+600	2+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
752	15-2+700	Progresiva 2+700	Progresiva generada automáticamente: 2+700	2+700	2+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
753	15-2+800	Progresiva 2+800	Progresiva generada automáticamente: 2+800	2+800	2+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
754	15-2+900	Progresiva 2+900	Progresiva generada automáticamente: 2+900	2+900	2+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
755	15-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
756	15-3+100	Progresiva 3+100	Progresiva generada automáticamente: 3+100	3+100	3+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
757	15-3+200	Progresiva 3+200	Progresiva generada automáticamente: 3+200	3+200	3+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
758	15-3+300	Progresiva 3+300	Progresiva generada automáticamente: 3+300	3+300	3+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
759	15-3+400	Progresiva 3+400	Progresiva generada automáticamente: 3+400	3+400	3+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
760	15-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
761	15-3+600	Progresiva 3+600	Progresiva generada automáticamente: 3+600	3+600	3+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
762	15-3+700	Progresiva 3+700	Progresiva generada automáticamente: 3+700	3+700	3+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
763	15-3+800	Progresiva 3+800	Progresiva generada automáticamente: 3+800	3+800	3+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
764	15-3+900	Progresiva 3+900	Progresiva generada automáticamente: 3+900	3+900	3+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
765	15-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
766	15-4+100	Progresiva 4+100	Progresiva generada automáticamente: 4+100	4+100	4+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
767	15-4+200	Progresiva 4+200	Progresiva generada automáticamente: 4+200	4+200	4+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
768	15-4+300	Progresiva 4+300	Progresiva generada automáticamente: 4+300	4+300	4+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
769	15-4+400	Progresiva 4+400	Progresiva generada automáticamente: 4+400	4+400	4+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
770	15-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
771	15-4+600	Progresiva 4+600	Progresiva generada automáticamente: 4+600	4+600	4+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
772	15-4+700	Progresiva 4+700	Progresiva generada automáticamente: 4+700	4+700	4+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
773	15-4+800	Progresiva 4+800	Progresiva generada automáticamente: 4+800	4+800	4+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
774	15-4+900	Progresiva 4+900	Progresiva generada automáticamente: 4+900	4+900	4+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
775	15-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
776	15-5+100	Progresiva 5+100	Progresiva generada automáticamente: 5+100	5+100	5+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
777	15-5+200	Progresiva 5+200	Progresiva generada automáticamente: 5+200	5+200	5+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
778	15-5+300	Progresiva 5+300	Progresiva generada automáticamente: 5+300	5+300	5+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
779	15-5+400	Progresiva 5+400	Progresiva generada automáticamente: 5+400	5+400	5+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
780	15-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
781	15-5+600	Progresiva 5+600	Progresiva generada automáticamente: 5+600	5+600	5+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
782	15-5+700	Progresiva 5+700	Progresiva generada automáticamente: 5+700	5+700	5+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
783	15-5+800	Progresiva 5+800	Progresiva generada automáticamente: 5+800	5+800	5+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
784	15-5+900	Progresiva 5+900	Progresiva generada automáticamente: 5+900	5+900	5+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
785	15-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
786	15-6+100	Progresiva 6+100	Progresiva generada automáticamente: 6+100	6+100	6+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
787	15-6+200	Progresiva 6+200	Progresiva generada automáticamente: 6+200	6+200	6+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
788	15-6+300	Progresiva 6+300	Progresiva generada automáticamente: 6+300	6+300	6+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
789	15-6+400	Progresiva 6+400	Progresiva generada automáticamente: 6+400	6+400	6+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
790	15-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
791	15-6+600	Progresiva 6+600	Progresiva generada automáticamente: 6+600	6+600	6+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
792	15-6+700	Progresiva 6+700	Progresiva generada automáticamente: 6+700	6+700	6+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
793	15-6+800	Progresiva 6+800	Progresiva generada automáticamente: 6+800	6+800	6+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
794	15-6+900	Progresiva 6+900	Progresiva generada automáticamente: 6+900	6+900	6+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
795	15-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
796	15-7+100	Progresiva 7+100	Progresiva generada automáticamente: 7+100	7+100	7+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
797	15-7+200	Progresiva 7+200	Progresiva generada automáticamente: 7+200	7+200	7+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
798	15-7+300	Progresiva 7+300	Progresiva generada automáticamente: 7+300	7+300	7+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
799	15-7+400	Progresiva 7+400	Progresiva generada automáticamente: 7+400	7+400	7+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
800	15-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
801	15-7+600	Progresiva 7+600	Progresiva generada automáticamente: 7+600	7+600	7+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
802	15-7+700	Progresiva 7+700	Progresiva generada automáticamente: 7+700	7+700	7+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
803	15-7+800	Progresiva 7+800	Progresiva generada automáticamente: 7+800	7+800	7+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
804	15-7+900	Progresiva 7+900	Progresiva generada automáticamente: 7+900	7+900	7+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
805	15-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
806	15-8+100	Progresiva 8+100	Progresiva generada automáticamente: 8+100	8+100	8+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
807	15-8+200	Progresiva 8+200	Progresiva generada automáticamente: 8+200	8+200	8+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
808	15-8+300	Progresiva 8+300	Progresiva generada automáticamente: 8+300	8+300	8+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
809	15-8+400	Progresiva 8+400	Progresiva generada automáticamente: 8+400	8+400	8+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
810	15-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
811	15-8+600	Progresiva 8+600	Progresiva generada automáticamente: 8+600	8+600	8+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
812	15-8+700	Progresiva 8+700	Progresiva generada automáticamente: 8+700	8+700	8+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
813	15-8+800	Progresiva 8+800	Progresiva generada automáticamente: 8+800	8+800	8+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
814	15-8+900	Progresiva 8+900	Progresiva generada automáticamente: 8+900	8+900	8+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
815	15-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
816	15-9+100	Progresiva 9+100	Progresiva generada automáticamente: 9+100	9+100	9+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
817	15-9+200	Progresiva 9+200	Progresiva generada automáticamente: 9+200	9+200	9+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
818	15-9+300	Progresiva 9+300	Progresiva generada automáticamente: 9+300	9+300	9+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
819	15-9+400	Progresiva 9+400	Progresiva generada automáticamente: 9+400	9+400	9+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
820	15-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
821	15-9+600	Progresiva 9+600	Progresiva generada automáticamente: 9+600	9+600	9+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
822	15-9+700	Progresiva 9+700	Progresiva generada automáticamente: 9+700	9+700	9+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
823	15-9+800	Progresiva 9+800	Progresiva generada automáticamente: 9+800	9+800	9+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
824	15-9+900	Progresiva 9+900	Progresiva generada automáticamente: 9+900	9+900	9+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
825	15-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
826	15-10+100	Progresiva 10+100	Progresiva generada automáticamente: 10+100	10+100	10+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
827	15-10+200	Progresiva 10+200	Progresiva generada automáticamente: 10+200	10+200	10+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
828	15-10+300	Progresiva 10+300	Progresiva generada automáticamente: 10+300	10+300	10+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
829	15-10+400	Progresiva 10+400	Progresiva generada automáticamente: 10+400	10+400	10+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
830	15-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
831	15-10+600	Progresiva 10+600	Progresiva generada automáticamente: 10+600	10+600	10+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
832	15-10+700	Progresiva 10+700	Progresiva generada automáticamente: 10+700	10+700	10+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
833	15-10+800	Progresiva 10+800	Progresiva generada automáticamente: 10+800	10+800	10+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
834	15-10+900	Progresiva 10+900	Progresiva generada automáticamente: 10+900	10+900	10+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
835	15-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
836	15-11+100	Progresiva 11+100	Progresiva generada automáticamente: 11+100	11+100	11+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
837	15-11+200	Progresiva 11+200	Progresiva generada automáticamente: 11+200	11+200	11+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
838	15-11+300	Progresiva 11+300	Progresiva generada automáticamente: 11+300	11+300	11+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
839	15-11+400	Progresiva 11+400	Progresiva generada automáticamente: 11+400	11+400	11+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
840	15-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
841	15-11+600	Progresiva 11+600	Progresiva generada automáticamente: 11+600	11+600	11+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
842	15-11+700	Progresiva 11+700	Progresiva generada automáticamente: 11+700	11+700	11+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
843	15-11+800	Progresiva 11+800	Progresiva generada automáticamente: 11+800	11+800	11+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
844	15-11+900	Progresiva 11+900	Progresiva generada automáticamente: 11+900	11+900	11+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
845	15-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
846	15-12+100	Progresiva 12+100	Progresiva generada automáticamente: 12+100	12+100	12+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
847	15-12+200	Progresiva 12+200	Progresiva generada automáticamente: 12+200	12+200	12+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
848	15-12+300	Progresiva 12+300	Progresiva generada automáticamente: 12+300	12+300	12+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
849	15-12+400	Progresiva 12+400	Progresiva generada automáticamente: 12+400	12+400	12+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
850	15-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
851	15-12+600	Progresiva 12+600	Progresiva generada automáticamente: 12+600	12+600	12+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
852	15-12+700	Progresiva 12+700	Progresiva generada automáticamente: 12+700	12+700	12+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
853	15-12+800	Progresiva 12+800	Progresiva generada automáticamente: 12+800	12+800	12+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
854	15-12+900	Progresiva 12+900	Progresiva generada automáticamente: 12+900	12+900	12+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
855	15-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
856	15-13+100	Progresiva 13+100	Progresiva generada automáticamente: 13+100	13+100	13+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
857	15-13+200	Progresiva 13+200	Progresiva generada automáticamente: 13+200	13+200	13+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
858	15-13+300	Progresiva 13+300	Progresiva generada automáticamente: 13+300	13+300	13+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
859	15-13+400	Progresiva 13+400	Progresiva generada automáticamente: 13+400	13+400	13+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
860	15-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
861	15-13+600	Progresiva 13+600	Progresiva generada automáticamente: 13+600	13+600	13+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
862	15-13+700	Progresiva 13+700	Progresiva generada automáticamente: 13+700	13+700	13+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
863	15-13+800	Progresiva 13+800	Progresiva generada automáticamente: 13+800	13+800	13+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
864	15-13+900	Progresiva 13+900	Progresiva generada automáticamente: 13+900	13+900	13+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
865	15-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
866	15-14+100	Progresiva 14+100	Progresiva generada automáticamente: 14+100	14+100	14+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
867	15-14+200	Progresiva 14+200	Progresiva generada automáticamente: 14+200	14+200	14+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
868	15-14+300	Progresiva 14+300	Progresiva generada automáticamente: 14+300	14+300	14+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
869	15-14+400	Progresiva 14+400	Progresiva generada automáticamente: 14+400	14+400	14+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
870	15-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
871	15-14+600	Progresiva 14+600	Progresiva generada automáticamente: 14+600	14+600	14+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
872	15-14+700	Progresiva 14+700	Progresiva generada automáticamente: 14+700	14+700	14+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
873	15-14+800	Progresiva 14+800	Progresiva generada automáticamente: 14+800	14+800	14+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
874	15-14+900	Progresiva 14+900	Progresiva generada automáticamente: 14+900	14+900	14+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
875	15-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
876	15-15+100	Progresiva 15+100	Progresiva generada automáticamente: 15+100	15+100	15+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
877	15-15+200	Progresiva 15+200	Progresiva generada automáticamente: 15+200	15+200	15+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
878	15-15+300	Progresiva 15+300	Progresiva generada automáticamente: 15+300	15+300	15+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
879	15-15+400	Progresiva 15+400	Progresiva generada automáticamente: 15+400	15+400	15+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
880	15-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
881	15-15+600	Progresiva 15+600	Progresiva generada automáticamente: 15+600	15+600	15+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
882	15-15+700	Progresiva 15+700	Progresiva generada automáticamente: 15+700	15+700	15+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
883	15-15+800	Progresiva 15+800	Progresiva generada automáticamente: 15+800	15+800	15+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
884	15-15+900	Progresiva 15+900	Progresiva generada automáticamente: 15+900	15+900	15+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
885	15-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
886	15-16+100	Progresiva 16+100	Progresiva generada automáticamente: 16+100	16+100	16+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
887	15-16+200	Progresiva 16+200	Progresiva generada automáticamente: 16+200	16+200	16+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
888	15-16+300	Progresiva 16+300	Progresiva generada automáticamente: 16+300	16+300	16+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
889	15-16+400	Progresiva 16+400	Progresiva generada automáticamente: 16+400	16+400	16+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
890	15-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
891	15-16+600	Progresiva 16+600	Progresiva generada automáticamente: 16+600	16+600	16+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
892	15-16+700	Progresiva 16+700	Progresiva generada automáticamente: 16+700	16+700	16+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
893	15-16+800	Progresiva 16+800	Progresiva generada automáticamente: 16+800	16+800	16+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
894	15-16+900	Progresiva 16+900	Progresiva generada automáticamente: 16+900	16+900	16+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
895	15-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
896	15-17+100	Progresiva 17+100	Progresiva generada automáticamente: 17+100	17+100	17+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
897	15-17+200	Progresiva 17+200	Progresiva generada automáticamente: 17+200	17+200	17+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
898	15-17+300	Progresiva 17+300	Progresiva generada automáticamente: 17+300	17+300	17+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
899	15-17+400	Progresiva 17+400	Progresiva generada automáticamente: 17+400	17+400	17+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
900	15-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
901	15-17+600	Progresiva 17+600	Progresiva generada automáticamente: 17+600	17+600	17+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
902	15-17+700	Progresiva 17+700	Progresiva generada automáticamente: 17+700	17+700	17+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
903	15-17+800	Progresiva 17+800	Progresiva generada automáticamente: 17+800	17+800	17+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
904	15-17+900	Progresiva 17+900	Progresiva generada automáticamente: 17+900	17+900	17+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
905	15-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
906	15-18+100	Progresiva 18+100	Progresiva generada automáticamente: 18+100	18+100	18+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
907	15-18+200	Progresiva 18+200	Progresiva generada automáticamente: 18+200	18+200	18+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
908	15-18+300	Progresiva 18+300	Progresiva generada automáticamente: 18+300	18+300	18+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
909	15-18+400	Progresiva 18+400	Progresiva generada automáticamente: 18+400	18+400	18+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
910	15-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
911	15-18+600	Progresiva 18+600	Progresiva generada automáticamente: 18+600	18+600	18+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
912	15-18+700	Progresiva 18+700	Progresiva generada automáticamente: 18+700	18+700	18+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
913	15-18+800	Progresiva 18+800	Progresiva generada automáticamente: 18+800	18+800	18+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
914	15-18+900	Progresiva 18+900	Progresiva generada automáticamente: 18+900	18+900	18+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
915	15-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
916	15-19+100	Progresiva 19+100	Progresiva generada automáticamente: 19+100	19+100	19+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
917	15-19+200	Progresiva 19+200	Progresiva generada automáticamente: 19+200	19+200	19+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
918	15-19+300	Progresiva 19+300	Progresiva generada automáticamente: 19+300	19+300	19+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
919	15-19+400	Progresiva 19+400	Progresiva generada automáticamente: 19+400	19+400	19+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
920	15-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
921	15-19+600	Progresiva 19+600	Progresiva generada automáticamente: 19+600	19+600	19+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
922	15-19+700	Progresiva 19+700	Progresiva generada automáticamente: 19+700	19+700	19+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
923	15-19+800	Progresiva 19+800	Progresiva generada automáticamente: 19+800	19+800	19+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
924	15-19+900	Progresiva 19+900	Progresiva generada automáticamente: 19+900	19+900	19+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
925	15-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
926	15-20+100	Progresiva 20+100	Progresiva generada automáticamente: 20+100	20+100	20+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
927	15-20+200	Progresiva 20+200	Progresiva generada automáticamente: 20+200	20+200	20+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
928	15-20+300	Progresiva 20+300	Progresiva generada automáticamente: 20+300	20+300	20+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
929	15-20+400	Progresiva 20+400	Progresiva generada automáticamente: 20+400	20+400	20+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
930	15-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
931	15-20+600	Progresiva 20+600	Progresiva generada automáticamente: 20+600	20+600	20+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
932	15-20+700	Progresiva 20+700	Progresiva generada automáticamente: 20+700	20+700	20+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
933	15-20+800	Progresiva 20+800	Progresiva generada automáticamente: 20+800	20+800	20+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
934	15-20+900	Progresiva 20+900	Progresiva generada automáticamente: 20+900	20+900	20+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
935	15-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
936	15-21+100	Progresiva 21+100	Progresiva generada automáticamente: 21+100	21+100	21+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
937	15-21+200	Progresiva 21+200	Progresiva generada automáticamente: 21+200	21+200	21+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
938	15-21+300	Progresiva 21+300	Progresiva generada automáticamente: 21+300	21+300	21+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
939	15-21+400	Progresiva 21+400	Progresiva generada automáticamente: 21+400	21+400	21+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
940	15-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
941	15-21+600	Progresiva 21+600	Progresiva generada automáticamente: 21+600	21+600	21+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
942	15-21+700	Progresiva 21+700	Progresiva generada automáticamente: 21+700	21+700	21+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
943	15-21+800	Progresiva 21+800	Progresiva generada automáticamente: 21+800	21+800	21+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
944	15-21+900	Progresiva 21+900	Progresiva generada automáticamente: 21+900	21+900	21+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
945	15-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
946	15-22+100	Progresiva 22+100	Progresiva generada automáticamente: 22+100	22+100	22+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
947	15-22+200	Progresiva 22+200	Progresiva generada automáticamente: 22+200	22+200	22+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
948	15-22+300	Progresiva 22+300	Progresiva generada automáticamente: 22+300	22+300	22+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
949	15-22+400	Progresiva 22+400	Progresiva generada automáticamente: 22+400	22+400	22+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
950	15-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
951	15-22+600	Progresiva 22+600	Progresiva generada automáticamente: 22+600	22+600	22+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
952	15-22+700	Progresiva 22+700	Progresiva generada automáticamente: 22+700	22+700	22+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
953	15-22+800	Progresiva 22+800	Progresiva generada automáticamente: 22+800	22+800	22+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
954	15-22+900	Progresiva 22+900	Progresiva generada automáticamente: 22+900	22+900	22+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
955	15-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
956	15-23+100	Progresiva 23+100	Progresiva generada automáticamente: 23+100	23+100	23+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
957	15-23+200	Progresiva 23+200	Progresiva generada automáticamente: 23+200	23+200	23+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
958	15-23+300	Progresiva 23+300	Progresiva generada automáticamente: 23+300	23+300	23+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
959	15-23+400	Progresiva 23+400	Progresiva generada automáticamente: 23+400	23+400	23+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
960	15-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
961	15-23+600	Progresiva 23+600	Progresiva generada automáticamente: 23+600	23+600	23+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
962	15-23+700	Progresiva 23+700	Progresiva generada automáticamente: 23+700	23+700	23+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
963	15-23+800	Progresiva 23+800	Progresiva generada automáticamente: 23+800	23+800	23+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
964	15-23+900	Progresiva 23+900	Progresiva generada automáticamente: 23+900	23+900	23+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
965	15-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
966	15-24+100	Progresiva 24+100	Progresiva generada automáticamente: 24+100	24+100	24+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
967	15-24+200	Progresiva 24+200	Progresiva generada automáticamente: 24+200	24+200	24+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
968	15-24+300	Progresiva 24+300	Progresiva generada automáticamente: 24+300	24+300	24+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
969	15-24+400	Progresiva 24+400	Progresiva generada automáticamente: 24+400	24+400	24+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
970	15-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
971	15-24+600	Progresiva 24+600	Progresiva generada automáticamente: 24+600	24+600	24+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
972	15-24+700	Progresiva 24+700	Progresiva generada automáticamente: 24+700	24+700	24+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
973	15-24+800	Progresiva 24+800	Progresiva generada automáticamente: 24+800	24+800	24+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
974	15-24+900	Progresiva 24+900	Progresiva generada automáticamente: 24+900	24+900	24+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
975	15-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
976	15-25+100	Progresiva 25+100	Progresiva generada automáticamente: 25+100	25+100	25+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
977	15-25+200	Progresiva 25+200	Progresiva generada automáticamente: 25+200	25+200	25+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
978	15-25+300	Progresiva 25+300	Progresiva generada automáticamente: 25+300	25+300	25+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
979	15-25+400	Progresiva 25+400	Progresiva generada automáticamente: 25+400	25+400	25+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
980	15-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
981	15-25+600	Progresiva 25+600	Progresiva generada automáticamente: 25+600	25+600	25+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
982	15-25+700	Progresiva 25+700	Progresiva generada automáticamente: 25+700	25+700	25+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
983	15-25+800	Progresiva 25+800	Progresiva generada automáticamente: 25+800	25+800	25+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
984	15-25+900	Progresiva 25+900	Progresiva generada automáticamente: 25+900	25+900	25+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
985	15-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
986	15-26+100	Progresiva 26+100	Progresiva generada automáticamente: 26+100	26+100	26+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
987	15-26+200	Progresiva 26+200	Progresiva generada automáticamente: 26+200	26+200	26+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
988	15-26+300	Progresiva 26+300	Progresiva generada automáticamente: 26+300	26+300	26+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
989	15-26+400	Progresiva 26+400	Progresiva generada automáticamente: 26+400	26+400	26+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
990	15-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
991	15-26+600	Progresiva 26+600	Progresiva generada automáticamente: 26+600	26+600	26+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
992	15-26+700	Progresiva 26+700	Progresiva generada automáticamente: 26+700	26+700	26+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
993	15-26+800	Progresiva 26+800	Progresiva generada automáticamente: 26+800	26+800	26+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
994	15-26+900	Progresiva 26+900	Progresiva generada automáticamente: 26+900	26+900	26+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
995	15-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
996	15-27+100	Progresiva 27+100	Progresiva generada automáticamente: 27+100	27+100	27+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
997	15-27+200	Progresiva 27+200	Progresiva generada automáticamente: 27+200	27+200	27+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
998	15-27+300	Progresiva 27+300	Progresiva generada automáticamente: 27+300	27+300	27+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
999	15-27+400	Progresiva 27+400	Progresiva generada automáticamente: 27+400	27+400	27+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1000	15-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1001	15-27+600	Progresiva 27+600	Progresiva generada automáticamente: 27+600	27+600	27+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1002	15-27+700	Progresiva 27+700	Progresiva generada automáticamente: 27+700	27+700	27+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1003	15-27+800	Progresiva 27+800	Progresiva generada automáticamente: 27+800	27+800	27+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1004	15-27+900	Progresiva 27+900	Progresiva generada automáticamente: 27+900	27+900	27+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1005	15-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1006	15-28+100	Progresiva 28+100	Progresiva generada automáticamente: 28+100	28+100	28+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1007	15-28+200	Progresiva 28+200	Progresiva generada automáticamente: 28+200	28+200	28+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1008	15-28+300	Progresiva 28+300	Progresiva generada automáticamente: 28+300	28+300	28+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1009	15-28+400	Progresiva 28+400	Progresiva generada automáticamente: 28+400	28+400	28+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1010	15-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1011	15-28+600	Progresiva 28+600	Progresiva generada automáticamente: 28+600	28+600	28+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1012	15-28+700	Progresiva 28+700	Progresiva generada automáticamente: 28+700	28+700	28+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1013	15-28+800	Progresiva 28+800	Progresiva generada automáticamente: 28+800	28+800	28+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1014	15-28+900	Progresiva 28+900	Progresiva generada automáticamente: 28+900	28+900	28+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1015	15-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1016	15-29+100	Progresiva 29+100	Progresiva generada automáticamente: 29+100	29+100	29+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1017	15-29+200	Progresiva 29+200	Progresiva generada automáticamente: 29+200	29+200	29+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1018	15-29+300	Progresiva 29+300	Progresiva generada automáticamente: 29+300	29+300	29+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1019	15-29+400	Progresiva 29+400	Progresiva generada automáticamente: 29+400	29+400	29+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1020	15-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1021	15-29+600	Progresiva 29+600	Progresiva generada automáticamente: 29+600	29+600	29+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1022	15-29+700	Progresiva 29+700	Progresiva generada automáticamente: 29+700	29+700	29+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1023	15-29+800	Progresiva 29+800	Progresiva generada automáticamente: 29+800	29+800	29+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1024	15-29+900	Progresiva 29+900	Progresiva generada automáticamente: 29+900	29+900	29+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1025	15-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1026	15-30+100	Progresiva 30+100	Progresiva generada automáticamente: 30+100	30+100	30+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1027	15-30+200	Progresiva 30+200	Progresiva generada automáticamente: 30+200	30+200	30+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1028	15-30+300	Progresiva 30+300	Progresiva generada automáticamente: 30+300	30+300	30+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1029	15-30+400	Progresiva 30+400	Progresiva generada automáticamente: 30+400	30+400	30+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1030	15-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1031	15-30+600	Progresiva 30+600	Progresiva generada automáticamente: 30+600	30+600	30+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1032	15-30+700	Progresiva 30+700	Progresiva generada automáticamente: 30+700	30+700	30+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1033	15-30+800	Progresiva 30+800	Progresiva generada automáticamente: 30+800	30+800	30+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1034	15-30+900	Progresiva 30+900	Progresiva generada automáticamente: 30+900	30+900	30+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1035	15-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1036	15-31+100	Progresiva 31+100	Progresiva generada automáticamente: 31+100	31+100	31+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1037	15-31+200	Progresiva 31+200	Progresiva generada automáticamente: 31+200	31+200	31+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1038	15-31+300	Progresiva 31+300	Progresiva generada automáticamente: 31+300	31+300	31+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1039	15-31+400	Progresiva 31+400	Progresiva generada automáticamente: 31+400	31+400	31+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1040	15-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1041	15-31+600	Progresiva 31+600	Progresiva generada automáticamente: 31+600	31+600	31+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1042	15-31+700	Progresiva 31+700	Progresiva generada automáticamente: 31+700	31+700	31+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1043	15-31+800	Progresiva 31+800	Progresiva generada automáticamente: 31+800	31+800	31+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1044	15-31+900	Progresiva 31+900	Progresiva generada automáticamente: 31+900	31+900	31+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1045	15-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1046	15-32+100	Progresiva 32+100	Progresiva generada automáticamente: 32+100	32+100	32+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1047	15-32+200	Progresiva 32+200	Progresiva generada automáticamente: 32+200	32+200	32+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1048	15-32+300	Progresiva 32+300	Progresiva generada automáticamente: 32+300	32+300	32+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1049	15-32+400	Progresiva 32+400	Progresiva generada automáticamente: 32+400	32+400	32+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1050	15-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1051	15-32+600	Progresiva 32+600	Progresiva generada automáticamente: 32+600	32+600	32+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1052	15-32+700	Progresiva 32+700	Progresiva generada automáticamente: 32+700	32+700	32+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1053	15-32+800	Progresiva 32+800	Progresiva generada automáticamente: 32+800	32+800	32+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1054	15-32+900	Progresiva 32+900	Progresiva generada automáticamente: 32+900	32+900	32+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1055	15-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1056	15-33+100	Progresiva 33+100	Progresiva generada automáticamente: 33+100	33+100	33+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1057	15-33+200	Progresiva 33+200	Progresiva generada automáticamente: 33+200	33+200	33+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1058	15-33+300	Progresiva 33+300	Progresiva generada automáticamente: 33+300	33+300	33+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1059	15-33+400	Progresiva 33+400	Progresiva generada automáticamente: 33+400	33+400	33+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1060	15-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1061	15-33+600	Progresiva 33+600	Progresiva generada automáticamente: 33+600	33+600	33+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1062	15-33+700	Progresiva 33+700	Progresiva generada automáticamente: 33+700	33+700	33+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1063	15-33+800	Progresiva 33+800	Progresiva generada automáticamente: 33+800	33+800	33+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1064	15-33+900	Progresiva 33+900	Progresiva generada automáticamente: 33+900	33+900	33+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1065	15-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1066	15-34+100	Progresiva 34+100	Progresiva generada automáticamente: 34+100	34+100	34+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1067	15-34+200	Progresiva 34+200	Progresiva generada automáticamente: 34+200	34+200	34+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1068	15-34+300	Progresiva 34+300	Progresiva generada automáticamente: 34+300	34+300	34+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1069	15-34+400	Progresiva 34+400	Progresiva generada automáticamente: 34+400	34+400	34+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1070	15-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1071	15-34+600	Progresiva 34+600	Progresiva generada automáticamente: 34+600	34+600	34+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1072	15-34+700	Progresiva 34+700	Progresiva generada automáticamente: 34+700	34+700	34+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1073	15-34+800	Progresiva 34+800	Progresiva generada automáticamente: 34+800	34+800	34+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1074	15-34+900	Progresiva 34+900	Progresiva generada automáticamente: 34+900	34+900	34+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1075	15-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1076	15-35+100	Progresiva 35+100	Progresiva generada automáticamente: 35+100	35+100	35+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1077	15-35+200	Progresiva 35+200	Progresiva generada automáticamente: 35+200	35+200	35+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1078	15-35+300	Progresiva 35+300	Progresiva generada automáticamente: 35+300	35+300	35+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1079	15-35+400	Progresiva 35+400	Progresiva generada automáticamente: 35+400	35+400	35+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1080	15-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1081	15-35+600	Progresiva 35+600	Progresiva generada automáticamente: 35+600	35+600	35+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1082	15-35+700	Progresiva 35+700	Progresiva generada automáticamente: 35+700	35+700	35+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1083	15-35+800	Progresiva 35+800	Progresiva generada automáticamente: 35+800	35+800	35+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1084	15-35+900	Progresiva 35+900	Progresiva generada automáticamente: 35+900	35+900	35+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1085	15-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1086	15-36+100	Progresiva 36+100	Progresiva generada automáticamente: 36+100	36+100	36+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1087	15-36+200	Progresiva 36+200	Progresiva generada automáticamente: 36+200	36+200	36+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1088	15-36+300	Progresiva 36+300	Progresiva generada automáticamente: 36+300	36+300	36+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1089	15-36+400	Progresiva 36+400	Progresiva generada automáticamente: 36+400	36+400	36+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1090	15-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1091	15-36+600	Progresiva 36+600	Progresiva generada automáticamente: 36+600	36+600	36+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1092	15-36+700	Progresiva 36+700	Progresiva generada automáticamente: 36+700	36+700	36+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1093	15-36+800	Progresiva 36+800	Progresiva generada automáticamente: 36+800	36+800	36+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1094	15-36+900	Progresiva 36+900	Progresiva generada automáticamente: 36+900	36+900	36+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1095	15-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1096	15-37+100	Progresiva 37+100	Progresiva generada automáticamente: 37+100	37+100	37+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1097	15-37+200	Progresiva 37+200	Progresiva generada automáticamente: 37+200	37+200	37+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1098	15-37+300	Progresiva 37+300	Progresiva generada automáticamente: 37+300	37+300	37+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1099	15-37+400	Progresiva 37+400	Progresiva generada automáticamente: 37+400	37+400	37+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1100	15-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1101	15-37+600	Progresiva 37+600	Progresiva generada automáticamente: 37+600	37+600	37+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1102	15-37+700	Progresiva 37+700	Progresiva generada automáticamente: 37+700	37+700	37+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1103	15-37+800	Progresiva 37+800	Progresiva generada automáticamente: 37+800	37+800	37+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1104	15-37+900	Progresiva 37+900	Progresiva generada automáticamente: 37+900	37+900	37+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1105	15-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1106	15-38+100	Progresiva 38+100	Progresiva generada automáticamente: 38+100	38+100	38+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1107	15-38+200	Progresiva 38+200	Progresiva generada automáticamente: 38+200	38+200	38+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1108	15-38+300	Progresiva 38+300	Progresiva generada automáticamente: 38+300	38+300	38+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1109	15-38+400	Progresiva 38+400	Progresiva generada automáticamente: 38+400	38+400	38+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1110	15-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1111	15-38+600	Progresiva 38+600	Progresiva generada automáticamente: 38+600	38+600	38+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1112	15-38+700	Progresiva 38+700	Progresiva generada automáticamente: 38+700	38+700	38+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1113	15-38+800	Progresiva 38+800	Progresiva generada automáticamente: 38+800	38+800	38+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1114	15-38+900	Progresiva 38+900	Progresiva generada automáticamente: 38+900	38+900	38+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1115	15-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1116	15-39+100	Progresiva 39+100	Progresiva generada automáticamente: 39+100	39+100	39+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1117	15-39+200	Progresiva 39+200	Progresiva generada automáticamente: 39+200	39+200	39+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1118	15-39+300	Progresiva 39+300	Progresiva generada automáticamente: 39+300	39+300	39+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1119	15-39+400	Progresiva 39+400	Progresiva generada automáticamente: 39+400	39+400	39+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1120	15-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1121	15-39+600	Progresiva 39+600	Progresiva generada automáticamente: 39+600	39+600	39+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1122	15-39+700	Progresiva 39+700	Progresiva generada automáticamente: 39+700	39+700	39+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1123	15-39+800	Progresiva 39+800	Progresiva generada automáticamente: 39+800	39+800	39+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1124	15-39+900	Progresiva 39+900	Progresiva generada automáticamente: 39+900	39+900	39+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1125	15-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1126	15-40+100	Progresiva 40+100	Progresiva generada automáticamente: 40+100	40+100	40+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1127	15-40+200	Progresiva 40+200	Progresiva generada automáticamente: 40+200	40+200	40+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1128	15-40+300	Progresiva 40+300	Progresiva generada automáticamente: 40+300	40+300	40+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1129	15-40+400	Progresiva 40+400	Progresiva generada automáticamente: 40+400	40+400	40+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1130	15-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1131	15-40+600	Progresiva 40+600	Progresiva generada automáticamente: 40+600	40+600	40+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1132	15-40+700	Progresiva 40+700	Progresiva generada automáticamente: 40+700	40+700	40+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1133	15-40+800	Progresiva 40+800	Progresiva generada automáticamente: 40+800	40+800	40+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1134	15-40+900	Progresiva 40+900	Progresiva generada automáticamente: 40+900	40+900	40+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1135	15-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1136	15-41+100	Progresiva 41+100	Progresiva generada automáticamente: 41+100	41+100	41+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1137	15-41+200	Progresiva 41+200	Progresiva generada automáticamente: 41+200	41+200	41+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1138	15-41+300	Progresiva 41+300	Progresiva generada automáticamente: 41+300	41+300	41+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1139	15-41+400	Progresiva 41+400	Progresiva generada automáticamente: 41+400	41+400	41+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1140	15-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1141	15-41+600	Progresiva 41+600	Progresiva generada automáticamente: 41+600	41+600	41+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1142	15-41+700	Progresiva 41+700	Progresiva generada automáticamente: 41+700	41+700	41+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1143	15-41+800	Progresiva 41+800	Progresiva generada automáticamente: 41+800	41+800	41+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1144	15-41+900	Progresiva 41+900	Progresiva generada automáticamente: 41+900	41+900	41+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1145	15-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1146	15-42+100	Progresiva 42+100	Progresiva generada automáticamente: 42+100	42+100	42+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1147	15-42+200	Progresiva 42+200	Progresiva generada automáticamente: 42+200	42+200	42+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1148	15-42+300	Progresiva 42+300	Progresiva generada automáticamente: 42+300	42+300	42+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1149	15-42+400	Progresiva 42+400	Progresiva generada automáticamente: 42+400	42+400	42+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1150	15-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1151	15-42+600	Progresiva 42+600	Progresiva generada automáticamente: 42+600	42+600	42+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1152	15-42+700	Progresiva 42+700	Progresiva generada automáticamente: 42+700	42+700	42+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1153	15-42+800	Progresiva 42+800	Progresiva generada automáticamente: 42+800	42+800	42+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1154	15-42+900	Progresiva 42+900	Progresiva generada automáticamente: 42+900	42+900	42+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1155	15-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1156	15-43+100	Progresiva 43+100	Progresiva generada automáticamente: 43+100	43+100	43+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1157	15-43+200	Progresiva 43+200	Progresiva generada automáticamente: 43+200	43+200	43+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1158	15-43+300	Progresiva 43+300	Progresiva generada automáticamente: 43+300	43+300	43+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1159	15-43+400	Progresiva 43+400	Progresiva generada automáticamente: 43+400	43+400	43+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1160	15-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1161	15-43+600	Progresiva 43+600	Progresiva generada automáticamente: 43+600	43+600	43+600	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1162	15-43+700	Progresiva 43+700	Progresiva generada automáticamente: 43+700	43+700	43+700	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1163	15-43+800	Progresiva 43+800	Progresiva generada automáticamente: 43+800	43+800	43+800	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1164	15-43+900	Progresiva 43+900	Progresiva generada automáticamente: 43+900	43+900	43+900	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1165	15-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1166	15-44+100	Progresiva 44+100	Progresiva generada automáticamente: 44+100	44+100	44+100	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1167	15-44+200	Progresiva 44+200	Progresiva generada automáticamente: 44+200	44+200	44+200	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1168	15-44+300	Progresiva 44+300	Progresiva generada automáticamente: 44+300	44+300	44+300	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1169	15-44+400	Progresiva 44+400	Progresiva generada automáticamente: 44+400	44+400	44+400	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1170	15-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-08 15:14:32.501231+00	2025-08-08 15:14:32.501231+00	\N	15	2	\N	\N	\N	724	-72.537347	-12.612858	18L	\N	\N
1719	1695-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1720	1695-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1721	1695-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1722	1695-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1723	1695-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1724	1695-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1725	1695-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1726	1695-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1727	1695-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1728	1695-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1729	1695-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1730	1695-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1731	1695-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1732	1695-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1733	1695-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1734	1695-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1735	1695-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1736	1695-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1737	1695-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1738	1695-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1739	1695-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1740	1695-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1741	1695-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1742	1695-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1743	1695-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1744	1695-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1745	1695-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1746	1695-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1747	1695-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1748	1695-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1749	1695-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1750	1695-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1751	1695-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1752	1695-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1753	1695-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1754	1695-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1755	1695-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1756	1695-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1757	1695-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1758	1695-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1759	1695-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1760	1695-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1218	PROGRESI-idfq9-91e	progresiva 78	saweretyjjewretrt	0+000	78+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	\N	-72.537347	-12.612858	18L	\N	\N
1219	1218-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1220	1218-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1221	1218-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1222	1218-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1223	1218-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1224	1218-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1225	1218-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1226	1218-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1227	1218-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1228	1218-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1229	1218-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1230	1218-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1231	1218-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1232	1218-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1233	1218-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1234	1218-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1235	1218-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1236	1218-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1237	1218-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1238	1218-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1239	1218-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1240	1218-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1241	1218-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1242	1218-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1243	1218-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1244	1218-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1245	1218-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1246	1218-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1247	1218-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1248	1218-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1249	1218-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1250	1218-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1251	1218-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1252	1218-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1253	1218-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1254	1218-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1255	1218-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1256	1218-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1257	1218-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1258	1218-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1259	1218-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1260	1218-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1261	1218-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1262	1218-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1263	1218-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1264	1218-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1265	1218-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1266	1218-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1267	1218-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1268	1218-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1269	1218-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1270	1218-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1271	1218-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1272	1218-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1273	1218-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1274	1218-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1275	1218-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1276	1218-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1277	1218-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1278	1218-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1279	1218-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1280	1218-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1281	1218-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1282	1218-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1283	1218-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1284	1218-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1285	1218-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1286	1218-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1287	1218-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1288	1218-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1289	1218-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1290	1218-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1291	1218-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1292	1218-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1293	1218-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1294	1218-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1295	1218-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1296	1218-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1297	1218-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1298	1218-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1299	1218-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1300	1218-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1301	1218-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1302	1218-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1303	1218-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1304	1218-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1305	1218-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1306	1218-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1307	1218-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1308	1218-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1309	1218-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1310	1218-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1311	1218-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1312	1218-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1313	1218-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1314	1218-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1315	1218-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1316	1218-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1317	1218-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1318	1218-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1319	1218-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1320	1218-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1321	1218-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1322	1218-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1323	1218-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1324	1218-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1325	1218-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1326	1218-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1327	1218-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1328	1218-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1329	1218-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1330	1218-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1331	1218-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1332	1218-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1333	1218-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1334	1218-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1335	1218-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1336	1218-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1337	1218-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1338	1218-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1339	1218-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1340	1218-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1341	1218-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1342	1218-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1343	1218-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1344	1218-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1345	1218-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1346	1218-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1347	1218-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1348	1218-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1349	1218-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1350	1218-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1351	1218-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1352	1218-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1353	1218-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1354	1218-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1355	1218-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1356	1218-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1357	1218-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1358	1218-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1359	1218-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1360	1218-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1361	1218-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1362	1218-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1363	1218-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1364	1218-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1365	1218-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1366	1218-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1367	1218-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1368	1218-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1369	1218-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1370	1218-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1371	1218-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1372	1218-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1373	1218-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1374	1218-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1375	1218-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1376	1218-78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-14 14:42:30.720306+00	2025-08-14 14:42:30.720306+00	\N	14	2	\N	\N	\N	1218	\N	\N	18L	\N	\N
1761	1695-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1762	1695-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1763	1695-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1764	1695-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1765	1695-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1766	1695-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1767	1695-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1768	1695-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1769	1695-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1770	1695-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1771	1695-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1772	1695-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1773	1695-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1774	1695-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1775	1695-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1776	1695-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1777	1695-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1778	1695-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1779	1695-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1780	1695-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1781	1695-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1782	1695-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1783	1695-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1784	1695-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1785	1695-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1786	1695-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1787	1695-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1788	1695-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1789	1695-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1790	1695-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1791	1695-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1792	1695-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1793	1695-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1794	1695-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1795	1695-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1796	1695-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1797	1695-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1798	1695-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1799	1695-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1800	1695-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1801	1695-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1802	1695-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1803	1695-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1804	1695-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1805	1695-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1806	1695-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1807	1695-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1808	1695-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1809	1695-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1810	1695-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1811	1695-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1812	1695-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1813	1695-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1814	1695-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1815	1695-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1816	1695-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1817	1695-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1818	1695-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1819	1695-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1820	1695-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1821	1695-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1822	1695-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1823	1695-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1824	1695-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1825	1695-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1826	1695-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1827	1695-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1828	1695-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1829	1695-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1830	1695-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1831	1695-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1832	1695-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1833	1695-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1834	1695-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1835	1695-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1836	1695-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1837	1695-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1838	1695-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1839	1695-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1840	1695-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1841	1695-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1842	1695-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1843	1695-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1844	1695-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1845	1695-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1846	1695-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1847	1695-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1848	1695-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1849	1695-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1850	1695-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1851	1695-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1852	1695-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1853	1695-78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-14 17:28:16.107754+00	2025-08-14 17:28:16.107754+00	\N	14	2	\N	\N	\N	1695	\N	\N	18L	\N	\N
1909	1905-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1910	1905-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1911	1905-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1912	1905-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1913	1905-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1914	1905-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1915	1905-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1916	1905-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1917	1905-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1918	1905-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1919	1905-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1920	1905-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1921	1905-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1922	1905-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1923	1905-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1924	1905-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1925	1905-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1926	1905-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1927	1905-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1928	1905-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1929	1905-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1930	1905-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1931	1905-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1932	1905-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1933	1905-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1934	1905-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1935	1905-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1936	1905-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1937	1905-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1938	1905-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1939	1905-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1940	1905-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1941	1905-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1942	1905-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1943	1905-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1944	1905-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1945	1905-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1854	S-omrr5-27d	s	asdasd	0+000	12+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	\N	12.000000	12.000000	17L	\N	\N
1855	1854-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1856	1854-0+250	Progresiva 0+250	Progresiva generada automáticamente: 0+250	0+250	0+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1857	1854-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1858	1854-0+750	Progresiva 0+750	Progresiva generada automáticamente: 0+750	0+750	0+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1859	1854-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1860	1854-1+250	Progresiva 1+250	Progresiva generada automáticamente: 1+250	1+250	1+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1861	1854-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1862	1854-1+750	Progresiva 1+750	Progresiva generada automáticamente: 1+750	1+750	1+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1863	1854-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1864	1854-2+250	Progresiva 2+250	Progresiva generada automáticamente: 2+250	2+250	2+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1865	1854-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1866	1854-2+750	Progresiva 2+750	Progresiva generada automáticamente: 2+750	2+750	2+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1867	1854-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1868	1854-3+250	Progresiva 3+250	Progresiva generada automáticamente: 3+250	3+250	3+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1869	1854-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1870	1854-3+750	Progresiva 3+750	Progresiva generada automáticamente: 3+750	3+750	3+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1871	1854-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1872	1854-4+250	Progresiva 4+250	Progresiva generada automáticamente: 4+250	4+250	4+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1873	1854-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1874	1854-4+750	Progresiva 4+750	Progresiva generada automáticamente: 4+750	4+750	4+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1875	1854-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1876	1854-5+250	Progresiva 5+250	Progresiva generada automáticamente: 5+250	5+250	5+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1877	1854-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1878	1854-5+750	Progresiva 5+750	Progresiva generada automáticamente: 5+750	5+750	5+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1879	1854-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1880	1854-6+250	Progresiva 6+250	Progresiva generada automáticamente: 6+250	6+250	6+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1881	1854-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1882	1854-6+750	Progresiva 6+750	Progresiva generada automáticamente: 6+750	6+750	6+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1883	1854-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1884	1854-7+250	Progresiva 7+250	Progresiva generada automáticamente: 7+250	7+250	7+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1885	1854-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1886	1854-7+750	Progresiva 7+750	Progresiva generada automáticamente: 7+750	7+750	7+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1887	1854-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1888	1854-8+250	Progresiva 8+250	Progresiva generada automáticamente: 8+250	8+250	8+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1889	1854-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1890	1854-8+750	Progresiva 8+750	Progresiva generada automáticamente: 8+750	8+750	8+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1891	1854-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1892	1854-9+250	Progresiva 9+250	Progresiva generada automáticamente: 9+250	9+250	9+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1893	1854-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1894	1854-9+750	Progresiva 9+750	Progresiva generada automáticamente: 9+750	9+750	9+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1895	1854-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1896	1854-10+250	Progresiva 10+250	Progresiva generada automáticamente: 10+250	10+250	10+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1897	1854-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1898	1854-10+750	Progresiva 10+750	Progresiva generada automáticamente: 10+750	10+750	10+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1899	1854-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1900	1854-11+250	Progresiva 11+250	Progresiva generada automáticamente: 11+250	11+250	11+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1901	1854-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1902	1854-11+750	Progresiva 11+750	Progresiva generada automáticamente: 11+750	11+750	11+750	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1903	1854-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1904	1854-12+250	Progresiva 12+250	Progresiva generada automáticamente: 12+250	12+250	12+250	activo	2025-08-14 17:37:43.903713+00	2025-08-14 17:37:43.903713+00	\N	1	2	\N	\N	\N	1854	\N	\N	18L	\N	\N
1946	1905-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1947	1905-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1536	WAFEGRHT-ldjas-197	wafegrhtygum	wqert	0+000	78+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	\N	-72.537347	-12.612858	18L	\N	\N
1537	1536-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1538	1536-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1539	1536-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1540	1536-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1541	1536-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1542	1536-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1543	1536-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1544	1536-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1545	1536-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1546	1536-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1547	1536-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1548	1536-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1549	1536-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1550	1536-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1551	1536-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1552	1536-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1553	1536-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1554	1536-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1555	1536-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1556	1536-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1557	1536-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1558	1536-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1559	1536-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1560	1536-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1561	1536-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1562	1536-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1563	1536-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1564	1536-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1565	1536-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1566	1536-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1567	1536-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1568	1536-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1569	1536-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1570	1536-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1571	1536-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1572	1536-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1573	1536-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1948	1905-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1574	1536-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1575	1536-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1576	1536-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1577	1536-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1578	1536-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1579	1536-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1580	1536-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1581	1536-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1582	1536-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1583	1536-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1584	1536-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1585	1536-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1586	1536-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1587	1536-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1588	1536-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1589	1536-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1590	1536-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1591	1536-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1592	1536-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1593	1536-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1594	1536-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1595	1536-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1596	1536-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1597	1536-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1598	1536-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1599	1536-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1600	1536-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1601	1536-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1602	1536-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1603	1536-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1604	1536-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1605	1536-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1606	1536-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1607	1536-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1608	1536-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1609	1536-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1610	1536-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1611	1536-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1612	1536-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1613	1536-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1614	1536-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1905	12312-oxfhh-bf8	12312		0+000	85+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	\N	\N	\N	18L	\N	\N
1615	1536-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1616	1536-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1617	1536-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1618	1536-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1619	1536-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1620	1536-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1621	1536-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1622	1536-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1623	1536-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1624	1536-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1625	1536-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1626	1536-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1627	1536-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1628	1536-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1629	1536-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1630	1536-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1631	1536-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1632	1536-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1633	1536-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1634	1536-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1635	1536-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1636	1536-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1637	1536-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1638	1536-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1639	1536-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1640	1536-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1641	1536-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1642	1536-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1643	1536-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1644	1536-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1645	1536-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1646	1536-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1647	1536-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1648	1536-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1649	1536-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1650	1536-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1651	1536-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1652	1536-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1653	1536-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1654	1536-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1655	1536-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
2012	12312-oxl5p-371	12312		0+000	85+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	\N	\N	\N	18L	\N	\N
1656	1536-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1657	1536-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1658	1536-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1659	1536-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1660	1536-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1661	1536-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1662	1536-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1663	1536-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1664	1536-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1665	1536-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1666	1536-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1667	1536-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1668	1536-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1669	1536-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1670	1536-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1671	1536-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1672	1536-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1673	1536-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1674	1536-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1675	1536-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1676	1536-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1677	1536-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1678	1536-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1679	1536-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1680	1536-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1681	1536-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1682	1536-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1683	1536-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1684	1536-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1685	1536-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1686	1536-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1687	1536-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1688	1536-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1689	1536-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1690	1536-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1691	1536-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1692	1536-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1693	1536-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1694	1536-78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-14 16:06:34.194799+00	2025-08-14 16:06:34.194799+00	\N	16	1	\N	\N	\N	1536	-72.537347	-12.612858	18L	\N	\N
1906	1905-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1907	1905-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1908	1905-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1949	1905-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1950	1905-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1951	1905-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1952	1905-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1953	1905-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1954	1905-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1955	1905-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1956	1905-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1957	1905-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1958	1905-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1959	1905-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1960	1905-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1961	1905-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1962	1905-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1963	1905-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1964	1905-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1965	1905-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1966	1905-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1967	1905-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1968	1905-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1969	1905-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1970	1905-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1971	1905-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1972	1905-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1973	1905-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1974	1905-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1975	1905-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1976	1905-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1977	1905-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1978	1905-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1979	1905-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1980	1905-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1981	1905-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1982	1905-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1983	1905-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1984	1905-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1985	1905-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1986	1905-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1987	1905-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1988	1905-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1989	1905-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1990	1905-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1991	1905-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1992	1905-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1993	1905-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1994	1905-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1995	1905-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1996	1905-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1997	1905-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1998	1905-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
1999	1905-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2000	1905-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2001	1905-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2002	1905-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2003	1905-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2004	1905-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2005	1905-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2006	1905-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2007	1905-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2008	1905-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2009	1905-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2010	1905-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2011	1905-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2013	1905-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2014	1905-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2015	1905-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2017	1905-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2019	1905-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2021	1905-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2023	1905-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2025	1905-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2027	1905-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2029	1905-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2031	1905-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2033	1905-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2035	1905-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2037	1905-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2039	1905-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2041	1905-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2043	1905-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2045	1905-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2047	1905-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2049	1905-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2051	1905-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2053	1905-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2055	1905-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2057	1905-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2059	1905-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2061	1905-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2063	1905-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2065	1905-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2067	1905-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2069	1905-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2071	1905-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2016	2012-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2018	2012-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2020	2012-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2022	2012-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2024	2012-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2026	2012-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2028	2012-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2030	2012-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2032	2012-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2034	2012-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2036	2012-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2038	2012-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2040	2012-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2042	2012-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2044	2012-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2046	2012-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2048	2012-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2050	2012-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2052	2012-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2054	2012-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2056	2012-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2058	2012-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2060	2012-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2062	2012-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2064	2012-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2066	2012-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2068	2012-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2070	2012-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2072	2012-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2074	2012-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2076	2012-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2078	2012-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2080	2012-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2082	2012-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2084	2012-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2086	2012-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2088	2012-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2090	2012-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2092	2012-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2094	2012-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2096	2012-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2098	2012-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2100	2012-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2102	2012-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2104	2012-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2106	2012-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2108	2012-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2110	2012-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2073	1905-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2075	1905-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2077	1905-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2079	1905-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2081	1905-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2083	1905-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2085	1905-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2087	1905-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2089	1905-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2091	1905-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2093	1905-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2095	1905-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2097	1905-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2099	1905-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2101	1905-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2103	1905-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2105	1905-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2107	1905-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2109	1905-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2111	1905-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2113	1905-78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2115	1905-79+000	Progresiva 79+000	Progresiva generada automáticamente: 79+000	79+000	79+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2117	1905-79+500	Progresiva 79+500	Progresiva generada automáticamente: 79+500	79+500	79+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2119	1905-80+000	Progresiva 80+000	Progresiva generada automáticamente: 80+000	80+000	80+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2121	1905-80+500	Progresiva 80+500	Progresiva generada automáticamente: 80+500	80+500	80+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2123	1905-81+000	Progresiva 81+000	Progresiva generada automáticamente: 81+000	81+000	81+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2125	1905-81+500	Progresiva 81+500	Progresiva generada automáticamente: 81+500	81+500	81+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2127	1905-82+000	Progresiva 82+000	Progresiva generada automáticamente: 82+000	82+000	82+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2129	1905-82+500	Progresiva 82+500	Progresiva generada automáticamente: 82+500	82+500	82+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2131	1905-83+000	Progresiva 83+000	Progresiva generada automáticamente: 83+000	83+000	83+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2133	1905-83+500	Progresiva 83+500	Progresiva generada automáticamente: 83+500	83+500	83+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2135	1905-84+000	Progresiva 84+000	Progresiva generada automáticamente: 84+000	84+000	84+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2137	1905-84+500	Progresiva 84+500	Progresiva generada automáticamente: 84+500	84+500	84+500	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2139	1905-85+000	Progresiva 85+000	Progresiva generada automáticamente: 85+000	85+000	85+000	activo	2025-08-14 17:46:01.220012+00	2025-08-14 17:46:01.220012+00	\N	16	1	\N	\N	\N	1905	\N	\N	18L	\N	\N
2150	12312-oxp21-799	12312		0+000	85+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	\N	\N	\N	18L	\N	\N
2154	2150-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2156	2150-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2158	2150-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2160	2150-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2162	2150-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2164	2150-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2166	2150-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2168	2150-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2170	2150-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2172	2150-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2174	2150-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2176	2150-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2178	2150-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2112	2012-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2114	2012-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2116	2012-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2118	2012-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2120	2012-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2122	2012-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2124	2012-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2126	2012-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2128	2012-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2130	2012-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2132	2012-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2134	2012-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2136	2012-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2138	2012-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2140	2012-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2141	2012-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2142	2012-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2143	2012-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2144	2012-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2145	2012-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2146	2012-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2147	2012-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2148	2012-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2149	2012-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2151	2012-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2152	2012-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2153	2012-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2155	2012-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2157	2012-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2159	2012-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2161	2012-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2163	2012-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2165	2012-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2167	2012-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2169	2012-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2171	2012-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2173	2012-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2175	2012-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2177	2012-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2179	2012-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2181	2012-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2183	2012-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2185	2012-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2187	2012-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2189	2012-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2191	2012-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2193	2012-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2180	2150-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2182	2150-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2184	2150-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2186	2150-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2188	2150-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2190	2150-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2192	2150-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2194	2150-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2196	2150-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2198	2150-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2200	2150-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2202	2150-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2204	2150-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2206	2150-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2208	2150-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2210	2150-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2212	2150-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2214	2150-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2216	2150-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2218	2150-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2220	2150-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2222	2150-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2224	2150-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2226	2150-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2228	2150-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2230	2150-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2232	2150-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2234	2150-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2236	2150-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2238	2150-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2240	2150-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2242	2150-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2244	2150-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2246	2150-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2248	2150-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2250	2150-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2252	2150-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2254	2150-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2256	2150-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2258	2150-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2260	2150-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2262	2150-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2264	2150-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2266	2150-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2268	2150-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2270	2150-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2272	2150-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2195	2012-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2197	2012-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2199	2012-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2201	2012-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2203	2012-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2205	2012-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2207	2012-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2209	2012-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2211	2012-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2213	2012-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2215	2012-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2217	2012-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2219	2012-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2221	2012-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2223	2012-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2225	2012-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2227	2012-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2229	2012-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2231	2012-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2233	2012-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2235	2012-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2237	2012-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2239	2012-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2241	2012-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2243	2012-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2245	2012-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2247	2012-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2249	2012-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2251	2012-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2253	2012-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2255	2012-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2257	2012-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2259	2012-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2261	2012-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2263	2012-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2265	2012-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2267	2012-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2269	2012-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2271	2012-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2273	2012-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2275	2012-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2277	2012-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2279	2012-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2281	2012-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2283	2012-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2285	2012-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2287	2012-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2274	2150-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2276	2150-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2278	2150-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2280	2150-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2282	2150-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2284	2150-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2286	2150-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2288	2150-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2290	2150-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2292	2150-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2294	2150-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2296	2150-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2298	2150-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2300	2150-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2302	2150-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2304	2150-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2306	2150-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2308	2150-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2310	2150-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2312	2150-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2314	2150-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2316	2150-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2318	2150-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2320	2150-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2322	2150-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2324	2150-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2326	2150-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2328	2150-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2330	2150-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2332	2150-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2334	2150-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2336	2150-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2338	2150-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2340	2150-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2342	2150-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2344	2150-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2346	2150-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2347	2150-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2348	2150-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2350	2150-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2351	2150-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2352	2150-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2354	2150-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2356	2150-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2358	2150-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2360	2150-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2362	2150-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2289	2012-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2291	2012-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2293	2012-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2295	2012-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2297	2012-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2299	2012-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2301	2012-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2303	2012-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2305	2012-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2307	2012-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2309	2012-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2311	2012-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2313	2012-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2315	2012-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2317	2012-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2319	2012-78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2321	2012-79+000	Progresiva 79+000	Progresiva generada automáticamente: 79+000	79+000	79+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2323	2012-79+500	Progresiva 79+500	Progresiva generada automáticamente: 79+500	79+500	79+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2325	2012-80+000	Progresiva 80+000	Progresiva generada automáticamente: 80+000	80+000	80+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2327	2012-80+500	Progresiva 80+500	Progresiva generada automáticamente: 80+500	80+500	80+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2329	2012-81+000	Progresiva 81+000	Progresiva generada automáticamente: 81+000	81+000	81+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2331	2012-81+500	Progresiva 81+500	Progresiva generada automáticamente: 81+500	81+500	81+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2333	2012-82+000	Progresiva 82+000	Progresiva generada automáticamente: 82+000	82+000	82+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2335	2012-82+500	Progresiva 82+500	Progresiva generada automáticamente: 82+500	82+500	82+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2337	2012-83+000	Progresiva 83+000	Progresiva generada automáticamente: 83+000	83+000	83+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2339	2012-83+500	Progresiva 83+500	Progresiva generada automáticamente: 83+500	83+500	83+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2341	2012-84+000	Progresiva 84+000	Progresiva generada automáticamente: 84+000	84+000	84+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2343	2012-84+500	Progresiva 84+500	Progresiva generada automáticamente: 84+500	84+500	84+500	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2345	2012-85+000	Progresiva 85+000	Progresiva generada automáticamente: 85+000	85+000	85+000	activo	2025-08-14 17:46:08.572686+00	2025-08-14 17:46:08.572686+00	\N	16	1	\N	\N	\N	2012	\N	\N	18L	\N	\N
2349	12312-oxud3-271	12312		0+000	85+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	\N	\N	\N	18L	\N	\N
2353	2349-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2355	2349-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2357	2349-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2359	2349-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2361	2349-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2363	2349-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2365	2349-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2367	2349-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2369	2349-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2371	2349-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2373	2349-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2375	2349-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2377	2349-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2379	2349-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2381	2349-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2383	2349-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2385	2349-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2387	2349-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2364	2150-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2366	2150-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2368	2150-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2370	2150-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2372	2150-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2374	2150-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2376	2150-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2378	2150-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2380	2150-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2382	2150-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2384	2150-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2386	2150-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2388	2150-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2390	2150-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2392	2150-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2394	2150-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2396	2150-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2398	2150-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2400	2150-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2402	2150-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2404	2150-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2406	2150-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2408	2150-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2410	2150-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2412	2150-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2414	2150-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2416	2150-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2418	2150-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2420	2150-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2422	2150-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2424	2150-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2426	2150-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2428	2150-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2430	2150-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2432	2150-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2434	2150-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2436	2150-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2438	2150-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2440	2150-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2442	2150-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2444	2150-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2446	2150-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2448	2150-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2450	2150-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2452	2150-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2454	2150-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2456	2150-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2389	2349-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2391	2349-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2393	2349-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2395	2349-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2397	2349-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2399	2349-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2401	2349-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2403	2349-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2405	2349-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2407	2349-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2409	2349-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2411	2349-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2413	2349-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2415	2349-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2417	2349-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2419	2349-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2421	2349-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2423	2349-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2425	2349-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2427	2349-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2429	2349-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2431	2349-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2433	2349-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2435	2349-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2437	2349-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2439	2349-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2441	2349-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2443	2349-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2445	2349-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2447	2349-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2449	2349-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2451	2349-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2453	2349-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2455	2349-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2457	2349-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2459	2349-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2461	2349-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2463	2349-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2465	2349-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2467	2349-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2469	2349-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2471	2349-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2473	2349-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2475	2349-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2477	2349-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2479	2349-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2481	2349-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2458	2150-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2460	2150-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2462	2150-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2464	2150-78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2466	2150-79+000	Progresiva 79+000	Progresiva generada automáticamente: 79+000	79+000	79+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2468	2150-79+500	Progresiva 79+500	Progresiva generada automáticamente: 79+500	79+500	79+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2470	2150-80+000	Progresiva 80+000	Progresiva generada automáticamente: 80+000	80+000	80+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2472	2150-80+500	Progresiva 80+500	Progresiva generada automáticamente: 80+500	80+500	80+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2474	2150-81+000	Progresiva 81+000	Progresiva generada automáticamente: 81+000	81+000	81+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2476	2150-81+500	Progresiva 81+500	Progresiva generada automáticamente: 81+500	81+500	81+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2478	2150-82+000	Progresiva 82+000	Progresiva generada automáticamente: 82+000	82+000	82+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2480	2150-82+500	Progresiva 82+500	Progresiva generada automáticamente: 82+500	82+500	82+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2482	2150-83+000	Progresiva 83+000	Progresiva generada automáticamente: 83+000	83+000	83+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2484	2150-83+500	Progresiva 83+500	Progresiva generada automáticamente: 83+500	83+500	83+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2486	2150-84+000	Progresiva 84+000	Progresiva generada automáticamente: 84+000	84+000	84+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2488	2150-84+500	Progresiva 84+500	Progresiva generada automáticamente: 84+500	84+500	84+500	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2490	2150-85+000	Progresiva 85+000	Progresiva generada automáticamente: 85+000	85+000	85+000	activo	2025-08-14 17:46:13.623728+00	2025-08-14 17:46:13.623728+00	\N	16	1	\N	\N	\N	2150	\N	\N	18L	\N	\N
2494	12312-oxy9c-0d7	12312		0+000	85+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	\N	\N	\N	18L	\N	\N
2498	2494-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2500	2494-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2502	2494-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2504	2494-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2506	2494-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2508	2494-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2510	2494-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2512	2494-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2514	2494-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2516	2494-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2518	2494-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2520	2494-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2522	2494-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2524	2494-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2526	2494-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2528	2494-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2530	2494-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2532	2494-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2534	2494-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2536	2494-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2538	2494-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2540	2494-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2542	2494-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2544	2494-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2546	2494-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2548	2494-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2550	2494-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2552	2494-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2554	2494-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2556	2494-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2483	2349-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2485	2349-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2487	2349-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2489	2349-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2491	2349-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2492	2349-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2493	2349-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2495	2349-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2496	2349-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2497	2349-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2499	2349-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2501	2349-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2503	2349-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2505	2349-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2507	2349-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2509	2349-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2511	2349-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2513	2349-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2515	2349-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2517	2349-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2519	2349-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2521	2349-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2523	2349-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2525	2349-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2527	2349-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2529	2349-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2531	2349-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2533	2349-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2535	2349-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2537	2349-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2539	2349-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2541	2349-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2543	2349-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2545	2349-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2547	2349-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2549	2349-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2551	2349-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2553	2349-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2555	2349-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2557	2349-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2559	2349-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2561	2349-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2563	2349-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2565	2349-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2567	2349-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2569	2349-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2571	2349-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2558	2494-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2560	2494-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2562	2494-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2564	2494-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2566	2494-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2568	2494-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2570	2494-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2572	2494-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2574	2494-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2576	2494-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2578	2494-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2580	2494-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2582	2494-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2584	2494-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2586	2494-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2588	2494-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2590	2494-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2592	2494-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2594	2494-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2596	2494-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2598	2494-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2600	2494-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2602	2494-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2604	2494-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2606	2494-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2608	2494-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2610	2494-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2612	2494-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2614	2494-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2616	2494-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2618	2494-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2620	2494-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2622	2494-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2624	2494-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2626	2494-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2628	2494-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2630	2494-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2632	2494-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2634	2494-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2636	2494-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2638	2494-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2640	2494-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2642	2494-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2644	2494-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2646	2494-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2648	2494-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2650	2494-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2573	2349-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2575	2349-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2577	2349-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2579	2349-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2581	2349-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2583	2349-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2585	2349-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2587	2349-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2589	2349-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2591	2349-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2593	2349-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2595	2349-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2597	2349-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2599	2349-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2601	2349-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2603	2349-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2605	2349-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2607	2349-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2609	2349-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2611	2349-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2613	2349-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2615	2349-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2617	2349-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2619	2349-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2621	2349-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2623	2349-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2625	2349-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2627	2349-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2629	2349-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2631	2349-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2633	2349-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2635	2349-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2637	2349-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2639	2349-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2641	2349-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2643	2349-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2645	2349-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2647	2349-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2649	2349-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2651	2349-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2653	2349-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2655	2349-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2657	2349-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2659	2349-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2661	2349-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2663	2349-78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2665	2349-79+000	Progresiva 79+000	Progresiva generada automáticamente: 79+000	79+000	79+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2652	2494-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2654	2494-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2656	2494-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2658	2494-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2660	2494-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2662	2494-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2664	2494-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2666	2494-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2668	2494-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2670	2494-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2672	2494-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2674	2494-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2676	2494-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2678	2494-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2680	2494-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2682	2494-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2684	2494-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2686	2494-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2688	2494-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2690	2494-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2691	2494-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2692	2494-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2693	2494-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2694	2494-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2695	2494-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2696	2494-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2697	2494-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2698	2494-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2699	2494-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2700	2494-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2701	2494-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2702	2494-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2703	2494-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2704	2494-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2705	2494-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2706	2494-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2707	2494-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2708	2494-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2709	2494-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2710	2494-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2711	2494-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2712	2494-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2713	2494-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2714	2494-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2715	2494-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2716	2494-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2717	2494-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2667	2349-79+500	Progresiva 79+500	Progresiva generada automáticamente: 79+500	79+500	79+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2669	2349-80+000	Progresiva 80+000	Progresiva generada automáticamente: 80+000	80+000	80+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2671	2349-80+500	Progresiva 80+500	Progresiva generada automáticamente: 80+500	80+500	80+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2673	2349-81+000	Progresiva 81+000	Progresiva generada automáticamente: 81+000	81+000	81+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2675	2349-81+500	Progresiva 81+500	Progresiva generada automáticamente: 81+500	81+500	81+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2677	2349-82+000	Progresiva 82+000	Progresiva generada automáticamente: 82+000	82+000	82+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2679	2349-82+500	Progresiva 82+500	Progresiva generada automáticamente: 82+500	82+500	82+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2681	2349-83+000	Progresiva 83+000	Progresiva generada automáticamente: 83+000	83+000	83+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2683	2349-83+500	Progresiva 83+500	Progresiva generada automáticamente: 83+500	83+500	83+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2685	2349-84+000	Progresiva 84+000	Progresiva generada automáticamente: 84+000	84+000	84+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2687	2349-84+500	Progresiva 84+500	Progresiva generada automáticamente: 84+500	84+500	84+500	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2689	2349-85+000	Progresiva 85+000	Progresiva generada automáticamente: 85+000	85+000	85+000	activo	2025-08-14 17:46:20.50229+00	2025-08-14 17:46:20.50229+00	\N	16	1	\N	\N	\N	2349	\N	\N	18L	\N	\N
2718	2494-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2719	2494-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2720	2494-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2721	2494-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2722	2494-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2723	2494-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2724	2494-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2725	2494-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2726	2494-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2727	2494-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2728	2494-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2729	2494-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2730	2494-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2731	2494-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2732	2494-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2733	2494-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2734	2494-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2735	2494-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2736	2494-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2737	2494-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2738	2494-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2739	2494-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2740	2494-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2741	2494-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2742	2494-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2743	2494-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2744	2494-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2745	2494-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2746	2494-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2747	2494-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2748	2494-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2749	2494-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2750	2494-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2751	2494-78+500	Progresiva 78+500	Progresiva generada automáticamente: 78+500	78+500	78+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2752	2494-79+000	Progresiva 79+000	Progresiva generada automáticamente: 79+000	79+000	79+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2753	2494-79+500	Progresiva 79+500	Progresiva generada automáticamente: 79+500	79+500	79+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2754	2494-80+000	Progresiva 80+000	Progresiva generada automáticamente: 80+000	80+000	80+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2755	2494-80+500	Progresiva 80+500	Progresiva generada automáticamente: 80+500	80+500	80+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2756	2494-81+000	Progresiva 81+000	Progresiva generada automáticamente: 81+000	81+000	81+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2757	2494-81+500	Progresiva 81+500	Progresiva generada automáticamente: 81+500	81+500	81+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2758	2494-82+000	Progresiva 82+000	Progresiva generada automáticamente: 82+000	82+000	82+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2759	2494-82+500	Progresiva 82+500	Progresiva generada automáticamente: 82+500	82+500	82+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2760	2494-83+000	Progresiva 83+000	Progresiva generada automáticamente: 83+000	83+000	83+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2761	2494-83+500	Progresiva 83+500	Progresiva generada automáticamente: 83+500	83+500	83+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2762	2494-84+000	Progresiva 84+000	Progresiva generada automáticamente: 84+000	84+000	84+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2763	2494-84+500	Progresiva 84+500	Progresiva generada automáticamente: 84+500	84+500	84+500	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
2764	2494-85+000	Progresiva 85+000	Progresiva generada automáticamente: 85+000	85+000	85+000	activo	2025-08-14 17:46:25.551256+00	2025-08-14 17:46:25.551256+00	\N	16	1	\N	\N	\N	2494	\N	\N	18L	\N	\N
\.


--
-- Data for Name: provincias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provincias (id, nombre, codigo_provincia, codigo_departamento) FROM stdin;
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proyectos (id, codigo, nombre_proyecto, descripcion_proyecto, estado, nombre_tramo, proyecto_nom, solicitante, departamento, provincia, distrito, localidad, longitud_total, progresiva_inicial, tipo_via, intervalo_manual, descripcion_larga, create_at, update_at) FROM stdin;
1	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	85520	0+000	500	\N		2025-08-07 20:42:53.739003	2025-08-07 20:42:53.739003
14	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	14785	0+000	500	\N		2025-08-08 15:05:08.946268	2025-08-08 15:05:08.946268
15	\N	\N	\N	Activo	proyecto 22121	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	mi casa	44548	0+000	100	\N		2025-08-08 15:14:32.501231	2025-08-08 15:14:32.501231
16	\N	\N	\N	Activo	proyecto 2111122222	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0804	080405	rtyhhrtew	78954	0+000	500	\N		2025-08-14 15:45:37.268952	2025-08-14 15:45:37.268952
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, nombre, descripcion) FROM stdin;
1	COORDINADOR PROYECTO	Usuario con acceso completo a todas las especialidades
2	ESPECIALISTA	Usuario con acceso completo solo para su especialidad
3	ASISTENTE	Usuario con permisos limitados para su especialidad
4	TECNICOS I	Usuario que solo puede subir información
5	COORDINADOR DE EVALUACION	Usuario que puede aprobar y subir archivos
6	EVALUADOR	Usuario que solo puede aprobar y subir archivos
7	ADMIN	Administrador del sistema con acceso total
8	VISITANTE	Dispobile solo para ver y comentar
\.


--
-- Data for Name: roles_navbar_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_navbar_options (id, role_id, navbar_option_id, visible) FROM stdin;
206	6	16	f
207	6	17	f
208	6	18	f
209	6	19	f
210	6	20	f
211	6	21	t
212	6	22	f
307	2	6	t
308	2	7	t
309	2	8	t
310	2	9	t
311	2	10	t
312	2	11	t
313	2	12	t
314	2	13	t
315	2	14	f
316	2	15	t
317	2	16	t
318	2	17	t
319	2	18	t
320	2	19	t
352	7	7	t
353	7	8	t
354	7	9	t
355	7	10	t
356	7	11	t
357	7	12	t
358	7	13	t
359	7	14	t
360	7	15	t
361	7	16	t
362	7	17	t
363	7	18	t
321	2	20	t
364	7	19	t
365	7	20	t
366	7	21	t
367	7	22	t
1	1	1	t
2	1	2	t
3	1	3	t
4	1	4	t
5	1	5	t
6	1	6	t
7	1	7	t
8	1	8	t
9	1	9	t
10	1	10	t
11	1	11	t
12	1	12	t
13	1	13	t
14	1	14	t
15	1	15	t
16	1	16	t
17	1	17	t
18	1	18	t
19	1	19	t
20	1	20	t
21	1	21	t
190	1	22	f
191	6	1	t
192	6	2	t
193	6	3	t
194	6	4	t
195	6	5	t
196	6	6	t
197	6	7	t
198	6	8	t
199	6	9	t
200	6	10	t
201	6	11	f
202	6	12	f
203	6	13	f
204	6	14	f
205	6	15	f
322	2	21	t
323	2	22	t
346	7	1	t
347	7	2	t
348	7	3	t
349	7	4	t
350	7	5	t
148	8	1	t
149	8	2	t
150	8	3	f
151	8	4	f
152	8	5	f
153	8	6	f
154	8	7	t
155	8	8	f
156	8	9	f
157	8	10	t
158	8	11	f
159	8	12	f
160	8	13	f
161	8	14	f
162	8	15	f
163	8	16	f
164	8	17	f
165	8	18	f
166	8	19	f
167	8	20	f
168	8	21	t
256	8	22	t
302	2	1	t
303	2	2	t
304	2	3	t
305	2	4	t
306	2	5	t
351	7	6	t
\.


--
-- Data for Name: roles_permisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_permisos (id, rol_id, permiso_id, tipo_acceso) FROM stdin;
17	2	2	lectura
18	2	3	lectura
19	2	5	lectura
20	2	6	lectura
21	2	7	lectura
22	2	8	lectura
23	3	7	lectura
24	3	8	lectura
25	4	3	lectura
26	4	8	lectura
27	5	5	lectura
28	5	3	lectura
29	5	6	lectura
30	5	7	lectura
31	5	8	lectura
32	6	5	lectura
33	6	3	lectura
34	6	8	lectura
40	7	7	lectura
41	7	7	edicion
48	1	7	lectura
49	1	7	edicion
50	1	9	lectura
51	1	9	edicion
58	8	7	lectura
59	8	9	lectura
\.


--
-- Data for Name: rutas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rutas (id, nombre, descripcion, geom) FROM stdin;
1	Ruta Principal CU-104	Trazado de la carretera CU-104 desde el km 0+000 hasta el km 86+364.66	0102000020E610000058000000A3E6ABE4632252C0162F1686C83929C0F90E23298E2252C0E86E3205C63929C0B7AD77C9492252C0FC7E7BE8CC3729C03348669A552252C04D350E50753729C0BBB4E1B0342252C0A7CF0EB8AE3429C069465046262252C0DCEFF55A753229C0C693933FCE2152C0B9D5BD5F163029C0D53439C65F2152C0637AC2120F3029C088ABB992532152C071C63027682F29C00D648742952152C05BC70270FD2D29C0688709B4052252C071E5EC9DD12E29C083D08B248B2252C05287CBE0DE2F29C0CE458D53BE2252C0672783A3E43129C0F697DD93872252C08A0C61EB082E29C06A0B19D95F2252C0E2804C21462A29C0291197D2692252C0CB30EE06D12629C0FBA42435FE2152C0BB9A3C65352529C0BE61ECCEA42152C0E131F268992329C04520A8644A2152C0CF17D6E8302229C0138255F5F22052C09D1ECA06882029C07CF6B75F992052C0FB5C6DC5FE2229C06F06C94C332052C08BDF14562A2429C0A49531F4BE1F52C0B4D3C55C082429C08E41823D811F52C09F8724C4A62329C040B2CA96761F52C02A77FA9C162329C0049376FEC81F52C0D57F31B66B2129C0CA3505323B2052C037CFC76B142029C06872D64C632052C04716D5C7E81D29C035666DAE752052C03DF372D87D1B29C0B74B76C73D2052C09FF0C80EE01729C0FEE208081C2052C0FACF9A1F7F1529C0B72572C1992052C0626AA6D6561729C078FAF7CF092152C0AF1E9CF4631829C08D936703552152C03925C56C6E1529C096D86B30432152C0322DFBBF341229C04E8061F9732152C038AFA01FFC0E29C070F893E7302152C0C3C8DCC6B00C29C0BCB3D194F82052C0FCF37EEDAA0929C068F1BD1A7B2052C098A59D9ACB0929C0D62F229B752052C03E5700F84C0729C0A798DE59962052C09E0AB8E7F90329C075351E11782052C0375E70BCF10029C0D23A0554132052C0DF88EE59D70029C07EB4EED5FD1F52C0B6BC72BD6DFE28C01416269D122052C0853BBC8C07FC28C046F2F0F9BC1F52C0CA49CDC3AEFA28C04404D2B47A1F52C0C31D5EC603F828C0A1CF91A60B1F52C07D2079E750F628C03AA5CD821A1F52C063A6A3D23EF428C0E51714BC571F52C0365A0EF450F328C08B7BE2EFCD1F52C0C82A0021EDF228C083E794360B2052C038A51710B5F028C058569A94022052C076DD5B9198EC28C03EF1F7E6122052C05194957032EB28C0D089F326F51F52C00D3DBDAD4FE828C01277AB9D172052C0C1DDFE017BE928C00D78F41A162052C0B61490F63FE828C09808652BF91F52C05F8A613DA4E628C0A0C37C79012052C042BE3A7DF3E528C0C41CA963BA1F52C01C2E28C23CE628C0A5F622DA0E2052C0C5724BAB21E528C0437AE5D5142052C081221631ECE428C0EA36F28AF11F52C0AFA8D26064E328C0495EE7F0DA1F52C0787E5182FEE228C08449F1F1891F52C0408A3A730FE528C05688A29BD81F52C0FD5B131CA8E128C086C03687102052C0D8800871E5E028C0588D25AC0D2052C0D690B8C7D2DF28C07F4DD6A8072052C028A490BF0FDE28C0499B4FC2F11F52C0CF09EB1049DE28C0199936D2082052C01F29C709B8DC28C0388600E0D81F52C039E9222AF9DD28C09E78CE16901F52C0B91D75CF15E028C0AAD15048571F52C0A18FE854E8E228C0D862B7CF2A1F52C00971E5EC9DE128C02D060FD3BE1E52C066F4A3E194E128C03A234A7B831E52C013EF004F5AE028C02992AF04521E52C058AEB7CD54E028C068588CBAD61D52C0FBAC32535ADF28C0F31FD26F5F1D52C00CCB9F6F0BDE28C0081F4AB4E41C52C0D447E00F3FDF28C033FB3C46791C52C0FB027AE1CEDD28C0C0E95DBC1F1C52C001FBE8D495DF28C0E9297288B81B52C08E06F01648E028C0209A79724D1B52C0CBF8F71917DE28C0376C5B94D91A52C08735954561DF28C0C651B9895A1A52C0C784984BAADE28C00F0C207C281A52C0DD5B9198A0DE28C0
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: tipo_ensayo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipo_ensayo (id, codigo, descripcion, created_at) FROM stdin;
2	1	ANALISIS GRANULOMETRICO DE AGREGADOS	2025-07-14 16:23:14
3	2	MATERIAL QUE PASA MALLA N 200	2025-07-14 16:23:14
4	3	LIMITES DE CONSISTENCIA	2025-07-14 16:23:14
5	4	LIMITE LIQUIDO, LIMITE PLASTICO, INDICE DE PLASTICIDAD	2025-07-14 16:23:14
6	5	CONTENIDO DE HUMEDAD	2025-07-14 16:23:14
7	6	PROCTOR ESTANDAR	2025-07-14 16:23:14
8	7	PROCTOR MODIFICADO	2025-07-14 16:23:14
9	8	CALIFORNIA BEARING RATIO (CBR)	2025-07-14 16:23:14
10	9	GRAVEDAD ESPECIFICA Y ABSORCION AGREGADO GRUESO	2025-07-14 16:23:14
11	10	GRAVEDAD ESPECIFICA Y ABSORCION AGREGADO FINO	2025-07-14 16:23:14
12	11	EQUIVALENTE DE ARENA	2025-07-14 16:23:14
13	12	ABRASION	2025-07-14 16:23:14
14	13	DURABILIDIDAD CONSULFATO DE MAGNESIO	2025-07-14 16:23:14
15	14	PORCENTAJE DE CARAS FRACTURADAS	2025-07-14 16:23:14
16	15	PORCENTAJE DE PARTICULAS PLANAS Y ALARGADAS	2025-07-14 16:23:14
17	16	PARTICULAS LIVIANAS EN LOS AGREGADOS	2025-07-14 16:23:14
18	17	PARTICULAS FRIABLES	2025-07-14 16:23:14
19	18	IMPUREZAS ORGANICAS EN FINOS	2025-07-14 16:23:14
20	19	PESO UNITARIO	2025-07-14 16:23:14
21	20	ADHERENCIA AGREGADO GRUESO	2025-07-14 16:23:14
22	21	ADHERENCIA AGREGADO FINO	2025-07-14 16:23:14
23	22	ENSAYO DE PERMEABILIDAD	2025-07-14 16:23:14
24	23	SALES SOLUBLES TOTALES	2025-07-14 16:23:14
25	24	SULFATOS EXPRESADOS COMO ION SO4	2025-07-14 16:23:14
26	25	CLORUROS EXPRESADOS COMO ION CL-	2025-07-14 16:23:14
27	26	MATERIA ORGANICA EN AGUA, EXPRESADOS COMO OXIGENO	2025-07-14 16:23:14
28	27	POTENCIAL DE HIDROGENO DE AGUA (pH)	2025-07-14 16:23:14
\.


--
-- Data for Name: tipo_via; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipo_via (id, descripcion, created_at, codigo) FROM stdin;
1	Asfaltada	2025-07-14 15:11:40.909552	0000001
2	MEJORAMIENTO	2025-07-18 17:06:03.620076	0000002
3	MEJORAMIENTO	2025-07-18 17:06:03.620076	0000003
4	MANTENIMIENTO	2025-07-18 17:06:03.620076	0000004
5	MANTENIMIENTO PERIODICO	2025-07-18 17:06:03.620076	0000005
6	PRESERVACION	2025-07-18 17:06:03.620076	0000006
7	CONSERVACION	2025-07-18 17:06:03.620076	0000007
\.


--
-- Data for Name: trafico_imagenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trafico_imagenes (id, station_id, image_url, description, upload_date, created_at, updated_at, source_type) FROM stdin;
67	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/reportconteo/E-01_1755106278796.xlsx	Excel Conteo Vehicular	2025-08-13	2025-08-13 17:31:20.270592+00	2025-08-13 17:31:20.270592+00	conteo_vehicular_excel
68	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/reportconteo/E-01_1755107040789.xlsx	Excel Conteo Vehicular	2025-08-13	2025-08-13 17:44:02.180088+00	2025-08-13 17:44:02.180088+00	conteo_vehicular_excel
69	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/reportconteo/E-01_1755179083366.xlsx	Excel Conteo Vehicular	2025-08-14	2025-08-14 13:44:44.805156+00	2025-08-14 13:44:44.805156+00	conteo_vehicular_excel
70	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/reportconteo/E-01_1755179537606.xlsx	Excel Conteo Vehicular	2025-08-14	2025-08-14 13:52:19.440662+00	2025-08-14 13:52:19.440662+00	conteo_vehicular_excel
71	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/reportconteo/E-01_1755185001221.xlsx	Excel Conteo Vehicular	2025-08-14	2025-08-14 15:23:23.750744+00	2025-08-14 15:23:23.750744+00	conteo_vehicular_excel
20	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/encuestaorigendestino/sddd/sddd_1.jpg	sddd	2025-08-08	2025-08-08 14:18:57.712947+00	2025-08-08 14:18:57.712947+00	encuesta_origen_destino
21	E-03	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/conteovehicular/prueba/prueba_1.jpg	prueba	2025-08-08	2025-08-08 14:19:26.629905+00	2025-08-08 14:19:26.629905+00	conteo_vehicular
39	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/conteovehicular/conteowaza/conteowaza_1.jpg	conteowaza	2025-08-08	2025-08-08 15:32:35.439075+00	2025-08-08 15:32:35.439075+00	conteo_vehicular
40	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/conteovehicular/xdpllplp/xdpllplp_1.jpg	xdpllplp	2025-08-08	2025-08-08 15:33:20.567812+00	2025-08-08 15:33:20.567812+00	conteo_vehicular
\.


--
-- Data for Name: tusuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tusuarios (id, usuario, password) FROM stdin;
1	admin	1234
2	slorse	xd
3	hola	xd
4	prueba	xd
5	chesco	1234
\.


--
-- Data for Name: user_permisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permisos (id, user_id, permiso_id, tipo_acceso) FROM stdin;
4	26	7	lectura
5	26	7	edicion
8	14	7	lectura
9	14	7	edicion
14	1	7	lectura
15	1	7	edicion
16	1	9	lectura
17	1	9	edicion
20	28	7	lectura
21	28	9	lectura
22	38	7	lectura
23	38	9	lectura
\.


--
-- Data for Name: usuariost; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuariost (id, tramo, dni, usuario, password, nombre, ap_paterno, ap_materno, correo, mail_cu_104, fecha_ingreso, codigo_esp, nivel, subnivel, tipo_user, rol_id, creado_en) FROM stdin;
1	CU - 104	72538918	72538918	M72538918	EDSON FERNANDO	MEZA	DUMAN	fernando.duman1993@gmail.com	bim.coordinador.cu104@gmail.com	2025-07-01	\N	1	1	COORDINADOR PROYECTO	1	2025-07-03 21:24:16.668899
2	CU - 104	70352379	70352379	L70352379	ERIK ARTURO	LUPA	SALAMANCA	erikghot.l@gmail.com	bim.esp.SCP.CU104@gmail.com	2025-07-01	6	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899
3	CU - 104	48233606	48233606	R48233606	WILSON	ROMERO	SARA	922025578wls@gmail.com	bim.bim.cu104@gmail.com	2025-07-01	7	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899
4	CU - 104	46575702	46575702	M46575702	LAURA	MONTOYA	BACA	montoyalorentebacalaura@gmail.com	bim.es.p.GEO.CU104@gmail.com	2025-07-01	2	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899
5	CU - 104	70513458	70513458	F70513458	OSCAR JESUS	FERRER	PONCE	ferreroscar@gmail.com	bim.es.est.cu104@gmail.com	2025-07-01	10	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899
6	CU - 104	45297177	45297177	C45297177	EDDY ANGEL	CAHUANA	CCASA	eddyangel1@gmail.com	bimes.p.TGDG.CU104@gmail.com	2025-07-01	1	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899
7	CU - 104	47021326	47021326	C47021326	PRISCILLA	CONTRERAS	HUAMANÑAHUI	pbcontrerasgh@gmail.com	bimes.p.TRF.CU104@gmail.com	2025-07-01	4	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899
8	CU - 104	70042864	70042864	C70042864	ADRIEL BRANDY	CUIRO	SORIA	adriel12cs@gmail.com	bimes.p.AMB.CU104@gmail.com	2025-07-01	14	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899
9	CU - 104	47424831	47424831	S47424831	ELVIO INOCENCIO	SAIRE	QUIÑONEZ	elvio.saire@gmail.com	bimat.HH.CU104@gmail.com	2025-07-01	1	2	2	ASISTENTE	3	2025-07-03 21:24:16.668899
10	CU - 104	62844614	62844614	T62844614	BETSI KATIUSCA	TUMPAY	HUAMAN	betsitumpayhuaman@gmail.com	bimaa1.CU104@gmail.com	2025-07-01	17	2	3	ASISTENTE	3	2025-07-03 21:24:16.668899
11	CU - 104	72746480	72746480	Q72746480	NIRELY	QUISPE	CUEVA		bimaa2.CU104@gmail.com	2025-07-01	17	2	3	ASISTENTE	3	2025-07-03 21:24:16.668899
12	CU - 104	77798514	77798514	M77798514	DERIANS MARTIN	MORA	HUAÑEC	mora.huane@gmail.com	bimat.trf.cu104@gmail.com	2025-07-01	1	2	3	ASISTENTE	3	2025-07-03 21:24:16.668899
13	CU - 104	47035773	47035773	T47035773	ADA MICOL	TEMPLE	VILLENA	admtv16@gmail.com	bimat.est.cu104@gmail.com	2025-07-01	1	2	3	ASISTENTE	3	2025-07-03 21:24:16.668899
14	SISTEMA	00000000	admin	admin	Admin	Admin	System	admin@dominio.com	admin@dominio.com	2025-07-01	\N	0	0	ADMIN	7	2025-07-03 21:27:01.888219
26	SISTEMA	00000001	sadmin	sadmin	Admin	Admin	System	admin@dominio.com	admin@dominio.com	2025-07-01	\N	0	0	ADMIN	7	2025-07-05 16:50:22.586661
28		09090909	invitado	invitado	invitado					\N	18	3	3	VISITANTE	8	2025-07-14 15:03:15.602152
31	CU-104	12345678	prueba	prueba	prueba	prueba	prueba	asdasd@xd.xd	aaaa@xd	2025-08-05	15	3	3	VISITANTE	8	2025-07-18 20:14:41.046755
38	CU-104	87621321	teresita	evaluador	teresita	teresita	teresita	asdasd@xd.xd	aaaa@xd	2025-07-23	4	1	1	EVALUADOR	6	2025-07-19 01:43:50.14945
\.


--
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: anuncios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anuncios_id_seq', 58, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 1, false);


--
-- Name: changelogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.changelogs_id_seq', 5, true);


--
-- Name: distritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.distritos_id_seq', 1, false);


--
-- Name: ensayos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ensayos_id_seq', 39, true);


--
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidad_visibilidad_id_seq', 1, false);


--
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_codigo_esp_seq', 1, false);


--
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_navbar_options_id_seq', 1, false);


--
-- Name: estratos_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_codigo_seq', 5, true);


--
-- Name: estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_id_seq', 5, true);


--
-- Name: navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.navbar_options_id_seq', 22, true);


--
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permisos_id_seq', 9, true);


--
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresiva_perfil_estratos_id_seq', 182, true);


--
-- Name: progresivas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresivas_id_seq', 2764, true);


--
-- Name: provincias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provincias_id_seq', 1, false);


--
-- Name: proyectos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyectos_id_seq', 16, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_navbar_options_id_seq', 367, true);


--
-- Name: roles_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_permisos_id_seq', 59, true);


--
-- Name: rutas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rutas_id_seq', 1, true);


--
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_ensayo_id_seq', 28, true);


--
-- Name: tipo_via_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_via_codigo_seq', 1, false);


--
-- Name: tipo_via_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_via_id_seq', 7, true);


--
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trafico_imagenes_id_seq', 71, true);


--
-- Name: tusuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tusuarios_id_seq', 5, true);


--
-- Name: user_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permisos_id_seq', 23, true);


--
-- Name: usuariost_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuariost_id_seq', 39, true);


--
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: postgres
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- Name: anuncios anuncios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_pkey PRIMARY KEY (id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- Name: changelogs changelogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs
    ADD CONSTRAINT changelogs_pkey PRIMARY KEY (id);


--
-- Name: changelogs changelogs_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs
    ADD CONSTRAINT changelogs_version_key UNIQUE (version);


--
-- Name: codigo_departamentos codigo_departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_departamentos
    ADD CONSTRAINT codigo_departamentos_pkey PRIMARY KEY (codigo_departamento);


--
-- Name: distritos distritos_codigo_distrito_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_codigo_distrito_key UNIQUE (codigo_distrito);


--
-- Name: distritos distritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_pkey PRIMARY KEY (id);


--
-- Name: elementos_trafico elementos_trafico_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.elementos_trafico
    ADD CONSTRAINT elementos_trafico_pkey PRIMARY KEY (id);


--
-- Name: ensayos ensayos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_pkey PRIMARY KEY (id);


--
-- Name: especialidad_visibilidad especialidad_visibilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad
    ADD CONSTRAINT especialidad_visibilidad_pkey PRIMARY KEY (id);


--
-- Name: especialidades_navbar_options especialidades_navbar_options_especialidad_id_navbar_option_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_especialidad_id_navbar_option_key UNIQUE (especialidad_id, navbar_option_id);


--
-- Name: especialidades_navbar_options especialidades_navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_pkey PRIMARY KEY (id);


--
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (codigo_esp);


--
-- Name: estratos estratos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos
    ADD CONSTRAINT estratos_codigo_key UNIQUE (codigo);


--
-- Name: estratos estratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos
    ADD CONSTRAINT estratos_pkey PRIMARY KEY (id);


--
-- Name: navbar_options navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options
    ADD CONSTRAINT navbar_options_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_pkey PRIMARY KEY (id);


--
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_progresiva_id_orden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_orden_key UNIQUE (progresiva_id, orden);


--
-- Name: progresivas progresivas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_codigo_key UNIQUE (codigo);


--
-- Name: progresivas progresivas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_pkey PRIMARY KEY (id);


--
-- Name: provincias provincias_codigo_provincia_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_codigo_provincia_key UNIQUE (codigo_provincia);


--
-- Name: provincias provincias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_pkey PRIMARY KEY (id);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- Name: roles_navbar_options roles_navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_pkey PRIMARY KEY (id);


--
-- Name: roles_permisos roles_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rutas rutas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas
    ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);


--
-- Name: tipo_ensayo tipo_ensayo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_ensayo
    ADD CONSTRAINT tipo_ensayo_pkey PRIMARY KEY (id);


--
-- Name: tipo_via tipo_via_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via
    ADD CONSTRAINT tipo_via_pkey PRIMARY KEY (id);


--
-- Name: trafico_imagenes trafico_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT trafico_imagenes_pkey PRIMARY KEY (id);


--
-- Name: tusuarios tusuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tusuarios
    ADD CONSTRAINT tusuarios_pkey PRIMARY KEY (id);


--
-- Name: navbar_options unique_navbar_option_link; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options
    ADD CONSTRAINT unique_navbar_option_link UNIQUE (link);


--
-- Name: roles_navbar_options unique_role_navbar_option; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT unique_role_navbar_option UNIQUE (role_id, navbar_option_id);


--
-- Name: tipo_via uq_tipo_via_codigo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via
    ADD CONSTRAINT uq_tipo_via_codigo UNIQUE (codigo);


--
-- Name: user_permisos user_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_pkey PRIMARY KEY (id);


--
-- Name: user_permisos user_permisos_user_id_permiso_id_tipo_acceso_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_user_id_permiso_id_tipo_acceso_key UNIQUE (user_id, permiso_id, tipo_acceso);


--
-- Name: usuariost usuariost_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_dni_key UNIQUE (dni);


--
-- Name: usuariost usuariost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_pkey PRIMARY KEY (id);


--
-- Name: idx_trafico_imagenes_station_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trafico_imagenes_station_id ON public.trafico_imagenes USING btree (station_id);


--
-- Name: anuncios anuncios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);


--
-- Name: auditoria auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);


--
-- Name: distritos distritos_codigo_provincia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_codigo_provincia_fkey FOREIGN KEY (codigo_provincia) REFERENCES public.provincias(codigo_provincia);


--
-- Name: especialidad_visibilidad especialidad_visibilidad_codigo_esp_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad
    ADD CONSTRAINT especialidad_visibilidad_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);


--
-- Name: especialidades_navbar_options especialidades_navbar_options_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(codigo_esp);


--
-- Name: especialidades_navbar_options especialidades_navbar_options_navbar_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);


--
-- Name: progresivas fk_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;


--
-- Name: progresivas fk_progresivas_tipo_ensayo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_progresivas_tipo_ensayo FOREIGN KEY (tipo_ensayo) REFERENCES public.tipo_ensayo(id);


--
-- Name: progresivas fk_progresivas_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_progresivas_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- Name: trafico_imagenes fk_station; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES public.elementos_trafico(id) ON DELETE CASCADE;


--
-- Name: ensayos fk_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT fk_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_estrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_estrato_id_fkey FOREIGN KEY (estrato_id) REFERENCES public.estratos(id);


--
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_progresiva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_fkey FOREIGN KEY (progresiva_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;


--
-- Name: progresivas progresivas_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuariost(id);


--
-- Name: progresivas progresivas_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.progresivas(id);


--
-- Name: provincias provincias_codigo_departamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_codigo_departamento_fkey FOREIGN KEY (codigo_departamento) REFERENCES public.codigo_departamentos(codigo_departamento);


--
-- Name: roles_navbar_options roles_navbar_options_navbar_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);


--
-- Name: roles_navbar_options roles_navbar_options_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: roles_permisos roles_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id);


--
-- Name: roles_permisos roles_permisos_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- Name: user_permisos user_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id) ON DELETE CASCADE;


--
-- Name: user_permisos user_permisos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuariost(id) ON DELETE CASCADE;


--
-- Name: usuariost usuariost_codigo_esp_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);


--
-- Name: usuariost usuariost_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

