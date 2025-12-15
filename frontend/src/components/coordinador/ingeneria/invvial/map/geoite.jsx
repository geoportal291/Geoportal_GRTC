import React, { useEffect, useState, useRef } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { MapContainer, TileLayer, LayersControl, useMap, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { fromLatLon, toLatLon } from 'utm';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import * as turf from '@turf/turf';
import alertify from 'alertifyjs'; // Add this line
import './geoite.css';
import axiosInstance from '../../../../../api/axios';
import { saveAs } from 'file-saver';


// Este componente encapsula TODA la lógica imperativa para no causar re-renders.
const MapLogic = ({ initialRoute, onTramoSelect, highlightedTramoId, alcantarillasData, onAlcantarillaClick, onRouteLoaded, onShowDetails, graphicsImages }) => {
    const map = useMap();
    const geoJsonLayerRef = React.useRef(null);
    const alcantarillasLayerRef = React.useRef(new L.FeatureGroup()); // FeatureGroup para alcantarillas
    const [calibrationData, setCalibrationData] = useState(null); // NEW: State for calibration
    const calibrationDataRef = useRef(null); // NEW: Ref to avoid stale closures
    const [activePopup, setActivePopup] = useState(null);
    const popupContainer = React.useMemo(() => {
        const div = document.createElement('div');
        div.className = "leaflet-popup-content-wrapper-react";
        return div;
    }, []);

    useEffect(() => {
        if (!map) return;

        // Check for a flag on the map object itself to prevent re-initialization
        if (map.isInitialized) return;
        map.isInitialized = true;

        let isComponentMounted = true;

        // --- Variables de estado internas ---
        const drawnItems = new L.FeatureGroup().addTo(map);
        alcantarillasLayerRef.current.addTo(map); // Añadir el FeatureGroup de alcantarillas al mapa


        let isDrawing = false;
        let isMeasuring = false;
        let measuredPoints = [];
        let permanentPolyline = null;
        let rubberBandLine = null;
        const measurementLayers = new L.FeatureGroup().addTo(map);
        let areaDrawer = null;
        let currentDrawer = null; // Para manejar el dibujador activo



        // --- Control de Dibujo (para editar/borrar y como base) ---
        const drawControl = new L.Control.Draw({
            edit: { featureGroup: drawnItems, remove: true },
            draw: {
                polyline: false,
                polygon: false,
                rectangle: false,
                circle: false,
                marker: false
            }
        });
        // map.addControl(drawControl);

        // --- Lógica de Coordenadas en Pantalla ---
        const coordContainer = L.DomUtil.create('div', 'leaflet-control-coordinates');
        const coordControl = new L.Control({ position: 'bottomleft' });
        coordControl.onAdd = function () { return coordContainer; };
        coordControl.addTo(map);
        const parent = coordControl.getContainer()?.parentNode;
        if (parent) { Object.assign(parent.style, { left: '50%', transform: 'translateX(-50%)', right: 'auto', width: 'auto' }); }
        Object.assign(coordContainer.style, { backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontFamily: 'monospace', display: 'none' });

        // --- Lógica del Modal de Mediciones ---
        const measureModal = L.DomUtil.create('div', 'invvial-flyout-card invvial-card-blue', map.getContainer());
        measureModal.id = "invvial-menu-medir";
        L.DomEvent.disableClickPropagation(measureModal);

        measureModal.innerHTML = `
            <div class="invvial-card-header invvial-header-blue">
                <span>Mediciones</span>
                <i class="fas fa-times" style="cursor:pointer"></i>
            </div>
            <div class="invvial-card-body">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button class="invvial-btn-block" id="invvial-distanceButton"><i class="fas fa-ruler"></i> Distancia</button>
                    <button class="invvial-btn-block" id="invvial-areaButton"><i class="fas fa-draw-polygon"></i> Área</button>
                    <button class="invvial-btn-block" id="invvial-clearMeasureButton"><i class="fas fa-trash"></i> Limpiar</button>
                </div>
                <div id="invvial-distanceDisplay" style="margin-bottom: 10px; font-weight: bold;">Seleccione una herramienta.</div>
                <label style="font-size:12px; font-weight:bold; color:#666;">Ubicar Progresiva:</label>
                <div class="invvial-input-flex">
                    <input type="text" id="invvial-progresivaInput" placeholder="Km 4+780">
                    <button id="invvial-ubicarProgresivaBtn">Ir</button>
                </div>
            </div>
        `;

        const distanceDisplay = measureModal.querySelector('#invvial-distanceDisplay');


        // --- Lógica para Ubicar Progresiva ---
        // Función para convertir progresiva (ej. "4+780" o "KM 4+780") a metros
        const progresivaToMeters = (progresiva) => {
            if (!progresiva || typeof progresiva !== 'string') return NaN;
            const cleanedProgresiva = progresiva.replace(/km/i, '').trim();
            const parts = cleanedProgresiva.split('+');
            if (parts.length === 2) {
                const km = parseInt(parts[0], 10);
                const meters = parseInt(parts[1], 10);
                if (!isNaN(km) && !isNaN(meters)) {
                    return km * 1000 + meters;
                }
            } else if (parts.length === 1) {
                const singleValue = parseInt(parts[0], 10);
                if (!isNaN(singleValue)) return singleValue;
            }
            return NaN;
        };

        // Versión antigua para cálculo geométrico simple
        const getCoordsFromSimpleProgresiva = (targetMeters, routeLatLngs) => {
            if (!routeLatLngs || routeLatLngs.length < 2) return null;
            let accumulatedDistance = 0;
            for (let i = 0; i < routeLatLngs.length - 1; i++) {
                const p1 = routeLatLngs[i];
                const p2 = routeLatLngs[i + 1];
                const segmentLength = p1.distanceTo(p2);
                if (accumulatedDistance + segmentLength >= targetMeters) {
                    const distanceIntoSegment = targetMeters - accumulatedDistance;
                    const ratio = segmentLength === 0 ? 0 : distanceIntoSegment / segmentLength;
                    const lat = p1.lat + (p2.lat - p1.lat) * ratio;
                    const lng = p1.lng + (p2.lng - p1.lng) * ratio;
                    return { lat, lng };
                }
                accumulatedDistance += segmentLength;
            }
            alertify.warning(`La progresiva excede la longitud total del trazado (${(accumulatedDistance / 1000).toFixed(3)} km). Se ubicará al final.`);
            return routeLatLngs[routeLatLngs.length - 1];
        };

        const handleUbicarProgresiva = () => {
            const progresivaInput = document.getElementById('invvial-progresivaInput');
            const targetMeters = progresivaToMeters(progresivaInput.value);

            if (isNaN(targetMeters)) {
                alertify.error('Formato de progresiva no válido. Use "KM+M", ej: 4+780.');
                return;
            }

            const routeLayer = geoJsonLayerRef.current;
            if (!routeLayer) {
                alertify.error('No hay un trazado KML cargado en el mapa.');
                return;
            }

            // Filtrar capas que tienen la propiedad "name" (tramos)
            const sourceLayers = routeLayer.getLayers().filter(l => l.getLatLngs && l.feature?.properties?.name);
            if (sourceLayers.length === 0) {
                alertify.error('El KML cargado no contiene tramos con la propiedad "name" requerida (ej: "TRAMO 1").');
                return;
            }

            sourceLayers.sort((a, b) => {
                const numA = parseInt(a.feature.properties.name.replace(/[^0-9]/g, ''), 10);
                const numB = parseInt(b.feature.properties.name.replace(/[^0-9]/g, ''), 10);
                return numA - numB;
            });

            // Si no hay datos de calibración, usar el método antiguo
            if (!calibrationDataRef.current) {
                alertify.warning('Usando cálculo geométrico simple. Para mayor precisión, calibre el trazado.');
                let orderedLatLngs = [];
                sourceLayers.forEach(layer => {
                    const latlngs = layer.getLatLngs();
                    if (orderedLatLngs.length > 0 && orderedLatLngs[orderedLatLngs.length - 1].equals(latlngs[0], 1)) {
                        latlngs.shift();
                    }
                    orderedLatLngs = orderedLatLngs.concat(latlngs);
                });

                if (orderedLatLngs.length < 2) {
                    alertify.error('No se encontró una ruta válida en el KML.');
                    return;
                }
                const finalCoords = getCoordsFromSimpleProgresiva(targetMeters, orderedLatLngs);
                if (finalCoords) {
                    const marker = L.marker([finalCoords.lat, finalCoords.lng]).addTo(drawnItems);
                    marker.bindPopup(`(NC) Progresiva: ${progresivaInput.value}`).openPopup();
                    map.setView([finalCoords.lat, finalCoords.lng], 16);
                    alertify.success(`(No Calibrado) Marcador añadido en la progresiva ${progresivaInput.value}`);
                }
                return;
            }

            // --- Lógica de Calibración ---
            let targetTramoLayer = null;
            let tramoStartMeters = 0;
            let tramoEndMeters = 0;

            for (const layer of sourceLayers) {
                const tramoName = layer.feature.properties.name;
                const calib = calibrationDataRef.current[tramoName];
                if (calib && calib.start && calib.end) {
                    const startM = progresivaToMeters(calib.start);
                    const endM = progresivaToMeters(calib.end);
                    if (targetMeters >= startM && targetMeters <= endM) {
                        targetTramoLayer = layer;
                        tramoStartMeters = startM;
                        tramoEndMeters = endM;
                        break;
                    }
                }
            }

            if (!targetTramoLayer) {
                alertify.error('La progresiva ingresada no se encuentra dentro de los rangos calibrados.');
                return;
            }

            const officialTramoLength = tramoEndMeters - tramoStartMeters;
            const targetDistanceInTramo = targetMeters - tramoStartMeters;
            const interpolationRatio = officialTramoLength === 0 ? 0 : targetDistanceInTramo / officialTramoLength;

            const tramoLatLngs = targetTramoLayer.getLatLngs();
            let geometricTramoLength = 0;
            for (let i = 0; i < tramoLatLngs.length - 1; i++) {
                geometricTramoLength += tramoLatLngs[i].distanceTo(tramoLatLngs[i + 1]);
            }

            const targetGeometricDistance = geometricTramoLength * interpolationRatio;

            // Encontrar la coordenada en el tramo geométrico
            let finalCoords = null;
            let accumulatedDistance = 0;
            for (let i = 0; i < tramoLatLngs.length - 1; i++) {
                const p1 = tramoLatLngs[i];
                const p2 = tramoLatLngs[i + 1];
                const segmentLength = p1.distanceTo(p2);
                if (accumulatedDistance + segmentLength >= targetGeometricDistance) {
                    const distanceIntoSegment = targetGeometricDistance - accumulatedDistance;
                    const ratio = segmentLength === 0 ? 0 : distanceIntoSegment / segmentLength;
                    const lat = p1.lat + (p2.lat - p1.lat) * ratio;
                    const lng = p1.lng + (p2.lng - p1.lng) * ratio;
                    finalCoords = { lat, lng };
                    break;
                }
                accumulatedDistance += segmentLength;
            }

            if (!finalCoords) { // If it's at the very end
                finalCoords = tramoLatLngs[tramoLatLngs.length - 1];
            }

            if (finalCoords) {
                const marker = L.marker([finalCoords.lat, finalCoords.lng]).addTo(drawnItems);
                marker.bindPopup(`Progresiva: ${progresivaInput.value}`).openPopup();
                map.setView([finalCoords.lat, finalCoords.lng], 17); // Zoom even closer
                alertify.success(`(Calibrado) Marcador añadido en la progresiva ${progresivaInput.value}`);
            } else {
                alertify.error('No se pudo calcular la ubicación calibrada.');
            }
        };

        measureModal.querySelector('#invvial-ubicarProgresivaBtn').onclick = handleUbicarProgresiva;


        // --- Lógica del Modal de Dibujo ---
        const drawModal = L.DomUtil.create('div', 'invvial-flyout-card invvial-card-orange', map.getContainer());
        drawModal.id = "invvial-menu-dibujo";
        drawModal.style.width = '340px'; // Reducido para que no se salga del mapa
        L.DomEvent.disableClickPropagation(drawModal);

        drawModal.innerHTML = `
            <div class="invvial-card-header invvial-header-orange">
                <span>Herramientas de Dibujo</span>
                <i class="fas fa-times" style="cursor:pointer"></i>
            </div>
            <div class="invvial-card-body">
                <div class="invvial-input-group">
                    <label for="invvial-inputTypeSelect">Tipo de Entrada:</label>
                    <select id="invvial-inputTypeSelect" class="invvial-form-select">
                        <option value="coordinates">Coordenadas</option>
                        <option value="kml">KML</option>
                    </select>
                </div>

                <div id="invvial-coordinateInputSection"> 
                    <div class="invvial-input-group">
                        <label for="invvial-projectionSelect">Proyección:</label>
                        <select id="invvial-projectionSelect" class="invvial-form-select">
                            <option value="geographic">Geográficas</option>
                            <option value="utm" selected>UTM</option>
                        </select>
                    </div>
                    <div class="invvial-input-group" id="invvial-utmZoneGroup" style="display: none;">
                        <label for="invvial-utmZoneSelect">Zona:</label>
                        <select id="invvial-utmZoneSelect" class="invvial-form-select">
                            <option value="17">ZONA 17</option>
                            <option value="18" selected>ZONA 18</option>
                            <option value="19">ZONA 19</option>
                        </select>
                    </div>
                    <div id="invvial-geographicCoordInputs"> 
                        <div class="invvial-input-group">
                             <label for="invvial-coordFormatSelect">Formato:</label>
                             <select id="invvial-coordFormatSelect" class="invvial-form-select">
                                <option value="decimal">Decimal</option>
                                <option value="degrees">Grados (GMS)</option>
                            </select>
                        </div>
                        <div id="invvial-decimalInputs">
                           <div class="invvial-input-flex"><input type="text" id="invvial-lonDecimal" class="invvial-form-input" placeholder="Longitud"/><input type="text" id="invvial-latDecimal" class="invvial-form-input" placeholder="Latitud"/></div>
                        </div>
                        <div id="invvial-degreesInputs" style="display: none;">
                            <div class="invvial-input-flex">
                                <input type="text" id="invvial-lonDeg" placeholder="G" class="invvial-gms-input"/>
                                <input type="text" id="invvial-lonMin" placeholder="M" class="invvial-gms-input"/>
                                <input type="text" id="invvial-lonSec" placeholder="S" class="invvial-gms-input"/>
                            </div>
                             <div class="invvial-input-flex">
                                <input type="text" id="invvial-latDeg" placeholder="G" class="invvial-gms-input"/>
                                <input type="text" id="invvial-latMin" placeholder="M" class="invvial-gms-input"/>
                                <input type="text" id="invvial-latSec" placeholder="S" class="invvial-gms-input"/>
                            </div>
                        </div>
                    </div>
                    <div id="invvial-utmCoordInputs" style="display: none;">
                        <div class="invvial-input-flex"><input type="text" id="invvial-utmX" class="invvial-form-input" placeholder="Latitud"/><input type="text" id="invvial-utmY" class="invvial-form-input" placeholder="Longitud"/></div>
                    </div>
                </div> 

                <div id="invvial-kmlInputs" style="display: none; margin-top: 10px;">
                    <input type="file" id="invvial-kmlFileInput" accept=".kml" class="invvial-btn-block"/>
                    <button id="invvial-processKmlBtn" class="invvial-btn-primary">PROCESAR KML</button>
                </div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button id="invvial-drawPointBtn" class="invvial-btn-primary">DIBUJAR</button>
                    <button id="invvial-clearCoordsBtn" class="invvial-btn-secondary">LIMPIAR</button>
                </div>
            </div>
        `;

        // --- Lógica del Modal de Descarga ---
        const downloadModal = L.DomUtil.create('div', 'invvial-flyout-card invvial-card-purple', map.getContainer());
        downloadModal.id = 'invvial-menu-kml-descarga';
        L.DomEvent.disableClickPropagation(downloadModal);


        const handleExportKML = async () => {
            const geoJsonDrawn = drawnItems.toGeoJSON();
            const geoJsonMeasured = measurementLayers.toGeoJSON();

            const geoJsonToExport = {
                type: 'FeatureCollection',
                features: [...geoJsonDrawn.features, ...geoJsonMeasured.features]
            };

            if (geoJsonToExport.features.length === 0) {
                alertify.error('No hay elementos dibujados para exportar.');
                return;
            }

            try {
                alertify.message('Exportando a KML...');
                const response = await axiosInstance.post('/api/trafico/exportar-kml', geoJsonToExport, {
                    responseType: 'blob',
                });
                saveAs(response.data, 'geoportal_export.kml');
                alertify.success('Exportación KML completada.');
            } catch (error) {
                console.error('Error al exportar a KML:', error);
                alertify.error('Ocurrió un error durante la exportación a KML.');
            }
        };

        const handleExportShapefile = async () => {
            const geoJsonDrawn = drawnItems.toGeoJSON();
            const geoJsonMeasured = measurementLayers.toGeoJSON();

            const geoJsonToExport = {
                type: 'FeatureCollection',
                features: [...geoJsonDrawn.features, ...geoJsonMeasured.features]
            };

            if (geoJsonToExport.features.length === 0) {
                alertify.error('No hay elementos dibujados para exportar.');
                return;
            }

            try {
                alertify.message('Exportando a Shapefile (ZIP)...');
                const response = await axiosInstance.post('/api/trafico/exportar-shapefile', geoJsonToExport, {
                    responseType: 'blob',
                });
                saveAs(response.data, 'geoportal_export.zip');
                alertify.success('Exportación a Shapefile completada.');
            } catch (error) {
                console.error('Error al exportar a Shapefile:', error);
                alertify.error('Ocurrió un error durante la exportación a Shapefile.');
            }
        };

        downloadModal.innerHTML = `
          <div class="invvial-card-header invvial-header-purple">
              <span>Descargar Datos</span>
              <i class="fas fa-times" style="cursor:pointer"></i>
          </div>
          <div class="invvial-card-body">
              <p style="margin-top: 0; margin-bottom: 10px;">Exportar todas las geometrías dibujadas en el mapa.</p>
              <button id="invvial-exportKmlBtn" class="invvial-btn-block"><i class="fas fa-file-code"></i> Descargar como KML</button>
              <button id="invvial-exportShpBtn" class="invvial-btn-block"><i class="fas fa-file-archive"></i> Descargar como Shapefile (ZIP)</button>
          </div>
        `;

        downloadModal.querySelector('#invvial-exportKmlBtn').onclick = handleExportKML;
        downloadModal.querySelector('#invvial-exportShpBtn').onclick = handleExportShapefile;


        // --- Lógica del Modal de Subida ---
        const uploadModal = L.DomUtil.create('div', 'invvial-flyout-card invvial-card-purple', map.getContainer());
        uploadModal.id = 'invvial-menu-kml-carga';
        L.DomEvent.disableClickPropagation(uploadModal);

        const loadKmlFromUrl = async (url, showAlerts = true) => {
            try {
                if (showAlerts) alertify.message(`Descargando KML desde la URL...`);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Error en la red: ${response.statusText}`);
                }
                const kmlText = await response.text();

                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
                const convertedGeoJson = kml(kmlDoc);

                // --- START: Pass GeoJSON to parent ---
                if (onRouteLoaded) {
                    onRouteLoaded(convertedGeoJson);
                }
                // --- END: Pass GeoJSON to parent ---

                const tempGeoJsonLayer = L.geoJSON(convertedGeoJson, {
                    style: function (feature) {
                        if (feature.properties) {
                            let color;
                            switch (feature.properties.name) { // Use .name instead of .id
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
                                weight: 5, // Fixed weight for better visibility
                                opacity: feature.properties['stroke-opacity'] || 1.0,
                            };
                        }
                        return { color: '#3388ff', weight: 10 }; // Default style
                    },
                    onEachFeature: (feature, layer) => {
                        if (feature.properties && feature.properties.name) {
                            layer.bindPopup(feature.properties.name);
                        }
                        layer.on('click', () => {
                            if (onTramoSelect) {
                                onTramoSelect(feature.properties);
                            }
                        });
                    }
                });

                geoJsonLayerRef.current = tempGeoJsonLayer;

                tempGeoJsonLayer.eachLayer(layer => drawnItems.addLayer(layer));

                if (isComponentMounted && tempGeoJsonLayer.getBounds().isValid()) {
                    map.fitBounds(tempGeoJsonLayer.getBounds());
                }

            } catch (error) {
                alertify.error('No se pudo cargar el KML desde la URL.');
            }
        };

        const handleKmlUpload = async () => {
            const kmlUploadInput = uploadModal.querySelector('#kmlUploadInput');
            const file = kmlUploadInput.files[0];

            if (!file) {
                alertify.error('Por favor, seleccione un archivo KML para subir.');
                return;
            }

            const formData = new FormData();
            formData.append('kmlFile', file);

            try {
                alertify.message('Subiendo archivo KML...');
                const uploadResponse = await axiosInstance.post('/api/kml/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                const { url: newUrl } = uploadResponse.data;
                alertify.success('Archivo subido correctamente.');

                // Persist the new URL to the project
                await axiosInstance.post(`/api/proyectos/${projectId}/kml`, { url: newUrl });
                alertify.message('Asociando KML con el proyecto.');

                uploadModal.style.display = 'none';

                // Clear existing layers before loading the new one
                drawnItems.clearLayers();
                measurementLayers.clearLayers();

                if (newUrl) {
                    await loadKmlFromUrl(newUrl);
                }

            } catch (error) {
                alertify.error('Ocurrió un error al subir el archivo.');
            }
        };

        uploadModal.innerHTML = `
            <div class="invvial-card-header invvial-header-purple">
                <span>Gestión de Archivos KML</span>
                <i class="fas fa-times" style="cursor:pointer"></i>
            </div>
            <div class="invvial-card-body">
                <label for="invvial-kmlUploadInput" class="invvial-btn-block" style="text-align: center; display: block;"><i class="fas fa-upload"></i> Cargar KML</label>
                <input type="file" id="invvial-kmlUploadInput" accept=".kml" style="display: none;"/>
                <button id="invvial-uploadKmlBtn" class="invvial-btn-block" style="margin-top: 5px;">Subir y Mostrar KML</button>
            </div>
        `;

        uploadModal.querySelector('#invvial-uploadKmlBtn').onclick = handleKmlUpload;
        uploadModal.querySelector('#invvial-kmlUploadInput').onchange = handleKmlUpload;


        // Lógica para mostrar/ocultar campos de coordenadas según el formato
        const coordFormatSelect = document.getElementById('invvial-coordFormatSelect');
        const decimalInputs = document.getElementById('invvial-decimalInputs');
        const degreesInputs = document.getElementById('invvial-degreesInputs');

        const updateCoordInputsVisibility = () => {
            if (coordFormatSelect.value === 'decimal') {
                decimalInputs.style.display = 'block';
                degreesInputs.style.display = 'none';
            } else {
                decimalInputs.style.display = 'none';
                degreesInputs.style.display = 'block';
            }
        };

        coordFormatSelect.addEventListener('change', updateCoordInputsVisibility);
        updateCoordInputsVisibility(); // Llamar al inicio para establecer el estado inicial

        // --- NUEVA Lógica para mostrar/ocultar campos según la proyección ---
        const projectionSelect = document.getElementById('invvial-projectionSelect');
        const utmZoneGroup = document.getElementById('invvial-utmZoneGroup');
        const geographicCoordInputs = document.getElementById('invvial-geographicCoordInputs');
        const utmCoordInputs = document.getElementById('invvial-utmCoordInputs');

        const updateProjectionInputsVisibility = () => {
            if (projectionSelect.value === 'utm') {
                utmZoneGroup.style.display = 'flex'; // Use flex for input-group
                geographicCoordInputs.style.display = 'none';
                utmCoordInputs.style.display = 'block';
            } else { // geographic
                utmZoneGroup.style.display = 'none';
                geographicCoordInputs.style.display = 'block';
                utmCoordInputs.style.display = 'none';
                updateCoordInputsVisibility(); // Ensure geographic format inputs are correctly displayed
            }
        };

        projectionSelect.addEventListener('change', updateProjectionInputsVisibility);
        updateProjectionInputsVisibility(); // Llamar al inicio para establecer el estado inicial

        // --- NUEVA Lógica para mostrar/ocultar secciones según el Tipo de Entrada ---
        const inputTypeSelect = document.getElementById('invvial-inputTypeSelect');
        const coordinateInputSection = document.getElementById('invvial-coordinateInputSection');
        const kmlInputs = document.getElementById('invvial-kmlInputs');

        const updateInputTypeVisibility = () => {
            if (inputTypeSelect.value === 'coordinates') {
                coordinateInputSection.style.display = 'block';
                kmlInputs.style.display = 'none';
                // Ensure coordinate projection/format visibility is updated
                updateProjectionInputsVisibility();
            } else { // kml
                coordinateInputSection.style.display = 'none';
                kmlInputs.style.display = 'block';
            }
        };

        inputTypeSelect.addEventListener('change', updateInputTypeVisibility);
        updateInputTypeVisibility(); // Llamar al inicio para establecer el estado inicial

        // --- Lógica para procesar KML ---
        const kmlFileInput = document.getElementById('invvial-kmlFileInput');
        const processKmlBtn = document.getElementById('invvial-processKmlBtn');

        processKmlBtn.onclick = () => {
            const file = kmlFileInput.files[0];
            if (!file) {
                alertify.error('Por favor, seleccione un archivo KML.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const kmlText = e.target.result;
                try {
                    const parser = new DOMParser();
                    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');

                    const convertedGeoJson = kml(kmlDoc); // Use @tmcw/togeojson

                    // Add GeoJSON features to drawnItems
                    const tempGeoJsonLayer = L.geoJSON(convertedGeoJson, {
                        onEachFeature: (feature, layer) => {
                            if (feature.properties && feature.properties.name) {
                                layer.bindPopup(feature.properties.name);
                            }
                        }
                    });
                    tempGeoJsonLayer.eachLayer(layer => drawnItems.addLayer(layer));

                    // Fit map to bounds of imported KML
                    if (tempGeoJsonLayer.getBounds().isValid()) {
                        map.fitBounds(tempGeoJsonLayer.getBounds());
                    }

                    alertify.success('Archivo KML procesado y características añadidas al mapa.');
                    closeAll();
                } catch (error) {
                    alertify.error('Ocurrió un error al procesar el archivo KML.');
                }
            };
            reader.onerror = () => {
                alertify.error('No se pudo leer el archivo KML.');
            };
            reader.readAsText(file);
        };

        // Obtener referencias a los botones
        const drawPointBtn = document.getElementById('invvial-drawPointBtn');
        const clearCoordsBtn = document.getElementById('invvial-clearCoordsBtn');

        // Función para limpiar los campos de coordenadas
        const clearCoords = () => {
            // Campos decimales
            document.getElementById('invvial-lonDecimal').value = '';
            document.getElementById('invvial-latDecimal').value = '';
            // Campos grados
            document.getElementById('invvial-lonDeg').value = '';
            document.getElementById('invvial-lonMin').value = '';
            document.getElementById('invvial-lonSec').value = '';
            document.getElementById('invvial-latDeg').value = '';
            document.getElementById('invvial-latMin').value = '';
            document.getElementById('invvial-latSec').value = '';
            // Campos UTM
            document.getElementById('invvial-utmX').value = '';
            document.getElementById('invvial-utmY').value = '';
        };

        // Asignar evento al botón de limpiar
        clearCoordsBtn.onclick = clearCoords;

        // Función para convertir grados, minutos, segundos a decimal
        const dmsToDecimal = (degrees, minutes, seconds) => {
            return parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / 3600;
        };

        // Función para dibujar el punto
        const drawPoint = () => {
            let finalLat, finalLon;
            const projectionType = document.getElementById('invvial-projectionSelect').value;

            if (projectionType === 'geographic') {
                let lat, lon;
                const coordFormat = document.getElementById('invvial-coordFormatSelect').value;

                if (coordFormat === 'decimal') {
                    lon = parseFloat(document.getElementById('invvial-lonDecimal').value);
                    lat = parseFloat(document.getElementById('invvial-latDecimal').value);
                } else { // grados (DMS)
                    const lonDeg = document.getElementById('invvial-lonDeg').value;
                    const lonMin = document.getElementById('invvial-lonMin').value;
                    const lonSec = document.getElementById('invvial-lonSec').value;
                    const latDeg = document.getElementById('invvial-latDeg').value;
                    const latMin = document.getElementById('invvial-latMin').value;
                    const latSec = document.getElementById('invvial-latSec').value;

                    lon = dmsToDecimal(lonDeg, lonMin, lonSec);
                    lat = dmsToDecimal(latDeg, latMin, latSec);
                }

                if (isNaN(lat) || isNaN(lon)) {
                    alertify.error('Por favor, ingrese coordenadas geográficas válidas.');
                    return;
                }
                finalLat = lat;
                finalLon = lon;

            } else { // utm
                const utmX = parseFloat(document.getElementById('invvial-utmX').value);
                const utmY = parseFloat(document.getElementById('invvial-utmY').value);
                const utmZone = parseInt(document.getElementById('invvial-utmZoneSelect').value);

                if (isNaN(utmX) || isNaN(utmY) || isNaN(utmZone)) {
                    alertify.error('Por favor, ingrese coordenadas UTM válidas y seleccione una zona.');
                    return;
                }
                const utmZoneLetter = 'M';
                try {
                    const converted = toLatLon(utmX, utmY, utmZone, utmZoneLetter);
                    finalLat = converted.latitude;
                    finalLon = converted.longitude;

                } catch (error) {
                    alertify.error('Error al convertir coordenadas UTM: ' + error.message);
                    return;
                }
            }

            const marker = L.marker([finalLat, finalLon]).addTo(drawnItems);
            map.setView([finalLat, finalLon], map.getZoom()); // Centrar el mapa en el nuevo punto
            closeAll();
            clearCoords(); // Limpiar campos después de dibujar
        };

        // Asignar evento al botón de dibujar
        drawPointBtn.onclick = drawPoint;

        const addNumericInputValidation = (inputId) => {
            const input = document.getElementById('invvial-' + inputId);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value;
                    value = value.replace(/[^-0-9.]/g, '');
                    const negativeCount = (value.match(/-/g) || []).length;
                    if (negativeCount > 0) {
                        const firstChar = value.charAt(0);
                        value = value.replace(/-/g, '');
                        if (firstChar === '-') {
                            value = '-' + value;
                        }
                    }
                    const parts = value.split('.');
                    if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    e.target.value = value;
                });
            }
        };

        addNumericInputValidation('lonDecimal');
        addNumericInputValidation('latDecimal');
        addNumericInputValidation('utmX');
        addNumericInputValidation('utmY');

        const toolbarContainer = L.DomUtil.create('div', 'invvial-toolbar-container');
        toolbarContainer.innerHTML = `
            <div class="invvial-tool-group">
                <button class="invvial-tool-btn" data-menu="invvial-menu-medir"><i class="fas fa-ruler-combined"></i></button>
                <button class="invvial-tool-btn" data-menu="invvial-menu-dibujo"><i class="fas fa-pencil-alt" style="color: #e67e22;"></i></button>
                <button class="invvial-tool-btn" data-menu="invvial-menu-kml-carga"><i class="fas fa-upload" style="color: #6c5ce7;"></i></button>
                <button class="invvial-tool-btn" data-menu="invvial-menu-kml-descarga"><i class="fas fa-download" style="color: #6c5ce7;"></i></button>
                <button class="invvial-tool-btn" data-menu="invvial-menu-calibrar"><i class="fas fa-cog"></i></button>
            </div>
            <div class="invvial-tool-group">
                <button class="invvial-tool-btn" id="invvial-updateInfo"><i class="fas fa-save"></i></button>
                <button class="invvial-tool-btn" id="invvial-deleteKml"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        const toolbarControl = new L.Control({ position: 'topleft' });
        toolbarControl.onAdd = () => toolbarContainer;
        toolbarControl.addTo(map);

        L.DomEvent.disableClickPropagation(toolbarContainer);

        const closeAll = () => {
            document.querySelectorAll('.invvial-flyout-card').forEach(m => m.style.display = 'none');
            document.querySelectorAll('.invvial-tool-btn').forEach(b => b.classList.remove('active'));
        };

        const toggleMenu = (menuId, btnElement) => {
            const menu = document.getElementById(menuId);
            if (!menu) return;
            const isVisible = menu.style.display === 'block';

            closeAll();

            if (!isVisible) {
                const rect = btnElement.getBoundingClientRect();
                // Posicionar a la derecha del botón
                menu.style.left = (rect.right + 15) + 'px';
                // Posicionar desde arriba (180px desde el top)
                menu.style.top = '180px';
                menu.style.bottom = 'auto'; // Resetear bottom

                // Calcular la posición de la flecha para que apunte al botón
                const modalTop = 180; // Debe coincidir con menu.style.top
                const arrowTop = rect.top - modalTop + (rect.height / 2) - 7; // Centrar en el botón
                menu.style.setProperty('--arrow-top', `${arrowTop}px`);

                menu.style.display = 'block';
                btnElement.classList.add('active');
            }
        };

        toolbarContainer.querySelectorAll('.invvial-tool-btn[data-menu]').forEach(btn => {
            btn.onclick = () => toggleMenu(btn.dataset.menu, btn);
        });

        const calibrateButton = toolbarContainer.querySelector('[data-menu="invvial-menu-calibrar"]');

        const deleteKmlButton = toolbarContainer.querySelector('#invvial-deleteKml');

        const updateInfoButton = toolbarContainer.querySelector('#invvial-updateInfo');


        // --- NEW: Calibration Modal ---
        const calibrationModal = L.DomUtil.create('div', 'invvial-flyout-card invvial-card-blue', map.getContainer());
        calibrationModal.id = "invvial-menu-calibrar";
        L.DomEvent.disableClickPropagation(calibrationModal);

        const calibrationHeader = L.DomUtil.create('div', 'invvial-card-header invvial-header-blue', calibrationModal);
        calibrationHeader.innerHTML = '<span>Calibrar Progresivas por Tramo</span><i class="fas fa-times" style="cursor:pointer"></i>';
        calibrationHeader.querySelector('.fa-times').onclick = closeAll;

        const calibrationContent = L.DomUtil.create('div', 'invvial-card-body', calibrationModal);


        // --- KML Persistence ---
        const projectId = 24;

        const loadInitialKml = async () => {
            try {
                const response = await axiosInstance.get(`/api/proyectos/${projectId}/kml`);
                if (response.data && response.data.url) {
                    const showAlerts = !window.hasShownInitialKmlAlert;
                    await loadKmlFromUrl(response.data.url, showAlerts);
                    if (showAlerts) {
                        window.hasShownInitialKmlAlert = true;
                    }
                }
            } catch (error) {
                if (error.response && error.response.status !== 404) {
                }
            }
        };

        const loadInitialCalibrationData = async () => {
            try {
                const response = await axiosInstance.get(`/api/proyectos/${projectId}/calibracion`);
                setCalibrationData(response.data);
                calibrationDataRef.current = response.data;
            } catch (error) {
                if (error.response && error.response.status !== 404) {
                    console.error('Error loading calibration data:', error);
                    alertify.error('Error al cargar datos de calibración.');
                }
            }
        };

        loadInitialKml();
        loadInitialCalibrationData();

        calibrateButton.onclick = () => {
            toggleMenu('invvial-menu-calibrar', calibrateButton);
            const routeLayer = geoJsonLayerRef.current;
            if (!routeLayer) {
                alertify.error('Primero debe cargar un archivo KML.');
                return;
            }

            const sourceLayers = routeLayer.getLayers().filter(l => l.feature?.properties?.name);
            sourceLayers.sort((a, b) => {
                const numA = parseInt(a.feature.properties.name.replace(/[^0-9]/g, ''), 10);
                const numB = parseInt(b.feature.properties.name.replace(/[^0-9]/g, ''), 10);
                return numA - numB;
            });

            if (sourceLayers.length === 0) {
                alertify.error('El KML cargado no contiene tramos con la propiedad "name" (ej: "TRAMO 1").');
                return;
            }

            let tableRows = '';
            sourceLayers.forEach((layer, index) => {
                const tramoName = layer.feature.properties.name;
                const currentCalib = calibrationDataRef.current?.[tramoName] || { start: '', end: '' };
                tableRows += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">${tramoName}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><input type="text" class="invvial-calib-input" data-tramo="${tramoName}" data-type="start" value="${currentCalib.start}" placeholder="Ej: 0+000"></td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><input type="text" class="invvial-calib-input" data-tramo="${tramoName}" data-type="end" value="${currentCalib.end}" placeholder="Ej: 34+000"></td>
                    </tr>
                `;
            });

            calibrationContent.innerHTML = `
                <p>Ingrese la progresiva oficial de inicio y fin para cada tramo del KML.</p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tramo</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Inicio</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fin</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <button id="invvial-saveCalibrationBtn" class="invvial-btn-block" style="background-color: #28a745; color: white;">Guardar Calibración</button>
                <button id="invvial-deleteCalibrationBtn" class="invvial-btn-block" style="background-color: #dc3545; color: white; margin-top:5px;">Borrar Calibración</button>
            `;

            calibrationModal.querySelector('#invvial-saveCalibrationBtn').onclick = async () => {
                const inputs = calibrationModal.querySelectorAll('.invvial-calib-input');
                const newCalibData = {};
                inputs.forEach(input => {
                    const tramo = input.dataset.tramo;
                    const type = input.dataset.type;
                    if (!newCalibData[tramo]) {
                        newCalibData[tramo] = {};
                    }
                    newCalibData[tramo][type] = input.value;
                });
                try {
                    await axiosInstance.post(`/api/proyectos/${projectId}/calibracion`, newCalibData);
                    setCalibrationData(newCalibData);
                    calibrationDataRef.current = newCalibData;
                    closeAll();
                    alertify.success('Datos de calibración guardados exitosamente en la base de datos.');
                } catch (error) {
                    console.error('Error saving calibration data:', error);
                    alertify.error('Error al guardar datos de calibración: ' + (error.response?.data?.error || error.message));
                }
            };

            calibrationModal.querySelector('#invvial-deleteCalibrationBtn').onclick = async () => {
                alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar TODOS los datos de calibración para este proyecto?',
                    async function () {
                        try {
                            await axiosInstance.delete(`/api/proyectos/${projectId}/calibracion`);
                            setCalibrationData(null); // Clear local state
                            calibrationDataRef.current = null;
                            closeAll();
                            alertify.success('Datos de calibración eliminados exitosamente.');
                        } catch (error) {
                            console.error('Error deleting calibration data:', error);
                            alertify.error('Error al eliminar datos de calibración: ' + (error.response?.data?.error || error.message));
                        }
                    },
                    function () { alertify.message('Eliminación cancelada.'); }
                );
            };
        };

        const handleDeleteKml = async () => {
            alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar el KML de este proyecto? Esta acción no se puede deshacer.',
                async function () {
                    try {
                        alertify.message('Eliminando KML...');
                        await axiosInstance.delete(`/api/proyectos/${projectId}/kml`);
                        drawnItems.clearLayers();
                        alertify.success('El KML ha sido eliminado del proyecto.');
                    } catch (error) {
                        console.error("Error deleting KML:", error);
                        const errorMessage = error.response?.data?.error || 'No se pudo eliminar el KML.';
                        alertify.error(errorMessage);
                    }
                },
                function () {
                    alertify.error('Eliminación cancelada.');
                }
            );
        };

        deleteKmlButton.onclick = handleDeleteKml;

        const handleUpdateInfo = async () => {
            const geoJsonDrawn = drawnItems.toGeoJSON();
            const points = geoJsonDrawn.features.filter(feature => feature.geometry.type === 'Point');

            if (points.length === 0) {
                alertify.warning('No hay nuevos puntos para guardar.');
                return;
            }
            const id_proyecto = 1;

            const puntosParaGuardar = points.map(feature => ({
                nombre: feature.properties?.name || 'Punto sin nombre',
                descripcion: feature.properties?.description || '',
                latitud: feature.geometry.coordinates[1],
                longitud: feature.geometry.coordinates[0],
                id_proyecto: id_proyecto
            }));

            try {
                alertify.message('Guardando puntos en la base de datos...');
                const response = await axiosInstance.post('/api/puntos-mapa/bulk', { puntos: puntosParaGuardar });
                alertify.success(`${response.data.count} puntos guardados correctamente.`);
                const layersToRemove = [];
                drawnItems.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        layersToRemove.push(layer);
                    }
                });
                layersToRemove.forEach(layer => {
                    drawnItems.removeLayer(layer);
                });

            } catch (error) {
                alertify.error('Ocurrió un error al guardar los puntos.');
            }
        };

        updateInfoButton.onclick = handleUpdateInfo;


        // --- Manejadores de Eventos ---
        const getPolygonArea = (latLngs) => {
            const utmCoords = latLngs.map(ll => fromLatLon(ll.lat, ll.lng));
            let area = 0;
            for (let i = 0; i < utmCoords.length; i++) {
                const j = (i + 1) % utmCoords.length;
                area += utmCoords[i].easting * utmCoords[j].northing - utmCoords[j].easting * utmCoords[i].northing;
            }
            return Math.abs(area / 2);
        };

        const clearMeasurement = () => {
            measurementLayers.clearLayers();
            if (rubberBandLine) { rubberBandLine.remove(); rubberBandLine = null; }
            measuredPoints = []; permanentPolyline = null;
            distanceDisplay.innerHTML = 'Seleccione una herramienta.';
        };

        measureModal.querySelector('#invvial-clearMeasureButton').onclick = clearMeasurement;

        const handleCoordsMouseMove = (e) => {
            if (isDrawing || isMeasuring) {
                coordContainer.style.display = 'none'; // Ocultar si está dibujando o midiendo
                return;
            }

            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            const zoom = map.getZoom();
            const metersPerPixel = 156543.03 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
            const scale = Math.round(metersPerPixel * 3779.52);
            const utmCoords = fromLatLon(lat, lon);

            coordContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: auto auto; column-gap: 1.5em;">
        <div>Escala: ~1:${scale.toLocaleString('en-US')}</div>
        <div>Coordenada Este: ${utmCoords.easting.toFixed(2)}</div>
        <div>Longitud: ${lon.toFixed(5)}</div>
        <div>Coordenada Norte: ${utmCoords.northing.toFixed(2)}</div>
        <div>Latitud: ${lat.toFixed(5)}</div>
        <div>Sistema Coordenadas: WGS'84 Zona ${utmCoords.zoneNum}${utmCoords.zoneLetter}</div>
      </div>
    `;
            coordContainer.style.display = 'block';
        };
        const handleCoordsMouseOut = () => { coordContainer.style.display = 'none'; };
        const handleDrawStart = (e) => {
            isDrawing = true;
            coordContainer.style.display = 'none';
        };
        const handleDrawStop = () => { isDrawing = false; };

        const handleMeasureMouseMove = (e) => {
            if (!isMeasuring) return;

            if (measuredPoints.length > 0) {
                if (rubberBandLine) {
                    rubberBandLine.setLatLngs([measuredPoints[measuredPoints.length - 1], e.latlng]);
                } else {
                    rubberBandLine = L.polyline([measuredPoints[measuredPoints.length - 1], e.latlng], { color: 'blue', weight: 3, opacity: 0.5, dashArray: '5, 10' }).addTo(map);
                }
                const currentSegmentDistance = measuredPoints[measuredPoints.length - 1].distanceTo(e.latlng);
                let totalDistance = 0;
                for (let i = 0; i < measuredPoints.length - 1; i++) {
                    totalDistance += measuredPoints[i].distanceTo(measuredPoints[i + 1]);
                }
                totalDistance += currentSegmentDistance;
                distanceDisplay.innerHTML = `Distancia: ${(totalDistance / 1000).toFixed(3)} km`;
            } else {
                distanceDisplay.innerHTML = `Haga clic para añadir el primer punto.`;
            }
        };

        measureModal.querySelector('#invvial-distanceButton').onclick = () => {
            isMeasuring = !isMeasuring;
            if (areaDrawer) { areaDrawer.disable(); areaDrawer = null; }
            clearMeasurement();
            if (isMeasuring) {
                map.getContainer().style.cursor = 'crosshair';
                distanceDisplay.innerHTML = 'Haga clic para añadir puntos.';
                map.on('mousemove', handleMeasureMouseMove);
            } else {
                map.getContainer().style.cursor = '';
                map.off('mousemove', handleMeasureMouseMove);
            }
        };

        measureModal.querySelector('#invvial-areaButton').onclick = () => {
            if (isMeasuring) { isMeasuring = false; map.getContainer().style.cursor = ''; map.off('mousemove', handleMeasureMouseMove); }
            clearMeasurement();
            areaDrawer = new L.Draw.Polygon(map, { showArea: false, allowIntersection: false, shapeOptions: { color: '#007bff' } });
            areaDrawer.enable();
        };


        const handleMapClick = (e) => {
            if (!isMeasuring) return;

            measuredPoints.push(e.latlng);
            L.marker(e.latlng, { icon: L.divIcon({ className: 'measure-point-icon', html: '●', iconSize: [10, 10] }) }).addTo(measurementLayers);

            if (measuredPoints.length > 1) {
                const segment = L.polyline([measuredPoints[measuredPoints.length - 2], measuredPoints[measuredPoints.length - 1]], { color: 'red', weight: 3 }).addTo(measurementLayers);
                const segmentDistance = measuredPoints[measuredPoints.length - 2].distanceTo(measuredPoints[measuredPoints.length - 1]);
                let totalDistance = 0;
                for (let i = 0; i < measuredPoints.length - 1; i++) {
                    totalDistance += measuredPoints[i].distanceTo(measuredPoints[i + 1]);
                }
                distanceDisplay.innerHTML = `Distancia: ${(totalDistance / 1000).toFixed(3)} km`;

                const segmentDistanceKm = (segmentDistance / 1000);
                if (segmentDistanceKm > 0) {
                    L.marker(segment.getCenter(), {
                        icon: L.divIcon({
                            className: 'measure-label',
                            html: `${segmentDistanceKm.toFixed(2)} km`,
                            iconAnchor: [0, 0]
                        })
                    }).addTo(measurementLayers);
                }
            }
        };
        const handleMapDoubleClick = (e) => {
            if (!isMeasuring) return;

            if (rubberBandLine) {
                rubberBandLine.remove();
                rubberBandLine = null;
            }
            isMeasuring = false;
            map.getContainer().style.cursor = '';
            map.off('mousemove', handleMeasureMouseMove);

        };

        const handleDrawCreated = (e) => {
            const layer = e.layer;

            if (areaDrawer && e.layerType === 'polygon') {
                const area = getPolygonArea(layer.getLatLngs()[0]);
                const areaHa = (area / 10000).toFixed(2);
                const areaKm = (area / 1000000).toFixed(4);
                const popupContent = `<b>Área:</b><br>${area.toFixed(2)} m²<br>${areaHa} ha<br>${areaKm} km²`;
                layer.bindPopup(popupContent).openPopup();
            }

            drawnItems.addLayer(layer);

            if (areaDrawer) {
                areaDrawer = null;
            }
            if (currentDrawer) {
                currentDrawer = null;
            }
            closeAll();
        };

        // Create an array of modals for easy iteration
        const modals = [measureModal, drawModal, downloadModal, uploadModal, calibrationModal];

        // Add 'X' click logic to close all modals
        modals.forEach(modal => {
            const closeIcon = modal.querySelector('.fa-times');
            if (closeIcon) {
                closeIcon.style.cursor = 'pointer'; // Ensure pointer cursor
                closeIcon.onclick = (e) => {
                    e.stopPropagation(); // Prevent bubbling just in case
                    closeAll();
                };
            }
        });

        const handleDocumentClick = (e) => {
            // Check if the click is outside all modals and not on a toolbar button
            const clickedInsideModal = modals.some(modal => modal.contains(e.target));
            const clickedOnToolbarBtn = e.target.closest('.invvial-tool-btn');

            if (!clickedInsideModal && !clickedOnToolbarBtn) {
                closeAll();
            }
        };

        // Attach global click listener. useCapture = true to catch it early if needed, or false.
        // Usually bubbling phase (false) is fine, but we need to match how stopPropagation is used elsewhere.
        // We'll attach to document.body or document
        document.addEventListener('click', handleDocumentClick);


        // --- Adjuntar y Limpiar Listeners ---
        map.on('mousemove', handleCoordsMouseMove).on('mouseout', handleCoordsMouseOut);
        map.on(L.Draw.Event.CREATED, handleDrawCreated);
        map.on(L.Draw.Event.DRAWSTART, handleDrawStart).on(L.Draw.Event.DRAWSTOP, handleDrawStop);
        map.on('click', handleMapClick).on('dblclick', handleMapDoubleClick);
        map.on('zoomstart', () => map.closePopup()); // Close popup on zoom start
        map.on('click', () => map.closePopup());     // ensure click anywhere on map closes popup

        return () => {
            isComponentMounted = false;
            // Remove global click listener
            document.removeEventListener('click', handleDocumentClick);

            if (map) {
                map.isInitialized = false;
            }
            map.off('mousemove', handleCoordsMouseMove).off('mouseout', handleCoordsMouseOut);
            map.off(L.Draw.Event.CREATED, handleDrawCreated);
            map.off(L.Draw.Event.DRAWSTART, handleDrawStart).off(L.Draw.Event.DRAWSTOP, handleDrawStop);
            map.off('click', handleMapClick).off('dblclick', handleMapDoubleClick);
            map.off('mousemove', handleMeasureMouseMove);
            coordControl.remove();
            toolbarControl.remove();

            [measureModal, drawModal, downloadModal, uploadModal, calibrationModal].forEach(modal => {
                // Safely remove modal from its parent if it exists
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            });
        };
    }, [map]);

    React.useEffect(() => {
        if (!map || !highlightedTramoId || !geoJsonLayerRef.current) return;

        geoJsonLayerRef.current.eachLayer(layer => {
            // Reset style to the default one from the initial style function
            geoJsonLayerRef.current.resetStyle(layer);

            if (layer.feature.properties.id === highlightedTramoId) {
                // Apply a special highlight style
                layer.setStyle({ color: 'yellow', weight: 7 });
                // Optional: bring the layer to the front
                layer.bringToFront();
                map.fitBounds(layer.getBounds(), { maxZoom: 14 });
            }
        });

    }, [highlightedTramoId, map]); // Dependency on highlightedTramoId

    // Componente React para la galería de imágenes del popup
    const ImageGallery = ({ imageProp, onShowDetails }) => {
        const [currentIndex, setCurrentIndex] = useState(0);

        // Normalize the input to always be an array of objects with a `url` property
        const images = (imageProp || []).map(item => {
            if (typeof item === 'string') {
                return { url: item }; // Convert string to object
            }
            return item; // It's already an object
        }).filter(item => item && item.url); // Ensure we only have valid items

        if (images.length === 0) {
            return (
                <div style={{ marginTop: '5px', textAlign: 'center' }}>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>No hay imágenes.</p>
                    <button
                        onClick={onShowDetails}
                        style={{
                            display: 'block',
                            marginTop: '5px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        Ver detallado
                    </button>
                </div>
            );
        }

        const goToPrevious = () => {
            setCurrentIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : 0));
        };

        const goToNext = () => {
            setCurrentIndex(prevIndex => (prevIndex < images.length - 1 ? prevIndex + 1 : prevIndex));
        };

        return (
            <div style={{ marginTop: '5px', textAlign: 'center' }}>
                <img
                    src={images[currentIndex].url}
                    alt="Elemento del mapa"
                    className="popup-image"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <button onClick={goToPrevious} disabled={currentIndex === 0}>Anterior</button>
                    <span>{`${currentIndex + 1} de ${images.length}`}</span>
                    <button onClick={goToNext} disabled={currentIndex === images.length - 1}>Siguiente</button>
                </div>

                <button
                    onClick={onShowDetails}
                    style={{
                        display: 'block',
                        marginTop: '5px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    Ver detallado
                </button>
            </div>
        );
    };

    const markerRefMap = React.useRef({});
    const popupRoots = React.useRef({});

    const getIcon = React.useCallback((zoom, type, subtype = '', elementData = null) => {
        let iconSize = [24, 24]; // Increased base size
        let iconAnchor = [12, 24];
        let popupAnchor = [0, -24];

        // Default sizing for alcantarillas/badenes
        if (zoom > 15) {
            iconSize = [42, 42]; // Was 32x32
            iconAnchor = [21, 42];
            popupAnchor = [0, -42];
        } else if (zoom > 13) {
            iconSize = [32, 32]; // Was 24x24
            iconAnchor = [16, 32];
            popupAnchor = [0, -32];
        }

        // Custom sizing for Puentes and Muros (Larger)
        if (type === 'puente' || type === 'muro') {
            if (zoom > 15) {
                iconSize = [64, 64]; // Was 48x48
                iconAnchor = [32, 64];
                popupAnchor = [0, -64];
            } else if (zoom > 13) {
                iconSize = [48, 48]; // Was 36x36
                iconAnchor = [24, 48];
                popupAnchor = [0, -48];
            } else {
                iconSize = [32, 32]; // Was 24x24
                iconAnchor = [16, 32];
                popupAnchor = [0, -32];
            }
        }

        // Custom sizing for Canteras and Fuentes (Vertical Pin aspect ratio ~ 0.72)
        if (type === 'cantera' || type === 'fuente') {
            if (zoom > 15) {
                iconSize = [46, 64]; // Was 32x44 -> significantly larger
                iconAnchor = [23, 64];
                popupAnchor = [0, -64];
            } else if (zoom > 13) {
                iconSize = [34, 47]; // Was 24x33
                iconAnchor = [17, 47];
                popupAnchor = [0, -47];
            } else {
                iconSize = [22, 30]; // Was 16x22
                iconAnchor = [11, 30];
                popupAnchor = [0, -30];
            }
        }


        if (type === 'zona_critica') {
            if (zoom > 15) {
                iconSize = [40, 40];
                iconAnchor = [20, 40];
                popupAnchor = [0, -40];
            } else {
                iconSize = [28, 28];
                iconAnchor = [14, 28];
                popupAnchor = [0, -28];
            }
        }

        let iconUrl = '';
        if (type === 'alcantarilla') {
            iconUrl = '/imgs/alcantarilla_icon.png';
        } else if (type === 'baden') {
            iconUrl = '/imgs/baden_icon.svg';
        } else if (type === 'puente') {
            iconUrl = '/imgs/puente_icon.svg';
        } else if (type === 'muro') {
            iconUrl = '/imgs/muro_icon.svg';
        } else if (type === 'cantera') {
            iconUrl = '/imgs/cantera_icon.svg';
        } else if (type === 'fuente') {
            iconUrl = '/imgs/fuente_icon.svg';
        } else if (type === 'hitos_kilometricos') {
            // ... existing hitos logic ...
            const size = Math.max(20, zoom * 2.5);
            const iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="${size}" height="${size}" style="filter: drop-shadow(3px 3px 2px rgba(0,0,0,0.4));">
                <defs>
                    <linearGradient id="postGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#e0e0e0;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#ffffff;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#d0d0d0;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#404040;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#000000;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#303030;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <ellipse cx="15" cy="38" rx="10" ry="2" fill="rgba(0,0,0,0.3)" />
                <path d="M5 10 L 5 36 Q 15 40 25 36 L 25 10 Z" fill="url(#postGradient)" stroke="#999" stroke-width="0.5"/>
                <path d="M5 10 L 5 6 Q 15 2 25 6 L 25 10 Q 15 14 5 10 Z" fill="url(#capGradient)" stroke="none"/>
                <ellipse cx="15" cy="6" rx="10" ry="2" fill="#555" />
                <rect x="8" y="15" width="14" height="14" rx="2" fill="#fff" stroke="#ccc" stroke-width="0.5" />
                <text x="15" y="25" font-size="10" text-anchor="middle" font-weight="900" fill="#000" font-family="Arial Black, Arial, sans-serif">K</text>
            </svg>
            `;
            return L.divIcon({
                className: 'custom-icon',
                html: iconSvg,
                iconSize: [size, size],
                iconAnchor: [size / 2, size],
                popupAnchor: [0, -size]
            });
        }
        else if (type === 'senales_informativas') {
            iconUrl = '/imgs/senal_informativa_icon.svg';
        } else if (type === 'senales_preventivas') {
            iconUrl = '/imgs/senal_preventiva_icon.svg';
        } else if (type === 'zona_critica') {
            const t = (subtype || '').toUpperCase();
            if (t.includes('DESPRENDIMIENTO') || t.includes('TALUD') || t.includes('DESLIZAMIENTO')) {
                iconUrl = '/imgs/zona_deslizamiento.svg';
            } else if (t.includes('AHUELLAMIENTO')) {
                iconUrl = '/imgs/ahuellamiento.svg';
            } else {
                iconUrl = '/imgs/zona_critica.svg';
            }
        } else if (type === 'interferencia_electrica' || (typeof subtype === 'string' && subtype.toLowerCase().includes('poste'))) {
            iconUrl = '/imgs/interferencia_icon.svg';
        } else if (type === 'estructura_existente') {
            iconUrl = '/imgs/estructura_icon.svg';
            // Custom sizing for structures if needed, reusing standard for now
            if (zoom > 15) {
                iconSize = [42, 42];
                iconAnchor = [21, 42];
                popupAnchor = [0, -42];
            } else {
                iconSize = [32, 32];
                iconAnchor = [16, 32];
                popupAnchor = [0, -32];
            }

        } else {
            // Fallback/Default
            // Check if it might be an estructura by properties?
            if (elementData && elementData.progresiva_inicio) {
                // Estructuras usually have progresiva_inicio
                iconUrl = '/imgs/estructura_icon.svg';
            } else {
                iconUrl = '/imgs/alcantarilla_icon.png';
            }
        }

        return L.icon({
            iconUrl: iconUrl,
            iconSize: iconSize,
            iconAnchor: iconAnchor,
            popupAnchor: popupAnchor
        });
    }, []);

    // Efecto para RENDERIZAR los marcadores de alcantarillas
    React.useEffect(() => {
        try {
            if (!map || !alcantarillasData) return;

            const alcantarillasLayer = alcantarillasLayerRef.current;

            const formatProgresiva = (value) => {
                if (value === null || value === undefined) return '';
                const num = Number(value);
                if (isNaN(num)) return value;
                const km = Math.floor(num / 1000);
                const m = Math.round(num % 1000);
                return `${km}+${m.toString().padStart(3, '0')}`;
            };



            const renderMarkers = () => {
                alcantarillasLayer.clearLayers();
                markerRefMap.current = {};
                const zoom = map.getZoom();

                alcantarillasData.forEach(alcantarilla => {
                    if (typeof alcantarilla.latitud === 'number' && !isNaN(alcantarilla.latitud) &&
                        typeof alcantarilla.longitud === 'number' && !isNaN(alcantarilla.longitud)) {

                        // Normalize type for robust comparison
                        const normalizedType = String(alcantarilla.type || '').trim();
                        // DEBUG: Check what is actually being passed
                        if (normalizedType !== 'alcantarilla' && normalizedType !== 'baden') {
                            console.log('Rendering marker type:', normalizedType);
                        }
                        const icon = getIcon(zoom, normalizedType, alcantarilla.tipo, alcantarilla);

                        const marker = L.marker([alcantarilla.latitud, alcantarilla.longitud], { icon: icon });

                        marker.on('click', (e) => {
                            L.DomEvent.stop(e); // Keep this to prevent map click events

                            const targetZoom = 18;
                            const latLng = [alcantarilla.latitud, alcantarilla.longitud];

                            // Proyectar a píxeles, restar offset en Y (mover centro arriba -> marcador baja), y desproyectar
                            const point = map.project(latLng, targetZoom);
                            const targetPoint = point.subtract([0, 150]); // 150px de offset hacia arriba
                            const targetLatLng = map.unproject(targetPoint, targetZoom);

                            map.flyTo(targetLatLng, targetZoom, {
                                animate: true,
                                duration: 1.5
                            });

                            if (onAlcantarillaClick) {
                                onAlcantarillaClick(alcantarilla);
                            }
                        });

                        // Use a robust, unique ID for the popup container
                        const popupContainerId = `popup-gallery-${alcantarilla.type}-${alcantarilla.id || alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro}`;

                        let typeLabel = 'Elemento';
                        let idValue = alcantarilla.id;

                        // Bind the shared container to the marker
                        marker.bindPopup(popupContainer, {
                            maxWidth: 300,
                            minWidth: 200
                        });

                        marker.on('popupopen', () => {
                            // Calculate display values
                            let typeLabel = 'Elemento';
                            let idValue = alcantarilla.id;
                            let elementImages = alcantarilla.images || alcantarilla.imageUrls || [];

                            if (alcantarilla.type === 'alcantarilla') {
                                typeLabel = 'Alcantarilla';
                                idValue = alcantarilla.codigo || alcantarilla.id_alcantarilla;
                            } else if (alcantarilla.type === 'baden') {
                                typeLabel = 'Badén';
                                idValue = alcantarilla.codigo || alcantarilla.id_baden;
                            } else if (alcantarilla.type === 'puente') {
                                typeLabel = 'Puente';
                                idValue = alcantarilla.nombre || alcantarilla.id_puente;
                            } else if (alcantarilla.type === 'muro') {
                                typeLabel = 'Muro';
                                idValue = alcantarilla.id_muro;
                            } else if (alcantarilla.type === 'cantera') {
                                typeLabel = 'Cantera';
                                idValue = alcantarilla.item_number ? `${alcantarilla.item_number}` : (alcantarilla.progresiva || alcantarilla.id);
                            } else if (alcantarilla.type === 'fuente') {
                                typeLabel = 'Fuente de Agua';
                                idValue = alcantarilla.item_number ? `${alcantarilla.item_number}` : (alcantarilla.progresiva || alcantarilla.id);
                            } else if (alcantarilla.type === 'zona_critica') {
                                typeLabel = alcantarilla.tipo || 'Zona Crítica';
                                idValue = alcantarilla.codigo || alcantarilla.id_zona_critica;
                                if (alcantarilla.numero_seguimiento) {
                                    idValue += ` (Seg: ${alcantarilla.numero_seguimiento})`;
                                }
                            } else if (alcantarilla.type === 'interferencia_electrica') {
                                typeLabel = 'Interferencia Eléctrica';
                                idValue = alcantarilla.tipo_interferencia || alcantarilla.id;
                            } else if (alcantarilla.type === 'senales_informativas' || alcantarilla.type === 'senales_preventivas' || alcantarilla.type === 'hitos_kilometricos') {
                                if (alcantarilla.type === 'hitos_kilometricos') {
                                    typeLabel = 'Hito Kilométrico';
                                    idValue = `${alcantarilla.codigo} (Prog: ${alcantarilla.progresiva || 'S/D'})`;
                                } else {
                                    typeLabel = alcantarilla.type === 'senales_preventivas' ? 'Señal Preventiva' : 'Señal Informativa';
                                    idValue = alcantarilla.codigo;
                                }

                                // Lookup images for signals and hitos
                                if (graphicsImages && alcantarilla.panel_fotografico_codigo) {
                                    const code = String(alcantarilla.panel_fotografico_codigo).trim();
                                    elementImages = graphicsImages.filter(img => {
                                        const imgCode = String(img.panel_fotografico_codigo || '').trim();
                                        const imgIndex = img.index ? String(img.index).trim() : '';

                                        // Extract filename from URL (e.g., "http://.../360.jpg" -> "360")
                                        let urlFileName = '';
                                        if (img.url) {
                                            const parts = img.url.split('/');
                                            const fileNameWithExt = parts[parts.length - 1];
                                            urlFileName = fileNameWithExt.split('.')[0]; // Remove extension
                                        }

                                        // Use strict equality for all checks
                                        return imgCode === code || imgIndex === code || urlFileName === code;
                                    });
                                }
                            }

                            setActivePopup({
                                ...alcantarilla,
                                typeLabel,
                                idValue,
                                images: elementImages
                            });
                        });

                        marker.on('popupclose', () => {
                            setActivePopup(null);
                        });

                        alcantarillasLayer.addLayer(marker);
                        // Use a robust key for the marker ref map
                        // Use a robust key for the marker ref map
                        const markerKey = alcantarilla.uniqueId || alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro || alcantarilla.id_zona_critica || alcantarilla.id_estructura;
                        if (markerKey) {
                            markerRefMap.current[markerKey] = marker;
                        }

                    } else if (alcantarilla.type === 'estructura_existente') {
                        // --- LOGICA ESTRUCTURA EXISTENTE (Segmento) ---

                        // 1. Validar coordenadas de Inicio y Fin
                        const hasStart = typeof alcantarilla.latitud_inicio === 'number';
                        const hasEnd = typeof alcantarilla.latitud_final === 'number';

                        if (hasStart && hasEnd) {
                            // --- A. Dibujar Línea Simplificada (Performance Fix) ---
                            // NOTA: Se ha deshabilitado el cálculo de turf.lineSlice aquí por problemas de rendimiento masivo.
                            // Solo dibujaremos lineas rectas en el mapa general. El detalle real se ve en el MiniMap del popup/detalle.

                            const polyline = L.polyline([
                                [alcantarilla.latitud_inicio, alcantarilla.longitud_inicio],
                                [alcantarilla.latitud_final, alcantarilla.longitud_final]
                            ], { color: '#FFFF00', weight: 6, dashArray: '10, 10' }).addTo(alcantarillasLayer);

                            // Bind popup if needed
                            // polyline.bindPopup(...) - ya tenemos marcadores de inicio/fin con popups.
                            // Si queremos popup en la linea:
                            polyline.bindPopup(`<b>Tramo Estructura:</b> ${formatProgresiva(alcantarilla.progresiva_inicio)} - ${formatProgresiva(alcantarilla.progresiva_final)}`);


                            /* LOGICA COMENTADA POR PERFORMANCE
                            const routeLayer = geoJsonLayerRef.current;
                            let slicedGeoJSON = null;

                             if (routeLayer) {
                                // Buscar en las capas del KML cuál contiene estos puntos (o está más cerca)
                                // Para simplificar, iteramos y buscamos el tramo donde encajen mejor o simplemente el primero que funcione??
                                // Mejor estrategia: Usar turf.lineSlice en cada LineString del KML y ver cuál tiene sentido?
                                // O simplemente calcular la distancia de los puntos a la linea.

                                const startPt = turf.point([alcantarilla.longitud_inicio, alcantarilla.latitud_inicio]);
                                const endPt = turf.point([alcantarilla.longitud_final, alcantarilla.latitud_final]);

                                routeLayer.eachLayer((layer) => {
                                    if (slicedGeoJSON) return; // Ya encontramos uno

                                    if (layer.feature && (layer.feature.geometry.type === 'LineString' || layer.feature.geometry.type === 'MultiLineString')) {
                                        try {
                                            // Convert Leaflet latlngs to Turf LineString
                                            // layer.toGeoJSON() da el feature geojson
                                            const lineGeoJson = layer.toGeoJSON();

                                            // Verificar si los puntos estan cerca de esta linea (opcional, por ahora slicing directo)
                                            // Nota: lineSlice recorta entre el punto inicial y final proyectados en la linea.
                                            // Si la linea es incorrecta (otro tramo), el resultado podría ser extraño o valido geometricamente pero erroneo.
                                            // Asumimos que los puntos caen "sobre" la linea correcta debido al calculo del backend.

                                            // Calcular distancias minimas para confirmar que es el tramo correcto?
                                            // Por performance, vamos a intentar slicear. 

                                            const sliced = turf.lineSlice(startPt, endPt, lineGeoJson);
                                            if (sliced) {
                                                // Validar longitud? Si es demasiado largo quizas equivocamos de tramo? 
                                                // Ojo: Si los puntos estan en tramos diferentes esto falahara.
                                                // Asumimos mismo tramo.

                                                // Check if points are actually close to this line?
                                                const d1 = turf.pointToLineDistance(startPt, lineGeoJson);
                                                const d2 = turf.pointToLineDistance(endPt, lineGeoJson);

                                                if (d1 < 0.1 && d2 < 0.1) { // 100 metros tolerancia? (turf default units kilometers?) yes km. 0.1km = 100m.
                                                    slicedGeoJSON = sliced;
                                                }
                                            }
                                        } catch (err) {
                                            console.warn('Error slicing line for structure:', err);
                                        }
                                    }
                                });
                            }

                            // Dibujar la linea (Slice o Recta Fallback)
                            if (slicedGeoJSON) {
                                const sliceLayer = L.geoJSON(slicedGeoJSON, {
                                    style: { color: '#FFFF00', weight: 6, opacity: 0.9 } // Amarillo brillante
                                }).addTo(alcantarillasLayer);
                                sliceLayer.bindPopup(`<b>Tramo Estructura:</b> ${formatProgresiva(alcantarilla.progresiva_inicio)} - ${formatProgresiva(alcantarilla.progresiva_final)}`);
                            } else {
                                // Fallback: Linea Recta
                                const polyline = L.polyline([
                                    [alcantarilla.latitud_inicio, alcantarilla.longitud_inicio],
                                    [alcantarilla.latitud_final, alcantarilla.longitud_final]
                                ], { color: '#FFFF00', weight: 6, dashArray: '10, 10' }).addTo(alcantarillasLayer);
                                polyline.bindPopup(`<b>Tramo Estructura:</b> ${formatProgresiva(alcantarilla.progresiva_inicio)} - ${formatProgresiva(alcantarilla.progresiva_final)}`);
                            }
                            */


                            // --- B. Dibujar Marcadores Inicio/Fin ---
                            // --- B. Dibujar Marcadores Inicio/Fin ---
                            const createMarker = (lat, lon, label, isStart) => {
                                // Start: Triángulo Verde, End: Cuadrado Rojo
                                const html = isStart
                                    ? `<div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 20px solid #00FF00; filter: drop-shadow(0px 0px 2px black);"></div>`
                                    : `<div style="background-color:#FF0000; width:16px; height:16px; border:2px solid white; box-shadow: 0 0 4px black;"></div>`;

                                const icon = L.divIcon({
                                    className: 'custom-div-icon',
                                    html: html,
                                    iconSize: [20, 20],
                                    iconAnchor: [10, 10]
                                });
                                const m = L.marker([lat, lon], { icon: icon, zIndexOffset: 1000 }).addTo(alcantarillasLayer);

                                // USAR POPUP REACTIVO (CON CARRUSEL)
                                // Bind del container compartido
                                m.bindPopup(popupContainer, { minWidth: 200, maxWidth: 300 });

                                m.on('popupopen', () => {
                                    // Construct the popup data object
                                    const popupData = {
                                        ...alcantarilla,
                                        typeLabel: 'Estructura Existente',
                                        idValue: `${formatProgresiva(alcantarilla.progresiva_inicio)} - ${formatProgresiva(alcantarilla.progresiva_final)}`, // Combined range for clarity
                                        images: alcantarilla.images || alcantarilla.imageUrls || [] // Ensure images are passed
                                    };
                                    setActivePopup(popupData);
                                });

                                m.on('popupclose', () => {
                                    setActivePopup(null);
                                });

                                // Restore click functionality for "zoom" or selection in parent
                                m.on('click', (e) => {
                                    L.DomEvent.stop(e); // Prevent map click (which closes popups)
                                    if (onAlcantarillaClick) {
                                        onAlcantarillaClick(alcantarilla);
                                    }
                                });

                                return m;
                            };

                            // Store ref for zooming (using the first marker - start)
                            // We can store the start marker as the reference for the structure
                            // Access the start marker via the createMarker return value (we'll capture the first one)
                            // But createMarker is void in my previous valid code, wait, I made it return m in the LAST edit.

                            // Re-structure to be clean:
                            const mStart = createMarker(alcantarilla.latitud_inicio, alcantarilla.longitud_inicio, "Inicio Estructura", true);
                            // createMarker(alcantarilla.latitud_final, alcantarilla.longitud_final, "Fin Estructura", false); // DISABLED by user request to avoid overlap

                            // Add click handler to polyline as well to be safe?
                            // polyline.on('click', ...) if we want line clicks to work.

                            // Store ref for zooming
                            const structureKey = alcantarilla.id_estructura || alcantarilla.id;
                            if (structureKey && mStart) {
                                markerRefMap.current[structureKey] = mStart;
                            }
                        }

                    } else {
                        // Fallback for unknown types or catch-all
                        const elementId = alcantarilla.id || alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro || 'N/A';
                        // Only warn if it's not one of the handled types above
                        if (!['alcantarilla', 'baden', 'puente', 'muro', 'cantera', 'fuente', 'zona_critica'].includes(alcantarilla.type)) {
                            console.warn(`Tipo de elemento desconocido o coordenadas inválidas: ${elementId}`);
                        }
                    }
                });
            };

            renderMarkers();

            if (alcantarillasData.length > 0) {
                const latLngs = alcantarillasData.map(a => [a.latitud, a.longitud]).filter(p => p[0] !== undefined && p[1] !== undefined);
                if (latLngs.length > 0) {
                    const bounds = L.latLngBounds(latLngs);
                    if (bounds.isValid() && map && map.getContainer()) {
                        try {
                            map.fitBounds(bounds, { maxZoom: 15 });
                        } catch (error) {
                            console.error('ERROR: Failed to fit map bounds:', error);
                        }
                    }
                }
            }

            return () => {
                alcantarillasLayer.clearLayers();
            };
        } catch (error) {
            console.error('ERROR: Uncaught error in alcantarillas useEffect:', error);
        }
    }, [alcantarillasData, map, onShowDetails, graphicsImages]);

    // NEW: Zoom to highlighted element
    useEffect(() => {
        if (highlightedTramoId && map && markerRefMap.current[highlightedTramoId]) {
            const marker = markerRefMap.current[highlightedTramoId];
            const targetLatLng = marker.getLatLng();
            const targetZoom = 18;

            // Calcular nuevo centro para que el punto aparezca más abajo (desplazar centro hacia arriba)
            // Convertir LatLng a Pixels, restar offset en Y, convertir de nuevo
            const targetPoint = map.project(targetLatLng, targetZoom);
            const mapSize = map.getSize();
            const offset = mapSize.y * 0.25; // Desplazar 25% de la altura hacia arriba (el punto baja)

            const newCenterPoint = targetPoint.subtract([0, offset]);
            const newCenterLatLng = map.unproject(newCenterPoint, targetZoom);

            map.flyTo(newCenterLatLng, targetZoom, {
                animate: true,
                duration: 1.5
            });
            // Optional: Open popup
            marker.openPopup();
        }
    }, [highlightedTramoId, map]);


    return createPortal(
        activePopup ? (
            <div>
                <b>{activePopup.typeLabel}:</b> {activePopup.idValue}<br />
                <ImageGallery imageProp={activePopup.images} onShowDetails={() => onShowDetails(activePopup)} />
            </div>
        ) : null,
        popupContainer
    );
};

const Geoite = ({ onTramoSelect, highlightedTramoId, height = '90vh', alcantarillasData, onAlcantarillaClick, onRouteLoaded, onShowDetails, graphicsImages }) => {
    // Coordenadas para centrar el mapa en Perú, ya que no hay ruta inicial
    const center = [-12, -75];

    return (
        <div style={{ height: '500px', width: '100%', minHeight: 0 }}>
            <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
                <LayersControl position="topright">
                    <LayersControl.BaseLayer name="Estándar"> <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' /> </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer checked name="Topográfico"> <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/30/">CC-BY-SA</a>)' /> </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satélite"> <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' /> </LayersControl.BaseLayer>
                </LayersControl>
                <MapLogic
                    initialRoute={null}
                    onTramoSelect={onTramoSelect}
                    highlightedTramoId={highlightedTramoId}
                    alcantarillasData={alcantarillasData}
                    onAlcantarillaClick={onAlcantarillaClick}
                    onRouteLoaded={onRouteLoaded}
                    onShowDetails={onShowDetails}
                    graphicsImages={graphicsImages}
                />
            </MapContainer>
        </div>
    );
};

export default Geoite;