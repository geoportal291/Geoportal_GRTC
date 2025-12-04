import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { MapContainer, TileLayer, LayersControl, useMap, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { fromLatLon, toLatLon } from 'utm';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import alertify from 'alertifyjs'; // Add this line
import './geoite.css';
import axiosInstance from '../../../../../api/axios';
import { saveAs } from 'file-saver';


// Este componente encapsula TODA la lógica imperativa para no causar re-renders.
const MapLogic = ({ initialRoute, onTramoSelect, highlightedTramoId, alcantarillasData, onAlcantarillaClick, onRouteLoaded, onShowDetails }) => {
    const map = useMap();
    const geoJsonLayerRef = React.useRef(null);
    const alcantarillasLayerRef = React.useRef(new L.FeatureGroup()); // FeatureGroup para alcantarillas
    const [calibrationData, setCalibrationData] = useState(null); // NEW: State for calibration
    const calibrationDataRef = useRef(null); // NEW: Ref to avoid stale closures

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
        const measureModal = L.DomUtil.create('div', 'measure-modal', map.getContainer());
        L.DomEvent.disableClickPropagation(measureModal);
        const measureHeader = L.DomUtil.create('div', 'measure-modal-header', measureModal);
        const measureCloseButton = L.DomUtil.create('span', 'measure-modal-close', measureHeader);
        measureCloseButton.innerHTML = '&times;';
        measureHeader.appendChild(document.createTextNode('Mediciones'));
        const measureContent = L.DomUtil.create('div', 'measure-modal-content', measureModal);
        const measureButtonContainer = L.DomUtil.create('div', '', measureContent);

        const distanceButton = L.DomUtil.create('a', 'leaflet-control-custom-button leaflet-control-distance-button', measureButtonContainer);
        distanceButton.innerHTML = '↔';
        distanceButton.title = 'Medir distancia';

        const areaButton = L.DomUtil.create('a', 'leaflet-control-custom-button', measureButtonContainer);
        areaButton.innerHTML = '⬟';
        areaButton.title = 'Calcular área de polígono';
        areaButton.style.marginLeft = '5px';

        const clearButton = L.DomUtil.create('a', 'leaflet-control-custom-button', measureButtonContainer);
        clearButton.innerHTML = '🗑️';
        clearButton.title = 'Limpiar medición';
        clearButton.style.marginLeft = '5px';

        const distanceDisplay = L.DomUtil.create('div', 'distance-display', measureContent);
        distanceDisplay.innerHTML = 'Seleccione una herramienta.';

        // --- NEW: Lógica para Ubicar Progresiva ---
        const progresivaContainer = L.DomUtil.create('div', 'progresiva-container', measureContent);
        progresivaContainer.innerHTML = `
            <hr style="margin: 15px 0;">
            <div class="input-group">
                <label for="progresivaInput" style="font-weight: bold; margin-bottom: 5px;">Ubicar Progresiva:</label>
                <input type="text" id="progresivaInput" placeholder="Ej: 4+780" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
            </div>
            <button id="ubicarProgresivaBtn" style="padding: 10px; width: 100%; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                Ubicar Punto
            </button>
        `;

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
            const progresivaInput = document.getElementById('progresivaInput');
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

        const ubicarProgresivaBtn = progresivaContainer.querySelector('#ubicarProgresivaBtn');
        ubicarProgresivaBtn.onclick = handleUbicarProgresiva;


        // --- Lógica del Modal de Dibujo ---
        const drawModal = L.DomUtil.create('div', 'measure-modal', map.getContainer());
        drawModal.style.width = '400px'; // Ancho del modal de dibujo
        // drawModal.style.left = '95px'; // Posición inicial para que no se solape
        L.DomEvent.disableClickPropagation(drawModal);
        const drawHeader = L.DomUtil.create('div', 'measure-modal-header', drawModal);
        const drawCloseButton = L.DomUtil.create('span', 'measure-modal-close', drawHeader);
        drawCloseButton.innerHTML = '&times;';
        drawHeader.appendChild(document.createTextNode('Dibujar'));
        const drawContent = L.DomUtil.create('div', 'measure-modal-content', drawModal);
        drawContent.innerHTML = `
            <div class="measure-modal-content">
                <h3>Opciones de Dibujo</h3>
                <div class="input-group">
                    <label for="inputTypeSelect">Tipo de Entrada:</label>
                    <select id="inputTypeSelect">
                        <option value="coordinates">Coordenadas</option>
                        <option value="kml">KML</option>
                    </select>
                </div>

                <div id="coordinateInputSection"> 
                    <div>
                        <h4>Ingresar Coordenadas</h4>
                        <div class="input-group">
                            <label for="projectionSelect">Proyección:</label>
                            <select id="projectionSelect">
                                <option value="geographic">GEOGRÁFICAS</option>
                                <option value="utm" selected>UTM</option>
                            </select>
                        </div>
                        <div class="input-group" id="utmZoneGroup" style="display: none;">
                            <label for="utmZoneSelect">Zona:</label>
                            <select id="utmZoneSelect">
                                <option value="17">ZONA17</option>
                                <option value="18" selected>ZONA18</option>
                                <option value="19">ZONA19</option>
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label for="geometryTypeSelect">Tipo de Geometría:</label>
                        <select id="geometryTypeSelect">
                            <option value="point">PUNTO</option>
                        </select>
                    </div>
                    <div id="geographicCoordInputs"> 
                        <div class="input-group">
                            <label for="coordFormatSelect">Formato:</label>
                            <select id="coordFormatSelect">
                                <option value="decimal">DECIMAL</option>
                                <option value="degrees">GRADOS (GMS)</option>
                            </select>
                        </div>

                        <div id="decimalInputs">
                            <div class="input-group">
                                <label for="lonDecimal">Longitud:</label><input type="text" id="lonDecimal"/>
                            </div>
                            <div class="input-group">
                                <label for="latDecimal">Latitud:</label><input type="text" id="latDecimal"/>
                            </div>
                        </div>

                        <div id="degreesInputs" style="display: none;">
                            <div class="input-group">
                                <label for="lonDeg">Longitud:</label>
                                <input type="text" id="lonDeg" placeholder="G" class="gms-input"/>
                                <input type="text" id="lonMin" placeholder="M" class="gms-input"/>
                                <input type="text" id="lonSec" placeholder="S" class="gms-input"/>
                            </div>
                            <div class="input-group">
                                <label for="latDeg">Latitud:</label>
                                <input type="text" id="latDeg" placeholder="G" class="gms-input"/>
                                <input type="text" id="latMin" placeholder="M" class="gms-input"/>
                                <input type="text" id="latSec" placeholder="S" class="gms-input"/>
                            </div>
                        </div>
                    </div>

                    <div id="utmCoordInputs" style="display: none;">
                        <div class="input-group">
                            <label for="utmX">Latitud:</label><input type="text" id="utmX"/>
                        </div>
                        <div class="input-group">
                            <label for="utmY">Longitud:  </label><input type="text" id="utmY"/>
                        </div>
                    </div>
                </div> 

                <div id="kmlInputs" style="display: none; margin-top: 20px;">
                    <h4>Ingresar KML</h4>
                    <input type="file" id="kmlFileInput" accept=".kml" style="margin-bottom: 10px;"/>
                    <button id="processKmlBtn">PROCESAR KML</button>
                </div>

                <div class="button-group">
                    <button id="drawPointBtn">DIBUJAR</button>
                    <button id="clearCoordsBtn">LIMPIAR</button>
                </div>
            </div>
        `;

        // --- Lógica del Modal de Descarga ---
        const downloadModal = L.DomUtil.create('div', 'measure-modal', map.getContainer());
        L.DomEvent.disableClickPropagation(downloadModal);
        const downloadHeader = L.DomUtil.create('div', 'measure-modal-header', downloadModal);
        const downloadCloseButton = L.DomUtil.create('span', 'measure-modal-close', downloadHeader);
        downloadCloseButton.innerHTML = '&times;';
        downloadHeader.appendChild(document.createTextNode('Descargar Datos'));
        const downloadContent = L.DomUtil.create('div', 'measure-modal-content', downloadModal);

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

        downloadContent.innerHTML = `
          <p style="margin-top: 0; margin-bottom: 10px;">Exportar todas las geometrías dibujadas en el mapa.</p>
          <button id="exportKmlBtn" style="padding: 10px; width: 100%; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px;">
            Descargar como KML
          </button>
          <button id="exportShpBtn" style="padding: 10px; width: 100%; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Descargar como Shapefile (ZIP)
          </button>
        `;

        const exportKmlBtn = downloadContent.querySelector('#exportKmlBtn');
        if (exportKmlBtn) {
            exportKmlBtn.onclick = handleExportKML;
        }

        const exportShpBtn = downloadContent.querySelector('#exportShpBtn');
        if (exportShpBtn) {
            exportShpBtn.onclick = handleExportShapefile;
        }

        // --- NEW: Lógica del Modal de Subida ---
        const uploadModal = L.DomUtil.create('div', 'measure-modal', map.getContainer());
        L.DomEvent.disableClickPropagation(uploadModal);
        const uploadHeader = L.DomUtil.create('div', 'measure-modal-header', uploadModal);
        const uploadCloseButton = L.DomUtil.create('span', 'measure-modal-close', uploadHeader);
        uploadCloseButton.innerHTML = '&times;';
        uploadHeader.appendChild(document.createTextNode('Subir KML'));
        const uploadContent = L.DomUtil.create('div', 'measure-modal-content', uploadModal);

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
                // if (showAlerts) alertify.success('KML cargado y dibujado en el mapa.');

            } catch (error) {
                alertify.error('No se pudo cargar el KML desde la URL.');
            }
        };

        const handleKmlUpload = async () => {
            const kmlUploadInput = uploadContent.querySelector('#kmlUploadInput');
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

        const handleDeleteKml = async () => {
            alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar el KML de este proyecto? Esta acción no se puede deshacer.',
                async function () { // On OK - Make this async
                    try {
                        alertify.message('Eliminando KML...');
                        // Await the delete request
                        await axiosInstance.delete(`/api/proyectos/${projectId}/kml`);

                        // Clear all KML-related layers from the map
                        drawnItems.clearLayers();

                        alertify.success('El KML ha sido eliminado del proyecto.');
                    } catch (error) {
                        console.error("Error deleting KML:", error);
                        // Show specific error if available, otherwise a generic one
                        const errorMessage = error.response?.data?.error || 'No se pudo eliminar el KML.';
                        alertify.error(errorMessage);
                    }
                },
                function () { // On Cancel
                    alertify.error('Eliminación cancelada.');
                }
            );
        }; uploadContent.innerHTML = `
            <p style="margin-top: 0; margin-bottom: 10px;">Seleccione un archivo KML para guardarlo y mostrarlo en el mapa.</p>
            <input type="file" id="kmlUploadInput" accept=".kml" style="margin-bottom: 10px; width: 100%;"/>
            <button id="uploadKmlBtn" style="padding: 10px; width: 100%; background-color: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Subir y Mostrar KML
            </button>
        `;

        const uploadKmlBtn = uploadContent.querySelector('#uploadKmlBtn');
        if (uploadKmlBtn) {
            uploadKmlBtn.onclick = handleKmlUpload;
        }

        // Lógica para mostrar/ocultar campos de coordenadas según el formato
        const coordFormatSelect = document.getElementById('coordFormatSelect');
        const decimalInputs = document.getElementById('decimalInputs');
        const degreesInputs = document.getElementById('degreesInputs');

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
        const projectionSelect = document.getElementById('projectionSelect');
        const utmZoneGroup = document.getElementById('utmZoneGroup');
        const geographicCoordInputs = document.getElementById('geographicCoordInputs');
        const utmCoordInputs = document.getElementById('utmCoordInputs');

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
        const inputTypeSelect = document.getElementById('inputTypeSelect');
        const coordinateInputSection = document.getElementById('coordinateInputSection');
        const kmlInputs = document.getElementById('kmlInputs');

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
        const kmlFileInput = document.getElementById('kmlFileInput');
        const processKmlBtn = document.getElementById('processKmlBtn');

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
                    drawModal.style.display = 'none'; // Close modal after processing
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
        const drawPointBtn = document.getElementById('drawPointBtn');
        const clearCoordsBtn = document.getElementById('clearCoordsBtn');

        // Función para limpiar los campos de coordenadas
        const clearCoords = () => {
            // Campos decimales
            document.getElementById('lonDecimal').value = '';
            document.getElementById('latDecimal').value = '';
            // Campos grados
            document.getElementById('lonDeg').value = '';
            document.getElementById('lonMin').value = '';
            document.getElementById('lonSec').value = '';
            document.getElementById('latDeg').value = '';
            document.getElementById('latMin').value = '';
            document.getElementById('latSec').value = '';
            // Campos UTM
            document.getElementById('utmX').value = '';
            document.getElementById('utmY').value = '';
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
            const projectionType = document.getElementById('projectionSelect').value;

            if (projectionType === 'geographic') {
                let lat, lon;
                const coordFormat = document.getElementById('coordFormatSelect').value;

                if (coordFormat === 'decimal') {
                    lon = parseFloat(document.getElementById('lonDecimal').value);
                    lat = parseFloat(document.getElementById('latDecimal').value);
                } else { // grados (DMS)
                    const lonDeg = document.getElementById('lonDeg').value;
                    const lonMin = document.getElementById('lonMin').value;
                    const lonSec = document.getElementById('lonSec').value;
                    const latDeg = document.getElementById('latDeg').value;
                    const latMin = document.getElementById('latMin').value;
                    const latSec = document.getElementById('latSec').value;

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
                const utmX = parseFloat(document.getElementById('utmX').value);
                const utmY = parseFloat(document.getElementById('utmY').value);
                const utmZone = parseInt(document.getElementById('utmZoneSelect').value);

                if (isNaN(utmX) || isNaN(utmY) || isNaN(utmZone)) {
                    alertify.error('Por favor, ingrese coordenadas UTM válidas y seleccione una zona.');
                    return;
                }

                // Determine hemisphere for UTM conversion (assuming Southern Hemisphere for Peru)
                // For a more robust solution, you might need to infer hemisphere from Y coordinate or provide an explicit input.
                // Given the context of Peru (mostly Southern Hemisphere), we'll assume 'S' for now.
                // However, UTM zones can span both hemispheres. A more accurate approach would be to
                // ask the user for hemisphere or infer it from the Y coordinate range.
                // For simplicity, let's assume Southern Hemisphere for the given zones (17S, 18S, 19S).
                // The `utm` library's `toLatLon` function requires a zone letter.
                // For Southern Hemisphere, it's 'S'. For Northern, it's 'N'.
                // Since the zones are 17, 18, 19, which are typically in the Southern Hemisphere for Peru,
                // we'll use 'S'. If the user provides coordinates that fall into the Northern Hemisphere
                // for these zones, the conversion might be incorrect.
                const utmZoneLetter = 'M'; // Assuming Southern Hemisphere band letter for Peru's latitude range

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
            drawModal.style.display = 'none'; // Opcional: cerrar modal después de dibujar
            clearCoords(); // Limpiar campos después de dibujar
        };

        // Asignar evento al botón de dibujar
        drawPointBtn.onclick = drawPoint;

        // --- Función para validar entrada numérica ---
        const addNumericInputValidation = (inputId) => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value;
                    // Eliminar CUALQUIER caracter que no sea un dígito, un punto o un signo menos
                    // Esto removerá las comas directamente, como en "767,733" -> "767733"
                    value = value.replace(/[^-0-9.]/g, '');

                    // Asegura que el signo negativo solo esté al principio
                    // Si hay múltiples signos negativos, o uno en medio, elimina los extras y mantiene el inicial
                    const negativeCount = (value.match(/-/g) || []).length;
                    if (negativeCount > 0) {
                        const firstChar = value.charAt(0);
                        value = value.replace(/-/g, ''); // Remove all hyphens
                        if (firstChar === '-') {
                            value = '-' + value; // Add back if it was at the start
                        }
                    }

                    // Asegura que solo haya un punto decimal
                    const parts = value.split('.');
                    if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                    }

                    e.target.value = value;
                });
            }
        };

        // --- Asignar validación a los campos de coordenadas ---
        addNumericInputValidation('lonDecimal');
        addNumericInputValidation('latDecimal');
        addNumericInputValidation('utmX');
        addNumericInputValidation('utmY');



        // --- Contenedores de Controles Personalizados (topleft) ---

        // Botones individuales
        const mainMeasureButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        mainMeasureButton.innerHTML = '📏';
        mainMeasureButton.title = 'Abrir Mediciones';

        const mainDrawButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        mainDrawButton.innerHTML = '✏️';
        mainDrawButton.title = 'Abrir Herramientas de Dibujo';

        const mainUploadButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        mainUploadButton.innerHTML = '⬆️';
        mainUploadButton.title = 'Subir KML';

        const mainDownloadButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        mainDownloadButton.innerHTML = '⬇️';
        mainDownloadButton.title = 'Descargar Datos';

        const updateInfoButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        updateInfoButton.innerHTML = '💾';
        updateInfoButton.title = 'Actualizar Información';

        const deleteKmlButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        deleteKmlButton.innerHTML = '🗑️';
        deleteKmlButton.title = 'Eliminar KML del Proyecto';

        const calibrateButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        calibrateButton.innerHTML = '⚙️';
        calibrateButton.title = 'Calibrar Trazado';

        // Grupo 1: Medición, Dibujo, Actualización
        const group1Container = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(group1Container);
        group1Container.appendChild(mainMeasureButton);
        group1Container.appendChild(mainDrawButton);
        group1Container.appendChild(updateInfoButton);
        group1Container.appendChild(calibrateButton); // Add calibrate button
        const group1Controls = new L.Control({ position: 'topleft' });
        group1Controls.onAdd = function () { return group1Container; };
        group1Controls.addTo(map);

        // Grupo 2: Subir KML
        const group2Container = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(group2Container);
        group2Container.appendChild(mainUploadButton);
        const group2Controls = new L.Control({ position: 'topleft' });
        group2Controls.onAdd = function () { return group2Container; };
        group2Controls.addTo(map);

        // Grupo 3: Descargar y Eliminar
        const group3Container = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(group3Container);
        group3Container.appendChild(mainDownloadButton);
        group3Container.appendChild(deleteKmlButton);
        const group3Controls = new L.Control({ position: 'topleft' });
        group3Controls.onAdd = function () { return group3Container; };
        group3Controls.addTo(map);

        // --- NEW: Calibration Modal ---
        const calibrationModal = L.DomUtil.create('div', 'measure-modal', map.getContainer());
        L.DomEvent.disableClickPropagation(calibrationModal);
        const calibrationHeader = L.DomUtil.create('div', 'measure-modal-header', calibrationModal);
        const calibrationCloseButton = L.DomUtil.create('span', 'measure-modal-close', calibrationHeader);
        calibrationCloseButton.innerHTML = '&times;';
        calibrationHeader.appendChild(document.createTextNode('Calibrar Progresivas por Tramo'));
        const calibrationContent = L.DomUtil.create('div', 'measure-modal-content', calibrationModal);
        calibrationCloseButton.onclick = () => { calibrationModal.style.display = 'none'; };


        // --- KML Persistence ---
        const projectId = 24; // As per user request

        const loadInitialKml = async () => {
            try {
                const response = await axiosInstance.get(`/api/proyectos/${projectId}/kml`);
                if (response.data && response.data.url) {
                    const showAlerts = !window.hasShownInitialKmlAlert;
                    await loadKmlFromUrl(response.data.url, showAlerts);
                    if (showAlerts) {
                        // alertify.success('KML del proyecto cargado automáticamente.');
                        window.hasShownInitialKmlAlert = true;
                    }
                }
            } catch (error) {
                if (error.response && error.response.status !== 404) {
                } // 404 is a normal case (no KML set), so we ignore it.
            }
        };

        const loadInitialCalibrationData = async () => {
            try {
                const response = await axiosInstance.get(`/api/proyectos/${projectId}/calibracion`);
                setCalibrationData(response.data);
                calibrationDataRef.current = response.data;
                if (Object.keys(response.data).length > 0) {
                    // alertify.message('Datos de calibración cargados automáticamente.');
                }
            } catch (error) {
                if (error.response && error.response.status !== 404) {
                    console.error('Error loading calibration data:', error);
                    alertify.error('Error al cargar datos de calibración.');
                }
            }
        };

        loadInitialKml();
        loadInitialCalibrationData();



        // --- Lógica de visibilidad de modales ---
        mainMeasureButton.onclick = () => { measureModal.style.display = measureModal.style.display === 'none' ? 'block' : 'none'; };
        measureCloseButton.onclick = () => { measureModal.style.display = 'none'; };
        mainDrawButton.onclick = () => { drawModal.style.display = drawModal.style.display === 'none' ? 'block' : 'none'; };
        drawCloseButton.onclick = () => { drawModal.style.display = 'none'; };
        mainDownloadButton.onclick = () => { downloadModal.style.display = downloadModal.style.display === 'none' ? 'block' : 'none'; };
        downloadCloseButton.onclick = () => { downloadModal.style.display = 'none'; };
        mainUploadButton.onclick = () => { uploadModal.style.display = uploadModal.style.display === 'none' ? 'block' : 'none'; };
        uploadCloseButton.onclick = () => { uploadModal.style.display = 'none'; };

        calibrateButton.onclick = () => {
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
                        <td style="padding: 8px; border: 1px solid #ddd;"><input type="text" class="calib-input" data-tramo="${tramoName}" data-type="start" value="${currentCalib.start}" placeholder="Ej: 0+000" style="width: 100%; box-sizing: border-box;"></td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><input type="text" class="calib-input" data-tramo="${tramoName}" data-type="end" value="${currentCalib.end}" placeholder="Ej: 34+000" style="width: 100%; box-sizing: border-box;"></td>
                    </tr>
                `;
            });

            calibrationContent.innerHTML = `
                <p>Ingrese la progresiva oficial de inicio y fin para cada tramo del KML.</p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tramo</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Progresiva Inicio</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Progresiva Fin</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <button id="saveCalibrationBtn" style="padding: 10px; width: 100%; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 10px;">
                    Guardar Calibración
                </button>
                <button id="deleteCalibrationBtn" style="padding: 10px; width: 100%; background-color: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Borrar Calibración
                </button>
            `;

            calibrationModal.querySelector('#saveCalibrationBtn').onclick = async () => {
                const inputs = calibrationModal.querySelectorAll('.calib-input');
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
                    calibrationModal.style.display = 'none';
                    alertify.success('Datos de calibración guardados exitosamente en la base de datos.');
                } catch (error) {
                    console.error('Error saving calibration data:', error);
                    alertify.error('Error al guardar datos de calibración: ' + (error.response?.data?.error || error.message));
                }
            };

            calibrationModal.querySelector('#deleteCalibrationBtn').onclick = async () => {
                alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar TODOS los datos de calibración para este proyecto?',
                    async function () {
                        try {
                            await axiosInstance.delete(`/api/proyectos/${projectId}/calibracion`);
                            setCalibrationData(null); // Clear local state
                            calibrationDataRef.current = null;
                            calibrationModal.style.display = 'none';
                            alertify.success('Datos de calibración eliminados exitosamente.');
                        } catch (error) {
                            console.error('Error deleting calibration data:', error);
                            alertify.error('Error al eliminar datos de calibración: ' + (error.response?.data?.error || error.message));
                        }
                    },
                    function () { alertify.message('Eliminación cancelada.'); }
                );
            };


            calibrationModal.style.display = 'block';
        };

        deleteKmlButton.onclick = handleDeleteKml;

        const handleUpdateInfo = async () => {
            const geoJsonDrawn = drawnItems.toGeoJSON();
            const points = geoJsonDrawn.features.filter(feature => feature.geometry.type === 'Point');

            if (points.length === 0) {
                alertify.warning('No hay nuevos puntos para guardar.');
                return;
            }

            // FIXME: This needs to be obtained from the current project context
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

                // This endpoint needs to be created in your backend.
                // It should accept an array of points.
                const response = await axiosInstance.post('/api/puntos-mapa/bulk', { puntos: puntosParaGuardar });

                alertify.success(`${response.data.count} puntos guardados correctamente.`);

                // Remove saved points from the map to avoid re-saving
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

        // --- Lógica para hacer modales arrastrables ---
        const makeDraggable = (modal, header) => {
            let dragging = false, offset = [0, 0];
            header.onmousedown = (e) => {
                dragging = true; offset = [modal.offsetLeft - e.clientX, modal.offsetTop - e.clientY];
                document.onmousemove = (e) => { if (dragging) { modal.style.left = (e.clientX + offset[0]) + 'px'; modal.style.top = (e.clientY + offset[1]) + 'px'; } };
                document.onmouseup = () => { dragging = false; document.onmousemove = document.onmouseup = null; };
            };
        };
        makeDraggable(measureModal, measureHeader);
        makeDraggable(drawModal, drawHeader);
        makeDraggable(downloadModal, downloadHeader);
        makeDraggable(uploadModal, uploadHeader);
        makeDraggable(calibrationModal, calibrationHeader);

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

        clearButton.onclick = clearMeasurement;

        const handleCoordsMouseMove = (e) => {
            if (isDrawing || isMeasuring) {
                coordContainer.style.display = 'none'; // Ocultar si está dibujando o midiendo
                return;
            }

            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            const zoom = map.getZoom();

            // Cálculo aproximado de escala (metros por pixel * factor para convertir a escala 1:x)
            const metersPerPixel = 156543.03 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
            const scale = Math.round(metersPerPixel * 3779.52); // 1 metro = 3779.52 pulgadas

            // Coordenadas UTM
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
            // Desactivar otros botones
            L.DomUtil.removeClass(areaButton, 'active');
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

        distanceButton.onclick = () => {
            isMeasuring = !isMeasuring;
            if (areaDrawer) { areaDrawer.disable(); areaDrawer = null; L.DomUtil.removeClass(areaButton, 'active'); }
            clearMeasurement();
            if (isMeasuring) {
                L.DomUtil.addClass(distanceButton, 'active'); map.getContainer().style.cursor = 'crosshair';
                distanceDisplay.innerHTML = 'Haga clic para añadir puntos.';
                map.on('mousemove', handleMeasureMouseMove);
            } else {
                L.DomUtil.removeClass(distanceButton, 'active'); map.getContainer().style.cursor = '';
                map.off('mousemove', handleMeasureMouseMove);
            }
        };

        const startDrawer = (drawer) => {
            if (currentDrawer) {
                currentDrawer.disable();
            }
            currentDrawer = drawer;
            currentDrawer.enable();
        };

        areaButton.onclick = () => {
            if (isMeasuring) { distanceButton.click(); } // Desactivar medición de distancia
            L.DomUtil.addClass(areaButton, 'active');
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

                // Add label for segment distance
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
            L.DomUtil.removeClass(distanceButton, 'active');
            map.getContainer().style.cursor = '';
            map.off('mousemove', handleMeasureMouseMove);

        };

        const handleDrawCreated = (e) => {
            const layer = e.layer;

            // Si es el polígono de medición de área, calcula y muestra el popup
            if (areaDrawer && e.layerType === 'polygon') {
                const area = getPolygonArea(layer.getLatLngs()[0]);
                const areaHa = (area / 10000).toFixed(2);
                const areaKm = (area / 1000000).toFixed(4);
                const popupContent = `<b>Área:</b><br>${area.toFixed(2)} m²<br>${areaHa} ha<br>${areaKm} km²`;
                layer.bindPopup(popupContent).openPopup();
            }

            drawnItems.addLayer(layer);

            // Resetear estados
            L.DomUtil.removeClass(areaButton, 'active');
            if (areaDrawer) {
                areaDrawer = null;
            }
            if (currentDrawer) {
                currentDrawer = null;
            }
            drawModal.style.display = 'none'; // Opcional: cerrar modal de dibujo al terminar
        };

        // --- Adjuntar y Limpiar Listeners ---
        map.on('mousemove', handleCoordsMouseMove).on('mouseout', handleCoordsMouseOut);
        map.on(L.Draw.Event.CREATED, handleDrawCreated);
        map.on(L.Draw.Event.DRAWSTART, handleDrawStart).on(L.Draw.Event.DRAWSTOP, handleDrawStop);
        map.on('click', handleMapClick).on('dblclick', handleMapDoubleClick);

        return () => {
            isComponentMounted = false;
            if (map) {
                map.isInitialized = false;
            }
            map.off('mousemove', handleCoordsMouseMove).off('mouseout', handleCoordsMouseOut);
            map.off(L.Draw.Event.CREATED, handleDrawCreated);
            map.off(L.Draw.Event.DRAWSTART, handleDrawStart).off(L.Draw.Event.DRAWSTOP, handleDrawStop);
            map.off('click', handleMapClick).off('dblclick', handleMapDoubleClick);
            map.off('mousemove', handleMeasureMouseMove);
            coordControl.remove();
            group1Controls.remove();
            group2Controls.remove();
            group3Controls.remove();
            // map.removeControl(drawControl);
            if (map.getContainer().contains(measureModal)) { map.getContainer().removeChild(measureModal); }
            if (map.getContainer().contains(drawModal)) { map.getContainer().removeChild(drawModal); }
            if (map.getContainer().contains(downloadModal)) { map.getContainer().removeChild(downloadModal); }
            if (map.getContainer().contains(uploadModal)) { map.getContainer().removeChild(uploadModal); }
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
    const ImageGallery = ({ imageUrls, onShowDetails }) => {
        const [currentIndex, setCurrentIndex] = useState(0);

        if (!imageUrls || imageUrls.length === 0) {
            return (
                <div style={{ marginTop: '5px', textAlign: 'center' }}>
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
            setCurrentIndex(prevIndex => (prevIndex < imageUrls.length - 1 ? prevIndex + 1 : prevIndex));
        };

        return (
            <div style={{ marginTop: '5px', textAlign: 'center' }}>
                <img
                    src={imageUrls[currentIndex]}
                    alt="Alcantarilla"
                    className="popup-image"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <button onClick={goToPrevious} disabled={currentIndex === 0}>Anterior</button>
                    <span>{`${currentIndex + 1} de ${imageUrls.length}`}</span>
                    <button onClick={goToNext} disabled={currentIndex === imageUrls.length - 1}>Siguiente</button>
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

    // Efecto para RENDERIZAR los marcadores de alcantarillas
    React.useEffect(() => {
        try {
            if (!map || !alcantarillasData) return;

            const alcantarillasLayer = alcantarillasLayerRef.current;

            const getIcon = (zoom, type) => {
                let iconSize = [16, 16];
                let iconAnchor = [8, 16];
                let popupAnchor = [0, -16];

                // Default sizing for alcantarillas/badenes
                if (zoom > 15) {
                    iconSize = [32, 32];
                    iconAnchor = [16, 32];
                    popupAnchor = [0, -32];
                } else if (zoom > 13) {
                    iconSize = [24, 24];
                    iconAnchor = [12, 24];
                    popupAnchor = [0, -24];
                }

                // Custom sizing for Puentes and Muros (Larger)
                if (type === 'puente' || type === 'muro') {
                    if (zoom > 15) {
                        iconSize = [48, 48]; // Significantly larger
                        iconAnchor = [24, 48];
                        popupAnchor = [0, -48];
                    } else if (zoom > 13) {
                        iconSize = [36, 36];
                        iconAnchor = [18, 36];
                        popupAnchor = [0, -36];
                    } else {
                        iconSize = [24, 24]; // Base size also larger
                        iconAnchor = [12, 24];
                        popupAnchor = [0, -24];
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
                } else {
                    iconUrl = '/imgs/alcantarilla_icon.png'; // Default or error icon
                }

                return L.icon({
                    iconUrl: iconUrl,
                    iconSize: iconSize,
                    iconAnchor: iconAnchor,
                    popupAnchor: popupAnchor
                });
            };

            const renderMarkers = () => {
                alcantarillasLayer.clearLayers();
                markerRefMap.current = {};
                const zoom = map.getZoom();

                alcantarillasData.forEach(alcantarilla => {
                    if (typeof alcantarilla.latitud === 'number' && !isNaN(alcantarilla.latitud) &&
                        typeof alcantarilla.longitud === 'number' && !isNaN(alcantarilla.longitud)) {

                        const icon = getIcon(zoom, alcantarilla.type); // Moved inside the loop and passing type

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

                        const popupContainerId = `popup-gallery-${alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro}`;

                        let typeLabel = 'Alcantarilla';
                        let idValue = alcantarilla.codigo || alcantarilla.id_alcantarilla;

                        if (alcantarilla.type === 'baden') {
                            typeLabel = 'Badén';
                            idValue = alcantarilla.codigo || alcantarilla.id_baden;
                        } else if (alcantarilla.type === 'puente') {
                            typeLabel = 'Puente';
                            idValue = alcantarilla.nombre || alcantarilla.id_puente;
                        } else if (alcantarilla.type === 'muro') {
                            typeLabel = 'Muro';
                            idValue = alcantarilla.id_muro;
                        }

                        const popupContent = `
                            <b>${typeLabel}:</b> ${idValue}<br/>
                            <div id="${popupContainerId}"></div>
                        `;

                        marker.bindPopup(popupContent);

                        marker.on('popupopen', () => {
                            const container = document.getElementById(popupContainerId);
                            if (container) {
                                const root = createRoot(container);
                                popupRoots.current[popupContainerId] = root;
                                root.render(<ImageGallery imageUrls={alcantarilla.imageUrls} onShowDetails={() => onShowDetails(alcantarilla)} />);
                            }
                        });

                        marker.on('popupclose', () => {
                            const root = popupRoots.current[popupContainerId];
                            if (root) {
                                root.unmount();
                                delete popupRoots.current[popupContainerId];
                            }
                        });

                        alcantarillasLayer.addLayer(marker);
                        markerRefMap.current[alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro] = marker;

                    } else {
                        console.warn(`Elemento con ID ${alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro || 'N/A'} tiene coordenadas inválidas.`);
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
    }, [alcantarillasData, map, onShowDetails]);


    return null;
};

const Geoite = ({ onTramoSelect, highlightedTramoId, height = '90vh', alcantarillasData, onAlcantarillaClick, onRouteLoaded, onShowDetails }) => {
    // Coordenadas para centrar el mapa en Perú, ya que no hay ruta inicial
    const center = [-12, -75];

    return (
        <div style={{ height: '500px', width: '100%', minHeight: 0 }}>
            <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Estándar"> <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' /> </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Topográfico"> <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/30/">CC-BY-SA</a>)' /> </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satélite"> <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' /> </LayersControl.BaseLayer>
                </LayersControl>
                <MapLogic initialRoute={null} onTramoSelect={onTramoSelect} highlightedTramoId={highlightedTramoId} alcantarillasData={alcantarillasData} onAlcantarillaClick={onAlcantarillaClick} onRouteLoaded={onRouteLoaded} onShowDetails={onShowDetails} />
            </MapContainer>
        </div>
    );
};

export default Geoite;