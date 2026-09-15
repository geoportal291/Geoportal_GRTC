import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap, FeatureGroup, ZoomControl } from 'react-leaflet';
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
import FuenteMapPopup from './FuenteMapPopup';
import { useAuth } from '../../../../data/contexts/AuthContext';
import MapControls from './MapControls';

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

// --- Helper de estilo visual unificado por estado de progresiva (PARTE 1) ---
// Puro (sin hooks de React): lo reutilizan la Ruta BD (progresivasData) y la Ruta KML (pointToLayer).
// Los puntos con datos son círculos RELLENOS y sólidos (no blancos con borde) para
// distinguirse claramente al alejar el mapa.
const getProgresivaVisual = (p) => {
  // Normalización idéntica al sidebar de DashboardSuelos (minúsculas + sin acentos)
  const estado = (p.estado || 'pendiente').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hasData = Array.isArray(p.estratos_perfil) && p.estratos_perfil.length > 0;

  // APROBADO / COMPLETADO: círculo verde sólido 18px + check blanco
  if (estado.includes('aprobado') || estado.includes('completado')) {
    const iconHtml = `<div class="suelos-prog-dot" style="width:18px;height:18px;background-color:#27ae60;border:2.5px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.45);"><i class="fas fa-check" style="font-size:9px;"></i></div>`;
    return {
      icon: L.divIcon({ className: 'suelos-prog-dot-wrapper', html: iconHtml, iconSize: [18, 18], iconAnchor: [9, 9] }),
      titleSuffix: 'Aprobado',
      statusClass: 'status-ok',
      statusLabel: 'Aprobado',
      iconHtml,
      hasData: true,
      zIndexOffset: 800
    };
  }

  // EN REVISIÓN: círculo amarillo sólido 18px + reloj blanco
  if (estado.includes('revision')) {
    const iconHtml = `<div class="suelos-prog-dot" style="width:18px;height:18px;background-color:#f1c40f;border:2.5px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.45);"><i class="fas fa-clock" style="font-size:9px;"></i></div>`;
    return {
      icon: L.divIcon({ className: 'suelos-prog-dot-wrapper', html: iconHtml, iconSize: [18, 18], iconAnchor: [9, 9] }),
      titleSuffix: 'En Revisión',
      statusClass: 'status-warning',
      statusLabel: 'En Revisión',
      iconHtml,
      hasData: true,
      zIndexOffset: 800
    };
  }

  // INACTIVO: punto gris 10px (discreto)
  if (estado.includes('inactivo')) {
    const iconHtml = `<div class="suelos-prog-dot" style="width:10px;height:10px;background-color:#95a5a6;opacity:0.7;border:1.5px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.35);"></div>`;
    return {
      icon: L.divIcon({ className: 'suelos-prog-dot-wrapper', html: iconHtml, iconSize: [10, 10], iconAnchor: [5, 5] }),
      titleSuffix: 'Inactivo',
      statusClass: 'status-inactive',
      statusLabel: 'Inactivo',
      iconHtml,
      hasData,
      zIndexOffset: 0
    };
  }

  // PENDIENTE CON DATOS: círculo azul sólido 16px + documento blanco
  if (hasData) {
    const iconHtml = `<div class="suelos-prog-dot" style="width:16px;height:16px;background-color:#3498db;border:2px solid #ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"><i class="fas fa-file-alt" style="font-size:8px;"></i></div>`;
    return {
      icon: L.divIcon({ className: 'suelos-prog-dot-wrapper', html: iconHtml, iconSize: [16, 16], iconAnchor: [8, 8] }),
      titleSuffix: 'Pendiente (Con Datos)',
      statusClass: 'status-pending',
      statusLabel: 'Pendiente (Con Datos)',
      iconHtml,
      hasData: true,
      zIndexOffset: 800
    };
  }

  // SIN DATOS (visual/referencia): punto gris claro 8px (mínimo, no domina)
  const iconHtml = `<div class="suelos-prog-dot" style="width:8px;height:8px;background-color:#b2babb;opacity:0.65;border:1px solid #ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.3);"></div>`;
  return {
    icon: L.divIcon({ className: 'suelos-prog-dot-wrapper', html: iconHtml, iconSize: [8, 8], iconAnchor: [4, 4] }),
    titleSuffix: 'Sin Datos',
    statusClass: 'status-inactive',
    statusLabel: 'Sin Datos',
    iconHtml,
    hasData: false,
    zIndexOffset: 0
  };
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
  fuentesData,     // DATA DE FUENTES (Dashboard/Gestor)
  onMapReady,

  onMapClick,

  defaultZone, // NEW PROP
  layerContext, // NEW: 'dashboard' (default) or any unique string like 'modal-canteras'
  hideKmlPoints, // NEW: If true, ignore points from KML (only show lines/polygons)
  hideToolbar, // NEW: If true, hide measurement/draw toolbar
  isSelecting, // NEW: If true, change cursor to crosshair
  authToken, // NEW: User token for image fetching
  transientGeoJson, // NUEVO: GeoJSON temporal (ej. subido en form)
  isExternalView, // NUEVO: Determina si es vista externa premium

  // NUEVO: Refs pasadas por el padre
  displayLayersRef,
  drawnItemsRef,
  measurementLayersRef,
  persistentMeasurementLayersRef,
  markerLayerRef,
  progresivasLayerRef,
  activeCanterasLayerRef,
  activeFuentesLayerRef,
}) => {
  const map = useMap();
  const navigate = useNavigate();
  
  // Capa para el GeoJSON temporal
  const transientLayerRef = useRef(new L.FeatureGroup());

  // FIX 1: Inicializar capas
  useEffect(() => {
    if (!map) return;
    transientLayerRef.current.addTo(map);
  }, [map]);

  // FIX 2: Renderizar GeoJSON temporal
  useEffect(() => {
    if (!map || !transientLayerRef.current) return;
    transientLayerRef.current.clearLayers();
    if (transientGeoJson) {
      try {
        const layer = L.geoJSON(transientGeoJson, {
           style: { color: '#2ecc71', weight: 4, dashArray: '5, 5' }
        });
        transientLayerRef.current.addLayer(layer);
        if (layer.getBounds().isValid()) {
           map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        }
      } catch (e) {
        console.error("Error rendering transientGeoJson", e);
      }
    }
  }, [map, transientGeoJson]);

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

  // LOGIC: Use global ref from LayersControl if available AND we are in the main dashboard context.
  // If we are in a modal (layerContext != undefined), we should use a local ref or a specific modal global ref.

  // Helper to determine if we should use the main global layers
  const useGlobalLayers = !layerContext || layerContext === 'dashboard';

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
      if (e.detail === 'suelosProgresivasLayerGroup' || e.detail === 'suelosCanterasLayerGroup' || e.detail === 'suelosFuentesLayerGroup') {
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
    persistentMeasurementLayersRef.current.addTo(map); // NEW
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
    if (!useGlobalLayers || !window.suelosFuentesLayerGroup) {
      activeFuentesLayerRef.current.addTo(map);
    }

  }, [map, onMapReady]); // Fin Init Effect

  // --- COORDENADAS EN PANTALLA REACTIVAS ---
  useEffect(() => {
    if (!map) return;

    let coordContainer = map.getContainer().querySelector('.leaflet-control-coordinates');
    if (!coordContainer) {
      coordContainer = L.DomUtil.create('div', 'leaflet-control-coordinates', map.getContainer());
      
      map.on('mousemove', (e) => {
        coordContainer.style.display = 'block';
        coordContainer.innerHTML = `Lat: ${e.latlng.lat.toFixed(5)}, Lon: ${e.latlng.lng.toFixed(5)}`;
      });
      map.on('mouseout', () => { coordContainer.style.display = 'none'; });
    }

    // Estilo coords - Esquina Inferior Izquierda o Centro Inferior según la vista
    Object.assign(coordContainer.style, {
      position: 'absolute',
      bottom: isExternalView ? '25px' : '37px', // Mismo bottom de los botones en la vista externa
      left: isExternalView ? '50%' : '140px',
      right: 'auto',
      transform: isExternalView ? 'translateX(-50%)' : 'none',
      backgroundColor: 'rgba(15, 23, 42, 0.9)', // Fondo oscuro elegante a juego
      color: 'white',
      padding: '5px 15px',
      borderRadius: '20px',
      fontSize: '13px',
      fontFamily: 'monospace',
      display: 'none',
      zIndex: 2000,
      whiteSpace: 'nowrap',
      border: '1px solid #334155', // Bordes sutiles
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      pointerEvents: 'none' // Click through
    });
  }, [map, isExternalView]);

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

        // Tooltip Permanente Consistente
        marker.bindTooltip(`<b>${c.nombre_cantera || c.nombre || 'Cantera'}</b>`, {
          permanent: false,
          direction: 'right',
          className: 'geol-kmz-tooltip-label',
          offset: [15, 0]
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
          minWidth: 225,
          maxWidth: 225,
          closeButton: false, // We can hide default close button if we want our own, or styling overrides it
          className: 'suelos-premium-popup'
        });

      }
    });

  }, [canterasData, map, forceUpdate, defaultZone]); // forceUpdate triggers redraw on toggle

  // --- NUEVA LÓGICA: DIBUJAR FUENTES DE AGUA ---
  useEffect(() => {
    if (!map) return;

    const layer = (useGlobalLayers && window.suelosFuentesLayerGroup) ? window.suelosFuentesLayerGroup : activeFuentesLayerRef.current;

    if (layer) layer.clearLayers();

    if (!fuentesData || fuentesData.length === 0) return;

    fuentesData.forEach(f => {
      let lat, lon;

      if (f.latitud && f.longitud) {
        lat = parseFloat(f.latitud);
        lon = parseFloat(f.longitud);
      } else if (f.coordenada_este && f.coordenada_norte && (f.lado || defaultZone)) {
        try {
          const z = f.lado || defaultZone || '18L';
          const zNum = parseInt(z.replace(/[A-Za-z]/g, ''));
          const zLet = z.replace(/[0-9]/g, '') || 'L';
          const res = toLatLon(parseFloat(f.coordenada_este), parseFloat(f.coordenada_norte), zNum, zLet);
          lat = res.latitude;
          lon = res.longitude;
        } catch (e) {
          console.warn('Invalid coords fallback for fuente:', f.nombre, e);
          return;
        }
      }

      if (lat && lon) {
        const icon = L.divIcon({
          className: 'suelos-fuente-marker-icon',
          html: `<div style="
                  background-color: #0d47a1;
                  color: white;
                  width: 30px; height: 30px;
                  border-radius: 50%;
                  display: flex; align-items: center; justify-content: center;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                  border: 2px solid white;
                "><i class="fas fa-tint"></i></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lon], {
          icon: icon,
          title: f.nombre || 'Fuente de Agua'
        });

        marker.bindTooltip(`<b>${f.nombre || 'Fuente de Agua'}</b>`, {
          permanent: false,
          direction: 'right',
          className: 'geol-kmz-tooltip-label',
          offset: [15, 0]
        });

        if (layer) marker.addTo(layer);

        const container = document.createElement('div');
        const root = createRoot(container);

        root.render(
          <FuenteMapPopup
            fuenteAgua={f}
            onNavigate={(fuente) => {
              navigate('/coordinador/suelos/gestor-fuentes', {
                state: {
                  fuenteId: fuente.id,
                  selectedProjectId: fuente.proyecto_id
                }
              });
            }}
          />
        );

        marker.bindPopup(container, {
          minWidth: 225,
          maxWidth: 225,
          closeButton: false,
          className: 'suelos-premium-popup'
        });
      }
    });

  }, [fuentesData, map, forceUpdate, defaultZone]);

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

            // Estilo visual unificado por estado (helper compartido con la Ruta KML)
            const visual = getProgresivaVisual(p);

            const marker = L.marker([latLon.latitude, latLon.longitude], {
              icon: visual.icon,
              zIndexOffset: visual.zIndexOffset,
              title: `${p.nombre || p.codigo} (${visual.statusLabel})`
            });

            // --- TOOLTIP PERMANENTE PROGRESIVAS ---
            marker.bindTooltip(`<b>${p.nombre || p.codigo}</b>`, {
              permanent: false,
              direction: 'right',
              className: 'geol-kmz-tooltip-label',
              offset: [15, 0]
            });

            // --- POPUP DINÁMICO CON FOTOS ---
            const popupNode = document.createElement('div');
            // Wait, we used root for cantera, let's use createRoot for Progresiva too
            const rootProg = createRoot(popupNode);

            rootProg.render(
              <ProgresivaMapPopup
                progresiva={p}
                token={authToken}
                onNavigate={(prog) => {
                  // FIX: ruta correcta del gestor de tramos (misma lógica que el botón
                  // "Ver Estudio y Estratos" de DashboardSuelos). La ruta anterior
                  // '/coordinador/suelos/gestion-tramos' no existe en el enrutador.
                  navigate('/coordinador/recoleccion-datos/gestor-tramos', {
                    state: {
                      activeProgresivaId: prog.id,
                      openTramoId: prog.parent_id || prog.progresiva_padre_id || prog.id,
                      initialViewMode: 'estratos'
                    }
                  });
                }}
              />
            );

            marker.bindPopup(popupNode, {
              minWidth: 225,
              maxWidth: 225,
              closeButton: false,
              className: 'suelos-premium-popup'
            });

            // Lógica de "Hover Bridge" para abrir popup interactivo al hacer hover
            marker.on('mouseover', function () {
              if (marker._closePopupTimeout) {
                clearTimeout(marker._closePopupTimeout);
              }
              marker.openPopup();
            });

            marker.on('mouseout', function () {
              marker._closePopupTimeout = setTimeout(() => {
                marker.closePopup();
              }, 300); // 300ms de puente para trasladar el cursor al popup
            });

            marker.on('popupopen', function (e) {
              const popupElement = e.popup.getElement();
              if (popupElement) {
                // Cancelar cierre si el cursor entra al popup
                popupElement.addEventListener('mouseenter', () => {
                  if (marker._closePopupTimeout) {
                    clearTimeout(marker._closePopupTimeout);
                  }
                });
                // Iniciar temporizador de cierre al salir del popup
                popupElement.addEventListener('mouseleave', () => {
                  marker._closePopupTimeout = setTimeout(() => {
                    marker.closePopup();
                  }, 300);
                });
              }
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
        // ...
      }
    });

    if (!userInteractedRef.current && addedCount > 0 && progLayer) {
      // ... 
    }

    return () => {
      if (progLayer) progLayer.clearLayers();
    };
  }, [progresivasData, map, defaultZone, forceUpdate]);

  // --- 4. Carga reactiva de KMLs (Tramos) ---
  const prevKmlIdsRef = useRef(null);
  const prevProgresivasDataStrRef = useRef('');
  const fittedBoundsRef = useRef(new Set());
  const kmlContentCacheRef = useRef(new Map());

  useEffect(() => {
    const loadTramos = async () => {
      const currentIdsStr = JSON.stringify(effectiveKmlIds);
      const currentProgresivasDataStr = JSON.stringify(progresivasData || []);
      const prevIdsStr = JSON.stringify(prevKmlIdsRef.current);
      const prevDataStr = prevProgresivasDataStrRef.current;
      const idsChanged = currentIdsStr !== prevIdsStr;
      const dataChanged = currentProgresivasDataStr !== prevDataStr;

      if (!idsChanged && !dataChanged) return;

      if (idsChanged) {
        prevKmlIdsRef.current = effectiveKmlIds;
        userInteractedRef.current = false;
        fittedBoundsRef.current.clear();
      }
      prevProgresivasDataStrRef.current = currentProgresivasDataStr;
      displayLayersRef.current.clearLayers();
      if (!effectiveKmlIds || effectiveKmlIds.length === 0) return;

      let hasBounds = false;
      const combinedBounds = L.latLngBounds();
      const boundsKey = effectiveKmlIds.join(',');

      const completedMetersMap = new Map();
      if (progresivasData) {
        progresivasData.forEach(p => {
          // Emparejar por nombre Y por código (ambos si existen), sin sobrescribir
          // una entrada ya válida con null.
          [parseToMeters(p.nombre), parseToMeters(p.codigo)].forEach(meters => {
            if (meters !== null && !isNaN(meters) && !completedMetersMap.has(meters)) {
              completedMetersMap.set(meters, p);
            }
          });
        });
      }

      // PARTE 4: Acumulador para el resumen de archivos KML cargados
      const kmlSummaries = [];

      for (const id of effectiveKmlIds) {
        if (!id) continue;
        let kmlText = kmlContentCacheRef.current.get(id);

        if (!kmlText) {
          try {
            const response = await axiosInstance.get(`/api/kml-trazados/${id}/content`);
            const raw = response.data || {};
            kmlText = raw.kmlContent ?? raw.content ?? raw.kml ?? (typeof raw === 'string' ? raw : null);
            if (kmlText) kmlContentCacheRef.current.set(id, kmlText);
          } catch (e) {
            console.error("[SuelosMap] Error loading KML", id, e);
          }
        }

        if (kmlText) {
          const geojson = safeParseKmlToGeoJson(kmlText);

          // --- PARTE 4: LOG DE IDENTIFICACIÓN DEL ARCHIVO KML ---
          // Extrae el <name> del documento KML para saber qué archivo es
          // (progresivas cada 100 m vs cada 500 m) y estima su intervalo.
          const docNameMatch = kmlText.match(/<name>([^<]+)<\/name>/i);
          const docName = docNameMatch ? docNameMatch[1].trim() : '(sin nombre)';
          const typeCounts = {};
          const metersList = [];
          if (geojson && Array.isArray(geojson.features)) {
            geojson.features.forEach(f => {
              const t = f.geometry ? f.geometry.type : 'sin-geometria';
              typeCounts[t] = (typeCounts[t] || 0) + 1;
              if (t === 'Point') {
                const m = parseToMeters(f.properties?.name);
                if (m !== null && !isNaN(m)) metersList.push(m);
              }
            });
          }
          const uniqueSortedMeters = [...new Set(metersList)].sort((a, b) => a - b);
          let intervalo = null;
          if (uniqueSortedMeters.length > 1) {
            const diffs = [];
            for (let i = 1; i < uniqueSortedMeters.length; i++) diffs.push(uniqueSortedMeters[i] - uniqueSortedMeters[i - 1]);
            diffs.sort((a, b) => a - b);
            const mid = Math.floor(diffs.length / 2);
            intervalo = diffs.length % 2 === 0 ? Math.round((diffs[mid - 1] + diffs[mid]) / 2) : diffs[mid];
          }
          console.log('[SuelosMap][KML] Cargado id=%s | archivo/documento="%s" | puntos=%d | líneas=%d | intervalo≈%sm', id, docName, typeCounts['Point'] || 0, (typeCounts['LineString'] || 0) + (typeCounts['MultiLineString'] || 0), intervalo !== null ? intervalo : 'n/d');
          kmlSummaries.push({
            id,
            documento: docName,
            tipos: typeCounts,
            puntos: typeCounts['Point'] || 0,
            lineas: (typeCounts['LineString'] || 0) + (typeCounts['MultiLineString'] || 0),
            intervaloMetros: intervalo
          });

          if (isGeoJsonValid(geojson)) {
            try {
              const isTrazadoStrick = trazadoSet.has(id);
              const layer = L.geoJSON(geojson, {
                style: (feature) => {
                  if (feature.geometry.type === 'Point') return {};
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
                      if (completedMetersMap.has(kmlMeters)) matchedProgresiva = completedMetersMap.get(kmlMeters);
                    }
                  }

                  const addToProgresivasLayer = (markerInstance) => {
                    const group = (useGlobalLayers && window.suelosProgresivasLayerGroup) ? window.suelosProgresivasLayerGroup : progresivasLayerRef.current;
                    if (group) markerInstance.addTo(group);
                  };

                  if (matchedProgresiva && matchedProgresiva.coordenada_este && matchedProgresiva.coordenada_norte) return null;

                  let marker;
                  let zIndex = -500;

                  if (matchedProgresiva) {
                    // Icono unificado según el estado de la progresiva emparejada (helper compartido)
                    zIndex = 800;
                    const icon = getProgresivaVisual(matchedProgresiva).icon;

                    const kmlUtm = fromLatLon(latlng.lat, latlng.lng);
                    const progWithCoords = { ...matchedProgresiva, coordenada_este: kmlUtm.easting, coordenada_norte: kmlUtm.northing };
                    const popupNode = document.createElement('div');
                    const rootProgKml = createRoot(popupNode);

                    rootProgKml.render(
                      <ProgresivaMapPopup
                        progresiva={progWithCoords} token={authToken}
                        onNavigate={(prog) => {
                          // FIX: ruta correcta del gestor de tramos (misma lógica que el dashboard).
                          // progWithCoords conserva id/parent_id/progresiva_padre_id tras el spread de coords KML.
                          navigate('/coordinador/recoleccion-datos/gestor-tramos', {
                            state: {
                              activeProgresivaId: prog.id,
                              openTramoId: prog.parent_id || prog.progresiva_padre_id || prog.id,
                              initialViewMode: 'estratos'
                            }
                          });
                        }}
                      />
                    );

                    marker = L.marker(latlng, { icon, zIndexOffset: zIndex });
                    marker.bindPopup(popupNode, { minWidth: 225, maxWidth: 225, closeButton: false, className: 'suelos-premium-popup' });

                    // Lógica de "Hover Bridge" para abrir popup interactivo al hacer hover (KML)
                    marker.on('mouseover', function () {
                      if (marker._closePopupTimeout) {
                        clearTimeout(marker._closePopupTimeout);
                      }
                      marker.openPopup();
                    });

                    marker.on('mouseout', function () {
                      marker._closePopupTimeout = setTimeout(() => {
                        marker.closePopup();
                      }, 300); // 300ms de puente para trasladar el cursor al popup
                    });

                    marker.on('popupopen', function (e) {
                      const popupElement = e.popup.getElement();
                      if (popupElement) {
                        // Cancelar cierre si el cursor entra al popup
                        popupElement.addEventListener('mouseenter', () => {
                          if (marker._closePopupTimeout) {
                            clearTimeout(marker._closePopupTimeout);
                          }
                        });
                        // Iniciar temporizador de cierre al salir del popup
                        popupElement.addEventListener('mouseleave', () => {
                          marker._closePopupTimeout = setTimeout(() => {
                            marker.closePopup();
                          }, 300);
                        });
                      }
                    });

                    // Tooltip Permanente para Progresivas del KML (Mismatch coords)
                    marker.bindTooltip(`<b>${progWithCoords.nombre || progWithCoords.codigo}</b>`, {
                      permanent: false, direction: 'right', className: 'geol-kmz-tooltip-label', offset: [15, 0]
                    });

                    marker.on('click', () => { if (onMapClick) onMapClick({ type: 'progresiva', data: matchedProgresiva }); });
                  } else {
                    if (isTrazadoStrick) return null;

                    // EXTRAER COLOR NATIVO KMZ O FALLBACK GRIS
                    // PARTE 1d: punto de referencia SUTIL (9px, translúcido, sin halo negro)
                    // para que no domine el mapa frente a las progresivas con estado.
                    const mkColor = feature.properties['marker-color'] || feature.properties.fill || '#95a5a6';
                    zIndex = 0;
                    const icon = L.divIcon({
                      className: 'suelos-kml-ref-point',
                      html: `<div style="width:9px;height:9px;background-color:${mkColor};opacity:0.75;border-radius:50%;border:1px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.35);"></div>`,
                      iconSize: [9, 9],
                      iconAnchor: [4.5, 4.5]
                    });

                    const popupHtml = `<div style="font-family:sans-serif;font-size:13px;color:#333;padding:5px;"><b>${feature.properties?.name || 'Punto KML'}</b><br/><span style="color:#6c757d; font-weight:bold;">Referencia KMZ Original</span></div>`;

                    marker = L.marker(latlng, { icon: icon, zIndexOffset: zIndex }).bindPopup(popupHtml);

                    if (feature.properties?.name) {
                      marker.bindTooltip(`<b>${feature.properties.name}</b>`, {
                        permanent: false, direction: 'right', className: 'geol-kmz-tooltip-label', offset: [10, 0]
                      });
                    }
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

      // --- PARTE 4: Resumen final de todos los KML cargados (identificar cuál es 100 m y cuál 500 m) ---
      console.log('[SuelosMap][KML] Resumen de archivos KML cargados:', kmlSummaries);

      if (hasBounds && !userInteractedRef.current && combinedBounds.isValid()) {
        if (!fittedBoundsRef.current.has(boundsKey)) {
          setTimeout(() => {
            if (isMounted.current && map) {
              map.fitBounds(combinedBounds, { padding: [50, 50], maxZoom: 16, animate: false });
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
  const mapRef = useRef(null);

  // Referencias a capas - Definidas aquí para compartirlas entre MapLogic y MapControls
  const displayLayersRef = useRef(new L.FeatureGroup());
  const drawnItemsRef = useRef(new L.FeatureGroup());
  const measurementLayersRef = useRef(new L.FeatureGroup());
  const persistentMeasurementLayersRef = useRef(new L.FeatureGroup());
  const markerLayerRef = useRef(new L.FeatureGroup());
  
  // Capas reactivas (Globales o locales)
  const useGlobalLayers = !props.layerContext || props.layerContext === 'dashboard';
  const progresivasLayerRef = useRef(
    (useGlobalLayers && window.suelosProgresivasLayerGroup) ? window.suelosProgresivasLayerGroup : new L.FeatureGroup()
  );
  const activeCanterasLayerRef = useRef(
    (useGlobalLayers && window.suelosCanterasLayerGroup) ? window.suelosCanterasLayerGroup : new L.FeatureGroup()
  );
  const activeFuentesLayerRef = useRef(
    (useGlobalLayers && window.suelosFuentesLayerGroup) ? window.suelosFuentesLayerGroup : new L.FeatureGroup()
  );

  useEffect(() => {
    // If explicitly 'modal' or 'modal-canteras', hide controls by default or specific rule
    if (props.layerContext === 'modal-canteras' || props.layerContext === 'modal') {
      setShowLayersControl(false);
    } else {
      setShowLayersControl(true);
    }
  }, [props.layerContext]);

  return (
    <div className={`suelos-map-wrapper ${props.className || ''} ${props.isExternalView ? 'external-view-active' : ''} ${props.isSidebarOpen && props.isExternalView ? 'sidebar-open-shift' : ''}`} style={props.style}>
      <MapContainer
        center={[-12.930, -72.630]} // Centro aprox Quillabamba
        zoom={13}
        minZoom={10} // PARTE 2a: evitar alejar hasta vistas continentales de resolución pésima
        maxZoom={21}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Desactivar permanentemente el zoom nativo no-reactivo de Leaflet
        attributionControl={false} // AJUSTE: sin franja blanca de atribución inferior (los TileLayers conservan su prop attribution)
        ref={mapRef}
      >
        {!props.isExternalView ? (
          <ZoomControl position="topleft" />
        ) : (
          <ZoomControl position="bottomright" />
        )}
        {!showLayersControl && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxNativeZoom={16}
            maxZoom={21}
            attribution="Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          />
        )}
        {!showLayersControl && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxZoom={21}
            attribution="Tiles &copy; Esri — Source: Esri, DeLorme, USGS, NGA, EPA"
          />
        )}

        {showLayersControl && (
          <LayersControl position="topright">
            <LayersControl.BaseLayer name="Estándar">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxNativeZoom={19}
                maxZoom={21}
                attribution="&copy; OpenStreetMap contributors"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="Satélite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxNativeZoom={16}
                maxZoom={21}
                attribution="Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Topográfico">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                maxNativeZoom={16}
                maxZoom={21}
                attribution="&copy; OpenStreetMap contributors, SRTM | style: &copy; OpenTopoMap (CC-BY-SA)"
              />
            </LayersControl.BaseLayer>

            {/* PARTE 2c: capa de referencia con nombres de lugares (modo híbrido) */}
            <LayersControl.Overlay checked name="Referencias (Híbrido)">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={21}
                attribution="Tiles &copy; Esri — Source: Esri, DeLorme, USGS, NGA, EPA"
              />
            </LayersControl.Overlay>

            <LayersControl.Overlay checked name="Progresivas">
              <FeatureGroupWithRef globalKey="suelosProgresivasLayerGroup" />
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Canteras">
              <FeatureGroupWithRef globalKey="suelosCanterasLayerGroup" />
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Fuentes de Agua">
              <FeatureGroupWithRef globalKey="suelosFuentesLayerGroup" />
            </LayersControl.Overlay>
          </LayersControl>
        )}

        <MapLogic 
          {...props} 
          authToken={user?.token}
          displayLayersRef={displayLayersRef}
          drawnItemsRef={drawnItemsRef}
          measurementLayersRef={measurementLayersRef}
          persistentMeasurementLayersRef={persistentMeasurementLayersRef}
          markerLayerRef={markerLayerRef}
          progresivasLayerRef={progresivasLayerRef}
          activeCanterasLayerRef={activeCanterasLayerRef}
          activeFuentesLayerRef={activeFuentesLayerRef}
        />

        {/* --- NUEVO: Capturar comandos externos de Zoom/Foco --- */}
        <MapResizer centerTo={props.centerTo} />

        {/* CONTROLES MODERNOS INTEGRADOS */}
        {!props.hideToolbar && (
          <MapControlsWrapper 
            displayMode={props.displayMode || 'full'}
            displayLayersRef={displayLayersRef}
            measurementLayersRef={measurementLayersRef}
            persistentMeasurementLayersRef={persistentMeasurementLayersRef}
          />
        )}
      </MapContainer>

      {/* PARTE 3: Leyenda de avance (solo dashboard; ocultable con hideLegend) */}
      {showLayersControl && !props.hideLegend && (
        <div className="suelos-map-legend">
          <div className="suelos-map-legend-title">Avance de Ensayos</div>
          <div className="suelos-map-legend-item"><span className="suelos-map-legend-dot" style={{ backgroundColor: '#27ae60' }}></span>Aprobado</div>
          <div className="suelos-map-legend-item"><span className="suelos-map-legend-dot" style={{ backgroundColor: '#f1c40f' }}></span>En Revisión</div>
          <div className="suelos-map-legend-item"><span className="suelos-map-legend-dot" style={{ backgroundColor: '#3498db' }}></span>Con Datos</div>
          <div className="suelos-map-legend-item"><span className="suelos-map-legend-dot" style={{ backgroundColor: '#b2babb' }}></span>Sin Datos</div>
          <div className="suelos-map-legend-item"><span className="suelos-map-legend-dot suelos-map-legend-dot-ref"></span>Referencia KML</div>
        </div>
      )}
    </div>
  );
};

// Pequeño wrapper para obtener el contexto del mapa y pasarlo a MapControls
const MapControlsWrapper = ({ displayMode, displayLayersRef, measurementLayersRef, persistentMeasurementLayersRef }) => {
  const map = useMap();
  return (
    <MapControls 
      displayMode={displayMode}
      map={map}
      displayLayers={displayLayersRef.current}
      measurementLayers={measurementLayersRef.current}
      persistentMeasurementLayers={persistentMeasurementLayersRef.current}
    />
  );
};

// Componente helper para manejar zoom desde props reactivas
const MapResizer = ({ centerTo }) => {
  const map = useMap();

  useEffect(() => {
    if (centerTo && centerTo.lat && centerTo.lng) {
      // Usamos flyTo para una animación cinematográfica (zoom + movimiento)
      map.flyTo([centerTo.lat, centerTo.lng], centerTo.zoom || 16, {
        animate: true,
        duration: 2 // Un poco más lento para que se aprecie el movimiento
      });
    } else if (centerTo === 'reset') {
       // Si es reset, intentamos ajustar con flyToBounds para un efecto suave de alejamiento
       if (window.suelosProgresivasLayerGroup && window.suelosProgresivasLayerGroup.getLayers().length > 0) {
         try {
           map.flyToBounds(window.suelosProgresivasLayerGroup.getBounds(), { 
             padding: [40, 40],
             duration: 2.5
           });
         } catch(e) {
           map.flyTo([-12.930, -72.630], 13, { duration: 2 });
         }
       } else {
         map.flyTo([-12.930, -72.630], 13, { duration: 2 });
       }
    }
  }, [centerTo, map]);

  return null;
};

export default SuelosMap;
