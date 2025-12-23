import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { toLatLon } from 'utm';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import alertify from 'alertifyjs';
import { saveAs } from 'file-saver';
import axiosInstance from '../../../../api/axios';
import './SuelosMap.css';

// --- Helpers de Carga KML Seguro ---
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
  return (
    (Array.isArray(geojson.features) && geojson.features.length > 0) ||
    (geojson.type && ['Feature', 'FeatureCollection', 'GeometryCollection'].includes(geojson.type))
  );
};

// --- Componente MapLogic (El "Corazón" de Geoite trasplantado) ---
const MapLogic = ({
  kmlTrazadoIds,
  markerPosition, // Posición de un marcador único (ej. Cantera)
  cantera,        // Info adicional de la cantera para tooltip
  progresivasData, // DATA DE PROGRESIVAS (para colorear si tienen datos)
  onMapReady,
  onMapClick
}) => {
  const map = useMap();
  const isMounted = useRef(false);

  // Referencias a capas
  const displayLayersRef = useRef(new L.FeatureGroup());     // Tramos cargados (Read-only)
  const drawnItemsRef = useRef(new L.FeatureGroup());        // Dibujos del usuario
  const measurementLayersRef = useRef(new L.FeatureGroup()); // Mediciones
  const markerLayerRef = useRef(new L.FeatureGroup());       // Marcador único (Cantera)

  // FIX: User Interaction Tracking to prevent auto-fitBounds jumping
  const userInteractedRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Detectar interacción del usuario para abortar fitBounds futuros que causan saltos
  useEffect(() => {
    if (!map) return;
    const handleInteraction = () => {
      userInteractedRef.current = true;
      // console.log("User interaction detected. Auto-fitBounds disabled.");
    };
    map.on('mousedown', handleInteraction);
    map.on('wheel', handleInteraction);
    map.on('dragstart', handleInteraction);

    return () => {
      map.off('mousedown', handleInteraction);
      map.off('wheel', handleInteraction);
      map.off('dragstart', handleInteraction);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (map.isInitialized) return; // Evitar re-init
    map.isInitialized = true;

    if (onMapReady) onMapReady(map);

    // Añadir capas al mapa
    displayLayersRef.current.addTo(map);
    drawnItemsRef.current.addTo(map);
    measurementLayersRef.current.addTo(map);
    markerLayerRef.current.addTo(map);

    // --- 1. Inicializar Controles (Dibujo, Coordenadas) ---

    // Control de Dibujo
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItemsRef.current, remove: true },
      draw: {
        polyline: false, polygon: false, rectangle: false, circle: false, marker: false // Desactivamos botones default, usamos custom
      }
    });
    // map.addControl(drawControl); // Si queremos los nativos, descomentar. Usamos custom toolbar.

    // Coordenadas en pantalla
    const coordContainer = L.DomUtil.create('div', 'leaflet-control-coordinates');
    const coordControl = new L.Control({ position: 'bottomleft' });
    coordControl.onAdd = () => coordContainer;
    coordControl.addTo(map);

    // Estilo coords
    Object.assign(coordContainer.style, { backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontFamily: 'monospace', display: 'none' });

    map.on('mousemove', (e) => {
      coordContainer.style.display = 'block';
      coordContainer.innerHTML = `Lat: ${e.latlng.lat.toFixed(5)}, Lon: ${e.latlng.lng.toFixed(5)}`;
    });
    map.on('mouseout', () => { coordContainer.style.display = 'none'; });


    // --- 2. Crear Modales Personalizados (Geoite Style) ---

    // A) Modal de Mediciones
    const measureModal = L.DomUtil.create('div', 'invvial-flyout-card invvial-card-blue', map.getContainer());
    measureModal.id = "invvial-menu-medir";
    L.DomEvent.disableClickPropagation(measureModal);
    measureModal.innerHTML = `
            <div class="invvial-card-header invvial-header-blue">
                <span>Mediciones</span>
                <i class="fas fa-times" style="cursor:pointer" id="measure-close"></i>
            </div>
            <div class="invvial-card-body">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button class="invvial-btn-block" id="invvial-distanceButton"><i class="fas fa-ruler"></i> Distancia</button>
                    <button class="invvial-btn-block" id="invvial-areaButton"><i class="fas fa-draw-polygon"></i> Área</button>
                    <button class="invvial-btn-block" id="invvial-clearMeasureButton"><i class="fas fa-trash"></i> Limpiar</button>
                </div>
                <div id="invvial-distanceDisplay" style="margin-bottom: 10px; font-weight: bold;">Seleccione una herramienta.</div>
            </div>
        `;
    // Funcionalidad Medir (Simplificada del Geoite original pa no copiar 1000 lineas de lógica complexa, pero funcional)
    let activeMeasureHandler = null;

    const startMeasure = (type) => {
      if (activeMeasureHandler) activeMeasureHandler.disable();
      if (type === 'polyline') {
        activeMeasureHandler = new L.Draw.Polyline(map, { shapeOptions: { color: '#f39c12' } });
        activeMeasureHandler.enable();
        map.on(L.Draw.Event.CREATED, (e) => {
          const layer = e.layer;
          measurementLayersRef.current.addLayer(layer);
          const latlngs = layer.getLatLngs();
          let dist = 0;
          for (let i = 0; i < latlngs.length - 1; i++) dist += latlngs[i].distanceTo(latlngs[i + 1]);
          document.getElementById('invvial-distanceDisplay').innerText = `Distancia: ${(dist / 1000).toFixed(3)} km`;
        });
      } else if (type === 'polygon') {
        activeMeasureHandler = new L.Draw.Polygon(map, { shapeOptions: { color: '#e74c3c' } });
        activeMeasureHandler.enable();
        map.on(L.Draw.Event.CREATED, (e) => {
          const layer = e.layer;
          measurementLayersRef.current.addLayer(layer);
          // Area calc logic needed? Geoite uses helpers. For now basic.
          document.getElementById('invvial-distanceDisplay').innerText = `Área dibujada`;
        });
      }
    };

    measureModal.querySelector('#measure-close').onclick = () => measureModal.style.display = 'none';
    measureModal.querySelector('#invvial-distanceButton').onclick = () => startMeasure('polyline');
    measureModal.querySelector('#invvial-areaButton').onclick = () => startMeasure('polygon');
    measureModal.querySelector('#invvial-clearMeasureButton').onclick = () => {
      measurementLayersRef.current.clearLayers();
      document.getElementById('invvial-distanceDisplay').innerText = 'Seleccione una herramienta.';
    };


    // B) Modal de Dibujo
    const drawModal = L.DomUtil.create('div', 'invvial-flyout-card invvial-card-orange', map.getContainer());
    drawModal.id = "invvial-menu-dibujo";
    drawModal.style.width = '300px';
    L.DomEvent.disableClickPropagation(drawModal);
    drawModal.innerHTML = `
            <div class="invvial-card-header invvial-header-orange">
                <span>Herramientas de Dibujo</span>
                <i class="fas fa-times" style="cursor:pointer" id="draw-close"></i>
            </div>
             <div class="invvial-card-body">
                <p>Dibuje puntos de interés o geometrías.</p>
                <button id="invvial-drawPointBtn" class="invvial-btn-primary">MARCADOR</button>
             </div>
        `;
    drawModal.querySelector('#draw-close').onclick = () => drawModal.style.display = 'none';
    drawModal.querySelector('#invvial-drawPointBtn').onclick = () => {
      const markerDrawer = new L.Draw.Marker(map);
      markerDrawer.enable();
      map.on(L.Draw.Event.CREATED, (e) => {
        drawnItemsRef.current.addLayer(e.layer);
      });
      drawModal.style.display = 'none';
    };

    // C) Modal de Descarga
    const downloadModal = L.DomUtil.create('div', 'invvial-flyout-card invvial-card-purple', map.getContainer());
    downloadModal.id = 'invvial-menu-kml-descarga';
    L.DomEvent.disableClickPropagation(downloadModal);
    downloadModal.innerHTML = `
          <div class="invvial-card-header invvial-header-purple">
              <span>Descargar Datos</span>
              <i class="fas fa-times" style="cursor:pointer" id="download-close"></i>
          </div>
          <div class="invvial-card-body">
              <p>Exportar geometrías dibujadas.</p>
              <button id="invvial-exportKmlBtn" class="invvial-btn-block"><i class="fas fa-file-code"></i> Descargar KML</button>
          </div>
        `;
    downloadModal.querySelector('#download-close').onclick = () => downloadModal.style.display = 'none';

    const handleExportKML = async () => {
      const geoJsonDrawn = drawnItemsRef.current.toGeoJSON();
      if (geoJsonDrawn.features.length === 0) {
        alertify.error('Nada que exportar.');
        return;
      }
      try {
        // Mock export or reuse existing logic
        alertify.message('Generando KML...');
        const response = await axiosInstance.post('/api/trafico/exportar-kml', geoJsonDrawn, { responseType: 'blob' });
        saveAs(response.data, 'suelos_export.kml');
      } catch (e) {
        console.error(e);
        alertify.error('Error exportando KML');
      }
    };
    downloadModal.querySelector('#invvial-exportKmlBtn').onclick = handleExportKML;


    // --- 3. Toolbar Principal (Left Vertical) ---
    const toolbarContainer = L.DomUtil.create('div', 'invvial-toolbar-container');
    toolbarContainer.innerHTML = `
            <div class="invvial-tool-group">
                <button class="invvial-tool-btn" data-menu="invvial-menu-medir" title="Medir"><i class="fas fa-ruler-combined"></i></button>
                <button class="invvial-tool-btn" data-menu="invvial-menu-dibujo" title="Dibujar"><i class="fas fa-pencil-alt" style="color: #e67e22;"></i></button>
                <button class="invvial-tool-btn" data-menu="invvial-menu-kml-descarga" title="Descargar"><i class="fas fa-download" style="color: #6c5ce7;"></i></button>
            </div>
            <div class="invvial-tool-group">
                <button class="invvial-tool-btn" id="invvial-centerMap" title="Centrar"><i class="fas fa-crosshairs"></i></button>
            </div>
        `;

    const toolbarControl = new L.Control({ position: 'topleft' });
    toolbarControl.onAdd = () => toolbarContainer;
    toolbarControl.addTo(map);

    // Lógica de Toggle de Menús
    const closeAll = () => {
      measureModal.style.display = 'none';
      drawModal.style.display = 'none';
      downloadModal.style.display = 'none';
    };

    toolbarContainer.querySelectorAll('.invvial-tool-btn[data-menu]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const menuId = btn.getAttribute('data-menu');
        const menu = document.getElementById(menuId);
        const isVisible = menu.style.display === 'block';
        closeAll();
        if (!isVisible) {
          menu.style.display = 'block';
        }
      };
    });

    toolbarContainer.querySelector('#invvial-centerMap').onclick = () => {
      // Centrar en los tramos cargados o default
      const bounds = displayLayersRef.current.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds);
      else map.setView([-9.19, -75.015], 6);
    };


  }, [map, onMapReady]); // Fin Init Effect


  // --- 4. Carga reactiva de KMLs (Tramos) ---
  const prevKmlIdsRef = useRef(null);
  const fittedBoundsRef = useRef(new Set()); // Para recordar qué IDs ya hemos enfocado

  useEffect(() => {
    const loadTramos = async () => {
      // 1. Detectar si REALMENTE cambiaron los IDs (cambio de proyecto/tramo)
      const currentIdsStr = JSON.stringify(kmlTrazadoIds);
      const prevIdsStr = JSON.stringify(prevKmlIdsRef.current);
      const idsChanged = currentIdsStr !== prevIdsStr;

      if (idsChanged) {
        prevKmlIdsRef.current = kmlTrazadoIds;
        // Si han cambiado los KMLs radicalmente (otro proyecto), permitimos recentrar
        // reseteando la bandera de interacción.
        userInteractedRef.current = false;
        fittedBoundsRef.current.clear();
      }

      displayLayersRef.current.clearLayers();
      if (!kmlTrazadoIds || kmlTrazadoIds.length === 0) return;

      let hasBounds = false;
      const combinedBounds = L.latLngBounds();

      // Creamos una clave única para este conjunto de IDs para controlar el fitBounds
      const boundsKey = kmlTrazadoIds.join(',');

      for (const id of kmlTrazadoIds) {
        if (!id) continue;
        try {
          const response = await axiosInstance.get(`/api/kml-trazados/${id}/content`);
          const raw = response.data || {};
          const kmlText = raw.kmlContent ?? raw.content ?? raw.kml;

          if (kmlText) {
            const geojson = safeParseKmlToGeoJson(kmlText);
            if (isGeoJsonValid(geojson)) {

              // Helper para parsear progresivas
              const parseToMeters = (val) => {
                if (typeof val === 'number') return val;
                if (!val) return null;
                const s = String(val).trim().toUpperCase().replace(',', '.');
                const kmMatch = s.match(/(\d+)\+(\d+(\.\d+)?)/);
                if (kmMatch) {
                  return parseFloat(kmMatch[1]) * 1000 + parseFloat(kmMatch[2]);
                }
                const clean = s.replace(/[^0-9.]/g, '');
                if (!clean) return null;
                const num = parseFloat(clean);
                return isNaN(num) ? null : num;
              };

              let featuresFound = 0;
              let matchesFound = 0;
              const completedMetersMap = new Map();

              if (progresivasData && Array.isArray(progresivasData)) {
                progresivasData.forEach(p => {
                  if (p.estratos_perfil && p.estratos_perfil.length > 0) {
                    let meters = p.progresiva_inicial !== undefined ? parseFloat(p.progresiva_inicial) : null;
                    if (meters === null || isNaN(meters)) {
                      meters = parseToMeters(p.nombre) || parseToMeters(p.codigo);
                    }
                    if (meters !== null && !isNaN(meters)) {
                      completedMetersMap.set(meters, p);
                    }
                  }
                });
              }

              const layer = L.geoJSON(geojson, {
                style: (feature) => {
                  if (feature.geometry.type === 'Point') return {};
                  return { color: '#3388ff', weight: 4, opacity: 0.6, interactive: false };
                },
                pointToLayer: (feature, latlng) => {
                  if (feature.geometry.type !== 'Point') return null;
                  let matchedProgresiva = null;
                  let kmlMeters = null;

                  if (feature.properties && feature.properties.name) {
                    featuresFound++;
                    kmlMeters = parseToMeters(feature.properties.name);
                    if (kmlMeters !== null) {
                      if (completedMetersMap.has(kmlMeters)) matchedProgresiva = completedMetersMap.get(kmlMeters);
                      else if (completedMetersMap.has(kmlMeters + 1)) matchedProgresiva = completedMetersMap.get(kmlMeters + 1);
                      else if (completedMetersMap.has(kmlMeters - 1)) matchedProgresiva = completedMetersMap.get(kmlMeters - 1);
                      else if (completedMetersMap.has(Math.floor(kmlMeters))) matchedProgresiva = completedMetersMap.get(Math.floor(kmlMeters));
                      else if (completedMetersMap.has(Math.ceil(kmlMeters))) matchedProgresiva = completedMetersMap.get(Math.ceil(kmlMeters));
                    }
                  }

                  if (matchedProgresiva) {
                    matchesFound++;
                    const icon = L.divIcon({
                      className: 'verified-marker-icon',
                      html: `<div class="verified-pin-body" style="animation: none;"><i class="fas fa-check"></i></div>`,
                      iconSize: [30, 30],
                      iconAnchor: [15, 15]
                    });
                    const marker = L.marker(latlng, { icon: icon, zIndexOffset: 1000, interactive: true });
                    marker.bindTooltip(`<b>${feature.properties?.name}</b><br/><span style="color:#16a34a">✅ Con Datos</span>`, { direction: 'top', offset: [0, -10] });
                    marker.on('click', () => {
                      if (onMapClick) onMapClick({ type: 'progresiva', data: matchedProgresiva, kmlData: feature.properties });
                    });
                    return marker;
                  } else {
                    featuresFound++;
                    return L.circleMarker(latlng, {
                      radius: 4, fillColor: "#3388ff", color: "#fff", weight: 1, opacity: 0.8, fillOpacity: 0.8, interactive: true
                    }).bindPopup(feature.properties?.name || '');
                  }
                },
                onEachFeature: null
              });

              displayLayersRef.current.addLayer(layer);
              const b = layer.getBounds();
              if (b.isValid()) {
                combinedBounds.extend(b);
                hasBounds = true;
              }

              if (matchesFound > 0 && idsChanged) {
                // Notificar solo si idsChanged para no spamear
                // alertify.success(`Identificadas ${matchesFound} progresivas con datos.`); 
              }
            }
          }
        } catch (e) {
          console.error("Error loading KML", id, e);
        }
      }

      // LOGICA BLINDADA V2: 
      // Ignorar fitBounds si el usuario ya interactuó con el mapa
      if (userInteractedRef.current) {
        console.log('[SuelosMap] Skipping auto-fitBounds (User Interacted)');
        // Aun así marcamos como fitted para que el Set se mantenga consistente
        fittedBoundsRef.current.add(boundsKey);
        return;
      }

      // Si tenemos bounds válidos...
      // Y el componente está montado...
      // Y NO hemos enfocado este conjunto de IDs todavía...
      if (hasBounds && isMounted.current && !fittedBoundsRef.current.has(boundsKey)) {
        console.log('[SuelosMap] Performing fitBounds for key:', boundsKey);
        map.fitBounds(combinedBounds, { padding: [20, 20] });
        fittedBoundsRef.current.add(boundsKey); // Marcamos como enfocado
      } else {
        console.log('[SuelosMap] Skipping fitBounds (Already fitted or no bounds)');
      }
    };

    loadTramos();
  }, [kmlTrazadoIds, map, progresivasData]);

  // --- 5. Marcador Único (Canteras/Ensayos) ---
  useEffect(() => {
    markerLayerRef.current.clearLayers();
    if (markerPosition && Array.isArray(markerPosition) && markerPosition.length === 2 && markerPosition[0]) {
      const [lat, lon] = markerPosition;
      const marker = L.marker([lat, lon]);

      if (cantera && cantera.imagenes && cantera.imagenes.length > 0) {
        const imgUrl = cantera.imagenes[0].imagen_url;
        const tooltipHtml = `<div class="map-tooltip-image-container"><img src="${imgUrl}" class="map-tooltip-image"/></div>`;
        marker.bindTooltip(tooltipHtml, { permanent: false, direction: 'top', className: 'custom-img-tooltip' });
      } else if (cantera && cantera.nombre) {
        marker.bindTooltip(cantera.nombre);
      }

      marker.addTo(markerLayerRef.current);
    }
  }, [markerPosition, cantera, map]);

  return null;
};

// Define constant outside to maintain reference stability
const DEFAULT_CENTER = [-9.19, -75.015];

// --- Main Component ---
const SuelosMap = React.memo(({
  initialCoords,
  initialZoom = 13,
  kmlTrazadoIds,
  markerPosition,
  cantera,
  progresivasData,
  onMapClick
}) => {
  // Use useMemo to ensure center prop stability 
  const center = useMemo(() => initialCoords || DEFAULT_CENTER, [initialCoords]);

  return (
    <div className="suelos-map-container" style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer center={center} zoom={initialZoom} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Estándar">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapLogic
          kmlTrazadoIds={kmlTrazadoIds}
          markerPosition={markerPosition}
          cantera={cantera}
          progresivasData={progresivasData} // Pass prop
          onMapClick={onMapClick}
        />
      </MapContainer>
    </div>
  );
});

export default SuelosMap;
