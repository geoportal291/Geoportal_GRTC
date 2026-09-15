/**
 * ensayosPerfil.js
 * ---------------------------------------------------------------------------
 * Motor GENÉRICO de resultados de ensayos para el panel del perfil
 * estratigráfico. NO conoce tipos de ensayo: todo sale de la configuración
 * vivida en la BD (tipo_ensayo):
 *   - config_calculos  → fórmulas que recalcula el motor (ensayos.calculos.js)
 *   - config_tabla     → estructura de tablas que usan las fórmulas
 *   - results_config   → QUÉ resultados mostrar: groups[].fields[] con
 *                        { name: ruta.del.valor, label, digits } y opcional
 *                        group.data_source_key (igual que VisorResultados).
 *
 * Agregar un tipo de ensayo nuevo en la BD agrega sus filas al panel sin
 * tocar este código.
 */

import { calcularResultados } from '../../ensayos/ensayos.calculos';

// Caché de resultados calculados por id de ensayo (se resetea al cambiar de
// tramo/bloque para no acumular).
const cacheResultados = new Map();

export const resetCacheEnsayos = () => cacheResultados.clear();

// Normaliza el formData igual que hace EnsayoDetallePanel/VisorGraficos:
// el motor de cálculo espera las tablas bajo la clave "tables".
const normalizarFormData = (ensayo) => {
    const formData = ensayo?.datos_formulario || {};
    const normalized = { ...formData };
    if (!normalized.tables) {
        normalized.tables = { ...formData };
    }
    return normalized;
};

// Resultados calculados de un ensayo (idéntico a EnsayoDetallePanel:
// calcularResultados con la config del tipo + respaldo del guardado en BD)
export const getResultadosEnsayo = (ensayo) => {
    if (!ensayo) return {};
    const clave = ensayo.id ?? `${ensayo.codigo_ensayo}-${Math.random()}`;
    if (cacheResultados.has(clave)) return cacheResultados.get(clave);

    const formData = normalizarFormData(ensayo);
    let resultados = {};
    if (ensayo.config_calculos && Object.keys(formData).length > 0) {
        try {
            resultados = calcularResultados(ensayo.config_calculos, formData, ensayo.config_tabla) || {};
        } catch (_err) {
            resultados = {};
        }
    }
    // Respaldo: resultados ya guardados en la BD (denormalizados)
    if (ensayo.resultado && typeof ensayo.resultado === 'object' && !Array.isArray(ensayo.resultado)) {
        resultados = { ...ensayo.resultado, ...resultados };
    }

    cacheResultados.set(clave, resultados);
    return resultados;
};

const getValueAtPath = (obj, path) => {
    if (!path || typeof path !== 'string') return undefined;
    return path.split('.').reduce(
        (acc, key) => (acc !== undefined && acc !== null ? acc[key] : undefined),
        obj
    );
};

/**
 * Construye la lista de FILAS del panel a partir de results_config de los
 * tipos de ensayo presentes en la página de progresivas. Cada fila apunta a
 * una ruta de resultado definida en la BD. Devuelve filas con:
 *   { key, tipo, tipoDescripcion, groupTitle, dataSource, path, label,
 *     digits, mostrarTipo, mostrarGrupo }
 * `mostrarTipo`/`mostrarGrupo` marcan cuándo insertar filas de encabezado.
 */
export const construirFilasEnsayos = (progresivas) => {
    const filas = [];
    const clavesVistas = new Set();

    for (const p of progresivas || []) {
        for (const estrato of p?.estratos || []) {
            for (const ensayo of estrato?.ensayos || []) {
                const rc = ensayo.results_config;
                if (!rc || !Array.isArray(rc.groups)) continue;
                const tipo = ensayo.config_key || String(ensayo.tipo_ensayo ?? 'ensayo');

                for (let gi = 0; gi < rc.groups.length; gi++) {
                    const group = rc.groups[gi];
                    const fields = Array.isArray(group?.fields) ? group.fields : [];

                    for (let fi = 0; fi < fields.length; fi++) {
                        const field = fields[fi];
                        const key = `${tipo}::${gi}::${fi}`;
                        if (clavesVistas.has(key)) continue;
                        clavesVistas.add(key);

                        filas.push({
                            key,
                            tipo,
                            tipoDescripcion: ensayo.tipo_ensayo_descripcion || tipo,
                            groupTitle: group.title || '',
                            dataSource: group.data_source_key || null,
                            path: field.name,
                            label: field.label || field.name,
                            digits: field.digits
                        });
                    }
                }
            }
        }
    }
    return filas;
};

