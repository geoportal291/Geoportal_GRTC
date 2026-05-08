import React from 'react';
import './SeccionTablaDinamica.css';

// Helper para obtener valores anidados de forma segura
const getNested = (obj, path, defaultValue = 0) => {
  if (typeof path !== 'string' || !path) return defaultValue;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  // Si el valor es undefined, null o "", devolvemos el valor por defecto (0).
  if (current === undefined || current === null || current === "") return defaultValue;
  return current;
};

const renderDynamicInput = ({ name, value, onChange, inputType = 'number', className, inputConfig = {} }) => {
  const options = inputConfig?.options || [];
  const control = inputConfig?.control || (options.length > 0 ? 'select' : 'input');
  const resolvedValue = (value === '' || value === undefined || value === null)
    ? (inputConfig?.defaultValue ?? '')
    : value;

  if (control === 'select') {
    return (
      <select
        className={className}
        name={name}
        value={resolvedValue}
        onChange={onChange}
      >
        {!inputConfig?.hide_placeholder && (
          <option value="">{inputConfig?.placeholder || 'Seleccione'}</option>
        )}
        {options.map((option) => {
          const optionValue = typeof option === 'object' ? option.value : option;
          const optionLabel = typeof option === 'object' ? option.label : option;
          return (
            <option key={`${name}-${optionValue}`} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    );
  }

  return (
    <input
      type={inputType}
      step={inputConfig?.step || (inputType === 'number' ? '0.01' : undefined)}
      className={className}
      name={name}
      value={resolvedValue}
      onChange={onChange}
    />
  );
};

const SeccionTablaDinamica = ({ seccion, data, onInputChange, resultados, tableConfig }) => {
  const config = tableConfig;
  const rawHeaders = config?.headers || [];
  const rows = config?.rows || [];
  const isTransposed = config?.transposed || false;
  const headerGroups = config?.header_groups || [];

  // Evitar duplicidad: Filtrar headers que ya estén definidos en 'fields'
  const fieldKeys = new Set((config?.fields || []).map(f => f.key));
  const headers = rawHeaders.filter(h => !fieldKeys.has(h.key));

  if (!config) {
    return <div>Cargando configuración de la tabla...</div>;
  }

  const groupedSecondRowHeaders = (() => {
    if (isTransposed || headerGroups.length === 0) return headers;

    const secondRow = [];
    let headerIndex = 0;

    headerGroups.forEach((group) => {
      const span = group.colspan || 1;
      const groupHeaders = headers.slice(headerIndex, headerIndex + span);
      if ((group.rowspan || 1) === 1) {
        secondRow.push(...groupHeaders);
      }
      headerIndex += span;
    });

    if (headerIndex < headers.length) {
      secondRow.push(...headers.slice(headerIndex));
    }

    return secondRow;
  })();

  const renderCell = (cellConfig, rowData, colData) => {
    const { type, input_config, result_config, digits } = cellConfig;
    const override = rowData.cell_overrides ? rowData.cell_overrides[cellConfig.key] : null;

    const finalType = override?.type || type;
    const finalInputConfig = override?.input_config || input_config;
    const finalResultConfig = override?.result_config || result_config;
    const finalDigits = override?.digits ?? digits;

    const cellKey = cellConfig.key;
    const colId = isTransposed ? colData?.id : null;
    const rowId = rowData?.key || rowData?.id;

    if (finalType === 'static') {
      return isTransposed ? rowData.label : rowData[cellKey];
    }

    if (finalType === 'input') {
      const tableKey = config.key;

      if (!tableKey) {
        console.error("Error de Configuración: La tabla no tiene una 'key' definida en config_tabla.", config);
        return <input disabled value="Error: Tabla sin 'key'" className="form-control form-control-sm" />;
      }

      const rowKey = rowData?.key || rowData?.id;
      const colKey = cellConfig.key;
      const fieldName = `tables.${tableKey}.${rowKey}.${colKey}`;

      return renderDynamicInput({
        name: fieldName,
        value: getNested(data, fieldName, ''),
        onChange: onInputChange,
        inputType: finalInputConfig?.type || 'number',
        className: 'form-control form-control-sm numeric-input',
        inputConfig: finalInputConfig || {}
      });
    }

    if (finalType === 'calculated') {
      if (!finalResultConfig || !finalResultConfig.path) {
        return <output className="text-center numeric-output">N/A</output>;
      }
      const { path: resultPath } = finalResultConfig;

      const finalResultKey = resultPath.replace('{row_key}', rowId);
      const value = getNested(resultados, finalResultKey, null);

      let displayValue = 'N/D';
      if (value !== null && value !== undefined) {
        if (typeof value === 'number' && isFinite(value)) {
          displayValue = value.toFixed(Number.isInteger(finalDigits) ? finalDigits : 2);
        } else if (typeof value === 'object' && value.error) {
          displayValue = <span className="text-danger" title={value.error}><i className="fas fa-exclamation-triangle"></i></span>;
        } else {
          displayValue = <span className="text-warning">!</span>
        }
      }
      return <output className="text-center numeric-output">{displayValue}</output>;
    }

    return null;
  };

  return (
    <div className={`table-responsive ensayo-dynamic-table ${isTransposed ? 'is-transposed' : 'is-standard'}`} key={seccion.titulo}>
      <h3 className="info-section-header">{seccion.titulo}</h3>

      {/* Renderizado de Campos de Cabecera Específicos de la Tabla (si existen) */}
      {config.fields && config.fields.length > 0 && (
        <div className="dynamic-section-group mb-3">
          {config.fields.map((field) => {
            // Binding: tables.{tableKey}.{fieldKey}
            // Usamos config.key porque es la key de la tabla actual
            const fieldName = `tables.${config.key}.${field.key}`;
            const val = getNested(data, fieldName, '');

            return (
              <div className="dynamic-section-item" style={{ width: field.width || '100%' }} key={field.key}>
                <div className="form-group mb-2">
                  <label htmlFor={fieldName} className="form-label small fw-bold text-muted mb-1">
                    {field.label}
                  </label>
                  {renderDynamicInput({
                    name: fieldName,
                    value: val,
                    onChange: onInputChange,
                    inputType: field.type || 'text',
                    className: 'form-control form-control-sm',
                    inputConfig: field.input_config || {}
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <table
        className={`table table-bordered table-sm ${headerGroups.length > 0 && !isTransposed ? 'grouped-header-table' : ''}`}
        style={{ width: '100%', margin: '0 auto', textAlign: 'center' }}
      >
        <thead className="table-dark">
          {isTransposed ? (
            <tr>
              <th className="dynamic-column-header">{config.transposed_header_label || 'Propiedad'}</th>
              {rows.map(row => (
                <th className="dynamic-column-header" key={row.id || row.key}>{row.label || `Ensayo ${row.id}`}</th>
              ))}
            </tr>
          ) : (
            <>
              {headerGroups.length > 0 && (
                <tr>
                  {headerGroups.map((group, index) => (
                    <th
                      key={`${group.label || 'group'}-${index}`}
                      colSpan={group.colspan || 1}
                      rowSpan={group.rowspan || 1}
                      className={`dynamic-column-header ${group.className || ''}`.trim()}
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
              )}
              <tr>
                {groupedSecondRowHeaders.map(header => (
                  <th className="dynamic-column-header" key={header.key} style={{ minWidth: header.width || header.minWidth || '80px' }}>
                    {header.label}
                  </th>
                ))}
              </tr>
            </>
          )}
        </thead>
        <tbody>
          {isTransposed
            ? (
              headers.map(header => {
                const headerKey = header.key;
                return (
                  <tr key={headerKey}>
                    <th className="dynamic-row-header">{header.label}</th>
                    {rows.map(row => (
                      <td key={`${headerKey}-${row.id || row.key}`}>
                        {renderCell(header, row, header)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )
            : (
              rows.map(row => {
                const rowKey = row.key || row.id;
                return (
                  <tr key={rowKey}>
                    {headers.map(header => (
                      <td key={`${rowKey}-${header.key}`}>
                        {renderCell(header, row, null)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )
          }
        </tbody>
      </table>
    </div>
  );
};

export default SeccionTablaDinamica;
