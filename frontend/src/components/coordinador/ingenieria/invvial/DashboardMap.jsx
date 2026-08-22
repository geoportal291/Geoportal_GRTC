
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip, LayersControl, useMap, ZoomControl, Marker, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import L from 'leaflet';
import axios from 'axios';
import * as turf from '@turf/turf'; // Import Turf
import './ExternalView.css'; // Import shared styles for popups

// --- Helper for Validating Coordinates ---
const isValidCoordinate = (lat, lng) => {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat !== null &&
        lng !== null
    );
};

// --- Icon Helpers ---
const getIcon = (type) => {
    // Default fallback
    let iconUrl = '/imgs/alcantarilla_icon.png';
    let iconSize = [25, 25];
    let iconAnchor = [12, 12];

    switch (type) {
        case 'alcantarillas':
            iconUrl = '/imgs/alcantarilla_icon.png';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'badenes':
            iconUrl = '/imgs/baden_icon.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'puentes':
            iconUrl = '/imgs/puente_icon.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'muros':
            iconUrl = '/imgs/muro_icon.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'senales_informativas':
            iconUrl = '/imgs/senal_informativa_icon.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'senales_preventivas':
            iconUrl = '/imgs/senal_preventiva_icon.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'hitos_kilometricos':
            iconUrl = '/imgs/hito_icon.svg';
            iconSize = [20, 20];
            iconAnchor = [10, 10];
            break;
        case 'canteras':
            iconUrl = '/imgs/cantera_icon.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'fuentes':
            iconUrl = '/imgs/fuente_icon.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'zonas_criticas':
            iconUrl = '/imgs/zona_critica.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        case 'interferencias_electricas':
            iconUrl = '/imgs/interferencia_icon.svg';
            iconSize = [32, 32];
            iconAnchor = [16, 16];
            break;
        default:
            break;
    }

    return L.icon({
        iconUrl,
        iconSize,
        iconAnchor,
        popupAnchor: [0, -16]
    });
};


// --- Sub-component to fit bounds ---
const MapFitter = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            try {
                map.fitBounds(bounds, { padding: [50, 50] });
            } catch (e) {
                console.warn("Error fitting bounds:", e);
            }
        }
    }, [bounds, map]);
    return null;
};

