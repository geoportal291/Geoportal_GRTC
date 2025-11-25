--
-- PostgreSQL database cluster dump
--

-- Started on 2025-08-19 10:58:51

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:LqFI6fiHYzCnXw7VrX5tgg==$8+FWUKa4sSlzhhv9ArJ+C27smFZtpWK9/NeOjVx2PlY=:vE10q1mxWMoMRQu16eLPUIjj6EAW6ewMQxAKy4fN2jc=';

--
-- User Configurations
--








--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Debian 17.0-1.pgdg110+1)
-- Dumped by pg_dump version 17.5

-- Started on 2025-08-19 10:58:53

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

-- Completed on 2025-08-19 10:59:14

--
-- PostgreSQL database dump complete
--

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Debian 17.0-1.pgdg110+1)
-- Dumped by pg_dump version 17.5

-- Started on 2025-08-19 10:59:14

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
-- TOC entry 13 (class 2615 OID 19727)
-- Name: repmgr; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA repmgr;


ALTER SCHEMA repmgr OWNER TO postgres;

--
-- TOC entry 11 (class 2615 OID 19299)
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- TOC entry 12 (class 2615 OID 19555)
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- TOC entry 10 (class 2615 OID 19120)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 4 (class 3079 OID 19287)
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- TOC entry 5049 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- TOC entry 2 (class 3079 OID 18042)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 5 (class 3079 OID 19300)
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- TOC entry 3 (class 3079 OID 19121)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 310 (class 1259 OID 20131)
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
-- TOC entry 309 (class 1259 OID 20130)
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
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 309
-- Name: anuncios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anuncios_id_seq OWNED BY public.anuncios.id;


--
-- TOC entry 302 (class 1259 OID 19988)
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
-- TOC entry 301 (class 1259 OID 19987)
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
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 301
-- Name: auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.auditoria_id_seq OWNED BY public.auditoria.id;


--
-- TOC entry 322 (class 1259 OID 20316)
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
-- TOC entry 321 (class 1259 OID 20315)
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
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 321
-- Name: changelogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.changelogs_id_seq OWNED BY public.changelogs.id;


--
-- TOC entry 336 (class 1259 OID 20541)
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
-- TOC entry 340 (class 1259 OID 20572)
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
-- TOC entry 339 (class 1259 OID 20571)
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
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 339
-- Name: distritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.distritos_id_seq OWNED BY public.distritos.id;


--
-- TOC entry 331 (class 1259 OID 20492)
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
-- TOC entry 304 (class 1259 OID 20003)
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
-- TOC entry 303 (class 1259 OID 20002)
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
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 303
-- Name: ensayos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ensayos_id_seq OWNED BY public.ensayos.id;


--
-- TOC entry 292 (class 1259 OID 19834)
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
-- TOC entry 291 (class 1259 OID 19833)
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
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 291
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidad_visibilidad_id_seq OWNED BY public.especialidad_visibilidad.id;


--
-- TOC entry 290 (class 1259 OID 19825)
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
-- TOC entry 289 (class 1259 OID 19824)
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
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 289
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_codigo_esp_seq OWNED BY public.especialidades.codigo_esp;


--
-- TOC entry 320 (class 1259 OID 20294)
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
-- TOC entry 319 (class 1259 OID 20293)
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
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 319
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_navbar_options_id_seq OWNED BY public.especialidades_navbar_options.id;


--
-- TOC entry 326 (class 1259 OID 20394)
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
-- TOC entry 325 (class 1259 OID 20382)
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
-- TOC entry 324 (class 1259 OID 20381)
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
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 324
-- Name: estratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estratos_id_seq OWNED BY public.estratos.id;


--
-- TOC entry 306 (class 1259 OID 20012)
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
-- TOC entry 305 (class 1259 OID 20011)
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
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 305
-- Name: navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.navbar_options_id_seq OWNED BY public.navbar_options.id;


--
-- TOC entry 294 (class 1259 OID 19846)
-- Name: permisos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permisos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text
);


ALTER TABLE public.permisos OWNER TO postgres;

--
-- TOC entry 293 (class 1259 OID 19845)
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
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 293
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permisos_id_seq OWNED BY public.permisos.id;


--
-- TOC entry 330 (class 1259 OID 20455)
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
-- TOC entry 329 (class 1259 OID 20454)
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
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 329
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresiva_perfil_estratos_id_seq OWNED BY public.progresiva_perfil_estratos.id;


--
-- TOC entry 318 (class 1259 OID 20263)
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
-- TOC entry 317 (class 1259 OID 20262)
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
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 317
-- Name: progresivas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresivas_id_seq OWNED BY public.progresivas.id;


--
-- TOC entry 338 (class 1259 OID 20558)
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
-- TOC entry 337 (class 1259 OID 20557)
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
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 337
-- Name: provincias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provincias_id_seq OWNED BY public.provincias.id;


--
-- TOC entry 335 (class 1259 OID 20530)
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
-- TOC entry 334 (class 1259 OID 20529)
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
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 334
-- Name: proyectos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proyectos_id_seq OWNED BY public.proyectos.id;


--
-- TOC entry 296 (class 1259 OID 19855)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 295 (class 1259 OID 19854)
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
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 295
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 308 (class 1259 OID 20021)
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
-- TOC entry 307 (class 1259 OID 20020)
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
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 307
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_navbar_options_id_seq OWNED BY public.roles_navbar_options.id;


--
-- TOC entry 298 (class 1259 OID 19864)
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
-- TOC entry 297 (class 1259 OID 19863)
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
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 297
-- Name: roles_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_permisos_id_seq OWNED BY public.roles_permisos.id;


--
-- TOC entry 328 (class 1259 OID 20433)
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
-- TOC entry 327 (class 1259 OID 20432)
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
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 327
-- Name: rutas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rutas_id_seq OWNED BY public.rutas.id;


--
-- TOC entry 314 (class 1259 OID 20164)
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
-- TOC entry 313 (class 1259 OID 20163)
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
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 313
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_ensayo_id_seq OWNED BY public.tipo_ensayo.id;


--
-- TOC entry 312 (class 1259 OID 20156)
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
-- TOC entry 323 (class 1259 OID 20367)
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
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 323
-- Name: tipo_via_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_via_codigo_seq OWNED BY public.tipo_via.codigo;


--
-- TOC entry 311 (class 1259 OID 20155)
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
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 311
-- Name: tipo_via_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipo_via_id_seq OWNED BY public.tipo_via.id;


--
-- TOC entry 333 (class 1259 OID 20500)
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
-- TOC entry 332 (class 1259 OID 20499)
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
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 332
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trafico_imagenes_id_seq OWNED BY public.trafico_imagenes.id;


--
-- TOC entry 287 (class 1259 OID 19731)
-- Name: tusuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tusuarios (
    id integer NOT NULL,
    usuario character varying(50),
    password character varying(50)
);


ALTER TABLE public.tusuarios OWNER TO postgres;

--
-- TOC entry 288 (class 1259 OID 19734)
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
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 288
-- Name: tusuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tusuarios_id_seq OWNED BY public.tusuarios.id;


--
-- TOC entry 316 (class 1259 OID 20230)
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
-- TOC entry 315 (class 1259 OID 20229)
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
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 315
-- Name: user_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permisos_id_seq OWNED BY public.user_permisos.id;


--
-- TOC entry 300 (class 1259 OID 19966)
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
-- TOC entry 299 (class 1259 OID 19965)
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
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 299
-- Name: usuariost_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuariost_id_seq OWNED BY public.usuariost.id;


