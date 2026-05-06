import { useMemo, useState } from 'react';
import { formatDate } from '../trafficV2Utils';

const ComparisonCard = ({ title, entity }) => {
  if (!entity) {
    return (
      <div className="traffic-v2-compare-card empty">
        <strong>{title}</strong>
        <span>Sin entidad seleccionada</span>
      </div>
    );
  }

  return (
    <div className="traffic-v2-compare-card">
      <strong>{title}</strong>
      <span className="traffic-v2-compare-name">{entity.nombre || entity.id}</span>
      <span>{entity.totalUploads} registros</span>
      <span>{entity.analyticalFiles} archivos analíticos</span>
      <span>{entity.moduleCoverage} módulos cubiertos</span>
      <span>Último: {formatDate(entity.lastUpload)}</span>
    </div>
  );
};

const TrafficInsightPanel = ({ stations, sections, className = '' }) => {
  const [selectedStationId, setSelectedStationId] = useState(stations[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');

  const selectedStation = useMemo(
    () => stations.find((station) => String(station.id) === String(selectedStationId)) || null,
    [stations, selectedStationId]
  );
  const selectedSection = useMemo(
    () => sections.find((section) => String(section.id) === String(selectedSectionId)) || null,
    [sections, selectedSectionId]
  );

  const leadingStation = useMemo(
    () => [...stations].sort((a, b) => b.totalUploads - a.totalUploads)[0] || null,
    [stations]
  );
  const criticalSection = useMemo(
    () => [...sections].sort((a, b) => {
      if (b.moduleCoverage !== a.moduleCoverage) return b.moduleCoverage - a.moduleCoverage;
      return b.totalUploads - a.totalUploads;
    })[0] || null,
    [sections]
  );

  const insights = [
    leadingStation
      ? `La estación con mayor actividad registrada es ${leadingStation.nombre || leadingStation.id}, con ${leadingStation.totalUploads} evidencias cargadas.`
      : 'Aún no hay estaciones con registros operativos cargados.',
    criticalSection
      ? `El tramo más exigido operativamente es ${criticalSection.nombre || criticalSection.id}, con ${criticalSection.moduleCoverage} módulos cubiertos.`
      : 'Aún no hay tramos con datos suficientes para clasificar criticidad.',
    sections.length
      ? `Se encuentran ${sections.filter((item) => item.criticality === 'Alta').length} tramos en criticidad alta y ${sections.filter((item) => item.criticality === 'Media').length} en criticidad media.`
      : 'Todavía no existen tramos homogéneos visibles para priorización.',
    stations.length
      ? `La cobertura de estaciones alcanza ${stations.filter((item) => item.analyticalFiles > 0).length} puntos con soporte documental analítico.`
      : 'Todavía no existen estaciones con soporte analítico disponible.'
  ];

  return (
    <section className={`traffic-v2-panel ${className}`.trim()}>
      <div className="traffic-v2-panel-header">
        <div>
          <h3>Hallazgos y comparador rápido</h3>
          <p>Lectura ejecutiva para revisar intensidad operativa y cobertura del proyecto.</p>
        </div>
      </div>

      <div className="traffic-v2-insights">
        {insights.map((insight, index) => (
          <article key={index} className="traffic-v2-insight-card">
            <span className="traffic-v2-insight-index">0{index + 1}</span>
            <p>{insight}</p>
          </article>
        ))}
      </div>

      <div className="traffic-v2-compare-controls">
        <label>
          Estación
          <select value={selectedStationId} onChange={(event) => setSelectedStationId(event.target.value)}>
            {stations.length === 0 ? <option value="">Sin estaciones</option> : null}
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.nombre || station.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tramo
          <select value={selectedSectionId} onChange={(event) => setSelectedSectionId(event.target.value)}>
            {sections.length === 0 ? <option value="">Sin tramos</option> : null}
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.nombre || section.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="traffic-v2-compare-grid">
        <ComparisonCard title="Comparativo de estación" entity={selectedStation} />
        <ComparisonCard title="Comparativo de tramo" entity={selectedSection} />
      </div>
    </section>
  );
};

export default TrafficInsightPanel;
