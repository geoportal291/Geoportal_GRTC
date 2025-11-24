import React from 'react';

const CamposGenerales = ({ seccion, data, onInputChange }) => (
  <div className="card mb-3" key={seccion.titulo}>
    <div className="card-header">{seccion.titulo}</div>
    <div className="card-body">
      <div className="row">
        {seccion.campos.map((field) => (
          <div className="col-md-4" key={field.name}>
            <div className="form-group mb-3">
              <label htmlFor={field.name} className={`form-label ${field.required ? 'required' : ''}`}>
                {field.label}
              </label>
              <input
                type={field.type}
                step={field.step || 'any'}
                className="form-control form-control-sm"
                id={field.name}
                name={field.name}
                value={data[field.name] || ''}
                onChange={onInputChange}
                required={field.required}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CamposGenerales;