--
-- TOC entry 4594 (class 2604 OID 20134)
-- Name: anuncios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios ALTER COLUMN id SET DEFAULT nextval('public.anuncios_id_seq'::regclass);


--
-- TOC entry 4588 (class 2604 OID 19991)
-- Name: auditoria id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id SET DEFAULT nextval('public.auditoria_id_seq'::regclass);


--
-- TOC entry 4607 (class 2604 OID 20319)
-- Name: changelogs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs ALTER COLUMN id SET DEFAULT nextval('public.changelogs_id_seq'::regclass);


--
-- TOC entry 4625 (class 2604 OID 20575)
-- Name: distritos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos ALTER COLUMN id SET DEFAULT nextval('public.distritos_id_seq'::regclass);


--
-- TOC entry 4590 (class 2604 OID 20006)
-- Name: ensayos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos ALTER COLUMN id SET DEFAULT nextval('public.ensayos_id_seq'::regclass);


--
-- TOC entry 4581 (class 2604 OID 19837)
-- Name: especialidad_visibilidad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad ALTER COLUMN id SET DEFAULT nextval('public.especialidad_visibilidad_id_seq'::regclass);


--
-- TOC entry 4580 (class 2604 OID 19828)
-- Name: especialidades codigo_esp; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades ALTER COLUMN codigo_esp SET DEFAULT nextval('public.especialidades_codigo_esp_seq'::regclass);


--
-- TOC entry 4605 (class 2604 OID 20297)
-- Name: especialidades_navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.especialidades_navbar_options_id_seq'::regclass);


--
-- TOC entry 4609 (class 2604 OID 20385)
-- Name: estratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos ALTER COLUMN id SET DEFAULT nextval('public.estratos_id_seq'::regclass);


--
-- TOC entry 4591 (class 2604 OID 20015)
-- Name: navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options ALTER COLUMN id SET DEFAULT nextval('public.navbar_options_id_seq'::regclass);


--
-- TOC entry 4582 (class 2604 OID 19849)
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos ALTER COLUMN id SET DEFAULT nextval('public.permisos_id_seq'::regclass);


--
-- TOC entry 4614 (class 2604 OID 20458)
-- Name: progresiva_perfil_estratos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos ALTER COLUMN id SET DEFAULT nextval('public.progresiva_perfil_estratos_id_seq'::regclass);


--
-- TOC entry 4602 (class 2604 OID 20266)
-- Name: progresivas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas ALTER COLUMN id SET DEFAULT nextval('public.progresivas_id_seq'::regclass);


--
-- TOC entry 4624 (class 2604 OID 20561)
-- Name: provincias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias ALTER COLUMN id SET DEFAULT nextval('public.provincias_id_seq'::regclass);


--
-- TOC entry 4619 (class 2604 OID 20533)
-- Name: proyectos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos ALTER COLUMN id SET DEFAULT nextval('public.proyectos_id_seq'::regclass);


--
-- TOC entry 4583 (class 2604 OID 19858)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4592 (class 2604 OID 20024)
-- Name: roles_navbar_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options ALTER COLUMN id SET DEFAULT nextval('public.roles_navbar_options_id_seq'::regclass);


--
-- TOC entry 4584 (class 2604 OID 19867)
-- Name: roles_permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos ALTER COLUMN id SET DEFAULT nextval('public.roles_permisos_id_seq'::regclass);


--
-- TOC entry 4613 (class 2604 OID 20436)
-- Name: rutas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas ALTER COLUMN id SET DEFAULT nextval('public.rutas_id_seq'::regclass);


--
-- TOC entry 4599 (class 2604 OID 20167)
-- Name: tipo_ensayo id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_ensayo ALTER COLUMN id SET DEFAULT nextval('public.tipo_ensayo_id_seq'::regclass);


--
-- TOC entry 4596 (class 2604 OID 20159)
-- Name: tipo_via id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via ALTER COLUMN id SET DEFAULT nextval('public.tipo_via_id_seq'::regclass);


--
-- TOC entry 4598 (class 2604 OID 20368)
-- Name: tipo_via codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via ALTER COLUMN codigo SET DEFAULT lpad((nextval('public.tipo_via_codigo_seq'::regclass))::text, 7, '0'::text);


--
-- TOC entry 4615 (class 2604 OID 20503)
-- Name: trafico_imagenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes ALTER COLUMN id SET DEFAULT nextval('public.trafico_imagenes_id_seq'::regclass);


--
-- TOC entry 4579 (class 2604 OID 19741)
-- Name: tusuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tusuarios ALTER COLUMN id SET DEFAULT nextval('public.tusuarios_id_seq'::regclass);


--
-- TOC entry 4601 (class 2604 OID 20233)
-- Name: user_permisos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos ALTER COLUMN id SET DEFAULT nextval('public.user_permisos_id_seq'::regclass);


--
-- TOC entry 4586 (class 2604 OID 19969)
-- Name: usuariost id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost ALTER COLUMN id SET DEFAULT nextval('public.usuariost_id_seq'::regclass);


--
-- TOC entry 5012 (class 0 OID 20131)
-- Dependencies: 310
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
-- TOC entry 5004 (class 0 OID 19988)
-- Dependencies: 302
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auditoria (id, usuario_id, accion, detalles, creado_en) FROM stdin;
\.


--
-- TOC entry 5024 (class 0 OID 20316)
-- Dependencies: 322
-- Data for Name: changelogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.changelogs (id, version, title, content, release_date) FROM stdin;
1	0.1.0-alpha.1	probando	-prueba\n-prueba\n-prueba\n-prueba\n-prueba	2025-07-18 23:56:02.704914
3	0.1.0-alpha.2	PROBANDO	PROBANDO\nPROBANDO\nPROBANDO	2025-07-18 23:59:48.765531
5	0.1.0-alpha.3	Version alpha 18 de julio de 2025	Añadido\n-coordinador nuevas opciones en cofiguracion\n-#permisos ahora es capaz de controlar los permisos ya sea solo lectura\n  o lectura y edicion ya sea por usuario directo o rol.\n-#visibilidad Navbar: coordinador es capaz de quitar opciones del navbar \n  detallado sea por su rol(cargo) o especialidad.\n-ingeneria basica seccion de trafico a nivel visual (en desarrollo)\n-Mi perfil capaz de visualizar sus datos (en desarrollo)\n-dashboard de inicio en desarrollo las funciones de proyectos,ensayos y progresivas	2025-07-19 00:48:20.047564
\.


--
-- TOC entry 5038 (class 0 OID 20541)
-- Dependencies: 336
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
-- TOC entry 5042 (class 0 OID 20572)
-- Dependencies: 340
-- Data for Name: distritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.distritos (id, nombre, codigo_distrito, codigo_provincia) FROM stdin;
\.


--
-- TOC entry 5033 (class 0 OID 20492)
-- Dependencies: 331
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
-- TOC entry 5006 (class 0 OID 20003)
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
-- TOC entry 4994 (class 0 OID 19834)
-- Dependencies: 292
-- Data for Name: especialidad_visibilidad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidad_visibilidad (id, codigo_esp, nivel, tipo_user) FROM stdin;
\.


--
-- TOC entry 4992 (class 0 OID 19825)
-- Dependencies: 290
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
-- TOC entry 5022 (class 0 OID 20294)
-- Dependencies: 320
-- Data for Name: especialidades_navbar_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidades_navbar_options (id, especialidad_id, navbar_option_id, visible) FROM stdin;
\.


