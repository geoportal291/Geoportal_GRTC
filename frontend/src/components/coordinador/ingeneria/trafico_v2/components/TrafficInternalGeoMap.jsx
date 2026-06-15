import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
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

const HeatmapOverlay = ({ mapMode, extractedTrafficData, sections }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    // We want to wait a bit for Geoite to finish rendering the KML
    const timeout = setTimeout(() => {
      map.eachLayer(layer => {
        // We only care about polylines that have a 'name' property (the routes)
        if (layer.feature && layer.feature.properties && layer.feature.properties.name && layer.setStyle) {
          const name = layer.feature.properties.name.toUpperCase();
          // Find matching section
          const section = sections?.find(s => 
             name.includes((s.nombre || '').toUpperCase()) || 
             name.includes(s.id) ||
             (s.nombre || '').toUpperCase().includes(name)
          );

          if (mapMode === 'normal') {
            layer.setStyle({ color: '#3388ff', weight: 5, opacity: 1 });
          } 
          else if (section && extractedTrafficData && extractedTrafficData[section.id] && extractedTrafficData[section.id].isRealData !== false) {
            const data = extractedTrafficData[section.id];
            
            if (mapMode === 'imda') {
               const imda = data.classificationData ? data.classificationData.reduce((a,b)=>a+b,0) : 0;
               if (imda > 2000) layer.setStyle({ color: '#ef4444', weight: 8, opacity: 0.9 }); // Red
               else if (imda > 500) layer.setStyle({ color: '#f59e0b', weight: 6, opacity: 0.9 }); // Orange
               else layer.setStyle({ color: '#10b981', weight: 4, opacity: 0.9 }); // Green
            } 
            else if (mapMode === 'cargas') {
               let ligeros = 0; let pesados = 0;
               if (data.classificationData) {
                  data.classificationData.forEach((val, idx) => {
                    if (idx <= 5) ligeros += val; else pesados += val;
                  });
               }
               const total = ligeros + pesados;
               const pctPesados = total > 0 ? (pesados / total) * 100 : 0;
               
               if (pctPesados > 40) layer.setStyle({ color: '#7f1d1d', weight: 8, opacity: 0.9 }); // Dark red
               else if (pctPesados > 20) layer.setStyle({ color: '#ea580c', weight: 6, opacity: 0.9 }); // Orange-red
               else layer.setStyle({ color: '#3b82f6', weight: 4, opacity: 0.9 }); // Blue
            }
          } else {
             // If mode is not normal but no data for this section, color it gray
             if (mapMode !== 'normal') {
               layer.setStyle({ color: '#9ca3af', weight: 3, opacity: 0.5 });
             }
          }
        }
      });
    }, 800); // Timeout allows KML to parse and render first

    return () => clearTimeout(timeout);
  }, [map, mapMode, extractedTrafficData, sections]);

  return null;
};

const TrafficInternalGeoMap = ({
  projectId,
  title,
  description,
  className = '',
  extractedTrafficData,
  sections,
  stations = [], // Recibir estaciones para pintar pines
  hideHeatmapTools = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapMode, setMapMode] = useState('normal');
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
      if (response.data?.url) {
        setCurrentKmlUrl(response.data.url);
      } else {
        // Fallback: Si no hay KML específico para tráfico, heredar el KML global del proyecto
        const fallbackResponse = await axiosInstance.get(`/api/proyectos/${projectId}/kml`);
        setCurrentKmlUrl(fallbackResponse.data?.url || '');
      }
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

        <div className="traffic-v2-geoite-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!hideHeatmapTools && (
            <select 
              value={mapMode} 
              onChange={(e) => setMapMode(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}
            >
              <option value="normal">🌐 Modo Normal</option>
              <option value="imda">🔥 Heatmap IMDa</option>
              <option value="cargas">🚚 Cargas Pesadas</option>
            </select>
          )}
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
            <Geoite height="100%" projectId={projectId} section="trafico">
              <HeatmapOverlay 
                mapMode={mapMode} 
                extractedTrafficData={extractedTrafficData} 
                sections={sections} 
              />
              {stations && stations.map((station) => {
                 if (!station.lat || !station.lng) return null;
                 
                 // Determinar estado QA/QC
                 let status = 'missing';
                 let imda = 'N/A';
                 const data = extractedTrafficData?.[station.id];
                 if (data) {
                    status = data.moduleStatus?.['conteo_vehicular'] || 'pending';
                    imda = data.imda || 'N/A';
                 }

                 // Configurar colores según el estado
                 const pinColors = {
                    approved: { bg: '#10b981', border: '#059669' }, // Verde
                    pending: { bg: '#eab308', border: '#ca8a04' },  // Amarillo
                    rejected: { bg: '#ef4444', border: '#b91c1c' }, // Rojo
                    missing: { bg: '#94a3b8', border: '#64748b' }   // Gris
                 };
                 const color = pinColors[status] || pinColors.missing;

                 return (
                   <Marker
                     key={station.id}
                     position={[station.lat, station.lng]}
                     icon={divIcon({
                       className: 'custom-traffic-station-icon',
                       html: `<div style="
                         background-color: ${color.bg};
                         border: 2px solid ${color.border};
                         border-radius: 50%;
                         width: 28px;
                         height: 28px;
                         display: flex;
                         justify-content: center;
                         align-items: center;
                         color: white;
                         font-weight: bold;
                         font-size: 11px;
                         box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                       ">${station.id.split('-').pop() || 'E'}</div>`,
                       iconSize: [28, 28],
                       iconAnchor: [14, 14],
                       popupAnchor: [0, -14],
                     })}
                   >
                     <Popup>
                       <div style={{ minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
                         <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                           <strong style={{ fontSize: '14px', color: '#1e293b' }}>{station.nombre || station.id}</strong>
                           <div style={{ fontSize: '11px', color: '#64748b' }}>{station.coordenadas}</div>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                           <span style={{ fontSize: '12px', color: '#475569' }}>IMDa:</span>
                           <strong style={{ fontSize: '13px', color: '#0f172a' }}>{imda}</strong>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ fontSize: '12px', color: '#475569' }}>Estado:</span>
                           <strong style={{ fontSize: '12px', color: color.bg }}>
                             {status === 'approved' ? 'Validado' : status === 'rejected' ? 'Rechazado' : status === 'pending' ? 'Pendiente' : 'Sin Datos'}
                           </strong>
                         </div>
                       </div>
                     </Popup>
                   </Marker>
                 );
              })}
            </Geoite>
          </ErrorBoundary>
        </div>
    </section>
  );
};

export default TrafficInternalGeoMap;
