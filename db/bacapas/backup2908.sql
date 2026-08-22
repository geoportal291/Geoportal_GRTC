--
-- PostgreSQL database dump
--

\restrict vPBDRiuaVFjz9nLtPTv7YASGzE6RjXKDnvDMxiw8d1uZeiQhCvFiDOv5uEBS5sx

-- Dumped from database version 17.2 (Ubuntu 17.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-29 09:46:58

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

-- Completed on 2025-08-29 09:47:26

--
-- PostgreSQL database dump complete
--

\unrestrict vPBDRiuaVFjz9nLtPTv7YASGzE6RjXKDnvDMxiw8d1uZeiQhCvFiDOv5uEBS5sx

--
-- Database "backend_nameless_log_553" dump
--

--
-- PostgreSQL database dump
--

\restrict tZOEsb75w5l8zkiVhG78eEtQgJwGDScbSPHWA5OXzQLIZgyOukMZm0ueKuvk2Ya

-- Dumped from database version 17.2 (Ubuntu 17.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-29 09:47:26

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
-- TOC entry 5119 (class 1262 OID 16513)
-- Name: backend_nameless_log_553; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE backend_nameless_log_553 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE backend_nameless_log_553 OWNER TO postgres;

\unrestrict tZOEsb75w5l8zkiVhG78eEtQgJwGDScbSPHWA5OXzQLIZgyOukMZm0ueKuvk2Ya
\connect backend_nameless_log_553
\restrict tZOEsb75w5l8zkiVhG78eEtQgJwGDScbSPHWA5OXzQLIZgyOukMZm0ueKuvk2Ya

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
-- TOC entry 5120 (class 0 OID 0)
-- Name: backend_nameless_log_553; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE backend_nameless_log_553 SET search_path TO '$user', 'public', 'tiger', 'topology';


\unrestrict tZOEsb75w5l8zkiVhG78eEtQgJwGDScbSPHWA5OXzQLIZgyOukMZm0ueKuvk2Ya
\connect backend_nameless_log_553
\restrict tZOEsb75w5l8zkiVhG78eEtQgJwGDScbSPHWA5OXzQLIZgyOukMZm0ueKuvk2Ya

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
-- TOC entry 9 (class 2615 OID 21764)
-- Name: public; Type: SCHEMA; Schema: -; Owner: backend_nameless_log_553
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO backend_nameless_log_553;

--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 9
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: backend_nameless_log_553
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 10 (class 2615 OID 21770)
-- Name: repmgr; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA repmgr;


ALTER SCHEMA repmgr OWNER TO postgres;

--
-- TOC entry 11 (class 2615 OID 21771)
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- TOC entry 12 (class 2615 OID 21772)
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- TOC entry 13 (class 2615 OID 21773)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 13
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 2 (class 3079 OID 21774)
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- TOC entry 3 (class 3079 OID 21786)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 4 (class 3079 OID 22866)
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- TOC entry 5 (class 3079 OID 23264)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 287 (class 1259 OID 23433)
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
-- TOC entry 288 (class 1259 OID 23439)
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
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 288
-- Name: anuncios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anuncios_id_seq OWNED BY public.anuncios.id;


--
-- TOC entry 289 (class 1259 OID 23440)
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
-- TOC entry 290 (class 1259 OID 23446)
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
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 290
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- TOC entry 291 (class 1259 OID 23447)
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
-- TOC entry 292 (class 1259 OID 23453)
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
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 292
-- Name: changelogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.changelogs_id_seq OWNED BY public.changelogs.id;


--
-- TOC entry 293 (class 1259 OID 23454)
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
-- TOC entry 294 (class 1259 OID 23459)
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
-- TOC entry 295 (class 1259 OID 23462)
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
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 295
-- Name: distritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.distritos_id_seq OWNED BY public.distritos.id;


--
-- TOC entry 296 (class 1259 OID 23463)
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
-- TOC entry 297 (class 1259 OID 23468)
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
-- TOC entry 298 (class 1259 OID 23483)
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
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 298
-- Name: ensayos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ensayos_id_seq OWNED BY public.ensayos.id;


--
-- TOC entry 299 (class 1259 OID 23484)
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
-- TOC entry 300 (class 1259 OID 23487)
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
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 300
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidad_visibilidad_id_seq OWNED BY public.especialidad_visibilidad.id;


--
-- TOC entry 301 (class 1259 OID 23488)
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
-- TOC entry 302 (class 1259 OID 23493)
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
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 302
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_codigo_esp_seq OWNED BY public.especialidades.codigo_esp;


--
-- TOC entry 303 (class 1259 OID 23494)
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
-- TOC entry 304 (class 1259 OID 23498)
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
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 304
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_navbar_options_id_seq OWNED BY public.especialidades_navbar_options.id;


--
-- TOC entry 305 (class 1259 OID 23499)
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
-- TOC entry 306 (class 1259 OID 23500)
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
-- TOC entry 307 (class 1259 OID 23508)
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
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 307
-- Name: estratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estratos_id_seq OWNED BY public.estratos.id;


--
-- TOC entry 308 (class 1259 OID 23509)
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
-- TOC entry 309 (class 1259 OID 23514)
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
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 309
-- Name: navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.navbar_options_id_seq OWNED BY public.navbar_options.id;


--
-- TOC entry 310 (class 1259 OID 23515)
-- Name: permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permisos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);


ALTER TABLE public.permisos OWNER TO postgres;

--
-- TOC entry 311 (class 1259 OID 23520)
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
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 311
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;


--
-- TOC entry 312 (class 1259 OID 23521)
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
-- TOC entry 313 (class 1259 OID 23526)
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
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 313
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresiva_perfil_estratos_id_seq OWNED BY public.progresiva_perfil_estratos.id;


--
-- TOC entry 314 (class 1259 OID 23527)
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
    CONSTRAINT progresivas_estado_check CHECK (((estado)::text = ANY (ARRAY[('activo'::character varying)::text, ('inactivo'::character varying)::text, ('completado'::character varying)::text])))
);


ALTER TABLE public.progresivas OWNER TO postgres;

--
-- TOC entry 315 (class 1259 OID 23535)
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
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 315
-- Name: progresivas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresivas_id_seq OWNED BY public.progresivas.id;


--
-- TOC entry 316 (class 1259 OID 23536)
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
-- TOC entry 317 (class 1259 OID 23539)
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
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 317
-- Name: provincias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provincias_id_seq OWNED BY public.provincias.id;


--
-- TOC entry 318 (class 1259 OID 23540)
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
-- TOC entry 319 (class 1259 OID 23547)
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
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 319
-- Name: proyectos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proyectos_id_seq OWNED BY public.proyectos.id;


--
-- TOC entry 320 (class 1259 OID 23548)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 321 (class 1259 OID 23553)
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
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 321
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 322 (class 1259 OID 23554)
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
-- TOC entry 323 (class 1259 OID 23558)
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
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 323
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_navbar_options_id_seq OWNED BY public.roles_navbar_options.id;


--
-- TOC entry 324 (class 1259 OID 23559)
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
-- TOC entry 325 (class 1259 OID 23563)
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
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 325
-- Name: roles_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_permisos_id_seq OWNED BY public.roles_permisos.id;


--
-- TOC entry 326 (class 1259 OID 23564)
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
-- TOC entry 327 (class 1259 OID 23569)
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
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 327
-- Name: rutas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rutas_id_seq OWNED BY public.rutas.id;


--
-- TOC entry 328 (class 1259 OID 23570)
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
-- TOC entry 329 (class 1259 OID 23574)
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
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 329
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_ensayo_id_seq OWNED BY public.tipo_ensayo.id;


--
-- TOC entry 330 (class 1259 OID 23575)
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
-- TOC entry 331 (class 1259 OID 23579)
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
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 331
-- Name: tipo_via_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_via_codigo_seq OWNED BY public.tipo_via.codigo;


--
-- TOC entry 332 (class 1259 OID 23580)
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
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 332
-- Name: tipo_via_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_via_id_seq OWNED BY public.tipo_via.id;


--
-- TOC entry 333 (class 1259 OID 23581)
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
-- TOC entry 334 (class 1259 OID 23589)
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
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 334
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trafico_imagenes_id_seq OWNED BY public.trafico_imagenes.id;


--
-- TOC entry 335 (class 1259 OID 23590)
-- Name: tusuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tusuarios (
    id integer NOT NULL,
    usuario character varying(50),
    password character varying(50)
);


ALTER TABLE public.tusuarios OWNER TO postgres;

--
-- TOC entry 336 (class 1259 OID 23593)
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
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 336
-- Name: tusuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tusuarios_id_seq OWNED BY public.tusuarios.id;


--
-- TOC entry 337 (class 1259 OID 23594)
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
-- TOC entry 338 (class 1259 OID 23597)
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
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 338
-- Name: user_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permisos_id_seq OWNED BY public.user_permisos.id;


--
-- TOC entry 339 (class 1259 OID 23598)
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
-- TOC entry 340 (class 1259 OID 23604)
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
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 340
-- Name: usuariost_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuariost_id_seq OWNED BY public.usuariost.id;


--
-- TOC entry 4650 (class 2604 OID 23605)
-- Name: anuncios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios ALTER COLUMN id SET DEFAULT nextval('public.anuncios_id_seq'::regclass);


--
-- TOC entry 4652 (class 2604 OID 23606)
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- TOC entry 4654 (class 2604 OID 23607)
-- Name: changelogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs ALTER COLUMN id SET DEFAULT nextval('public.changelogs_id_seq'::regclass);


--
-- TOC entry 4658 (class 2604 OID 23608)
-- Name: distritos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos ALTER COLUMN id SET DEFAULT nextval('public.distritos_id_seq'::regclass);


--
-- TOC entry 4659 (class 2604 OID 23609)
-- Name: ensayos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos ALTER COLUMN id SET DEFAULT nextval('public.ensayos_id_seq'::regclass);


--
-- TOC entry 4660 (class 2604 OID 23610)
-- Name: especialidad_visibilidad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad ALTER COLUMN id SET DEFAULT nextval('public.especialidad_visibilidad_id_seq'::regclass);


