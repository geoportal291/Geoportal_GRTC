/*
 * perfilDxfService — Exporta el perfil estratigráfico a DXF (AutoCAD)
 * con la misma lámina del formato oficial (escala 1 m = 100 unidades,
 * hatches por patrón SUCS), vía worker Python con ezdxf.
 *
 * El payload lo arma el frontend (el mismo del exportar-excel).
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SCRIPT_PY = path.join(__dirname, '..', 'python_worker', 'perfil_dxf_export.py');
const MAX_PROGRESIVAS = 500;

let pythonCache = null;

function resolverPython() {
    if (pythonCache) return pythonCache;
    const { spawnSync } = require('child_process');
    const candidatos = [
        process.env.PYTHON_EXE,
        path.join(__dirname, '..', 'python_worker', 'venv', process.platform === 'win32' ? 'Scripts\\python.exe' : 'bin/python'),
        'python3',
        'python',
    ].filter(Boolean);
    for (const exe of candidatos) {
        const prueba = spawnSync(exe, ['-c', 'import ezdxf'], { encoding: 'utf8' });
        if (prueba.status === 0) {
            pythonCache = exe;
            return exe;
        }
    }
    throw new Error('No se encontró Python con ezdxf para exportar el DXF');
}

async function generarPerfilDxf(body) {
    const progs = Array.isArray(body?.progresivas) ? body.progresivas : [];
    if (progs.length === 0) {
        const err = new Error('El payload no trae progresivas');
        err.status = 400;
        throw err;
    }
    const payload = {
        tramo: {
            codigo: String(body?.tramo?.codigo || '').slice(0, 50),
            nombre: String(body?.tramo?.nombre || '').slice(0, 120),
        },
        progresivas: progs.slice(0, MAX_PROGRESIVAS).map((p) => ({
            id: Number(p.id) || 0,
            codigo: String(p.codigo || '').slice(0, 30),
            nombre: String(p.nombre || '').slice(0, 60),
            estratos: (Array.isArray(p.estratos) ? p.estratos : []).map((e) => ({
                nombre: String(e.nombre || '').slice(0, 80),
                profundidad_inicial: Number(e.profundidad_inicial) || 0,
                profundidad_final: Number(e.profundidad_final) || 0,
                nlp_clasificacion_sucs: String(e.nlp_clasificacion_sucs || '').slice(0, 20),
                nlp_clasificacion_aashto: String(e.nlp_clasificacion_aashto || '').slice(0, 20),
                patron: {
                    patron_svg: String(e.patron?.patron_svg || 'generico').slice(0, 30),
                    color_hex_sugerido: String(e.patron?.color_hex_sugerido || '999999').slice(0, 9),
                },
            })),
        })),
    };

    const exe = resolverPython();
    const marca = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const rutaPayload = path.join(os.tmpdir(), `perfil_dxf_${marca}.json`);
    const rutaSalida = path.join(os.tmpdir(), `perfil_dxf_${marca}.dxf`);
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
                else reject(new Error(`perfil_dxf_export.py salió con código ${code}: ${stderr.slice(-500)}`));
            });
            proc.on('error', reject);
        });
        const nombre = `Perfil_Estratigrafico_${String(payload.tramo.codigo || 'TRAMO')
            .replace(/[^\w.-]+/g, '_')}.dxf`;
        return { buffer: fs.readFileSync(rutaSalida), filename: nombre };
    } finally {
        try { fs.unlinkSync(rutaPayload); } catch (_) { /* ya no existe */ }
        try { fs.unlinkSync(rutaSalida); } catch (_) { /* ya no existe */ }
    }
}

module.exports = { generarPerfilDxf };
