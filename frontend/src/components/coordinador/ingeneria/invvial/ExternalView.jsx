import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, LayersControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ExternalView.css';
import './map/loading.css'; // Ensure loading styles are available
import * as turf from '@turf/turf';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import { fromLatLon } from 'utm';
import { GeoJSON, FeatureGroup } from 'react-leaflet'; // Import GeoJSON and FeatureGroup
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import DataManagementModal from './DataManagementModal'; // Import modal

// Reuse icons and map logic from DashboardMap if possible, or redefine here for independence
// Since DashboardMap has good logic for projection, we'll try to reuse or inline simplified version.

const DrawHandler = ({ activeTool, onCreated, onStop }) => {
    const map = useMap();
    const drawHandlerRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        // Cleanup existing handler if active
        if (drawHandlerRef.current) {
            drawHandlerRef.current.disable();
            drawHandlerRef.current = null;
        }

        if (activeTool === 'marker') {
            drawHandlerRef.current = new L.Draw.Marker(map);
            drawHandlerRef.current.enable();
        } else if (activeTool === 'polygon') {
            drawHandlerRef.current = new L.Draw.Polygon(map, {
                allowIntersection: false,
                showArea: true,
                metric: true
            });
            drawHandlerRef.current.enable();
        }

        // Event Listener
        const handleCreated = (e) => {
            const layer = e.layer;
            if (onCreated) onCreated(layer, e.layerType);

            if (onStop) onStop();
        };

        map.on(L.Draw.Event.CREATED, handleCreated);

        return () => {
            if (drawHandlerRef.current) {
                drawHandlerRef.current.disable();
                drawHandlerRef.current = null;
            }
            map.off(L.Draw.Event.CREATED, handleCreated);
        };
    }, [activeTool, map, onCreated, onStop]);

    return null;
};

const isValidCoordinate = (lat, lng) => {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat !== null &&
        lng !== null &&
        lat !== 0 && lng !== 0
    );
};

// --- ICON DEFINITIONS ---
const getIcon = (type) => {
    let iconUrl = '/imgs/alcantarilla_icon.png';
    let iconSize = [25, 25];
    let iconAnchor = [12, 12];

    switch (type) {
        case 'alcantarillas': iconUrl = '/imgs/alcantarilla_icon.png'; iconSize = [28, 28]; break;
        case 'badenes': iconUrl = '/imgs/baden_icon.svg'; iconSize = [28, 28]; break;
        case 'puentes': iconUrl = '/imgs/puente_icon.svg'; iconSize = [28, 28]; break;
        case 'muros': iconUrl = '/imgs/muro_icon.svg'; iconSize = [28, 28]; break;
        case 'senales_informativas': iconUrl = '/imgs/senal_informativa_icon.svg'; iconSize = [28, 28]; break;
        case 'senales_reglamentarias': iconUrl = '/imgs/senal_reglamentaria_icon.svg'; iconSize = [28, 28]; break;
        case 'senales_preventivas': iconUrl = '/imgs/senal_preventiva_icon.svg'; iconSize = [28, 28]; break;
        case 'hitos_kilometricos': iconUrl = '/imgs/hito_icon.svg'; iconSize = [18, 18]; break;
        case 'canteras': iconUrl = '/imgs/cantera_icon.svg'; iconSize = [28, 28]; break;
        case 'fuentes': iconUrl = '/imgs/fuente_icon.svg'; iconSize = [28, 28]; break;
        case 'zonas_criticas': iconUrl = '/imgs/zona_critica.svg'; iconSize = [28, 28]; break;
        case 'interferencias': iconUrl = '/imgs/interferencia_icon.svg'; iconSize = [28, 28]; break;
        case 'estructuras_existentes': iconUrl = '/imgs/estructura_icon.svg'; iconSize = [28, 28]; break;
        default: break;
    }

    return L.icon({
        iconUrl,
        iconSize,
        iconAnchor,
        popupAnchor: [0, -12]
    });
};

// --- MAP FITTER ---
const MapFitter = ({ bounds }) => {
    const map = useMap();
    const hasFittedRef = useRef(false);

    useEffect(() => {
        if (bounds && bounds.isValid() && !hasFittedRef.current) {
            map.fitBounds(bounds, { padding: [50, 50] });
            hasFittedRef.current = true;
        }
    }, [bounds, map]);
    return null;
};

const MapResizer = ({ isLeftOpen, isRightOpen }) => {
    const map = useMap();
    useEffect(() => {
        // Wait for transition to finish or at least start invalidating
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300); // Match CSS transition time
        return () => clearTimeout(timer);
    }, [map, isLeftOpen, isRightOpen]);
    return null;
};

const RouteFitter = ({ geoJson }) => {
    const map = useMap();
    const hasFittedRef = useRef(false);

    useEffect(() => {
        if (geoJson && !hasFittedRef.current) {
            const layer = L.geoJSON(geoJson);
            if (layer.getBounds().isValid()) {
                map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                hasFittedRef.current = true;
            }
        }
    }, [geoJson, map]);
    return null;
};

