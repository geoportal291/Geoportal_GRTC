import { formatDate } from '../trafficV2Utils';

const TrafficKpiPanel = ({ summary }) => {
  const cards = [
    {
      label: 'Estaciones activas',
      value: summary.stationCount,
      hint: 'Puntos de control con presencia en el proyecto'
    },
    {
      label: 'Tramos activos',
      value: summary.sectionCount,
      hint: 'Segmentos homogéneos disponibles para revisión'
    },
    {
      label: 'Archivos analíticos',
      value: summary.analyticalFileCount,
      hint: 'Documentos y archivos listos para análisis'
    },
    {
      label: 'Último procesamiento',
      value: formatDate(summary.latestProcessing),
      hint: 'Última evidencia registrada en tráfico'
    },
    {
      label: 'Cobertura temática',
      value: `${summary.moduleCoverage}/6`,
      hint: 'Módulos con información cargada'
    },
    {
      label: 'Entidades críticas',
      value: summary.criticalStationCount + summary.criticalSectionCount,
      hint: 'Estaciones o tramos con mayor intensidad operativa'
    }
  ];

  return (
    <div className="traffic-v2-kpi-grid">
      {cards.map((card) => (
        <article key={card.label} className="traffic-v2-kpi-card">
          <span className="traffic-v2-kpi-label">{card.label}</span>
          <strong className="traffic-v2-kpi-value">{card.value}</strong>
          <small className="traffic-v2-kpi-hint">{card.hint}</small>
        </article>
      ))}
    </div>
  );
};

export default TrafficKpiPanel;
