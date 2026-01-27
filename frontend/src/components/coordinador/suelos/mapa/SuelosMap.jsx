import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap, FeatureGroup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { toLatLon, fromLatLon } from 'utm';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import alertify from 'alertifyjs';
import { saveAs } from 'file-saver';
import { createRoot } from 'react-dom/client';
import axiosInstance from '../../../../api/axios';
import './SuelosMap.css';
import CanteraMapPopup from './CanteraMapPopup';
import ProgresivaMapPopup from './ProgresivaMapPopup';
import { useAuth } from '../../../../data/contexts/AuthContext';

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

// --- Helper para normalizar metros/progresivas ---
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

// --- Componente MapLogic (El "Corazón" de Geoite trasplantado) ---
const MapLogic = ({
  kmlTrazadoIds,
  trazadoIds = [], // NEW: List of strict IDs
  puntosIds = [], // NEW: List of permissive IDs
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
  isSelecting, // NEW: If true, change cursor to crosshair
  authToken, // NEW: User token for image fetching
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
  const canterasLayerRef = useRef(window.suelosCanterasLayerGroup || new L.FeatureGroup()); // Capa de Canteras (Dashboard)

  // LOGIC: Use global ref from LayersControl if available AND we are in the main dashboard context.
  // If we are in a modal (layerContext != undefined), we should use a local ref or a specific modal global ref.

  // Helper to determine if we should use the main global layers
  const useGlobalLayers = !layerContext || layerContext === 'dashboard';

  const progresivasLayerRef = useRef(
    (useGlobalLayers && window.suelosProgresivasLayerGroup) ? window.suelosProgresivasLayerGroup : new L.FeatureGroup()
  );

  const activeCanterasLayerRef = useRef(
    (useGlobalLayers && window.suelosCanterasLayerGroup) ? window.suelosCanterasLayerGroup : new L.FeatureGroup()
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
      if (e.detail === 'suelosProgresivasLayerGroup' || e.detail === 'suelosCanterasLayerGroup') {
        // console.log(`[SuelosMap] Layer ${e.detail} refreshed. Redrawing...`);
        setForceUpdate(prev => prev + 1);
      }
    };
    window.addEventListener('suelosLayerRefreshed', handleRefresh);
    return () => window.removeEventListener('suelosLayerRefreshed', handleRefresh);
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
    if (!useGlobalLayers || !window.suelosProgresivasLayerGroup) {
      progresivasLayerRef.current.addTo(map);
    }
    if (!useGlobalLayers || !window.suelosCanterasLayerGroup) {
      activeCanterasLayerRef.current.addTo(map);
    }

    // --- 1. Inicializar Controles (Dibujo, Coordenadas) ---

    // --- 1. Inicializar Controles (Dibujo, Coordenadas) ---

    // A) Control de Zoom (Nativo, Top Left es default, pero aseguramos)
    // Se gestiona via prop zoomControl={true} en MapContainer, o componente <ZoomControl position="topleft" />

    // B) Toolbar Personalizada (Izquierda) - Medir, Dibujar
    if (!hideToolbar) {
      // 1. Grupo de Herramientas (Medir, Dibujar, Borrar)
      const toolsContainer = L.DomUtil.create('div', 'leaflet-bar easy-button-container leaflet-control', map.getContainer());
      toolsContainer.style.position = 'absolute';
      toolsContainer.style.top = '80px';
      toolsContainer.style.left = '10px';
      toolsContainer.style.zIndex = 1000;
      L.DomEvent.disableClickPropagation(toolsContainer);

      toolsContainer.innerHTML = `
         <button class="suelos-tool-btn" title="Medir Distancia/Área" id="btn-measure-tool"><i class="fas fa-ruler-combined"></i></button>
         <button class="suelos-tool-btn" title="Dibujar Línea" id="btn-draw-line"><i class="fas fa-pencil-alt"></i></button>
         <button class="suelos-tool-btn" title="Borrar Dibujos" id="btn-clear-draw"><i class="fas fa-trash-alt"></i></button>
       `;

      // 2. Grupo de Vista (Centrar) - Separado visualmente
      const fitContainer = L.DomUtil.create('div', 'leaflet-bar easy-button-container leaflet-control', map.getContainer());
      fitContainer.style.position = 'absolute';
      fitContainer.style.top = '220px'; // Aumentado para separar claramente (80 + ~100 + gap)
      fitContainer.style.left = '10px';
      fitContainer.style.zIndex = 1000;
      L.DomEvent.disableClickPropagation(fitContainer);

      fitContainer.innerHTML = `
         <button class="suelos-tool-btn" title="Centrar Trazado" id="btn-fit-bounds"><i class="fas fa-compress-arrows-alt"></i></button>
       `;

      // Bind Events
      setTimeout(() => {
        const btnMeasure = toolsContainer.querySelector('#btn-measure-tool');
        const btnDraw = toolsContainer.querySelector('#btn-draw-line');
        const btnClear = toolsContainer.querySelector('#btn-clear-draw');
        const btnFit = fitContainer.querySelector('#btn-fit-bounds');

        if (btnFit) btnFit.onclick = () => {
          const group = new L.FeatureGroup();
          if (displayLayersRef.current) group.addLayer(displayLayersRef.current);
          if (progresivasLayerRef.current) group.addLayer(progresivasLayerRef.current);

          const bounds = group.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
          } else {
            map.setView([-12.930, -72.630], 13);
          }
        };

        if (btnMeasure) btnMeasure.onclick = () => {
          const modal = document.getElementById('suelos-menu-medir');
          if (modal) modal.style.display = 'block';
        };

        if (btnDraw) btnDraw.onclick = () => {
          new L.Draw.Polyline(map, { shapeOptions: { color: 'red' } }).enable();
        };

        if (btnClear) btnClear.onclick = () => {
          drawnItemsRef.current.clearLayers();
          measurementLayersRef.current.clearLayers();
        };
      }, 0);
    }

    // Coordenadas en pantalla - CENTRADAS ABAJO (Posición Absoluta Manual)
    // No usamos L.Control para evitar problemas de esquinas cortadas.
    const coordContainer = L.DomUtil.create('div', 'leaflet-control-coordinates', map.getContainer());

    // Estilo coords - Esquina Inferior Izquierda (Separado del borde)
    Object.assign(coordContainer.style, {
      position: 'absolute',
      bottom: '25px',
      left: '140px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '5px 15px',
      borderRadius: '20px',
      fontSize: '13px',
      fontFamily: 'monospace',
      display: 'none',
      zIndex: 2000,
      whiteSpace: 'nowrap',
      pointerEvents: 'none' // Click through
    });

    map.on('mousemove', (e) => {
      coordContainer.style.display = 'block';
      coordContainer.innerHTML = `Lat: ${e.latlng.lat.toFixed(5)}, Lon: ${e.latlng.lng.toFixed(5)}`;
    });
    map.on('mouseout', () => { coordContainer.style.display = 'none'; });


    // --- 2. Crear Modales Personalizados (Geoite Style) ---

    // A) Modal de Mediciones
    const measureModal = L.DomUtil.create('div', 'suelos-flyout-card suelos-card-blue', map.getContainer());
    measureModal.id = "suelos-menu-medir";
    L.DomEvent.disableClickPropagation(measureModal);
    measureModal.innerHTML = `
            <div class="suelos-card-header suelos-header-blue">
                <span>Mediciones</span>
                <i class="fas fa-times" style="cursor:pointer" id="measure-close"></i>
            </div>
            <div class="suelos-card-body">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button class="suelos-btn-block" id="suelos-distanceButton"><i class="fas fa-ruler"></i> Distancia</button>
                    <button class="suelos-btn-block" id="suelos-areaButton"><i class="fas fa-draw-polygon"></i> Área</button>
                    <button class="suelos-btn-block" id="suelos-clearMeasureButton"><i class="fas fa-trash"></i> Limpiar</button>
                </div>
                <div id="suelos-distanceDisplay" style="margin-bottom: 10px; font-weight: bold;">Seleccione una herramienta.</div>
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
          document.getElementById('suelos-distanceDisplay').innerText = `Distancia: ${(dist / 1000).toFixed(3)} km`;
        });
      } else if (type === 'polygon') {
        activeMeasureHandler = new L.Draw.Polygon(map, { shapeOptions: { color: '#e74c3c' } });
        activeMeasureHandler.enable();
        map.on(L.Draw.Event.CREATED, (e) => {
          const layer = e.layer;
          measurementLayersRef.current.addLayer(layer);
          // Area calc logic needed? Geoite uses helpers. For now basic.
          document.getElementById('suelos-distanceDisplay').innerText = `Área dibujada`;
        });
      }
    };

    measureModal.querySelector('#measure-close').onclick = () => measureModal.style.display = 'none';
    measureModal.querySelector('#suelos-distanceButton').onclick = () => startMeasure('polyline');
    measureModal.querySelector('#suelos-areaButton').onclick = () => startMeasure('polygon');
    measureModal.querySelector('#suelos-clearMeasureButton').onclick = () => {
      measurementLayersRef.current.clearLayers();
      document.getElementById('suelos-distanceDisplay').innerText = 'Seleccione una herramienta.';
    };


    // B) Modal de Dibujo
    const drawModal = L.DomUtil.create('div', 'suelos-flyout-card suelos-card-orange', map.getContainer());
    drawModal.id = "suelos-menu-dibujo";
    drawModal.style.width = '300px';
    L.DomEvent.disableClickPropagation(drawModal);
    drawModal.innerHTML = `
            <div class="suelos-card-header suelos-header-orange">
                <span>Herramientas de Dibujo</span>
                <i class="fas fa-times" style="cursor:pointer" id="draw-close"></i>
            </div>
             <div class="suelos-card-body">
                <p>Dibuje puntos de interés o geometrías.</p>
                <button id="suelos-drawPointBtn" class="suelos-btn-primary">MARCADOR</button>
             </div>
        `;
    drawModal.querySelector('#draw-close').onclick = () => drawModal.style.display = 'none';
    drawModal.querySelector('#suelos-drawPointBtn').onclick = () => {
      const markerDrawer = new L.Draw.Marker(map);
      markerDrawer.enable();
      map.on(L.Draw.Event.CREATED, (e) => {
        drawnItemsRef.current.addLayer(e.layer);
      });
      drawModal.style.display = 'none';
    };

    // C) Modal de Descarga
    const downloadModal = L.DomUtil.create('div', 'suelos-flyout-card suelos-card-purple', map.getContainer());
    downloadModal.id = 'suelos-menu-kml-descarga';
    L.DomEvent.disableClickPropagation(downloadModal);
    downloadModal.innerHTML = `
          <div class="suelos-card-header suelos-header-purple">
              <span>Descargar Datos</span>
              <i class="fas fa-times" style="cursor:pointer" id="download-close"></i>
          </div>
          <div class="suelos-card-body">
              <p>Exportar geometrías dibujadas.</p>
              <button id="suelos-exportKmlBtn" class="suelos-btn-block"><i class="fas fa-file-code"></i> Descargar KML</button>
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
    downloadModal.querySelector('#suelos-exportKmlBtn').onclick = handleExportKML;


    // --- 3. Toolbar Principal (Left Vertical) ---
    if (!hideToolbar) {
      const toolbarContainer = L.DomUtil.create('div', 'suelos-map-toolbar'); // Used to be invvial-toolbar-container but css was invvial-map-toolbar
      toolbarContainer.innerHTML = `
                <div class="suelos-tool-group">
                    <button class="suelos-tool-btn" data-menu="suelos-menu-medir" title="Medir"><i class="fas fa-ruler-combined"></i></button>
                    <button class="suelos-tool-btn" data-menu="suelos-menu-dibujo" title="Dibujar"><i class="fas fa-pencil-alt" style="color: #e67e22;"></i></button>
                    <button class="suelos-tool-btn" data-menu="suelos-menu-kml-descarga" title="Descargar"><i class="fas fa-download" style="color: #6c5ce7;"></i></button>
                </div>
                <div class="suelos-tool-group">
                    <button class="suelos-tool-btn" id="suelos-centerMap" title="Centrar"><i class="fas fa-crosshairs"></i></button>
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

      toolbarContainer.querySelectorAll('.suelos-tool-btn[data-menu]').forEach(btn => {
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

      toolbarContainer.querySelector('#suelos-centerMap').onclick = () => {
        // Centrar en los tramos cargados o default
        const bounds = displayLayersRef.current.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds);
        else map.setView([-9.19, -75.015], 6);
      };
    } // End if !hideToolbar


  }, [map, onMapReady]); // Fin Init Effect

  // --- Prepare KML ID Sets ---
  const effectiveKmlIds = useMemo(() => {
    const legacy = Array.isArray(kmlTrazadoIds) ? kmlTrazadoIds : [];
    // Filter null/undefined just in case
    return [...new Set([...legacy, ...trazadoIds, ...puntosIds])].filter(Boolean);
  }, [kmlTrazadoIds, trazadoIds, puntosIds]);

  const trazadoSet = useMemo(() => new Set(trazadoIds), [trazadoIds]);
  // --- NUEVA LÓGICA: DIBUJAR CANTERAS (DASHBOARD) ---
  useEffect(() => {
    if (!map) return;

    // Dynamic lookup needed in case layer was just toggled
    const layer = (useGlobalLayers && window.suelosCanterasLayerGroup) ? window.suelosCanterasLayerGroup : activeCanterasLayerRef.current;

    if (layer) layer.clearLayers();

    if (!canterasData || canterasData.length === 0) return;

    // console.log('[DEBUG SuelosMap] Drawing canterasData:', canterasData.length);

    canterasData.forEach(c => {
      // Validar coords - Permitir 'latitud'/'longitud' directas
      let lat, lon;

      if (c.latitud && c.longitud) {
        lat = parseFloat(c.latitud);
        lon = parseFloat(c.longitud);
      } else if (c.coordenada_este && c.coordenada_norte && (c.lado || defaultZone)) {
        // Fallback UTM conversion if only East/North provided
        try {
          const z = c.lado || defaultZone || '18L';
          const zNum = parseInt(z.replace(/[A-Za-z]/g, ''));
          const zLet = z.replace(/[0-9]/g, '') || 'L';
          const res = toLatLon(parseFloat(c.coordenada_este), parseFloat(c.coordenada_norte), zNum, zLet);
          lat = res.latitude;
          lon = res.longitude;
        } catch (e) {
          console.warn('Invalid coords fallback for cantera:', c.nombre, e);
          return;
        }
      }

      if (lat && lon) {
        // Icono Cantera (Naranja/Montaña)
        const icon = L.divIcon({
          className: 'suelos-cantera-marker-icon', // Renamed
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
          title: c.nombre_cantera || c.nombre || 'Cantera'
        });

        if (layer) marker.addTo(layer);

        // --- Render React Component into Popup ---
        const container = document.createElement('div');
        const root = createRoot(container);

        root.render(
          <CanteraMapPopup
            cantera={c}
            onNavigate={(cantera) => {
              // Navigate to gestor de canteras selecting this cantera
              navigate('/coordinador/suelos/canteras', {
                state: {
                  canteraId: cantera.id,
                  selectedProjectId: cantera.proyecto_id
                }
              });
            }}
          />
        );

        marker.bindPopup(container, {
          minWidth: 300,
          maxWidth: 300,
          closeButton: false, // We can hide default close button if we want our own, or styling overrides it
          className: 'suelos-premium-popup'
        });

      }
    });

  }, [canterasData, map, forceUpdate, defaultZone]); // forceUpdate triggers redraw on toggle

  // --- NUEVA LÓGICA: DIBUJAR PROGRESIVAS DESDE DB ---
  useEffect(() => {
    if (!map) return;

    // console.log('[DEBUG SuelosMap] Checking progresivasData:', { ... });

    if (!progresivasData) return;

    // Use dynamic reference
    const progLayer = (useGlobalLayers && window.suelosProgresivasLayerGroup) ? window.suelosProgresivasLayerGroup : progresivasLayerRef.current;

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

            // Determine styles based on state
            const estado = (p.estado || 'pendiente').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const hasData = p.estratos_perfil && p.estratos_perfil.length > 0;
            const isApproved = estado.includes('aprobado') || estado.includes('completado');
            const isReview = estado.includes('revision');
            const isInactive = estado.includes('inactivo');

            let marker;
            let statusIconHtml = '';
            let statusClass = 'status-pending';
            let statusLabel = 'Pendiente';

            // VISUAL STYLING LOGIC
            if (isApproved) {
              // APROBADO: VERDE (Check)
              const icon = L.divIcon({
                className: 'suelos-verified-marker-icon',
                html: `<div class="suelos-verified-pin-body" style="animation: none;"><i class="fas fa-check"></i></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });
              marker = L.marker([latLon.latitude, latLon.longitude], {
                icon: icon,
                title: `${p.nombre || p.codigo} (Aprobado)`
              });
              statusIconHtml = `<i class="fas fa-check-circle"></i>`;
              statusClass = 'status-ok';
              statusLabel = 'Aprobado';

            } else if (isReview) {
              // EN REVISION: AMARILLO (Reloj/Ojo)
              const icon = L.divIcon({
                className: 'suelos-verified-marker-icon',
                html: `<div class="suelos-verified-pin-body" style="background-color: #f1c40f; border-color: #fff; animation: none;"><i class="fas fa-clock" style="color: white;"></i></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });
              marker = L.marker([latLon.latitude, latLon.longitude], {
                icon: icon,
                title: `${p.nombre || p.codigo} (En Revisión)`
              });
              statusIconHtml = `<i class="fas fa-clock"></i>`;
              statusClass = 'status-warning'; // Need to define or use inline style
              statusLabel = 'En Revisión';

            } else if (isInactive) {
              // INACTIVO: GRIS (Punto pequeño)
              const icon = L.divIcon({
                className: 'suelos-kml-ref-point',
                html: `<div style="width:10px;height:10px;background-color:#95a5a6;border-radius:50%;border:1.5px solid white;box-shadow:0 0 3px rgba(0,0,0,0.5);"></div>`,
                iconSize: [10, 10],
                iconAnchor: [5, 5]
              });
              marker = L.marker([latLon.latitude, latLon.longitude], {
                icon: icon,
                zIndexOffset: 0,
                title: `${p.nombre || p.codigo} (Inactivo)`
              });
              statusIconHtml = `<i class="fas fa-ban"></i>`;
              statusClass = 'status-inactive';
              statusLabel = 'Inactivo';

            } else {
              // PENDIENTE: AZUL (Punto medio)
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
                zIndexOffset: 800,
                title: `${p.nombre || p.codigo} (Pendiente)`
              });
              statusIconHtml = hasData ? `<i class="fas fa-file-alt"></i>` : `<i class="fas fa-hourglass-start"></i>`;
              statusClass = 'status-pending';
              statusLabel = hasData ? 'Pendiente (Con Datos)' : 'Pendiente';
            }

            // --- POPUP DINÁMICO CON FOTOS ---
            const popupNode = document.createElement('div');
            const root = createRoot(popupNode);

            root.render(
              <ProgresivaMapPopup
                progresiva={p}
                token={authToken}
                onNavigate={(prog) => {
                  navigate('/coordinador/suelos/gestion-tramos', {
                    state: {
                      openTramoId: prog.parent_id,
                      highlightProgresivaId: prog.id
                    }
                  });
                }}
              />
            );

            marker.bindPopup(popupNode, {
              minWidth: 300,
              maxWidth: 300,
              closeButton: false,
              className: 'suelos-premium-popup'
            });

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

      const currentIdsStr = JSON.stringify(effectiveKmlIds);
      const currentProgresivasDataStr = JSON.stringify(progresivasData || []);

      const prevIdsStr = JSON.stringify(prevKmlIdsRef.current);
      const prevDataStr = prevProgresivasDataStrRef.current;

      const idsChanged = currentIdsStr !== prevIdsStr;
      const dataChanged = currentProgresivasDataStr !== prevDataStr;

      // SI NADA CAMBIÓ, SALIR INMEDIATAMENTE.
      if (!idsChanged && !dataChanged) {
        return;
      }

      if (idsChanged) {
        prevKmlIdsRef.current = effectiveKmlIds;
        userInteractedRef.current = false;
        fittedBoundsRef.current.clear();
      }

      // Actualizamos la ref de datos
      prevProgresivasDataStrRef.current = currentProgresivasDataStr;

      displayLayersRef.current.clearLayers();
      if (!effectiveKmlIds || effectiveKmlIds.length === 0) {
        return;
      }

      let hasBounds = false;
      const combinedBounds = L.latLngBounds();

      // Creamos una clave única para este conjunto de IDs para controlar el fitBounds
      const boundsKey = effectiveKmlIds.join(',');

      // Prepare Progresivas Map
      const completedMetersMap = new Map();
      if (progresivasData) {
        progresivasData.forEach(p => {
          // Attempt to parse "nombre" (e.g. "0+100") or "codigo"
          const meters = parseToMeters(p.nombre || p.codigo);
          if (meters !== null && !isNaN(meters)) {
            completedMetersMap.set(meters, p);
          }
        });
      }

      for (const id of effectiveKmlIds) {
        if (!id) continue;

        let kmlText = kmlContentCacheRef.current.get(id);

        if (!kmlText) {
          try {
            // FIXED: Removed spaces in URL
            const response = await axiosInstance.get(`/api/kml-trazados/${id}/content`);
            const raw = response.data || {};
            // Handle different possible response structures
            kmlText = raw.kmlContent ?? raw.content ?? raw.kml ?? (typeof raw === 'string' ? raw : null);

            if (kmlText) {
              kmlContentCacheRef.current.set(id, kmlText);
            }
          } catch (e) {
            console.error("[SuelosMap] Error loading KML", id, e);
          }
        }

        if (kmlText) {
          const geojson = safeParseKmlToGeoJson(kmlText);

          if (isGeoJsonValid(geojson)) {
            try {
              // --- FILTERING LOGIC ---
              const isTrazadoStrick = trazadoSet.has(id);

              const layer = L.geoJSON(geojson, {
                style: (feature) => {
                  if (feature.geometry.type === 'Point') return {};
                  // FORCE RED LINE VISIBILITY
                  return { color: '#ff0000', weight: 8, opacity: 1.0, interactive: false };
                },
                pointToLayer: (feature, latlng) => {
                  if (hideKmlPoints) return null;
                  if (feature.geometry.type !== 'Point') return null;

                  let matchedProgresiva = null;
                  let kmlMeters = null;

                  if (feature.properties && feature.properties.name) {
                    kmlMeters = parseToMeters(feature.properties.name);
                    if (kmlMeters !== null) {
                      if (completedMetersMap.has(kmlMeters)) {
                        matchedProgresiva = completedMetersMap.get(kmlMeters);
                      }
                    }
                  }

                  const addToProgresivasLayer = (markerInstance) => {
                    const group = (useGlobalLayers && window.suelosProgresivasLayerGroup) ? window.suelosProgresivasLayerGroup : progresivasLayerRef.current;
                    if (group) markerInstance.addTo(group);
                  };

                  if (matchedProgresiva && matchedProgresiva.coordenada_este && matchedProgresiva.coordenada_norte) {
                    // Match found AND DB has coords -> Let DB layer handle it.
                    return null;
                  }

                  let marker;
                  let zIndex = -500;

                  if (matchedProgresiva) {
                    // Match found but NO DB coords -> Use KML coords + Premium Popup
                    const hasData = matchedProgresiva.estratos_perfil && matchedProgresiva.estratos_perfil.length > 0;
                    zIndex = 800;
                    let icon;

                    if (hasData) {
                      icon = L.divIcon({
                        className: 'suelos-verified-marker-icon',
                        html: `<div class="suelos-verified-pin-body"><i class="fas fa-check"></i></div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                      });
                    } else {
                      icon = L.divIcon({
                        className: '',
                        html: `<div style="width:12px;height:12px;background-color:#3498db;border:2px solid white;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [12, 12],
                        iconAnchor: [6, 6]
                      });
                    }

                    // Calculate UTM from KML LatLon for display
                    const kmlUtm = fromLatLon(latlng.lat, latlng.lng);
                    const progWithCoords = {
                      ...matchedProgresiva,
                      coordenada_este: kmlUtm.easting,
                      coordenada_norte: kmlUtm.northing
                    };

                    const popupNode = document.createElement('div');
                    const root = createRoot(popupNode);

                    root.render(
                      <ProgresivaMapPopup
                        progresiva={progWithCoords}
                        token={authToken}
                        onNavigate={(prog) => {
                          navigate('/coordinador/suelos/gestion-tramos', {
                            state: {
                              openTramoId: prog.parent_id,
                              highlightProgresivaId: prog.id
                            }
                          });
                        }}
                      />
                    );

                    marker = L.marker(latlng, { icon, zIndexOffset: zIndex });
                    marker.bindPopup(popupNode, {
                      minWidth: 300,
                      maxWidth: 300,
                      closeButton: false,
                      className: 'suelos-premium-popup'
                    });

                    marker.on('click', () => {
                      if (onMapClick) onMapClick({ type: 'progresiva', data: matchedProgresiva });
                    });

                  } else {
                    // No Match in DB
                    if (isTrazadoStrick) {
                      return null;
                    }
                    // Permissive mode: Grey point
                    zIndex = 0;
                    const icon = L.divIcon({
                      className: 'suelos-kml-ref-point',
                      html: `<div style="width:10px;height:10px;background-color:#6c757d;border-radius:50%;border:1.5px solid white;box-shadow:0 0 3px rgba(0,0,0,0.5);"></div>`,
                      iconSize: [10, 10],
                      iconAnchor: [5, 5]
                    });

                    const popupHtml = `
                      <div style="font-family:sans-serif;font-size:13px;color:#333;padding:5px;">
                          <b>${feature.properties?.name || 'Punto KML'}</b><br/>
                          <span style="color:#6c757d; font-weight:bold;">Referencia Visual (Sin Reg. DB)</span>
                      </div>`;

                    marker = L.marker(latlng, {
                      icon: icon, zIndexOffset: zIndex
                    }).bindPopup(popupHtml);
                  }

                  if (marker) addToProgresivasLayer(marker);
                  return null;
                },
                onEachFeature: null
              });

              displayLayersRef.current.addLayer(layer);

              const b = layer.getBounds();
              if (b.isValid()) {
                const center = b.getCenter();
                // SANITY CHECK: Ignore bounds near 0,0 (Null Island)
                if (Math.abs(center.lat) > 0.1 && Math.abs(center.lng) > 0.1) {
                  combinedBounds.extend(b);
                  hasBounds = true;
                }
              }
            } catch (e) {
              console.error("[SuelosMap] Error processing KML geojson", id, e);
            }
          }
        }
      }

      if (hasBounds && !userInteractedRef.current && combinedBounds.isValid()) {
        if (!fittedBoundsRef.current.has(boundsKey)) {
          setTimeout(() => {
            if (isMounted.current && map) {
              map.fitBounds(combinedBounds, { padding: [50, 50], maxZoom: 16, animate: true });
            }
          }, 100);
          fittedBoundsRef.current.add(boundsKey);
        }
      }
    };

    loadTramos();
  }, [effectiveKmlIds, progresivasData, map, hideKmlPoints, onMapClick, defaultZone, trazadoIds, puntosIds, useGlobalLayers]);

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
        const tooltipHtml = `<div class="suelos-map-tooltip-image-container"><img src="${imgUrl}" class="suelos-map-tooltip-image"/></div>`;
        marker.bindTooltip(tooltipHtml, { permanent: false, direction: 'top', className: 'custom-img-tooltip' });
      } else if (cantera && cantera.nombre) {
        marker.bindTooltip(cantera.nombre);
      }

      marker.addTo(markerLayerRef.current);
    }
  }, [markerPosition, cantera, map]);

  return null;
}; // End MapLogic

// Helper component to capture ref and expose it globally for MapLogic to use
const FeatureGroupWithRef = ({ globalKey }) => {
  const map = useMap(); // Helper needs map context if using standard addTo, but here using refs
  // Actually FeatureGroup doesn't need map context if we just assign ref to window.
  // But to be safe and standard:
  const groupRef = useRef(null);

  useEffect(() => {
    if (groupRef.current) {
      window[globalKey] = groupRef.current;
      // Auto add to map via parent LayersControl management usually
      // But we dispatch event just in case logic needs it
      window.dispatchEvent(new CustomEvent('suelosLayerRefreshed', { detail: globalKey }));
    }
  }, [globalKey]);

  return <FeatureGroup ref={groupRef} />;
};

// --- Componente Principal (Wrapper del Mapa) ---
const SuelosMap = (props) => {
  const [showLayersControl, setShowLayersControl] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // If explicitly 'modal' or 'modal-canteras', hide controls by default or specific rule
    if (props.layerContext === 'modal-canteras' || props.layerContext === 'modal') {
      setShowLayersControl(false);
    } else {
      setShowLayersControl(true);
    }
  }, [props.layerContext]);

  return (
    <div className={`suelos-map-wrapper ${props.className || ''}`} style={props.style}>
      <MapContainer
        center={[-12.930, -72.630]} // Centro aprox Quillabamba
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true} // Enabled native zoom (topleft)
      >
        {!showLayersControl && (
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        )}

        {showLayersControl && (
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Estándar">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>

            <LayersControl.Overlay checked name="Progresivas">
              <FeatureGroupWithRef globalKey="suelosProgresivasLayerGroup" />
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Canteras">
              <FeatureGroupWithRef globalKey="suelosCanterasLayerGroup" />
            </LayersControl.Overlay>
          </LayersControl>
        )}

        <MapLogic {...props} authToken={user?.token} />
      </MapContainer>
    </div>
  );
};

export default SuelosMap;