const MapToolbar = ({ activeTool, setActiveTool, rightSidebarOpen, setRightSidebarOpen }) => {
    const toggle = (tool) => {
        setActiveTool(activeTool === tool ? null : tool);
    };

    return (
        <div className="map-toolbar">
            {/* Layers / Sidebar Toggle at the top */}
            <button
                className={`map-tool-btn ${rightSidebarOpen ? 'active' : ''}`}
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                title="Capas y Capas Base"
                style={{ borderBottom: '2px solid #eee' }}
            >
                <i className="fa-solid fa-layer-group"></i>
            </button>

            <button className={`map-tool-btn ${activeTool === 'marker' ? 'active' : ''}`} onClick={() => toggle('marker')} title="Marcador"><i className="fa-solid fa-map-pin"></i></button>
            <button className={`map-tool-btn ${activeTool === 'line' ? 'active' : ''}`} onClick={() => toggle('line')} title="Línea"><i className="fa-solid fa-slash"></i></button>
            <button className={`map-tool-btn ${activeTool === 'polygon' ? 'active' : ''}`} onClick={() => toggle('polygon')} title="Polígono"><i className="fa-solid fa-draw-polygon"></i></button>
            <button className={`map-tool-btn ${activeTool === 'info' ? 'active' : ''}`} onClick={() => toggle('info')} title="Información"><i className="fa-solid fa-info"></i></button>
            <button className="map-tool-btn" title="Borrar" onClick={() => setActiveTool('clear')}><i className="fa-solid fa-eraser"></i></button>
        </div>
    );
};

const DistanceMeasurement = ({ isActive, measuredPoints, setMeasuredPoints, measurementLayers }) => {
    const map = useMap();
    const [rubberBandLine, setRubberBandLine] = useState(null);

    useMapEvents({
        click(e) {
            if (!isActive) return;
            const newPoints = [...measuredPoints, e.latlng];
            setMeasuredPoints(newPoints);

            // Add marker for point
            L.marker(e.latlng, {
                icon: L.divIcon({
                    className: 'measure-point-icon',
                    html: '<span style="background:red; width:8px; height:8px; display:block; border-radius:50%; border:2px solid white;"></span>',
                    iconSize: [8, 8]
                })
            }).addTo(measurementLayers);

            if (newPoints.length > 1) {
                const prevPoint = newPoints[newPoints.length - 2];
                const segment = L.polyline([prevPoint, e.latlng], { color: 'red', weight: 3 }).addTo(measurementLayers);
                const dist = prevPoint.distanceTo(e.latlng);

                L.marker(segment.getCenter(), {
                    icon: L.divIcon({
                        className: 'measure-label',
                        html: `<span style="background:white; padding:2px 5px; border-radius:3px; border:1px solid #ccc; font-size:10px; font-weight:bold;">${(dist / 1000).toFixed(2)} km</span>`,
                        iconAnchor: [0, 0]
                    })
                }).addTo(measurementLayers);
            }
        },
        mousemove(e) {
            if (!isActive || measuredPoints.length === 0) return;
            if (rubberBandLine) {
                rubberBandLine.setLatLngs([measuredPoints[measuredPoints.length - 1], e.latlng]);
            } else {
                const rb = L.polyline([measuredPoints[measuredPoints.length - 1], e.latlng], {
                    color: 'blue', weight: 2, opacity: 0.5, dashArray: '5, 10'
                }).addTo(map);
                setRubberBandLine(rb);
            }
        },
        dblclick() {
            if (!isActive) return;
            if (rubberBandLine) {
                rubberBandLine.remove();
                setRubberBandLine(null);
            }
        }
    });

    useEffect(() => {
        if (!isActive && rubberBandLine) {
            rubberBandLine.remove();
            setRubberBandLine(null);
        }
    }, [isActive, rubberBandLine]);

    return null;
};

const MouseCoordsListener = ({ isActive, setCoords }) => {
    useMapEvents({
        mousemove(e) {
            if (isActive) setCoords(e.latlng);
        }
    });
    return null;
};

// --- MOUSE COORDINATES CONTROL (Floating Display) ---
const MouseCoordinatesControl = () => {
    const map = useMap();
    const [coordsInfo, setCoordsInfo] = useState(null);

    useMapEvents({
        mousemove(e) {
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            const zoom = map.getZoom();
            // Formula from geoite.jsx to calculate scale approx
            const metersPerPixel = 156543.03 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
            const scale = Math.round(metersPerPixel * 3779.52);

            try {
                const utmCoords = fromLatLon(lat, lon);
                setCoordsInfo({
                    scale,
                    lat: lat.toFixed(5),
                    lon: lon.toFixed(5),
                    easting: utmCoords.easting.toFixed(2),
                    northing: utmCoords.northing.toFixed(2),
                    zone: `${utmCoords.zoneNum}${utmCoords.zoneLetter}`
                });
            } catch (err) {
                // UTM conversion might fail for extreme latitudes
                setCoordsInfo(null);
            }
        },
        mouseout() {
            setCoordsInfo(null);
        }
    });

    if (!coordsInfo) return null;

    return (
        <div className="leaflet-control-coordinates">
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: '1.5em' }}>
                <div>Escala: ~1:{coordsInfo.scale.toLocaleString('en-US')}</div>
                <div>Coordenada Este: {coordsInfo.easting}</div>
                <div>Longitud: {coordsInfo.lon}</div>
                <div>Coordenada Norte: {coordsInfo.northing}</div>
                <div>Latitud: {coordsInfo.lat}</div>
                <div>Sistema Coordenadas: WGS'84 Zona {coordsInfo.zone}</div>
            </div>
        </div>
    );
};

/* --- RICH POPUP COMPONENTS --- */

// Helper: Parse "25+000" or similar strings to numeric float (Km.m)
const parseProgresiva = (val) => {
    if (!val) return null;
    const str = String(val).trim();
    if (str.includes('+')) {
        const parts = str.split('+');
        const km = parseFloat(parts[0]);
        const m = parseFloat(parts[1]);
        if (!isNaN(km)) {
            const mVal = isNaN(m) ? 0 : m;
            return km + (mVal / 1000);
        }
    }
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
};