--
-- TOC entry 5027 (class 0 OID 20382)
-- Dependencies: 325
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
-- TOC entry 5008 (class 0 OID 20012)
-- Dependencies: 306
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
-- TOC entry 4996 (class 0 OID 19846)
-- Dependencies: 294
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
-- TOC entry 5032 (class 0 OID 20455)
-- Dependencies: 330
-- Data for Name: progresiva_perfil_estratos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresiva_perfil_estratos (id, progresiva_id, estrato_id, profundidad_inicial, profundidad_final, orden, tipo_via, descripcion) FROM stdin;
21	861	2	0.000	5.000	1	\N	tierra
22	861	2	5.000	10.000	2	\N	arcilla
23	861	2	10.000	15.000	3	\N	piedra
24	1019	2	0.000	5.000	1	\N	tierra
25	1019	2	5.000	10.000	2	\N	arcilla
26	1019	2	10.000	15.000	3	\N	piedra
\.


--
-- TOC entry 5020 (class 0 OID 20263)
-- Dependencies: 318
-- Data for Name: progresivas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.progresivas (id, codigo, nombre, descripcion, progresiva_inicial, progresiva_final, estado, creado_en, actualizado_en, creado_por, proyecto_id, estrato_id, tipo_via, tipo_ensayo, batch_uuid, parent_id, coordenada_este, coordenada_norte, linea, intervalo_manual, longitud_total) FROM stdin;
861	PROG-ntyw9-43c			0+000	78+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	500	\N	\N	\N	\N	\N	18L	\N	\N
862	861-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
863	861-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
864	861-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
865	861-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
866	861-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
867	861-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
868	861-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
869	861-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
870	861-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
871	861-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
872	861-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
873	861-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
874	861-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
875	861-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
876	861-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
877	861-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
878	861-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
879	861-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
880	861-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
881	861-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
882	861-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
883	861-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
884	861-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
885	861-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
886	861-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
887	861-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
888	861-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
889	861-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
890	861-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
891	861-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
892	861-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
893	861-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
894	861-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
895	861-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
896	861-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
897	861-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
898	861-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
899	861-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
900	861-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
901	861-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
902	861-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
903	861-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
904	861-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
905	861-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
906	861-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
907	861-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
908	861-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
909	861-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
910	861-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
911	861-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
912	861-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
913	861-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
914	861-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
915	861-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
916	861-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
917	861-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
918	861-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
919	861-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
920	861-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
921	861-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
922	861-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
923	861-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
924	861-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
925	861-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
926	861-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
927	861-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
928	861-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
929	861-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
930	861-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
931	861-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
932	861-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
933	861-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
934	861-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
935	861-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
936	861-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
937	861-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
938	861-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
939	861-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
940	861-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
941	861-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
942	861-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
943	861-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
944	861-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
945	861-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
946	861-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
947	861-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
948	861-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
949	861-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
950	861-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
951	861-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
952	861-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
953	861-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
954	861-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
955	861-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
956	861-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
957	861-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
958	861-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
959	861-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
960	861-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
961	861-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
962	861-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
963	861-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
964	861-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
965	861-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
966	861-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
967	861-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
968	861-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
969	861-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
970	861-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
971	861-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
972	861-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
973	861-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
974	861-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
975	861-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
976	861-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
977	861-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
978	861-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
979	861-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
980	861-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
981	861-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
982	861-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
983	861-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
984	861-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
985	861-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
986	861-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
987	861-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
988	861-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
989	861-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
990	861-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
991	861-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
992	861-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
993	861-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
994	861-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
995	861-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
996	861-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
997	861-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
998	861-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
999	861-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1000	861-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1001	861-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1002	861-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1003	861-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1004	861-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1005	861-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1006	861-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1007	861-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1008	861-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1009	861-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1010	861-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1011	861-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1012	861-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1013	861-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1014	861-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1015	861-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1016	861-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1017	861-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1018	861-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-19 14:49:43.367218+00	2025-08-19 14:49:43.367218+00	\N	0	2	\N	\N	\N	861	-72.537347	-12.612858	18L	\N	\N
1019	PROGRESI-nz2nc-fa3	progresiva 5		0+000	78+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	500	\N	\N	\N	-72.537347	-12.612858	18L	\N	78451
1020	1019-0+000	Progresiva 0+000	Progresiva generada automáticamente: 0+000	0+000	0+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1021	1019-0+500	Progresiva 0+500	Progresiva generada automáticamente: 0+500	0+500	0+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1022	1019-1+000	Progresiva 1+000	Progresiva generada automáticamente: 1+000	1+000	1+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1023	1019-1+500	Progresiva 1+500	Progresiva generada automáticamente: 1+500	1+500	1+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1024	1019-2+000	Progresiva 2+000	Progresiva generada automáticamente: 2+000	2+000	2+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1025	1019-2+500	Progresiva 2+500	Progresiva generada automáticamente: 2+500	2+500	2+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1026	1019-3+000	Progresiva 3+000	Progresiva generada automáticamente: 3+000	3+000	3+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1027	1019-3+500	Progresiva 3+500	Progresiva generada automáticamente: 3+500	3+500	3+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1028	1019-4+000	Progresiva 4+000	Progresiva generada automáticamente: 4+000	4+000	4+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1029	1019-4+500	Progresiva 4+500	Progresiva generada automáticamente: 4+500	4+500	4+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1030	1019-5+000	Progresiva 5+000	Progresiva generada automáticamente: 5+000	5+000	5+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1031	1019-5+500	Progresiva 5+500	Progresiva generada automáticamente: 5+500	5+500	5+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1032	1019-6+000	Progresiva 6+000	Progresiva generada automáticamente: 6+000	6+000	6+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1033	1019-6+500	Progresiva 6+500	Progresiva generada automáticamente: 6+500	6+500	6+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1034	1019-7+000	Progresiva 7+000	Progresiva generada automáticamente: 7+000	7+000	7+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1035	1019-7+500	Progresiva 7+500	Progresiva generada automáticamente: 7+500	7+500	7+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1036	1019-8+000	Progresiva 8+000	Progresiva generada automáticamente: 8+000	8+000	8+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1037	1019-8+500	Progresiva 8+500	Progresiva generada automáticamente: 8+500	8+500	8+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1038	1019-9+000	Progresiva 9+000	Progresiva generada automáticamente: 9+000	9+000	9+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1039	1019-9+500	Progresiva 9+500	Progresiva generada automáticamente: 9+500	9+500	9+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1040	1019-10+000	Progresiva 10+000	Progresiva generada automáticamente: 10+000	10+000	10+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1041	1019-10+500	Progresiva 10+500	Progresiva generada automáticamente: 10+500	10+500	10+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1042	1019-11+000	Progresiva 11+000	Progresiva generada automáticamente: 11+000	11+000	11+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1043	1019-11+500	Progresiva 11+500	Progresiva generada automáticamente: 11+500	11+500	11+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1044	1019-12+000	Progresiva 12+000	Progresiva generada automáticamente: 12+000	12+000	12+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1045	1019-12+500	Progresiva 12+500	Progresiva generada automáticamente: 12+500	12+500	12+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1046	1019-13+000	Progresiva 13+000	Progresiva generada automáticamente: 13+000	13+000	13+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1047	1019-13+500	Progresiva 13+500	Progresiva generada automáticamente: 13+500	13+500	13+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1048	1019-14+000	Progresiva 14+000	Progresiva generada automáticamente: 14+000	14+000	14+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1049	1019-14+500	Progresiva 14+500	Progresiva generada automáticamente: 14+500	14+500	14+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1050	1019-15+000	Progresiva 15+000	Progresiva generada automáticamente: 15+000	15+000	15+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1051	1019-15+500	Progresiva 15+500	Progresiva generada automáticamente: 15+500	15+500	15+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1052	1019-16+000	Progresiva 16+000	Progresiva generada automáticamente: 16+000	16+000	16+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1053	1019-16+500	Progresiva 16+500	Progresiva generada automáticamente: 16+500	16+500	16+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1054	1019-17+000	Progresiva 17+000	Progresiva generada automáticamente: 17+000	17+000	17+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1055	1019-17+500	Progresiva 17+500	Progresiva generada automáticamente: 17+500	17+500	17+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1056	1019-18+000	Progresiva 18+000	Progresiva generada automáticamente: 18+000	18+000	18+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1057	1019-18+500	Progresiva 18+500	Progresiva generada automáticamente: 18+500	18+500	18+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1058	1019-19+000	Progresiva 19+000	Progresiva generada automáticamente: 19+000	19+000	19+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1059	1019-19+500	Progresiva 19+500	Progresiva generada automáticamente: 19+500	19+500	19+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1060	1019-20+000	Progresiva 20+000	Progresiva generada automáticamente: 20+000	20+000	20+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1061	1019-20+500	Progresiva 20+500	Progresiva generada automáticamente: 20+500	20+500	20+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1062	1019-21+000	Progresiva 21+000	Progresiva generada automáticamente: 21+000	21+000	21+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1063	1019-21+500	Progresiva 21+500	Progresiva generada automáticamente: 21+500	21+500	21+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1064	1019-22+000	Progresiva 22+000	Progresiva generada automáticamente: 22+000	22+000	22+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1065	1019-22+500	Progresiva 22+500	Progresiva generada automáticamente: 22+500	22+500	22+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1066	1019-23+000	Progresiva 23+000	Progresiva generada automáticamente: 23+000	23+000	23+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1067	1019-23+500	Progresiva 23+500	Progresiva generada automáticamente: 23+500	23+500	23+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1068	1019-24+000	Progresiva 24+000	Progresiva generada automáticamente: 24+000	24+000	24+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1069	1019-24+500	Progresiva 24+500	Progresiva generada automáticamente: 24+500	24+500	24+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1070	1019-25+000	Progresiva 25+000	Progresiva generada automáticamente: 25+000	25+000	25+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1071	1019-25+500	Progresiva 25+500	Progresiva generada automáticamente: 25+500	25+500	25+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1072	1019-26+000	Progresiva 26+000	Progresiva generada automáticamente: 26+000	26+000	26+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1073	1019-26+500	Progresiva 26+500	Progresiva generada automáticamente: 26+500	26+500	26+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1074	1019-27+000	Progresiva 27+000	Progresiva generada automáticamente: 27+000	27+000	27+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1075	1019-27+500	Progresiva 27+500	Progresiva generada automáticamente: 27+500	27+500	27+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1076	1019-28+000	Progresiva 28+000	Progresiva generada automáticamente: 28+000	28+000	28+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1077	1019-28+500	Progresiva 28+500	Progresiva generada automáticamente: 28+500	28+500	28+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1078	1019-29+000	Progresiva 29+000	Progresiva generada automáticamente: 29+000	29+000	29+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1079	1019-29+500	Progresiva 29+500	Progresiva generada automáticamente: 29+500	29+500	29+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1080	1019-30+000	Progresiva 30+000	Progresiva generada automáticamente: 30+000	30+000	30+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1081	1019-30+500	Progresiva 30+500	Progresiva generada automáticamente: 30+500	30+500	30+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1082	1019-31+000	Progresiva 31+000	Progresiva generada automáticamente: 31+000	31+000	31+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1083	1019-31+500	Progresiva 31+500	Progresiva generada automáticamente: 31+500	31+500	31+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1084	1019-32+000	Progresiva 32+000	Progresiva generada automáticamente: 32+000	32+000	32+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1085	1019-32+500	Progresiva 32+500	Progresiva generada automáticamente: 32+500	32+500	32+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1086	1019-33+000	Progresiva 33+000	Progresiva generada automáticamente: 33+000	33+000	33+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1087	1019-33+500	Progresiva 33+500	Progresiva generada automáticamente: 33+500	33+500	33+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1088	1019-34+000	Progresiva 34+000	Progresiva generada automáticamente: 34+000	34+000	34+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1089	1019-34+500	Progresiva 34+500	Progresiva generada automáticamente: 34+500	34+500	34+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1090	1019-35+000	Progresiva 35+000	Progresiva generada automáticamente: 35+000	35+000	35+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1091	1019-35+500	Progresiva 35+500	Progresiva generada automáticamente: 35+500	35+500	35+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1092	1019-36+000	Progresiva 36+000	Progresiva generada automáticamente: 36+000	36+000	36+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1093	1019-36+500	Progresiva 36+500	Progresiva generada automáticamente: 36+500	36+500	36+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1094	1019-37+000	Progresiva 37+000	Progresiva generada automáticamente: 37+000	37+000	37+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1095	1019-37+500	Progresiva 37+500	Progresiva generada automáticamente: 37+500	37+500	37+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1096	1019-38+000	Progresiva 38+000	Progresiva generada automáticamente: 38+000	38+000	38+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1097	1019-38+500	Progresiva 38+500	Progresiva generada automáticamente: 38+500	38+500	38+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1098	1019-39+000	Progresiva 39+000	Progresiva generada automáticamente: 39+000	39+000	39+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1099	1019-39+500	Progresiva 39+500	Progresiva generada automáticamente: 39+500	39+500	39+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1100	1019-40+000	Progresiva 40+000	Progresiva generada automáticamente: 40+000	40+000	40+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1101	1019-40+500	Progresiva 40+500	Progresiva generada automáticamente: 40+500	40+500	40+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1102	1019-41+000	Progresiva 41+000	Progresiva generada automáticamente: 41+000	41+000	41+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1103	1019-41+500	Progresiva 41+500	Progresiva generada automáticamente: 41+500	41+500	41+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1104	1019-42+000	Progresiva 42+000	Progresiva generada automáticamente: 42+000	42+000	42+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1105	1019-42+500	Progresiva 42+500	Progresiva generada automáticamente: 42+500	42+500	42+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1106	1019-43+000	Progresiva 43+000	Progresiva generada automáticamente: 43+000	43+000	43+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1107	1019-43+500	Progresiva 43+500	Progresiva generada automáticamente: 43+500	43+500	43+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1108	1019-44+000	Progresiva 44+000	Progresiva generada automáticamente: 44+000	44+000	44+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1109	1019-44+500	Progresiva 44+500	Progresiva generada automáticamente: 44+500	44+500	44+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1110	1019-45+000	Progresiva 45+000	Progresiva generada automáticamente: 45+000	45+000	45+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1111	1019-45+500	Progresiva 45+500	Progresiva generada automáticamente: 45+500	45+500	45+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1112	1019-46+000	Progresiva 46+000	Progresiva generada automáticamente: 46+000	46+000	46+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1113	1019-46+500	Progresiva 46+500	Progresiva generada automáticamente: 46+500	46+500	46+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1114	1019-47+000	Progresiva 47+000	Progresiva generada automáticamente: 47+000	47+000	47+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1115	1019-47+500	Progresiva 47+500	Progresiva generada automáticamente: 47+500	47+500	47+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1116	1019-48+000	Progresiva 48+000	Progresiva generada automáticamente: 48+000	48+000	48+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1117	1019-48+500	Progresiva 48+500	Progresiva generada automáticamente: 48+500	48+500	48+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1118	1019-49+000	Progresiva 49+000	Progresiva generada automáticamente: 49+000	49+000	49+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1119	1019-49+500	Progresiva 49+500	Progresiva generada automáticamente: 49+500	49+500	49+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1120	1019-50+000	Progresiva 50+000	Progresiva generada automáticamente: 50+000	50+000	50+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1121	1019-50+500	Progresiva 50+500	Progresiva generada automáticamente: 50+500	50+500	50+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1122	1019-51+000	Progresiva 51+000	Progresiva generada automáticamente: 51+000	51+000	51+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1123	1019-51+500	Progresiva 51+500	Progresiva generada automáticamente: 51+500	51+500	51+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1124	1019-52+000	Progresiva 52+000	Progresiva generada automáticamente: 52+000	52+000	52+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1125	1019-52+500	Progresiva 52+500	Progresiva generada automáticamente: 52+500	52+500	52+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1126	1019-53+000	Progresiva 53+000	Progresiva generada automáticamente: 53+000	53+000	53+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1127	1019-53+500	Progresiva 53+500	Progresiva generada automáticamente: 53+500	53+500	53+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1128	1019-54+000	Progresiva 54+000	Progresiva generada automáticamente: 54+000	54+000	54+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1129	1019-54+500	Progresiva 54+500	Progresiva generada automáticamente: 54+500	54+500	54+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1130	1019-55+000	Progresiva 55+000	Progresiva generada automáticamente: 55+000	55+000	55+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1131	1019-55+500	Progresiva 55+500	Progresiva generada automáticamente: 55+500	55+500	55+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1132	1019-56+000	Progresiva 56+000	Progresiva generada automáticamente: 56+000	56+000	56+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1133	1019-56+500	Progresiva 56+500	Progresiva generada automáticamente: 56+500	56+500	56+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1134	1019-57+000	Progresiva 57+000	Progresiva generada automáticamente: 57+000	57+000	57+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1135	1019-57+500	Progresiva 57+500	Progresiva generada automáticamente: 57+500	57+500	57+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1136	1019-58+000	Progresiva 58+000	Progresiva generada automáticamente: 58+000	58+000	58+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1137	1019-58+500	Progresiva 58+500	Progresiva generada automáticamente: 58+500	58+500	58+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1138	1019-59+000	Progresiva 59+000	Progresiva generada automáticamente: 59+000	59+000	59+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1139	1019-59+500	Progresiva 59+500	Progresiva generada automáticamente: 59+500	59+500	59+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1140	1019-60+000	Progresiva 60+000	Progresiva generada automáticamente: 60+000	60+000	60+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1141	1019-60+500	Progresiva 60+500	Progresiva generada automáticamente: 60+500	60+500	60+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1142	1019-61+000	Progresiva 61+000	Progresiva generada automáticamente: 61+000	61+000	61+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1143	1019-61+500	Progresiva 61+500	Progresiva generada automáticamente: 61+500	61+500	61+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1144	1019-62+000	Progresiva 62+000	Progresiva generada automáticamente: 62+000	62+000	62+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1145	1019-62+500	Progresiva 62+500	Progresiva generada automáticamente: 62+500	62+500	62+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1146	1019-63+000	Progresiva 63+000	Progresiva generada automáticamente: 63+000	63+000	63+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1147	1019-63+500	Progresiva 63+500	Progresiva generada automáticamente: 63+500	63+500	63+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1148	1019-64+000	Progresiva 64+000	Progresiva generada automáticamente: 64+000	64+000	64+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1149	1019-64+500	Progresiva 64+500	Progresiva generada automáticamente: 64+500	64+500	64+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1150	1019-65+000	Progresiva 65+000	Progresiva generada automáticamente: 65+000	65+000	65+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1151	1019-65+500	Progresiva 65+500	Progresiva generada automáticamente: 65+500	65+500	65+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1152	1019-66+000	Progresiva 66+000	Progresiva generada automáticamente: 66+000	66+000	66+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1153	1019-66+500	Progresiva 66+500	Progresiva generada automáticamente: 66+500	66+500	66+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1154	1019-67+000	Progresiva 67+000	Progresiva generada automáticamente: 67+000	67+000	67+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1155	1019-67+500	Progresiva 67+500	Progresiva generada automáticamente: 67+500	67+500	67+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1156	1019-68+000	Progresiva 68+000	Progresiva generada automáticamente: 68+000	68+000	68+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1157	1019-68+500	Progresiva 68+500	Progresiva generada automáticamente: 68+500	68+500	68+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1158	1019-69+000	Progresiva 69+000	Progresiva generada automáticamente: 69+000	69+000	69+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1159	1019-69+500	Progresiva 69+500	Progresiva generada automáticamente: 69+500	69+500	69+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1160	1019-70+000	Progresiva 70+000	Progresiva generada automáticamente: 70+000	70+000	70+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1161	1019-70+500	Progresiva 70+500	Progresiva generada automáticamente: 70+500	70+500	70+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1162	1019-71+000	Progresiva 71+000	Progresiva generada automáticamente: 71+000	71+000	71+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1163	1019-71+500	Progresiva 71+500	Progresiva generada automáticamente: 71+500	71+500	71+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1164	1019-72+000	Progresiva 72+000	Progresiva generada automáticamente: 72+000	72+000	72+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1165	1019-72+500	Progresiva 72+500	Progresiva generada automáticamente: 72+500	72+500	72+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1166	1019-73+000	Progresiva 73+000	Progresiva generada automáticamente: 73+000	73+000	73+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1167	1019-73+500	Progresiva 73+500	Progresiva generada automáticamente: 73+500	73+500	73+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1168	1019-74+000	Progresiva 74+000	Progresiva generada automáticamente: 74+000	74+000	74+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1169	1019-74+500	Progresiva 74+500	Progresiva generada automáticamente: 74+500	74+500	74+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1170	1019-75+000	Progresiva 75+000	Progresiva generada automáticamente: 75+000	75+000	75+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1171	1019-75+500	Progresiva 75+500	Progresiva generada automáticamente: 75+500	75+500	75+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1172	1019-76+000	Progresiva 76+000	Progresiva generada automáticamente: 76+000	76+000	76+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1173	1019-76+500	Progresiva 76+500	Progresiva generada automáticamente: 76+500	76+500	76+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1174	1019-77+000	Progresiva 77+000	Progresiva generada automáticamente: 77+000	77+000	77+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1175	1019-77+500	Progresiva 77+500	Progresiva generada automáticamente: 77+500	77+500	77+500	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
1176	1019-78+000	Progresiva 78+000	Progresiva generada automáticamente: 78+000	78+000	78+000	activo	2025-08-19 14:53:41.510762+00	2025-08-19 14:53:41.510762+00	\N	\N	2	\N	\N	\N	1019	-72.537347	-12.612858	18L	\N	\N
\.


