import { useMemo, useState } from 'react';
import { API_BASE_URL } from '../../../../../api/config';
import TrafficKpiPanel from '../components/TrafficKpiPanel';
import TrafficMapPanel from '../components/TrafficMapPanel';
import TrafficInsightPanel from '../components/TrafficInsightPanel';
import TrafficInternalGeoMap from '../components/TrafficInternalGeoMap';
import GlobalEsalProjection from '../components/GlobalEsalProjection';
import TrafficProjectFunnel from '../components/TrafficProjectFunnel';
import ExportMasterExcelButton from '../components/ExportMasterExcelButton';
import { FORMAT_LIBRARY } from '../trafficV2Utils';

const buildEmbeddedFormatUrl = (url) => `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(url)}`;

const ResumenGeneralV2 = ({ activeSubTab, projectId, stations, sections, summary, extractedTrafficData }) => {
  const [selectedFormatId, setSelectedFormatId] = useState(FORMAT_LIBRARY[0]?.id || '');
  const selectedFormat = useMemo(
    () => FORMAT_LIBRARY.find((item) => item.id === selectedFormatId) || FORMAT_LIBRARY[0] || null,
    [selectedFormatId]
  );

  if (activeSubTab === 'formatos') {
    return (
      <div className="traffic-v2-grid single">
        <section className="traffic-v2-panel traffic-v2-span-full">
          <div className="traffic-v2-format-viewer">
            <aside className="traffic-v2-format-sidebar">
              <div className="traffic-v2-format-sidebar-header">Formatos Disponibles</div>
              <div className="traffic-v2-format-sidebar-list">
                {FORMAT_LIBRARY.map((formatItem) => (
                  <button
                    key={formatItem.id}
                    type="button"
                    className={`traffic-v2-format-sidebar-item ${selectedFormat?.id === formatItem.id ? 'active' : ''}`.trim()}
                    onClick={() => setSelectedFormatId(formatItem.id)}
                  >
                    <span className="traffic-v2-format-sidebar-code">{formatItem.shortLabel}</span>
                    <span className="traffic-v2-format-sidebar-name">{formatItem.name}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="traffic-v2-format-preview">
              {selectedFormat ? (
                <>
                  <div className="traffic-v2-format-preview-header">
                    <div>
                      <h3>{selectedFormat.name}</h3>
                      <p>Visualización embebida del formato operativo seleccionado.</p>
                    </div>
                    <a href={selectedFormat.url} target="_blank" rel="noreferrer" className="traffic-v2-format-preview-link">
                      Abrir en nueva pestaña
                    </a>
                  </div>

                  <div className="traffic-v2-format-preview-frame-shell">
                    <iframe
                      key={selectedFormat.id}
                      title={selectedFormat.name}
                      src={buildEmbeddedFormatUrl(selectedFormat.url)}
                      className="traffic-v2-format-preview-frame"
                    />
                  </div>
                </>
              ) : (
                <div className="traffic-v2-empty-state">Selecciona un formato para visualizar.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const entities = activeSubTab === 'tramos' ? sections : stations;
  const title = activeSubTab === 'tramos' ? 'Geoportal operativo de tramos' : 'Geoportal operativo de estaciones';
  const emptyText = activeSubTab === 'tramos'
    ? 'Todavía no hay tramos homogéneos con información disponible.'
    : 'Todavía no hay estaciones de control con información disponible.';
  const mapDescription = activeSubTab === 'tramos'
    ? 'Visor interno con toolbar operativa para cargar KML, calibrar trazado, cambiar capas y revisar los tramos del estudio.'
    : 'Visor interno con toolbar operativa para cargar KML, calibrar trazado, cambiar capas y revisar las estaciones del estudio.';

  return (
    <div className="traffic-v2-grid">
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
         <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Resumen del Proyecto</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Indicadores globales extraídos de la base de datos oficial.</p>
         </div>
         <ExportMasterExcelButton 
            stations={stations}
            sections={sections}
            extractedTrafficData={extractedTrafficData}
            projectName={projectId}
         />
      </div>

      <TrafficKpiPanel 
         summary={summary} 
         extractedTrafficData={extractedTrafficData} 
         stations={stations} 
         viewMode={activeSubTab} 
      />
      
      {activeSubTab === 'estaciones' ? (
        <>
          <TrafficInternalGeoMap
            className="traffic-v2-span-full"
            projectId={projectId}
            title={title}
            description={mapDescription}
            extractedTrafficData={extractedTrafficData}
            sections={sections}
            stations={stations}
            hideHeatmapTools={true}
          />
          <TrafficProjectFunnel 
            className="traffic-v2-span-full" 
            stations={stations} 
            extractedTrafficData={extractedTrafficData} 
          />
          <TrafficMapPanel
            className="traffic-v2-span-full"
            title="Lista de Estaciones Operativas"
            entities={entities}
            emptyText={emptyText}
          />
        </>
      ) : (
        <>
          <TrafficInternalGeoMap
            className="traffic-v2-span-8"
            projectId={projectId}
            title={title}
            description={mapDescription}
            extractedTrafficData={extractedTrafficData}
            sections={sections}
            stations={stations}
          />
          <TrafficInsightPanel 
            className="traffic-v2-span-4" 
            stations={stations} 
            sections={sections} 
            extractedTrafficData={extractedTrafficData} 
          />
          <GlobalEsalProjection 
            className="traffic-v2-span-full" 
            extractedTrafficData={extractedTrafficData} 
            stations={stations} 
          />
        </>
      )}
    </div>
  );
};

export default ResumenGeneralV2;