const MarkerWithZoom = ({ point, graphicsImages, onShowDetails }) => {
    const map = useMap();

    const handleMarkerClick = (e) => {
        const targetZoom = 17; // Reduced from 18 to show more map context as requested
        const latLng = [point.lat, point.lng];

        // Project to pixels, subtract offset, unproject back (matching geoite.jsx)
        const p = map.project(latLng, targetZoom);
        const targetP = p.subtract([0, 150]); // 150px offset upwards
        const targetLatLng = map.unproject(targetP, targetZoom);

        map.flyTo(targetLatLng, targetZoom, {
            animate: true,
            duration: 1.5
        });
    };

    return (
        <Marker
            position={[point.lat, point.lng]}
            icon={getIcon(point.type)}
            eventHandlers={{ click: handleMarkerClick }}
        >
            <Popup>
                <RichPopupContent point={point} graphicsImages={graphicsImages} onShowDetails={onShowDetails} />
            </Popup>
        </Marker>
    );
};

const SimpleImageGallery = ({ images }) => {
    const [index, setIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="popup-image-container">
                <div className="popup-img-wrapper">
                    <span style={{ color: '#999', fontSize: '12px' }}>Sin imagen</span>
                </div>
            </div>
        );
    }

    const currentImg = images[index];
    // Handle both object {url: '...'} and string '...' formats
    const imgUrl = typeof currentImg === 'string' ? currentImg : (currentImg?.url || currentImg?.path || '');
    const imgDate = currentImg?.fecha_hora || currentImg?.date || '';

    const next = (e) => {
        e.stopPropagation();
        setIndex((prev) => (prev + 1) % images.length);
    };

    const prev = (e) => {
        e.stopPropagation();
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="popup-image-container">
            <div className="popup-img-wrapper">
                <img src={imgUrl} alt={`Foto ${index + 1}`} onError={(e) => e.target.style.display = 'none'} />
            </div>

            {images.length > 1 && (
                <>
                    <button className="popup-img-nav popup-img-prev" onClick={prev}><i className="fa-solid fa-chevron-left"></i></button>
                    <button className="popup-img-nav popup-img-next" onClick={next}><i className="fa-solid fa-chevron-right"></i></button>
                    <div className="popup-img-index">{index + 1} / {images.length}</div>
                </>
            )}

            {imgDate && <div className="popup-img-date">{imgDate}</div>}
        </div>
    );
};

const RichPopupContent = ({ point, graphicsImages, onShowDetails }) => {
    const { data, displayType } = point;
    // Adapt data fields based on "format 2" showing generic fields
    // Fields: CÓDIGO, ESTADO, UBICACIÓN, COORDENADA, CATEGORÍA, ENTREGABLE

    // Fallback logic for fields
    const codigo = data.codigo || data.cod_progresiva || data.id || 'S/N';
    const estado = data.estado_conservacion || data.condicion || '---';
    const ubicacion = data.progresiva ? `KM ${data.progresiva}` : (data.prog_inicio ? `KM ${data.prog_inicio}` : '---');

    // Coordinates
    const lat = typeof point.lat === 'number' ? point.lat.toFixed(6) : '0.000000';
    const lng = typeof point.lng === 'number' ? point.lng.toFixed(6) : '0.000000';

    // Categoria derived from type
    let categoria = 'OBRAS DE ARTE';
    if (point.type === 'senales_informativas' || point.type === 'senales_preventivas') categoria = 'SEÑALIZACIÓN';
    if (point.type === 'hitos_kilometricos') categoria = 'SEÑALIZACIÓN';
    if (point.type === 'zonas_criticas') categoria = 'ZONA CRÍTICA';

    const entregable = data.entregable || 'E-1'; // Default or from data

    // --- FILTER IMAGES LOGIC (Matches Alcantarillas/Geoite) ---
    const elementImages = useMemo(() => {
        // If specific images are already attached, use them (fallback)
        if (data.images && data.images.length > 0) return data.images;

        let code = data.panel_fotografico_codigo;

        // Fallback: If no panel code, try matching by the Element Code (e.g. "KM 25+000")
        if (!code && data.codigo) {
            code = data.codigo;
        }

        if (!graphicsImages || !code) return [];

        const targetCode = String(code).trim();
        const targetCodeClean = targetCode.replace(/^KM\s*/i, '').trim();

        // 1. Try parsing Range Pattern: "538-543 - 1" -> Start: 538, End: 543, Suffix: 1
        // Regex: Number - Number - Number (Allowing spaces around dash)
        const rangeMatch = targetCode.match(/^(\d+)\s*-\s*(\d+)\s*-\s*(\d+)$/);
        let validRangeCodes = [];

        if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 10);
            const end = parseInt(rangeMatch[2], 10);
            const suffix = rangeMatch[3];

            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    // Generate candidates: "538-1", "539-1", etc.
                    validRangeCodes.push(`${i}-${suffix}`);
                }
            }
        }

        // 2. Aggressive numeric extraction (Fallback)
        const numberMatch = targetCode.match(/(\d+)/);
        const firstNumber = numberMatch ? numberMatch[0] : null;

        const elEntregableRaw = data.entregable ? String(data.entregable).trim() : 'E-1';

        return graphicsImages.filter(img => {
            const imgCode = String(img.panel_fotografico_codigo || '').trim();
            const imgIndex = img.index ? String(img.index).trim() : '';
            const imgEntregableRaw = img.entregable ? String(img.entregable).trim() : 'E-1';

            // Extract filename from URL (e.g., "http://.../360.jpg" -> "360")
            let urlFileName = '';
            if (img.url) {
                const parts = img.url.split('/');
                const fileNameWithExt = parts[parts.length - 1];
                urlFileName = fileNameWithExt.split('.')[0];
            }

            // Logic 1: Range Match
            if (validRangeCodes.length > 0) {
                const isRangeMatch = validRangeCodes.includes(imgIndex) ||
                    validRangeCodes.includes(imgCode) ||
                    validRangeCodes.includes(urlFileName);

                if (isRangeMatch) {
                    return elEntregableRaw === imgEntregableRaw;
                }
            }

            // Standard Match Logic (Fallback if Range is empty)
            if (validRangeCodes.length === 0) {
                const strictMatch = imgCode === targetCode || imgIndex === targetCode || urlFileName === targetCode;
                const cleanMatch = targetCodeClean && (imgCode === targetCodeClean || imgIndex === targetCodeClean || urlFileName === targetCodeClean);
                const numberMetricMatch = firstNumber && (imgIndex === firstNumber || urlFileName === firstNumber);

                const codeMatches = strictMatch || cleanMatch || numberMetricMatch;

                return codeMatches && (elEntregableRaw === imgEntregableRaw);
            }

            return false;
        });
    }, [data, graphicsImages]);

    return (
        <div className="invvial-map-popup-card">
            <div className="popup-header">
                {displayType.toUpperCase()}
            </div>

            <div className="popup-content">
                <SimpleImageGallery images={elementImages} />

                <div className="popup-details-grid">
                    <div className="detail-row">
                        <span className="label">CÓDIGO:</span>
                        <span className="value">{codigo}</span>
                    </div>
                    {(estado !== '---') && (
                        <div className="detail-row">
                            <span className="label">ESTADO:</span>
                            <span className="value">{estado}</span>
                        </div>
                    )}
                    <div className="detail-row">
                        <span className="label">UBICACIÓN:</span>
                        <span className="value">{ubicacion}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">COORDENADA:</span>
                        <span className="value" style={{ lineHeight: '1.2' }}>
                            {lng} E <br /> {lat} N
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">CATEGORÍA:</span>
                        <span className="value">{categoria}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">ENTREGABLE:</span>
                        <span className="value">{entregable}</span>
                    </div>
                </div>

                <button
                    className="popup-footer-btn"
                    onClick={() => onShowDetails && onShowDetails(point)}
                >
                    VER DETALLADO
                </button>
            </div>
        </div>
    );
};

