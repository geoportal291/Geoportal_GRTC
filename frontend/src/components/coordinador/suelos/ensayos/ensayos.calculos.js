/* eslint-disable no-restricted-globals */
import { create, all } from 'mathjs';

const math = create(all);

// --- Funciones de Utilidad (Helpers) ---

/**
 * Obtiene de forma segura un valor de un objeto anidado utilizando una ruta de cadena.
 * @param {object} obj - El objeto del que se extraerán los datos.
 * @param {string} path - La ruta al valor (ej: 'data.prop.0.name').
 * @param {*} defaultValue - El valor a devolver si la ruta no existe.
 * @returns {*} El valor encontrado o el valor por defecto.
 */
function get(obj, path, defaultValue = 0) {
  const travel = (regexp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}

/**
 * Establece de forma segura un valor en un objeto anidado utilizando una ruta de cadena.
 * Crea la ruta si no existe.
 * @param {object} obj - El objeto a modificar.
 * @param {string} path - La ruta donde se establecerá el valor.
 * @param {*} value - El valor a establecer.
 * @returns {object} El objeto modificado.
 */
function set(obj, path, value) {
  // Regex para separar la parte principal del path de la parte con corchetes
  const pathRegex = /([a-zA-Z0-9._]+)\[([^\]]+)\]/;
  const match = path.match(pathRegex);

  let keys;
  if (match) {
    // Si hay corchetes, evaluamos la clave dentro de ellos
    const mainPath = match[1];
    const dynamicKey = math.evaluate(match[2], obj); // El 'scope' es el mismo objeto
    keys = [...mainPath.split('.'), dynamicKey];
  } else {
    // Si no hay corchetes, funciona como antes
    keys = Array.isArray(path) ? path : path.split('.');
  }
  
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null) {
      const nextKey = keys[i + 1];
      // Si la siguiente clave parece un número, creamos un array, si no un objeto
      const isNextKeyNumeric = !isNaN(parseInt(nextKey, 10));
      current[key] = isNextKeyNumeric ? [] : {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return obj;
}

function buildPoints(rows, pasa_results) {
  if (!Array.isArray(rows)) return [];
  return rows.map(row => ({
    mm: row.mm,
    pasa: get(pasa_results, row.key, 0)
  }));
}

// Importar helpers en el scope de mathjs para que puedan ser usados en las fórmulas
math.import({
  get,
  set,
  isFinite: Number.isFinite,
  isObject: (val) => typeof val === 'object' && val !== null,
  values: Object.values,
  buildPoints,
}, {
  override: true
});


// --- Librería de Motores Genéricos ---

const engineMap = {
  /**
   * Realiza interpolación lineal o log-lineal en un conjunto de puntos.
   * @param {object} params - Parámetros del motor.
   * @param {Array<object>} params.points - Array de puntos de datos (ej: [{x: 10, y: 20}, {x: 30, y: 40}]).
   * @param {number} params.targetX - El valor de X para el cual se quiere interpolar Y.
   * @param {string} params.xKey - El nombre de la propiedad que contiene el valor X en los puntos.
   * @param {string} params.yKey - El nombre de la propiedad que contiene el valor Y en los puntos.
   * @param {boolean} [params.logScaleX=false] - Indica si la escala X es logarítmica.
   * @returns {number | null} El valor Y interpolado, o null si no se puede calcular.
   */
  interpolate: ({ points, targetX, xKey, yKey, logScaleX = false }) => {
    if (!points || !Array.isArray(points)) return null;

    // Filtrar puntos inválidos antes de procesar
    const validPoints = points.filter(p => p && typeof p[xKey] === 'number' && isFinite(p[xKey]));

    if (validPoints.length < 2) return null;

    const sortedPoints = [...validPoints].sort((a, b) => a[xKey] - b[xKey]);

    let p1 = null, p2 = null;
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        if (sortedPoints[i][xKey] <= targetX && sortedPoints[i+1][xKey] >= targetX) {
            p1 = sortedPoints[i];
            p2 = sortedPoints[i+1];
            break;
        }
    }

    if (!p1 || !p2) return null; // El targetX está fuera del rango de los puntos.
    
    if (p1[xKey] === p2[xKey]) return p1[yKey]; // Evitar división por cero.

    const x1 = p1[xKey];
    const y1 = p1[yKey];
    const x2 = p2[xKey];
    const y2 = p2[yKey];

    if (logScaleX) {
        if (x1 <= 0 || x2 <= 0 || targetX <= 0) return null; // Logaritmo no definido para <= 0
        const logX1 = Math.log10(x1);
        const logX2 = Math.log10(x2);
        const logTargetX = Math.log10(targetX);
        const factor = (logTargetX - logX1) / (logX2 - logX1);
        return y1 + factor * (y2 - y1);
    } else {
        const factor = (targetX - x1) / (x2 - x1);
        return y1 + factor * (y2 - y1);
    }
  },
};


