import React from 'react';
import './AnalysisModal.css';

const AnalysisModal = ({ isOpen, onClose, analysis }) => {
  if (!isOpen || !analysis) {
    return null;
  }

  // Función para renderizar texto con negritas manuales
  const renderTextWithBold = (text) => {
    if (typeof text !== 'string') {
      return text; // Devuelve el texto original si no es un string
    }
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderPuntosClave = () => {
    if (!analysis.puntosClave || analysis.puntosClave.length === 0) {
      return null;
    }

    // Compatibilidad con el formato antiguo (array de strings)
    if (typeof analysis.puntosClave[0] === 'string') {
      const getIconForPoint = (point) => {
          if (point.includes('más alto')) return 'fas fa-arrow-trend-up';
          if (point.includes('menor tráfico')) return 'fas fa-arrow-trend-down';
          if (point.includes('mañana')) return 'fas fa-sun';
          if (point.includes('tarde')) return 'fas fa-moon';
          return 'fas fa-info-circle';
      };
      return (
        <ul className="analysis-list simple">
          {analysis.puntosClave.map((point, index) => (
            <li key={index}>
              <i className={`${getIconForPoint(point)} analysis-icon`}></i>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      );
    }

    // Nuevo formato (array de objetos)
    return (
      <ul className="analysis-list structured">
        {analysis.puntosClave.map((point, index) => (
          <li key={index}>
            <div className="structured-point-header">
              <i className={`${point.icon} analysis-icon`}></i>
              <strong>{point.title}</strong>
            </div>
            <p className="structured-point-text">
              {renderTextWithBold(point.text)}
            </p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="analysis-modal-overlay" onClick={onClose}>
      <div className="analysis-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="analysis-modal-close" onClick={onClose}>&times;</button>
        <h3>{analysis.title || 'Análisis Detallado'}</h3>
        
        {analysis.periodosInfo && (
          <>
            <h4>Resumen por Periodo</h4>
            <ul className="analysis-list">
              {analysis.periodosInfo.map((periodo, index) => (
                <li key={index}>
                  <i className={`${periodo.icono} analysis-icon`}></i>
                  <div className="analysis-details">
                    <strong className="periodo-nombre">{periodo.nombre}</strong>
                    <span>Tráfico promedio: <strong>{periodo.promedio} veh/h</strong></span>
                    <span>Pico: <strong>{periodo.pico} veh.</strong> a las {periodo.horaPico}</span>
                    <span>Total del periodo: <strong>{periodo.total} veh.</strong></span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {analysis.puntosClave && (
          <>
            <h4 className="additional-observations">Observaciones Adicionales</h4>
            {renderPuntosClave()}
          </>
        )}

      </div>
    </div>
  );
};

export default AnalysisModal;
