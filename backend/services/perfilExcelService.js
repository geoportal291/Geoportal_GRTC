/**
 * perfilExcelService.js
 * ---------------------------------------------------------------------------
 * Exportación a Excel del Perfil Estratigrafico (lámina estilo web + detalle
 * de estratos + leyenda). El archivo lo genera openpyxl en el worker Python
 * (regla del proyecto: no generar Excel pesado desde Node); este servicio
 * arma/valida el payload, invoca al script y devuelve el buffer.
 *
 * El payload lo envía el frontend (mismo motor config-driven de la web:
 * results_config de tipo_ensayo), de modo que el Excel muestra EXACTAMENTE
 * los mismos valores que la pantalla.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const SCRIPT_PY = path.join(__dirname, "..", "python_worker", "perfil_estratigrafico_excel.py");

let pythonCache = null;

/** Localiza un intérprete Python con openpyxl (venv local, PYTHON_EXE, PATH). */
function resolverPython() {
    if (pythonCache) return Promise.resolve(pythonCache);
    const candidatos = [];
    if (process.env.PYTHON_EXE) candidatos.push(process.env.PYTHON_EXE);
    const venvLocal = path.join(
        __dirname, "..", "python_worker", "venv",
        process.platform === "win32" ? "Scripts\\python.exe" : "bin/python"
    );
    candidatos.push(venvLocal, "python3", "python");
    return new Promise((resolve) => {
        let i = 0;
        const probar = () => {
            if (i >= candidatos.length) return resolve(null);
            const exe = candidatos[i++];
            const p = spawn(exe, ["-c", "import openpyxl"], { windowsHide: true });
            let ok = true;
            p.on("error", () => { ok = false; });
            p.on("close", (code) => {
                if (ok && code === 0) {
                    pythonCache = exe;
                    return resolve(exe);
                }
                probar();
            });
        };
        probar();
    });
}

function ejecutarGenerador(exe, payloadPath, salidaPath) {
    return new Promise((resolve, reject) => {
        const p = spawn(exe, [
            SCRIPT_PY,
            "--payload", payloadPath,
            "--salida", salidaPath,
        ], { windowsHide: true });
        let stderr = "";
        p.stderr.on("data", (d) => { stderr += d.toString(); });
        p.on("error", (e) => reject(new Error(`No se pudo ejecutar Python (${e.message})`)));
        p.on("close", (code) => {
            if (code === 0) return resolve();
            reject(new Error(`Generador Python falló (código ${code}): ${stderr.trim().slice(-500)}`));
        });
    });
}

// --- Validación/sanitización del payload -------------------------------------
const LIMITE_PROGRESIVAS = 500;
const LIMITE_FILAS_PANEL = 400;

const aTexto = (v, max = 255) => {
    if (v === null || v === undefined) return null;
    const t = String(v).slice(0, max);
    return t.length ? t : null;
};

const aNumero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

