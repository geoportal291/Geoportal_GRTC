import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap, FeatureGroup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
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
  canterasData,    // DATA DE CANTERAS (Dashboard)
  onMapReady,

  onMapClick,

  defaultZone, // NEW PROP
  layerContext, // NEW: 'dashboard' (default) or any unique string like 'modal-canteras'
  hideKmlPoints, // NEW: If true, ignore points from KML (only show lines/polygons)
  hideToolbar, // NEW: If true, hide measurement/draw toolbar
  isSelecting // NEW: If true, change cursor to crosshair
}) => {
  const map = useMap();
  const navigate = useNavigate();

  // --- Change cursor style based on selection mode ---
  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    container.style.cursor = isSelecting ? 'crosshair' : '';
  }, [isSelecting, map]);

  const [forceUpdate, setForceUpdate] = useState(0); // Trigger re-render when layers are toggled
  const isMounted = useRef(false);

  // --- GLOBAL CLICK HANDLER (For selection mode) ---
  useEffect(() => {
    if (!map) return;
    const handleGlobalClick = (e) => {
      // If the click was on a marker, Leaflet usually stops prop or fires marker click first.
      // We want to allow picking ANY point on the map.
      if (onMapClick) {
        onMapClick(e); // Pass the raw Leaflet event (has latlng)
      }
    };
    map.on('click', handleGlobalClick);
    return () => map.off('click', handleGlobalClick);
  }, [map, onMapClick]);

  // Handle map resizing (e.g., when sidebar opens/closes)
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(map.getContainer());
    return () => resizeObserver.disconnect();
  }, [map]);

  // Referencias a capas
  const displayLayersRef = useRef(new L.FeatureGroup());     // Tramos cargados (Read-only)
  const drawnItemsRef = useRef(new L.FeatureGroup());        // Dibujos del usuario
  const measurementLayersRef = useRef(new L.FeatureGroup()); // Mediciones
  const markerLayerRef = useRef(new L.FeatureGroup());       // Marcador único (Cantera)
  const canterasLayerRef = useRef(window.canterasLayerGroupGlobal || new L.FeatureGroup()); // Capa de Canteras (Dashboard)

  // LOGIC: Use global ref from LayersControl if available AND we are in the main dashboard context.
  // If we are in a modal (layerContext != undefined), we should use a local ref or a specific modal global ref.

  // Helper to determine if we should use the main global layers
  const useGlobalLayers = !layerContext || layerContext === 'dashboard';

  const progresivasLayerRef = useRef(
    (useGlobalLayers && window.progresivasLayerGroupGlobal) ? window.progresivasLayerGroupGlobal : new L.FeatureGroup()
  );

  const activeCanterasLayerRef = useRef(
    (useGlobalLayers && window.canterasLayerGroupGlobal) ? window.canterasLayerGroupGlobal : new L.FeatureGroup()
  );

  // FIX: User Interaction Tracking to prevent auto-fitBounds jumping
  const userInteractedRef = useRef(false);

  // FIX 2: ResizeObserver para invalidar tamaño al redimensionar
  useEffect(() => {
    isMounted.current = true;
    if (!map) return;

    // Force strict invalidation after a short delay to ensure modal transition is done
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize updates to prevent layout loops/thrashing
      if (map && map._container) {
        requestAnimationFrame(() => {
          // Safety check: ensure map internal pane exists and invalidateSize is a function
          if (map && map._mapPane && typeof map.invalidateSize === 'function') {
            try { map.invalidateSize(); } catch (e) { /* ignore */ }
          }
        });
      }
    });
    resizeObserver.observe(map.getContainer());

    return () => {
      isMounted.current = false;
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [map]);

  // Detectar interacción del usuario para abortar fitBounds futuros que causan saltos
  useEffect(() => {
    if (!map) return;
    const handleInteraction = () => {
      userInteractedRef.current = true;
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

  // Listener for Layer Toggles (Remounting)
  useEffect(() => {
    const handleRefresh = (e) => {
      if (e.detail === 'progresivasLayerGroupGlobal' || e.detail === 'canterasLayerGroupGlobal') {
        // console.log(`[SuelosMap] Layer ${e.detail} refreshed. Redrawing...`);
        setForceUpdate(prev => prev + 1);
      }
    };
    window.addEventListener('layerRefreshed', handleRefresh);
    return () => window.removeEventListener('layerRefreshed', handleRefresh);
  }, []);

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

    // NOTA: Si progresivasLayerRef viene de LayersControl (global), NO lo añadimos aquí,
    // porque LayersControl ya lo maneja. Si es interno (MODAL), sí.

    // Only add to map if it's NOT the global layer (which is managed by LayersControl in Dashboard)
    // OR if we are in a modal where there is no LayersControl wrapping these specific layers.
    if (!useGlobalLayers || !window.progresivasLayerGroupGlobal) {
      progresivasLayerRef.current.addTo(map);
    }
    if (!useGlobalLayers || !window.canterasLayerGroupGlobal) {
      activeCanterasLayerRef.current.addTo(map);
    }

    // --- 1. Inicializar Controles (Dibujo, Coordenadas) ---

    // Control de Dibujo
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItemsRef.current, remove: true },
      draw: {
        polyline: false, polygon: false, rectangle: false, circle: false, marker: false // Desactivamos botones default, usamos custom
      }
    });

    if (!hideToolbar) {
      // Only add draw control if toolbar is enabled (it might be needed for measuring? drawControl is mostly for editing existing shapes if added natively)
      // Actually drawControl is not added to map in previous code (commented out).
    }

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
    if (!hideToolbar) {
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
    } // End if !hideToolbar


  }, [map, onMapReady]); // Fin Init Effect





  // --- NUEVA LÓGICA: DIBUJAR CANTERAS (DASHBOARD) ---
  useEffect(() => {
    if (!map) return;

    // Dynamic lookup needed in case layer was just toggled
    // Helper helper useGlobalLayers logic is in scope now
    const layer = (useGlobalLayers && window.canterasLayerGroupGlobal) ? window.canterasLayerGroupGlobal : activeCanterasLayerRef.current;

    if (layer) layer.clearLayers();

    if (!canterasData || canterasData.length === 0) return;

    canterasData.forEach(c => {
      // Validar coords
      if (c.latitud && c.longitud) {
        let lat = parseFloat(c.latitud);
        let lon = parseFloat(c.longitud);

        // Icono Cantera (Naranja/Montaña)
        const icon = L.divIcon({
          className: 'cantera-marker-icon',
          html: `<div style="
                  background-color: #e67e22;
                  color: white;
                  width: 30px; height: 30px;
                  border-radius: 50%;
                  display: flex; align-items: center; justify-content: center;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                  border: 2px solid white;
                "><i class="fas fa-mountain"></i></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lon], {
          icon: icon,
          title: c.nombre_cantera || 'Cantera'
        });

        // Popup Content
        const popupContent = document.createElement('div');
        popupContent.style.textAlign = 'center';
        popupContent.innerHTML = `
          <h4 style="margin:0 0 5px 0; color:#d35400;">${c.nombre_cantera}</h4>
          <p style="margin:0; font-size:12px;">${c.codigo_cantera || ''}</p>
          <div style="margin-top:8px;">
            <button class="invvial-btn-primary" style="padding:4px 8px; font-size:11px;">
              <i class="fas fa-eye"></i> Ver Detalle
            </button>
          </div>
        `;

        // Add click listener to button
        const btn = popupContent.querySelector('button');
        if (btn) {
          btn.onclick = () => {
            navigate(`/suelos/canteras/${c.cantera_id}`);
          };
        }

        marker.bindPopup(popupContent);

        if (layer) marker.addTo(layer);
      }
    });

  }, [canterasData, map, forceUpdate]); // forceUpdate triggers redraw on toggle

  // --- NUEVA LÓGICA: DIBUJAR PROGRESIVAS DESDE DB ---
  useEffect(() => {
    if (!map) return;

    // console.log('[DEBUG SuelosMap] Checking progresivasData:', { ... });

    if (!progresivasData) return;

    // Use dynamic reference
    const progLayer = (useGlobalLayers && window.progresivasLayerGroupGlobal) ? window.progresivasLayerGroupGlobal : progresivasLayerRef.current;

    if (progLayer) progLayer.clearLayers();

    let addedCount = 0;

    progresivasData.forEach(p => {
      // Log limits to avoid spam, show first 5 failures/successes
      const shouldLog = addedCount < 5;

      const zoneToUse = p.linea || defaultZone; // Use fallback

      if (p.coordenada_este && p.coordenada_norte && zoneToUse) {
        try {
          const zoneNum = parseInt(zoneToUse.replace(/[A-Za-z]/g, ''));
          const zoneLetter = zoneToUse.replace(/[0-9]/g, '') || 'L'; // Default South if missing

          if (!isNaN(zoneNum)) {
            const latLon = toLatLon(
              parseFloat(p.coordenada_este),
              parseFloat(p.coordenada_norte),
              zoneNum,
              zoneLetter
            );

            // Check valid LatLon (simple check)
            if (Math.abs(latLon.latitude) > 90 || Math.abs(latLon.longitude) > 180) {
              if (shouldLog) console.warn('[DEBUG SuelosMap] LatLon corrupted:', latLon);
              return;
            }

            // Determine styles based on data presence
            const hasData = p.estratos_perfil && p.estratos_perfil.length > 0;
            const isGreen = hasData; // You can add p.estado === 'completado' check if needed

            let marker;

            if (isGreen) {
              // CHECK VERDE para progresivas con datos
              const icon = L.divIcon({
                className: 'verified-marker-icon',
                html: `<div class="verified-pin-body" style="animation: none;"><i class="fas fa-check"></i></div>`,
                iconSize: [30, 30], // Slightly larger
                iconAnchor: [15, 15]
              });
              marker = L.marker([latLon.latitude, latLon.longitude], {
                icon: icon,
                title: `${p.nombre || p.codigo} (Con Datos)`
              });
            } else {
              // PUNTO AZUL SIMPLE para progresivas sin datos (pendientes)
              // Usamos L.marker + DivIcon para asegurar que quede ENCIMA de la línea del KML (Z-Index)
              const blueDotIcon = L.divIcon({
                className: '',
                html: `<div style="
                        width: 12px; 
                        height: 12px; 
                        background-color: #3498db; 
                        border: 2px solid white; 
                        border-radius: 50%;
                        box-shadow: 0 0 4px rgba(0,0,0,0.3);
                      "></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              });

              marker = L.marker([latLon.latitude, latLon.longitude], {
                icon: blueDotIcon,
                zIndexOffset: 800, // Priority over route lines
                title: `${p.nombre || p.codigo} (Pendiente)`
              });
            }

            marker.bindPopup(`
                <b>${p.nombre}</b><br/>
                Prog: ${p.codigo}<br/>
                Estado: ${hasData ? `<span style="color:green">Con Datos (${p.estratos_perfil.length} est.)</span>` : '<span style="color:orange">Pendiente</span>'}<br/>
                Este: ${p.coordenada_este}<br/>
                Norte: ${p.coordenada_norte}<br/>
                Zona: ${zoneToUse}
             `);

            marker.on('click', () => {
              if (onMapClick) {
                onMapClick({
                  type: 'progresiva',
                  data: p
                });
              }
            });

            if (progLayer) marker.addTo(progLayer);
            addedCount++;
          } else {
            if (shouldLog) console.warn('[DEBUG SuelosMap] Invalid zoneNum:', zoneToUse);
          }
        } catch (err) {
          if (shouldLog) console.warn("[DEBUG SuelosMap] Invalid coords logic:", p.id, err.message);
        }
      } else {
        // if (shouldLog) console.log('[DEBUG SuelosMap] Missing coords or zone for:', p.codigo);
      }
    });

    console.log(`[DEBUG SuelosMap] Total markers added: ${addedCount}`);

    // Auto-fit if we drew markers and user hasn't messed with map yet
    if (!userInteractedRef.current && addedCount > 0 && progLayer) {
      // ... fitBounds logic if needed
    }

    return () => {
      // Cleanup handled by parent layer control usually, but safe to clear
      if (progLayer) {
        progLayer.clearLayers();
      }
    };

  }, [progresivasData, map, defaultZone, forceUpdate]);

  // --- 4. Carga reactiva de KMLs (Tramos) ---
  const prevKmlIdsRef = useRef(null);
  const prevProgresivasDataStrRef = useRef(''); // Cache para comparar datos de progresivas
  const fittedBoundsRef = useRef(new Set()); // Para recordar qué IDs ya hemos enfocado
  const kmlContentCacheRef = useRef(new Map()); // Cache para contenido KML por ID

  useEffect(() => {
    const loadTramos = async () => {

      const currentIdsStr = JSON.stringify(kmlTrazadoIds);
      const currentProgresivasDataStr = JSON.stringify(progresivasData || []);

      const prevIdsStr = JSON.stringify(prevKmlIdsRef.current);
      const prevDataStr = prevProgresivasDataStrRef.current;

      const idsChanged = currentIdsStr !== prevIdsStr;
      const dataChanged = currentProgresivasDataStr !== prevDataStr;

      // SI NADA CAMBIÓ, SALIR INMEDIATAMENTE.
      // Esto evita el parpadeo/redibujado si el componente padre se renderiza por otras razones.
      if (!idsChanged && !dataChanged) {
        return;
      }



      if (idsChanged) {

        prevKmlIdsRef.current = kmlTrazadoIds;
        // Si han cambiado los KMLs radicalmente (otro proyecto), permitimos recentrar
        userInteractedRef.current = false;
        fittedBoundsRef.current.clear();
      }

      // Actualizamos la ref de datos
      prevProgresivasDataStrRef.current = currentProgresivasDataStr;

      displayLayersRef.current.clearLayers();
      if (!kmlTrazadoIds || kmlTrazadoIds.length === 0) {
        console.log('[SuelosMap] No KML IDs to load.');
        return;
      }

      let hasBounds = false;
      const combinedBounds = L.latLngBounds();

      // Creamos una clave única para este conjunto de IDs para controlar el fitBounds
      const boundsKey = kmlTrazadoIds.join(',');

      for (const id of kmlTrazadoIds) {
        if (!id) continue;

        let kmlText = kmlContentCacheRef.current.get(id);

        if (!kmlText) {

          try {

            const response = await axiosInstance.get(`/api/kml-trazados/${id}/content`);
            const raw = response.data || {};
            kmlText = raw.kmlContent ?? raw.content ?? raw.kml;
            if (kmlText) {
              kmlContentCacheRef.current.set(id, kmlText);
            }
          } catch (e) {
            console.error("[SuelosMap] Error loading KML", id, e);
          }
        }

        if (kmlText) {
          try {
            const hasPointTag = kmlText.includes('<Point');
            const hasPlacemarkTag = kmlText.includes('<Placemark');
            console.log(`[DEBUG SuelosMap] Analyzing Raw KML (ID ${id}): Length=${kmlText.length}. Has <Point>: ${hasPointTag}, Has <Placemark>: ${hasPlacemarkTag}`);

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
                  // Removed check for estratos_perfil so we match ALL DB progressives
                  let meters = p.progresiva_inicial !== undefined ? parseFloat(p.progresiva_inicial) : null;
                  if (meters === null || isNaN(meters)) {
                    meters = parseToMeters(p.nombre) || parseToMeters(p.codigo);
                  }
                  if (meters !== null && !isNaN(meters)) {
                    completedMetersMap.set(meters, p);
                  }
                });
              }

              // DEBUG: Opcional, descomentar si se requiere depurar geometría de nuevo
              const geomTypes = new Set(geojson.features.map(f => f.geometry.type));
              const typesArray = Array.from(geomTypes);
              console.log('[SuelosMap] Tipos de geometría encontrados en KML:', typesArray);
              const pointsCount = geojson.features.filter(f => f.geometry.type === 'Point').length;
              const multiPointsCount = geojson.features.filter(f => f.geometry.type === 'MultiPoint').length;
              const lineStringsCount = geojson.features.filter(f => f.geometry.type === 'LineString').length;

              console.log(`[SuelosMap] Estadísticas KML: Puntos=${pointsCount}, MultiPuntos=${multiPointsCount}, Lineas=${lineStringsCount}`);

              const layer = L.geoJSON(geojson, {
                style: (feature) => {
                  if (feature.geometry.type === 'Point') return {};
                  return { color: '#ff1744', weight: 5, opacity: 0.9, interactive: false };
                },
                pointToLayer: (feature, latlng) => {
                  // FILTER: If hideKmlPoints is true, skip ALL points from KML
                  if (hideKmlPoints) return null;

                  if (feature.geometry.type !== 'Point') return null;

                  let matchedProgresiva = null;
                  let kmlMeters = null;

                  if (feature.properties && feature.properties.name) {
                    featuresFound++;
                    kmlMeters = parseToMeters(feature.properties.name);

                    if (kmlMeters !== null) {
                      // Debug simple matching
                      // console.log(`[DEBUG Matching] Buscando: ${kmlMeters} en mapa de tamaño ${completedMetersMap.size}`);
                      if (completedMetersMap.has(kmlMeters)) {
                        matchedProgresiva = completedMetersMap.get(kmlMeters);
                      } else {
                        // Try loose match (tolerance 1-2 meters?)
                        // For now exact match
                      }
                    }
                  } else {
                    featuresFound++;
                  }

                  // FIX for Legend: Add points to progresivasLayerRef, NOT to this L.geoJSON layer
                  const addToProgresivasLayer = (markerInstance) => {
                    // Usar siempre la referencia global más fresca si existe (conectada al UI), sino la local
                    const group = (useGlobalLayers && window.progresivasLayerGroupGlobal) ? window.progresivasLayerGroupGlobal : progresivasLayerRef.current;
                    if (group) {
                      markerInstance.addTo(group);
                    } else {
                      console.warn('[SuelosMap] No progresivas layer group found!');
                    }
                  };

                  if (matchedProgresiva && matchedProgresiva.coordenada_este && matchedProgresiva.coordenada_norte) {
                    matchesFound++;
                    // DB Layer handles it (it has coords). Do NOT duplicate.
                    return null;
                  } else {

                    let icon;
                    let zIndex = -500;
                    let popupHtml = `<b>${feature.properties?.name || 'Punto KML'}</b><br/>`;
                    let interactive = true;
                    let onClickHandler = null;

                    if (matchedProgresiva) {
                      const hasData = matchedProgresiva.estratos_perfil && matchedProgresiva.estratos_perfil.length > 0;
                      zIndex = 800;

                      if (hasData) {
                        // VERDE (Con Datos)
                        icon = L.divIcon({
                          className: 'verified-marker-icon',
                          html: `<div class="verified-pin-body" style="animation: none;"><i class="fas fa-check"></i></div>`,
                          iconSize: [30, 30],
                          iconAnchor: [15, 15]
                        });
                        popupHtml += `Prog: ${matchedProgresiva.codigo}<br/>`;
                        popupHtml += `<span style="color:green">Con Datos (Ubicación KML)</span>`;
                      } else {
                        // AZUL (Pendiente)
                        icon = L.divIcon({
                          className: '',
                          html: `<div style="
                                    width: 12px; 
                                    height: 12px; 
                                    background-color: #3498db; 
                                    border: 2px solid white; 
                                    border-radius: 50%;
                                    box-shadow: 0 0 4px rgba(0,0,0,0.3);
                                "></div>`,
                          iconSize: [12, 12],
                          iconAnchor: [6, 6]
                        });
                        popupHtml += `Prog: ${matchedProgresiva.codigo}<br/>`;
                        popupHtml += `<span style="color:orange">Pendiente (Ubicación KML)</span>`;
                      }

                      onClickHandler = () => {
                        if (onMapClick) {
                          onMapClick({
                            type: 'progresiva',
                            data: matchedProgresiva
                          });
                        }
                      };

                    } else {
                      // GRIS (Referencia Visual - Sin Match)
                      zIndex = 0;
                      icon = L.divIcon({
                        className: 'kml-ref-point',
                        html: `<div style="
                                width: 10px; 
                                height: 10px; 
                                background-color: #6c757d; 
                                border-radius: 50%;
                                border: 1.5px solid white; 
                                box-shadow: 0 0 3px rgba(0,0,0,0.5);
                            "></div>`,
                        iconSize: [10, 10],
                        iconAnchor: [5, 5]
                      });
                      popupHtml += `<span style="color:#6c757d; font-weight:bold;">Referencia Visual (Sin Reg. DB)</span>`;
                    }

                    const marker = L.marker(latlng, {
                      icon: icon,
                      zIndexOffset: zIndex,
                      interactive: interactive
                    }).bindPopup(popupHtml);

                    if (onClickHandler) {
                      marker.on('click', onClickHandler);
                    }

                    // CRITICAL CHANGE: Add manualy to our controlled layer, return null so L.geoJSON doesn't own it
                    addToProgresivasLayer(marker);
                    return null;
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
          } catch (e) {
            console.error("[SuelosMap] Error processing KML content", id, e);
          }
        }
      }

      // LOGICA BLINDADA V2: 
      // Ignorar fitBounds si el usuario ya interactuó con el mapa
      if (userInteractedRef.current) {

        // Aun así marcamos como fitted para que el Set se mantenga consistente
        fittedBoundsRef.current.add(boundsKey);
        return;
      }

      // DEBUG: Log calculated bounds for analysis
      console.log('[SuelosMap] Calculated Bounds:', {
        isValid: combinedBounds.isValid(),
        northEast: combinedBounds.getNorthEast(),
        southWest: combinedBounds.getSouthWest()
      });

      // Si tenemos bounds válidos...
      // Y el componente está montado...
      // Y NO hemos enfocado este conjunto de IDs todavía...
      if (hasBounds && isMounted.current && !fittedBoundsRef.current.has(boundsKey)) {
        // console.log('[SuelosMap] Performing fitBounds (Async) for key:', boundsKey);

        // FIX: Delay fitBounds slightly to allow map container to settle
        setTimeout(() => {
          if (isMounted.current && map) {
            map.fitBounds(combinedBounds, { padding: [20, 20] });
          }
        }, 100);

        fittedBoundsRef.current.add(boundsKey); // Marcamos como enfocado
      } else {

      }
    };

    loadTramos();

    return () => {
      if (displayLayersRef.current) {
        displayLayersRef.current.clearLayers();
      }
    };
  }, [kmlTrazadoIds, map, progresivasData]);

  // --- 5. Marcador Único (Canteras/Ensayos) ---
  useEffect(() => {
    markerLayerRef.current.clearLayers();
    if (markerPosition && Array.isArray(markerPosition) && markerPosition.length === 2 && markerPosition[0]) {
      const [lat, lon] = markerPosition;

      // Icono personalizado para Canteras (Igual al Dashboard)
      const icon = L.divIcon({
        className: 'cantera-marker-icon-selected',
        html: `<div style="
                  background-color: #e67e22;
                  color: white;
                  width: 30px; height: 30px;
                  border-radius: 50%;
                  display: flex; align-items: center; justify-content: center;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                  border: 2px solid white;
                "><i class="fas fa-mountain"></i></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([lat, lon], { icon });

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

// Helper component to capture ref and expose it globally for MapLogic to use
// accepting a globalKey to distinguish between layers
const FeatureGroupWithRef = ({ globalKey }) => {
  const groupRef = useRef(null);
  useEffect(() => {
    if (groupRef.current && globalKey) {
      window[globalKey] = groupRef.current;
      // Signal update so consumers (MapLogic) can re-bind/draw if they need
      window.dispatchEvent(new CustomEvent('layerRefreshed', { detail: globalKey }));
    }
  }, [globalKey]);
  return <FeatureGroup ref={groupRef} />;
};

// --- Main Component ---
const SuelosMap = React.memo(({
  initialCoords,
  initialZoom = 13,
  kmlTrazadoIds,
  markerPosition,
  cantera,
  progresivasData,

  canterasData, // Prop para canteras
  onMapClick,
  defaultZone, // NEW: Fallback zone (e.g., '18L') from parent
  layerContext, // NEW: Context identifier to isolate maps (e.g., 'modal')
  hideKmlPoints, // NEW: Optionally hide points
  hideToolbar, // NEW: Hide tools
  isSelecting // NEW: Visual feedback
}) => {
  // Use useMemo to ensure center prop stability 
  const center = useMemo(() => initialCoords || DEFAULT_CENTER, [initialCoords]);

  // Determine if we should show LayersControl (only in main dashboard usually)
  const showLayersControl = !layerContext || layerContext === 'dashboard';

  return (
    <div className="suelos-map-container" style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
      >
        {showLayersControl && (
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Estándar">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>

            <LayersControl.Overlay checked name="Progresivas">
              <FeatureGroupWithRef globalKey="progresivasLayerGroupGlobal" />
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Canteras">
              <FeatureGroupWithRef globalKey="canterasLayerGroupGlobal" />
            </LayersControl.Overlay>
          </LayersControl>
        )}

        {/* If NO LayersControl, we still need base tiles! */}
        {!showLayersControl && (
          <>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </>
        )}

        <MapLogic
          kmlTrazadoIds={kmlTrazadoIds}
          markerPosition={markerPosition}
          cantera={cantera}
          progresivasData={progresivasData} // Pass prop
          canterasData={canterasData}
          onMapClick={onMapClick}
          defaultZone={defaultZone} // Pass to logic
          layerContext={layerContext} // Pass context down
          hideKmlPoints={hideKmlPoints}
          hideToolbar={hideToolbar}
          isSelecting={isSelecting}
        />
      </MapContainer>
    </div>
  );
});

export default SuelosMap;
