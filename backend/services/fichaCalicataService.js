/*
 * fichaCalicataService — Consolidado de resultados de un estrato
 * (equivalente a la hoja "Res" del formato MTC) y generación del
 * informe Excel vía worker Python (openpyxl, sin VBA: el Excel es
 * solo el producto de impresión, el cálculo vive en el geoportal).
 *
 * Reutiliza clasificacionSueloService para SUCS/AASHTO y la
 * descripción geotécnica, y lee los resultados ya persistidos de
 * proctor y CBR. Lo que falta se entrega como null y el informe
 * imprime "—" sin romperse.
 */

const db = require('../conexion');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const clasificacionSueloService = require('./clasificacionSueloService');

const SCRIPT_PY = path.join(__dirname, '..', 'python_worker', 'ficha_calicata_excel.py');

function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function maxDe(arr) {
    const nums = (arr || []).map(num).filter((v) => v !== null);
    return nums.length ? Math.max(...nums) : null;
}

/*
 * Consolida todos los resultados disponibles del estrato.
 */
async function getFicha(estratoId) {
    const estratoRes = await db.query(
        `SELECT e.id, e.nombre, e.descripcion, e.cota_inicial, e.cota_final, e.orden,
                e.nlp_clasificacion_sucs, e.nlp_clasificacion_aashto,
                p.id AS progresiva_id, p.codigo AS progresiva_codigo, p.nombre AS progresiva_nombre,
                p.coordenada_este, p.coordenada_norte, p.lado, p.fecha_ejecucion, p.elevacion,
                t.codigo AS tramo_codigo, t.nombre AS tramo_nombre
         FROM estratos e
         LEFT JOIN progresivas p ON e.parent_id = p.id
         LEFT JOIN progresivas t ON p.parent_id = t.id
         WHERE e.id = $1`,
        [estratoId],
    );
    if (estratoRes.rows.length === 0) {
        const err = new Error(`Estrato ${estratoId} no encontrado`);
        err.status = 404;
        throw err;
    }
    const e = estratoRes.rows[0];

    // Clasificación SUCS/AASHTO + descripción geotécnica + humedad/LL/IP
    let clas = { sucs: null, aashto: null, descripcion: '', insumos: {}, advertencias: [] };
    try {
        clas = await clasificacionSueloService.clasificarEstrato(estratoId, { persistir: false });
    } catch (err) {
        clas.advertencias = [`No se pudo clasificar: ${err.message}`];
    }

    // Ensayos con resultado del estrato
    const ensayosRes = await db.query(
        `SELECT ens.id, ens.resultado, ens.fecha, te.config_key
         FROM ensayos ens
         LEFT JOIN tipo_ensayo te ON ens.tipo_ensayo = te.id
         WHERE ens.estrato_id = $1
         ORDER BY ens.fecha DESC NULLS LAST, ens.id DESC`,
        [estratoId],
    );
    const primero = (configKey) => ensayosRes.rows.find(
        (r) => r.config_key === configKey && r.resultado && Object.keys(r.resultado).length > 0,
    );

    // Proctor: MDS / OCH (results.curva del motor; cúbica MTC desde la 050)
    let proctor = null;
    const ensProctor = primero('proctor');
    if (ensProctor) {
        const r = ensProctor.resultado.results || {};
        proctor = {
            mds: num(r.maxima_densidad_seca),
            och: num(r.humedad_optima),
            ensayo_id: ensProctor.id,
        };
    }

    // CBR: diseño = mayor CBR final de los moldes; expansión y absorción = mayores
    let cbr = null;
    const ensCbr = primero('cbr');
    if (ensCbr) {
        const r = ensCbr.resultado.results || {};
        const finales = [1, 2, 3].map((i) => num(r[`m${i}`]?.cbr_final));
        cbr = {
            cbr_diseno: maxDe(finales),
            expansion: maxDe([1, 2, 3].map((i) => num(r[`m${i}`]?.expansion_porc))),
            mds_moldes: num(r.resumen?.mds),
            och_moldes: num(r.resumen?.och),
            ensayo_id: ensCbr.id,
        };
    }

    const insumos = clas.insumos || {};

    // Correlaciones CBR (hoja Comprob.CBR del formato): usan finos/LL/IP de
    // la clasificación y la M.D.S. del Proctor del mismo estrato.
    const correlaciones = clasificacionSueloService.correlacionesCbr({
        finos: insumos.finos,
        ll: insumos.ll,
        ip: insumos.ip,
        mds: proctor ? proctor.mds : null,
    });

    return {
        meta: {
            codigo: e.progresiva_codigo
                ? `${e.tramo_codigo || ''} · ${e.progresiva_codigo} · E-${e.orden ?? ''}`.trim()
                : `Estrato #${estratoId}`,
            tramo_nombre: e.tramo_nombre || '',
            tramo_codigo: e.tramo_codigo || '',
            progresiva: e.progresiva_codigo || '',
            progresiva_nombre: e.progresiva_nombre || '',
            estrato: `E-${e.orden ?? ''}`.trim(),
            estrato_nombre: e.nombre || '',
            profundidad: `${num(e.cota_inicial) ?? 0} - ${num(e.cota_final) ?? 0} m`,
            lado: e.lado === 'I' ? 'Izquierda' : e.lado === 'D' ? 'Derecha' : (e.lado || ''),
            coordenada_este: num(e.coordenada_este),
            coordenada_norte: num(e.coordenada_norte),
            elevacion: num(e.elevacion),
            fecha: e.fecha_ejecucion || null,
            generado: new Date().toISOString().slice(0, 10),
        },
        resultados: {
            humedad_natural: num(insumos.humedad),
            limite_liquido: num(insumos.ll),
            limite_plastico: num(insumos.lp),
            indice_plasticidad: num(insumos.ip),
            sucs: clas.sucs,
            aashto: clas.aashto,
            grava: num(insumos.grava),
            arena: num(insumos.arena),
            finos: num(insumos.finos),
            cu: num(insumos.cu),
            cc: num(insumos.cc),
            proctor,
            cbr,
            equipo_compactacion: clas.equipo_compactacion || null,
            correlaciones_cbr: correlaciones,
            descripcion_geotecnica: clas.descripcion || '',
        },
        advertencias: clas.advertencias || [],
    };
}

