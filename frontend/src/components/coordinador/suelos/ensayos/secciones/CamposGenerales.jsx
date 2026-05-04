import React from 'react';

const CamposGenerales = ({ seccion, data, onInputChange }) => (
  <div className="campos-generales-container" key={seccion.titulo}>
    <h5 className="campos-generales-header">{seccion.titulo}</h5>
    <div className="campos-generales-grid">
      {seccion.campos.map((field) => {
        const fieldName = `general_fields.${field.key}`;
        return (
          <div className="campo-general-item" key={field.key}>
            <div className="form-group mb-3">
              <label htmlFor={fieldName} className={`form-label ${field.required ? 'required' : ''}`}>
                {field.label}
              </label>
              {(field.input_config?.control === 'select' || (field.input_config?.options || []).length > 0) ? (
                <select
                  className="form-control form-control-sm"
                  id={fieldName}
                  name={fieldName}
                  value={data.general_fields?.[field.key] || ''}
                  onChange={onInputChange}
                  required={field.required}
                >
                  <option value="">{field.input_config?.placeholder || 'Seleccione'}</option>
                  {(field.input_config?.options || []).map((option) => {
                    const optionValue = typeof option === 'object' ? option.value : option;
                    const optionLabel = typeof option === 'object' ? option.label : option;
                    return (
                      <option key={`${fieldName}-${optionValue}`} value={optionValue}>
                        {optionLabel}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type={field.type}
                  step={field.step || 'any'}
                  className="form-control form-control-sm"
                  id={fieldName}
                  name={fieldName}
                  value={data.general_fields?.[field.key] || ''}
                  onChange={onInputChange}
                  required={field.required}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default CamposGenerales;