// Formatea un valor igual que VisorResultados (numbers → toFixed(digits))
const formatearValor = (value, digits) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value.toFixed(digits || 2);
    }
    if (typeof value === 'object') return '';
    return String(value);
};

/**
 * Extrae los valores de una progresiva para las filas dadas. Para cada fila
 * se usa el PRIMER ensayo que produzca un valor definido en la ruta.
 * Devuelve Map fila.key → string ('' = sin dato).
 */
export const extraerValoresProgresiva = (progresiva, filas) => {
    const valores = new Map();
    let nEnsayos = 0;
    filas.forEach((f) => valores.set(f.key, ''));
    if (!progresiva?.estratos) return { valores, nEnsayos };

    const ensayos = [];
    for (const estrato of progresiva.estratos) {
        for (const ensayo of estrato?.ensayos || []) {
            ensayos.push(ensayo);
        }
    }
    nEnsayos = ensayos.length;

    for (const fila of filas) {
        for (const ensayo of ensayos) {
            const rc = ensayo.results_config;
            if (!rc || !Array.isArray(rc.groups)) continue;
            const tipo = ensayo.config_key || String(ensayo.tipo_ensayo ?? 'ensayo');
            if (tipo !== fila.tipo) continue;

            const resultados = getResultadosEnsayo(ensayo);
            const fuente = fila.dataSource
                ? getValueAtPath(resultados, fila.dataSource) ?? resultados
                : resultados;
            const crudo = getValueAtPath(fuente, fila.path);
            const texto = formatearValor(crudo, fila.digits);
            if (texto !== '') {
                valores.set(fila.key, texto);
                break;
            }
        }
    }
    return { valores, nEnsayos };
};

/**
 * Construye el panel COMPLETO ya compactado:
 *   1. Genera las filas desde results_config (BD).
 *   2. Calcula los valores por progresiva.
 *   3. DESCARTA las filas que quedan vacías en todas las progresivas visibles
 *      (celdas sin datos no aportan al perfil).
 *   4. Recalcula las banderas de encabezado (tipo/grupo) sobre la lista
 *      final, de modo que los encabezados nunca se repiten en filas
 *      consecutivas.
 * Devuelve { filas, valoresPorProgresiva }.
 */
export const construirPanelEnsayos = (progresivas) => {
    const filasCrudas = construirFilasEnsayos(progresivas);

    const valoresPorProgresiva = new Map();
    (progresivas || []).forEach((p) => {
        valoresPorProgresiva.set(p.id, extraerValoresProgresiva(p, filasCrudas));
    });

    // 3. Solo filas con al menos un dato en las progresivas visibles
    const filas = filasCrudas.filter((fila) => {
        for (const info of valoresPorProgresiva.values()) {
            if (info.valores.get(fila.key)) return true;
        }
        return false;
    });

    // 4. Encabezados sin repetidos consecutivos (se comparan por descripción
    //    visible, no por clave interna, para colapsar variaciones de la BD)
    let prevTipoDesc = null;
    let prevGrupoClave = null;
    for (const fila of filas) {
        const claveGrupo = `${fila.tipoDescripcion}::${fila.groupTitle}`;
        fila.mostrarTipo = fila.tipoDescripcion !== prevTipoDesc;
        fila.mostrarGrupo = claveGrupo !== prevGrupoClave;
        prevTipoDesc = fila.tipoDescripcion;
        prevGrupoClave = claveGrupo;
    }

    return { filas, valoresPorProgresiva };
};