--
-- TOC entry 4661 (class 2604 OID 23611)
-- Name: especialidades codigo_esp; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades ALTER COLUMN codigo_esp SET DEFAULT nextval('public.especialidades_codigo_esp_seq'::regclass);


--
-- TOC entry 4662 (class 2604 OID 23612)
-- Name: especialidades_navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.especialidades_navbar_options_id_seq'::regclass);


--
-- TOC entry 4664 (class 2604 OID 23613)
-- Name: estratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos ALTER COLUMN id SET DEFAULT nextval('public.estratos_id_seq'::regclass);


--
-- TOC entry 4668 (class 2604 OID 23614)
-- Name: navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options ALTER COLUMN id SET DEFAULT nextval('public.navbar_options_id_seq'::regclass);


--
-- TOC entry 4669 (class 2604 OID 23615)
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);


--
-- TOC entry 4670 (class 2604 OID 23616)
-- Name: progresiva_perfil_estratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos ALTER COLUMN id SET DEFAULT nextval('public.progresiva_perfil_estratos_id_seq'::regclass);


--
-- TOC entry 4671 (class 2604 OID 23617)
-- Name: progresivas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas ALTER COLUMN id SET DEFAULT nextval('public.progresivas_id_seq'::regclass);


--
-- TOC entry 4674 (class 2604 OID 23618)
-- Name: provincias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias ALTER COLUMN id SET DEFAULT nextval('public.provincias_id_seq'::regclass);


--
-- TOC entry 4675 (class 2604 OID 23619)
-- Name: proyectos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos ALTER COLUMN id SET DEFAULT nextval('public.proyectos_id_seq'::regclass);


--
-- TOC entry 4678 (class 2604 OID 23620)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4679 (class 2604 OID 23621)
-- Name: roles_navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.roles_navbar_options_id_seq'::regclass);


--
-- TOC entry 4681 (class 2604 OID 23622)
-- Name: roles_permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos ALTER COLUMN id SET DEFAULT nextval('public.roles_permisos_id_seq'::regclass);


--
-- TOC entry 4683 (class 2604 OID 23623)
-- Name: rutas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas ALTER COLUMN id SET DEFAULT nextval('public.rutas_id_seq'::regclass);


--
-- TOC entry 4684 (class 2604 OID 23624)
-- Name: tipo_ensayo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_ensayo ALTER COLUMN id SET DEFAULT nextval('public.tipo_ensayo_id_seq'::regclass);


--
-- TOC entry 4686 (class 2604 OID 23625)
-- Name: tipo_via id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via ALTER COLUMN id SET DEFAULT nextval('public.tipo_via_id_seq'::regclass);


--
-- TOC entry 4688 (class 2604 OID 23626)
-- Name: tipo_via codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via ALTER COLUMN codigo SET DEFAULT lpad((nextval('public.tipo_via_codigo_seq'::regclass))::text, 7, '0'::text);


--
-- TOC entry 4689 (class 2604 OID 23627)
-- Name: trafico_imagenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes ALTER COLUMN id SET DEFAULT nextval('public.trafico_imagenes_id_seq'::regclass);


--
-- TOC entry 4693 (class 2604 OID 23628)
-- Name: tusuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tusuarios ALTER COLUMN id SET DEFAULT nextval('public.tusuarios_id_seq'::regclass);


--
-- TOC entry 4694 (class 2604 OID 23629)
-- Name: user_permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos ALTER COLUMN id SET DEFAULT nextval('public.user_permisos_id_seq'::regclass);


--
-- TOC entry 4695 (class 2604 OID 23630)
-- Name: usuariost id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost ALTER COLUMN id SET DEFAULT nextval('public.usuariost_id_seq'::regclass);


--
-- TOC entry 5060 (class 0 OID 23433)
-- Dependencies: 287
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
-- TOC entry 5062 (class 0 OID 23440)
-- Dependencies: 289
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, usuario_id, accion, detalles, creado_en) FROM stdin;
\.


--
-- TOC entry 5064 (class 0 OID 23447)
-- Dependencies: 291
-- Data for Name: changelogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.changelogs (id, version, title, content, release_date) FROM stdin;
1	0.1.0-alpha.1	probando	-prueba\n-prueba\n-prueba\n-prueba\n-prueba	2025-07-18 23:56:02.704914
3	0.1.0-alpha.2	PROBANDO	PROBANDO\nPROBANDO\nPROBANDO	2025-07-18 23:59:48.765531
5	0.1.0-alpha.3	Version alpha 18 de julio de 2025	Añadido\n-coordinador nuevas opciones en cofiguracion\n-#permisos ahora es capaz de controlar los permisos ya sea solo lectura\n  o lectura y edicion ya sea por usuario directo o rol.\n-#visibilidad Navbar: coordinador es capaz de quitar opciones del navbar \n  detallado sea por su rol(cargo) o especialidad.\n-ingeneria basica seccion de trafico a nivel visual (en desarrollo)\n-Mi perfil capaz de visualizar sus datos (en desarrollo)\n-dashboard de inicio en desarrollo las funciones de proyectos,ensayos y progresivas	2025-07-19 00:48:20.047564
\.


--
-- TOC entry 5066 (class 0 OID 23454)
-- Dependencies: 293
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
-- TOC entry 5067 (class 0 OID 23459)
-- Dependencies: 294
-- Data for Name: distritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.distritos (id, nombre, codigo_distrito, codigo_provincia) FROM stdin;
\.


--
-- TOC entry 5069 (class 0 OID 23463)
-- Dependencies: 296
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
-- TOC entry 5070 (class 0 OID 23468)
-- Dependencies: 297
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
-- TOC entry 5072 (class 0 OID 23484)
-- Dependencies: 299
-- Data for Name: especialidad_visibilidad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidad_visibilidad (id, codigo_esp, nivel, tipo_user) FROM stdin;
\.


--
-- TOC entry 5074 (class 0 OID 23488)
-- Dependencies: 301
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
-- TOC entry 5076 (class 0 OID 23494)
-- Dependencies: 303
-- Data for Name: especialidades_navbar_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidades_navbar_options (id, especialidad_id, navbar_option_id, visible) FROM stdin;
\.


--
-- TOC entry 5079 (class 0 OID 23500)
-- Dependencies: 306
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
-- TOC entry 5081 (class 0 OID 23509)
-- Dependencies: 308
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
-- TOC entry 5083 (class 0 OID 23515)
-- Dependencies: 310
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
-- TOC entry 5085 (class 0 OID 23521)
-- Dependencies: 312
-- Data for Name: progresiva_perfil_estratos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresiva_perfil_estratos (id, progresiva_id, estrato_id, profundidad_inicial, profundidad_final, orden, tipo_via, descripcion) FROM stdin;
\.


--
-- TOC entry 5087 (class 0 OID 23527)
-- Dependencies: 314
-- Data for Name: progresivas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresivas (id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, creado_en, actualizado_en, creado_por, proyecto_id, estrato_id, tipo_via, tipo_ensayo, batch_uuid, parent_id, coordenada_este, coordenada_norte, linea, intervalo_manual, longitud_total) FROM stdin;
\.


--
-- TOC entry 5089 (class 0 OID 23536)
-- Dependencies: 316
-- Data for Name: provincias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provincias (id, nombre, codigo_provincia, codigo_departamento) FROM stdin;
\.


--
-- TOC entry 5091 (class 0 OID 23540)
-- Dependencies: 318
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proyectos (id, codigo, nombre_proyecto, descripcion_proyecto, estado, nombre_tramo, proyecto_nom, solicitante, departamento, provincia, distrito, localidad, longitud_total, progresiva_inicial, tipo_via, intervalo_manual, descripcion_larga, create_at, update_at) FROM stdin;
1	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	85520	0+000	500	\N		2025-08-07 20:42:53.739003	2025-08-07 20:42:53.739003
14	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	14785	0+000	500	\N		2025-08-08 15:05:08.946268	2025-08-08 15:05:08.946268
15	\N	\N	\N	Activo	proyecto 22121	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	mi casa	44548	0+000	100	\N		2025-08-08 15:14:32.501231	2025-08-08 15:14:32.501231
16	\N	\N	\N	Activo	proyecto 2111122222	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0804	080405	rtyhhrtew	78954	0+000	500	\N		2025-08-14 15:45:37.268952	2025-08-14 15:45:37.268952
\.


