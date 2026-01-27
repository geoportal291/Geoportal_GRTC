import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import L from 'leaflet';
import '../invvial/ExternalView.css'; // Reutilizamos estilos de mapa de Vial

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

// --- Icon Helpers (Adapted for Geology placeholders) ---
const getIcon = (type) => {
    // Default fallback
    let iconUrl = '/imgs/alcantarilla_icon.png'; // Pending specific geology icons
    let iconSize = [25, 25];
    let iconAnchor = [12, 12];

    switch (type) {
        case 'muestras':
            iconUrl = '/imgs/hito_icon.svg'; // Placeholder
            iconSize = [20, 20];
            break;
        case 'fallas':
            iconUrl = '/imgs/zona_critica.svg'; // Placeholder
            iconSize = [32, 32];
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

const GeologiaDashboardMap = ({ projectId, kmlUrl, mapData, filters }) => {
    const [kmlGeoJson, setKmlGeoJson] = useState(null);
    const [mapBounds, setMapBounds] = useState(null);

    // Load KML
    useEffect(() => {
        const fetchKml = async () => {
            if (!kmlUrl) return;
            try {
                const response = await fetch(kmlUrl);
                const text = await response.text();
                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(text, 'text/xml');
                const geoJson = kml(kmlDoc);
                setKmlGeoJson(geoJson);

                // Calculate bounds from KML
                const layer = L.geoJSON(geoJson);
                const bounds = layer.getBounds();
                if (bounds.isValid()) setMapBounds(bounds);

            } catch (err) {
                console.error("Error loading KML for geology dashboard map:", err);
            }
        };

        fetchKml();
    }, [kmlUrl]);

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative' }} className="dashboard-map-container">
            <MapContainer
                center={[-13.5, -71.9]} // Default Cusco/Peru generic center
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* KML Layer */}
                {kmlGeoJson && (
                    <GeoJSON
                        data={kmlGeoJson}
                        style={() => ({
                            color: '#e74c3c', // Red for Geology differentiation
                            weight: 4,
                            opacity: 0.8
                        })}
                    />
                )}

                {/* Geology Points */}
                {mapData && filters && Object.keys(mapData).map(key => {
                    if (!filters[key] || !Array.isArray(mapData[key])) return null;

                    return mapData[key].map((point, idx) => {
                        if (!point || !isValidCoordinate(point.lat, point.lng)) return null;

                        return (
                            <Marker
                                key={`${key}-${idx}`}
                                position={[point.lat, point.lng]}
                                icon={getIcon(key)}
                            >
                                <Popup>
                                    <div style={{ minWidth: '200px' }}>
                                        <strong>{key.toUpperCase()}</strong><br />
                                        Código: {point.codigo || 'S/N'}<br />
                                        Coord: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
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

export default GeologiaDashboardMap;
