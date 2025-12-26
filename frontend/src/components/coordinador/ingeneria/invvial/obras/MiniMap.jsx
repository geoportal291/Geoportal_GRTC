import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';

// Componente auxiliar para ajustar el mapa
const FitBounds = ({ point, segment, geoJsonData, slicedGeoJson }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Crear límites para GeoJSON
    let geoJsonBounds = null;
    if (geoJsonData && geoJsonData.features) {
      const geoJsonLayer = L.geoJSON(geoJsonData);
      geoJsonBounds = geoJsonLayer.getBounds();
    }

    // 1. Prioridad: Segmento Recortado (GeoJSON) - Ajuste preciso a la curva
    if (slicedGeoJson) {
      const slicedLayer = L.geoJSON(slicedGeoJson);
      const slicedBounds = slicedLayer.getBounds();
      if (slicedBounds.isValid()) {
        map.fitBounds(slicedBounds, { padding: [50, 50], maxZoom: 18 });
        return;
      }
    }

    // 2. Fallback: Segmento Recto (Puntos)
    if (segment && segment.length === 2) {
      const bounds = L.latLngBounds(segment);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        return; // Prioritize segment view
      }
    }

    // 3. Fallback: Punto único
    if (point && typeof point.lat === 'number' && typeof point.lng === 'number') {
      const pointLatLng = L.latLng(point.lat, point.lng);
      // Priorizar siempre la vista cercana a la alcantarilla
      map.setView(pointLatLng, 17);
    } else if (geoJsonBounds && geoJsonBounds.isValid()) {
      // 4. Fallback: Toda la ruta
      map.fitBounds(geoJsonBounds, { padding: [20, 20], maxZoom: 15 });
    }

  }, [map, point, segment, geoJsonData, slicedGeoJson]); // Dependencias para re-ejecutar el efecto

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


