/* eslint-disable no-restricted-globals */
import { create, all } from 'mathjs';

const math = create(all);

// --- Funciones de Utilidad (Helpers) ---

// CORRECCIÓN 1: Cambiamos defaultValue de NaN a 0.
// Esto es vital para que sumas acumuladas no se rompan si falta un dato anterior.
function getNestedValue(obj, path, defaultValue = 0) {
    if (typeof path !== 'string' || !path) return defaultValue;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current === null || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[key];
    }
    // CORRECCIÓN 2: Si el valor es una cadena vacía, null o undefined, devolvemos 0.
    // Esto previene errores cuando el usuario borra un dato del formulario.
    if (current === undefined || current === null || current === "") {
        return defaultValue;
    }
    return current;
}

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    for (const key of keys) {
        if (current[key] === null || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    current[lastKey] = value;
}

function toFiniteNumber(value, defaultValue = 0) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : defaultValue;
}

function safeDivide(numerator, denominator, fallback = 0) {
    const safeNumerator = toFiniteNumber(numerator, NaN);
    const safeDenominator = toFiniteNumber(denominator, NaN);

    if (!Number.isFinite(safeNumerator) || !Number.isFinite(safeDenominator) || safeDenominator === 0) {
        return fallback;
    }

    return safeNumerator / safeDenominator;
}

function firstPositive(...values) {
    for (const value of values) {
        const numericValue = toFiniteNumber(value, NaN);
        if (Number.isFinite(numericValue) && numericValue > 0) {
            return numericValue;
        }
    }

    return 0;
}


// --- NUEVO MOTOR DE CÁLCULO "ESTILO EXCEL" ---

function getDependencies(formulaString) {
    const variableRegex = /[a-zA-Z_][a-zA-Z0-9_.]*/g;
    const dependencies = new Set();
    const mathFunctions = new Set(Object.keys(math));
    let match;
    while ((match = variableRegex.exec(formulaString)) !== null) {
        const potentialVar = match[0];
        if (!mathFunctions.has(potentialVar) && isNaN(potentialVar)) {
            dependencies.add(potentialVar);
        }
    }
    return Array.from(dependencies);
}

// --- FUNCIONES MATEMÁTICAS PERSONALIZADAS GENÉRICAS ---

/**
 * Realiza un ajuste cuadrático (y = ax^2 + bx + c) y devuelve el punto máximo (vértice).
 * Esta función es puramente matemática y estocástica, no sabe nada de "Proctor" o "Suelos".
 */