--
-- TOC entry 5093 (class 0 OID 23548)
-- Dependencies: 320
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
-- TOC entry 5095 (class 0 OID 23554)
-- Dependencies: 322
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
-- TOC entry 5097 (class 0 OID 23559)
-- Dependencies: 324
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
-- TOC entry 5099 (class 0 OID 23564)
-- Dependencies: 326
-- Data for Name: rutas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rutas (id, nombre, descripcion, geom) FROM stdin;
1	Ruta Principal CU-104	Trazado de la carretera CU-104 desde el km 0+000 hasta el km 86+364.66	0102000020E610000058000000A3E6ABE4632252C0162F1686C83929C0F90E23298E2252C0E86E3205C63929C0B7AD77C9492252C0FC7E7BE8CC3729C03348669A552252C04D350E50753729C0BBB4E1B0342252C0A7CF0EB8AE3429C069465046262252C0DCEFF55A753229C0C693933FCE2152C0B9D5BD5F163029C0D53439C65F2152C0637AC2120F3029C088ABB992532152C071C63027682F29C00D648742952152C05BC70270FD2D29C0688709B4052252C071E5EC9DD12E29C083D08B248B2252C05287CBE0DE2F29C0CE458D53BE2252C0672783A3E43129C0F697DD93872252C08A0C61EB082E29C06A0B19D95F2252C0E2804C21462A29C0291197D2692252C0CB30EE06D12629C0FBA42435FE2152C0BB9A3C65352529C0BE61ECCEA42152C0E131F268992329C04520A8644A2152C0CF17D6E8302229C0138255F5F22052C09D1ECA06882029C07CF6B75F992052C0FB5C6DC5FE2229C06F06C94C332052C08BDF14562A2429C0A49531F4BE1F52C0B4D3C55C082429C08E41823D811F52C09F8724C4A62329C040B2CA96761F52C02A77FA9C162329C0049376FEC81F52C0D57F31B66B2129C0CA3505323B2052C037CFC76B142029C06872D64C632052C04716D5C7E81D29C035666DAE752052C03DF372D87D1B29C0B74B76C73D2052C09FF0C80EE01729C0FEE208081C2052C0FACF9A1F7F1529C0B72572C1992052C0626AA6D6561729C078FAF7CF092152C0AF1E9CF4631829C08D936703552152C03925C56C6E1529C096D86B30432152C0322DFBBF341229C04E8061F9732152C038AFA01FFC0E29C070F893E7302152C0C3C8DCC6B00C29C0BCB3D194F82052C0FCF37EEDAA0929C068F1BD1A7B2052C098A59D9ACB0929C0D62F229B752052C03E5700F84C0729C0A798DE59962052C09E0AB8E7F90329C075351E11782052C0375E70BCF10029C0D23A0554132052C0DF88EE59D70029C07EB4EED5FD1F52C0B6BC72BD6DFE28C01416269D122052C0853BBC8C07FC28C046F2F0F9BC1F52C0CA49CDC3AEFA28C04404D2B47A1F52C0C31D5EC603F828C0A1CF91A60B1F52C07D2079E750F628C03AA5CD821A1F52C063A6A3D23EF428C0E51714BC571F52C0365A0EF450F328C08B7BE2EFCD1F52C0C82A0021EDF228C083E794360B2052C038A51710B5F028C058569A94022052C076DD5B9198EC28C03EF1F7E6122052C05194957032EB28C0D089F326F51F52C00D3DBDAD4FE828C01277AB9D172052C0C1DDFE017BE928C00D78F41A162052C0B61490F63FE828C09808652BF91F52C05F8A613DA4E628C0A0C37C79012052C042BE3A7DF3E528C0C41CA963BA1F52C01C2E28C23CE628C0A5F622DA0E2052C0C5724BAB21E528C0437AE5D5142052C081221631ECE428C0EA36F28AF11F52C0AFA8D26064E328C0495EE7F0DA1F52C0787E5182FEE228C08449F1F1891F52C0408A3A730FE528C05688A29BD81F52C0FD5B131CA8E128C086C03687102052C0D8800871E5E028C0588D25AC0D2052C0D690B8C7D2DF28C07F4DD6A8072052C028A490BF0FDE28C0499B4FC2F11F52C0CF09EB1049DE28C0199936D2082052C01F29C709B8DC28C0388600E0D81F52C039E9222AF9DD28C09E78CE16901F52C0B91D75CF15E028C0AAD15048571F52C0A18FE854E8E228C0D862B7CF2A1F52C00971E5EC9DE128C02D060FD3BE1E52C066F4A3E194E128C03A234A7B831E52C013EF004F5AE028C02992AF04521E52C058AEB7CD54E028C068588CBAD61D52C0FBAC32535ADF28C0F31FD26F5F1D52C00CCB9F6F0BDE28C0081F4AB4E41C52C0D447E00F3FDF28C033FB3C46791C52C0FB027AE1CEDD28C0C0E95DBC1F1C52C001FBE8D495DF28C0E9297288B81B52C08E06F01648E028C0209A79724D1B52C0CBF8F71917DE28C0376C5B94D91A52C08735954561DF28C0C651B9895A1A52C0C784984BAADE28C00F0C207C281A52C0DD5B9198A0DE28C0
\.


--
-- TOC entry 4620 (class 0 OID 22108)
-- Dependencies: 226
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5101 (class 0 OID 23570)
-- Dependencies: 328
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
-- TOC entry 5103 (class 0 OID 23575)
-- Dependencies: 330
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
-- TOC entry 5106 (class 0 OID 23581)
-- Dependencies: 333
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
-- TOC entry 5108 (class 0 OID 23590)
-- Dependencies: 335
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
-- TOC entry 5110 (class 0 OID 23594)
-- Dependencies: 337
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
-- TOC entry 5112 (class 0 OID 23598)
-- Dependencies: 339
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
40	cu-104	25252525	sera	sera	sera	sera	sera	sera@gmail.com	sersa@gmail.com	2025-07-29	14	2	2	ASISTENTE	3	2025-08-29 14:35:05.516854
\.


--
-- TOC entry 4621 (class 0 OID 22872)
-- Dependencies: 231
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: backend_nameless_log_553
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- TOC entry 4622 (class 0 OID 23203)
-- Dependencies: 276
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: backend_nameless_log_553
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4623 (class 0 OID 23213)
-- Dependencies: 278
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: backend_nameless_log_553
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4624 (class 0 OID 23223)
-- Dependencies: 280
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: backend_nameless_log_553
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- TOC entry 4626 (class 0 OID 23266)
-- Dependencies: 282
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: backend_nameless_log_553
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- TOC entry 4627 (class 0 OID 23278)
-- Dependencies: 283
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: backend_nameless_log_553
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 288
-- Name: anuncios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anuncios_id_seq', 58, true);


--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 290
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 1, false);


--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 292
-- Name: changelogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.changelogs_id_seq', 5, true);


--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 295
-- Name: distritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.distritos_id_seq', 1, false);


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 298
-- Name: ensayos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ensayos_id_seq', 39, true);


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 300
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidad_visibilidad_id_seq', 1, false);


--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 302
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_codigo_esp_seq', 1, false);


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 304
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_navbar_options_id_seq', 1, false);


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 305
-- Name: estratos_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_codigo_seq', 5, true);


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 307
-- Name: estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_id_seq', 5, true);


--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 309
-- Name: navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.navbar_options_id_seq', 22, true);


--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 311
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permisos_id_seq', 9, true);


--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 313
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresiva_perfil_estratos_id_seq', 182, true);


--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 315
-- Name: progresivas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresivas_id_seq', 2765, true);


--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 317
-- Name: provincias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provincias_id_seq', 1, false);


--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 319
-- Name: proyectos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyectos_id_seq', 16, true);


--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 321
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 323
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_navbar_options_id_seq', 367, true);


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 325
-- Name: roles_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_permisos_id_seq', 59, true);


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 327
-- Name: rutas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rutas_id_seq', 1, true);


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 329
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_ensayo_id_seq', 28, true);


--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 331
-- Name: tipo_via_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_via_codigo_seq', 1, false);


--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 332
-- Name: tipo_via_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_via_id_seq', 7, true);


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 334
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trafico_imagenes_id_seq', 71, true);


--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 336
-- Name: tusuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tusuarios_id_seq', 5, true);


--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 338
-- Name: user_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permisos_id_seq', 23, true);


--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 340
-- Name: usuariost_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuariost_id_seq', 40, true);


--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 281
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- TOC entry 4808 (class 2606 OID 23633)
-- Name: anuncios anuncios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 23635)
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- TOC entry 4812 (class 2606 OID 23637)
-- Name: changelogs changelogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs
    ADD CONSTRAINT changelogs_pkey PRIMARY KEY (id);


--
-- TOC entry 4814 (class 2606 OID 23639)
-- Name: changelogs changelogs_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs
    ADD CONSTRAINT changelogs_version_key UNIQUE (version);


--
-- TOC entry 4816 (class 2606 OID 23641)
-- Name: codigo_departamentos codigo_departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_departamentos
    ADD CONSTRAINT codigo_departamentos_pkey PRIMARY KEY (codigo_departamento);


--
-- TOC entry 4818 (class 2606 OID 23643)
-- Name: distritos distritos_codigo_distrito_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_codigo_distrito_key UNIQUE (codigo_distrito);


--
-- TOC entry 4820 (class 2606 OID 23645)
-- Name: distritos distritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_pkey PRIMARY KEY (id);


--
-- TOC entry 4822 (class 2606 OID 23647)
-- Name: elementos_trafico elementos_trafico_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.elementos_trafico
    ADD CONSTRAINT elementos_trafico_pkey PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 23649)
-- Name: ensayos ensayos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_pkey PRIMARY KEY (id);


--
-- TOC entry 4826 (class 2606 OID 23651)
-- Name: especialidad_visibilidad especialidad_visibilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad
    ADD CONSTRAINT especialidad_visibilidad_pkey PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 23653)
-- Name: especialidades_navbar_options especialidades_navbar_options_especialidad_id_navbar_option_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_especialidad_id_navbar_option_key UNIQUE (especialidad_id, navbar_option_id);


--
-- TOC entry 4832 (class 2606 OID 23655)
-- Name: especialidades_navbar_options especialidades_navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4828 (class 2606 OID 23657)
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (codigo_esp);


--
-- TOC entry 4834 (class 2606 OID 23659)
-- Name: estratos estratos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos
    ADD CONSTRAINT estratos_codigo_key UNIQUE (codigo);


--
-- TOC entry 4836 (class 2606 OID 23661)
-- Name: estratos estratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos
    ADD CONSTRAINT estratos_pkey PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 23663)
-- Name: navbar_options navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options
    ADD CONSTRAINT navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4842 (class 2606 OID 23665)
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4844 (class 2606 OID 23667)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 2606 OID 23669)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_progresiva_id_orden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_orden_key UNIQUE (progresiva_id, orden);


--
-- TOC entry 4848 (class 2606 OID 23671)
-- Name: progresivas progresivas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_codigo_key UNIQUE (codigo);


--
-- TOC entry 4850 (class 2606 OID 23673)
-- Name: progresivas progresivas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_pkey PRIMARY KEY (id);


--
-- TOC entry 4852 (class 2606 OID 23675)
-- Name: provincias provincias_codigo_provincia_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_codigo_provincia_key UNIQUE (codigo_provincia);


--
-- TOC entry 4854 (class 2606 OID 23677)
-- Name: provincias provincias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 23679)
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 23681)
-- Name: roles_navbar_options roles_navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 23683)
-- Name: roles_permisos roles_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 23685)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 23687)
-- Name: rutas rutas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas
    ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);


--
-- TOC entry 4868 (class 2606 OID 23689)
-- Name: tipo_ensayo tipo_ensayo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_ensayo
    ADD CONSTRAINT tipo_ensayo_pkey PRIMARY KEY (id);


--
-- TOC entry 4870 (class 2606 OID 23691)
-- Name: tipo_via tipo_via_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via
    ADD CONSTRAINT tipo_via_pkey PRIMARY KEY (id);


