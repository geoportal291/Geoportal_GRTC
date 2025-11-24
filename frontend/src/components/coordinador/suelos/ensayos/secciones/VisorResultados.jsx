import React from 'react';

const VisorResultados = ({ config, data }) => {
  if (!config || !config.groups) {
    return <div>No hay configuración de resultados disponible.</div>;
  }

  const getValue = (obj, name) => {
    if (!obj) return 0;
    if (obj[name] !== undefined) return obj[name];
    
    // Intenta buscar en sub-objetos (granulometria, limites, etc.)
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && obj[key][name] !== undefined) {
            return obj[key][name];
        }
    }
    return 0;
  }

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
                    {typeof getValue(data, field.name) === 'number'
                      ? (getValue(data, field.name) || 0).toFixed(field.digits || 2)
                      : getValue(data, field.name)}
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