--
-- TOC entry 5040 (class 0 OID 20558)
-- Dependencies: 338
-- Data for Name: provincias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provincias (id, nombre, codigo_provincia, codigo_departamento) FROM stdin;
\.


--
-- TOC entry 5037 (class 0 OID 20530)
-- Dependencies: 335
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proyectos (id, codigo, nombre_proyecto, descripcion_proyecto, estado, nombre_tramo, proyecto_nom, solicitante, departamento, provincia, distrito, localidad, longitud_total, progresiva_inicial, tipo_via, intervalo_manual, descripcion_larga, create_at, update_at) FROM stdin;
1	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	85520	0+000	500	\N		2025-08-07 20:42:53.739003	2025-08-07 20:42:53.739003
14	\N	\N	\N	Activo	proyecto 1	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	cusco	14785	0+000	500	\N		2025-08-08 15:05:08.946268	2025-08-08 15:05:08.946268
15	\N	\N	\N	Activo	proyecto 22121	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0801	080106	mi casa	44548	0+000	100	\N		2025-08-08 15:14:32.501231	2025-08-08 15:14:32.501231
16	\N	\N	\N	Activo	proyecto 2111122222	GERENCIA REGIONAL DE TRANSPORTES Y COMUNICACIONES	Persona Natural	08	0804	080405	rtyhhrtew	78954	0+000	500	\N		2025-08-14 15:45:37.268952	2025-08-14 15:45:37.268952
\.


