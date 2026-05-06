import { useMemo } from 'react';
import { MODULE_CONFIG, REPORT_TAB_TO_MODULE, formatDate, getEntityStats } from '../trafficV2Utils';

const BarRow = ({ label, value, maxValue }) => (
  <div className="traffic-v2-bar-row">
    <div className="traffic-v2-bar-label">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
    <div className="traffic-v2-bar-track">
      <div className="traffic-v2-bar-fill" style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}></div>
    </div>
  </div>
);

const ReporteFinalV2 = ({ activeSubTab, stations, sections }) => {
  const moduleKey = REPORT_TAB_TO_MODULE[activeSubTab];
  const moduleConfig = MODULE_CONFIG[moduleKey];
  const baseEntities = moduleConfig?.entityType === 'section' ? sections : stations;

  const rankedEntities = useMemo(() => {
    return [...baseEntities]
      .map((entity) => {
        const stats = getEntityStats(entity, moduleKey);
        return {
          ...entity,
          reportUploads: stats.totalUploads,
          reportFiles: stats.fileCount + stats.excelCount,
          reportLastUpload: stats.lastUpload
        };
      })
      .sort((a, b) => {
        if (b.reportUploads !== a.reportUploads) return b.reportUploads - a.reportUploads;
        return b.reportFiles - a.reportFiles;
      })
      .slice(0, 6);
  }, [baseEntities, moduleKey]);

  const maxValue = rankedEntities.reduce((max, entity) => Math.max(max, entity.reportUploads), 0);
  const leadEntity = rankedEntities[0] || null;

  const titleMap = {
    conteo_vehicular: 'Conteo Vehicular',
    encuesta_origen_destino: 'Encuesta de Origen/Destino',
    censo_de_cargas: 'Censo de Cargas',
    encuesta_velocidad: 'Encuesta de velocidad',
    ejes_equivalentes: 'Ejes Equivalentes'
  };

  return (
    <div className="traffic-v2-grid report">
      <section className="traffic-v2-panel traffic-v2-span-7">
        <div className="traffic-v2-panel-header">
          <div>
            <h3>{titleMap[activeSubTab]}</h3>
            <p>Consolidado ejecutivo de la temática seleccionada en la V2.</p>
          </div>
        </div>

        <div className="traffic-v2-report-summary">
          <article>
            <span>Entidad líder</span>
            <strong>{leadEntity ? (leadEntity.nombre || leadEntity.id) : 'Sin data'}</strong>
          </article>
          <article>
            <span>Registros temáticos</span>
            <strong>{rankedEntities.reduce((sum, entity) => sum + entity.reportUploads, 0)}</strong>
          </article>
          <article>
            <span>Último movimiento</span>
            <strong>{formatDate(leadEntity?.reportLastUpload)}</strong>
          </article>
        </div>

        <div className="traffic-v2-observation-box">
          {leadEntity
            ? `La entidad más sólida para ${titleMap[activeSubTab].toLowerCase()} es ${leadEntity.nombre || leadEntity.id}, porque concentra ${leadEntity.reportUploads} registros y ${leadEntity.reportFiles} archivos analíticos asociados.`
            : `Todavía no hay información suficiente para emitir observaciones automáticas en ${titleMap[activeSubTab].toLowerCase()}.`}
        </div>
      </section>

      <section className="traffic-v2-panel traffic-v2-span-5">
        <div className="traffic-v2-panel-header">
          <div>
            <h3>Ranking de cobertura</h3>
            <p>Jerarquización rápida por cantidad de evidencias y soporte analítico.</p>
          </div>
        </div>

        {rankedEntities.length === 0 ? (
          <div className="traffic-v2-empty-state">No hay registros cargados para construir el ranking temático.</div>
        ) : (
          <div className="traffic-v2-bars">
            {rankedEntities.map((entity) => (
              <BarRow key={entity.id} label={entity.nombre || entity.id} value={entity.reportUploads} maxValue={maxValue} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ReporteFinalV2;