function calcularMaximoCuadratico(xInput, yInput) {
    // Convertir de Matrix de mathjs a Array normal si es necesario
    const xArr = xInput && typeof xInput.toArray === 'function' ? xInput.toArray() : xInput;
    const yArr = yInput && typeof yInput.toArray === 'function' ? yInput.toArray() : yInput;

    // 1. Validación de Vectores Numéricos
    if (!Array.isArray(xArr) || !Array.isArray(yArr)) {
        return { x: 0, y: 0, error: "Inputs must be arrays" };
    }

    // Filtrar pares (x,y) válidos (ambos deben ser números finitos)
    const x = [];
    const y = [];
    for (let i = 0; i < Math.min(xArr.length, yArr.length); i++) {
        const vx = Number(xArr[i]);
        const vy = Number(yArr[i]);
        if (Number.isFinite(vx) && Number.isFinite(vy) && vy !== 0) { // Asumimos 0 como "no dato" en este contexto de usuario
            x.push(vx);
            y.push(vy);
        }
    }

    if (x.length < 3) return { x: 0, y: 0, error: "Insuficientes datos (min 3 puntos)" };

    try {
        // 2. Regresión Cuadrática por Mínimos Cuadrados (Matrix Operations)
        // Modelo: y = c + bx + ax^2
        // Matriz Diseño X = [1, x, x^2]
        const X_data = x.map(val => [1, val, val * val]);

        const X_matrix = math.matrix(X_data);
        const Y_matrix = math.matrix(y);

        // Beta = (X^T * X)^-1 * X^T * Y
        const Xt = math.transpose(X_matrix);
        const XtX = math.multiply(Xt, X_matrix);

        // Resolver sistema
        // Usamos math.lusolve o inversión explícita. Inversión es aceptable para matrices 3x3.
        let Beta;
        try {
            const XtX_inv = math.inv(XtX);
            const XtY = math.multiply(Xt, Y_matrix);
            Beta = math.multiply(XtX_inv, XtY);
        } catch (singular) {
            return { x: 0, y: 0, error: "Singular matrix - puntos alineados o duplicados" };
        }

        const coeffs = Beta.toArray().flat ? Beta.toArray().flat() : Beta.toArray();
        const c = coeffs[0]; // Termino indep
        const b = coeffs[1]; // Coef lineal
        const a = coeffs[2]; // Coef cuadratico

        // 3. Cálculo del Vértice (Máximo/Mínimo)
        // Derivada dy/dx = 2ax + b = 0  =>  x_vertex = -b / (2a)

        if (Math.abs(a) < 1e-10) { // Es prácticamente una recta
            return { x: 0, y: 0, warning: "Tendencia lineal, no hay pico definido" };
        }

        const x_vertex = -b / (2 * a);
        const y_vertex = a * x_vertex * x_vertex + b * x_vertex + c;

        // Metadatos útiles (opcional): 'concavidad': a < 0 ? 'convexa' : 'concava'
        // En ensayos de compactación buscamos una parábola invertida (a < 0).

        const result = {
            x: x_vertex,
            y: y_vertex,
            a: a,
            b: b,
            c: c
        };
        return result;

    } catch (err) {
        return { x: 0, y: 0, error: err.message };
    }
}

/**
 * Realiza una regresión lineal sobre el logaritmo de X: y = m * log10(x) + b
 * Específicamente diseñada para la Curva de Fluidez (Casagrande).
 */
function calcularRegresionLinealLog(xInput, yInput) {
    const xArr = xInput && typeof xInput.toArray === 'function' ? xInput.toArray() : xInput;
    const yArr = yInput && typeof yInput.toArray === 'function' ? yInput.toArray() : yInput;

    if (!Array.isArray(xArr) || !Array.isArray(yArr)) return { m: 0, b: 0, error: "Inputs must be arrays" };

    const validX = [];
    const validY = [];
    for (let i = 0; i < Math.min(xArr.length, yArr.length); i++) {
        const vx = Number(xArr[i]);
        const vy = Number(yArr[i]);
        if (Number.isFinite(vx) && vx > 0 && Number.isFinite(vy) && vy > 0) {
            validX.push(Math.log10(vx));
            validY.push(vy);
        }
    }

    if (validX.length < 2) {
        return {
            m: 0, b: 0, ll_25: 0, puntos_recta: [],
            error: "Se necesitan al menos 2 puntos válidos"
        };
    }

    try {
        // Regresión lineal simple por mínimos cuadrados
        const n = validX.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += validX[i];
            sumY += validY[i];
            sumXY += validX[i] * validY[i];
            sumXX += validX[i] * validX[i];
        }

        const denominator = (n * sumXX - sumX * sumX);
        if (Math.abs(denominator) < 1e-12) return { m: 0, b: 0, error: "Puntos verticales en escala log" };

        const m = (n * sumXY - sumX * sumY) / denominator;
        const b = (sumY - m * sumX) / n;

        // Calculamos el LL exacto a los 25 golpes usando la recta
        const ll_25 = m * Math.log10(25) + b;

        return {
            m,
            b,
            ll_25: Math.round(ll_25 * 100) / 100,
            // Puntos para dibujar la recta de extremo a extremo (10 a 50 golpes)
            puntos_recta: [
                { x: 10, y: Math.round((m * Math.log10(10) + b) * 100) / 100 },
                { x: 50, y: Math.round((m * Math.log10(50) + b) * 100) / 100 }
            ]
        };
    } catch (err) {
        return { m: 0, b: 0, error: err.message };
    }
}

