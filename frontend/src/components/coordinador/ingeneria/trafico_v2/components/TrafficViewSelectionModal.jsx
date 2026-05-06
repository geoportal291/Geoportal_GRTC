const TrafficViewSelectionModal = ({ onSelect, projectName }) => {
  return (
    <div className="traffic-v2-view-selection-overlay">
      <div className="traffic-v2-view-selection-card">
        <h3>Bienvenido al Geoportal de Tráfico</h3>
        <p>Seleccione el modo de visualización para el proyecto <strong>{projectName || 'actual'}</strong>.</p>

        <div className="traffic-v2-view-options">
          <button type="button" className="traffic-v2-view-option" onClick={() => onSelect('internal')}>
            <div className="traffic-v2-view-option-badge">INT</div>
            <h4>Gestión Interna</h4>
            <p>Administración, carga, revisión operativa y procesamiento de archivos vinculados al NAS.</p>
          </button>

          <button type="button" className="traffic-v2-view-option" onClick={() => onSelect('external')}>
            <div className="traffic-v2-view-option-badge">MAP</div>
            <h4>Vista Externa</h4>
            <p>Visualización geográfica interactiva con mapa base, capas temáticas y lectura territorial.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrafficViewSelectionModal;