--
-- TOC entry 4875 (class 2606 OID 23693)
-- Name: trafico_imagenes trafico_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT trafico_imagenes_pkey PRIMARY KEY (id);


--
-- TOC entry 4877 (class 2606 OID 23695)
-- Name: tusuarios tusuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tusuarios
    ADD CONSTRAINT tusuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4840 (class 2606 OID 23697)
-- Name: navbar_options unique_navbar_option_link; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options
    ADD CONSTRAINT unique_navbar_option_link UNIQUE (link);


--
-- TOC entry 4862 (class 2606 OID 23699)
-- Name: roles_navbar_options unique_role_navbar_option; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT unique_role_navbar_option UNIQUE (role_id, navbar_option_id);


--
-- TOC entry 4872 (class 2606 OID 23701)
-- Name: tipo_via uq_tipo_via_codigo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via
    ADD CONSTRAINT uq_tipo_via_codigo UNIQUE (codigo);


--
-- TOC entry 4879 (class 2606 OID 23703)
-- Name: user_permisos user_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 23705)
-- Name: user_permisos user_permisos_user_id_permiso_id_tipo_acceso_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_user_id_permiso_id_tipo_acceso_key UNIQUE (user_id, permiso_id, tipo_acceso);


--
-- TOC entry 4883 (class 2606 OID 23707)
-- Name: usuariost usuariost_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_dni_key UNIQUE (dni);


--
-- TOC entry 4885 (class 2606 OID 23709)
-- Name: usuariost usuariost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 1259 OID 23710)
-- Name: idx_trafico_imagenes_station_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trafico_imagenes_station_id ON public.trafico_imagenes USING btree (station_id);


--
-- TOC entry 4886 (class 2606 OID 23711)
-- Name: anuncios anuncios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);


--
-- TOC entry 4887 (class 2606 OID 23716)
-- Name: auditoria auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);


--
-- TOC entry 4888 (class 2606 OID 23721)
-- Name: distritos distritos_codigo_provincia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_codigo_provincia_fkey FOREIGN KEY (codigo_provincia) REFERENCES public.provincias(codigo_provincia);


--
-- TOC entry 4890 (class 2606 OID 23726)
-- Name: especialidad_visibilidad especialidad_visibilidad_codigo_esp_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad
    ADD CONSTRAINT especialidad_visibilidad_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4891 (class 2606 OID 23731)
-- Name: especialidades_navbar_options especialidades_navbar_options_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4892 (class 2606 OID 23736)
-- Name: especialidades_navbar_options especialidades_navbar_options_navbar_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);


--
-- TOC entry 4895 (class 2606 OID 23741)
-- Name: progresivas fk_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;


--
-- TOC entry 4896 (class 2606 OID 23746)
-- Name: progresivas fk_progresivas_tipo_ensayo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_progresivas_tipo_ensayo FOREIGN KEY (tipo_ensayo) REFERENCES public.tipo_ensayo(id);


--
-- TOC entry 4897 (class 2606 OID 23751)
-- Name: progresivas fk_progresivas_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_progresivas_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- TOC entry 4905 (class 2606 OID 23756)
-- Name: trafico_imagenes fk_station; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES public.elementos_trafico(id) ON DELETE CASCADE;


--
-- TOC entry 4889 (class 2606 OID 23761)
-- Name: ensayos fk_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT fk_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- TOC entry 4893 (class 2606 OID 23766)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_estrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_estrato_id_fkey FOREIGN KEY (estrato_id) REFERENCES public.estratos(id);


--
-- TOC entry 4894 (class 2606 OID 23771)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_progresiva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_fkey FOREIGN KEY (progresiva_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;


--
-- TOC entry 4898 (class 2606 OID 23776)
-- Name: progresivas progresivas_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuariost(id);


--
-- TOC entry 4899 (class 2606 OID 23781)
-- Name: progresivas progresivas_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.progresivas(id);


--
-- TOC entry 4900 (class 2606 OID 23786)
-- Name: provincias provincias_codigo_departamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_codigo_departamento_fkey FOREIGN KEY (codigo_departamento) REFERENCES public.codigo_departamentos(codigo_departamento);


--
-- TOC entry 4901 (class 2606 OID 23791)
-- Name: roles_navbar_options roles_navbar_options_navbar_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);


--
-- TOC entry 4902 (class 2606 OID 23796)
-- Name: roles_navbar_options roles_navbar_options_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4903 (class 2606 OID 23801)
-- Name: roles_permisos roles_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id);


--
-- TOC entry 4904 (class 2606 OID 23806)
-- Name: roles_permisos roles_permisos_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- TOC entry 4906 (class 2606 OID 23811)
-- Name: user_permisos user_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id) ON DELETE CASCADE;


--
-- TOC entry 4907 (class 2606 OID 23816)
-- Name: user_permisos user_permisos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuariost(id) ON DELETE CASCADE;


--
-- TOC entry 4908 (class 2606 OID 23821)
-- Name: usuariost usuariost_codigo_esp_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4909 (class 2606 OID 23826)
-- Name: usuariost usuariost_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 9
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: backend_nameless_log_553
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2025-08-29 09:48:28

--
-- PostgreSQL database dump complete
--

\unrestrict tZOEsb75w5l8zkiVhG78eEtQgJwGDScbSPHWA5OXzQLIZgyOukMZm0ueKuvk2Ya

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict x5L5QeNGXiAE0qEfYFDb6vETF3sSvjSsaLvN3WTjvZuaa4chVcRNTqCZrTq9sha

-- Dumped from database version 17.2 (Ubuntu 17.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-29 09:48:28

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
-- TOC entry 11 (class 2615 OID 16387)
-- Name: repmgr; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA repmgr;


ALTER SCHEMA repmgr OWNER TO postgres;

--
-- TOC entry 12 (class 2615 OID 16515)
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- TOC entry 13 (class 2615 OID 16516)
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- TOC entry 14 (class 2615 OID 16517)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 14
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 3 (class 3079 OID 16518)
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- TOC entry 4 (class 3079 OID 16530)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 5 (class 3079 OID 17610)
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- TOC entry 6 (class 3079 OID 18008)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- TOC entry 2 (class 3079 OID 16388)
-- Name: repmgr; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS repmgr WITH SCHEMA repmgr;


--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION repmgr; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION repmgr IS 'Replication manager for PostgreSQL';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 294 (class 1259 OID 18177)
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
-- TOC entry 295 (class 1259 OID 18183)
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
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 295
-- Name: anuncios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anuncios_id_seq OWNED BY public.anuncios.id;


--
-- TOC entry 296 (class 1259 OID 18184)
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
-- TOC entry 297 (class 1259 OID 18190)
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
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 297
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- TOC entry 298 (class 1259 OID 18191)
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
-- TOC entry 299 (class 1259 OID 18197)
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
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 299
-- Name: changelogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.changelogs_id_seq OWNED BY public.changelogs.id;


--
-- TOC entry 300 (class 1259 OID 18198)
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
-- TOC entry 301 (class 1259 OID 18203)
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
-- TOC entry 302 (class 1259 OID 18206)
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
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 302
-- Name: distritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.distritos_id_seq OWNED BY public.distritos.id;


--
-- TOC entry 303 (class 1259 OID 18207)
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
-- TOC entry 304 (class 1259 OID 18212)
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
-- TOC entry 305 (class 1259 OID 18215)
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
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 305
-- Name: ensayos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ensayos_id_seq OWNED BY public.ensayos.id;


--
-- TOC entry 306 (class 1259 OID 18216)
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
-- TOC entry 307 (class 1259 OID 18219)
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
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 307
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidad_visibilidad_id_seq OWNED BY public.especialidad_visibilidad.id;


--
-- TOC entry 308 (class 1259 OID 18220)
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
-- TOC entry 309 (class 1259 OID 18225)
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
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 309
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_codigo_esp_seq OWNED BY public.especialidades.codigo_esp;


--
-- TOC entry 310 (class 1259 OID 18226)
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
-- TOC entry 311 (class 1259 OID 18230)
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
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 311
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_navbar_options_id_seq OWNED BY public.especialidades_navbar_options.id;


--
-- TOC entry 312 (class 1259 OID 18231)
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
-- TOC entry 313 (class 1259 OID 18232)
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
-- TOC entry 314 (class 1259 OID 18240)
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
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 314
-- Name: estratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estratos_id_seq OWNED BY public.estratos.id;


--
-- TOC entry 315 (class 1259 OID 18241)
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
-- TOC entry 316 (class 1259 OID 18246)
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
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 316
-- Name: navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.navbar_options_id_seq OWNED BY public.navbar_options.id;


--
-- TOC entry 317 (class 1259 OID 18247)
-- Name: permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permisos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);


ALTER TABLE public.permisos OWNER TO postgres;

--
-- TOC entry 318 (class 1259 OID 18252)
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
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 318
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;


--
-- TOC entry 319 (class 1259 OID 18253)
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
-- TOC entry 320 (class 1259 OID 18258)
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
-- TOC entry 5188 (class 0 OID 0)
-- Dependencies: 320
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresiva_perfil_estratos_id_seq OWNED BY public.progresiva_perfil_estratos.id;


--
-- TOC entry 321 (class 1259 OID 18259)
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
    CONSTRAINT progresivas_estado_check CHECK (((estado)::text = ANY (ARRAY[('activo'::character varying)::text, ('inactivo'::character varying)::text, ('completado'::character varying)::text])))
);


ALTER TABLE public.progresivas OWNER TO postgres;

--
-- TOC entry 322 (class 1259 OID 18267)
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
-- TOC entry 5189 (class 0 OID 0)
-- Dependencies: 322
-- Name: progresivas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresivas_id_seq OWNED BY public.progresivas.id;


--
-- TOC entry 323 (class 1259 OID 18268)
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
-- TOC entry 324 (class 1259 OID 18271)
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
-- TOC entry 5190 (class 0 OID 0)
-- Dependencies: 324
-- Name: provincias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provincias_id_seq OWNED BY public.provincias.id;


