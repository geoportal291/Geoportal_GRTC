/* eslint-disable no-restricted-globals */
import { create, all } from 'mathjs';

const math = create(all);

// --- Funciones de Utilidad (Helpers) ---

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
 * ¡NUEVA FUNCIÓN! CON LOGS DE DEPURACIÓN DETALLADOS.
 */
function get_nested_value(obj, path, defaultValue = 0) {
    if (typeof path !== 'string' || !path) {
        console.warn(`[get_nested_value] Ruta inválida o vacía. Devolviendo valor por defecto.`);
        return defaultValue;
    }
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (current === null || current === undefined) {
            console.warn(`[get_nested_value] Fallo en la ruta en la clave '${key}'. El objeto padre es nulo o indefinido. Path completo: "${path}"`);
            return defaultValue;
        }
        current = current[key];
    }
    
    if (current === undefined || current === null) {
        return defaultValue;
    }
    return current;
}


function set(obj, path, value) {
  const pathRegex = /([a-zA-Z0-9._]+)\[([^\]]+)\]/;
  const match = path.match(pathRegex);

  let keys;
  if (match) {
    const mainPath = match[1];
    const dynamicKey = math.evaluate(match[2], obj);
    keys = [...mainPath.split('.'), dynamicKey];
  } else {
    keys = Array.isArray(path) ? path : path.split('.');
  }
  
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null) {
      const nextKey = keys[i + 1];
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

math.import({
  get,
  set,
  isFinite: Number.isFinite,
  isObject: (val) => typeof val === 'object' && val !== null,
  values: Object.values,
  buildPoints,
  get_nested_value,
}, {
  override: true
});


const engineMap = {
  interpolate: ({ points, targetX, xKey, yKey, logScaleY = false }) => {
    if (!points || !Array.isArray(points)) return null;

    const validPoints = points.filter(p => p && typeof p[xKey] === 'number' && isFinite(p[xKey]) && p.mm !== null && p.mm > 0);

    if (validPoints.length < 2) return null;

    const sortedPoints = [...validPoints].sort((a, b) => a[xKey] - b[xKey]);
    
    let p1 = null, p2 = null;

    const reversedSortedPoints = [...sortedPoints].reverse();

    for (let i = 0; i < reversedSortedPoints.length - 1; i++) {
        if (reversedSortedPoints[i][xKey] >= targetX && reversedSortedPoints[i + 1][xKey] <= targetX) {
            p1 = reversedSortedPoints[i + 1];
            p2 = reversedSortedPoints[i];
            break;
        }
    }

    if (!p1 || !p2) return null;
    if (p1[xKey] === p2[xKey]) return p1[yKey];

    const x1 = p1[xKey];
    const y1 = p1[yKey];
    const x2 = p2[xKey];
    const y2 = p2[yKey];
    
    if (logScaleY) {
        if (y1 <= 0 || y2 <= 0) return null;
        const logY1 = Math.log10(y1);
        const logY2 = Math.log10(y2);
        const factor = (targetX - x1) / (x2 - x1);
        const interpolatedLogY = logY1 + factor * (logY2 - logY1);
        return Math.pow(10, interpolatedLogY);
    } else {
        const factor = (targetX - x1) / (x2 - x1);
        return y1 + factor * (y2 - y1);
    }
  },

  findMaxPoint: ({ points, xKey, yKey }) => {
    const dataPoints = points && points._data ? points._data : points;

    if (!dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
      return { maxima_densidad_seca: null, humedad_optima: null };
    }

    let maxDensity = -Infinity;
    let optimalHumidity = null;

    for (const point of dataPoints) {
      const currentDensity = get(point, yKey, -Infinity);
      const currentHumidity = get(point, xKey, null);

      if (currentDensity > 0 && currentDensity > maxDensity) {
        maxDensity = currentDensity;
        optimalHumidity = currentHumidity;
      }
    }
    
    if (maxDensity === -Infinity) {
      return { maxima_densidad_seca: null, humedad_optima: null };
    }

    return { maxima_densidad_seca: maxDensity, humedad_optima: optimalHumidity };
  },
};


function _processSteps(steps, context) {
  for (const step of steps) {
    try {
      const shouldExecute = step.condition ? math.evaluate(step.condition, context) : true;
      if (!shouldExecute) {
        continue;
      }

      switch (step.type) {
        case 'comment':
          break;
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
                isMatch = math.evaluate(value + ' ' + caseItem.case, context);
              } catch(e) {
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
        const rawValue = calculationConfig.vars[varName];
        let result;

        if (typeof rawValue === 'number') {
            result = rawValue;
        } else {
            result = math.evaluate(rawValue, context);
        }

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
