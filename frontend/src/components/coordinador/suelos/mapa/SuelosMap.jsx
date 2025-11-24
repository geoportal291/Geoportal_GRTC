// SuelosMap.jsx (con logs de depuración detallados)
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import alertify from 'alertifyjs';
import './SuelosMap.css';
//import axios from 'axios';
import axiosInstance from '../../../../api/axios.js';
import MapControls from './MapControls';

// --- Helpers ---
const safeParseKmlToGeoJson = (kmlText) => {
  try {

    const kmlDoc = new DOMParser().parseFromString(kmlText, 'text/xml');
    const geojson = kml(kmlDoc);

    return geojson;
  } catch (err) {
    console.error('[safeParseKmlToGeoJson] Error:', err);
    return null;
  }
};

const isGeoJsonValid = (geojson) => {
  if (!geojson) return false;
  const valid =
    (Array.isArray(geojson.features) && geojson.features.length > 0) ||
    (geojson.type && ['Feature', 'FeatureCollection', 'GeometryCollection'].includes(geojson.type));

  return valid;
};

// --- Marker Manager Component ---
const MarkerManager = ({ position, onMarkerClick, tooltipContent }) => {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    // Si no hay posición, eliminar el marcador existente y detener.
    if (!position || !Array.isArray(position) || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
        return;
    }

    // Si hay una posición, asegurarse de que el marcador exista.
    if (!markerRef.current) {
        markerRef.current = L.marker(position).addTo(map);
    } else {
        markerRef.current.setLatLng(position);
    }

    // Manejar evento de clic
    markerRef.current.off('click'); // Limpiar listener anterior
    if (onMarkerClick) {
        markerRef.current.on('click', onMarkerClick);
    }

    // Manejar tooltip de forma segura
    markerRef.current.unbindTooltip(); // Es seguro llamarlo incluso si no hay tooltip
    if (tooltipContent) {
        markerRef.current.bindTooltip(tooltipContent, { permanent: false, direction: 'top' });
    }

  }, [position, map, onMarkerClick, tooltipContent]);

  return null;
};

