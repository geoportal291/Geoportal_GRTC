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

  // Generamos la clave de la sección (ej: "ensayo_de_compactacion_cbr") una sola vez
  const sectionKey = (seccion.titulo || '')
      .toLowerCase()
      .normalize('NFD') // Normaliza para separar acentos de letras
      .replace(/[\u0300-\u036f]/g, '') // Elimina los caracteres de acento
      .replace(/ /g, '_') // Reemplaza espacios con guiones bajos
      .replace(/[^a-z0-9_]/g, ''); // Limpia cualquier otro caracter no deseado

  if (!config) {
    return <div>Cargando configuración de la tabla...</div>;
  }

  // --- RENDERIZADO DE CAMPOS SUPERIORES (CORREGIDO) ---
  const renderTopFields = () => {
    if (!config.fields || config.fields.length === 0) return null;

    const totalColumns = config.layout?.columns || 1;

    return (
      <div 
        className="top-fields-container mb-3" 
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
          gap: '1rem',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          border: '1px solid #dee2e6'
        }}
      >
        {config.fields.map((field) => {
          // Lógica de ancho de columnas
          let span = 1;
          if (field.width === '100%') span = totalColumns;
          else if (field.width === '50%') span = Math.max(1, Math.floor(totalColumns / 2));
          else if (field.width === '25%') span = 1;

          // Generamos el nombre correcto para que se guarde en la BD
          // Ahora construimos la ruta directamente en 'general_fields' para los campos generales
          const fieldName = `general_fields.${field.key}`;
          
          return (
            <div key={field.key} style={{ gridColumn: `span ${span}` }}>
              <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.25rem', display:'block' }}>
                {field.label}
              </label>
              
              {field.type === 'select' ? (
                <select
                  className="form-control form-control-sm"
                  name={fieldName}
                  value={getNested(data, fieldName, '')} // Usamos getNested para leer el valor guardado
                  onChange={onInputChange}
                >
                  <option value="">Seleccione...</option>

                </select>
              ) : (
                <input
                  type={field.type} // date, time, text, etc.
                  className="form-control form-control-sm"
                  name={fieldName}
                  value={getNested(data, fieldName, '')} // Usamos getNested para leer el valor guardado
                  onChange={onInputChange}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };
  // --------------------------------------------------------

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
      const tableKey = config.key;

      // Si no hay una clave de tabla definida en la configuración, no se puede continuar.
      if (!tableKey) {
        console.error("Error de Configuración: La tabla no tiene una 'key' definida en config_tabla.", config);
        return <input disabled value="Error: Tabla sin 'key'" className="form-control form-control-sm" />;
      }

      let fieldName;
      const rowKey = rowData?.key || rowData?.id;
      const colKey = cellConfig.key;
      const sampleKeyForTransposed = colData?.id || colData?.key;

      // Lógica para determinar el 'fieldName' correcto basado en la estructura de la tabla
      if (isTransposed) {
        // Tablas transpuestas (Límites): La muestra está en la columna, la propiedad en la fila.
        const propertyName = finalInputConfig?.name || cellConfig.key;
        fieldName = `tables.${tableKey}.${sampleKeyForTransposed}.${propertyName}`;
      
      } else if (headers[0]?.key === 'label' && headers[0]?.type === 'static' && colKey !== 'label') {
        // Tablas normales estilo Proctor/CBR: Las columnas (después de 'label') son las muestras.
        // La fila es la propiedad.
        // fieldName -> tables.datos_entrada.m1.peso_molde_suelo
        fieldName = `tables.${tableKey}.${colKey}.${rowKey}`;
      
      } else {
        // Tablas normales estilo Granulometría: La fila es la muestra (tamiz).
        // La columna es la propiedad.
        // fieldName -> tables.granulometria.n4.retenido
        fieldName = `tables.${tableKey}.${rowKey}.${colKey}`;
      }

      return (
        <input
          type={finalInputConfig?.type || 'number'}
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
      
      {/* RENDERIZAMOS LOS CAMPOS SUPERIORES AQUÍ */}
      {renderTopFields()}

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