import { buildProcessingPipeline, formatDate, getEntityStats } from '../trafficV2Utils';

const statusLabel = {
  done: 'Completado',
  in_progress: 'En curso',
  pending: 'Pendiente'
};

const TrafficProcessingStatus = ({ entity, moduleKey, moduleLabel, className = '' }) => {
  if (!entity) {
    return (
      <section className={`traffic-v2-panel ${className}`.trim()}>
        <div className="traffic-v2-empty-state">Selecciona una entidad para revisar el estado de procesamiento.</div>
      </section>
    );
  }

  const stats = getEntityStats(entity, moduleKey);
  const pipeline = buildProcessingPipeline(entity, moduleKey);

  return (
    <section className={`traffic-v2-panel ${className}`.trim()}>
      <div className="traffic-v2-panel-header">
        <div>
          <h3>{moduleLabel}</h3>
          <p>Estado consolidado del flujo carga-validación-análisis-reporte.</p>
        </div>
      </div>

      <div className="traffic-v2-processing-overview">
        <article>
          <span>Registros</span>
          <strong>{stats.totalUploads}</strong>
        </article>
        <article>
          <span>Fotos</span>
          <strong>{stats.imageCount}</strong>
        </article>
        <article>
          <span>Archivos</span>
          <strong>{stats.fileCount}</strong>
        </article>
        <article>
          <span>Excel</span>
          <strong>{stats.excelCount}</strong>
        </article>
        <article>
          <span>Último movimiento</span>
          <strong>{formatDate(stats.lastUpload)}</strong>
        </article>
      </div>

      <div className="traffic-v2-pipeline">
        {pipeline.map((step) => (
          <div key={step.id} className={`traffic-v2-pipeline-step ${step.status}`}>
            <span className="traffic-v2-pipeline-dot"></span>
            <div>
              <strong>{step.label}</strong>
              <small>{statusLabel[step.status]}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="traffic-v2-file-table">
        <div className="traffic-v2-file-table-header">
          <span>Descripción</span>
          <span>Tipo</span>
          <span>Fecha</span>
        </div>
        {stats.assets.length === 0 ? (
          <div className="traffic-v2-file-row empty">No hay archivos o fotos cargadas para este módulo.</div>
        ) : (
          stats.assets.slice(0, 8).map((asset) => (
            <div key={`${asset.image_url}-${asset.upload_date}`} className="traffic-v2-file-row">
              <span>{asset.description || 'Sin descripción'}</span>
              <span>{asset.source_type || 'Sin tipo'}</span>
              <span>{formatDate(asset.upload_date)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default TrafficProcessingStatus;