// --- MAP LEGEND COMPONENT ---
const MapLegend = ({ onClose }) => {
    const legendItems = [
        { icon: '/imgs/alcantarilla_icon.png', label: 'Alcantarillas' },
        { icon: '/imgs/baden_icon.svg', label: 'Badenes' },
        { icon: '/imgs/puente_icon.svg', label: 'Puentes' },
        { icon: '/imgs/muro_icon.svg', label: 'Muros' },
        { icon: '/imgs/estructura_icon.svg', label: 'Est. Existentes' },
        { icon: '/imgs/senal_informativa_icon.svg', label: 'S. Informativas' },
        { icon: '/imgs/senal_reglamentaria_icon.svg', label: 'S. Reglamentarias' },
        { icon: '/imgs/senal_preventiva_icon.svg', label: 'S. Preventivas' },
        { icon: '/imgs/hito_icon.svg', label: 'Hitos Km' },
        { icon: '/imgs/zona_critica.svg', label: 'Zonas Críticas' },
        { icon: '/imgs/cantera_icon.svg', label: 'Canteras' },
        { icon: '/imgs/fuente_icon.svg', label: 'Fuentes de Agua' },
        { icon: '/imgs/interferencia_icon.svg', label: 'Interferencias' },
    ];

    return (
        <div className="map-legend-card">
            <div className="legend-header">
                <span>Leyenda</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#666' }}>&times;</button>
            </div>
            <div className="legend-grid">
                {legendItems.map((item, index) => (
                    <div key={index} className="legend-item">
                        <img src={item.icon} alt="" width="24" height="24" />
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
            <style jsx>{`
                .map-legend-card {
                    position: absolute;
                    bottom: 30px;
                    right: 80px; /* Left of layers button or similar */
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    z-index: 1000;
                    width: 320px;
                    max-height: 80vh;
                    overflow-y: auto;
                    font-family: 'Segoe UI', sans-serif;
                }
                .legend-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                    font-weight: bold;
                    color: #333;
                }
                .legend-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #555;
                }
            `}</style>
        </div>
    );
};

const ExternalView = ({
    onExit,
    // ... (rest of props)

    data, // Object containing { alcantarillas: [], badenes: [], etc. }
    kmlUrl, // New prop
    graphicsImages, // New prop for generic image filtering
    onShowDetails, // NEW: Click handler for "Ver Detallado"
    // Modal props
    showModal,
    onCloseModal,
    modalMode,
    selectedElementForEdit,
    onSaveManualData,
    onUploadExcelData,
    projectId,
    vialHeaderOption,
    activeTab,
    activeObrasSubTab,
    activeSeñalizacionSubTab,
    onDeleteElement,
    isNavbarExpanded,
    alcantarillasData,
    badenesData,
    puentesData,
    murosData,
    canterasData,
    fuentesData,
    zonasCriticasData,
    interferenciasData,
    senalesInformativasData,
    senalesPreventivasData,
    senalesReguladorasData,
    hitosKilometricosData
}) => {
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [routeGeoJson, setRouteGeoJson] = useState(null); // State for KML route
    const [isLoading, setIsLoading] = useState(true); // NEW: Loading state starts true
    const [activeTool, setActiveTool] = useState(null); // Tools state
    const [mouseCoords, setMouseCoords] = useState(null); // Coords state
    const [searchText, setSearchText] = useState(''); // NEW: Search state
    const [selectedCategory, setSelectedCategory] = useState(''); // NEW: Category filter
    const [selectedStatus, setSelectedStatus] = useState(''); // NEW: Status filter
    const [filterMin, setFilterMin] = useState(''); // NEW: Min Progresiva
    const [filterMax, setFilterMax] = useState(''); // NEW: Max Progresiva

    // NEW: Expanded sections state for right sidebar (collapsed by default)
    const [expandedSections, setExpandedSections] = useState({
        estructuras: false,
        senalizacion: false,
        riesgos: false
    });

    // NEW: Map Drawing & Measurement State
    const [measuredPoints, setMeasuredPoints] = useState([]);
    const [measurementLayers, setMeasurementLayers] = useState(new L.FeatureGroup());
    const [drawnItems, setDrawnItems] = useState(new L.FeatureGroup());

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleClearAll = () => {
        if (drawnItems) drawnItems.clearLayers();
        if (measurementLayers) measurementLayers.clearLayers();
        setMeasuredPoints([]);
        setActiveTool(null);
    };

    const [visibleLayers, setVisibleLayers] = useState({
        alcantarillas: true,
        badenes: true,
        puentes: true,
        muros: true,
        senales_informativas: true,
        senales_reglamentarias: true,
        senales_preventivas: true,
        hitos_kilometricos: true,
        canteras: true,
        fuentes: true,
        zonas_criticas: true,
        interferencias: true,
        estructuras_existentes: true
    });

    // Helper to calculate coords (Progresiva -> LatLon) could be complex to bring here 1:1 without route data.
    // For now, we will rely on data points having 'latitud' and 'longitud' properties populated 
    // or rely on the fact that standard data usually has it.
    // If we need the complex calibration logic, we might need to pass `kmlRoutes` or `calibrations` prop too.

    const allPoints = useMemo(() => {
        const points = [];
        if (!data) return points;

        const processGroup = (groupName, list, displayType) => {
            if (!visibleLayers[groupName] || !list) return;
            list.forEach(item => {
                // Check direct coords
                const lat = parseFloat(item.latitud);
                const lng = parseFloat(item.longitud);

                // Standardize Status
                const rawState = item.estado_conservacion || item.condicion || item.estado || '---';
                const state = rawState.trim();

                // Parse Progresiva
                const progValue = parseProgresiva(item.progresiva || item.prog_inicio || item.km);

                if (isValidCoordinate(lat, lng)) {
                    points.push({
                        lat, lng,
                        type: groupName,
                        displayType,
                        data: item,
                        state, // Normalized state property
                        prog: progValue // Numeric progresiva
                    });
                }
            });
        };

        processGroup('alcantarillas', data.alcantarillas, 'Alcantarilla');
        processGroup('badenes', data.badenes, 'Badén');
        processGroup('puentes', data.puentes, 'Puente');
        processGroup('muros', data.muros, 'Muro');
        processGroup('senales_informativas', data.senalesInformativas, 'Señal Inf.');
        processGroup('senales_reglamentarias', data.senalesReguladoras, 'Señal Reg.');
        processGroup('senales_preventivas', data.senalesPreventivas, 'Señal Prev.');
        processGroup('hitos_kilometricos', data.hitosKilometricos, 'Hito Km');
        processGroup('canteras', data.canteras, 'Cantera');
        processGroup('fuentes', data.fuentes, 'Fuente de Agua');
        processGroup('zonas_criticas', data.zonasCriticas, 'Zona Crítica');
        processGroup('interferencias', data.interferencias, 'Interferencia');
        processGroup('estructuras_existentes', data.estructurasExistentes, 'Est. Existente'); // Assuming this data exists

        return points;
    }, [data, visibleLayers]);

    // Derived Options for Dropdowns
    const uniqueCategories = useMemo(() => {
        const cats = new Set(allPoints.map(p => p.displayType));
        return Array.from(cats).sort();
    }, [allPoints]);

    const uniqueStatuses = useMemo(() => {
        const stats = new Set(allPoints.map(p => p.state).filter(s => s !== '---' && s));
        return Array.from(stats).sort();
    }, [allPoints]);

    // NEW: Global Progresiva Bounds (for placeholder or validation)
    const globalBounds = useMemo(() => {
        const progs = allPoints.map(p => p.prog).filter(v => v !== null && !isNaN(v));
        if (progs.length === 0) return { min: 0, max: 0 };
        return {
            min: Math.floor(Math.min(...progs)),
            max: Math.ceil(Math.max(...progs))
        };
    }, [allPoints]);

    // NEW: Filtered Points based on Search + Category + Status + Range
    const filteredPoints = useMemo(() => {
        let result = allPoints;

        // 1. Category Filter
        if (selectedCategory) {
            result = result.filter(p => p.displayType === selectedCategory);
        }

        // 2. Status Filter
        if (selectedStatus) {
            result = result.filter(p => p.state === selectedStatus);
        }

        // 3. Search Text
        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            result = result.filter(p => {
                const code = String(p.data.codigo || p.data.cod_progresiva || '').toLowerCase();
                const type = p.displayType.toLowerCase();
                const progresiva = p.data.progresiva ? String(p.data.progresiva) : '';
                return code.includes(lowerSearch) || type.includes(lowerSearch) || progresiva.includes(lowerSearch);
            });
        }

        // 4. Progresiva Range Filter
        if (filterMin !== '' || filterMax !== '') {
            const min = filterMin !== '' && parseProgresiva(filterMin) !== null ? parseProgresiva(filterMin) : -Infinity;
            const max = filterMax !== '' && parseProgresiva(filterMax) !== null ? parseProgresiva(filterMax) : Infinity;
            result = result.filter(p => {
                if (p.prog === null) return false;
                // Allow some tolerance? Floating point comparison is usually fine here 
                // as we derived p.prog similarly.
                return p.prog >= min && p.prog <= max;
            });
        }

        return result;
    }, [allPoints, searchText, selectedCategory, selectedStatus, filterMin, filterMax]);

    const mapBounds = useMemo(() => {
        if (filteredPoints.length === 0) return null; // Use filteredPoints for bounds
        const latLngs = filteredPoints.map(p => [p.lat, p.lng]);
        return L.latLngBounds(latLngs);
    }, [filteredPoints]); // Dep on filteredPoints

    const toggleLayer = (layer) => {
        setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    // Handlers for Filters
    const handleSearchChange = (e) => setSearchText(e.target.value);
    const handleCategoryChange = (e) => setSelectedCategory(e.target.value);
    const handleStatusChange = (e) => setSelectedStatus(e.target.value);

    // Auto-format Km+m (e.g., 23 -> 23+)
    const handleProgresivaChange = (setter, value, prevValue) => {
        let val = value;
        // If adding a character and length becomes 2 (and only digits), add '+'
        if (val.length === 2 && prevValue.length === 1 && /^\d+$/.test(val)) {
            val = val + '+';
        }
        setter(val);
    };

    const handleClearFilters = () => {
        setSearchText('');
        setSelectedCategory('');
        setSelectedStatus('');
        setFilterMin('');
        setFilterMax('');
    };

    // Load KML
    useEffect(() => {
        const fetchKml = async () => {
            console.log("ExternalView: Start fetching KML...", kmlUrl);
            if (!kmlUrl) {
                // Initial load only: if no KML, finish loading after a shorter delay
                const timer = setTimeout(() => setIsLoading(false), 800);
                return () => clearTimeout(timer);
            }

            setIsLoading(true);
            const MIN_LOADING_TIME = 1500; // Reduced from 4s for better UX
            const startTime = Date.now();

            try {
                const response = await fetch(kmlUrl);
                console.log("ExternalView: KML fetch response status:", response.status);
                if (response.ok) {
                    const text = await response.text();
                    console.log("ExternalView: KML text received, length:", text.length);
                    const parser = new DOMParser();
                    const kmlDoc = parser.parseFromString(text, 'text/xml');
                    const geoJson = kml(kmlDoc);
                    console.log("ExternalView: Converted GeoJSON:", geoJson);
                    setRouteGeoJson(geoJson);
                } else {
                    console.error("ExternalView: KML fetch failed not ok");
                }
            } catch (error) {
                console.error("ExternalView: Error loading KML:", error);
            } finally {
                const elapsed = Date.now() - startTime;
                const remaining = MIN_LOADING_TIME - elapsed;
                setTimeout(() => setIsLoading(false), Math.max(0, remaining));
            }
        };

        // Only run fetch if we haven't loaded the route or kmlUrl changed
        if (!routeGeoJson || kmlUrl) {
            fetchKml();
        } else {
            setIsLoading(false);
        }
    }, [kmlUrl]);

    // Style for KML
    const routeStyle = (feature) => {
        if (feature.properties) {
            let color;
            switch (feature.properties.name) {
                case 'TRAMO 1': color = '#26af60'; break;
                case 'TRAMO 2': color = '#3998d5'; break;
                case 'TRAMO 3': color = '#f09c0c'; break;
                default: color = feature.properties.stroke || '#3388ff'; break;
            }
            return { color: color, weight: 5, opacity: feature.properties['stroke-opacity'] || 1.0 };
        }
        return { color: '#3388ff', weight: 10 };
    };

    return ReactDOM.createPortal(
        <div className="external-view-container">
            {isLoading && (
                <div className="invvial-loading-overlay" style={{ zIndex: 11000 }}>
                    <div className="loader-spinner-large"></div>
                    <div className="invvial-loading-text">Cargando Mapa...</div>
                </div>
            )}
            {/* --- LEFT SIDEBAR (Search & Location) --- */}
            <aside className={`external-sidebar sidebar-left ${leftSidebarOpen ? 'active' : ''}`}>
                <div className="ext-sidebar-header">
                    <span>GeoPortal Invvial</span>
                    <button className="ext-close-btn" onClick={() => setLeftSidebarOpen(false)}>
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                </div>
                <div className="ext-panel-content">
                    <div className="ext-form-group">
                        <i className="fa-solid fa-search" style={{
                            position: 'absolute',
                            right: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#999',
                            zIndex: 2,
                            pointerEvents: 'none'
                        }}></i>
                        <input
                            type="text"
                            className="ext-input"
                            placeholder="Buscar elemento, código..."
                            value={searchText}
                            onChange={handleSearchChange}
                            style={{ paddingRight: '40px' }}
                        />
                    </div>

                    <h4 style={{ marginTop: 0, color: '#333', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>
                        Filtros Avanzados
                    </h4>

                    <div className="ext-form-group">
                        <label>Tipo de Elemento</label>
                        <select className="ext-select" value={selectedCategory} onChange={handleCategoryChange}>
                            <option value="">Todos los Tipos</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ext-form-group">
                        <label>Estado / Condición</label>
                        <select className="ext-select" value={selectedStatus} onChange={handleStatusChange}>
                            <option value="">Todos los Estados</option>
                            {uniqueStatuses.map(stat => (
                                <option key={stat} value={stat}>{stat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ext-form-group">
                        <label>Rango de Progresivas (Km)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                className="ext-input"
                                placeholder={`Min (Ej: 10+500)`}
                                value={filterMin}
                                onChange={(e) => handleProgresivaChange(setFilterMin, e.target.value, filterMin)}
                            />
                            <input
                                type="text"
                                className="ext-input"
                                placeholder={`Max (Ej: 20+000)`}
                                value={filterMax}
                                onChange={(e) => handleProgresivaChange(setFilterMax, e.target.value, filterMax)}
                            />
                        </div>
                    </div>

                    <div className="ext-btn-group">
                        <button className="ext-btn btn-search" onClick={() => { }}><i className="fa-solid fa-filter"></i> Filtrar</button>
                        <button className="ext-btn btn-clear" onClick={handleClearFilters}><i className="fa-solid fa-eraser"></i> Limpiar</button>
                    </div>

                    <div className="ext-stats-card">
                        <p><strong>Total Elementos:</strong> {filteredPoints.length}</p>
                    </div>
                </div>

            </aside>

            <button className="ext-back-btn" onClick={onExit}>
                <i className="fa-solid fa-arrow-left"></i> Salir / Volver
            </button>

            {/* --- MAP --- */}
            <div className="external-map-container">
                <MapToolbar
                    activeTool={activeTool}
                    setActiveTool={(tool) => {
                        if (tool === 'clear') {
                            handleClearAll();
                        } else {
                            setActiveTool(tool);
                        }
                    }}
                    rightSidebarOpen={rightSidebarOpen}
                    setRightSidebarOpen={setRightSidebarOpen}
                />

                {activeTool === 'coords' && mouseCoords && (
                    <div className="coords-display">
                        Lat: {mouseCoords.lat.toFixed(5)} | Lng: {mouseCoords.lng.toFixed(5)}
                    </div>
                )}

                <button
                    className="ext-toggle-btn toggle-left"
                    style={{ display: !leftSidebarOpen ? 'block' : 'none' }}
                    onClick={() => setLeftSidebarOpen(true)}
                >
                    <i className="fa-solid fa-bars"></i>
                </button>

                <MapContainer
                    center={[-12.58, -72.10]}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <MouseCoordsListener isActive={activeTool === 'coords'} setCoords={setMouseCoords} />
                    <LayersControl position="topright" key="layers-v2">
                        <LayersControl.BaseLayer name="Estándar">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Topográfico">
                            <TileLayer
                                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                                attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer checked name="Satélite">
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>



                    <MouseCoordsListener isActive={activeTool === 'coords'} setCoords={setMouseCoords} />

                    {/* LEGEND OVERLAY */}
                    {activeTool === 'info' && <MapLegend onClose={() => setActiveTool(null)} />}

                    <DrawHandler
                        activeTool={activeTool}
                        onCreated={(layer) => {
                            if (drawnItems) drawnItems.addLayer(layer);
                        }}
                        onStop={() => setActiveTool(null)}
                    />

                    <DistanceMeasurement
                        isActive={activeTool === 'line'}
                        measuredPoints={measuredPoints}
                        setMeasuredPoints={setMeasuredPoints}
                        measurementLayers={measurementLayers}
                    />

                    <FeatureGroup ref={(fg) => fg && setDrawnItems(fg.instance || fg)}>
                        <EditControl
                            position="topleft"
                            onCreated={(e) => {
                                console.log('Created via Toolbar:', e);
                            }}
                            draw={{
                                rectangle: false,
                                circle: false,
                                circlemarker: false,
                                marker: false,
                                polyline: false,
                                polygon: false
                            }}
                            edit={{
                                featureGroup: drawnItems
                            }}
                        />
                    </FeatureGroup>

                    <FeatureGroup ref={(fg) => fg && setMeasurementLayers(fg.instance || fg)} />

                    {filteredPoints.map((point, idx) => (
                        <MarkerWithZoom
                            key={`${point.type}-${idx}`}
                            point={point}
                            graphicsImages={graphicsImages}
                            onShowDetails={onShowDetails}
                        />
                    ))}

                    {routeGeoJson && <GeoJSON data={routeGeoJson} style={routeStyle} />}
                    <RouteFitter geoJson={routeGeoJson} />

                    <MapFitter bounds={mapBounds} />
                    <MapResizer isLeftOpen={leftSidebarOpen} isRightOpen={rightSidebarOpen} />
                    <MouseCoordinatesControl />
                </MapContainer>
            </div>

            {/* --- RIGHT SIDEBAR (Layers) --- */}
            <aside className={`external-sidebar sidebar-right ${rightSidebarOpen ? 'active' : ''}`}>
                <div className="ext-sidebar-header right-header">
                    <span><i className="fa-solid fa-layer-group"></i> Capas de Información</span>
                    <button className="ext-close-btn" onClick={() => setRightSidebarOpen(false)}>
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                <div className="ext-panel-content">

                    {/* Estructuras */}
                    <div className="ext-layer-group">
                        <div
                            className={`ext-layer-title ${expandedSections.estructuras ? 'expanded' : ''}`}
                            onClick={() => toggleSection('estructuras')}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <span><i className="fa-solid fa-bridge"></i> Estructuras</span>
                            <i className="fa-solid fa-chevron-down ext-chevron" style={{
                                fontSize: '0.8rem',
                                opacity: 0.5,
                                transform: expandedSections.estructuras ? 'rotate(180deg)' : 'rotate(0)'
                            }}></i>
                        </div>
                        <div className={`ext-layer-list-wrapper ${expandedSections.estructuras ? 'expanded' : ''}`}>
                            <div className="ext-layer-list">
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.alcantarillas} onChange={() => toggleLayer('alcantarillas')} />
                                    <img src="/imgs/alcantarilla_icon.png" alt="" className="ext-layer-icon" /> Alcantarillas
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.badenes} onChange={() => toggleLayer('badenes')} />
                                    <img src="/imgs/baden_icon.svg" alt="" className="ext-layer-icon" /> Badenes
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.puentes} onChange={() => toggleLayer('puentes')} />
                                    <img src="/imgs/puente_icon.svg" alt="" className="ext-layer-icon" /> Puentes
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.muros} onChange={() => toggleLayer('muros')} />
                                    <img src="/imgs/muro_icon.svg" alt="" className="ext-layer-icon" /> Muros de Contención
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.estructuras_existentes} onChange={() => toggleLayer('estructuras_existentes')} />
                                    <img src="/imgs/estructura_icon.svg" alt="" className="ext-layer-icon" /> Estructuras Existentes
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Señalización */}
                    <div className="ext-layer-group">
                        <div
                            className={`ext-layer-title ${expandedSections.senalizacion ? 'expanded' : ''}`}
                            onClick={() => toggleSection('senalizacion')}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <span><i className="fa-solid fa-signs-post"></i> Señalización</span>
                            <i className="fa-solid fa-chevron-down ext-chevron" style={{
                                fontSize: '0.8rem',
                                opacity: 0.5,
                                transform: expandedSections.senalizacion ? 'rotate(180deg)' : 'rotate(0)'
                            }}></i>
                        </div>
                        <div className={`ext-layer-list-wrapper ${expandedSections.senalizacion ? 'expanded' : ''}`}>
                            <div className="ext-layer-list">
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.senales_informativas} onChange={() => toggleLayer('senales_informativas')} />
                                    <img src="/imgs/senal_informativa_icon.svg" alt="" className="ext-layer-icon" /> Señales Informativas
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.senales_reglamentarias} onChange={() => toggleLayer('senales_reglamentarias')} />
                                    <img src="/imgs/senal_reglamentaria_icon.svg" alt="" className="ext-layer-icon" /> Señales Reglamentarias
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.senales_preventivas} onChange={() => toggleLayer('senales_preventivas')} />
                                    <img src="/imgs/senal_preventiva_icon.svg" alt="" className="ext-layer-icon" /> Señales Preventivas
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.hitos_kilometricos} onChange={() => toggleLayer('hitos_kilometricos')} />
                                    <img src="/imgs/hito_icon.svg" alt="" className="ext-layer-icon" /> Hitos Kilométricos
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Otros Recursos */}
                    <div className="ext-layer-group">
                        <div
                            className={`ext-layer-title ${expandedSections.riesgos ? 'expanded' : ''}`}
                            onClick={() => toggleSection('riesgos')}
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <span><i className="fa-solid fa-triangle-exclamation"></i> Riesgos y Recursos</span>
                            <i className="fa-solid fa-chevron-down ext-chevron" style={{
                                fontSize: '0.8rem',
                                opacity: 0.5,
                                transform: expandedSections.riesgos ? 'rotate(180deg)' : 'rotate(0)'
                            }}></i>
                        </div>
                        <div className={`ext-layer-list-wrapper ${expandedSections.riesgos ? 'expanded' : ''}`}>
                            <div className="ext-layer-list">
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.zonas_criticas} onChange={() => toggleLayer('zonas_criticas')} />
                                    <img src="/imgs/zona_critica.svg" alt="" className="ext-layer-icon" /> Zonas Críticas
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.canteras} onChange={() => toggleLayer('canteras')} />
                                    <img src="/imgs/cantera_icon.svg" alt="" className="ext-layer-icon" /> Canteras
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.fuentes} onChange={() => toggleLayer('fuentes')} />
                                    <img src="/imgs/fuente_icon.svg" alt="" className="ext-layer-icon" /> Fuentes de Agua
                                </label>
                                <label className="ext-layer-item">
                                    <input type="checkbox" checked={visibleLayers.interferencias} onChange={() => toggleLayer('interferencias')} />
                                    <img src="/imgs/interferencia_icon.svg" alt="" className="ext-layer-icon" /> Interferencias Eléctricas
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Render Modal Inside Portal */}
            <DataManagementModal
                show={showModal}
                onClose={onCloseModal}
                listData={(() => {
                    if (activeTab === 'CANTERAS Y FUENTES DE AGUA') {
                        return [
                            ...canterasData.map(c => ({ ...c, type_label: 'Cantera', id: `c-${c.id}` })),
                            ...fuentesData.map(f => ({ ...f, type_label: 'Fuente', id: `f-${f.id}` }))
                        ];
                    }
                    if (activeTab === 'ZONAS CRITICAS') return zonasCriticasData;
                    if (activeTab === 'INTERFERENCIAS ELECTRICAS') return interferenciasData;

                    if (activeTab === 'SEÑALIZACION') {
                        if (activeSeñalizacionSubTab === 'S. INFORMATIVAS') return senalesInformativasData;
                        if (activeSeñalizacionSubTab === 'S. PREVENTIVAS') return senalesPreventivasData;
                        if (activeSeñalizacionSubTab === 'HITOS KILOMETRICOS') return hitosKilometricosData;
                    }

                    if (activeTab === 'ESTRUCTURAS Y OBRAS DE ARTE') {
                        if (activeObrasSubTab === 'BADENES') return badenesData;
                        if (activeObrasSubTab === 'PUENTES') return puentesData;
                        if (activeObrasSubTab === 'MUROS DE CONTENCION') return murosData;
                        return alcantarillasData;
                    }

                    return alcantarillasData;
                })()}
                editData={selectedElementForEdit}
                mode={modalMode}
                onSaveManualData={onSaveManualData}
                onUploadExcelData={onUploadExcelData}
                projectId={projectId}
                vialHeaderOption={vialHeaderOption}
                type={(() => {
                    if (activeTab === 'CANTERAS Y FUENTES DE AGUA') return 'canteras';
                    if (activeTab === 'ZONAS CRITICAS') return 'zonas-criticas';
                    if (activeTab === 'INTERFERENCIAS ELECTRICAS') return 'interferencias';

                    if (activeTab === 'SEÑALIZACION') {
                        if (activeSeñalizacionSubTab === 'S. INFORMATIVAS') return 'senales_informativas';
                        if (activeSeñalizacionSubTab === 'S. PREVENTIVAS') return 'senales_preventivas';
                        if (activeSeñalizacionSubTab === 'HITOS KILOMETRICOS') return 'hitos_kilometricos';
                    }

                    if (activeTab === 'ESTRUCTURAS Y OBRAS DE ARTE') {
                        if (activeObrasSubTab === 'BADENES') return 'badenes';
                        if (activeObrasSubTab === 'PUENTES') return 'puentes';
                        if (activeObrasSubTab === 'MUROS DE CONTENCION') return 'muros';
                        return 'alcantarillas';
                    }

                    return 'alcantarillas';
                })()}
                isNavbarExpanded={false}
                onDeleteElement={onDeleteElement}
            />
        </div>,
        document.body
    );
};

export default ExternalView;
