import { useMemo, useState } from 'react';
import TraficoV2Layout from './TraficoV2Layout';
import TrafficExternalMap from './components/TrafficExternalMap';
import TrafficInsightPanel from './components/TrafficInsightPanel';
import TrafficMapPanel from './components/TrafficMapPanel';
import {
  TOP_LEVEL_TABS,
  PROCESSING_SUBTABS,
  REPORT_SUBTABS,
  MODULE_CONFIG,
  REPORT_TAB_TO_MODULE,
  enrichEntitiesWithMapData,
  formatDate,
  getEntityModuleAssets,
  getEntityStats
} from './trafficV2Utils';

const EXTERNAL_SUMMARY_SUBTABS = [
  { id: 'panorama', label: 'Panorama General' },
  { id: 'estaciones', label: 'Estaciones en mapa' },
  { id: 'tramos', label: 'Tramos en mapa' }
];

const defaultExternalSubtab = {
  resumen: EXTERNAL_SUMMARY_SUBTABS[0].id,
  procesamiento: PROCESSING_SUBTABS[0].id,
  reporte: REPORT_SUBTABS[0].id
};

const TrafficSummaryCard = ({ label, value, helper }) => (
  <article className="traffic-v2-kpi-card">
    <span className="traffic-v2-kpi-label">{label}</span>
    <strong className="traffic-v2-kpi-value">{value}</strong>
    {helper ? <small className="traffic-v2-kpi-hint">{helper}</small> : null}
  </article>
);