--
-- TOC entry 4998 (class 0 OID 19855)
-- Dependencies: 296
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
-- TOC entry 5010 (class 0 OID 20021)
-- Dependencies: 308
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
-- TOC entry 5000 (class 0 OID 19864)
-- Dependencies: 298
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
-- TOC entry 5030 (class 0 OID 20433)
-- Dependencies: 328
-- Data for Name: rutas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rutas (id, nombre, descripcion, geom) FROM stdin;
1	Ruta Principal CU-104	Trazado de la carretera CU-104 desde el km 0+000 hasta el km 86+364.66	0102000020E610000058000000A3E6ABE4632252C0162F1686C83929C0F90E23298E2252C0E86E3205C63929C0B7AD77C9492252C0FC7E7BE8CC3729C03348669A552252C04D350E50753729C0BBB4E1B0342252C0A7CF0EB8AE3429C069465046262252C0DCEFF55A753229C0C693933FCE2152C0B9D5BD5F163029C0D53439C65F2152C0637AC2120F3029C088ABB992532152C071C63027682F29C00D648742952152C05BC70270FD2D29C0688709B4052252C071E5EC9DD12E29C083D08B248B2252C05287CBE0DE2F29C0CE458D53BE2252C0672783A3E43129C0F697DD93872252C08A0C61EB082E29C06A0B19D95F2252C0E2804C21462A29C0291197D2692252C0CB30EE06D12629C0FBA42435FE2152C0BB9A3C65352529C0BE61ECCEA42152C0E131F268992329C04520A8644A2152C0CF17D6E8302229C0138255F5F22052C09D1ECA06882029C07CF6B75F992052C0FB5C6DC5FE2229C06F06C94C332052C08BDF14562A2429C0A49531F4BE1F52C0B4D3C55C082429C08E41823D811F52C09F8724C4A62329C040B2CA96761F52C02A77FA9C162329C0049376FEC81F52C0D57F31B66B2129C0CA3505323B2052C037CFC76B142029C06872D64C632052C04716D5C7E81D29C035666DAE752052C03DF372D87D1B29C0B74B76C73D2052C09FF0C80EE01729C0FEE208081C2052C0FACF9A1F7F1529C0B72572C1992052C0626AA6D6561729C078FAF7CF092152C0AF1E9CF4631829C08D936703552152C03925C56C6E1529C096D86B30432152C0322DFBBF341229C04E8061F9732152C038AFA01FFC0E29C070F893E7302152C0C3C8DCC6B00C29C0BCB3D194F82052C0FCF37EEDAA0929C068F1BD1A7B2052C098A59D9ACB0929C0D62F229B752052C03E5700F84C0729C0A798DE59962052C09E0AB8E7F90329C075351E11782052C0375E70BCF10029C0D23A0554132052C0DF88EE59D70029C07EB4EED5FD1F52C0B6BC72BD6DFE28C01416269D122052C0853BBC8C07FC28C046F2F0F9BC1F52C0CA49CDC3AEFA28C04404D2B47A1F52C0C31D5EC603F828C0A1CF91A60B1F52C07D2079E750F628C03AA5CD821A1F52C063A6A3D23EF428C0E51714BC571F52C0365A0EF450F328C08B7BE2EFCD1F52C0C82A0021EDF228C083E794360B2052C038A51710B5F028C058569A94022052C076DD5B9198EC28C03EF1F7E6122052C05194957032EB28C0D089F326F51F52C00D3DBDAD4FE828C01277AB9D172052C0C1DDFE017BE928C00D78F41A162052C0B61490F63FE828C09808652BF91F52C05F8A613DA4E628C0A0C37C79012052C042BE3A7DF3E528C0C41CA963BA1F52C01C2E28C23CE628C0A5F622DA0E2052C0C5724BAB21E528C0437AE5D5142052C081221631ECE428C0EA36F28AF11F52C0AFA8D26064E328C0495EE7F0DA1F52C0787E5182FEE228C08449F1F1891F52C0408A3A730FE528C05688A29BD81F52C0FD5B131CA8E128C086C03687102052C0D8800871E5E028C0588D25AC0D2052C0D690B8C7D2DF28C07F4DD6A8072052C028A490BF0FDE28C0499B4FC2F11F52C0CF09EB1049DE28C0199936D2082052C01F29C709B8DC28C0388600E0D81F52C039E9222AF9DD28C09E78CE16901F52C0B91D75CF15E028C0AAD15048571F52C0A18FE854E8E228C0D862B7CF2A1F52C00971E5EC9DE128C02D060FD3BE1E52C066F4A3E194E128C03A234A7B831E52C013EF004F5AE028C02992AF04521E52C058AEB7CD54E028C068588CBAD61D52C0FBAC32535ADF28C0F31FD26F5F1D52C00CCB9F6F0BDE28C0081F4AB4E41C52C0D447E00F3FDF28C033FB3C46791C52C0FB027AE1CEDD28C0C0E95DBC1F1C52C001FBE8D495DF28C0E9297288B81B52C08E06F01648E028C0209A79724D1B52C0CBF8F71917DE28C0376C5B94D91A52C08735954561DF28C0C651B9895A1A52C0C784984BAADE28C00F0C207C281A52C0DD5B9198A0DE28C0
\.


