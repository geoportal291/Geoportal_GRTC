import { LayersControl, MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const stationIcon = new L.DivIcon({
  className: 'traffic-v2-marker-station',
  html: '<div class="traffic-v2-marker traffic-v2-marker-station-inner"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const sectionIcon = new L.DivIcon({
  className: 'traffic-v2-marker-section',
  html: '<div class="traffic-v2-marker traffic-v2-marker-section-inner"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const TrafficExternalMap = ({ stations, sections, mode, title, description, summaryCards = [] }) => {
  const mappedStations = stations.filter((item) => item.mapPosition);
  const mappedSections = sections.filter((item) => item.mapPosition);
  const hasMapData = mappedStations.length > 0 || mappedSections.length > 0;

  const center = hasMapData
    ? [
        mappedStations[0]?.mapPosition?.lat || mappedSections[0]?.mapPosition?.lat,
        mappedStations[0]?.mapPosition?.lng || mappedSections[0]?.mapPosition?.lng
      ]
    : [-12.5, -72.5];

  const showStations = mode !== 'reporte' || mappedStations.length > 0;
  const showSections = mode !== 'procesamiento' || mappedSections.length > 0;

  return (
    <section className="traffic-v2-panel traffic-v2-span-8">
      <div className="traffic-v2-panel-header">
        <div className="traffic-v2-map-header-copy">
          <h3>{title || 'Vista geográfica interactiva'}</h3>
          <p>{description || 'Mapa base del proyecto para explorar estaciones, tramos y cobertura territorial.'}</p>
        </div>
      </div>

      <div className={`traffic-v2-map-shell ${hasMapData ? '' : 'traffic-v2-map-shell-no-coords'}`.trim()}>
        {summaryCards.length ? (
          <div className="traffic-v2-map-overlay">
            {summaryCards.map((card) => (
              <article key={card.label} className="traffic-v2-map-overlay-card">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        <MapContainer center={center} zoom={11} className={`traffic-v2-map-container ${hasMapData ? '' : 'traffic-v2-map-container-no-coords'}`.trim()}>
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

          {showStations && mappedStations.map((station) => (
            <Marker key={`station-${station.id}`} position={[station.mapPosition.lat, station.mapPosition.lng]} icon={stationIcon}>
              <Popup>
                <strong>{station.nombre || station.id}</strong>
                <br />
                {station.ubicacion || 'Ubicación no registrada'}
                <br />
                Registros: {station.totalUploads}
              </Popup>
            </Marker>
          ))}

          {showSections && mappedSections.map((section) => (
            <Marker key={`section-${section.id}`} position={[section.mapPosition.lat, section.mapPosition.lng]} icon={sectionIcon}>
              <Popup>
                <strong>{section.nombre || section.id}</strong>
                <br />
                {section.ubicacion || 'Ubicación no registrada'}
                <br />
                Registros: {section.totalUploads}
              </Popup>
            </Marker>
          ))}

          {showSections && mappedSections.length > 1 ? (
            <Polyline
              positions={mappedSections.map((section) => [section.mapPosition.lat, section.mapPosition.lng])}
              pathOptions={{ color: '#2d80d8', weight: 3, opacity: 0.65, dashArray: '10 8' }}
            />
          ) : null}
        </MapContainer>

        {!hasMapData ? (
          <div className="traffic-v2-map-empty-banner">
            No hay coordenadas válidas todavía para esta selección. El mapa base sigue disponible mientras se completa la georreferenciación.
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default TrafficExternalMap;