const TrafficExternalLegend = ({ stations, sections, activeTopTab, activeSubTab }) => {
  const mappedStations = stations.filter((item) => item.mapPosition);
  const mappedSections = sections.filter((item) => item.mapPosition);
  const missingStations = stations.filter((item) => !item.mapPosition);
  const missingSections = sections.filter((item) => !item.mapPosition);
  const pendingEntities = [...missingStations, ...missingSections].slice(0, 6);
  const lastRecord = [...stations, ...sections]
    .map((entity) => entity.lastUpload)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  return (
    <section className="traffic-v2-panel traffic-v2-span-4">
      <div className="traffic-v2-panel-header">
        <div>
          <h3>Lectura territorial</h3>
          <p>Resumen geoespacial para la vista externa del proyecto.</p>
        </div>
      </div>

      <div className="traffic-v2-legend-list">
        <article className="traffic-v2-legend-item">
          <strong>Modo actual</strong>
          <span>{activeTopTab === 'resumen' ? 'Resumen General' : activeTopTab === 'procesamiento' ? 'Recolección y procesamiento de datos' : 'Reporte Final'}</span>
        </article>
        <article className="traffic-v2-legend-item">
          <strong>Subvista</strong>
          <span>{activeSubTab}</span>
        </article>
        <article className="traffic-v2-legend-item">
          <strong>Estaciones georreferenciadas</strong>
          <span>{mappedStations.length}</span>
        </article>
        <article className="traffic-v2-legend-item">
          <strong>Tramos georreferenciados</strong>
          <span>{mappedSections.length}</span>
        </article>
        <article className="traffic-v2-legend-item">
          <strong>Último registro</strong>
          <span>{formatDate(lastRecord)}</span>
        </article>
        <article className="traffic-v2-legend-item">
          <strong>Mapas base</strong>
          <span>OSM, Topográfico y Satélite</span>
        </article>
      </div>

      {pendingEntities.length ? (
        <div className="traffic-v2-legend-pending">
          <div className="traffic-v2-panel-header">
            <div>
              <h3>Pendientes de georreferenciación</h3>
              <p>Entidades visibles que aún no cuentan con coordenadas utilizables.</p>
            </div>
          </div>

          <div className="traffic-v2-legend-pending-list">
            {pendingEntities.map((entity) => (
              <article key={entity.id} className="traffic-v2-legend-pending-item">
                <strong>{entity.nombre || entity.id}</strong>
                <span>{entity.ubicacion || 'Ubicación no registrada'}</span>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};

const TraficoV2External = ({ projectName, dataset, isLoading, error, onBack, onSwitchMode }) => {
  const [activeTopTab, setActiveTopTab] = useState('resumen');
  const [activeSubTab, setActiveSubTab] = useState(defaultExternalSubtab.resumen);

  const stations = useMemo(() => enrichEntitiesWithMapData(dataset.stations), [dataset.stations]);
  const sections = useMemo(() => enrichEntitiesWithMapData(dataset.sections), [dataset.sections]);

  const currentSubTabs = useMemo(() => {
    if (activeTopTab === 'procesamiento') return PROCESSING_SUBTABS;
    if (activeTopTab === 'reporte') return REPORT_SUBTABS;
    return EXTERNAL_SUMMARY_SUBTABS;
  }, [activeTopTab]);

  const handleTopTabChange = (nextTopTab) => {
    setActiveTopTab(nextTopTab);
    setActiveSubTab(defaultExternalSubtab[nextTopTab]);
  };

  const modeOptions = [
    {
      id: 'internal',
      label: 'Gestión Interna',
      active: false,
      onClick: onSwitchMode
    },
    {
      id: 'external',
      label: 'Vista Externa',
      active: true,
      onClick: onSwitchMode
    }
  ];

  const filteredData = useMemo(() => {
    if (activeTopTab === 'resumen') {
      if (activeSubTab === 'estaciones') {
        return {
          stations,
          sections: [],
          mapTitle: 'Mapa de estaciones de control',
          mapDescription: 'Vista pública de los puntos de control disponibles para lectura territorial.'
        };
      }

      if (activeSubTab === 'tramos') {
        return {
          stations: [],
          sections,
          mapTitle: 'Mapa de tramos homogéneos',
          mapDescription: 'Vista espacial de los segmentos priorizados para seguimiento vial.'
        };
      }

      return {
        stations,
        sections,
        mapTitle: 'Panorama general del proyecto',
        mapDescription: 'Visor geográfico principal con estaciones, tramos y cobertura del proyecto.'
      };
    }

    if (activeTopTab === 'procesamiento') {
      const moduleConfig = MODULE_CONFIG[activeSubTab];
      const stationRows = stations.filter((item) => getEntityModuleAssets(item, activeSubTab).length > 0);
      const sectionRows = sections.filter((item) => getEntityModuleAssets(item, activeSubTab).length > 0);

      return {
        stations: moduleConfig?.entityType === 'station' ? stationRows : [],
        sections: moduleConfig?.entityType === 'section' ? sectionRows : [],
        mapTitle: `${moduleConfig?.label || 'Módulo'} en mapa`,
        mapDescription: 'Visualiza solo las entidades con evidencias cargadas y disponibles en NAS para este módulo.'
      };
    }

    const reportModuleKey = REPORT_TAB_TO_MODULE[activeSubTab];
    const moduleConfig = MODULE_CONFIG[reportModuleKey];
    const toRank = moduleConfig?.entityType === 'section' ? sections : stations;
    const rankedEntities = [...toRank]
      .map((entity) => ({
        ...entity,
        reportStats: getEntityStats(entity, reportModuleKey)
      }))
      .filter((entity) => entity.reportStats.totalUploads > 0)
      .sort((a, b) => {
        if (b.reportStats.totalUploads !== a.reportStats.totalUploads) {
          return b.reportStats.totalUploads - a.reportStats.totalUploads;
        }
        return b.reportStats.fileCount + b.reportStats.excelCount - (a.reportStats.fileCount + a.reportStats.excelCount);
      });

    return {
      stations: moduleConfig?.entityType === 'station' ? rankedEntities.slice(0, 8) : [],
      sections: moduleConfig?.entityType === 'section' ? rankedEntities.slice(0, 8) : [],
      mapTitle: `Lectura territorial de ${moduleConfig?.label || 'reporte'}`,
      mapDescription: 'Visor espacial de las entidades con mayor soporte documental y analítico.'
    };
  }, [activeSubTab, activeTopTab, sections, stations]);

  const topStation = [...filteredData.stations].sort((a, b) => b.totalUploads - a.totalUploads)[0] || null;
  const topSection = [...filteredData.sections].sort((a, b) => b.totalUploads - a.totalUploads)[0] || null;

  const renderBody = () => {
    if (isLoading) return <div className="traffic-v2-loader">Cargando vista externa de Tráfico V2...</div>;
    if (error) return <div className="traffic-v2-error-box">{error}</div>;

    return (
      <div className="traffic-v2-grid">
        <div className="traffic-v2-main-column traffic-v2-span-8">
          <TrafficExternalMap
            stations={filteredData.stations}
            sections={filteredData.sections}
            mode={activeTopTab}
            title={filteredData.mapTitle}
            description={filteredData.mapDescription}
            summaryCards={[
              {
                label: 'Estaciones',
                value: filteredData.stations.length
              },
              {
                label: 'Tramos',
                value: filteredData.sections.length
              },
              {
                label: 'Cobertura',
                value: `${dataset.summary.moduleCoverage}/6`
              },
              {
                label: 'Líder',
                value: topStation?.nombre || topSection?.nombre || 'Sin data'
              }
            ]}
          />

          <section className="traffic-v2-panel">
            <div className="traffic-v2-panel-header">
              <div>
                <h3>Indicadores territoriales</h3>
                <p>Lectura rápida para priorizar revisión espacial y cobertura del proyecto.</p>
              </div>
            </div>

            <div className="traffic-v2-kpi-grid traffic-v2-kpi-grid-compact">
              <TrafficSummaryCard label="Estaciones visibles" value={filteredData.stations.length} />
              <TrafficSummaryCard label="Tramos visibles" value={filteredData.sections.length} />
              <TrafficSummaryCard label="Cobertura" value={`${dataset.summary.moduleCoverage}/6`} />
              <TrafficSummaryCard label="Entidad líder" value={topStation?.nombre || topSection?.nombre || 'Sin data'} />
            </div>
          </section>

          <TrafficMapPanel
            title={activeTopTab === 'reporte' ? 'Entidades priorizadas en la lectura final' : 'Cobertura visible en la capa'}
            entities={[...filteredData.stations, ...filteredData.sections].slice(0, 8)}
            emptyText="No hay entidades visibles para esta selección."
            description="Resumen corto de las entidades visibles en la capa activa."
          />
        </div>

        <div className="traffic-v2-sidebar traffic-v2-span-4">
          <TrafficExternalLegend
            stations={filteredData.stations}
            sections={filteredData.sections}
            activeTopTab={activeTopTab}
            activeSubTab={currentSubTabs.find((item) => item.id === activeSubTab)?.label || activeSubTab}
          />

          <TrafficInsightPanel className="traffic-v2-sidebar-card" stations={filteredData.stations} sections={filteredData.sections} />
        </div>
      </div>
    );
  };

  return (
    <TraficoV2Layout
      title="Área de Tráfico"
      projectName={projectName}
      topTabs={TOP_LEVEL_TABS}
      activeTopTab={activeTopTab}
      onTopTabChange={handleTopTabChange}
      subTabs={currentSubTabs}
      activeSubTab={activeSubTab}
      onSubTabChange={setActiveSubTab}
      modeLabel="Vista Externa"
      onBack={onBack}
      modeOptions={modeOptions}
    >
      {renderBody()}
    </TraficoV2Layout>
  );
};

export default TraficoV2External;
