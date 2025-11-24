import React, { useState, useEffect } from 'react';
import './IndiceExpedienteSPP.css';

// Datos
const capasData = {
  riesgos: {
    nombre: "Cartografía Riesgos",
    fecha: "30/05/2023",
    estado: "aprobado",
    fechas: {
      inicio: "01/04/2023",
      planificada: "30/05/2023",
      real: "28/05/2023",
      actualizacion: "25/05/2023",
    },
    estadoInfo: {
      entrega: "28/05/2023",
      evaluacion: "29/05/2023",
      aprobacion: "30/05/2023",
      proxima: "30/11/2023",
    },
    descripcion: "Cartografía detallada de riesgos geológicos en la región norte.",
    responsables: {
      elaboradoPor: "Ing. Carlos Mendoza",
      fechaElaboracion: "25/05/2023",
      evaluadoPor: "Dra. María Fernández",
      fechaEvaluacion: "29/05/2023",
      aprobadoPor: "Mg. Jorge Rodríguez",
      fechaAprobacion: "30/05/2023",
    },
    archivos: [
      {
        nombre: "Mapa de Riesgos v1.0",
        version: "1.0",
      },
      {
        nombre: "Reporte Técnico Final",
        version: "2.1",
      },
      {
        nombre: "Anexo Fotográfico",
        version: "1.5",
      },
    ],
  },
  peligros: {
    nombre: "Cartografía Peligros",
    fecha: "15/06/2023",
    estado: "observado",
    fechas: {
      inicio: "01/05/2023",
      planificada: "15/06/2023",
      real: "14/06/2023",
      actualizacion: "10/06/2023",
    },
    estadoInfo: {
      entrega: "14/06/2023",
      evaluacion: "14/06/2023",
      aprobacion: null,
      proxima: "30/06/2023",
    },
    descripcion: "Cartografía de peligros naturales en la zona de estudio.",
    responsables: {
      elaboradoPor: "Ing. Laura Gutierrez",
      fechaElaboracion: "10/06/2023",
      evaluadoPor: "Dr. Ricardo Morales",
      fechaEvaluacion: "14/06/2023",
      aprobadoPor: null,
      fechaAprobacion: null,
    },
    archivos: [
      {
        nombre: "Mapa de Peligros v1.2",
        version: "1.2",
      },
    ],
  },
};

const disciplinasData = {
  geoportal: {
    title: "Geoportal",
    edt: "1.00",
    capas: [
      { edt: "1.01", nombre: "Caratula e índice", capaId: "riesgos" },
      { edt: "1.02", nombre: "Ficha técnica de la inversión INVIERTE.PE", capaId: "peligros" }
    ]
  },
  topografia: {
    title: "Topografía",
    edt: "2.00",
    capas: [
      { edt: "2.01", nombre: "Memoria Descriptiva General", capaId: "riesgos" },
      { edt: "2.02", nombre: "Memoria Descriptiva por Componentes", capaId: "peligros" }
    ]
  },
  geologia: {
    title: "Geología",
    edt: "3.00",
    capas: [
      { edt: "3.01", nombre: "Memoria Descriptiva", capaId: "riesgos" },
      { edt: "3.02", nombre: "Planos", capaId: "peligros" }
    ]
  },
  hidrologia: {
    title: "Hidrología",
    edt: "4.00",
    capas: [
      { edt: "4.01", nombre: "Estudios Hidrológicos", capaId: "riesgos" },
      { edt: "4.02", nombre: "Diseño de Drenaje", capaId: "peligros" }
    ]
  },
  trafico: {
    title: "Tráfico",
    edt: "5.00",
    capas: [
      { edt: "5.01", nombre: "Estudio de Tráfico", capaId: "riesgos" },
      { edt: "5.02", nombre: "Señalización", capaId: "peligros" }
    ]
  },
  seguridadVial: {
    title: "Seguridad Vial",
    edt: "6.00",
    capas: [
      { edt: "6.01", nombre: "Informe de Seguridad Vial", capaId: "riesgos" },
      { edt: "6.02", nombre: "Plan de desvíos", capaId: "peligros" }
    ]
  },
  inventarioVial: {
    title: "Inventario Vial",
    edt: "7.00",
    capas: [
      { edt: "7.01", nombre: "Inventario de Pavimentos", capaId: "riesgos" },
      { edt: "7.02", nombre: "Inventario de Puentes", capaId: "peligros" }
    ]
  },
  mecanicaSuelos: {
    title: "Mecánica de Suelos",
    edt: "8.00",
    capas: [
      { edt: "8.01", nombre: "Ensayos de Laboratorio", capaId: "riesgos" },
      { edt: "8.02", nombre: "Informe Geotécnico", capaId: "peligros" }
    ]
  }
};