--
-- TOC entry 4549 (class 0 OID 18360)
-- Dependencies: 226
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5016 (class 0 OID 20164)
-- Dependencies: 314
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
-- TOC entry 5014 (class 0 OID 20156)
-- Dependencies: 312
-- Data for Name: tipo_via; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipo_via (id, descripcion, created_at, codigo) FROM stdin;
100	TIPO I - Autopistas (100m)	2025-08-15 16:20:32.498593	T1     
250	Tipo II - Vias principales (250m)	2025-08-15 16:20:32.498593	T2     
500	Tipo III - Vias secundarias (500m)	2025-08-15 16:20:32.498593	T3     
1000	Tipo IV Vias locales (1000m)	2025-08-15 16:20:32.498593	T4     
\.


--
-- TOC entry 5035 (class 0 OID 20500)
-- Dependencies: 333
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
-- TOC entry 4989 (class 0 OID 19731)
-- Dependencies: 287
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
-- TOC entry 5018 (class 0 OID 20230)
-- Dependencies: 316
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
-- TOC entry 5002 (class 0 OID 19966)
-- Dependencies: 300
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
-- TOC entry 4553 (class 0 OID 19306)
-- Dependencies: 237
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- TOC entry 4554 (class 0 OID 19638)
-- Dependencies: 282
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4555 (class 0 OID 19648)
-- Dependencies: 284
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4556 (class 0 OID 19658)
-- Dependencies: 286
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- TOC entry 4551 (class 0 OID 19123)
-- Dependencies: 231
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- TOC entry 4552 (class 0 OID 19135)
-- Dependencies: 232
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 309
-- Name: anuncios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anuncios_id_seq', 59, true);


--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 301
-- Name: auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auditoria_id_seq', 1, false);


--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 321
-- Name: changelogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.changelogs_id_seq', 5, true);


--
-- TOC entry 5082 (class 0 OID 0)
-- Dependencies: 339
-- Name: distritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.distritos_id_seq', 1, false);


