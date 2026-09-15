/*
 * clasificacionSueloService — Clasificación SUCS/AASHTO de un estrato
 * a partir de los ensayos ya capturados (granulometría + límites).
 *
 * Puerto del VBA de los formatos MTC oficiales (Módulo8: ClasificarSUCS
 * ASTM D2487 y ClasificarAASHTO M-145 con índice de grupo; Módulo5:
 * GetDescripcionSUCS/EsRoca para la descripción geotécnica de la ficha).
 * Los criterios son idénticos a las funciones clasificar_sucs /
 * clasificar_aashto del frontend (ensayos.calculos.js); si se ajusta uno,
 * ajustar el otro y el QA cruzado.
 */

const db = require('../conexion');

function aNumero(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function clasificarSucs(grava, arena, finos, cu, cc, ll, ip) {
    const finosN = aNumero(finos);
    const gravaN = aNumero(grava);
    const arenaN = aNumero(arena);
    if (finosN === null || gravaN === null || arenaN === null) return '';
    if (gravaN <= 0 && arenaN <= 0) return '';

    const cuN = aNumero(cu) || 0;
    const ccN = aNumero(cc) || 0;
    const llN = aNumero(ll);
    const ipN = aNumero(ip);
    const lineaA = 0.73 * ((llN || 0) - 20);

    if (finosN >= 50) {
        if (llN === null || llN <= 0 || ipN === null) return '';
        if (llN < 50) return ipN >= lineaA ? 'CL' : 'ML';
        return ipN >= lineaA ? 'CH' : 'MH';
    }

    const esGrava = gravaN > arenaN;
    const bienGradada = esGrava
        ? (cuN >= 4 && ccN >= 1 && ccN <= 3)
        : (cuN >= 6 && ccN >= 1 && ccN <= 3);
    const prefijo = esGrava ? 'G' : 'S';
    const ipArcillosa = ipN !== null && ipN >= 7 && ipN >= lineaA;

    if (finosN < 5) return bienGradada ? `${prefijo}W` : `${prefijo}P`;
    if (finosN <= 12) {
        if (bienGradada) return ipArcillosa ? `${prefijo}W-${prefijo}C` : `${prefijo}W-${prefijo}M`;
        return ipArcillosa ? `${prefijo}P-${prefijo}C` : `${prefijo}P-${prefijo}M`;
    }
    return ipArcillosa ? `${prefijo}C` : `${prefijo}M`;
}

function clasificarAashto(p10, p40, p200, ll, ip) {
    const p10N = aNumero(p10);
    const p40N = aNumero(p40);
    const p200N = aNumero(p200);
    if (p40N === null || p200N === null) return '';
    const llN = aNumero(ll) || 0;
    const ipN = aNumero(ip) || 0;

    let grupo = '';
    if (p200N <= 35) {
        if (p10N !== null && p10N <= 50 && p40N <= 30 && p200N <= 15 && ipN <= 6) grupo = 'A-1-a';
        else if (p10N !== null && p10N > 50 && p40N <= 50 && p200N <= 25 && ipN <= 6) grupo = 'A-1-b';
        else if (p40N > 50 && p200N <= 10 && ipN <= 6) grupo = 'A-3';
        else if (llN <= 40) grupo = ipN <= 10 ? 'A-2-4' : 'A-2-6';
        else grupo = ipN <= 10 ? 'A-2-5' : 'A-2-7';
    } else {
        if (llN <= 0) return '';
        if (llN <= 40) grupo = ipN <= 10 ? 'A-4' : 'A-6';
        else grupo = ipN <= 10 ? 'A-5' : (ipN <= llN - 30 ? 'A-7-5' : 'A-7-6');
    }

    let t1 = (p200N - 35) * (0.2 + 0.005 * (llN - 40));
    let t2 = 0.01 * (p200N - 15) * (ipN - 10);
    if (t1 < 0) t1 = 0;
    if (t2 < 0) t2 = 0;
    return `${grupo} (${Math.round(t1 + t2)})`;
}

// Nombres típicos SUCS (GetSingleSUCS del formato)
const NOMBRES_SUCS = {
    GW: 'Grava bien gradada con excelente drenaje y alta resistencia.',
    GP: 'Grava mal gradada, uniforme y muy permeable.',
    GM: 'Grava limosa con reducción de permeabilidad.',
    GC: 'Grava arcillosa con cohesión moderada.',
    SW: 'Arena bien gradada con alta estabilidad.',
    SP: 'Arena mal gradada con posible licuación.',
    SM: 'Arena limosa con comportamiento intermedio.',
    SC: 'Arena arcillosa con baja permeabilidad.',
    ML: 'Limo de baja plasticidad.',
    MH: 'Limo de alta plasticidad.',
    CL: 'Arcilla de baja plasticidad.',
    CH: 'Arcilla de alta plasticidad.',
    OL: 'Suelo orgánico de baja plasticidad.',
    OH: 'Suelo orgánico de alta plasticidad.',
    PT: 'Turba altamente orgánica.',
};

function getDescripcionSucs(codigo) {
    const limpio = String(codigo || '').toUpperCase().trim();
    if (!limpio) return '';
    if (!limpio.includes('-')) {
        return NOMBRES_SUCS[limpio] || `SUCS no reconocido (${limpio})`;
    }
    const [p1, p2] = limpio.split('-');
    const d1 = NOMBRES_SUCS[p1.trim()] || `SUCS no reconocido (${p1.trim()})`;
    const d2 = NOMBRES_SUCS[p2.trim()] || `SUCS no reconocido (${p2.trim()})`;
    return `${d1} - Transicion a - ${d2}`;
}

function esRoca(texto) {
    const t = String(texto || '').toUpperCase()
        .replace(/\u00A0/g, ' ')
        .replace(/\r/g, '')
        .replace(/\n/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return ['ROCA SANA', 'ROCA', 'FRAC', 'ENROCADO', 'ROCA FRACTURADA'].includes(t);
}

function formatNumero(v, decimales = 2) {
    const n = aNumero(v);
    return n === null ? '' : n.toFixed(decimales);
}

/*
 * Descripción geotécnica de la ficha (Módulo5 DibujarEstratos del formato).
 */
function construirDescripcionGeotecnica({ sucs, grava, finos, ll, ip, humedad, descripcionEstrato }) {
    if (esRoca(sucs)) {
        return `${sucs}, ${descripcionEstrato || ''}`.trim();
    }
    const gravaN = aNumero(grava) ?? 0;
    const finosN = aNumero(finos) ?? 0;
    const arenaN = Math.max(0, 100 - gravaN - finosN);
    return `${getDescripcionSucs(sucs)} ${formatNumero(gravaN)}% de Grava ` +
        ` de forma Subangular, ${formatNumero(arenaN)}% de Arena y pasante de la Malla Nº200 = ` +
        `${formatNumero(finosN)}% Material no Plastico, LL=${formatNumero(ll)}%, ` +
        `IP=${formatNumero(ip)}% y con Contenido de Humedad = ${formatNumero(humedad)}%, ` +
        `${descripcionEstrato || ''}`.trim();
}

function extraerGranulometria(resultado) {
    const calc = resultado?.calculated_values || {};
    const tablas = resultado?.tables?.granulometria || {};
    const sucs = calc.sucs || {};
    const grad = calc.gradacion || {};
    return {
        grava: sucs.grava,
        arena: sucs.arena,
        finos: sucs.finos,
        cu: grad.cu,
        cc: grad.cc,
        d10: grad.d10,
        d30: grad.d30,
        d60: grad.d60,
        tmn: grad.tmn,
        p10: tablas.malla_10?.pasa,
        p40: tablas.malla_40?.pasa,
        p200: tablas.malla_200?.pasa ?? sucs.finos,
    };
}

function extraerLimites(resultado) {
    const finales = resultado?.calculated_values?.finales || {};
    return {
        ll: finales.limite_liquido,
        lp: finales.limite_plastico,
        ip: finales.indice_plasticidad,
        humedad: finales.humedad_natural,
    };
}

/*
 * Clasifica un estrato cruzando su ensayo de granulometría y de límites
 * (los más recientes con resultado). Con persistir=true guarda el símbolo
 * en estratos.nlp_clasificacion_sucs / nlp_clasificacion_aashto.
 */
async function clasificarEstrato(estratoId, { persistir = false } = {}) {
    const estratoRes = await db.query(
        'SELECT id, nombre, descripcion, nlp_clasificacion_sucs, nlp_clasificacion_aashto FROM estratos WHERE id = $1',
        [estratoId],
    );
    if (estratoRes.rows.length === 0) {
        const err = new Error(`Estrato ${estratoId} no encontrado`);
        err.status = 404;
        throw err;
    }
    const estrato = estratoRes.rows[0];

    const ensayosRes = await db.query(
        `SELECT ens.id, ens.resultado, ens.fecha, te.config_key
         FROM ensayos ens
         LEFT JOIN tipo_ensayo te ON ens.tipo_ensayo = te.id
         WHERE ens.estrato_id = $1
         ORDER BY ens.fecha DESC NULLS LAST, ens.id DESC`,
        [estratoId],
    );

    const conResultado = (configKey) => ensayosRes.rows.find(
        (r) => r.config_key === configKey && r.resultado && Object.keys(r.resultado).length > 0,
    );

    const ensGran = conResultado('granulometria');
    const ensLim = conResultado('limites');

    const advertencias = [];
    const insumos = {};
    if (ensGran) Object.assign(insumos, extraerGranulometria(ensGran.resultado));
    else advertencias.push('Sin ensayo de granulometría con resultado: no se puede clasificar por tamaño.');
    if (ensLim) Object.assign(insumos, extraerLimites(ensLim.resultado));
    else advertencias.push('Sin ensayo de límites con resultado: sin LL/IP, solo clasificación gruesa.');

    const sucs = clasificarSucs(insumos.grava, insumos.arena, insumos.finos, insumos.cu, insumos.cc, insumos.ll, insumos.ip);
    const aashto = clasificarAashto(insumos.p10, insumos.p40, insumos.p200, insumos.ll, insumos.ip);

    if (sucs && !ensLim) {
        advertencias.push('Clasificación SUCS tentativa: sin límites no se distinguen finos GM/GC/ML/CL con precisión.');
    }
    if (sucs && ['GW', 'GP', 'SW', 'SP'].includes(sucs) === false && !insumos.cu) {
        advertencias.push('Sin Cu/Cc calculados (ejecutar recálculo con migración 049): graduación asumida mal gradada.');
    }

    const descripcion = (sucs || aashto)
        ? construirDescripcionGeotecnica({
            sucs: sucs || '',
            grava: insumos.grava,
            finos: insumos.finos,
            ll: insumos.ll,
            ip: insumos.ip,
            humedad: insumos.humedad,
            descripcionEstrato: estrato.descripcion || estrato.nombre || '',
        })
        : '';

    if (persistir && sucs) {
        await db.query(
            'UPDATE estratos SET nlp_clasificacion_sucs = $1, nlp_clasificacion_aashto = $2 WHERE id = $3',
            [sucs, aashto || estrato.nlp_clasificacion_aashto, estratoId],
        );
    }

    return {
        estrato_id: estratoId,
        sucs,
        aashto,
        descripcion,
        insumos,
        advertencias,
        ensayos_usados: {
            granulometria_id: ensGran?.id ?? null,
            limites_id: ensLim?.id ?? null,
        },
        persistido: Boolean(persistir && sucs),
    };
}

module.exports = {
    clasificarEstrato,
    clasificarSucs,
    clasificarAashto,
    construirDescripcionGeotecnica,
    getDescripcionSucs,
    esRoca,
};
