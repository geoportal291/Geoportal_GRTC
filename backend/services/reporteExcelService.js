/**
 * Informe Excel (.xlsm con macros) para ensayos de mecánica de suelos.
 *
 * Flujo: toma el ensayo (getEnsayoDetailsById), arma un payload
 * { meta, datos }, lo pasa al generador Python (openpyxl + plantilla
 * .xlsm con fórmulas vivas y macros VBA) y devuelve el archivo.
 *
 * Los cálculos no se hacen aquí: son fórmulas de la plantilla que Excel
 * recalcula al abrir; la macro VBA integrada regenera los gráficos.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const PLANTILLAS = {
    limites: "informe_limites.xlsm",
    proctor: "informe_proctor.xlsm",
    granulometria: "informe_granulometria.xlsm",
};

const NOMBRE_TIPO = {
    limites: "Limites_Consistencia",
    proctor: "Proctor",
    granulometria: "Analisis_Granulometrico",
};

const SCRIPT_PY = path.join(__dirname, "..", "python_worker", "excel_reporte.py");

let pythonCache = null;

let ubigeoCache = null;

/** Diccionarios ubigeo (id -> nombre), iguales a los del frontend. */
function cargarUbigeo() {
    if (ubigeoCache) return ubigeoCache;
    const leer = (archivo) => {
        try {
            return JSON.parse(
                fs.readFileSync(path.join(__dirname, "..", "templates", "ubigeo", archivo), "utf8")
            );
        } catch (e) {
            return [];
        }
    };
    ubigeoCache = {
        distritos: leer("ubigeo_peru_2016_distritos.json"),
        provincias: leer("ubigeo_peru_2016_provincias.json"),
        departamentos: leer("ubigeo_peru_2016_departamentos.json"),
    };
    return ubigeoCache;
}

/** Traduce código ubigeo a nombre; si no encuentra, devuelve el valor tal cual. */
function traducirUbigeo(lista, valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const texto = String(valor).trim();
    const hallado = lista.find((d) => d.id === texto);
    return hallado ? hallado.name : texto;
}

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

function ejecutarGenerador(exe, plantilla, payloadPath, salidaPath) {
    return new Promise((resolve, reject) => {
        const p = spawn(exe, [
            SCRIPT_PY,
            "--plantilla", plantilla,
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

const aNumero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

/** Formato progresiva "k+mmm" (igual que formatProgresiva del frontend). */
function formatProgresiva(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const texto = String(valor).trim();
    const code = texto.includes("-") ? texto.split("-")[1] : texto;
    if (!code) return texto;
    return code.length < 3 ? code : `${code.slice(0, -3)}+${code.slice(-3)}`;
}

/** Metadatos del informe, espejando la resolución del reporte PDF. */
function construirMeta(ensayo, solicitante) {
    const ubigeo = cargarUbigeo();
    const profMin = aNumero(ensayo.estrato_profundidad_min);
    const profMax = aNumero(ensayo.estrato_profundidad_max);
    let profundidad = null;
    if (profMin !== null || profMax !== null) {
        profundidad = `${(profMin || 0).toFixed(2)} - ${(profMax || 0).toFixed(2)} m`;
    }

    const fechaBruta = ensayo.fecha_muestreo || ensayo.fecha || ensayo.created_at;
    let fechaMuestreo = null;
    if (fechaBruta) {
        const d = new Date(fechaBruta);
        if (!Number.isNaN(d.getTime())) fechaMuestreo = d.toISOString().slice(0, 10);
    }

    return {
        codigo_ensayo: ensayo.codigo_ensayo || ensayo.codigo_generado || `ENSAYO-${ensayo.id}`,
        proyecto_nombre: ensayo.proyecto_nombre || "—",
        tramo_nombre: ensayo.tramo_nombre || "—",
        distrito: traducirUbigeo(ubigeo.distritos, ensayo.distrito) || "—",
        provincia: traducirUbigeo(ubigeo.provincias, ensayo.provincia) || "—",
        departamento: traducirUbigeo(ubigeo.departamentos, ensayo.departamento) || "—",
        solicitante: solicitante || "—",
        fecha_muestreo: fechaMuestreo,
        coordenada_este: aNumero(ensayo.coordenada_este),
        coordenada_norte: aNumero(ensayo.coordenada_norte),
        profundidad,
        calicata: ensayo.identificador || ensayo.cantera_codigo || ensayo.progresiva_codigo || "—",
        progresiva: formatProgresiva(ensayo.progresiva_codigo),
        estrato: ensayo.estrato_orden !== null && ensayo.estrato_orden !== undefined
            ? String(ensayo.estrato_orden) : "—",
        lado: ensayo.lado || "—",
    };
}

function limpiar(ruta) {
    fs.unlink(ruta, () => {});
}

/**
 * Handler del endpoint GET /api/ensayos/:id/reporte-excel
 */
async function generarInformeExcel(req, res) {
    const ensayoId = req.params.id;
    try {
        const ensayo = await require("./ensayosService").getEnsayoDetailsById(ensayoId);
        if (!ensayo) {
            return res.status(404).json({ error: "Ensayo no encontrado" });
        }
        const configKey = ensayo.config_key;
        const plantillaNombre = PLANTILLAS[configKey];
        if (!plantillaNombre) {
            return res.status(400).json({
                error: `El tipo de ensayo "${configKey || ensayo.tipo_ensayo_descripcion}" todavía no tiene informe Excel`,
            });
        }
        const plantilla = path.join(__dirname, "..", "templates", plantillaNombre);
        if (!fs.existsSync(plantilla)) {
            return res.status(500).json({ error: `Plantilla ausente: ${plantillaNombre}` });
        }

        const pythonExe = await resolverPython();
        if (!pythonExe) {
            return res.status(500).json({
                error: "Python con openpyxl no está disponible en el servidor",
            });
        }

        const payload = {
            meta: construirMeta(ensayo, req.query.solicitante),
            datos: ensayo.datos_formulario || {},
        };

        const tmp = os.tmpdir();
        const marca = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const payloadPath = path.join(tmp, `payload_${marca}.json`);
        const salidaPath = path.join(tmp, `informe_${marca}.xlsm`);
        fs.writeFileSync(payloadPath, JSON.stringify(payload), "utf8");

        try {
            await ejecutarGenerador(pythonExe, plantilla, payloadPath, salidaPath);
            const archivo = `Informe_${NOMBRE_TIPO[configKey]}_${(payload.meta.codigo_ensayo || ensayoId)
                .toString().replace(/[^\w.-]+/g, "_")}.xlsm`;
            res.setHeader("Content-Type", "application/vnd.ms-excel.sheet.macroEnabled.12");
            res.setHeader("Cache-Control", "no-store");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${archivo}"; filename*=UTF-8''${encodeURIComponent(archivo)}`
            );
            const stream = fs.createReadStream(salidaPath);
            stream.pipe(res);
            stream.on("close", () => limpiar(salidaPath));
        } catch (e) {
            console.error("[reporte-excel]", e.message);
            limpiar(salidaPath);
            return res.status(500).json({ error: "No se pudo generar el informe Excel", details: e.message });
        } finally {
            limpiar(payloadPath);
        }
    } catch (err) {
        console.error("[reporte-excel] error:", err);
        return res.status(500).json({ error: "Error interno generando el informe Excel", details: err.message });
    }
}

module.exports = { generarInformeExcel };
