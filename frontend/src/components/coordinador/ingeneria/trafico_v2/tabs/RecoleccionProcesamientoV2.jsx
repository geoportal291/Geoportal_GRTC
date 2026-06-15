import { useEffect, useMemo, useState } from 'react';
import TrafficEntityExplorer from '../components/TrafficEntityExplorer';
import TrafficProcessingStatus from '../components/TrafficProcessingStatus';
import TrafficUploadModalV2 from '../components/TrafficUploadModalV2';
import TrafficInternalGeoMap from '../components/TrafficInternalGeoMap';
import { MODULE_CONFIG } from '../trafficV2Utils';
import { useAuth } from '../../../../../data/contexts/AuthContext';

const RecoleccionProcesamientoV2 = ({ activeSubTab, stations, sections, onReload, extractedTrafficData, setExtractedTrafficData }) => {
  const { selectedProjectId } = useAuth();
  const moduleConfig = MODULE_CONFIG[activeSubTab];
  const entities = useMemo(
    () => (moduleConfig?.entityType === 'section' ? sections : stations),
    [moduleConfig, sections, stations]
  );
  const [selectedEntityId, setSelectedEntityId] = useState(entities[0]?.id || '');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    setSelectedEntityId(entities[0]?.id || '');
  }, [activeSubTab, entities]);

  const selectedEntity = useMemo(
    () => entities.find((entity) => String(entity.id) === String(selectedEntityId)) || null,
    [entities, selectedEntityId]
  );

  if (!moduleConfig) {
    return (
      <div className="traffic-v2-grid single">
        <section className="traffic-v2-panel">
          <div className="traffic-v2-empty-state">No se encontró la configuración del módulo solicitado.</div>
        </section>
      </div>
    );
  }

  return (
    <>
      {/* Map row */}
      <div className="traffic-v2-grid" style={{ marginBottom: '22px' }}>
        <TrafficInternalGeoMap
          className="traffic-v2-span-full"
          projectId={selectedProjectId}
          title={`Mapa de ${moduleConfig.label}`}
          description={`Visor operativo para ubicar ${moduleConfig.entityType === 'section' ? 'tramos homogéneos' : 'estaciones de control'} del módulo de ${moduleConfig.label}.`}
        />
      </div>

      {/* Explorer + Processing row */}
      <div className="traffic-v2-grid processing">
        <TrafficEntityExplorer
          className="traffic-v2-span-4"
          title={`Explorador de ${moduleConfig.label}`}
          entities={entities}
          selectedEntityId={selectedEntityId}
          onSelectEntity={setSelectedEntityId}
          action={selectedEntity ? (
            <button type="button" className="traffic-v2-action-btn" onClick={() => setIsUploadModalOpen(true)}>
              <i className="fas fa-upload" style={{ marginRight: '6px' }} />
              Cargar archivos
            </button>
          ) : null}
        />

        <TrafficProcessingStatus
          className="traffic-v2-span-8"
          entity={selectedEntity}
          moduleKey={moduleConfig.id}
          moduleLabel={moduleConfig.label}
          onReload={onReload}
          extractedTrafficData={extractedTrafficData}
          setExtractedTrafficData={setExtractedTrafficData}
        />
      </div>

      <TrafficUploadModalV2
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        entityId={selectedEntity?.id}
        moduleConfig={moduleConfig}
        onUploadSuccess={() => {
          if (onReload) onReload();
        }}
        setExtractedTrafficData={setExtractedTrafficData}
      />
    </>
  );
};

export default RecoleccionProcesamientoV2;