// --- Intérprete Principal de Cálculos ---

function _processSteps(steps, context) {
  for (const step of steps) {
    try {
      const shouldExecute = step.condition ? math.evaluate(step.condition, context) : true;
      if (!shouldExecute) {
        continue;
      }

      switch (step.type) {
        case 'comment': {
          // Ignorar silenciosamente los comentarios
          break;
        }

        case 'expression': {
          const result = math.evaluate(step.expression, context);
          if (step.output) {
            set(context, step.output, result);
          }
          break;
        }

        case 'loop': {
          const loopConfig = step.config;
          const items = get(context, loopConfig.items, []);
          if (!Array.isArray(items)) {
            console.error(`Loop error: "items" path did not resolve to an array.`, step);
            continue;
          }

          const itemVar = loopConfig.itemVar || 'item';
          const indexVar = loopConfig.indexVar || 'index';
          const prevItemVar = loopConfig.prevItemVar || 'prev_item';

          for (let i = 0; i < items.length; i++) {
            const loopScope = Object.create(context);
            loopScope[itemVar] = items[i];
            loopScope[indexVar] = i;
            loopScope[prevItemVar] = i > 0 ? items[i - 1] : null;
            
            if (loopConfig.scope_vars) {
                for (const varName in loopConfig.scope_vars) {
                    loopScope[varName] = math.evaluate(loopConfig.scope_vars[varName], loopScope);
                }
            }
            
            _processSteps(loopConfig.actions, loopScope);
          }
          break;
        }

        case 'engine': {
          const engineConfig = step.config;
          const engineName = engineConfig.name;
          const engineFunc = engineMap[engineName];

          if (typeof engineFunc !== 'function') {
            console.error(`Motor no encontrado o no es una función: '${engineName}'`);
            continue;
          }

          const resolvedInputs = {};
          for (const key in engineConfig.inputs) {
            const inputValue = engineConfig.inputs[key];
            if (typeof inputValue === 'string') {
              resolvedInputs[key] = math.evaluate(inputValue, context);
            } else {
              resolvedInputs[key] = inputValue;
            }
          }

          const result = engineFunc(resolvedInputs);

          if (engineConfig.output) {
            set(context, engineConfig.output, result);
          }
          break;
        }
        
        case 'switch': {
          const switchConfig = step.config;
          const value = math.evaluate(switchConfig.expression, context);

          let matched = false;
          if (switchConfig.cases) {
            for (const caseItem of switchConfig.cases) {
              let isMatch = false;
              try {
                // Intenta evaluar una condición, ej. `value > 50` se convierte en `60 > 50`
                isMatch = math.evaluate(value + ' ' + caseItem.case, context);
              } catch(e) {
                // Si falla, es una comparación de igualdad.
                isMatch = (value == caseItem.case);
              }
              
              if (isMatch) {
                _processSteps(caseItem.actions, context);
                matched = true;
                break;
              }
            }
          }

          if (!matched && switchConfig.default) {
            _processSteps(switchConfig.default.actions, context);
          }
          break;
        }

        default:
          console.warn(`Tipo de paso desconocido: '${step.type}'. Saltando.`);
      }
    } catch (error) {
      console.error(`Error fatal en el paso:`, { step, error });
      if (step.output) {
        set(context, step.output, { error: `Error en el paso: ${error.message}` });
      }
    }
  }
}


/**
 * Ejecuta una secuencia de pasos de cálculo definidos en una configuración.
 * @param {object} calculationConfig - El objeto de configuración que define los cálculos.
 * @param {object} inputData - Un objeto que contiene todos los datos de entrada (ej: { formData, tableConfig }).
 * @returns {object} Un objeto con los resultados de los cálculos.
 */
export function calcularResultados(calculationConfig, inputData) {
  if (!calculationConfig || !calculationConfig.steps) {
    console.error("Configuración de cálculo inválida o ausente.");
    return { error: "Configuración de cálculo inválida." };
  }

  const context = {
    inputs: inputData,
    vars: {},
    results: {},
    ...math,
  };

  if (calculationConfig.vars) {
    for (const varName in calculationConfig.vars) {
      try {
        const result = math.evaluate(calculationConfig.vars[varName], context);
        set(context.vars, varName, result);
      } catch (error) {
        console.error(`Error inicializando la variable '${varName}':`, error);
        context.vars[varName] = { error: `Error en la fórmula: ${error.message}` };
      }
    }
  }

  _processSteps(calculationConfig.steps, context);

  return context.results;
}