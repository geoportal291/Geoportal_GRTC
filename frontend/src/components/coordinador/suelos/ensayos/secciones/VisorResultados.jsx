import React from 'react';

const VisorResultados = ({ config, data }) => {
  console.log('[DEBUG VisorResultados] Config:', config, 'Data:', data);

  if (!config || !config.groups) {
    return <div>No hay configuración de resultados disponible.</div>;
  }

  // Usar una función 'get' robusta que entienda paths anidados
  const getValue = (obj, path, defaultValue = null) => {
    if (!path) return defaultValue;
    const pathArray = Array.isArray(path) ? path : path.split('.');
    const result = pathArray.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
    return result === undefined ? defaultValue : result;
  };


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