function topologicalSort(formulas) {
    const graph = new Map();
    // Ignorar funciones dinámicas para el ordenamiento topológico
    const allNodes = Object.keys(formulas).filter(key => !key.startsWith('_functions.'));
    const circular = [];

    for (const node of allNodes) {
        graph.set(node, { in: 0, out: [] });
    }

    for (const [node, formula] of Object.entries(formulas)) {
        if (node.startsWith('_functions.')) continue;
        const formulaString = formula.substring(1); // Ignorar el "=" inicial
        const dependencies = getDependencies(formulaString);
        for (const dep of dependencies) {
            const matchedNode = allNodes.find(n => dep === n || dep.startsWith(n + '.'));

            if (matchedNode) {
                graph.get(node).in++;
                graph.get(matchedNode).out.push(node);
            }
        }
    }

    const queue = [];
    for (const node of allNodes) {
        if (graph.get(node).in === 0) {
            queue.push(node);
        }
    }

    const sorted = [];
    while (queue.length > 0) {
        const node = queue.shift();
        sorted.push(node);

        for (const neighbor of graph.get(node).out) {
            graph.get(neighbor).in--;
            if (graph.get(neighbor).in === 0) {
                queue.push(neighbor);
            }
        }
    }

    if (sorted.length < allNodes.length) {
        const sortedSet = new Set(sorted);
        for (const node of allNodes) {
            if (!sortedSet.has(node)) {
                circular.push(node);
            }
        }
    }
    return { sorted, circular };
}

/**
 * Compila y registra en mathjs de forma dinámica cualquier función personalizada
 * configurada en la base de datos bajo claves que empiezan con "_functions."
 */
function registrarFuncionesDinamicas(excelConfig) {
    if (!excelConfig || typeof excelConfig !== 'object') return;

    const mathFuncs = {};
    for (const [key, value] of Object.entries(excelConfig)) {
        if (key.startsWith('_functions.')) {
            const fnName = key.replace('_functions.', '');
            try {
                const compiledFn = new Function(`return (${value})`)();
                mathFuncs[fnName] = compiledFn;
            } catch (err) {
                console.error(`[MOTOR CALC] Error al compilar función dinámica ${fnName}:`, err);
            }
        }
    }

    if (Object.keys(mathFuncs).length > 0) {
        math.import(mathFuncs, { override: true });
    }
}

function runExcelLikeCalculations(excelConfig, formData, tableConfig = null) {
    const { sorted, circular } = topologicalSort(excelConfig);

    if (circular.length > 0) {
        return { error: `Dependencia circular detectada: ${circular.join(', ')}` };
    }

    const dataForLookup = JSON.parse(JSON.stringify(formData));
    if (tableConfig) {
        const simplifiedTableConfig = { tables: {} };
        const tablesRaw = tableConfig.tables || {};
        const tablesArray = Array.isArray(tablesRaw) ? tablesRaw : Object.values(tablesRaw);
        tablesArray.forEach(table => {
            if (table && table.key) {
                const rowsRaw = table.rows || [];
                const rowsArray = Array.isArray(rowsRaw) ? rowsRaw : Object.values(rowsRaw);
                simplifiedTableConfig.tables[table.key] = {
                    rows: rowsArray.map(row => ({
                        key: row?.key,
                        mm: typeof row?.mm === 'number' ? row.mm : Number(row?.mm || 0),
                        tamiz: row?.tamiz,
                        label: row?.label
                    }))
                };
            }
        });
        dataForLookup.tableConfig = simplifiedTableConfig;
    }
    const results = {};

    for (const targetPath of sorted) {
        let formulaString = excelConfig[targetPath].substring(1).trim();
        const dependencies = getDependencies(formulaString);

        dependencies.sort((a, b) => b.length - a.length);

        const scope = {};
        for (const dep of dependencies) {
            const safeDepName = dep.replace(/\./g, '_');
            formulaString = formulaString.split(dep).join(safeDepName);

            let value = getNestedValue(dataForLookup, dep);

            if (typeof value === 'object' && value !== null) {
                // Dejar objeto tal cual
            } else {
                const numericValue = Number(value);
                if (Number.isFinite(numericValue)) {
                    value = numericValue;
                } else {
                    value = 0;
                }
            }

            scope[safeDepName] = value;
        }

        try {
            const result = math.evaluate(formulaString, scope);

            const roundedResult = typeof result === 'number' && isFinite(result)
                ? Math.round(result * 10000) / 10000
                : result;

            setNestedValue(dataForLookup, targetPath, roundedResult);
            setNestedValue(results, targetPath, roundedResult);

        } catch (error) {
            console.error(`[MOTOR CALC EVAL ERROR] en variable: ${targetPath}`, error);
            setNestedValue(results, targetPath, 0);
        }
    }
    return results;
}


