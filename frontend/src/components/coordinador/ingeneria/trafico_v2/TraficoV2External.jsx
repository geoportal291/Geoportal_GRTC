import { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  LayersControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../invvial/ExternalView.css';
import {
  enrichEntitiesWithMapData,
  formatDate,
  MODULE_CONFIG,
  PROCESSING_SUBTABS
} from './trafficV2Utils';
import { getMockTrafficData } from './trafficV2MockData';

/* ── Leaflet Icons ── */
const stationIcon = new L.DivIcon({
  className: '',
  html: `<div style="position:relative;width:32px;height:32px;">
    <div style="width:32px;height:32px;background:#1d4ed8;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 0 0 2px #1d4ed8,0 4px 14px rgba(0,0,0,0.45);"></div>
    <div style="position:absolute;top:6px;left:6px;font-size:14px;">📍</div>
  </div>`,
  iconSize: [32, 38],
  iconAnchor: [16, 38],
  popupAnchor: [0, -40]
});

const sectionIcon = new L.DivIcon({
  className: '',
  html: `<div style="position:relative;width:28px;height:28px;">
    <div style="width:28px;height:28px;background:#f97316;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2.5px solid white;box-shadow:0 0 0 2px #f97316,0 4px 12px rgba(0,0,0,0.35);"></div>
    <div style="position:absolute;top:5px;left:5px;font-size:12px;">🔶</div>
  </div>`,
  iconSize: [28, 34],
  iconAnchor: [14, 34],
  popupAnchor: [0, -36]
});

/* ── Map Helpers ── */
const CoordsBar = () => {
  const [info, setInfo] = useState(null);
  useMapEvents({
    mousemove(e) {
      const { lat, lng } = e.latlng;
      setInfo({ lat: lat.toFixed(5), lng: lng.toFixed(5) });
    }
  });
  if (!info) return null;
  return (
    <div className="coords-display">
      LAT: {info.lat} &nbsp;|&nbsp; LNG: {info.lng}
    </div>
  );
};

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useMemo(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
};

const FlyToMarker = ({ position }) => {
  const map = useMap();
  if (position) {
    map.flyTo(position, 15, { animate: true, duration: 1.2 });
  }
  return null;
};

/* ── Popup Content ── */
const StationPopup = ({ entity, type }) => {
  const lastAsset = entity.assets?.[entity.assets.length - 1];
  const hasImage = lastAsset?.image_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(lastAsset.image_url);

  return (
    <div className="invvial-map-popup-card">
      <div className="popup-header">
        {type === 'station' ? 'ESTACIÓN DE CONTROL' : 'TRAMO HOMOGÉNEO'}
      </div>
      <div className="popup-content">
        {hasImage && (
          <div className="popup-image-container">
            <div className="popup-img-wrapper">
              <img src={lastAsset.image_url} alt="Última foto" />
            </div>
          </div>
        )}
        <div className="popup-details-grid">
          <div className="detail-row">
            <span className="label">NOMBRE:</span>
            <span className="value">{entity.nombre || entity.id}</span>
          </div>
          <div className="detail-row">
            <span className="label">UBICACIÓN:</span>
            <span className="value">{entity.ubicacion || '---'}</span>
          </div>
          <div className="detail-row">
            <span className="label">COORDENADA:</span>
            <span className="value" style={{ lineHeight: '1.2' }}>
              {entity.mapPosition
                ? `${entity.mapPosition.lng.toFixed(5)} E / ${entity.mapPosition.lat.toFixed(5)} N`
                : '---'
              }
            </span>
          </div>
          <div className="detail-row">
            <span className="label">REGISTROS:</span>
            <span className="value">{entity.totalUploads}</span>
          </div>
          <div className="detail-row">
            <span className="label">ÚLTIMO:</span>
            <span className="value">{formatDate(entity.lastUpload)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Sidebar Content ── */
const SidebarLeft = ({
  isOpen,
  onClose,
  searchText,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  totalStations,
  totalSections,
  totalRecords
}) => (
  <aside className={`external-sidebar sidebar-left ${isOpen ? 'active' : ''}`}>
    <div className="ext-sidebar-header">
      <span>Tráfico V2</span>
      <button className="ext-close-btn" onClick={onClose}>
        <i className="fa-solid fa-chevron-left" />
      </button>
    </div>
    <div className="ext-panel-content">
      <div className="ext-form-group" style={{ position: 'relative' }}>
        <i className="fa-solid fa-search" style={{
          position: 'absolute', right: '15px', top: '50%',
          transform: 'translateY(-50%)', color: '#999', zIndex: 2, pointerEvents: 'none'
        }} />
        <input
          type="text"
          className="ext-input"
          placeholder="Buscar estación, tramo..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ paddingRight: '40px' }}
        />
      </div>

      <div className="ext-form-group">
        <label>Tipo de Entidad</label>
        <select className="ext-select" value={filterType} onChange={(e) => onFilterTypeChange(e.target.value)}>
          <option value="all">Todas</option>
          <option value="station">Solo Estaciones</option>
          <option value="section">Solo Tramos</option>
        </select>
      </div>

      <div className="ext-form-group">
        <label>Módulos disponibles</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {PROCESSING_SUBTABS.map((sub) => (
            <div key={sub.id} style={{
              padding: '8px 12px', borderRadius: '8px', background: '#f0f6ff',
              fontSize: '0.84rem', color: '#173a68', fontWeight: 600
            }}>
              {sub.label}
            </div>
          ))}
        </div>
      </div>

      <div className="ext-stats-card">
        <p style={{ margin: '0 0 6px' }}><strong>Estaciones:</strong> {totalStations}</p>
        <p style={{ margin: '0 0 6px' }}><strong>Tramos:</strong> {totalSections}</p>
        <p style={{ margin: 0 }}><strong>Total registros:</strong> {totalRecords}</p>
      </div>
    </div>
  </aside>
);

const SidebarRight = ({
  isOpen,
  onClose,
  mappedStations,
  mappedSections,
  missingEntities,
  lastRecord
}) => (
  <aside className={`external-sidebar sidebar-right ${isOpen ? 'active' : ''}`}>
    <div className="ext-sidebar-header right-header">
      <span>Leyenda</span>
      <button className="ext-close-btn" onClick={onClose}>
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
    <div className="ext-panel-content">
      <div className="ext-layer-group">
        <div className="ext-layer-title expanded">
          <i className="fa-solid fa-map-pin" style={{ color: '#1d4ed8' }} />
          Marcadores
        </div>
        <div className="ext-layer-list-wrapper expanded">
          <div className="ext-layer-list">
            <div className="ext-layer-item">
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#1d4ed8', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }} />
              <span>Estaciones ({mappedStations})</span>
            </div>
            <div className="ext-layer-item">
              <div style={{
                width: '14px', height: '14px', borderRadius: '50%',
                background: '#f97316', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }} />
              <span>Tramos ({mappedSections})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ext-layer-group" style={{ marginTop: '14px' }}>
        <div className="ext-layer-title expanded">
          <i className="fa-solid fa-fire" style={{ color: '#ef4444' }} />
          Niveles de Tráfico (IMDa)
        </div>
        <div className="ext-layer-list-wrapper expanded">
          <div className="ext-layer-list">
            <div className="ext-layer-item">
              <div style={{ width: '24px', height: '8px', background: '#ef4444', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }} />
              <span>Alto (&gt; 3500 veh/día)</span>
            </div>
            <div className="ext-layer-item">
              <div style={{ width: '24px', height: '6px', background: '#f59e0b', borderRadius: '3px', border: '1px solid rgba(0,0,0,0.1)' }} />
              <span>Medio (2000 - 3500)</span>
            </div>
            <div className="ext-layer-item">
              <div style={{ width: '24px', height: '4px', background: '#10b981', borderRadius: '2px', border: '1px solid rgba(0,0,0,0.1)' }} />
              <span>Bajo (&lt; 2000 veh/día)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ext-layer-group" style={{ marginTop: '14px' }}>
        <div className="ext-layer-title expanded">
          <i className="fa-solid fa-layer-group" style={{ color: '#3b82f6' }} />
          Capas Base
        </div>
        <div className="ext-layer-list-wrapper expanded">
          <div className="ext-layer-list">
            <div className="ext-layer-item"><span>OpenStreetMap (Estándar)</span></div>
            <div className="ext-layer-item"><span>Topográfico</span></div>
            <div className="ext-layer-item"><span>Satélite (Esri)</span></div>
          </div>
        </div>
      </div>

      <div className="ext-stats-card" style={{ marginTop: '18px' }}>
        <p style={{ margin: '0 0 6px' }}><strong>Último registro:</strong></p>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>{lastRecord}</p>
      </div>

      {missingEntities.length > 0 && (
        <div style={{ marginTop: '18px' }}>
          <div style={{
            fontSize: '0.82rem', fontWeight: 700, color: '#b66b00',
            marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px'
          }}>
            Pendientes de georref. ({missingEntities.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {missingEntities.slice(0, 5).map((ent) => (
              <div key={ent.id} style={{
                padding: '8px 10px', borderRadius: '8px', background: '#fff7e8',
                border: '1px solid rgba(217,151,18,0.18)', fontSize: '0.82rem', color: '#8a6521'
              }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>{ent.nombre || ent.id}</strong>
                <span>{ent.ubicacion || 'Ubicación no registrada'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </aside>
);

/* ── Main Component ── */
const TraficoV2External = ({ projectName, dataset, isLoading, error, onBack, onSwitchMode }) => {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');

  const stations = useMemo(() => enrichEntitiesWithMapData(dataset.stations), [dataset.stations]);
  const sections = useMemo(() => enrichEntitiesWithMapData(dataset.sections), [dataset.sections]);

  const filteredStations = useMemo(() => {
    if (filterType === 'section') return [];
    let result = stations;
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter((s) =>
        (s.nombre || '').toLowerCase().includes(lower) ||
        (s.ubicacion || '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [stations, filterType, searchText]);

  const filteredSections = useMemo(() => {
    if (filterType === 'station') return [];
    let result = sections;
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter((s) =>
        (s.nombre || '').toLowerCase().includes(lower) ||
        (s.ubicacion || '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [sections, filterType, searchText]);

  const mappedStations = filteredStations.filter((s) => s.mapPosition);
  const mappedSections = filteredSections.filter((s) => s.mapPosition);
  const allMapped = [...mappedStations, ...mappedSections];

  const missingEntities = useMemo(
    () => [...stations, ...sections].filter((e) => !e.mapPosition),
    [stations, sections]
  );

  const sectionSegments = useMemo(() => {
    if (mappedSections.length < 2) return [];
    const segments = [];
    for (let i = 0; i < mappedSections.length - 1; i++) {
      const start = mappedSections[i];
      const end = mappedSections[i + 1];
      const traffic = getMockTrafficData(start.id, 'section');
      const imda = traffic.imda || 1500;
      
      let color = '#10b981'; // Verde (Bajo)
      let weight = 4;
      if (imda > 3500) {
        color = '#ef4444'; // Rojo (Alto)
        weight = 8;
      } else if (imda > 2000) {
        color = '#f59e0b'; // Naranja (Medio)
        weight = 6;
      }
      
      segments.push({
        id: `${start.id}-${end.id}`,
        positions: [
          [start.mapPosition.lat, start.mapPosition.lng],
          [end.mapPosition.lat, end.mapPosition.lng]
        ],
        imda,
        color,
        weight,
        startName: start.nombre || start.id,
        endName: end.nombre || end.id
      });
    }
    return segments;
  }, [mappedSections]);

  const totalRecords = useMemo(
    () => [...stations, ...sections].reduce((acc, e) => acc + (e.totalUploads || 0), 0),
    [stations, sections]
  );

  const lastRecord = useMemo(() => {
    const dates = [...stations, ...sections]
      .map((e) => e.lastUpload)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a));
    return formatDate(dates[0]);
  }, [stations, sections]);

  const mapBounds = useMemo(() => {
    if (allMapped.length === 0) return null;
    const latLngs = allMapped.map((e) => [e.mapPosition.lat, e.mapPosition.lng]);
    return L.latLngBounds(latLngs);
  }, [allMapped]);

  const center = allMapped.length > 0
    ? [allMapped[0].mapPosition.lat, allMapped[0].mapPosition.lng]
    : [-12.5, -72.5];

  if (isLoading) {
    return ReactDOM.createPortal(
      <div className="external-view-container">
        <div className="invvial-loading-overlay" style={{ zIndex: 11000 }}>
          <div className="loader-spinner-large" />
          <div className="invvial-loading-text">Cargando Vista Externa de Tráfico V2...</div>
        </div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="external-view-container">
      {/* Left Sidebar */}
      <SidebarLeft
        isOpen={leftOpen}
        onClose={() => setLeftOpen(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        totalStations={stations.length}
        totalSections={sections.length}
        totalRecords={totalRecords}
      />

      {/* Map Area */}
      <div className="external-map-container">
        {/* Toggle Left */}
        <button
          className="ext-toggle-btn toggle-left"
          style={{ display: !leftOpen ? 'flex' : 'none' }}
          onClick={() => setLeftOpen(true)}
        >
          <i className="fa-solid fa-bars" />
        </button>

        {/* Toggle Right */}
        <button
          className="ext-toggle-btn"
          style={{
            display: !rightOpen ? 'flex' : 'none',
            right: '20px', top: '20px', position: 'absolute', zIndex: 2000
          }}
          onClick={() => setRightOpen(true)}
        >
          <i className="fa-solid fa-layer-group" />
        </button>

        {/* Back Button */}
        <button className="ext-back-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left" /> Salir / Volver
        </button>

        {/* Error banner */}
        {error && (
          <div style={{
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 2000, background: '#fee2e2', color: '#991b1b',
            padding: '10px 20px', borderRadius: '12px', fontWeight: 700,
            border: '1px solid #fca5a5', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {error}
          </div>
        )}

        {/* Map */}
        <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Estándar">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Topográfico">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenTopoMap"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {mapBounds && <FitBounds bounds={mapBounds} />}
          <CoordsBar />

          {/* Station markers */}
          {mappedStations.map((entity) => (
            <Marker
              key={`station-${entity.id}`}
              position={[entity.mapPosition.lat, entity.mapPosition.lng]}
              icon={stationIcon}
            >
              <Popup maxWidth={320} minWidth={280}>
                <StationPopup entity={entity} type="station" />
              </Popup>
            </Marker>
          ))}

          {/* Section markers */}
          {mappedSections.map((entity) => (
            <Marker
              key={`section-${entity.id}`}
              position={[entity.mapPosition.lat, entity.mapPosition.lng]}
              icon={sectionIcon}
            >
              <Popup maxWidth={320} minWidth={280}>
                <StationPopup entity={entity} type="section" />
              </Popup>
            </Marker>
          ))}

          {/* Section segments (Heatmap) */}
          {sectionSegments.map((seg) => (
            <Polyline
              key={seg.id}
              positions={seg.positions}
              pathOptions={{ color: seg.color, weight: seg.weight, opacity: 0.8 }}
            >
              <Popup>
                <div style={{ padding: '4px', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Segmento de Vía</div>
                  <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600, marginBottom: '6px' }}>{seg.startName} →<br/>{seg.endName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: seg.color }}></div>
                    <strong style={{ fontSize: '1.05rem', color: seg.color }}>{seg.imda} veh/día</strong>
                  </div>
                </div>
              </Popup>
            </Polyline>
          ))}
        </MapContainer>
      </div>

      {/* Right Sidebar */}
      <SidebarRight
        isOpen={rightOpen}
        onClose={() => setRightOpen(false)}
        mappedStations={mappedStations.length}
        mappedSections={mappedSections.length}
        missingEntities={missingEntities}
        lastRecord={lastRecord}
      />
    </div>,
    document.body
  );
};

export default TraficoV2External;