--
-- TOC entry 325 (class 1259 OID 18272)
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
-- TOC entry 326 (class 1259 OID 18279)
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
-- TOC entry 5191 (class 0 OID 0)
-- Dependencies: 326
-- Name: proyectos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proyectos_id_seq OWNED BY public.proyectos.id;


--
-- TOC entry 327 (class 1259 OID 18280)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 328 (class 1259 OID 18285)
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
-- TOC entry 5192 (class 0 OID 0)
-- Dependencies: 328
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 329 (class 1259 OID 18286)
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
-- TOC entry 330 (class 1259 OID 18290)
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
-- TOC entry 5193 (class 0 OID 0)
-- Dependencies: 330
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_navbar_options_id_seq OWNED BY public.roles_navbar_options.id;


--
-- TOC entry 331 (class 1259 OID 18291)
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
-- TOC entry 332 (class 1259 OID 18295)
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
-- TOC entry 5194 (class 0 OID 0)
-- Dependencies: 332
-- Name: roles_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_permisos_id_seq OWNED BY public.roles_permisos.id;


--
-- TOC entry 333 (class 1259 OID 18296)
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
-- TOC entry 334 (class 1259 OID 18301)
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
-- TOC entry 5195 (class 0 OID 0)
-- Dependencies: 334
-- Name: rutas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rutas_id_seq OWNED BY public.rutas.id;


--
-- TOC entry 335 (class 1259 OID 18302)
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
-- TOC entry 336 (class 1259 OID 18306)
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
-- TOC entry 5196 (class 0 OID 0)
-- Dependencies: 336
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_ensayo_id_seq OWNED BY public.tipo_ensayo.id;


--
-- TOC entry 337 (class 1259 OID 18307)
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
-- TOC entry 338 (class 1259 OID 18311)
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
-- TOC entry 5197 (class 0 OID 0)
-- Dependencies: 338
-- Name: tipo_via_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_via_codigo_seq OWNED BY public.tipo_via.codigo;


--
-- TOC entry 339 (class 1259 OID 18312)
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
-- TOC entry 5198 (class 0 OID 0)
-- Dependencies: 339
-- Name: tipo_via_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_via_id_seq OWNED BY public.tipo_via.id;


--
-- TOC entry 340 (class 1259 OID 18313)
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
-- TOC entry 341 (class 1259 OID 18321)
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
-- TOC entry 5199 (class 0 OID 0)
-- Dependencies: 341
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trafico_imagenes_id_seq OWNED BY public.trafico_imagenes.id;


--
-- TOC entry 342 (class 1259 OID 18322)
-- Name: tusuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tusuarios (
    id integer NOT NULL,
    usuario character varying(50),
    password character varying(50)
);


ALTER TABLE public.tusuarios OWNER TO postgres;

--
-- TOC entry 343 (class 1259 OID 18325)
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
-- TOC entry 5200 (class 0 OID 0)
-- Dependencies: 343
-- Name: tusuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tusuarios_id_seq OWNED BY public.tusuarios.id;


--
-- TOC entry 344 (class 1259 OID 18326)
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
-- TOC entry 345 (class 1259 OID 18329)
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
-- TOC entry 5201 (class 0 OID 0)
-- Dependencies: 345
-- Name: user_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permisos_id_seq OWNED BY public.user_permisos.id;


--
-- TOC entry 346 (class 1259 OID 18330)
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
-- TOC entry 347 (class 1259 OID 18336)
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
-- TOC entry 5202 (class 0 OID 0)
-- Dependencies: 347
-- Name: usuariost_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuariost_id_seq OWNED BY public.usuariost.id;


--
-- TOC entry 4695 (class 2604 OID 18575)
-- Name: anuncios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios ALTER COLUMN id SET DEFAULT nextval('public.anuncios_id_seq'::regclass);


--
-- TOC entry 4697 (class 2604 OID 18576)
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- TOC entry 4699 (class 2604 OID 18577)
-- Name: changelogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs ALTER COLUMN id SET DEFAULT nextval('public.changelogs_id_seq'::regclass);


--
-- TOC entry 4703 (class 2604 OID 18578)
-- Name: distritos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos ALTER COLUMN id SET DEFAULT nextval('public.distritos_id_seq'::regclass);


--
-- TOC entry 4704 (class 2604 OID 18579)
-- Name: ensayos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos ALTER COLUMN id SET DEFAULT nextval('public.ensayos_id_seq'::regclass);


--
-- TOC entry 4705 (class 2604 OID 18580)
-- Name: especialidad_visibilidad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad ALTER COLUMN id SET DEFAULT nextval('public.especialidad_visibilidad_id_seq'::regclass);


--
-- TOC entry 4706 (class 2604 OID 18581)
-- Name: especialidades codigo_esp; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades ALTER COLUMN codigo_esp SET DEFAULT nextval('public.especialidades_codigo_esp_seq'::regclass);


--
-- TOC entry 4707 (class 2604 OID 18582)
-- Name: especialidades_navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.especialidades_navbar_options_id_seq'::regclass);


--
-- TOC entry 4709 (class 2604 OID 18583)
-- Name: estratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos ALTER COLUMN id SET DEFAULT nextval('public.estratos_id_seq'::regclass);


--
-- TOC entry 4713 (class 2604 OID 18584)
-- Name: navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options ALTER COLUMN id SET DEFAULT nextval('public.navbar_options_id_seq'::regclass);


--
-- TOC entry 4714 (class 2604 OID 18585)
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);


--
-- TOC entry 4715 (class 2604 OID 18586)
-- Name: progresiva_perfil_estratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos ALTER COLUMN id SET DEFAULT nextval('public.progresiva_perfil_estratos_id_seq'::regclass);


--
-- TOC entry 4716 (class 2604 OID 18587)
-- Name: progresivas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas ALTER COLUMN id SET DEFAULT nextval('public.progresivas_id_seq'::regclass);


--
-- TOC entry 4719 (class 2604 OID 18588)
-- Name: provincias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias ALTER COLUMN id SET DEFAULT nextval('public.provincias_id_seq'::regclass);


--
-- TOC entry 4720 (class 2604 OID 18589)
-- Name: proyectos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos ALTER COLUMN id SET DEFAULT nextval('public.proyectos_id_seq'::regclass);


--
-- TOC entry 4723 (class 2604 OID 18590)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4724 (class 2604 OID 18591)
-- Name: roles_navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.roles_navbar_options_id_seq'::regclass);


--
-- TOC entry 4726 (class 2604 OID 18592)
-- Name: roles_permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos ALTER COLUMN id SET DEFAULT nextval('public.roles_permisos_id_seq'::regclass);


--
-- TOC entry 4728 (class 2604 OID 18593)
-- Name: rutas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas ALTER COLUMN id SET DEFAULT nextval('public.rutas_id_seq'::regclass);


--
-- TOC entry 4729 (class 2604 OID 18594)
-- Name: tipo_ensayo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_ensayo ALTER COLUMN id SET DEFAULT nextval('public.tipo_ensayo_id_seq'::regclass);


--
-- TOC entry 4731 (class 2604 OID 18595)
-- Name: tipo_via id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via ALTER COLUMN id SET DEFAULT nextval('public.tipo_via_id_seq'::regclass);


--
-- TOC entry 4733 (class 2604 OID 18596)
-- Name: tipo_via codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via ALTER COLUMN codigo SET DEFAULT lpad((nextval('public.tipo_via_codigo_seq'::regclass))::text, 7, '0'::text);


--
-- TOC entry 4734 (class 2604 OID 18597)
-- Name: trafico_imagenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes ALTER COLUMN id SET DEFAULT nextval('public.trafico_imagenes_id_seq'::regclass);


--
-- TOC entry 4738 (class 2604 OID 18598)
-- Name: tusuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tusuarios ALTER COLUMN id SET DEFAULT nextval('public.tusuarios_id_seq'::regclass);


--
-- TOC entry 4739 (class 2604 OID 18599)
-- Name: user_permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos ALTER COLUMN id SET DEFAULT nextval('public.user_permisos_id_seq'::regclass);


--
-- TOC entry 4740 (class 2604 OID 18600)
-- Name: usuariost id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost ALTER COLUMN id SET DEFAULT nextval('public.usuariost_id_seq'::regclass);


--
-- TOC entry 5112 (class 0 OID 18177)
-- Dependencies: 294
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
59	ss	s	2025-08-18 16:58:13.846	2	2025-08-18 18:58:13.846	1	https://ctqtbr3nar8jji3s.public.blob.vercel-storage.com/trafico/ESTUDIO%20TRAFICO%20DESV.LOROWACHANA%20-%20SAN%20MARTIN%20formatos%20prueba.xlsx
\.


--
-- TOC entry 5114 (class 0 OID 18184)
-- Dependencies: 296
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, usuario_id, accion, detalles, creado_en) FROM stdin;
\.


--
-- TOC entry 5116 (class 0 OID 18191)
-- Dependencies: 298
-- Data for Name: changelogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.changelogs (id, version, title, content, release_date) FROM stdin;
1	0.1.0-alpha.1	probando	-prueba\n-prueba\n-prueba\n-prueba\n-prueba	2025-07-18 23:56:02.704914
3	0.1.0-alpha.2	PROBANDO	PROBANDO\nPROBANDO\nPROBANDO	2025-07-18 23:59:48.765531
5	0.1.0-alpha.3	Version alpha 18 de julio de 2025	Añadido\n-coordinador nuevas opciones en cofiguracion\n-#permisos ahora es capaz de controlar los permisos ya sea solo lectura\n  o lectura y edicion ya sea por usuario directo o rol.\n-#visibilidad Navbar: coordinador es capaz de quitar opciones del navbar \n  detallado sea por su rol(cargo) o especialidad.\n-ingeneria basica seccion de trafico a nivel visual (en desarrollo)\n-Mi perfil capaz de visualizar sus datos (en desarrollo)\n-dashboard de inicio en desarrollo las funciones de proyectos,ensayos y progresivas	2025-07-19 00:48:20.047564
\.


--
-- TOC entry 5118 (class 0 OID 18198)
-- Dependencies: 300
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
-- TOC entry 5119 (class 0 OID 18203)
-- Dependencies: 301
-- Data for Name: distritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.distritos (id, nombre, codigo_distrito, codigo_provincia) FROM stdin;
\.


