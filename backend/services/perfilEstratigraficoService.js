/**
 * perfilEstratigraficoService.js
 * ---------------------------------------------------------------------------
 * Armado del perfil estratigrafico de un tramo para el visor estilo Autodesk:
 * sub-progresivas ordenadas por estacion, cada una con sus estratos (con el
 * patron visual resuelto desde suelos_diccionario_nlp via patronesEstratoService)
 * y sus ensayos con la config necesaria para que el frontend recalcule
 * resultados con el mismo motor de la vista de ensayos.
 *
 * Queries siempre parametrizadas. limit/offset sanitizados (limit en [1,200]).
 */

const db = require('../conexion');
const patronesService = require('./patronesEstratoService');

// Sanitiza limit/offset provenientes de query params
const sanitizarPaginacion = ({ limit, offset }) => {
    let lim = Number.parseInt(limit, 10);
    if (Number.isNaN(lim)) lim = 20;
    lim = Math.max(1, Math.min(200, lim));

    let off = Number.parseInt(offset, 10);
    if (Number.isNaN(off)) off = 0;
    off = Math.max(0, off);

    return { lim, off };
};

// --- Sanitización ------------------------------------------------------------
const getTramoIdNumerico = (tramoId) => {
    const n = Number(tramoId);
    if (!Number.isInteger(n) || n <= 0) {
        const err = new Error('tramoId inválido');
        err.status = 400;
        throw err;
    }
    return n;
};

