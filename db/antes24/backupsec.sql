--
-- PostgreSQL database dump
--

\restrict Ov7t0x3P5Rza1Qe3hYSU0wd5ogxxMy4cri6gh7zKItDecquG42wk59oFrypuYM3

-- Dumped from database version 17.2 (Ubuntu 17.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.6

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


--
-- Name: repmgr; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS repmgr WITH SCHEMA repmgr;


--
-- Name: EXTENSION repmgr; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION repmgr IS 'Replication manager for PostgreSQL';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anuncios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anuncios (
    id integer NOT NULL,
    titulo character varying(200) NOT NULL,
    contenido text NOT NULL,
    fecha_inicio timestamp without time zone DEFAULT now(),
    fecha_fin timestamp without time zone NOT NULL,
    usuario_id integer,
    archivo_url text,
    creador_id integer
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
    tipo_ensayo integer,
    nombre_ensayo character varying(255),
    responsable_id integer,
    metodo character varying(255),
    observaciones text,
    datos_formulario jsonb
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
-- Name: experiencia_academica; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.experiencia_academica (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    centro_estudios character varying(255),
    profesion character varying(255),
    especialidad character varying(255),
    fecha_ingreso_academica date,
    fecha_egreso_academica date,
    informacion_adicional_academica text
);


ALTER TABLE public.experiencia_academica OWNER TO backend_nameless_log_553;

--
-- Name: experiencia_academica_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.experiencia_academica_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiencia_academica_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: experiencia_academica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.experiencia_academica_id_seq OWNED BY public.experiencia_academica.id;


--
-- Name: experiencia_laboral; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.experiencia_laboral (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    institucion character varying(255),
    cargo character varying(255),
    fecha_ingreso_laboral date,
    fecha_egreso_laboral date,
    informacion_adicional_laboral text
);


ALTER TABLE public.experiencia_laboral OWNER TO backend_nameless_log_553;

--
-- Name: experiencia_laboral_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.experiencia_laboral_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiencia_laboral_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: experiencia_laboral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.experiencia_laboral_id_seq OWNED BY public.experiencia_laboral.id;


--
-- Name: formulario_campos; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.formulario_campos (
    id integer NOT NULL,
    seccion_id integer NOT NULL,
    name character varying(100) NOT NULL,
    label character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    required boolean DEFAULT false,
    step character varying(10),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.formulario_campos OWNER TO backend_nameless_log_553;

--
-- Name: COLUMN formulario_campos.step; Type: COMMENT; Schema: public; Owner: backend_nameless_log_553
--

COMMENT ON COLUMN public.formulario_campos.step IS 'Para inputs de tipo numérico';


--
-- Name: formulario_campos_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.formulario_campos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formulario_campos_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: formulario_campos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.formulario_campos_id_seq OWNED BY public.formulario_campos.id;


--
-- Name: formulario_secciones; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.formulario_secciones (
    id integer NOT NULL,
    tipo_ensayo_id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    componente_key character varying(100) NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    config_json jsonb
);


ALTER TABLE public.formulario_secciones OWNER TO backend_nameless_log_553;

--
-- Name: COLUMN formulario_secciones.componente_key; Type: COMMENT; Schema: public; Owner: backend_nameless_log_553
--

COMMENT ON COLUMN public.formulario_secciones.componente_key IS 'Una clave para que React sepa qué componente renderizar (ej: ''TablaTamices'')';


--
-- Name: COLUMN formulario_secciones.config_json; Type: COMMENT; Schema: public; Owner: backend_nameless_log_553
--

COMMENT ON COLUMN public.formulario_secciones.config_json IS 'Almacena configuraciones JSON adicionales para la sección (ej: cabeceras de tablas, estructuras de tests).';


--
-- Name: formulario_secciones_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.formulario_secciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formulario_secciones_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: formulario_secciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.formulario_secciones_id_seq OWNED BY public.formulario_secciones.id;


--
-- Name: formulario_tamices; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.formulario_tamices (
    id integer NOT NULL,
    seccion_id integer NOT NULL,
    name character varying(50) NOT NULL,
    mm numeric(10,3) NOT NULL,
    key_name character varying(50) NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.formulario_tamices OWNER TO backend_nameless_log_553;

--
-- Name: formulario_tamices_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.formulario_tamices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formulario_tamices_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: formulario_tamices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.formulario_tamices_id_seq OWNED BY public.formulario_tamices.id;


--
-- Name: granulometria_ensayos; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.granulometria_ensayos (
    id integer NOT NULL,
    ensayo_id integer NOT NULL,
    proyecto character varying(255),
    tramo character varying(255),
    progresiva character varying(255),
    estrato_id integer,
    peso_total numeric(10,2),
    peso_antes_lavado numeric(10,2),
    peso_despues_lavado numeric(10,2),
    retenido_3in numeric(10,2),
    retenido_2in numeric(10,2),
    retenido_1_5in numeric(10,2),
    retenido_1in numeric(10,2),
    retenido_3_4in numeric(10,2),
    retenido_3_8in numeric(10,2),
    retenido_n4 numeric(10,2),
    retenido_n10 numeric(10,2),
    retenido_n20 numeric(10,2),
    retenido_n40 numeric(10,2),
    retenido_n60 numeric(10,2),
    retenido_n140 numeric(10,2),
    retenido_n200 numeric(10,2),
    porc_grava numeric(10,2),
    porc_arena numeric(10,2),
    porc_finos numeric(10,2),
    cu numeric(10,2),
    cc numeric(10,2),
    d10 numeric(10,3),
    d30 numeric(10,3),
    d60 numeric(10,3),
    clasificacion_sucs character varying(255),
    clasificacion_aashto character varying(255),
    indice_grupo numeric(10,2),
    retenido_menor_200 numeric(10,2),
    total_retenido numeric(10,2)
);


ALTER TABLE public.granulometria_ensayos OWNER TO backend_nameless_log_553;

--
-- Name: granulometria_ensayos_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.granulometria_ensayos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.granulometria_ensayos_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: granulometria_ensayos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.granulometria_ensayos_id_seq OWNED BY public.granulometria_ensayos.id;


--
-- Name: limite_liquido_ensayos; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.limite_liquido_ensayos (
    id integer NOT NULL,
    ensayo_id integer NOT NULL,
    proyecto character varying(255),
    tramo character varying(255),
    progresiva character varying(255),
    estrato_id integer,
    ll_resultado numeric(10,2),
    ll_ensayo1_golpes integer,
    ll_ensayo1_cod_recipiente character varying(255),
    ll_ensayo1_peso_recipiente numeric(10,2),
    ll_ensayo1_peso_humedo numeric(10,2),
    ll_ensayo1_peso_seco numeric(10,2),
    ll_ensayo2_golpes integer,
    ll_ensayo2_cod_recipiente character varying(255),
    ll_ensayo2_peso_recipiente numeric(10,2),
    ll_ensayo2_peso_humedo numeric(10,2),
    ll_ensayo2_peso_seco numeric(10,2),
    ll_ensayo3_golpes integer,
    ll_ensayo3_cod_recipiente character varying(255),
    ll_ensayo3_peso_recipiente numeric(10,2),
    ll_ensayo3_peso_humedo numeric(10,2),
    ll_ensayo3_peso_seco numeric(10,2),
    ll_ensayo1_contenido_humedad numeric(10,2),
    ll_ensayo2_contenido_humedad numeric(10,2),
    ll_ensayo3_contenido_humedad numeric(10,2)
);


ALTER TABLE public.limite_liquido_ensayos OWNER TO backend_nameless_log_553;

--
-- Name: limite_liquido_ensayos_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.limite_liquido_ensayos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.limite_liquido_ensayos_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: limite_liquido_ensayos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.limite_liquido_ensayos_id_seq OWNED BY public.limite_liquido_ensayos.id;


--
-- Name: limite_plastico_ensayos; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.limite_plastico_ensayos (
    id integer NOT NULL,
    ensayo_id integer NOT NULL,
    proyecto character varying(255),
    tramo character varying(255),
    progresiva character varying(255),
    estrato_id integer,
    lp_resultado numeric(10,2),
    ip_resultado numeric(10,2),
    lp_ensayo1_cod_recipiente character varying(255),
    lp_ensayo1_peso_recipiente numeric(10,2),
    lp_ensayo1_peso_humedo numeric(10,2),
    lp_ensayo1_peso_seco numeric(10,2),
    lp_ensayo2_cod_recipiente character varying(255),
    lp_ensayo2_peso_recipiente numeric(10,2),
    lp_ensayo2_peso_humedo numeric(10,2),
    lp_ensayo2_peso_seco numeric(10,2),
    lp_ensayo1_contenido_humedad numeric(10,2),
    lp_ensayo2_contenido_humedad numeric(10,2)
);


ALTER TABLE public.limite_plastico_ensayos OWNER TO backend_nameless_log_553;

--
-- Name: limite_plastico_ensayos_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.limite_plastico_ensayos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.limite_plastico_ensayos_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: limite_plastico_ensayos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.limite_plastico_ensayos_id_seq OWNED BY public.limite_plastico_ensayos.id;


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
    coordenada_este numeric(15,6),
    coordenada_norte numeric(15,6),
    linea character varying(255),
    intervalo_manual numeric,
    longitud_total numeric,
    lado character varying(1),
    CONSTRAINT progresivas_estado_check CHECK (((estado)::text = ANY (ARRAY[('activo'::character varying)::text, ('inactivo'::character varying)::text, ('completado'::character varying)::text])))
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
-- Name: proyecto_historial; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.proyecto_historial (
    id integer NOT NULL,
    proyecto_id integer NOT NULL,
    accion character varying(100) NOT NULL,
    actor_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    detalles text
);


ALTER TABLE public.proyecto_historial OWNER TO backend_nameless_log_553;

--
-- Name: proyecto_historial_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.proyecto_historial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proyecto_historial_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: proyecto_historial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.proyecto_historial_id_seq OWNED BY public.proyecto_historial.id;


--
-- Name: proyecto_usuarios; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.proyecto_usuarios (
    id integer NOT NULL,
    proyecto_id integer NOT NULL,
    usuario_id integer NOT NULL,
    rol_proyecto character varying(50) DEFAULT 'view'::character varying NOT NULL,
    asignado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.proyecto_usuarios OWNER TO backend_nameless_log_553;

--
-- Name: proyecto_usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.proyecto_usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proyecto_usuarios_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: proyecto_usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.proyecto_usuarios_id_seq OWNED BY public.proyecto_usuarios.id;


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
    update_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_interval_manual boolean DEFAULT false
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
-- Name: puntos_mapa; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.puntos_mapa (
    id integer NOT NULL,
    nombre character varying(255),
    descripcion text,
    latitud numeric(10,8) NOT NULL,
    longitud numeric(11,8) NOT NULL,
    creado_en timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.puntos_mapa OWNER TO backend_nameless_log_553;

--
-- Name: puntos_mapa_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.puntos_mapa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.puntos_mapa_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: puntos_mapa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.puntos_mapa_id_seq OWNED BY public.puntos_mapa.id;


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
-- Name: ruta_kml; Type: TABLE; Schema: public; Owner: backend_nameless_log_553
--

CREATE TABLE public.ruta_kml (
    id integer NOT NULL,
    km character varying(10),
    lat double precision,
    lng double precision,
    geom public.geometry(Point,4326),
    tramo_id integer
);


ALTER TABLE public.ruta_kml OWNER TO backend_nameless_log_553;

--
-- Name: ruta_kml_id_seq; Type: SEQUENCE; Schema: public; Owner: backend_nameless_log_553
--

CREATE SEQUENCE public.ruta_kml_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ruta_kml_id_seq OWNER TO backend_nameless_log_553;

--
-- Name: ruta_kml_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backend_nameless_log_553
--

ALTER SEQUENCE public.ruta_kml_id_seq OWNED BY public.ruta_kml.id;


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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    results_config jsonb
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
    creado_en timestamp without time zone DEFAULT now(),
    fecha_nacimiento date,
    telefono character varying(20),
    profesion character varying(100),
    otros_detalles text
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
-- Name: experiencia_academica id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.experiencia_academica ALTER COLUMN id SET DEFAULT nextval('public.experiencia_academica_id_seq'::regclass);


--
-- Name: experiencia_laboral id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.experiencia_laboral ALTER COLUMN id SET DEFAULT nextval('public.experiencia_laboral_id_seq'::regclass);


--
-- Name: formulario_campos id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_campos ALTER COLUMN id SET DEFAULT nextval('public.formulario_campos_id_seq'::regclass);


--
-- Name: formulario_secciones id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_secciones ALTER COLUMN id SET DEFAULT nextval('public.formulario_secciones_id_seq'::regclass);


--
-- Name: formulario_tamices id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_tamices ALTER COLUMN id SET DEFAULT nextval('public.formulario_tamices_id_seq'::regclass);


--
-- Name: granulometria_ensayos id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.granulometria_ensayos ALTER COLUMN id SET DEFAULT nextval('public.granulometria_ensayos_id_seq'::regclass);


--
-- Name: limite_liquido_ensayos id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.limite_liquido_ensayos ALTER COLUMN id SET DEFAULT nextval('public.limite_liquido_ensayos_id_seq'::regclass);


--
-- Name: limite_plastico_ensayos id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.limite_plastico_ensayos ALTER COLUMN id SET DEFAULT nextval('public.limite_plastico_ensayos_id_seq'::regclass);


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
-- Name: proyecto_historial id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_historial ALTER COLUMN id SET DEFAULT nextval('public.proyecto_historial_id_seq'::regclass);


--
-- Name: proyecto_usuarios id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_usuarios ALTER COLUMN id SET DEFAULT nextval('public.proyecto_usuarios_id_seq'::regclass);


--
-- Name: proyectos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos ALTER COLUMN id SET DEFAULT nextval('public.proyectos_id_seq'::regclass);


--
-- Name: puntos_mapa id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.puntos_mapa ALTER COLUMN id SET DEFAULT nextval('public.puntos_mapa_id_seq'::regclass);


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
-- Name: ruta_kml id; Type: DEFAULT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.ruta_kml ALTER COLUMN id SET DEFAULT nextval('public.ruta_kml_id_seq'::regclass);


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

COPY public.anuncios (id, titulo, contenido, fecha_inicio, fecha_fin, usuario_id, archivo_url, creador_id) FROM stdin;
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, usuario_id, accion, detalles, creado_en) FROM stdin;
1	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 16:47:15.885699
1229	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 14:21:38.088934
1241	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 14:34:56.437149
1242	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 14:35:01.481
1254	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:42:05.804866
1266	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:49:28.184028
1279	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/9"}	2025-09-10 15:27:22.024069
1290	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:00:10.655703
1303	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:10:25.426389
1314	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:37:29.879269
1328	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:19:58.247334
1339	14	PAGE_VIEW	{"path":"/coordinador/"}	2025-09-10 17:33:25.466502
1340	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 17:33:32.607299
1352	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:36:59.031407
1357	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-10 17:37:04.192767
1366	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:52:07.045938
1379	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 13:59:47.170764
1391	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:15:25.194874
1403	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:36:36.399774
1415	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 14:51:00.089956
1428	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:56:24.974816
1444	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:07:37.160593
1456	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-11 15:39:35.181579
1469	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:02:34.272391
1480	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-11 16:24:06.18742
1492	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 17:00:21.257979
1493	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:00:30.868676
1504	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:37:19.932446
1518	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-12 12:29:29.231583
1531	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-12 14:03:16.523085
1532	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:03:21.353713
1544	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:36:26.081535
1556	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:19:33.547354
1567	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:40:11.041726
1578	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:56:03.002673
1594	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:18:26.908612
1593	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:18:26.908612
1606	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:30:17.018947
1619	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-13 18:26:31.082688
1631	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-14 15:26:09.413594
1643	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 13:33:18.452422
1655	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 14:02:24.355067
1665	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 14:45:29.579903
1675	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:02:51.803607
1687	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:50:10.748812
1703	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:59:05.981324
1718	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:16:11.659247
1728	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:25:39.613732
1733	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-15 16:25:48.267232
1744	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:30:47.407012
1745	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-15 16:30:48.168315
1747	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:30:48.625473
1762	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:50:43.416298
1765	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-15 16:50:58.597643
1774	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:52:41.770689
1785	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:55:37.927982
1800	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:58:21.480665
1811	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:16:30.028891
1813	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:16:43.023434
1822	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:28:35.02171
1834	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:31:15.631659
1835	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/12"}	2025-09-15 17:31:22.801283
1847	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:41:11.741394
1857	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:49:41.71146
1860	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:49:51.469898
1873	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:54:18.654533
1886	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 18:00:00.077968
1898	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 21:47:53.077093
1913	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/12"}	2025-09-16 14:03:48.124435
1923	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:36:56.405154
1933	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:49:45.761489
1943	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/16"}	2025-09-16 15:34:03.175348
1954	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:08:21.89864
1965	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:20:08.849437
1982	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:05:24.824343
1983	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/18"}	2025-09-16 17:05:35.598714
1993	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:10:12.885762
2003	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 19:07:18.050893
2004	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 19:07:18.67459
2015	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:35:31.465604
2025	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:59:27.231394
2035	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 20:14:05.505805
2046	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 20:50:30.450213
2056	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 21:34:01.039903
2	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 16:47:15.886748
1230	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:21:40.439406
1243	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 14:37:29.728274
1255	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:42:05.81043
1267	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:55:03.375529
1280	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/9"}	2025-09-10 15:29:08.918378
1291	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:00:11.134768
1304	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:11:14.885219
1315	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:37:30.421059
1329	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:20:58.394176
1341	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 17:33:33.760531
1353	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:37:01.435045
1367	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 13:29:24.610339
1380	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:10:15.304795
1392	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 14:16:18.931186
1393	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 14:16:21.196258
1404	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:40:54.451733
1416	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:51:07.172346
1429	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:56:24.978081
1445	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:07:37.166638
1457	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 15:39:37.15156
1458	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 15:39:37.697066
1470	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:02:34.294526
1482	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:24:22.065782
1481	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:24:22.065782
1494	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:02:24.22873
1505	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 17:37:50.178113
1506	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 17:37:50.786877
1519	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 12:30:41.218984
1533	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:06:51.80052
1545	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 14:40:14.653971
1557	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:23:30.604329
1568	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:40:11.041873
1579	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 15:59:28.885188
1595	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 16:54:36.592072
1597	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:54:43.147176
1607	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:30:17.049136
1620	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-14 01:26:07.208523
1632	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-14 15:26:10.478301
1644	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/11"}	2025-09-15 13:33:36.573125
1656	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 14:02:24.36488
1666	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 14:45:51.628865
1676	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:02:51.803618
1688	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 15:50:11.462717
1704	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 15:59:06.783928
1705	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:59:07.503659
1706	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 15:59:08.631487
1719	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:17:53.735891
1731	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:25:45.18896
1748	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:30:48.698387
1764	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:50:53.185989
1775	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:52:53.633463
1786	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:55:42.896597
1788	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:55:53.390146
1789	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:55:54.007254
1801	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:58:51.77506
1812	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:16:42.968985
1823	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:28:56.925381
1829	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:29:08.478407
1831	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:29:09.063878
1836	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:33:08.011953
1838	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:33:10.516896
1848	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:44:16.340343
1858	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:49:41.808973
1859	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:49:51.461718
1861	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:49:53.44162
1874	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:54:19.1412
1888	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 18:00:01.331939
1899	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 21:53:10.659233
1914	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:05:43.966841
1924	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:36:56.912519
1934	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:49:45.763193
1944	14	PAGE_VIEW	{"path":"/coordinador/suelos/proyectos"}	2025-09-16 15:34:04.726592
1945	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/16"}	2025-09-16 15:34:06.514608
1955	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:10:35.709353
1966	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:20:08.876363
1984	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:05:37.476072
1994	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:10:12.886869
2005	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 19:07:22.187971
2016	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:35:31.477384
2026	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:59:27.243164
2037	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-16 20:19:35.001701
2047	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 20:50:30.541937
2057	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:34:49.245977
2067	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 21:39:46.777408
2076	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:02:46.730912
3	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-02 16:48:42.635813
4	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-02 16:48:42.636557
5	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 16:48:46.10473
6	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 16:48:46.5781
7	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-02 16:56:59.865036
8	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-02 16:56:59.865036
9	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-02 17:01:22.024246
10	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:15:08.102032
11	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:15:08.102824
12	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-02 17:15:17.006841
13	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-02 17:15:18.246069
14	14	FILE_UPLOAD	{"entityId":"E-01","entityType":"stationId","files":["Imagen_de_WhatsApp_2025-08-30_a_las_17.15.20_dd366da1-removebg-preview (1).png"],"description":"AAa"}	2025-09-02 17:15:28.174388
15	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:15:36.497363
16	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:15:36.497374
17	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:15:50.529517
18	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:15:51.117577
19	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:15:53.9191
20	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:15:53.919466
21	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-02 17:45:45.592306
22	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-02 17:46:18.51102
23	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-02 17:46:27.6714
24	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-02 17:46:29.031187
25	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-02 17:54:28.84159
26	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-02 20:20:23.105179
27	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-02 20:20:23.738356
28	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-02 20:20:30.453385
29	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 03:10:00.811207
30	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 03:10:12.248846
31	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 03:10:18.652476
32	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 13:36:09.497838
33	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-03 13:36:14.966189
34	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-03 13:48:12.291867
35	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-03 13:48:12.292217
36	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-03 13:53:12.178997
37	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-03 13:53:12.179332
38	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 13:53:16.921333
39	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 13:53:20.567839
40	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 13:53:30.450143
2769	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:40:28.329166
2771	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:43:08.027548
2773	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:44:26.736808
44	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 13:55:25.519996
45	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 13:55:29.697541
46	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-03 13:55:36.460432
47	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 13:55:50.308307
48	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 13:55:54.800121
49	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 13:56:00.779087
50	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-03 13:56:16.878162
51	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-03 13:56:33.798579
52	14	Actualización de Usuario	Usuario con DNI 60739939 actualizado por 14. Campos actualizados: {"id":40,"tramo":"cu-104","dni":"60739939","usuario":"john","password":"john","nombre":"John","ap_paterno":"asdfg","ap_materno":"aesrt","correo":"asdfg@gmail.com","mail_cu_104":"awefgb@gmail.com","fecha_ingreso":"2025-09-24","codigo_esp":2,"nivel":1,"subnivel":1,"tipo_user":"COORDINADOR PROYECTO","rol_id":1,"creado_en":"2025-09-01T14:52:13.644Z","rol_nombre":"COORDINADOR PROYECTO","especialidad_nombre":"GEOLOGIA Y GEOTECNIA"}	2025-09-03 13:57:42.784853
53	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-03 14:07:12.997672
54	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-03 14:07:13.002699
55	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-03 14:07:21.509809
56	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:11:12.360801
57	14	PAGE_VIEW	{"path":"/ensayos"}	2025-09-03 14:12:55.114424
58	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:12:57.898854
59	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 14:13:46.835217
60	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 14:13:57.191633
61	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 14:20:33.940617
62	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 14:20:33.945353
63	14	PAGE_VIEW	{"path":"/geo-test"}	2025-09-03 14:20:37.199628
64	14	PAGE_VIEW	{"path":"/geo-test"}	2025-09-03 14:20:37.207143
65	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:20:42.383205
66	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 14:20:42.392618
67	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 14:20:42.849154
68	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 14:20:42.852799
69	14	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-03 14:20:46.240766
70	14	TRAFICO_TAB_CLICK	{"tab":"Formatos de recoleccion de datos","headerOption":"resumen"}	2025-09-03 14:20:47.818069
71	14	TRAFICO_TAB_CLICK	{"tab":"Estacion de control","headerOption":"resumen"}	2025-09-03 14:21:02.024189
72	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:21:10.449885
73	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 14:21:23.992645
74	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 14:21:23.993412
75	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 14:21:24.481137
76	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:21:36.939039
77	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-03 14:22:58.461952
78	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:23:04.086315
79	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 14:23:54.66963
2775	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:45:46.97343
80	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 14:24:03.948607
81	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:39:06.036634
82	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 14:39:06.036606
83	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 14:39:12.654533
84	14	PAGE_VIEW	{"path":"/map-test"}	2025-09-03 14:45:33.011201
85	14	PAGE_VIEW	{"path":"/map-test"}	2025-09-03 14:45:33.01223
86	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:45:37.450222
87	14	PAGE_VIEW	{"path":"/test-mapa"}	2025-09-03 14:45:39.564873
88	14	PAGE_VIEW	{"path":"/test-mapa"}	2025-09-03 14:45:39.565659
89	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:45:45.531798
90	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:46:03.180112
91	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:46:03.183034
92	14	PAGE_VIEW	{"path":"/coordinador/test-mapa"}	2025-09-03 14:46:11.108762
93	14	PAGE_VIEW	{"path":"/coordinador/test-mapa"}	2025-09-03 14:46:11.588601
94	14	PAGE_VIEW	{"path":"/coordinador/testmapa"}	2025-09-03 14:46:15.04681
95	14	PAGE_VIEW	{"path":"/coordinador/testmapa"}	2025-09-03 14:46:15.047103
97	14	PAGE_VIEW	{"path":"/coordinador/mapa-test"}	2025-09-03 14:46:20.82816
96	14	PAGE_VIEW	{"path":"/coordinador/mapa-test"}	2025-09-03 14:46:20.82816
98	14	PAGE_VIEW	{"path":"/coordinador/testmapa"}	2025-09-03 14:46:23.83117
99	14	PAGE_VIEW	{"path":"/coordinador/testmapa"}	2025-09-03 14:46:23.831217
100	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:46:29.539497
101	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 14:46:47.270396
102	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 14:46:47.270396
103	14	PAGE_VIEW	{"path":"/test-mapa"}	2025-09-03 14:46:48.225481
104	14	PAGE_VIEW	{"path":"/test-mapa"}	2025-09-03 14:46:48.696347
105	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:46:53.531042
107	14	PAGE_VIEW	{"path":"/coordinador/test-map"}	2025-09-03 14:46:58.690517
106	14	PAGE_VIEW	{"path":"/coordinador/test-map"}	2025-09-03 14:46:58.69048
108	14	PAGE_VIEW	{"path":"/test-mapa"}	2025-09-03 14:47:01.311758
109	14	PAGE_VIEW	{"path":"/test-mapa"}	2025-09-03 14:47:01.897365
110	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:47:02.105081
111	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:47:02.577004
113	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 14:50:17.301652
112	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 14:50:17.301406
114	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:55:07.156989
115	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:55:07.168414
116	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:55:13.730581
117	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:55:13.731105
118	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 14:55:58.626551
119	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:56:04.547045
120	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:56:05.02362
121	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:56:09.187243
122	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:56:09.777754
123	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:58:54.296078
124	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 14:58:54.299824
125	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 15:01:03.963287
126	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 15:01:05.350285
127	14	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-03 15:01:08.858748
128	14	TRAFICO_TAB_CLICK	{"tab":"Formatos de recoleccion de datos","headerOption":"resumen"}	2025-09-03 15:01:09.911651
129	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 15:01:11.515664
130	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 15:01:12.440801
131	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 15:01:13.298904
132	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 15:01:14.63343
133	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 15:07:34.32636
134	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 15:07:50.970445
135	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 15:07:58.128946
136	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 15:18:20.770068
137	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 15:18:20.773349
138	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 15:44:35.013036
139	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 15:44:35.013386
140	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 15:46:04.291128
141	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 15:46:05.552727
142	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 15:48:19.484086
143	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 15:48:19.488139
144	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 15:48:27.874687
145	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 15:48:27.876133
146	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 15:55:22.968643
147	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 15:55:23.159533
148	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 16:00:03.462254
149	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:00:23.431588
150	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:00:23.431733
151	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:11:21.146058
152	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:11:21.146193
153	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 16:12:00.3038
154	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:12:13.79064
155	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:12:13.797177
156	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:13:29.978067
157	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:13:29.982558
158	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:13:44.109832
159	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:13:44.109786
160	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:15:23.404544
161	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:15:23.404528
162	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 16:17:13.340691
163	14	PAGE_VIEW	{"path":"/coordinador/tareas/tareas"}	2025-09-03 16:17:28.681909
164	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 16:17:52.729965
165	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-03 16:17:54.171769
166	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 16:17:56.337941
167	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 16:17:57.409073
168	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 16:18:05.887599
169	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 16:19:01.858472
170	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 16:19:01.858836
171	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 16:19:03.981899
172	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 16:19:10.281519
173	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 16:19:10.286074
175	14	PAGE_VIEW	{"path":"/test-mapst-map"}	2025-09-03 16:19:18.732523
176	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:19:22.646563
1231	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:21:40.447303
1244	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 14:37:29.829258
1256	14	Creación de Usuario	Usuario con DNI 12312312 creado por 14	2025-09-10 14:43:34.595785
1268	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:55:03.380413
1281	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/9"}	2025-09-10 15:29:08.919243
1292	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 16:00:26.70607
1294	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 16:00:35.177189
1305	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:11:14.887981
1316	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 16:57:04.063984
1318	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:57:10.947174
1330	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:20:58.407345
1342	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:33:40.291781
1354	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:37:01.435089
1368	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 13:30:44.160404
1381	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:10:15.314294
1394	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:21:02.205543
1405	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:40:54.476135
1417	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:52:19.485443
1430	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-11 14:59:23.942776
1446	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 15:14:44.118748
1447	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 15:14:44.821006
1459	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:39:57.90612
1471	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 16:02:39.578207
1483	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:29:42.063224
1495	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:02:24.228786
1507	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:37:55.999565
1520	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-12 12:30:45.241176
1534	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:06:51.801325
1546	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-12 14:41:21.848835
1558	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:23:31.123924
1569	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:42:27.210944
1580	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:01:09.577423
1596	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-12 16:54:37.780242
1608	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-13 14:23:30.637709
1621	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-14 01:26:10.526647
1633	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-14 15:26:27.619838
1634	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-14 15:26:28.606922
1645	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/11"}	2025-09-15 13:44:10.818027
1647	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/11"}	2025-09-15 13:44:14.930891
1657	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 14:15:18.026497
1667	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 14:46:33.555753
1677	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:11:29.40871
1689	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:50:14.017271
1690	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:50:14.883288
1707	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:03:48.608941
1708	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:03:49.058342
1720	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:18:19.935793
1732	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:25:45.472059
1750	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:35:29.043309
1766	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-15 16:50:58.600059
1776	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:52:53.6435
1787	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:55:53.360847
1790	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:55:54.190375
1802	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:58:51.788546
1814	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:16:43.501404
1824	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:28:57.51358
1837	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:33:08.449964
1839	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:33:11.548516
1849	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 17:44:16.852764
1862	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:50:38.436233
1863	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:50:40.585841
1875	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/13"}	2025-09-15 17:55:01.944619
1889	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 18:00:02.642686
1900	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 21:54:06.417635
1901	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 21:54:07.088413
1915	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/12"}	2025-09-16 14:08:20.448186
1925	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/13"}	2025-09-16 14:38:09.829358
1935	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 14:58:51.780508
1946	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 15:46:00.248252
1956	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:10:35.712291
1967	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/19"}	2025-09-16 16:20:16.007155
1968	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:20:18.421375
1985	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:07:02.654108
1995	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/16"}	2025-09-16 17:18:37.749559
2006	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:07:23.569067
2017	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:40:48.141931
2027	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 20:07:48.382252
2038	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-16 20:19:35.002349
2048	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 20:50:51.932066
2058	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:34:49.251508
2068	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 21:39:46.779857
174	14	PAGE_VIEW	{"path":"/test-mapst-map"}	2025-09-03 16:19:18.731049
177	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:19:23.229069
178	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 16:33:08.986623
179	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 16:33:15.956435
180	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-03 16:33:15.981658
181	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:33:20.893462
182	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:33:20.895486
183	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 16:37:48.199303
184	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 16:37:48.202546
185	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:40:46.923832
186	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:40:46.939357
187	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:47:52.122795
188	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:47:52.129235
189	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:48:07.019901
190	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:48:07.029315
191	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:49:48.413055
192	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:49:48.423801
193	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:49:50.937976
194	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:49:50.946215
195	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 16:50:47.016173
196	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 16:50:55.006943
197	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:51:00.722201
198	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:51:00.746427
199	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:57:30.325221
200	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:57:30.330409
201	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:59:44.38303
202	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 16:59:44.385358
203	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:00:06.875632
204	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 17:00:08.817219
205	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 17:01:11.358457
206	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 17:01:11.359114
207	14	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-03 17:05:46.969569
208	14	TRAFICO_TAB_CLICK	{"tab":"Estacion de control","headerOption":"resumen"}	2025-09-03 17:05:53.337112
209	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:18:59.815476
210	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 17:19:02.000742
211	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 17:19:08.637602
212	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:26:49.553669
213	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:26:53.583395
214	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:26:54.067413
215	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:28:58.294802
216	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:28:58.312936
217	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:29:21.361896
218	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:29:21.377615
219	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:30:24.751934
220	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:30:24.77249
221	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:31:48.082535
222	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:31:48.114763
223	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:34:24.183282
224	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:34:24.200827
225	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:34:31.419528
226	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:34:31.438768
227	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:34:34.631563
228	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:34:34.635734
229	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:36:14.467773
230	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:36:14.483298
231	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:38:53.887097
232	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:39:03.010534
233	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:39:03.011702
234	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:39:05.876538
235	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:39:05.876797
236	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:40:54.319093
237	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:40:54.323251
238	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:41:00.779771
239	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:41:00.782272
240	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:42:25.488708
241	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:42:25.489362
242	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:43:20.786405
243	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:43:20.786731
244	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:49:00.869814
245	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-03 17:49:15.194615
246	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:49:15.900178
248	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:49:18.08183
247	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:49:18.081535
249	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-03 17:49:39.072973
250	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-03 17:49:48.215257
251	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-03 17:53:43.720862
252	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:53:49.270711
253	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-03 17:53:49.954422
254	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-03 17:53:55.604547
255	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 03:41:15.373332
256	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-04 03:41:18.528394
257	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-04 03:41:18.529835
258	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 03:41:25.378143
259	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 03:41:25.37842
260	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 13:42:20.635125
261	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-04 13:44:47.207887
262	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 13:57:55.914464
263	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 14:16:55.017799
264	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 14:16:55.615539
265	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:17:01.501551
266	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-04 14:30:35.239524
267	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 14:31:27.960452
268	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 14:33:20.953395
269	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 14:33:20.955153
270	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:33:28.823476
271	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:33:28.82436
272	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:46:05.746738
273	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:46:05.757056
274	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:50:20.933049
275	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:50:20.933541
276	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 14:50:44.754877
277	14	PAGE_VIEW	{"path":"/tes-mapa"}	2025-09-04 14:50:57.061098
278	14	PAGE_VIEW	{"path":"/tes-mapa"}	2025-09-04 14:50:57.103153
279	14	PAGE_VIEW	{"path":"/test-mapa"}	2025-09-04 14:51:00.541409
280	14	PAGE_VIEW	{"path":"/test-mapa"}	2025-09-04 14:51:01.039812
281	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 14:51:04.178188
282	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 14:51:04.207633
283	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 14:54:02.945462
284	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 14:54:02.945796
285	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:54:10.719918
286	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:54:10.719847
287	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 14:55:29.19622
288	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-04 14:55:32.2414
289	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:56:26.08353
290	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 14:56:26.112152
291	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 15:06:12.727993
292	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-04 15:06:21.348666
293	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-04 15:06:46.640548
294	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 15:09:50.981845
295	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 15:09:51.02652
296	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 15:16:34.658783
297	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 15:16:34.686898
299	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-04 15:54:01.318248
298	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-04 15:54:01.318334
300	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:06:35.896129
301	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:07:16.784827
302	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:07:28.249303
303	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:07:41.914584
304	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:09:17.273405
305	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 16:09:24.579442
306	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-04 16:09:25.064485
307	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:10:30.878668
308	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:10:58.515877
309	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:11:23.263377
310	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-04 16:11:37.335861
311	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:11:47.806828
312	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:11:49.120027
313	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:11:53.44742
314	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:12:19.15013
315	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-04 16:12:45.64327
316	14	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-04 16:14:44.270584
317	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-04 16:17:12.533962
318	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-04 16:17:13.36452
319	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-04 16:17:40.080846
320	14	PAGE_VIEW	{"path":"/coordinador/tareas/tareas"}	2025-09-04 16:18:23.920871
321	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:18:30.088508
322	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:21:57.215921
323	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:22:00.687672
324	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:22:24.719451
325	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:22:24.735186
326	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-04 16:28:19.284093
327	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-04 16:31:00.291813
328	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-04 16:31:00.293086
329	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:41:19.637935
330	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:41:19.644389
331	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:41:23.862264
332	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:41:26.743877
333	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:43:05.120844
334	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-04 16:43:10.244459
335	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:43:11.746022
336	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:43:13.042468
337	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:43:17.554341
338	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:43:34.927505
339	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-04 16:43:35.520561
340	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:43:59.284686
341	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:44:17.631988
342	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-04 16:45:38.810857
343	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:46:39.38582
344	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:50:02.667716
345	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:50:13.826214
346	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:51:44.126652
347	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:52:00.748513
348	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:52:07.468975
349	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:52:08.018965
350	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:52:09.864626
351	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:52:10.785944
352	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-04 16:53:23.902767
353	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:53:32.26048
354	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-04 16:53:36.318777
355	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:54:39.43225
356	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-04 16:54:52.967596
357	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:55:24.026262
358	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-04 16:55:34.886658
359	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:55:35.36255
360	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:55:35.975535
361	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 16:55:50.606947
362	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 16:56:40.354754
363	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 16:56:40.354795
364	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:58:44.081238
365	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 16:58:44.316711
366	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 16:59:11.013508
367	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-04 16:59:11.694629
368	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:00:55.944164
369	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:00:55.946906
370	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 17:00:56.45557
371	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-04 17:00:56.682582
372	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 17:01:06.425621
373	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 17:03:29.790953
374	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-04 17:03:29.794652
375	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 17:16:34.401994
376	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:18:49.031378
377	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:18:49.031167
378	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 17:31:45.12849
379	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-04 17:35:33.30976
380	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-04 17:35:33.340998
381	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 17:35:38.201979
382	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-04 17:35:38.436362
383	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:35:46.273846
384	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:35:46.27781
385	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:35:52.435336
386	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:35:52.438856
387	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:43:04.069529
388	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-04 17:43:04.087642
389	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 13:32:47.374563
390	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 13:33:38.291362
391	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 13:33:38.317085
392	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 13:39:51.970104
393	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 13:44:32.26481
394	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 13:44:57.023114
395	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 13:45:04.562884
396	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 13:46:13.695902
397	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 13:48:04.729559
398	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 13:48:18.527978
399	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 13:48:20.167213
400	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 13:48:20.598199
401	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 13:48:21.087619
402	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 13:54:23.451154
403	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 13:54:23.453817
404	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 13:57:48.43687
405	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 13:57:48.461582
406	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:02:15.303241
407	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:02:15.329921
408	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:02:39.445474
409	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:02:39.447114
410	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:04:44.340774
411	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:04:44.346219
412	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:05:06.022736
413	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:05:06.022809
414	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:06:25.031071
415	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:06:25.040571
416	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:08:26.12223
417	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:08:26.134786
418	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:09:36.03189
419	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:09:36.032242
420	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:10:09.058163
421	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:10:09.058152
422	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:10:59.410589
423	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:10:59.640487
424	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:13:34.992897
425	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:13:35.006413
426	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:13:55.443768
427	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:13:55.447572
428	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:19:37.314725
429	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:19:41.804882
430	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:19:42.280735
431	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:19:49.510152
432	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:20:54.635609
433	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:20:54.636058
434	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:23:28.769057
435	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:23:28.802005
436	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:27:31.552959
437	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:27:31.555791
438	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:28:40.639556
439	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:28:40.65012
440	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:31:15.900186
441	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:31:15.915972
442	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:32:44.79015
443	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:32:44.796692
444	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 14:33:53.77448
445	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:33:58.288015
446	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:33:58.301318
447	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:34:41.675667
448	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:34:41.675678
449	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:35:23.118661
450	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:35:23.118691
451	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:38:29.374647
452	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:38:29.450564
453	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:38:38.289771
454	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:38:38.787143
455	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:41:06.193579
456	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:41:06.202013
457	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:50:25.297598
458	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:50:25.342716
459	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 14:51:17.163219
460	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 14:51:17.98233
461	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:51:23.414267
462	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:51:32.576761
463	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:51:46.512732
464	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:54:49.786707
465	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 14:54:49.799034
466	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:55:43.467954
467	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 14:55:43.473841
468	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:04:15.506543
469	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:04:15.521052
470	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:04:50.740974
471	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:04:50.742445
472	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:12:25.598248
473	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:12:25.635728
474	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:16:47.82273
475	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:16:47.823609
476	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:20:20.949232
477	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:20:20.961955
478	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 15:22:37.41231
479	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 15:22:38.212887
480	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:49.517147
481	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:50.015497
482	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:51.868511
483	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:51.875629
484	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:52.396763
485	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:52.871302
486	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:52.958271
487	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:53.065996
488	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:53.075535
489	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:53.103628
490	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:53.109822
491	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:53.24693
492	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:58.267969
493	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:22:58.269202
494	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 15:23:08.161911
495	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 15:23:08.181287
496	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 15:23:52.471187
497	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:24:19.102806
498	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:24:19.103414
499	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:28:18.118129
500	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:28:18.142489
501	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 15:40:54.649531
502	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:40:57.232138
503	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:40:57.236128
504	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:52.422784
505	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:52.431983
506	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:56.061209
507	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:56.079722
508	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:56.193741
509	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:56.194508
510	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:56.670009
511	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:56.686382
512	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:57.161353
513	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:57.1626
514	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:57.424014
515	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:57.650422
516	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:57.652005
517	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:57.856899
518	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:57.893214
519	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.274571
520	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.33813
521	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.481322
522	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.481389
523	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.557278
524	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.56044
525	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.682568
526	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.682673
527	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.764316
528	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.916621
529	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:58.916628
530	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:59.111012
531	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:59.114013
532	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:59.392775
533	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:59.393054
534	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:59.632663
535	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:59.637755
536	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:59.831079
537	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:50:59.83395
538	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.061607
539	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.065929
540	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.329059
541	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.329481
542	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.536487
543	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.539566
544	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.741746
545	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.748841
546	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.933189
547	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:00.939695
548	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:54.089332
549	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:54.089776
550	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:54.644188
551	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:54.649711
555	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:59.108546
559	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:59.849265
577	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.579678
1232	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-10 14:22:37.435796
1245	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:39:05.915987
1257	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:45:06.175608
1269	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:57:53.270685
1282	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 15:29:11.800063
1293	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 16:00:31.555495
1295	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 16:00:35.178901
1306	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:14:17.572602
1317	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 16:57:05.570745
1331	14	Eliminación de Usuario	Usuario con DNI 09090909 eliminado por 14	2025-09-10 17:23:05.954804
1343	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:35:02.014061
1356	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:37:04.011963
1369	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 13:43:51.430426
1370	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 13:43:53.484476
1371	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 13:44:00.115859
1382	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 14:10:21.12742
1395	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:21:02.227006
1406	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:43:09.622163
1418	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:52:19.532976
1431	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 14:59:37.340241
1448	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:23:33.047305
1460	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:43:18.199902
1472	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 16:02:47.082364
1484	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:29:42.064372
1496	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:08:37.800571
1508	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 17:38:59.219823
1509	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:39:04.063389
1521	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 12:30:53.801193
1522	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-12 12:30:56.234758
1535	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-12 14:07:21.577373
1536	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:07:28.761
1547	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-12 14:41:21.849707
1559	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:27:58.29809
1570	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:42:27.21106
1581	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:01:09.589524
1598	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:00:50.642566
1609	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-13 14:24:02.507676
1610	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-13 14:24:06.462743
1622	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-14 14:35:52.31711
1635	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-14 15:57:57.780199
1646	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/11"}	2025-09-15 13:44:10.819103
1658	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 14:15:18.07593
1668	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 14:46:34.007904
1678	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:11:29.923775
1691	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:52:00.229915
1692	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 15:52:00.854515
1709	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:07:47.980067
1721	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:19:31.750845
1734	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-15 16:25:48.758799
1751	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:40:46.660578
1767	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:51:43.316418
1777	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:53:45.759631
1778	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:53:51.814491
1791	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:57:29.732156
1792	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:57:31.334456
1793	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:57:34.272836
1803	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:59:35.478144
1815	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:20:31.998172
1825	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:28:58.216229
1840	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:33:34.832235
1850	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:44:43.259804
1864	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:52:20.961851
1876	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-15 17:56:57.833075
1890	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 18:00:12.276913
1902	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 21:55:41.512771
1903	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 21:55:42.425909
1904	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/12"}	2025-09-15 21:55:58.045997
1916	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:08:22.979665
1926	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:38:43.339153
1936	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 14:58:52.131082
1947	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/18"}	2025-09-16 15:46:52.06595
1957	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/18"}	2025-09-16 16:10:59.938939
1969	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:23:57.532711
1986	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:07:02.666111
1996	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 17:31:27.276362
2007	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:15:58.61945
2018	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:40:48.166693
2028	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 20:07:56.239757
2039	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 20:22:00.606696
2049	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/21"}	2025-09-16 20:51:23.532563
2059	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:35:42.111918
2069	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 21:41:16.134292
552	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:58.724219
554	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:59.105292
568	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.881087
1233	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:23:12.131501
1236	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 14:23:19.25227
1246	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 14:39:06.6109
1258	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:45:06.211877
1270	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:57:53.291754
1283	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 15:32:29.058083
1296	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-10 16:05:28.99575
1307	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:14:17.581201
1319	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:08:27.764493
1332	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:30:51.783333
1344	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:35:02.481193
1358	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:37:16.504291
1372	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 13:50:54.3206
1383	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 14:10:21.12866
1396	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:28:08.905829
1407	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:43:09.622678
1419	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 14:53:31.543461
1432	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 14:59:37.34052
1449	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:34:02.097919
1461	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:43:18.201349
1473	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 16:02:47.552332
1485	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 16:31:21.028427
1497	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:08:37.893667
1510	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 17:42:02.838321
1523	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 12:31:18.849964
1537	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:18:29.728863
1548	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-12 15:01:19.479503
1550	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:01:25.030407
1560	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:27:58.340958
1571	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:47:10.678739
1582	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 16:02:22.538684
1599	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:00:50.678939
1611	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-13 14:24:14.649722
1623	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-14 14:36:07.292837
1636	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-14 15:58:01.088908
1648	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/11"}	2025-09-15 13:44:14.939097
1659	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 14:27:14.678701
1669	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/12"}	2025-09-15 14:46:55.606557
1679	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:21:23.984068
1680	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 15:21:29.099785
1693	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:52:58.099517
1710	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:07:48.537885
1712	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:07:52.430518
1722	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:22:32.470724
1735	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:26:21.477055
1737	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/12"}	2025-09-15 16:26:35.557681
1739	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/12"}	2025-09-15 16:26:45.064999
1752	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 16:40:47.696464
1768	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:51:43.329171
1779	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:54:17.87564
1794	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:57:35.80335
1804	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:59:35.539765
1816	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:20:32.279846
1826	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:28:58.219864
1841	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:34:30.133373
1851	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:44:44.864823
1865	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:52:21.555772
1877	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-15 17:56:57.840685
1891	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 18:00:12.281218
1905	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 23:08:13.496376
1917	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/13"}	2025-09-16 14:10:30.873513
1927	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/15"}	2025-09-16 14:39:26.215466
1937	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 14:59:33.861262
1948	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 15:46:56.585456
1958	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:11:03.349017
1970	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:23:57.533106
1987	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/18"}	2025-09-16 17:07:47.795811
1997	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-16 17:31:27.39278
2008	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:15:58.627581
2019	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:43:13.478497
2029	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 20:08:53.352174
2040	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 20:22:01.895489
2050	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 20:51:39.594093
2060	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:35:42.113646
2070	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 21:41:16.852936
2077	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:02:51.396502
2082	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:10:00.389128
2086	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:22:52.56705
2089	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:25:35.745065
2092	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:29:27.287464
2094	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:29:30.170838
2095	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:29:31.448928
2097	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:30:33.352772
2099	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:31:23.403484
553	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:58.72445
1234	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-10 14:23:12.900273
1247	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-10 14:39:16.277224
1259	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-10 14:46:09.334065
1271	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-10 15:10:12.062279
1284	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 15:32:29.058634
1297	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-10 16:05:28.996593
1308	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:23:13.554586
1320	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:08:27.791665
1321	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 17:08:33.63093
1322	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 17:08:42.971205
1333	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:30:51.787067
1345	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:35:21.508898
1359	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:41:44.847939
1373	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 13:50:54.341404
1384	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 14:14:14.042015
1397	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:28:08.910187
1408	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 14:47:03.391023
1412	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 14:47:11.88508
1420	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 14:53:31.544677
1433	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:01:37.08011
1450	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:34:02.10677
1462	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 15:52:26.83697
1474	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:07:00.413375
1486	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 16:31:21.028617
1498	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:32:00.354336
1511	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 17:42:05.060142
1524	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 12:32:36.009443
1525	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-12 12:32:36.881031
1538	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:18:29.734473
1549	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 15:01:19.55745
1561	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:31:36.356164
1572	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:47:10.683899
1583	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-12 16:02:24.300459
1584	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:02:29.362214
1600	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:01:22.366426
1612	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-13 14:25:33.080724
1624	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-14 14:39:59.234955
1625	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-14 14:40:00.857306
1637	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-14 16:59:54.303109
1649	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/11"}	2025-09-15 13:44:42.559863
1660	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 14:27:15.080481
1670	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 14:50:12.419707
1681	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:25:40.194512
1694	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:52:58.572073
1711	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:07:51.25384
1723	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:24:29.738402
1736	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:26:22.484599
1753	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 16:49:57.660121
1769	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:51:50.120906
1780	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:54:17.889061
1795	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:58:20.986242
1805	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:00:15.43866
1817	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:24:31.846485
1827	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:28:58.219838
1842	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:38:34.899173
1852	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:46:02.135426
1866	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:52:21.570219
1878	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:59:11.683348
1892	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 18:02:06.840159
1906	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-15 23:08:46.195403
1918	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:15:00.263737
1928	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:39:28.708951
1938	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:59:36.084743
1949	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 16:03:57.284659
1959	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:13:45.125856
1971	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/18"}	2025-09-16 16:24:21.828801
1972	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:24:28.13922
1988	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:07:53.816766
1998	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 17:37:36.831597
2009	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:20:15.608087
2020	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:43:13.557661
2030	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 20:08:53.818574
2041	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 20:23:17.276144
2051	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 21:32:28.484841
2061	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:36:55.600909
2071	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 21:41:35.660676
2078	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:06:58.1475
2083	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:10:00.389538
2087	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:22:52.57418
2090	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:29:25.0485
2093	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:29:30.168648
2096	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:30:33.348981
2098	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:31:23.393247
2100	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:31:39.129574
2101	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:31:39.599256
557	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:59.504155
556	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:59.504051
558	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:51:59.845608
560	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.223768
561	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.400797
562	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.535779
563	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.540221
564	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.540905
565	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.702529
566	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.723354
567	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:00.866658
569	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.021303
570	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.036435
571	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.051926
572	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.190442
573	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.191024
574	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.193536
575	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.337793
576	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.578726
578	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.871741
579	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.871731
580	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.988797
581	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:01.988729
582	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:15.711674
583	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:15.711707
584	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:20.07048
585	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:20.556306
586	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:24.301385
587	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:24.301947
588	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:24.860183
589	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:52:24.861317
590	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:53:55.675601
591	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:53:55.679592
592	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:54:09.111459
593	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:54:09.111571
595	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:58:02.454987
594	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 15:58:02.454895
596	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 15:59:57.156967
597	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 15:59:57.705991
598	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 16:00:04.448737
599	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:00:49.376386
600	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:00:49.37714
601	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:00:58.243438
602	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:00:58.676382
603	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:01:23.904178
604	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:01:23.904587
605	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:01:25.882371
606	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:01:26.384951
607	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:02:14.924377
608	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:02:14.92445
609	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:08:30.235927
610	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:08:30.236707
611	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:20:51.892844
612	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:20:51.893702
613	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 16:22:15.871992
614	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:22:19.587233
615	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 16:26:48.414322
616	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 16:26:48.432389
617	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:26:54.760196
618	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:26:55.010331
619	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:26:56.256954
620	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:26:56.737727
621	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:06.69414
622	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:07.168764
623	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 16:27:08.489274
624	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 16:27:08.489394
625	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:36.646227
626	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:36.655566
627	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:37.624584
628	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:37.626185
629	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:38.119541
630	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:38.120358
631	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:38.822879
632	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:38.824443
633	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:38.851613
634	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:38.855852
635	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:39.053057
636	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:39.05496
637	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:39.359982
638	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:39.645373
639	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:39.650438
640	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:40.192828
641	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:43.063866
642	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:27:43.065538
643	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 16:27:45.187781
644	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-05 16:27:45.1899
645	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:27:46.661215
646	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 16:27:51.168695
647	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:22.535803
648	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:22.536477
649	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:22.992015
650	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:23.372258
651	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:23.373029
652	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:23.47545
654	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:23.762066
653	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:23.762054
655	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:23.995732
656	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.041525
657	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.093893
658	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.239596
659	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.243198
660	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.370198
661	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.448815
662	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.45003
1235	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:23:18.251223
1248	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:40:10.71105
1252	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:40:25.597432
1260	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-10 14:46:09.347345
1272	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-10 15:10:12.076141
1285	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 15:44:22.969812
1298	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:06:14.22947
1309	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:23:13.723763
1323	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:08:56.518078
1334	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:33:13.362987
1346	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:35:21.50922
1360	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:41:44.856447
1374	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 13:52:39.170422
1385	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 14:14:14.713774
1398	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 14:31:47.481326
1409	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 14:47:03.391278
1421	14	PAGE_VIEW	{"path":"/perfil"}	2025-09-11 14:54:13.887894
1434	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:01:37.08851
1451	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:35:37.213118
1463	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 15:52:27.160494
1464	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 15:52:38.109563
1475	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:07:00.417179
1487	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:37:17.731603
1499	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 17:32:00.368362
1512	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 10:37:54.703499
1513	14	PAGE_VIEW	{"path":"/perfil"}	2025-09-12 10:38:04.641885
1526	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 12:32:43.185407
1539	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:23:18.623469
1551	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:03:47.636818
1562	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:31:36.688459
1573	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:47:56.836621
1585	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-12 16:08:29.087378
1601	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:01:22.368246
1613	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-13 14:25:40.750981
1626	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-14 14:41:11.663243
1638	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-14 16:59:56.742676
1650	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/11"}	2025-09-15 13:44:42.584457
1661	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 14:42:03.537082
1671	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 14:50:13.227429
1682	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:25:40.197551
1695	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:57:23.97129
1701	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:57:39.08335
1702	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:57:40.23644
1713	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:11:20.662448
1714	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:11:23.983583
1724	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:25:09.519256
1738	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:26:42.317653
1754	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 16:49:57.660543
1755	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:50:02.015932
1770	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:52:06.468061
1781	14	PAGE_VIEW	{"path":"/ingenieria/topografia"}	2025-09-15 16:55:02.56008
1796	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:58:21.058231
1806	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:00:27.60883
1818	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:24:31.960626
1828	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:28:58.233845
1843	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:38:34.902532
1853	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:46:02.489133
1867	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:52:42.658917
1870	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:52:50.933861
1871	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 17:52:51.510684
1879	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 17:59:11.960626
1880	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:59:13.184097
1893	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 18:02:06.842525
1907	14	PAGE_VIEW	{"path":"/coordinador/tareas/tareas"}	2025-09-15 23:09:03.43423
1919	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:33:01.123998
1929	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:43:35.280956
1939	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 14:59:44.511814
1950	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:03:58.414918
1960	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:13:45.127525
1973	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:03:35.962873
1976	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:03:46.062727
1978	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 17:03:54.275063
1989	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:09:49.97348
1999	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:37:37.080271
2010	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:20:15.616859
2021	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:47:46.418285
2031	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 20:12:03.621058
2042	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 20:23:26.413562
2052	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 21:32:30.537262
2062	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:36:55.601569
2072	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 21:44:40.012382
2079	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:06:58.154401
2084	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:11:10.943259
2088	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:25:35.050902
2091	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:29:25.057259
663	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.566896
1237	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-10 14:23:28.388582
1249	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:40:10.736283
1261	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:49:03.135663
1263	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 14:49:13.07986
1273	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 15:12:13.339713
1274	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-10 15:12:15.316262
1286	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 15:44:23.375075
1299	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:06:14.238235
1310	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:25:16.234731
1324	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:08:56.520372
1335	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:33:13.363375
1347	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:36:13.235932
1361	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:43:43.25534
1375	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 13:52:39.185424
1386	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 14:14:15.693803
1399	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 14:31:49.926753
1410	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-11 14:47:07.036726
1422	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-11 14:54:22.538282
1436	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:02:05.037898
1435	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:02:05.037938
1437	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:02:07.026513
1439	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 15:02:16.02475
1443	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:02:26.472007
1452	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:35:37.225896
1465	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 15:52:38.756805
1476	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:10:03.204022
1488	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:37:17.733747
1500	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 17:36:49.900075
1514	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-12 10:38:20.781167
1527	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 13:30:09.042495
1540	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:23:18.635772
1552	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:03:47.643841
1563	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:32:07.370301
1574	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:47:56.84542
1586	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 16:16:11.379403
1587	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-12 16:16:13.570139
1602	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:09:16.649034
1614	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-13 14:25:43.10897
1627	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-14 15:18:58.153218
1628	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-14 15:18:58.86068
1639	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 13:32:39.620201
1651	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 13:48:06.030101
1652	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 13:48:07.283243
1662	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-15 14:42:20.643668
1672	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/12"}	2025-09-15 14:50:27.63243
1683	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:26:19.493177
1696	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 15:57:24.29748
1698	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 15:57:27.868215
1715	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:11:37.515572
1725	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:25:11.937436
1740	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:27:26.145928
1756	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:50:25.350676
1760	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:50:39.622361
1771	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:52:06.471717
1782	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:55:03.761654
1797	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 16:58:21.06028
1807	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:00:27.608862
1819	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:27:48.189782
1830	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:29:09.031388
1844	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:39:26.476141
1854	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:49:41.21533
1868	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:52:42.66542
1881	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 17:59:47.948718
1894	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 18:02:18.835648
1908	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-15 23:09:04.264421
1909	14	PAGE_VIEW	{"path":"/ingenieria/hidrologia"}	2025-09-15 23:09:07.263707
1910	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 23:09:09.317226
1920	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:33:01.126976
1930	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:43:35.31483
1940	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:59:45.697415
1951	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/18"}	2025-09-16 16:04:08.872704
1961	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/18"}	2025-09-16 16:14:03.339747
1974	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:03:36.032922
1975	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 17:03:44.186547
1990	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:09:49.980942
2000	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/16"}	2025-09-16 17:37:44.207836
2011	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:20:19.846456
2022	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:47:46.425383
2032	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 20:12:03.637892
2043	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 20:24:03.071543
2053	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:33:13.241112
2063	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:38:06.008731
2073	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 21:44:40.033892
2080	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:09:44.929756
664	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.566857
1238	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:30:23.935235
1250	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:40:20.86368
1262	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:49:03.586809
1275	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 15:14:41.094873
1276	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 15:14:42.200757
1287	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 15:44:48.995987
1300	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:06:38.221007
1311	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:25:16.247133
1325	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:09:08.417541
1336	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:33:17.351332
1348	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:36:13.250699
1362	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:43:43.257322
1376	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 13:56:45.142497
1387	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 14:14:31.761121
1400	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:35:55.76298
1411	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-11 14:47:07.524669
1423	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 14:54:22.862551
1438	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:02:07.027582
1453	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:37:31.141762
1466	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:52:53.814184
1477	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:10:03.205023
1489	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:39:17.082885
1501	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 17:36:53.409113
1515	14	PAGE_VIEW	{"path":"/perfil"}	2025-09-12 10:39:11.17065
1528	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-12 13:30:20.053462
1541	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:33:08.460777
1553	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:14:52.457949
1564	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:32:07.380647
1575	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:52:42.118757
1588	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:17:29.295977
1590	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 16:17:31.926663
1591	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-12 16:17:32.501168
1603	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:09:16.662503
1615	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-13 18:25:47.748602
1629	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-14 15:19:01.147153
1640	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 13:32:41.667812
1653	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 13:55:47.88832
1663	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 14:42:21.386286
1673	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 14:53:17.312841
1684	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 15:26:20.283308
1697	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:57:26.317265
1716	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:11:37.516774
1726	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:25:32.213548
1729	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:25:44.162514
1730	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:25:44.717589
1741	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:27:36.555835
1742	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:27:38.594699
1757	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 16:50:32.405532
1758	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:50:33.357825
1772	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:52:21.760944
1783	14	PAGE_VIEW	{"path":"/ingenieria/seguridad-vial"}	2025-09-15 16:55:28.063176
1798	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:58:21.062393
1808	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:00:27.640202
1820	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:27:48.210907
1832	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:29:09.529343
1845	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:39:26.476359
1855	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 17:49:41.329984
1869	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:52:42.672292
1882	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:59:54.243286
1883	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 17:59:59.686765
1885	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 18:00:00.072248
1887	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 18:00:00.475555
1895	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-15 18:02:21.552887
1896	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 18:02:22.378678
1911	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 13:59:38.981901
1921	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/13"}	2025-09-16 14:33:08.461356
1931	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:47:40.460978
1941	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/16"}	2025-09-16 15:25:10.904521
1952	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:04:32.135198
1962	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:14:05.841646
1977	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 17:03:53.46517
1979	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 17:03:56.51411
1980	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:03:57.191951
1991	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:10:08.56723
2001	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 19:02:24.508046
2012	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:20:19.853871
2023	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:49:39.091905
2033	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 20:14:02.631351
2036	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-16 20:14:06.337921
2044	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 20:38:21.024089
2054	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:33:13.255232
2064	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 21:38:06.016035
2074	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 21:47:02.405084
2081	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:09:44.930413
2085	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:11:10.959115
665	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.721304
1239	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:30:23.970942
1251	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 14:40:23.080052
1264	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 14:49:13.499592
1277	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/9"}	2025-09-10 15:15:00.524026
1288	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:00:06.005506
1301	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:06:38.223371
1312	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:37:06.19153
1326	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:09:08.418866
1337	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:33:17.357369
1349	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:36:55.908982
1351	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 17:36:58.026098
1363	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 17:44:32.793046
1364	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:44:36.009432
1377	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 13:56:45.151456
1388	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 14:14:31.812418
1401	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:35:55.774983
1413	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-11 14:47:12.365575
1424	14	PAGE_VIEW	{"path":"/coordinador/config/ChangelogManagement"}	2025-09-11 14:54:27.846339
1425	14	PAGE_VIEW	{"path":"/coordinador/calendario/calendar"}	2025-09-11 14:54:33.660322
1426	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-11 14:54:34.218262
1440	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 15:02:16.026538
1442	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 15:02:20.212078
1454	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 15:37:31.147789
1467	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 15:55:37.2003
1478	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 16:24:01.730142
1490	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 16:39:17.08539
1502	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 17:37:10.678511
1516	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 10:39:14.192166
1529	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-12 13:30:20.0591
1542	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:33:08.46944
1554	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:14:52.614025
1565	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:35:04.21155
1576	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:52:42.137485
1589	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:17:29.58532
1604	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:09:44.437363
1616	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-13 18:26:01.508176
1630	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/11"}	2025-09-14 15:23:53.491437
1641	14	PAGE_VIEW	{"path":"/perfil"}	2025-09-15 13:32:53.540946
1642	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-15 13:32:54.747999
1654	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 13:55:47.895148
1664	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 14:42:58.92195
1674	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 14:53:30.757957
1685	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:27:01.169632
1686	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 15:27:04.249525
1699	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 15:57:36.774816
1700	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 15:57:37.270058
1717	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 16:16:11.658399
1727	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:25:39.127361
1743	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:30:45.705071
1746	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:30:48.623665
1749	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:30:51.887521
1759	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 16:50:37.672675
1761	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 16:50:42.5341
1763	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-15 16:50:52.687407
1773	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-15 16:52:40.753448
1784	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 16:55:29.215604
1799	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 16:58:21.129238
1809	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:14:47.543049
1810	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:14:48.115237
1821	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 17:28:35.012604
1833	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:31:15.106128
1846	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:41:10.747433
1856	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-15 17:49:41.690071
1872	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-15 17:54:13.675208
1884	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-15 17:59:59.787268
1897	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-15 18:02:24.246897
1912	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:02:23.824968
1922	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:33:14.082762
1932	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 14:47:40.469222
1942	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/16"}	2025-09-16 15:34:03.174842
1953	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/18"}	2025-09-16 16:08:17.001336
1963	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/19"}	2025-09-16 16:18:36.752523
1964	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 16:18:38.108353
1981	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:05:24.805075
1992	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 17:10:08.567949
2002	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-16 19:02:26.438369
2013	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 19:22:53.32896
2014	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:22:56.855625
2024	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 19:49:39.092943
2034	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 20:14:04.685221
2045	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/20"}	2025-09-16 20:38:21.039775
2055	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 21:33:54.823529
2065	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 21:39:42.012718
2066	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 21:39:43.066163
2075	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:02:46.623619
666	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:28:24.721864
667	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/43"}	2025-09-05 16:28:39.975368
668	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:29:06.521105
669	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:29:06.525976
670	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/43"}	2025-09-05 16:30:43.600239
671	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/43"}	2025-09-05 16:30:43.600834
672	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:30:47.252965
673	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:32:08.449078
674	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:32:08.454893
675	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 16:32:08.827562
676	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:32:11.143481
677	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:32:11.14586
678	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/43"}	2025-09-05 16:32:42.284343
679	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:32:57.942719
680	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:32:57.971113
681	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:35:17.593738
682	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:35:17.5942
683	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:35:58.184147
684	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:35:58.188571
685	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:37:56.1636
686	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:37:56.172766
687	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:47:18.110574
688	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:47:24.908378
689	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 16:47:25.387854
690	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:52:06.933015
691	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 16:52:07.820615
692	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:53:26.521627
693	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 16:53:28.482768
694	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:54:34.058086
695	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 16:54:34.604783
696	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:55:33.810885
697	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-05 16:55:34.834154
698	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:58:11.456243
699	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 16:58:13.786015
700	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:59:01.047048
701	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 16:59:01.049843
702	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 16:59:04.556133
703	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:00:02.959094
704	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:00:04.096149
705	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:00:06.069391
706	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 17:00:06.935799
707	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:00:09.219462
708	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:00:11.003623
709	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:00:29.758167
710	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-05 17:00:34.746599
711	14	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-05 17:00:41.89782
712	14	TRAFICO_TAB_CLICK	{"tab":"Formatos de recoleccion de datos","headerOption":"resumen"}	2025-09-05 17:00:43.873116
713	14	TRAFICO_TAB_CLICK	{"tab":"Estacion de control","headerOption":"resumen"}	2025-09-05 17:00:44.699113
714	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:01:50.062349
715	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:01:50.072517
716	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:13:27.222559
717	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:13:27.237602
718	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:18:50.337745
719	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:18:50.339021
720	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:19:32.936502
721	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:19:32.938523
722	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:19:46.545456
723	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:19:46.571451
724	14	PAGE_VIEW	{"path":"/tes-map"}	2025-09-05 17:19:51.00114
725	14	PAGE_VIEW	{"path":"/tes-map"}	2025-09-05 17:19:51.006529
726	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-05 17:19:56.150492
727	14	PAGE_VIEW	{"path":"/test-map"}	2025-09-05 17:19:56.174652
728	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-05 17:20:03.843543
729	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-05 17:20:03.85164
730	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:22:05.089945
731	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:22:05.091909
732	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:22:25.876632
733	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:22:25.880991
734	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:23:31.761938
735	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:23:31.775151
736	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:27:43.793811
737	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:27:43.803215
738	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:27:57.900774
739	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:27:59.588328
740	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:30:13.864141
741	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:30:29.969761
742	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:30:29.971215
743	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:32:55.681603
744	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:32:55.688782
745	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:34:41.69141
746	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:34:41.691751
747	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:35:55.027081
748	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:35:55.063554
749	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:42:19.205902
750	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 17:42:19.721372
751	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:42:21.678879
753	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 17:45:06.033584
752	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 17:45:06.033706
754	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:50:55.713162
755	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:50:57.588417
756	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:51:58.688441
757	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 17:52:00.065518
758	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:52:02.59587
759	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:52:04.526368
760	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 17:56:33.270086
761	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 17:56:33.271484
762	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:56:36.107935
763	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 17:56:37.635204
764	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:56:38.534354
765	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:56:39.996444
766	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:56:41.056556
767	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:56:41.917163
768	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:56:41.923043
769	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:57:36.052886
770	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-05 17:57:36.058798
771	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 17:59:07.626476
772	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 17:59:42.202708
773	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 18:00:00.930957
774	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 18:17:16.437078
775	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-05 18:17:17.24139
776	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 18:21:33.647275
777	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 18:21:36.94206
778	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-05 18:27:36.70386
779	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 18:27:43.533942
780	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/7"}	2025-09-05 18:28:22.36592
781	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/7"}	2025-09-05 18:28:48.386568
782	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 18:28:49.513498
783	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-05 18:28:53.923577
784	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 18:28:55.526499
785	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 20:29:06.769344
786	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 20:29:10.734009
787	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 20:29:13.531765
788	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 20:29:14.877761
789	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 20:34:15.096634
790	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 20:34:15.896329
791	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 20:34:17.715629
792	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 20:34:18.833259
793	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:47:46.731847
794	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-05 21:47:55.629494
795	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:48:08.571538
796	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-05 21:48:10.173946
797	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:48:10.687137
798	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:48:11.425647
799	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 21:48:12.841135
800	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:48:22.830697
801	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:48:23.558956
802	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-05 21:48:27.558845
803	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:48:30.668711
804	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 21:48:30.975138
805	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:48:42.585013
806	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:48:53.995589
807	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:49:00.45173
808	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-05 21:49:01.201784
809	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:49:04.806764
810	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:49:06.034185
811	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:49:17.105881
812	14	PAGE_VIEW	{"path":"/ingenieria/basica"}	2025-09-05 21:49:21.58479
813	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:49:24.767215
814	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:49:25.247644
815	14	PAGE_VIEW	{"path":"/ingenieria/basica"}	2025-09-05 21:49:28.218095
816	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:49:30.137367
817	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 21:49:36.42699
818	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 21:49:38.515201
819	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-05 21:49:45.36946
820	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:49:45.798032
821	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:49:47.60131
822	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:49:49.729892
823	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:49:49.832769
824	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:49:50.05667
825	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:49:51.053154
826	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 21:49:52.696744
827	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-05 21:49:59.378693
828	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:50:01.209459
829	14	PAGE_VIEW	{"path":"/coordinador/calendario/calendar"}	2025-09-05 21:50:01.931693
830	14	PAGE_VIEW	{"path":"/coordinador/tareas/tareas"}	2025-09-05 21:50:04.541277
831	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:50:07.113071
832	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 21:50:09.228628
833	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-05 21:50:10.388792
834	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 21:50:11.159788
835	14	PAGE_VIEW	{"path":"/coordinador/calendario/calendar"}	2025-09-05 21:50:14.890368
836	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:50:16.151215
837	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:50:17.736794
838	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-05 21:50:28.29889
839	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:50:28.953376
840	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:50:33.758787
841	14	PAGE_VIEW	{"path":"/coordinador/tareas/tareas"}	2025-09-05 21:50:40.593573
842	14	PAGE_VIEW	{"path":"/coordinador/calendario/calendar"}	2025-09-05 21:50:47.907931
843	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-05 21:50:48.663092
844	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:50:50.586355
845	14	PAGE_VIEW	{"path":"/perfil"}	2025-09-05 21:50:52.615938
846	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:50:55.57368
847	14	PAGE_VIEW	{"path":"/coordinador/tareas/tareas"}	2025-09-05 21:51:03.100788
848	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:51:03.340155
849	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:51:04.511831
850	14	PAGE_VIEW	{"path":"/coordinador/calendario/calendar"}	2025-09-05 21:51:05.696485
851	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:51:06.571064
852	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:51:08.879865
853	14	PAGE_VIEW	{"path":"/coordinador/calendario/calendar"}	2025-09-05 21:51:10.818752
854	14	PAGE_VIEW	{"path":"/reportes"}	2025-09-05 21:51:12.04909
855	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 21:51:15.244753
856	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 22:12:57.038371
857	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:13:45.916559
858	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-05 22:13:56.163755
859	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:14:02.161225
860	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-05 22:14:03.6751
861	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:14:05.358194
862	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:14:09.513422
863	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:14:24.802343
864	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-05 22:14:34.292794
865	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:15:02.056222
866	14	PAGE_VIEW	{"path":"/ingenieria/geologia"}	2025-09-05 22:15:05.069894
867	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:15:07.013824
868	14	PAGE_VIEW	{"path":"/ingenieria/topografia"}	2025-09-05 22:15:10.99983
869	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:15:12.909924
870	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-05 22:15:14.272814
871	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:15:34.453556
872	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-05 22:15:35.619074
873	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:15:37.549622
874	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-05 22:15:38.772462
875	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-05 22:15:39.911391
876	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-05 22:15:40.791455
877	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-06 17:29:39.213981
878	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-06 17:29:45.140485
879	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-06 20:54:26.116914
880	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-06 20:54:50.42254
881	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-06 20:55:01.441281
882	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-06 20:55:05.061291
883	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-06 20:55:09.266048
884	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-07 03:34:53.867844
885	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-07 03:34:53.87477
886	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-07 03:35:19.239626
887	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-07 03:35:19.661476
888	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-07 03:35:30.966481
889	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-07 03:35:34.288095
890	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-07 03:35:41.298173
891	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-07 03:35:42.809614
892	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-07 03:38:36.210729
893	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-07 16:16:27.838809
894	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-07 16:16:33.455639
895	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-07 16:28:44.072171
896	14	PAGE_VIEW	{"path":"/coordinador/config/NavbarVisibility"}	2025-09-07 16:31:18.75619
897	14	PAGE_VIEW	{"path":"/coordinador/config/ChangelogManagement"}	2025-09-07 16:31:19.766093
898	14	PAGE_VIEW	{"path":"/coordinador/config/NavbarVisibility"}	2025-09-07 16:31:20.723735
899	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-07 16:40:28.066988
900	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 09:19:19.112035
901	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 09:19:22.200421
902	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-08 09:19:52.134645
903	14	PAGE_VIEW	{"path":"/coordinador/config/NavbarVisibility"}	2025-09-08 09:20:12.340101
904	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-08 09:20:13.959832
905	14	PAGE_VIEW	{"path":"/coordinador/config/NavbarVisibility"}	2025-09-08 09:20:15.51479
906	14	PAGE_VIEW	{"path":"/coordinador/config/ChangelogManagement"}	2025-09-08 09:20:16.814752
907	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-08 09:20:25.368107
908	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 09:20:38.254581
909	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 13:36:11.419787
910	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 13:36:13.076427
911	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 13:38:05.143846
912	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 13:38:13.886549
913	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 13:46:46.568891
914	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 13:46:50.821683
915	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 13:46:51.207997
916	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 13:47:01.499779
917	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 13:47:08.147004
918	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 13:47:08.171582
919	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 13:47:20.518771
920	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 13:47:33.077846
921	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 13:47:33.083558
922	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 13:47:50.39958
923	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 14:07:32.406032
924	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 14:07:33.586485
925	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 14:07:40.94599
926	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 14:14:19.157092
927	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 14:14:19.158996
928	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 14:14:53.900924
929	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 14:14:53.904522
930	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 14:15:22.507117
931	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 14:15:22.521142
932	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 14:15:23.778094
933	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 14:15:23.778003
934	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 14:16:43.599175
935	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 14:16:44.202937
936	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 14:16:49.712993
937	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 14:19:18.067319
938	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 14:19:19.82928
939	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 14:19:25.720124
940	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 14:21:54.219868
941	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 14:21:54.219907
942	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 14:27:04.605175
943	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 14:27:05.069245
944	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 14:29:12.056793
945	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-08 14:29:20.97448
946	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 14:29:48.071049
947	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 14:29:49.132316
948	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 14:29:52.250031
949	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-08 14:30:14.733553
950	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 15:28:16.77675
951	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-08 15:28:22.700375
952	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 15:29:17.221804
953	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:29:19.916287
954	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:29:20.397073
955	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:00.209541
956	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:00.211076
957	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:01.172996
958	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:01.176122
959	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:01.886503
960	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:02.383819
961	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:02.690113
962	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:02.693888
963	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:17.147518
964	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:30:17.149345
965	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 15:39:05.033489
966	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 15:39:07.715042
967	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:39:09.810784
968	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:39:09.814842
969	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:39:21.935566
970	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:39:21.946118
971	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:40:17.634347
972	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:40:17.635452
973	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:40:27.975037
974	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:40:27.97969
975	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 15:40:32.534001
976	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 15:40:35.792091
977	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:40:39.099914
978	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:40:39.103619
979	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 15:41:33.012919
980	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 15:41:34.239947
981	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 15:41:43.664394
982	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:43:18.968746
983	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:43:18.969201
984	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 15:43:53.212035
985	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 15:43:54.970107
986	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:43:58.307636
987	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:43:58.310918
988	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:47:20.497507
989	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:47:20.502372
990	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 15:47:32.650099
991	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 15:47:36.084179
992	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:47:38.910542
993	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:47:38.911712
994	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:51:37.846472
995	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:51:37.846511
996	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:53:19.054869
997	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 15:53:19.068191
998	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 16:01:24.393152
999	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 16:01:24.393311
1001	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 16:02:25.434609
1000	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 16:02:25.434528
1002	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 16:02:35.171852
1003	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-08 16:02:35.171842
1004	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 16:10:29.019459
1005	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 16:10:29.051035
1006	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 16:10:35.233017
1007	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 16:24:08.179054
1008	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 16:24:17.347519
1009	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-08 16:24:47.423741
1010	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-08 16:24:47.424638
1011	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-08 16:24:54.581563
1012	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-08 16:24:55.08546
1013	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 16:24:56.072317
1014	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 16:24:56.0752
1015	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 16:26:02.244395
1016	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 16:26:02.25894
1017	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:02:21.887862
1018	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 17:02:22.38821
1019	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:02:27.524662
1020	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 17:02:34.585409
1021	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 17:02:34.585811
1022	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:02:40.774394
1023	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:10:08.180205
1024	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:10:08.180389
1025	14	PAGE_VIEW	{"path":"/coordinador/suelos/proyectos"}	2025-09-08 17:13:53.114959
1026	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:13:54.332457
1027	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 17:13:55.233784
1028	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:14:00.801998
1029	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:15:25.905557
1030	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-08 17:15:26.336946
1031	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:15:33.878666
1032	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:27:17.669197
1033	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:27:17.670797
1034	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:27:24.222407
1035	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-08 17:27:27.960433
1036	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:27:32.010251
1037	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:35:47.244622
1038	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-08 17:35:47.244837
1039	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:36:14.970445
1040	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:36:14.977988
1041	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:37:59.279487
1042	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:37:59.304528
1043	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:37:59.935989
1044	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:37:59.945828
1045	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:38:22.287072
1046	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-08 17:38:22.306193
1047	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:38:22.572106
1048	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 13:38:28.552605
1049	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 13:42:47.351108
1050	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 13:42:47.351137
1051	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:42:50.106604
1052	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:42:50.779466
1053	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:42:50.782088
1054	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:42:51.407302
1055	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:42:51.408287
1056	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:42:52.919485
1057	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:42:52.920563
1058	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:43:21.346728
1059	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:43:21.348561
1060	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:46:08.253169
1061	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:46:08.285891
1062	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 13:52:33.483821
1063	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 13:52:36.485129
1064	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-09 13:52:36.924132
1065	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 13:52:43.651347
1066	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 14:01:49.040604
1067	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 14:01:53.806968
1068	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-09 14:09:49.618993
1069	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 14:14:21.007442
1070	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 14:14:21.018706
1071	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 14:41:12.078505
1072	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 14:41:12.078918
1073	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 14:50:43.277654
1074	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 14:50:43.306007
1075	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 14:57:47.30802
1076	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 14:57:47.730351
1077	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 14:59:03.547824
1078	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-09 14:59:09.534833
1079	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 14:59:14.412947
1080	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 14:59:14.415827
1081	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 15:00:34.056631
1082	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 15:05:54.232131
1083	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:06:47.405922
1084	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:06:47.47062
1085	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 15:07:48.06005
1086	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 15:07:52.438457
1087	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 15:07:59.732218
1088	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:12:37.634505
1089	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:12:37.635123
1090	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:14:24.136836
1091	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:14:24.13952
1092	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:17:25.866847
1093	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:17:25.880066
1094	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 15:21:50.965141
1095	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 15:21:51.098232
1096	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 15:28:35.506126
1097	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 15:29:28.339814
1098	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 15:29:29.08679
1099	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 15:30:12.17751
1100	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 15:42:42.942957
1101	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 15:42:42.946536
1102	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 15:44:08.25427
1103	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 15:44:08.261554
1104	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:52.312837
1105	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:52.317763
1106	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:54.623216
1107	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.098876
1108	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.24412
1109	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.249152
1110	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.408562
1111	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.418317
1112	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.448875
1113	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.571852
1114	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.585458
1115	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.732197
1116	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.888794
1117	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:44:55.95235
1118	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-09 15:49:08.135585
1119	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-09 15:49:08.151936
1120	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:49:09.592478
1121	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:49:09.596393
1122	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:54:15.861931
1123	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:54:15.861893
1124	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:55:43.370688
1125	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:55:43.850319
1126	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:56:45.8369
1127	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:56:45.8369
1128	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:56:47.139556
1129	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 15:56:47.800712
1130	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 16:20:19.146758
1131	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 16:20:20.035294
1132	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:20:25.306701
1133	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 16:21:31.979576
1134	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 16:21:31.9993
1135	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:21:36.415747
1136	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:22:16.280937
1137	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:22:16.284086
1138	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:24:29.172589
1139	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:24:29.17324
1140	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:24:39.245709
1141	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:24:39.258222
1142	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:33:25.255375
1143	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:33:25.261503
1144	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:33:36.197097
1145	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:33:36.27237
1146	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:34:00.890824
1147	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:34:00.902471
1148	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:34:07.834905
1149	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:34:07.835766
1150	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:36:25.425935
1151	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:36:25.426673
1152	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:06.012093
1153	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:06.015155
1154	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:10.01675
1155	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:10.501841
1156	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:13.399334
1157	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:13.901679
1158	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:31.310683
1159	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:31.310734
1160	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:35.75135
1161	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:41:35.759016
1162	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:44:02.185307
1163	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:44:02.186512
1164	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 16:45:30.655753
1165	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-09 16:45:34.172214
1166	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 16:45:37.316677
1167	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 16:45:37.380628
1168	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:48:36.350334
1169	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:48:36.353696
1170	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:59:00.318894
1171	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 16:59:00.320757
1172	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 17:07:56.183362
1173	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 17:07:56.198413
1174	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-09 17:36:56.77707
1175	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-09 17:36:58.536614
1176	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 17:37:03.124615
1177	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 17:39:20.915578
1178	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-09 17:39:20.923689
1179	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 17:48:48.531321
1180	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-09 17:48:48.546518
1181	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 13:27:15.980594
1182	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 13:27:37.238867
1183	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 13:27:50.334391
1184	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 13:33:56.455012
1185	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 13:34:04.171189
1186	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 13:34:07.744083
1187	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 13:34:07.74541
1188	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 13:45:56.465131
1189	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 13:45:56.47238
1190	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 13:52:42.831937
1191	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 13:52:42.837717
1192	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 13:52:44.808552
1193	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 13:52:45.28767
1194	14	PAGE_VIEW	{"path":"/coordinador/suelos/proyectos"}	2025-09-10 13:55:18.369587
1195	14	PAGE_VIEW	{"path":"/coordinador/suelos/proyectos"}	2025-09-10 13:55:21.323301
1196	14	PAGE_VIEW	{"path":"/coordinador/suelos/proyectos"}	2025-09-10 13:55:21.819718
1197	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 13:55:22.504827
1198	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 13:56:13.571788
1199	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 13:56:13.837033
1200	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 13:56:19.648977
1201	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:00:29.534348
1202	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:00:29.536587
1203	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 14:01:23.546371
1204	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 14:01:23.557732
1205	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 14:02:28.706995
1206	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/8"}	2025-09-10 14:02:28.707145
1207	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:09:51.137478
1208	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 14:09:51.894153
1209	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:09:57.546206
1210	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-10 14:09:58.335086
1211	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:10:20.695925
1212	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 14:10:21.490929
1213	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:10:24.904544
1214	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-10 14:10:39.383665
1215	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:12:41.477209
1216	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:12:41.477907
1217	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:13:07.143332
1218	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:13:07.183013
1219	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:13:10.22002
1220	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:13:10.704536
1221	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-10 14:15:27.688163
1222	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-10 14:15:27.700781
1223	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:18:26.536165
1224	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:18:26.567835
1225	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios"}	2025-09-10 14:18:28.787692
1226	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:18:43.212899
1227	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:19:00.515553
1228	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 14:19:01.306914
1240	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-10 14:34:55.93451
1253	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:40:25.615284
1265	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 14:49:28.174875
1278	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-10 15:19:41.5913
1289	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:00:06.015097
1302	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:10:25.413749
1313	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 16:37:06.204507
1327	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:19:58.246784
1338	14	PAGE_VIEW	{"path":"/coordinador/"}	2025-09-10 17:33:25.466151
1350	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-10 17:36:56.712077
1355	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-10 17:37:03.437521
1365	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-10 17:52:07.001292
1378	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-11 13:59:47.170943
1389	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 14:14:57.35249
1390	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 14:14:58.130447
1402	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-11 14:36:35.916661
1414	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 14:50:59.528376
1427	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-11 14:54:37.519871
1441	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 15:02:19.108665
1455	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 15:39:32.41
1468	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 16:02:20.522338
1479	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-11 16:24:05.706736
1491	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-11 17:00:20.598339
1503	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-11 17:37:13.582605
1517	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 12:29:21.5654
1530	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-12 13:59:01.614494
1543	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 14:36:26.061116
1555	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:19:33.535239
1566	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:35:04.214414
1577	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 15:56:02.505985
1592	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 16:17:37.183881
1605	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/10"}	2025-09-12 17:09:44.449008
1617	14	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-13 18:26:07.271209
1618	14	TRAFICO_TAB_CLICK	{"tab":"Formatos de recoleccion de datos","headerOption":"resumen"}	2025-09-13 18:26:09.493968
2102	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:34:49.082427
2103	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:34:49.7913
2104	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:34:55.310622
2105	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:35:17.232637
2106	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 22:35:18.082126
2107	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:35:33.870974
2108	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:35:35.413521
2109	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:35:41.812558
2110	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:45:43.331651
2111	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:45:43.345527
2112	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:51:24.812905
2113	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-16 22:51:25.845802
2114	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:51:31.304794
2115	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-16 22:51:32.12042
2116	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 22:52:09.319657
2117	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 22:52:09.741837
2118	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:52:14.893745
2119	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:53:20.461224
2120	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:53:20.48892
2121	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:55:26.668656
2122	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 22:55:26.687383
2123	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 23:44:33.668719
2124	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 23:44:35.478434
2125	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 23:44:41.156942
2126	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 23:51:47.724809
2127	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 23:51:47.736525
2128	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 23:55:22.624013
2129	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 23:55:22.624717
2130	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-16 23:57:41.808335
2131	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-16 23:57:42.54655
2132	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-16 23:59:38.364569
2133	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:07:54.985072
2134	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:07:54.990609
2135	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:15:31.192855
2136	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:15:31.197229
2137	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:18:40.764789
2138	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:18:41.251668
2139	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:19:36.151476
2140	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:19:36.157596
2141	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:20:51.120172
2142	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:20:51.137641
2143	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:27:23.601829
2144	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:27:23.602069
2145	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:33:54.714336
2146	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:33:54.718846
2147	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:42:33.504655
2148	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:42:33.507837
2149	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 00:56:09.389888
2150	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 00:56:12.291929
2151	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:56:20.715636
2152	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:56:28.607797
2153	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 00:56:28.61041
2154	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 01:15:46.141425
2155	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 01:15:46.164777
2156	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 01:17:11.417449
2157	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 01:17:11.422137
2158	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 01:20:22.418566
2159	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 01:20:39.400052
2160	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 01:23:36.569082
2161	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-17 01:23:37.594274
2162	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 01:25:26.543961
2163	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 01:25:27.192978
2164	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 01:26:39.815388
2165	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 01:29:57.63083
2166	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 01:30:13.506824
2167	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 01:31:17.994078
2168	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 01:31:18.02236
2169	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:02:38.152342
2170	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:02:38.157631
2171	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:06:50.51322
2172	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:06:50.525771
2173	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:07:01.141758
2174	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:07:01.145014
2175	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:12:31.990913
2176	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:12:32.005415
2177	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:12:47.938901
2178	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:12:47.944781
2179	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:16:40.102447
2180	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:16:40.104194
2181	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:17:03.572898
2182	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 02:17:03.576178
2183	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 02:17:48.860944
2184	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:18:44.427983
2185	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:23:31.174134
2186	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:23:31.192318
2187	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:25:48.049241
2188	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:25:48.06013
2189	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:27:16.961931
2190	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:27:16.962638
2191	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:29:18.456972
2192	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:29:18.470605
2193	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:29:43.557423
2194	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:29:43.584408
2195	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:31:39.627016
2196	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:31:39.726926
2197	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 02:33:30.672626
2198	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:33:31.94955
2199	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:45:10.839121
2200	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:45:10.876613
2201	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:47:35.469306
2202	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:47:35.484192
2203	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:49:55.057097
2204	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:49:55.158953
2205	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:50:11.313578
2206	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:50:11.314528
2207	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:53:52.742643
2208	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:53:52.744266
2209	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/23"}	2025-09-17 02:54:49.456188
2210	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:55:14.94393
2211	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/23"}	2025-09-17 02:55:34.844684
2212	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:57:54.053348
2213	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/23"}	2025-09-17 02:58:20.747143
2214	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 02:58:22.144808
2215	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/23"}	2025-09-17 02:58:41.363715
2216	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 13:26:43.573787
2217	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-17 13:27:12.479343
2218	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 13:35:32.844472
2219	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 13:35:33.446275
2220	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 13:35:49.734801
2221	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-17 13:35:50.628365
2222	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 13:39:25.122614
2223	14	PAGE_VIEW	{"path":"/coordinador/calendario/calendar"}	2025-09-17 13:39:28.329825
2224	14	PAGE_VIEW	{"path":"/coordinador/tareas/tareas"}	2025-09-17 13:39:28.817275
2225	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-17 13:39:35.538666
2226	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-17 13:39:48.98008
2227	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 13:39:52.075724
2228	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 13:39:53.412276
2229	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/23"}	2025-09-17 13:40:31.876696
2230	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 13:40:41.536873
2231	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 13:40:52.298025
2232	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-17 13:49:59.800478
2233	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 13:53:40.0487
2234	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 13:53:40.0487
2235	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-17 13:54:04.892779
2236	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-17 13:54:04.893113
2237	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 13:54:06.365302
2238	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 13:54:09.732877
2239	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-17 13:54:11.870332
2240	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 13:54:14.998713
2241	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 13:54:16.094765
2243	14	PAGE_VIEW	{"path":"/geotext"}	2025-09-17 13:56:35.953698
2242	14	PAGE_VIEW	{"path":"/geotext"}	2025-09-17 13:56:35.953451
2244	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-17 13:56:38.0782
2245	14	PAGE_VIEW	{"path":"/geotest"}	2025-09-17 13:56:38.080954
2246	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 13:56:42.148735
2247	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 13:56:42.827272
2248	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:05:50.551073
2249	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:05:50.572203
2250	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:06:04.814032
2251	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:06:07.390944
2252	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:06:07.872799
2253	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:06:28.979046
2254	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:06:29.248926
2255	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:06:33.456325
2256	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 14:06:35.335781
2257	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:06:40.578508
2258	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-17 14:06:43.272027
2259	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:06:45.339195
2260	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:07:20.982854
2261	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:07:20.983164
2262	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:08:30.26408
2263	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:08:30.272339
2264	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 14:08:58.714629
2265	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:09:31.065727
2266	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 14:09:33.321173
2267	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:09:33.732002
2268	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:10:32.113717
2269	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 14:10:48.19983
2270	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:10:56.711154
2271	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 14:11:21.319784
2272	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 14:11:21.326474
2273	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 14:11:41.769041
2274	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:11:46.905405
2275	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 14:12:45.434991
2276	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:12:49.66312
2277	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:12:50.343627
2278	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 14:12:57.659462
2279	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:12:59.917653
2280	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 14:13:11.077071
2281	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:16:43.074235
2282	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-17 14:16:44.33978
2283	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:17:05.743346
2284	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-17 14:17:23.368659
2285	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 14:17:59.956757
2286	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 14:18:01.018928
2287	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:20:00.590577
2288	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:20:00.592834
2289	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:23:23.133737
2290	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 14:23:23.137064
2291	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:29:43.02405
2292	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:29:43.285308
2293	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:30:58.995533
2294	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:30:58.998432
2295	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:48:20.563978
2296	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:48:20.564322
2297	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:48:36.72897
2298	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 14:48:37.037226
2299	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:02:50.5809
2300	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:02:50.58628
2301	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:17:38.107698
2302	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-17 15:17:48.416074
2303	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-17 15:20:42.632081
2304	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-17 15:20:42.651693
2305	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-17 15:21:36.909277
2306	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-17 15:21:36.909443
2307	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:22:15.553491
2308	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 15:22:16.487633
2309	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:22:22.817167
2310	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:25:17.712337
2311	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:25:17.713348
2312	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-17 15:26:01.886727
2313	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:26:01.889933
2314	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:26:12.718394
2315	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:26:55.117741
2316	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:26:55.137681
2317	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:28:14.184857
2318	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:28:18.076002
2319	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:28:18.076006
2320	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:28:50.0687
2321	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:33:39.628875
2322	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:33:40.417895
2323	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:34:25.314936
2324	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 15:34:25.713618
2325	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:34:29.969597
2326	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:34:39.81112
2327	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:34:54.596328
2328	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:35:02.260282
2329	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:35:02.837932
2330	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:35:05.552986
2331	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:35:13.459422
2332	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:35:14.062957
2333	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:37:00.166493
2334	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 15:37:01.287168
2335	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:37:05.810075
2336	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:37:10.392896
2337	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:37:10.413009
2338	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:37:15.024048
2339	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:37:15.069964
2340	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:38:41.913118
2341	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:38:41.922859
2342	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 15:43:10.315568
2343	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 15:43:11.12072
2344	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:48:46.591644
2345	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:48:46.593387
2346	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:50:54.498501
2347	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 15:50:54.505272
2348	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 15:56:04.473165
2349	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/24"}	2025-09-17 15:56:44.893755
2350	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:01:44.747792
2351	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 16:01:44.845509
2352	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:01:50.294998
2353	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/24"}	2025-09-17 16:01:50.300115
2354	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:02:11.090698
2355	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:02:11.098033
2356	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/24"}	2025-09-17 16:04:14.617282
2357	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:04:14.934117
2358	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:04:53.62603
2359	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:04:53.651035
2360	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/24"}	2025-09-17 16:05:50.172734
2361	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/24"}	2025-09-17 16:05:50.176816
2362	14	PAGE_VIEW	{"path":"/coordinador/suelos/proyectos"}	2025-09-17 16:13:43.521834
2363	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/24"}	2025-09-17 16:13:45.314512
2364	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 16:13:58.06818
2365	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 16:15:36.992369
2366	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 16:20:24.847062
2367	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 16:20:53.464288
2368	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 16:25:03.319736
2369	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 16:25:04.917267
2370	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 16:25:14.621665
2371	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 16:45:56.396542
2372	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:45:56.750257
2373	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 16:46:26.692084
2374	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:51:16.398342
2375	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:56:25.352487
2376	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:56:25.840063
2377	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:57:46.703568
2378	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 16:57:46.704532
2379	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 17:15:26.120401
2380	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 17:16:49.945345
2381	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 17:16:53.998366
2382	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 17:25:15.003126
2383	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 17:25:15.01827
2384	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 17:35:24.120751
2385	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 17:35:24.125986
2386	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-17 17:37:51.392129
2387	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 21:15:26.768037
2388	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 21:15:26.794687
2389	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 21:15:26.795075
2390	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 21:15:26.806351
2391	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 21:51:41.20825
2392	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-17 21:51:48.036216
2393	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 21:52:07.904379
2394	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 21:52:08.598935
2395	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 21:52:22.802713
2396	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 21:54:03.308567
2397	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-17 21:54:04.198627
2398	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 21:54:08.792927
2399	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-17 21:55:14.068004
2400	14	PAGE_VIEW	{"path":"/coordinador/suelos/proyectos"}	2025-09-17 21:56:00.314307
2401	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 21:56:04.975177
2402	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 22:20:41.578094
2403	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-17 22:20:45.29477
2404	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-17 22:23:06.829539
2405	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-17 22:23:07.984504
2406	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-17 22:23:17.421726
2407	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 13:47:21.268653
2408	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 13:48:17.438246
2409	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 13:48:17.450022
2410	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 14:12:52.330398
2411	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 14:12:57.55042
2412	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 14:13:02.177415
2413	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 14:13:27.592936
2414	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 14:25:34.808787
2415	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 14:33:11.894459
2416	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 14:33:11.914608
2417	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 14:35:28.283161
2418	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 14:35:28.283731
2419	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 14:39:17.561526
2420	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 14:39:17.562059
2421	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 14:39:44.23624
2422	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 14:39:45.110595
2423	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 14:40:14.359484
2424	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 14:40:14.359607
2425	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 14:40:16.84266
2426	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 14:40:16.845422
2427	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:02:43.575875
2428	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:02:43.577942
2429	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:04:16.211548
2430	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:04:17.02622
2431	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:06:53.469469
2432	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:06:53.472252
2433	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:10:08.33318
2434	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-18 15:10:09.734544
2435	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-18 15:10:13.863728
2436	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:10:14.737422
2437	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-18 15:10:16.348711
2438	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-18 15:10:19.181281
2439	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:10:24.070696
2440	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-18 15:10:28.261359
2441	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:10:34.574863
2442	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:10:35.314775
2443	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:14:05.895689
2444	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:14:07.720755
2445	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 15:14:38.677842
2446	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:22:32.750627
2447	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:23:02.708527
2448	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:23:02.711259
2449	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:23:10.877201
2450	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:25:46.989164
2451	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:25:48.229922
2452	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:25:48.257034
2453	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:25:48.864603
2454	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:25:50.32222
2455	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:25:50.818798
2456	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:25:57.01325
2457	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:25:57.01968
2458	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:26:08.358001
2459	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:28:33.609099
2460	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:28:33.630139
2461	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:28:37.95982
2462	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:28:39.69017
2463	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:28:58.496684
2464	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:28:58.50783
2465	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:31:26.712743
2466	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:33:41.114289
2467	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:33:58.989413
2468	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 15:33:59.946421
2469	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:34:27.87882
2470	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:34:28.560562
2471	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 15:34:42.211761
2473	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:36:45.780542
2472	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:36:45.780365
2474	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:36:56.581158
2475	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:36:57.451625
2476	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:36:58.907805
2477	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:37:03.430253
2478	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:37:03.439357
2479	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:37:03.578787
2480	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 15:37:04.639389
2481	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:37:09.591252
2482	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 15:37:10.62167
2483	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:37:29.828953
2484	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 15:37:48.770023
2485	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 15:37:48.77229
2486	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:39:30.457105
2487	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 15:39:43.409922
2488	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:41:03.492349
2489	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:41:12.875265
2490	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:41:13.365674
2491	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 15:41:14.760709
2493	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:41:56.695638
2492	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 15:41:56.695638
2494	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:41:57.588334
2495	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-18 15:41:58.61736
2496	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:42:04.780878
2497	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:42:36.334141
2498	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:42:41.345276
2499	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:42:53.251847
2500	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 15:43:06.426462
2501	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:43:07.349757
2502	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 15:43:13.203266
2503	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:43:25.600735
2504	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:46:12.428739
2505	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 15:46:12.431211
2506	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 15:53:01.685784
2507	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 16:05:34.914899
2508	14	PAGE_VIEW	{"path":"/ingenieria/seguridad-vial"}	2025-09-18 16:14:33.276942
2509	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 16:14:34.144382
2510	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 16:14:35.477189
2511	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 16:14:43.427384
2512	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 16:22:56.725461
2513	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 16:22:56.725461
2514	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 16:22:56.749009
2515	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:24:39.344824
2516	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 16:24:46.948224
2517	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 16:25:59.372165
2518	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 16:25:59.377153
2519	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 16:25:59.37956
2520	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:26:14.662341
2521	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 16:26:27.317081
2522	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:27:09.133332
2523	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:27:09.14066
2524	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:27:23.838605
2525	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:27:23.85693
2526	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:28:03.531011
2527	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 16:28:07.542652
2528	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:28:14.392222
2529	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:28:14.404483
2530	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 16:28:49.017921
2531	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:32:59.04278
2532	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:32:59.047097
2533	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:33:27.982333
2534	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:33:28.002733
2535	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:33:30.912652
2536	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:33:30.91498
2537	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:33:42.035412
2538	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 16:33:44.381287
2539	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:35:56.52374
2540	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 16:36:03.320685
2542	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 16:36:03.443522
2541	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 16:36:03.443443
2543	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 16:36:03.635792
2544	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:36:04.605545
2545	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:36:04.608062
2546	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:36:53.528806
2547	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-18 16:36:54.337249
2548	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 16:36:54.337295
2549	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 16:44:16.762126
2550	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 16:44:17.022748
2551	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 16:44:33.635478
2552	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 16:44:35.389353
2553	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 16:44:42.765392
2554	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:49:34.727285
2555	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:49:35.206024
2556	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 16:51:24.66076
2557	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 16:51:25.474749
2558	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 16:55:12.355559
2559	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-18 16:55:13.139502
2560	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:57:20.764118
2561	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:57:20.764709
2562	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:57:42.113189
2563	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 16:57:42.25251
2564	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-18 16:57:57.390128
2565	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 16:57:57.624562
2566	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/25"}	2025-09-18 16:58:18.676375
2567	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 17:01:39.909026
2568	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 17:01:39.909402
2569	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 17:02:07.439494
2570	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 17:02:07.455076
2571	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 17:07:00.93188
2572	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 17:07:00.932668
2573	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 17:28:53.439272
2574	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 17:28:53.557003
2575	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 18:02:57.767629
2576	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 18:02:57.779181
2577	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 18:02:58.420782
2578	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/22"}	2025-09-18 18:02:58.423117
2579	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 18:02:58.457297
2580	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 19:17:47.248905
2581	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 19:17:47.250301
2582	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-18 22:47:18.677003
2583	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 22:47:47.612849
2584	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-18 22:47:49.212581
2585	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 22:47:54.333916
2586	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-18 22:47:55.374993
2587	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 22:48:00.589354
2588	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-18 22:48:24.278769
2589	14	PAGE_VIEW	{"path":"/coordinador/config/PermisosManagement"}	2025-09-18 22:48:52.619927
2590	14	PAGE_VIEW	{"path":"/coordinador/config/NavbarVisibility"}	2025-09-18 22:48:56.758636
2591	14	PAGE_VIEW	{"path":"/coordinador/config/ChangelogManagement"}	2025-09-18 22:48:58.498748
2592	14	PAGE_VIEW	{"path":"/coordinador/config/auditoria"}	2025-09-18 22:49:00.813688
2593	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-18 22:49:15.967034
2594	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 13:27:24.097215
2595	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 13:27:25.991411
2596	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 13:27:26.820355
2597	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 13:27:27.460496
2598	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 13:42:17.010577
2599	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 13:56:43.82822
2600	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 13:59:35.568535
2601	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 13:59:35.570967
2602	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:03:36.691409
2603	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:03:36.692063
2604	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:04:21.234587
2605	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:04:21.234623
2606	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:04:22.265296
2607	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:04:22.265532
2608	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:04:28.699523
2609	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:04:35.403945
2610	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:09:29.585661
2611	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-19 14:09:46.887077
2612	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:09:50.50995
2613	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-19 14:10:02.563346
2614	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:10:04.876276
2615	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:10:05.509018
2616	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:10:15.868311
2617	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:10:17.248567
2618	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:13:40.51131
2619	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:15:50.89589
2620	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:15:52.674402
2621	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:16:44.950039
2622	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:19:02.380405
2623	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:19:02.380405
2624	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:22:43.042378
2625	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:22:43.162605
2626	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:22:53.949334
2627	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:22:54.431403
2628	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:26:54.629908
2629	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:26:54.630344
2630	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:29:37.923703
2631	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:29:39.376133
2632	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 14:37:42.506531
2633	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:39:09.124984
2634	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:40:45.04924
2635	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:40:45.074315
2636	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-19 14:40:47.975852
2637	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-19 14:40:47.981556
2638	14	PAGE_VIEW	{"path":"/geoite"}	2025-09-19 14:41:00.613681
2639	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:41:00.812613
2640	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:41:02.366964
2641	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:49:20.54099
2642	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 14:50:43.02221
2643	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 14:50:50.653563
2644	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 15:01:38.724374
2645	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:06:50.139455
2646	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:30:49.280057
2647	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 15:30:53.244186
2648	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:32:30.27345
2649	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:32:30.274675
2650	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 15:32:59.205661
2651	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:33:02.395273
2652	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:35:23.802873
2653	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:35:23.807059
2654	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 15:37:10.063311
2655	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 15:37:10.49664
2656	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/26"}	2025-09-19 15:38:02.299508
2657	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:44:11.950902
2658	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:44:11.951351
2659	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:50:39.016401
2660	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 15:50:39.016381
2661	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 16:03:47.145459
2662	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/26"}	2025-09-19 16:37:10.708539
2663	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/26"}	2025-09-19 16:37:10.7323
2664	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 16:37:13.258037
2665	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 16:58:34.013344
2666	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 16:58:34.014444
2667	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 16:58:36.92166
2668	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:14:24.560979
2669	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:14:24.562131
2670	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:21:54.678658
2671	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:21:54.690635
2672	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:32:06.379908
2673	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:32:06.867783
2674	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:39:18.046695
2675	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:39:18.072278
2676	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-19 17:39:30.844153
2677	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:39:51.224819
2678	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/28"}	2025-09-19 17:40:08.856056
2679	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 17:43:19.144371
2680	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:43:20.165635
2681	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/29"}	2025-09-19 17:43:38.536392
2682	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 17:43:40.171415
2683	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 17:43:40.17656
2684	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:43:55.79473
2685	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-19 17:44:01.714787
2686	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/29"}	2025-09-19 17:52:42.311744
2687	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/29"}	2025-09-19 17:52:42.312142
2688	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/29"}	2025-09-19 17:53:08.333669
2689	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 17:54:53.587088
2690	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-19 17:55:00.050503
2691	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 20:42:42.07107
2692	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 20:42:42.900086
2693	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/30"}	2025-09-19 20:43:34.916886
2694	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 20:43:54.952744
2695	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-19 20:43:56.50254
2696	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 20:44:01.622917
2697	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-19 20:44:02.519199
2698	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 20:44:07.637124
2699	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 20:44:08.79923
2700	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 20:44:26.286342
2701	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 20:44:26.763503
2702	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-19 20:45:42.475033
2703	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 20:46:54.68142
2704	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-19 20:46:55.98373
2705	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 20:46:57.197471
2706	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-19 20:46:58.722083
2707	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/28"}	2025-09-19 20:47:13.491282
2708	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 20:50:53.674492
2709	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/mecanicadesuelos"}	2025-09-19 20:53:19.373143
2710	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 21:21:15.441906
2711	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 21:21:36.173396
2712	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 21:21:57.240847
2713	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-19 21:24:01.000186
2714	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 21:29:45.093994
2715	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-19 21:29:45.094401
2716	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-19 21:29:47.107248
2717	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-20 18:03:30.524941
2718	14	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-20 18:05:16.018822
2719	14	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-20 18:05:24.883806
2720	14	TRAFICO_TAB_CLICK	{"tab":"Formatos de recoleccion de datos","headerOption":"resumen"}	2025-09-20 18:05:25.286689
2721	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-20 20:30:38.381433
2722	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-20 20:39:30.231748
2723	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-20 21:37:10.038941
2724	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-20 21:37:19.346293
2725	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-20 21:37:19.587764
2726	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-20 21:40:24.502741
2727	14	PAGE_VIEW	{"path":"/ensayos/suelos"}	2025-09-20 21:40:26.708103
2728	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-20 21:40:31.595333
2729	14	PAGE_VIEW	{"path":"/coordinador/ensayos"}	2025-09-20 21:40:33.317217
2730	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-20 21:40:38.135823
2731	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-21 17:04:29.464936
2732	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-21 17:04:35.801632
2733	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-21 17:05:58.202018
2734	14	PAGE_VIEW	{"path":"/coordinador/config/frmusuarios2"}	2025-09-21 18:20:35.392268
2735	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-21 18:21:30.936214
2736	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 13:42:06.435617
2737	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 13:42:14.925161
2738	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-22 13:42:19.602008
2739	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 14:01:48.843174
2740	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 14:02:56.995146
2741	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-22 14:12:14.804239
2742	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-22 14:12:14.807563
2743	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 14:12:34.083202
2744	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 14:15:22.071599
2745	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 14:15:24.002054
2746	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 14:52:35.372701
2747	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 14:52:35.393095
2748	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 14:54:23.932127
2749	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 14:54:24.402692
2750	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:12:04.15819
2751	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:12:04.581815
2752	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-22 15:12:09.903169
2753	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 15:15:17.516458
2754	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 15:15:18.00595
2755	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-22 15:23:36.823085
2756	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/27"}	2025-09-22 15:23:36.823918
2757	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:24:52.208858
2758	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:24:53.303516
2759	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:38:33.897353
2760	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:38:33.900485
2761	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:38:41.399875
2762	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:38:41.911291
2763	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:38:43.351509
2764	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:38:44.418545
2765	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:38:53.312494
2766	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:38:55.049453
2767	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:38:59.781713
2768	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:39:00.745478
2770	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:40:28.333836
2772	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:43:08.039124
2774	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:44:26.737974
2776	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:45:47.514752
2777	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 15:46:12.49388
2778	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-22 15:46:15.420751
2779	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 15:46:21.831506
2780	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:46:22.454976
2781	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:50:08.468792
2782	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:50:08.840709
2783	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:50:12.728377
2784	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 15:50:13.479768
2785	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:50:14.810016
2786	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:50:15.954119
2787	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:51:58.345666
2788	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:51:59.357389
2789	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:51:59.862744
2790	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 15:52:07.043957
2791	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:59:52.124226
2792	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 15:59:52.141739
2793	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:00:49.624607
2794	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:00:51.845445
2795	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:00:51.85164
2796	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 16:00:53.629832
2797	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:08:54.94581
2798	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:08:54.948016
2799	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 16:13:40.13156
2800	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 16:13:40.13188
2801	1	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:16:59.287359
2802	1	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 16:17:06.588345
2803	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 16:19:39.657813
2804	1	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:20:28.373659
2805	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 16:30:40.015089
2806	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 16:30:40.019956
2807	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:31:04.445862
2808	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 16:31:05.649685
2809	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 16:31:19.16138
2810	1	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:31:45.091586
2811	1	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:31:45.091988
2812	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:31:50.892995
2813	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 16:41:05.982787
2814	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 16:41:05.983389
2815	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 16:41:39.883637
2816	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 16:41:39.884352
2817	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:42:29.77918
2818	14	PAGE_VIEW	{"path":"/coordinador/Progresivas"}	2025-09-22 16:42:30.758249
2819	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:42:34.103811
2820	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 16:42:39.28575
2821	1	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:43:49.48324
2822	1	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 16:43:50.058861
2823	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:44:04.561187
2824	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 16:44:06.231854
2825	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:44:08.456626
2826	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-22 16:44:10.836589
2827	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 16:44:17.222098
2828	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 16:44:18.359859
2829	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 16:44:23.36452
2830	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 16:45:21.637052
2831	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 16:46:09.246344
2832	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:26.284535
2833	1	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-22 16:58:31.204402
2834	1	TRAFICO_TAB_CLICK	{"tab":"Formatos de recoleccion de datos","headerOption":"resumen"}	2025-09-22 16:58:31.929181
2835	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:37.348344
2836	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:37.834378
2837	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:38.630101
2838	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:39.089028
2839	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:39.863496
2840	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:39.868339
2841	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:40.430437
2842	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:40.734001
2843	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:40.7451
2844	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:40.905531
2845	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:41.343022
2846	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 16:58:41.348043
2847	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 17:01:11.610139
2848	1	PAGE_VIEW	{"path":"/coordinador/ingenieria/trafico/trafico"}	2025-09-22 17:01:11.61814
2849	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 17:01:29.291921
2850	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 17:03:29.197587
2851	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 17:03:29.197555
2852	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:03:32.52963
2853	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 17:03:38.911949
2854	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:04:56.099346
2855	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 17:05:03.96271
2856	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 17:05:29.114245
2857	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:05:29.686357
2858	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 17:05:34.362372
2859	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 17:06:23.149982
2860	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 17:06:23.154676
2861	1	TRAFICO_TAB_CLICK	{"tab":"Tramos homogeneos","headerOption":"resumen"}	2025-09-22 17:07:26.190062
2862	1	TRAFICO_TAB_CLICK	{"tab":"Formatos de recoleccion de datos","headerOption":"resumen"}	2025-09-22 17:07:26.79273
2863	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 17:07:27.411155
2864	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/1"}	2025-09-22 17:07:27.415498
2865	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 17:07:31.734492
2866	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:07:32.438869
2867	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 17:08:02.521206
2868	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 17:08:10.601768
2869	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:08:11.558191
2870	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/3"}	2025-09-22 17:08:23.515463
2871	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 17:09:09.457765
2872	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:09:10.467191
2873	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 17:11:38.553089
2874	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:11:43.174086
2875	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/4"}	2025-09-22 17:11:51.229598
2876	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:14:16.601699
2877	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 17:14:22.524019
2878	1	PAGE_VIEW	{"path":"/geoite"}	2025-09-22 17:16:41.193554
2879	1	PAGE_VIEW	{"path":"/geoite"}	2025-09-22 17:16:41.222787
2880	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 17:27:52.111535
2881	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 17:27:52.136529
2882	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 17:28:25.86737
2883	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/2"}	2025-09-22 17:28:25.869693
2884	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-22 17:28:35.315754
2885	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-22 17:28:35.794657
2886	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/4"}	2025-09-22 17:28:43.098135
2887	1	PAGE_VIEW	{"path":"/geoite"}	2025-09-22 17:59:41.636569
2888	1	PAGE_VIEW	{"path":"/geoite"}	2025-09-22 17:59:41.637571
2889	1	PAGE_VIEW	{"path":"/geoite"}	2025-09-22 19:49:33.591728
2890	1	PAGE_VIEW	{"path":"/geoite"}	2025-09-22 19:49:33.932757
2891	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-23 13:45:57.479675
2892	14	PAGE_VIEW	{"path":"/coordinador/proyectos"}	2025-09-23 13:46:05.689693
2893	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-23 13:46:14.10409
2894	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-23 13:46:14.889675
2895	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/4"}	2025-09-23 13:46:32.936396
2896	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/4"}	2025-09-23 13:53:25.763192
2897	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos/4"}	2025-09-23 13:53:25.76319
2898	14	PAGE_VIEW	{"path":"/coordinador/suelos/ensayos"}	2025-09-23 13:53:27.861897
2899	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-23 13:53:35.008157
2900	14	PAGE_VIEW	{"path":"/coordinador/gestor-proyectos"}	2025-09-23 13:53:36.013166
2901	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-23 13:54:31.931095
2902	14	PAGE_VIEW	{"path":"/coordinador/cordinadords"}	2025-09-23 14:05:45.152151
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
T-1	tramo	Tramo T-1	E-1 A E-2 - 0+000 km Inicio de vía (desvío Lorohuachana) - 22+700 km Puente Lampachaca	767536.33 E, 8604420.13 N-772509.12 E, 8608996.44 N	\N	El tramo en evaluación se extiende desde el kilómetro 0+000 hasta el kilómetro 22+700 del eje vial. A lo largo de este recorrido se localizan puntos de interés como el Abra Reyna del Carmen, en las cuales se encuentran algunas ramificaciones y desvíos que conducen a haciendas, y áreas de actividad agrícola. El análisis de campo evidencia que, en este segmento, las condiciones orográficas y el volumen vehicular mantienen una configuración relativamente constante, sin variaciones significativas en términos de flujo ni tipología de tránsito. En base a estos criterios, se da definido el tramo 01 como un tramo homogéneo, apto para su análisis unificado dentro del estudio de tráfico.
T-2	tramo	Tramo T-2	E-2 A E-3 - 22+700 km Puente Lampachaca - 71+800 km Desvío C.P. La Estrella y Penetración	772509.12 E, 8608996.44 N-767536.33 E, 8604420.13 N	\N	El tramo en evaluación se extiende desde el kilómetro 22+700 hasta el kilómetro 71+800 del eje vial. A lo largo de este recorrido se localizan puntos de interés como las comunidades de Tinkuri y Yavero Chico, así como múltiples ramificaciones y desvíos que conducen a haciendas y áreas de actividad agrícola. El análisis de campo evidencia que, en este segmento, las condiciones orográficas y el volumen vehicular mantienen una configuración relativamente constante, sin variaciones significativas en términos de flujo ni tipología de tránsito. En base a estos criterios técnicos, se ha definido el tramo 02 como un tramo homogéneo, apto para su análisis unificado dentro del estudio de tráfico.
T-3	tramo	Tramo T-3	E-3 A E-4 - 71+800 km Desvío C.P. La Estrella y Penetración - 86+364 km C.P. San Martín	767536.33 E, 8604420.13 N-767536.33 E, 8604420.13 N	\N	El tramo en evaluación se desarrolla desde el kilómetro 71+800 hasta el kilómetro 86+364, correspondiente al segmento final del corredor vial en estudio. A lo largo de este sector, las condiciones orográficas, geométricas y de volumen vehicular presentan características estables y uniformes, sin evidenciarse variaciones significativas que alteren la funcionalidad del tránsito. En función de estos parámetros de análisis, y conforme a los lineamientos técnicos de segmentación vial, se define este sector como un tramo homogéneo, adecuado para ser considerado como una sola unidad de estudio en la modelación y proyección del flujo vehicular.
E-03	estacion	Estación 03 (E-03)	Kilómetro 71+800 - Intersección con Túpac Amaru	772509.12 E, 8608996.44 N	993.00	Se localiza en el kilómetro 71+800 del proyecto, en el punto donde se localiza la intersección vial hacia el centro poblado de Túpac Amaru, y las comunidades de Penetración y La Estrella.
E-04	estacion	Estación 04 (E-04)	Kilómetro 86+364 - C.P. San Martín	781900.00 E, 8608800.00 N	927.00	Se localiza en el kilómetro 86+364 del vial en estudio, correspondiente al centro poblado de San Martín. Esta estación ha sido definida como el punto de culminación del proyecto.
\.


--
-- Data for Name: ensayos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ensayos (id, ubicacion, fecha, resultado, estado, id_departamento, codigo_tramo, tipo_via, tipo_ensayo_codigo, progresiva, estrato_id, codigo_generado, tipo_ensayo, nombre_ensayo, responsable_id, metodo, observaciones, datos_formulario) FROM stdin;
2	\N	2025-09-22	\N	pendiente	\N	\N	\N	\N	\N	1	\N	2	ensayo 2	\N	\N	\N	{}
1	\N	2025-09-22	\N	actualizado	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"ensayoId": "1", "pesoTotal": 1500, "retenidos": {"N4": 5, "1in": 5, "2in": 5, "3in": 5, "N10": 5, "N20": 5, "N40": 5, "N60": 5, "N140": 5, "N200": 5, "1_5in": 5, "3_4in": 5, "3_8in": 5}, "antesLavado": 1500, "despuesLavado": 1250}
3	\N	2025-09-22	\N	actualizado	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"ensayoId": "3", "pesoTotal": 1500, "retenidos": {"N4": 5, "1in": 5, "2in": 5, "3in": 5, "N10": 5, "N20": 5, "N40": 5, "N60": 5, "N140": 5, "N200": 5, "1_5in": 5, "3_4in": 5, "3_8in": 5}, "antesLavado": 1500, "despuesLavado": 1250}
4	\N	2025-09-23	\N	actualizado	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"ensayoId": "4", "pesoTotal": 1500, "retenidos": {"N4": 5, "1in": 5, "2in": 5, "3in": 5, "N10": 5, "N20": 5, "N40": 5, "N60": 5, "N140": 5, "N200": 5, "1_5in": 5, "3_4in": 5, "3_8in": 5}, "antesLavado": 1500, "despuesLavado": 1250}
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
8	0000008	Tierra	Tierra	\N	2025-09-17 02:54:21.431074	2025-09-17 02:54:21.431074	\N	\N
9	0000009	noon	noon	\N	2025-09-19 16:58:48.432582	2025-09-19 16:58:48.432582	\N	\N
\.


--
-- Data for Name: experiencia_academica; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.experiencia_academica (id, usuario_id, centro_estudios, profesion, especialidad, fecha_ingreso_academica, fecha_egreso_academica, informacion_adicional_academica) FROM stdin;
3	44	aaa	aaa	aaaa	2000-06-24	2016-06-08	aaaa
\.


--
-- Data for Name: experiencia_laboral; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.experiencia_laboral (id, usuario_id, institucion, cargo, fecha_ingreso_laboral, fecha_egreso_laboral, informacion_adicional_laboral) FROM stdin;
1	44	aaa	aaa	\N	\N	
\.


--
-- Data for Name: formulario_campos; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.formulario_campos (id, seccion_id, name, label, type, orden, required, step, created_at) FROM stdin;
1	1	pesoTotal	Peso Total Muestra (g)	number	1	t	\N	2025-09-22 15:49:04.385694
2	1	antesLavado	Peso Antes de Lavado (g)	number	2	t	\N	2025-09-22 15:49:04.385694
3	1	despuesLavado	Peso Después de Lavado (g)	number	3	t	\N	2025-09-22 15:49:04.385694
\.


--
-- Data for Name: formulario_secciones; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.formulario_secciones (id, tipo_ensayo_id, titulo, componente_key, orden, created_at, config_json) FROM stdin;
1	1	Datos Generales de la Muestra	CamposGenerales	1	2025-09-22 15:49:04.385694	\N
2	1	Análisis Granulométrico (ASTM D422)	TablaTamices	2	2025-09-22 15:49:04.385694	{"tamices": [{"mm": 76.2, "name": "3\\"", "key_name": "3in"}, {"mm": 50.8, "name": "2\\"", "key_name": "2in"}, {"mm": 38.1, "name": "1 1/2\\"", "key_name": "1_5in"}, {"mm": 25.4, "name": "1\\"", "key_name": "1in"}, {"mm": 19.1, "name": "3/4\\"", "key_name": "3_4in"}, {"mm": 9.52, "name": "3/8\\"", "key_name": "3_8in"}, {"mm": 4.76, "name": "N°4", "key_name": "N4"}, {"mm": 2.00, "name": "N°10", "key_name": "N10"}, {"mm": 0.84, "name": "N°20", "key_name": "N20"}, {"mm": 0.42, "name": "N°40", "key_name": "N40"}, {"mm": 0.25, "name": "N°60", "key_name": "N60"}, {"mm": 0.106, "name": "N°140", "key_name": "N140"}, {"mm": 0.074, "name": "N°200", "key_name": "N200"}]}
3	2	Límite Líquido (ASTM D4318)	TablaLimiteLiquido	1	2025-09-22 15:49:04.385694	{"tests": [{"id": 1, "fields": {"llGolpes1": {"name": "llGolpes1", "type": "number"}, "llPesoSeco1": {"name": "llPesoSeco1", "type": "number"}, "llPesoHumedo1": {"name": "llPesoHumedo1", "type": "number"}, "llCodRecipiente1": {"name": "llCodRecipiente1", "type": "text"}, "llPesoRecipiente1": {"name": "llPesoRecipiente1", "type": "number"}}}, {"id": 2, "fields": {"llGolpes2": {"name": "llGolpes2", "type": "number"}, "llPesoSeco2": {"name": "llPesoSeco2", "type": "number"}, "llPesoHumedo2": {"name": "llPesoHumedo2", "type": "number"}, "llCodRecipiente2": {"name": "llCodRecipiente2", "type": "text"}, "llPesoRecipiente2": {"name": "llPesoRecipiente2", "type": "number"}}}, {"id": 3, "fields": {"llGolpes3": {"name": "llGolpes3", "type": "number"}, "llPesoSeco3": {"name": "llPesoSeco3", "type": "number"}, "llPesoHumedo3": {"name": "llPesoHumedo3", "type": "number"}, "llCodRecipiente3": {"name": "llCodRecipiente3", "type": "text"}, "llPesoRecipiente3": {"name": "llPesoRecipiente3", "type": "number"}}}], "headers": ["N° Ensayo", "N° Golpes", "Recipiente", "Peso Húmedo + Rec.", "Peso Seco + Rec.", "Peso Rec."]}
4	2	Límite Plástico (ASTM D4318)	TablaLimitePlastico	2	2025-09-22 15:49:04.385694	{"tests": [{"id": 1, "fields": {"lpPesoSeco1": {"name": "lpPesoSeco1", "type": "number"}, "lpPesoHumedo1": {"name": "lpPesoHumedo1", "type": "number"}, "lpCodRecipiente1": {"name": "lpCodRecipiente1", "type": "text"}, "lpPesoRecipiente1": {"name": "lpPesoRecipiente1", "type": "number"}}}, {"id": 2, "fields": {"lpPesoSeco2": {"name": "lpPesoSeco2", "type": "number"}, "lpPesoHumedo2": {"name": "lpPesoHumedo2", "type": "number"}, "lpCodRecipiente2": {"name": "lpCodRecipiente2", "type": "text"}, "lpPesoRecipiente2": {"name": "lpPesoRecipiente2", "type": "number"}}}], "headers": ["N° Ensayo", "Recipiente", "Peso Húmedo + Rec.", "Peso Seco + Rec.", "Peso Rec."]}
5	1	Gráficos de Granulometría	VisorGraficos	5	2025-09-22 16:33:56.588966	{"charts": [{"id": "granulometric_curve", "type": "line", "title": "Curva Granulométrica", "x_axis": {"field": "mm", "label": "Tamaño de Partícula (mm)", "source": "tamices", "reverse": true, "scale_type": "logarithmic"}, "y_axis": {"max": 100, "min": 0, "field": "pasa", "label": "% Pasa", "source": "granulometria", "scale_type": "linear"}, "datasets": [{"label": "% Pasa", "key_field": "key_name", "data_field": "pasa", "borderColor": "#4bc0c0", "backgroundColor": "rgba(75, 192, 192, 0.2)"}], "data_source": "granulometria"}]}
6	1	Gráficos de Granulometría	VisorGraficos	5	2025-09-22 16:34:00.214808	{"charts": [{"id": "granulometric_curve", "type": "line", "title": "Curva Granulométrica", "x_axis": {"field": "mm", "label": "Tamaño de Partícula (mm)", "source": "tamices", "reverse": true, "scale_type": "logarithmic"}, "y_axis": {"max": 100, "min": 0, "field": "pasa", "label": "% Pasa", "source": "granulometria", "scale_type": "linear"}, "datasets": [{"label": "% Pasa", "key_field": "key_name", "data_field": "pasa", "borderColor": "#4bc0c0", "backgroundColor": "rgba(75, 192, 192, 0.2)"}], "data_source": "granulometria"}]}
7	2	Gráficos de Límites de Consistencia	VisorGraficos	3	2025-09-22 17:18:35.945563	{"charts": [{"id": "limite_liquido_curve", "type": "line", "title": "Curva de Fluidez (Límite Líquido)", "x_axis": {"field": "golpes", "label": "Número de Golpes", "source": "limites", "scale_type": "linear"}, "y_axis": {"field": "humedad", "label": "Contenido de Humedad (%)", "source": "limites", "scale_type": "linear"}, "datasets": [{"label": "Ensayo LL", "tension": 0.4, "borderColor": "#ff6384", "pointRadius": 5, "x_field_suffix": "_golpes", "y_field_suffix": "_contenido_humedad", "backgroundColor": "rgba(255, 99, 132, 0.2)", "data_key_prefix": "ll_ensayo"}], "data_source": "limites"}, {"id": "limite_plastico_summary", "type": "bar", "title": "Resumen de Límites Plásticos", "x_axis": {"labels": ["Límite Plástico (LP)", "Índice de Plasticidad (IP)"], "source": "static", "scale_type": "category"}, "y_axis": {"min": 0, "label": "Valor", "source": "static", "scale_type": "linear"}, "datasets": [{"label": "Valores", "data_fields": ["lp_resultado", "ip_resultado"], "backgroundColor": ["rgba(75, 192, 192, 0.6)", "rgba(153, 102, 255, 0.6)"]}], "data_source": "limites"}]}
8	2	Gráficos de Límites de Consistencia	VisorGraficos	3	2025-09-22 17:27:32.667397	{"charts": [{"id": "limite_liquido_curve", "type": "line", "title": "Curva de Fluidez (Límite Líquido)", "x_axis": {"field": "golpes", "label": "Número de Golpes", "source": "limites", "scale_type": "linear"}, "y_axis": {"field": "humedad", "label": "Contenido de Humedad (%)", "source": "limites", "scale_type": "linear"}, "datasets": [{"label": "Ensayo LL", "tension": 0.4, "borderColor": "#ff6384", "pointRadius": 5, "x_field_suffix": "_golpes", "y_field_suffix": "_contenido_humedad", "backgroundColor": "rgba(255, 99, 132, 0.2)", "data_key_prefix": "ll_ensayo"}], "data_source": "limites"}, {"id": "limite_plastico_summary", "type": "bar", "title": "Resumen de Límites Plásticos", "x_axis": {"labels": ["Límite Plástico (LP)", "Índice de Plasticidad (IP)"], "source": "static", "scale_type": "category"}, "y_axis": {"min": 0, "label": "Valor", "source": "static", "scale_type": "linear"}, "datasets": [{"label": "Valores", "data_fields": ["lp_resultado", "ip_resultado"], "backgroundColor": ["rgba(75, 192, 192, 0.6)", "rgba(153, 102, 255, 0.6)"]}], "data_source": "limites"}]}
\.


--
-- Data for Name: formulario_tamices; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.formulario_tamices (id, seccion_id, name, mm, key_name, orden, created_at) FROM stdin;
\.


--
-- Data for Name: granulometria_ensayos; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.granulometria_ensayos (id, ensayo_id, proyecto, tramo, progresiva, estrato_id, peso_total, peso_antes_lavado, peso_despues_lavado, retenido_3in, retenido_2in, retenido_1_5in, retenido_1in, retenido_3_4in, retenido_3_8in, retenido_n4, retenido_n10, retenido_n20, retenido_n40, retenido_n60, retenido_n140, retenido_n200, porc_grava, porc_arena, porc_finos, cu, cc, d10, d30, d60, clasificacion_sucs, clasificacion_aashto, indice_grupo, retenido_menor_200, total_retenido) FROM stdin;
\.


--
-- Data for Name: limite_liquido_ensayos; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.limite_liquido_ensayos (id, ensayo_id, proyecto, tramo, progresiva, estrato_id, ll_resultado, ll_ensayo1_golpes, ll_ensayo1_cod_recipiente, ll_ensayo1_peso_recipiente, ll_ensayo1_peso_humedo, ll_ensayo1_peso_seco, ll_ensayo2_golpes, ll_ensayo2_cod_recipiente, ll_ensayo2_peso_recipiente, ll_ensayo2_peso_humedo, ll_ensayo2_peso_seco, ll_ensayo3_golpes, ll_ensayo3_cod_recipiente, ll_ensayo3_peso_recipiente, ll_ensayo3_peso_humedo, ll_ensayo3_peso_seco, ll_ensayo1_contenido_humedad, ll_ensayo2_contenido_humedad, ll_ensayo3_contenido_humedad) FROM stdin;
\.


--
-- Data for Name: limite_plastico_ensayos; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.limite_plastico_ensayos (id, ensayo_id, proyecto, tramo, progresiva, estrato_id, lp_resultado, ip_resultado, lp_ensayo1_cod_recipiente, lp_ensayo1_peso_recipiente, lp_ensayo1_peso_humedo, lp_ensayo1_peso_seco, lp_ensayo2_cod_recipiente, lp_ensayo2_peso_recipiente, lp_ensayo2_peso_humedo, lp_ensayo2_peso_seco, lp_ensayo1_contenido_humedad, lp_ensayo2_contenido_humedad) FROM stdin;
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
16	Permisos	/coordinador/config/PermisosManagement	Gestión de Permisos	fas fa-key
17	Visibilidad Navbar	/coordinador/config/NavbarVisibility	Gestión de Visibilidad de Navbar	fas fa-eye
18	Integraciones	/configuracion/integraciones	Configuración de Integraciones	fas fa-plug
19	Preferencias	/configuracion/preferencias	Configuración de Preferencias	fas fa-tools
20	Mi Perfil	/perfil	Ver y editar mi perfil	fas fa-user
21	Cerrar sesión	cerrar_sesion	Cerrar la sesión actual	fas fa-sign-out-alt
22	Gestión de Novedades	/coordinador/config/ChangelogManagement	Gestión de las novedades de la aplicación	fas fa-clipboard-list
23	Auditoría	/coordinador/config/auditoria	Ver registros de auditoría	fas fa-shield-alt
15	Usuarios	/coordinador/config/frmusuarios2	Gestión de Usuarios	fas fa-users
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
1	2	\N	0.000	0.200	1	\N	Afirmado
2	2	\N	0.200	1.000	2	\N	Materia Suelto grava / CBR
3	2	\N	1.000	1.500	3	\N	Boloneria (Piedra) - Afloramiento con Suelo / CBR
4	3	\N	0.000	0.150	1	\N	Afirmado
5	3	\N	0.150	1.050	2	\N	Suelo Arcilla + Grava (GC)
6	3	\N	1.050	1.500	3	\N	Afloramiento de Piedras Fracturadas
7	4	\N	0.000	0.150	1	\N	Afirmado
8	4	\N	0.150	1.150	2	\N	GC
9	4	\N	1.150	1.500	3	\N	Afloramiento de Piedras Fracturadas
10	5	\N	0.000	0.300	1	\N	Afirmado
11	5	\N	0.300	0.700	2	\N	Presencia de humedad
12	5	\N	0.700	1.500	3	\N	Permeable
13	6	\N	0.000	0.200	1	\N	Afirmado
14	6	\N	0.200	1.200	2	\N	Granular GC
15	6	\N	1.200	1.500	3	\N	Sulelo más fino, pardo claro
16	7	\N	0.000	0.150	1	\N	Afirmado
17	7	\N	0.150	0.700	2	\N	
18	7	\N	0.700	1.500	3	\N	Boloneria
19	8	\N	0.000	0.200	1	\N	Afirmado
20	8	\N	0.200	1.500	2	\N	Afloramiento rocoso (Roca fracturada)
21	9	\N	0.000	0.200	1	\N	Afirmado
22	9	\N	0.200	1.500	2	\N	
23	10	\N	0.000	0.200	1	\N	Afirmado
24	10	\N	0.200	0.800	2	\N	\N
25	10	\N	0.800	1.700	3	\N	CBR + CLAS
26	11	\N	0.000	0.200	1	\N	Afirmado
27	11	\N	0.200	1.500	2	\N	
28	12	\N	0.000	0.200	1	\N	Afirmado
29	12	\N	0.200	1.500	2	\N	\N
30	13	\N	0.000	0.200	1	\N	Afirmado
31	13	\N	0.200	1.000	2	\N	Roca
32	13	\N	1.000	1.500	3	\N	Suelo con bolones  y más abajo suelo GC arcilla gravosa Pardo suave
33	14	\N	0.000	0.150	1	\N	Afirmado
34	14	\N	0.150	1.500	2	\N	
35	15	\N	0.000	0.150	1	\N	Afirmado
36	15	\N	0.150	0.850	2	\N	Material suelto
37	15	\N	0.850	1.500	3	\N	Roca fracturada
38	16	\N	0.000	0.150	1	\N	Afirmado
39	16	\N	0.150	0.600	2	\N	Suelo granular / CBR
40	16	\N	0.600	1.500	3	\N	CBR + CLAS
41	17	\N	0.000	0.150	1	\N	Afirmado
42	17	\N	0.150	0.650	2	\N	Material organico o Relleno
43	17	\N	0.650	1.500	3	\N	Presencia de boloneria, a partir del 1.2 el material esta saturado
44	18	\N	0.000	0.150	1	\N	Afirmado
45	18	\N	0.150	1.000	2	\N	Suelo amarillo
46	18	\N	1.000	1.500	3	\N	Grava Arcillosa
47	19	\N	0.000	0.200	1	\N	Afirmado
48	19	\N	0.200	1.800	2	\N	Material suelto con presencia de bolones GC (Saturado)
49	20	\N	0.000	0.150	1	\N	Afirmado
50	20	\N	0.150	1.500	2	\N	Macizo rocoso + CBR
51	21	\N	0.000	0.200	1	\N	Afirmado
52	21	\N	0.200	1.000	2	\N	Afloramiento rocoso
53	22	\N	0.000	0.200	1	\N	Afirmado
54	22	\N	0.200	1.120	2	\N	Afloramiento rocoso
55	23	\N	0.000	0.200	1	\N	Afirmado
56	23	\N	0.200	1.500	2	\N	
57	24	\N	0.000	0.150	1	\N	Afirmado
58	24	\N	0.150	0.700	2	\N	
59	24	\N	0.700	1.500	3	\N	
60	25	\N	0.000	0.200	1	\N	Afirmado
61	25	\N	0.200	1.200	2	\N	Boloneria
62	25	\N	1.200	1.700	3	\N	Pardo Material suelto
63	26	\N	0.000	0.200	1	\N	Afirmado
64	26	\N	0.200	1.600	2	\N	
65	27	\N	0.000	0.200	1	\N	Afirmado
66	27	\N	0.200	1.700	2	\N	
67	28	\N	0.000	0.200	1	\N	Afirmado
68	28	\N	0.200	1.600	2	\N	Mat Suelot + Boloneria
69	29	\N	0.000	0.200	1	\N	Afirmado
70	29	\N	0.200	1.500	2	\N	
71	30	\N	0.000	0.200	1	\N	Afirmado
72	30	\N	0.200	1.500	2	\N	Oscuro Presencia de roca Fracturada, material suelto
73	31	\N	0.000	0.200	1	\N	Afirmado
74	31	\N	0.200	1.500	2	\N	Material rojizo con boloneria
75	32	\N	0.000	0.200	1	\N	Afirmado
76	32	\N	0.200	0.600	2	\N	Material gravoso
77	32	\N	0.600	1.500	3	\N	Roca Fracturada
78	33	\N	0.000	0.200	1	\N	Afirmado
79	33	\N	0.200	0.600	2	\N	Material granular
80	33	\N	0.600	1.500	3	\N	Roca Fracturada
81	34	\N	0.000	0.200	1	\N	Afirmado
82	34	\N	0.200	1.500	2	\N	Material Suelo gravoso, pardo
83	35	\N	0.000	0.200	1	\N	Afirmado
84	35	\N	0.200	0.400	2	\N	Mat. Relleno
85	35	\N	0.400	1.000	3	\N	Roca Fracturada / Presencia de humedad
86	36	\N	0.000	0.200	1	\N	Afirmado
87	36	\N	0.200	1.500	2	\N	Mat. Granular con roca fracturada
88	37	\N	0.000	0.200	1	\N	Afirmado
89	37	\N	0.200	1.500	2	\N	Mat. Rocoso / Roca fracturada
90	38	\N	0.000	0.200	1	\N	Afirmado
91	38	\N	0.200	0.400	2	\N	Mat. Relleno
92	38	\N	0.400	1.500	3	\N	Afloramiento de Piedras Fracturadas
93	39	\N	0.000	0.200	1	\N	Afirmado
94	39	\N	0.200	1.300	2	\N	Mat. Granular, Roca fracturada
95	40	\N	0.000	0.200	1	\N	Afirmado
96	40	\N	0.200	1.500	2	\N	Mat. Amarillo gravoso
97	41	\N	0.000	0.200	1	\N	Afirmado
98	41	\N	0.200	1.500	2	\N	Mat. Granular amarillo
99	42	\N	0.000	0.200	1	\N	Afirmado
100	42	\N	0.200	0.600	2	\N	Relleno
101	42	\N	0.600	1.500	3	\N	Material gravoso / Roca fracturada
102	43	\N	0.000	0.200	1	\N	Afirmado
103	43	\N	0.200	1.600	2	\N	Amarillo uniforme
104	44	\N	0.000	0.200	1	\N	Afirmado
105	44	\N	0.200	1.550	2	\N	Estrato de roca fracturada
106	45	\N	0.000	0.200	1	\N	Afirmado
107	45	\N	0.200	0.500	2	\N	Mat. Relleno
108	45	\N	0.500	1.300	3	\N	Afloramiento de Piedras Fracturadas
109	46	\N	0.000	0.200	1	\N	Afirmado
110	46	\N	0.200	0.500	2	\N	Relleno
111	46	\N	0.500	1.300	3	\N	Mat. Con boloneria
112	47	\N	0.000	0.200	1	\N	Afirmado
113	47	\N	0.200	0.500	2	\N	Material granular
114	47	\N	0.500	1.500	3	\N	
115	48	\N	0.000	0.200	1	\N	Afirmado
116	48	\N	0.200	0.300	2	\N	Roca
117	49	\N	0.000	0.200	1	\N	Afirmado
118	49	\N	0.200	0.300	2	\N	Material granular rojizo amarillento
119	50	\N	0.000	0.200	1	\N	Afirmado
120	50	\N	0.200	0.400	2	\N	Relleno
121	51	\N	0.000	0.200	1	\N	Afirmado
122	51	\N	0.200	0.600	2	\N	Relleno
123	51	\N	0.600	1.500	3	\N	Mat. Granular roca fracturada
124	52	\N	0.000	0.200	1	\N	Afirmado
125	52	\N	0.200	0.400	2	\N	Relleno
126	52	\N	0.400	1.500	3	\N	Mat. Granular con boloneria
127	53	\N	0.000	0.200	1	\N	Afirmado
128	53	\N	0.200	0.400	2	\N	Relleno
129	53	\N	0.400	1.500	3	\N	Mat. Suelto con grava
130	54	\N	0.000	0.200	1	\N	Afirmado
131	54	\N	0.200	0.400	2	\N	Relleno
132	54	\N	0.400	1.500	3	\N	Mat. Suelto con roca fracturada
133	55	\N	0.000	0.150	1	\N	Afirmado
134	55	\N	0.150	0.800	2	\N	Roca fracturada
135	55	\N	0.800	1.500	3	\N	Roca macisa
136	56	\N	0.000	0.200	1	\N	Afirmado
137	56	\N	0.200	0.500	2	\N	Relleno
138	56	\N	0.500	1.500	3	\N	Roca fracturada
139	57	\N	0.000	0.200	1	\N	Afirmado
140	57	\N	0.200	0.600	2	\N	Relleno
141	57	\N	0.600	1.500	3	\N	Suelo arcilloso saturado con poca presencia de rocas
142	58	\N	0.000	0.200	1	\N	Afirmado
143	58	\N	0.200	1.500	2	\N	
144	59	\N	0.000	0.200	1	\N	Afirmado
145	59	\N	0.200	1.500	2	\N	Suelo amarillo con boloneria
146	60	\N	0.000	0.200	1	\N	Afirmado
147	60	\N	0.200	1.500	2	\N	Mat. Granular
148	61	\N	0.000	0.150	1	\N	Afirmado
149	61	\N	0.150	1.500	2	\N	Roca macisa
150	62	\N	0.000	0.100	1	\N	Afirmado
151	62	\N	0.100	1.500	2	\N	Roca macisa
152	63	\N	0.000	0.200	1	\N	Afirmado
153	63	\N	0.200	0.300	2	\N	Relleno
154	63	\N	0.300	1.500	3	\N	Boloneria
155	64	\N	0.000	0.180	1	\N	Afirmado
156	64	\N	0.180	1.500	2	\N	Mat. Amarillo
157	65	\N	0.000	0.200	1	\N	Afirmado
158	65	\N	0.200	1.500	2	\N	
159	66	\N	0.000	0.200	1	\N	Afirmado
160	66	\N	0.200	1.500	2	\N	Suelo arcilloso amarillo con presencia de boloneria
161	67	\N	0.000	0.200	1	\N	Afirmado
162	67	\N	0.200	1.500	2	\N	Con boloneria y roca de tamaño medio
163	68	\N	0.000	0.200	1	\N	Afirmado
164	68	\N	0.200	1.500	2	\N	Suelto
\.


--
-- Data for Name: progresivas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresivas (id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, creado_en, actualizado_en, creado_por, proyecto_id, estrato_id, tipo_via, tipo_ensayo, batch_uuid, parent_id, coordenada_este, coordenada_norte, linea, intervalo_manual, longitud_total, lado) FROM stdin;
1	104	Quellouno	Descripción del tramo 1 de Quellouno	0100	87000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	500	\N	\N	\N	-72.537347	-12.612858	18L	\N	87452	\N
2	1-0100	Km 00+100	C - 01	100	100	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	\N	\N	18L	\N	\N	I
3	1-0500	Km 00+500	C - 02	500	500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767526.000000	8604458.000000	18L	\N	\N	D
4	1-1000	Km 01+000	C - 03	1000	1000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767236.000000	8604428.000000	18L	\N	\N	I
5	1-1500	Km 01+500	C - 04	1500	1500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767623.000000	8604635.000000	18L	\N	\N	I
6	1-2000	Km 02+000	C - 05	2000	2000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767718.000000	8604876.000000	18L	\N	\N	I
7	1-2500	Km 02+500	C - 06	2500	2500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767381.000000	8604707.000000	18L	\N	\N	D
8	1-3000	Km 03+000	C - 07	3000	3000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767646.000000	8604939.000000	18L	\N	\N	I
9	1-3500	Km 03+500	C - 08	3500	3500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767661.000000	8605279.000000	18L	\N	\N	I
10	1-4000	Km 04+000	C - 09	4000	4000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767855.000000	8605522.000000	18L	\N	\N	I
11	1-4500	Km 04+500	C - 10	4500	4500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767780.000000	8605664.000000	18L	\N	\N	I
12	1-5000	Km 05+000	C - 11	5000	5000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767967.000000	8606005.000000	18L	\N	\N	I
13	1-5500	Km 05+500	C - 12	5500	5500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768370.000000	8606117.000000	18L	\N	\N	I
14	1-6000	Km 06+000	C - 13	6000	6000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768547.000000	8606492.000000	18L	\N	\N	I
15	1-6500	Km 06+500	C - 14	6500	6500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768873.000000	8606685.000000	18L	\N	\N	I
16	1-7000	Km 07+000	C - 15	7000	7000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769284.000000	8606510.000000	18L	\N	\N	I
17	1-7500	Km 07+500	C - 16	7500	7500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769247.000000	8606587.000000	18L	\N	\N	I
18	1-8000	Km 08+000	C - 17	8000	8000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769385.000000	8606648.000000	18L	\N	\N	I
19	1-8500	Km 08+500	C - 18	8500	8500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769334.000000	8606744.000000	18L	\N	\N	D
20	1-9000	Km 09+000	C - 19	9000	9000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768934.000000	8606952.000000	18L	\N	\N	D
21	1-9500	Km 09+500	C - 20	9500	9500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768512.000000	8607022.000000	18L	\N	\N	D
22	1-10000	Km 10+000	C - 21	10000	10000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768185.000000	8606780.000000	18L	\N	\N	D
23	1-10500	Km 10+500	C - 22	10500	10500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767716.000000	8606704.000000	18L	\N	\N	D
24	1-11000	Km 11+000	C - 23	11000	11000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767295.000000	8606565.000000	18L	\N	\N	D
25	1-11500	Km 11+500	C - 24	11500	11500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767058.000000	8606175.000000	18L	\N	\N	D
26	1-12000	Km 12+000	C - 25	12000	12000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	766909.000000	8606029.000000	18L	\N	\N	I
27	1-12500	Km 12+500	C - 26	12500	12500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767168.000000	8606519.000000	18L	\N	\N	I
28	1-13000	Km 13+000	C - 27	13000	13000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767336.000000	8606949.000000	18L	\N	\N	D
29	1-13500	Km 13+500	C - 28	13500	13500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767395.000000	8607352.000000	18L	\N	\N	D
30	1-14000	Km 14+000	C - 29	14000	14000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767595.000000	8607769.000000	18L	\N	\N	D
31	1-14500	Km 14+500	C - 30	14500	14500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767324.000000	8608114.000000	18L	\N	\N	D
32	1-15000	Km 15+000	C - 31	15000	15000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767538.000000	8608519.000000	18L	\N	\N	D
33	1-15500	Km 15+500	C - 32	15500	15500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	767776.000000	8608840.000000	18L	\N	\N	D
34	1-16000	Km 16+000	C - 33	16000	16000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768251.000000	8608854.000000	18L	\N	\N	D
35	1-16500	Km 16+500	C - 34	16500	16500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768458.000000	8609069.000000	18L	\N	\N	D
36	1-17000	Km 17+000	C - 35	17000	17000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	768851.000000	8609200.000000	18L	\N	\N	D
37	1-17500	Km 17+500	C - 36	17500	17500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769274.000000	8609103.000000	18L	\N	\N	D
38	1-18000	Km 18+000	C - 37	18000	18000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769459.000000	8609503.000000	18L	\N	\N	D
39	1-18500	Km 18+500	C - 38	18500	18500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769766.000000	8609700.000000	18L	\N	\N	D
40	1-19000	Km 19+000	C - 39	19000	19000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770041.000000	8609853.000000	18L	\N	\N	D
41	1-19500	Km 19+500	C - 40	19500	19500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770314.000000	8609561.000000	18L	\N	\N	D
42	1-20000	Km 20+000	C - 41	20000	20000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770617.000000	8609319.000000	18L	\N	\N	D
43	1-20500	Km 20+500	C - 42	20500	20500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771021.000000	8609369.000000	18L	\N	\N	D
44	1-21000	Km 21+000	C - 43	21000	21000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771301.000000	8609054.000000	18L	\N	\N	D
45	1-21500	Km 21+500	C - 44	21500	21500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771695.000000	8608917.000000	18L	\N	\N	D
46	1-22000	Km 22+000	C - 45	22000	22000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	772071.000000	8609077.000000	18L	\N	\N	D
47	1-22500	Km 22+500	C - 46	22500	22500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	772508.000000	8609067.000000	18L	\N	\N	D
48	1-23000	Km 23+000	C - 47	23000	23000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	772523.000000	8609153.000000	18L	\N	\N	D
49	1-23500	Km 23+500	C - 48	23500	23500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	772512.000000	8609220.000000	18L	\N	\N	I
50	1-24000	Km 24+000	C - 49	24000	24000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	772598.000000	8609243.000000	18L	\N	\N	
51	1-24500	Km 24+500	C - 50	24500	24500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	772380.000000	8609534.000000	18L	\N	\N	D
52	1-25000	Km 25+000	C - 51	25000	25000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771969.000000	8609644.000000	18L	\N	\N	D
53	1-25500	Km 25+500	C - 52	25500	25500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771607.000000	8609657.000000	18L	\N	\N	D
54	1-26000	Km 26+000	C - 53	26000	26000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771259.000000	8609946.000000	18L	\N	\N	D
55	1-26500	Km 26+500	C - 54	26500	26500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770863.000000	8610206.000000	18L	\N	\N	D
56	1-27000	Km 27+000	C - 55	27000	27000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770997.000000	8610413.000000	18L	\N	\N	D
57	1-27500	Km 27+500	C - 56	27500	27500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	0.000000	1.000000	18L	\N	\N	D
58	1-28000	Km 28+000	C - 57	28000	28000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770840.000000	8610960.000000	18L	\N	\N	D
59	1-28500	Km 28+500	C - 58	28500	28500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770942.000000	8611352.000000	18L	\N	\N	D
60	1-29000	Km 29+000	C - 59	29000	29000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771252.000000	8611735.000000	18L	\N	\N	D
61	1-29500	Km 29+500	C - 60	29500	29500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771603.000000	8612110.000000	18L	\N	\N	D
62	1-30000	Km 30+000	C - 61	30000	30000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771475.000000	8612230.000000	18L	\N	\N	D
63	1-30500	Km 30+500	C - 62	30500	30500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	771080.000000	8612067.000000	18L	\N	\N	D
64	1-31000	Km 31+000	C - 63	31000	31000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770651.000000	8611850.000000	18L	\N	\N	D
65	1-31500	Km 31+500	C - 64	31500	31500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	770277.000000	8611567.000000	18L	\N	\N	D
66	1-32000	Km 32+000	C - 65	32000	32000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769910.000000	8611600.000000	18L	\N	\N	D
67	1-32500	Km 32+500	C - 66	32500	32500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769480.000000	8611826.000000	18L	\N	\N	D
68	1-33000	Km 33+000	C - 67	33000	33000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	769402.000000	8612261.000000	18L	\N	\N	D
69	1-33500	Km 33+500	C - 68	33500	33500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
70	1-34000	Km 34+000	C - 69	34000	34000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
71	1-34500	Km 34+500	C - 70	34500	34500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
72	1-35000	Km 35+000	C - 71	35000	35000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
73	1-35500	Km 35+500	C - 72	35500	35500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
74	1-36000	Km 36+000	C - 73	36000	36000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
75	1-36500	Km 36+500	C - 74	36500	36500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
76	1-37000	Km 37+000	C - 75	37000	37000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
77	1-37500	Km 37+500	C - 76	37500	37500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
78	1-38000	Km 38+000	C - 77	38000	38000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
79	1-38500	Km 38+500	C - 78	38500	38500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
80	1-39000	Km 39+000	C - 79	39000	39000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
81	1-39500	Km 39+500	C - 80	39500	39500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
82	1-40000	Km 40+000	C - 81	40000	40000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
83	1-40500	Km 40+500	C - 82	40500	40500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
84	1-41000	Km 41+000	C - 83	41000	41000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
85	1-41500	Km 41+500	C - 84	41500	41500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
86	1-42000	Km 42+000	C - 85	42000	42000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
87	1-42500	Km 42+500	C - 86	42500	42500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
88	1-43000	Km 43+000	C - 87	43000	43000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
89	1-43500	Km 43+500	C - 88	43500	43500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
90	1-44000	Km 44+000	C - 89	44000	44000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
91	1-44500	Km 44+500	C - 90	44500	44500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
92	1-45000	Km 45+000	C - 91	45000	45000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
93	1-45500	Km 45+500	C - 92	45500	45500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
94	1-46000	Km 46+000	C - 93	46000	46000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
95	1-46500	Km 46+500	C - 94	46500	46500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
96	1-47000	Km 47+000	C - 95	47000	47000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
97	1-47500	Km 47+500	C - 96	47500	47500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
98	1-48000	Km 48+000	C - 97	48000	48000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
99	1-48500	Km 48+500	C - 98	48500	48500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
100	1-49000	Km 49+000	C - 99	49000	49000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
101	1-49500	Km 49+500	C - 100	49500	49500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
102	1-50000	Km 50+000	C - 101	50000	50000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
103	1-50500	Km 50+500	C - 102	50500	50500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
104	1-51000	Km 51+000	C - 103	51000	51000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
105	1-51500	Km 51+500	C - 104	51500	51500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
106	1-52000	Km 52+000	C - 105	52000	52000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
107	1-52500	Km 52+500	C - 106	52500	52500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
108	1-53000	Km 53+000	C - 107	53000	53000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
109	1-53500	Km 53+500	C - 108	53500	53500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
110	1-54000	Km 54+000	C - 109	54000	54000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
111	1-54500	Km 54+500	C - 110	54500	54500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
112	1-55000	Km 55+000	C - 111	55000	55000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
113	1-55500	Km 55+500	C - 112	55500	55500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
114	1-56000	Km 56+000	C - 113	56000	56000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
115	1-56500	Km 56+500	C - 114	56500	56500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
116	1-57000	Km 57+000	C - 115	57000	57000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
117	1-57500	Km 57+500	C - 116	57500	57500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
118	1-58000	Km 58+000	C - 117	58000	58000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
119	1-58500	Km 58+500	C - 118	58500	58500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
120	1-59000	Km 59+000	C - 119	59000	59000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
121	1-59500	Km 59+500	C - 120	59500	59500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
122	1-60000	Km 60+000	C - 121	60000	60000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
123	1-60500	Km 60+500	C - 122	60500	60500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
124	1-61000	Km 61+000	C - 123	61000	61000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
125	1-61500	Km 61+500	C - 124	61500	61500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
126	1-62000	Km 62+000	C - 125	62000	62000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
127	1-62500	Km 62+500	C - 126	62500	62500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
128	1-63000	Km 63+000	C - 127	63000	63000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
129	1-63500	Km 63+500	C - 128	63500	63500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
130	1-64000	Km 64+000	C - 129	64000	64000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
131	1-64500	Km 64+500	C - 130	64500	64500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
132	1-65000	Km 65+000	C - 131	65000	65000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
133	1-65500	Km 65+500	C - 132	65500	65500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
134	1-66000	Km 66+000	C - 133	66000	66000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
135	1-66500	Km 66+500	C - 134	66500	66500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
136	1-67000	Km 67+000	C - 135	67000	67000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
137	1-67500	Km 67+500	C - 136	67500	67500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
138	1-68000	Km 68+000	C - 137	68000	68000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
139	1-68500	Km 68+500	C - 138	68500	68500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
140	1-69000	Km 69+000	C - 139	69000	69000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
141	1-69500	Km 69+500	C - 140	69500	69500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
142	1-70000	Km 70+000	C - 141	70000	70000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
143	1-70500	Km 70+500	C - 142	70500	70500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
144	1-71000	Km 71+000	C - 143	71000	71000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
145	1-71500	Km 71+500	C - 144	71500	71500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
146	1-72000	Km 72+000	C - 145	72000	72000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
147	1-72500	Km 72+500	C - 146	72500	72500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
148	1-73000	Km 73+000	C - 147	73000	73000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
149	1-73500	Km 73+500	C - 148	73500	73500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
150	1-74000	Km 74+000	C - 149	74000	74000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
151	1-74500	Km 74+500	C - 150	74500	74500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
152	1-75000	Km 75+000	C - 151	75000	75000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
153	1-75500	Km 75+500	C - 152	75500	75500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
154	1-76000	Km 76+000	C - 153	76000	76000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
155	1-76500	Km 76+500	C - 154	76500	76500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
156	1-77000	Km 77+000	C - 155	77000	77000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
157	1-77500	Km 77+500	C - 156	77500	77500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
158	1-78000	Km 78+000	C - 157	78000	78000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
159	1-78500	Km 78+500	C - 158	78500	78500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
160	1-79000	Km 79+000	C - 159	79000	79000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
161	1-79500	Km 79+500	C - 160	79500	79500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
162	1-80000	Km 80+000	C - 161	80000	80000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
163	1-80500	Km 80+500	C - 162	80500	80500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
164	1-81000	Km 81+000	C - 163	81000	81000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
165	1-81500	Km 81+500	C - 164	81500	81500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
166	1-82000	Km 82+000	C - 165	82000	82000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
167	1-82500	Km 82+500	C - 166	82500	82500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
168	1-83000	Km 83+000	C - 167	83000	83000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
169	1-83500	Km 83+500	C - 168	83500	83500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
170	1-84000	Km 84+000	C - 169	84000	84000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
171	1-84500	Km 84+500	C - 170	84500	84500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
172	1-85000	Km 85+000	C - 171	85000	85000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
173	1-85500	Km 85+500	C - 172	85500	85500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
174	1-86000	Km 86+000	C - 173	86000	86000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
175	1-86500	Km 86+500	C - 174	86500	86500	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
176	1-87000	Km 87+000	C - 175	87000	87000	activo	2025-09-22 15:59:59.473739+00	2025-09-22 15:59:59.473739+00	\N	24	\N	\N	\N	\N	1	1.000000	1.000000	18L	\N	\N	
\.


--
-- Data for Name: provincias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provincias (id, nombre, codigo_provincia, codigo_departamento) FROM stdin;
\.


--
-- Data for Name: proyecto_historial; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.proyecto_historial (id, proyecto_id, accion, actor_id, fecha, detalles) FROM stdin;
3	24	ASIGNACION_USUARIO	14	2025-09-19 20:44:51.943232	Usuario 31 asignado con rol "view".
4	24	ASIGNACION_USUARIO	14	2025-09-19 20:44:54.27735	Usuario 1 asignado con rol "view".
5	25	ASIGNACION_USUARIO	14	2025-09-19 20:45:30.851182	Usuario 8 asignado con rol "view".
7	25	DESASIGNACION_USUARIO	14	2025-09-22 14:46:49.44784	Usuario 8 desasignado.
8	24	DESASIGNACION_USUARIO	14	2025-09-22 14:47:05.805507	Usuario 31 desasignado.
9	24	DESASIGNACION_USUARIO	14	2025-09-22 14:47:07.807597	Usuario 1 desasignado.
10	25	ASIGNACION_USUARIO	14	2025-09-22 14:47:11.805811	Usuario 1 asignado con rol "view".
\.


--
-- Data for Name: proyecto_usuarios; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.proyecto_usuarios (id, proyecto_id, usuario_id, rol_proyecto, asignado_en) FROM stdin;
7	25	1	view	2025-09-22 14:47:11.686443
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proyectos (id, codigo, nombre_proyecto, descripcion_proyecto, estado, nombre_tramo, proyecto_nom, solicitante, departamento, provincia, distrito, localidad, longitud_total, progresiva_inicial, tipo_via, intervalo_manual, descripcion_larga, create_at, update_at, is_interval_manual) FROM stdin;
24	\N	\N	\N	Activo	Proyecto Quellouno	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0809	080906	Quellouno	86510	0+000	500	\N		2025-09-16 20:20:52.869239	2025-09-16 20:20:52.869239	f
25	\N	\N	\N	Activo	CU 105	RANRACASA	GARY	08	0807	080705	RANRACSA	92000	0+000	500	\N		2025-09-18 15:13:12.589843	2025-09-18 15:13:12.589843	f
\.


--
-- Data for Name: puntos_mapa; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.puntos_mapa (id, nombre, descripcion, latitud, longitud, creado_en) FROM stdin;
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
321	2	20	t
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
414	7	1	t
415	7	2	t
416	7	3	t
417	7	4	t
418	7	5	t
419	7	6	t
420	7	7	t
421	7	8	t
422	7	9	t
423	7	10	t
424	7	11	t
425	7	12	t
426	7	13	t
427	7	14	t
428	7	15	t
429	7	16	t
430	7	17	t
431	7	18	t
432	7	19	t
433	7	20	t
434	7	21	t
435	7	22	t
436	7	23	t
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
-- Data for Name: ruta_kml; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.ruta_kml (id, km, lat, lng, geom, tramo_id) FROM stdin;
1	0+000	-12.516576	-72.50677	0101000020E6100000032670EB6E2052C008CC43A67C0829C0	1
2	1+000	-12.516732	-72.506464	0101000020E61000007C26FBE7692052C0E597C118910829C0	1
3	2+000	-12.516851	-72.506274	0101000020E61000002B3410CB662052C04FCFBBB1A00829C0	1
4	3+000	-12.51706	-72.506134	0101000020E61000003259DC7F642052C0B8239C16BC0829C0	1
5	4+000	-12.517198	-72.505987	0101000020E6100000E04C4C17622052C0FC1C1F2DCE0829C0	1
6	5+000	-12.517299	-72.505693	0101000020E61000003B342C465D2052C0CB811E6ADB0829C0	1
7	6+000	-12.517287	-72.505455	0101000020E610000061A6ED5F592052C0BA4A77D7D90829C0	1
8	7+000	-12.517257	-72.505296	0101000020E61000002DB308C5562052C01041D5E8D50829C0	1
9	8+000	-12.517311	-72.5051	0101000020E61000006A4DF38E532052C0DCB8C5FCDC0829C0	1
10	9+000	-12.517496	-72.504892	0101000020E6100000C5008926502052C0239F573CF50829C0	1
11	10+000	-12.51764	-72.504929	0101000020E61000005473B9C1502052C0F0332E1C080929C0	1
12	11+000	-12.51789	-72.505137	0101000020E6100000F9BF232A542052C0D3D9C9E0280929C0	1
13	12+000	-12.518231	-72.50543	0101000020E6100000B51A12F7582052C0F88BD992550929C0	1
14	13+000	-12.518876	-72.505871	0101000020E6100000AB3FC230602052C0CD5B751DAA0929C0	1
15	14+000	-12.519067	-72.506054	0101000020E6100000A4005130632052C09CDD5A26C30929C0	1
16	15+000	-12.519162	-72.50625	0101000020E610000066666666662052C0E3A6069ACF0929C0	1
17	16+000	-12.519258	-72.506324	0101000020E6100000844BC79C672052C06C5F402FDC0929C0	1
18	17+000	-12.519473	-72.506428	0101000020E6100000D671FC50692052C05D4F745DF80929C0	1
19	18+000	-12.519563	-72.50655	0101000020E61000007CF2B0506B2052C05D6C5A29040A29C0	1
20	19+000	-12.519568	-72.506684	0101000020E6100000045ABA826D2052C0A41820D1040A29C0	1
21	20+000	-12.51936	-72.506868	0101000020E6100000E4D87A86702052C07DB3CD8DE90929C0	1
22	21+000	-12.519144	-72.507088	0101000020E61000006B0C3A21742052C04AD40B3ECD0929C0	1
23	22+000	-12.519091	-72.507302	0101000020E610000081CCCEA2772052C0BE4BA94BC60929C0	1
24	23+000	-12.519133	-72.50762	0101000020E6100000EAB298D87C2052C07A8CF2CCCB0929C0	1
25	24+000	-12.51915	-72.507926	0101000020E610000070B20DDC812052C0D26F5F07CE0929C0	1
26	25+000	-12.519318	-72.508153	0101000020E610000050172994852052C0C172840CE40929C0	1
27	26+000	-12.519473	-72.508287	0101000020E6100000D87E32C6872052C05D4F745DF80929C0	1
28	27+000	-12.519473	-72.508416	0101000020E6100000D73043E3892052C05D4F745DF80929C0	1
29	28+000	-12.519354	-72.508544	0101000020E6100000EE2422FC8B2052C0F4177AC4E80929C0	1
30	29+000	-12.519216	-72.508881	0101000020E610000092239D81912052C0B01EF7ADD60929C0	1
31	30+000	-12.518971	-72.509413	0101000020E610000010CAFB389A2052C014252191B60929C0	1
32	31+000	-12.518858	-72.50997	0101000020E61000003BFC3559A32052C033897AC1A70929C0	1
33	32+000	-12.518834	-72.51022	0101000020E6100000F870C971A72052C0111B2C9CA40929C0	1
34	33+000	-12.518912	-72.51038	0101000020E61000001422E010AA2052C000016BD5AE0929C0	1
35	34+000	-12.519019	-72.5106	0101000020E61000009B559FABAD2052C05801BEDBBC0929C0	1
36	35+000	-12.519067	-72.510796	0101000020E61000005EBBB4E1B02052C09CDD5A26C30929C0	1
37	36+000	-12.518912	-72.510936	0101000020E61000005796E82CB32052C000016BD5AE0929C0	1
38	37+000	-12.518577	-72.51112	0101000020E61000003815A930B62052C064EAAEEC820929C0	1
39	38+000	-12.518464	-72.511266	0101000020E6100000A2630795B82052C0834E081D740929C0	1
40	39+000	-12.518494	-72.51142	0101000020E61000004DA1F31ABB2052C02E58AA0B780929C0	1
41	40+000	-12.518553	-72.511542	0101000020E6100000F321A81ABD2052C0427C60C77F0929C0	1
42	41+000	-12.5185	-72.511682	0101000020E6100000EBFCDB65BF2052C0B6F3FDD4780929C0	1
43	42+000	-12.518356	-72.511903	0101000020E61000005BEECC04C32052C0EA5E27F5650929C0	1
44	43+000	-12.518428	-72.512019	0101000020E61000008FFB56EBC42052C050A912656F0929C0	1
45	44+000	-12.518613	-72.512148	0101000020E61000008EAD6708C72052C0978FA4A4870929C0	1
46	45+000	-12.518649	-72.5123	0101000020E6100000696FF085C92052C0CA349A5C8C0929C0	1
47	46+000	-12.518541	-72.512453	0101000020E61000002CEFAA07CC2052C03145B9347E0929C0	1
48	47+000	-12.518338	-72.512686	0101000020E61000007EC7F0D8CF2052C0508C2C99630929C0	1
49	48+000	-12.518308	-72.512937	0101000020E610000022FAB5F5D32052C0A5828AAA5F0929C0	1
50	49+000	-12.518434	-72.513163	0101000020E61000001BA19FA9D72052C0D844662E700929C0	1
51	50+000	-12.518523	-72.513463	0101000020E6100000302DEA93DC2052C09772BED87B0929C0	1
52	51+000	-12.518703	-72.513548	0101000020E6100000473B6EF8DD2052C097AC8A70930929C0	1
53	52+000	-12.518995	-72.513591	0101000020E61000004721C9ACDE2052C036936FB6B90929C0	1
54	53+000	-12.519073	-72.513671	0101000020E6100000D57954FCDF2052C02579AEEFC30929C0	1
55	54+000	-12.519079	-72.513762	0101000020E61000005DFB027AE12052C0AD1402B9C40929C0	1
56	55+000	-12.519013	-72.51386	0101000020E61000003EAE0D15E32052C0CF656A12BC0929C0	1
57	56+000	-12.518882	-72.513995	0101000020E6100000AED3484BE52052C055F7C8E6AA0929C0	1
58	57+000	-12.518768	-72.514203	0101000020E61000005320B3B3E82052C0336C94F59B0929C0	1
59	58+000	-12.51878	-72.514386	0101000020E61000004CE141B3EB2052C044A33B889D0929C0	1
60	59+000	-12.518828	-72.514564	0101000020E6100000BBECD79DEE2052C0887FD8D2A30929C0	1
61	60+000	-12.518828	-72.51479	0101000020E6100000B493C151F22052C0887FD8D2A30929C0	1
62	61+000	-12.518828	-72.515035	0101000020E6100000E7525C55F62052C0887FD8D2A30929C0	1
63	62+000	-12.518882	-72.515188	0101000020E6100000AAD216D7F82052C055F7C8E6AA0929C0	1
64	63+000	-12.518882	-72.515372	0101000020E61000008B51D7DAFB2052C055F7C8E6AA0929C0	1
65	64+000	-12.518936	-72.515684	0101000020E610000082C476F7002152C0226FB9FAB10929C0	1
66	65+000	-12.519019	-72.515794	0101000020E6100000465ED6C4022152C05801BEDBBC0929C0	1
67	66+000	-12.519198	-72.515818	0101000020E61000000A2C8029032152C0164CFC51D40929C0	1
68	67+000	-12.519413	-72.515757	0101000020E6100000B7EBA529022152C0083C3080F00929C0	1
69	68+000	-12.519652	-72.515781	0101000020E61000007CB94F8E022152C01C9AB2D30F0A29C0	1
70	69+000	-12.519766	-72.515879	0101000020E61000005D6C5A29042152C03E25E7C41E0A29C0	1
71	70+000	-12.519766	-72.516063	0101000020E61000003EEB1A2D072152C03E25E7C41E0A29C0	1
72	71+000	-12.519837	-72.516246	0101000020E610000036ACA92C0A2152C063804413280A29C0	1
73	72+000	-12.52007	-72.516381	0101000020E6100000A6D1E4620C2152C0EE42739D460A29C0	1
74	73+000	-12.520554	-72.516674	0101000020E6100000622CD32F112152C09E9ACB0D860A29C0	1
75	74+000	-12.520751	-72.51673	0101000020E61000002CB7B41A122152C0F6B704E09F0A29C0	1
76	75+000	-12.52102	-72.516724	0101000020E6100000BB438A01122152C0B41F2922C30A29C0	1
77	76+000	-12.521103	-72.516766	0101000020E6100000D36BB3B1122152C0EAB12D03CE0A29C0	1
78	77+000	-12.521103	-72.516932	0101000020E61000006090F469152152C0EAB12D03CE0A29C0	1
79	78+000	-12.521115	-72.51717	0101000020E61000003A1E3350192152C0FBE8D495CF0A29C0	1
80	79+000	-12.52108	-72.517445	0101000020E6100000A31EA2D11D2152C009336DFFCA0A29C0	1
81	80+000	-12.521032	-72.517721	0101000020E6100000F4DC4257222152C0C556D0B4C40A29C0	1
82	81+000	-12.521145	-72.517825	0101000020E61000004703780B242152C0A6F27684D30A29C0	1
83	82+000	-12.52145	-72.517922	0101000020E610000040F850A2252152C097FF907EFB0A29C0	1
84	83+000	-12.521659	-72.51791	0101000020E61000005E11FC6F252152C0005471E3160B29C0	1
85	84+000	-12.521832	-72.517757	0101000020E61000009B9141EE222152C036035C902D0B29C0	1
86	85+000	-12.522059	-72.517623	0101000020E6100000132A38BC202152C0392A37514B0B29C0	1
87	86+000	-12.522184	-72.517684	0101000020E6100000666A12BC212152C02AFD84B35B0B29C0	1
88	87+000	-12.522245	-72.517731	0101000020E610000006483481222152C0C1FF56B2630B29C0	1
89	88+000	-12.522287	-72.51799	0101000020E6100000EC6987BF262152C07D40A033690B29C0	1
90	89+000	-12.522346	-72.518293	0101000020E6100000BA2F67B62B2152C0916456EF700B29C0	1
91	90+000	-12.522498	-72.51857	0101000020E6100000F3AB3940302152C069739CDB840B29C0	1
92	91+000	-12.522735	-72.518726	0101000020E61000006F6589CE322152C0FAF202ECA30B29C0	1
93	92+000	-12.522971	-72.518786	0101000020E6100000DAE731CA332152C04983DBDAC20B29C0	1
94	93+000	-12.523132	-72.518778	0101000020E610000098F8A3A8332152C06EFB1EF5D70B29C0	1
95	94+000	-12.523258	-72.51889	0101000020E61000002C0E677E352152C0A1BDFA78E80B29C0	1
96	95+000	-12.523419	-72.518942	0101000020E610000055A18158362152C0C6353E93FD0B29C0	1
97	96+000	-12.523638	-72.518881	0101000020E61000000261A758352152C0BDE2A9471A0C29C0	1
98	97+000	-12.523841	-72.518821	0101000020E610000098DEFE5C342152C09D9B36E3340C29C0	1
99	98+000	-12.523968	-72.518881	0101000020E61000000261A758352152C0124DA088450C29C0	1
100	99+000	-12.524238	-72.51889	0101000020E61000002C0E677E352152C012A452EC680C29C0	1
101	100+000	-12.524542	-72.518907	0101000020E610000097AAB4C5352152C0C2C1DEC4900C29C0	1
102	101+000	-12.524812	-72.518847	0101000020E61000002C280CCA342152C0C2189128B40C29C0	1
103	102+000	-12.524973	-72.518769	0101000020E61000006F4BE482332152C0E690D442C90C29C0	1
104	103+000	-12.52515	-72.518769	0101000020E61000006F4BE482332152C022FDF675E00C29C0	1
105	104+000	-12.52537	-72.518812	0101000020E61000006E313F37342152C05B99F04BFD0C29C0	1
106	105+000	-12.525547	-72.518674	0101000020E610000046D26EF4312152C09605137F140D29C0	1
107	106+000	-12.525767	-72.518492	0101000020E610000035CF11F92E2152C0CFA10C55310D29C0	1
108	107+000	-12.526037	-72.518466	0101000020E6100000A185048C2E2152C0CFF8BEB8540D29C0	1
109	108+000	-12.526198	-72.518544	0101000020E61000005F622CD32F2152C0F47002D3690D29C0	1
110	109+000	-12.526316	-72.518691	0101000020E6100000B16EBC3B322152C01BB96E4A790D29C0	1
111	110+000	-12.526468	-72.518804	0101000020E61000002D42B115342152C0F3C7B4368D0D29C0	1
112	111+000	-12.526578	-72.518959	0101000020E6100000C03DCF9F362152C01096B1A19B0D29C0	1
113	112+000	-12.526611	-72.519176	0101000020E61000008F37F92D3A2152C07F6DFDF49F0D29C0	1
114	113+000	-12.526721	-72.519426	0101000020E61000004BAC8C463E2152C09B3BFA5FAE0D29C0	1
115	114+000	-12.526789	-72.519686	0101000020E6100000198C1189422152C0FCC8AD49B70D29C0	1
116	115+000	-12.526831	-72.519902	0101000020E610000000C80913462152C0B709F7CABC0D29C0	1
117	116+000	-12.526932	-72.520006	0101000020E610000052EE3EC7472152C0876EF607CA0D29C0	1
118	117+000	-12.527042	-72.520127	0101000020E610000010B1C1C2492152C0A33CF372D80D29C0	1
119	118+000	-12.52705	-72.520266	0101000020E610000021CEC3094C2152C0AEB6627FD90D29C0	1
120	119+000	-12.526958	-72.520413	0101000020E610000073DA53724E2152C02CBB6070CD0D29C0	1
121	120+000	-12.526941	-72.520646	0101000020E6100000C4B29943522152C0D4D7F335CB0D29C0	1
122	121+000	-12.526924	-72.521183	0101000020E6100000CB0EF10F5B2152C07BF486FBC80D29C0	1
123	122+000	-12.526991	-72.521425	0101000020E61000004694F6065F2152C09B92ACC3D10D29C0	1
124	123+000	-12.527188	-72.521605	0101000020E6100000861BF0F9612152C0F3AFE595EB0D29C0	1
125	124+000	-12.527425	-72.521657	0101000020E6100000B0AE0AD4622152C0832F4CA60A0E29C0	1
126	125+000	-12.527501	-72.521786	0101000020E6100000AF601BF1642152C0F0366F9C140E29C0	1
127	126+000	-12.527459	-72.521882	0101000020E6100000C097C283662152C034F6251B0F0E29C0	1
128	127+000	-12.527374	-72.522012	0101000020E6100000A70705A5682152C07B8505F7030E29C0	1
129	128+000	-12.527357	-72.522245	0101000020E6100000F8DF4A766C2152C023A298BC010E29C0	1
130	129+000	-12.527349	-72.522479	0101000020E61000003276C24B702152C0172829B0000E29C0	1
131	130+000	-12.527518	-72.522652	0101000020E610000018CC5F21732152C0481ADCD6160E29C0	1
132	131+000	-12.527687	-72.522712	0101000020E6100000834E081D742152C0780C8FFD2C0E29C0	1
133	132+000	-12.527856	-72.522704	0101000020E6100000425F7AFB732152C0A8FE4124430E29C0	1
134	133+000	-12.52794	-72.522773	0101000020E6100000D68EE21C752152C01F80D4264E0E29C0	1
135	134+000	-12.527999	-72.522937	0101000020E61000009337C0CC772152C033A48AE2550E29C0	1
136	135+000	-12.528067	-72.523214	0101000020E6100000CCB392567C2152C094313ECC5E0E29C0	1
137	136+000	-12.528219	-72.523344	0101000020E6100000B323D5777E2152C06C4084B8720E29C0	1
138	137+000	-12.528489	-72.523474	0101000020E61000009A931799802152C06C97361C960E29C0	1
139	138+000	-12.528717	-72.523508	0101000020E610000071CCB227812152C0B0AD9FFEB30E29C0	1
140	139+000	-12.528937	-72.523396	0101000020E6100000DDB6EF517F2152C0E94999D4D00E29C0	1
141	140+000	-12.529063	-72.523162	0101000020E6100000A320787C7B2152C01C0C7558E10E29C0	1
142	141+000	-12.529215	-72.522928	0101000020E6100000698A00A7772152C0F41ABB44F50E29C0	1
143	142+000	-12.529486	-72.522565	0101000020E6100000314278B4712152C03561FBC9180F29C0	1
144	143+000	-12.529739	-72.522297	0101000020E6100000217365506D2152C0DCD440F3390F29C0	1
145	144+000	-12.530035	-72.522167	0101000020E61000003A03232F6B2152C081785DBF600F29C0	1
146	145+000	-12.530406	-72.521977	0101000020E6100000E9103812682152C050340F60910F29C0	1
147	146+000	-12.530693	-72.521847	0101000020E610000001A1F5F0652152C0A86E2EFEB60F29C0	1
148	147+000	-12.530955	-72.5217	0101000020E6100000AF946588632152C09D4B7155D90F29C0	1
149	148+000	-12.531335	-72.521388	0101000020E6100000B821C66B5E2152C0B97020240B1029C0	1
150	149+000	-12.531715	-72.521112	0101000020E6100000676325E6592152C0D595CFF23C1029C0	1
151	150+000	-12.531935	-72.521094	0101000020E61000001409A69A592152C00E32C9C8591029C0	1
152	151+000	-12.532399	-72.521293	0101000020E61000008FA850DD5C2152C0A1D80A9A961029C0	1
153	152+000	-12.532577	-72.521345	0101000020E6100000B83B6BB75D2152C01E34BBEEAD1029C0	1
154	153+000	-12.532678	-72.521259	0101000020E6100000B96FB54E5C2152C0EE98BA2BBB1029C0	1
155	154+000	-12.532678	-72.52112	0101000020E6100000A852B3075A2152C0EE98BA2BBB1029C0	1
156	155+000	-12.532737	-72.520947	0101000020E6100000C2FC1532572152C001BD70E7C21029C0	1
157	156+000	-12.532864	-72.520714	0101000020E61000007024D060532152C0766EDA8CD31029C0	1
158	157+000	-12.533067	-72.520039	0101000020E61000004069A851482152C057276728EE1029C0	1
159	158+000	-12.533193	-72.519797	0101000020E6100000C5E3A25A442152C08AE942ACFE1029C0	1
160	159+000	-12.533345	-72.51971	0101000020E6100000DE59BBED422152C062F88898121129C0	1
161	160+000	-12.53348	-72.51971	0101000020E6100000DE59BBED422152C0E223624A241129C0	1
162	161+000	-12.5337	-72.519883	0101000020E6100000C4AF58C3452152C01AC05B20411129C0	1
163	162+000	-12.533877	-72.520151	0101000020E6100000D47E6B274A2152C0562C7E53581129C0	1
164	163+000	-12.534021	-72.520281	0101000020E6100000BBEEAD484C2152C022C154336B1129C0	1
165	164+000	-12.534198	-72.520238	0101000020E6100000BC0853944B2152C05E2D7766821129C0	1
166	165+000	-12.534401	-72.519848	0101000020E610000006B98B30452152C03FE603029D1129C0	1
167	166+000	-12.534494	-72.519693	0101000020E610000073BD6DA6422152C003D19332A91129C0	1
168	167+000	-12.534654	-72.519667	0101000020E6100000DE736039422152C0E659492BBE1129C0	1
169	168+000	-12.534882	-72.519598	0101000020E61000004A44F817412152C02A70B20DDC1129C0	1
170	169+000	-12.535077	-72.519511	0101000020E610000062BA10AB3F2152C0FFAECF9CF51129C0	1
171	170+000	-12.535229	-72.519693	0101000020E610000073BD6DA6422152C0D7BD1589091229C0	1
172	171+000	-12.535465	-72.519848	0101000020E610000006B98B30452152C0274EEE77281229C0	1
173	172+000	-12.535811	-72.51997	0101000020E6100000AC394030472152C093ACC3D1551229C0	1
174	173+000	-12.53625	-72.519987	0101000020E610000017D68D77472152C0C3F5285C8F1229C0	1
175	174+000	-12.536495	-72.519762	0101000020E610000007EDD5C7432152C05FEFFE78AF1229C0	1
176	175+000	-12.536656	-72.519234	0101000020E6100000293E3E213B2152C084674293C41229C0	1
177	176+000	-12.536757	-72.519044	0101000020E6100000D74B5304382152C053CC41D0D11229C0	1
178	177+000	-12.536909	-72.518975	0101000020E6100000431CEBE2362152C02BDB87BCE51229C0	1
179	178+000	-12.537137	-72.519001	0101000020E6100000D865F84F372152C06FF1F09E031329C0	1
180	179+000	-12.537289	-72.519156	0101000020E61000006B6116DA392152C04700378B171329C0	1
181	180+000	-12.537424	-72.519217	0101000020E6100000BEA1F0D93A2152C0C72B103D291329C0	1
182	181+000	-12.537568	-72.519078	0101000020E6100000AD84EE92382152C094C0E61C3C1329C0	1
183	182+000	-12.537703	-72.519148	0101000020E61000002A7288B8392152C014ECBFCE4D1329C0	1
184	183+000	-12.537931	-72.519407	0101000020E61000001094DBF63D2152C0580229B16B1329C0	1
185	184+000	-12.538218	-72.519624	0101000020E6100000DE8D0585412152C0B03C484F911329C0	1
186	185+000	-12.538531	-72.519935	0101000020E6100000EE42739D462152C0ADC3D155BA1329C0	1
187	186+000	-12.538801	-72.520108	0101000020E6100000D4981073492152C0AC1A84B9DD1329C0	1
188	187+000	-12.539105	-72.520099	0101000020E6100000ABEB504D492152C05C381092051429C0	1
189	188+000	-12.539333	-72.520324	0101000020E6100000BBD408FD4C2152C0A04E7974231429C0	1
190	189+000	-12.539586	-72.520835	0101000020E61000002EE7525C552152C048C2BE9D441429C0	1
191	190+000	-12.539772	-72.520999	0101000020E6100000EB8F300C582152C0D097DEFE5C1429C0	1
192	191+000	-12.53995	-72.521016	0101000020E6100000562C7E53582152C04DF38E53741429C0	1
193	192+000	-12.540237	-72.520766	0101000020E610000099B7EA3A542152C0A52DAEF1991429C0	1
194	193+000	-12.540431	-72.520601	0101000020E6100000F450DB86512152C0397D3D5FB31429C0	1
195	194+000	-12.540659	-72.520117	0101000020E6100000FE45D098492152C07D93A641D11429C0	1
196	195+000	-12.54071	-72.519918	0101000020E610000083A62556462152C0863DEDF0D71429C0	1
197	196+000	-12.540802	-72.519909	0101000020E610000059F96530462152C00839EFFFE31429C0	1
198	197+000	-12.540887	-72.519987	0101000020E610000017D68D77472152C0C1A90F24EF1429C0	1
199	198+000	-12.541081	-72.520281	0101000020E6100000BBEEAD484C2152C055F99E91081529C0	1
200	199+000	-12.541267	-72.520567	0101000020E61000001E1840F8502152C0DDCEBEF2201529C0	1
201	200+000	-12.541554	-72.5208	0101000020E61000006FF085C9542152C03509DE90461529C0	1
202	201+000	-12.542128	-72.521164	0101000020E610000090F63FC05A2152C0E57D1CCD911529C0	1
203	202+000	-12.542559	-72.521259	0101000020E6100000B96FB54E5C2152C00A4D124BCA1529C0	1
204	203+000	-12.543268	-72.521112	0101000020E6100000676325E6592152C039ED2939271629C0	1
205	204+000	-12.54386	-72.520991	0101000020E6100000A9A0A2EA572152C0833463D1741629C0	1
206	205+000	-12.54402	-72.520861	0101000020E6100000C23060C9552152C066BD18CA891629C0	1
207	206+000	-12.544029	-72.520714	0101000020E61000007024D060532152C0B32616F88A1629C0	1
208	207+000	-12.544012	-72.520532	0101000020E610000060217365502152C05B43A9BD881629C0	1
209	208+000	-12.54413	-72.52035	0101000020E61000004F1E166A4D2152C0828B1535981629C0	1
210	209+000	-12.544341	-72.520368	0101000020E6100000A37895B54D2152C06EBE11DDB31629C0	1
211	210+000	-12.544569	-72.520333	0101000020E6100000E481C8224D2152C0B2D47ABFD11629C0	1
212	211+000	-12.544806	-72.520385	0101000020E61000000E15E3FC4D2152C04354E1CFF01629C0	1
213	212+000	-12.545126	-72.520489	0101000020E6100000603B18B14F2152C00A664CC11A1729C0	1
214	213+000	-12.545456	-72.520454	0101000020E6100000A2444B1E4F2152C05FD04202461729C0	1
215	214+000	-12.54581	-72.520264	0101000020E6100000505260014C2152C0D6A88768741729C0	1
216	215+000	-12.546114	-72.520117	0101000020E6100000FE45D098492152C086C613419C1729C0	1
217	216+000	-12.546359	-72.519771	0101000020E6100000319A95ED432152C023C0E95DBC1729C0	1
218	217+000	-12.546545	-72.519407	0101000020E61000001094DBF63D2152C0AB9509BFD41729C0	1
219	218+000	-12.546672	-72.519035	0101000020E6100000AE9E93DE372152C01F477364E51729C0	1
220	219+000	-12.546858	-72.518257	0101000020E6100000147B681F2B2152C0A81C93C5FD1729C0	1
221	220+000	-12.546815	-72.517988	0101000020E61000001CEE23B7262152C0ABECBB22F81729C0	1
222	221+000	-12.546841	-72.517781	0101000020E61000005F5FEB52232152C05039268BFB1729C0	1
223	222+000	-12.546993	-72.51759	0101000020E610000025AFCE31202152C028486C770F1829C0	1
224	223+000	-12.547305	-72.516933	0101000020E6100000484E266E152152C0E3DF675C381829C0	1
225	224+000	-12.547635	-72.516414	0101000020E6100000944C4EED0C2152C0384A5E9D631829C0	1
226	225+000	-12.548065	-72.516085	0101000020E6100000323D6189072152C01B2AC6F99B1829C0	1
227	226+000	-12.548386	-72.515947	0101000020E610000009DE9046052152C0242BBF0CC61829C0	1
228	227+000	-12.548868	-72.515886	0101000020E6100000B69DB646042152C051A4FB39051929C0	1
229	228+000	-12.549028	-72.515817	0101000020E6100000226E4E25032152C0342DB1321A1929C0	1
230	229+000	-12.549036	-72.515583	0101000020E6100000E9D7D64FFF2052C03FA7203F1B1929C0	1
231	230+000	-12.548859	-72.515229	0101000020E6100000DA3C0E83F92052C0043BFE0B041929C0	1
232	231+000	-12.548783	-72.515021	0101000020E610000035F0A31AF62052C09833DB15FA1829C0	1
233	232+000	-12.548775	-72.514779	0101000020E6100000BA6A9E23F22052C08CB96B09F91829C0	1
234	233+000	-12.54869	-72.514138	0101000020E610000060E811A3E72052C0D4484BE5ED1829C0	1
235	234+000	-12.548547	-72.513758	0101000020E6100000BC033C69E12052C048A30227DB1829C0	1
236	235+000	-12.548285	-72.513386	0101000020E61000005A0EF450DB2052C054C6BFCFB81829C0	1
237	236+000	-12.548015	-72.512737	0101000020E6100000BF9CD9AED02052C0546F0D6C951829C0	1
238	237+000	-12.548023	-72.5124	0101000020E61000001B9E5E29CB2052C060E97C78961829C0	1
239	238+000	-12.548091	-72.512028	0101000020E6100000B9A81611C52052C0C07630629F1829C0	1
240	239+000	-12.54804	-72.51182	0101000020E6100000145CACA8C12052C0B8CCE9B2981829C0	1
241	240+000	-12.547854	-72.511673	0101000020E6100000C24F1C40BF2052C02FF7C951801829C0	1
242	241+000	-12.547559	-72.511491	0101000020E6100000B24CBF44BC2052C0CC423BA7591829C0	1
243	242+000	-12.547229	-72.511275	0101000020E6100000CB10C7BAB82052C077D844662E1829C0	1
244	243+000	-12.54663	-72.510738	0101000020E6100000C4B46FEEAF2052C064062AE3DF1729C0	1
245	244+000	-12.546418	-72.510505	0101000020E610000072DC291DAC2052C036E49F19C41729C0	1
246	245+000	-12.546081	-72.510254	0101000020E6100000CEA96400A82052C017EFC7ED971729C0	1
247	246+000	-12.545878	-72.509925	0101000020E61000006B9A779CA22052C037363B527D1729C0	1
248	247+000	-12.545734	-72.509666	0101000020E61000008578245E9E2052C06AA164726A1729C0	1
249	248+000	-12.545532	-72.509544	0101000020E6100000E0F76F5E9C2052C0CBD765F84F1729C0	1
250	249+000	-12.545312	-72.509198	0101000020E6100000124C35B3962052C0923B6C22331729C0	1
251	250+000	-12.545194	-72.508922	0101000020E6100000C18D942D922052C06BF3FFAA231729C0	1
252	251+000	-12.545101	-72.50855	0101000020E61000005F984C158C2052C0A708707A171729C0	1
253	252+000	-12.544949	-72.508048	0101000020E61000001633C2DB832052C0CFF9298E031729C0	1
254	253+000	-12.544679	-72.507728	0101000020E6100000DDD0949D7E2052C0CFA2772AE01629C0	1
255	254+000	-12.544426	-72.507425	0101000020E61000000F0BB5A6792052C0272F3201BF1629C0	1
256	255+000	-12.544307	-72.507027	0101000020E610000018CC5F21732052C0BEF73768AF1629C0	1
257	256+000	-12.544265	-72.506741	0101000020E6100000B6A2CD716E2052C002B7EEE6A91629C0	1
258	257+000	-12.54413	-72.50649	0101000020E6100000117008556A2052C0828B1535981629C0	1
259	258+000	-12.543919	-72.506084	0101000020E6100000D94125AE632052C09758198D7C1629C0	1
260	259+000	-12.543774	-72.505915	0101000020E610000093E34EE9602052C089D4B48B691629C0	1
261	260+000	-12.543639	-72.505777	0101000020E61000006A847EA65E2052C009A9DBD9571629C0	1
262	261+000	-12.543538	-72.5055	0101000020E61000003108AC1C5A2052C03944DC9C4A1629C0	1
263	262+000	-12.543496	-72.505145	0101000020E61000003AAFB14B542052C07D03931B451629C0	1
264	263+000	-12.543555	-72.50492	0101000020E61000002AC6F99B502052C0912749D74C1629C0	1
265	264+000	-12.543572	-72.50466	0101000020E61000005CE674594C2052C0E90AB6114F1629C0	1
266	265+000	-12.543445	-72.504384	0101000020E61000000B28D4D3472052C075594C6C3E1629C0	1
267	266+000	-12.543217	-72.504167	0101000020E61000003C2EAA45442052C03143E389201629C0	1
268	267+000	-12.542972	-72.503804	0101000020E610000004E621533E2052C095490D6D001629C0	1
269	268+000	-12.542845	-72.503389	0101000020E6100000A20A7F86372052C02098A3C7EF1529C0	1
270	269+000	-12.542795	-72.503086	0101000020E6100000D4449F8F322052C059DDEA39E91529C0	1
271	270+000	-12.542786	-72.502809	0101000020E61000009BC8CC052E2052C00C74ED0BE81529C0	1
272	271+000	-12.542651	-72.502662	0101000020E610000049BC3C9D2B2052C08C48145AD61529C0	1
273	272+000	-12.542541	-72.502428	0101000020E61000000F26C5C7272052C0707A17EFC71529C0	1
274	273+000	-12.54255	-72.502108	0101000020E6100000D7C39789222052C0BDE3141DC91529C0	1
275	274+000	-12.542482	-72.50184	0101000020E6100000C7F484251E2052C05C566133C01529C0	1
276	275+000	-12.542279	-72.501762	0101000020E610000009185DDE1C2052C07C9DD497A51529C0	1
277	276+000	-12.542161	-72.50184	0101000020E6100000C7F484251E2052C054556820961529C0	1
278	277+000	-12.541933	-72.501875	0101000020E610000085EB51B81E2052C0103FFF3D781529C0	1
279	278+000	-12.541621	-72.50197	0101000020E6100000AE64C746202052C054A703594F1529C0	1
280	279+000	-12.541426	-72.502255	0101000020E610000029D027F2242052C07F68E6C9351529C0	1
281	280+000	-12.541215	-72.502325	0101000020E6100000A5BDC117262052C09335EA211A1529C0	1
282	281+000	-12.540886	-72.502299	0101000020E61000001074B4AA252052C080BA8102EF1429C0	1
283	282+000	-12.540852	-72.502134	0101000020E61000006B0DA5F6222052C0CFF3A78DEA1429C0	1
284	0+000	-12.433706	-72.463736	0101000020E6100000957EC2D9AD1D52C070287CB60EDE28C0	2
285	1+000	-12.43371	-72.463792	0101000020E61000005F09A4C4AE1D52C075E5B33C0FDE28C0	2
286	2+000	-12.433718	-72.463907	0101000020E6100000AC58FCA6B01D52C0815F234910DE28C0	2
287	3+000	-12.433744	-72.464054	0101000020E6100000FE648C0FB31D52C026AC8DB113DE28C0	2
288	4+000	-12.433793	-72.464154	0101000020E6100000AF93FAB2B41D52C0AB77B81D1ADE28C0	2
289	5+000	-12.433885	-72.464215	0101000020E610000002D4D4B2B51D52C02E73BA2C26DE28C0	2
290	6+000	-12.434113	-72.464215	0101000020E610000002D4D4B2B51D52C07289230F44DE28C0	2
291	7+000	-12.434355	-72.464235	0101000020E610000026AAB706B61D52C04AB54FC763DE28C0	2
292	8+000	-12.434537	-72.464325	0101000020E6100000C66D3480B71D52C0CDCD37A27BDE28C0	2
293	9+000	-12.434731	-72.464598	0101000020E61000005EF23FF9BB1D52C0601DC70F95DE28C0	2
294	10+000	-12.434928	-72.464847	0101000020E610000033A9A10DC01D52C0B83A00E2AEDE28C0	2
295	11+000	-12.435027	-72.465143	0101000020E6100000A73D25E7C41D52C005C1E3DBBBDE28C0	2
296	12+000	-12.435392	-72.465505	0101000020E6100000F7C77BD5CA1D52C04CE141B3EBDE28C0	2
297	13+000	-12.435722	-72.46595	0101000020E61000008FE4F21FD21D52C0A14B38F416DF28C0	2
298	14+000	-12.436181	-72.466321	0101000020E6100000081C0934D81D52C0ED45B41D53DF28C0	2
299	15+000	-12.436477	-72.466511	0101000020E61000005A0EF450DB1D52C092E9D0E979DF28C0	2
300	16+000	-12.436627	-72.466665	0101000020E6100000064CE0D6DD1D52C0E719FB928DDF28C0	2
301	17+000	-12.436755	-72.466867	0101000020E610000039252026E11D52C09DBAF2599EDF28C0	2
302	18+000	-12.436848	-72.466979	0101000020E6100000CD3AE3FBE21D52C061A5828AAADF28C0	2
303	19+000	-12.437039	-72.467056	0101000020E6100000A359D93EE41D52C031276893C3DF28C0	2
304	20+000	-12.437108	-72.467193	0101000020E6100000E3FA777DE61D52C0D3A3A99ECCDF28C0	2
305	21+000	-12.437166	-72.467389	0101000020E6100000A6608DB3E91D52C0A5D8D138D4DF28C0	2
306	22+000	-12.437369	-72.467685	0101000020E61000001BF5108DEE1D52C086915ED4EEDF28C0	2
307	23+000	-12.437589	-72.467946	0101000020E6100000D192C7D3F21D52C0BE2D58AA0BE028C0	2
308	24+000	-12.437635	-72.468124	0101000020E6100000419E5DBEF51D52C0802BD9B111E028C0	2
309	25+000	-12.437589	-72.468284	0101000020E61000005D4F745DF81D52C0BE2D58AA0BE028C0	2
310	26+000	-12.437572	-72.468528	0101000020E6100000A950DD5CFC1D52C0664AEB6F09E028C0	2
311	27+000	-12.437664	-72.468723	0101000020E610000083F8C08EFF1D52C0E945ED7E15E028C0	2
312	28+000	-12.437774	-72.468972	0101000020E610000057AF22A3031E52C00514EAE923E028C0	2
313	29+000	-12.437878	-72.469316	0101000020E610000055DFF945091E52C09946938B31E028C0	2
314	30+000	-12.437931	-72.469566	0101000020E610000011548D5E0D1E52C025CFF57D38E028C0	2
315	31+000	-12.438018	-72.469732	0101000020E61000009E78CE16101E52C0601E32E543E028C0	2
316	32+000	-12.438081	-72.469904	0101000020E61000009D103AE8121E52C07AFF1F274CE028C0	2
317	33+000	-12.43811	-72.470076	0101000020E61000009CA8A5B9151E52C0E31934F44FE028C0	2
318	34+000	-12.438174	-72.47042	0101000020E610000099D87C5C1B1E52C03EEAAF5758E028C0	2
319	35+000	-12.438156	-72.470639	0101000020E6100000384E0AF31E1E52C0A417B5FB55E028C0	2
320	36+000	-12.438214	-72.4709	0101000020E6100000EEEBC039231E52C0774CDD955DE028C0	2
321	37+000	-12.43829	-72.471042	0101000020E6100000B742588D251E52C0E353008C67E028C0	2
322	38+000	-12.438423	-72.471197	0101000020E61000004B3E7617281E52C0E0A0BDFA78E028C0	2
323	39+000	-12.438481	-72.471268	0101000020E6100000AFE94141291E52C0B2D5E59480E028C0	2
324	40+000	-12.43844	-72.471333	0101000020E6100000A321E3512A1E52C038842A357BE028C0	2
325	41+000	-12.43829	-72.471428	0101000020E6100000CC9A58E02B1E52C0E353008C67E028C0	2
326	42+000	-12.438162	-72.471558	0101000020E6100000B30A9B012E1E52C02DB308C556E028C0	2
327	43+000	-12.438075	-72.47179	0101000020E61000001C25AFCE311E52C0F163CC5D4BE028C0	2
328	44+000	-12.438018	-72.472039	0101000020E6100000F0DB10E3351E52C0601E32E543E028C0	2
329	45+000	-12.438064	-72.472205	0101000020E61000007E00529B381E52C0221CB3EC49E028C0	2
330	46+000	-12.43811	-72.472353	0101000020E6100000B8CA13083B1E52C0E31934F44FE028C0	2
331	47+000	-12.438168	-72.47297	0101000020E61000004E7FF623451E52C0B54E5C8E57E028C0	2
332	48+000	-12.438278	-72.473326	0101000020E61000002D9622F94A1E52C0D21C59F965E028C0	2
333	49+000	-12.438359	-72.473581	0101000020E610000072C0AE264F1E52C085D0419770E028C0	2
334	50+000	-12.438336	-72.473741	0101000020E61000008F71C5C5511E52C0A45181936DE028C0	2
335	51+000	-12.438197	-72.473878	0101000020E6100000CF126404541E52C01F69705B5BE028C0	2
336	52+000	-12.438064	-72.474056	0101000020E61000003F1EFAEE561E52C0221CB3EC49E028C0	2
337	53+000	-12.437931	-72.474234	0101000020E6100000AE2990D9591E52C025CFF57D38E028C0	2
338	54+000	-12.43789	-72.474631	0101000020E6100000BDAAB35A601E52C0AA7D3A1E33E028C0	2
339	55+000	-12.437832	-72.4752	0101000020E6100000CAC342AD691E52C0D84812842BE028C0	2
340	56+000	-12.437861	-72.475325	0101000020E6100000287E8CB96B1E52C0416326512FE028C0	2
341	57+000	-12.438018	-72.475408	0101000020E61000006F10AD156D1E52C0601E32E543E028C0	2
342	58+000	-12.438243	-72.47555	0101000020E6100000386744696F1E52C0E066F16261E028C0	2
343	59+000	-12.438452	-72.47574	0101000020E61000008A592F86721E52C049BBD1C77CE028C0	2
344	60+000	-12.438504	-72.475888	0101000020E6100000C423F1F2741E52C09354A69883E028C0	2
345	61+000	-12.438452	-72.475966	0101000020E61000008200193A761E52C049BBD1C77CE028C0	2
346	62+000	-12.438307	-72.47596	0101000020E6100000118DEE20761E52C03B376DC669E028C0	2
347	63+000	-12.438081	-72.475871	0101000020E61000005987A3AB741E52C07AFF1F274CE028C0	2
348	64+000	-12.437931	-72.475924	0101000020E61000006BD8EF89751E52C025CFF57D38E028C0	2
349	65+000	-12.437819	-72.476011	0101000020E61000005262D7F6761E52C08522DDCF29E028C0	2
350	66+000	-12.437784	-72.476201	0101000020E6100000A454C2137A1E52C0946C753925E028C0	2
351	67+000	-12.437697	-72.476385	0101000020E610000084D382177D1E52C0581D39D219E028C0	2
352	68+000	-12.437431	-72.476492	0101000020E61000008F334DD87E1E52C05E83BEF4F6DF28C0	2
353	69+000	-12.437286	-72.476545	0101000020E6100000A18499B67F1E52C050FF59F3E3DF28C0	2
354	70+000	-12.437222	-72.476676	0101000020E610000070B20DDC811E52C0F52EDE8FDBDF28C0	2
355	71+000	-12.437239	-72.476784	0101000020E610000063D009A1831E52C04D124BCADDDF28C0	2
356	72+000	-12.437432	-72.476953	0101000020E6100000A92EE065861E52C09F724C16F7DF28C0	2
357	73+000	-12.437468	-72.476956	0101000020E610000062687572861E52C0D31742CEFBDF28C0	2
358	74+000	-12.437498	-72.476957	0101000020E61000004A26A776861E52C07D21E4BCFFDF28C0	2
359	75+000	-12.437532	-72.476926	0101000020E61000002D27A1F4851E52C02DE8BD3104E028C0	2
360	76+000	-12.437566	-72.476883	0101000020E61000002D414640851E52C0DEAE97A608E028C0	2
361	77+000	-12.437649	-72.476734	0101000020E61000000AB952CF821E52C014419C8713E028C0	2
362	78+000	-12.437711	-72.476488	0101000020E6100000EF3B86C77E1E52C0EC32FCA71BE028C0	2
363	79+000	-12.437751	-72.476392	0101000020E6100000DE04DF347D1E52C0259529E620E028C0	2
364	80+000	-12.437779	-72.476368	0101000020E6100000193735D07C1E52C04DC0AF9124E028C0	2
365	81+000	-12.437808	-72.476357	0101000020E61000001F0E12A27C1E52C0B6DAC35E28E028C0	2
366	82+000	-12.437828	-72.476349	0101000020E6100000DE1E84807C1E52C0D28BDAFD2AE028C0	2
367	83+000	-12.437842	-72.476347	0101000020E61000000EA320787C1E52C066A19DD32CE028C0	2
368	84+000	-12.437863	-72.476355	0101000020E61000004F92AE997C1E52C0C44142942FE028C0	2
369	85+000	-12.437868	-72.476373	0101000020E6100000A2EC2DE57C1E52C00BEE073C30E028C0	2
370	86+000	-12.437868	-72.476398	0101000020E61000004F78094E7D1E52C00BEE073C30E028C0	2
371	87+000	-12.437856	-72.476444	0101000020E61000000798F90E7E1E52C0FAB660A92EE028C0	2
372	88+000	-12.437843	-72.476519	0101000020E61000000C3B8C497F1E52C0A8902BF52CE028C0	2
373	89+000	-12.437853	-72.476658	0101000020E61000001D588E90811E52C036E9B6442EE028C0	2
374	90+000	-12.437832	-72.476866	0101000020E6100000C2A4F8F8841E52C0D84812842BE028C0	2
375	91+000	-12.43781	-72.477158	0101000020E61000009641B5C1891E52C039B9DFA128E028C0	2
376	92+000	-12.437808	-72.477312	0101000020E6100000417FA1478C1E52C0B6DAC35E28E028C0	2
377	93+000	-12.437756	-72.477664	0101000020E6100000809E060C921E52C06C41EF8D21E028C0	2
378	94+000	-12.437609	-72.478048	0101000020E6100000C47AA356981E52C0DBDE6E490EE028C0	2
379	95+000	-12.437556	-72.47817	0101000020E61000006AFB57569A1E52C050560C5707E028C0	2
380	96+000	-12.43752	-72.478263	0101000020E6100000C2F869DC9B1E52C01CB1169F02E028C0	2
381	97+000	-12.437507	-72.478308	0101000020E6100000925A28999C1E52C0CA8AE1EA00E028C0	2
382	98+000	-12.437507	-72.478323	0101000020E61000002D7B12D89C1E52C0CA8AE1EA00E028C0	2
383	99+000	-12.43751	-72.478339	0101000020E6100000B0592E1B9D1E52C08E588B4F01E028C0	2
384	100+000	-12.437522	-72.478353	0101000020E610000062BCE6559D1E52C09F8F32E202E028C0	2
385	101+000	-12.437546	-72.478358	0101000020E6100000EB71DF6A9D1E52C0C1FD800706E028C0	2
386	102+000	-12.437563	-72.478352	0101000020E61000007AFEB4519D1E52C01AE1ED4108E028C0	2
387	103+000	-12.43759	-72.478317	0101000020E6100000BC07E8BE9C1E52C0001DE6CB0BE028C0	2
388	104+000	-12.437622	-72.478276	0101000020E61000008C9DF0129C1E52C02D05A4FD0FE028C0	2
389	105+000	-12.43784	-72.477789	0101000020E6100000DE585018941E52C0E3C281902CE028C0	2
390	106+000	-12.437933	-72.477566	0101000020E61000009EEBFB70901E52C0A7AD11C138E028C0	2
391	107+000	-12.437988	-72.477351	0101000020E6100000A06D35EB8C1E52C0B61490F63FE028C0	2
392	108+000	-12.438139	-72.476846	0101000020E61000009ECE15A5841E52C04C3448C153E028C0	2
393	109+000	-12.438256	-72.476567	0101000020E610000095D6DF12801E52C0338D261763E028C0	2
394	110+000	-12.438287	-72.476509	0101000020E6100000FACF9A1F7F1E52C01F86562767E028C0	2
395	111+000	-12.43832	-72.476467	0101000020E6100000E3A7716F7E1E52C08D5DA27A6BE028C0	2
396	112+000	-12.438354	-72.476467	0101000020E6100000E3A7716F7E1E52C03E247CEF6FE028C0	2
397	113+000	-12.438376	-72.476486	0101000020E61000001EC022BF7E1E52C0DDB3AED172E028C0	2
398	114+000	-12.438379	-72.4765	0101000020E6100000D122DBF97E1E52C0A181583673E028C0	2
399	115+000	-12.438379	-72.476542	0101000020E6100000E84A04AA7F1E52C0A181583673E028C0	2
400	116+000	-12.438375	-72.476559	0101000020E610000053E751F17F1E52C09CC420B072E028C0	2
401	117+000	-12.438362	-72.476593	0101000020E61000002920ED7F801E52C0499EEBFB70E028C0	2
402	118+000	-12.438331	-72.476674	0101000020E6100000A036AAD3811E52C05DA5BBEB6CE028C0	2
403	119+000	-12.438275	-72.476823	0101000020E6100000C2BE9D44841E52C00E4FAF9465E028C0	2
404	120+000	-12.438248	-72.476939	0101000020E6100000F7CB272B861E52C02713B70A62E028C0	2
405	121+000	-12.438218	-72.477157	0101000020E6100000AE8383BD891E52C07D09151C5EE028C0	2
406	122+000	-12.438218	-72.477304	0101000020E6100000009013268C1E52C07D09151C5EE028C0	2
407	123+000	-12.438213	-72.477348	0101000020E6100000E833A0DE8C1E52C0355D4F745DE028C0	2
408	124+000	-12.438197	-72.477452	0101000020E61000003A5AD5928E1E52C01F69705B5BE028C0	2
409	125+000	-12.43811	-72.477721	0101000020E610000032E719FB921E52C0E31934F44FE028C0	2
410	126+000	-12.437987	-72.478088	0101000020E61000000B2769FE981E52C0742502D53FE028C0	2
411	127+000	-12.43797	-72.478183	0101000020E610000034A0DE8C9A1E52C01C42959A3DE028C0	2
412	128+000	-12.437962	-72.47829	0101000020E61000003F00A94D9C1E52C011C8258E3CE028C0	2
413	129+000	-12.437987	-72.478408	0101000020E61000004489963C9E1E52C0742502D53FE028C0	2
414	130+000	-12.438045	-72.478651	0101000020E6100000A7CCCD37A21E52C0475A2A6F47E028C0	2
415	131+000	-12.438161	-72.478983	0101000020E6100000C21550A8A71E52C0EBC37AA356E028C0	2
416	132+000	-12.43823	-72.479108	0101000020E610000020D099B4A91E52C08E40BCAE5FE028C0	2
417	133+000	-12.438497	-72.479297	0101000020E61000008A0453CDAC1E52C0C9C9C4AD82E028C0	2
418	134+000	-12.438811	-72.479484	0101000020E610000023BDA8DDAF1E52C00740DCD5ABE028C0	2
419	135+000	-12.439014	-72.479562	0101000020E6100000E199D024B11E52C0E8F86871C6E028C0	2
420	136+000	-12.439147	-72.47949	0101000020E61000009430D3F6AF1E52C0E54526E0D7E028C0	2
421	137+000	-12.439194	-72.479428	0101000020E61000005932C7F2AE1E52C0E8323509DEE028C0	2
422	138+000	-12.439246	-72.47936	0101000020E6100000ADC090D5AD1E52C032CC09DAE4E028C0	2
423	139+000	-12.43928	-72.479105	0101000020E6100000689604A8A91E52C0E292E34EE9E028C0	2
424	140+000	-12.439188	-72.478891	0101000020E610000052D66F26A61E52C05F97E13FDDE028C0	2
425	141+000	-12.439066	-72.478696	0101000020E6100000772E8CF4A21E52C032923D42CDE028C0	2
426	142+000	-12.439002	-72.478512	0101000020E610000096AFCBF09F1E52C0D7C1C1DEC4E028C0	2
427	143+000	-12.438946	-72.478323	0101000020E61000002D7B12D89C1E52C0876BB587BDE028C0	2
428	144+000	-12.438916	-72.47815	0101000020E6100000462575029A1E52C0DD611399B9E028C0	2
429	145+000	-12.438902	-72.478047	0101000020E6100000DCBC7152981E52C0494C50C3B7E028C0	2
430	146+000	-12.438908	-72.477976	0101000020E61000007711A628971E52C0D1E7A38CB8E028C0	2
431	147+000	-12.438948	-72.477913	0101000020E610000054556820961E52C00A4AD1CABDE028C0	2
432	148+000	-12.439005	-72.477894	0101000020E6100000193DB7D0951E52C09B8F6B43C5E028C0	2
433	149+000	-12.439046	-72.477896	0101000020E6100000E9B81AD9951E52C015E126A3CAE028C0	2
434	150+000	-12.439095	-72.477916	0101000020E61000000C8FFD2C961E52C09BAC510FD1E028C0	2
435	151+000	-12.439246	-72.478044	0101000020E61000002383DC45981E52C032CC09DAE4E028C0	2
436	152+000	-12.439439	-72.478219	0101000020E6100000DA54DD239B1E52C0842C0B26FEE028C0	2
437	153+000	-12.4399	-72.478684	0101000020E6100000954737C2A21E52C05305A3923AE128C0	2
438	154+000	-12.440201	-72.478832	0101000020E6100000CF11F92EA51E52C03F55850662E128C0	2
439	155+000	-12.440497	-72.479134	0101000020E6100000B519A721AA1E52C0E4F8A1D288E128C0	2
440	156+000	-12.440705	-72.479419	0101000020E61000002F8507CDAE1E52C00B5EF415A4E128C0	2
441	157+000	-12.440752	-72.480066	0101000020E6100000FA7ABE66B91E52C00E4B033FAAE128C0	2
442	158+000	-12.440624	-72.480439	0101000020E6100000452E3883BF1E52C058AA0B7899E128C0	2
443	159+000	-12.440584	-72.480671	0101000020E6100000AE484C50C31E52C01F48DE3994E128C0	2
444	160+000	-12.440618	-72.480795	0101000020E610000024456458C51E52C0D00EB8AE98E128C0	2
445	161+000	-12.440775	-72.480902	0101000020E61000002FA52E19C71E52C0EFC9C342ADE128C0	2
446	162+000	-12.440931	-72.481009	0101000020E61000003A05F9D9C81E52C0CD9541B5C1E128C0	2
447	163+000	-12.441099	-72.481246	0101000020E61000002CD505BCCC1E52C0BB9866BAD7E128C0	2
448	164+000	-12.441221	-72.481329	0101000020E610000073672618CE1E52C0E99D0AB8E7E128C0	2
449	165+000	-12.441371	-72.481371	0101000020E61000008A8F4FC8CE1E52C03ECE3461FBE128C0	2
450	166+000	-12.441545	-72.481353	0101000020E61000003735D07CCE1E52C0B56CAD2F12E228C0	2
451	167+000	-12.441672	-72.481388	0101000020E6100000F52B9D0FCF1E52C02A1E17D522E228C0	2
452	168+000	-12.441736	-72.481531	0101000020E6100000A7406667D11E52C085EE92382BE228C0	2
453	169+000	-12.441812	-72.481614	0101000020E6100000EDD286C3D21E52C0F1F5B52E35E228C0	2
454	170+000	-12.44191	-72.481709	0101000020E6100000164CFC51D41E52C0FC8C0B0742E228C0	2
455	171+000	-12.442008	-72.481798	0101000020E6100000CE5147C7D51E52C0072461DF4EE228C0	2
456	172+000	-12.441997	-72.481916	0101000020E6100000D3DA34B6D71E52C038DC476E4DE228C0	2
457	173+000	-12.441933	-72.481946	0101000020E6100000081C0934D81E52C0DD0BCC0A45E228C0	2
458	174+000	-12.441806	-72.481916	0101000020E6100000D3DA34B6D71E52C0685A626534E228C0	2
459	175+000	-12.441713	-72.481916	0101000020E6100000D3DA34B6D71E52C0A46FD23428E228C0	2
460	176+000	-12.44162	-72.481893	0101000020E6100000F7CABC55D71E52C0E08442041CE228C0	2
461	177+000	-12.441539	-72.481922	0101000020E6100000444E5FCFD71E52C02DD1596611E228C0	2
462	178+000	-12.441429	-72.482047	0101000020E6100000A208A9DBD91E52C010035DFB02E228C0	2
463	179+000	-12.441331	-72.482118	0101000020E610000007B47405DB1E52C0056C0723F6E128C0	2
464	180+000	-12.441064	-72.482124	0101000020E610000078279F1EDB1E52C0CAE2FE23D3E128C0	2
465	181+000	-12.440775	-72.482195	0101000020E6100000DDD26A48DC1E52C0EFC9C342ADE128C0	2
466	182+000	-12.440508	-72.482397	0101000020E610000011ACAA97DF1E52C0B340BB438AE128C0	2
467	183+000	-12.44034	-72.482604	0101000020E6100000CD3AE3FBE21E52C0C53D963E74E128C0	2
468	184+000	-12.440317	-72.482759	0101000020E610000061360186E51E52C0E4BED53A71E128C0	2
469	185+000	-12.440381	-72.482954	0101000020E61000003CDEE4B7E81E52C03F8F519E79E128C0	2
470	186+000	-12.440468	-72.483085	0101000020E61000000B0C59DDEA1E52C07ADE8D0585E128C0	2
471	187+000	-12.440584	-72.483269	0101000020E6100000EC8A19E1ED1E52C01F48DE3994E128C0	2
472	188+000	-12.440584	-72.483399	0101000020E6100000D3FA5B02F01E52C01F48DE3994E128C0	2
473	189+000	-12.440601	-72.483903	0101000020E6100000ECDB4944F81E52C0772B4B7496E128C0	2
474	190+000	-12.440578	-72.484194	0101000020E6100000D8BAD408FD1E52C097AC8A7093E128C0	2
475	191+000	-12.440769	-72.484414	0101000020E61000005FEE93A3001F52C0662E7079ACE128C0	2
476	192+000	-12.440937	-72.484502	0101000020E61000002F36AD14021F52C05531957EC2E128C0	2
477	193+000	-12.441012	-72.484591	0101000020E6100000E63BF889031F52C080492A53CCE128C0	2
478	194+000	-12.441012	-72.484692	0101000020E610000080289831051F52C080492A53CCE128C0	2
479	195+000	-12.44092	-72.484805	0101000020E6100000FCFB8C0B071F52C0FD4D2844C0E128C0	2
480	196+000	-12.440885	-72.484959	0101000020E6100000A8397991091F52C00B98C0ADBBE128C0	2
481	197+000	-12.440914	-72.485102	0101000020E6100000594E42E90B1F52C074B2D47ABFE128C0	2
482	198+000	-12.44103	-72.48538	0101000020E61000007B884677101F52C0191C25AFCEE128C0	2
483	199+000	-12.441053	-72.485944	0101000020E6100000FFEBDCB4191F52C0FA9AE5B2D1E128C0	2
484	200+000	-12.440937	-72.486329	0101000020E61000002B86AB03201F52C05531957EC2E128C0	2
485	201+000	-12.440931	-72.486549	0101000020E6100000B2B96A9E231F52C0CD9541B5C1E128C0	2
486	202+000	-12.440867	-72.486854	0101000020E610000050FBAD9D281F52C072C5C551B9E128C0	2
487	203+000	-12.440682	-72.487121	0101000020E6100000780C8FFD2C1F52C02BDF3312A1E128C0	2
488	204+000	-12.44045	-72.48753	0101000020E6100000697407B1331F52C0E10B93A982E128C0	2
489	205+000	-12.440172	-72.488337	0101000020E6100000501BD5E9401F52C0D63A71395EE128C0	2
490	206+000	-12.440074	-72.48864	0101000020E61000001EE1B4E0451F52C0CAA31B6151E128C0	2
491	207+000	-12.44012	-72.488806	0101000020E6100000AB05F698481F52C08CA19C6857E128C0	2
492	208+000	-12.440248	-72.488865	0101000020E61000002ECA6C90491F52C04242942F68E128C0	2
493	209+000	-12.440444	-72.488924	0101000020E6100000B08EE3874A1F52C058703FE081E128C0	2
494	210+000	-12.440601	-72.488984	0101000020E61000001B118C834B1F52C0772B4B7496E128C0	2
495	211+000	-12.440752	-72.489061	0101000020E6100000F12F82C64C1F52C00E4B033FAAE128C0	2
496	212+000	-12.440838	-72.489102	0101000020E6100000209A79724D1F52C008ABB184B5E128C0	2
497	213+000	-12.44107	-72.489055	0101000020E61000007FBC57AD4C1F52C0527E52EDD3E128C0	2
498	214+000	-12.441383	-72.489096	0101000020E6100000AF264F594D1F52C04F05DCF3FCE128C0	2
499	215+000	-12.441829	-72.489114	0101000020E61000000281CEA44D1F52C049D9226937E228C0	2
500	216+000	-12.441968	-72.489096	0101000020E6100000AF264F594D1F52C0CEC133A149E228C0	2
501	217+000	-12.442228	-72.488901	0101000020E6100000D47E6B274A1F52C040C05AB56BE228C0	2
502	218+000	-12.442536	-72.488723	0101000020E61000006473D53C471F52C0F69A1E1494E228C0	2
503	219+000	-12.44275	-72.488634	0101000020E6100000AD6D8AC7451F52C0A69BC420B0E228C0	2
504	220+000	-12.442976	-72.488604	0101000020E6100000772CB649451F52C067D311C0CDE228C0	2
505	221+000	-12.443265	-72.488586	0101000020E610000024D236FE441F52C042EC4CA1F3E228C0	2
506	222+000	-12.443439	-72.488534	0101000020E6100000FB3E1C24441F52C0B98AC56F0AE328C0	2
507	223+000	-12.4437	-72.488522	0101000020E61000001958C7F1431F52C06C787AA52CE328C0	2
508	224+000	-12.443856	-72.48864	0101000020E61000001EE1B4E0451F52C04A44F81741E328C0	2
509	225+000	-12.443978	-72.488759	0101000020E61000000B28D4D3471F52C077499C1551E328C0	2
510	226+000	-12.444094	-72.488812	0101000020E61000001C7920B2481F52C01CB3EC4960E328C0	2
511	227+000	-12.444215	-72.488836	0101000020E6100000E146CA16491F52C008C9022670E328C0	2
512	228+000	-12.444256	-72.488902	0101000020E6100000BC3C9D2B4A1F52C0821ABE8575E328C0	2
513	229+000	-12.44425	-72.489014	0101000020E6100000505260014C1F52C0FA7E6ABC74E328C0	2
514	230+000	-12.44432	-72.489133	0101000020E61000003D997FF44D1F52C0DDEA39E97DE328C0	2
515	231+000	-12.444424	-72.489186	0101000020E61000004FEACBD24E1F52C0711DE38A8BE328C0	2
516	232+000	-12.444586	-72.489263	0101000020E61000002409C215501F52C0D784B4C6A0E328C0	2
517	233+000	-12.444644	-72.489358	0101000020E61000004D8237A4511F52C0AAB9DC60A8E328C0	2
518	234+000	-12.44458	-72.48953	0101000020E61000004C1AA375541F52C04FE960FD9FE328C0	2
519	235+000	-12.444424	-72.489578	0101000020E6100000D4B5F63E551F52C0711DE38A8BE328C0	2
520	236+000	-12.444256	-72.489578	0101000020E6100000D4B5F63E551F52C0821ABE8575E328C0	2
521	237+000	-12.44414	-72.489607	0101000020E6100000223999B8551F52C0DEB06D5166E328C0	2
522	238+000	-12.444053	-72.489673	0101000020E6100000FD2E6CCD561F52C0A26131EA5AE328C0	2
523	239+000	-12.44396	-72.489833	0101000020E61000001AE0826C591F52C0DE76A1B94EE328C0	2
524	240+000	-12.443874	-72.489833	0101000020E61000001AE0826C591F52C0E316F37343E328C0	2
525	241+000	-12.443781	-72.489678	0101000020E610000086E464E2561F52C01F2C634337E328C0	2
526	242+000	-12.443706	-72.489512	0101000020E6100000F9BF232A541F52C0F513CE6E2DE328C0	2
527	243+000	-12.443601	-72.489406	0101000020E6100000D61D8B6D521F52C01FF296AB1FE328C0	2
528	244+000	-12.443522	-72.489447	0101000020E610000005888219531F52C0EF1CCA5015E328C0	2
529	245+000	-12.443236	-72.489849	0101000020E61000009DBE9EAF591F52C0D9D138D4EFE228C0	2
530	246+000	-12.442965	-72.490084	0101000020E6100000BE1248895D1F52C0978BF84ECCE228C0	2
531	247+000	-12.442621	-72.490218	0101000020E6100000467A51BB5F1F52C0AF0B3F389FE228C0	2
532	248+000	-12.442285	-72.490294	0101000020E610000034DB15FA601F52C0D105F52D73E228C0	2
533	249+000	-12.441974	-72.490529	0101000020E6100000552FBFD3641F52C0575D876A4AE228C0	2
534	250+000	-12.441851	-72.490629	0101000020E6100000075E2D77661F52C0E868554B3AE228C0	2
535	251+000	-12.441515	-72.490738	0101000020E6100000E2395B40681F52C00B630B410EE228C0	2
536	252+000	-12.441294	-72.490831	0101000020E61000003B376DC6691F52C090D78349F1E128C0	2
537	253+000	-12.44118	-72.490973	0101000020E6100000048E041A6C1F52C06E4C4F58E2E128C0	2
538	254+000	-12.440999	-72.490998	0101000020E6100000B119E0826C1F52C02D23F59ECAE128C0	2
539	255+000	-12.440746	-72.490919	0101000020E61000000B7F86376B1F52C086AFAF75A9E128C0	2
540	256+000	-12.440619	-72.490966	0101000020E6100000AB5CA8FC6B1F52C011FE45D098E128C0	2
541	257+000	-12.440468	-72.491132	0101000020E61000003881E9B46E1F52C07ADE8D0585E128C0	2
542	258+000	-12.440416	-72.491328	0101000020E6100000FBE6FEEA711F52C03145B9347EE128C0	2
543	259+000	-12.440474	-72.491554	0101000020E6100000F38DE89E751F52C0037AE1CE85E128C0	2
544	260+000	-12.44063	-72.491791	0101000020E6100000E65DF580791F52C0E1455F419AE128C0	2
545	261+000	-12.440787	-72.491992	0101000020E6100000317903CC7C1F52C000016BD5AEE128C0	2
546	262+000	-12.440885	-72.492129	0101000020E6100000721AA20A7F1F52C00B98C0ADBBE128C0	2
547	263+000	-12.440885	-72.492242	0101000020E6100000EEED96E4801F52C00B98C0ADBBE128C0	2
548	264+000	-12.44081	-72.492277	0101000020E6100000ACE46377811F52C0E17F2BD9B1E128C0	2
549	265+000	-12.440648	-72.49223	0101000020E61000000C0742B2801F52C07A185A9D9CE128C0	2
550	266+000	-12.440468	-72.492188	0101000020E6100000F4DE1802801F52C07ADE8D0585E128C0	2
551	267+000	-12.440352	-72.492259	0101000020E6100000598AE42B811F52C0D6743DD175E128C0	2
552	268+000	-12.440288	-72.492544	0101000020E6100000D3F544D7851F52C07BA4C16D6DE128C0	2
553	269+000	-12.440173	-72.492864	0101000020E61000000C5872158B1F52C0172AFF5A5EE128C0	2
554	270+000	-12.440039	-72.493025	0101000020E610000011C7BAB88D1F52C0D9EDB3CA4CE128C0	2
555	271+000	-12.440016	-72.493179	0101000020E6100000BC04A73E901F52C0F86EF3C649E128C0	2
556	272+000	-12.440039	-72.493434	0101000020E6100000012F336C941F52C0D9EDB3CA4CE128C0	2
557	273+000	-12.439987	-72.493541	0101000020E61000000C8FFD2C961F52C08F54DFF945E128C0	2
558	274+000	-12.439802	-72.493541	0101000020E61000000C8FFD2C961F52C0486E4DBA2DE128C0	2
559	275+000	-12.439593	-72.493363	0101000020E61000009D836742931F52C0DF196D5512E128C0	2
560	276+000	-12.439391	-72.493309	0101000020E6100000A374E95F921F52C040506EDBF7E028C0	2
561	277+000	-12.439147	-72.493458	0101000020E6100000C6FCDCD0941F52C0E54526E0D7E028C0	2
562	278+000	-12.438812	-72.49363	0101000020E6100000C49448A2971F52C0492F6AF7ABE028C0	2
563	279+000	-12.438174	-72.493742	0101000020E610000058AA0B78991F52C03EEAAF5758E028C0	2
564	280+000	-12.437951	-72.493625	0101000020E61000003BDF4F8D971F52C041800C1D3BE028C0	2
565	281+000	-12.437733	-72.493362	0101000020E6100000B5C5353E931F52C08BC22E8A1EE028C0	2
566	282+000	-12.437485	-72.493205	0101000020E6100000514EB4AB901F52C02BFBAE08FEDF28C0	2
567	283+000	-12.437288	-72.493168	0101000020E6100000C2DB8310901F52C0D3DD7536E4DF28C0	2
568	284+000	-12.437011	-72.493085	0101000020E61000007B4963B48E1F52C009FCE1E7BFDF28C0	2
569	285+000	-12.436742	-72.493033	0101000020E610000052B648DA8D1F52C04B94BDA59CDF28C0	2
570	286+000	-12.436516	-72.493056	0101000020E61000002EC6C03A8E1F52C0895C70067FDF28C0	2
571	287+000	-12.436297	-72.493093	0101000020E6100000BD38F1D58E1F52C092AF045262DF28C0	2
572	288+000	-12.436159	-72.493026	0101000020E6100000F984ECBC8D1F52C04EB6813B50DF28C0	2
573	289+000	-12.436006	-72.492921	0101000020E6100000BEA085048C1F52C035B8AD2D3CDF28C0	2
574	290+000	-12.435782	-72.492906	0101000020E610000024809BC58B1F52C0F65E7CD11EDF28C0	2
575	291+000	-12.435688	-72.493025	0101000020E610000011C7BAB88D1F52C0F1845E7F12DF28C0	2
576	292+000	-12.435498	-72.4931	0101000020E6100000166A4DF38E1F52C063F20698F9DE28C0	2
577	293+000	-12.435352	-72.493205	0101000020E6100000514EB4AB901F52C0137F1475E6DE28C0	2
578	294+000	-12.435338	-72.493399	0101000020E6100000433866D9931F52C07F69519FE4DE28C0	2
579	295+000	-12.435389	-72.493832	0101000020E6100000F86D88F19A1F52C08813984EEBDE28C0	2
580	296+000	-12.435389	-72.494212	0101000020E61000009C525E2BA11F52C08813984EEBDE28C0	2
581	297+000	-12.435374	-72.494376	0101000020E610000059FB3BDBA31F52C0B20E4757E9DE28C0	2
582	298+000	-12.435513	-72.494608	0101000020E6100000C21550A8A71F52C038F7578FFBDE28C0	2
583	299+000	-12.435724	-72.494899	0101000020E6100000AEF4DA6CAC1F52C0242A543717DF28C0	2
584	300+000	-12.435841	-72.495116	0101000020E61000007CEE04FBAF1F52C00A83328D26DF28C0	2
585	301+000	-12.43587	-72.495332	0101000020E6100000632AFD84B31F52C0739D465A2ADF28C0	2
586	302+000	-12.435761	-72.495414	0101000020E6100000C1FEEBDCB41F52C098BED7101CDF28C0	2
587	303+000	-12.435586	-72.49531	0101000020E61000006FD8B628B31F52C0E030D12005DF28C0	2
588	304+000	-12.435345	-72.495228	0101000020E61000001004C8D0B11F52C049F4328AE5DE28C0	2
589	305+000	-12.434959	-72.495198	0101000020E6100000DBC2F352B11F52C0A43330F2B2DE28C0	2
590	306+000	-12.434696	-72.495145	0101000020E6100000C971A774B01F52C06F675F7990DE28C0	2
591	307+000	-12.434463	-72.495123	0101000020E6100000D61F6118B01F52C0E3A430EF71DE28C0	2
592	308+000	-12.434317	-72.495332	0101000020E6100000632AFD84B31F52C094313ECC5EDE28C0	2
593	309+000	-12.434201	-72.495571	0101000020E610000025766D6FB71F52C0EFC7ED974FDE28C0	2
594	310+000	-12.434011	-72.495713	0101000020E6100000EECC04C3B91F52C0613596B036DE28C0	2
595	311+000	-12.433909	-72.495907	0101000020E6100000E1B6B6F0BC1F52C050E1085229DE28C0	2
596	312+000	-12.433807	-72.496265	0101000020E6100000904946CEC21F52C03F8D7BF31BDE28C0	2
597	313+000	-12.433756	-72.496578	0101000020E6100000707A17EFC71F52C037E3344415DE28C0	2
598	314+000	-12.433792	-72.49687	0101000020E61000004417D4B7CC1F52C06A882AFC19DE28C0	2
599	315+000	-12.43369	-72.497071	0101000020E61000009032E202D01F52C059349D9D0CDE28C0	2
600	316+000	-12.433516	-72.497116	0101000020E61000006094A0BFD01F52C0E19524CFF5DD28C0	2
601	317+000	-12.433494	-72.497243	0101000020E61000008ECA4DD4D21F52C04206F2ECF2DD28C0	2
602	318+000	-12.433545	-72.497459	0101000020E61000007506465ED61F52C04BB0389CF9DD28C0	2
603	319+000	-12.433559	-72.497758	0101000020E6100000A2D45E44DB1F52C0DFC5FB71FBDD28C0	2
604	320+000	-12.433464	-72.498131	0101000020E6100000EC87D860E11F52C098FC4FFEEEDD28C0	2
605	321+000	-12.433362	-72.498415	0101000020E61000007E350708E61F52C087A8C29FE1DD28C0	2
606	322+000	-12.433319	-72.498818	0101000020E6100000FE2955A2EC1F52C08978EBFCDBDD28C0	2
607	323+000	-12.43326	-72.498952	0101000020E610000086915ED4EE1F52C076543541D4DD28C0	2
608	324+000	-12.4331	-72.498967	0101000020E610000020B24813EF1F52C092CB7F48BFDD28C0	2
609	325+000	-12.432808	-72.498997	0101000020E610000056F31C91EF1F52C0F3E49A0299DD28C0	2
610	326+000	-12.432517	-72.499184	0101000020E6100000EFAB72A1F21F52C096ED43DE72DD28C0	2
611	327+000	-12.432225	-72.499505	0101000020E610000010CCD1E3F71F52C0F7065F984CDD28C0	2
612	328+000	-12.431977	-72.499617	0101000020E6100000A4E194B9F91F52C0963FDF162CDD28C0	2
613	329+000	-12.431781	-72.499818	0101000020E6100000F0FCA204FD1F52C08011346612DD28C0	2
614	330+000	-12.431489	-72.499952	0101000020E61000007764AC36FF1F52C0E02A4F20ECDC28C0	2
615	331+000	-12.43109	-72.500133	0101000020E6100000A0A9D72D022052C0E94317D4B7DC28C0	2
616	332+000	-12.430799	-72.500267	0101000020E61000002711E15F042052C08C4CC0AF91DC28C0	2
617	333+000	-12.430769	-72.500324	0101000020E6100000DA59F44E052052C0E1421EC18DDC28C0	2
618	334+000	-12.430748	-72.500364	0101000020E61000002106BAF6052052C083A279008BDC28C0	2
619	335+000	-12.430762	-72.500558	0101000020E610000013F06B24092052C017B83CD68CDC28C0	2
620	336+000	-12.430828	-72.500797	0101000020E6100000D63BDC0E0D2052C0F566D47C95DC28C0	2
621	337+000	-12.430857	-72.501118	0101000020E6100000F75B3B51122052C05E81E84999DC28C0	2
622	338+000	-12.430937	-72.501297	0101000020E61000004E250340152052C0D04543C6A3DC28C0	2
623	339+000	-12.430959	-72.501551	0101000020E6100000AC915D69192052C06FD575A8A6DC28C0	2
624	340+000	-12.430996	-72.501663	0101000020E61000003FA7203F1B2052C0E469F981ABDC28C0	2
625	341+000	-12.43117	-72.501946	0101000020E6100000EA961DE21F2052C05B087250C2DC28C0	2
626	342+000	-12.431316	-72.502208	0101000020E610000088F2052D242052C0AB7B6473D5DC28C0	2
627	343+000	-12.431404	-72.502387	0101000020E6100000E0BBCD1B272052C028BA2EFCE0DC28C0	2
628	344+000	-12.431418	-72.502551	0101000020E61000009D64ABCB292052C0BCCFF1D1E2DC28C0	2
629	345+000	-12.431455	-72.50276	0101000020E61000002A6F47382D2052C0306475ABE7DC28C0	2
630	346+000	-12.431528	-72.502872	0101000020E6100000BE840A0E2F2052C0D89DEE3CF1DC28C0	2
631	347+000	-12.431615	-72.50282	0101000020E610000095F1EF332E2052C014ED2AA4FCDC28C0	2
632	348+000	-12.431564	-72.502618	0101000020E61000006118B0E42A2052C00B43E4F4F5DC28C0	2
633	349+000	-12.431491	-72.502402	0101000020E61000007BDCB75A272052C063096B63ECDC28C0	2
634	350+000	-12.431433	-72.502156	0101000020E61000005F5FEB52232052C091D442C9E4DC28C0	2
635	351+000	-12.431316	-72.501917	0101000020E61000009D137B681F2052C0AB7B6473D5DC28C0	2
636	352+000	-12.43117	-72.501648	0101000020E6100000A58636001B2052C05B087250C2DC28C0	2
637	353+000	-12.431105	-72.501491	0101000020E6100000410FB56D182052C0BF4868CBB9DC28C0	2
638	354+000	-12.431134	-72.501327	0101000020E61000008466D7BD152052C028637C98BDDC28C0	2
639	355+000	-12.431105	-72.501185	0101000020E6100000BB0F406A132052C0BF4868CBB9DC28C0	2
640	356+000	-12.431098	-72.500991	0101000020E6100000C8258E3C102052C0F5BD86E0B8DC28C0	2
641	357+000	-12.431098	-72.500692	0101000020E61000009B5775560B2052C0F5BD86E0B8DC28C0	2
642	358+000	-12.431207	-72.500491	0101000020E61000004F3C670B082052C0D09CF529C7DC28C0	2
643	359+000	-12.431353	-72.500401	0101000020E6100000AF78EA91062052C01F10E84CDADC28C0	2
644	360+000	-12.431491	-72.500327	0101000020E61000009293895B052052C063096B63ECDC28C0	2
645	361+000	-12.431579	-72.50026	0101000020E6100000CEDF8442042052C0E04735ECF7DC28C0	2
646	362+000	-12.431703	-72.500222	0101000020E610000057AF22A3032052C0912BF52C08DD28C0	2
647	363+000	-12.431878	-72.500177	0101000020E6100000874D64E6022052C049B9FB1C1FDD28C0	2
648	364+000	-12.432074	-72.50005	0101000020E61000005917B7D1002052C060E7A6CD38DD28C0	2
649	365+000	-12.432359	-72.499849	0101000020E61000000DFCA886FD1F52C03543AA285EDD28C0	2
650	366+000	-12.432679	-72.499603	0101000020E6100000F17EDC7EF91F52C0FC54151A88DD28C0	2
651	367+000	-12.432862	-72.499483	0101000020E61000001C7A8B87F71F52C0C05C8B16A0DD28C0	2
652	368+000	-12.433051	-72.499483	0101000020E61000001C7A8B87F71F52C00D0055DCB8DD28C0	2
653	369+000	-12.433248	-72.499446	0101000020E61000008E075BECF61F52C0651D8EAED2DD28C0	2
654	370+000	-12.433481	-72.499409	0101000020E6100000FF942A51F61F52C0F0DFBC38F1DD28C0	2
655	371+000	-12.433671	-72.499416	0101000020E610000058C6866EF61F52C07E7214200ADE28C0	2
656	372+000	-12.433744	-72.499341	0101000020E61000005323F433F51F52C026AC8DB113DE28C0	2
657	373+000	-12.433817	-72.49911	0101000020E6100000D2C6116BF11F52C0CDE506431DDE28C0	2
658	374+000	-12.433897	-72.498864	0101000020E6100000B6494563ED1F52C03FAA61BF27DE28C0	2
659	375+000	-12.434006	-72.49858	0101000020E6100000249C16BCE81F52C01A89D00836DE28C0	2
660	376+000	-12.434043	-72.498334	0101000020E6100000081F4AB4E41F52C08F1D54E23ADE28C0	2
661	377+000	-12.434094	-72.498199	0101000020E610000098F90E7EE21F52C097C79A9141DE28C0	2
662	378+000	-12.434247	-72.498147	0101000020E61000006F66F4A3E11F52C0B0C56E9F55DE28C0	2
663	379+000	-12.434422	-72.498147	0101000020E61000006F66F4A3E11F52C06953758F6CDE28C0	2
664	380+000	-12.434458	-72.498035	0101000020E6100000DB5031CEDF1F52C09CF86A4771DE28C0	2
665	381+000	-12.434385	-72.497938	0101000020E6100000E25B5837DE1F52C0F5BEF1B567DE28C0	2
666	382+000	-12.434276	-72.497781	0101000020E61000007EE4D6A4DB1F52C01AE0826C59DE28C0	2
667	383+000	-12.434283	-72.497617	0101000020E6100000C13BF9F4D81F52C0E46A64575ADE28C0	2
668	384+000	-12.434451	-72.497244	0101000020E610000076887FD8D21F52C0D26D895C70DE28C0	2
669	385+000	-12.434597	-72.496923	0101000020E610000055682096CD1F52C022E17B7F83DE28C0	2
670	386+000	-12.434735	-72.496759	0101000020E610000098BF42E6CA1F52C066DAFE9595DE28C0	2
671	387+000	-12.434837	-72.496781	0101000020E61000008C118942CB1F52C0772E8CF4A2DE28C0	2
672	388+000	-12.434859	-72.496893	0101000020E610000020274C18CD1F52C016BEBED6A5DE28C0	2
673	389+000	-12.434793	-72.496975	0101000020E61000007FFB3A70CE1F52C0390F27309DDE28C0	2
674	390+000	-12.434677	-72.497095	0101000020E610000054008C67D01F52C094A5D6FB8DDE28C0	2
675	391+000	-12.434633	-72.497192	0101000020E61000004DF564FED11F52C05586713788DE28C0	2
676	392+000	-12.434589	-72.497416	0101000020E61000007520EBA9D51F52C017670C7382DE28C0	2
677	393+000	-12.434524	-72.497654	0101000020E61000004FAE2990D91F52C07AA702EE79DE28C0	2
678	394+000	-12.434516	-72.497826	0101000020E61000004E469561DC1F52C06F2D93E178DE28C0	2
679	395+000	-12.434597	-72.497968	0101000020E6100000179D2CB5DE1F52C022E17B7F83DE28C0	2
680	396+000	-12.434633	-72.498087	0101000020E610000004E44BA8E01F52C05586713788DE28C0	2
681	397+000	-12.434713	-72.498222	0101000020E6100000740987DEE21F52C0C74ACCB392DE28C0	2
682	398+000	-12.434684	-72.498311	0101000020E61000002C0FD253E41F52C05E30B8E68EDE28C0	2
683	399+000	-12.434538	-72.498341	0101000020E61000006150A6D1E41F52C00EBDC5C37BDE28C0	2
684	400+000	-12.434356	-72.498341	0101000020E61000006150A6D1E41F52C08BA4DDE863DE28C0	2
685	401+000	-12.434261	-72.498476	0101000020E6100000D175E107E71F52C044DB317557DE28C0	2
686	402+000	-12.434254	-72.498707	0101000020E610000052D2C3D0EA1F52C07A50508A56DE28C0	2
687	403+000	-12.434181	-72.49911	0101000020E6100000D2C6116BF11F52C0D316D7F84CDE28C0	2
688	404+000	-12.43413	-72.499438	0101000020E61000004C18CDCAF61F52C0CA6C904946DE28C0	2
689	405+000	-12.434108	-72.499618	0101000020E61000008C9FC6BDF91F52C02BDD5D6743DE28C0	2
690	406+000	-12.434057	-72.499677	0101000020E61000000F643DB5FA1F52C0223317B83CDE28C0	2
691	407+000	-12.433933	-72.499707	0101000020E610000044A51133FB1F52C0724F57772CDE28C0	2
692	408+000	-12.433714	-72.499707	0101000020E610000044A51133FB1F52C07BA2EBC20FDE28C0	2
693	409+000	-12.433562	-72.499744	0101000020E6100000D31742CEFB1F52C0A393A5D6FBDD28C0	2
694	410+000	-12.433423	-72.499789	0101000020E6100000A379008BFC1F52C01DAB949EE9DD28C0	2
695	411+000	-12.433226	-72.499767	0101000020E6100000AF27BA2EFC1F52C0C58D5BCCCFDD28C0	2
696	412+000	-12.433037	-72.499819	0101000020E6100000D8BAD408FD1F52C079EA9106B7DD28C0	2
697	413+000	-12.432854	-72.499954	0101000020E610000048E00F3FFF1F52C0B5E21B0A9FDD28C0	2
698	414+000	-12.432592	-72.50014	0101000020E6100000F9DA334B022052C0C005D9B27CDD28C0	2
699	415+000	-12.432322	-72.500431	0101000020E6100000E5B9BE0F072052C0C0AE264F59DD28C0	2
700	416+000	-12.432147	-72.50064	0101000020E610000072C45A7C0A2052C00821205F42DD28C0	2
701	417+000	-12.432133	-72.500939	0101000020E61000009F9273620F2052C0740B5D8940DD28C0	2
702	418+000	-12.432162	-72.501208	0101000020E6100000971FB8CA132052C0DD25715644DD28C0	2
703	419+000	-12.432264	-72.501379	0101000020E6100000ADF9F197162052C0EE79FEB451DD28C0	2
704	420+000	-12.432322	-72.501543	0101000020E61000006AA2CF47192052C0C0AE264F59DD28C0	2
705	421+000	-12.432376	-72.501695	0101000020E6100000456458C51B2052C08D26176360DD28C0	2
706	422+000	-12.432484	-72.50182	0101000020E6100000A31EA2D11D2052C02716F88A6EDD28C0	2
707	423+000	-12.432551	-72.501899	0101000020E610000049B9FB1C1F2052C046B41D5377DD28C0	2
708	424+000	-12.432614	-72.501975	0101000020E6100000371AC05B202052C05F950B957FDD28C0	2
709	425+000	-12.432696	-72.502105	0101000020E61000001E8A027D222052C0543882548ADD28C0	2
710	426+000	-12.432824	-72.502313	0101000020E6100000C3D66CE5252052C00AD9791B9BDD28C0	2
711	427+000	-12.43295	-72.5025	0101000020E61000005C8FC2F5282052C03D9B559FABDD28C0	2
712	428+000	-12.432986	-72.502545	0101000020E61000002CF180B2292052C070404B57B0DD28C0	2
713	429+000	-12.433033	-72.502584	0101000020E61000008BDF14562A2052C0732D5A80B6DD28C0	2
714	430+000	-12.433091	-72.502616	0101000020E6100000919C4CDC2A2052C04562821ABEDD28C0	2
715	431+000	-12.433169	-72.502657	0101000020E6100000C00644882B2052C03448C153C8DD28C0	2
716	432+000	-12.433277	-72.50272	0101000020E6100000E3C281902C2052C0CE37A27BD6DD28C0	2
717	433+000	-12.433327	-72.502738	0101000020E6100000361D01DC2C2052C095F25A09DDDD28C0	2
718	434+000	-12.433363	-72.502736	0101000020E610000066A19DD32C2052C0C89750C1E1DD28C0	2
719	435+000	-12.433395	-72.502718	0101000020E610000013471E882C2052C0F67F0EF3E5DD28C0	2
720	436+000	-12.433398	-72.502698	0101000020E6100000EF703B342C2052C0BA4DB857E6DD28C0	2
721	437+000	-12.433401	-72.502673	0101000020E610000043E55FCB2B2052C07E1B62BCE6DD28C0	2
722	438+000	-12.433394	-72.502633	0101000020E6100000FC389A232B2052C0B49080D1E5DD28C0	2
723	439+000	-12.433362	-72.502608	0101000020E61000004FADBEBA2A2052C087A8C29FE1DD28C0	2
724	440+000	-12.433268	-72.502558	0101000020E6100000F69507E9292052C081CEA44DD5DD28C0	2
725	441+000	-12.433128	-72.502464	0101000020E6100000B6DAC35E282052C0BAF605F4C2DD28C0	2
726	442+000	-12.433061	-72.502383	0101000020E61000003FC4060B272052C09B58E02BBADD28C0	2
727	443+000	-12.433028	-72.502331	0101000020E61000001631EC30262052C02C8194D8B5DD28C0	2
728	444+000	-12.432943	-72.502198	0101000020E610000077871403242052C0731074B4AADD28C0	2
729	445+000	-12.432872	-72.502042	0101000020E6100000FBCDC474212052C04EB51666A1DD28C0	2
730	446+000	-12.432801	-72.501862	0101000020E6100000BB46CB811E2052C0295AB91798DD28C0	2
731	447+000	-12.432767	-72.501759	0101000020E610000051DEC7D11C2052C07993DFA293DD28C0	2
732	448+000	-12.432746	-72.501638	0101000020E6100000931B45D61A2052C01BF33AE290DD28C0	2
733	449+000	-12.432724	-72.501488	0101000020E610000088D51F61182052C07C6308008EDD28C0	2
734	450+000	-12.432706	-72.501394	0101000020E6100000481ADCD6162052C0E2900DA48BDD28C0	2
735	451+000	-12.432697	-72.50129	0101000020E6100000F5F3A622152052C0952710768ADD28C0	2
736	452+000	-12.432686	-72.501248	0101000020E6100000DECB7D72142052C0C6DFF60489DD28C0	2
737	453+000	-12.432666	-72.501209	0101000020E61000007FDDE9CE132052C0A92EE06586DD28C0	2
738	454+000	-12.432619	-72.501113	0101000020E61000006EA6423C122052C0A741D13C80DD28C0	2
739	455+000	-12.432596	-72.501059	0101000020E61000007497C459112052C0C6C210397DDD28C0	2
740	456+000	-12.432588	-72.500926	0101000020E6100000D5EDEC2B0F2052C0BB48A12C7CDD28C0	2
741	457+000	-12.432661	-72.500687	0101000020E610000012A27C410B2052C062821ABE85DD28C0	2
742	458+000	-12.432792	-72.500501	0101000020E610000061A75835082052C0DCF0BBE996DD28C0	2
743	459+000	-12.432982	-72.500359	0101000020E61000009850C1E1052052C06B8313D1AFDD28C0	2
744	460+000	-12.433171	-72.500254	0101000020E61000005D6C5A29042052C0B726DD96C8DD28C0	2
745	461+000	-12.433339	-72.500292	0101000020E6100000D49CBCC8042052C0A629029CDEDD28C0	2
746	462+000	-12.433492	-72.500359	0101000020E61000009850C1E1052052C0BF27D6A9F2DD28C0	2
747	463+000	-12.433572	-72.500448	0101000020E610000050560C57072052C031EC3026FDDD28C0	2
748	464+000	-12.433711	-72.500598	0101000020E61000005A9C31CC092052C0B7D4415E0FDE28C0	2
749	465+000	-12.433835	-72.500642	0101000020E61000004240BE840A2052C067B8019F1FDE28C0	2
750	466+000	-12.43401	-72.500628	0101000020E610000090DD054A0A2052C02046088F36DE28C0	2
751	467+000	-12.434177	-72.50059	0101000020E610000019ADA3AA092052C0CD599F724CDE28C0	2
752	468+000	-12.434373	-72.500589	0101000020E610000031EF71A6092052C0E4874A2366DE28C0	2
753	469+000	-12.434524	-72.500593	0101000020E6100000D1E638B7092052C07AA702EE79DE28C0	2
754	470+000	-12.434657	-72.500634	0101000020E6100000015130630A2052C077F4BF5C8BDE28C0	2
755	471+000	-12.434767	-72.500739	0101000020E61000003B35971B0C2052C094C2BCC799DE28C0	2
756	472+000	-12.434949	-72.500791	0101000020E610000065C8B1F50C2052C016DBA4A2B1DE28C0	2
757	473+000	-12.435153	-72.500828	0101000020E6100000F33AE2900D2052C03883BF5FCCDE28C0	2
758	474+000	-12.435248	-72.500776	0101000020E6100000CAA7C7B60C2052C07F4C6BD3D8DE28C0	2
759	475+000	-12.435342	-72.500761	0101000020E61000002F87DD770C2052C085268925E5DE28C0	2
760	476+000	-12.435408	-72.500701	0101000020E6100000C504357C0B2052C063D520CCEDDE28C0	2
761	477+000	-12.435539	-72.500664	0101000020E6100000369204E10A2052C0DD43C2F7FEDE28C0	2
762	478+000	-12.435787	-72.500664	0101000020E6100000369204E10A2052C03D0B42791FDF28C0	2
763	479+000	-12.435984	-72.500746	0101000020E61000009566F3380C2052C095287B4B39DF28C0	2
764	480+000	-12.436093	-72.500821	0101000020E61000009A0986730D2052C07007EA9447DF28C0	2
765	481+000	-12.436239	-72.500843	0101000020E61000008E5BCCCF0D2052C0C07ADCB75ADF28C0	2
766	482+000	-12.436305	-72.501	0101000020E6100000F2D24D62102052C09E29745E63DF28C0	2
767	483+000	-12.436414	-72.501149	0101000020E6100000145B41D3122052C07808E3A771DF28C0	2
768	484+000	-12.436604	-72.501433	0101000020E6100000A708707A172052C0079B3A8F8ADF28C0	2
769	485+000	-12.436654	-72.501642	0101000020E610000034130CE71A2052C0CE55F31C91DF28C0	2
770	486+000	-12.436676	-72.501776	0101000020E6100000BC7A15191D2052C06DE525FF93DF28C0	2
771	487+000	-12.436837	-72.501873	0101000020E6100000B56FEEAF1E2052C0925D6919A9DF28C0	2
772	488+000	-12.436844	-72.50206	0101000020E61000004E2844C0212052C05CE84A04AADF28C0	2
773	489+000	-12.43691	-72.502246	0101000020E6100000FF2268CC242052C03997E2AAB2DF28C0	2
774	490+000	-12.437158	-72.502478	0101000020E6100000683D7C99282052C09A5E622CD3DF28C0	2
775	491+000	-12.437442	-72.502642	0101000020E610000025E659492B2052C02ECBD765F8DF28C0	2
776	492+000	-12.437646	-72.502806	0101000020E6100000E38E37F92D2052C05073F22213E028C0	2
777	493+000	-12.437821	-72.502978	0101000020E6100000E126A3CA302052C00801F9122AE028C0	2
778	494+000	-12.437967	-72.503008	0101000020E610000016687748312052C05874EB353DE028C0	2
779	495+000	-12.43812	-72.50303	0101000020E61000000ABABDA4312052C07172BF4351E028C0	2
780	496+000	-12.438309	-72.503112	0101000020E6100000698EACFC322052C0BE1589096AE028C0	2
781	497+000	-12.438484	-72.50315	0101000020E6100000E0BE0E9C332052C077A38FF980E028C0	2
782	498+000	-12.438608	-72.503105	0101000020E6100000105D50DF322052C027874F3A91E028C0	2
783	499+000	-12.438608	-72.503	0101000020E6100000D578E926312052C027874F3A91E028C0	2
784	500+000	-12.438531	-72.502952	0101000020E61000004CDD955D302052C079909E2287E028C0	2
785	501+000	-12.438305	-72.502907	0101000020E61000007C7BD7A02F2052C0B858518369E028C0	2
786	502+000	-12.438138	-72.502854	0101000020E61000006B2A8BC22E2052C00B45BA9F53E028C0	2
787	503+000	-12.437992	-72.502817	0101000020E6100000DCB75A272E2052C0BBD1C77C40E028C0	2
788	504+000	-12.437897	-72.502713	0101000020E61000008A9125732C2052C074081C0934E028C0	2
789	505+000	-12.437788	-72.502556	0101000020E6100000261AA4E0292052C09929ADBF25E028C0	2
790	506+000	-12.437693	-72.502392	0101000020E61000006971C630272052C05260014C19E028C0	2
791	507+000	-12.437569	-72.502317	0101000020E610000064CE33F6252052C0A27C410B09E028C0	2
792	508+000	-12.437489	-72.50216	0101000020E61000000057B263232052C030B8E68EFEDF28C0	2
793	509+000	-12.437402	-72.501877	0101000020E61000005567B5C01E2052C0F568AA27F3DF28C0	2
794	510+000	-12.437329	-72.501593	0101000020E6100000C3B986191A2052C04D2F3196E9DF28C0	2
795	511+000	-12.437175	-72.501312	0101000020E6100000E945ED7E152052C0F241CF66D5DF28C0	2
796	512+000	-12.437168	-72.50064	0101000020E610000072C45A7C0A2052C028B7ED7BD4DF28C0	2
797	513+000	-12.437234	-72.500371	0101000020E61000007A371614062052C006668522DDDF28C0	2
798	514+000	-12.437299	-72.500259	0101000020E6100000E621533E042052C0A2258FA7E5DF28C0	2
799	515+000	-12.43743	-72.50014	0101000020E6100000F9DA334B022052C01D9430D3F6DF28C0	2
800	516+000	-12.437438	-72.50005	0101000020E61000005917B7D1002052C0280EA0DFF7DF28C0	2
801	517+000	-12.437314	-72.50002	0101000020E610000024D6E253002052C0782AE09EE7DF28C0	2
802	518+000	-12.437139	-72.499998	0101000020E610000030849CF7FF1F52C0BF9CD9AED0DF28C0	2
803	519+000	-12.437008	-72.499879	0101000020E6100000433D7D04FE1F52C0452E3883BFDF28C0	2
804	520+000	-12.436935	-72.499744	0101000020E6100000D31742CEFB1F52C09DF4BEF1B5DF28C0	2
805	521+000	-12.436869	-72.499602	0101000020E610000009C1AA7AF91F52C0BF45274BADDF28C0	2
806	522+000	-12.436767	-72.499543	0101000020E610000087FC3383F81F52C0AEF199EC9FDF28C0	2
807	523+000	-12.43657	-72.499468	0101000020E61000008159A148F71F52C056D4601A86DF28C0	2
808	524+000	-12.436461	-72.499371	0101000020E61000008864C8B1F51F52C07BF5F1D077DF28C0	2
809	525+000	-12.436447	-72.499284	0101000020E6100000A1DAE044F41F52C0E7DF2EFB75DF28C0	2
810	526+000	-12.436418	-72.49921	0101000020E610000084F57F0EF31F52C07EC51A2E72DF28C0	2
811	527+000	-12.436421	-72.499126	0101000020E610000055A52DAEF11F52C04293C49272DF28C0	2
812	528+000	-12.436393	-72.499011	0101000020E61000000856D5CBEF1F52C01B683EE76EDF28C0	2
813	529+000	-12.436429	-72.498884	0101000020E6100000DA1F28B7ED1F52C04E0D349F73DF28C0	2
814	530+000	-12.436568	-72.498772	0101000020E6100000460A65E1EB1F52C0D3F544D785DF28C0	2
815	531+000	-12.436655	-72.498661	0101000020E61000009AB2D30FEA1F52C00F45813E91DF28C0	2
816	532+000	-12.43675	-72.498549	0101000020E6100000069D103AE81F52C0560E2DB29DDF28C0	2
817	533+000	-12.436925	-72.498444	0101000020E6100000CCB8A981E61F52C00F9C33A2B4DF28C0	2
818	534+000	-12.437166	-72.498377	0101000020E61000000805A568E51F52C0A5D8D138D4DF28C0	2
819	535+000	-12.437282	-72.498362	0101000020E61000006DE4BA29E51F52C04A42226DE3DF28C0	2
820	536+000	-12.437326	-72.498459	0101000020E610000066D993C0E61F52C089618731E9DF28C0	2
821	537+000	-12.437231	-72.498511	0101000020E61000008F6CAE9AE71F52C04298DBBDDCDF28C0	2
822	538+000	-12.4371	-72.498586	0101000020E6100000950F41D5E81F52C0C7293A92CBDF28C0	2
823	539+000	-12.437027	-72.498713	0101000020E6100000C345EEE9EA1F52C020F0C000C2DF28C0	2
824	540+000	-12.436954	-72.498877	0101000020E610000080EECB99ED1F52C078B6476FB8DF28C0	2
825	541+000	-12.436969	-72.499064	0101000020E61000001AA721AAF01F52C04DBB9866BADF28C0	2
826	542+000	-12.437054	-72.499153	0101000020E6100000D2AC6C1FF21F52C0062CB98AC5DF28C0	2
827	543+000	-12.437193	-72.499234	0101000020E610000048C32973F31F52C08C14CAC2D7DF28C0	2
828	544+000	-12.437279	-72.499296	0101000020E610000083C13577F41F52C086747808E3DF28C0	2
829	545+000	-12.437361	-72.499354	0101000020E61000001DC87A6AF51F52C07A17EFC7EDDF28C0	2
830	546+000	-12.437499	-72.499466	0101000020E6100000B1DD3D40F71F52C0BF1072DEFFDF28C0	2
831	547+000	-12.437681	-72.499562	0101000020E6100000C214E5D2F81F52C041295AB917E028C0	2
832	548+000	-12.437849	-72.499585	0101000020E61000009E245D33F91F52C0302C7FBE2DE028C0	2
833	549+000	-12.43806	-72.499607	0101000020E61000009276A38FF91F52C01C5F7B6649E028C0	2
834	550+000	-12.438243	-72.499555	0101000020E610000069E388B5F81F52C0E066F16261E028C0	2
835	551+000	-12.438366	-72.499533	0101000020E610000075914259F81F52C04F5B238271E028C0	2
836	552+000	-12.43841	-72.4996	0101000020E610000039454772F91F52C08D7A884677E028C0	2
837	553+000	-12.438345	-72.499674	0101000020E6100000562AA8A8FA1F52C0F1BA7EC16EE028C0	2
838	554+000	-12.438221	-72.499809	0101000020E6100000C64FE3DEFC1F52C041D7BE805EE028C0	2
839	555+000	-12.438053	-72.499988	0101000020E61000001E19ABCDFF1F52C052D4997B48E028C0	2
840	556+000	-12.437951	-72.500145	0101000020E610000082902C60022052C041800C1D3BE028C0	2
841	557+000	-12.437912	-72.500305	0101000020E61000009E4143FF042052C04A0D6D0036E028C0	2
842	558+000	-12.437922	-72.500406	0101000020E6100000382EE3A6062052C0D865F84F37E028C0	2
843	559+000	-12.437995	-72.500548	0101000020E610000001857AFA082052C0809F71E140E028C0	2
844	560+000	-12.438075	-72.500757	0101000020E61000008E8F16670C2052C0F163CC5D4BE028C0	2
845	561+000	-12.438206	-72.500906	0101000020E6100000B1170AD80E2052C06BD26D895CE028C0	2
846	562+000	-12.438461	-72.50107	0101000020E61000006EC0E787112052C09624CFF57DE028C0	2
847	563+000	-12.438797	-72.501227	0101000020E6100000D237691A142052C0732A1900AAE028C0	2
848	564+000	-12.439001	-72.501272	0101000020E6100000A29927D7142052C095D233BDC4E028C0	2
849	565+000	-12.439132	-72.501227	0101000020E6100000D237691A142052C01041D5E8D5E028C0	2
850	566+000	-12.439278	-72.50116	0101000020E61000000E846401132052C05FB4C70BE9E028C0	2
851	567+000	-12.439456	-72.501074	0101000020E61000000FB8AE98112052C0DC0F786000E128C0	2
852	568+000	-12.439561	-72.501188	0101000020E61000007349D576132052C0B131AF230EE128C0	2
853	569+000	-12.439604	-72.501244	0101000020E61000003DD4B661142052C0AE6186C613E128C0	2
854	570+000	-12.439663	-72.501299	0101000020E61000001FA16648152052C0C2853C821BE128C0	2
855	571+000	-12.439812	-72.501347	0101000020E6100000A73CBA11162052C0D6C6D8092FE128C0	2
856	572+000	-12.439889	-72.501366	0101000020E6100000E3546B61162052C084BD892139E128C0	2
857	573+000	-12.44002	-72.501378	0101000020E6100000C53BC093162052C0FE2B2B4D4AE128C0	2
858	574+000	-12.44013	-72.501359	0101000020E610000089230F44162052C01AFA27B858E128C0	2
859	575+000	-12.44026	-72.501303	0101000020E6100000BF982D59152052C053793BC269E128C0	2
860	576+000	-12.44031	-72.501291	0101000020E6100000DDB1D826152052C01A34F44F70E128C0	2
861	577+000	-12.440351	-72.501304	0101000020E6100000A8565F5D152052C09485AFAF75E128C0	2
862	578+000	-12.440388	-72.501317	0101000020E610000072FBE593152052C0091A33897AE128C0	2
863	579+000	-12.440408	-72.501329	0101000020E610000054E23AC6152052C025CB49287DE128C0	2
864	580+000	-12.440472	-72.501381	0101000020E61000007D7555A0162052C0809BC58B85E128C0	2
865	581+000	-12.440582	-72.501476	0101000020E6100000A6EECA2E182052C09C69C2F693E128C0	2
866	582+000	-12.440693	-72.501553	0101000020E61000007C0DC171192052C0FA264D83A2E128C0	2
867	583+000	-12.440721	-72.501563	0101000020E61000008E78B29B192052C02252D32EA6E128C0	2
868	584+000	-12.440755	-72.501554	0101000020E610000064CBF275192052C0D218ADA3AAE128C0	2
869	585+000	-12.440767	-72.501535	0101000020E610000029B34126192052C0E34F5436ACE128C0	2
870	586+000	-12.440777	-72.501482	0101000020E61000001762F547182052C072A8DF85ADE128C0	2
871	587+000	-12.440776	-72.501436	0101000020E61000005F420587172052C030B95164ADE128C0	2
872	588+000	-12.440748	-72.501398	0101000020E6100000E811A3E7162052C0088ECBB8A9E128C0	2
873	589+000	-12.440695	-72.50136	0101000020E610000072E14048162052C07D0569C6A2E128C0	2
874	590+000	-12.440576	-72.501306	0101000020E610000078D2C265152052C014CE6E2D93E128C0	2
875	591+000	-12.440464	-72.501231	0101000020E6100000732F302B142052C07521567F84E128C0	2
876	592+000	-12.440395	-72.501188	0101000020E61000007349D576132052C0D3A414747BE128C0	2
877	593+000	-12.440338	-72.501176	0101000020E610000091628044132052C0425F7AFB73E128C0	2
878	594+000	-12.44031	-72.501183	0101000020E6100000EA93DC61132052C01A34F44F70E128C0	2
879	595+000	-12.440257	-72.501197	0101000020E61000009DF6949C132052C08FAB915D69E128C0	2
880	596+000	-12.440156	-72.501239	0101000020E6100000B41EBE4C142052C0BF4692205CE128C0	2
881	597+000	-12.440051	-72.501271	0101000020E6100000BADBF5D2142052C0EA245B5D4EE128C0	2
882	598+000	-12.439955	-72.501268	0101000020E610000001A260C6142052C0616C21C841E128C0	2
883	599+000	-12.439841	-72.501224	0101000020E610000019FED30D142052C03FE1ECD632E128C0	2
884	600+000	-12.439758	-72.501165	0101000020E610000097395D16132052C0094FE8F527E128C0	2
885	601+000	-12.439695	-72.501079	0101000020E6100000986DA7AD112052C0F06DFAB31FE128C0	2
886	602+000	-12.439572	-72.500914	0101000020E6100000F20698F90E2052C08179C8940FE128C0	2
887	603+000	-12.439511	-72.500839	0101000020E6100000ED6305BF0D2052C0EA76F69507E128C0	2
888	604+000	-12.439255	-72.500936	0101000020E6100000E658DE550F2052C07E350708E6E028C0	2
889	605+000	-12.439153	-72.500869	0101000020E610000022A5D93C0E2052C06DE179A9D8E028C0	2
890	606+000	-12.439081	-72.500754	0101000020E6100000D655815A0C2052C007978E39CFE028C0	2
891	607+000	-12.439043	-72.500637	0101000020E6100000B98AC56F0A2052C051137D3ECAE028C0	2
892	608+000	-12.438898	-72.500466	0101000020E6100000A3B08BA2072052C0438F183DB7E028C0	2
893	609+000	-12.438759	-72.500302	0101000020E6100000E607AEF2042052C0BDA60705A5E028C0	2
894	610+000	-12.438686	-72.500107	0101000020E61000000B60CAC0012052C0166D8E739BE028C0	2
895	611+000	-12.438695	-72.499937	0101000020E6100000DD43C2F7FE1F52C062D68BA19CE028C0	2
896	612+000	-12.438723	-72.499809	0101000020E6100000C64FE3DEFC1F52C08A01124DA0E028C0	2
897	613+000	-12.438817	-72.499734	0101000020E6100000C1AC50A4FB1F52C090DB2F9FACE028C0	2
898	614+000	-12.438985	-72.499801	0101000020E6100000856055BDFC1F52C07FDE54A4C2E028C0	2
899	615+000	-12.439138	-72.499749	0101000020E61000005BCD3AE3FB1F52C098DC28B2D6E028C0	2
900	616+000	-12.439306	-72.499637	0101000020E6100000C8B7770DFA1F52C087DF4DB7ECE028C0	2
901	617+000	-12.439357	-72.49951	0101000020E61000009981CAF8F71F52C08F899466F3E028C0	2
902	618+000	-12.439233	-72.499331	0101000020E610000041B8020AF51F52C0DFA5D425E3E028C0	2
903	619+000	-12.439058	-72.499204	0101000020E6100000138255F5F21F52C02618CE35CCE028C0	2
904	620+000	-12.438956	-72.499107	0101000020E6100000198D7C5EF11F52C015C440D7BEE028C0	2
905	621+000	-12.438919	-72.498913	0101000020E610000027A3CA30EE1F52C0A12FBDFDB9E028C0	2
906	622+000	-12.438941	-72.49877	0101000020E6100000758E01D9EB1F52C040BFEFDFBCE028C0	2
907	623+000	-12.438956	-72.498674	0101000020E610000064575A46EA1F52C015C440D7BEE028C0	2
908	624+000	-12.439189	-72.498271	0101000020E6100000E5620CACE31F52C0A1866F61DDE028C0	2
909	625+000	-12.439488	-72.497935	0101000020E61000002922C32ADE1F52C00AF8359204E128C0	2
910	626+000	-12.439743	-72.497637	0101000020E6100000E411DC48D91F52C0344A97FE25E128C0	2
911	627+000	-12.439904	-72.497681	0101000020E6100000CCB56801DA1F52C059C2DA183BE128C0	2
912	628+000	-12.440159	-72.497696	0101000020E610000067D65240DA1F52C083143C855CE128C0	2
913	629+000	-12.440574	-72.497808	0101000020E6100000FBEB1516DC1F52C091EF52EA92E128C0	2
914	630+000	-12.440822	-72.497778	0101000020E6100000C5AA4198DB1F52C0F2B6D26BB3E128C0	2
915	631+000	-12.441259	-72.497644	0101000020E61000003D433866D91F52C09F211CB3ECE128C0	2
916	632+000	-12.441529	-72.497517	0101000020E61000000F0D8B51D71F52C09E78CE1610E228C0	2
917	633+000	-12.441784	-72.497458	0101000020E61000008C48145AD61F52C0C9CA2F8331E228C0	2
918	634+000	-12.442039	-72.497428	0101000020E6100000570740DCD51F52C0F31C91EF52E228C0	2
919	635+000	-12.442229	-72.497271	0101000020E6100000F38FBE49D31F52C081AFE8D66BE228C0	2
920	636+000	-12.442579	-72.49701	0101000020E61000003DF20703CF1F52C0F3CAF5B699E228C0	2
921	637+000	-12.442841	-72.496733	0101000020E610000004763579CA1F52C0E7A7380EBCE228C0	2
922	638+000	-12.442965	-72.496554	0101000020E6100000ACAC6D8AC71F52C0978BF84ECCE228C0	2
923	639+000	-12.443344	-72.49642	0101000020E610000024456458C51F52C072C119FCFDE228C0	2
924	640+000	-12.443628	-72.49642	0101000020E610000024456458C51F52C0062E8F3523E328C0	2
925	641+000	-12.443898	-72.496398	0101000020E610000030F31DFCC41F52C00685419946E328C0	2
926	642+000	-12.444	-72.496286	0101000020E61000009CDD5A26C31F52C017D9CEF753E328C0	2
927	643+000	-12.444182	-72.496092	0101000020E6100000AAF3A8F8BF1F52C099F1B6D26BE328C0	2
928	644+000	-12.444343	-72.49592	0101000020E6100000AB5B3D27BD1F52C0BE69FAEC80E328C0	2
929	645+000	-12.444539	-72.495868	0101000020E610000082C8224DBC1F52C0D597A59D9AE328C0	2
930	646+000	-12.444612	-72.495681	0101000020E6100000E90FCD3CB91F52C07CD11E2FA4E328C0	2
931	647+000	-12.44462	-72.495472	0101000020E61000005C0531D0B51F52C0884B8E3BA5E328C0	2
932	648+000	-12.444678	-72.495323	0101000020E6100000397D3D5FB31F52C05A80B6D5ACE328C0	2
933	649+000	-12.44486	-72.495256	0101000020E610000075C93846B21F52C0DD989EB0C4E328C0	2
934	650+000	-12.445057	-72.495158	0101000020E610000094162EABB01F52C035B6D782DEE328C0	2
935	651+000	-12.445239	-72.49492	0101000020E6100000B988EFC4AC1F52C0B8CEBF5DF6E328C0	2
936	652+000	-12.445436	-72.494897	0101000020E6100000DD787764AC1F52C010ECF82F10E428C0	2
937	653+000	-12.445633	-72.494882	0101000020E610000043588D25AC1F52C0680932022AE428C0	2
938	654+000	-12.445757	-72.494957	0101000020E610000048FB1F60AD1F52C018EDF1423AE428C0	2
939	655+000	-12.445895	-72.495024	0101000020E61000000CAF2479AE1F52C05CE674594CE428C0	2
940	656+000	-12.446004	-72.494964	0101000020E6100000A12C7C7DAD1F52C037C5E3A25AE428C0	2
941	657+000	-12.446158	-72.494852	0101000020E61000000D17B9A7AB1F52C092B245D26EE428C0	2
942	658+000	-12.446296	-72.494815	0101000020E61000007FA4880CAB1F52C0D6ABC8E880E428C0	2
943	659+000	-12.446376	-72.494673	0101000020E6100000B64DF1B8A81F52C0487023658BE428C0	2
944	660+000	-12.446369	-72.494427	0101000020E61000009AD024B1A41F52C07EE5417A8AE428C0	2
945	661+000	-12.446347	-72.494128	0101000020E61000006D020CCB9F1F52C0DE550F9887E428C0	2
946	662+000	-12.446391	-72.493949	0101000020E6100000153944DC9C1F52C01D75745C8DE428C0	2
947	663+000	-12.446471	-72.493919	0101000020E6100000E0F76F5E9C1F52C08F39CFD897E428C0	2
948	664+000	-12.446566	-72.493815	0101000020E61000008DD13AAA9A1F52C0D6027B4CA4E428C0	2
949	665+000	-12.446668	-72.493748	0101000020E6100000C91D3691991F52C0E75608ABB1E428C0	2
950	666+000	-12.446865	-72.493733	0101000020E61000002FFD4B52991F52C03F74417DCBE428C0	2
951	667+000	-12.446967	-72.493666	0101000020E61000006B494739981F52C050C8CEDBD8E428C0	2
952	668+000	-12.447069	-72.493419	0101000020E6100000670E492D941F52C0611C5C3AE6E428C0	2
953	669+000	-12.447244	-72.493255	0101000020E6100000AA656B7D911F52C019AA622AFDE428C0	2
954	670+000	-12.44736	-72.493046	0101000020E61000001D5BCF108E1F52C0BE13B35E0CE528C0	2
955	671+000	-12.447426	-72.492792	0101000020E6100000BFEE74E7891F52C09CC24A0515E528C0	2
956	672+000	-12.447542	-72.492598	0101000020E6100000CD04C3B9861F52C0412C9B3924E528C0	2
957	673+000	-12.447637	-72.492456	0101000020E610000004AE2B66841F52C088F546AD30E528C0	2
958	674+000	-12.447834	-72.492352	0101000020E6100000B187F6B1821F52C0E012807F4AE528C0	2
959	675+000	-12.448024	-72.492367	0101000020E61000004CA8E0F0821F52C06EA5D76663E528C0	2
960	676+000	-12.448031	-72.492508	0101000020E61000002D414640851F52C03830B95164E528C0	2
961	677+000	-12.447916	-72.492602	0101000020E61000006EFC89CA861F52C0D4B5F63E55E528C0	2
962	678+000	-12.44771	-72.492707	0101000020E6100000A8E0F082881F52C0302FC03E3AE528C0	2
963	679+000	-12.447576	-72.492813	0101000020E6100000CB82893F8A1F52C0F1F274AE28E528C0	2
964	680+000	-12.447524	-72.492982	0101000020E610000011E15F048D1F52C0A759A0DD21E528C0	2
965	681+000	-12.447483	-72.493193	0101000020E61000006F675F79901F52C02D08E57D1CE528C0	2
966	682+000	-12.447338	-72.493457	0101000020E6100000DE3EABCC941F52C01F84807C09E528C0	2
967	683+000	-12.447277	-72.493721	0101000020E61000004C16F71F991F52C08881AE7D01E528C0	2
968	684+000	-12.447153	-72.493837	0101000020E6100000812381069B1F52C0D89DEE3CF1E428C0	2
969	685+000	-12.446947	-72.493848	0101000020E61000007B4CA4349B1F52C03317B83CD6E428C0	2
970	686+000	-12.446823	-72.493869	0101000020E610000087E0B88C9B1F52C08333F8FBC5E428C0	2
971	687+000	-12.44672	-72.494027	0101000020E6100000D3156C239E1F52C030F0DC7BB8E428C0	2
972	688+000	-12.446689	-72.494164	0101000020E610000013B70A62A01F52C044F7AC6BB4E428C0	2
973	689+000	-12.446751	-72.494386	0101000020E61000006B662D05A41F52C01DE90C8CBCE428C0	2
974	690+000	-12.446802	-72.494766	0101000020E61000000E4B033FAA1F52C02593533BC3E428C0	2
975	691+000	-12.446802	-72.494956	0101000020E6100000603DEE5BAD1F52C02593533BC3E428C0	2
976	692+000	-12.44673	-72.495083	0101000020E61000008E739B70AF1F52C0BF4868CBB9E428C0	2
977	693+000	-12.446524	-72.495283	0101000020E6100000F2D077B7B21F52C01AC231CB9EE428C0	2
978	694+000	-12.446297	-72.495642	0101000020E61000008A213999B81F52C0179B560A81E428C0	2
979	695+000	-12.446102	-72.4958	0101000020E6100000D656EC2FBB1F52C0425C397B67E428C0	2
980	696+000	-12.445937	-72.495906	0101000020E6100000F9F884ECBC1F52C01827BEDA51E428C0	2
981	697+000	-12.445741	-72.495906	0101000020E6100000F9F884ECBC1F52C001F9122A38E428C0	2
982	698+000	-12.445555	-72.496064	0101000020E6100000452E3883BF1F52C07923F3C81FE428C0	2
983	699+000	-12.445462	-72.496307	0101000020E6100000A8716F7EC31F52C0B438639813E428C0	2
984	700+000	-12.445462	-72.496529	0101000020E6100000FF209221C71F52C0B438639813E428C0	2
985	701+000	-12.445359	-72.496592	0101000020E610000023DDCF29C81F52C062F5471806E428C0	2
986	702+000	-12.445256	-72.496539	0101000020E6100000118C834BC71F52C010B22C98F8E328C0	2
987	703+000	-12.445133	-72.496571	0101000020E61000001749BBD1C71F52C0A1BDFA78E8E328C0	2
988	704+000	-12.444972	-72.496676	0101000020E6100000512D228AC91F52C07C45B75ED3E328C0	2
989	705+000	-12.444738	-72.49687	0101000020E61000004417D4B7CC1F52C0AF93FAB2B4E328C0	2
990	706+000	-12.444549	-72.497244	0101000020E610000076887FD8D21F52C063F030ED9BE328C0	2
991	707+000	-12.444374	-72.497468	0101000020E61000009EB30584D61F52C0AA622AFD84E328C0	2
992	708+000	-12.444155	-72.497497	0101000020E6100000EB36A8FDD61F52C0B3B5BE4868E328C0	2
993	709+000	-12.443806	-72.497423	0101000020E6100000CE5147C7D51F52C083893F8A3AE328C0	2
994	710+000	-12.44366	-72.497482	0101000020E61000005116BEBED61F52C033164D6727E328C0	2
995	711+000	-12.443558	-72.497692	0101000020E6100000C6DE8B2FDA1F52C022C2BF081AE328C0	2
996	712+000	-12.443383	-72.497915	0101000020E6100000064CE0D6DD1F52C06A34B91803E328C0	2
997	713+000	-12.443091	-72.49793	0101000020E6100000A06CCA15DE1F52C0CB4DD4D2DCE228C0	2
998	714+000	-12.442924	-72.498051	0101000020E61000005E2F4D11E01F52C01D3A3DEFC6E228C0	2
999	715+000	-12.442522	-72.498252	0101000020E6100000A94A5B5CE31F52C062855B3E92E228C0	2
1000	716+000	-12.442243	-72.498346	0101000020E6100000EA059FE6E41F52C015C5ABAC6DE228C0	2
1001	717+000	-12.442027	-72.498674	0101000020E610000064575A46EA1F52C0E2E5E95C51E228C0	2
1002	718+000	-12.441996	-72.49899	0101000020E6100000FDC1C073EF1F52C0F6ECB94C4DE228C0	2
1003	719+000	-12.442089	-72.49937	0101000020E6100000A0A696ADF51F52C0BAD7497D59E228C0	2
1004	720+000	-12.442284	-72.499582	0101000020E6100000E6EAC726F91F52C09016670C73E228C0	2
1005	721+000	-12.442508	-72.499717	0101000020E61000005610035DFB1F52C0CE6F986890E228C0	2
1006	722+000	-12.442771	-72.499717	0101000020E61000005610035DFB1F52C0043C69E1B2E228C0	2
1007	723+000	-12.442975	-72.499702	0101000020E6100000BBEF181EFB1F52C026E4839ECDE228C0	2
1008	724+000	-12.443157	-72.499777	0101000020E6100000C092AB58FC1F52C0A8FC6B79E5E228C0	2
1009	725+000	-12.443616	-72.499934	0101000020E6100000240A2DEBFE1F52C0F5F6E7A221E328C0	2
1010	726+000	-12.443879	-72.500031	0101000020E61000001EFF0582002052C02BC3B81B44E328C0	2
1011	727+000	-12.444046	-72.500038	0101000020E61000007730629F002052C0D8D64FFF59E328C0	2
1012	728+000	-12.444112	-72.499956	0101000020E6100000185C7347FF1F52C0B685E7A562E328C0	2
1013	729+000	-12.444046	-72.499874	0101000020E6100000BA8784EFFD1F52C0D8D64FFF59E328C0	2
1014	730+000	-12.443923	-72.499844	0101000020E61000008446B071FD1F52C069E21DE049E328C0	2
1015	731+000	-12.443748	-72.499874	0101000020E6100000BA8784EFFD1F52C0B05417F032E328C0	2
1016	732+000	-12.443595	-72.499792	0101000020E61000005BB39597FC1F52C0975643E21EE328C0	2
1017	733+000	-12.443412	-72.499702	0101000020E6100000BBEF181EFB1F52C0D34ECDE506E328C0	2
1018	734+000	-12.443309	-72.499632	0101000020E61000003F027FF8F91F52C0800BB265F9E228C0	2
1019	735+000	-12.443234	-72.499611	0101000020E6100000336E6AA0F91F52C056F31C91EFE228C0	2
1020	736+000	-12.443102	-72.499551	0101000020E6100000C8EBC1A4F81F52C09A95ED43DEE228C0	2
1021	737+000	-12.442928	-72.499506	0101000020E6100000F88903E8F71F52C023F77475C7E228C0	2
1022	738+000	-12.442709	-72.499439	0101000020E610000034D6FECEF61F52C02C4A09C1AAE228C0	2
1023	739+000	-12.442578	-72.49932	0101000020E6100000478FDFDBF41F52C0B1DB679599E228C0	2
1024	740+000	-12.442541	-72.49917	0101000020E61000003D49BA66F21F52C03D47E4BB94E228C0	2
1025	741+000	-12.44257	-72.498976	0101000020E61000004A5F0839EF1F52C0A661F88898E228C0	2
1026	742+000	-12.442672	-72.498827	0101000020E610000028D714C8EC1F52C0B7B585E7A5E228C0	2
1027	743+000	-12.442811	-72.498685	0101000020E61000005E807D74EA1F52C03D9E961FB8E228C0	2
1028	744+000	-12.442906	-72.498566	0101000020E610000071395E81E81F52C084674293C4E228C0	2
1029	745+000	-12.443008	-72.49858	0101000020E6100000249C16BCE81F52C095BBCFF1D1E228C0	2
1030	746+000	-12.44303	-72.498678	0101000020E6100000054F2157EA1F52C0344B02D4D4E228C0	2
1031	747+000	-12.442942	-72.498804	0101000020E61000004CC79C67EC1F52C0B70C384BC9E228C0	2
1032	748+000	-12.442847	-72.498902	0101000020E61000002D7AA702EE1F52C070438CD7BCE228C0	2
1033	749+000	-12.442804	-72.499014	0101000020E6100000C18F6AD8EF1F52C07313B534B7E228C0	2
1034	750+000	-12.442862	-72.499125	0101000020E61000006DE7FBA9F11F52C04548DDCEBEE228C0	2
1035	751+000	-12.442995	-72.499162	0101000020E6100000FB592C45F21F52C042959A3DD0E228C0	2
1036	752+000	-12.443177	-72.499139	0101000020E61000001F4AB4E4F11F52C0C5AD8218E8E228C0	2
1037	753+000	-12.443301	-72.499176	0101000020E6100000AEBCE47FF21F52C075914259F8E228C0	2
1038	754+000	-12.443382	-72.499211	0101000020E61000006CB3B112F31F52C028452BF702E328C0	2
1039	755+000	-12.44344	-72.499236	0101000020E6100000183F8D7BF31F52C0FB7953910AE328C0	2
1040	756+000	-12.443942	-72.499258	0101000020E61000000C91D3D7F31F52C044A4A65D4CE328C0	2
1041	757+000	-12.444205	-72.499266	0101000020E61000004E8061F9F31F52C07A7077D66EE328C0	2
1042	758+000	-12.444409	-72.499356	0101000020E6100000EE43DE72F51F52C09C18929389E328C0	2
1043	759+000	-12.444533	-72.499453	0101000020E6100000E738B709F71F52C04CFC51D499E328C0	2
1044	760+000	-12.444606	-72.499632	0101000020E61000003F027FF8F91F52C0F435CB65A3E328C0	2
1045	761+000	-12.444737	-72.499721	0101000020E6100000F607CA6DFB1F52C06EA46C91B4E328C0	2
1046	762+000	-12.444905	-72.4999	0101000020E61000004ED1915CFE1F52C05DA79196CAE328C0	2
1047	763+000	-12.445123	-72.500072	0101000020E61000004D69FD2D012052C013656F29E7E328C0	2
1048	764+000	-12.445291	-72.500139	0101000020E6100000111D0247022052C00168942EFDE328C0	2
1049	765+000	-12.445502	-72.500154	0101000020E6100000AB3DEC85022052C0ED9A90D618E428C0	2
1050	766+000	-12.445582	-72.500199	0101000020E61000007B9FAA42032052C05F5FEB5223E428C0	2
1051	767+000	-12.445728	-72.500408	0101000020E610000008AA46AF062052C0AFD2DD7536E428C0	2
1052	768+000	-12.445823	-72.500445	0101000020E6100000971C774A072052C0F69B89E942E428C0	2
1053	769+000	-12.445874	-72.500378	0101000020E6100000D3687231062052C0FE45D09849E428C0	2
1054	770+000	-12.445816	-72.500281	0101000020E6100000DA73999A042052C02C11A8FE41E428C0	2
1055	771+000	-12.445706	-72.500184	0101000020E6100000E17EC003032052C00F43AB9333E428C0	2
1056	772+000	-12.445641	-72.500042	0101000020E6100000172829B0002052C07383A10E2BE428C0	2
1057	773+000	-12.445553	-72.499998	0101000020E610000030849CF7FF1F52C0F644D7851FE428C0	2
1058	774+000	-12.445408	-72.499983	0101000020E61000009563B2B8FF1F52C0E8C072840CE428C0	2
1059	775+000	-12.445247	-72.499878	0101000020E61000005A7F4B00FE1F52C0C3482F6AF7E328C0	2
1060	776+000	-12.445131	-72.499721	0101000020E6100000F607CA6DFB1F52C01EDFDE35E8E328C0	2
1061	777+000	-12.445087	-72.499497	0101000020E6100000CFDC43C2F71F52C0DFBF7971E2E328C0	2
1062	778+000	-12.445014	-72.499273	0101000020E6100000A7B1BD16F41F52C0388600E0D8E328C0	2
1063	779+000	-12.444883	-72.499146	0101000020E6100000787B1002F21F52C0BE175FB4C7E328C0	2
1064	780+000	-12.444737	-72.499072	0101000020E61000005B96AFCBF01F52C06EA46C91B4E328C0	2
1065	781+000	-12.444613	-72.498893	0101000020E610000003CDE7DCED1F52C0BEC0AC50A4E328C0	2
1066	782+000	-12.444491	-72.498794	0101000020E61000003A5CAB3DEC1F52C090BB085394E328C0	2
1067	783+000	-12.444382	-72.498682	0101000020E6100000A646E867EA1F52C0B5DC990986E328C0	2
1068	784+000	-12.444331	-72.498547	0101000020E61000003621AD31E81F52C0AD32535A7FE328C0	2
1069	785+000	-12.444389	-72.498428	0101000020E610000049DA8D3EE61F52C07F677BF486E328C0	2
1070	786+000	-12.444499	-72.498443	0101000020E6100000E3FA777DE61F52C09C35785F95E328C0	2
1071	787+000	-12.444593	-72.498622	0101000020E61000003BC43F6CE91F52C0A10F96B1A1E328C0	2
1072	788+000	-12.444688	-72.498786	0101000020E6100000F86C1D1CEC1F52C0E8D84125AEE328C0	2
1073	789+000	-12.444746	-72.498824	0101000020E61000006F9D7FBBEC1F52C0BB0D6ABFB5E328C0	2
1074	790+000	-12.444892	-72.49892	0101000020E610000080D4264EEE1F52C00A815CE2C8E328C0	2
1075	791+000	-12.445337	-72.499241	0101000020E6100000A1F48590F31F52C0C365153603E428C0	2
1076	792+000	-12.445497	-72.49948	0101000020E61000006440F67AF71F52C0A6EECA2E18E428C0	2
1077	793+000	-12.445614	-72.499607	0101000020E61000009276A38FF91F52C08D47A98427E428C0	2
1078	794+000	-12.445825	-72.499704	0101000020E61000008B6B7C26FB1F52C0787AA52C43E428C0	2
1079	795+000	-12.445993	-72.499749	0101000020E61000005BCD3AE3FB1F52C0677DCA3159E428C0	2
1080	796+000	-12.446088	-72.499883	0101000020E6100000E3344415FE1F52C0AE4676A565E428C0	2
1081	797+000	-12.446233	-72.500033	0101000020E6100000EE7A698A002052C0BCCADAA678E428C0	2
1082	798+000	-12.446481	-72.500115	0101000020E61000004C4F58E2012052C01D925A2899E428C0	2
1083	799+000	-12.446547	-72.500182	0101000020E610000010035DFB022052C0FB40F2CEA1E428C0	2
1084	800+000	-12.446664	-72.500413	0101000020E6100000915F3FC4062052C0E199D024B1E428C0	2
1085	801+000	-12.446834	-72.500941	0101000020E61000006F0ED76A0F2052C0537B116DC7E428C0	2
1086	802+000	-12.447001	-72.50124	0101000020E61000009CDCEF50142052C0008FA850DDE428C0	2
1087	803+000	-12.447147	-72.501441	0101000020E6100000E8F7FD9B172052C04F029B73F0E428C0	2
1088	804+000	-12.447147	-72.501568	0101000020E6100000172EABB0192052C04F029B73F0E428C0	2
1089	805+000	-12.447111	-72.501695	0101000020E6100000456458C51B2052C01C5DA5BBEBE428C0	2
1090	806+000	-12.447147	-72.50186	0101000020E6100000EACA67791E2052C04F029B73F0E428C0	2
1091	807+000	-12.447227	-72.502016	0101000020E61000006684B707212052C0C1C6F5EFFAE428C0	2
1092	808+000	-12.447313	-72.502034	0101000020E6100000B9DE3653212052C0BB26A43506E528C0	2
1093	809+000	-12.447323	-72.501897	0101000020E6100000793D98141F2052C04A7F2F8507E528C0	2
1094	810+000	-12.447242	-72.501697	0101000020E610000015E0BBCD1B2052C096CB46E7FCE428C0	2
1095	811+000	-12.447249	-72.501562	0101000020E6100000A6BA8097192052C0605628D2FDE428C0	2
1096	812+000	-12.447264	-72.501413	0101000020E610000083328D26172052C0365B79C9FFE428C0	2
1097	813+000	-12.447132	-72.501256	0101000020E61000001FBB0B94142052C07AFD497CEEE428C0	2
1098	814+000	-12.447045	-72.501077	0101000020E6100000C7F143A5112052C03EAE0D15E3E428C0	2
1099	815+000	-12.446994	-72.500831	0101000020E6100000AC74779D0D2052C03604C765DCE428C0	2
1100	816+000	-12.446957	-72.500547	0101000020E610000019C748F6082052C0C16F438CD7E428C0	2
1101	817+000	-12.44687	-72.500353	0101000020E610000027DD96C8052052C086200725CCE428C0	2
1102	818+000	-12.446863	-72.500167	0101000020E610000076E272BC022052C0BC95253ACBE428C0	2
1103	819+000	-12.446834	-72.500047	0101000020E6100000A0DD21C5002052C0537B116DC7E428C0	2
1104	820+000	-12.44671	-72.499987	0101000020E6100000365B79C9FF1F52C0A297512CB7E428C0	2
1105	821+000	-12.446527	-72.499846	0101000020E610000055C2137AFD1F52C0DE8FDB2F9FE428C0	2
1106	822+000	-12.446374	-72.499659	0101000020E6100000BB09BE69FA1F52C0C59107228BE428C0	2
1107	823+000	-12.446199	-72.499428	0101000020E61000003AADDBA0F61F52C00C04013274E428C0	2
1108	824+000	-12.446024	-72.499122	0101000020E6100000B4AD669DF11F52C05376FA415DE428C0	2
1109	825+000	-12.445813	-72.498875	0101000020E6100000B0726891ED1F52C06743FE9941E428C0	2
1110	826+000	-12.445733	-72.498741	0101000020E6100000280B5F5FEB1F52C0F67EA31D37E428C0	2
1111	827+000	-12.445755	-72.498651	0101000020E61000008847E2E5E91F52C0950ED6FF39E428C0	2
1112	828+000	-12.445893	-72.498547	0101000020E61000003621AD31E81F52C0D90759164CE428C0	2
1113	829+000	-12.446119	-72.498405	0101000020E61000006DCA15DEE51F52C09A3FA6B569E428C0	2
1114	830+000	-12.446301	-72.498286	0101000020E61000007F83F6EAE31F52C01D588E9081E428C0	2
1115	831+000	-12.446411	-72.4983	0101000020E610000032E6AE25E41F52C039268BFB8FE428C0	2
1116	832+000	-12.446418	-72.498383	0101000020E61000007978CF81E51F52C003B16CE690E428C0	2
1117	833+000	-12.446331	-72.498465	0101000020E6100000D74CBED9E61F52C0C861307F85E428C0	2
1118	834+000	-12.446163	-72.49851	0101000020E6100000A7AE7C96E71F52C0D95E0B7A6FE428C0	2
1119	835+000	-12.445988	-72.498644	0101000020E61000002F1686C8E91F52C020D1048A58E428C0	2
1120	836+000	-12.445959	-72.498771	0101000020E61000005E4C33DDEB1F52C0B7B6F0BC54E428C0	2
1121	837+000	-12.44609	-72.498942	0101000020E610000074266DAAEE1F52C0312592E865E428C0	2
1122	838+000	-12.44625	-72.499122	0101000020E6100000B4AD669DF11F52C014AE47E17AE428C0	2
1123	839+000	-12.446404	-72.499316	0101000020E6100000A69718CBF41F52C06F9BA9108FE428C0	2
1124	840+000	-12.446608	-72.499525	0101000020E610000034A2B437F81F52C09143C4CDA9E428C0	2
1125	841+000	-12.446906	-72.499637	0101000020E6100000C8B7770DFA1F52C0B9C5FCDCD0E428C0	2
1126	842+000	-12.44711	-72.499704	0101000020E61000008B6B7C26FB1F52C0DB6D179AEBE428C0	2
1127	843+000	-12.447242	-72.499868	0101000020E610000049145AD6FD1F52C096CB46E7FCE428C0	2
1128	844+000	-12.447402	-72.5006	0101000020E61000002B1895D4092052C07A54FCDF11E528C0	2
1129	845+000	-12.447446	-72.500935	0101000020E6100000FE9AAC510F2052C0B87361A417E528C0	2
1130	846+000	-12.447526	-72.50107	0101000020E61000006EC0E787112052C02A38BC2022E528C0	2
1131	847+000	-12.447766	-72.501204	0101000020E6100000F627F1B9132052C07F85CC9541E528C0	2
1132	848+000	-12.447956	-72.501286	0101000020E610000054FCDF11152052C00D18247D5AE528C0	2
1133	849+000	-12.448036	-72.501406	0101000020E61000002A013109172052C07FDC7EF964E528C0	2
1134	850+000	-12.448153	-72.501674	0101000020E610000039D0436D1B2052C065355D4F74E528C0	2
1135	851+000	-12.448218	-72.501779	0101000020E610000074B4AA251D2052C002F566D47CE528C0	2
1136	852+000	-12.44832	-72.501779	0101000020E610000074B4AA251D2052C01349F4328AE528C0	2
1137	853+000	-12.448364	-72.501652	0101000020E6100000467EFD101B2052C0516859F78FE528C0	2
1138	854+000	-12.44827	-72.501473	0101000020E6100000EEB43522182052C04C8E3BA583E528C0	2
1139	855+000	-12.448146	-72.501279	0101000020E6100000FBCA83F4142052C09BAA7B6473E528C0	2
1140	856+000	-12.448014	-72.501137	0101000020E61000003274ECA0122052C0E04C4C1762E528C0	2
1141	857+000	-12.447825	-72.501077	0101000020E6100000C7F143A5112052C093A9825149E528C0	2
1142	858+000	-12.447672	-72.500883	0101000020E6100000D50792770E2052C07AABAE4335E528C0	2
1143	859+000	-12.447628	-72.500689	0101000020E6100000E21DE0490B2052C03B8C497F2FE528C0	2
1144	860+000	-12.447686	-72.500301	0101000020E6100000FD497CEE042052C00DC1711937E528C0	2
1145	861+000	-12.447723	-72.500025	0101000020E6100000AC8BDB68002052C08255F5F23BE528C0	2
1146	862+000	-12.44781	-72.499689	0101000020E6100000F14A92E7FA1F52C0BEA4315A47E528C0	2
1147	863+000	-12.447781	-72.499472	0101000020E610000022516859F71F52C0558A1D8D43E528C0	2
1148	864+000	-12.447606	-72.499316	0101000020E6100000A69718CBF41F52C09CFC169D2CE528C0	2
1149	865+000	-12.447453	-72.499234	0101000020E610000048C32973F31F52C082FE428F18E528C0	2
1150	866+000	-12.447125	-72.499166	0101000020E61000009C51F355F21F52C0B0726891EDE428C0	2
1151	867+000	-12.447008	-72.499062	0101000020E6100000492BBEA1F01F52C0CA198A3BDEE428C0	2
1152	868+000	-12.446957	-72.498935	0101000020E61000001BF5108DEE1F52C0C16F438CD7E428C0	2
1153	869+000	-12.44695	-72.498816	0101000020E61000002EAEF199EC1F52C0F7E461A1D6E428C0	2
1154	870+000	-12.447023	-72.498704	0101000020E61000009A982EC4EA1F52C09F1EDB32E0E428C0	2
1155	871+000	-12.447125	-72.498539	0101000020E6100000F4311F10E81F52C0B0726891EDE428C0	2
1156	872+000	-12.447351	-72.498398	0101000020E61000001399B9C0E51F52C071AAB5300BE528C0	2
1157	873+000	-12.447475	-72.498248	0101000020E61000000953944BE31F52C0228E75711BE528C0	2
1158	874+000	-12.447548	-72.498032	0101000020E610000022179CC1DF1F52C0C9C7EE0225E528C0	2
1159	875+000	-12.447606	-72.497785	0101000020E61000001EDC9DB5DB1F52C09CFC169D2CE528C0	2
1160	876+000	-12.447759	-72.497569	0101000020E610000038A0A52BD81F52C0B5FAEAAA40E528C0	2
1161	877+000	-12.447934	-72.497479	0101000020E610000098DC28B2D61F52C06E88F19A57E528C0	2
1162	878+000	-12.448109	-72.497472	0101000020E61000003FABCC94D61F52C02716F88A6EE528C0	2
1163	879+000	-12.44824	-72.49733	0101000020E610000076543541D41F52C0A18499B67FE528C0	2
1164	880+000	-12.44835	-72.497084	0101000020E61000005AD76839D01F52C0BD5296218EE528C0	2
1165	881+000	-12.44851	-72.496882	0101000020E610000026FE28EACC1F52C0A1DB4B1AA3E528C0	2
1166	882+000	-12.44886	-72.496793	0101000020E61000006EF8DD74CB1F52C012F758FAD0E528C0	2
1167	883+000	-12.449108	-72.496554	0101000020E6100000ACAC6D8AC71F52C073BED87BF1E528C0	2
1168	884+000	-12.449443	-72.496196	0101000020E6100000FC19DEACC11F52C00FD594641DE628C0	2
1169	885+000	-12.449713	-72.495889	0101000020E61000008E5C37A5BC1F52C00E2C47C840E628C0	2
1170	886+000	-12.449756	-72.495494	0101000020E61000004F57772CB61F52C00C5C1E6B46E628C0	2
1171	887+000	-12.449858	-72.495255	0101000020E61000008D0B0742B21F52C01DB0ABC953E628C0	2
1172	888+000	-12.449982	-72.495225	0101000020E610000058CA32C4B11F52C0CD936B0A64E628C0	2
1173	889+000	-12.450179	-72.495203	0101000020E61000006478EC67B11F52C025B1A4DC7DE628C0	2
1174	890+000	-12.45042	-72.494986	0101000020E6100000957EC2D9AD1F52C0BBED42739DE628C0	2
1175	891+000	-12.450697	-72.494591	0101000020E610000057790261A71F52C085CFD6C1C1E628C0	2
1176	892+000	-12.450835	-72.494374	0101000020E6100000887FD8D2A31F52C0C9C859D8D3E628C0	2
1177	893+000	-12.450908	-72.494314	0101000020E61000001EFD2FD7A21F52C07102D369DDE628C0	2
1178	894+000	-12.450966	-72.494374	0101000020E6100000887FD8D2A31F52C04337FB03E5E628C0	2
1179	895+000	-12.450908	-72.494501	0101000020E6100000B7B585E7A51F52C07102D369DDE628C0	2
1180	896+000	-12.450755	-72.494762	0101000020E61000006D533C2EAA1F52C05704FF5BC9E628C0	2
1181	897+000	-12.4505	-72.495128	0101000020E61000005ED5592DB01F52C02DB29DEFA7E628C0	2
1182	898+000	-12.450128	-72.495404	0101000020E6100000AF93FAB2B41F52C01C075E2D77E628C0	2
1183	899+000	-12.449997	-72.495598	0101000020E6100000A27DACE0B71F52C0A298BC0166E628C0	2
1184	900+000	-12.44999	-72.495934	0101000020E61000005EBEF561BD1F52C0D80DDB1665E628C0	2
1185	901+000	-12.44991	-72.496143	0101000020E6100000EBC891CEC01F52C06649809A5AE628C0	2
1186	902+000	-12.449625	-72.496554	0101000020E6100000ACAC6D8AC71F52C091ED7C3F35E628C0	2
1187	903+000	-12.449319	-72.4968	0101000020E6100000C7293A92CB1F52C05EF1D4230DE628C0	2
1188	904+000	-12.449122	-72.497039	0101000020E61000008A75AA7CCF1F52C006D49B51F3E528C0	2
1189	905+000	-12.44878	-72.497188	0101000020E6100000ACFD9DEDD11F52C0A032FE7DC6E528C0	2
1190	906+000	-12.448707	-72.497293	0101000020E6100000E7E104A6D31F52C0F9F884ECBCE528C0	2
1191	907+000	-12.448525	-72.497785	0101000020E61000001EDC9DB5DB1F52C076E09C11A5E528C0	2
1192	908+000	-12.448401	-72.49836	0101000020E61000009D685721E51F52C0C6FCDCD094E528C0	2
1193	909+000	-12.448459	-72.49848	0101000020E6100000726DA818E71F52C09831056B9CE528C0	2
1194	910+000	-12.448648	-72.498614	0101000020E6100000FAD4B14AE91F52C0E5D4CE30B5E528C0	2
1195	911+000	-12.448796	-72.49897	0101000020E6100000D9EBDD1FEF1F52C0B726DD96C8E528C0	2
1196	912+000	-12.448776	-72.499224	0101000020E610000036583849F31F52C09B75C6F7C5E528C0	2
1197	913+000	-12.448776	-72.499485	0101000020E6100000EDF5EE8FF71F52C09B75C6F7C5E528C0	2
1198	914+000	-12.44893	-72.499951	0101000020E61000008FA67A32FF1F52C0F6622827DAE528C0	2
1199	915+000	-12.449057	-72.500178	0101000020E6100000700B96EA022052C06A1492CCEAE528C0	2
1200	916+000	-12.449251	-72.500267	0101000020E61000002711E15F042052C0FE63213A04E628C0	2
1201	917+000	-12.449452	-72.500287	0101000020E61000004BE7C3B3042052C05C3E92921EE628C0	2
1202	918+000	-12.44956	-72.500246	0101000020E61000001C7DCC07042052C0F52D73BA2CE628C0	2
1203	919+000	-12.44964	-72.500274	0101000020E610000081423D7D042052C067F2CD3637E628C0	2
1204	920+000	-12.449727	-72.500411	0101000020E6100000C1E3DBBB062052C0A2410A9E42E628C0	2
1205	921+000	-12.449912	-72.500529	0101000020E6100000C66CC9AA082052C0E9279CDD5AE628C0	2
1206	922+000	-12.449986	-72.500571	0101000020E6100000DD94F25A092052C0D350A39064E628C0	2
1207	923+000	-12.450028	-72.500587	0101000020E610000060730E9E092052C08E91EC116AE628C0	2
1208	924+000	-12.450114	-72.50058	0101000020E61000000742B280092052C088F19A5775E628C0	2
1209	925+000	-12.450183	-72.500592	0101000020E6100000E92807B3092052C02B6EDC627EE628C0	2
1210	926+000	-12.450217	-72.500622	0101000020E61000001F6ADB300A2052C0DB34B6D782E628C0	2
1211	927+000	-12.450268	-72.500684	0101000020E61000005A68E7340B2052C0E3DEFC8689E628C0	2
1212	928+000	-12.450335	-72.500755	0101000020E6100000BE13B35E0C2052C0037D224F92E628C0	2
1213	929+000	-12.45041	-72.500795	0101000020E610000005C078060D2052C02D95B7239CE628C0	2
1214	930+000	-12.450566	-72.500812	0101000020E6100000705CC64D0D2052C00B613596B0E628C0	2
1215	931+000	-12.450622	-72.500838	0101000020E610000005A6D3BA0D2052C05AB741EDB7E628C0	2
1216	932+000	-12.450681	-72.500885	0101000020E6100000A583F57F0E2052C06EDBF7A8BFE628C0	2
1217	933+000	-12.450738	-72.500952	0101000020E61000006937FA980F2052C0FF209221C7E628C0	2
1218	934+000	-12.450768	-72.501059	0101000020E61000007497C459112052C0AA2A3410CBE628C0	2
1219	935+000	-12.450782	-72.501143	0101000020E6100000A3E716BA122052C03E40F7E5CCE628C0	2
1220	936+000	-12.450792	-72.501207	0101000020E6100000AE6186C6132052C0CC988235CEE628C0	2
1221	937+000	-12.450816	-72.501258	0101000020E6100000F0366F9C142052C0EE06D15AD1E628C0	2
1222	938+000	-12.450837	-72.501278	0101000020E6100000130D52F0142052C04CA7751BD4E628C0	2
1223	939+000	-12.450877	-72.501286	0101000020E610000054FCDF11152052C08509A359D9E628C0	2
1224	940+000	-12.450918	-72.501281	0101000020E6100000CC46E7FC142052C0FF5A5EB9DEE628C0	2
1225	941+000	-12.450943	-72.501267	0101000020E610000019E42EC2142052C063B83A00E2E628C0	2
1226	942+000	-12.450976	-72.501242	0101000020E61000006D585359142052C0D28F8653E6E628C0	2
1227	943+000	-12.451	-72.501182	0101000020E610000002D6AA5D132052C0F4FDD478E9E628C0	2
1228	944+000	-12.450996	-72.501081	0101000020E610000068E90AB6112052C0EE409DF2E8E628C0	2
1229	945+000	-12.450971	-72.500989	0101000020E6100000F8A92A34102052C08AE3C0ABE5E628C0	2
1230	946+000	-12.450956	-72.500933	0101000020E61000002E1F49490F2052C0B5DE6FB4E3E628C0	2
1231	947+000	-12.450927	-72.500892	0101000020E6100000FEB4519D0E2052C04CC45BE7DFE628C0	2
1232	948+000	-12.450886	-72.500857	0101000020E610000040BE840A0E2052C0D272A087DAE628C0	2
1233	949+000	-12.450834	-72.500832	0101000020E61000009432A9A10D2052C088D9CBB6D3E628C0	2
1234	950+000	-12.450779	-72.500802	0101000020E61000005EF1D4230D2052C07A724D81CCE628C0	2
1235	951+000	-12.450648	-72.500706	0101000020E61000004DBA2D910B2052C0FF03AC55BBE628C0	2
1236	952+000	-12.450495	-72.500646	0101000020E6100000E33785950A2052C0E605D847A7E628C0	2
1237	953+000	-12.450433	-72.5006	0101000020E61000002B1895D4092052C00E1478279FE628C0	2
1238	954+000	-12.45041	-72.50057	0101000020E6100000F5D6C056092052C02D95B7239CE628C0	2
1239	955+000	-12.45039	-72.500522	0101000020E61000006D3B6D8D082052C011E4A08499E628C0	2
1240	956+000	-12.450372	-72.500484	0101000020E6100000F60A0BEE072052C07711A62897E628C0	2
1241	957+000	-12.450356	-72.500429	0101000020E6100000143E5B07072052C0601DC70F95E628C0	2
1242	958+000	-12.450334	-72.500354	0101000020E61000000F9BC8CC052052C0C18D942D92E628C0	2
1243	959+000	-12.450306	-72.500331	0101000020E6100000338B506C052052C099620E828EE628C0	2
1244	960+000	-12.450274	-72.500318	0101000020E610000068E6C935052052C06C7A50508AE628C0	2
1245	961+000	-12.450194	-72.500304	0101000020E6100000B68311FB042052C0FAB5F5D37FE628C0	2
1246	962+000	-12.450151	-72.500286	0101000020E6100000632992AF042052C0FD851E317AE628C0	2
1247	963+000	-12.450082	-72.500244	0101000020E61000004B0169FF032052C05B09DD2571E628C0	2
1248	964+000	-12.449961	-72.499965	0101000020E61000004209336DFF1F52C06FF3C64961E628C0	2
1249	965+000	-12.449881	-72.499746	0101000020E6100000A393A5D6FB1F52C0FD2E6CCD56E628C0	2
1250	966+000	-12.44964	-72.499464	0101000020E6100000E161DA37F71F52C067F2CD3637E628C0	2
1251	967+000	-12.449553	-72.499149	0101000020E610000031B5A50EF21F52C02BA391CF2BE628C0	2
1252	968+000	-12.449506	-72.498813	0101000020E610000075745C8DEC1F52C028B682A625E628C0	2
1253	969+000	-12.449519	-72.498552	0101000020E6100000BFD6A546E81F52C07BDCB75A27E628C0	2
1254	970+000	-12.449446	-72.498257	0101000020E610000032005471E31F52C0D3A23EC91DE628C0	2
1255	971+000	-12.449365	-72.497894	0101000020E6100000FAB7CB7EDD1F52C020EF552B13E628C0	2
1256	972+000	-12.449379	-72.497653	0101000020E610000067F0F78BD91F52C0B404190115E628C0	2
1257	973+000	-12.449459	-72.497612	0101000020E6100000388600E0D81F52C025C9737D1FE628C0	2
1258	974+000	-12.449506	-72.497729	0101000020E61000005551BCCADA1F52C028B682A625E628C0	2
1259	975+000	-12.449506	-72.497866	0101000020E610000095F25A09DD1F52C028B682A625E628C0	2
1260	976+000	-12.449626	-72.498188	0101000020E61000009ED0EB4FE21F52C0D3DC0A6135E628C0	2
1261	977+000	-12.449794	-72.498394	0101000020E610000073A1F2AFE51F52C0C2DF2F664BE628C0	2
1262	978+000	-12.449941	-72.498566	0101000020E610000071395E81E81F52C05342B0AA5EE628C0	2
1263	979+000	-12.450022	-72.498868	0101000020E610000057410C74ED1F52C006F6984869E628C0	2
1264	980+000	-12.450132	-72.499206	0101000020E6100000E3FDB8FDF21F52C022C495B377E628C0	2
1265	981+000	-12.45019	-72.499304	0101000020E6100000C4B0C398F41F52C0F4F8BD4D7FE628C0	2
1266	982+000	-12.450522	-72.499687	0101000020E610000020CF2EDFFA1F52C0CC41D0D1AAE628C0	2
1267	983+000	-12.450602	-72.49975	0101000020E6100000448B6CE7FB1F52C03E062B4EB5E628C0	2
1268	984+000	-12.45072	-72.499799	0101000020E6100000B4E4F1B4FC1F52C0664E97C5C4E628C0	2
1269	985+000	-12.450899	-72.499874	0101000020E6100000BA8784EFFD1F52C02499D53BDCE628C0	2
1270	986+000	-12.450965	-72.499929	0101000020E61000009B5434D6FE1F52C002486DE2E4E628C0	2
1271	987+000	-12.451142	-72.500118	0101000020E61000000589EDEE012052C03EB48F15FCE628C0	2
1272	988+000	-12.451338	-72.500294	0101000020E6100000A41820D1042052C054E23AC615E728C0	2
1273	989+000	-12.4514	-72.500348	0101000020E61000009E279EB3052052C02CD49AE61DE728C0	2
1274	990+000	-12.45148	-72.500387	0101000020E6100000FD153257062052C09E98F56228E728C0	2
1275	991+000	-12.451553	-72.500411	0101000020E6100000C1E3DBBB062052C046D26EF431E728C0	2
1276	992+000	-12.451597	-72.500411	0101000020E6100000C1E3DBBB062052C084F1D3B837E728C0	2
1277	993+000	-12.451636	-72.500402	0101000020E610000097361C96062052C07C6473D53CE728C0	2
1278	994+000	-12.451653	-72.50037	0101000020E61000009279E40F062052C0D447E00F3FE728C0	2
1279	995+000	-12.451657	-72.50034	0101000020E61000005C381092052052C0DA0418963FE728C0	2
1280	996+000	-12.451644	-72.50031	0101000020E610000027F73B14052052C087DEE2E13DE728C0	2
1281	997+000	-12.451614	-72.500291	0101000020E6100000ECDE8AC4042052C0DCD440F339E728C0	2
1282	998+000	-12.45153	-72.500273	0101000020E610000099840B79042052C06553AEF02EE728C0	2
1283	999+000	-12.45149	-72.500256	0101000020E61000002DE8BD31042052C02CF180B229E728C0	2
1284	1000+000	-12.451431	-72.500221	0101000020E61000006FF1F09E032052C018CDCAF621E728C0	2
1285	1001+000	-12.451387	-72.500182	0101000020E610000010035DFB022052C0DAAD65321CE728C0	2
1286	1002+000	-12.451283	-72.500004	0101000020E6100000A1F7C610002052C0467BBC900EE728C0	2
1287	1003+000	-12.451151	-72.499792	0101000020E61000005BB39597FC1F52C08A1D8D43FDE628C0	2
1288	1004+000	-12.451089	-72.499734	0101000020E6100000C1AC50A4FB1F52C0B22B2D23F5E628C0	2
1289	1005+000	-12.451034	-72.499694	0101000020E61000007A008BFCFA1F52C0A4C4AEEDEDE628C0	2
1290	1006+000	-12.450962	-72.499659	0101000020E6100000BB09BE69FA1F52C03E7AC37DE4E628C0	2
1291	1007+000	-12.450812	-72.499554	0101000020E6100000812557B1F81F52C0E94999D4D0E628C0	2
1292	1008+000	-12.450749	-72.499495	0101000020E6100000FE60E0B9F71F52C0CF68AB92C8E628C0	2
1293	1009+000	-12.450724	-72.499462	0101000020E610000010E6762FF71F52C06B0BCF4BC5E628C0	2
1294	1010+000	-12.450693	-72.499394	0101000020E610000064744012F61F52C07F129F3BC1E628C0	2
1295	1011+000	-12.450612	-72.499158	0101000020E61000005A626534F21F52C0CC5EB69DB6E628C0	2
1296	1012+000	-12.450518	-72.498868	0101000020E610000057410C74ED1F52C0C784984BAAE628C0	2
1297	1013+000	-12.450485	-72.498777	0101000020E6100000CFBF5DF6EB1F52C058AD4CF8A5E628C0	2
1298	1014+000	-12.450464	-72.498614	0101000020E6100000FAD4B14AE91F52C0FA0CA837A3E628C0	2
1299	1015+000	-12.450465	-72.498411	0101000020E6100000DE3D40F7E51F52C03BFC3559A3E628C0	2
1300	1016+000	-12.450453	-72.498196	0101000020E6100000DFBF7971E21F52C02AC58EC6A1E628C0	2
1301	1017+000	-12.450453	-72.498127	0101000020E61000004B901150E11F52C02AC58EC6A1E628C0	2
1302	1018+000	-12.450481	-72.498105	0101000020E6100000573ECBF3E01F52C052F01472A5E628C0	2
1303	1019+000	-12.450508	-72.4981	0101000020E6100000CE88D2DEE01F52C0382C0DFCA8E628C0	2
1304	1020+000	-12.450534	-72.498101	0101000020E6100000B74604E3E01F52C0DD787764ACE628C0	2
1305	1021+000	-12.450553	-72.498126	0101000020E610000063D2DF4BE11F52C0B83A00E2AEE628C0	2
1306	1022+000	-12.450556	-72.498153	0101000020E6100000E0D91EBDE11F52C07D08AA46AFE628C0	2
1307	1023+000	-12.450562	-72.498193	0101000020E61000002786E464E21F52C005A4FD0FB0E628C0	2
1308	1024+000	-12.45057	-72.498272	0101000020E6100000CD203EB0E31F52C0111E6D1CB1E628C0	2
1309	1025+000	-12.450608	-72.49842	0101000020E610000007EBFF1CE61F52C0C7A17E17B6E628C0	2
1310	1026+000	-12.450684	-72.498656	0101000020E610000011FDDAFAE91F52C033A9A10DC0E628C0	2
1311	1027+000	-12.450789	-72.498891	0101000020E6100000335184D4ED1F52C008CBD8D0CDE628C0	2
1312	1028+000	-12.450894	-72.499022	0101000020E6100000027FF8F9EF1F52C0DDEC0F94DBE628C0	2
1313	1029+000	-12.450993	-72.499117	0101000020E61000002BF86D88F11F52C02A73F38DE8E628C0	2
1314	1030+000	-12.45109	-72.499188	0101000020E610000090A339B2F21F52C0F41ABB44F5E628C0	2
1315	1031+000	-12.451121	-72.499219	0101000020E6100000ADA23F34F31F52C0E013EB54F9E628C0	2
1316	1032+000	-12.45123	-72.499388	0101000020E6100000F30016F9F51F52C0BBF2599E07E728C0	2
1317	1033+000	-12.451284	-72.49943	0101000020E61000000B293FA9F61F52C0876A4AB20EE728C0	2
1318	1034+000	-12.451319	-72.49945	0101000020E61000002EFF21FDF61F52C07920B24813E728C0	2
1319	1035+000	-12.451386	-72.499498	0101000020E6100000B79A75C6F71F52C098BED7101CE728C0	2
1320	1036+000	-12.451526	-72.49959	0101000020E610000027DA5548F91F52C05F96766A2EE728C0	2
1321	1037+000	-12.451682	-72.499709	0101000020E61000001421753BFB1F52C03D62F4DC42E728C0	2
1322	1038+000	-12.451742	-72.499769	0101000020E61000007FA31D37FC1F52C0927538BA4AE728C0	2
1323	1039+000	-12.451808	-72.499833	0101000020E61000008A1D8D43FD1F52C07024D06053E728C0	2
1324	1040+000	-12.451876	-72.499878	0101000020E61000005A7F4B00FE1F52C0D1B1834A5CE728C0	2
1325	1041+000	-12.451949	-72.499921	0101000020E61000005A65A6B4FE1F52C079EBFCDB65E728C0	2
1326	1042+000	-12.451992	-72.49996	0101000020E6100000B9533A58FF1F52C0761BD47E6BE728C0	2
1327	1043+000	-12.452023	-72.50001	0101000020E6100000126BF129002052C06214048F6FE728C0	2
1328	1044+000	-12.452055	-72.500086	0101000020E6100000FFCBB568012052C08FFCC1C073E728C0	2
1329	1045+000	-12.452076	-72.500117	0101000020E61000001DCBBBEA012052C0ED9C668176E728C0	2
1330	1046+000	-12.452136	-72.500173	0101000020E6100000E7559DD5022052C042B0AA5E7EE728C0	2
1331	1047+000	-12.452272	-72.500266	0101000020E61000003F53AF5B042052C004CB113290E728C0	2
1332	1048+000	-12.452326	-72.500324	0101000020E6100000DA59F44E052052C0D042024697E728C0	2
1333	1049+000	-12.452358	-72.500377	0101000020E6100000EBAA402D062052C0FE2AC0779BE728C0	2
1334	1050+000	-12.452406	-72.500582	0101000020E6100000D7BD1589092052C042075DC2A1E728C0	2
1335	1051+000	-12.45246	-72.500671	0101000020E61000008FC360FE0A2052C00F7F4DD6A8E728C0	2
1336	1052+000	-12.45262	-72.500678	0101000020E6100000E8F4BC1B0B2052C0F20703CFBDE728C0	2
1337	1053+000	-12.452721	-72.500788	0101000020E6100000AC8E1CE90C2052C0C26C020CCBE728C0	2
1338	1054+000	-12.452728	-72.501028	0101000020E61000005798BED7102052C08CF7E3F6CBE728C0	2
1339	1055+000	-12.452815	-72.501193	0101000020E6100000FCFECD8B132052C0C746205ED7E728C0	2
1340	1056+000	-12.453022	-72.501344	0101000020E6100000EF022505162052C0AEBCE47FF2E728C0	2
1341	1057+000	-12.45325	-72.501398	0101000020E6100000E811A3E7162052C0F2D24D6210E828C0	2
1342	1058+000	-12.453344	-72.501446	0101000020E610000071ADF6B0172052C0F7AC6BB41CE828C0	2
1343	1059+000	-12.453464	-72.501515	0101000020E610000005DD5ED2182052C0A2D3F36E2CE828C0	2
1344	1060+000	-12.453712	-72.501481	0101000020E61000002FA4C343182052C0029B73F04CE828C0	2
1345	1061+000	-12.45392	-72.501378	0101000020E6100000C53BC093162052C02A00C63368E828C0	2
1346	1062+000	-12.45402	-72.501371	0101000020E61000006C0A6476162052C0B875374F75E828C0	2
1347	1063+000	-12.454067	-72.501453	0101000020E6100000CADE52CE172052C0BB6246787BE828C0	2
1348	1064+000	-12.454034	-72.501659	0101000020E61000009FAF592E1B2052C04C8BFA2477E828C0	2
1349	1065+000	-12.454134	-72.501776	0101000020E6100000BC7A15191D2052C0DA006C4084E828C0	2
1350	1066+000	-12.454422	-72.501824	0101000020E6100000441669E21D2052C0732A1900AAE828C0	2
1351	1067+000	-12.454844	-72.501735	0101000020E61000008C101E6D1C2052C04B901150E1E828C0	2
1352	1068+000	-12.454951	-72.501817	0101000020E6100000EBE40CC51D2052C0A3906456EFE828C0	2
1353	1069+000	-12.455186	-72.501892	0101000020E6100000F0879FFF1E2052C0B131AF230EE928C0	2
1354	1070+000	-12.455393	-72.502009	0101000020E61000000D535BEA202052C098A7734529E928C0	2
1355	1071+000	-12.455554	-72.501982	0101000020E6100000904B1C79202052C0BC1FB75F3EE928C0	2
1356	1072+000	-12.455675	-72.501975	0101000020E6100000371AC05B202052C0A835CD3B4EE928C0	2
1357	1073+000	-12.455735	-72.502043	0101000020E6100000E38BF678212052C0FE48111956E928C0	2
1358	1074+000	-12.455715	-72.502167	0101000020E610000059880E81232052C0E197FA7953E928C0	2
1359	1075+000	-12.455755	-72.50227	0101000020E6100000C3F01131252052C01AFA27B858E928C0	2
1360	1076+000	-12.455902	-72.502393	0101000020E6100000512FF834272052C0AB5CA8FC6BE928C0	2
1361	1077+000	-12.455996	-72.502578	0101000020E61000001A6CEA3C2A2052C0B136C64E78E928C0	2
1362	1078+000	-12.45611	-72.502674	0101000020E61000002BA391CF2B2052C0D3C1FA3F87E928C0	2
1363	1079+000	-12.456318	-72.502764	0101000020E6100000CB660E492D2052C0FA264D83A2E928C0	2
1364	1080+000	-12.456498	-72.50288	0101000020E61000000074982F2F2052C0FA60191BBAE928C0	2
1365	1081+000	-12.456592	-72.502997	0101000020E61000001C3F541A312052C0003B376DC6E928C0	2
1366	1082+000	-12.456726	-72.503038	0101000020E61000004CA94BC6312052C03E7782FDD7E928C0	2
1367	1083+000	-12.456859	-72.50288	0101000020E61000000074982F2F2052C03BC43F6CE9E928C0	2
1368	1084+000	-12.457072	-72.502852	0101000020E61000009BAE27BA2E2052C0AAD5575705EA28C0	2
1369	1085+000	-12.457544	-72.50278	0101000020E61000004E452A8C2D2052C049F6083543EA28C0	2
1370	1086+000	-12.457679	-72.50277	0101000020E61000003CDA38622D2052C0C921E2E654EA28C0	2
1371	1087+000	-12.457923	-72.50278	0101000020E61000004E452A8C2D2052C0232C2AE274EA28C0	2
1372	1088+000	-12.458039	-72.502832	0101000020E610000077D844662E2052C0C8957A1684EA28C0	2
1373	1089+000	-12.45813	-72.502919	0101000020E61000005F622CD32F2052C00AA2EE0390EA28C0	2
1374	1090+000	-12.458177	-72.502942	0101000020E61000003B72A433302052C00C8FFD2C96EA28C0	2
1375	1091+000	-12.458225	-72.502946	0101000020E6100000DB696B44302052C0516B9A779CEA28C0	2
1376	1092+000	-12.458266	-72.502933	0101000020E610000011C5E40D302052C0CBBC55D7A1EA28C0	2
1377	1093+000	-12.458286	-72.50288	0101000020E61000000074982F2F2052C0E76D6C76A4EA28C0	2
1378	1094+000	-12.458274	-72.502824	0101000020E610000036E9B6442E2052C0D636C5E3A2EA28C0	2
1379	1095+000	-12.458249	-72.502785	0101000020E6100000D7FA22A12D2052C073D9E89C9FEA28C0	2
1380	1096+000	-12.458189	-72.50275	0101000020E61000001904560E2D2052C01EC6A4BF97EA28C0	2
1381	1097+000	-12.457933	-72.502676	0101000020E6100000FB1EF5D72B2052C0B284B53176EA28C0	2
1382	1098+000	-12.4577	-72.502599	0101000020E61000002600FF942A2052C027C286A757EA28C0	2
1383	1099+000	-12.45759	-72.502577	0101000020E610000032AEB8382A2052C00AF4893C49EA28C0	2
1384	1100+000	-12.457518	-72.502563	0101000020E61000007F4B00FE292052C0A4A99ECC3FEA28C0	2
1385	1101+000	-12.457404	-72.502579	0101000020E6100000022A1C412A2052C0821E6ADB30EA28C0	2
1386	1102+000	-12.457226	-72.502663	0101000020E6100000317A6EA12B2052C005C3B98619EA28C0	2
1387	1103+000	-12.456997	-72.502728	0101000020E610000025B20FB22C2052C07FBDC282FBE928C0	2
1388	1104+000	-12.456861	-72.502744	0101000020E6100000A8902BF52C2052C0BEA25BAFE9E928C0	2
1389	1105+000	-12.456726	-72.502736	0101000020E610000066A19DD32C2052C03E7782FDD7E928C0	2
1390	1106+000	-12.456559	-72.502592	0101000020E6100000CDCEA2772A2052C09163EB19C2E928C0	2
1391	1107+000	-12.456391	-72.502523	0101000020E6100000389F3A56292052C0A260C614ACE928C0	2
1392	1108+000	-12.456324	-72.502427	0101000020E6100000276893C3272052C083C2A04CA3E928C0	2
1393	1109+000	-12.456271	-72.502276	0101000020E610000034643C4A252052C0F7393E5A9CE928C0	2
1394	1110+000	-12.45615	-72.502119	0101000020E6100000D0ECBAB7222052C00B24287E8CE928C0	2
1395	1111+000	-12.456144	-72.501988	0101000020E610000001BF4692202052C08388D4B48BE928C0	2
1396	1112+000	-12.456184	-72.501892	0101000020E6100000F0879FFF1E2052C0BCEA01F390E928C0	2
1397	1113+000	-12.456204	-72.501742	0101000020E6100000E5417A8A1C2052C0D89B189293E928C0	2
1398	1114+000	-12.45609	-72.501687	0101000020E61000000475CAA31B2052C0B610E4A084E928C0	2
1399	1115+000	-12.455956	-72.501591	0101000020E6100000F33D23111A2052C078D4981073E928C0	2
1400	1116+000	-12.455708	-72.501405	0101000020E61000004243FF04172052C0170D198F52E928C0	2
1401	1117+000	-12.455366	-72.501289	0101000020E61000000D36751E152052C0B16B7BBB25E928C0	2
1402	1118+000	-12.455052	-72.501213	0101000020E610000020D5B0DF132052C073F56393FCE828C0	2
1403	1119+000	-12.454991	-72.501083	0101000020E610000038656EBE112052C0DCF29194F4E828C0	2
1404	1120+000	-12.454864	-72.500898	0101000020E610000070287CB60E2052C0684128EFE3E828C0	2
1405	1121+000	-12.454683	-72.500816	0101000020E610000011548D5E0D2052C02618CE35CCE828C0	2
1406	1122+000	-12.45461	-72.500726	0101000020E6100000719010E50B2052C07FDE54A4C2E828C0	2
1407	1123+000	-12.454536	-72.500562	0101000020E6100000B4E73235092052C095B54DF1B8E828C0	2
1408	1124+000	-12.454362	-72.5005	0101000020E610000079E92631082052C01E17D522A2E828C0	2
1409	1125+000	-12.454195	-72.500502	0101000020E610000049658A39082052C071033E3F8CE828C0	2
1410	1126+000	-12.454004	-72.500532	0101000020E61000007FA65EB7082052C0A181583673E828C0	2
1411	1127+000	-12.453792	-72.500476	0101000020E6100000B51B7DCC072052C0745FCE6C57E828C0	2
1412	1128+000	-12.453618	-72.500305	0101000020E61000009E4143FF042052C0FDC0559E40E828C0	2
1413	1129+000	-12.453505	-72.500029	0101000020E61000004D83A279002052C01C25AFCE31E828C0	2
1414	1130+000	-12.45332	-72.499742	0101000020E6100000029CDEC5FB1F52C0D53E1D8F19E828C0	2
1415	1131+000	-12.453009	-72.499503	0101000020E610000040506EDBF71F52C05B96AFCBF0E728C0	2
1416	1132+000	-12.4528	-72.499271	0101000020E6100000D6355A0EF41F52C0F241CF66D5E728C0	2
1417	1133+000	-12.452621	-72.498745	0101000020E6100000C9022670EB1F52C034F790F0BDE728C0	2
1418	1134+000	-12.452561	-72.4985	0101000020E610000096438B6CE71F52C0DEE34C13B6E728C0	2
1419	1135+000	-12.452537	-72.498316	0101000020E6100000B5C4CA68E41F52C0BC75FEEDB2E728C0	2
1420	1136+000	-12.452609	-72.498286	0101000020E61000007F83F6EAE31F52C023C0E95DBCE728C0	2
1421	1137+000	-12.452668	-72.49839	0101000020E6100000D2A92B9FE51F52C036E49F19C4E728C0	2
1422	1138+000	-12.452656	-72.498549	0101000020E6100000069D103AE81F52C025ADF886C2E728C0	2
1423	1139+000	-12.452734	-72.498775	0101000020E6100000FE43FAEDEB1F52C0149337C0CCE728C0	2
1424	1140+000	-12.452872	-72.498983	0101000020E6100000A3906456EF1F52C0588CBAD6DEE728C0	2
1425	1141+000	-12.453045	-72.499203	0101000020E61000002AC423F1F21F52C08E3BA583F5E728C0	2
1426	1142+000	-12.453188	-72.499411	0101000020E6100000CF108E59F61F52C01AE1ED4108E828C0	2
1427	1143+000	-12.453373	-72.499497	0101000020E6100000CFDC43C2F71F52C060C77F8120E828C0	2
1428	1144+000	-12.453505	-72.499564	0101000020E6100000939048DBF81F52C01C25AFCE31E828C0	2
1429	1145+000	-12.453714	-72.499723	0101000020E6100000C7832D76FB1F52C085798F334DE828C0	2
1430	1146+000	-12.454001	-72.499974	0101000020E61000006BB6F292FF1F52C0DDB3AED172E828C0	2
1431	1147+000	-12.454222	-72.500139	0101000020E6100000111D0247022052C0573F36C98FE828C0	2
1432	1148+000	-12.454407	-72.500213	0101000020E61000002E02637D032052C09E25C808A8E828C0	2
1433	1149+000	-12.454478	-72.50017	0101000020E61000002E1C08C9022052C0C3802557B1E828C0	2
1434	1150+000	-12.454425	-72.500072	0101000020E61000004D69FD2D012052C038F8C264AAE828C0	2
1435	1151+000	-12.45421	-72.499962	0101000020E610000089CF9D60FF1F52C046088F368EE828C0	2
1436	1152+000	-12.454066	-72.499821	0101000020E6100000A8363811FD1F52C07973B8567BE828C0	2
1437	1153+000	-12.453833	-72.499522	0101000020E61000007B681F2BF81F52C0EEB089CC5CE828C0	2
1438	1154+000	-12.453606	-72.499375	0101000020E6100000295C8FC2F51F52C0EC89AE0B3FE828C0	2
1439	1155+000	-12.453445	-72.499258	0101000020E61000000C91D3D7F31F52C0C7116BF129E828C0	2
1440	1156+000	-12.453284	-72.498959	0101000020E6100000DFC2BAF1EE1F52C0A29927D714E828C0	2
1441	1157+000	-12.453122	-72.498812	0101000020E61000008DB62A89EC1F52C03C32569BFFE728C0	2
1442	1158+000	-12.453051	-72.498665	0101000020E61000003BAA9A20EA1F52C017D7F84CF6E728C0	2
1443	1159+000	-12.453104	-72.498549	0101000020E6100000069D103AE81F52C0A25F5B3FFDE728C0	2
1444	1160+000	-12.453254	-72.498475	0101000020E6100000E9B7AF03E71F52C0F78F85E810E828C0	2
1445	1161+000	-12.453427	-72.498451	0101000020E610000025EA059FE61F52C02D3F709527E828C0	2
1446	1162+000	-12.453493	-72.498475	0101000020E6100000E9B7AF03E71F52C00BEE073C30E828C0	2
1447	1163+000	-12.453445	-72.498616	0101000020E6100000CA501553E91F52C0C7116BF129E828C0	2
1448	1164+000	-12.453373	-72.498745	0101000020E6100000C9022670EB1F52C060C77F8120E828C0	2
1449	1165+000	-12.453403	-72.498824	0101000020E61000006F9D7FBBEC1F52C00BD1217024E828C0	2
1450	1166+000	-12.453588	-72.498977	0101000020E6100000321D3A3DEF1F52C052B7B3AF3CE828C0	2
1451	1167+000	-12.453881	-72.499099	0101000020E6100000D89DEE3CF11F52C0338D261763E828C0	2
1452	1168+000	-12.454108	-72.499179	0101000020E610000066F6798CF21F52C035B401D880E828C0	2
1453	1169+000	-12.454407	-72.499216	0101000020E6100000F568AA27F31F52C09E25C808A8E828C0	2
1454	1170+000	-12.454561	-72.499336	0101000020E6100000CA6DFB1EF51F52C0F9122A38BCE828C0	2
1455	1171+000	-12.454669	-72.499501	0101000020E61000006FD40AD3F71F52C093020B60CAE828C0	2
1456	1172+000	-12.45486	-72.499593	0101000020E6100000E013EB54F91F52C06284F068E3E828C0	2
1457	1173+000	-12.455111	-72.499672	0101000020E610000086AE44A0FA1F52C087191A4F04E928C0	2
1458	1174+000	-12.455212	-72.49974	0101000020E610000032207BBDFB1F52C0567E198C11E928C0	2
1459	1175+000	-12.455182	-72.499929	0101000020E61000009B5434D6FE1F52C0AC74779D0DE928C0	2
1460	1176+000	-12.4552	-72.50018	0101000020E61000004087F9F2022052C0454772F90FE928C0	2
1461	1177+000	-12.455427	-72.500308	0101000020E6100000577BD80B052052C0486E4DBA2DE928C0	2
1462	1178+000	-12.45563	-72.500376	0101000020E610000003ED0E29062052C02827DA5548E928C0	2
1463	1179+000	-12.455863	-72.500443	0101000020E6100000C7A01342072052C0B4E908E066E928C0	2
1464	1180+000	-12.45609	-72.50048	0101000020E6100000551344DD072052C0B610E4A084E928C0	2
1465	1181+000	-12.456431	-72.500541	0101000020E6100000A8531EDD082052C0DBC2F352B1E928C0	2
1466	1182+000	-12.456712	-72.500633	0101000020E61000001893FE5E0A2052C0AA61BF27D6E928C0	2
1467	1183+000	-12.456921	-72.500706	0101000020E61000004DBA2D910B2052C013B69F8CF1E928C0	2
1468	1184+000	-12.45707	-72.500853	0101000020E6100000A0C6BDF90D2052C027F73B1405EA28C0	2
1469	1185+000	-12.457261	-72.500981	0101000020E6100000B6BA9C12102052C0F778211D1EEA28C0	2
1470	1186+000	-12.457375	-72.501073	0101000020E610000027FA7C94112052C01904560E2DEA28C0	2
1471	1187+000	-12.457566	-72.501263	0101000020E610000078EC67B1142052C0E8853B1746EA28C0	2
1472	1188+000	-12.457835	-72.501361	0101000020E61000005A9F724C162052C0A6ED5F5969EA28C0	2
1473	1189+000	-12.458098	-72.501379	0101000020E6100000ADF9F197162052C0DCB930D28BEA28C0	2
1474	1190+000	-12.458307	-72.501459	0101000020E61000003B527DE7172052C0450E1137A7EA28C0	2
1475	1191+000	-12.458564	-72.501471	0101000020E61000001D39D219182052C0F33E8EE6C8EA28C0	2
1476	1192+000	-12.458862	-72.501367	0101000020E6100000CB129D65162052C01AC1C6F5EFEA28C0	2
1477	1193+000	-12.459131	-72.501379	0101000020E6100000ADF9F197162052C0D828EB3713EB28C0	2
1478	1194+000	-12.459334	-72.501348	0101000020E61000008FFAEB15162052C0B9E177D32DEB28C0	2
1479	1195+000	-12.459573	-72.501189	0101000020E61000005B07077B132052C0CD3FFA264DEB28C0	2
1480	1196+000	-12.459746	-72.501232	0101000020E61000005BED612F142052C003EFE4D363EB28C0	2
1481	1197+000	-12.459955	-72.501312	0101000020E6100000E945ED7E152052C06C43C5387FEB28C0	2
1482	1198+000	-12.460618	-72.501703	0101000020E61000008753E6E61B2052C0DAE55B1FD6EB28C0	2
1483	1199+000	-12.461132	-72.501948	0101000020E6100000BA1281EA1F2052C03447567E19EC28C0	2
1484	1200+000	-12.461419	-72.502015	0101000020E61000007EC68503212052C08C81751C3FEC28C0	2
1485	1201+000	-12.461658	-72.502162	0101000020E6100000D0D2156C232052C0A0DFF76F5EEC28C0	2
1486	1202+000	-12.461819	-72.502492	0101000020E61000001BA034D4282052C0C5573B8A73EC28C0	2
1487	1203+000	-12.461855	-72.502866	0101000020E61000004D11E0F42E2052C0F8FC304278EC28C0	2
1488	1204+000	-12.461867	-72.503098	0101000020E6100000B62BF4C1322052C00934D8D479EC28C0	2
1489	1205+000	-12.461944	-72.503116	0101000020E61000000A86730D332052C0B72A89EC83EC28C0	2
1490	1206+000	-12.462076	-72.503	0101000020E6100000D578E926312052C07288B83995EC28C0	2
1491	1207+000	-12.462088	-72.502811	0101000020E61000006B44300E2E2052C083BF5FCC96EC28C0	2
1492	1208+000	-12.462034	-72.502596	0101000020E61000006DC669882A2052C0B6476FB88FEC28C0	2
1493	1209+000	-12.461974	-72.502395	0101000020E610000022AB5B3D272052C061342BDB87EC28C0	2
1494	1210+000	-12.46195	-72.502174	0101000020E6100000B2B96A9E232052C03FC6DCB584EC28C0	2
1495	1211+000	-12.461891	-72.501972	0101000020E61000007EE02A4F202052C02BA226FA7CEC28C0	2
1496	1212+000	-12.461741	-72.501752	0101000020E6100000F7AC6BB41C2052C0D671FC5069EC28C0	2
1497	1213+000	-12.461473	-72.501648	0101000020E6100000A58636001B2052C059F9653046EC28C0	2
1498	1214+000	-12.46127	-72.50155	0101000020E6100000C3D32B65192052C07940D9942BEC28C0	2
1499	1215+000	-12.461108	-72.501434	0101000020E61000008FC6A17E172052C012D9075916EC28C0	2
1500	1216+000	-12.460995	-72.5013	0101000020E6100000075F984C152052C0323D618907EC28C0	2
1501	1217+000	-12.46081	-72.501147	0101000020E610000044DFDDCA122052C0EB56CF49EFEB28C0	2
1502	1218+000	-12.460714	-72.500945	0101000020E610000010069E7B0F2052C0629E95B4E2EB28C0	2
1503	1219+000	-12.46078	-72.500877	0101000020E61000006494675E0E2052C0404D2D5BEBEB28C0	2
1504	1220+000	-12.460881	-72.500945	0101000020E610000010069E7B0F2052C010B22C98F8EB28C0	2
1505	1221+000	-12.460977	-72.501098	0101000020E6100000D38558FD112052C0986A662D05EC28C0	2
1506	1222+000	-12.461162	-72.501251	0101000020E61000009605137F142052C0DF50F86C1DEC28C0	2
1507	1223+000	-12.461281	-72.5013	0101000020E6100000075F984C152052C04888F2052DEC28C0	2
1508	1224+000	-12.461484	-72.50133	0101000020E61000003CA06CCA152052C029417FA147EC28C0	2
1509	1225+000	-12.461496	-72.501232	0101000020E61000005BED612F142052C03A78263449EC28C0	2
1510	1226+000	-12.461353	-72.501116	0101000020E610000026E0D748122052C0AFD2DD7536EC28C0	2
1511	1227+000	-12.461174	-72.500988	0101000020E610000010ECF82F102052C0F0879FFF1EEC28C0	2
1512	1228+000	-12.461072	-72.500865	0101000020E610000082AD122C0E2052C0DF3312A111EC28C0	2
1513	1229+000	-12.461132	-72.500773	0101000020E6100000116E32AA0C2052C03447567E19EC28C0	2
1514	1230+000	-12.461258	-72.500737	0101000020E61000006BB933130C2052C0680932022AEC28C0	2
1515	1231+000	-12.46149	-72.500724	0101000020E6100000A114ADDC0B2052C0B1DCD26A48EC28C0	2
1516	1232+000	-12.461616	-72.500669	0101000020E6100000BF47FDF50A2052C0E49EAEEE58EC28C0	2
1517	1233+000	-12.461735	-72.500486	0101000020E6100000C6866EF6072052C04DD6A88768EC28C0	2
1518	1234+000	-12.461849	-72.500437	0101000020E6100000562DE928072052C07061DD7877EC28C0	2
1519	1235+000	-12.46198	-72.500431	0101000020E6100000E5B9BE0F072052C0EACF7EA488EC28C0	2
1520	1236+000	-12.462219	-72.500198	0101000020E610000093E1783E032052C0FD2D01F8A7EC28C0	2
1521	1237+000	-12.462434	-72.500186	0101000020E6100000B1FA230C032052C0EF1D3526C4EC28C0	2
1522	1238+000	-12.462799	-72.500278	0101000020E6100000213A048E042052C0363E93FDF3EC28C0	2
1523	1239+000	-12.463181	-72.500223	0101000020E6100000406D54A7032052C0D5415E0F26ED28C0	2
1524	1240+000	-12.463539	-72.500021	0101000020E61000000C941458002052C052D7DAFB54ED28C0	2
1525	1241+000	-12.463754	-72.499813	0101000020E61000006747AAEFFC1F52C043C70E2A71ED28C0	2
1526	1242+000	-12.46385	-72.499801	0101000020E6100000856055BDFC1F52C0CC7F48BF7DED28C0	2
1527	1243+000	-12.463934	-72.499874	0101000020E6100000BA8784EFFD1F52C04301DBC188ED28C0	2
1528	1244+000	-12.464065	-72.49999	0101000020E6100000EE940ED6FF1F52C0BD6F7CED99ED28C0	2
1529	1245+000	-12.464262	-72.500137	0101000020E610000040A19E3E022052C0158DB5BFB3ED28C0	2
1530	1246+000	-12.464567	-72.500241	0101000020E610000093C7D3F2032052C0079ACFB9DBED28C0	2
1531	1247+000	-12.4648	-72.500278	0101000020E6100000213A048E042052C0925CFE43FAED28C0	2
1532	1248+000	-12.464997	-72.500186	0101000020E6100000B1FA230C032052C0EA79371614EE28C0	2
1533	1249+000	-12.465182	-72.500107	0101000020E61000000B60CAC0012052C03160C9552CEE28C0	2
1534	1250+000	-12.465361	-72.500174	0101000020E6100000CF13CFD9022052C0EFAA07CC43EE28C0	2
1535	1251+000	-12.465696	-72.500321	0101000020E610000021205F42052052C08BC1C3B46FEE28C0	2
1536	1252+000	-12.465863	-72.5004	0101000020E6100000C7BAB88D062052C039D55A9885EE28C0	2
1537	1253+000	-12.465947	-72.500639	0101000020E61000008A0629780A2052C0B056ED9A90EE28C0	2
1538	1254+000	-12.466054	-72.500743	0101000020E6100000DC2C5E2C0C2052C0085740A19EEE28C0	2
1539	1255+000	-12.466198	-72.500743	0101000020E6100000DC2C5E2C0C2052C0D5EB1681B1EE28C0	2
1540	1256+000	-12.46646	-72.500786	0101000020E6100000DC12B9E00C2052C0C9C859D8D3EE28C0	2
1541	1257+000	-12.466598	-72.500884	0101000020E6100000BDC5C37B0E2052C00DC2DCEEE5EE28C0	2
1542	1258+000	-12.466783	-72.501018	0101000020E6100000452DCDAD102052C054A86E2EFEEE28C0	2
1543	1259+000	-12.466968	-72.501085	0101000020E610000009E1D1C6112052C09B8E006E16EF28C0	2
1544	1260+000	-12.467195	-72.501079	0101000020E6100000986DA7AD112052C09EB5DB2E34EF28C0	2
1545	1261+000	-12.467344	-72.501067	0101000020E6100000B686527B112052C0B2F677B647EF28C0	2
1546	1262+000	-12.467428	-72.501165	0101000020E610000097395D16132052C029780AB952EF28C0	2
1547	1263+000	-12.467548	-72.501318	0101000020E61000005AB91798152052C0D49E927362EF28C0	2
1548	1264+000	-12.467715	-72.501385	0101000020E61000001E6D1CB1162052C081B2295778EF28C0	2
1549	1265+000	-12.468079	-72.501612	0101000020E6100000FED137691A2052C086E3F90CA8EF28C0	2
1550	1266+000	-12.468229	-72.501679	0101000020E6100000C2853C821B2052C0DB1324B6BBEF28C0	2
1551	1267+000	-12.468408	-72.501673	0101000020E6100000511212691B2052C09A5E622CD3EF28C0	2
1552	1268+000	-12.468665	-72.501575	0101000020E6100000705F07CE192052C0478FDFDBF4EF28C0	2
1553	1269+000	-12.46891	-72.501563	0101000020E61000008E78B29B192052C0E388B5F814F028C0	2
1554	1270+000	-12.469107	-72.501556	0101000020E61000003447567E192052C03BA6EECA2EF028C0	2
1555	1271+000	-12.469316	-72.50155	0101000020E6100000C3D32B65192052C0A4FACE2F4AF028C0	2
1556	1272+000	-12.469471	-72.501501	0101000020E6100000537AA697182052C041D7BE805EF028C0	2
1557	1273+000	-12.46962	-72.501269	0101000020E6100000E95F92CA142052C055185B0872F028C0	2
1558	1274+000	-12.469746	-72.501067	0101000020E6100000B686527B112052C088DA368C82F028C0	2
1559	1275+000	-12.469889	-72.50092	0101000020E6100000637AC2120F2052C013807F4A95F028C0	2
1560	1276+000	-12.470015	-72.500926	0101000020E6100000D5EDEC2B0F2052C046425BCEA5F028C0	2
1561	1277+000	-12.47014	-72.500871	0101000020E6100000F3203D450E2052C03815A930B6F028C0	2
1562	1278+000	-12.470236	-72.500712	0101000020E6100000BE2D58AA0B2052C0C0CDE2C5C2F028C0	2
1563	1279+000	-12.470427	-72.500553	0101000020E61000008A3A730F092052C0904FC8CEDBF028C0	2
1564	1280+000	-12.47063	-72.500474	0101000020E6100000E49F19C4072052C07008556AF6F028C0	2
1565	1281+000	-12.470946	-72.500357	0101000020E6100000C7D45DD9052052C0315D88D51FF128C0	2
1566	1282+000	-12.471102	-72.500241	0101000020E610000093C7D3F2032052C00F29064834F128C0	2
1567	1283+000	-12.471275	-72.499984	0101000020E61000007D21E4BCFF1F52C045D8F0F44AF128C0	2
1568	1284+000	-12.471442	-72.499923	0101000020E61000002AE109BDFE1F52C0F2EB87D860F128C0	2
1569	1285+000	-12.471663	-72.49985	0101000020E6100000F5B9DA8AFD1F52C06C770FD07DF128C0	2
1570	1286+000	-12.471872	-72.499844	0101000020E61000008446B071FD1F52C0D5CBEF3499F128C0	2
1571	1287+000	-12.471932	-72.500003	0101000020E6100000B939950C002052C02BDF3312A1F128C0	2
1572	1288+000	-12.471884	-72.500241	0101000020E610000093C7D3F2032052C0E60297C79AF128C0	2
1573	1289+000	-12.471956	-72.500382	0101000020E610000074603942062052C04D4D8237A4F128C0	2
1574	1290+000	-12.472087	-72.5004	0101000020E6100000C7BAB88D062052C0C7BB2363B5F128C0	2
1575	1291+000	-12.472207	-72.500296	0101000020E6100000759483D9042052C071E2AB1DC5F128C0	2
1576	1292+000	-12.472278	-72.500058	0101000020E61000009A0645F3002052C0963D096CCEF128C0	2
1577	1293+000	-12.472392	-72.499929	0101000020E61000009B5434D6FE1F52C0B8C83D5DDDF128C0	2
1578	1294+000	-12.472631	-72.499831	0101000020E6100000BAA1293BFD1F52C0CC26C0B0FCF128C0	2
1579	1295+000	-12.47287	-72.499715	0101000020E610000085949F54FB1F52C0E08442041CF228C0	2
1580	1296+000	-12.473151	-72.499721	0101000020E6100000F607CA6DFB1F52C0AF230ED940F228C0	2
1581	1297+000	-12.473306	-72.49966	0101000020E6100000A4C7EF6DFA1F52C04B00FE2955F228C0	2
1582	1298+000	-12.473473	-72.499428	0101000020E61000003AADDBA0F61F52C0F913950D6BF228C0	2
1583	1299+000	-12.473545	-72.499189	0101000020E610000078616BB6F21F52C05F5E807D74F228C0	2
1584	1300+000	-12.473676	-72.498797	0101000020E6100000F295404AEC1F52C0D9CC21A985F228C0	2
1585	1301+000	-12.473849	-72.498657	0101000020E6100000F9BA0CFFE91F52C00F7C0C569CF228C0	2
1586	1302+000	-12.474136	-72.498571	0101000020E6100000FAEE5696E81F52C067B62BF4C1F228C0	2
1587	1303+000	-12.474459	-72.498436	0101000020E61000008AC91B60E61F52C0F295404AECF228C0	2
1588	1304+000	-12.474566	-72.498259	0101000020E6100000037CB779E31F52C04A969350FAF228C0	2
1589	1305+000	-12.474716	-72.497708	0101000020E610000049BDA772DA1F52C0A0C6BDF90DF328C0	2
1590	1306+000	-12.474698	-72.497421	0101000020E6100000FED5E3BED51F52C006F4C29D0BF328C0	2
1591	1307+000	-12.474554	-72.497213	0101000020E610000059897956D21F52C0395FECBDF8F228C0	2
1592	1308+000	-12.474447	-72.497054	0101000020E6100000259694BBCF1F52C0E15E99B7EAF228C0	2
1593	1309+000	-12.474339	-72.496785	0101000020E61000002D095053CB1F52C0486FB88FDCF228C0	2
1594	1310+000	-12.474196	-72.496405	0101000020E610000089247A19C51F52C0BCC96FD1C9F228C0	2
1595	1311+000	-12.474154	-72.496142	0101000020E6100000030B60CAC01F52C001892650C4F228C0	2
1596	1312+000	-12.474208	-72.495671	0101000020E6100000D7A4DB12B91F52C0CE001764CBF228C0	2
1597	1313+000	-12.47422	-72.495237	0101000020E61000003AB187F6B11F52C0DF37BEF6CCF228C0	2
1598	1314+000	-12.474286	-72.494919	0101000020E6100000D1CABDC0AC1F52C0BCE6559DD5F228C0	2
1599	1315+000	-12.474447	-72.494533	0101000020E6100000BD72BD6DA61F52C0E15E99B7EAF228C0	2
1600	1316+000	-12.4745	-72.49427	0101000020E61000003659A31EA21F52C06DE7FBA9F1F228C0	2
1601	1317+000	-12.474453	-72.494087	0101000020E61000003D98141F9F1F52C06AFAEC80EBF228C0	2
1602	1318+000	-12.474369	-72.493879	0101000020E6100000994BAAB69B1F52C0F2785A7EE0F228C0	2
1603	1319+000	-12.474268	-72.493591	0101000020E610000065A6B4FE961F52C023145B41D3F228C0	2
1604	1320+000	-12.474309	-72.493487	0101000020E610000013807F4A951F52C09D6516A1D8F228C0	2
1605	1321+000	-12.474399	-72.493536	0101000020E610000084D90418961F52C09D82FC6CE4F228C0	2
1606	1322+000	-12.4745	-72.493695	0101000020E6100000B8CCE9B2981F52C06DE7FBA9F1F228C0	2
1607	1323+000	-12.474578	-72.49394	0101000020E6100000EB8B84B69C1F52C05BCD3AE3FBF228C0	2
1608	1324+000	-12.474662	-72.494136	0101000020E6100000AEF199EC9F1F52C0D34ECDE506F328C0	2
1609	1325+000	-12.474751	-72.494087	0101000020E61000003D98141F9F1F52C0917C259012F328C0	2
1610	1326+000	-12.474763	-72.493952	0101000020E6100000CD72D9E89C1F52C0A2B3CC2214F328C0	2
1611	1327+000	-12.474692	-72.493738	0101000020E6100000B7B24467991F52C07D586FD40AF328C0	2
1612	1328+000	-12.474584	-72.493518	0101000020E6100000307F85CC951F52C0E4688EACFCF228C0	2
1613	1329+000	-12.474554	-72.493334	0101000020E61000005000C5C8921F52C0395FECBDF8F228C0	2
1614	1330+000	-12.47459	-72.493163	0101000020E610000039268BFB8F1F52C06C04E275FDF228C0	2
1615	1331+000	-12.474728	-72.49309	0101000020E610000004FF5BC98E1F52C0B1FD648C0FF328C0	2
1616	1332+000	-12.474829	-72.493035	0101000020E61000002332ACE28D1F52C0806264C91CF328C0	2
1617	1333+000	-12.474817	-72.4929	0101000020E6100000B30C71AC8B1F52C06F2BBD361BF328C0	2
1618	1334+000	-12.474757	-72.492827	0101000020E61000007EE5417A8A1F52C01A18795913F328C0	2
1619	1335+000	-12.474799	-72.492674	0101000020E6100000BA6587F8871F52C0D658C2DA18F328C0	2
1620	1336+000	-12.474853	-72.492472	0101000020E6100000878C47A9841F52C0A2D0B2EE1FF328C0	2
1621	1337+000	-12.474763	-72.492343	0101000020E610000088DA368C821F52C0A2B3CC2214F328C0	2
1622	1338+000	-12.474734	-72.49219	0101000020E6100000C45A7C0A801F52C03999B85510F328C0	2
1623	1339+000	-12.474793	-72.491897	0101000020E610000008008E3D7B1F52C04DBD6E1118F328C0	2
1624	1340+000	-12.474984	-72.491077	0101000020E610000057B439CE6D1F52C01C3F541A31F328C0	2
1625	1341+000	-12.475092	-72.490661	0101000020E61000000D1B65FD661F52C0B62E35423FF328C0	2
1626	1342+000	-12.475187	-72.490441	0101000020E610000086E7A562631F52C0FDF7E0B54BF328C0	2
1627	1343+000	-12.475241	-72.490184	0101000020E61000007041B62C5F1F52C0CA6FD1C952F328C0	2
1628	1344+000	-12.475223	-72.48997	0101000020E61000005A8121AB5B1F52C0309DD66D50F328C0	2
1629	1345+000	-12.475289	-72.48978	0101000020E6100000088F368E581F52C00E4C6E1459F328C0	2
1630	1346+000	-12.475414	-72.489621	0101000020E6100000D49B51F3551F52C0001FBC7669F328C0	2
1631	1347+000	-12.475414	-72.489492	0101000020E6100000D5E940D6531F52C0001FBC7669F328C0	2
1632	1348+000	-12.475432	-72.489284	0101000020E6100000309DD66D501F52C099F1B6D26BF328C0	2
1633	1349+000	-12.475504	-72.488954	0101000020E6100000E6CFB7054B1F52C0003CA24275F328C0	2
1634	1350+000	-12.475629	-72.488746	0101000020E610000041834D9D471F52C0F10EF0A485F328C0	2
1635	1351+000	-12.475725	-72.488367	0101000020E6100000855CA967411F52C07AC7293A92F328C0	2
1636	1352+000	-12.475731	-72.487981	0101000020E61000007104A9143B1F52C002637D0393F328C0	2
1637	1353+000	-12.475552	-72.487731	0101000020E6100000B48F15FC361F52C044183F8D7BF328C0	2
1638	1354+000	-12.475396	-72.487608	0101000020E610000026512FF8341F52C0664CC11A67F328C0	2
1639	1355+000	-12.475402	-72.487443	0101000020E610000081EA1F44321F52C0EFE714E467F328C0	2
1640	1356+000	-12.475492	-72.487425	0101000020E61000002E90A0F8311F52C0EE04FBAF73F328C0	2
1641	1357+000	-12.475576	-72.487492	0101000020E6100000F243A511331F52C066868DB27EF328C0	2
1642	1358+000	-12.475725	-72.487682	0101000020E61000004436902E361F52C07AC7293A92F328C0	2
1643	1359+000	-12.475934	-72.487939	0101000020E610000059DC7F643A1F52C0E31B0A9FADF328C0	2
1644	1360+000	-12.475964	-72.488238	0101000020E610000086AA984A3F1F52C08D25AC8DB1F328C0	2
1645	1361+000	-12.475904	-72.488563	0101000020E610000048C2BE9D441F52C0381268B0A9F328C0	2
1646	1362+000	-12.475874	-72.489095	0101000020E6100000C7681D554D1F52C08D08C6C1A5F328C0	2
1647	1363+000	-12.47588	-72.489444	0101000020E61000004D4EED0C531F52C016A4198BA6F328C0	2
1648	1364+000	-12.475844	-72.489719	0101000020E6100000B54E5C8E571F52C0E3FE23D3A1F328C0	2
1649	1365+000	-12.47588	-72.489817	0101000020E610000097016729591F52C016A4198BA6F328C0	2
1650	1366+000	-12.475964	-72.489786	0101000020E6100000790261A7581F52C08D25AC8DB1F328C0	2
1651	1367+000	-12.476018	-72.489627	0101000020E6100000450F7C0C561F52C05A9D9CA1B8F328C0	2
1652	1368+000	-12.476101	-72.489395	0101000020E6100000DCF4673F521F52C0902FA182C3F328C0	2
1653	1369+000	-12.476107	-72.489138	0101000020E6100000C64E78094E1F52C019CBF44BC4F328C0	2
1654	1370+000	-12.476054	-72.488942	0101000020E610000003E962D34A1F52C08D429259BDF328C0	2
1655	1371+000	-12.476143	-72.488648	0101000020E61000005FD04202461F52C04C70EA03C9F328C0	2
1656	1372+000	-12.476257	-72.488177	0101000020E6100000336ABE4A3E1F52C06EFB1EF5D7F328C0	2
1657	1373+000	-12.476322	-72.487786	0101000020E6100000965CC5E2371F52C00ABB287AE0F328C0	2
1658	1374+000	-12.476436	-72.487572	0101000020E6100000809C3061341F52C02C465D6BEFF328C0	2
1659	1375+000	-12.476484	-72.487308	0101000020E610000011C5E40D301F52C07022FAB5F5F328C0	2
1660	1376+000	-12.476514	-72.487131	0101000020E61000008A7780272D1F52C01B2C9CA4F9F328C0	2
1661	1377+000	-12.476693	-72.486886	0101000020E610000056B8E523291F52C0D976DA1A11F428C0	2
1662	1378+000	-12.47674	-72.486703	0101000020E61000005EF75624261F52C0DC63E94317F428C0	2
1663	1379+000	-12.476956	-72.486342	0101000020E6100000F52A323A201F52C00F43AB9333F428C0	2
1664	1380+000	-12.477308	-72.485767	0101000020E6100000779E78CE161F52C0043DD4B661F428C0	2
1665	1381+000	-12.477433	-72.485638	0101000020E610000078EC67B1141F52C0F50F221972F428C0	2
1666	1382+000	-12.477499	-72.485632	0101000020E610000007793D98141F52C0D3BEB9BF7AF428C0	2
1667	1383+000	-12.477541	-72.485694	0101000020E61000004277499C151F52C08FFF024180F428C0	2
1668	1384+000	-12.477535	-72.485859	0101000020E6100000E8DD5850181F52C00664AF777FF428C0	2
1669	1385+000	-12.477392	-72.486324	0101000020E6100000A2D0B2EE1F1F52C07BBE66B96CF428C0	2
1670	1386+000	-12.47732	-72.486623	0101000020E6100000CF9ECBD4241F52C015747B4963F428C0	2
1671	1387+000	-12.477356	-72.48674	0101000020E6100000EC6987BF261F52C04819710168F428C0	2
1672	1388+000	-12.477433	-72.48677	0101000020E610000022AB5B3D271F52C0F50F221972F428C0	2
1673	1389+000	-12.477535	-72.486666	0101000020E6100000CF842689251F52C00664AF777FF428C0	2
1674	1390+000	-12.477657	-72.486337	0101000020E61000006D753925201F52C0346953758FF428C0	2
1675	1391+000	-12.477818	-72.485879	0101000020E61000000BB43BA4181F52C058E1968FA4F428C0	2
1676	1392+000	-12.477818	-72.485515	0101000020E6100000EBAD81AD121F52C058E1968FA4F428C0	2
1677	1393+000	-12.477792	-72.485161	0101000020E6100000DC12B9E00C1F52C0B4942C27A1F428C0	2
1678	1394+000	-12.477818	-72.484745	0101000020E61000009279E40F061F52C058E1968FA4F428C0	2
1679	1395+000	-12.477742	-72.484399	0101000020E6100000C4CDA964001F52C0ECD973999AF428C0	2
1680	1396+000	-12.477716	-72.484174	0101000020E6100000B4E4F1B4FC1E52C0478D093197F428C0	2
1681	1397+000	-12.477852	-72.483941	0101000020E6100000630CACE3F81E52C009A87004A9F428C0	2
1682	1398+000	-12.478037	-72.483828	0101000020E6100000E738B709F71E52C0508E0244C1F428C0	2
1683	1399+000	-12.47821	-72.483611	0101000020E6100000183F8D7BF31E52C0863DEDF0D7F428C0	2
1684	1400+000	-12.47836	-72.483562	0101000020E6100000A8E507AEF21E52C0DB6D179AEBF428C0	2
1685	1401+000	-12.47858	-72.483544	0101000020E6100000548B8862F21E52C0130A117008F528C0	2
1686	1402+000	-12.478766	-72.48355	0101000020E6100000C5FEB27BF21E52C09CDF30D120F528C0	2
1687	1403+000	-12.478897	-72.483685	0101000020E61000003524EEB1F41E52C0164ED2FC31F528C0	2
1688	1404+000	-12.47904	-72.483825	0101000020E61000002EFF21FDF61E52C0A1F31ABB44F528C0	2
1689	1405+000	-12.479232	-72.483862	0101000020E6100000BD715298F71E52C0B2648EE55DF528C0	2
1690	1406+000	-12.479369	-72.483966	0101000020E61000000F98874CF91E52C0B56E83DA6FF528C0	2
1691	1407+000	-12.479548	-72.484033	0101000020E6100000D34B8C65FA1E52C073B9C15087F528C0	2
1692	1408+000	-12.479692	-72.48399	0101000020E6100000D46531B1F91E52C0404E98309AF528C0	2
1693	1409+000	-12.479883	-72.483905	0101000020E6100000BC57AD4CF81E52C00FD07D39B3F528C0	2
1694	1410+000	-12.480116	-72.483966	0101000020E61000000F98874CF91E52C09B92ACC3D1F528C0	2
1695	1411+000	-12.48045	-72.484156	0101000020E6100000618A7269FC1E52C0F5B9DA8AFDF528C0	2
1696	1412+000	-12.480558	-72.484364	0101000020E610000006D7DCD1FF1E52C08FA9BBB20BF628C0	2
1697	1413+000	-12.480671	-72.484492	0101000020E61000001DCBBBEA011F52C06F4562821AF628C0	2
1698	1414+000	-12.480826	-72.48459	0101000020E6100000FE7DC685031F52C00C2252D32EF628C0	2
1699	1415+000	-12.480922	-72.484718	0101000020E61000001572A59E051F52C094DA8B683BF628C0	2
1700	1416+000	-12.480958	-72.484994	0101000020E6100000663046240A1F52C0C77F812040F628C0	2
1701	1417+000	-12.481018	-72.48519	0101000020E610000029965B5A0D1F52C01D93C5FD47F628C0	2
1702	1418+000	-12.481197	-72.485349	0101000020E61000005D8940F50F1F52C0DBDD03745FF628C0	2
1703	1419+000	-12.481298	-72.485587	0101000020E610000037177FDB131F52C0AB4203B16CF628C0	2
1704	1420+000	-12.481316	-72.485795	0101000020E6100000DC63E943171F52C04415FE0C6FF628C0	2
1705	1421+000	-12.481286	-72.486309	0101000020E610000008B0C8AF1F1F52C09A0B5C1E6BF628C0	2
1706	1422+000	-12.481292	-72.486701	0101000020E61000008D7BF31B261F52C022A7AFE76BF628C0	2
1707	1423+000	-12.48137	-72.486933	0101000020E6100000F69507E9291F52C0118DEE2076F628C0	2
1708	1424+000	-12.481436	-72.487227	0101000020E61000009BAE27BA2E1F52C0EF3B86C77EF628C0	2
1709	1425+000	-12.481543	-72.487367	0101000020E610000094895B05311F52C0473CD9CD8CF628C0	2
1710	1426+000	-12.481728	-72.487416	0101000020E610000004E3E0D2311F52C08E226B0DA5F628C0	2
1711	1427+000	-12.481878	-72.48749	0101000020E610000021C84109331F52C0E35295B6B8F628C0	2
1712	1428+000	-12.482176	-72.48771	0101000020E6100000A9FB00A4361F52C00BD5CDC5DFF628C0	2
1713	1429+000	-12.482457	-72.4879	0101000020E6100000FAEDEBC0391F52C0DA73999A04F728C0	2
1714	1430+000	-12.482863	-72.488206	0101000020E610000081ED60C43E1F52C09BE5B2D139F728C0	2
1715	1431+000	-12.483437	-72.488499	0101000020E61000003D484F91431F52C04B5AF10D85F728C0	2
1716	1432+000	-12.48361	-72.488622	0101000020E6100000CB863595451F52C08109DCBA9BF728C0	2
1717	1433+000	-12.483688	-72.488811	0101000020E610000034BBEEAD481F52C070EF1AF4A5F728C0	2
1718	1434+000	-12.483676	-72.489142	0101000020E610000067463F1A4E1F52C05FB87361A4F728C0	2
1719	1435+000	-12.483682	-72.489466	0101000020E610000040A03369531F52C0E753C72AA5F728C0	2
1720	1436+000	-12.483801	-72.489533	0101000020E610000004543882541F52C0508BC1C3B4F728C0	2
1721	1437+000	-12.48401	-72.489576	0101000020E6100000043A9336551F52C0B9DFA128D0F728C0	2
1722	1438+000	-12.484094	-72.489655	0101000020E6100000AAD4EC81561F52C03161342BDBF728C0	2
1723	1439+000	-12.484124	-72.489741	0101000020E6100000A9A0A2EA571F52C0DB6AD619DFF728C0	2
1724	1440+000	-12.484147	-72.490114	0101000020E6100000F4531C075E1F52C0BCE9961DE2F728C0	2
1725	1441+000	-12.484201	-72.490451	0101000020E61000009752978C631F52C089618731E9F728C0	2
1726	1442+000	-12.484231	-72.490665	0101000020E6100000AE122C0E671F52C0336B2920EDF728C0	2
1727	1443+000	-12.484315	-72.490903	0101000020E610000088A06AF46A1F52C0ABECBB22F8F728C0	2
1728	1444+000	-12.484464	-72.491032	0101000020E610000087527B116D1F52C0BE2D58AA0BF828C0	2
1729	1445+000	-12.484584	-72.490989	0101000020E6100000876C205D6C1F52C06954E0641BF828C0	2
1730	1446+000	-12.484751	-72.490928	0101000020E6100000342C465D6B1F52C01668774831F828C0	2
1731	1447+000	-12.484852	-72.490989	0101000020E6100000876C205D6C1F52C0E6CC76853EF828C0	2
1732	1448+000	-12.484882	-72.491142	0101000020E61000004AECDADE6E1F52C091D6187442F828C0	2
1733	1449+000	-12.484798	-72.49127	0101000020E610000061E0B9F7701F52C01955867137F828C0	2
1734	1450+000	-12.484584	-72.49143	0101000020E61000007D91D096731F52C06954E0641BF828C0	2
1735	1451+000	-12.484398	-72.491546	0101000020E6100000B29E5A7D751F52C0E17EC00303F828C0	2
1736	1452+000	-12.48438	-72.491729	0101000020E6100000AB5FE97C781F52C047ACC5A700F828C0	2
1737	1453+000	-12.484428	-72.492164	0101000020E610000030116F9D7F1F52C08B8862F206F828C0	2
1738	1454+000	-12.484404	-72.492543	0101000020E6100000EB3713D3851F52C0691A14CD03F828C0	2
1739	1455+000	-12.484398	-72.49272	0101000020E6100000738577B9881F52C0E17EC00303F828C0	2
1740	1456+000	-12.4845	-72.492892	0101000020E6100000711DE38A8B1F52C0F2D24D6210F828C0	2
1741	1457+000	-12.484846	-72.493314	0101000020E61000002C2AE274921F52C05D3123BC3DF828C0	2
1742	1458+000	-12.485002	-72.493491	0101000020E6100000B477465B951F52C03BFDA02E52F828C0	2
1743	1459+000	-12.485228	-72.493583	0101000020E610000024B726DD961F52C0FC34EECD6FF828C0	2
1744	1460+000	-12.485324	-72.493748	0101000020E6100000C91D3691991F52C085ED27637CF828C0	2
1745	1461+000	-12.485468	-72.49387	0101000020E61000006F9EEA909B1F52C05182FE428FF828C0	2
1746	1462+000	-12.485491	-72.493944	0101000020E61000008C834BC79C1F52C03201BF4692F828C0	2
1747	1463+000	-12.485456	-72.494005	0101000020E6100000DFC325C79D1F52C0404B57B08DF828C0	2
1748	1464+000	-12.485318	-72.494091	0101000020E6100000DE8FDB2F9F1F52C0FC51D4997BF828C0	2
1749	1465+000	-12.485246	-72.49425	0101000020E61000001283C0CAA11F52C09607E92972F828C0	2
1750	1466+000	-12.485246	-72.494433	0101000020E61000000B444FCAA41F52C09607E92972F828C0	2
1751	1467+000	-12.485372	-72.49455	0101000020E6100000280F0BB5A61F52C0C9C9C4AD82F828C0	2
1752	1468+000	-12.485557	-72.494647	0101000020E61000002104E44BA81F52C010B056ED9AF828C0	2
1753	1469+000	-12.48576	-72.494708	0101000020E61000007444BE4BA91F52C0F168E388B5F828C0	2
1754	1470+000	-12.485904	-72.494733	0101000020E610000020D099B4A91F52C0BDFDB968C8F828C0	2
1755	1471+000	-12.486023	-72.494819	0101000020E6100000209C4F1DAB1F52C02635B401D8F828C0	2
1756	1472+000	-12.486244	-72.495088	0101000020E610000017299485AF1F52C0A0C03BF9F4F828C0	2
1757	1473+000	-12.486399	-72.495228	0101000020E61000001004C8D0B11F52C03D9D2B4A09F928C0	2
1758	1474+000	-12.486572	-72.495265	0101000020E61000009F76F86BB21F52C0734C16F71FF928C0	2
1759	1475+000	-12.486799	-72.49529	0101000020E61000004B02D4D4B21F52C07573F1B73DF928C0	2
1760	1476+000	-12.487008	-72.495314	0101000020E61000000FD07D39B31F52C0DEC7D11C59F928C0	2
1761	1477+000	-12.487194	-72.495406	0101000020E6100000800F5EBBB41F52C0679DF17D71F928C0	2
1762	1478+000	-12.487391	-72.495394	0101000020E61000009E280989B41F52C0BFBA2A508BF928C0	2
1763	1479+000	-12.487534	-72.495473	0101000020E610000044C362D4B51F52C04A60730E9EF928C0	2
1764	1480+000	-12.487707	-72.495565	0101000020E6100000B4024356B71F52C0800F5EBBB4F928C0	2
1765	1481+000	-12.487863	-72.495577	0101000020E610000096E99788B71F52C05EDBDB2DC9F928C0	2
1766	1482+000	-12.488096	-72.495528	0101000020E6100000259012BBB61F52C0E99D0AB8E7F928C0	2
1767	1483+000	-12.488269	-72.49554	0101000020E6100000087767EDB61F52C01F4DF564FEF928C0	2
1768	1484+000	-12.48846	-72.495602	0101000020E6100000437573F1B71F52C0EECEDA6D17FA28C0	2
1769	1485+000	-12.488687	-72.495632	0101000020E610000078B6476FB81F52C0F1F5B52E35FA28C0	2
1770	1486+000	-12.488884	-72.495565	0101000020E6100000B4024356B71F52C04913EF004FFA28C0	2
1771	1487+000	-12.489212	-72.495253	0101000020E6100000BD8FA339B21F52C01B9FC9FE79FA28C0	2
1772	1488+000	-12.48941	-72.495045	0101000020E6100000184339D1AE1F52C0B4AB90F293FA28C0	2
1773	1489+000	-12.489499	-72.495002	0101000020E6100000185DDE1CAE1F52C073D9E89C9FFA28C0	2
1774	1490+000	-12.489565	-72.495033	0101000020E6100000365CE49EAE1F52C051888043A8FA28C0	2
1775	1491+000	-12.489619	-72.495241	0101000020E6100000DAA84E07B21F52C01D007157AFFA28C0	2
1776	1492+000	-12.489684	-72.495492	0101000020E61000007FDB1324B61F52C0BABF7ADCB7FA28C0	2
1777	1493+000	-12.489684	-72.495773	0101000020E6100000594FADBEBA1F52C0BABF7ADCB7FA28C0	2
1778	1494+000	-12.489648	-72.49595	0101000020E6100000E09C11A5BD1F52C0871A8524B3FA28C0	2
1779	1495+000	-12.489631	-72.496177	0101000020E6100000C1012D5DC11F52C02E3718EAB0FA28C0	2
1780	1496+000	-12.48972	-72.496391	0101000020E6100000D7C1C1DEC41F52C0ED647094BCFA28C0	2
1781	1497+000	-12.489619	-72.496532	0101000020E6100000B85A272EC71F52C01D007157AFFA28C0	2
1782	1498+000	-12.489422	-72.496648	0101000020E6100000EC67B114C91F52C0C5E2378595FA28C0	2
1783	1499+000	-12.489278	-72.496813	0101000020E610000092CEC0C8CB1F52C0F94D61A582FA28C0	2
1784	1500+000	-12.489302	-72.497137	0101000020E61000006B28B517D11F52C01BBCAFCA85FA28C0	2
1785	1501+000	-12.489332	-72.497425	0101000020E61000009FCDAACFD51F52C0C5C551B989FA28C0	2
1786	1502+000	-12.489302	-72.497761	0101000020E61000005A0EF450DB1F52C01BBCAFCA85FA28C0	2
1787	1503+000	-12.489117	-72.49811	0101000020E6100000E0F3C308E11F52C0D4D51D8B6DFA28C0	2
1788	1504+000	-12.488944	-72.498355	0101000020E610000014B35E0CE51F52C09E2633DE56FA28C0	2
1789	1505+000	-12.48895	-72.498538	0101000020E61000000C74ED0BE81F52C027C286A757FA28C0	2
1790	1506+000	-12.488997	-72.498685	0101000020E61000005E807D74EA1F52C029AF95D05DFA28C0	2
1791	1507+000	-12.489123	-72.498826	0101000020E61000003F19E3C3EC1F52C05C7171546EFA28C0	2
1792	1508+000	-12.4892	-72.49893	0101000020E6100000923F1878EE1F52C00A68226C78FA28C0	2
1793	1509+000	-12.489189	-72.499083	0101000020E610000055BFD2F9F01F52C03A2009FB76FA28C0	2
1794	1510+000	-12.489129	-72.499297	0101000020E61000006B7F677BF41F52C0E50CC51D6FFA28C0	2
1795	1511+000	-12.489087	-72.49959	0101000020E610000027DA5548F91F52C029CC7B9C69FA28C0	2
1796	1512+000	-12.489195	-72.499731	0101000020E61000000873BB97FB1F52C0C3BB5CC477FA28C0	2
1797	1513+000	-12.489374	-72.499804	0101000020E61000003D9AEAC9FC1F52C081069B3A8FFA28C0	2
1798	1514+000	-12.489571	-72.499768	0101000020E610000097E5EB32FC1F52C0D923D40CA9FA28C0	2
1799	1515+000	-12.489804	-72.499615	0101000020E6100000D46531B1F91F52C064E60297C7FA28C0	2
1800	1516+000	-12.49012	-72.499346	0101000020E6100000DCD8EC48F51F52C0253B3602F1FA28C0	2
1801	1517+000	-12.490323	-72.499119	0101000020E6100000FB73D190F11F52C006F4C29D0BFB28C0	2
1802	1518+000	-12.49055	-72.498991	0101000020E6100000E57FF277EF1F52C0091B9E5E29FB28C0	2
1803	1519+000	-12.490783	-72.498905	0101000020E6100000E5B33C0FEE1F52C094DDCCE847FB28C0	2
1804	1520+000	-12.490962	-72.498948	0101000020E6100000E59997C3EE1F52C052280B5F5FFB28C0	2
1805	1521+000	-12.49107	-72.499174	0101000020E6100000DD408177F21F52C0EC17EC866DFB28C0	2
1806	1522+000	-12.491249	-72.499535	0101000020E6100000450DA661F81F52C0AA622AFD84FB28C0	2
1807	1523+000	-12.491291	-72.49978	0101000020E610000079CC4065FC1F52C066A3737E8AFB28C0	2
1808	1524+000	-12.491345	-72.500049	0101000020E6100000715985CD002052C0331B649291FB28C0	2
1809	1525+000	-12.491422	-72.500208	0101000020E6100000A54C6A68032052C0E01115AA9BFB28C0	2
1810	1526+000	-12.491632	-72.500374	0101000020E61000003271AB20062052C08A558330B7FB28C0	2
1811	1527+000	-12.491834	-72.500575	0101000020E61000007E8CB96B092052C02A1F82AAD1FB28C0	2
1812	1528+000	-12.491912	-72.500771	0101000020E610000041F2CEA10C2052C01805C1E3DBFB28C0	2
1813	1529+000	-12.491906	-72.501034	0101000020E6100000C80BE9F0102052C090696D1ADBFB28C0	2
1814	1530+000	-12.491996	-72.501169	0101000020E610000038312427132052C0908653E6E6FB28C0	2
1815	1531+000	-12.492271	-72.501297	0101000020E61000004E250340152052C0D789CBF10AFC28C0	2
1816	1532+000	-12.492402	-72.501462	0101000020E6100000F48B12F4172052C051F86C1D1CFC28C0	2
1817	1533+000	-12.49248	-72.501603	0101000020E6100000D52478431A2052C040DEAB5626FC28C0	2
1818	1534+000	-12.492515	-72.501787	0101000020E6100000B5A338471D2052C0319413ED2AFC28C0	2
1819	1535+000	-12.492623	-72.501921	0101000020E61000003D0B42791F2052C0CB83F41439FC28C0	2
1820	1536+000	-12.492832	-72.502013	0101000020E6100000AE4A22FB202052C034D8D47954FC28C0	2
1821	1537+000	-12.493041	-72.502086	0101000020E6100000E371512D222052C09D2CB5DE6FFC28C0	2
1822	1538+000	-12.49319	-72.50227	0101000020E6100000C3F01131252052C0B16D516683FC28C0	2
1823	1539+000	-12.493322	-72.502454	0101000020E6100000A46FD234282052C06CCB80B394FC28C0	2
1824	1540+000	-12.493489	-72.502508	0101000020E61000009E7E5017292052C01ADF1797AAFC28C0	2
1825	1541+000	-12.49368	-72.502417	0101000020E610000015FDA199272052C0E960FD9FC3FC28C0	2
1826	1542+000	-12.493865	-72.502319	0101000020E6100000344A97FE252052C030478FDFDBFC28C0	2
1827	1543+000	-12.494062	-72.502269	0101000020E6100000DB32E02C252052C08864C8B1F5FC28C0	2
1828	1544+000	-12.494231	-72.502312	0101000020E6100000DB183BE1252052C0B8567BD80BFD28C0	2
1829	1545+000	-12.494383	-72.502295	0101000020E6100000707CED99252052C09065C1C41FFD28C0	2
1830	1546+000	-12.494451	-72.502217	0101000020E6100000B29FC552242052C0F1F274AE28FD28C0	2
1831	1547+000	-12.494594	-72.50213	0101000020E6100000CA15DEE5222052C07C98BD6C3BFD28C0	2
1832	1548+000	-12.494763	-72.502104	0101000020E610000036CCD078222052C0AD8A709351FD28C0	2
1833	1549+000	-12.495	-72.502122	0101000020E6100000892650C4222052C03D0AD7A370FD28C0	2
1834	1550+000	-12.495101	-72.502208	0101000020E610000088F2052D242052C00D6FD6E07DFD28C0	2
1835	1551+000	-12.495228	-72.502269	0101000020E6100000DB32E02C252052C0812040868EFD28C0	2
1836	1552+000	-12.495422	-72.502278	0101000020E610000005E09F52252052C01570CFF3A7FD28C0	2
1837	1553+000	-12.495473	-72.50239	0101000020E610000099F56228272052C01E1A16A3AEFD28C0	2
1838	1554+000	-12.49554	-72.502554	0101000020E6100000569E40D8292052C03DB83B6BB7FD28C0	2
1839	1555+000	-12.495726	-72.502658	0101000020E6100000A8C4758C2B2052C0C58D5BCCCFFD28C0	2
1840	1556+000	-12.496081	-72.502771	0101000020E610000024986A662D2052C07E552E54FEFD28C0	2
1841	1557+000	-12.496571	-72.502831	0101000020E61000008F1A13622E2052C0B648DA8D3EFE28C0	2
1842	1558+000	-12.496892	-72.502805	0101000020E6100000FAD005F52D2052C0BF49D3A068FE28C0	2
1843	1559+000	-12.497137	-72.50265	0101000020E610000067D5E76A2B2052C05B43A9BD88FE28C0	2
1844	1560+000	-12.497398	-72.502252	0101000020E6100000709692E5242052C00E315EF3AAFE28C0	2
1845	1561+000	-12.497652	-72.50188	0101000020E61000000EA14ACD1E2052C0F793313ECCFE28C0	2
1846	1562+000	-12.497838	-72.501551	0101000020E6100000AC915D69192052C07F69519FE4FE28C0	2
1847	1563+000	-12.497939	-72.501239	0101000020E6100000B41EBE4C142052C04FCE50DCF1FE28C0	2
1848	1564+000	-12.49788	-72.501101	0101000020E61000008CBFED09122052C03BAA9A20EAFE28C0	2
1849	1565+000	-12.497677	-72.500807	0101000020E6100000E7A6CD380D2052C05AF10D85CFFE28C0	2
1850	1566+000	-12.497542	-72.500651	0101000020E61000006CED7DAA0A2052C0DAC534D3BDFE28C0	2
1851	1567+000	-12.497432	-72.500616	0101000020E6100000ADF6B0170A2052C0BEF73768AFFE28C0	2
1852	1568+000	-12.497339	-72.500556	0101000020E61000004374081C092052C0FA0CA837A3FE28C0	2
1853	1569+000	-12.497221	-72.500383	0101000020E61000005C1E6B46062052C0D2C43BC093FE28C0	2
1854	1570+000	-12.497078	-72.500175	0101000020E6100000B7D100DE022052C0471FF30181FE28C0	2
1855	1571+000	-12.4969	-72.500089	0101000020E6100000B8054B75012052C0CAC342AD69FE28C0	2
1856	1572+000	-12.496782	-72.49995	0101000020E6100000A7E8482EFF1F52C0A27BD6355AFE28C0	2
1857	1573+000	-12.496756	-72.499786	0101000020E6100000EA3F6B7EFC1F52C0FD2E6CCD56FE28C0	2
1858	1574+000	-12.496799	-72.499561	0101000020E6100000DA56B3CEF81F52C0FA5E43705CFE28C0	2
1859	1575+000	-12.496782	-72.499396	0101000020E610000035F0A31AF61F52C0A27BD6355AFE28C0	2
1860	1576+000	-12.496706	-72.499224	0101000020E610000036583849F31F52C03674B33F50FE28C0	2
1861	1577+000	-12.496554	-72.499163	0101000020E6100000E3175E49F21F52C05E656D533CFE28C0	2
1862	1578+000	-12.496512	-72.499007	0101000020E6100000685E0EBBEF1F52C0A22424D236FE28C0	2
1863	1579+000	-12.496385	-72.49873	0101000020E61000002EE23B31EB1F52C02E73BA2C26FE28C0	2
1864	1580+000	-12.496233	-72.498445	0101000020E6100000B476DB85E61F52C05664744012FE28C0	2
1865	1581+000	-12.496174	-72.498289	0101000020E610000038BD8BF7E31F52C04240BE840AFE28C0	2
1866	1582+000	-12.496292	-72.498237	0101000020E61000000F2A711DE31F52C06A882AFC19FE28C0	2
1867	1583+000	-12.496419	-72.498237	0101000020E61000000F2A711DE31F52C0DE3994A12AFE28C0	2
1868	1584+000	-12.496571	-72.498315	0101000020E6100000CD069964E41F52C0B648DA8D3EFE28C0	2
1869	1585+000	-12.496841	-72.498497	0101000020E6100000DD09F65FE71F52C0B69F8CF161FE28C0	2
1870	1586+000	-12.497086	-72.49867	0101000020E6100000C45F9335EA1F52C05299620E82FE28C0	2
1871	1587+000	-12.497306	-72.498834	0101000020E6100000810871E5EC1F52C08B355CE49EFE28C0	2
1872	1588+000	-12.497525	-72.498886	0101000020E6100000AA9B8BBFED1F52C082E2C798BBFE28C0	2
1873	1589+000	-12.497728	-72.498869	0101000020E61000003FFF3D78ED1F52C0639B5434D6FE28C0	2
1874	1590+000	-12.497888	-72.498964	0101000020E61000006878B306EF1F52C046240A2DEBFE28C0	2
1875	1591+000	-12.498133	-72.499163	0101000020E6100000E3175E49F21F52C0E21DE0490BFF28C0	2
1876	1592+000	-12.498615	-72.499457	0101000020E610000088307E1AF71F52C00F971C774AFF28C0	2
1877	1593+000	-12.499164	-72.499717	0101000020E61000005610035DFB1F52C05CAE7E6C92FF28C0	2
1878	1594+000	-12.499358	-72.499864	0101000020E6100000A81C93C5FD1F52C0F0FD0DDAABFF28C0	2
1879	1595+000	-12.499493	-72.499916	0101000020E6100000D1AFAD9FFE1F52C06F29E78BBDFF28C0	2
1880	1596+000	-12.49973	-72.499907	0101000020E6100000A702EE79FE1F52C000A94D9CDCFF28C0	2
1881	1597+000	-12.500042	-72.499881	0101000020E610000013B9E00CFE1F52C0BC404981050029C0	2
1882	1598+000	-12.500228	-72.49995	0101000020E6100000A7E8482EFF1F52C0441669E21D0029C0	2
1883	1599+000	-12.50038	-72.500106	0101000020E610000023A298BC012052C01C25AFCE310029C0	2
1884	1600+000	-12.500439	-72.500409	0101000020E6100000F16778B3062052C03049658A390029C0	2
1885	1601+000	-12.500439	-72.500694	0101000020E61000006BD3D85E0B2052C03049658A390029C0	2
1886	1602+000	-12.500558	-72.500885	0101000020E6100000A583F57F0E2052C099805F23490029C0	2
1887	1603+000	-12.500769	-72.501118	0101000020E6100000F75B3B51122052C085B35BCB640029C0	2
1888	1604+000	-12.500946	-72.501196	0101000020E6100000B4386398132052C0C11F7EFE7B0029C0	2
1889	1605+000	-12.501537	-72.501317	0101000020E610000072FBE593152052C0C9772975C90029C0	2
1890	1606+000	-12.501799	-72.501482	0101000020E61000001762F547182052C0BD546CCCEB0029C0	2
1891	1607+000	-12.501993	-72.501689	0101000020E6100000D4F02DAC1B2052C051A4FB39050129C0	2
1892	1608+000	-12.502264	-72.501689	0101000020E6100000D4F02DAC1B2052C092EA3BBF280129C0	2
1893	1609+000	-12.502542	-72.501732	0101000020E6100000D4D688601C2052C09DBB5D2F4D0129C0	2
1894	1610+000	-12.502889	-72.501836	0101000020E610000026FDBD141E2052C04A09C1AA7A0129C0	2
1895	1611+000	-12.503032	-72.502009	0101000020E61000000D535BEA202052C0D5AE09698D0129C0	2
1896	1612+000	-12.503066	-72.502252	0101000020E6100000709692E5242052C08675E3DD910129C0	2
1897	1613+000	-12.503066	-72.502537	0101000020E6100000EB01F390292052C08675E3DD910129C0	2
1898	1614+000	-12.503016	-72.502684	0101000020E61000003D0E83F92B2052C0BFBA2A508B0129C0	2
1899	1615+000	-12.502838	-72.502658	0101000020E6100000A8C4758C2B2052C0425F7AFB730129C0	2
1900	1616+000	-12.502542	-72.502598	0101000020E61000003E42CD902A2052C09DBB5D2F4D0129C0	2
1901	1617+000	-12.502213	-72.502624	0101000020E6100000D28BDAFD2A2052C08940F50F220129C0	2
1902	1618+000	-12.50201	-72.502762	0101000020E6100000FBEAAA402D2052C0A9876874070129C0	2
1903	1619+000	-12.501799	-72.503394	0101000020E61000002BC0779B372052C0BD546CCCEB0029C0	2
1904	1620+000	-12.501613	-72.503688	0101000020E6100000CFD8976C3C2052C0357F4C6BD30029C0	2
1905	1621+000	-12.501343	-72.503999	0101000020E6100000DE8D0585412052C035289A07B00029C0	2
1906	1622+000	-12.501014	-72.504103	0101000020E610000031B43A39432052C021AD31E8840029C0	2
1907	1623+000	-12.500786	-72.504319	0101000020E610000017F032C3462052C0DD96C805670029C0	2
1908	1624+000	-12.500701	-72.504605	0101000020E61000007A19C5724B2052C02426A8E15B0029C0	2
1909	1625+000	-12.50087	-72.504882	0101000020E6100000B39597FC4F2052C055185B08720029C0	2
1910	1626+000	-12.50109	-72.505193	0101000020E6100000C34A0515552052C08DB454DE8E0029C0	2
1911	1627+000	-12.501149	-72.505332	0101000020E6100000D367075C572052C0A1D80A9A960029C0	2
1912	1628+000	-12.501267	-72.505678	0101000020E6100000A11342075D2052C0C9207711A60029C0	2
1913	1629+000	-12.501419	-72.505877	0101000020E61000001CB3EC49602052C0A12FBDFDB90029C0	2
1914	1630+000	-12.50163	-72.50624	0101000020E610000055FB743C662052C08D62B9A5D50029C0	2
1915	1631+000	-12.501765	-72.506828	0101000020E61000009D2CB5DE6F2052C00D8E9257E70029C0	2
1916	1632+000	-12.501816	-72.507244	0101000020E6100000E7C589AF762052C01538D906EE0029C0	2
1917	1633+000	-12.501799	-72.507468	0101000020E61000000FF10F5B7A2052C0BD546CCCEB0029C0	2
1918	1634+000	-12.502044	-72.507953	0101000020E6100000EDB94C4D822052C0594E42E90B0129C0	2
1919	1635+000	-12.502162	-72.508636	0101000020E61000005E64027E8D2052C08196AE601B0129C0	2
1920	1636+000	-12.502264	-72.509208	0101000020E610000024B726DD962052C092EA3BBF280129C0	2
1921	1637+000	-12.502407	-72.509415	0101000020E6100000E1455F419A2052C01D90847D3B0129C0	2
1922	1638+000	-12.502703	-72.509692	0101000020E61000001AC231CB9E2052C0C233A149620129C0	2
1923	1639+000	-12.502897	-72.509753	0101000020E61000006D020CCB9F2052C0568330B77B0129C0	2
1924	1640+000	-12.503032	-72.509709	0101000020E6100000855E7F129F2052C0D5AE09698D0129C0	2
1925	1641+000	-12.503125	-72.509735	0101000020E61000001AA88C7F9F2052C09A999999990129C0	2
1926	1642+000	-12.503184	-72.509848	0101000020E6100000967B8159A12052C0ADBD4F55A10129C0	2
1927	1643+000	-12.503345	-72.510073	0101000020E6100000A6643909A52052C0D235936FB60129C0	2
1928	1644+000	-12.503514	-72.510228	0101000020E610000039605793A72052C002284696CC0129C0	2
1929	1645+000	-12.504071	-72.510324	0101000020E61000004A97FE25A92052C05AB91798150229C0	2
1930	1646+000	-12.504232	-72.510367	0101000020E61000004A7D59DAA92052C07F315BB22A0229C0	2
1931	1647+000	-12.504443	-72.510548	0101000020E610000072C284D1AC2052C06B64575A460229C0	2
1932	1648+000	-12.505	-72.51086	0101000020E6100000693524EEB12052C0C3F5285C8F0229C0	2
1933	1649+000	-12.505245	-72.510886	0101000020E6100000FE7E315BB22052C05FEFFE78AF0229C0	2
1934	1650+000	-12.50538	-72.510825	0101000020E6100000AB3E575BB12052C0DF1AD82AC10229C0	2
1935	1651+000	-12.50544	-72.510652	0101000020E6100000C4E8B985AE2052C0342E1C08C90229C0	2
1936	1652+000	-12.505532	-72.510548	0101000020E610000072C284D1AC2052C0B7291E17D50229C0	2
1937	1653+000	-12.505668	-72.510618	0101000020E6100000EEAF1EF7AD2052C0784485EAE60229C0	2
1938	1654+000	-12.505862	-72.510574	0101000020E6100000070C923EAD2052C00C941458000329C0	2
1939	1655+000	-12.505972	-72.510635	0101000020E6100000594C6C3EAE2052C0286211C30E0329C0	2
1940	1656+000	-12.506073	-72.510808	0101000020E610000040A20914B12052C0F8C610001C0329C0	2
1941	1657+000	-12.506208	-72.510825	0101000020E6100000AB3E575BB12052C078F2E9B12D0329C0	2
1942	1658+000	-12.506369	-72.510782	0101000020E6100000AC58FCA6B02052C09C6A2DCC420329C0	2
1943	1659+000	-12.507095	-72.510341	0101000020E6100000B5334C6DA92052C024EEB1F4A10329C0	2
1944	1660+000	-12.507568	-72.510021	0101000020E61000007CD11E2FA42052C004FEF0F3DF0329C0	2
1945	1661+000	-12.507669	-72.509804	0101000020E6100000AED7F4A0A02052C0D462F030ED0329C0	2
1946	1662+000	-12.507813	-72.509372	0101000020E6100000E15F048D992052C0A1F7C610000429C0	2
1947	1663+000	-12.507847	-72.509121	0101000020E61000003C2D3F70952052C051BEA085040429C0	2
1948	1664+000	-12.507805	-72.508965	0101000020E6100000C173EFE1922052C0957D5704FF0329C0	2
1949	1665+000	-12.507788	-72.508697	0101000020E6100000B1A4DC7D8E2052C03D9AEAC9FC0329C0	2
1950	1666+000	-12.507805	-72.50842	0101000020E610000078280AF4892052C0957D5704FF0329C0	2
1951	1667+000	-12.507906	-72.508273	0101000020E6100000261C7A8B872052C065E256410C0429C0	2
1952	1668+000	-12.508024	-72.50829	0101000020E610000091B8C7D2872052C08D2AC3B81B0429C0	2
1953	1669+000	-12.508193	-72.508386	0101000020E6100000A2EF6E65892052C0BD1C76DF310429C0	2
1954	1670+000	-12.508438	-72.508498	0101000020E61000003605323B8B2052C059164CFC510429C0	2
1955	1671+000	-12.50859	-72.508524	0101000020E6100000CA4E3FA88B2052C0312592E8650429C0	2
1956	1672+000	-12.50924	-72.508662	0101000020E6100000F3AD0FEB8D2052C04DA1F31ABB0429C0	2
1957	1673+000	-12.509722	-72.508732	0101000020E61000006F9BA9108F2052C07A1A3048FA0429C0	2
1958	1674+000	-12.509857	-72.508836	0101000020E6100000C2C1DEC4902052C0FA4509FA0B0529C0	2
1959	1675+000	-12.510237	-72.509043	0101000020E61000007F501729942052C0166BB8C83D0529C0	2
1960	1676+000	-12.510448	-72.509121	0101000020E61000003C2D3F70952052C0029EB470590529C0	2
1961	1677+000	-12.51067	-72.509101	0101000020E610000019575C1C952052C0BD18CA89760529C0	2
1962	1678+000	-12.510885	-72.508826	0101000020E6100000B056ED9A902052C0AF08FEB7920529C0	2
1963	1679+000	-12.511178	-72.508434	0101000020E61000002A8BC22E8A2052C08FDE701FB90529C0	2
1964	1680+000	-12.511339	-72.508263	0101000020E610000014B18861872052C0B456B439CE0529C0	2
1965	1681+000	-12.511488	-72.508208	0101000020E610000032E4D87A862052C0C89750C1E10529C0	2
1966	1682+000	-12.511709	-72.508367	0101000020E610000067D7BD15892052C04223D8B8FE0529C0	2
1967	1683+000	-12.511828	-72.508526	0101000020E61000009BCAA2B08B2052C0AB5AD2510E0629C0	2
1968	1684+000	-12.511972	-72.508538	0101000020E61000007DB1F7E28B2052C078EFA831210629C0	2
1969	1685+000	-12.51205	-72.508483	0101000020E61000009BE447FC8A2052C067D5E76A2B0629C0	2
1970	1686+000	-12.512133	-72.508324	0101000020E610000067F16261882052C09D67EC4B360629C0	2
1971	1687+000	-12.512211	-72.5083	0101000020E6100000A323B9FC872052C08C4D2B85400629C0	2
1972	1688+000	-12.512408	-72.508385	0101000020E6100000BA313D61892052C0E46A64575A0629C0	2
1973	1689+000	-12.512605	-72.508342	0101000020E6100000BA4BE2AC882052C03C889D29740629C0	2
1974	1690+000	-12.512814	-72.508367	0101000020E610000067D7BD15892052C0A5DC7D8E8F0629C0	2
1975	1691+000	-12.512981	-72.50833	0101000020E6100000D8648D7A882052C052F01472A50629C0	2
1976	1692+000	-12.513154	-72.508104	0101000020E6100000E0BDA3C6842052C0889FFF1EBC0629C0	2
1977	1693+000	-12.513316	-72.507902	0101000020E6100000ACE46377812052C0EE06D15AD10629C0	2
1978	1694+000	-12.513477	-72.507755	0101000020E61000005AD8D30E7F2052C0137F1475E60629C0	2
1979	1695+000	-12.513853	-72.507553	0101000020E610000026FF93BF7B2052C029E78BBD170729C0	2
1980	1696+000	-12.514247	-72.507357	0101000020E610000063997E89782052C0D921FE614B0729C0	2
1981	1697+000	-12.514534	-72.5071	0101000020E61000004DF38E53742052C0315C1D00710729C0	2
1982	1698+000	-12.514838	-72.506892	0101000020E6100000A8A624EB702052C0E179A9D8980729C0	2
1983	1699+000	-12.515119	-72.506678	0101000020E610000092E68F696D2052C0B11875ADBD0729C0	2
1984	1700+000	-12.51537	-72.506532	0101000020E6100000299831056B2052C0D6AD9E93DE0729C0	2
1985	1701+000	-12.515549	-72.506532	0101000020E6100000299831056B2052C094F8DC09F60729C0	2
1986	1702+000	-12.515794	-72.506562	0101000020E61000005ED905836B2052C030F2B226160829C0	2
1987	1703+000	-12.516063	-72.506556	0101000020E6100000ED65DB696B2052C0EF59D768390829C0	2
1988	1704+000	-12.5162	-72.506648	0101000020E61000005DA5BBEB6C2052C0F163CC5D4B0829C0	2
1989	1705+000	-12.516344	-72.506794	0101000020E6100000C7F319506F2052C0BEF8A23D5E0829C0	2
1990	1706+000	-12.516445	-72.506831	0101000020E610000056664AEB6F2052C08D5DA27A6B0829C0	2
1991	1707+000	-12.516576	-72.50677	0101000020E6100000032670EB6E2052C008CC43A67C0829C0	2
1992	0+000	-12.433702	-72.46352	0101000020E6100000AF42CA4FAA1D52C06A6B44300EDE28C0	3
1993	1+000	-12.433706	-72.463736	0101000020E6100000957EC2D9AD1D52C070287CB60EDE28C0	3
1994	0+000	-12.570553	-72.490224	0101000020E6100000B7ED7BD45F1F52C0F644D7851F2429C0	4
1995	1+000	-12.570667	-72.490357	0101000020E610000057975302621F52C018D00B772E2429C0	4
1996	0+000	-12.540852	-72.502134	0101000020E61000006B0DA5F6222052C0CFF3A78DEA1429C0	5
1997	1+000	-12.54091	-72.501921	0101000020E61000003D0B42791F2052C0A228D027F21429C0	5
1998	0+000	-12.54091	-72.501921	0101000020E61000003D0B42791F2052C0A228D027F21429C0	6
1999	1+000	-12.541114	-72.501434	0101000020E61000008FC6A17E172052C0C4D0EAE40C1529C0	6
2000	2+000	-12.541224	-72.501174	0101000020E6100000C1E61C3C132052C0E09EE74F1B1529C0	6
2001	3+000	-12.541443	-72.501174	0101000020E6100000C1E61C3C132052C0D74B5304381529C0	6
2002	4+000	-12.54173	-72.501243	0101000020E61000005516855D142052C02F8672A25D1529C0	6
2003	5+000	-12.541992	-72.501113	0101000020E61000006EA6423C122052C02463B5F97F1529C0	6
2004	6+000	-12.542195	-72.501157	0101000020E6100000564ACFF4122052C0041C42959A1529C0	6
2005	7+000	-12.542398	-72.501286	0101000020E610000054FCDF11152052C0E5D4CE30B51529C0	6
2006	8+000	-12.542626	-72.5012	0101000020E610000055302AA9132052C029EB3713D31529C0	6
2007	9+000	-12.542938	-72.501087	0101000020E6100000D95C35CF112052C0E48233F8FB1529C0	6
2008	10+000	-12.543268	-72.501044	0101000020E6100000D976DA1A112052C039ED2939271629C0	6
2009	11+000	-12.543479	-72.501139	0101000020E610000002F04FA9122052C0252026E1421629C0	6
2010	12+000	-12.543673	-72.501286	0101000020E610000054FCDF11152052C0B96FB54E5C1629C0	6
2011	13+000	-12.543983	-72.50167	0101000020E610000099D87C5C1B2052C0F22895F0841629C0	6
2012	14+000	-12.544222	-72.501903	0101000020E6100000EAB0C22D1F2052C005871744A41629C0	6
2013	15+000	-12.544485	-72.502074	0101000020E6100000008BFCFA212052C03B53E8BCC61629C0	6
2014	16+000	-12.544795	-72.50216	0101000020E61000000057B263232052C0740CC85EEF1629C0	6
2015	17+000	-12.544867	-72.502331	0101000020E61000001631EC30262052C0DA56B3CEF81629C0	6
2016	18+000	-12.545154	-72.502588	0101000020E61000002CD7DB662A2052C03291D26C1E1729C0	6
2017	19+000	-12.545739	-72.503004	0101000020E61000007670B037312052C0B14D2A1A6B1729C0	6
2018	20+000	-12.546324	-72.503787	0101000020E61000009949D40B3E2052C0310A82C7B71729C0	6
2019	21+000	-12.547064	-72.504142	0101000020E610000090A2CEDC432052C04DA3C9C5181829C0	6
2020	22+000	-12.547697	-72.504692	0101000020E610000062A3ACDF4C2052C0103CBEBD6B1829C0	6
2021	23+000	-12.548259	-72.505206	0101000020E61000008DEF8B4B552052C0AF795567B51829C0	6
2022	24+000	-12.548569	-72.505696	0101000020E6100000F46DC1525D2052C0E8323509DE1829C0	6
2023	25+000	-12.54876	-72.505867	0101000020E61000000A48FB1F602052C0B7B41A12F71829C0	6
2024	26+000	-12.549011	-72.506075	0101000020E6100000AF946588632052C0DC4944F8171929C0	6
2025	27+000	-12.549429	-72.506589	0101000020E6100000DBE044F46B2052C0AEF204C24E1929C0	6
2026	28+000	-12.550146	-72.506907	0101000020E610000043C70E2A712052C0E90C8CBCAC1929C0	6
2027	29+000	-12.551292	-72.50725	0101000020E61000005839B4C8762052C0C617EDF1421A29C0	6
2028	30+000	-12.552188	-72.507323	0101000020E61000008D60E3FA772052C0BF7CB262B81A29C0	6
2029	31+000	-12.552522	-72.507519	0101000020E610000050C6F8307B2052C01AA4E029E41A29C0	6
2030	32+000	-12.552725	-72.507861	0101000020E61000007D7A6CCB802052C0FB5C6DC5FE1A29C0	6
2031	33+000	-12.553084	-72.508069	0101000020E610000022C7D633842052C0B9E177D32D1B29C0	6
2032	34+000	-12.55331	-72.508094	0101000020E6100000CE52B29C842052C07A19C5724B1B29C0	6
2033	35+000	-12.553395	-72.507921	0101000020E6100000E7FC14C7812052C0338AE596561B29C0	6
2034	36+000	-12.553547	-72.507575	0101000020E61000001A51DA1B7C2052C00B992B836A1B29C0	6
2035	37+000	-12.5538	-72.507142	0101000020E6100000651BB803752052C0B30C71AC8B1B29C0	6
2036	38+000	-12.553986	-72.506865	0101000020E61000002C9FE579702052C03BE2900DA41B29C0	6
2037	39+000	-12.553952	-72.506571	0101000020E61000008786C5A86B2052C08B1BB7989F1B29C0	6
2038	40+000	-12.553935	-72.50625	0101000020E610000066666666662052C032384A5E9D1B29C0	6
2039	41+000	-12.554011	-72.505973	0101000020E61000002DEA93DC612052C09E3F6D54A71B29C0	6
2040	42+000	-12.554036	-72.505627	0101000020E6100000603E59315C2052C0029D499BAA1B29C0	6
2041	43+000	-12.554155	-72.505324	0101000020E61000009278793A572052C06BD44334BA1B29C0	6
2042	44+000	-12.554509	-72.504641	0101000020E610000021CEC3094C2052C0E2AC889AE81B29C0	6
2043	45+000	-12.554898	-72.504035	0101000020E61000008542041C422052C04B3B35971B1C29C0	6
2044	46+000	-12.555067	-72.503784	0101000020E6100000E00F3FFF3D2052C07B2DE8BD311C29C0	6
2045	47+000	-12.555252	-72.503784	0101000020E6100000E00F3FFF3D2052C0C2137AFD491C29C0	6
2046	48+000	-12.555447	-72.503905	0101000020E61000009ED2C1FA3F2052C09752978C631C29C0	6
2047	49+000	-12.555582	-72.503983	0101000020E61000005CAFE941412052C0177E703E751C29C0	6
2048	50+000	-12.555827	-72.503975	0101000020E61000001AC05B20412052C0B477465B951C29C0	6
2049	51+000	-12.556114	-72.503888	0101000020E6100000333674B33F2052C00CB265F9BA1C29C0	6
2050	52+000	-12.556604	-72.503862	0101000020E61000009EEC66463F2052C044A51133FB1C29C0	6
2051	53+000	-12.55706	-72.503992	0101000020E6100000855CA967412052C0CCD1E3F7361D29C0	6
2052	54+000	-12.557313	-72.504122	0101000020E61000006CCCEB88432052C074452921581D29C0	6
2053	55+000	-12.557524	-72.504347	0101000020E61000007CB5A338472052C0607825C9731D29C0	6
2054	56+000	-12.557676	-72.504433	0101000020E61000007C8159A1482052C038876BB5871D29C0	6
2055	57+000	-12.557803	-72.504485	0101000020E6100000A514747B492052C0AC38D55A981D29C0	6
2056	58+000	-12.557896	-72.504684	0101000020E610000020B41EBE4C2052C07023658BA41D29C0	6
2057	59+000	-12.558022	-72.504831	0101000020E610000072C0AE264F2052C0A3E5400FB51D29C0	6
2058	60+000	-12.55825	-72.505004	0101000020E610000059164CFC512052C0E7FBA9F1D21D29C0	6
2059	61+000	-12.558377	-72.50529	0101000020E6100000BC3FDEAB562052C05CAD1397E31D29C0	6
2060	62+000	-12.558377	-72.506042	0101000020E6100000C119FCFD622052C05CAD1397E31D29C0	6
2061	63+000	-12.558436	-72.50625	0101000020E610000066666666662052C070D1C952EB1D29C0	6
2062	64+000	-12.558495	-72.506613	0101000020E61000009FAEEE586C2052C084F57F0EF31D29C0	6
2063	65+000	-12.55863	-72.506942	0101000020E610000001BEDBBC712052C0042159C0041E29C0	6
2064	66+000	-12.558867	-72.507193	0101000020E6100000A6F0A0D9752052C094A0BFD0231E29C0	6
2065	67+000	-12.55907	-72.507306	0101000020E610000022C495B3772052C075594C6C3E1E29C0	6
2066	68+000	-12.55923	-72.507409	0101000020E61000008C2C9963792052C058E20165531E29C0	6
2067	69+000	-12.559289	-72.507556	0101000020E6100000DE3829CC7B2052C06C06B8205B1E29C0	6
2068	70+000	-12.55923	-72.507773	0101000020E6100000AD32535A7F2052C058E20165531E29C0	6
2069	71+000	-12.559188	-72.507954	0101000020E6100000D5777E51822052C09DA1B8E34D1E29C0	6
2070	72+000	-12.559306	-72.5083	0101000020E6100000A323B9FC872052C0C4E9245B5D1E29C0	6
2071	73+000	-12.559458	-72.50856	0101000020E610000071033E3F8C2052C09CF86A47711E29C0	6
2072	74+000	-12.55961	-72.508672	0101000020E6100000051901158E2052C07407B133851E29C0	6
2073	75+000	-12.559762	-72.508638	0101000020E61000002FE065868D2052C04C16F71F991E29C0	6
2074	76+000	-12.559872	-72.508422	0101000020E610000048A46DFC892052C069E4F38AA71E29C0	6
2075	77+000	-12.56015	-72.507833	0101000020E610000018B5FB55802052C074B515FBCB1E29C0	6
2076	78+000	-12.56053	-72.506994	0101000020E61000002B51F696722052C090DAC4C9FD1E29C0	6
2077	79+000	-12.560919	-72.506423	0101000020E61000004DBC033C692052C0F96871C6301F29C0	6
2078	80+000	-12.561282	-72.50606	0101000020E610000015747B49632052C0BDAAB35A601F29C0	6
2079	81+000	-12.561586	-72.505731	0101000020E6100000B2648EE55D2052C06DC83F33881F29C0	6
2080	82+000	-12.561755	-72.505376	0101000020E6100000BB0B9414582052C09DBAF2599E1F29C0	6
2081	83+000	-12.561721	-72.505194	0101000020E6100000AB083719552052C0EDF318E5991F29C0	6
2082	84+000	-12.561687	-72.505094	0101000020E6100000F9D9C875532052C03C2D3F70951F29C0	6
2083	85+000	-12.561753	-72.50491	0101000020E6100000185B0872502052C01ADCD6169E1F29C0	6
2084	86+000	-12.56192	-72.504818	0101000020E6100000A81B28F04E2052C0C8EF6DFAB31F29C0	6
2085	87+000	-12.562099	-72.504837	0101000020E6100000E333D93F4F2052C0863AAC70CB1F29C0	6
2086	88+000	-12.562242	-72.504757	0101000020E610000055DB4DF04D2052C011E0F42EDE1F29C0	6
2087	89+000	-12.562356	-72.504525	0101000020E6100000ECC039234A2052C0336B2920ED1F29C0	6
2088	90+000	-12.562565	-72.50409	0101000020E6100000670FB402432052C09CBF0985082029C0	6
2089	91+000	-12.562666	-72.503815	0101000020E6100000FE0E45813E2052C06C2409C2152029C0	6
2090	92+000	-12.562684	-72.503448	0101000020E610000025CFF57D382052C006F7031E182029C0	6
2091	93+000	-12.562732	-72.503209	0101000020E610000062838593342052C04AD3A0681E2029C0	6
2092	94+000	-12.562881	-72.503075	0101000020E6100000DA1B7C61322052C05E143DF0312029C0	6
2093	95+000	-12.563024	-72.503026	0101000020E61000006AC2F693312052C0E9B985AE442029C0	6
2094	96+000	-12.563096	-72.502916	0101000020E6100000A62897C62F2052C04F04711E4E2029C0	6
2095	97+000	-12.56312	-72.502744	0101000020E6100000A8902BF52C2052C07172BF43512029C0	6
2096	98+000	-12.56321	-72.502646	0101000020E6100000C6DD205A2B2052C0718FA50F5D2029C0	6
2097	99+000	-12.563353	-72.502653	0101000020E61000001F0F7D772B2052C0FC34EECD6F2029C0	6
2098	100+000	-12.56358	-72.50261	0101000020E6100000202922C32A2052C0FF5BC98E8D2029C0	6
2099	101+000	-12.563777	-72.502469	0101000020E61000003F90BC73282052C057790261A72029C0	6
2100	102+000	-12.563926	-72.502298	0101000020E610000028B682A6252052C06BBA9EE8BA2029C0	6
2101	103+000	-12.56395	-72.502096	0101000020E6100000F4DC4257222052C08D28ED0DBE2029C0	6
2102	104+000	-12.563968	-72.501863	0101000020E6100000A304FD851E2052C026FBE769C02029C0	6
2103	105+000	-12.564075	-72.501723	0101000020E6100000AA29C93A1C2052C07FFB3A70CE2029C0	6
2104	106+000	-12.564201	-72.501606	0101000020E61000008D5E0D501A2052C0B2BD16F4DE2029C0	6
2105	107+000	-12.564243	-72.501472	0101000020E610000006F7031E182052C06DFE5F75E42029C0	6
2106	108+000	-12.564422	-72.501294	0101000020E610000096EB6D33152052C02C499EEBFB2029C0	6
2107	109+000	-12.564565	-72.501215	0101000020E6100000F05014E8132052C0B7EEE6A90E2129C0	6
2108	110+000	-12.564714	-72.500952	0101000020E61000006937FA980F2052C0CB2F8331222129C0	6
2109	111+000	-12.564822	-72.500732	0101000020E6100000E2033BFE0B2052C0641F6459302129C0	6
2110	112+000	-12.565025	-72.500622	0101000020E61000001F6ADB300A2052C045D8F0F44A2129C0	6
2111	113+000	-12.565138	-72.500591	0101000020E6100000016BD5AE092052C0257497C4592129C0	6
2112	114+000	-12.565276	-72.500481	0101000020E61000003DD175E1072052C06A6D1ADB6B2129C0	6
2113	115+000	-12.565377	-72.500358	0101000020E6100000B0928FDD052052C039D21918792129C0	6
2114	116+000	-12.565556	-72.500267	0101000020E61000002711E15F042052C0F81C588E902129C0	6
2115	117+000	-12.565753	-72.500212	0101000020E610000046443179032052C0503A9160AA2129C0	6
2116	118+000	-12.565903	-72.500114	0101000020E6100000649126DE012052C0A56ABB09BE2129C0	6
2117	119+000	-12.565962	-72.499924	0101000020E6100000129F3BC1FE1F52C0B98E71C5C52129C0	6
2118	120+000	-12.566028	-72.499728	0101000020E61000005039268BFB1F52C0963D096CCE2129C0	6
2119	121+000	-12.565968	-72.499435	0101000020E610000094DE37BEF61F52C0412AC58EC62129C0	6
2120	122+000	-12.565956	-72.499037	0101000020E61000009D9FE238F01F52C030F31DFCC42129C0	6
2121	123+000	-12.565992	-72.498621	0101000020E610000053060E68E91F52C0639813B4C92129C0	6
2122	124+000	-12.566076	-72.498309	0101000020E61000005C936E4BE41F52C0DB19A6B6D42129C0	6
2123	125+000	-12.56604	-72.498132	0101000020E6100000D4450A65E11F52C0A774B0FECF2129C0	6
2124	126+000	-12.565885	-72.49804	0101000020E610000064062AE3DF1F52C00B98C0ADBB2129C0	6
2125	127+000	-12.565646	-72.497899	0101000020E6100000836DC493DD1F52C0F7393E5A9C2129C0	6
2126	128+000	-12.565413	-72.497593	0101000020E6100000FC6D4F90D81F52C06C770FD07D2129C0	6
2127	129+000	-12.565288	-72.497306	0101000020E6100000B1868BDCD31F52C07BA4C16D6D2129C0	6
2128	130+000	-12.565174	-72.497116	0101000020E61000006094A0BFD01F52C059198D7C5E2129C0	6
2129	131+000	-12.565258	-72.496908	0101000020E6100000BB473657CD1F52C0D09A1F7F692129C0	6
2130	132+000	-12.565682	-72.49637	0101000020E6100000CB2DAD86C41F52C02BDF3312A12129C0	6
2131	133+000	-12.565998	-72.496021	0101000020E61000004548DDCEBE1F52C0EC33677DCA2129C0	6
2132	134+000	-12.566159	-72.49566	0101000020E6100000DD7BB8E4B81F52C011ACAA97DF2129C0	6
2133	135+000	-12.566291	-72.495422	0101000020E610000003EE79FEB41F52C0CC09DAE4F02129C0	6
2134	136+000	-12.566422	-72.495165	0101000020E6100000ED478AC8B01F52C046787B10022229C0	6
2135	137+000	-12.566673	-72.495018	0101000020E61000009B3BFA5FAE1F52C06B0DA5F6222229C0	6
2136	138+000	-12.566977	-72.494944	0101000020E61000007E569929AD1F52C01B2B31CF4A2229C0	6
2137	139+000	-12.567043	-72.494853	0101000020E6100000F6D4EAABAB1F52C0F9D9C875532229C0	6
2138	140+000	-12.56696	-72.49473	0101000020E6100000689604A8A91F52C0C347C494482229C0	6
2139	141+000	-12.566727	-72.494479	0101000020E6100000C3633F8BA51F52C03885950A2A2229C0	6
2140	142+000	-12.566607	-72.494314	0101000020E61000001EFD2FD7A21F52C08D5E0D501A2229C0	6
2141	143+000	-12.56647	-72.494216	0101000020E61000003C4A253CA11F52C08B54185B082229C0	6
2142	144+000	-12.566321	-72.494174	0101000020E61000002522FC8BA01F52C077137CD3F42129C0	6
2143	145+000	-12.566118	-72.494039	0101000020E6100000B5FCC0559E1F52C0965AEF37DA2129C0	6
2144	146+000	-12.566058	-72.493929	0101000020E6100000F16261889C1F52C04147AB5AD22129C0	6
2145	147+000	-12.566064	-72.493733	0101000020E61000002FFD4B52991F52C0CAE2FE23D32129C0	6
2146	148+000	-12.566118	-72.493598	0101000020E6100000BFD7101C971F52C0965AEF37DA2129C0	6
2147	149+000	-12.566243	-72.493501	0101000020E6100000C5E23785951F52C0882D3D9AEA2129C0	6
2148	150+000	-12.566524	-72.493488	0101000020E6100000FB3DB14E951F52C057CC086F0F2229C0	6
2149	151+000	-12.566894	-72.493501	0101000020E6100000C5E23785951F52C0E5982CEE3F2229C0	6
2150	152+000	-12.567168	-72.493519	0101000020E6100000193DB7D0951F52C0EBAC16D8632229C0	6
2151	153+000	-12.567336	-72.493519	0101000020E6100000193DB7D0951F52C0D9AF3BDD792229C0	6
2152	154+000	-12.567479	-72.49339	0101000020E61000001A8BA6B3931F52C06555849B8C2229C0	6
2153	155+000	-12.567545	-72.49314	0101000020E61000005D16139B8F1F52C043041C42952229C0	6
2154	156+000	-12.567515	-72.492863	0101000020E6100000249A40118B1F52C098FA7953912229C0	6
2155	157+000	-12.567563	-72.492631	0101000020E6100000BB7F2C44871F52C0DCD6169E972229C0	6
2156	158+000	-12.567635	-72.492423	0101000020E61000001633C2DB831F52C04221020EA12229C0	6
2157	159+000	-12.56776	-72.492288	0101000020E6100000A60D87A5811F52C034F44F70B12229C0	6
2158	160+000	-12.567868	-72.492288	0101000020E6100000A60D87A5811F52C0CEE33098BF2229C0	6
2159	161+000	-12.567921	-72.492459	0101000020E6100000BCE7C072841F52C0596C938AC62229C0	6
2160	162+000	-12.567933	-72.492802	0101000020E6100000D15966118A1F52C06AA33A1DC82229C0	6
2161	163+000	-12.567921	-72.493059	0101000020E6100000E7FF55478E1F52C0596C938AC62229C0	6
2162	164+000	-12.567957	-72.493395	0101000020E6100000A3409FC8931F52C08C118942CB2229C0	6
2163	165+000	-12.567964	-72.493547	0101000020E61000007E022846961F52C0569C6A2DCC2229C0	6
2164	166+000	-12.567972	-72.493594	0101000020E61000001EE0490B971F52C06116DA39CD2229C0	6
2165	167+000	-12.567983	-72.493628	0101000020E6100000F418E599971F52C0315EF3AACE2229C0	6
2166	168+000	-12.568	-72.493648	0101000020E610000017EFC7ED971F52C0894160E5D02229C0	6
2167	169+000	-12.568024	-72.493661	0101000020E6100000E2934E24981F52C0ABAFAE0AD42229C0	6
2168	170+000	-12.568043	-72.493665	0101000020E6100000828B1535981F52C086713788D62229C0	6
2169	171+000	-12.568064	-72.493662	0101000020E6100000CA518028981F52C0E411DC48D92229C0	6
2170	172+000	-12.568091	-72.493649	0101000020E610000000ADF9F1971F52C0CB4DD4D2DC2229C0	6
2171	173+000	-12.568105	-72.493634	0101000020E6100000658C0FB3971F52C05E6397A8DE2229C0	6
2172	174+000	-12.568116	-72.493613	0101000020E610000059F8FA5A971F52C02EABB019E02229C0	6
2173	175+000	-12.568127	-72.493482	0101000020E61000008ACA8635951F52C0FEF2C98AE12229C0	6
2174	176+000	-12.568142	-72.493157	0101000020E6100000C8B260E28F1F52C0D3F71A82E32229C0	6
2175	177+000	-12.568178	-72.492894	0101000020E6100000429946938B1F52C0069D103AE82229C0	6
2176	178+000	-12.568268	-72.492551	0101000020E61000002D27A1F4851F52C006BAF605F42229C0	6
2177	179+000	-12.568357	-72.492092	0101000020E6100000E3A7716F7E1F52C0C5E74EB0FF2229C0	6
2178	180+000	-12.568494	-72.491872	0101000020E61000005C74B2D47A1F52C0C7F143A5112329C0	6
2179	181+000	-12.568662	-72.49145	0101000020E6100000A167B3EA731F52C0B6F468AA272329C0	6
2180	182+000	-12.568787	-72.491156	0101000020E6100000FD4E93196F1F52C0A8C7B60C382329C0	6
2181	183+000	-12.568848	-72.491113	0101000020E6100000FD6838656E1F52C03ECA880B402329C0	6
2182	184+000	-12.568906	-72.491156	0101000020E6100000FD4E93196F1F52C011FFB0A5472329C0	6
2183	185+000	-12.568841	-72.491444	0101000020E610000030F488D1731F52C0753FA7203F2329C0	6
2184	186+000	-12.568757	-72.491627	0101000020E610000028B517D1761F52C0FDBD141E342329C0	6
2185	187+000	-12.56868	-72.492202	0101000020E6100000A741D13C801F52C050C763062A2329C0	6
2186	188+000	-12.568602	-72.492527	0101000020E61000006859F78F851F52C061E124CD1F2329C0	6
2187	189+000	-12.568542	-72.492747	0101000020E6100000EF8CB62A891F52C00CCEE0EF172329C0	6
2188	190+000	-12.568602	-72.492936	0101000020E610000059C16F438C1F52C061E124CD1F2329C0	6
2189	191+000	-12.56859	-72.493114	0101000020E6100000C9CC052E8F1F52C050AA7D3A1E2329C0	6
2190	192+000	-12.568483	-72.493463	0101000020E61000004FB2D5E5941F52C0F8A92A34102329C0	6
2191	193+000	-12.568512	-72.493652	0101000020E6100000B8E68EFE971F52C061C43E01142329C0	6
2192	194+000	-12.56856	-72.493836	0101000020E610000099654F029B1F52C0A5A0DB4B1A2329C0	6
2193	195+000	-12.568614	-72.494044	0101000020E61000003EB2B96A9E1F52C07218CC5F212329C0	6
2194	196+000	-12.568608	-72.494191	0101000020E610000090BE49D3A01F52C0E97C7896202329C0	6
2195	197+000	-12.568674	-72.494197	0101000020E6100000013274ECA01F52C0C72B103D292329C0	6
2196	198+000	-12.56871	-72.494093	0101000020E6100000AF0B3F389F1F52C0FAD005F52D2329C0	6
2197	199+000	-12.568668	-72.493848	0101000020E61000007B4CA4349B1F52C03F90BC73282329C0	6
2198	200+000	-12.568698	-72.493628	0101000020E6100000F418E599971F52C0E9995E622C2329C0	6
2199	201+000	-12.568841	-72.493328	0101000020E6100000DF8C9AAF921F52C0753FA7203F2329C0	6
2200	202+000	-12.56899	-72.493126	0101000020E6100000ABB35A608F1F52C0888043A8522329C0	6
2201	203+000	-12.569211	-72.492979	0101000020E610000059A7CAF78C1F52C0020CCB9F6F2329C0	6
2202	204+000	-12.569378	-72.492765	0101000020E610000043E73576891F52C0B01F6283852329C0	6
2203	205+000	-12.569623	-72.49238	0101000020E6100000164D6727831F52C04C1938A0A52329C0	6
2204	206+000	-12.56973	-72.492	0101000020E6100000736891ED7C1F52C0A4198BA6B32329C0	6
2205	207+000	-12.569695	-72.491768	0101000020E6100000094E7D20791F52C0B2632310AF2329C0	6
2206	208+000	-12.569671	-72.491591	0101000020E61000008200193A761F52C090F5D4EAAB2329C0	6
2207	209+000	-12.569838	-72.491456	0101000020E610000012DBDD03741F52C03E096CCEC12329C0	6
2208	210+000	-12.570053	-72.491064	0101000020E61000008C0FB3976D1F52C02FF99FFCDD2329C0	6
2209	211+000	-12.570131	-72.490734	0101000020E61000004242942F681F52C01EDFDE35E82329C0	6
2210	212+000	-12.570262	-72.490447	0101000020E6100000F75AD07B631F52C0984D8061F92329C0	6
2211	213+000	-12.570334	-72.490306	0101000020E610000016C26A2C611F52C0FF976BD1022429C0	6
2212	214+000	-12.570422	-72.490247	0101000020E610000093FDF334601F52C07CD6355A0E2429C0	6
2213	215+000	-12.570553	-72.490224	0101000020E6100000B7ED7BD45F1F52C0F644D7851F2429C0	6
2214	0+000	-12.570667	-72.490357	0101000020E610000057975302621F52C018D00B772E2429C0	7
2215	1+000	-12.570656	-72.49048	0101000020E6100000E5D53906641F52C04888F2052D2429C0	7
2216	2+000	-12.570596	-72.490594	0101000020E6100000496760E4651F52C0F374AE28252429C0	7
2217	3+000	-12.570543	-72.490783	0101000020E6100000B29B19FD681F52C068EC4B361E2429C0	7
2218	4+000	-12.570531	-72.490967	0101000020E6100000931ADA006C1F52C057B5A4A31C2429C0	7
2219	5+000	-12.570495	-72.491218	0101000020E6100000384D9F1D701F52C02310AFEB172429C0	7
2220	6+000	-12.570489	-72.491376	0101000020E6100000848252B4721F52C09B745B22172429C0	7
2221	7+000	-12.570369	-72.491615	0101000020E610000046CEC29E761F52C0F04DD367072429C0	7
2222	8+000	-12.570417	-72.491884	0101000020E61000003E5B07077B1F52C0352A70B20D2429C0	7
2223	9+000	-12.570481	-72.492136	0101000020E6100000CB4BFE277F1F52C08FFAEB15162429C0	7
2224	10+000	-12.570576	-72.492686	0101000020E61000009D4CDC2A881F52C0D7C39789222429C0	7
2225	11+000	-12.570523	-72.493011	0101000020E61000005E64027E8D1F52C04B3B35971B2429C0	7
2226	12+000	-12.570182	-72.493359	0101000020E6100000FC8BA031931F52C0278925E5EE2329C0	7
2227	13+000	-12.569926	-72.493702	0101000020E610000011FE45D0981F52C0BB473657CD2329C0	7
2228	14+000	-12.569824	-72.493879	0101000020E6100000994BAAB69B1F52C0AAF3A8F8BF2329C0	7
2229	15+000	-12.56986	-72.494063	0101000020E610000079CA6ABA9E1F52C0DD989EB0C42329C0	7
2230	16+000	-12.569896	-72.494295	0101000020E6100000E2E47E87A21F52C0103E9468C92329C0	7
2231	17+000	-12.569938	-72.494467	0101000020E6100000E17CEA58A51F52C0CC7EDDE9CE2329C0	7
2232	18+000	-12.570146	-72.494766	0101000020E61000000E4B033FAA1F52C0F3E32F2DEA2329C0	7
2233	19+000	-12.570236	-72.494987	0101000020E61000007D3CF4DDAD1F52C0F30016F9F52329C0	7
2234	20+000	-12.570344	-72.495152	0101000020E610000023A30392B01F52C08DF0F620042429C0	7
2235	21+000	-12.570415	-72.495396	0101000020E61000006EA46C91B41F52C0B24B546F0D2429C0	7
2236	22+000	-12.570487	-72.495666	0101000020E61000004EEFE2FDB81F52C018963FDF162429C0	7
2237	23+000	-12.570475	-72.495984	0101000020E6100000B7D5AC33BE1F52C0075F984C152429C0	7
2238	24+000	-12.570421	-72.496186	0101000020E6100000EAAEEC82C11F52C03AE7A7380E2429C0	7
2239	25+000	-12.570182	-72.496394	0101000020E61000008FFB56EBC41F52C0278925E5EE2329C0	7
2240	26+000	-12.569991	-72.496565	0101000020E6100000A6D590B8C71F52C0570740DCD52329C0	7
2241	27+000	-12.569938	-72.496712	0101000020E6100000F8E12021CA1F52C0CC7EDDE9CE2329C0	7
2242	28+000	-12.570063	-72.496865	0101000020E6100000BB61DBA2CC1F52C0BD512B4CDF2329C0	7
2243	29+000	-12.570212	-72.497036	0101000020E6100000D13B1570CF1F52C0D192C7D3F22329C0	7
2244	30+000	-12.570326	-72.497171	0101000020E6100000416150A6D11F52C0F31DFCC4012429C0	7
2245	31+000	-12.570391	-72.497525	0101000020E610000050FC1873D71F52C090DD054A0A2429C0	7
2246	32+000	-12.570439	-72.497899	0101000020E6100000836DC493DD1F52C0D4B9A294102429C0	7
2247	33+000	-12.570433	-72.49818	0101000020E61000005DE15D2EE21F52C04B1E4FCB0F2429C0	7
2248	34+000	-12.570529	-72.4984	0101000020E6100000E4141DC9E51F52C0D4D688601C2429C0	7
2249	35+000	-12.57072	-72.498516	0101000020E61000001822A7AFE71F52C0A3586E69352429C0	7
2250	36+000	-12.571042	-72.498669	0101000020E6100000DCA16131EA1F52C0ED48F59D5F2429C0	7
2251	37+000	-12.571245	-72.498694	0101000020E6100000882D3D9AEA1F52C0CD0182397A2429C0	7
2252	38+000	-12.571353	-72.498743	0101000020E6100000F986C267EB1F52C067F16261882429C0	7
2253	39+000	-12.571514	-72.498914	0101000020E61000000F61FC34EE1F52C08C69A67B9D2429C0	7
2254	40+000	-12.571615	-72.499067	0101000020E6100000D2E0B6B6F01F52C05BCEA5B8AA2429C0	7
2255	41+000	-12.571735	-72.499434	0101000020E6100000AB2006BAF61F52C006F52D73BA2429C0	7
2256	42+000	-12.571938	-72.499813	0101000020E61000006747AAEFFC1F52C0E6ADBA0ED52429C0	7
2257	43+000	-12.572045	-72.500021	0101000020E61000000C941458002052C03EAE0D15E32429C0	7
2258	44+000	-12.572123	-72.500199	0101000020E61000007B9FAA42032052C02D944C4EED2429C0	7
2259	45+000	-12.572075	-72.500529	0101000020E6100000C66CC9AA082052C0E9B7AF03E72429C0	7
2260	46+000	-12.571968	-72.501	0101000020E6100000F2D24D62102052C091B75CFDD82429C0	7
2261	47+000	-12.57195	-72.501214	0101000020E61000000893E2E3132052C0F7E461A1D62429C0	7
2262	48+000	-12.572027	-72.50133	0101000020E61000003CA06CCA152052C0A5DB12B9E02429C0	7
2263	49+000	-12.572129	-72.501441	0101000020E6100000E8F7FD9B172052C0B62FA017EE2429C0	7
2264	50+000	-12.572171	-72.501557	0101000020E61000001D058882192052C07270E998F32429C0	7
2265	51+000	-12.572075	-72.50163	0101000020E6100000522CB7B41A2052C0E9B7AF03E72429C0	7
2266	52+000	-12.571932	-72.501685	0101000020E610000033F9669B1B2052C05E126745D42429C0	7
2267	53+000	-12.571794	-72.501783	0101000020E610000015AC71361D2052C01A19E42EC22429C0	7
2268	54+000	-12.571681	-72.502004	0101000020E6100000849D62D5202052C0397D3D5FB32429C0	7
2269	55+000	-12.57163	-72.502179	0101000020E61000003B6F63B3232052C031D3F6AFAC2429C0	7
2270	56+000	-12.571606	-72.502306	0101000020E61000006AA510C8252052C00E65A88AA92429C0	7
2271	57+000	-12.571499	-72.502526	0101000020E6100000F1D8CF62292052C0B66455849B2429C0	7
2272	58+000	-12.571427	-72.502685	0101000020E610000025CCB4FD2B2052C0501A6A14922429C0	7
2273	59+000	-12.571427	-72.50282	0101000020E610000095F1EF332E2052C0501A6A14922429C0	7
2274	60+000	-12.571398	-72.502985	0101000020E61000003A58FFE7302052C0E7FF55478E2429C0	7
2275	61+000	-12.57126	-72.503046	0101000020E61000008D98D9E7312052C0A306D3307C2429C0	7
2276	62+000	-12.571135	-72.503101	0101000020E61000006F6589CE322052C0B13385CE6B2429C0	7
2277	63+000	-12.570914	-72.50326	0101000020E6100000A3586E69352052C037A8FDD64E2429C0	7
2278	64+000	-12.570771	-72.503278	0101000020E6100000F6B2EDB4352052C0AC02B5183C2429C0	7
2279	65+000	-12.570394	-72.503309	0101000020E610000014B2F336362052C054ABAFAE0A2429C0	7
2280	66+000	-12.570293	-72.50337	0101000020E610000067F2CD36372052C08446B071FD2329C0	7
2281	67+000	-12.570221	-72.503554	0101000020E610000047718E3A3A2052C01EFCC401F42329C0	7
2282	68+000	-12.570233	-72.503951	0101000020E610000056F2B1BB402052C02F336C94F52329C0	7
2283	69+000	-12.570185	-72.504122	0101000020E61000006CCCEB88432052C0EB56CF49EF2329C0	7
2284	70+000	-12.570084	-72.504239	0101000020E61000008997A773452052C01BF2CF0CE22329C0	7
2285	71+000	-12.569827	-72.504386	0101000020E6100000DBA337DC472052C06EC1525DC02329C0	7
2286	72+000	-12.569654	-72.504514	0101000020E6100000F29716F5492052C0381268B0A92329C0	7
2287	73+000	-12.569606	-72.504575	0101000020E610000045D8F0F44A2052C0F435CB65A32329C0	7
2288	74+000	-12.569582	-72.504734	0101000020E610000079CBD58F4D2052C0D2C77C40A02329C0	7
2289	75+000	-12.5696	-72.504991	0101000020E61000008F71C5C5512052C06B9A779CA22329C0	7
2290	76+000	-12.569546	-72.505297	0101000020E610000015713AC9562052C09F2287889B2329C0	7
2291	77+000	-12.569445	-72.505468	0101000020E61000002B4B7496592052C0CFBD874B8E2329C0	7
2292	78+000	-12.569338	-72.505432	0101000020E6100000859675FF582052C077BD3445802329C0	7
2293	79+000	-12.569194	-72.505352	0101000020E6100000F73DEAAF572052C0AA285E656D2329C0	7
2294	80+000	-12.568872	-72.505266	0101000020E6100000F8713447562052C06138D730432329C0	7
2295	81+000	-12.568722	-72.505377	0101000020E6100000A3C9C518582052C00B08AD872F2329C0	7
2296	82+000	-12.568526	-72.505572	0101000020E61000007E71A94A5B2052C0F5D901D7152329C0	7
2297	83+000	-12.568305	-72.505719	0101000020E6100000D07D39B35D2052C07B4E7ADFF82229C0	7
2298	84+000	-12.568084	-72.505732	0101000020E61000009A22C0E95D2052C001C3F2E7DB2229C0	7
2299	85+000	-12.567863	-72.505774	0101000020E6100000B24AE9995E2052C086376BF0BE2229C0	7
2300	86+000	-12.567755	-72.505866	0101000020E6100000228AC91B602052C0ED478AC8B02229C0	7
2301	87+000	-12.567702	-72.506019	0101000020E6100000E509849D622052C062BF27D6A92229C0	7
2302	88+000	-12.567678	-72.506264	0101000020E610000019C91EA1662052C04051D9B0A62229C0	7
2303	89+000	-12.567755	-72.506447	0101000020E6100000118AADA0692052C0ED478AC8B02229C0	7
2304	90+000	-12.567875	-72.506668	0101000020E6100000817B9E3F6D2052C0986E1283C02229C0	7
2305	91+000	-12.567952	-72.507034	0101000020E610000072FDBB3E732052C04565C39ACA2229C0	7
2306	92+000	-12.568028	-72.507342	0101000020E6100000C878944A782052C0B16CE690D42229C0	7
2307	93+000	-12.568129	-72.507662	0101000020E610000001DBC1887D2052C081D1E5CDE12229C0	7
2308	94+000	-12.568222	-72.507827	0101000020E6100000A741D13C802052C045BC75FEED2229C0	7
2309	95+000	-12.568185	-72.507986	0101000020E6100000DB34B6D7822052C0D027F224E92229C0	7
2310	96+000	-12.568083	-72.508072	0101000020E6100000DA006C40842052C0BFD364C6DB2229C0	7
2311	97+000	-12.568023	-72.508212	0101000020E6100000D3DB9F8B862052C06AC020E9D32229C0	7
2312	98+000	-12.56797	-72.508274	0101000020E61000000EDAAB8F872052C0DF37BEF6CC2229C0	7
2313	99+000	-12.567964	-72.508396	0101000020E6100000B45A608F892052C0569C6A2DCC2229C0	7
2314	100+000	-12.568047	-72.508506	0101000020E610000077F4BF5C8B2052C08C2E6F0ED72229C0	7
2315	101+000	-12.568071	-72.508604	0101000020E610000059A7CAF78C2052C0AE9CBD33DA2229C0	7
2316	102+000	-12.568006	-72.508641	0101000020E6100000E719FB928D2052C012DDB3AED12229C0	7
2317	103+000	-12.56794	-72.508592	0101000020E610000076C075C58C2052C0342E1C08C92229C0	7
2318	104+000	-12.567808	-72.50853	0101000020E61000003BC269C18B2052C078D0ECBAB72229C0	7
2319	105+000	-12.567683	-72.508524	0101000020E6100000CA4E3FA88B2052C087FD9E58A72229C0	7
2320	106+000	-12.567582	-72.50858	0101000020E610000094D920938C2052C0B7989F1B9A2229C0	7
2321	107+000	-12.56757	-72.508732	0101000020E61000006F9BA9108F2052C0A661F888982229C0	7
2322	108+000	-12.567605	-72.508928	0101000020E61000003201BF46922052C09817601F9D2229C0	7
2323	109+000	-12.567713	-72.509075	0101000020E6100000840D4FAF942052C031074147AB2229C0	7
2324	110+000	-12.56794	-72.509234	0101000020E6100000B900344A972052C0342E1C08C92229C0	7
2325	111+000	-12.568214	-72.509485	0101000020E61000005D33F9669B2052C0394206F2EC2229C0	7
2326	112+000	-12.56834	-72.509626	0101000020E61000003ECC5EB69D2052C06C04E275FD2229C0	7
2327	113+000	-12.568346	-72.50973	0101000020E610000091F2936A9F2052C0F59F353FFE2229C0	7
2328	114+000	-12.56825	-72.509772	0101000020E6100000A81ABD1AA02052C06DE7FBA9F12229C0	7
2329	115+000	-12.568023	-72.509736	0101000020E61000000266BE839F2052C06AC020E9D32229C0	7
2330	116+000	-12.567617	-72.509674	0101000020E6100000C767B27F9E2052C0A94E07B29E2229C0	7
2331	117+000	-12.567325	-72.509656	0101000020E6100000740D33349E2052C00A68226C782229C0	7
2332	118+000	-12.566937	-72.509785	0101000020E610000072BF4351A02052C0E2C80391452229C0	7
2333	119+000	-12.566793	-72.510072	0101000020E6100000BDA60705A52052C016342DB1322229C0	7
2334	120+000	-12.56674	-72.51047	0101000020E6100000B4E55C8AAB2052C08AABCABE2B2229C0	7
2335	121+000	-12.566817	-72.510647	0101000020E61000003C33C170AE2052C038A27BD6352229C0	7
2336	122+000	-12.566925	-72.510776	0101000020E61000003BE5D18DB02052C0D1915CFE432229C0	7
2337	123+000	-12.566961	-72.510886	0101000020E6100000FE7E315BB22052C0043752B6482229C0	7
2338	124+000	-12.566829	-72.511063	0101000020E610000085CC9541B52052C049D92269372229C0	7
2339	125+000	-12.566644	-72.51129	0101000020E61000006631B1F9B82052C002F390291F2229C0	7
2340	126+000	-12.566429	-72.511302	0101000020E61000004818062CB92052C010035DFB022229C0	7
2341	127+000	-12.56628	-72.51143	0101000020E61000005F0CE544BB2052C0FDC1C073EF2129C0	7
2342	128+000	-12.566154	-72.511583	0101000020E6100000228C9FC6BD2052C0C9FFE4EFDE2129C0	7
2343	129+000	-12.566041	-72.511675	0101000020E610000092CB7F48BF2052C0E9633E20D02129C0	7
2344	130+000	-12.565969	-72.511828	0101000020E6100000554B3ACAC12052C0831953B0C62129C0	7
2345	131+000	-12.565987	-72.511975	0101000020E6100000A857CA32C42052C01CEC4D0CC92129C0	7
2346	132+000	-12.566071	-72.512195	0101000020E61000002F8B89CDC72052C0946DE00ED42129C0	7
2347	133+000	-12.566166	-72.51244	0101000020E6100000624A24D1CB2052C0DB368C82E02129C0	7
2348	134+000	-12.566304	-72.512623	0101000020E61000005B0BB3D0CE2052C01F300F99F22129C0	7
2349	135+000	-12.566274	-72.51285	0101000020E61000003B70CE88D22052C074266DAAEE2129C0	7
2350	136+000	-12.566077	-72.513094	0101000020E610000086713788D62052C01C0934D8D42129C0	7
2351	137+000	-12.56588	-72.513565	0101000020E6100000B2D7BB3FDE2052C0C4EBFA05BB2129C0	7
2352	138+000	-12.565653	-72.514128	0101000020E61000004E7D2079E72052C0C1C41F459D2129C0	7
2353	139+000	-12.565611	-72.514324	0101000020E610000011E335AFEA2052C00684D6C3972129C0	7
2354	140+000	-12.565551	-72.514495	0101000020E610000027BD6F7CED2052C0B07092E68F2129C0	7
2355	141+000	-12.56539	-72.514587	0101000020E610000098FC4FFEEE2052C08CF84ECC7A2129C0	7
2356	142+000	-12.565122	-72.51463	0101000020E610000097E2AAB2EF2052C00F80B8AB572129C0	7
2357	143+000	-12.564716	-72.514752	0101000020E61000003D635FB2F12052C04E0E9F74222129C0	7
2358	144+000	-12.564446	-72.514926	0101000020E61000000C772E8CF42052C04EB7EC10FF2029C0	7
2359	145+000	-12.564108	-72.515038	0101000020E6100000A08CF161F62052C0EDD286C3D22029C0	7
2360	146+000	-12.563812	-72.515021	0101000020E610000035F0A31AF62052C0492F6AF7AB2029C0	7
2361	147+000	-12.563635	-72.514969	0101000020E61000000B5D8940F52052C00DC347C4942029C0	7
2362	148+000	-12.563441	-72.514951	0101000020E6100000B8020AF5F42052C07973B8567B2029C0	7
2363	149+000	-12.563348	-72.51509	0101000020E6100000C91F0C3CF72052C0B58828266F2029C0	7
2364	150+000	-12.563255	-72.515384	0101000020E61000006D382C0DFC2052C0F19D98F5622029C0	7
2365	151+000	-12.563188	-72.515696	0101000020E610000065ABCB29012152C0D2FF722D5A2029C0	7
2366	152+000	-12.563071	-72.515856	0101000020E6100000815CE2C8032152C0ECA694D74A2029C0	7
2367	153+000	-12.562826	-72.515997	0101000020E610000062F54718062152C04FADBEBA2A2029C0	7
2368	154+000	-12.562653	-72.516156	0101000020E610000096E82CB3082152C019FED30D142029C0	7
2369	155+000	-12.562623	-72.516315	0101000020E6100000CBDB114E0B2152C06FF4311F102029C0	7
2370	156+000	-12.562695	-72.516468	0101000020E61000008E5BCCCF0D2152C0D53E1D8F192029C0	7
2371	157+000	-12.562814	-72.51667	0101000020E6100000C2340C1F112152C03E761728292029C0	7
2372	158+000	-12.562987	-72.516731	0101000020E61000001475E61E122152C0742502D53F2029C0	7
2373	159+000	-12.56325	-72.516762	0101000020E61000003274ECA0122152C0AAF1D24D622029C0	7
2374	160+000	-12.563513	-72.516786	0101000020E6100000F6419605132152C0E0BDA3C6842029C0	7
2375	161+000	-12.563746	-72.516799	0101000020E6100000C1E61C3C132152C06B80D250A32029C0	7
2376	162+000	-12.564026	-72.516731	0101000020E61000001475E61E122152C0F92F1004C82029C0	7
2377	163+000	-12.564373	-72.516805	0101000020E6100000325A4755132152C0A67D737FF52029C0	7
2378	164+000	-12.564773	-72.516982	0101000020E6100000B9A7AB3B162152C0DF5339ED292129C0	7
2379	165+000	-12.564922	-72.517153	0101000020E6100000CF81E508192152C0F294D5743D2129C0	7
2380	166+000	-12.564976	-72.517337	0101000020E6100000B000A60C1C2152C0BF0CC688442129C0	7
2381	167+000	-12.565012	-72.517453	0101000020E6100000E50D30F31D2152C0F2B1BB40492129C0	7
2382	168+000	-12.565149	-72.517533	0101000020E61000007366BB421F2152C0F5BBB0355B2129C0	7
2383	169+000	-12.565322	-72.51771	0101000020E6100000FAB31F29222152C02B6B9BE2712129C0	7
2384	170+000	-12.565453	-72.517796	0101000020E6100000FA7FD591232152C0A5D93C0E832129C0	7
2385	171+000	-12.565447	-72.517979	0101000020E6100000F2406491262152C01D3EE944822129C0	7
2386	172+000	-12.565418	-72.518236	0101000020E610000008E753C72A2152C0B323D5777E2129C0	7
2387	173+000	-12.565471	-72.518395	0101000020E61000003CDA38622D2152C03FAC376A852129C0	7
2388	174+000	-12.565615	-72.518518	0101000020E6100000CA181F662F2152C00B410E4A982129C0	7
2389	175+000	-12.565794	-72.518677	0101000020E6100000FE0B0401322152C0CA8B4CC0AF2129C0	7
2390	176+000	-12.566005	-72.518728	0101000020E61000003FE1ECD6322152C0B6BE4868CB2129C0	7
2391	177+000	-12.5662	-72.518702	0101000020E6100000AB97DF69322152C08BFD65F7E42129C0	7
2392	178+000	-12.566343	-72.518694	0101000020E610000069A85148322152C016A3AEB5F72129C0	7
2393	179+000	-12.566487	-72.518858	0101000020E610000026512FF8342152C0E33785950A2229C0	7
2394	180+000	-12.56663	-72.519126	0101000020E61000003620425C392152C06EDDCD531D2229C0	7
2395	181+000	-12.566672	-72.519343	0101000020E6100000051A6CEA3C2152C02A1E17D5222229C0	7
2396	182+000	-12.566639	-72.519542	0101000020E610000080B9162D402152C0BB46CB811E2229C0	7
2397	183+000	-12.566706	-72.519646	0101000020E6100000D2DF4BE1412152C0DAE4F049272229C0	7
2398	184+000	-12.566816	-72.519819	0101000020E6100000B935E9B6442152C0F6B2EDB4352229C0	7
2399	185+000	-12.566841	-72.520009	0101000020E61000000B28D4D3472152C05A10CAFB382229C0	7
2400	186+000	-12.566782	-72.520381	0101000020E61000006D1D1CEC4D2152C046EC1340312229C0	7
2401	187+000	-12.566797	-72.520615	0101000020E6100000A7B393C1512152C01BF16437332229C0	7
2402	188+000	-12.566832	-72.52075	0101000020E610000017D9CEF7532152C00DA7CCCD372229C0	7
2403	189+000	-12.566976	-72.520835	0101000020E61000002EE7525C552152C0DA3BA3AD4A2229C0	7
2404	190+000	-12.567238	-72.520915	0101000020E6100000BC3FDEAB562152C0CE18E6046D2229C0	7
2405	191+000	-12.567525	-72.520933	0101000020E61000000F9A5DF7562152C0265305A3922229C0	7
2406	192+000	-12.567704	-72.520854	0101000020E610000069FF03AC552152C0E59D4319AA2229C0	7
2407	193+000	-12.567877	-72.520768	0101000020E61000006A334E43542152C01A4D2EC6C02229C0	7
2408	194+000	-12.568015	-72.520756	0101000020E6100000884CF910542152C05F46B1DCD22229C0	7
2409	195+000	-12.568152	-72.520835	0101000020E61000002EE7525C552152C06150A6D1E42229C0	7
2410	196+000	-12.568343	-72.521104	0101000020E6100000257497C4592152C031D28BDAFD2229C0	7
2411	197+000	-12.568469	-72.52127	0101000020E6100000B398D87C5C2152C06494675E0E2329C0	7
2412	198+000	-12.56883	-72.521386	0101000020E6100000E8A562635E2152C0A5F78DAF3D2329C0	7
2413	199+000	-12.568997	-72.521435	0101000020E610000058FFE7305F2152C0520B2593532329C0	7
2414	200+000	-12.569206	-72.52141	0101000020E6100000AC730CC85E2152C0BB5F05F86E2329C0	7
2415	201+000	-12.569421	-72.521392	0101000020E610000059198D7C5E2152C0AD4F39268B2329C0	7
2416	202+000	-12.569588	-72.521466	0101000020E610000076FEEDB25F2152C05A63D009A12329C0	7
2417	203+000	-12.569767	-72.521563	0101000020E61000006FF3C649612152C019AE0E80B82329C0	7
2418	204+000	-12.569934	-72.521728	0101000020E6100000145AD6FD632152C0C6C1A563CE2329C0	7
2419	205+000	-12.570167	-72.52182	0101000020E61000008599B67F652152C05184D4EDEC2329C0	7
2420	206+000	-12.570364	-72.521949	0101000020E6100000844BC79C672152C0A9A10DC0062429C0	7
2421	207+000	-12.570484	-72.522071	0101000020E610000029CC7B9C692152C054C8957A162429C0	7
2422	208+000	-12.570639	-72.522144	0101000020E61000005EF3AACE6A2152C0F0A485CB2A2429C0	7
2423	209+000	-12.570675	-72.522248	0101000020E6100000B119E0826C2152C0234A7B832F2429C0	7
2424	210+000	-12.570615	-72.522438	0101000020E6100000020CCB9F6F2152C0CE3637A6272429C0	7
2425	211+000	-12.570484	-72.522573	0101000020E6100000723106D6712152C054C8957A162429C0	7
2426	212+000	-12.570316	-72.52275	0101000020E6100000FA7E6ABC742152C065C57075002429C0	7
2427	213+000	-12.570048	-72.523026	0101000020E61000004B3D0B42792152C0E84CDA54DD2329C0	7
2428	214+000	-12.569821	-72.523374	0101000020E6100000E964A9F57E2152C0E525FF93BF2329C0	7
2429	215+000	-12.569725	-72.523533	0101000020E61000001D588E90812152C05D6DC5FEB22329C0	7
2430	216+000	-12.569737	-72.523723	0101000020E61000006F4A79AD842152C06EA46C91B42329C0	7
2431	217+000	-12.569827	-72.524047	0101000020E610000048A46DFC892152C06EC1525DC02329C0	7
2432	218+000	-12.569821	-72.524255	0101000020E6100000EDF0D7648D2152C0E525FF93BF2329C0	7
2433	219+000	-12.569857	-72.52453	0101000020E610000056F146E6912152C019CBF44BC42329C0	7
2434	220+000	-12.569904	-72.524665	0101000020E6100000C616821C942152C01BB80375CA2329C0	7
2435	221+000	-12.569833	-72.524898	0101000020E610000017EFC7ED972152C0F65CA626C12329C0	7
2436	222+000	-12.569749	-72.525044	0101000020E6100000813D26529A2152C07FDB1324B62329C0	7
2437	223+000	-12.569702	-72.525234	0101000020E6100000D32F116F9D2152C07CEE04FBAF2329C0	7
2438	224+000	-12.569582	-72.525485	0101000020E61000007862D68BA12152C0D2C77C40A02329C0	7
2439	225+000	-12.569516	-72.525662	0101000020E6100000FFAF3A72A42152C0F418E599972329C0	7
2440	226+000	-12.56954	-72.525907	0101000020E6100000336FD575A82152C0168733BF9A2329C0	7
2441	227+000	-12.56951	-72.526139	0101000020E61000009C89E942AC2152C06B7D91D0962329C0	7
2442	228+000	-12.569504	-72.526366	0101000020E61000007CEE04FBAF2152C0E3E13D07962329C0	7
2443	229+000	-12.569385	-72.526525	0101000020E6100000B1E1E995B22152C07AAA436E862329C0	7
2444	230+000	-12.5692	-72.526672	0101000020E610000003EE79FEB42152C033C4B12E6E2329C0	7
2445	231+000	-12.569146	-72.526867	0101000020E6100000DD955D30B82152C0664CC11A672329C0	7
2446	232+000	-12.569224	-72.526996	0101000020E6100000DC476E4DBA2152C055320054712329C0	7
2447	233+000	-12.569325	-72.5271	0101000020E61000002F6EA301BC2152C02497FF907E2329C0	7
2448	234+000	-12.569385	-72.527234	0101000020E6100000B7D5AC33BE2152C07AAA436E862329C0	7
2449	235+000	-12.569486	-72.527424	0101000020E610000008C89750C12152C0490F43AB932329C0	7
2450	236+000	-12.569588	-72.527485	0101000020E61000005B087250C22152C05A63D009A12329C0	7
2451	237+000	-12.569743	-72.527546	0101000020E6100000AE484C50C32152C0F73FC05AB52329C0	7
2452	238+000	-12.569964	-72.52773	0101000020E61000008FC70C54C62152C071CB4752D22329C0	7
2453	239+000	-12.570126	-72.527882	0101000020E61000006A8995D1C82152C0D732198EE72329C0	7
2454	240+000	-12.5703	-72.527936	0101000020E6100000639813B4C92152C04ED1915CFE2329C0	7
2455	241+000	-12.570485	-72.527986	0101000020E6100000BCAFCA85CA2152C095B7239C162429C0	7
2456	242+000	-12.570622	-72.527979	0101000020E6100000637E6E68CA2152C098C11891282429C0	7
2457	243+000	-12.570736	-72.528065	0101000020E6100000624A24D1CB2152C0BA4C4D82372429C0	7
2458	244+000	-12.5707	-72.528291	0101000020E61000005AF10D85CF2152C087A757CA322429C0	7
2459	245+000	-12.570628	-72.528597	0101000020E6100000E1F08288D42152C0205D6C5A292429C0	7
2460	246+000	-12.570604	-72.52883	0101000020E610000032C9C859D82152C0FEEE1D35262429C0	7
2461	247+000	-12.570622	-72.529117	0101000020E61000007DB08C0DDD2152C098C11891282429C0	7
2462	248+000	-12.57067	-72.529301	0101000020E61000005E2F4D11E02152C0DC9DB5DB2E2429C0	7
2463	249+000	-12.570807	-72.529411	0101000020E610000021C9ACDEE12152C0DFA7AAD0402429C0	7
2464	250+000	-12.570885	-72.529527	0101000020E610000056D636C5E32152C0CE8DE9094B2429C0	7
2465	251+000	-12.570879	-72.529686	0101000020E61000008AC91B60E62152C045F295404A2429C0	7
2466	252+000	-12.570783	-72.529876	0101000020E6100000DCBB067DE92152C0BD395CAB3D2429C0	7
2467	253+000	-12.570616	-72.530023	0101000020E61000002EC896E5EB2152C00F26C5C7272429C0	7
2468	254+000	-12.570538	-72.530237	0101000020E610000044882B67EF2152C02140868E1D2429C0	7
2469	255+000	-12.570491	-72.53042	0101000020E61000003D49BA66F22152C01E537765172429C0	7
2470	256+000	-12.570503	-72.530683	0101000020E6100000C362D4B5F62152C02F8A1EF8182429C0	7
2471	257+000	-12.570527	-72.530842	0101000020E6100000F855B950F92152C051F86C1D1C2429C0	7
2472	258+000	-12.570515	-72.531032	0101000020E61000004948A46DFC2152C040C1C58A1A2429C0	7
2473	259+000	-12.570616	-72.531106	0101000020E6100000662D05A4FD2152C00F26C5C7272429C0	7
2474	260+000	-12.570742	-72.531246	0101000020E61000005F0839EFFF2152C042E8A04B382429C0	7
2475	261+000	-12.570897	-72.531387	0101000020E610000040A19E3E022252C0DFC4909C4C2429C0	7
2476	262+000	-12.571118	-72.531472	0101000020E610000057AF22A3032252C059501894692429C0	7
2477	263+000	-12.571572	-72.531632	0101000020E610000074603942062252C05E9ECE15A52429C0	7
2478	264+000	-12.571751	-72.531674	0101000020E61000008B8862F2062252C01DE90C8CBC2429C0	7
2479	265+000	-12.571948	-72.531736	0101000020E6100000C6866EF6072252C07506465ED62429C0	7
2480	266+000	-12.572079	-72.53173	0101000020E6100000551344DD072252C0EF74E789E72429C0	7
2481	267+000	-12.57224	-72.531619	0101000020E6100000AABBB20B062252C014ED2AA4FC2429C0	7
2482	268+000	-12.572396	-72.531472	0101000020E610000057AF22A3032252C0F1B8A816112529C0	7
2483	269+000	-12.572455	-72.531314	0101000020E61000000B7A6F0C012252C005DD5ED2182529C0	7
2484	270+000	-12.572539	-72.531258	0101000020E610000041EF8D21002252C07D5EF1D4232529C0	7
2485	271+000	-12.572688	-72.531326	0101000020E6100000EE60C43E012252C0909F8D5C372529C0	7
2486	272+000	-12.572736	-72.531485	0101000020E61000002254A9D9032252C0D57B2AA73D2529C0	7
2487	273+000	-12.572694	-72.531711	0101000020E61000001AFB928D072252C0193BE125382529C0	7
2488	274+000	-12.572664	-72.53198	0101000020E61000001288D7F50B2252C06E313F37342529C0	7
2489	275+000	-12.572634	-72.532268	0101000020E6100000452DCDAD102252C0C4279D48302529C0	7
2490	276+000	-12.572545	-72.532519	0101000020E6100000E95F92CA142252C005FA449E242529C0	7
2491	277+000	-12.572413	-72.532812	0101000020E6100000A6BA8097192252C0499C1551132529C0	7
2492	278+000	-12.572311	-72.532989	0101000020E61000002D08E57D1C2252C0384888F2052529C0	7
2493	279+000	-12.572122	-72.533308	0101000020E61000007EACE0B7212252C0ECA4BE2CED2429C0	7
2494	280+000	-12.572113	-72.53355	0101000020E6100000F931E6AE252252C09F3BC1FEEB2429C0	7
2495	281+000	-12.572198	-72.533666	0101000020E61000002D3F7095272252C058ACE122F72429C0	7
2496	282+000	-12.572377	-72.533763	0101000020E61000002634492C292252C016F71F990E2529C0	7
2497	283+000	-12.57249	-72.534044	0101000020E610000000A8E2C62D2252C0F792C6681D2529C0	7
2498	284+000	-12.572585	-72.53448	0101000020E61000006E179AEB342252C03E5C72DC292529C0	7
2499	285+000	-12.572377	-72.534954	0101000020E610000052B7B3AF3C2252C016F71F990E2529C0	7
2500	286+000	-12.572349	-72.535254	0101000020E61000006743FE99412252C0EFCB99ED0A2529C0	7
2501	287+000	-12.572519	-72.535651	0101000020E610000076C4211B482252C060ADDA35212529C0	7
2502	288+000	-12.572764	-72.535941	0101000020E610000079E57ADB4C2252C0FCA6B052412529C0	7
2503	289+000	-12.57301	-72.536241	0101000020E61000008F71C5C5512252C0DA8F1491612529C0	7
2504	290+000	-12.573331	-72.536309	0101000020E61000003BE3FBE2522252C0E2900DA48B2529C0	7
2505	291+000	-12.573681	-72.536203	0101000020E610000018416326512252C054AC1A84B92529C0	7
2506	292+000	-12.573993	-72.536222	0101000020E610000053591476512252C00F441669E22529C0	7
2507	293+000	-12.574418	-72.536367	0101000020E6100000D5E940D6532252C0AB77B81D1A2629C0	7
2508	294+000	-12.574664	-72.536542	0101000020E61000008CBB41B4562252C089601C5C3A2629C0	7
2509	295+000	-12.574834	-72.536871	0101000020E6100000EFCA2E185C2252C0FA415DA4502629C0	7
2510	296+000	-12.574985	-72.537171	0101000020E610000004577902612252C09161156F642629C0	7
2511	297+000	-12.575391	-72.537539	0101000020E6100000C554FA09672252C052D32EA6992629C0	7
2512	298+000	-12.575504	-72.5378	0101000020E61000007CF2B0506B2252C0336FD575A82629C0	7
2513	299+000	-12.575637	-72.537906	0101000020E61000009F94490D6D2252C030BC92E4B92629C0	7
2514	300+000	-12.575816	-72.537868	0101000020E61000002864E76D6C2252C0EE06D15AD12629C0	7
2515	301+000	-12.575968	-72.537713	0101000020E61000009468C9E3692252C0C6151747E52629C0	7
2516	302+000	-12.576119	-72.537713	0101000020E61000009468C9E3692252C05D35CF11F92629C0	7
2517	303+000	-12.576317	-72.537829	0101000020E6100000C97553CA6B2252C0F6419605132729C0	7
2518	304+000	-12.576572	-72.537858	0101000020E610000016F9F5436C2252C02194F771342729C0	7
2519	305+000	-12.576884	-72.537887	0101000020E6100000637C98BD6C2252C0DC2BF3565D2729C0	7
2520	306+000	-12.577016	-72.537994	0101000020E61000006EDC627E6E2252C0988922A46E2729C0	7
2521	307+000	-12.577243	-72.53809	0101000020E61000007F130A11702252C09AB0FD648C2729C0	7
2522	308+000	-12.577338	-72.538245	0101000020E6100000130F289B722252C0E179A9D8982729C0	7
2523	309+000	-12.577404	-72.538497	0101000020E6100000A0FF1EBC762252C0BF28417FA12729C0	7
2524	310+000	-12.577638	-72.538832	0101000020E6100000738236397C2252C08CDAFD2AC02729C0	7
2525	311+000	-12.577843	-72.53899	0101000020E6100000BFB7E9CF7E2252C0EF71A609DB2729C0	7
2526	312+000	-12.578029	-72.53922	0101000020E610000058569A94822252C07847C66AF32729C0	7
2527	313+000	-12.578215	-72.539567	0101000020E61000000EC00644882252C0001DE6CB0B2829C0	7
2528	314+000	-12.578368	-72.539718	0101000020E610000000C45DBD8A2252C0191BBAD91F2829C0	7
2529	315+000	-12.57865	-72.539804	0101000020E6100000009013268C2252C02AA913D0442829C0	7
2530	316+000	-12.578881	-72.539804	0101000020E6100000009013268C2252C0338D2617632829C0	7
2531	317+000	-12.579214	-72.539745	0101000020E61000007DCB9C2E8B2252C04CC5C6BC8E2829C0	7
2532	318+000	-12.579451	-72.539725	0101000020E61000005AF5B9DA8A2252C0DD442DCDAD2829C0	7
2533	319+000	-12.57956	-72.539626	0101000020E610000090847D3B892252C0B8239C16BC2829C0	7
2534	320+000	-12.579727	-72.539403	0101000020E610000050172994852252C0653733FAD12829C0	7
2535	321+000	-12.579977	-72.539082	0101000020E61000002FF7C951802252C048DDCEBEF22829C0	7
2536	322+000	-12.580143	-72.538904	0101000020E6100000C0EB33677D2252C0B401D880082929C0	7
2537	323+000	-12.580233	-72.538661	0101000020E61000005DA8FC6B792252C0B41EBE4C142929C0	7
2538	324+000	-12.580573	-72.538176	0101000020E61000007FDFBF79712252C097E13FDD402929C0	7
2539	325+000	-12.580746	-72.537946	0101000020E6100000E6400FB56D2252C0CD902A8A572929C0	7
2540	326+000	-12.580951	-72.537834	0101000020E6100000522B4CDF6B2252C03128D368722929C0	7
2541	327+000	-12.581085	-72.537677	0101000020E6100000EEB3CA4C692252C06F641EF9832929C0	7
2542	328+000	-12.581278	-72.53744	0101000020E6100000FCE3BD6A652252C0C1C41F459D2929C0	7
2543	329+000	-12.581598	-72.537467	0101000020E610000079EBFCDB652252C088D68A36C72929C0	7
2544	330+000	-12.581867	-72.537427	0101000020E6100000313F3734652252C0473EAF78EA2929C0	7
2545	331+000	-12.582072	-72.537316	0101000020E610000086E7A562632252C0AAD55757052A29C0	7
2546	332+000	-12.582271	-72.537237	0101000020E6100000E04C4C17622252C085D1AC6C1F2A29C0	7
2547	333+000	-12.582591	-72.537256	0101000020E61000001B65FD66622252C04CE3175E492A29C0	7
2548	334+000	-12.582719	-72.537322	0101000020E6100000F75AD07B632252C002840F255A2A29C0	7
2549	335+000	-12.582918	-72.537572	0101000020E6100000B3CF6394672252C0DC7F643A742A29C0	7
2550	336+000	-12.583078	-72.537749	0101000020E61000003B1DC87A6A2252C0C0081A33892A29C0	7
2551	337+000	-12.583206	-72.537782	0101000020E6100000299831056B2252C076A911FA992A29C0	7
2552	338+000	-12.583334	-72.537775	0101000020E6100000CF66D5E76A2252C02C4A09C1AA2A29C0	7
2553	339+000	-12.583494	-72.537729	0101000020E61000001747E5266A2252C00FD3BEB9BF2A29C0	7
2554	340+000	-12.5837	-72.537644	0101000020E6100000003961C2682252C0B459F5B9DA2A29C0	7
2555	341+000	-12.583847	-72.53771	0101000020E6100000DC2E34D7692252C045BC75FEED2A29C0	7
2556	342+000	-12.583988	-72.537801	0101000020E610000064B0E2546B2252C04D83A279002B29C0	7
2557	343+000	-12.584161	-72.537841	0101000020E6100000AB5CA8FC6B2252C083328D26172B29C0	7
2558	344+000	-12.584276	-72.537926	0101000020E6100000C26A2C616D2252C0E6AC4F39262B29C0	7
2559	345+000	-12.584603	-72.538038	0101000020E61000005680EF366F2252C077499C15512B29C0	7
2560	346+000	-12.584738	-72.538084	0101000020E61000000EA0DFF76F2252C0F77475C7622B29C0	7
2561	347+000	-12.584866	-72.538071	0101000020E610000044FB58C16F2252C0AD156D8E732B29C0	7
2562	348+000	-12.584988	-72.538031	0101000020E6100000FD4E93196F2252C0DA1A118C832B29C0	7
2563	349+000	-12.585154	-72.537985	0101000020E6100000452FA3586E2252C0463F1A4E992B29C0	7
2564	350+000	-12.585301	-72.538025	0101000020E61000008CDB68006F2252C0D7A19A92AC2B29C0	7
2565	351+000	-12.585474	-72.538044	0101000020E6100000C7F319506F2252C00D51853FC32B29C0	7
2566	352+000	-12.585686	-72.53813	0101000020E6100000C6BFCFB8702252C03B730F09DF2B29C0	7
2567	353+000	-12.585833	-72.53834	0101000020E61000003C889D29742252C0CBD58F4DF22B29C0	7
2568	354+000	-12.586256	-72.538727	0101000020E6100000389ECF807A2252C0E52A16BF292C29C0	7
2569	355+000	-12.58641	-72.539003	0101000020E6100000895C70067F2252C0401878EE3D2C29C0	7
2570	356+000	-12.586679	-72.539561	0101000020E61000009D4CDC2A882252C0FE7F9C30612C29C0	7
2571	357+000	-12.586794	-72.539672	0101000020E610000048A46DFC892252C061FA5E43702C29C0	7
2572	358+000	-12.586903	-72.539666	0101000020E6100000D73043E3892252C03CD9CD8C7E2C29C0	7
2573	359+000	-12.587064	-72.539548	0101000020E6100000D2A755F4872252C0615111A7932C29C0	7
2574	360+000	-12.58741	-72.53941	0101000020E6100000AA4885B1852252C0CDAFE600C12C29C0	7
2575	361+000	-12.587685	-72.539272	0101000020E610000081E9B46E832252C014B35E0CE52C29C0	7
2576	362+000	-12.587858	-72.539292	0101000020E6100000A5BF97C2832252C04A6249B9FB2C29C0	7
2577	363+000	-12.587992	-72.539476	0101000020E6100000853E58C6862252C0889E94490D2D29C0	7
2578	364+000	-12.588114	-72.539508	0101000020E61000008BFB8F4C872252C0B5A338471D2D29C0	7
2579	365+000	-12.58823	-72.53964	0101000020E610000043E73576892252C05A0D897B2C2D29C0	7
2580	366+000	-12.588428	-72.539778	0101000020E61000006B4606B98B2252C0F419506F462D29C0	7
2581	367+000	-12.588736	-72.539837	0101000020E6100000EE0A7DB08C2252C0AAF413CE6E2D29C0	7
2582	368+000	-12.589274	-72.539961	0101000020E6100000640795B88E2252C026C45C52B52D29C0	7
2583	369+000	-12.589524	-72.539988	0101000020E6100000E00ED4298F2252C00A6AF816D62D29C0	7
2584	370+000	-12.589799	-72.539778	0101000020E61000006B4606B98B2252C0506D7022FA2D29C0	7
2585	371+000	-12.590242	-72.539416	0101000020E61000001BBCAFCA852252C086730D33342E29C0	7
2586	372+000	-12.590491	-72.539344	0101000020E6100000CE52B29C842252C0282A1BD6542E29C0	7
2587	373+000	-12.590735	-72.53939	0101000020E61000008672A25D852252C0833463D1742E29C0	7
2588	374+000	-12.591074	-72.539732	0101000020E6100000B32616F88A2252C025085740A12E29C0	7
2589	375+000	-12.591254	-72.539922	0101000020E6100000051901158E2252C0244223D8B82E29C0	7
2590	376+000	-12.591946	-72.540355	0101000020E6100000BA4E232D952252C0FCFECD8B132F29C0	7
2591	377+000	-12.592245	-72.540627	0101000020E61000006A15FDA1992252C0657094BC3A2F29C0	7
2592	378+000	-12.592521	-72.540896	0101000020E610000062A2410A9E2252C0ED629AE95E2F29C0	7
2593	379+000	-12.592829	-72.540862	0101000020E61000008C69A67B9D2252C0A33D5E48872F29C0	7
2594	380+000	-12.592961	-72.540813	0101000020E61000001B1021AE9C2252C05F9B8D95982F29C0	7
2595	381+000	-12.593142	-72.540803	0101000020E610000009A52F849C2252C0A0C4E74EB02F29C0	7
2596	382+000	-12.593287	-72.540878	0101000020E61000000F48C2BE9D2252C0AE484C50C32F29C0	7
2597	383+000	-12.593414	-72.540906	0101000020E6100000740D33349E2252C022FAB5F5D32F29C0	7
2598	384+000	-12.593677	-72.540948	0101000020E61000008B355CE49E2252C058C6866EF62F29C0	7
2599	385+000	-12.593971	-72.541066	0101000020E610000090BE49D3A02252C07A8B87F71C3029C0	7
2600	386+000	-12.594232	-72.541141	0101000020E61000009561DC0DA22252C02D793C2D3F3029C0	7
2601	387+000	-12.594402	-72.541299	0101000020E6100000E1968FA4A42252C09F5A7D75553029C0	7
2602	388+000	-12.594491	-72.541524	0101000020E6100000F17F4754A82252C05D88D51F613029C0	7
2603	389+000	-12.594676	-72.541841	0101000020E610000072A8DF85AD2252C0A46E675F793029C0	7
2604	390+000	-12.594843	-72.541959	0101000020E61000007731CD74AF2252C05182FE428F3029C0	7
2605	391+000	-12.595227	-72.541998	0101000020E6100000D61F6118B02252C07364E597C13029C0	7
2606	392+000	-12.595355	-72.542156	0101000020E6100000225514AFB22252C02905DD5ED23029C0	7
2607	393+000	-12.595637	-72.542208	0101000020E61000004BE82E89B32252C03A933655F73029C0	7
2608	394+000	-12.59597	-72.542261	0101000020E61000005C397B67B42252C053CBD6FA223129C0	7
2609	395+000	-12.596304	-72.542366	0101000020E6100000971DE21FB62252C0AEF204C24E3129C0	7
2610	396+000	-12.596598	-72.542418	0101000020E6100000C0B0FCF9B62252C0D0B7054B753129C0	7
2611	397+000	-12.596931	-72.542484	0101000020E61000009CA6CF0EB82252C0E9EFA5F0A03129C0	7
2612	398+000	-12.597307	-72.542648	0101000020E6100000594FADBEBA2252C000581D39D23129C0	7
2613	399+000	-12.597485	-72.54312	0101000020E61000006D73637AC22252C07DB3CD8DE93129C0	7
2614	400+000	-12.597651	-72.543296	0101000020E61000000C03965CC52252C0E9D7D64FFF3129C0	7
2615	401+000	-12.59807	-72.543372	0101000020E6100000FA635A9BC62252C0FC6F253B363229C0	7
2616	402+000	-12.598407	-72.54334	0101000020E6100000F4A62215C62252C01B65FD66623229C0	7
2617	403+000	-12.598585	-72.543504	0101000020E6100000B14F00C5C82252C098C0ADBB793229C0	7
2618	404+000	-12.59872	-72.543706	0101000020E6100000E5284014CC2252C018EC866D8B3229C0	7
2619	405+000	-12.598837	-72.543737	0101000020E610000002284696CC2252C0FE4465C39A3229C0	7
2620	406+000	-12.598899	-72.543611	0101000020E6100000BCAFCA85CA2252C0D636C5E3A23229C0	7
2621	407+000	-12.598733	-72.543422	0101000020E6100000537B116DC72252C06A12BC218D3229C0	7
2622	408+000	-12.598512	-72.543164	0101000020E61000005517F032C32252C0F086342A703229C0	7
2623	409+000	-12.598247	-72.543076	0101000020E610000085CFD6C1C12252C038DC476E4D3229C0	7
2624	410+000	-12.598044	-72.543126	0101000020E6100000DEE68D93C22252C05723BBD2323229C0	7
2625	411+000	-12.597897	-72.54312	0101000020E61000006D73637AC22252C0C6C03A8E1F3229C0	7
2626	412+000	-12.597762	-72.543057	0101000020E61000004AB72572C12252C0469561DC0D3229C0	7
2627	413+000	-12.597706	-72.542786	0101000020E610000082AE7D01BD2252C0F73E5585063229C0	7
2628	414+000	-12.597627	-72.542434	0101000020E6100000438F183DB72252C0C669882AFC3129C0	7
2629	415+000	-12.597553	-72.542056	0101000020E61000007026A60BB12252C0DD408177F23129C0	7
2630	416+000	-12.597412	-72.541987	0101000020E6100000DCF63DEAAF2252C0D57954FCDF3129C0	7
2631	417+000	-12.597258	-72.541993	0101000020E61000004D6A6803B02252C07A8CF2CCCB3129C0	7
2632	418+000	-12.597086	-72.542043	0101000020E6100000A6811FD5B02252C085CC9541B53129C0	7
2633	419+000	-12.596932	-72.54198	0101000020E610000082C5E1CCAF2252C02BDF3312A13129C0	7
2634	420+000	-12.596637	-72.54171	0101000020E6100000A27A6B60AB2252C0C72AA5677A3129C0	7
2635	421+000	-12.596318	-72.541496	0101000020E61000008CBAD6DEA72252C04208C897503129C0	7
2636	422+000	-12.596041	-72.541451	0101000020E6100000BC581822A72252C0782634492C3129C0	7
2637	423+000	-12.595714	-72.541438	0101000020E6100000F2B391EBA62252C0E789E76C013129C0	7
2638	424+000	-12.595482	-72.541332	0101000020E6100000CF11F92EA52252C09EB64604E33029C0	7
2639	425+000	-12.595169	-72.540878	0101000020E61000000F48C2BE9D2252C0A12FBDFDB93029C0	7
2640	426+000	-12.595033	-72.540561	0101000020E61000008E1F2A8D982252C0E014562AA83029C0	7
2641	427+000	-12.594887	-72.540438	0101000020E610000000E14389962252C090A16307953029C0	7
2642	428+000	-12.594732	-72.540431	0101000020E6100000A7AFE76B962252C0F4C473B6803029C0	7
2643	429+000	-12.59456	-72.540425	0101000020E6100000363CBD52962252C0FF04172B6A3029C0	7
2644	430+000	-12.594407	-72.540381	0101000020E61000004E98309A952252C0E606431D563029C0	7
2645	431+000	-12.594148	-72.540161	0101000020E6100000C76471FF912252C0B6F7A92A343029C0	7
2646	432+000	-12.593921	-72.540217	0101000020E610000091EF52EA922252C0B3D0CE69163029C0	7
2647	433+000	-12.593681	-72.540242	0101000020E61000003E7B2E53932252C05E83BEF4F62F29C0	7
2648	434+000	-12.593534	-72.540091	0101000020E61000004B77D7D9902252C0CD203EB0E32F29C0	7
2649	435+000	-12.593485	-72.539814	0101000020E610000012FB04508C2252C047551344DD2F29C0	7
2650	436+000	-12.593528	-72.539248	0101000020E6100000BD1B0B0A832252C04485EAE6E22F29C0	7
2651	437+000	-12.593466	-72.539027	0101000020E61000004E2A1A6B7F2252C06C938AC6DA2F29C0	7
2652	438+000	-12.593313	-72.538939	0101000020E61000007EE200FA7D2252C05395B6B8C62F29C0	7
2653	439+000	-12.593178	-72.53892	0101000020E610000043CA4FAA7D2252C0D369DD06B52F29C0	7
2654	440+000	-12.593006	-72.538769	0101000020E610000050C6F8307B2252C0DFA9807B9E2F29C0	7
2655	441+000	-12.592723	-72.538725	0101000020E610000068226C787A2252C08C2C9963792F29C0	7
2656	442+000	-12.592495	-72.538511	0101000020E61000005262D7F6762252C0481630815B2F29C0	7
2657	443+000	-12.592286	-72.538221	0101000020E61000004E417E36722252C0DFC14F1C402F29C0	7
2658	444+000	-12.592133	-72.537881	0101000020E6100000F2086EA46C2252C0C6C37B0E2C2F29C0	7
2659	445+000	-12.592096	-72.537415	0101000020E61000004F58E201652252C0512FF834272F29C0	7
2660	446+000	-12.59225	-72.536893	0101000020E6100000E31C75745C2252C0AC1C5A643B2F29C0	7
2661	447+000	-12.592268	-72.536345	0101000020E6100000E197FA79532252C046EF54C03D2F29C0	7
2662	448+000	-12.592207	-72.536087	0101000020E6100000E333D93F4F2252C0AFEC82C1352F29C0	7
2663	449+000	-12.592244	-72.535791	0101000020E61000006F9F55664A2252C02481069B3A2F29C0	7
2664	450+000	-12.592299	-72.535281	0101000020E6100000E44A3D0B422252C032E884D0412F29C0	7
2665	451+000	-12.592336	-72.534777	0101000020E6100000CB694FC9392252C0A67C08AA462F29C0	7
2666	452+000	-12.592244	-72.534046	0101000020E6100000D12346CF2D2252C02481069B3A2F29C0	7
2667	453+000	-12.592004	-72.533814	0101000020E6100000680932022A2252C0CE33F6251B2F29C0	7
2668	454+000	-12.59182	-72.533725	0101000020E6100000B003E78C282252C0C93CF207032F29C0	7
2669	455+000	-12.591733	-72.533536	0101000020E610000046CF2D74252252C08DEDB5A0F72E29C0	7
2670	456+000	-12.591752	-72.53326	0101000020E6100000F5108DEE202252C068AF3E1EFA2E29C0	7
2671	457+000	-12.59166	-72.532982	0101000020E6100000D4D688601C2252C0E5B33C0FEE2E29C0	7
2672	458+000	-12.591561	-72.532812	0101000020E6100000A6BA8097192252C0992D5915E12E29C0	7
2673	459+000	-12.591457	-72.532422	0101000020E6100000F06AB933132252C005FBAF73D32E29C0	7
2674	460+000	-12.591322	-72.532246	0101000020E610000051DB8651102252C085CFD6C1C12E29C0	7
2675	461+000	-12.591389	-72.53188	0101000020E6100000605969520A2252C0A46DFC89CA2E29C0	7
2676	462+000	-12.591696	-72.531182	0101000020E6100000548EC9E2FE2152C0195932C7F22E29C0	7
2677	463+000	-12.591783	-72.530558	0101000020E610000065A88AA9F42152C054A86E2EFE2E29C0	7
2678	464+000	-12.591709	-72.530224	0101000020E61000007AE3A430EF2152C06B7F677BF42E29C0	7
2679	465+000	-12.591482	-72.529998	0101000020E6100000823CBB7CEB2152C068588CBAD62E29C0	7
2680	466+000	-12.591328	-72.529746	0101000020E6100000F54BC45BE72152C00E6B2A8BC22E29C0	7
2681	467+000	-12.591113	-72.529652	0101000020E6100000B49080D1E52152C01C7BF65CA62E29C0	7
2682	468+000	-12.59091	-72.529645	0101000020E61000005B5F24B4E52152C03BC269C18B2E29C0	7
2683	469+000	-12.59075	-72.529607	0101000020E6100000E42EC214E52152C05839B4C8762E29C0	7
2684	470+000	-12.590584	-72.52957	0101000020E610000056BC9179E42152C0EC14AB06612E29C0	7
2685	471+000	-12.590357	-72.529588	0101000020E6100000A91611C5E42152C0E9EDCF45432E29C0	7
2686	472+000	-12.590234	-72.529551	0101000020E61000001AA4E029E42152C07BF99D26332E29C0	7
2687	473+000	-12.590136	-72.529343	0101000020E6100000755776C1E02152C06F62484E262E29C0	7
2688	474+000	-12.590031	-72.529173	0101000020E6100000473B6EF8DD2152C09A40118B182E29C0	7
2689	475+000	-12.589859	-72.52916	0101000020E61000007D96E7C1DD2152C0A680B4FF012E29C0	7
2690	476+000	-12.589564	-72.529192	0101000020E610000082531F48DE2152C042CC2555DB2D29C0	7
2691	477+000	-12.589417	-72.529167	0101000020E6100000D6C743DFDD2152C0B169A510C82D29C0	7
2692	478+000	-12.589343	-72.529047	0101000020E610000001C3F2E7DB2152C0C8409E5DBE2D29C0	7
2693	479+000	-12.589349	-72.528474	0101000020E610000053B29C84D22152C051DCF126BF2D29C0	7
2694	480+000	-12.589294	-72.528052	0101000020E610000098A59D9ACB2152C0437573F1B72D29C0	7
2695	481+000	-12.589245	-72.527718	0101000020E6100000ACE0B721C62152C0BDA94885B12D29C0	7
2696	482+000	-12.589331	-72.527441	0101000020E61000007364E597C12152C0B709F7CABC2D29C0	7
2697	483+000	-12.589423	-72.527095	0101000020E6100000A6B8AAECBB2152C03A05F9D9C82D29C0	7
2698	484+000	-12.589417	-72.526881	0101000020E610000090F8156BB82152C0B169A510C82D29C0	7
2699	485+000	-12.58954	-72.52651	0101000020E610000016C1FF56B22152C0205ED72FD82D29C0	7
2700	486+000	-12.58954	-72.526295	0101000020E6100000184339D1AE2152C0205ED72FD82D29C0	7
2701	487+000	-12.589435	-72.526094	0101000020E6100000CC272B86AB2152C04B3CA06CCA2D29C0	7
2702	488+000	-12.589282	-72.525905	0101000020E610000062F3716DA82152C0323ECC5EB62D29C0	7
2703	489+000	-12.589238	-72.525704	0101000020E610000017D86322A52152C0F31E679AB02D29C0	7
2704	490+000	-12.589374	-72.525571	0101000020E6100000772E8CF4A22152C0B439CE6DC22D29C0	7
2705	491+000	-12.589589	-72.525458	0101000020E6100000FB5A971AA12152C0A629029CDE2D29C0	7
2706	492+000	-12.589779	-72.525401	0101000020E61000004912842BA02152C034BC5983F72D29C0	7
2707	493+000	-12.589908	-72.525313	0101000020E610000079CA6ABA9E2152C02B4CDF6B082E29C0	7
2708	494+000	-12.589914	-72.52513	0101000020E61000008109DCBA9B2152C0B4E73235092E29C0	7
2709	495+000	-12.589834	-72.52496	0101000020E610000052EDD3F1982152C04223D8B8FE2D29C0	7
2710	496+000	-12.589804	-72.524841	0101000020E610000065A6B4FE962152C0981936CAFA2D29C0	7
2711	497+000	-12.589902	-72.524778	0101000020E610000042EA76F6952152C0A3B08BA2072E29C0	7
2712	498+000	-12.590099	-72.524721	0101000020E610000090A16307952152C0FBCDC474212E29C0	7
2713	499+000	-12.590295	-72.524652	0101000020E6100000FC71FBE5932152C011FC6F253B2E29C0	7
2714	500+000	-12.590566	-72.52423	0101000020E61000004165FCFB8C2152C05342B0AA5E2E29C0	7
2715	501+000	-12.590818	-72.524016	0101000020E61000002BA5677A892152C0B9C667B27F2E29C0	7
2716	502+000	-12.591193	-72.523097	0101000020E6100000B0E8D66B7A2152C08E3F51D9B02E29C0	7
2717	503+000	-12.591371	-72.522473	0101000020E6100000C1029832702152C00B9B012EC82E29C0	7
2718	504+000	-12.591334	-72.521862	0101000020E61000009CC1DF2F662152C096067E54C32E29C0	7
2719	505+000	-12.591322	-72.521535	0101000020E61000000A2E56D4602152C085CFD6C1C12E29C0	7
2720	506+000	-12.591377	-72.521315	0101000020E610000083FA96395D2152C0933655F7C82E29C0	7
2721	507+000	-12.591512	-72.521182	0101000020E6100000E350BF0B5B2152C013622EA9DA2E29C0	7
2722	508+000	-12.591721	-72.521101	0101000020E61000006D3A02B8592152C07CB60E0EF62E29C0	7
2723	509+000	-12.59193	-72.520943	0101000020E610000021054F21572152C0E50AEF72112F29C0	7
2724	510+000	-12.592071	-72.520716	0101000020E610000040A03369532152C0EED11BEE232F29C0	7
2725	511+000	-12.592194	-72.520698	0101000020E6100000ED45B41D532152C05CC64D0D342F29C0	7
2726	512+000	-12.592274	-72.520805	0101000020E6100000F8A57EDE542152C0CE8AA8893E2F29C0	7
2727	513+000	-12.592268	-72.521012	0101000020E6100000B534B742582152C046EF54C03D2F29C0	7
2728	514+000	-12.592176	-72.521076	0101000020E6100000C0AE264F592152C0C3F352B1312F29C0	7
2729	515+000	-12.591936	-72.521201	0101000020E61000001F69705B5B2152C06EA6423C122F29C0	7
2730	516+000	-12.591746	-72.521359	0101000020E61000006B9E23F25D2152C0E013EB54F92E29C0	7
2731	517+000	-12.591672	-72.521642	0101000020E6100000158E2095622152C0F7EAE3A1EF2E29C0	7
2732	518+000	-12.591635	-72.522146	0101000020E61000002F6F0ED76A2152C0825660C8EA2E29C0	7
2733	519+000	-12.591672	-72.522341	0101000020E61000000917F2086E2152C0F7EAE3A1EF2E29C0	7
2734	520+000	-12.591758	-72.522354	0101000020E6100000D4BB783F6E2152C0F14A92E7FA2E29C0	7
2735	521+000	-12.591881	-72.522158	0101000020E6100000115663096B2152C0603FC4060B2F29C0	7
2736	522+000	-12.592041	-72.521919	0101000020E61000004E0AF31E672152C043C879FF1F2F29C0	7
2737	523+000	-12.592385	-72.521567	0101000020E610000010EB8D5A612152C02C4833164D2F29C0	7
2738	524+000	-12.592563	-72.521246	0101000020E6100000EFCA2E185C2152C0A9A3E36A642F29C0	7
2739	525+000	-12.5926	-72.520893	0101000020E6100000C8ED974F562152C01D386744692F29C0	7
2740	526+000	-12.592594	-72.520723	0101000020E61000009AD18F86532152C0959C137B682F29C0	7
2741	527+000	-12.592649	-72.520679	0101000020E6100000B22D03CE522152C0A30392B06F2F29C0	7
2742	528+000	-12.592704	-72.520742	0101000020E6100000D5E940D6532152C0B16A10E6762F29C0	7
2743	529+000	-12.592729	-72.521	0101000020E6100000D34D6210582152C015C8EC2C7A2F29C0	7
2744	530+000	-12.592772	-72.521579	0101000020E6100000F2D1E28C612152C012F8C3CF7F2F29C0	7
2745	531+000	-12.592674	-72.522058	0101000020E61000005F27F565692152C007616EF7722F29C0	7
2746	532+000	-12.592692	-72.522385	0101000020E6100000F1BA7EC16E2152C0A0336953752F29C0	7
2747	533+000	-12.592772	-72.522662	0101000020E61000002A37514B732152C012F8C3CF7F2F29C0	7
2748	534+000	-12.592747	-72.522895	0101000020E61000007C0F971C772152C0AE9AE7887C2F29C0	7
2749	535+000	-12.592772	-72.523002	0101000020E6100000876F61DD782152C012F8C3CF7F2F29C0	7
2750	536+000	-12.592846	-72.522996	0101000020E610000016FC36C4782152C0FB20CB82892F29C0	7
2751	537+000	-12.592889	-72.52287	0101000020E6100000CF83BBB3762152C0F850A2258F2F29C0	7
2752	538+000	-12.592876	-72.5227	0101000020E6100000A167B3EA732152C0A62A6D718D2F29C0	7
2753	539+000	-12.592883	-72.522436	0101000020E6100000329067976F2152C070B54E5C8E2F29C0	7
2754	540+000	-12.592969	-72.521957	0101000020E6100000C53A55BE672152C06A15FDA1992F29C0	7
2755	541+000	-12.593018	-72.521642	0101000020E6100000158E2095622152C0F0E0270EA02F29C0	7
2756	542+000	-12.59311	-72.521598	0101000020E61000002DEA93DC612152C072DC291DAC2F29C0	7
2757	543+000	-12.593178	-72.521686	0101000020E6100000FD31AD4D632152C0D369DD06B52F29C0	7
2758	544+000	-12.593116	-72.521951	0101000020E610000054C72AA5672152C0FB777DE6AC2F29C0	7
2759	545+000	-12.593061	-72.522266	0101000020E610000004745FCE6C2152C0ED10FFB0A52F29C0	7
2760	546+000	-12.593061	-72.522606	0101000020E610000060AC6F60722152C0ED10FFB0A52F29C0	7
2761	547+000	-12.593073	-72.522864	0101000020E61000005E10919A762152C0FE47A643A72F29C0	7
2762	548+000	-12.593153	-72.522889	0101000020E61000000B9C6C03772152C06F0C01C0B12F29C0	7
2763	549+000	-12.593208	-72.52282	0101000020E6100000766C04E2752152C07E737FF5B82F29C0	7
2764	550+000	-12.593184	-72.522498	0101000020E61000006D8E739B702152C05C0531D0B52F29C0	7
2765	551+000	-12.593276	-72.52214	0101000020E6100000BDFBE3BD6A2152C0DE0033DFC12F29C0	7
2766	552+000	-12.593394	-72.521892	0101000020E6100000D102B4AD662152C006499F56D12F29C0	7
2767	553+000	-12.59355	-72.52138	0101000020E61000007632384A5E2152C0E4141DC9E52F29C0	7
2768	554+000	-12.593572	-72.520934	0101000020E6100000F7578FFB562152C083A44FABE82F29C0	7
2769	555+000	-12.593459	-72.520596	0101000020E61000006B9BE271512152C0A208A9DBD92F29C0	7
2770	556+000	-12.593485	-72.520498	0101000020E61000008AE8D7D64F2152C047551344DD2F29C0	7
2771	557+000	-12.593563	-72.520476	0101000020E61000009696917A4F2152C0363B527DE72F29C0	7
2772	558+000	-12.593628	-72.520538	0101000020E6100000D1949D7E502152C0D3FA5B02F02F29C0	7
2773	559+000	-12.593682	-72.520868	0101000020E61000001B62BCE6552152C09F724C16F72F29C0	7
2774	560+000	-12.593818	-72.521265	0101000020E61000002AE3DF675C2152C0618DB3E9083029C0	7
2775	561+000	-12.59386	-72.521649	0101000020E61000006EBF7CB2622152C01CCEFC6A0E3029C0	7
2776	562+000	-12.593842	-72.522587	0101000020E61000002594BE10722152C083FB010F0C3029C0	7
2777	563+000	-12.593824	-72.523091	0101000020E61000003E75AC527A2152C0E92807B3093029C0	7
2778	564+000	-12.593824	-72.523406	0101000020E6100000EE21E17B7F2152C0E92807B3093029C0	7
2779	565+000	-12.593547	-72.523651	0101000020E610000022E17B7F832152C01F477364E52F29C0	7
2780	566+000	-12.593117	-72.524029	0101000020E6100000F549EEB0892152C03C670B08AD2F29C0	7
2781	567+000	-12.592804	-72.524432	0101000020E6100000753E3C4B902152C03FE08101842F29C0	7
2782	568+000	-12.592705	-72.524734	0101000020E61000005A46EA3D952152C0F3599E07772F29C0	7
2783	569+000	-12.592613	-72.525005	0101000020E6100000224F92AE992152C0705E9CF86A2F29C0	7
2784	570+000	-12.592521	-72.525187	0101000020E61000003352EFA99C2152C0ED629AE95E2F29C0	7
2785	571+000	-12.592294	-72.525376	0101000020E61000009C86A8C29F2152C0EB3BBF28412F29C0	7
2786	572+000	-12.592121	-72.525553	0101000020E610000024D40CA9A22152C0B58CD47B2A2F29C0	7
2787	573+000	-12.592183	-72.52571	0101000020E6100000884B8E3BA52152C08D7E349C322F29C0	7
2788	574+000	-12.592386	-72.525691	0101000020E61000004C33DDEBA42152C06D37C1374D2F29C0	7
2789	575+000	-12.592705	-72.525653	0101000020E6100000D6027B4CA42152C0F3599E07772F29C0	7
2790	576+000	-12.593105	-72.525767	0101000020E61000003A94A12AA62152C02B306475AB2F29C0	7
2791	577+000	-12.593277	-72.525918	0101000020E61000002D98F8A3A82152C020F0C000C22F29C0	7
2792	578+000	-12.593381	-72.526107	0101000020E610000096CCB1BCAB2152C0B4226AA2CF2F29C0	7
2793	579+000	-12.593473	-72.526327	0101000020E61000001D007157AF2152C0361E6CB1DB2F29C0	7
2794	580+000	-12.593652	-72.526516	0101000020E610000087342A70B22152C0F568AA27F32F29C0	7
2795	581+000	-12.593658	-72.526793	0101000020E6100000C0B0FCF9B62152C07D04FEF0F32F29C0	7
2796	582+000	-12.593608	-72.526988	0101000020E61000009B58E02BBA2152C0B6494563ED2F29C0	7
2797	583+000	-12.593455	-72.527089	0101000020E6100000354580D3BB2152C09D4B7155D92F29C0	7
2798	584+000	-12.593246	-72.527133	0101000020E61000001DE90C8CBC2152C034F790F0BD2F29C0	7
2799	585+000	-12.593178	-72.52724	0101000020E61000002849D74CBE2152C0D369DD06B52F29C0	7
2800	586+000	-12.593234	-72.527328	0101000020E6100000F790F0BDBF2152C023C0E95DBC2F29C0	7
2801	587+000	-12.593369	-72.527479	0101000020E6100000EA944737C22152C0A2EBC20FCE2F29C0	7
2802	588+000	-12.593369	-72.527712	0101000020E61000003B6D8D08C62152C0A2EBC20FCE2F29C0	7
2803	589+000	-12.593295	-72.527901	0101000020E6100000A5A14621C92152C0B9C2BB5CC42F29C0	7
2804	590+000	-12.593184	-72.528027	0101000020E6100000EB19C231CB2152C05C0531D0B52F29C0	7
2805	591+000	-12.593215	-72.528115	0101000020E6100000BB61DBA2CC2152C048FE60E0B92F29C0	7
2806	592+000	-12.593436	-72.528204	0101000020E610000073672618CE2152C0C289E8D7D62F29C0	7
2807	593+000	-12.593707	-72.528329	0101000020E6100000D1217024D02152C003D0285DFA2F29C0	7
2808	594+000	-12.594056	-72.5284	0101000020E610000036CD3B4ED12152C033FCA71B283029C0	7
2809	595+000	-12.594295	-72.528495	0101000020E61000005F46B1DCD22152C0475A2A6F473029C0	7
2810	596+000	-12.594645	-72.528677	0101000020E61000006F490ED8D52152C0B875374F753029C0	7
2811	597+000	-12.594897	-72.52869	0101000020E610000039EE940ED62152C01EFAEE56963029C0	7
2812	598+000	-12.595149	-72.528684	0101000020E6100000C87A6AF5D52152C0847EA65EB73029C0	7
2813	599+000	-12.595352	-72.528652	0101000020E6100000C2BD326FD52152C0653733FAD13029C0	7
2814	600+000	-12.59545	-72.528709	0101000020E61000007506465ED62152C070CE88D2DE3029C0	7
2815	601+000	-12.595481	-72.528885	0101000020E610000014967840D92152C05CC7B8E2E23029C0	7
2816	602+000	-12.595647	-72.529118	0101000020E6100000656EBE11DD2152C0C8EBC1A4F83029C0	7
2817	603+000	-12.595782	-72.529219	0101000020E6100000FF5A5EB9DE2152C048179B560A3129C0	7
2818	604+000	-12.596034	-72.529206	0101000020E610000035B6D782DE2152C0AE9B525E2B3129C0	7
2819	605+000	-12.596188	-72.529256	0101000020E61000008ECD8E54DF2152C00989B48D3F3129C0	7
2820	606+000	-12.596311	-72.529376	0101000020E610000063D2DF4BE12152C0787DE6AC4F3129C0	7
2821	607+000	-12.596384	-72.529401	0101000020E61000000F5EBBB4E12152C020B75F3E593129C0	7
2822	608+000	-12.596507	-72.529294	0101000020E610000004FEF0F3DF2152C08FAB915D693129C0	7
2823	609+000	-12.596747	-72.529162	0101000020E61000004D124BCADD2152C0E4F8A1D2883129C0	7
2824	610+000	-12.597024	-72.529143	0101000020E610000012FA997ADD2152C0ADDA3521AD3129C0	7
2825	611+000	-12.597276	-72.529275	0101000020E6100000C9E53FA4DF2152C0145FED28CE3129C0	7
2826	612+000	-12.597368	-72.529502	0101000020E6100000A94A5B5CE32152C0965AEF37DA3129C0	7
2827	613+000	-12.597337	-72.529722	0101000020E6100000317E1AF7E62152C0AA61BF27D63129C0	7
2828	614+000	-12.597312	-72.529936	0101000020E6100000473EAF78EA2152C04704E3E0D23129C0	7
2829	615+000	-12.597405	-72.529987	0101000020E61000008813984EEB2152C00BEF7211DF3129C0	7
2830	616+000	-12.597503	-72.529911	0101000020E61000009AB2D30FEA2152C01686C8E9EB3129C0	7
2831	617+000	-12.597706	-72.529766	0101000020E61000001822A7AFE72152C0F73E5585063229C0	7
2832	618+000	-12.59789	-72.529811	0101000020E6100000E883656CE82152C0FC3559A31E3229C0	7
2833	619+000	-12.598013	-72.529987	0101000020E61000008813984EEB2152C06B2A8BC22E3229C0	7
2834	620+000	-12.598007	-72.53027	0101000020E6100000320395F1EF2152C0E38E37F92D3229C0	7
2835	621+000	-12.597958	-72.530698	0101000020E61000005E83BEF4F62152C05DC30C8D273229C0	7
2836	622+000	-12.598001	-72.531076	0101000020E610000031EC3026FD2152C05AF3E32F2D3229C0	7
2837	623+000	-12.598117	-72.531536	0101000020E6100000632992AF042252C0FF5C34643C3229C0	7
2838	624+000	-12.598068	-72.531794	0101000020E6100000618DB3E9082252C0799109F8353229C0	7
2839	625+000	-12.59797	-72.532102	0101000020E6100000B7088CF50D2252C06EFAB31F293229C0	7
2840	626+000	-12.597915	-72.532644	0101000020E6100000481ADCD6162252C0609335EA213229C0	7
2841	627+000	-12.598013	-72.533179	0101000020E61000007FFACF9A1F2252C06B2A8BC22E3229C0	7
2842	628+000	-12.598216	-72.533469	0101000020E6100000821B295B242252C04CE3175E493229C0	7
2843	629+000	-12.598474	-72.533664	0101000020E61000005DC30C8D272252C03A03232F6B3229C0	7
2844	630+000	-12.598689	-72.533891	0101000020E61000003D2828452B2252C02CF3565D873229C0	7
2845	631+000	-12.599113	-72.534798	0101000020E6100000D6FD63213A2252C086376BF0BE3229C0	7
2846	632+000	-12.599217	-72.535213	0101000020E610000038D906EE402252C01A6A1492CC3229C0	7
2847	633+000	-12.599168	-72.535559	0101000020E610000006854199462252C0959EE925C63229C0	7
2848	634+000	-12.599211	-72.535622	0101000020E610000029417FA1472252C092CEC0C8CB3229C0	7
2849	635+000	-12.599297	-72.535578	0101000020E6100000419DF2E8462252C08C2E6F0ED73229C0	7
2850	636+000	-12.5995	-72.535465	0101000020E6100000C5C9FD0E452252C06DE7FBA9F13229C0	7
2851	637+000	-12.59969	-72.535245	0101000020E61000003E963E74412252C0FB7953910A3329C0	7
2852	638+000	-12.599936	-72.535194	0101000020E6100000FDC0559E402252C0D862B7CF2A3329C0	7
2853	639+000	-12.600182	-72.535295	0101000020E610000097ADF545422252C0B64B1B0E4B3329C0	7
2854	640+000	-12.60079	-72.535238	0101000020E6100000E564E256412252C0168733BF9A3329C0	7
2855	641+000	-12.600987	-72.535289	0101000020E6100000263ACB2C422252C06EA46C91B43329C0	7
2856	642+000	-12.601214	-72.535478	0101000020E61000008F6E8445452252C071CB4752D23329C0	7
2857	643+000	-12.601393	-72.535509	0101000020E6100000AD6D8AC7452252C02F1686C8E93329C0	7
2858	644+000	-12.601559	-72.535358	0101000020E6100000BA69334E432252C09B3A8F8AFF3329C0	7
2859	645+000	-12.601724	-72.535308	0101000020E610000061527C7C422252C0C66F0A2B153429C0	7
2860	646+000	-12.602081	-72.535559	0101000020E610000006854199462252C00116F9F5433429C0	7
2861	647+000	-12.602148	-72.535698	0101000020E610000016A243E0482252C020B41EBE4C3429C0	7
2862	648+000	-12.602198	-72.535862	0101000020E6100000D34A21904B2252C0E76ED74B533429C0	7
2863	649+000	-12.602327	-72.535862	0101000020E6100000D34A21904B2252C0DFFE5C34643429C0	7
2864	650+000	-12.602437	-72.53578	0101000020E6100000757632384A2252C0FBCC599F723429C0	7
2865	651+000	-12.602542	-72.535364	0101000020E61000002BDD5D67432252C0D0EE9062803429C0	7
2866	652+000	-12.602874	-72.535049	0101000020E61000007B30293E3E2252C0A837A3E6AB3429C0	7
2867	653+000	-12.603267	-72.534911	0101000020E610000052D158FB3B2252C017838769DF3429C0	7
2868	654+000	-12.603482	-72.534741	0101000020E610000024B55032392252C00873BB97FB3429C0	7
2869	655+000	-12.603648	-72.534659	0101000020E6100000C6E061DA372252C07497C459113529C0	7
2870	656+000	-12.603808	-72.534552	0101000020E6100000BB809719362252C058207A52263529C0	7
2871	657+000	-12.603844	-72.53442	0101000020E61000000395F1EF332252C08BC56F0A2B3529C0	7
2872	658+000	-12.603758	-72.534376	0101000020E61000001BF16437332252C09065C1C41F3529C0	7
2873	659+000	-12.603642	-72.53442	0101000020E61000000395F1EF332252C0ECFB7090103529C0	7
2874	660+000	-12.6035	-72.534502	0101000020E61000006269E047352252C0A245B6F3FD3429C0	7
2875	661+000	-12.603347	-72.534628	0101000020E6100000A8E15B58372252C08847E2E5E93429C0	7
2876	662+000	-12.603175	-72.534665	0101000020E610000037548CF3372252C09487855AD33429C0	7
2877	663+000	-12.603027	-72.534722	0101000020E6100000E99C9FE2382252C0C23577F4BF3429C0	7
2878	664+000	-12.60288	-72.534804	0101000020E610000047718E3A3A2252C031D3F6AFAC3429C0	7
2879	665+000	-12.602824	-72.534728	0101000020E61000005A10CAFB382252C0E17CEA58A53429C0	7
2880	666+000	-12.602929	-72.534596	0101000020E6100000A22424D2362252C0B69E211CB33429C0	7
2881	667+000	-12.603193	-72.534464	0101000020E6100000EB387EA8342252C02D5A80B6D53429C0	7
2882	668+000	-12.603451	-72.534319	0101000020E610000069A85148322252C01C7A8B87F73429C0	7
2883	669+000	-12.603642	-72.53413	0101000020E61000000074982F2F2252C0ECFB7090103529C0	7
2884	670+000	-12.603765	-72.533714	0101000020E6100000B6DAC35E282252C05AF0A2AF203529C0	7
2885	671+000	-12.603894	-72.533607	0101000020E6100000AB7AF99D262252C052802898313529C0	7
2886	672+000	-12.604023	-72.533702	0101000020E6100000D4F36E2C282252C04910AE80423529C0	7
2887	673+000	-12.604029	-72.533941	0101000020E6100000963FDF162C2252C0D2AB014A433529C0	7
2888	674+000	-12.604115	-72.534231	0101000020E61000009A6038D7302252C0CC0BB08F4E3529C0	7
2889	675+000	-12.604336	-72.53452	0101000020E6100000B5C35F93352252C0469737876B3529C0	7
2890	676+000	-12.60452	-72.53486	0101000020E610000011FC6F253B2252C04C8E3BA5833529C0	7
2891	677+000	-12.604576	-72.535452	0101000020E6100000FB2477D8442252C09BE447FC8A3529C0	7
2892	678+000	-12.604576	-72.535805	0101000020E610000021020EA14A2252C09BE447FC8A3529C0	7
2893	679+000	-12.604736	-72.536032	0101000020E6100000026729594E2252C07F6DFDF49F3529C0	7
2894	680+000	-12.604908	-72.536151	0101000020E6100000EFAD484C502252C0732D5A80B63529C0	7
2895	681+000	-12.605061	-72.536265	0101000020E6100000533F6F2A522252C08C2B2E8ECA3529C0	7
2896	682+000	-12.605092	-72.536498	0101000020E6100000A417B5FB552252C079245E9ECE3529C0	7
2897	683+000	-12.604975	-72.536624	0101000020E6100000EB8F300C582252C092CB7F48BF3529C0	7
2898	684+000	-12.60492	-72.536856	0101000020E610000054AA44D95B2252C084640113B83529C0	7
2899	685+000	-12.605102	-72.537377	0101000020E6100000D9278062642252C0077DE9EDCF3529C0	7
2900	686+000	-12.605145	-72.537599	0101000020E610000030D7A205682252C004ADC090D53529C0	7
2901	687+000	-12.605275	-72.537617	0101000020E610000083312251682252C03D2CD49AE63529C0	7
2902	688+000	-12.60538	-72.537528	0101000020E6100000CB2BD7DB662252C0124E0B5EF43529C0	7
2903	689+000	-12.605553	-72.537377	0101000020E6100000D9278062642252C048FDF50A0B3629C0	7
2904	690+000	-12.60597	-72.537359	0101000020E610000085CD0017642252C0D8B628B3413629C0	7
2905	691+000	-12.606257	-72.537234	0101000020E61000002713B70A622252C030F14751673629C0	7
2906	692+000	-12.6071	-72.536691	0101000020E6100000AF433525592252C09FCDAACFD53629C0	7
2907	693+000	-12.607439	-72.536655	0101000020E6100000088F368E582252C040A19E3E023729C0	7
2908	694+000	-12.607726	-72.536584	0101000020E6100000A4E36A64572252C098DBBDDC273729C0	7
2909	695+000	-12.607891	-72.53654	0101000020E6100000BC3FDEAB562252C0C310397D3D3729C0	7
2910	696+000	-12.608186	-72.536548	0101000020E6100000FD2E6CCD562252C026C5C727643729C0	7
2911	697+000	-12.608369	-72.536673	0101000020E61000005BE9B5D9582252C0EACC3D247C3729C0	7
2912	698+000	-12.608594	-72.536948	0101000020E6100000C4E9245B5D2252C06A15FDA1993729C0	7
2913	699+000	-12.608823	-72.53702	0101000020E6100000115322895E2252C0EF1AF4A5B73729C0	7
2914	700+000	-12.609159	-72.537051	0101000020E61000002F52280B5F2252C0CD203EB0E33729C0	7
2915	701+000	-12.609554	-72.537184	0101000020E6100000CEFBFF38612252C0BE4A3E76173829C0	7
2916	702+000	-12.60969	-72.537165	0101000020E610000093E34EE9602252C08065A549293829C0	7
2917	703+000	-12.609813	-72.53722	0101000020E610000075B0FECF612252C0EF59D768393829C0	7
2918	704+000	-12.609843	-72.537371	0101000020E610000067B45549642252C0996379573D3829C0	7
2919	705+000	-12.609878	-72.537564	0101000020E610000072E0D572672252C08B19E1ED413829C0	7
2920	706+000	-12.609984	-72.537763	0101000020E6100000ED7F80B56A2252C0A22AA6D24F3829C0	7
2921	707+000	-12.60999	-72.538005	0101000020E6100000680586AC6E2252C02AC6F99B503829C0	7
2922	708+000	-12.609984	-72.538711	0101000020E6100000B6BFB33D7A2252C0A22AA6D24F3829C0	7
2923	709+000	-12.610114	-72.538995	0101000020E6100000486DE2E47E2252C0DAA9B9DC603829C0	7
2924	710+000	-12.610291	-72.539068	0101000020E61000007D941117802252C01616DC0F783829C0	7
2925	711+000	-12.610521	-72.539146	0101000020E61000003B71395E812252C0DD0A6135963829C0	7
2926	712+000	-12.61068	-72.539231	0101000020E6100000527FBDC2822252C07FA4880CAB3829C0	7
2927	713+000	-12.610768	-72.539195	0101000020E6100000ACCABE2B822252C0FCE25295B63829C0	7
2928	714+000	-12.61078	-72.539044	0101000020E6100000B9C667B27F2252C00D1AFA27B83829C0	7
2929	715+000	-12.610656	-72.538965	0101000020E6100000132C0E677E2252C05D363AE7A73829C0	7
2930	716+000	-12.610356	-72.538893	0101000020E6100000C6C210397D2252C0B2D5E594803829C0	7
2931	717+000	-12.610238	-72.538814	0101000020E61000002028B7ED7B2252C08B8D791D713829C0	7
2932	718+000	-12.610202	-72.538639	0101000020E61000006956B60F792252C057E883656C3829C0	7
2933	719+000	-12.610314	-72.538246	0101000020E6100000FBCC599F722252C0F7949C137B3829C0	7
2934	720+000	-12.610409	-72.537944	0101000020E610000015C5ABAC6D2252C03E5E4887873829C0	7
2935	721+000	-12.610367	-72.537727	0101000020E610000047CB811E6A2252C0821DFF05823829C0	7
2936	722+000	-12.610214	-72.537606	0101000020E61000008908FF22682252C0681F2BF86D3829C0	7
2937	723+000	-12.610161	-72.537316	0101000020E610000086E7A562632252C0DD96C805673829C0	7
2938	724+000	-12.610214	-72.536803	0101000020E61000004359F8FA5A2252C0681F2BF86D3829C0	7
2939	725+000	-12.610196	-72.536447	0101000020E61000006342CC25552252C0CF4C309C6B3829C0	7
2940	726+000	-12.610084	-72.536266	0101000020E61000003BFDA02E522252C030A017EE5C3829C0	7
2941	727+000	-12.609961	-72.53626	0101000020E6100000CA897615522252C0C1ABE5CE4C3829C0	7
2942	728+000	-12.609766	-72.53632	0101000020E6100000350C1F11532252C0EC6CC83F333829C0	7
2943	729+000	-12.609619	-72.536423	0101000020E61000009F7422C1542252C05B0A48FB1F3829C0	7
2944	730+000	-12.609507	-72.536392	0101000020E610000082751C3F542252C0BC5D2F4D113829C0	7
2945	731+000	-12.609289	-72.536314	0101000020E6100000C498F4F7522252C006A051BAF43729C0	7
2946	732+000	-12.6091	-72.536199	0101000020E610000077499C15512252C0B9FC87F4DB3729C0	7
2947	733+000	-12.608929	-72.536127	0101000020E61000002AE09EE74F2252C0062CB98AC53729C0	7
2948	734+000	-12.60877	-72.536024	0101000020E6100000C0779B374E2252C0649291B3B03729C0	7
2949	735+000	-12.6088	-72.535879	0101000020E61000003EE76ED74B2252C00F9C33A2B43729C0	7
2950	736+000	-12.608965	-72.535873	0101000020E6100000CD7344BE4B2252C039D1AE42CA3729C0	7
2951	737+000	-12.609277	-72.536066	0101000020E6100000D89FC4E74E2252C0F568AA27F33729C0	7
2952	738+000	-12.609436	-72.536223	0101000020E61000003C17467A512252C09702D2FE073829C0	7
2953	739+000	-12.609542	-72.536199	0101000020E610000077499C15512252C0AD1397E3153829C0	7
2954	740+000	-12.609542	-72.536103	0101000020E61000006612F5824F2252C0AD1397E3153829C0	7
2955	741+000	-12.609389	-72.535927	0101000020E6100000C782C2A04C2252C09415C3D5013829C0	7
2956	742+000	-12.609265	-72.535716	0101000020E610000069FCC22B492252C0E4310395F13729C0	7
2957	743+000	-12.609077	-72.535668	0101000020E6100000E1606F62482252C0D87DC7F0D83729C0	7
2958	744+000	-12.6089	-72.53571	0101000020E6100000F8889812492252C09D11A5BDC13729C0	7
2959	745+000	-12.6088	-72.535698	0101000020E610000016A243E0482252C00F9C33A2B43729C0	7
2960	746+000	-12.608812	-72.535583	0101000020E6100000CA52EBFD462252C020D3DA34B63729C0	7
2961	747+000	-12.609041	-72.535547	0101000020E6100000239EEC66462252C0A5D8D138D43729C0	7
2962	748+000	-12.60936	-72.535511	0101000020E61000007DE9EDCF452252C02BFBAE08FE3729C0	7
2963	749+000	-12.609519	-72.535662	0101000020E610000070ED4449482252C0CD94D6DF123829C0	7
2964	750+000	-12.609601	-72.53577	0101000020E6100000630B410E4A2252C0C1374D9F1D3829C0	7
2965	751+000	-12.609731	-72.535722	0101000020E6100000DB6FED44492252C0FAB660A92E3829C0	7
2966	752+000	-12.609872	-72.53545	0101000020E61000002AA913D0442252C0027E8D24413829C0	7
2967	753+000	-12.610055	-72.535432	0101000020E6100000D74E9484442252C0C6850321593829C0	7
2968	754+000	-12.610214	-72.535626	0101000020E6100000C93846B2472252C0681F2BF86D3829C0	7
2969	755+000	-12.610367	-72.536048	0101000020E61000008445459C4E2252C0821DFF05823829C0	7
2970	756+000	-12.610591	-72.53632	0101000020E6100000350C1F11532252C0C07630629F3829C0	7
2971	757+000	-12.610756	-72.536634	0101000020E6100000FDFA2136582252C0EBABAB02B53829C0	7
2972	758+000	-12.610968	-72.536797	0101000020E6100000D2E5CDE15A2252C018CE35CCD03829C0	7
2973	759+000	-12.611328	-72.536876	0101000020E61000007880272D5C2252C01842CEFBFF3829C0	7
2974	760+000	-12.61164	-72.537135	0101000020E61000005EA27A6B602252C0D3D9C9E0283929C0	7
2975	761+000	-12.611741	-72.537383	0101000020E61000004A9BAA7B642252C0A33EC91D363929C0	7
2976	762+000	-12.611794	-72.537769	0101000020E61000005EF3AACE6A2252C02EC72B103D3929C0	7
2977	763+000	-12.611906	-72.538114	0101000020E610000043E1B375702252C0CD7344BE4B3929C0	7
2978	764+000	-12.6119	-72.538307	0101000020E61000004E0D349F732252C045D8F0F44A3929C0	7
2979	765+000	-12.611852	-72.538536	0101000020E6100000FEEDB25F772252C001FC53AA443929C0	7
2980	766+000	-12.611923	-72.53879	0101000020E61000005C5A0D897B2252C02657B1F84D3929C0	7
2981	767+000	-12.611953	-72.539026	0101000020E6100000666CE8667F2252C0D06053E7513929C0	7
2982	768+000	-12.612071	-72.539122	0101000020E610000077A38FF9802252C0F8A8BF5E613929C0	7
2983	769+000	-12.612436	-72.539092	0101000020E61000004162BB7B802252C03FC91D36913929C0	7
2984	770+000	-12.612813	-72.539116	0101000020E6100000063065E0802252C0962023A0C23929C0	7
2985	771+000	-12.61296	-72.539297	0101000020E61000002E7590D7832252C02783A3E4D53929C0	7
2986	772+000	-12.612984	-72.539611	0101000020E6100000F56393FC882252C04AF1F109D93929C0	7
2987	773+000	-12.612866	-72.539925	0101000020E6100000BD5296218E2252C022A98592C93929C0	7
2988	774+000	-12.612748	-72.54039	0101000020E61000007845F0BF952252C0FA60191BBA3929C0	7
2989	775+000	-12.612772	-72.540692	0101000020E61000005E4D9EB29A2252C01CCF6740BD3929C0	7
2990	776+000	-12.612807	-72.540849	0101000020E6100000C1C41F459D2252C00E85CFD6C13929C0	7
2991	777+000	-12.612896	-72.540825	0101000020E6100000FDF675E09C2252C0CCB22781CD3929C0	7
2992	778+000	-12.612937	-72.540716	0101000020E6100000221B48179B2252C04704E3E0D23929C0	7
2993	779+000	-12.612848	-72.540505	0101000020E6100000C49448A2972252C088D68A36C73929C0	7
2994	780+000	-12.612902	-72.5403	0101000020E6100000D8817346942252C0554E7B4ACE3929C0	7
2995	781+000	-12.613019	-72.540058	0101000020E61000005DFC6D4F902252C03BA759A0DD3929C0	7
2996	782+000	-12.61319	-72.539829	0101000020E6100000AC1BEF8E8C2252C0EE77280AF43929C0	7
2997	783+000	-12.61322	-72.539285	0101000020E61000004C8E3BA5832252C09981CAF8F73929C0	7
2998	784+000	-12.612978	-72.538862	0101000020E6100000A8C30AB77C2252C0C1559E40D83929C0	7
2999	785+000	-12.612613	-72.538802	0101000020E61000003E4162BB7B2252C07A354069A83929C0	7
3000	786+000	-12.61246	-72.538645	0101000020E6100000DAC9E028792252C061376C5B943929C0	7
3001	787+000	-12.612371	-72.53847	0101000020E610000023F8DF4A762252C0A20914B1883929C0	7
3002	788+000	-12.612448	-72.538047	0101000020E6100000802DAF5C6F2252C05000C5C8923929C0	7
3003	789+000	-12.612442	-72.537902	0101000020E6100000FE9C82FC6C2252C0C76471FF913929C0	7
3004	790+000	-12.612518	-72.537685	0101000020E61000002FA3586E692252C0336C94F59B3929C0	7
3005	791+000	-12.612548	-72.537322	0101000020E6100000F75AD07B632252C0DE7536E49F3929C0	7
3006	792+000	-12.612436	-72.536833	0101000020E6100000789ACC785B2252C03FC91D36913929C0	7
3007	793+000	-12.612212	-72.536392	0101000020E610000082751C3F542252C00070ECD9733929C0	7
3008	794+000	-12.611928	-72.53598	0101000020E6100000D8D30E7F4D2252C06D0377A04E3929C0	7
3009	795+000	-12.61191	-72.535922	0101000020E61000003ECDC98B4C2252C0D3307C444C3929C0	7
3010	796+000	-12.611882	-72.535868	0101000020E610000044BE4BA94B2252C0AB05F698483929C0	7
3011	797+000	-12.611863	-72.535833	0101000020E610000086C77E164B2252C0D0436D1B463929C0	7
3012	798+000	-12.611821	-72.535796	0101000020E6100000F8544E7B4A2252C01503249A403929C0	7
3013	799+000	-12.61178	-72.535765	0101000020E6100000DA5548F9492252C09AB1683A3B3929C0	7
3014	800+000	-12.611745	-72.535744	0101000020E6100000CEC133A1492252C0A9FB00A4363929C0	7
3015	801+000	-12.611691	-72.535721	0101000020E6100000F2B1BB40492252C0DC8310902F3929C0	7
3016	802+000	-12.611623	-72.535705	0101000020E61000006FD39FFD482252C07BF65CA6263929C0	7
3017	803+000	-12.611575	-72.535705	0101000020E61000006FD39FFD482252C0371AC05B203929C0	7
3018	804+000	-12.611536	-72.535702	0101000020E6100000B7990AF1482252C03FA7203F1B3929C0	7
3019	805+000	-12.611498	-72.535695	0101000020E61000005E68AED3482252C089230F44163929C0	7
3020	806+000	-12.611457	-72.535684	0101000020E6100000643F8BA5482252C00FD253E4103929C0	7
3021	807+000	-12.611433	-72.535673	0101000020E61000006A166877482252C0ED6305BF0D3929C0	7
3022	808+000	-12.611414	-72.535655	0101000020E610000017BCE82B482252C012A27C410B3929C0	7
3023	809+000	-12.611399	-72.535625	0101000020E6100000E17A14AE472252C03D9D2B4A093929C0	7
3024	810+000	-12.611407	-72.535591	0101000020E61000000B42791F472252C048179B560A3929C0	7
3025	811+000	-12.611427	-72.535574	0101000020E6100000A0A52BD8462252C065C8B1F50C3929C0	7
3026	812+000	-12.611458	-72.535557	0101000020E61000003509DE90462252C051C1E105113929C0	7
3027	813+000	-12.611544	-72.53555	0101000020E6100000DCD78173462252C04B21904B1C3929C0	7
3028	814+000	-12.611596	-72.535553	0101000020E610000094111780462252C095BA641C233929C0	7
3029	815+000	-12.611654	-72.535564	0101000020E61000008E3A3AAE462252C067EF8CB62A3929C0	7
3030	816+000	-12.611697	-72.535574	0101000020E6100000A0A52BD8462252C0641F6459303929C0	7
3031	817+000	-12.611744	-72.535593	0101000020E6100000DCBDDC27472252C0670C7382363929C0	7
3032	818+000	-12.611812	-72.535614	0101000020E6100000E751F17F472252C0C899266C3F3929C0	7
3033	819+000	-12.611873	-72.535648	0101000020E6100000BD8A8C0E482252C05E9CF86A473929C0	7
3034	820+000	-12.611919	-72.535693	0101000020E61000008DEC4ACB482252C0209A79724D3929C0	7
3035	821+000	-12.611966	-72.535736	0101000020E61000008DD2A57F492252C02387889B533929C0	7
3036	822+000	-12.611995	-72.53579	0101000020E610000087E123624A2252C08CA19C68573929C0	7
3037	823+000	-12.612371	-72.536266	0101000020E61000003BFDA02E522252C0A20914B1883929C0	7
3038	824+000	-12.612648	-72.536791	0101000020E61000006072A3C85A2252C06CEBA7FFAC3929C0	7
3039	825+000	-12.612848	-72.537292	0101000020E6100000C119FCFD622252C088D68A36C73929C0	7
3040	826+000	-12.612843	-72.537528	0101000020E6100000CB2BD7DB662252C0412AC58EC63929C0	7
3041	827+000	-12.612919	-72.53763	0101000020E61000004DD6A887682252C0AD31E884D03929C0	7
3042	0+000	-12.434372	-72.409248	0101000020E610000005FD851E311A52C0A298BC0166DE28C0	8
3043	1+000	-12.434388	-72.409416	0101000020E6100000629D2ADF331A52C0B98C9B1A68DE28C0	8
3044	2+000	-12.434397	-72.409517	0101000020E6100000FC89CA86351A52C006F6984869DE28C0	8
3045	3+000	-12.434543	-72.410115	0101000020E61000005726FC523F1A52C055698B6B7CDE28C0	8
3046	4+000	-12.434624	-72.41057	0101000020E610000000AE64C7461A52C0081D740987DE28C0	8
3047	5+000	-12.434692	-72.41075	0101000020E61000003F355EBA491A52C069AA27F38FDE28C0	8
3048	6+000	-12.434807	-72.411032	0101000020E6100000026729594E1A52C0CC24EA059FDE28C0	8
3049	7+000	-12.434834	-72.411493	0101000020E61000001B62BCE6551A52C0B360E28FA2DE28C0	8
3050	8+000	-12.434932	-72.411919	0101000020E6100000776682E15C1A52C0BEF73768AFDE28C0	8
3051	9+000	-12.434922	-72.412243	0101000020E610000051C07630621A52C0309FAC18AEDE28C0	8
3052	10+000	-12.434832	-72.412852	0101000020E6100000A585CB2A6C1A52C03082C64CA2DE28C0	8
3053	11+000	-12.434809	-72.41346	0101000020E6100000118DEE20761A52C04F0306499FDE28C0	8
3054	12+000	-12.434826	-72.413882	0101000020E6100000CC99ED0A7D1A52C0A7E67283A1DE28C0	8
3055	13+000	-12.434934	-72.414125	0101000020E61000002FDD2406811A52C041D653ABAFDE28C0	8
3056	14+000	-12.435028	-72.414195	0101000020E6100000ACCABE2B821A52C047B071FDBBDE28C0	8
3057	15+000	-12.435295	-72.41434	0101000020E61000002D5BEB8B841A52C082397AFCDEDE28C0	8
3058	16+000	-12.435563	-72.414512	0101000020E61000002CF3565D871A52C0FFB1101D02DF28C0	8
3059	17+000	-12.435815	-72.414662	0101000020E610000037397CD2891A52C06536C82423DF28C0	8
3060	18+000	-12.435881	-72.414721	0101000020E6100000B9FDF2C98A1A52C043E55FCB2BDF28C0	8
3061	19+000	-12.435877	-72.414808	0101000020E6100000A087DA368C1A52C03D2828452BDF28C0	8
3062	20+000	-12.435838	-72.414906	0101000020E6100000823AE5D18D1A52C046B5882826DF28C0	8
3063	21+000	-12.43586	-72.414997	0101000020E61000000ABC934F8F1A52C0E544BB0A29DF28C0	8
3064	22+000	-12.436021	-72.41513	0101000020E6100000AA656B7D911A52C00ABDFE243EDF28C0	8
3065	23+000	-12.436112	-72.415236	0101000020E6100000CC07043A931A52C04BC972124ADF28C0	8
3066	24+000	-12.436144	-72.415471	0101000020E6100000EE5BAD13971A52C079B130444EDF28C0	8
3067	25+000	-12.43624	-72.415572	0101000020E610000088484DBB981A52C0016A6AD95ADF28C0	8
3068	26+000	-12.436464	-72.415842	0101000020E61000006893C3279D1A52C040C39B3578DF28C0	8
3069	27+000	-12.436535	-72.416095	0101000020E6100000DD41EC4CA11A52C0641EF98381DF28C0	8
3070	28+000	-12.43651	-72.416232	0101000020E61000001DE38A8BA31A52C001C11C3D7EDF28C0	8
3071	29+000	-12.43645	-72.41654	0101000020E6100000745E6397A81A52C0ACADD85F76DF28C0	8
3072	30+000	-12.436501	-72.416664	0101000020E6100000EA5A7B9FAA1A52C0B4571F0F7DDF28C0	8
3073	31+000	-12.436607	-72.416992	0101000020E610000064AC36FFAF1A52C0CB68E4F38ADF28C0	8
3074	32+000	-12.436739	-72.417221	0101000020E6100000158DB5BFB31A52C086C613419CDF28C0	8
3075	33+000	-12.436776	-72.417368	0101000020E610000067994528B61A52C0FB5A971AA1DF28C0	8
3076	34+000	-12.436854	-72.417432	0101000020E61000007313B534B71A52C0EA40D653ABDF28C0	8
3077	35+000	-12.436985	-72.417494	0101000020E6100000AE11C138B81A52C064AF777FBCDF28C0	8
3078	36+000	-12.436948	-72.417579	0101000020E6100000C51F459DB91A52C0EF1AF4A5B7DF28C0	8
3079	37+000	-12.436808	-72.417664	0101000020E6100000DC2DC901BB1A52C02843554CA5DF28C0	8
3080	38+000	-12.436728	-72.417764	0101000020E61000008E5C37A5BC1A52C0B77EFACF9ADF28C0	8
3081	39+000	-12.436788	-72.417902	0101000020E6100000B6BB07E8BE1A52C00C923EADA2DF28C0	8
3082	40+000	-12.436948	-72.418186	0101000020E61000004969368FC31A52C0EF1AF4A5B7DF28C0	8
3083	41+000	-12.4371	-72.418403	0101000020E61000001763601DC71A52C0C7293A92CBDF28C0	8
3084	42+000	-12.437126	-72.418659	0101000020E6100000454B1E4FCB1A52C06C76A4FACEDF28C0	8
3085	43+000	-12.437006	-72.418952	0101000020E610000001A60C1CD01A52C0C24F1C40BFDF28C0	8
3086	44+000	-12.436825	-72.419134	0101000020E610000011A96917D31A52C08126C286A7DF28C0	8
3087	45+000	-12.436593	-72.419225	0101000020E6100000992A1895D41A52C03753211E89DF28C0	8
3088	46+000	-12.436352	-72.419486	0101000020E610000050C8CEDBD81A52C0A016838769DF28C0	8
3089	47+000	-12.436215	-72.419615	0101000020E61000004E7ADFF8DA1A52C09E0C8E9257DF28C0	8
3090	48+000	-12.435966	-72.419641	0101000020E6100000E3C3EC65DB1A52C0FC5580EF36DF28C0	8
3091	49+000	-12.435774	-72.419638	0101000020E61000002B8A5759DB1A52C0EBE40CC51DDF28C0	8
3092	50+000	-12.435584	-72.419694	0101000020E6100000F5143944DC1A52C05D52B5DD04DF28C0	8
3093	51+000	-12.43537	-72.419888	0101000020E6100000E7FEEA71DF1A52C0AD510FD1E8DE28C0	8
3094	52+000	-12.43518	-72.420164	0101000020E610000038BD8BF7E31A52C01FBFB7E9CFDE28C0	8
3095	53+000	-12.435126	-72.420484	0101000020E6100000711FB935E91A52C05247C7D5C8DE28C0	8
3096	54+000	-12.435186	-72.4208	0101000020E6100000098A1F63EE1A52C0A75A0BB3D0DE28C0	8
3097	55+000	-12.435163	-72.421243	0101000020E6100000D02A33A5F51A52C0C6DB4AAFCDDE28C0	8
3098	56+000	-12.435198	-72.421625	0101000020E6100000448B6CE7FB1A52C0B891B245D2DE28C0	8
3099	57+000	-12.435412	-72.422138	0101000020E610000087191A4F041B52C068925852EEDE28C0	8
3100	58+000	-12.43555	-72.422514	0101000020E61000008A0629780A1B52C0AC8BDB6800DF28C0	8
3101	59+000	-12.435518	-72.423004	0101000020E6100000F1845E7F121B52C07FA31D37FCDE28C0	8
3102	60+000	-12.435521	-72.42323	0101000020E6100000E92B4833161B52C04371C79BFCDE28C0	8
3103	61+000	-12.435438	-72.423722	0101000020E61000002026E1421E1B52C00DDFC2BAF1DE28C0	8
3104	62+000	-12.435286	-72.424506	0101000020E61000002BBD361B2B1B52C035D07CCEDDDE28C0	8
3105	63+000	-12.435172	-72.42487	0101000020E61000004CC3F011311B52C0134548DDCEDE28C0	8
3106	64+000	-12.434942	-72.42512	0101000020E61000000938842A351B52C04C50C3B7B0DE28C0	8
3107	65+000	-12.434857	-72.425192	0101000020E610000055A18158361B52C093DFA293A5DE28C0	8
3108	66+000	-12.434662	-72.425251	0101000020E6100000D865F84F371B52C0BEA085048CDE28C0	8
3109	67+000	-12.434381	-72.425298	0101000020E610000078431A15381B52C0EF01BA2F67DE28C0	8
3110	68+000	-12.43412	-72.425304	0101000020E6100000E9B6442E381B52C03C1405FA44DE28C0	8
3111	69+000	-12.433923	-72.425239	0101000020E6100000F67EA31D371B52C0E4F6CB272BDE28C0	8
3112	70+000	-12.433834	-72.425289	0101000020E61000004F965AEF371B52C025C9737D1FDE28C0	8
3113	71+000	-12.433716	-72.425427	0101000020E610000077F52A323A1B52C0FE80070610DE28C0	8
3114	72+000	-12.433502	-72.425776	0101000020E6100000FDDAFAE93F1B52C04E8061F9F3DD28C0	8
3115	73+000	-12.43345	-72.425894	0101000020E61000000264E8D8411B52C004E78C28EDDD28C0	8
3116	74+000	-12.433619	-72.426146	0101000020E61000008F54DFF9451B52C034D93F4F03DE28C0	8
3117	75+000	-12.433711	-72.426422	0101000020E6100000E012807F4A1B52C0B7D4415E0FDE28C0	8
3118	76+000	-12.433857	-72.42673	0101000020E6100000378E588B4F1B52C00648348122DE28C0	8
3119	77+000	-12.43386	-72.427032	0101000020E61000001C96067E541B52C0CA15DEE522DE28C0	8
3120	78+000	-12.433914	-72.427311	0101000020E6100000268E3C10591B52C0978DCEF929DE28C0	8
3121	79+000	-12.434052	-72.427651	0101000020E610000082C64CA25E1B52C0DB8651103CDE28C0	8
3122	80+000	-12.43414	-72.427868	0101000020E610000051C07630621B52C058C51B9947DE28C0	8
3123	81+000	-12.434123	-72.428302	0101000020E6100000EEB3CA4C691B52C000E2AE5E45DE28C0	8
3124	82+000	-12.434086	-72.429115	0101000020E610000046CEC29E761B52C08C4D2B8540DE28C0	8
3125	83+000	-12.434149	-72.429338	0101000020E6100000863B17467A1B52C0A52E19C748DE28C0	8
3126	84+000	-12.434249	-72.429543	0101000020E6100000724EECA17D1B52C033A48AE255DE28C0	8
3127	85+000	-12.434192	-72.429728	0101000020E61000003B8BDEA9801B52C0A25EF0694EDE28C0	8
3128	86+000	-12.434075	-72.429901	0101000020E610000022E17B7F831B52C0BC0512143FDE28C0	8
3129	87+000	-12.434017	-72.43011	0101000020E6100000AFEB17EC861B52C0EAD0E97937DE28C0	8
3130	88+000	-12.434029	-72.430321	0101000020E61000000D7217618A1B52C0FB07910C39DE28C0	8
3131	89+000	-12.434037	-72.430658	0101000020E6100000B07092E68F1B52C0068200193ADE28C0	8
3132	90+000	-12.434103	-72.43079	0101000020E6100000685C3810921B52C0E43098BF42DE28C0	8
3133	91+000	-12.434352	-72.430981	0101000020E6100000A20C5531951B52C086E7A56263DE28C0	8
3134	92+000	-12.434564	-72.431022	0101000020E6100000D1764CDD951B52C0B309302C7FDE28C0	8
3135	93+000	-12.43484	-72.431028	0101000020E610000042EA76F6951B52C03BFC3559A3DE28C0	8
3136	94+000	-12.435129	-72.431078	0101000020E61000009B012EC8961B52C01615713AC9DE28C0	8
3137	95+000	-12.43547	-72.431081	0101000020E6100000543BC3D4961B52C03BC780ECF5DE28C0	8
3138	96+000	-12.43567	-72.43118	0101000020E61000001DACFF73981B52C057B2632310DF28C0	8
3139	97+000	-12.435997	-72.431319	0101000020E61000002EC901BB9A1B52C0E84EB0FF3ADF28C0	8
3140	98+000	-12.43627	-72.431466	0101000020E610000080D591239D1B52C0AC730CC85EDF28C0	8
3141	99+000	-12.436484	-72.431697	0101000020E6100000013274ECA01B52C05C74B2D47ADF28C0	8
3142	100+000	-12.436731	-72.431856	0101000020E610000035255987A31B52C07B4CA4349BDF28C0	8
3143	101+000	-12.437066	-72.432008	0101000020E610000010E7E104A61B52C01763601DC7DF28C0	8
3144	102+000	-12.437327	-72.432246	0101000020E6100000EB7420EBA91B52C0CA501553E9DF28C0	8
3145	103+000	-12.437467	-72.432463	0101000020E6100000B96E4A79AD1B52C09128B4ACFBDF28C0	8
3146	104+000	-12.437682	-72.432589	0101000020E6100000FFE6C589AF1B52C08318E8DA17E028C0	8
3147	105+000	-12.4378	-72.432786	0101000020E6100000AA0A0DC4B21B52C0AA60545227E028C0	8
3148	106+000	-12.438078	-72.433079	0101000020E61000006765FB90B71B52C0B63176C24BE028C0	8
3149	107+000	-12.438198	-72.433246	0101000020E6100000DC476E4DBA1B52C06058FE7C5BE028C0	8
3150	108+000	-12.438206	-72.43342	0101000020E6100000AB5B3D27BD1B52C06BD26D895CE028C0	8
3151	109+000	-12.438224	-72.433663	0101000020E61000000E9F7422C11B52C005A568E55EE028C0	8
3152	110+000	-12.438387	-72.433877	0101000020E6100000245F09A4C41B52C0ADFBC74274E028C0	8
3153	111+000	-12.438527	-72.434247	0101000020E6100000B6D8EDB3CA1B52C074D3669C86E028C0	8
3154	112+000	-12.438923	-72.434666	0101000020E6100000B9AB5791D11B52C0A7ECF483BAE028C0	8
3155	113+000	-12.439292	-72.43503	0101000020E6100000D9B11188D71B52C0F3C98AE1EAE028C0	8
3156	114+000	-12.439381	-72.435382	0101000020E610000018D1764CDD1B52C0B1F7E28BF6E028C0	8
3157	115+000	-12.43957	-72.435564	0101000020E610000028D4D347E01B52C0FE9AAC510FE128C0	8
3158	116+000	-12.439845	-72.435708	0101000020E6100000C2A6CEA3E21B52C0459E245D33E128C0	8
3159	117+000	-12.439885	-72.435761	0101000020E6100000D3F71A82E31B52C07E00529B38E128C0	8
3160	118+000	-12.439765	-72.43591	0101000020E6100000F67F0EF3E51B52C0D3D9C9E028E128C0	8
3161	119+000	-12.439656	-72.436028	0101000020E6100000FA08FCE1E71B52C0F8FA5A971AE128C0	8
3162	120+000	-12.43967	-72.436224	0101000020E6100000BD6E1118EB1B52C08C101E6D1CE128C0	8
3163	121+000	-12.439705	-72.436641	0101000020E6100000EFC517EDF11B52C07EC6850321E128C0	8
3164	122+000	-12.43969	-72.437022	0101000020E61000007B681F2BF81B52C0A9C1340C1FE128C0	8
3165	123+000	-12.439576	-72.437439	0101000020E6100000ADBF2500FF1B52C08736001B10E128C0	8
3166	124+000	-12.43951	-72.437556	0101000020E6100000CA8AE1EA001C52C0A987687407E128C0	8
3167	125+000	-12.439461	-72.437671	0101000020E610000016DA39CD021C52C023BC3D0801E128C0	8
3168	126+000	-12.43941	-72.437888	0101000020E6100000E5D3635B061C52C01B12F758FAE028C0	8
3169	127+000	-12.43933	-72.438079	0101000020E61000001F84807C091C52C0A94D9CDCEFE028C0	8
3170	128+000	-12.439215	-72.438293	0101000020E6100000354415FE0C1C52C046D3D9C9E0E028C0	8
3171	129+000	-12.439158	-72.438545	0101000020E6100000C2340C1F111C52C0B58D3F51D9E028C0	8
3172	130+000	-12.439072	-72.438689	0101000020E61000005B07077B131C52C0BA2D910BCEE028C0	8
3173	131+000	-12.438894	-72.438809	0101000020E6100000310C5872151C52C03DD2E0B6B6E028C0	8
3174	132+000	-12.438779	-72.439047	0101000020E61000000B9A9658191C52C0DA571EA4A7E028C0	8
3175	133+000	-12.438662	-72.43917	0101000020E610000099D87C5C1B1C52C0F4FE3F4E98E028C0	8
3176	134+000	-12.438556	-72.439185	0101000020E610000033F9669B1B1C52C0DDED7A698AE028C0	8
3177	135+000	-12.438413	-72.439223	0101000020E6100000AA29C93A1C1C52C0524832AB77E028C0	8
3178	136+000	-12.438023	-72.439458	0101000020E6100000CC7D7214201C52C0A7CAF78C44E028C0	8
3179	137+000	-12.437688	-72.439666	0101000020E610000071CADC7C231C52C00BB43BA418E028C0	8
3180	138+000	-12.43749	-72.439692	0101000020E61000000514EAE9231C52C072A774B0FEDF28C0	8
3181	139+000	-12.43731	-72.439648	0101000020E61000001E705D31231C52C0726DA818E7DF28C0	8
3182	140+000	-12.436969	-72.439522	0101000020E6100000D7F7E120211C52C04DBB9866BADF28C0	8
3183	141+000	-12.436682	-72.439425	0101000020E6100000DE02098A1F1C52C0F58079C894DF28C0	8
3184	142+000	-12.43641	-72.439328	0101000020E6100000E50D30F31D1C52C0734BAB2171DF28C0	8
3185	143+000	-12.436247	-72.439311	0101000020E61000007A71E2AB1D1C52C0CBF44BC45BDF28C0	8
3186	144+000	-12.43606	-72.439366	0101000020E61000005C3E92921E1C52C001309E4143DF28C0	8
3187	145+000	-12.435923	-72.439493	0101000020E61000008A743FA7201C52C0FF25A94C31DF28C0	8
3188	146+000	-12.435682	-72.439551	0101000020E6100000247B849A211C52C068E90AB611DF28C0	8
3189	147+000	-12.435444	-72.439698	0101000020E610000077871403241C52C0967A1684F2DE28C0	8
3190	148+000	-12.435058	-72.440036	0101000020E61000000344C18C291C52C0F1B913ECBFDE28C0	8
3191	149+000	-12.4349	-72.44032	0101000020E610000095F1EF332E1C52C0910F7A36ABDE28C0	8
3192	150+000	-12.434711	-72.440452	0101000020E61000004CDD955D301C52C0446CB07092DE28C0	8
3193	151+000	-12.434565	-72.440452	0101000020E61000004CDD955D301C52C0F4F8BD4D7FDE28C0	8
3194	152+000	-12.434465	-72.440558	0101000020E61000006F7F2E1A321C52C066834C3272DE28C0	8
3195	153+000	-12.434356	-72.44076	0101000020E6100000A3586E69351C52C08BA4DDE863DE28C0	8
3196	154+000	-12.434256	-72.441056	0101000020E610000018EDF1423A1C52C0FD2E6CCD56DE28C0	8
3197	155+000	-12.434236	-72.441312	0101000020E610000045D5AF743E1C52C0E17D552E54DE28C0	8
3198	156+000	-12.434204	-72.441681	0101000020E6100000EF906280441C52C0B39597FC4FDE28C0	8
3199	157+000	-12.434066	-72.44189	0101000020E61000007C9BFEEC471C52C06F9C14E63DDE28C0	8
3200	158+000	-12.433829	-72.442294	0101000020E6100000E44D7E8B4E1C52C0DE1CAED51EDE28C0	8
3201	159+000	-12.433548	-72.442585	0101000020E6100000CF2C0950531C52C00F7EE200FADD28C0	8
3202	160+000	-12.433382	-72.442784	0101000020E61000004BCCB392561C52C0A359D93EE4DD28C0	8
3203	161+000	-12.433408	-72.443043	0101000020E610000031EE06D15A1C52C048A643A7E7DD28C0	8
3204	162+000	-12.43339	-72.443533	0101000020E6100000986C3CD8621C52C0AED3484BE5DD28C0	8
3205	163+000	-12.433594	-72.443987	0101000020E6100000593673486A1C52C0D07B630800DE28C0	8
3206	164+000	-12.433617	-72.444272	0101000020E6100000D3A1D3F36E1C52C0B1FA230C03DE28C0	8
3207	165+000	-12.433637	-72.444562	0101000020E6100000D7C22CB4731C52C0CDAB3AAB05DE28C0	8
3208	166+000	-12.433786	-72.444706	0101000020E610000070952710761C52C0E1ECD63219DE28C0	8
3209	167+000	-12.4339	-72.444806	0101000020E610000022C495B3771C52C003780B2428DE28C0	8
3210	168+000	-12.43392	-72.444873	0101000020E6100000E6779ACC781C52C0202922C32ADE28C0	8
3211	169+000	-12.433894	-72.444947	0101000020E6100000035DFB027A1C52C07BDCB75A27DE28C0	8
3212	170+000	-12.433814	-72.444958	0101000020E6100000FD851E317A1C52C009185DDE1CDE28C0	8
3213	171+000	-12.433657	-72.444891	0101000020E610000039D21918791C52C0EA5C514A08DE28C0	8
3214	172+000	-12.433465	-72.444815	0101000020E61000004C7155D9771C52C0D9EBDD1FEFDD28C0	8
3215	173+000	-12.433347	-72.444759	0101000020E610000082E673EE761C52C0B1A371A8DFDD28C0	8
3216	174+000	-12.433264	-72.444621	0101000020E61000005987A3AB741C52C07B116DC7D4DD28C0	8
3217	175+000	-12.433181	-72.444577	0101000020E610000071E316F3731C52C0457F68E6C9DD28C0	8
3218	176+000	-12.43311	-72.444609	0101000020E610000077A04E79741C52C020240B98C0DD28C0	8
3219	177+000	-12.43309	-72.444709	0101000020E610000029CFBC1C761C52C00473F4F8BDDD28C0	8
3220	178+000	-12.433175	-72.44487	0101000020E61000002D3E05C0781C52C0BDE3141DC9DD28C0	8
3221	179+000	-12.433376	-72.445032	0101000020E61000001A6B7F677B1C52C01BBE8575E3DD28C0	8
3222	180+000	-12.433611	-72.445346	0101000020E6100000E259828C801C52C0295FD04202DE28C0	8
3223	181+000	-12.434009	-72.445842	0101000020E6100000BA4BE2AC881C52C0DE567A6D36DE28C0	8
3224	182+000	-12.43437	-72.446076	0101000020E6100000F4E159828C1C52C01FBAA0BE65DE28C0	8
3225	183+000	-12.434622	-72.446326	0101000020E6100000B056ED9A901C52C0853E58C686DE28C0	8
3226	184+000	-12.434722	-72.446367	0101000020E6100000DFC0E446911C52C014B4C9E193DE28C0	8
3227	185+000	-12.434852	-72.446349	0101000020E61000008C6665FB901C52C04C33DDEBA4DE28C0	8
3228	186+000	-12.435138	-72.44629	0101000020E61000000AA2EE03901C52C0637E6E68CADE28C0	8
3229	187+000	-12.435476	-72.446226	0101000020E6100000FE277FF78E1C52C0C362D4B5F6DE28C0	8
3230	188+000	-12.435725	-72.446211	0101000020E6100000640795B88E1C52C06519E25817DF28C0	8
3231	189+000	-12.435816	-72.44626	0101000020E6100000D4601A868F1C52C0A725564623DF28C0	8
3232	190+000	-12.435884	-72.446481	0101000020E610000044520B25931C52C007B309302CDF28C0	8
3233	191+000	-12.435838	-72.446575	0101000020E6100000840D4FAF941C52C046B5882826DF28C0	8
3234	192+000	-12.43577	-72.446657	0101000020E6100000E3E13D07961C52C0E527D53E1DDF28C0	8
3235	193+000	-12.435605	-72.446682	0101000020E61000008F6D1970961C52C0BBF2599E07DF28C0	8
3236	194+000	-12.435425	-72.446753	0101000020E6100000F418E599971C52C0BBB88D06F0DE28C0	8
3237	195+000	-12.435349	-72.446911	0101000020E6100000404E98309A1C52C04FB16A10E6DE28C0	8
3238	196+000	-12.435362	-72.447061	0101000020E61000004B94BDA59C1C52C0A1D79FC4E7DE28C0	8
3239	197+000	-12.435418	-72.447274	0101000020E610000078962023A01C52C0F12DAC1BEFDE28C0	8
3240	198+000	-12.435508	-72.447526	0101000020E610000005871744A41C52C0F14A92E7FADE28C0	8
3241	199+000	-12.435625	-72.44779	0101000020E6100000745E6397A81C52C0D7A3703D0ADF28C0	8
3242	200+000	-12.435681	-72.448033	0101000020E6100000D7A19A92AC1C52C027FA7C9411DF28C0	8
3243	201+000	-12.435839	-72.448303	0101000020E6100000B7EC10FFB01C52C087A4164A26DF28C0	8
3244	202+000	-12.435899	-72.448466	0101000020E61000008CD7BCAAB31C52C0DCB75A272EDF28C0	8
3245	203+000	-12.43591	-72.448776	0101000020E6100000B3CEF8BEB81C52C0ACFF73982FDF28C0	8
3246	204+000	-12.435973	-72.448937	0101000020E6100000B83D4162BB1C52C0C6E061DA37DF28C0	8
3247	205+000	-12.436094	-72.449156	0101000020E610000057B3CEF8BE1C52C0B2F677B647DF28C0	8
3248	206+000	-12.436214	-72.449314	0101000020E6100000A3E8818FC11C52C05C1D007157DF28C0	8
3249	207+000	-12.436387	-72.449467	0101000020E610000066683C11C41C52C092CCEA1D6EDF28C0	8
3250	208+000	-12.436475	-72.449591	0101000020E6100000DC645419C61C52C00F0BB5A679DF28C0	8
3251	209+000	-12.436565	-72.449821	0101000020E6100000750305DEC91C52C00F289B7285DF28C0	8
3252	210+000	-12.436606	-72.449904	0101000020E6100000BC95253ACB1C52C0897956D28ADF28C0	8
3253	211+000	-12.436569	-72.450068	0101000020E6100000793E03EACD1C52C015E5D2F885DF28C0	8
3254	212+000	-12.436476	-72.450253	0101000020E6100000427BF5F1D01C52C051FA42C879DF28C0	8
3255	213+000	-12.436459	-72.450505	0101000020E6100000CF6BEC12D51C52C0F816D68D77DF28C0	8
3256	214+000	-12.436433	-72.450832	0101000020E610000061FF756EDA1C52C053CA6B2574DF28C0	8
3257	215+000	-12.43635	-72.450954	0101000020E610000006802A6EDC1C52C01D38674469DF28C0	8
3258	216+000	-12.43625	-72.451096	0101000020E6100000D0D6C1C1DE1C52C08FC2F5285CDF28C0	8
3259	217+000	-12.43616	-72.451278	0101000020E6100000E0D91EBDE11C52C08FA50F5D50DF28C0	8
3260	218+000	-12.436016	-72.451462	0101000020E6100000C158DFC0E41C52C0C310397D3DDF28C0	8
3261	219+000	-12.435985	-72.451626	0101000020E61000007E01BD70E71C52C0D717096D39DF28C0	8
3262	220+000	-12.435914	-72.451751	0101000020E6100000DCBB067DE91C52C0B2BCAB1E30DF28C0	8
3263	221+000	-12.43592	-72.451915	0101000020E61000009964E42CEC1C52C03A58FFE730DF28C0	8
3264	222+000	-12.435969	-72.452068	0101000020E61000005CE49EAEEE1C52C0C0232A5437DF28C0	8
3265	223+000	-12.43595	-72.452197	0101000020E61000005B96AFCBF01C52C0E561A1D634DF28C0	8
3266	224+000	-12.435916	-72.452327	0101000020E61000004206F2ECF21C52C0359BC76130DF28C0	8
3267	225+000	-12.435903	-72.452518	0101000020E61000007CB60E0EF61C52C0E27492AD2EDF28C0	8
3268	226+000	-12.435964	-72.452607	0101000020E610000034BC5983F71C52C0797764AC36DF28C0	8
3269	227+000	-12.436118	-72.452694	0101000020E61000001B4641F0F81C52C0D464C6DB4ADF28C0	8
3270	228+000	-12.436256	-72.45281	0101000020E61000005053CBD6FA1C52C0185E49F25CDF28C0	8
3271	229+000	-12.436404	-72.453008	0101000020E6100000E3344415FE1C52C0EAAF575870DF28C0	8
3272	230+000	-12.436525	-72.453115	0101000020E6100000EE940ED6FF1C52C0D6C56D3480DF28C0	8
3273	231+000	-12.436586	-72.453217	0101000020E6100000703FE081011D52C06DC83F3388DF28C0	8
3274	232+000	-12.436566	-72.45331	0101000020E6100000C93CF207031D52C05017299485DF28C0	8
3275	233+000	-12.436531	-72.453344	0101000020E61000009F758D96031D52C05F61C1FD80DF28C0	8
3276	234+000	-12.436467	-72.453404	0101000020E61000000AF83592041D52C00491459A78DF28C0	8
3277	235+000	-12.436284	-72.453466	0101000020E610000045F64196051D52C04089CF9D60DF28C0	8
3278	236+000	-12.436201	-72.453555	0101000020E6100000FCFB8C0B071D52C00AF7CABC55DF28C0	8
3279	237+000	-12.436179	-72.453663	0101000020E6100000F01989D0081D52C06A6798DA52DF28C0	8
3280	238+000	-12.436191	-72.453817	0101000020E61000009B5775560B1D52C07C9E3F6D54DF28C0	8
3281	239+000	-12.436228	-72.454153	0101000020E61000005798BED7101D52C0F032C34659DF28C0	8
3282	240+000	-12.436305	-72.454397	0101000020E6100000A29927D7141D52C09E29745E63DF28C0	8
3283	241+000	-12.436359	-72.454611	0101000020E6100000B859BC58181D52C06AA164726ADF28C0	8
3284	242+000	-12.436363	-72.454799	0101000020E610000039D0436D1B1D52C0705E9CF86ADF28C0	8
3285	243+000	-12.436382	-72.455164	0101000020E610000042942F68211D52C04B2025766DDF28C0	8
3286	244+000	-12.43636	-72.455557	0101000020E6100000B01D8CD8271D52C0AC90F2936ADF28C0	8
3287	245+000	-12.436351	-72.455781	0101000020E6100000D84812842B1D52C05F27F56569DF28C0	8
3288	0+000	-12.436351	-72.455781	0101000020E6100000D84812842B1D52C05F27F56569DF28C0	9
3289	1+000	-12.436338	-72.455848	0101000020E61000009CFC169D2C1D52C00C01C0B167DF28C0	9
3290	2+000	-12.436224	-72.455923	0101000020E6100000A19FA9D72D1D52C0EA758BC058DF28C0	9
3291	3+000	-12.436068	-72.455932	0101000020E6100000CB4C69FD2D1D52C00DAA0D4E44DF28C0	9
3292	4+000	-12.435986	-72.456091	0101000020E6100000FF3F4E98301D52C01807978E39DF28C0	9
3293	5+000	-12.435888	-72.456494	0101000020E61000007F349C32371D52C00D7041B62CDF28C0	9
3294	6+000	-12.435798	-72.456821	0101000020E610000011C8258E3C1D52C00D535BEA20DF28C0	9
3295	7+000	-12.435593	-72.457165	0101000020E61000000EF8FC30421D52C0AABBB20B06DF28C0	9
3296	8+000	-12.435413	-72.457349	0101000020E6100000EE76BD34451D52C0AA81E673EEDE28C0	9
3297	9+000	-12.43511	-72.457676	0101000020E6100000810A47904A1D52C03B53E8BCC6DE28C0	9
3298	10+000	-12.434741	-72.458054	0101000020E61000005473B9C1501D52C0EF75525F96DE28C0	9
3299	11+000	-12.434528	-72.458448	0101000020E6100000AABA4736571D52C080643A747ADE28C0	9
3300	12+000	-12.434274	-72.458624	0101000020E6100000494A7A185A1D52C09701672959DE28C0	9
3301	13+000	-12.43393	-72.4588	0101000020E6100000E8D9ACFA5C1D52C0AE81AD122CDE28C0	9
3302	14+000	-12.433668	-72.459111	0101000020E6100000F78E1A13621D52C0BAA46ABB09DE28C0	9
3303	15+000	-12.433496	-72.459497	0101000020E61000000CE71A66681D52C0C5E40D30F3DD28C0	9
3304	16+000	-12.433512	-72.459732	0101000020E61000002E3BC43F6C1D52C0DCD8EC48F5DD28C0	9
3305	17+000	-12.433561	-72.460034	0101000020E610000013437232711D52C061A417B5FBDD28C0	9
3306	18+000	-12.433545	-72.460696	0101000020E61000007959130B7C1D52C04BB0389CF9DD28C0	9
3307	19+000	-12.43347	-72.461194	0101000020E610000022C7D633841D52C02098A3C7EFDD28C0	9
3308	20+000	-12.433399	-72.461562	0101000020E6100000E3C4573B8A1D52C0FB3C4679E6DD28C0	9
3309	21+000	-12.433252	-72.462387	0101000020E61000001EC6A4BF971D52C06ADAC534D3DD28C0	9
3310	22+000	-12.433164	-72.463069	0101000020E6100000A7B228ECA21D52C0ED9BFBABC7DD28C0	9
3311	23+000	-12.433174	-72.463282	0101000020E6100000D5B48B69A61D52C07BF486FBC8DD28C0	9
3312	24+000	-12.4332	-72.463379	0101000020E6100000CEA96400A81D52C02041F163CCDD28C0	9
3313	25+000	-12.433271	-72.463413	0101000020E6100000A4E2FF8EA81D52C0459C4EB2D5DD28C0	9
3314	26+000	-12.433379	-72.463426	0101000020E61000006E8786C5A81D52C0DF8B2FDAE3DD28C0	9
3315	27+000	-12.433539	-72.463416	0101000020E61000005C1C959BA81D52C0C214E5D2F8DD28C0	9
3316	28+000	-12.433653	-72.463439	0101000020E6100000382C0DFCA81D52C0E49F19C407DE28C0	9
3317	29+000	-12.433702	-72.46352	0101000020E6100000AF42CA4FAA1D52C06A6B44300EDE28C0	9
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

COPY public.tipo_ensayo (id, codigo, descripcion, created_at, results_config) FROM stdin;
1	1	Análisis Granulométrico	2025-09-22 15:49:04.385694	{"groups": [{"title": "Resultados Granulométricos", "fields": [{"name": "porcGrava", "label": "Grava (%)", "digits": 2}, {"name": "porcArena", "label": "Arena (%)", "digits": 2}, {"name": "porcFinos", "label": "Finos (%)", "digits": 2}]}, {"title": "Coeficientes", "fields": [{"name": "coefUniformidad", "label": "Coef. Uniformidad (Cu)", "digits": 2}, {"name": "coefCurvatura", "label": "Coef. Curvatura (Cc)", "digits": 2}]}]}
2	2	Límites de Consistencia	2025-09-22 15:49:04.385694	{"groups": [{"title": "Límites de Atterberg", "fields": [{"name": "limiteLiquido", "label": "Límite Líquido (LL)", "digits": 2}, {"name": "limitePlastico", "label": "Límite Plástico (LP)", "digits": 2}, {"name": "indicePlasticidad", "label": "Índice de Plasticidad (IP)", "digits": 2}]}]}
\.


--
-- Data for Name: tipo_via; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipo_via (id, descripcion, created_at, codigo) FROM stdin;
100	TIPO I - Autopistas (100m)	2025-08-29 16:56:17.150805	TIPO-01
250	Tipo II - Vias principales (250m)	2025-08-29 16:56:17.150805	TIPO-02
500	Tipo III - Vias secundarias (500m)	2025-08-29 16:56:17.150805	TIPO-03
1000	Tipo IV Vias locales (1000m)	2025-08-29 16:56:17.150805	TIPO-04
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
72	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/reportconteo/E-01_1755529921403.xlsx	Excel Conteo Vehicular	2025-08-18	2025-08-18 15:12:03.04631+00	2025-08-18 15:12:03.04631+00	conteo_vehicular_excel
73	E-01	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/reportconteo/E-01_1755530252822.xlsx	Excel Conteo Vehicular	2025-08-18	2025-08-18 15:17:34.228325+00	2025-08-18 15:17:34.228325+00	conteo_vehicular_excel
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
26	31	7	lectura
27	31	9	lectura
\.


--
-- Data for Name: usuariost; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuariost (id, tramo, dni, usuario, password, nombre, ap_paterno, ap_materno, correo, mail_cu_104, fecha_ingreso, codigo_esp, nivel, subnivel, tipo_user, rol_id, creado_en, fecha_nacimiento, telefono, profesion, otros_detalles) FROM stdin;
1	CU - 104	72538918	72538918	M72538918	EDSON FERNANDO	MEZA	DUMAN	fernando.duman1993@gmail.com	bim.coordinador.cu104@gmail.com	2025-07-01	\N	1	1	COORDINADOR PROYECTO	1	2025-07-03 21:24:16.668899	\N	\N	\N	\N
2	CU - 104	70352379	70352379	L70352379	ERIK ARTURO	LUPA	SALAMANCA	erikghot.l@gmail.com	bim.esp.SCP.CU104@gmail.com	2025-07-01	6	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899	\N	\N	\N	\N
3	CU - 104	48233606	48233606	R48233606	WILSON	ROMERO	SARA	922025578wls@gmail.com	bim.bim.cu104@gmail.com	2025-07-01	7	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899	\N	\N	\N	\N
4	CU - 104	46575702	46575702	M46575702	LAURA	MONTOYA	BACA	montoyalorentebacalaura@gmail.com	bim.es.p.GEO.CU104@gmail.com	2025-07-01	2	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899	\N	\N	\N	\N
5	CU - 104	70513458	70513458	F70513458	OSCAR JESUS	FERRER	PONCE	ferreroscar@gmail.com	bim.es.est.cu104@gmail.com	2025-07-01	10	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899	\N	\N	\N	\N
6	CU - 104	45297177	45297177	C45297177	EDDY ANGEL	CAHUANA	CCASA	eddyangel1@gmail.com	bimes.p.TGDG.CU104@gmail.com	2025-07-01	1	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899	\N	\N	\N	\N
7	CU - 104	47021326	47021326	C47021326	PRISCILLA	CONTRERAS	HUAMANÑAHUI	pbcontrerasgh@gmail.com	bimes.p.TRF.CU104@gmail.com	2025-07-01	4	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899	\N	\N	\N	\N
8	CU - 104	70042864	70042864	C70042864	ADRIEL BRANDY	CUIRO	SORIA	adriel12cs@gmail.com	bimes.p.AMB.CU104@gmail.com	2025-07-01	14	2	2	ESPECIALISTA	2	2025-07-03 21:24:16.668899	\N	\N	\N	\N
9	CU - 104	47424831	47424831	S47424831	ELVIO INOCENCIO	SAIRE	QUIÑONEZ	elvio.saire@gmail.com	bimat.HH.CU104@gmail.com	2025-07-01	1	2	2	ASISTENTE	3	2025-07-03 21:24:16.668899	\N	\N	\N	\N
10	CU - 104	62844614	62844614	T62844614	BETSI KATIUSCA	TUMPAY	HUAMAN	betsitumpayhuaman@gmail.com	bimaa1.CU104@gmail.com	2025-07-01	17	2	3	ASISTENTE	3	2025-07-03 21:24:16.668899	\N	\N	\N	\N
11	CU - 104	72746480	72746480	Q72746480	NIRELY	QUISPE	CUEVA		bimaa2.CU104@gmail.com	2025-07-01	17	2	3	ASISTENTE	3	2025-07-03 21:24:16.668899	\N	\N	\N	\N
12	CU - 104	77798514	77798514	M77798514	DERIANS MARTIN	MORA	HUAÑEC	mora.huane@gmail.com	bimat.trf.cu104@gmail.com	2025-07-01	1	2	3	ASISTENTE	3	2025-07-03 21:24:16.668899	\N	\N	\N	\N
13	CU - 104	47035773	47035773	T47035773	ADA MICOL	TEMPLE	VILLENA	admtv16@gmail.com	bimat.est.cu104@gmail.com	2025-07-01	1	2	3	ASISTENTE	3	2025-07-03 21:24:16.668899	\N	\N	\N	\N
14	SISTEMA	00000000	admin	admin	Admin	Admin	System	admin@dominio.com	admin@dominio.com	2025-07-01	\N	0	0	ADMIN	7	2025-07-03 21:27:01.888219	\N	\N	\N	\N
26	SISTEMA	00000001	sadmin	sadmin	Admin	Admin	System	admin@dominio.com	admin@dominio.com	2025-07-01	\N	0	0	ADMIN	7	2025-07-05 16:50:22.586661	\N	\N	\N	\N
31	CU-104	12345678	prueba	prueba	prueba	prueba	prueba	asdasd@xd.xd	aaaa@xd	2025-08-05	15	3	3	VISITANTE	8	2025-07-18 20:14:41.046755	\N	\N	\N	\N
44	\N	12312312	12312312	123123	chescop	chescop	chescop	chesc@gmail.com	chescss@gmail.com	2025-09-24	14	\N	\N	\N	4	2025-09-10 14:43:34.014668	2005-06-22	959545678	as	aaaa
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: repmgr; Owner: postgres
--

COPY repmgr.events (node_id, event, successful, event_timestamp, details) FROM stdin;
\.


--
-- Data for Name: monitoring_history; Type: TABLE DATA; Schema: repmgr; Owner: postgres
--

COPY repmgr.monitoring_history (primary_node_id, standby_node_id, last_monitor_time, last_apply_time, last_wal_primary_location, last_wal_standby_location, replication_lag, apply_lag) FROM stdin;
\.


--
-- Data for Name: nodes; Type: TABLE DATA; Schema: repmgr; Owner: postgres
--

COPY repmgr.nodes (node_id, upstream_node_id, active, node_name, type, location, priority, conninfo, repluser, slot_name, config_file) FROM stdin;
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

SELECT pg_catalog.setval('public.anuncios_id_seq', 61, true);


--
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 2902, true);


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

SELECT pg_catalog.setval('public.ensayos_id_seq', 4, true);


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

SELECT pg_catalog.setval('public.estratos_codigo_seq', 9, true);


--
-- Name: estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_id_seq', 9, true);


--
-- Name: experiencia_academica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.experiencia_academica_id_seq', 3, true);


--
-- Name: experiencia_laboral_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.experiencia_laboral_id_seq', 1, true);


--
-- Name: formulario_campos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.formulario_campos_id_seq', 3, true);


--
-- Name: formulario_secciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.formulario_secciones_id_seq', 8, true);


--
-- Name: formulario_tamices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.formulario_tamices_id_seq', 1, false);


--
-- Name: granulometria_ensayos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.granulometria_ensayos_id_seq', 1, false);


--
-- Name: limite_liquido_ensayos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.limite_liquido_ensayos_id_seq', 1, false);


--
-- Name: limite_plastico_ensayos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.limite_plastico_ensayos_id_seq', 1, false);


--
-- Name: navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.navbar_options_id_seq', 23, true);


--
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permisos_id_seq', 9, true);


--
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresiva_perfil_estratos_id_seq', 164, true);


--
-- Name: progresivas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresivas_id_seq', 176, true);


--
-- Name: provincias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provincias_id_seq', 1, false);


--
-- Name: proyecto_historial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.proyecto_historial_id_seq', 10, true);


--
-- Name: proyecto_usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.proyecto_usuarios_id_seq', 7, true);


--
-- Name: proyectos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyectos_id_seq', 26, true);


--
-- Name: puntos_mapa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.puntos_mapa_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_navbar_options_id_seq', 436, true);


--
-- Name: roles_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_permisos_id_seq', 59, true);


--
-- Name: ruta_kml_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('public.ruta_kml_id_seq', 3317, true);


--
-- Name: rutas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rutas_id_seq', 1, true);


--
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_ensayo_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.trafico_imagenes_id_seq', 75, true);


--
-- Name: tusuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tusuarios_id_seq', 5, true);


--
-- Name: user_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permisos_id_seq', 27, true);


--
-- Name: usuariost_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuariost_id_seq', 44, true);


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
-- Name: experiencia_academica experiencia_academica_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.experiencia_academica
    ADD CONSTRAINT experiencia_academica_pkey PRIMARY KEY (id);


--
-- Name: experiencia_laboral experiencia_laboral_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.experiencia_laboral
    ADD CONSTRAINT experiencia_laboral_pkey PRIMARY KEY (id);


--
-- Name: formulario_campos formulario_campos_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_campos
    ADD CONSTRAINT formulario_campos_pkey PRIMARY KEY (id);


--
-- Name: formulario_secciones formulario_secciones_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_secciones
    ADD CONSTRAINT formulario_secciones_pkey PRIMARY KEY (id);


--
-- Name: formulario_tamices formulario_tamices_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_tamices
    ADD CONSTRAINT formulario_tamices_pkey PRIMARY KEY (id);


--
-- Name: granulometria_ensayos granulometria_ensayos_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.granulometria_ensayos
    ADD CONSTRAINT granulometria_ensayos_pkey PRIMARY KEY (id);


--
-- Name: limite_liquido_ensayos limite_liquido_ensayos_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.limite_liquido_ensayos
    ADD CONSTRAINT limite_liquido_ensayos_pkey PRIMARY KEY (id);


--
-- Name: limite_plastico_ensayos limite_plastico_ensayos_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.limite_plastico_ensayos
    ADD CONSTRAINT limite_plastico_ensayos_pkey PRIMARY KEY (id);


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
-- Name: proyecto_historial proyecto_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_historial
    ADD CONSTRAINT proyecto_historial_pkey PRIMARY KEY (id);


--
-- Name: proyecto_usuarios proyecto_usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_usuarios
    ADD CONSTRAINT proyecto_usuarios_pkey PRIMARY KEY (id);


--
-- Name: proyecto_usuarios proyecto_usuarios_proyecto_id_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_usuarios
    ADD CONSTRAINT proyecto_usuarios_proyecto_id_usuario_id_key UNIQUE (proyecto_id, usuario_id);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- Name: puntos_mapa puntos_mapa_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.puntos_mapa
    ADD CONSTRAINT puntos_mapa_pkey PRIMARY KEY (id);


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
-- Name: ruta_kml ruta_kml_pkey; Type: CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.ruta_kml
    ADD CONSTRAINT ruta_kml_pkey PRIMARY KEY (id);


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
-- Name: anuncios anuncios_creador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_creador_id_fkey FOREIGN KEY (creador_id) REFERENCES public.usuariost(id);


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
-- Name: experiencia_academica experiencia_academica_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.experiencia_academica
    ADD CONSTRAINT experiencia_academica_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id) ON DELETE CASCADE;


--
-- Name: experiencia_laboral experiencia_laboral_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.experiencia_laboral
    ADD CONSTRAINT experiencia_laboral_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id) ON DELETE CASCADE;


--
-- Name: ensayos fk_ensayos_perfil_estratos; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT fk_ensayos_perfil_estratos FOREIGN KEY (estrato_id) REFERENCES public.progresiva_perfil_estratos(id) ON DELETE SET NULL;


--
-- Name: ensayos fk_ensayos_responsable; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT fk_ensayos_responsable FOREIGN KEY (responsable_id) REFERENCES public.usuariost(id);


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
-- Name: formulario_campos fk_seccion; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_campos
    ADD CONSTRAINT fk_seccion FOREIGN KEY (seccion_id) REFERENCES public.formulario_secciones(id) ON DELETE CASCADE;


--
-- Name: formulario_tamices fk_seccion_tamices; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_tamices
    ADD CONSTRAINT fk_seccion_tamices FOREIGN KEY (seccion_id) REFERENCES public.formulario_secciones(id) ON DELETE CASCADE;


--
-- Name: trafico_imagenes fk_station; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES public.elementos_trafico(id) ON DELETE CASCADE;


--
-- Name: formulario_secciones fk_tipo_ensayo; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.formulario_secciones
    ADD CONSTRAINT fk_tipo_ensayo FOREIGN KEY (tipo_ensayo_id) REFERENCES public.tipo_ensayo(id) ON DELETE CASCADE;


--
-- Name: ensayos fk_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT fk_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- Name: granulometria_ensayos granulometria_ensayos_ensayo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.granulometria_ensayos
    ADD CONSTRAINT granulometria_ensayos_ensayo_id_fkey FOREIGN KEY (ensayo_id) REFERENCES public.ensayos(id) ON DELETE CASCADE;


--
-- Name: limite_liquido_ensayos limite_liquido_ensayos_ensayo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.limite_liquido_ensayos
    ADD CONSTRAINT limite_liquido_ensayos_ensayo_id_fkey FOREIGN KEY (ensayo_id) REFERENCES public.ensayos(id) ON DELETE CASCADE;


--
-- Name: limite_plastico_ensayos limite_plastico_ensayos_ensayo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.limite_plastico_ensayos
    ADD CONSTRAINT limite_plastico_ensayos_ensayo_id_fkey FOREIGN KEY (ensayo_id) REFERENCES public.ensayos(id) ON DELETE CASCADE;


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
-- Name: proyecto_historial proyecto_historial_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_historial
    ADD CONSTRAINT proyecto_historial_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.usuariost(id) ON DELETE RESTRICT;


--
-- Name: proyecto_historial proyecto_historial_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_historial
    ADD CONSTRAINT proyecto_historial_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON DELETE CASCADE;


--
-- Name: proyecto_usuarios proyecto_usuarios_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_usuarios
    ADD CONSTRAINT proyecto_usuarios_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON DELETE CASCADE;


--
-- Name: proyecto_usuarios proyecto_usuarios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: backend_nameless_log_553
--

ALTER TABLE ONLY public.proyecto_usuarios
    ADD CONSTRAINT proyecto_usuarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id) ON DELETE CASCADE;


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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO backend_user;


--
-- Name: TABLE anuncios; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.anuncios TO backend_user;


--
-- Name: SEQUENCE anuncios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.anuncios_id_seq TO backend_user;


--
-- Name: TABLE auditoria; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.auditoria TO backend_user;


--
-- Name: SEQUENCE auditoria_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.auditoria_id_seq TO backend_user;


--
-- Name: TABLE changelogs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.changelogs TO backend_user;


--
-- Name: SEQUENCE changelogs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.changelogs_id_seq TO backend_user;


--
-- Name: TABLE codigo_departamentos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.codigo_departamentos TO backend_user;


--
-- Name: TABLE distritos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.distritos TO backend_user;


--
-- Name: SEQUENCE distritos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.distritos_id_seq TO backend_user;


--
-- Name: TABLE elementos_trafico; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.elementos_trafico TO backend_user;


--
-- Name: TABLE ensayos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ensayos TO backend_user;


--
-- Name: SEQUENCE ensayos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.ensayos_id_seq TO backend_user;


--
-- Name: TABLE especialidad_visibilidad; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.especialidad_visibilidad TO backend_user;


--
-- Name: SEQUENCE especialidad_visibilidad_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.especialidad_visibilidad_id_seq TO backend_user;


--
-- Name: TABLE especialidades; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.especialidades TO backend_user;


--
-- Name: SEQUENCE especialidades_codigo_esp_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.especialidades_codigo_esp_seq TO backend_user;


--
-- Name: TABLE especialidades_navbar_options; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.especialidades_navbar_options TO backend_user;


--
-- Name: SEQUENCE especialidades_navbar_options_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.especialidades_navbar_options_id_seq TO backend_user;


--
-- Name: SEQUENCE estratos_codigo_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.estratos_codigo_seq TO backend_user;


--
-- Name: TABLE estratos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.estratos TO backend_user;


--
-- Name: SEQUENCE estratos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.estratos_id_seq TO backend_user;


--
-- Name: TABLE geography_columns; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.geography_columns TO backend_user;


--
-- Name: TABLE geometry_columns; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.geometry_columns TO backend_user;


--
-- Name: TABLE granulometria_ensayos; Type: ACL; Schema: public; Owner: backend_nameless_log_553
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.granulometria_ensayos TO postgres;


--
-- Name: SEQUENCE granulometria_ensayos_id_seq; Type: ACL; Schema: public; Owner: backend_nameless_log_553
--

GRANT SELECT,USAGE ON SEQUENCE public.granulometria_ensayos_id_seq TO postgres;


--
-- Name: TABLE limite_liquido_ensayos; Type: ACL; Schema: public; Owner: backend_nameless_log_553
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.limite_liquido_ensayos TO postgres;


--
-- Name: SEQUENCE limite_liquido_ensayos_id_seq; Type: ACL; Schema: public; Owner: backend_nameless_log_553
--

GRANT SELECT,USAGE ON SEQUENCE public.limite_liquido_ensayos_id_seq TO postgres;


--
-- Name: TABLE limite_plastico_ensayos; Type: ACL; Schema: public; Owner: backend_nameless_log_553
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.limite_plastico_ensayos TO postgres;


--
-- Name: SEQUENCE limite_plastico_ensayos_id_seq; Type: ACL; Schema: public; Owner: backend_nameless_log_553
--

GRANT SELECT,USAGE ON SEQUENCE public.limite_plastico_ensayos_id_seq TO postgres;


--
-- Name: TABLE navbar_options; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.navbar_options TO backend_user;


--
-- Name: SEQUENCE navbar_options_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.navbar_options_id_seq TO backend_user;


--
-- Name: TABLE permisos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.permisos TO backend_user;


--
-- Name: SEQUENCE permisos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.permisos_id_seq TO backend_user;


--
-- Name: TABLE progresiva_perfil_estratos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.progresiva_perfil_estratos TO backend_user;


--
-- Name: SEQUENCE progresiva_perfil_estratos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.progresiva_perfil_estratos_id_seq TO backend_user;


--
-- Name: TABLE progresivas; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.progresivas TO backend_user;


--
-- Name: SEQUENCE progresivas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.progresivas_id_seq TO backend_user;


--
-- Name: TABLE provincias; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.provincias TO backend_user;


--
-- Name: SEQUENCE provincias_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.provincias_id_seq TO backend_user;


--
-- Name: TABLE proyectos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.proyectos TO backend_user;


--
-- Name: SEQUENCE proyectos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.proyectos_id_seq TO backend_user;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.roles TO backend_user;


--
-- Name: SEQUENCE roles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.roles_id_seq TO backend_user;


--
-- Name: TABLE roles_navbar_options; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.roles_navbar_options TO backend_user;


--
-- Name: SEQUENCE roles_navbar_options_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.roles_navbar_options_id_seq TO backend_user;


--
-- Name: TABLE roles_permisos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.roles_permisos TO backend_user;


--
-- Name: SEQUENCE roles_permisos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.roles_permisos_id_seq TO backend_user;


--
-- Name: TABLE rutas; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rutas TO backend_user;


--
-- Name: SEQUENCE rutas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.rutas_id_seq TO backend_user;


--
-- Name: TABLE spatial_ref_sys; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.spatial_ref_sys TO backend_user;


--
-- Name: TABLE tipo_ensayo; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tipo_ensayo TO backend_user;


--
-- Name: SEQUENCE tipo_ensayo_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tipo_ensayo_id_seq TO backend_user;


--
-- Name: TABLE tipo_via; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tipo_via TO backend_user;


--
-- Name: SEQUENCE tipo_via_codigo_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tipo_via_codigo_seq TO backend_user;


--
-- Name: SEQUENCE tipo_via_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tipo_via_id_seq TO backend_user;


--
-- Name: TABLE trafico_imagenes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.trafico_imagenes TO backend_user;


--
-- Name: SEQUENCE trafico_imagenes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.trafico_imagenes_id_seq TO backend_user;


--
-- Name: TABLE tusuarios; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tusuarios TO backend_user;


--
-- Name: SEQUENCE tusuarios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tusuarios_id_seq TO backend_user;


--
-- Name: TABLE user_permisos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_permisos TO backend_user;


--
-- Name: SEQUENCE user_permisos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_permisos_id_seq TO backend_user;


--
-- Name: TABLE usuariost; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.usuariost TO backend_user;


--
-- Name: SEQUENCE usuariost_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.usuariost_id_seq TO backend_user;


--
-- PostgreSQL database dump complete
--

\unrestrict Ov7t0x3P5Rza1Qe3hYSU0wd5ogxxMy4cri6gh7zKItDecquG42wk59oFrypuYM3