--
-- TOC entry 5083 (class 0 OID 0)
-- Dependencies: 303
-- Name: ensayos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ensayos_id_seq', 39, true);


--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 291
-- Name: especialidad_visibilidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidad_visibilidad_id_seq', 1, false);


--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 289
-- Name: especialidades_codigo_esp_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_codigo_esp_seq', 1, false);


--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 319
-- Name: especialidades_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_navbar_options_id_seq', 1, false);


--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 326
-- Name: estratos_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_codigo_seq', 5, true);


--
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 324
-- Name: estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estratos_id_seq', 5, true);


--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 305
-- Name: navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.navbar_options_id_seq', 22, true);


--
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 293
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permisos_id_seq', 9, true);


--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 329
-- Name: progresiva_perfil_estratos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresiva_perfil_estratos_id_seq', 26, true);


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 317
-- Name: progresivas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progresivas_id_seq', 1176, true);


--
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 337
-- Name: provincias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provincias_id_seq', 1, false);


--
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 334
-- Name: proyectos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proyectos_id_seq', 16, true);


--
-- TOC entry 5095 (class 0 OID 0)
-- Dependencies: 295
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- TOC entry 5096 (class 0 OID 0)
-- Dependencies: 307
-- Name: roles_navbar_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_navbar_options_id_seq', 367, true);


--
-- TOC entry 5097 (class 0 OID 0)
-- Dependencies: 297
-- Name: roles_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_permisos_id_seq', 59, true);


--
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 327
-- Name: rutas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rutas_id_seq', 1, true);


--
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 313
-- Name: tipo_ensayo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_ensayo_id_seq', 28, true);


--
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 323
-- Name: tipo_via_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_via_codigo_seq', 1, false);


--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 311
-- Name: tipo_via_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipo_via_id_seq', 7, true);


--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 332
-- Name: trafico_imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trafico_imagenes_id_seq', 73, true);


--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 288
-- Name: tusuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tusuarios_id_seq', 5, true);


--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 315
-- Name: user_permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permisos_id_seq', 23, true);


--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 299
-- Name: usuariost_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuariost_id_seq', 39, true);


--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 230
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: postgres
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- TOC entry 4765 (class 2606 OID 20139)
-- Name: anuncios anuncios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_pkey PRIMARY KEY (id);


--
-- TOC entry 4753 (class 2606 OID 19996)
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);


--
-- TOC entry 4785 (class 2606 OID 20324)
-- Name: changelogs changelogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs
    ADD CONSTRAINT changelogs_pkey PRIMARY KEY (id);


--
-- TOC entry 4787 (class 2606 OID 20326)
-- Name: changelogs changelogs_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.changelogs
    ADD CONSTRAINT changelogs_version_key UNIQUE (version);


--
-- TOC entry 4806 (class 2606 OID 20547)
-- Name: codigo_departamentos codigo_departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.codigo_departamentos
    ADD CONSTRAINT codigo_departamentos_pkey PRIMARY KEY (codigo_departamento);


--
-- TOC entry 4812 (class 2606 OID 20579)
-- Name: distritos distritos_codigo_distrito_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_codigo_distrito_key UNIQUE (codigo_distrito);


--
-- TOC entry 4814 (class 2606 OID 20577)
-- Name: distritos distritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_pkey PRIMARY KEY (id);


--
-- TOC entry 4799 (class 2606 OID 20498)
-- Name: elementos_trafico elementos_trafico_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.elementos_trafico
    ADD CONSTRAINT elementos_trafico_pkey PRIMARY KEY (id);


--
-- TOC entry 4755 (class 2606 OID 20010)
-- Name: ensayos ensayos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT ensayos_pkey PRIMARY KEY (id);


--
-- TOC entry 4741 (class 2606 OID 19839)
-- Name: especialidad_visibilidad especialidad_visibilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad
    ADD CONSTRAINT especialidad_visibilidad_pkey PRIMARY KEY (id);


--
-- TOC entry 4781 (class 2606 OID 20302)
-- Name: especialidades_navbar_options especialidades_navbar_options_especialidad_id_navbar_option_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_especialidad_id_navbar_option_key UNIQUE (especialidad_id, navbar_option_id);


--
-- TOC entry 4783 (class 2606 OID 20300)
-- Name: especialidades_navbar_options especialidades_navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4739 (class 2606 OID 19832)
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (codigo_esp);


--
-- TOC entry 4789 (class 2606 OID 20393)
-- Name: estratos estratos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos
    ADD CONSTRAINT estratos_codigo_key UNIQUE (codigo);


--
-- TOC entry 4791 (class 2606 OID 20391)
-- Name: estratos estratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estratos
    ADD CONSTRAINT estratos_pkey PRIMARY KEY (id);


--
-- TOC entry 4757 (class 2606 OID 20019)
-- Name: navbar_options navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options
    ADD CONSTRAINT navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4743 (class 2606 OID 19853)
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4795 (class 2606 OID 20460)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_pkey PRIMARY KEY (id);


--
-- TOC entry 4797 (class 2606 OID 20462)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_progresiva_id_orden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_orden_key UNIQUE (progresiva_id, orden);


--
-- TOC entry 4777 (class 2606 OID 20275)
-- Name: progresivas progresivas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_codigo_key UNIQUE (codigo);


--
-- TOC entry 4779 (class 2606 OID 20273)
-- Name: progresivas progresivas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_pkey PRIMARY KEY (id);


--
-- TOC entry 4808 (class 2606 OID 20565)
-- Name: provincias provincias_codigo_provincia_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_codigo_provincia_key UNIQUE (codigo_provincia);


--
-- TOC entry 4810 (class 2606 OID 20563)
-- Name: provincias provincias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_pkey PRIMARY KEY (id);


--
-- TOC entry 4804 (class 2606 OID 20539)
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- TOC entry 4761 (class 2606 OID 20027)
-- Name: roles_navbar_options roles_navbar_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4747 (class 2606 OID 19869)
-- Name: roles_permisos roles_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4745 (class 2606 OID 19862)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4793 (class 2606 OID 20440)
-- Name: rutas rutas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas
    ADD CONSTRAINT rutas_pkey PRIMARY KEY (id);


--
-- TOC entry 4771 (class 2606 OID 20170)
-- Name: tipo_ensayo tipo_ensayo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_ensayo
    ADD CONSTRAINT tipo_ensayo_pkey PRIMARY KEY (id);


--
-- TOC entry 4767 (class 2606 OID 20162)
-- Name: tipo_via tipo_via_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via
    ADD CONSTRAINT tipo_via_pkey PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 20509)
-- Name: trafico_imagenes trafico_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT trafico_imagenes_pkey PRIMARY KEY (id);


--
-- TOC entry 4737 (class 2606 OID 19746)
-- Name: tusuarios tusuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tusuarios
    ADD CONSTRAINT tusuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4759 (class 2606 OID 20292)
-- Name: navbar_options unique_navbar_option_link; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navbar_options
    ADD CONSTRAINT unique_navbar_option_link UNIQUE (link);


--
-- TOC entry 4763 (class 2606 OID 20314)
-- Name: roles_navbar_options unique_role_navbar_option; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT unique_role_navbar_option UNIQUE (role_id, navbar_option_id);


--
-- TOC entry 4769 (class 2606 OID 20370)
-- Name: tipo_via uq_tipo_via_codigo; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipo_via
    ADD CONSTRAINT uq_tipo_via_codigo UNIQUE (codigo);


