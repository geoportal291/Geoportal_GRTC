/**
 * patronesEstratoService.js
 * ---------------------------------------------------------------------------
 * Catalogo de patrones de rayado (hatching) para el visor de "Perfil
 * Estratigrafico". Lee el diccionario suelos_diccionario_nlp y resuelve,
 * para un nombre de material en texto libre, el patron SVG y el color que
 * debe dibujar el frontend.
 *
 * Nota: la columna patron_svg (migracion 047) puede no existir todavia en
 * algunas BD. Si el SELECT falla por esa columna, se registra un warning y
 * se continua con todos los patrones como 'generico'. NO se hace ALTER TABLE
 * en runtime.
 */

const db = require('../conexion');

const TTL_CACHE_MS = 5 * 60 * 1000; // 5 minutos

// Cache en memoria del catalogo (evita golpear la BD en cada request)
let cache = {
    catalogo: null,      // array de patrones crudos de la BD
    mapa: null,          // Map nombreNormalizado -> patron
    cargadoEn: 0,
    patronDisponible: true // false si detectamos que la columna patron_svg no existe
};

const PATRON_FALLBACK = 'generico';
const COLOR_FALLBACK = '#F2F2F2';

// ---------------------------------------------------------------------------
// Normalizacion de texto: minusculas, sin acentos, trim, espacios colapsados
// ---------------------------------------------------------------------------
const normalizarTexto = (texto) => {
    if (!texto || typeof texto !== 'string') return '';
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
};

// ---------------------------------------------------------------------------
// Consulta al diccionario. Maneja con gracia el error "columna patron_svg
// no existe" (codigo 42703 en PostgreSQL): reintenta sin la columna y marca
// la cache para no reintentar en cada request.
// ---------------------------------------------------------------------------
const cargarCatalogoDesdeBD = async () => {
    if (cache.patronDisponible) {
        try {
            const result = await db.query(`
                SELECT id, nombre_original_excel, clasificacion_sucs, clasificacion_aashto,
                       color_hex_sugerido, patron_svg
                FROM suelos_diccionario_nlp
                WHERE es_verificado_por_humano IS NOT FALSE
                ORDER BY LENGTH(nombre_original_excel) DESC
            `);
            return result.rows;
        } catch (err) {
            // 42703 = undefined_column: la migracion 047 aun no se aplico
            if (err && (err.code === '42703' || /patron_svg/i.test(err.message || ''))) {
                console.warn('[patronesEstratoService] La columna patron_svg no existe todavia (migracion 047 pendiente). Se continua con patron "generico" para todos los estratos.');
                cache.patronDisponible = false;
            } else {
                throw err;
            }
        }
    }
    // Fallback sin patron_svg (o reintento tras el warning)
    const result = await db.query(`
        SELECT id, nombre_original_excel, clasificacion_sucs, clasificacion_aashto,
               color_hex_sugerido, NULL::varchar AS patron_svg
        FROM suelos_diccionario_nlp
        WHERE es_verificado_por_humano IS NOT FALSE
        ORDER BY LENGTH(nombre_original_excel) DESC
    `);
    return result.rows.map((row) => ({ ...row, patron_svg: PATRON_FALLBACK }));
};

// ---------------------------------------------------------------------------
// Catalogo con cache TTL de 5 minutos. Adjunta vistas preordenadas del
// catalogo (por longitud de nombre y por longitud de SUCS) para que
// matchPatron no tenga que reordenar por cada estrato.
// ---------------------------------------------------------------------------
const prepararVistasOrdenadas = (catalogo) => {
    catalogo.porNombre = [...catalogo].sort(
        (x, y) => normalizarTexto(y.nombre_original_excel).length - normalizarTexto(x.nombre_original_excel).length
    );
    catalogo.porSucs = catalogo
        .filter((p) => p.clasificacion_sucs)
        .sort((x, y) => (y.clasificacion_sucs.length - x.clasificacion_sucs.length));
    return catalogo;
};

const getCatalogoPatrones = async () => {
    const ahora = Date.now();
    if (cache.catalogo && ahora - cache.cargadoEn < TTL_CACHE_MS) {
        return cache.catalogo;
    }
    const catalogo = await cargarCatalogoDesdeBD();
    prepararVistasOrdenadas(catalogo);
    cache.catalogo = catalogo;
    cache.cargadoEn = ahora;
    return catalogo;
};

// ---------------------------------------------------------------------------
// Map cacheado: nombre normalizado -> patron. Para lookups rapidos y para
// la leyenda del frontend.
// ---------------------------------------------------------------------------
const getPatronesPorNombre = async () => {
    const ahora = Date.now();
    if (cache.mapa && ahora - cache.cargadoEn < TTL_CACHE_MS) {
        return cache.mapa;
    }
    const catalogo = await getCatalogoPatrones();
    const mapa = new Map();
    for (const patron of catalogo) {
        const clave = normalizarTexto(patron.nombre_original_excel);
        if (clave && !mapa.has(clave)) {
            mapa.set(clave, patron);
        }
    }
    cache.mapa = mapa;
    return mapa;
};

