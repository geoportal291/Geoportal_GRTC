import React from 'react';
import './ResultadosBrevesModal.css';

// Helper function to get nested property values from an object
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const ResultadosBrevesModal = ({ ensayo, onClose }) => {
  if (!ensayo) return null;

  // Use results_config from the ensayo object, with a fallback for safety
  const config = ensayo.results_config || { groups: [] };

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
                    // First, try to get the value from the root object, then fallback to datos_formulario
                    let value = getNestedValue(ensayo, field.key);
                    if (value === undefined) {
                      value = getNestedValue(ensayo.datos_formulario, field.key);
                    }
                    return (
                      <div className="result-item" key={fieldIndex}>
                        <span className="result-label">{field.label}:</span>
                        <span className="result-value">
                          {value !== undefined && value !== null ? String(value) : 'N/A'}
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
