import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../../../../api/axios';
import ErrorBoundary from '../../../../ErrorBoundary';
import Geoite from '../../invvial/map/geoite';

const NAS_PUBLIC_BASE_URL = 'https://files.dafe.it.com/geoportal';
const GEOITE_TRAFFIC_CONTROL_EVENT = 'geoite:traffic-control';
const GEOITE_TRAFFIC_STATE_EVENT = 'geoite:traffic-kml-state';

const ACTION_BUTTONS = [
  { id: 'upload', label: 'Subir Archivo', icon: 'upload', tone: 'blue' },
  { id: 'delete', label: 'Eliminar Capa', icon: 'trash', tone: 'red' },
  { id: 'open', label: 'Abrir Archivo', icon: 'link', tone: 'teal' },
  { id: 'folder', label: 'Carpeta NAS', icon: 'folder', tone: 'green' },
  { id: 'expand', label: 'Expandir Mapa', icon: 'expand', tone: 'dark' }
];

const iconMap = {
  upload: 'upload',
  trash: 'trash',
  link: 'link',
  folder: 'folder',
  expand: 'expand'
};

const TrafficInternalGeoMap = ({
  projectId,
  title,
  description,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentKmlUrl, setCurrentKmlUrl] = useState('');
  const isNasKmlUrl = currentKmlUrl.startsWith(`${NAS_PUBLIC_BASE_URL}/`);

  const refreshKmlInfo = useCallback(async () => {
    if (!projectId) {
      setCurrentKmlUrl('');
      return;
    }

    try {
      const response = await axiosInstance.get(`/api/proyectos/${projectId}/kml`, {
        params: { section: 'trafico' }
      });
      setCurrentKmlUrl(response.data?.url || '');
    } catch (error) {
      setCurrentKmlUrl('');
    }
  }, [projectId]);

  useEffect(() => {
    refreshKmlInfo();
  }, [refreshKmlInfo]);

  useEffect(() => {
    const handleKmlStateChange = (event) => {
      const detail = event.detail || {};
      if (String(detail.projectId) !== String(projectId) || detail.section !== 'trafico') {
        return;
      }
      setCurrentKmlUrl(detail.url || '');
    };

    window.addEventListener(GEOITE_TRAFFIC_STATE_EVENT, handleKmlStateChange);
    return () => {
      window.removeEventListener(GEOITE_TRAFFIC_STATE_EVENT, handleKmlStateChange);
    };
  }, [projectId]);

  const dispatchGeoiteControl = useCallback((action) => {
    window.dispatchEvent(new CustomEvent(GEOITE_TRAFFIC_CONTROL_EVENT, {
      detail: {
        action,
        projectId,
        section: 'trafico'
      }
    }));
  }, [projectId]);

  const handleAction = useCallback((actionId) => {
    if (actionId === 'upload') {
      dispatchGeoiteControl('upload');
      return;
    }

    if (actionId === 'delete') {
      dispatchGeoiteControl('delete');
      return;
    }

    if (actionId === 'open') {
      if (isNasKmlUrl) {
        window.open(currentKmlUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (actionId === 'folder') {
      const folderUrl = `${NAS_PUBLIC_BASE_URL}/proyectos/${projectId}/trazado`;
      window.open(folderUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (actionId === 'expand') {
      setIsExpanded((prev) => !prev);
    }
  }, [currentKmlUrl, dispatchGeoiteControl, isNasKmlUrl, projectId]);

  const geoiteShellClassName = useMemo(
    () => `traffic-v2-geoite-shell ${isExpanded ? 'expanded' : ''}`.trim(),
    [isExpanded]
  );

  return (
    <section className={`traffic-v2-panel traffic-v2-geoite-panel ${className}`.trim()}>
      <div className="traffic-v2-geoite-header">
        <div className="traffic-v2-geoite-title-block">
          <span className="traffic-v2-geoite-label">MAPA DE ANÁLISIS</span>
          <div className="traffic-v2-geoite-copy">
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </div>

        <div className="traffic-v2-geoite-actions">
          {ACTION_BUTTONS.map((button) => (
            <button
              key={button.id}
              type="button"
              className={`traffic-v2-geoite-action-btn ${button.tone}`.trim()}
              onClick={() => handleAction(button.id)}
              disabled={
                (button.id === 'delete' && !currentKmlUrl)
                || (button.id === 'open' && !isNasKmlUrl)
              }
            >
              <i className={`fas fa-${iconMap[button.icon]}`}></i>
              <span>{button.id === 'expand' && isExpanded ? 'Contraer Mapa' : button.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={geoiteShellClassName}>
        <ErrorBoundary>
          <Geoite height="100%" projectId={projectId} section="trafico" />
        </ErrorBoundary>
      </div>
    </section>
  );
};

export default TrafficInternalGeoMap;