// ---------------------------------------------------------------------------
// Reglas de patron por clasificacion SUCS del estrato (estrategia d)
// ---------------------------------------------------------------------------
const patronPorClasificacionSucs = (sucs) => {
    if (!sucs || typeof sucs !== 'string') return null;
    const s = sucs.trim().toUpperCase();
    if (s.startsWith('GW') || s.startsWith('GP')) return 'grava';
    if (s.startsWith('SW') || s.startsWith('SP') || s.startsWith('SM')) return 'arena';
    if (s.startsWith('ML') || s.startsWith('MH')) return 'limo';
    if (s.startsWith('CL') || s.startsWith('CH')) return 'arcilla';
    if (s.startsWith('R')) return 'roca';
    return null;
};

// ---------------------------------------------------------------------------
// matchPatron(nombreEstrato, catalogo, clasificacionSucsEstrato)
// Devuelve el diseno (patron + color) para un nombre de material libre.
// Estrategias en orden:
//   a) Coincidencia exacta (normalizada) con nombre_original_excel
//   b) Prefijo de clasificacion_sucs del patron contra la del estrato
//   c) El nombre del estrato CONTIENE el nombre del patron (mas largo primero)
//   d) Reglas por clasificacion_sucs del estrato (GW/GP->grava, etc.)
//   e) Fallback generico
// ---------------------------------------------------------------------------
const matchPatron = (nombreEstrato, catalogo, clasificacionSucsEstrato = null) => {
    const nombreNorm = normalizarTexto(nombreEstrato);

    const armarResultado = (patron, matched) => ({
        id: patron ? patron.id : null,
        nombre_material: patron ? patron.nombre_original_excel : (nombreEstrato || null),
        clasificacion_sucs: patron ? patron.clasificacion_sucs : (clasificacionSucsEstrato || null),
        color_hex_sugerido: (patron && patron.color_hex_sugerido) || COLOR_FALLBACK,
        patron_svg: (patron && patron.patron_svg) || PATRON_FALLBACK,
        matched
    });

    // (a) Coincidencia exacta normalizada
    if (nombreNorm) {
        const exacto = catalogo.find(
            (p) => normalizarTexto(p.nombre_original_excel) === nombreNorm
        );
        if (exacto) return armarResultado(exacto, true);
    }

    // (b) Prefijo de clasificacion_sucs del patron contra la del estrato
    const sucsEstrato = (clasificacionSucsEstrato || '').trim().toUpperCase();
    if (sucsEstrato) {
        const porSucs = catalogo.porSucs
            || catalogo.filter((p) => p.clasificacion_sucs)
                .sort((x, y) => (y.clasificacion_sucs.length - x.clasificacion_sucs.length));
        const porSucsMatch = porSucs.find(
            (p) => sucsEstrato.startsWith(p.clasificacion_sucs.trim().toUpperCase())
        );
        if (porSucsMatch) return armarResultado(porSucsMatch, true);
    }

    // (c) Contencion de nombre (el patron mas largo primero para que
    //     'roca fracturada' gane a 'roca')
    if (nombreNorm) {
        const catalogoOrdenado = catalogo.porNombre
            || [...catalogo].sort(
                (x, y) => normalizarTexto(y.nombre_original_excel).length - normalizarTexto(x.nombre_original_excel).length
            );
        const contenido = catalogoOrdenado.find((p) => {
            const nombrePatron = normalizarTexto(p.nombre_original_excel);
            return nombrePatron && nombreNorm.includes(nombrePatron);
        });
        if (contenido) return armarResultado(contenido, true);
    }

    // (d) Reglas por clasificacion_sucs del estrato
    const patronRegla = patronPorClasificacionSucs(sucsEstrato);
    if (patronRegla) {
        return {
            id: null,
            nombre_material: nombreEstrato || null,
            clasificacion_sucs: sucsEstrato,
            color_hex_sugerido: COLOR_FALLBACK,
            patron_svg: patronRegla,
            matched: true
        };
    }

    // (e) Fallback generico
    return {
        id: null,
        nombre_material: nombreEstrato || null,
        clasificacion_sucs: clasificacionSucsEstrato || null,
        color_hex_sugerido: COLOR_FALLBACK,
        patron_svg: PATRON_FALLBACK,
        matched: false
    };
};

// Permite invalidar la cache manualmente (p.ej. tras aplicar la migracion 047).
// Reactiva el intento de lectura de patron_svg por si la migracion se aplico
// despues de arrancar el proceso.
const invalidarCache = () => {
    cache = { catalogo: null, mapa: null, cargadoEn: 0, patronDisponible: true };
};

module.exports = {
    getCatalogoPatrones,
    getPatronesPorNombre,
    matchPatron,
    normalizarTexto,
    invalidarCache
};