/* -------------------------------------------------------- export Excel */

let pythonCache = null;

function resolverPython() {
    if (pythonCache) return pythonCache;
    const candidatos = [
        process.env.PYTHON_EXE,
        path.join(__dirname, '..', 'python_worker', 'venv', process.platform === 'win32' ? 'Scripts\\python.exe' : 'bin/python'),
        'python3',
        'python',
    ].filter(Boolean);
    const { spawnSync } = require('child_process');
    for (const exe of candidatos) {
        const prueba = spawnSync(exe, ['-c', 'import openpyxl'], { encoding: 'utf8' });
        if (prueba.status === 0) {
            pythonCache = exe;
            return exe;
        }
    }
    throw new Error('No se encontró Python con openpyxl para generar la ficha');
}

async function generarFichaExcel(estratoId) {
    const payload = await getFicha(estratoId);

    const exe = resolverPython();
    const marca = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const dirTmp = os.tmpdir();
    const rutaPayload = path.join(dirTmp, `ficha_payload_${marca}.json`);
    const rutaSalida = path.join(dirTmp, `ficha_${marca}.xlsx`);
    fs.writeFileSync(rutaPayload, JSON.stringify(payload), 'utf8');

    try {
        await new Promise((resolve, reject) => {
            const proc = spawn(exe, [SCRIPT_PY, '--payload', rutaPayload, '--salida', rutaSalida], {
                windowsHide: true,
            });
            let stderr = '';
            proc.stderr.on('data', (d) => { stderr += d; });
            proc.on('close', (code) => {
                if (code === 0 && fs.existsSync(rutaSalida)) resolve();
                else reject(new Error(`ficha_calicata_excel.py salió con código ${code}: ${stderr.slice(-500)}`));
            });
            proc.on('error', reject);
        });

        const nombre = `Ficha_Calicata_${String(payload.meta.codigo)
            .replace(/[^\w.-]+/g, '_')}.xlsx`;
        const buffer = fs.readFileSync(rutaSalida);
        return { buffer, filename: nombre };
    } finally {
        try { fs.unlinkSync(rutaPayload); } catch (_) { /* ya no existe */ }
        try { fs.unlinkSync(rutaSalida); } catch (_) { /* ya no existe */ }
    }
}

module.exports = { getFicha, generarFichaExcel };