/** Sanitiza el payload recibido del frontend antes de pasarlo al worker. */
function sanitizarPayload(body) {
    if (!body || typeof body !== "object") {
        const err = new Error("Payload inválido");
        err.status = 400;
        throw err;
    }

    const progresivasEntrada = Array.isArray(body.progresivas) ? body.progresivas : [];
    if (progresivasEntrada.length > LIMITE_PROGRESIVAS) {
        const err = new Error(`Demasiadas progresivas (máximo ${LIMITE_PROGRESIVAS})`);
        err.status = 400;
        throw err;
    }

    const progresivas = progresivasEntrada.map((p) => ({
        id: aNumero(p?.id),
        codigo: aTexto(p?.codigo, 50),
        nombre: aTexto(p?.nombre, 100),
        elevacion: aNumero(p?.elevacion),
        estratos: (Array.isArray(p?.estratos) ? p.estratos : []).map((e) => ({
            id: aNumero(e?.id),
            nombre: aTexto(e?.nombre, 255),
            descripcion: aTexto(e?.descripcion, 2000),
            profundidad_inicial: aNumero(e?.profundidad_inicial),
            profundidad_final: aNumero(e?.profundidad_final),
            nlp_clasificacion_sucs: aTexto(e?.nlp_clasificacion_sucs, 255),
            nlp_clasificacion_aashto: aTexto(e?.nlp_clasificacion_aashto, 255),
            n_ensayos: aNumero(e?.n_ensayos) ?? 0,
            patron: {
                patron_svg: aTexto(e?.patron?.patron_svg, 50) || "generico",
                color_hex_sugerido: aTexto(e?.patron?.color_hex_sugerido, 10) || "#999999",
                clasificacion_sucs: aTexto(e?.patron?.clasificacion_sucs, 100),
                nombre_material: aTexto(e?.patron?.nombre_material, 255),
                matched: Boolean(e?.patron?.matched)
            }
        }))
    }));

    const filasEntrada = Array.isArray(body?.panel?.filas) ? body.panel.filas : [];
    if (filasEntrada.length > LIMITE_FILAS_PANEL) {
        const err = new Error(`Demasiadas filas de panel (máximo ${LIMITE_FILAS_PANEL})`);
        err.status = 400;
        throw err;
    }
    const filas = filasEntrada.map((f) => ({
        tipoDescripcion: aTexto(f?.tipoDescripcion, 150),
        groupTitle: aTexto(f?.groupTitle, 150),
        label: aTexto(f?.label, 200),
        mostrarTipo: Boolean(f?.mostrarTipo),
        mostrarGrupo: Boolean(f?.mostrarGrupo)
    }));

    const valoresEntrada = body?.panel?.valores && typeof body.panel.valores === "object"
        ? body.panel.valores : {};
    const valores = {};
    for (const [pid, lista] of Object.entries(valoresEntrada)) {
        if (Array.isArray(lista)) {
            valores[String(pid).slice(0, 20)] = lista.map((v) => (v === null || v === undefined ? "" : String(v).slice(0, 50)));
        }
    }

    const nEnsayosEntrada = body?.panel?.nEnsayos && typeof body.panel.nEnsayos === "object"
        ? body.panel.nEnsayos : {};
    const nEnsayos = {};
    for (const [pid, v] of Object.entries(nEnsayosEntrada)) {
        const n = aNumero(v);
        if (n !== null) nEnsayos[String(pid).slice(0, 20)] = Math.round(n);
    }

    const patrones = (Array.isArray(body?.patrones) ? body.patrones : []).slice(0, 300).map((p) => ({
        nombre_original_excel: aTexto(p?.nombre_original_excel, 255),
        clasificacion_sucs: aTexto(p?.clasificacion_sucs, 100),
        clasificacion_aashto: aTexto(p?.clasificacion_aashto, 100),
        color_hex_sugerido: aTexto(p?.color_hex_sugerido, 10) || "#999999",
        patron_svg: aTexto(p?.patron_svg, 50) || "generico"
    }));

    return {
        tramo: {
            codigo: aTexto(body?.tramo?.codigo, 50) || "",
            nombre: aTexto(body?.tramo?.nombre, 150)
        },
        soloConDatos: Boolean(body?.soloConDatos),
        totalProgresivas: aNumero(body?.totalProgresivas) ?? progresivas.length,
        fecha: aTexto(body?.fecha, 30) || new Date().toISOString().slice(0, 16).replace("T", " "),
        patrones,
        progresivas,
        panel: { filas, valores, nEnsayos }
    };
}

/**
 * Genera el Excel a partir del payload del frontend. Devuelve { buffer, filename }.
 */
async function generarPerfilExcel(body) {
    const payload = sanitizarPayload(body);
    if (payload.progresivas.length === 0) {
        const err = new Error("No hay progresivas para exportar");
        err.status = 400;
        throw err;
    }

    const exe = await resolverPython();
    if (!exe) {
        throw new Error("No se encontró un intérprete Python con openpyxl (venv, PYTHON_EXE o PATH).");
    }

    const dirTemp = fs.mkdtempSync(path.join(os.tmpdir(), "perfil-excel-"));
    const payloadPath = path.join(dirTemp, "payload.json");
    const salidaPath = path.join(dirTemp, "perfil.xlsx");
    try {
        fs.writeFileSync(payloadPath, JSON.stringify(payload), "utf8");
        await ejecutarGenerador(exe, payloadPath, salidaPath);
        const buffer = fs.readFileSync(salidaPath);
        const nombreTramo = (payload.tramo.codigo || "tramo").replace(/[^a-zA-Z0-9_-]/g, "");
        return {
            buffer,
            filename: `perfil_estratigrafico_${nombreTramo}.xlsx`
        };
    } finally {
        try { fs.rmSync(dirTemp, { recursive: true, force: true }); } catch (_e) { /* noop */ }
    }
}

module.exports = {
    generarPerfilExcel,
    sanitizarPayload
};