const getPerfilEstratigrafico = async (tramoId, { limit = 20, offset = 0, soloConDatos = true } = {}) => {
    const { lim, off } = sanitizarPaginacion({ limit, offset });
    const tramoIdNum = getTramoIdNumerico(tramoId);

    // 1. Validar tramo (progresiva raiz sin padre)
    const tramoResult = await db.query(
        'SELECT id, codigo, nombre FROM progresivas WHERE id = $1 AND parent_id IS NULL',
        [tramoIdNum]
    );
    if (tramoResult.rows.length === 0) {
        const err = new Error('Tramo no encontrado');
        err.status = 404;
        throw err;
    }
    const tramo = tramoResult.rows[0];

    // Filtro opcional: solo progresivas con datos — se considera "con datos"
    // aquellas que tienen al menos un estrato CON ensayos asociados
    // (por defecto TRUE: el perfil es para graficar estratos con ensayos).
    const filtroConDatos = soloConDatos
        ? " AND EXISTS (SELECT 1 FROM estratos e WHERE e.parent_type = 'progresiva' AND e.parent_id = p.id AND EXISTS (SELECT 1 FROM ensayos ens WHERE ens.estrato_id = e.id))"
        : '';

    // 2. Total de sub-progresivas segun el modo (para paginacion por bloques)
    const countResult = await db.query(
        `SELECT COUNT(*) AS total FROM progresivas p WHERE p.parent_id = $1${filtroConDatos}`,
        [tramoIdNum]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // 3. Sub-progresivas ordenadas por estacion (mismo criterio numerico que
    //    usa getSubProgresivas: solo digitos del codigo) con paginado.
    //    Si la columna elevacion aun no existe (la agrega asegurarColumnas),
    //    se reintenta sin ella (42703 = undefined_column).
    const queryProgresivas = (conElevacion) => `
        SELECT
            p.id, p.parent_id, p.proyecto_id, p.codigo, COALESCE(p.nombre, '') AS nombre,
            p.progresiva_inicial, p.progresiva_final,
            p.coordenada_este, p.coordenada_norte,
            ${conElevacion ? 'p.elevacion,' : 'NULL AS elevacion,'} p.linea, p.lado
        FROM progresivas p
        WHERE p.parent_id = $1${filtroConDatos}
        ORDER BY NULLIF(regexp_replace(p.codigo, '[^0-9]', '', 'g'), '')::numeric ASC, p.id ASC
        LIMIT $2 OFFSET $3
    `;
    let progresivas;
    try {
        const result = await db.query(queryProgresivas(true), [tramoIdNum, lim, off]);
        progresivas = result.rows;
    } catch (err) {
        if (err && err.code === '42703') {
            console.warn('[perfilEstratigraficoService] Columna elevacion no disponible; se devuelve NULL.');
            const result = await db.query(queryProgresivas(false), [tramoIdNum, lim, off]);
            progresivas = result.rows;
        } else {
            throw err;
        }
    }

    if (progresivas.length === 0) {
        const catalogo = await patronesService.getCatalogoPatrones();
        return { tramo, total, progresivas: [], patrones: catalogo };
    }

    const progresivaIds = progresivas.map((p) => p.id);

    // 4. Estratos de esas progresivas
    const estratosResult = await db.query(`
        SELECT
            e.id, e.parent_id AS progresiva_id, e.nombre, e.descripcion,
            e.cota_inicial AS profundidad_inicial, e.cota_final AS profundidad_final,
            e.orden, e.nlp_clasificacion_sucs, e.nlp_clasificacion_aashto, e.nlp_color_hex
        FROM estratos e
        WHERE e.parent_type = 'progresiva' AND e.parent_id = ANY($1::int[])
        ORDER BY e.parent_id, e.cota_inicial ASC, e.orden ASC
    `, [progresivaIds]);
    const estratos = estratosResult.rows;
    const estratoIds = estratos.map((e) => e.id);

    // 5. Ensayos anidados por estrato (mismos campos que usa getSubProgresivas,
    //    mas config_calculos/config_graficos para el recálculo en cliente)
    const ensayosMap = new Map();
    if (estratoIds.length > 0) {
        const ensayosResult = await db.query(`
            SELECT
                ens.id, ens.nombre_ensayo, ens.codigo_ensayo, ens.fecha,
                ens.resultado, ens.estado, ens.tipo_ensayo, ens.estrato_id,
                ens.datos_formulario,
                te.descripcion AS tipo_ensayo_descripcion,
                te.config_key, te.results_config, te.config_tabla,
                te.config_calculos, te.config_graficos
            FROM ensayos ens
            LEFT JOIN tipo_ensayo te ON ens.tipo_ensayo = te.id
            WHERE ens.estrato_id = ANY($1::int[])
            ORDER BY ens.fecha DESC
        `, [estratoIds]);
        for (const ensayo of ensayosResult.rows) {
            if (!ensayosMap.has(ensayo.estrato_id)) {
                ensayosMap.set(ensayo.estrato_id, []);
            }
            ensayosMap.get(ensayo.estrato_id).push(ensayo);
        }
    }

    // 6. Resolver patron visual de cada estrato desde el catalogo en BD
    const catalogo = await patronesService.getCatalogoPatrones();

    const estratosConPatron = estratos.map((estrato) => ({
        id: estrato.id,
        progresiva_id: estrato.progresiva_id,
        nombre: estrato.nombre,
        descripcion: estrato.descripcion,
        profundidad_inicial: estrato.profundidad_inicial,
        profundidad_final: estrato.profundidad_final,
        orden: estrato.orden,
        patron: patronesService.matchPatron(
            estrato.nombre,
            catalogo,
            estrato.nlp_clasificacion_sucs
        ),
        ensayos: ensayosMap.get(estrato.id) || []
    }));

    const estratosPorProgresiva = new Map();
    for (const estrato of estratosConPatron) {
        if (!estratosPorProgresiva.has(estrato.progresiva_id)) {
            estratosPorProgresiva.set(estrato.progresiva_id, []);
        }
        estratosPorProgresiva.get(estrato.progresiva_id).push(estrato);
    }

    const data = progresivas.map((p) => ({
        ...p,
        estratos: estratosPorProgresiva.get(p.id) || []
    }));

    return {
        tramo,
        total,
        progresivas: data,
        patrones: catalogo
    };
};

module.exports = {
    getPerfilEstratigrafico
};
