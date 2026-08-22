import { formatDate } from '../trafficV2Utils';

const TrafficEntityExplorer = ({ title, entities, selectedEntityId, onSelectEntity, action, className = '' }) => {
  return (
    <section className={`traffic-v2-panel ${className}`.trim()}>
      <div className="traffic-v2-panel-header">
        <div>
          <h3>{title}</h3>
          <p>Selecciona una entidad para revisar archivos, cobertura y estado del pipeline.</p>
        </div>
        {action || null}
      </div>

      {entities.length === 0 ? (
        <div className="traffic-v2-empty-state">No hay entidades disponibles para este módulo.</div>
      ) : (
        <div className="traffic-v2-entity-list">
          {entities.map((entity) => {
            const isActive = String(entity.id) === String(selectedEntityId);
            return (
              <button
                key={entity.id}
                type="button"
                className={`traffic-v2-entity-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectEntity(entity.id)}
              >
                <div className="traffic-v2-entity-main">
                  <strong>{entity.nombre || entity.id}</strong>
                  <span>{entity.ubicacion || 'Ubicación no registrada'}</span>
                </div>
                <div className="traffic-v2-entity-meta">
                  <span>{entity.totalUploads} registros</span>
                  <span>{entity.analyticalFiles} analíticos</span>
                  <span>Último: {formatDate(entity.lastUpload)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default TrafficEntityExplorer;