// --- MOTOR DE CÁLCULO ANTIGUO (para compatibilidad) ---
function _processSteps(steps, context) {
    if (!steps) return;

    for (const step of steps) {
        if (step.type === 'expression') {
            try {
                const result = math.evaluate(step.expression, context);
                if (step.output) {
                    setNestedValue(context, step.output, result);
                }
            } catch (e) { }
        }
    }
}

/**
 * Determina dinámicamente el Tamaño Máximo Nominal a partir de una lista ordenada de tamices
 * y sus correspondientes valores de porcentaje retenido acumulado.
 * Es completamente genérica y multifuncional: no asume nombres de tamiz ni claves fijas.
 *
 * @param {Array} rows Array de objetos de configuración de filas (ej: tableConfig.tables.granulometria.rows)
 * @param {Object} data Objeto con los datos de resultado o de entrada del ensayo
 * @param {string} acumPath Sufijo o ruta para buscar el retenido acumulado dentro de cada fila (opcional)
 */
function calcularTmnGenerico(rows, data, acumPath = '') {
    const rowsArray = Array.isArray(rows) ? rows : (rows ? Object.values(rows) : []);
    if (rowsArray.length === 0 || typeof data !== 'object' || data === null) {
        return "N/A";
    }

    // Filtrar y ordenar las filas que representen tamices reales con abertura numérica (mm)
    const tamicesValidos = rowsArray
        .filter(row => row && row.key && typeof row.mm === 'number' && Number.isFinite(row.mm))
        .sort((a, b) => b.mm - a.mm); // Asegurar orden descendente de abertura (mayor a menor)

    for (const row of tamicesValidos) {
        let valorAcumulado = 0;

        // Buscar el valor acumulado de este tamiz en el objeto de datos
        if (acumPath) {
            const val = getNestedValue(data, `${row.key}.${acumPath}`, null);
            if (val !== null) {
                valorAcumulado = Number(val);
            }
        } else {
            // Intenta buscar el valor directamente por la clave de la fila, o en propiedades comunes de acumulación
            const rowData = data[row.key];
            if (rowData !== undefined) {
                if (typeof rowData === 'object' && rowData !== null) {
                    valorAcumulado = Number(rowData.acum_retenido_porcentaje ?? rowData.acum ?? rowData.porcRetAcumulado ?? rowData.porc_acum ?? 0);
                } else {
                    valorAcumulado = Number(rowData);
                }
            } else if (data.acum && data.acum[row.key] !== undefined) {
                valorAcumulado = Number(data.acum[row.key]);
            } else if (data.porcRetAcumulado && data.porcRetAcumulado[row.key] !== undefined) {
                valorAcumulado = Number(data.porcRetAcumulado[row.key]);
            } else if (data.porcRetenidoAcumulado && data.porcRetenidoAcumulado[row.key] !== undefined) {
                valorAcumulado = Number(data.porcRetenidoAcumulado[row.key]);
            }
        }

        // Si el acumulado es mayor a 0 (tolerancia para ruidos de punto flotante)
        if (Number.isFinite(valorAcumulado) && valorAcumulado > 0.01) {
            return row.tamiz || row.label || `${row.mm} mm`;
        }
    }

    return "N/A";
}


/**
 * Calcula el diámetro correspondiente a un determinado porcentaje que pasa (ej: D10, D30, D50, D60)
 * por interpolación semilogarítmica exacta entre los tamices del ensayo.
 */
