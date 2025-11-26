import React from 'react';

const VisorResultados = ({ config, data }) => {
  console.log("[DEBUG VisorResultados] Props recibidas:", { config, data });

  if (!config || !config.groups) {
    return <div>No hay configuración de resultados disponible.</div>;
  }

  const getValue = (obj, name) => {
    if (!obj) return null;
    if (obj[name] !== undefined) return obj[name];
    
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && obj[key][name] !== undefined) {
            return obj[key][name];
        }
    }
    return null;
  }

  const renderValue = (value, field) => {
    if (value === null || value === undefined) {
      return 'N/D';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value.toFixed(field.digits || 2);
    }
    
    if (typeof value === 'object' && value.error) {
      return <span className="text-danger" title={value.error}><i className="fas fa-exclamation-triangle"></i> Error</span>;
    }

    if (typeof value === 'object') {
        return <span className="text-muted">[Dato complejo]</span>
    }

    return String(value);
  };

  return (
    <div className="row">
      {config.groups.map((group, index) => (
        <div className="col-md-6" key={index}>
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="card-title mb-0"><i className="fas fa-calculator me-1"></i>{group.title}</h6>
            </div>
            <div className="card-body">
              {group.fields.map((field, fieldIndex) => (
                <div className="result-box" key={fieldIndex}>
                  <div className="result-title">{field.label}:</div>
                  <div className="result-value">
                    {renderValue(getValue(data, field.name), field)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VisorResultados;