--
-- TOC entry 4773 (class 2606 OID 20235)
-- Name: user_permisos user_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_pkey PRIMARY KEY (id);


--
-- TOC entry 4775 (class 2606 OID 20237)
-- Name: user_permisos user_permisos_user_id_permiso_id_tipo_acceso_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_user_id_permiso_id_tipo_acceso_key UNIQUE (user_id, permiso_id, tipo_acceso);


--
-- TOC entry 4749 (class 2606 OID 19976)
-- Name: usuariost usuariost_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_dni_key UNIQUE (dni);


--
-- TOC entry 4751 (class 2606 OID 19974)
-- Name: usuariost usuariost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_pkey PRIMARY KEY (id);


--
-- TOC entry 4800 (class 1259 OID 20515)
-- Name: idx_trafico_imagenes_station_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_trafico_imagenes_station_id ON public.trafico_imagenes USING btree (station_id);


--
-- TOC entry 4824 (class 2606 OID 20140)
-- Name: anuncios anuncios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anuncios
    ADD CONSTRAINT anuncios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);


--
-- TOC entry 4820 (class 2606 OID 19997)
-- Name: auditoria auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuariost(id);


--
-- TOC entry 4838 (class 2606 OID 20580)
-- Name: distritos distritos_codigo_provincia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_codigo_provincia_fkey FOREIGN KEY (codigo_provincia) REFERENCES public.provincias(codigo_provincia);


--
-- TOC entry 4815 (class 2606 OID 19840)
-- Name: especialidad_visibilidad especialidad_visibilidad_codigo_esp_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidad_visibilidad
    ADD CONSTRAINT especialidad_visibilidad_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4832 (class 2606 OID 20303)
-- Name: especialidades_navbar_options especialidades_navbar_options_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4833 (class 2606 OID 20308)
-- Name: especialidades_navbar_options especialidades_navbar_options_navbar_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades_navbar_options
    ADD CONSTRAINT especialidades_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);


--
-- TOC entry 4827 (class 2606 OID 20410)
-- Name: progresivas fk_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;


--
-- TOC entry 4828 (class 2606 OID 20376)
-- Name: progresivas fk_progresivas_tipo_ensayo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_progresivas_tipo_ensayo FOREIGN KEY (tipo_ensayo) REFERENCES public.tipo_ensayo(id);


--
-- TOC entry 4829 (class 2606 OID 20371)
-- Name: progresivas fk_progresivas_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT fk_progresivas_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- TOC entry 4836 (class 2606 OID 20510)
-- Name: trafico_imagenes fk_station; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trafico_imagenes
    ADD CONSTRAINT fk_station FOREIGN KEY (station_id) REFERENCES public.elementos_trafico(id) ON DELETE CASCADE;


--
-- TOC entry 4821 (class 2606 OID 20176)
-- Name: ensayos fk_tipo_via; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ensayos
    ADD CONSTRAINT fk_tipo_via FOREIGN KEY (tipo_via) REFERENCES public.tipo_via(id);


--
-- TOC entry 4834 (class 2606 OID 20468)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_estrato_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_estrato_id_fkey FOREIGN KEY (estrato_id) REFERENCES public.estratos(id);


--
-- TOC entry 4835 (class 2606 OID 20463)
-- Name: progresiva_perfil_estratos progresiva_perfil_estratos_progresiva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresiva_perfil_estratos
    ADD CONSTRAINT progresiva_perfil_estratos_progresiva_id_fkey FOREIGN KEY (progresiva_id) REFERENCES public.progresivas(id) ON DELETE CASCADE;


--
-- TOC entry 4830 (class 2606 OID 20276)
-- Name: progresivas progresivas_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuariost(id);


--
-- TOC entry 4831 (class 2606 OID 20405)
-- Name: progresivas progresivas_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresivas
    ADD CONSTRAINT progresivas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.progresivas(id);


--
-- TOC entry 4837 (class 2606 OID 20566)
-- Name: provincias provincias_codigo_departamento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provincias
    ADD CONSTRAINT provincias_codigo_departamento_fkey FOREIGN KEY (codigo_departamento) REFERENCES public.codigo_departamentos(codigo_departamento);


--
-- TOC entry 4822 (class 2606 OID 20033)
-- Name: roles_navbar_options roles_navbar_options_navbar_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_navbar_option_id_fkey FOREIGN KEY (navbar_option_id) REFERENCES public.navbar_options(id);


--
-- TOC entry 4823 (class 2606 OID 20028)
-- Name: roles_navbar_options roles_navbar_options_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_navbar_options
    ADD CONSTRAINT roles_navbar_options_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- TOC entry 4816 (class 2606 OID 19875)
-- Name: roles_permisos roles_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id);


--
-- TOC entry 4817 (class 2606 OID 19870)
-- Name: roles_permisos roles_permisos_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permisos
    ADD CONSTRAINT roles_permisos_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- TOC entry 4825 (class 2606 OID 20243)
-- Name: user_permisos user_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id) ON DELETE CASCADE;


--
-- TOC entry 4826 (class 2606 OID 20238)
-- Name: user_permisos user_permisos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permisos
    ADD CONSTRAINT user_permisos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuariost(id) ON DELETE CASCADE;


--
-- TOC entry 4818 (class 2606 OID 19977)
-- Name: usuariost usuariost_codigo_esp_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_codigo_esp_fkey FOREIGN KEY (codigo_esp) REFERENCES public.especialidades(codigo_esp);


--
-- TOC entry 4819 (class 2606 OID 19982)
-- Name: usuariost usuariost_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuariost
    ADD CONSTRAINT usuariost_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


-- Completed on 2025-08-19 11:00:02

--
-- PostgreSQL database dump complete
--

--
-- Database "template_postgis" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Debian 17.0-1.pgdg110+1)
-- Dumped by pg_dump version 17.5

-- Started on 2025-08-19 11:00:02

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
-- TOC entry 4707 (class 1262 OID 16384)
-- Name: template_postgis; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE template_postgis WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template_postgis OWNER TO postgres;

\connect template_postgis

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
-- TOC entry 4708 (class 0 OID 0)
-- Name: template_postgis; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE template_postgis IS_TEMPLATE = true;
ALTER DATABASE template_postgis SET search_path TO '$user', 'public', 'topology', 'tiger';


\connect template_postgis

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
-- TOC entry 11 (class 2615 OID 17642)
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- TOC entry 12 (class 2615 OID 17898)
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- TOC entry 10 (class 2615 OID 17463)
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- TOC entry 4709 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- TOC entry 4 (class 3079 OID 17630)
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- TOC entry 4710 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- TOC entry 2 (class 3079 OID 16385)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 4711 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 5 (class 3079 OID 17643)
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- TOC entry 4712 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- TOC entry 3 (class 3079 OID 17464)
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- TOC entry 4713 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- TOC entry 4413 (class 0 OID 16703)
-- Dependencies: 225
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 4417 (class 0 OID 17649)
-- Dependencies: 236
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- TOC entry 4418 (class 0 OID 17981)
-- Dependencies: 281
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4419 (class 0 OID 17991)
-- Dependencies: 283
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- TOC entry 4420 (class 0 OID 18001)
-- Dependencies: 285
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- TOC entry 4415 (class 0 OID 17466)
-- Dependencies: 230
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- TOC entry 4416 (class 0 OID 17478)
-- Dependencies: 231
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- TOC entry 4714 (class 0 OID 0)
-- Dependencies: 229
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: postgres
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


-- Completed on 2025-08-19 11:00:28

--
-- PostgreSQL database dump complete
--

-- Completed on 2025-08-19 11:00:28

--
-- PostgreSQL database cluster dump complete
--