--
-- TOC entry 5121 (class 0 OID 18207)
-- Dependencies: 303
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
-- TOC entry 5122 (class 0 OID 18212)
-- Dependencies: 304
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
-- TOC entry 5124 (class 0 OID 18216)
-- Dependencies: 306
-- Data for Name: especialidad_visibilidad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidad_visibilidad (id, codigo_esp, nivel, tipo_user) FROM stdin;
\.


--
-- TOC entry 5126 (class 0 OID 18220)
-- Dependencies: 308
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
-- TOC entry 5128 (class 0 OID 18226)
-- Dependencies: 310
-- Data for Name: especialidades_navbar_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidades_navbar_options (id, especialidad_id, navbar_option_id, visible) FROM stdin;
\.


--
-- TOC entry 5131 (class 0 OID 18232)
-- Dependencies: 313
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
-- TOC entry 5133 (class 0 OID 18241)
-- Dependencies: 315
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
-- TOC entry 5135 (class 0 OID 18247)
-- Dependencies: 317
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
-- TOC entry 5137 (class 0 OID 18253)
-- Dependencies: 319
-- Data for Name: progresiva_perfil_estratos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresiva_perfil_estratos (id, progresiva_id, estrato_id, profundidad_inicial, profundidad_final, orden, tipo_via, descripcion) FROM stdin;
\.


--
-- TOC entry 5139 (class 0 OID 18259)
-- Dependencies: 321
-- Data for Name: progresivas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresivas (id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, creado_en, actualizado_en, creado_por, proyecto_id, estrato_id, tipo_via, tipo_ensayo, batch_uuid, parent_id, coordenada_este, coordenada_norte, linea, intervalo_manual, longitud_total) FROM stdin;
\.


--
-- TOC entry 5141 (class 0 OID 18268)
-- Dependencies: 323
-- Data for Name: provincias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provincias (id, nombre, codigo_provincia, codigo_departamento) FROM stdin;
\.


--
-- TOC entry 5143 (class 0 OID 18272)
-- Dependencies: 325
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proyectos (id, codigo, nombre_proyecto, descripcion_proyecto, estado, nombre_tramo, proyecto_nom, solicitante, departamento, provincia, distrito, localidad, longitud_total, progresiva_inicial, tipo_via, intervalo_manual, descripcion_larga, create_at, update_at) FROM stdin;
1	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	85520	0+000	500	\N		2025-08-07 20:42:53.739003	2025-08-07 20:42:53.739003
14	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	14785	0+000	500	\N		2025-08-08 15:05:08.946268	2025-08-08 15:05:08.946268
15	\N	\N	\N	Activo	proyecto 22121	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	mi casa	44548	0+000	100	\N		2025-08-08 15:14:32.501231	2025-08-08 15:14:32.501231
16	\N	\N	\N	Activo	proyecto 2111122222	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0804	080405	rtyhhrtew	78954	0+000	500	\N		2025-08-14 15:45:37.268952	2025-08-14 15:45:37.268952
\.


--
-- TOC entry 5145 (class 0 OID 18280)
-- Dependencies: 327
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
-- TOC entry 5147 (class 0 OID 18286)
-- Dependencies: 329
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
-- TOC entry 5149 (class 0 OID 18291)
-- Dependencies: 331
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
-- TOC entry 5151 (class 0 OID 18296)
-- Dependencies: 333
-- Data for Name: rutas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rutas (id, nombre, descripcion, geom) FROM stdin;
1	Ruta Principal CU-104	Trazado de la carretera CU-104 desde el km 0+000 hasta el km 86+364.66	0102000020E610000058000000A3E6ABE4632252C0162F1686C83929C0F90E23298E2252C0E86E3205C63929C0B7AD77C9492252C0FC7E7BE8CC3729C03348669A552252C04D350E50753729C0BBB4E1B0342252C0A7CF0EB8AE3429C069465046262252C0DCEFF55A753229C0C693933FCE2152C0B9D5BD5F163029C0D53439C65F2152C0637AC2120F3029C088ABB992532152C071C63027682F29C00D648742952152C05BC70270FD2D29C0688709B4052252C071E5EC9DD12E29C083D08B248B2252C05287CBE0DE2F29C0CE458D53BE2252C0672783A3E43129C0F697DD93872252C08A0C61EB082E29C06A0B19D95F2252C0E2804C21462A29C0291197D2692252C0CB30EE06D12629C0FBA42435FE2152C0BB9A3C65352529C0BE61ECCEA42152C0E131F268992329C04520A8644A2152C0CF17D6E8302229C0138255F5F22052C09D1ECA06882029C07CF6B75F992052C0FB5C6DC5FE2229C06F06C94C332052C08BDF14562A2429C0A49531F4BE1F52C0B4D3C55C082429C08E41823D811F52C09F8724C4A62329C040B2CA96761F52C02A77FA9C162329C0049376FEC81F52C0D57F31B66B2129C0CA3505323B2052C037CFC76B142029C06872D64C632052C04716D5C7E81D29C035666DAE752052C03DF372D87D1B29C0B74B76C73D2052C09FF0C80EE01729C0FEE208081C2052C0FACF9A1F7F1529C0B72572C1992052C0626AA6D6561729C078FAF7CF092152C0AF1E9CF4631829C08D936703552152C03925C56C6E1529C096D86B30432152C0322DFBBF341229C04E8061F9732152C038AFA01FFC0E29C070F893E7302152C0C3C8DCC6B00C29C0BCB3D194F82052C0FCF37EEDAA0929C068F1BD1A7B2052C098A59D9ACB0929C0D62F229B752052C03E5700F84C0729C0A798DE59962052C09E0AB8E7F90329C075351E11782052C0375E70BCF10029C0D23A0554132052C0DF88EE59D70029C07EB4EED5FD1F52C0B6BC72BD6DFE28C01416269D122052C0853BBC8C07FC28C046F2F0F9BC1F52C0CA49CDC3AEFA28C04404D2B47A1F52C0C31D5EC603F828C0A1CF91A60B1F52C07D2079E750F628C03AA5CD821A1F52C063A6A3D23EF428C0E51714BC571F52C0365A0EF450F328C08B7BE2EFCD1F52C0C82A0021EDF228C083E794360B2052C038A51710B5F028C058569A94022052C076DD5B9198EC28C03EF1F7E6122052C05194957032EB28C0D089F326F51F52C00D3DBDAD4FE828C01277AB9D172052C0C1DDFE017BE928C00D78F41A162052C0B61490F63FE828C09808652BF91F52C05F8A613DA4E628C0A0C37C79012052C042BE3A7DF3E528C0C41CA963BA1F52C01C2E28C23CE628C0A5F622DA0E2052C0C5724BAB21E528C0437AE5D5142052C081221631ECE428C0EA36F28AF11F52C0AFA8D26064E328C0495EE7F0DA1F52C0787E5182FEE228C08449F1F1891F52C0408A3A730FE528C05688A29BD81F52C0FD5B131CA8E128C086C03687102052C0D8800871E5E028C0588D25AC0D2052C0D690B8C7D2DF28C07F4DD6A8072052C028A490BF0FDE28C0499B4FC2F11F52C0CF09EB1049DE28C0199936D2082052C01F29C709B8DC28C0388600E0D81F52C039E9222AF9DD28C09E78CE16901F52C0B91D75CF15E028C0AAD15048571F52C0A18FE854E8E228C0D862B7CF2A1F52C00971E5EC9DE128C02D060FD3BE1E52C066F4A3E194E128C03A234A7B831E52C013EF004F5AE028C02992AF04521E52C058AEB7CD54E028C068588CBAD61D52C0FBAC32535ADF28C0F31FD26F5F1D52C00CCB9F6F0BDE28C0081F4AB4E41C52C0D447E00F3FDF28C033FB3C46791C52C0FB027AE1CEDD28C0C0E95DBC1F1C52C001FBE8D495DF28C0E9297288B81B52C08E06F01648E028C0209A79724D1B52C0CBF8F71917DE28C0376C5B94D91A52C08735954561DF28C0C651B9895A1A52C0C784984BAADE28C00F0C207C281A52C0DD5B9198A0DE28C0
\.


--
-- TOC entry 4660 (class 0 OID 16852)
-- Dependencies: 233
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5153 (class 0 OID 18302)
-- Dependencies: 335
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
-- TOC entry 5155 (class 0 OID 18307)
-- Dependencies: 337
-- Data for Name: tipo_via; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipo_via (id, descripcion, created_at, codigo) FROM stdin;
100	TIPO I - Autopistas (100m)	2025-08-15 16:20:32.498593	T1     
250	Tipo II - Vias principales (250m)	2025-08-15 16:20:32.498593	T2     
500	Tipo III - Vias secundarias (500m)	2025-08-15 16:20:32.498593	T3     
1000	Tipo IV Vias locales (1000m)	2025-08-15 16:20:32.498593	T4     
\.


--
-- TOC entry 5158 (class 0 OID 18313)
-- Dependencies: 340
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
-- TOC entry 5160 (class 0 OID 18322)
-- Dependencies: 342
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
-- TOC entry 5162 (class 0 OID 18326)
-- Dependencies: 344
-- Data for Name: user_permisos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permisos (id, user_id, permiso_id, tipo_acceso) FROM stdin;
\.


--
-- TOC entry 5164 (class 0 OID 18330)
-- Dependencies: 346
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
-- TOC entry 4658 (class 0 OID 16405)
-- Dependencies: 227
-- Data for Name: events; Type: TABLE DATA; Schema: repmgr; Owner: postgres
--

COPY repmgr.events (node_id, event, successful, event_timestamp, details) FROM stdin;
\.


--
-- TOC entry 4659 (class 0 OID 16412)
-- Dependencies: 228
-- Data for Name: monitoring_history; Type: TABLE DATA; Schema: repmgr; Owner: postgres
--

COPY repmgr.monitoring_history (primary_node_id, standby_node_id, last_monitor_time, last_apply_time, last_wal_primary_location, last_wal_standby_location, replication_lag, apply_lag) FROM stdin;
\.


