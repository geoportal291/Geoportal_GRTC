import React from 'react';

const CamposGenerales = ({ seccion, data, onInputChange }) => (
  <div className="campos-generales-container" key={seccion.titulo}>
    <h5 className="campos-generales-header">{seccion.titulo}</h5>
    <div className="campos-generales-grid">
      {seccion.campos.map((field) => (
        <div className="campo-general-item" key={field.name}>
          <div className="form-group mb-3">
            <label htmlFor={field.name} className={`form-label ${field.required ? 'required' : ''}`}>
              {field.label}
            </label>
            <input
              type={field.type}
              step={field.step || 'any'}
              className="form-control form-control-sm"
              id={field.name}
              name={`general_fields.${field.name}`} // FIX: Generar el nombre con la ruta anidada correcta
              value={data.general_fields?.[field.name] || ''} // FIX: Leer el valor de la ruta anidada correcta
              onChange={onInputChange}
              required={field.required}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CamposGenerales;
