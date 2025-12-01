import React from 'react';
import './SeccionTablaDinamica.css';

// Helper para obtener valores anidados de forma segura
const getNested = (obj, path, defaultValue = 0) => {
  const value = path
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== 'undefined') ? acc[key] : undefined, obj);
  return value === undefined ? defaultValue : value;
};

const SeccionTablaDinamica = ({ seccion, data, onInputChange, resultados, tableConfig }) => {
  const config = tableConfig;
  const headers = config?.headers || [];
  const rows = config?.rows || [];
  const isTransposed = config?.transposed || false;

  if (!config) {
    return <div>Cargando configuración de la tabla...</div>;
  }

  const renderCell = (cellConfig, rowData, colData) => {
    const { type, input_config, result_config } = cellConfig;
    const override = rowData.cell_overrides ? rowData.cell_overrides[cellConfig.key] : null;

    const finalType = override?.type || type;
    const finalInputConfig = override?.input_config || input_config;
    const finalResultConfig = override?.result_config || result_config;

    const cellKey = cellConfig.key;
    const colId = isTransposed ? colData?.id : null;
    const rowId = !isTransposed ? (rowData?.key || rowData?.id) : null;

    if (finalType === 'static') {
      return isTransposed ? rowData.label : rowData[cellKey];
    }

    if (finalType === 'input') {
      let fieldName;
      if (finalInputConfig) {
        fieldName = `${finalInputConfig.name}_${isTransposed ? colId : rowId}`;
      } else {
        const sectionKey = seccion.titulo.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
        fieldName = `${sectionKey}.${rowId}.${cellKey}`;
      }
      return (
        <input
          type={'number'}
          step="0.01"
          className="form-control form-control-sm numeric-input"
          name={fieldName}
          value={getNested(data, fieldName, '')}
          onChange={onInputChange}
        />
      );
    }

    if (finalType === 'calculated' && finalResultConfig) {
      const { key: resultKey, group: groupPath, scope } = finalResultConfig;
      let value;

      if (scope === 'global') {
        value = getNested(resultados, resultKey, null);
      } else {
        const dataGroup = getNested(resultados, groupPath ? `${groupPath}.${resultKey}` : resultKey, null);
        const idToUse = isTransposed ? colId : rowId;
        if (dataGroup) {
            value = dataGroup[idToUse];
        } else {
            value = null;
        }
      }

      let displayValue = 'N/D';
      if (value !== null && value !== undefined) {
        if (typeof value === 'number' && isFinite(value)) {
          displayValue = value.toFixed(2);
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
    <div className="table-responsive" key={seccion.titulo}>
      <h3 className="info-section-header">{seccion.titulo}</h3>
      <table
        className="table table-bordered table-sm"
        style={{ width: '100%', margin: '0 auto', textAlign: 'center' }}
      >
        <thead className="table-dark">
          <tr>
            {isTransposed
              ? (
                <>
                  <th>{config.transposed_header_label || 'Propiedad'}</th>
                  {rows.map(row => (
                    <th key={row.id || row.key}>{row.label || `Ensayo ${row.id}`}</th>
                  ))}
                </>
              )
              : (
                headers.map(header => (
                  <th key={header.key}>{header.label}</th>
                ))
              )
            }
          </tr>
        </thead>
        <tbody>
          {isTransposed
            ? (
              headers.map(header => {
                const headerKey = header.key;
                return (
                  <tr key={headerKey}>
                    <th>{header.label}</th>
                    {rows.map(row => (
                      <td key={`${headerKey}-${row.id || row.key}`}>
                        {renderCell(header, header, row)}
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
