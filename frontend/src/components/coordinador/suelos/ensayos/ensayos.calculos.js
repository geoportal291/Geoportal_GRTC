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
function calcularMaximoCuadratico(xArr, yArr) {
    // 1. Validación de Vectores Numéricos
    if (!Array.isArray(xArr) || !Array.isArray(yArr)) return { x: 0, y: 0, error: "Inputs must be arrays" };

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

        return {
            x: x_vertex,
            y: y_vertex,
            a: a,
            b: b,
            c: c
        };

    } catch (err) {
        console.error("Error en cálculo cuadrático genérico", err);
        return { x: 0, y: 0, error: err.message };
    }
}

function topologicalSort(formulas) {
    const graph = new Map();
    const allNodes = Object.keys(formulas);
    const circular = [];

    for (const node of allNodes) {
        graph.set(node, { in: 0, out: [] });
    }

    for (const [node, formula] of Object.entries(formulas)) {
        const dependencies = getDependencies(formula.substring(1)); // Ignorar el "=" inicial
        for (const dep of dependencies) {
            if (allNodes.includes(dep)) {
                graph.get(node).in++;
                graph.get(dep).out.push(node);
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

function runExcelLikeCalculations(excelConfig, formData) {
    const { sorted, circular } = topologicalSort(excelConfig);

    if (circular.length > 0) {
        const errorMsg = `Dependencia circular detectada: ${circular.join(', ')}`;
        console.error(errorMsg);
        return { error: errorMsg };
    }

    // Clonamos la data para no mutar el estado original directamente durante el proceso
    const dataForLookup = JSON.parse(JSON.stringify(formData));
    const results = {}; // Objeto para devolver solo los resultados calculados.

    for (const targetPath of sorted) {
        let formulaString = excelConfig[targetPath].substring(1).trim();
        const dependencies = getDependencies(formulaString);

        // Ordenar dependencias por longitud (descendente) para evitar reemplazos parciales incorrectos
        dependencies.sort((a, b) => b.length - a.length);

        const scope = {};
        for (const dep of dependencies) {
            const safeDepName = dep.replace(/\./g, '_');
            formulaString = formulaString.split(dep).join(safeDepName);

            // Buscar el valor (en la data original o en resultados previos)
            let value = getNestedValue(dataForLookup, dep);

            // CORRECCIÓN 3: Sanitización de Tipos
            // Convertimos explícitamente a número. Esto arregla problemas donde "100" (string) + "50" (string) = "10050".
            value = Number(value);

            // Si la conversión falla (ej: texto ingresado) o es infinito, forzamos a 0 para no romper la cadena de cálculos.
            if (!Number.isFinite(value)) {
                value = 0;
            }

            scope[safeDepName] = value;
        }

        try {
            const result = math.evaluate(formulaString, scope);

            // Redondeo a 4 decimales para evitar errores de punto flotante (0.1 + 0.2 != 0.300000004)
            const roundedResult = typeof result === 'number' && isFinite(result)
                ? Math.round(result * 10000) / 10000
                : result;

            // Actualizar la copia interna para que los siguientes cálculos usen este valor nuevo
            setNestedValue(dataForLookup, targetPath, roundedResult);
            // Guardar en el objeto de resultados finales
            setNestedValue(results, targetPath, roundedResult);

        } catch (error) {
            console.error(`[ERROR CALCULO] para ${targetPath}: "${formulaString}"`, error);
            // En caso de error, devolvemos 0 o NaN según prefieras. 0 es más seguro para no romper la UI.
            setNestedValue(results, targetPath, 0);
        }
    }
    return results;
}


// --- MOTOR DE CÁLCULO ANTIGUO (para compatibilidad) ---
function _processSteps(steps, context) {
    // Implementación básica del motor antiguo si aun lo usas
    // Si no usas "steps" en tu configuración nueva, esto no se ejecutará.
    if (!steps) return;

    for (const step of steps) {
        if (step.type === 'expression') {
            try {
                // Lógica simplificada para el motor viejo
                const result = math.evaluate(step.expression, context);
                if (step.output) {
                    setNestedValue(context, step.output, result);
                }
            } catch (e) { console.error(e); }
        }
        // ... (resto de lógica de loops del motor viejo si es necesaria) ...
    }
}

// --- FUNCIÓN EXPORTADA PRINCIPAL (ADAPTADOR) ---
export function calcularResultados(calculationConfig, inputData) {
    if (!calculationConfig || Object.keys(calculationConfig).length === 0) {
        return {};
    }

    // Detección: Si la config tiene "steps", usamos el motor antiguo
    if (calculationConfig.steps) {
        console.log("Usando motor de cálculo antiguo (basado en steps).");
        const context = { inputs: { formData: inputData }, vars: {}, results: {}, ...math };

        // Inicializar variables
        if (calculationConfig.vars) {
            for (const varName in calculationConfig.vars) {
                context.vars[varName] = calculationConfig.vars[varName]; // Valor inicial simple
            }
        }

        _processSteps(calculationConfig.steps, context);
        return context.results;
    }

    // Detección: Si la config es un objeto de fórmulas (Estilo Excel), usamos el motor nuevo
    return runExcelLikeCalculations(calculationConfig, inputData);
}

// Re-importar funciones para el motor antiguo si es necesario para mathjs
math.import({
    get: getNestedValue,
    set: setNestedValue,
    isFinite: Number.isFinite,
    isObject: (val) => typeof val === 'object' && val !== null,
    values: Object.values,
    regresion_cuadratica: calcularMaximoCuadratico // Exponemos con nombre amigable para las fórmulas DB
}, {
    override: true
});