--
-- TOC entry 4657 (class 0 OID 16389)
-- Dependencies: 226
-- Data for Name: nodes; Type: TABLE DATA; Schema: repmgr; Owner: postgres
--

COPY repmgr.nodes (node_id, upstream_node_id, active, node_name, type, location, priority, conninfo, repluser, slot_name, config_file) FROM stdin;
\.


--
-- TOC entry 4661 (class 0 OID 17616)
-- Dependencies: 238
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- TOC entry 4662 (class 0 OID 17947)
-- Dependencies: 283
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4663 (class 0 OID 17957)
-- Dependencies: 285
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4664 (class 0 OID 17967)
-- Dependencies: 287
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- TOC entry 4666 (class 0 OID 18010)
-- Dependencies: 289
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- TOC entry 4667 (class 0 OID 18022)
-- Dependencies: 290
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- TOC entry 5203 (class 0 OID 0)
-- Dependencies: 295
-- Name: anuncios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anuncios_id_seq', 59, true);


--
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 297
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 1, false);


--
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 299
-- Name: changelogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.changelogs_id_seq', 5, true);


--
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 302
-- Name: distritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.distritos_id_seq', 1, false);


--
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 305
-- Name: ensayos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ensayos_id_seq', 39, true);


--
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 307
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidad_visibilidad_id_seq', 1, false);


--
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 309
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_codigo_esp_seq', 1, false);


--
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 311
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_navbar_options_id_seq', 1, false);


--
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 312
-- Name: estratos_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_codigo_seq', 5, true);


--
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 314
-- Name: estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_id_seq', 5, true);


--
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 316
-- Name: navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.navbar_options_id_seq', 22, true);


--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 318
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permisos_id_seq', 9, true);


--
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 320
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresiva_perfil_estratos_id_seq', 26, true);


--
-- TOC entry 5216 (class 0 OID 0)
-- Dependencies: 322
-- Name: progresivas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresivas_id_seq', 1176, true);


--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 324
-- Name: provincias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provincias_id_seq', 1, false);


--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 326
-- Name: proyectos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyectos_id_seq', 16, true);


--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 328
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 330
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_navbar_options_id_seq', 367, true);


--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 332
-- Name: roles_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_permisos_id_seq', 59, true);


--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 334
-- Name: rutas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rutas_id_seq', 1, true);


--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 336
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_ensayo_id_seq', 28, true);


--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 338
-- Name: tipo_via_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_via_codigo_seq', 1, false);


--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 339
-- Name: tipo_via_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_via_id_seq', 7, true);


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 341
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trafico_imagenes_id_seq', 73, true);


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 343
-- Name: tusuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tusuarios_id_seq', 5, true);


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 345
-- Name: user_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permisos_id_seq', 23, true);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 347
-- Name: usuariost_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuariost_id_seq', 39, true);


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 288
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: postgres
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- TOC entry 4857 (class 2606 OID 18364)
-- Name: anuncios anuncios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_pkey PRIMARY KEY (id);


--
-- TOC entry 4859 (class 2606 OID 18366)
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- TOC entry 4861 (class 2606 OID 18368)
-- Name: changelogs changelogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs
    ADD CONSTRAINT changelogs_pkey PRIMARY KEY (id);


--
-- TOC entry 4863 (class 2606 OID 18370)
-- Name: changelogs changelogs_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs
    ADD CONSTRAINT changelogs_version_key UNIQUE (version);


--
-- TOC entry 4865 (class 2606 OID 18372)
-- Name: codigo_departamentos codigo_departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_departamentos
    ADD CONSTRAINT codigo_departamentos_pkey PRIMARY KEY (codigo_departamento);


--
-- TOC entry 4867 (class 2606 OID 18374)
-- Name: distritos distritos_codigo_distrito_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_codigo_distrito_key UNIQUE (codigo_distrito);


--
-- TOC entry 4869 (class 2606 OID 18376)
-- Name: distritos distritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_pkey PRIMARY KEY (id);


--
-- TOC entry 4871 (class 2606 OID 18378)
-- Name: elementos_trafico elementos_trafico_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.elementos_trafico
    ADD CONSTRAINT elementos_trafico_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 18380)
-- Name: ensayos ensayos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_pkey PRIMARY KEY (id);


--
-- TOC entry 4875 (class 2606 OID 18382)
-- Name: especialidad_visibilidad especialidad_visibilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad
    ADD CONSTRAINT especialidad_visibilidad_pkey PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 18384)
-- Name: especialidades_navbar_options especialidades_navbar_options_especialidad_id_navbar_option_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_especialidad_id_navbar_option_key UNIQUE (especialidad_id, navbar_option_id);


--
-- TOC entry 4881 (class 2606 OID 18386)
-- Name: especialidades_navbar_options especialidades_navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4877 (class 2606 OID 18388)
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (codigo_esp);


--
-- TOC entry 4883 (class 2606 OID 18390)
-- Name: estratos estratos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos
    ADD CONSTRAINT estratos_codigo_key UNIQUE (codigo);


--
-- TOC entry 4885 (class 2606 OID 18392)
-- Name: estratos estratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos
    ADD CONSTRAINT estratos_pkey PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 18394)
-- Name: navbar_options navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options
    ADD CONSTRAINT navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 18396)
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4893 (class 2606 OID 18398)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_pkey PRIMARY KEY (id);


--
-- TOC entry 4895 (class 2606 OID 18400)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_progresiva_id_orden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_orden_key UNIQUE (progresiva_id, orden);


--
-- TOC entry 4897 (class 2606 OID 18402)
-- Name: progresivas progresivas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_codigo_key UNIQUE (codigo);


--
-- TOC entry 4899 (class 2606 OID 18404)
-- Name: progresivas progresivas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_pkey PRIMARY KEY (id);


--
-- TOC entry 4901 (class 2606 OID 18406)
-- Name: provincias provincias_codigo_provincia_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_codigo_provincia_key UNIQUE (codigo_provincia);


--
-- TOC entry 4903 (class 2606 OID 18408)
-- Name: provincias provincias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_pkey PRIMARY KEY (id);


--
-- TOC entry 4905 (class 2606 OID 18410)
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- TOC entry 4909 (class 2606 OID 18412)
-- Name: roles_navbar_options roles_navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4913 (class 2606 OID 18414)
-- Name: roles_permisos roles_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 18416)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4915 (class 2606 OID 18418)
-- Name: rutas rutas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas
    ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);


--
-- TOC entry 4917 (class 2606 OID 18420)
-- Name: tipo_ensayo tipo_ensayo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_ensayo
    ADD CONSTRAINT tipo_ensayo_pkey PRIMARY KEY (id);


--
-- TOC entry 4919 (class 2606 OID 18422)
-- Name: tipo_via tipo_via_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via
    ADD CONSTRAINT tipo_via_pkey PRIMARY KEY (id);


--
-- TOC entry 4924 (class 2606 OID 18424)
-- Name: trafico_imagenes trafico_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT trafico_imagenes_pkey PRIMARY KEY (id);


--
-- TOC entry 4926 (class 2606 OID 18426)
-- Name: tusuarios tusuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tusuarios
    ADD CONSTRAINT tusuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 18428)
-- Name: navbar_options unique_navbar_option_link; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options
    ADD CONSTRAINT unique_navbar_option_link UNIQUE (link);


--
-- TOC entry 4911 (class 2606 OID 18430)
-- Name: roles_navbar_options unique_role_navbar_option; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT unique_role_navbar_option UNIQUE (role_id, navbar_option_id);


--
-- TOC entry 4921 (class 2606 OID 18432)
-- Name: tipo_via uq_tipo_via_codigo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via
    ADD CONSTRAINT uq_tipo_via_codigo UNIQUE (codigo);


--
-- TOC entry 4928 (class 2606 OID 18434)
-- Name: user_permisos user_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4930 (class 2606 OID 18436)
-- Name: user_permisos user_permisos_user_id_permiso_id_tipo_acceso_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_user_id_permiso_id_tipo_acceso_key UNIQUE (user_id, permiso_id, tipo_acceso);


--
-- TOC entry 4932 (class 2606 OID 18438)
-- Name: usuariost usuariost_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_dni_key UNIQUE (dni);


--
-- TOC entry 4934 (class 2606 OID 18440)
-- Name: usuariost usuariost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_pkey PRIMARY KEY (id);


--
-- TOC entry 4922 (class 1259 OID 18441)
-- Name: idx_trafico_imagenes_station_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trafico_imagenes_station_id ON public.trafico_imagenes USING btree (station_id);


--
-- TOC entry 4935 (class 2606 OID 18601)
-- Name: anuncios anuncios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);


--
-- TOC entry 4936 (class 2606 OID 18447)
-- Name: auditoria auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);


--
-- TOC entry 4937 (class 2606 OID 18452)
-- Name: distritos distritos_codigo_provincia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_codigo_provincia_fkey FOREIGN KEY (codigo_provincia) REFERENCES public.provincias(codigo_provincia);


--
-- TOC entry 4939 (class 2606 OID 18457)
-- Name: especialidad_visibilidad especialidad_visibilidad_codigo_esp_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad
    ADD CONSTRAINT especialidad_visibilidad_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4940 (class 2606 OID 18462)
-- Name: especialidades_navbar_options especialidades_navbar_options_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4941 (class 2606 OID 18467)
-- Name: especialidades_navbar_options especialidades_navbar_options_navbar_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);


--
-- TOC entry 4944 (class 2606 OID 18472)
-- Name: progresivas fk_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;


--
-- TOC entry 4945 (class 2606 OID 18477)
-- Name: progresivas fk_progresivas_tipo_ensayo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_progresivas_tipo_ensayo FOREIGN KEY (tipo_ensayo) REFERENCES public.tipo_ensayo(id);


--
-- TOC entry 4946 (class 2606 OID 18482)
-- Name: progresivas fk_progresivas_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_progresivas_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- TOC entry 4954 (class 2606 OID 18487)
-- Name: trafico_imagenes fk_station; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES public.elementos_trafico(id) ON DELETE CASCADE;


--
-- TOC entry 4938 (class 2606 OID 18492)
-- Name: ensayos fk_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT fk_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- TOC entry 4942 (class 2606 OID 18497)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_estrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_estrato_id_fkey FOREIGN KEY (estrato_id) REFERENCES public.estratos(id);


