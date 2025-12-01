import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Componente auxiliar para ajustar el mapa
const FitBounds = ({ point, geoJsonData }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Crear límites para GeoJSON
    let geoJsonBounds = null;
    if (geoJsonData && geoJsonData.features) {
      const geoJsonLayer = L.geoJSON(geoJsonData);
      geoJsonBounds = geoJsonLayer.getBounds();
    }

    // Si hay un punto (alcantarilla)
    if (point && typeof point.lat === 'number' && typeof point.lng === 'number') {
      const pointLatLng = L.latLng(point.lat, point.lng);
      // Priorizar siempre la vista cercana a la alcantarilla
      map.setView(pointLatLng, 17);
    } else if (geoJsonBounds && geoJsonBounds.isValid()) {
      // Solo hay ruta GeoJSON, ajustar a sus límites
      map.fitBounds(geoJsonBounds, { padding: [20, 20], maxZoom: 15 });
    }
    // Si no hay nada (ni alcantarilla ni GeoJSON), no hacemos nada y el MapContainer usará sus valores por defecto

  }, [map, point, geoJsonData]); // Dependencias para re-ejecutar el efecto

  return null;
};

// Función de estilo copiada de Geoite.jsx para consistencia
const styleFunction = (feature) => {
  if (feature.properties) {
    let color;
    switch (feature.properties.id) {
      case 'TRAMO 1':
        color = '#26af60';
        break;
      case 'TRAMO 2':
        color = '#3998d5';
        break;
      case 'TRAMO 3':
        color = '#f09c0c';
        break;
      default:
        color = feature.properties.stroke || '#3388ff';
        break;
    }
    return {
      color: color,
      weight: feature.properties['stroke-width'] || 5,
      opacity: feature.properties['stroke-opacity'] || 1.0,
    };
  }
  return { color: '#3388ff', weight: 3 }; // Default style
};


const MiniMap = ({ alcantarilla, route: geoJsonData }) => {
  const defaultCenter = [-12.046374, -77.042793]; // Centro de Lima, Perú, como fallback

  const alcantarillaPosition = alcantarilla && typeof alcantarilla.latitud === 'number' && typeof alcantarilla.longitud === 'number'
    ? [alcantarilla.latitud, alcantarilla.longitud]
    : null;

  const currentCenter = alcantarillaPosition || defaultCenter;

  const alcantarillaIcon = new L.Icon({
    iconUrl: '/imgs/alcantarilla_icon.png', // Ícono específico de alcantarilla
    iconSize: [32, 32], // Ajustar tamaño si es necesario para el minimapa
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={currentCenter}
        zoom={13}
        renderer={L.canvas()} // Force canvas rendering for better html2canvas compatibility
        whenCreated={map => {
          // Desactivar interacciones del mapa
          map.touchZoom.disable();
          map.doubleClickZoom.disable();
          map.scrollWheelZoom.disable();
          map.boxZoom.disable();
          map.keyboard.disable();
          map.dragging.disable();
          map.zoomControl.disable(); // Deshabilitar el control de zoom
        }}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {geoJsonData && geoJsonData.features && (
          <GeoJSON data={geoJsonData} style={styleFunction} />
        )}
        {alcantarillaPosition && (
          <Marker position={alcantarillaPosition} icon={alcantarillaIcon}>
            <Popup>
              Alcantarilla: {alcantarilla.codigo || 'N/A'}
            </Popup>
          </Marker>
        )}
        <FitBounds point={alcantarillaPosition ? { lat: alcantarillaPosition[0], lng: alcantarillaPosition[1] } : null} geoJsonData={geoJsonData} />
      </MapContainer>
    </div>
  );
};

export default MiniMap;