const DashboardMap = ({ projectId, kmlUrl, mapData, filters, calibrations }) => {
    const [kmlRoutes, setKmlRoutes] = useState([]); // Array of { name: 'Tramo 1', coordinates: [[lat, lng], ...] }
    const [kmlGeoJson, setKmlGeoJson] = useState(null);
    const [mapBounds, setMapBounds] = useState(null);

    // --- Helper to convert progressive string to meters ---
    const progressiveToMeters = (progStr) => {
        if (!progStr) return NaN;
        const clean = String(progStr).replace(/km/i, '').trim();
        const parts = clean.split('+');
        if (parts.length === 2) {
            const km = parseFloat(parts[0]);
            const m = parseFloat(parts[1]);
            return (km * 1000) + m;
        } else if (parts.length === 1) {
            return parseFloat(parts[0]);
        }
        return NaN;
    };

    // Load KML
    useEffect(() => {
        const fetchKml = async () => {
            if (!kmlUrl) return;
            try {
                // Use backend proxy to bypass CORS on dafe.it NAS
                const { default: axiosInstance } = await import('../../../../api/axios');
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(kmlUrl)}`;
                const response = await axiosInstance.get(proxyUrl, { responseType: 'text' });
                const text = response.data;
                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(text, 'text/xml');
                const geoJson = kml(kmlDoc);

                const routes = [];
                geoJson.features.forEach(f => {
                    if (f.geometry && f.geometry.type === 'LineString' && Array.isArray(f.geometry.coordinates)) {
                        // Leaflet needs [Lat, Lng]
                        const latLngs = f.geometry.coordinates
                            .map(coord => [coord[1], coord[0]])
                            .filter(c => isValidCoordinate(c[0], c[1])); // Filter invalid coords

                        if (latLngs.length > 0) {
                            const rawName = (f.properties && f.properties.name) ? f.properties.name : ("Tramo " + (routes.length + 1));
                            const name = rawName.toUpperCase().trim();

                            // Match colors from geoite.jsx
                            let color = '#3388ff'; // Default blue
                            if (name.includes('TRAMO 1')) color = '#26af60'; // Green
                            else if (name.includes('TRAMO 2')) color = '#3998d5'; // Light Blue
                            else if (name.includes('TRAMO 3')) color = '#f09c0c'; // Orange

                            routes.push({ name, coordinates: latLngs, color });
                        }
                    }
                });
                setKmlRoutes(routes);

                if (routes.length > 0) {
                    const allPoints = routes.flatMap(r => r.coordinates);
                    if (allPoints.length > 0) {
                        try {
                            const bounds = L.latLngBounds(allPoints);
                            if (bounds.isValid()) setMapBounds(bounds);
                        } catch (e) { console.warn("Error creating KML bounds", e); }
                    }
                }

            } catch (err) {
                console.error("Error loading KML for dashboard map:", err);
            }
        };

        fetchKml();
    }, [kmlUrl]);

    // Calculate bounds from Points if KML is missing
    useEffect(() => {
        if (!kmlUrl && mapData) {
            const points = [];
            Object.keys(mapData).forEach(key => {
                if (mapData[key]) {
                    mapData[key].forEach(p => {
                        if (p && isValidCoordinate(p.lat, p.lng)) {
                            points.push([p.lat, p.lng]);
                        }
                    });
                }
            });
            if (points.length > 0) {
                try {
                    const bounds = L.latLngBounds(points);
                    if (bounds.isValid()) setMapBounds(bounds);
                } catch (e) { console.warn("Error creating MapData bounds", e); }
            }
        }
    }, [mapData, kmlUrl]);


    // --- Calculate Coords from Progressive using Calibration ---
    const calculateCoords = (progresiva) => {
        if (!progresiva || !kmlRoutes || kmlRoutes.length === 0) {
            console.log("calculateCoords abort: missing prog or routes", { progresiva, routesLen: kmlRoutes?.length });
            return null;
        }

        const targetMeters = progressiveToMeters(progresiva);
        if (isNaN(targetMeters)) {
            console.log("calculateCoords abort: invalid targetMeters", targetMeters);
            return null;
        }

        let selectedRoute = null;
        let startMeters = 0;
        let endMeters = 0;

        // 1. Try to find calibration match
        if (calibrations && calibrations.length > 0) {
            const calMatch = calibrations.find(c => {
                const cStart = progressiveToMeters(c.progresiva_inicio);
                const cEnd = progressiveToMeters(c.progresiva_fin);
                return targetMeters >= cStart && targetMeters <= cEnd;
            });

            if (calMatch) {
                const calName = calMatch.nombre_tramo.toUpperCase().trim();
                selectedRoute = kmlRoutes.find(r => r.name.includes(calName) || calName.includes(r.name));

                if (selectedRoute) {
                    startMeters = progressiveToMeters(calMatch.progresiva_inicio);
                    endMeters = progressiveToMeters(calMatch.progresiva_fin);
                }
            }
        }

        // 2. Fallback to First Route
        if (!selectedRoute) {
            selectedRoute = kmlRoutes[0];
            startMeters = 0;
        }

        if (!selectedRoute || !selectedRoute.coordinates || selectedRoute.coordinates.length < 2) return null;

        try {
            // Turf needs [Lng, Lat]
            const lineCoords = selectedRoute.coordinates.map(p => [p[1], p[0]]);
            const line = turf.lineString(lineCoords);
            const routeLengthKm = turf.length(line, { units: 'kilometers' });

            let distOnRouteKm = 0;

            if (endMeters > startMeters) {
                const calLenM = endMeters - startMeters;
                const relativeM = targetMeters - startMeters;
                const ratio = relativeM / calLenM;
                distOnRouteKm = (ratio * routeLengthKm);
            } else {
                distOnRouteKm = targetMeters / 1000;
            }

            if (distOnRouteKm < 0) distOnRouteKm = 0;
            if (distOnRouteKm > routeLengthKm) distOnRouteKm = routeLengthKm;

            const point = turf.along(line, distOnRouteKm, { units: 'kilometers' });
            if (point && point.geometry && point.geometry.coordinates) {
                const [lng, lat] = point.geometry.coordinates;
                if (isValidCoordinate(lat, lng)) {
                    return [lat, lng];
                }
            }
        } catch (e) {
            console.error("Error calculating position:", e);
        }

        return null;
    };


    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative' }} className="dashboard-map-container">
            <MapContainer
                center={[-13.5, -71.9]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* KML Routes */}
                {/* KML Layer via GeoJSON Component */}
                {kmlGeoJson && (
                    <GeoJSON
                        key={kmlUrl}
                        data={kmlGeoJson}
                        style={(feature) => {
                            return {
                                color: feature.properties.stroke || '#3388ff',
                                weight: 5,
                                opacity: 0.8
                            };
                        }}
                        onEachFeature={(feature, layer) => {
                            if (feature.properties && feature.properties.name) {
                                layer.bindTooltip(feature.properties.name, { sticky: true });
                            }
                        }}
                    />
                )}

                {/* Inventory Points */}
                {mapData && filters && Object.keys(mapData).map(key => {
                    if (!filters[key] || !Array.isArray(mapData[key])) return null;
                    console.log(`Processing key: ${key}, count: ${mapData[key].length}`); // DEBUG

                    return mapData[key].map(point => {
                        if (!point) return null;

                        let position = null;

                        // 1. Try explicit coordinates
                        if (isValidCoordinate(point.lat, point.lng) && point.lat !== 0 && point.lng !== 0) {
                            position = [point.lat, point.lng];
                        }
                        // 2. Try Progressive Projection
                        else if (point.progresiva) {
                            position = calculateCoords(point.progresiva);
                        }

                        if (!position) return null;

                        return (
                            <Marker
                                key={key + "-" + point.id}
                                position={position}
                                icon={getIcon(key)}
                                eventHandlers={{
                                    click: (e) => {
                                        const map = e.target._map;
                                        map.flyTo(e.latlng, 15, { duration: 1.5 });
                                    }
                                }}
                            >
                                <Popup className="invvial-popup-override">
                                    <div className="invvial-map-popup-card">
                                        <div className="popup-header">
                                            {key === 'alcantarillas' ? 'OBRAS DE ARTE' :
                                                key === 'badenes' ? 'OBRAS DE ARTE' :
                                                    key === 'puentes' ? 'OBRAS DE ARTE' :
                                                        key === 'muros' ? 'OBRAS DE ARTE' :
                                                            key.toUpperCase().replace('_', ' ')}
                                        </div>
                                        <div className="popup-content">
                                            {/* Image Placeholder or Actual Image if available in data */}
                                            {point.imageUrls && point.imageUrls.length > 0 && (
                                                <div className="popup-image-container">
                                                    <img
                                                        src={typeof point.imageUrls[0] === 'string' ? point.imageUrls[0] : point.imageUrls[0].url}
                                                        alt="Preview"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}

                                            <div className="popup-details-grid">
                                                <div className="detail-row">
                                                    <span className="label">CÓDIGO:</span>
                                                    <span className="value">{point.codigo || 'S/C'}</span>
                                                </div>
                                                {point.subType && (
                                                    <div className="detail-row">
                                                        <span className="label">TIPO:</span>
                                                        <span className="value">{point.subType}</span>
                                                    </div>
                                                )}
                                                <div className="detail-row">
                                                    <span className="label">UBICACIÓN:</span>
                                                    <span className="value">{point.progresiva || '---'}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">COORDENADA:</span>
                                                    <span className="value">{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    });
                })}

                <MapFitter bounds={mapBounds} />
                <ZoomControl position="topleft" />
            </MapContainer>
        </div>
    );
};

export default DashboardMap;
