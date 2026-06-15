import React, { useMemo } from 'react';
import './ResultadosBrevesModal.css';
import { calcularResultados } from './ensayos.calculos.js';

// Helper function to get nested property values from an object
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const ResultadosBrevesModal = ({ ensayo, onClose }) => {
  // Use results_config from the ensayo object, with a fallback for safety
  const config = ensayo?.results_config || { groups: [] };

  // === LÓGICA DE CÁLCULO AL VUELO ===
  // Si el ensayo tiene resultados guardados, los usamos.
  // Si no, y tiene config_calculos, calculamos al vuelo (ideal para imports).
  const resultadosFinales = useMemo(() => {
    if (!ensayo) return {}; // Manejo seguro dentro del hook

    if (ensayo.resultado) {
      console.log('[RESULTADOS BREVES] Usando resultados persistidos DB');
      return ensayo.resultado;
    }
    if (ensayo.config_calculos && ensayo.datos_formulario) {
      console.log('[RESULTADOS BREVES] Resultados persistidos son NULL. Calculando al vuelo...');
      try {
        // calcularResultados devuelve un objeto { results: ... } o la estructura que defina la config
        const calculados = calcularResultados(ensayo.config_calculos, ensayo.datos_formulario, ensayo.config_tabla);
        console.log('[RESULTADOS BREVES] Resultado del cálculo al vuelo:', calculados);

        // Ajuste importante: Si el motor nuevo devuelve { "results": { "granulometria": ... } }
        // y nuestras claves son "results.granulometria...", necesitamos asegurarnos de que el match sea correcto.
        // calcularResultados (new engine) devuelve el objeto tal cual.
        return calculados;
      } catch (e) {
        console.error('Error calculando al vuelo:', e);
        return {};
      }
    }
    return {};
  }, [ensayo]);

  console.log('[DEBUG RESULTADOS BREVES] Data Final a Renderizar:', resultadosFinales);
  console.log('[DEBUG RESULTADOS BREVES] Configuración config:', config);

  if (!ensayo) return null;

  return (
    <div className="resultados-modal-overlay" onClick={onClose}>
      <div className="resultados-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="resultados-modal-header">
          <h3>Resultados Breves: {ensayo.nombre_ensayo || ensayo.codigo_ensayo}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="resultados-modal-body">
          {config.groups && config.groups.length > 0 ? (
            config.groups.map((group, groupIndex) => (
              <div className="results-group" key={groupIndex}>
                {group.title && <h4>{group.title}</h4>}
                <div className="results-grid">
                  {group.fields.map((field, fieldIndex) => {
                    // Universal approach: Get data source key from the group, fallback to top-level.
                    const resultsKey = group.data_source_key || config.data_source_key;

                    // Normalizar el path: quitar 'results.' inicial si existe, ya que ensayo.resultado es el objeto results
                    let searchPath = resultsKey ? `${resultsKey}.${field.name}` : field.name;

                    // 1. Prioridad: Buscar en resultadosFinales (cálculos persistidos o al vuelo)
                    // Si el path empieza con 'results.', lo limpiamos para buscar dentro del objeto resultado
                    const cleanPathResult = searchPath.replace(/^results\./, '');
                    let value = getNestedValue(resultadosFinales, cleanPathResult);

                    // 2. Fallback: Buscar en datos_formulario (inputs crudos)
                    // Si no lo encontramos en resultados, buscamos en los inputs
                    if (value === undefined) {
                      const cleanPathForm = searchPath.replace(/^tables\./, ''); // Por si viene con tables.
                      value = getNestedValue(ensayo.datos_formulario, cleanPathForm);
                    }

                    // 3. Fallback: buscar directamente por field.name en datos_formulario (por si acaso)
                    if (value === undefined) {
                      value = getNestedValue(ensayo.datos_formulario, field.name);
                    }

                    // 4. Fallback: buscar en la raíz del ensayo (metadatos)
                    if (value === undefined) {
                      value = getNestedValue(ensayo, field.name);
                    }

                    return (
                      <div className="result-item" key={fieldIndex}>
                        <span className="result-label">{field.label}:</span>
                        <span className="result-value">
                          {value !== undefined && value !== null
                            ? (typeof value === 'number' && field.digits !== undefined
                              ? value.toFixed(field.digits)
                              : String(value))
                            : 'N/A'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p>No hay configuración de resultados breves para este tipo de ensayo.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultadosBrevesModal;
