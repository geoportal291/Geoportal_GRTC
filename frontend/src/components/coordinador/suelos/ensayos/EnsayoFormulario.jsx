import React, { useState } from 'react';

// --- Sub-componentes de Sección --- //
import FormularioSimple from './secciones/CamposGenerales.jsx';
import SeccionTablaDinamica from './secciones/SeccionTablaDinamica.jsx';

// --- Mapa de Componentes --- //
const componentMap = {
  'CamposGenerales': FormularioSimple,
  'SeccionTablaDinamica': SeccionTablaDinamica,
};

// --- Componente Principal con Lógica de Pestañas --- //
const EnsayoFormulario = ({ data, onInputChange, resultados, tableConfig }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!tableConfig || (Object.keys(tableConfig).length === 0)) {
    return <div>Cargando configuración del formulario...</div>;
  }

  // Extraer campos generales y tablas de la configuración
  const generalFieldsSection = tableConfig.general_fields ? {
    key: 'general_fields',
    ...tableConfig.general_fields,
    componente_key: 'CamposGenerales'
  } : null;

  // Lógica simplificada: asume que las tablas siempre están bajo la clave "tables"
  const tableSections = tableConfig.tables ? Object.keys(tableConfig.tables).map(key => ({
    key,
    ...tableConfig.tables[key],
    componente_key: 'SeccionTablaDinamica'
  })) : [];
  
  const hasMultipleTables = tableSections.length > 2;

  // --- Funciones de Renderizado --- //

  const renderSingleSection = (section, isTabContent = false) => {
    const ComponenteDinamico = componentMap[section.componente_key];
    
    if (!ComponenteDinamico) {
      return <div key={section.key}>Error: Componente no encontrado para {section.componente_key}</div>;
    }

    // El estilo dinámico solo se aplica si no estamos en modo Pestaña
    const style = isTabContent ? {} : {
      flexBasis: section.layout?.width || '100%',
      maxWidth: section.layout?.width || '100%',
    };

    let componentProps = {};
    if (section.componente_key === 'CamposGenerales') {
      componentProps = {
        seccion: { titulo: section.title, campos: section.fields.map(f => ({ ...f, name: f.key })) },
        data, onInputChange,
      };
    } else { // SeccionTablaDinamica
      componentProps = {
        seccion: { id: section.key, titulo: section.title, componente_key: section.componente_key },
        data, onInputChange, resultados, tableConfig: section,
      };
    }

    return (
      <div key={section.key} style={style} className="dynamic-section-item">
        <ComponenteDinamico {...componentProps} />
      </div>
    );
  };
  
  const renderColumnLayout = () => {
    const allSections = generalFieldsSection ? [generalFieldsSection, ...tableSections] : tableSections;
    const groupedSections = allSections.reduce((acc, section) => {
      const groupKey = section.layout?.group || `group_${section.key}`;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(section);
      return acc;
    }, {});

    return Object.keys(groupedSections).map(groupKey => (
      <div key={groupKey} className="dynamic-section-group">
        {groupedSections[groupKey].map(section => renderSingleSection(section, false))}
      </div>
    ));
  };
  
  const renderTabLayout = () => (
    <>
      {generalFieldsSection && renderSingleSection(generalFieldsSection, true)}
      <div className="form-tabs-container">
        <ul className="nav nav-tabs">
          {tableSections.map((table, index) => (
            <li className="nav-item" key={table.key}>
              <button
                className={`nav-link ${activeTab === index ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {table.title || table.key}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="form-tab-content mt-3">
        {renderSingleSection(tableSections[activeTab], true)}
      </div>
    </>
  );

  // --- Renderizado Principal --- //
  return (
    <div>
      {hasMultipleTables ? renderTabLayout() : renderColumnLayout()}
    </div>
  );
};

export default EnsayoFormulario;