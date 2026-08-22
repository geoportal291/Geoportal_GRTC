import React, { useEffect } from 'react';
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
import axiosInstance from '@/api/axios';
import { saveAs } from 'file-saver';


// Este componente encapsula TODA la lógica imperativa para no causar re-renders.
const MapLogic = ({ initialRoute }) => {
    const map = useMap();
    
    useEffect(() => {
        if (!map) return;

        // --- Variables de estado internas ---
        const drawnItems = new L.FeatureGroup().addTo(map);


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
        map.addControl(drawControl);

        // --- Lógica de Coordenadas en Pantalla ---
        const coordContainer = L.DomUtil.create('div', 'leaflet-control-coordinates');
        const coordControl = new L.Control({ position: 'bottomleft' });
        coordControl.onAdd = function() { return coordContainer; };
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
                                <option value="utm">UTM</option>
                            </select>
                        </div>
                        <div class="input-group" id="utmZoneGroup" style="display: none;">
                            <label for="utmZoneSelect">Zona:</label>
                            <select id="utmZoneSelect">
                                <option value="17">ZONA17</option>
                                <option value="18">ZONA18</option>
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

                    <div id="utmCoordInputs" style="display: none;"> {/* New container for UTM inputs */}
                        <div class="input-group">
                            <label for="utmX">Coordenada X:</label><input type="text" id="utmX"/>
                        </div>
                        <div class="input-group">
                            <label for="utmY">Coordenada Y:</label><input type="text" id="utmY"/>
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

        const loadKmlFromUrl = async (url) => {
            try {
                alertify.message(`Descargando KML desde la URL...`);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Error en la red: ${response.statusText}`);
                }
                const kmlText = await response.text();

                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
                const convertedGeoJson = kml(kmlDoc);

                const tempGeoJsonLayer = L.geoJSON(convertedGeoJson, {
                    onEachFeature: (feature, layer) => {
                        if (feature.properties && feature.properties.name) {
                            layer.bindPopup(feature.properties.name);
                        }
                    }
                });

                tempGeoJsonLayer.eachLayer(layer => drawnItems.addLayer(layer));

                if (tempGeoJsonLayer.getBounds().isValid()) {
                    map.fitBounds(tempGeoJsonLayer.getBounds());
                }
                alertify.success('KML cargado y dibujado en el mapa.');

            } catch (error) {
                console.error('Error al cargar KML desde URL:', error);
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
                console.error('Error al subir el archivo KML:', error);
                alertify.error('Ocurrió un error al subir el archivo.');
            }
        };

        const handleDeleteKml = async () => {
            alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar el KML de este proyecto? Esta acción no se puede deshacer.', 
                async function() { // On OK
                    try {
                        alertify.message('Eliminando KML...');
                        await axiosInstance.delete(`/api/proyectos/${projectId}/kml`);
                        
                        // Clear all KML-related layers from the map
                        drawnItems.clearLayers();
                        
                        alertify.success('El KML ha sido eliminado del proyecto.');
                    } catch (error) {
                        console.error('Error al eliminar KML:', error);
                        alertify.error('No se pudo eliminar el KML.');
                    }
                },
                function() { // On Cancel
                    alertify.error('Eliminación cancelada.');
                }
            );
        };

        uploadContent.innerHTML = `
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
                    console.error('Error processing KML file:', error);
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
            // Campos de metadatos
            document.getElementById('pointName').value = '';
            document.getElementById('pointDesc').value = '';
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

                    console.log('UTM Input:');
                    console.log('  X:', utmX, 'Y:', utmY, 'Zone:', utmZone, 'Letter:', utmZoneLetter);
                    console.log('Converted Lat/Lon:');
                    console.log('  Lat:', finalLat, 'Lon:', finalLon);
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


        // --- Contenedor de Controles Personalizados (topleft) ---
        const mainControlsContainer = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(mainControlsContainer);

        const mainMeasureButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        mainMeasureButton.innerHTML = '📏';
        mainMeasureButton.title = 'Abrir Mediciones';
        mainControlsContainer.appendChild(mainMeasureButton);

        const mainDrawButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        mainDrawButton.innerHTML = '✏️';
        mainDrawButton.title = 'Abrir Herramientas de Dibujo';
        mainControlsContainer.appendChild(mainDrawButton);

        const mainUploadButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        mainUploadButton.innerHTML = '⬆️';
        mainUploadButton.title = 'Subir KML';
        mainControlsContainer.appendChild(mainUploadButton);

        // --- NEW: Main Download Button ---
        const mainDownloadButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        mainDownloadButton.innerHTML = '⬇️';
        mainDownloadButton.title = 'Descargar Datos';
        mainControlsContainer.appendChild(mainDownloadButton);

        const updateInfoButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        updateInfoButton.innerHTML = '💾';
        updateInfoButton.title = 'Actualizar Información';
        mainControlsContainer.appendChild(updateInfoButton);

        const deleteKmlButton = L.DomUtil.create('a', 'leaflet-control-custom-button');
        deleteKmlButton.innerHTML = '🗑️';
        deleteKmlButton.title = 'Eliminar KML del Proyecto';
        mainControlsContainer.appendChild(deleteKmlButton);

        const customControls = new L.Control({ position: 'topleft' });
        customControls.onAdd = function() { return mainControlsContainer; };
        customControls.addTo(map);

        // --- KML Persistence ---
        const projectId = 24; // As per user request

        const loadInitialKml = async () => {
            try {
                const response = await axiosInstance.get(`/api/proyectos/${projectId}/kml`);
                if (response.data && response.data.url) {
                    await loadKmlFromUrl(response.data.url);
                    alertify.success('KML del proyecto cargado automáticamente.');
                }
            } catch (error) {
                if (error.response && error.response.status !== 404) {
                    console.error('Error al cargar KML inicial:', error);
                    alertify.error('No se pudo cargar el KML guardado.');
                } // 404 is a normal case (no KML set), so we ignore it.
            }
        };

        loadInitialKml();



        // --- Lógica de visibilidad de modales ---
        mainMeasureButton.onclick = () => { measureModal.style.display = measureModal.style.display === 'none' ? 'block' : 'none'; };
        measureCloseButton.onclick = () => { measureModal.style.display = 'none'; };
        mainDrawButton.onclick = () => { drawModal.style.display = drawModal.style.display === 'none' ? 'block' : 'none'; };
        drawCloseButton.onclick = () => { drawModal.style.display = 'none'; };
        mainDownloadButton.onclick = () => { downloadModal.style.display = downloadModal.style.display === 'none' ? 'block' : 'none'; };
        downloadCloseButton.onclick = () => { downloadModal.style.display = 'none'; };
        mainUploadButton.onclick = () => { uploadModal.style.display = uploadModal.style.display === 'none' ? 'block' : 'none'; };
        uploadCloseButton.onclick = () => { uploadModal.style.display = 'none'; };

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
                console.error('Error al guardar los puntos:', error);
                alertify.error('Ocurrió un error al guardar los puntos.');
            }
        };

        updateInfoButton.onclick = handleUpdateInfo;

        // --- Lógica para hacer modales arrastrables ---
        const makeDraggable = (modal, header) => {
            let dragging = false, offset = [0,0];
            header.onmousedown = (e) => {
                dragging = true; offset = [modal.offsetLeft - e.clientX, modal.offsetTop - e.clientY];
                document.onmousemove = (e) => { if(dragging){ modal.style.left = (e.clientX + offset[0]) + 'px'; modal.style.top = (e.clientY + offset[1]) + 'px'; } };
                document.onmouseup = () => { dragging = false; document.onmousemove = document.onmouseup = null; };
            };
        };
        makeDraggable(measureModal, measureHeader);
        makeDraggable(drawModal, drawHeader);
        makeDraggable(downloadModal, downloadHeader);
        makeDraggable(uploadModal, uploadHeader);

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
        Escala: ~1:${scale.toLocaleString('en-US')}<br>
        Longitud: ${lon.toFixed(5)}<br>
        Latitud: ${lat.toFixed(5)}<br>
        Coordenada Este: ${utmCoords.easting.toFixed(2)}<br>
        Coordenada Norte: ${utmCoords.northing.toFixed(2)}<br>
        Sistema Coordenadas: WGS'84 Zona ${utmCoords.zoneNum}${utmCoords.zoneLetter}
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
            map.off('mousemove', handleCoordsMouseMove).off('mouseout', handleCoordsMouseOut);
            map.off(L.Draw.Event.CREATED, handleDrawCreated);
            map.off(L.Draw.Event.DRAWSTART, handleDrawStart).off(L.Draw.Event.DRAWSTOP, handleDrawStop);
            map.off('click', handleMapClick).off('dblclick', handleMapDoubleClick);
            map.off('mousemove', handleMeasureMouseMove);
            coordControl.remove(); 
            customControls.remove();
            map.removeControl(drawControl);
            if (map.getContainer().contains(measureModal)) { map.getContainer().removeChild(measureModal); }
            if (map.getContainer().contains(drawModal)) { map.getContainer().removeChild(drawModal); }
            if (map.getContainer().contains(downloadModal)) { map.getContainer().removeChild(downloadModal); }
            if (map.getContainer().contains(uploadModal)) { map.getContainer().removeChild(uploadModal); }
        };
    }, [map]);

    return null;
};

const Geoite = () => {
    // Coordenadas para centrar el mapa en Perú, ya que no hay ruta inicial
    const center = [-12, -75];

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Estándar"> <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' /> </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Topográfico"> <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)' /> </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satélite"> <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' /> </LayersControl.BaseLayer>
                </LayersControl>
                <MapLogic initialRoute={null} />
            </MapContainer>
        </div>
    );
};

export default Geoite;