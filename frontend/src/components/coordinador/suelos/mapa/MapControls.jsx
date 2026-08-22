import React, { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet-draw'; // Necesario para L.Draw.Polygon (usado en MeasureTools)
import { toLatLon } from 'utm'; // Needed for coordinate conversion
import { kml } from '@tmcw/togeojson'; // Corrected: Needed for KML processing
import { DOMParser } from 'xmldom'; // Needed for KML processing
import alertify from 'alertifyjs'; // Needed for alerts
import axiosInstance from '@/api/axios.js'; // Import axiosInstance
import { saveAs } from 'file-saver'; // Needed for KML download
import './MapControls.css'; // Archivo CSS para los nuevos controles

// Helper function from SuelosMap.jsx
const getPolygonArea = (latLngs) => {
    if (!latLngs || latLngs.length < 3) {
        return 0;
    }
    return L.GeometryUtil.geodesicArea(latLngs);
};

const parseToMeters = (progStr) => {
    if (!progStr) return null;
    try {
        const clean = progStr.toLowerCase().replace('km', '').replace(/\s+/g, '').replace(',', '.');
        if (!clean.includes('+')) {
            const val = parseFloat(clean);
            return isNaN(val) ? null : val * 1000;
        }
        const [km, meters] = clean.split('+');
        return (parseFloat(km || 0) * 1000) + parseFloat(meters || 0);
    } catch (e) {
        return null;
    }
};

const Modal = ({ title, isOpen, onClose, headerColor, children }) => {
    if (!isOpen) return null;

    return (
        <div className="map-popover-premium" style={{ '--popover-color': headerColor || '#004b8d' }}>
            <div className="popover-header">
                <span>{title}</span>
                <button onClick={onClose} className="popover-close-btn">&times;</button>
            </div>
            <div className="popover-content">
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
    const [progToLocate, setProgToLocate] = useState('');

    const rubberBandLineRef = React.useRef(null);
    const areaDrawerRef = React.useRef(null);
    const currentPolylineRef = React.useRef(null);

    const clearMeasurement = useCallback(() => {
        measurementLayers.clearLayers();
        setMeasuredPoints([]);
        currentPolylineRef.current = null;
        if (rubberBandLineRef.current) {
            rubberBandLineRef.current.remove();
            rubberBandLineRef.current = null;
        }
        setDistanceDisplay('Seleccione una herramienta.');
        setIsMeasuringDistance(false);
        setIsMeasuringArea(false);
        if (areaDrawerRef.current) {
            areaDrawerRef.current.disable();
            areaDrawerRef.current = null;
        }
        map.getContainer().style.cursor = '';
    }, [map, measurementLayers]);

    const clearAllMeasurements = useCallback(() => {
        clearMeasurement();
        persistentMeasurementLayers.clearLayers();
    }, [clearMeasurement, persistentMeasurementLayers]);

    const handleMeasureMouseMove = useCallback((e) => {
        if (!isMeasuringDistance || measuredPoints.length === 0) return;

        if (rubberBandLineRef.current) {
            rubberBandLineRef.current.setLatLngs([measuredPoints[measuredPoints.length - 1], e.latlng]);
        } else {
            rubberBandLineRef.current = L.polyline([measuredPoints[measuredPoints.length - 1], e.latlng], { color: '#0369a1', weight: 2, opacity: 0.6, dashArray: '5, 10' }).addTo(measurementLayers);
        }

        let existingDist = 0;
        if (currentPolylineRef.current) {
            const latlngs = currentPolylineRef.current.getLatLngs();
            for (let i = 0; i < latlngs.length - 1; i++) {
                existingDist += latlngs[i].distanceTo(latlngs[i + 1]);
            }
        }
        const total = existingDist + measuredPoints[measuredPoints.length - 1].distanceTo(e.latlng);
        setDistanceDisplay(`Distancia: ${(total / 1000).toFixed(3)} km`);
    }, [isMeasuringDistance, measuredPoints, measurementLayers]);

    useEffect(() => {
        if (!map || !isMeasuringDistance) return;

        const handleMapClick = (e) => {
            setMeasuredPoints(prev => {
                const newPoints = [...prev, e.latlng];
                L.marker(e.latlng, { icon: L.divIcon({ className: 'measure-point-node', html: '●', iconSize: [10, 10] }) }).addTo(measurementLayers);

                if (newPoints.length === 1) {
                    currentPolylineRef.current = L.polyline([e.latlng], { color: '#2563eb', weight: 4 }).addTo(measurementLayers);
                } else {
                    currentPolylineRef.current.addLatLng(e.latlng);
                    const dist = newPoints[newPoints.length - 2].distanceTo(e.latlng);
                    const center = L.latLng((newPoints[newPoints.length - 2].lat + e.latlng.lat) / 2, (newPoints[newPoints.length - 2].lng + e.latlng.lng) / 2);
                    L.marker(center, { icon: L.divIcon({ className: 'measure-label', html: `${(dist / 1000).toFixed(2)} km` }) }).addTo(measurementLayers);
                }
                return newPoints;
            });
        };

        const handleMapDblClick = () => {
            if (currentPolylineRef.current) {
                const group = new L.FeatureGroup();
                measurementLayers.eachLayer(l => group.addLayer(l));
                persistentMeasurementLayers.addLayer(group);
                measurementLayers.clearLayers();
            }
            clearMeasurement();
            alertify.message('Medición finalizada');
        };

        map.on('click', handleMapClick);
        map.on('dblclick', handleMapDblClick);
        map.on('mousemove', handleMeasureMouseMove);
        map.getContainer().style.cursor = 'crosshair';

        return () => {
            map.off('click', handleMapClick);
            map.off('dblclick', handleMapDblClick);
            map.off('mousemove', handleMeasureMouseMove);
        };
    }, [map, isMeasuringDistance, handleMeasureMouseMove, measurementLayers, persistentMeasurementLayers, clearMeasurement]);

    useEffect(() => {
        if (!map || !isMeasuringArea) return;
        const handleCreated = (e) => {
            if (e.layerType === 'polygon') {
                const area = getPolygonArea(e.layer.getLatLngs()[0]);
                e.layer.bindPopup(`Área: ${(area / 10000).toFixed(2)} ha`).openPopup();
                displayLayers.addLayer(e.layer);
                clearMeasurement();
            }
        };
        map.on(L.Draw.Event.CREATED, handleCreated);
        return () => map.off(L.Draw.Event.CREATED, handleCreated);
    }, [map, isMeasuringArea, displayLayers, clearMeasurement]);

    const handleLocateProg = () => {
        if (!progToLocate) return;
        const meters = parseToMeters(progToLocate);
        if (meters === null) return alertify.error("0+100");
        const layers = (window.suelosProgresivasLayerGroup || displayLayers).getLayers();
        const found = layers.find(l => {
            if (l.options?.title) return parseToMeters(l.options.title.split(' ')[0]) === meters;
            return false;
        });
        if (found) {
            map.flyTo(found.getLatLng(), 18);
            found.openPopup();
            onCloseModal();
        } else alertify.warning("No encontrada");
    };

    return (
        <div className="measure-modal-content-premium">
            <div className="tools-grid-three">
                <button className={`modal-tool-btn ${isMeasuringDistance ? 'active' : ''}`} onClick={() => setIsMeasuringDistance(!isMeasuringDistance)}>
                    <i className="fas fa-ruler"></i>
                    <span>Distancia</span>
                </button>
                <button className={`modal-tool-btn ${isMeasuringArea ? 'active' : ''}`} onClick={() => setIsMeasuringArea(!isMeasuringArea)}>
                    <i className="fas fa-draw-polygon"></i>
                    <span>Área</span>
                </button>
                <button className="modal-tool-btn delete" onClick={clearAllMeasurements}>
                    <i className="fas fa-trash"></i>
                    <span>Limpiar</span>
                </button>
            </div>
            <div className="instruction-box">{distanceDisplay}</div>
            <div className="locate-section">
                <label>Ubicar Progresiva:</label>
                <div className="locate-input-group">
                    <input type="text" placeholder="Km 4+780" value={progToLocate} onChange={(e) => setProgToLocate(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLocateProg()} />
                    <button className="locate-go-btn" onClick={handleLocateProg}>Ir</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW: DrawTools Component ---
const DrawTools = ({ map, displayLayers, onCloseModal }) => {
    const [inputType, setInputType] = useState('coordinates');
    const [projection, setProjection] = useState('utm');
    const [utmZone, setUtmZone] = useState('ZONA 18');
    const [latInput, setLatInput] = useState('');
    const [lonInput, setLonInput] = useState('');
    const fileInputRef = React.useRef(null);

    const handleDrawPoint = () => {
        let lat = parseFloat(latInput);
        let lon = parseFloat(lonInput);
        if (projection === 'utm') {
            try {
                const zoneNum = parseInt(utmZone.replace(/[^0-9]/g, ''));
                const utmCoords = toLatLon(lon, lat, zoneNum, 'S');
                lat = utmCoords.latitude; lon = utmCoords.longitude;
            } catch (e) { return alertify.error('Error UTM'); }
        }
        if (isNaN(lat) || isNaN(lon)) return alertify.error('Coordenadas inválidas');
        L.marker([lat, lon]).addTo(displayLayers);
        alertify.success('Punto dibujado');
        onCloseModal();
    };

    const handleKmlUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const kmlText = event.target.result;
                const kmlDoc = new DOMParser().parseFromString(kmlText, 'text/xml');
                const geojson = kml(kmlDoc);
                const layer = L.geoJSON(geojson).addTo(displayLayers);
                if (layer.getBounds().isValid()) map.fitBounds(layer.getBounds());
                alertify.success('KML cargado');
                onCloseModal();
            } catch (err) { alertify.error('Error al procesar KML'); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="draw-modal-content-premium">
            <div className="modal-form-group">
                <label>Tipo de Entrada:</label>
                <select value={inputType} onChange={(e) => setInputType(e.target.value)}>
                    <option value="coordinates">Coordenadas</option>
                    <option value="kml">Cargar KML</option>
                </select>
            </div>

            {inputType === 'coordinates' ? (
                <>
                    <div className="modal-form-group">
                        <label>Proyección:</label>
                        <select value={projection} onChange={(e) => setProjection(e.target.value)}>
                            <option value="utm">UTM</option>
                            <option value="geographic">GEOGRÁFICAS</option>
                        </select>
                    </div>
                    {projection === 'utm' && (
                        <div className="modal-form-group">
                            <label>Zona:</label>
                            <select value={utmZone} onChange={(e) => setUtmZone(e.target.value)}>
                                <option value="ZONA 17">ZONA 17</option>
                                <option value="ZONA 18">ZONA 18</option>
                                <option value="ZONA 19">ZONA 19</option>
                            </select>
                        </div>
                    )}
                    <div className="modal-form-row">
                        <div className="modal-form-group half">
                            <input type="text" placeholder={projection === 'utm' ? 'Este (X)' : 'Latitud'} value={latInput} onChange={(e) => setLatInput(e.target.value)} />
                        </div>
                        <div className="modal-form-group half">
                            <input type="text" placeholder={projection === 'utm' ? 'Norte (Y)' : 'Longitud'} value={lonInput} onChange={(e) => setLonInput(e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-draw" onClick={handleDrawPoint}>DIBUJAR</button>
                        <button className="btn-clear" onClick={() => { setLatInput(''); setLonInput(''); }}>LIMPIAR</button>
                    </div>
                </>
            ) : (
                <div className="modal-form-group">
                    <label>Seleccionar Archivo:</label>
                    <input type="file" accept=".kml" onChange={handleKmlUpload} ref={fileInputRef} style={{ padding: '8px 0' }} />
                </div>
            )}
        </div>
    );
};

// --- DownloadTools Component ---
const DownloadTools = ({ displayLayers, onCloseModal }) => {
    // ... logic remains same for extraction ...
    const extractStylesForExport = (featureGroup) => {
        const features = [];
        if (!featureGroup) return features;
        featureGroup.eachLayer(layer => {
            if (layer.toGeoJSON) {
                const geojson = layer.toGeoJSON();
                const processFeature = (f, l) => {
                    f.properties = f.properties || {};
                    if (!f.properties.nombre && !f.properties.name) f.properties.nombre = 'Elemento';
                    return f;
                };
                features.push(processFeature(geojson, layer));
            }
        });
        return features;
    };

    const handleExportKML = async () => {
        const drawnFeatures = extractStylesForExport(displayLayers);
        const geoJsonToExport = { type: 'FeatureCollection', features: drawnFeatures };
        if (geoJsonToExport.features.length === 0) return alertify.error('No hay elementos');
        try {
            const response = await axiosInstance.post('/api/trafico/exportar-kml', geoJsonToExport, { responseType: 'blob' });
            saveAs(response.data, 'geoportal_export.kml');
            onCloseModal();
        } catch (error) { alertify.error('Error exportación'); }
    };

    const handleExportShapefile = async () => {
        const drawnFeatures = extractStylesForExport(displayLayers);
        const geoJsonToExport = { type: 'FeatureCollection', features: drawnFeatures };
        if (geoJsonToExport.features.length === 0) return alertify.error('No hay elementos');
        try {
            const response = await axiosInstance.post('/api/trafico/exportar-shapefile', geoJsonToExport, { responseType: 'blob' });
            saveAs(response.data, 'geoportal_export.zip');
            onCloseModal();
        } catch (error) { alertify.error('Error exportación'); }
    };

    return (
        <div className="download-modal-content-premium">
            <p className="description-text">Exportar todas las geometrías dibujadas en el mapa.</p>
            <div className="export-actions">
                <button className="btn-export" onClick={handleExportKML}>
                    <i className="fas fa-file-code me-2"></i> Descargar como KML
                </button>
                <button className="btn-export" onClick={handleExportShapefile}>
                    <i className="fas fa-file-archive me-2"></i> Descargar como Shapefile (ZIP)
                </button>
            </div>
        </div>
    );
};


// --- Componente Principal de Controles ---
const MapControls = ({ displayMode, map, displayLayers, measurementLayers, persistentMeasurementLayers }) => {
    const [measureModalOpen, setMeasureModalOpen] = useState(false);
    const [drawModalOpen, setDrawModalOpen] = useState(false);
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [hasDrawings, setHasDrawings] = useState(false);

    // Efecto para detectar si hay dibujos en el mapa
    useEffect(() => {
        const checkLayers = () => {
            const count = (displayLayers?.getLayers().length || 0) +
                (measurementLayers?.getLayers().length || 0) +
                (persistentMeasurementLayers?.getLayers().length || 0);
            setHasDrawings(count > 0);
        };
        const interval = setInterval(checkLayers, 1000);
        return () => clearInterval(interval);
    }, [displayLayers, measurementLayers, persistentMeasurementLayers]);

    const isHorizontal = displayMode === 'horizontal-bottom';

    return (
        <>
            <div
                className={isHorizontal ? "leaflet-bottom leaflet-left" : "leaflet-top leaflet-left"}
                style={{
                    zIndex: 1000,
                    position: 'absolute',
                    margin: 0,
                    padding: 0,
                    ...(isHorizontal ? {
                        bottom: '25px',
                        left: '370px',
                        top: 'auto'
                    } : {
                        top: '110px',
                        left: '1px'
                    })
                }}
            >
                <div style={{ display: 'flex', flexDirection: isHorizontal ? 'column-reverse' : 'row', gap: '15px', alignItems: isHorizontal ? 'flex-start' : 'initial' }}>
                    <div className={`leaflet-control leaflet-bar ${isHorizontal ? 'horizontal-controls-premium' : 'vertical-controls-premium'}`}>
                        <button className={`leaflet-control-custom-button-premium ${measureModalOpen ? 'active-tool' : ''}`} title="Herramientas de Medición" onClick={() => { setMeasureModalOpen(!measureModalOpen); setDrawModalOpen(false); setDownloadModalOpen(false); }}>
                            <i className="fas fa-ruler-combined"></i>
                        </button>
                        <button className={`leaflet-control-custom-button-premium ${drawModalOpen ? 'active-tool' : ''}`} title="Herramientas de Dibujo" onClick={() => { setDrawModalOpen(!drawModalOpen); setMeasureModalOpen(false); setDownloadModalOpen(false); }}>
                            <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button className={`leaflet-control-custom-button-premium ${downloadModalOpen ? 'active-tool' : ''}`} title="Exportar Capas" onClick={() => { setDownloadModalOpen(!downloadModalOpen); setMeasureModalOpen(false); setDrawModalOpen(false); }}>
                            <i className="fas fa-file-download"></i>
                        </button>

                        {hasDrawings && (
                            <>
                                {isHorizontal ? (
                                    <div style={{ width: '1px', backgroundColor: '#334155', height: '24px', margin: '0 8px' }}></div>
                                ) : (
                                    <div style={{ height: '8px', borderTop: '1px solid #f1f5f9' }}></div>
                                )}
                                <button className="leaflet-control-custom-button-premium save-btn" title="Guardar Cambios" onClick={() => alertify.success('Guardado')}>
                                    <i className="fas fa-save"></i>
                                </button>
                                <button className="leaflet-control-custom-button-premium delete-btn" title="Limpiar Mapa" onClick={() => {
                                    if (window.confirm('¿Borrar todo?')) {
                                        measurementLayers?.clearLayers();
                                        persistentMeasurementLayers?.clearLayers();
                                        displayLayers?.clearLayers();
                                    }
                                }}>
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                            </>
                        )}
                    </div>

                    <div className={isHorizontal ? "popover-container-premium horizontal-popover" : "popover-container-premium"}>
                        <Modal title="Mediciones" isOpen={measureModalOpen} onClose={() => setMeasureModalOpen(false)} headerColor="#004b8d">
                            <MeasureTools map={map} displayLayers={displayLayers} measurementLayers={measurementLayers} persistentMeasurementLayers={persistentMeasurementLayers} onCloseModal={() => setMeasureModalOpen(false)} />
                        </Modal>
                        <Modal title="Herramientas de Dibujo" isOpen={drawModalOpen} onClose={() => setDrawModalOpen(false)} headerColor="#e67e22">
                            <DrawTools map={map} displayLayers={displayLayers} onCloseModal={() => setDrawModalOpen(false)} />
                        </Modal>
                        <Modal title="Descargar Datos" isOpen={downloadModalOpen} onClose={() => setDownloadModalOpen(false)} headerColor="#8b5cf6">
                            <DownloadTools displayLayers={displayLayers} onCloseModal={() => setDownloadModalOpen(false)} />
                        </Modal>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MapControls;