// --- MapLogic ---
const MapLogic = ({
  displayMode,
  initialCoords,
  projectId,
  kmlTrazadoIds, // Ahora es un array de IDs
  onMapReady,
  onMapClick,
  transientGeoJson,
  isSelecting, // Nueva prop
}) => {
  const map = useMap();
  const isMounted = useRef(false);

  // Efecto para manejar el clic en el mapa
  useEffect(() => {
    if (!onMapClick) return;

    const handleClick = (e) => {
      if (isSelecting) {
        onMapClick(e);
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick, map, isSelecting]);

  // Efecto para cambiar el cursor del mapa
  useEffect(() => {
    const mapContainer = map.getContainer();
    if (isSelecting) {
      mapContainer.style.cursor = 'crosshair';
    } else {
      mapContainer.style.cursor = ''; // Revertir al cursor por defecto
    }

    // Cleanup
    return () => {
      mapContainer.style.cursor = '';
    };
  }, [isSelecting, map]);



  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Efecto para dibujar el GeoJSON temporal (del KML subido)
  useEffect(() => {

    if (!transientGeoJson) {

      return;
    }

    const transientLayer = new L.FeatureGroup();
    map.addLayer(transientLayer);


    if (isGeoJsonValid(transientGeoJson)) {

      const newLayer = L.geoJSON(transientGeoJson, {
        style: () => ({ color: '#3388ff', weight: 3, opacity: 0.8 }),
      });
      transientLayer.addLayer(newLayer);


      const bounds = newLayer.getBounds();
      if (bounds.isValid()) {

        if (isMounted.current) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } else {

      }
    } else {

    }

    return () => {

      map.removeLayer(transientLayer);
    };
  }, [transientGeoJson, map]);

  useEffect(() => {
    if (!map) return;


    const localDisplayLayers = new L.FeatureGroup();
    map.addLayer(localDisplayLayers);


    if (onMapReady) onMapReady(map);

    const coordContainer = L.DomUtil.create('div', 'leaflet-control-coordinates');
    const coordControl = new L.Control({ position: 'bottomleft' });
    coordControl.onAdd = () => coordContainer;
    coordControl.addTo(map);

    Object.assign(coordContainer.style, {
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      display: 'none',
    });

    let kmlLoadAbortController = null;

    // --- Funciones de carga ---
    const loadKmlById = async (id) => {

      if (!id) return;
      if (!localDisplayLayers) {

        return;
      }

      // No limpiar localDisplayLayers aquí, ya que queremos acumular KMLs
      // localDisplayLayers.clearLayers();

      try {
        kmlLoadAbortController = new AbortController();
        const response = await axiosInstance.get(`/api/kml-trazados/${id}/content`, {
          signal: kmlLoadAbortController.signal,
        });


        if (!isMounted.current) return;

        const raw = response?.data ?? {};
        const kmlText = raw.kmlContent ?? raw.content ?? raw.kml ?? null;
        if (!kmlText) {
          alertify.error('KML vacío o formato inesperado.');
          return;
        }

        const geojson = safeParseKmlToGeoJson(kmlText);
        if (!isGeoJsonValid(geojson)) {
          alertify.error('GeoJSON inválido o sin geometrías.');
          return;
        }


        const geoJsonLayer = L.geoJSON(geojson, {
          style: (feature) => ({
            color: '#ff0000',
            weight: 4,
            opacity: 1.0,
            fillOpacity: 0.25,
          }),
          pointToLayer: (feature, latlng) => L.circleMarker(latlng, { radius: 5, color: 'red' }),
        });

        geoJsonLayer.addTo(localDisplayLayers);

        const bounds = geoJsonLayer.getBounds?.();
        if (bounds && bounds.isValid && bounds.isValid()) {
          return bounds; // Return the bounds
        } 
        return null; // Return null if bounds are not valid
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return null;
        }
        console.error('[loadKmlById] Error cargando KML:', err);
        alertify.error('Error cargando el KML.');
        return null; // Return null on error
      } finally {
        kmlLoadAbortController = null;
      }
    };

    // --- Carga inicial ---
    (async () => {
      localDisplayLayers.clearLayers(); // Limpiar antes de cargar nuevos KMLs
      if (kmlTrazadoIds && Array.isArray(kmlTrazadoIds) && kmlTrazadoIds.length > 0) {
        const combinedBounds = L.latLngBounds();
        for (const id of kmlTrazadoIds) {
          if (id) {
            const bounds = await loadKmlById(id);
            if (bounds) {
              combinedBounds.extend(bounds);
            }
          }
        }
        
        if (isMounted.current && map && combinedBounds.isValid()) {
          map.fitBounds(combinedBounds, { padding: [50, 50] });
        } else if (isMounted.current && map && !combinedBounds.isValid()) {
          // Fallback if no valid KMLs were found, center on default
          setTimeout(() => {
            if (isMounted.current && map) { // Check again inside timeout
                map.setView([-9.19, -75.015], 5);
            }
          }, 0); // Use setTimeout to defer execution
        }
        return;
      }

      if (!kmlTrazadoIds && initialCoords && Array.isArray(initialCoords) && initialCoords.length === 2) {
        const [lat, lon] = initialCoords;
        const marker = L.marker([lat, lon]);
        localDisplayLayers.clearLayers();
        marker.addTo(localDisplayLayers);
        map.setView([lat, lon], 15);
        return;
      }

      if (!kmlTrazadoIds && displayMode === 'full' && projectId) {
        try {
          const resp = await axiosInstance.get(`/api/proyectos/${projectId}/kml`);
          const url = resp?.data?.url;
          if (url) {
            const res = await fetch(url);
            const text = await res.text();
            const geojson = safeParseKmlToGeoJson(text);
            if (isGeoJsonValid(geojson)) {
              const layer = L.geoJSON(geojson, { style: { color: 'blue', weight: 4, opacity: 1 } });
              layer.addTo(localDisplayLayers);
              const bounds = layer.getBounds?.();
              if (bounds && bounds.isValid && bounds.isValid()) map.fitBounds(bounds);
            } else {
              console.warn('[MapLogic] GeoJSON inválido desde URL.');
            }
          }
        } catch (err) {
          console.error('[MapLogic] Error cargando KML del proyecto:', err);
        }
      }
    })();

    // cleanup
    return () => {
      if (coordControl) coordControl.remove();
      if (kmlLoadAbortController) {
        try {
          kmlLoadAbortController.abort();
        } catch {}
      }
      if (map.hasLayer(localDisplayLayers)) {
        map.removeLayer(localDisplayLayers);
      }
    };
  }, [map, displayMode, initialCoords, projectId, kmlTrazadoIds, onMapReady]);

  return null;
};

// --- Componente principal ---
const SuelosMap = ({
  displayMode = 'full',
  initialCoords,
  initialZoom = 13,
  projectId,
  kmlTrazadoIds,
  markerPosition,
  onMapClick,
  transientGeoJson,
  isSelecting,
  onMarkerClick, // <-- Nueva prop
  cantera, // <-- Nueva prop para datos de la cantera
}) => {
  const center = initialCoords || [-9.19, -75.015];
  const [mapInstance, setMapInstance] = useState(null);
  const [displayLayersInstance, setDisplayLayersInstance] = useState(null);
  const [measurementLayersInstance, setMeasurementLayersInstance] = useState(null);
  const [persistentMeasurementLayersInstance, setPersistentMeasurementLayersInstance] = useState(null);

  const mapContainerRef = useRef(null);

  const handleMapReady = useCallback((map) => {
    setMapInstance((prev) => prev ?? map);
  }, []);

  const tooltipContent = useMemo(() => {
    if (cantera && cantera.imagenes && cantera.imagenes.length > 0) {
      const imageUrl = cantera.imagenes[0].imagen_url;
      const content = `<div class="map-tooltip-image-container"><img src="${imageUrl}" alt="${cantera.nombre}" class="map-tooltip-image"/></div>`;
      return content;
    }
    return null;
  }, [cantera]);

  // Efecto para invalidar el tamaño del mapa cuando el contenedor cambia de tamaño
  useEffect(() => {
    if (!mapInstance || !mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapContainerRef.current && mapContainerRef.current.offsetParent !== null) {
        // Usamos un timeout para no llamar a invalidateSize() como locos durante el redimensionado
        setTimeout(() => {
          if (mapInstance && mapContainerRef.current) {
            mapInstance.invalidateSize();
          }
        }, 150);
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapInstance]);

  // Effect to create and add FeatureGroups to the map once mapInstance is available
  useEffect(() => {
      if (mapInstance && !displayLayersInstance) {
          const displayLayers = new L.FeatureGroup();
          const measurementLayers = new L.FeatureGroup();
          const persistentMeasurementLayers = new L.FeatureGroup();

          mapInstance.addLayer(displayLayers);
          mapInstance.addLayer(measurementLayers);
          mapInstance.addLayer(persistentMeasurementLayers);

          setDisplayLayersInstance(displayLayers);
          setMeasurementLayersInstance(measurementLayers);
          setPersistentMeasurementLayersInstance(persistentMeasurementLayers);

          return () => {
              // Cleanup: remove layers from map when component unmounts or mapInstance changes
              if (mapInstance.hasLayer(displayLayers)) mapInstance.removeLayer(displayLayers);
              if (mapInstance.hasLayer(measurementLayers)) mapInstance.removeLayer(measurementLayers);
              if (mapInstance.hasLayer(persistentMeasurementLayers)) mapInstance.removeLayer(persistentMeasurementLayers);
          };
      }
  }, [mapInstance, displayLayersInstance]);

  const renderMapContent = (extraStyle = {}) => (
    <MapContainer center={center} zoom={initialZoom} style={{ height: '100%', width: '100%', ...extraStyle }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Estándar">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satélite">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MarkerManager 
        position={markerPosition} 
        onMarkerClick={onMarkerClick}
        tooltipContent={tooltipContent}
      />

      <MapLogic
        displayMode={displayMode}
        initialCoords={initialCoords}
        projectId={projectId}
        kmlTrazadoIds={kmlTrazadoIds}
        onMapReady={handleMapReady}
        markerPosition={markerPosition}
        onMapClick={onMapClick}
        displayLayers={displayLayersInstance}
        transientGeoJson={transientGeoJson} // Pasar la prop al componente hijo
        isSelecting={isSelecting} // Pasar la prop al componente hijo
      />
      <MapControls
        displayMode={displayMode}
        map={mapInstance}
        displayLayers={displayLayersInstance}
        measurementLayers={measurementLayersInstance}
        persistentMeasurementLayers={persistentMeasurementLayersInstance}
      />
    </MapContainer>
  );

  return (
    <div className="suelos-map-container" style={{ height: '100%', width: '100%' }} ref={mapContainerRef}>
      {renderMapContent()}
    </div>
  );
};

export default SuelosMap;
