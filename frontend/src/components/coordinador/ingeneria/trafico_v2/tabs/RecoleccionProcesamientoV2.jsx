import { useEffect, useMemo, useState } from 'react';
import TrafficEntityExplorer from '../components/TrafficEntityExplorer';
import TrafficProcessingStatus from '../components/TrafficProcessingStatus';
import TrafficUploadModalV2 from '../components/TrafficUploadModalV2';
import { MODULE_CONFIG } from '../trafficV2Utils';

const RecoleccionProcesamientoV2 = ({ activeSubTab, stations, sections, onReload }) => {
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
      <div className="traffic-v2-grid processing">
        <TrafficEntityExplorer
          className="traffic-v2-span-5"
          title={`Explorador de ${moduleConfig.label}`}
          entities={entities}
          selectedEntityId={selectedEntityId}
          onSelectEntity={setSelectedEntityId}
          action={selectedEntity ? (
            <button type="button" className="traffic-v2-action-btn" onClick={() => setIsUploadModalOpen(true)}>
              Cargar archivos
            </button>
          ) : null}
        />

        <TrafficProcessingStatus
          className="traffic-v2-span-7"
          entity={selectedEntity}
          moduleKey={moduleConfig.id}
          moduleLabel={moduleConfig.label}
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
      />
    </>
  );
};

export default RecoleccionProcesamientoV2;