const MiniMap = ({ alcantarilla, route: geoJsonData, elementType }) => {
  const defaultCenter = [-12.046374, -77.042793]; // Centro de Lima, Perú, como fallback

  // Lógica para detectar si es un PUNTO o un SEGMENTO
  const isSegment = alcantarilla &&
    typeof alcantarilla.latitud_inicio === 'number' &&
    typeof alcantarilla.latitud_final === 'number';

  const alcantarillaPosition = (!isSegment && alcantarilla && typeof alcantarilla.latitud === 'number' && typeof alcantarilla.longitud === 'number')
    ? [alcantarilla.latitud, alcantarilla.longitud]
    : null;

  const segmentPositions = isSegment
    ? [
      [alcantarilla.latitud_inicio, alcantarilla.longitud_inicio],
      [alcantarilla.latitud_final, alcantarilla.longitud_final]
    ]
    : null;

  // Lógica para calcular el segmento recortado siguiendo la ruta (Turf.js)
  const slicedSegment = useMemo(() => {
    if (!isSegment || !geoJsonData || !geoJsonData.features) return null;

    try {
      const startPt = turf.point([alcantarilla.longitud_inicio, alcantarilla.latitud_inicio]);
      const endPt = turf.point([alcantarilla.longitud_final, alcantarilla.latitud_final]);

      let bestSlice = null;

      // Iterar sobre las features del GeoJSON (Tramos)
      for (const feature of geoJsonData.features) {
        if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
          // Convertir a GeoJSON puro si es necesario, pero aquí ya iteramos sobre features geojson
          // turf.lineSlice espera geojson features

          // Verificar proximidad básica para no procesar tramos lejanos
          const d1 = turf.pointToLineDistance(startPt, feature);
          const d2 = turf.pointToLineDistance(endPt, feature);

          if (d1 < 1 && d2 < 1) { // < 1km (tolerancia amplia)
            try {
              const sliced = turf.lineSlice(startPt, endPt, feature);
              if (sliced) {
                bestSlice = sliced;
                break; // Encontramos el tramo, asumimos que no hay solapamiento complejo
              }
            } catch (e) {
              console.warn("Error slicing segment:", e);
            }
          }
        }
      }
      return bestSlice;

    } catch (error) {
      console.error("Critical error in slice calculation:", error);
      return null;
    }
  }, [isSegment, alcantarilla, geoJsonData]);

  // Center fallback logic
  const currentCenter = isSegment
    ? [(segmentPositions[0][0] + segmentPositions[1][0]) / 2, (segmentPositions[0][1] + segmentPositions[1][1]) / 2]
    : (alcantarillaPosition || defaultCenter);

  // Function to get custom icon based on element type
  const getCustomIcon = (type, elementData) => {
    let iconUrl;
    let iconSize = [32, 32];
    let iconAnchor = [16, 32];
    let popupAnchor = [0, -32];
    let popupText = '';

    // Normalize type to match switch cases (singular/plural handling)
    let normalizedType = type;
    if (type) {
      if (type.endsWith('s') && !type.endsWith('ss')) {
        // Simple singularization for common cases: alcantarillas -> alcantarilla
        // But be careful with 'senales_informativas' which is used as plural in switch
        if (['alcantarillas', 'badenes', 'puentes', 'muros', 'canteras', 'fuentes'].includes(type)) {
          normalizedType = type.slice(0, -1);
          if (type === 'badenes') normalizedType = 'baden'; // special case
          if (type === 'alcantarillas') normalizedType = 'alcantarilla'; // special case
          if (type === 'puentes') normalizedType = 'puente';
          if (type === 'muros') normalizedType = 'muro';
          if (type === 'canteras') normalizedType = 'cantera';
          if (type === 'fuentes') normalizedType = 'fuente';
        }
        if (type === 'zonas_criticas') normalizedType = 'zona_critica';
        if (type === 'interferencias') normalizedType = 'interferencia_electrica';
      }
    }

    switch (normalizedType) {
      case 'alcantarilla':
        iconUrl = '/imgs/alcantarilla_icon.png';
        popupText = `Alcantarilla: ${elementData.codigo || 'N/A'}`;
        break;
      case 'baden':
        iconUrl = '/imgs/baden_icon.svg';
        popupText = `Badén: ${elementData.codigo || 'N/A'}`;
        break;
      case 'puente':
        iconUrl = '/imgs/puente_icon.svg';
        popupText = `Puente: ${elementData.nombre || 'N/A'}`;
        break;
      case 'muro':
        iconUrl = '/imgs/muro_icon.svg';
        popupText = `Muro: ${elementData.clase || 'N/A'}`;
        break;
      case 'cantera':
        iconUrl = '/imgs/cantera_icon.svg';
        popupText = `Cantera: ${elementData.item_number || 'N/A'}`;
        iconSize = [32, 44];
        iconAnchor = [16, 44];
        popupAnchor = [0, -44];
        break;
      case 'fuente':
        iconUrl = '/imgs/fuente_icon.svg';
        popupText = `Fuente: ${elementData.item_number || 'N/A'}`;
        iconSize = [32, 44];
        iconAnchor = [16, 44];
        popupAnchor = [0, -44];
        break;
      case 'zona_critica':
        const t = (elementData.tipo || '').toUpperCase();
        if (t.includes('DESPRENDIMIENTO') || t.includes('TALUD') || t.includes('DESLIZAMIENTO')) {
          iconUrl = '/imgs/zona_deslizamiento.svg';
        } else {
          iconUrl = '/imgs/zona_critica.svg';
        }
        popupText = `Zona Crítica: ${elementData.codigo || 'N/A'}`;
        break;
      case 'interferencia_electrica':
      case 'interferencias':
        iconUrl = '/imgs/interferencia_icon.svg';
        popupText = `Interferencia: ${elementData.tipo_interferencia || elementData.tipo || 'N/A'}`;
        break;
      case 'senales_informativas':
        iconUrl = '/imgs/senal_informativa_icon.svg';
        popupText = `Señal: ${elementData.codigo || 'N/A'}`;
        break;
      case 'senales_preventivas':
        iconUrl = '/imgs/senal_preventiva_icon.svg';
        popupText = `Señal: ${elementData.codigo || 'N/A'}`;
        break;
      case 'senales_reguladoras': // Handle new case
      case 'senales_reglamentarias':
        iconUrl = '/imgs/senal_reguladora_icon.svg'; // Assuming this exists or mapping to preventive for now? 
        // User didn't specify reguladora icon, usually similar to prohibitive/preventive but distinct. 
        // Using generic or preventive if specific one missing? 
        // Let's assume standard path:
        iconUrl = '/imgs/senal_reguladora_icon.svg';
        popupText = `Señal: ${elementData.codigo || 'N/A'}`;
        break;
      case 'hitos_kilometricos':
        iconUrl = '/imgs/hito_icon.svg';
        popupText = `Hito: ${elementData.codigo || 'N/A'}`;
        iconSize = [30, 40];
        iconAnchor = [15, 40];
        popupAnchor = [0, -40];
        break;
      case 'estructura_existente':
      case 'estructuras_existentes':
        iconUrl = '/imgs/estructura_icon.svg';
        popupText = `Estructura: ${elementData.progresiva_inicio || 'N/A'}`;
        iconSize = [32, 32];
        iconAnchor = [16, 32];
        popupAnchor = [0, -32];
        break;
      default:
        iconUrl = '/imgs/alcantarilla_icon.png';
        popupText = `Elemento: ${elementData.id || 'N/A'}`;
        break;
    }

    return new L.Icon({
      iconUrl: iconUrl,
      iconSize: iconSize,
      iconAnchor: iconAnchor,
      popupAnchor: popupAnchor,
      popupText: popupText
    });
  };

  const currentIcon = alcantarilla && !isSegment ? getCustomIcon(elementType || alcantarilla.type, alcantarilla) : null;


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

        {/* Render Marker if Point */}
        {alcantarillaPosition && currentIcon && (
          <Marker position={alcantarillaPosition} icon={currentIcon}>
            <Popup>
              {currentIcon.options.popupText}
            </Popup>
          </Marker>
        )}

        {/* Render Segment: Sliced (Curved) OR Polyline (Straight Fallback) */}
        {isSegment && segmentPositions && (
          <>
            {slicedSegment ? (
              <GeoJSON
                data={slicedSegment}
                // Use default params not style function here since it's just a line
                style={{ color: '#FFFF00', weight: 6, opacity: 0.9 }}
              />
            ) : (
              <Polyline
                positions={segmentPositions}
                pathOptions={{ color: '#FFFF00', weight: 6, dashArray: '10, 10' }}
              />
            )}

            {/* Start/End Markers for visual clarity */}
            <Marker position={segmentPositions[0]} icon={L.divIcon({ className: 'custom-div-icon', html: `<div style="width: 10px; height: 10px; background-color: #00FF00; border-radius: 50%; border: 2px solid white;"></div>` })} />
            <Marker position={segmentPositions[1]} icon={L.divIcon({ className: 'custom-div-icon', html: `<div style="width: 10px; height: 10px; background-color: #FF0000; border-radius: 50%; border: 2px solid white;"></div>` })} />
          </>
        )}

        <FitBounds
          point={alcantarillaPosition ? { lat: alcantarillaPosition[0], lng: alcantarillaPosition[1] } : null}
          segment={segmentPositions}
          geoJsonData={geoJsonData}
          slicedGeoJson={slicedSegment}
        />
      </MapContainer>
    </div>
  );
};

export default MiniMap;
