import React from 'react';

// --- Sub-componentes de Sección --- //
import FormularioSimple from './secciones/CamposGenerales.jsx';
import SeccionTablaDinamica from './secciones/SeccionTablaDinamica.jsx'; // Unico componente para tablas

// --- Mapa de Componentes --- //

const componentMap = {
  'CamposGenerales': FormularioSimple,
  'TablaTamices': SeccionTablaDinamica,
  'TablaLimiteLiquido': SeccionTablaDinamica,
  'TablaLimitePlastico': SeccionTablaDinamica,
  // Añadimos una clave genérica para el nuevo sistema
  'SeccionTablaDinamica': SeccionTablaDinamica,
};

// --- Componente Principal --- //

const EnsayoFormulario = ({ data, onInputChange, resultados, formConfig, tableConfig }) => {

  const renderSectionComponent = (seccion, customTableConfig = null) => {
    const ComponenteDinamico = componentMap[seccion.componente_key];
    // Usa el customTableConfig si se provee (para el modo fallback), si no, busca en el tableConfig general.
    const seccionTableConfig = customTableConfig || (tableConfig ? tableConfig[seccion.config_key] : null);

    if (ComponenteDinamico) {
      return (
        <ComponenteDinamico
          key={seccion.id}
          seccion={seccion}
          data={data}
          onInputChange={onInputChange}
          resultados={resultados}
          tableConfig={seccionTableConfig}
        />
      );
    }
    return <div key={seccion.id}>Error: Componente no encontrado para la clave: {seccion.componente_key}</div>;
  };

  // Si no hay secciones definidas en la DB, pero sí hay una config de tabla, renderizamos desde la config de tabla.
  // Esto es para ensayos más nuevos como CBR.
  if ((!formConfig || !formConfig.secciones || formConfig.secciones.length === 0) && 
      (tableConfig && typeof tableConfig === 'object' && Object.keys(tableConfig).length > 0)) {
    
    return (
      <div className="essay-tables-flex-container" style={{ flexDirection: 'column', gap: '1rem' }}>
        {Object.keys(tableConfig).map(key => {
          const seccionTableConfig = tableConfig[key];
          // Creamos un objeto 'seccion' simulado para pasar al componente de tabla
          const mockSeccion = {
            id: `fallback-${key}`,
            titulo: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), // Capitaliza y quita guiones bajos
            componente_key: 'SeccionTablaDinamica'
          };
          console.log(`DEBUG: Generando mockSeccion con título: ${mockSeccion.titulo}`);

          return (
            <div key={mockSeccion.id} className="essay-tables-flex-item">
              {renderSectionComponent(mockSeccion, seccionTableConfig)}
            </div>
          );
        })}
      </div>
    );
  }

  // Lógica original para ensayos que sí usan `formulario_secciones`
  if (!formConfig || !formConfig.secciones) {
    return <div>Cargando configuración del formulario...</div>;
  }

  const renderSections = () => {
    const groupedSections = [];
    let i = 0;
    while (i < formConfig.secciones.length) {
      const currentSection = formConfig.secciones[i];
      if (currentSection.layout_style === 'side-by-side') {
        const group = [currentSection];
        let j = i + 1;
        while (j < formConfig.secciones.length && formConfig.secciones[j].layout_style === 'side-by-side') {
          group.push(formConfig.secciones[j]);
          j++;
        }
        groupedSections.push(group);
        i = j;
      } else {
        groupedSections.push(currentSection);
        i++;
      }
    }

    return groupedSections.map((group, index) => {
      if (Array.isArray(group)) {
        return (
          <div key={`group-${index}`} className="essay-tables-flex-container">
            {group.map(seccion => (
              <div key={seccion.id} className="essay-tables-flex-item">
                {renderSectionComponent(seccion)}
              </div>
            ))}
          </div>
        );
      } else {
        return renderSectionComponent(group);
      }
    });
  };

  return (
    <div>
      {renderSections()}
    </div>
  );
};

export default EnsayoFormulario;