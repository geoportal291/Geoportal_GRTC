import React, { useState } from 'react';
import FormularioSimple from './secciones/CamposGenerales.jsx';
import SeccionTablaDinamica from './secciones/SeccionTablaDinamica.jsx';

const EnsayoFormulario = ({ data, onInputChange, resultados, tableConfig }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Si no hay tableConfig, no se puede renderizar nada.
  if (!tableConfig || Object.keys(tableConfig).length === 0) {
    return <div>Cargando configuración del formulario...</div>;
  }

  // Estructura nueva: Múltiples tablas y campos generales separados
  const camposGenerales = tableConfig.general_fields || [];
  const tablas = Array.isArray(tableConfig.tables) ? tableConfig.tables : [];
  const generalFieldsAsTab = tableConfig.general_fields_as_tab === true;
  const hasGeneralFields = camposGenerales.length > 0;
  const sections = [
    ...(generalFieldsAsTab && hasGeneralFields ? [{ key: '__general__', title: 'Datos Generales', type: 'general' }] : []),
    ...tablas.map((tabla) => ({ ...tabla, type: 'table' }))
  ];

  // Estructura antigua (legacy): una sola tabla y campos en el nivel superior
  const legacyCampos = tableConfig.fields || [];
  const legacyHayTabla = tableConfig.headers && tableConfig.rows;

  // Si estamos en la nueva estructura
  if (tableConfig.general_fields || tableConfig.tables) {
    return (
      <div className="ensayo-formulario-container">
        {/* 1. Renderizar la sección de campos generales si existen y no van en pestaña */}
        {hasGeneralFields && !generalFieldsAsTab && (
          <FormularioSimple
            key="general-fields-section"
            seccion={{ titulo: 'Datos Generales', campos: camposGenerales }}
            data={data}
            onInputChange={onInputChange}
          />
        )}

        {/* 2. Lógica para renderizar tablas (con o sin pestañas) */}
        {sections.length > 1 ? (
          // Múltiples tablas: renderizar con pestañas
          // Múltiples tablas: renderizar con pestañas
          <div className="ensayo-tab-container mt-4">
            <ul className="ensayo-nav-tabs">
              {sections.map((section, index) => (
                <li className="ensayo-nav-item" key={section.key}>
                  <button
                    className={`ensayo-nav-link ${activeTab === index ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); setActiveTab(index); }}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
            <div className="ensayo-tab-content p-3 border border-top-0">
              {/* Contenido de las pestañas con renderizado directo */}
              {sections.map((section, index) => (
                <div
                  key={section.key}
                  className={activeTab === index ? 'ensayo-tab-pane active' : 'ensayo-tab-pane'}
                  style={{ display: activeTab === index ? 'block' : 'none' }}
                >
                  {section.type === 'general' ? (
                    <FormularioSimple
                      seccion={{ titulo: '', campos: camposGenerales }}
                      data={data}
                      onInputChange={onInputChange}
                    />
                  ) : (
                    <SeccionTablaDinamica
                      seccion={{ id: section.key, titulo: '' }}
                      data={data}
                      onInputChange={onInputChange}
                      resultados={resultados}
                      tableConfig={section}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Una o ninguna tabla: renderizar directamente
          tablas.map((tabla) => (
            <SeccionTablaDinamica
              key={tabla.key}
              seccion={{ id: tabla.key, titulo: tabla.title }}
              data={data}
              onInputChange={onInputChange}
              resultados={resultados}
              tableConfig={tabla}
            />
          ))
        )}
      </div>
    );
  }

  // Si estamos en la estructura antigua (para retrocompatibilidad con Granulometría)
  return (
    <div>
      {legacyCampos.length > 0 && (
        <FormularioSimple
          key="general-fields-section"
          seccion={{ titulo: 'Datos Generales', campos: legacyCampos }}
          data={data}
          onInputChange={onInputChange}
        />
      )}
      {legacyHayTabla && (
        <SeccionTablaDinamica
          key={tableConfig.key || 'main-table-section'}
          seccion={{ id: tableConfig.key, titulo: tableConfig.title }}
          data={data}
          onInputChange={onInputChange}
          resultados={resultados}
          tableConfig={tableConfig}
        />
      )}
    </div>
  );
};

export default EnsayoFormulario;