// Componente Modal mejorado
const Modal = ({ isOpen, onClose, title, children }) => {
  // No se retorna null, la visibilidad se controla por CSS
  return (
    <>
      <div className={`spp-modal-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <div className={`spp-modal-container ${isOpen ? 'show' : ''}`}>
        <div className="spp-modal-content">
          <div className="spp-modal-header">
            <h3><i className="fas fa-info-circle"></i> {title}</h3>
            <button className="spp-close-modal" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="spp-modal-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

// Componente para la sección
const Section = ({ title, edt, isCollapsed, onToggle, children }) => (
  <div className="capas-section">
    <div className={`section-title ${isCollapsed ? 'collapsed' : ''}`} onClick={onToggle}>
      <div className="capa-edt">{edt}</div>
      <i className="fas fa-folder-open"></i>
      <h3>{title}</h3>
      <i className={`fas fa-chevron-down ${isCollapsed ? 'collapsed' : ''}`}></i>
    </div>
    <ul className={`capas-list ${isCollapsed ? 'collapsed' : ''}`}>
      {children}
    </ul>
  </div>
);

// Componente para cada capa
const CapaItem = ({ capa, onAction }) => {
  const { edt, nombre, estado } = capa;
  const estadoClass = `estado-${estado}`;
  const estadoText = estado.charAt(0).toUpperCase() + estado.slice(1);

  return (
    <li className="capa-container">
      <div className="capa-edt">{edt}</div>
      <div className="capa-name">
        <label>{nombre}</label>
      </div>
      <div className="capa-actions">
        <i className="fas fa-info-circle capa-info-icon" onClick={() => onAction('desc')}></i>
        <div className="capa-date" onClick={() => onAction('fecha')}>
          <i className="fas fa-calendar"></i>
        </div>
        <button className="btn-action btn-ver" onClick={() => onAction('ver')}>
          <i className="fas fa-eye"></i>
        </button>
        <button className="btn-action btn-editar" onClick={() => onAction('desc')}>
          <i className="fas fa-edit"></i>
        </button>
        <button className={`btn-action btn-estado ${estadoClass}`} onClick={() => onAction('estado')}>
          <i className={`fas ${estado === 'aprobado' ? 'fa-check-circle' : estado === 'observado' ? 'fa-exclamation-circle' : 'fa-clock'}`}></i>
          {estadoText}
        </button>
      </div>
    </li>
  );
};

// Componente principal
const IndiceExpedienteSPP = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedSections, setCollapsedSections] = useState(Object.keys(disciplinasData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    data: null
  });
  const [filteredDisciplinas, setFilteredDisciplinas] = useState(disciplinasData);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDisciplinas(disciplinasData);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = {};
    
    Object.keys(disciplinasData).forEach(key => {
      const disciplina = disciplinasData[key];
      
      if (disciplina.title.toLowerCase().includes(term)) {
        filtered[key] = disciplina;
        return;
      }
      
      const capasFiltradas = disciplina.capas.filter(capa => 
        capa.nombre.toLowerCase().includes(term)
      );
      
      if (capasFiltradas.length > 0) {
        filtered[key] = {
          ...disciplina,
          capas: capasFiltradas
        };
      }
    });
    
    setFilteredDisciplinas(filtered);
  }, [searchTerm]);

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleCapaAction = (actionType, capaId) => {
    setModalState({
      isOpen: true,
      type: actionType,
      data: capasData[capaId] || {}
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      data: null
    });
  };

  const renderModalContent = () => {
    const { data, type } = modalState;
    if (!data) return null;

    switch(type) {
      case 'ver':
        return (
          <>
            <div className="document-section">
              <h4><i className="fas fa-file-alt"></i> Archivos Aprobados</h4>
              <ul className="document-list">
                {data.archivos?.map((archivo, index) => (
                  <li key={index} className="document-item">
                    <div className="document-name">{archivo.nombre}</div>
                    <div className="version-container">
                      <div className="document-version">v{archivo.version}</div>
                      <div className="version-actions">
                        <div className="version-action view-action" title="Vista previa">
                          <i className="fas fa-eye"></i>
                        </div>
                        <div className="version-action download-action" title="Descargar">
                          <i className="fas fa-download"></i>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="document-section">
              <h4><i className="fas fa-users"></i> Responsables</h4>
              <div className="responsable-grid">
                <div className="responsable-card">
                  <div className="responsable-title">Elaborado por</div>
                  <div className="responsable-name">{data.responsables?.elaboradoPor || '-'}</div>
                  <div className="responsable-date">{data.responsables?.fechaElaboracion || '-'}</div>
                </div>
                <div className="responsable-card">
                  <div className="responsable-title">Evaluado por</div>
                  <div className="responsable-name">{data.responsables?.evaluadoPor || '-'}</div>
                  <div className="responsable-date">{data.responsables?.fechaEvaluacion || '-'}</div>
                </div>
                <div className="responsable-card">
                  <div className="responsable-title">Aprobado por</div>
                  <div className="responsable-name">{data.responsables?.aprobadoPor || '-'}</div>
                  <div className="responsable-date">{data.responsables?.fechaAprobacion || '-'}</div>
                </div>
              </div>
            </div>
          </>
        );
      
      case 'fecha':
        return (
          <>
            <div className="fecha-info">
              <h4><i className="fas fa-calendar-alt"></i> Cronograma de la Capa</h4>
              <div className="fecha-grid">
                <div className="fecha-item">
                  <span className="fecha-label">Fecha de Inicio:</span>
                  <span className="fecha-value">{data.fechas?.inicio || '-'}</span>
                </div>
                <div className="fecha-item">
                  <span className="fecha-label">Fecha Planificada:</span>
                  <span className="fecha-value">{data.fechas?.planificada || '-'}</span>
                </div>
                <div className="fecha-item">
                  <span className="fecha-label">Fecha Real:</span>
                  <span className="fecha-value">{data.fechas?.real || '-'}</span>
                </div>
                <div className="fecha-item">
                  <span className="fecha-label">Última Actualización:</span>
                  <span className="fecha-value">{data.fechas?.actualizacion || '-'}</span>
                </div>
              </div>
            </div>
          </>
        );
      
      case 'desc':
        return (
          <div className="desc-info">
            <h4><i className="fas fa-info-circle"></i> Información General</h4>
            <p>{data.descripcion || 'Descripción no disponible.'}</p>
          </div>
        );
      
      case 'estado':
        return (
          <div className="estado-detalle">
            <h4><i className="fas fa-clipboard-check"></i> Estado Actual</h4>
            <div className={`estado-badge estado-${data.estado || 'aprobado'}`}>
              {data.estado ? data.estado.charAt(0).toUpperCase() + data.estado.slice(1) : 'Aprobado'}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    const { data, type } = modalState;
    if (!data) return 'Información';
    
    switch(type) {
      case 'ver': return `Detalles: ${data.nombre || 'Capa'}`;
      case 'fecha': return `Fechas: ${data.nombre || 'Capa'}`;
      case 'desc': return `Descripción: ${data.nombre || 'Capa'}`;
      case 'estado': return `Estado: ${data.nombre || 'Capa'}`;
      default: return 'Información';
    }
  };

  const resultsCount = Object.keys(filteredDisciplinas).length;
  const showNoResults = searchTerm.trim() && resultsCount === 0;

  return (
    <div className="spp-content-wrapper">
      <div className="capas-container">
        <div className="capas-header">
          <h2><i className="fas fa-map"></i> INDICE DE EXPEDIENTE ACUMULADO SPP</h2>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar capa, subcapa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {showNoResults && (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No se encontraron resultados</h3>
            <p>Intente con diferentes términos de búsqueda</p>
          </div>
        )}

        {searchTerm.trim() && resultsCount > 0 && (
          <div className="search-results-info">
            <i className="fas fa-search"></i>
            <div>Mostrando {resultsCount} resultado(s) para "{searchTerm}"</div>
          </div>
        )}

        {Object.keys(filteredDisciplinas).map((disciplinaKey) => {
          const disciplina = filteredDisciplinas[disciplinaKey];
          const isCollapsed = collapsedSections[disciplinaKey];
          
          return (
            <Section
              key={disciplinaKey}
              title={disciplina.title}
              edt={disciplina.edt}
              isCollapsed={isCollapsed}
              onToggle={() => toggleSection(disciplinaKey)}
            >
              {disciplina.capas.map((capa, index) => (
                <CapaItem
                  key={index}
                  capa={{
                    edt: capa.edt,
                    nombre: capa.nombre,
                    estado: capasData[capa.capaId]?.estado || 'aprobado'
                  }}
                  onAction={(actionType) => handleCapaAction(actionType, capa.capaId)}
                />
              ))}
            </Section>
          );
        })}
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={getModalTitle()}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default IndiceExpedienteSPP;