--
-- TOC entry 4943 (class 2606 OID 18502)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_progresiva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_fkey FOREIGN KEY (progresiva_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;


--
-- TOC entry 4947 (class 2606 OID 18507)
-- Name: progresivas progresivas_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuariost(id);


--
-- TOC entry 4948 (class 2606 OID 18512)
-- Name: progresivas progresivas_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.progresivas(id);


--
-- TOC entry 4949 (class 2606 OID 18517)
-- Name: provincias provincias_codigo_departamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_codigo_departamento_fkey FOREIGN KEY (codigo_departamento) REFERENCES public.codigo_departamentos(codigo_departamento);


--
-- TOC entry 4950 (class 2606 OID 18522)
-- Name: roles_navbar_options roles_navbar_options_navbar_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);


--
-- TOC entry 4951 (class 2606 OID 18527)
-- Name: roles_navbar_options roles_navbar_options_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4952 (class 2606 OID 18532)
-- Name: roles_permisos roles_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id);


--
-- TOC entry 4953 (class 2606 OID 18537)
-- Name: roles_permisos roles_permisos_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- TOC entry 4955 (class 2606 OID 18542)
-- Name: user_permisos user_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id) ON DELETE CASCADE;


--
-- TOC entry 4956 (class 2606 OID 18547)
-- Name: user_permisos user_permisos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuariost(id) ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 18552)
-- Name: usuariost usuariost_codigo_esp_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4958 (class 2606 OID 18557)
-- Name: usuariost usuariost_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


-- Completed on 2025-08-29 09:49:27

--
-- PostgreSQL database dump complete
--

\unrestrict x5L5QeNGXiAE0qEfYFDb6vETF3sSvjSsaLvN3WTjvZuaa4chVcRNTqCZrTq9sha

--
-- Database "repmgr" dump
--

--
-- PostgreSQL database dump
--

\restrict yW2ZRg0BKm6LCCjK02dhXYYNpJumwX7cK54YmKZ8V7bF1tDQGvxHPOdi8SPkA7k

-- Dumped from database version 17.2 (Ubuntu 17.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-29 09:49:27

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
-- TOC entry 3454 (class 1262 OID 16386)
-- Name: repmgr; Type: DATABASE; Schema: -; Owner: repmgr
--

CREATE DATABASE repmgr WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE repmgr OWNER TO repmgr;

\unrestrict yW2ZRg0BKm6LCCjK02dhXYYNpJumwX7cK54YmKZ8V7bF1tDQGvxHPOdi8SPkA7k
\connect repmgr
\restrict yW2ZRg0BKm6LCCjK02dhXYYNpJumwX7cK54YmKZ8V7bF1tDQGvxHPOdi8SPkA7k

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
-- TOC entry 7 (class 2615 OID 16448)
-- Name: repmgr; Type: SCHEMA; Schema: -; Owner: repmgr
--

CREATE SCHEMA repmgr;


ALTER SCHEMA repmgr OWNER TO repmgr;

--
-- TOC entry 2 (class 3079 OID 16449)
-- Name: repmgr; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS repmgr WITH SCHEMA repmgr;


--
-- TOC entry 3455 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION repmgr; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION repmgr IS 'Replication manager for PostgreSQL';


--
-- TOC entry 3290 (class 0 OID 16466)
-- Dependencies: 220
-- Data for Name: events; Type: TABLE DATA; Schema: repmgr; Owner: repmgr
--

COPY repmgr.events (node_id, event, successful, event_timestamp, details) FROM stdin;
812955966	cluster_created	t	2025-08-29 13:47:15.818037+00	\N
812955966	primary_register	t	2025-08-29 13:47:15.820223+00	
812955966	repmgrd_start	t	2025-08-29 13:47:19.042829+00	monitoring cluster primary "1857222a2169d8" (ID: 812955966)
1172348145	standby_clone	t	2025-08-29 13:47:29.447918+00	cloned from host "1857222a2169d8.vm.geoportalbase.internal", port 5433; backup method: pg_basebackup; --force: Y
615123330	standby_clone	t	2025-08-29 13:47:29.833214+00	cloned from host "1857222a2169d8.vm.geoportalbase.internal", port 5433; backup method: pg_basebackup; --force: Y
1172348145	standby_register	t	2025-08-29 13:47:31.02222+00	standby registration succeeded; upstream node ID is 812955966 (-F/--force option was used)
812955966	child_node_new_connect	t	2025-08-29 13:47:31.123838+00	new standby "2865136f979908" (ID: 1172348145) has connected
615123330	standby_register	t	2025-08-29 13:47:31.211243+00	standby registration succeeded; upstream node ID is 812955966 (-F/--force option was used)
1172348145	repmgrd_start	t	2025-08-29 13:47:34.857932+00	monitoring connection to upstream node "1857222a2169d8" (ID: 812955966)
615123330	repmgrd_start	t	2025-08-29 13:47:35.139997+00	monitoring connection to upstream node "1857222a2169d8" (ID: 812955966)
812955966	child_node_new_connect	t	2025-08-29 13:47:37.224325+00	new standby "683d267c132dd8" (ID: 615123330) has connected
\.


--
-- TOC entry 3291 (class 0 OID 16473)
-- Dependencies: 221
-- Data for Name: monitoring_history; Type: TABLE DATA; Schema: repmgr; Owner: repmgr
--

COPY repmgr.monitoring_history (primary_node_id, standby_node_id, last_monitor_time, last_apply_time, last_wal_primary_location, last_wal_standby_location, replication_lag, apply_lag) FROM stdin;
\.


--
-- TOC entry 3289 (class 0 OID 16450)
-- Dependencies: 219
-- Data for Name: nodes; Type: TABLE DATA; Schema: repmgr; Owner: repmgr
--

COPY repmgr.nodes (node_id, upstream_node_id, active, node_name, type, location, priority, conninfo, repluser, slot_name, config_file) FROM stdin;
812955966	\N	t	1857222a2169d8	primary	gru	100	host=1857222a2169d8.vm.geoportalbase.internal port=5433 user=repmgr dbname=repmgr connect_timeout=5	repmgr	repmgr_slot_812955966	/data/repmgr.conf
1172348145	812955966	t	2865136f979908	standby	gru	100	host=2865136f979908.vm.geoportalbase.internal port=5433 user=repmgr dbname=repmgr connect_timeout=5	repmgr	repmgr_slot_1172348145	/data/repmgr.conf
615123330	812955966	t	683d267c132dd8	standby	gru	100	host=683d267c132dd8.vm.geoportalbase.internal port=5433 user=repmgr dbname=repmgr connect_timeout=5	repmgr	repmgr_slot_615123330	/data/repmgr.conf
\.


-- Completed on 2025-08-29 09:49:57

--
-- PostgreSQL database dump complete
--

\unrestrict yW2ZRg0BKm6LCCjK02dhXYYNpJumwX7cK54YmKZ8V7bF1tDQGvxHPOdi8SPkA7k

--
-- Database "template_postgis" dump
--

--
-- PostgreSQL database dump
--

\restrict csXuCLYZidRiy2hf9CwLGbeIo1mPhxW3grbouYt3gha1LpqsX7lE9e8AesYV9d9

-- Dumped from database version 17.2 (Ubuntu 17.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-29 09:49:57

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
-- TOC entry 4778 (class 1262 OID 18562)
-- Name: template_postgis; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE template_postgis WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template_postgis OWNER TO postgres;

\unrestrict csXuCLYZidRiy2hf9CwLGbeIo1mPhxW3grbouYt3gha1LpqsX7lE9e8AesYV9d9
\connect template_postgis
\restrict csXuCLYZidRiy2hf9CwLGbeIo1mPhxW3grbouYt3gha1LpqsX7lE9e8AesYV9d9

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
-- TOC entry 4779 (class 0 OID 0)
-- Name: template_postgis; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE template_postgis IS_TEMPLATE = true;
ALTER DATABASE template_postgis SET search_path TO '$user', 'public', 'topology', 'tiger';


\unrestrict csXuCLYZidRiy2hf9CwLGbeIo1mPhxW3grbouYt3gha1LpqsX7lE9e8AesYV9d9
\connect template_postgis
\restrict csXuCLYZidRiy2hf9CwLGbeIo1mPhxW3grbouYt3gha1LpqsX7lE9e8AesYV9d9

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
-- TOC entry 10 (class 2615 OID 18606)
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- TOC entry 11 (class 2615 OID 18607)
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- TOC entry 12 (class 2615 OID 18608)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- TOC entry 4780 (class 0 OID 0)
-- Dependencies: 12
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 2 (class 3079 OID 18609)
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- TOC entry 4781 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- TOC entry 3 (class 3079 OID 18621)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 4782 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 4 (class 3079 OID 19701)
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- TOC entry 4783 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- TOC entry 5 (class 3079 OID 20099)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 4784 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- TOC entry 4484 (class 0 OID 18943)
-- Dependencies: 225
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: backend_nameless_log_553
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 4485 (class 0 OID 19707)
-- Dependencies: 230
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: backend_nameless_log_553
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- TOC entry 4486 (class 0 OID 20038)
-- Dependencies: 275
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: backend_nameless_log_553
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4487 (class 0 OID 20048)
-- Dependencies: 277
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: backend_nameless_log_553
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4488 (class 0 OID 20058)
-- Dependencies: 279
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: backend_nameless_log_553
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- TOC entry 4490 (class 0 OID 20101)
-- Dependencies: 281
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: backend_nameless_log_553
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- TOC entry 4491 (class 0 OID 20113)
-- Dependencies: 282
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: backend_nameless_log_553
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- TOC entry 4785 (class 0 OID 0)
-- Dependencies: 280
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: backend_nameless_log_553
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


-- Completed on 2025-08-29 09:50:29

--
-- PostgreSQL database dump complete
--

\unrestrict csXuCLYZidRiy2hf9CwLGbeIo1mPhxW3grbouYt3gha1LpqsX7lE9e8AesYV9d9

-- Completed on 2025-08-29 09:50:29

--
-- PostgreSQL database cluster dump complete
--

