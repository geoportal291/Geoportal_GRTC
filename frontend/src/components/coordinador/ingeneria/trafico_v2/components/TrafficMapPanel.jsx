const getBadgeClass = (criticality) => {
  if (criticality === 'Alta') return 'traffic-v2-badge danger';
  if (criticality === 'Media') return 'traffic-v2-badge warning';
  return 'traffic-v2-badge success';
};

const TrafficMapPanel = ({
  title,
  entities,
  emptyText,
  description = 'Vista operacional resumida mientras la capa analítica espacial evoluciona.',
  className = ''
}) => {
  return (
    <section className={`traffic-v2-panel ${className}`.trim()}>
      <div className="traffic-v2-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      {entities.length === 0 ? (
        <div className="traffic-v2-empty-state">{emptyText}</div>
      ) : (
        <div className="traffic-v2-spatial-list">
          {entities.map((entity) => (
            <article key={entity.id} className="traffic-v2-spatial-item">
              <div className="traffic-v2-spatial-main">
                <strong>{entity.nombre || entity.id}</strong>
                <span>{entity.ubicacion || 'Ubicación no registrada'}</span>
              </div>
              <div className="traffic-v2-spatial-metrics">
                <span className={getBadgeClass(entity.criticality)}>{entity.criticality}</span>
                <span>{entity.totalUploads} registros</span>
                <span>{entity.moduleCoverage} módulos</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TrafficMapPanel;
