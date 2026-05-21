import React from 'react';

const CamposGenerales = ({ seccion, data, onInputChange, resultados }) => (
  <div className="campos-generales-container" key={seccion.titulo}>
    <h5 className="campos-generales-header">{seccion.titulo}</h5>
    <div className="campos-generales-grid">
      {seccion.campos.map((field) => {
        const fieldName = `general_fields.${field.key}`;
        const isReadOnly = field.readOnly || field.input_config?.readOnly || field.type === 'calculated';
        const isDisabled = field.disabled || field.input_config?.disabled;

        // Determinar el valor a mostrar. Si es de sólo lectura o calculado, priorizar resultados
        let displayValue = data.general_fields?.[field.key] ?? '';
        if (isReadOnly) {
          if (resultados?.general_fields?.[field.key] !== undefined && resultados?.general_fields?.[field.key] !== null) {
            displayValue = resultados.general_fields[field.key];
          } else if (resultados?.[field.key] !== undefined && resultados?.[field.key] !== null) {
            displayValue = resultados[field.key];
          }
        }

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
                  value={displayValue}
                  onChange={onInputChange}
                  required={field.required}
                  disabled={isDisabled}
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
                  value={displayValue}
                  onChange={onInputChange}
                  required={field.required}
                  readOnly={isReadOnly}
                  disabled={isDisabled}
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