function calcularDxGenerico(rows, data, porcentaje, valueKey = 'pasa') {
    const rowsArray = Array.isArray(rows) ? rows : (rows ? Object.values(rows) : []);
    if (rowsArray.length === 0 || typeof data !== 'object' || data === null) {
        return 0;
    }

    const puntos = [];
    for (const row of rowsArray) {
        if (!row || !row.key || typeof row.mm !== 'number' || !Number.isFinite(row.mm)) {
            continue;
        }
        const pasaVal = getNestedValue(data, `${row.key}.${valueKey}`, null);
        if (pasaVal !== null) {
            const pasaNum = Number(pasaVal);
            if (Number.isFinite(pasaNum)) {
                puntos.push({ mm: row.mm, pasa: pasaNum });
            }
        }
    }

    if (puntos.length === 0) return 0;

    // Ordenar de menor a mayor abertura para facilitar la interpolación semilogarítmica
    puntos.sort((a, b) => a.mm - b.mm);

    // Si coincide exactamente con alguno
    for (const pt of puntos) {
        if (Math.abs(pt.pasa - porcentaje) < 1e-5) {
            return pt.mm;
        }
    }

    // Buscar los dos puntos que encierran el porcentaje
    for (let i = 0; i < puntos.length - 1; i++) {
        const p1 = puntos[i];     // Menor abertura
        const p2 = puntos[i + 1]; // Mayor abertura

        const minPasa = Math.min(p1.pasa, p2.pasa);
        const maxPasa = Math.max(p1.pasa, p2.pasa);

        if (porcentaje >= minPasa && porcentaje <= maxPasa) {
            if (Math.abs(maxPasa - minPasa) < 1e-5) {
                return p1.mm;
            }
            // Interpolación semilogarítmica
            const logD1 = Math.log10(p1.mm);
            const logD2 = Math.log10(p2.mm);
            const logDx = logD1 + ((porcentaje - p1.pasa) / (p2.pasa - p1.pasa)) * (logD2 - logD1);
            return Math.round(Math.pow(10, logDx) * 10000) / 10000;
        }
    }

    // Si el porcentaje es menor que el menor pasa registrado
    if (porcentaje < puntos[0].pasa) {
        return 0;
    }

    // Si el porcentaje es mayor que el mayor pasa registrado
    if (porcentaje > puntos[puntos.length - 1].pasa) {
        return puntos[puntos.length - 1].mm;
    }

    return 0;
}

// --- FUNCIÓN EXPORTADA PRINCIPAL (ADAPTADOR) ---
export function calcularResultados(calculationConfig, inputData, tableConfig = null) {
    if (!calculationConfig || Object.keys(calculationConfig).length === 0) {
        return {};
    }

    // Registrar en caliente las funciones dinámicas inyectadas por la DB
    registrarFuncionesDinamicas(calculationConfig);

    // Detección: Si la config tiene "steps", usamos el motor antiguo
    if (calculationConfig.steps) {
        const context = { inputs: { formData: inputData }, vars: {}, results: {}, ...math };

        // Inicializar variables
        if (calculationConfig.vars) {
            for (const varName in calculationConfig.vars) {
                context.vars[varName] = calculationConfig.vars[varName];
            }
        }

        _processSteps(calculationConfig.steps, context);
        return context.results;
    }

    // Detección: Si la config es un objeto de fórmulas (Estilo Excel), usamos el motor nuevo
    return runExcelLikeCalculations(calculationConfig, inputData, tableConfig);
}

// Re-importar funciones para el motor antiguo si es necesario para mathjs
math.import({
    get: getNestedValue,
    set: setNestedValue,
    isFinite: Number.isFinite,
    isObject: (val) => typeof val === 'object' && val !== null,
    values: Object.values,
    safeDivide,
    firstPositive,
    regresion_cuadratica: calcularMaximoCuadratico,
    regresion_log: calcularRegresionLinealLog,
    obtener_tmn: calcularTmnGenerico,
    calcular_dx: calcularDxGenerico
}, {
    override: true
});
