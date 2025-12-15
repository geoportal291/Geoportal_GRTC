/* eslint-disable no-restricted-globals */

// NOTA: Este es un archivo de Prueba de Concepto (PoC) y no está integrado en la app.
// Su propósito es desarrollar y probar la lógica para cálculos entre diferentes ensayos.

// --- Dependencias (Copiamos el motor de cálculo real para la PoC) ---
import { create, all } from 'mathjs';

const math = create(all);

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

function topologicalSort(formulas) {
    const graph = new Map();
    const allNodes = Object.keys(formulas);
    const circular = [];

    for (const node of allNodes) {
        graph.set(node, { in: 0, out: [] });
    }

    for (const [node, formula] of Object.entries(formulas)) {
        const dependencies = getDependencies(formula.substring(1));
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
    
    const dataForLookup = JSON.parse(JSON.stringify(formData));
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
            value = Number(value);
            if (!Number.isFinite(value)) {
                value = 0; 
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
            console.error(`[ERROR CALCULO] para ${targetPath}: "${formulaString}"`, error);
            setNestedValue(results, targetPath, 0); 
        }
    }
    return results; 
}

math.import({
  get: getNestedValue,
  set: setNestedValue,
}, {
  override: true
});


// --- 1. DATOS SIMULADOS (MOCKS) ---
// Simulamos los `resultados` que tendríamos de ensayos ya guardados en la BD.

const mockResultadosGranulometria = {
    tables: {
        granulometria: {
            malla_10: { pasa: 85.5 },
            malla_40: { pasa: 50.2 },
            malla_200: { pasa: 12.8 }
        }
    },
    // Estos valores también serían parte del resultado del cálculo de Granulometría
    calculated_values: {
        sucs: {
            grava: 14.5, // 100 - %pasa malla 3" (supongamos)
            arena: 72.7, // %pasa malla 3" - %pasa malla 200
            finos: 12.8  // %pasa malla 200
        }
    }
};

const mockResultadosLimites = {
    calculated_values: {
        limite_liquido: 35,
        limite_plastico: 18,
        indice_plasticidad: 17 // LL - LP
    }
};

const mockHumedadNatural = {
    general_fields: {
        humedad: 15.2
    }
};


// --- 2. CONFIGURACIÓN DEL ENSAYO "VIRTUAL" ---

const configCalculoClasificacion = {
    // Nuevos cálculos que dependen de valores de otros ensayos
    "clasificacion.aashto.grupo": "= 'A-2-6'", // Lógica a implementar
    "clasificacion.sucs.grupo": "= 'SC'",      // Lógica a implementar
    "clasificacion.sucs.nombre": "= 'Arena arcillosa'", // Lógica a implementar

    // Ejemplo de cómo se usaría un valor de otro ensayo:
    "debug.indice_plasticidad_externo": "= GET('LIMITES', 'calculated_values.indice_plasticidad')",
    "debug.porcentaje_finos_externo": "= GET('GRANULOMETRIA', 'calculated_values.sucs.finos')"
};


// --- 3. LÓGICA DEL ORQUESTADOR (La nueva funcionalidad) ---

function getExternalDependencies(formulas) {
    const externalDeps = new Map(); // Usamos un Map para agrupar paths por tipo de ensayo
    const getRegex = /GET\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;

    for (const formula of Object.values(formulas)) {
        let match;
        while ((match = getRegex.exec(formula)) !== null) {
            const [_, assayName, path] = match;
            if (!externalDeps.has(assayName)) {
                externalDeps.set(assayName, new Set());
            }
            externalDeps.get(assayName).add(path);
        }
    }
    return externalDeps;
}

async function calcularClasificacionDeSuelo(clasificacionConfig) {
    console.log("--- INICIANDO CÁLCULO DE CLASIFICACIÓN ---");

    // a) Identificar qué ensayos y qué valores necesitamos
    const externalDependencies = getExternalDependencies(clasificacionConfig);
    console.log("Dependencias externas identificadas:", externalDependencies);

    // b) Simular la carga de esos valores (en la vida real, serían llamadas a la API)
    const dataSources = {
        GRANULOMETRIA: mockResultadosGranulometria,
        LIMITES: mockResultadosLimites,
        HUMEDAD: mockHumedadNatural
    };

    // c) Construir el objeto de datos gigante para el motor de cálculo
    const combinedData = {};
    for (const [assayName, paths] of externalDependencies.entries()) {
        if (dataSources[assayName]) {
            // Aquí podríamos optimizar para solo copiar los paths que necesitamos,
            // pero para la PoC, copiamos todo el mock.
            combinedData[assayName] = dataSources[assayName];
        }
    }
    console.log("Objeto de datos combinado para el motor:", combinedData);

    // d) Reemplazar la sintaxis GET() por una ruta que el motor entienda
    const finalFormulas = {};
    for (const [targetPath, formula] of Object.entries(clasificacionConfig)) {
        const getRegex = /GET\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;
        finalFormulas[targetPath] = formula.replace(getRegex, (match, assayName, path) => {
            // Convertimos GET('LIMITES', 'calculated_values.indice_plasticidad')
            // en 'LIMITES.calculated_values.indice_plasticidad'
            return `${assayName}.${path}`;
        });
    }
    console.log("Fórmulas finales para el motor:", finalFormulas);

    // e) Ejecutar el motor de cálculo con los datos y fórmulas preparados
    const resultadosFinales = runExcelLikeCalculations(finalFormulas, combinedData);

    console.log("--- RESULTADOS DE LA CLASIFICACIÓN ---");
    console.log(resultadosFinales);

    return resultadosFinales;
}


// --- 4. EJECUTAR LA PRUEBA DE CONCEPTO ---

calcularClasificacionDeSuelo(configCalculoClasificacion);
