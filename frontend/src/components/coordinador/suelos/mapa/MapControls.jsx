import React, { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet-draw'; // Necesario para L.Draw.Polygon (usado en MeasureTools)
import { toLatLon } from 'utm'; // Needed for coordinate conversion
import { kml } from '@tmcw/togeojson'; // Corrected: Needed for KML processing
import { DOMParser } from 'xmldom'; // Needed for KML processing
import alertify from 'alertifyjs'; // Needed for alerts
import axiosInstance from '../../../../api/axios.js'; // Import axiosInstance
import { saveAs } from 'file-saver'; // Needed for KML download
import './MapControls.css'; // Archivo CSS para los nuevos controles

// Helper function from SuelosMap.jsx
const getPolygonArea = (latLngs) => {
    if (!latLngs || latLngs.length < 3) {
        return 0;
    }
    return L.GeometryUtil.geodesicArea(latLngs);
};

// --- Modal Component ---
const Modal = ({ title, isOpen, onClose, children }) => {
    // Lógica para hacerlo arrastrable
    useEffect(() => {
        const modalElement = document.getElementById(`modal-${title}`);
        const headerElement = document.getElementById(`modal-header-${title}`);

        // Define handlers outside to ensure they are stable for cleanup
        let dragging = false;
        let offset = [0, 0];

        const onMouseMove = (e) => {
            if (dragging && modalElement) { // Check modalElement exists
                modalElement.style.left = (e.clientX + offset[0]) + 'px';
                modalElement.style.top = (e.clientY + offset[1]) + 'px';
            }
        };

        const onMouseUp = () => {
            dragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        const onMouseDown = (e) => {
            if (modalElement && headerElement) { // Check elements exist
                dragging = true;
                offset = [
                    modalElement.offsetLeft - e.clientX,
                    modalElement.offsetTop - e.clientY
                ];
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
        };

        if (isOpen && headerElement) { // Only attach if modal is open and header exists
            headerElement.addEventListener('mousedown', onMouseDown);
        }

        return () => {
            // Cleanup listeners when component unmounts or isOpen changes
            if (headerElement) {
                headerElement.removeEventListener('mousedown', onMouseDown);
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [isOpen, title]); // isOpen is a dependency

    // Conditional render AFTER all hooks
    if (!isOpen) return null;

    return (
        <div className="map-modal" id={`modal-${title}`} style={{ display: isOpen ? 'block' : 'none' }}>
            <div className="map-modal-header" id={`modal-header-${title}`}><span>{title}</span><button onClick={onClose} className="map-modal-close-btn">&times;</button></div>
            <div className="map-modal-content">
                {children}
            </div>
        </div>
    );
};

// --- MeasureTools Component ---
const MeasureTools = ({ map, displayLayers, measurementLayers, persistentMeasurementLayers, onCloseModal }) => {
    const [isMeasuringDistance, setIsMeasuringDistance] = useState(false);
    const [isMeasuringArea, setIsMeasuringArea] = useState(false);
    const [measuredPoints, setMeasuredPoints] = useState([]);
    const [distanceDisplay, setDistanceDisplay] = useState('Seleccione una herramienta.');

    // Refs for Leaflet objects that need to persist across renders but aren't React state
    const rubberBandLineRef = React.useRef(null);
    const areaDrawerRef = React.useRef(null);

    // NEW: Ref for the current polyline being drawn
    const currentPolylineRef = React.useRef(null);


    // Cleanup function for measurement
    const clearMeasurement = useCallback(() => {
        measurementLayers.clearLayers(); // Clears all markers, labels, and polylines
        setMeasuredPoints([]);
        currentPolylineRef.current = null;
        rubberBandLineRef.current = null;
        // completedPolylinesRef.current = []; // No longer needed here
        setDistanceDisplay('Seleccione una herramienta.');
        setIsMeasuringDistance(false); // Ensure mode is off
        setIsMeasuringArea(false);
        if (areaDrawerRef.current) {
            areaDrawerRef.current.disable();
            areaDrawerRef.current = null;
        }
        map.getContainer().style.cursor = ''; // Reset cursor
    }, [map, measurementLayers]);

    // NEW: Function to clear all measurements (temporary and persistent)
    const clearAllMeasurements = useCallback(() => {
        clearMeasurement(); // Clear temporary layers
        persistentMeasurementLayers.clearLayers(); // Clear persistent layers
    }, [clearMeasurement, persistentMeasurementLayers]);

    // Effect for handling mousemove for rubber band line (MOVED UP)
    const handleMeasureMouseMove = useCallback((e) => {
        if (!isMeasuringDistance || measuredPoints.length === 0) return;

        if (rubberBandLineRef.current) {
            rubberBandLineRef.current.setLatLngs([measuredPoints[measuredPoints.length - 1], e.latlng]);
        } else {
            rubberBandLineRef.current = L.polyline([measuredPoints[measuredPoints.length - 1], e.latlng], { color: 'blue', weight: 3, opacity: 0.5, dashArray: '5, 10' }).addTo(measurementLayers);
        }
        const currentSegmentDistance = measuredPoints[measuredPoints.length - 1].distanceTo(e.latlng);
        let totalDistance = 0;
        // Calculate total distance from the current polyline (including persistent ones)
        if (currentPolylineRef.current) {
            const latlngs = currentPolylineRef.current.getLatLngs();
            for (let i = 0; i < latlngs.length - 1; i++) {
                totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
            }
        }
        totalDistance += currentSegmentDistance; // Add the current rubber band segment
        setDistanceDisplay(`Distancia: ${(totalDistance / 1000).toFixed(3)} km`);
    }, [isMeasuringDistance, measuredPoints, currentPolylineRef, measurementLayers]);

    // Effect for handling map click events for distance measurement
    useEffect(() => {
        if (!map) return;

        const handleMapClick = (e) => {
            if (!isMeasuringDistance) return;

            setMeasuredPoints(prevPoints => {
                const newPoints = [...prevPoints, e.latlng];

                // Add marker for the clicked point
                L.marker(e.latlng, { icon: L.divIcon({ className: 'measure-point-icon', html: '●', iconSize: [10, 10] }) }).addTo(measurementLayers);

                if (newPoints.length === 1) {
                    // First point, initialize the polyline
                    currentPolylineRef.current = L.polyline([newPoints[0]], { color: 'red', weight: 10 }).addTo(measurementLayers);
                } else {
                    // Subsequent points, add to the existing polyline
                    currentPolylineRef.current.addLatLng(newPoints[newPoints.length - 1]);

                    const segmentDistance = newPoints[newPoints.length - 2].distanceTo(newPoints[newPoints.length - 1]);
                    let totalDistance = 0;
                    if (currentPolylineRef.current) { // Calculate total distance from the current polyline
                        const latlngs = currentPolylineRef.current.getLatLngs();
                        for (let i = 0; i < latlngs.length - 1; i++) {
                            totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
                        }
                    }
                    totalDistance += segmentDistance; // Add the current segment distance
                    setDistanceDisplay(`Distancia: ${(totalDistance / 1000).toFixed(3)} km`);

                    const segmentDistanceKm = (segmentDistance / 1000);
                    if (segmentDistanceKm > 0) {
                        const p1 = newPoints[newPoints.length - 2];
                        const p2 = newPoints[newPoints.length - 1];
                        const centerLatLng = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);

                        L.marker(centerLatLng, {
                            icon: L.divIcon({
                                className: 'measure-label',
                                html: `${segmentDistanceKm.toFixed(2)} km`,
                                iconAnchor: [0, 0]
                            })
                        }).addTo(measurementLayers);
                    }
                }
                return newPoints;
            });
        };

        const handleMapDoubleClick = (e) => {
            if (!isMeasuringDistance) return;

            // Finalize current polyline (stop adding to it)
            if (rubberBandLineRef.current) {
                rubberBandLineRef.current.remove();
                rubberBandLineRef.current = null;
            }
            map.off('mousemove', handleMeasureMouseMove); // Stop rubber band effect
            map.getContainer().style.cursor = ''; // Reset cursor
            setIsMeasuringDistance(false); // Stop active measurement mode

            // Move the completed polyline and its associated markers/labels to persistentMeasurementLayers
            if (currentPolylineRef.current) {
                // Create a new FeatureGroup for the completed measurement
                const completedMeasurementGroup = new L.FeatureGroup();
                completedMeasurementGroup.addLayer(currentPolylineRef.current);

                // Find all markers and labels associated with this measurement in measurementLayers
                measurementLayers.eachLayer(layer => {
                    if (layer instanceof L.Marker && layer.options.icon && (layer.options.icon.options.className === 'measure-point-icon' || layer.options.icon.options.className === 'measure-label')) {
                        completedMeasurementGroup.addLayer(layer);
                    }
                });

                // Add the completed measurement group to persistent layers
                persistentMeasurementLayers.addLayer(completedMeasurementGroup);
                console.log('Capas persistentes después de añadir:', persistentMeasurementLayers.getLayers().length);
            }

            // Clear only the temporary measurement layers
            measurementLayers.clearLayers();

            setMeasuredPoints([]); // Reset points for a new measurement
            currentPolylineRef.current = null; // Clear current polyline ref
            setDistanceDisplay('Medición finalizada. Haga clic en el botón de distancia para iniciar una nueva o en "Limpiar" para borrar todo.');
        };

        if (isMeasuringDistance) {
            map.on('click', handleMapClick);
            map.on('dblclick', handleMapDoubleClick);
        }

        return () => {
            map.off('click', handleMapClick);
            map.off('dblclick', handleMapDoubleClick);
        };
    }, [map, isMeasuringDistance, measurementLayers, persistentMeasurementLayers, handleMeasureMouseMove]);


    // Effect for handling mousemove for rubber band line (MOVED UP)
    useEffect(() => {
        if (isMeasuringDistance) {
            map.on('mousemove', handleMeasureMouseMove);
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.off('mousemove', handleMeasureMouseMove);
            if (!isMeasuringArea) { // Only reset cursor if not measuring area
                map.getContainer().style.cursor = '';
            }
        }
        return () => {
            map.off('mousemove', handleMeasureMouseMove);
        };
    }, [map, isMeasuringDistance, isMeasuringArea, handleMeasureMouseMove]);


    // Effect for handling draw:created event for area measurement
    useEffect(() => {
        if (!map) return;

        const handleDrawCreated = (e) => {
            if (isMeasuringArea && e.layerType === 'polygon') {
                const layer = e.layer;
                const area = getPolygonArea(layer.getLatLngs()[0]);
                const areaHa = (area / 10000).toFixed(2);
                const areaKm = (area / 1000000).toFixed(4);
                const popupContent = `<b>Área:</b><br>${area.toFixed(2)} m²<br>${areaHa} ha<br>${areaKm} km²`;
                layer.bindPopup(popupContent).openPopup();
                displayLayers.addLayer(layer); // Add to displayLayers
                setIsMeasuringArea(false); // Stop area measurement after drawing
                if (areaDrawerRef.current) {
                    areaDrawerRef.current.disable();
                    areaDrawerRef.current = null;
                }
                map.getContainer().style.cursor = '';
                onCloseModal(); // Close modal after drawing
            }
        };

        if (isMeasuringArea) {
            map.on(L.Draw.Event.CREATED, handleDrawCreated);
        }

        return () => {
            map.off(L.Draw.Event.CREATED, handleDrawCreated);
        };
    }, [map, isMeasuringArea, displayLayers, onCloseModal]);


    const handleDistanceButtonClick = () => {
        if (isMeasuringArea) { // If measuring area, stop it first
            clearMeasurement();
        }
        setIsMeasuringDistance(prev => { // Toggle measurement mode
            if (prev) { // If turning off measurement mode
                clearMeasurement(); // Clear everything
            } else { // If turning on measurement mode
                // Only clear if starting a completely new measurement
                // If there are completed polylines, they should remain
                if (persistentMeasurementLayers.getLayers().length === 0) { // Only clear if no completed polylines exist
                    setMeasuredPoints([]); // Reset points for a new measurement
                    currentPolylineRef.current = null; // Clear current polyline ref
                    setDistanceDisplay('Haga clic para añadir el primer punto.');
                } else { // If there are completed polylines, just start a new one without clearing old ones
                    setMeasuredPoints([]);
                    currentPolylineRef.current = null;
                    setDistanceDisplay('Haga clic para añadir el primer punto de una nueva medición.');
                }
            }
            return !prev;
        });
    };

    const handleAreaButtonClick = () => {
        if (isMeasuringDistance) { // If measuring distance, stop it first
            clearMeasurement();
        }
        setIsMeasuringArea(prev => !prev);
        if (!isMeasuringArea) { // If starting area measurement
            areaDrawerRef.current = new L.Draw.Polygon(map, { showArea: false, allowIntersection: false, shapeOptions: { color: '#007bff' } });
            areaDrawerRef.current.enable();
            map.getContainer().style.cursor = 'crosshair';
        } else { // If stopping area measurement
            if (areaDrawerRef.current) {
                areaDrawerRef.current.disable();
                areaDrawerRef.current = null;
            }
            map.getContainer().style.cursor = '';
        }
    };

    return (
        <div className="measure-modal-content-inner">
            <div className="button-group">
                <button
                    className={`leaflet-control-custom-button ${isMeasuringDistance ? 'active' : ''}`}
                    title="Medir distancia"
                    onClick={handleDistanceButtonClick}
                >
                    ↔
                </button>
                <button
                    className={`leaflet-control-custom-button ${isMeasuringArea ? 'active' : ''}`}
                    title="Calcular área de polígono"
                    onClick={handleAreaButtonClick}
                    style={{ marginLeft: '5px' }}
                >
                    ⬟
                </button>
                <button
                    className="leaflet-control-custom-button"
                    title="Limpiar medición"
                    onClick={clearAllMeasurements}
                    style={{ marginLeft: '5px' }}
                >
                    🗑️
                </button>
            </div>
            <div className="distance-display">{distanceDisplay}</div>
        </div>
    );
};

// --- NEW: DrawTools Component ---
const DrawTools = ({ map, displayLayers, onCloseModal }) => { // Remove editableUserLayers
    const [inputType, setInputType] = useState('coordinates'); // 'coordinates' or 'kml'
    const [projection, setProjection] = useState('geographic'); // 'geographic' or 'utm'
    const [geometryType, setGeometryType] = useState('point'); // 'point' (for now)
    const [coordFormat, setCoordFormat] = useState('decimal'); // 'decimal' or 'degrees'

    // Coordinate input states
    const [lonDecimal, setLonDecimal] = useState('');
    const [latDecimal, setLatDecimal] = useState('');
    const [lonDeg, setLonDeg] = useState('');
    const [lonMin, setLonMin] = useState('');
    const [lonSec, setLonSec] = useState('');
    const [latDeg, setLatDeg] = useState('');
    const [latMin, setLatMin] = useState('');
    const [latSec, setLatSec] = useState('');
    const [utmX, setUtmX] = useState('');
    const [utmY, setUtmY] = useState('');
    const [utmZone, setUtmZone] = useState('17');

    // KML file state
    const [kmlFile, setKmlFile] = useState(null);

    // Helper from SuelosMap.jsx
    const addLayersRecursively = useCallback((layer, group) => {
        if (layer.eachLayer) { // It's a group of layers (FeatureGroup, GeoJSON)
            layer.eachLayer(l => addLayersRecursively(l, group));
        } else { // It's an individual layer
            // For KML, we add to displayLayers, not necessarily editable
            group.addLayer(layer);
        }
    }, []);


    const handleDrawPoint = () => {
        let lat, lon;

        if (projection === 'geographic') {
            if (coordFormat === 'decimal') {
                lat = parseFloat(latDecimal);
                lon = parseFloat(lonDecimal);
            } else { // Degrees
                // Convert GMS to Decimal
                const parseGMS = (deg, min, sec) => {
                    return parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
                };
                lat = parseGMS(latDeg, latMin, latSec); 
                lon = parseGMS(lonDeg, lonMin, lonSec); 
            }
        } else { // UTM
            try {
                // Assuming Southern hemisphere for now, might need to be dynamic
                const utmCoords = toLatLon(parseFloat(utmX), parseFloat(utmY), parseInt(utmZone), 'S'); 
                lat = utmCoords.latitude;
                lon = utmCoords.longitude;
            } catch (error) {
                alertify.error('Error al convertir coordenadas UTM. Asegúrese de que son válidas.');
                console.error('UTM conversion error:', error);
                return;
            }
        }

        if (isNaN(lat) || isNaN(lon)) {
            alertify.error('Coordenadas inválidas. Por favor, verifique los valores.');
            return;
        }

        L.marker([lat, lon]).addTo(displayLayers); // Add to displayLayers
        alertify.success(`Punto dibujado en Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`);
        onCloseModal(); // Close modal after drawing
    };

    const handleClearCoords = () => {
        setLonDecimal('');
        setLatDecimal('');
        setLonDeg('');
        setLonMin('');
        setLonSec('');
        setLatDeg('');
        setLatMin('');
        setLatSec('');
        setUtmX('');
        setUtmY('');
    };

    const handleProcessKml = () => {
        if (!kmlFile) {
            alertify.error('Por favor, seleccione un archivo KML.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const kmlText = e.target.result;
                const kmlDoc = new DOMParser().parseFromString(kmlText, 'text/xml');
                const convertedGeoJson = kml(kmlDoc);
                const geoJsonLayer = L.geoJSON(convertedGeoJson);

                displayLayers.clearLayers(); // Clear displayLayers
                addLayersRecursively(geoJsonLayer, displayLayers); // Add to displayLayers

                if (geoJsonLayer.getBounds().isValid()) {
                    map.fitBounds(geoJsonLayer.getBounds());
                }
                alertify.success('KML procesado y añadido al mapa.');
                onCloseModal(); // Close modal after processing
            } catch (error) {
                console.error('Error al procesar KML:', error);
                alertify.error('Error al procesar el archivo KML. Asegúrese de que es un KML válido.');
            }
        };
        reader.readAsText(kmlFile);
    };

    return (
        <div className="draw-modal-content-inner">
            <div className="input-group">
                <label htmlFor="inputTypeSelect">Tipo de Entrada:</label>
                <select id="inputTypeSelect" value={inputType} onChange={(e) => setInputType(e.target.value)}>
                    <option value="coordinates">Coordenadas</option>
                    <option value="kml">KML</option>
                </select>
            </div>

            {inputType === 'coordinates' && (
                <div id="coordinateInputSection">
                    <div>
                        <h4>Ingresar Coordenadas</h4>
                        <div className="input-group">
                            <label htmlFor="projectionSelect">Proyección:</label>
                            <select id="projectionSelect" value={projection} onChange={(e) => setProjection(e.target.value)}>
                                <option value="geographic">GEOGRÁFICAS</option>
                                <option value="utm">UTM</option>
                            </select>
                        </div>
                        {projection === 'utm' && (
                            <div className="input-group" id="utmZoneGroup">
                                <label htmlFor="utmZoneSelect">Zona:</label>
                                <select id="utmZoneSelect" value={utmZone} onChange={(e) => setUtmZone(e.target.value)}>
                                    <option value="17">ZONA17</option>
                                    <option value="18">ZONA18</option>
                                    <option value="19">ZONA19</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="input-group">
                        <label htmlFor="geometryTypeSelect">Tipo de Geometría:</label>
                        <select id="geometryTypeSelect" value={geometryType} onChange={(e) => setGeometryType(e.target.value)}>
                            <option value="point">PUNTO</option>
                        </select>
                    </div>

                    {projection === 'geographic' && (
                        <div id="geographicCoordInputs">
                            <div className="input-group">
                                <label htmlFor="coordFormatSelect">Formato:</label>
                                <select id="coordFormatSelect" value={coordFormat} onChange={(e) => setCoordFormat(e.target.value)}>
                                    <option value="decimal">DECIMAL</option>
                                    <option value="degrees">GRADOS (GMS)</option>
                                </select>
                            </div>

                            {coordFormat === 'decimal' && (
                                <div id="decimalInputs">
                                    <div className="input-group">
                                        <label htmlFor="lonDecimal">Longitud:</label><input type="text" id="lonDecimal" value={lonDecimal} onChange={(e) => setLonDecimal(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="latDecimal">Latitud:</label><input type="text" id="latDecimal" value={latDecimal} onChange={(e) => setLatDecimal(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {coordFormat === 'degrees' && (
                                <div id="degreesInputs">
                                    <div className="input-group">
                                        <label htmlFor="lonDeg">Longitud:</label>
                                        <div style={{ display: 'flex', gap: '5px', flexGrow: 1 }}> {/* NEW CONTAINER */} 
                                            <input type="text" id="lonDeg" placeholder="G" className="gms-input" value={lonDeg} onChange={(e) => setLonDeg(e.target.value)} />
                                            <input type="text" id="lonMin" placeholder="M" className="gms-input" value={lonMin} onChange={(e) => setLonMin(e.target.value)} />
                                            <input type="text" id="lonSec" placeholder="S" className="gms-input" value={lonSec} onChange={(e) => setLonSec(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="latDeg">Latitud:</label>
                                        <div style={{ display: 'flex', gap: '5px', flexGrow: 1 }}> {/* NEW CONTAINER */} 
                                            <input type="text" id="latDeg" placeholder="G" className="gms-input" value={latDeg} onChange={(e) => setLatDeg(e.target.value)} />
                                            <input type="text" id="latMin" placeholder="M" className="gms-input" value={latMin} onChange={(e) => setLatMin(e.target.value)} />
                                            <input type="text" id="latSec" placeholder="S" className="gms-input" value={latSec} onChange={(e) => setLatSec(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {projection === 'utm' && (
                        <div id="utmCoordInputs">
                            <div className="input-group">
                                <label htmlFor="utmX">Coordenada X:</label><input type="text" id="utmX" value={utmX} onChange={(e) => setUtmX(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label htmlFor="utmY">Coordenada Y:</label><input type="text" id="utmY" value={utmY} onChange={(e) => setUtmY(e.target.value)} />
                            </div>
                        </div>
                    )}

                    <div className="button-group">
                        <button onClick={handleDrawPoint}>DIBUJAR</button>
                        <button onClick={handleClearCoords}>LIMPIAR</button>
                    </div>
                </div>
            )}

            {inputType === 'kml' && (
                <div id="kmlInputs" style={{ marginTop: '20px' }}>
                    <h4>Ingresar KML</h4>
                    <input type="file" id="kmlFileInput" accept=".kml" style={{ marginBottom: '10px' }} onChange={(e) => setKmlFile(e.target.files[0])} />
                    <button onClick={handleProcessKml}>PROCESAR KML</button>
                </div>
            )}
        </div>
    );
};

// --- DownloadTools Component ---
const DownloadTools = ({ displayLayers, onCloseModal }) => {
    const handleExportKML = async () => {
        const geoJsonToExport = displayLayers.toGeoJSON();

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
            onCloseModal();
        } catch (error) {
            console.error('Error al exportar a KML:', error);
            alertify.error('Ocurrió un error durante la exportación a KML.');
        }
    };

    const handleExportShapefile = async () => {
        const geoJsonToExport = displayLayers.toGeoJSON();

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
            onCloseModal();
        } catch (error) {
            console.error('Error al exportar a Shapefile:', error);
            alertify.error('Ocurrió un error durante la exportación a Shapefile.');
        }
    };

    return (
        <div className="download-modal-content-inner">
            <p style={{ marginTop: 0, marginBottom: '10px' }}>Exportar todas las geometrías visibles en el mapa.</p>
            <button onClick={handleExportKML} style={{ padding: '10px', width: '100%', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '10px' }}>
                Descargar como KML
            </button>
            <button onClick={handleExportShapefile} style={{ padding: '10px', width: '100%', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Descargar como Shapefile (ZIP)
            </button>
        </div>
    );
};


// --- Componente Principal de Controles ---
const MapControls = ({ displayMode, map, displayLayers, measurementLayers, persistentMeasurementLayers }) => { // Remove editableUserLayers
    const [measureModalOpen, setMeasureModalOpen] = useState(false);
    const [drawModalOpen, setDrawModalOpen] = useState(false);
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);

    return (
        <>
            {/* Contenedor para los botones principales */}
            <div className="leaflet-top leaflet-left" style={{ zIndex: 1000, top: '200px' }}> {/* Revert top offset to 200px */}
                <div className="leaflet-control leaflet-bar">
                    <button
                        className="leaflet-control-custom-button"
                        title="Abrir Mediciones"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMeasureModalOpen(prev => !prev);
                        }}
                    >
                        📏
                    </button>
                    {displayMode === 'full' && (
                        <>
                            <button
                                className="leaflet-control-custom-button"
                                title="Abrir Herramientas de Dibujo"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDrawModalOpen(prev => !prev);
                                }}
                            >
                                ✏️
                            </button>
                            <button
                                className="leaflet-control-custom-button"
                                title="Descargar Datos"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDownloadModalOpen(prev => !prev);
                                }}
                            >
                                ⬇️
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Modales que se renderizan fuera del flujo del mapa */}
            <Modal title="Mediciones" isOpen={measureModalOpen} onClose={() => setMeasureModalOpen(false)}>
                {map && displayLayers && measurementLayers && persistentMeasurementLayers && (
                    <MeasureTools
                        map={map}
                        displayLayers={displayLayers} // Pass displayLayers
                        measurementLayers={measurementLayers}
                        persistentMeasurementLayers={persistentMeasurementLayers}
                        onCloseModal={() => setMeasureModalOpen(false)}
                    />
                )}
            </Modal>

            <Modal title="Dibujar" isOpen={drawModalOpen} onClose={() => setDrawModalOpen(false)}>
                {map && displayLayers && (
                    <DrawTools
                        map={map}
                        displayLayers={displayLayers} // Pass displayLayers
                        onCloseModal={() => setDrawModalOpen(false)}
                    />
                )}
            </Modal>

            <Modal title="Descargar Datos" isOpen={downloadModalOpen} onClose={() => setDownloadModalOpen(false)}>
                {displayLayers && (
                    <DownloadTools
                        displayLayers={displayLayers}
                        onCloseModal={() => setDownloadModalOpen(false)}
                    />
                )}
            </Modal>
        </>
    );
};

export default MapControls;