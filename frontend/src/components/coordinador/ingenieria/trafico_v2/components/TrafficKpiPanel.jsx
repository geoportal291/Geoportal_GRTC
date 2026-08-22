import { useMemo } from 'react';
import { formatDate } from '../trafficV2Utils';

const TrafficKpiPanel = ({ summary, extractedTrafficData, stations, viewMode = 'tramos' }) => {

  const globalStats = useMemo(() => {
    let totalImda = 0;
    let stationsWithData = 0;
    let totalLigeros = 0;
    let totalPesados = 0;
    let maxStation = { id: null, nombre: '', imda: 0 };

    if (extractedTrafficData && stations) {
      stations.forEach(station => {
        const data = extractedTrafficData[station.id];
        if (data && data.classificationData) {
          const imda = data.classificationData.reduce((a, b) => a + b, 0);
          totalImda += imda;
          stationsWithData++;

          // Ligeros vs Pesados
          // Asumimos que los 4 primeros son ligeros (Auto, SW, PickUp, Panel, Combi, Micro) -> índice 0 a 5
          let ligeros = 0;
          let pesados = 0;
          data.classificationData.forEach((val, idx) => {
            if (idx <= 5) ligeros += val;
            else pesados += val;
          });

          totalLigeros += ligeros;
          totalPesados += pesados;

          if (imda > maxStation.imda) {
             maxStation = { id: station.id, nombre: station.nombre, imda: Math.round(imda) };
          }
        }
      });
    }

    const avgImda = stationsWithData > 0 ? Math.round(totalImda / stationsWithData) : 0;
    const totalVehicles = totalLigeros + totalPesados;
    const pctPesados = totalVehicles > 0 ? Math.round((totalPesados / totalVehicles) * 100) : 0;
    const pctLigeros = totalVehicles > 0 ? 100 - pctPesados : 0;

    return { avgImda, pctPesados, pctLigeros, maxStation, stationsWithData };
  }, [extractedTrafficData, stations]);

  const cards = viewMode === 'tramos' ? [
    {
      label: 'IMDa Global Promedio',
      value: globalStats.stationsWithData > 0 ? `${globalStats.avgImda} veh/día` : 'Sin datos',
      hint: `Basado en ${globalStats.stationsWithData} estaciones extraídas`,
      icon: 'fas fa-chart-line',
      color: '#3b82f6'
    },
    {
      label: 'Tráfico Pesado (Global)',
      value: globalStats.stationsWithData > 0 ? `${globalStats.pctPesados}%` : 'Sin datos',
      hint: globalStats.stationsWithData > 0 ? `Ligeros: ${globalStats.pctLigeros}%` : 'Faltan aforos',
      icon: 'fas fa-truck-moving',
      color: '#f59e0b'
    },
    {
      label: 'Pico Máximo (Congestión)',
      value: globalStats.maxStation.imda > 0 ? `${globalStats.maxStation.imda} veh/día` : 'Sin datos',
      hint: globalStats.maxStation.imda > 0 ? `Estación: ${globalStats.maxStation.nombre || globalStats.maxStation.id}` : '-',
      icon: 'fas fa-fire-alt',
      color: '#ef4444'
    },
    {
      label: 'Estaciones Analizadas',
      value: `${globalStats.stationsWithData}/${stations.length}`,
      hint: 'Tramos con tráfico base procesado',
      icon: 'fas fa-map-marked-alt',
      color: '#10b981'
    }
  ] : [
    {
      label: 'Archivos Oficiales',
      value: summary.analyticalFileCount,
      hint: 'Documentos Excel validados',
      icon: 'fas fa-file-excel',
      color: '#10b981'
    },
    {
      label: 'Cobertura Temática',
      value: `${summary.moduleCoverage}/6`,
      hint: 'Módulos de ingeniería con información',
      icon: 'fas fa-layer-group',
      color: '#8b5cf6'
    },
    {
      label: 'Estaciones Activas',
      value: summary.stationCount,
      hint: 'Puntos de control planificados en campo',
      icon: 'fas fa-map-marker-alt',
      color: '#0f766e'
    },
    {
      label: 'Porcentaje de Avance',
      value: stations.length > 0 ? `${Math.round((globalStats.stationsWithData / stations.length) * 100)}%` : '0%',
      hint: 'Procesamiento de datos finalizado',
      icon: 'fas fa-check-circle',
      color: '#3b82f6'
    }
  ];

  return (
    <div className="traffic-v2-kpi-grid">
      {cards.map((card) => (
        <article key={card.label} className="traffic-v2-kpi-card" style={{ borderLeft: `4px solid ${card.color}` }}>
          <span className="traffic-v2-kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             <i className={card.icon} style={{ color: card.color }}></i> {card.label}
          </span>
          <strong className="traffic-v2-kpi-value" style={{ marginTop: '8px' }}>{card.value}</strong>
          <small className="traffic-v2-kpi-hint" style={{ marginTop: '4px' }}>{card.hint}</small>
        </article>
      ))}
    </div>
  );
};

export default TrafficKpiPanel;
