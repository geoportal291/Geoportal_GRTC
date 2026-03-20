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

// --- Mapa de Colores por defecto para cada Tab de Geología ---
const TAB_COLORS = {
    'geologia_local': '#3b82f6', // blue-500
    'geomorfologia': '#10b981', // emerald-500
    'geologiaestructural': '#8b5cf6', // violet-500
    'geodinamicainterna': '#ef4444', // red-500
    'geodinamicaexterna': '#f97316', // orange-500
    'geotecnia_canteras': '#eab308', // yellow-500
    'geotecnia_puentes': '#06b6d4', // cyan-500
    'estabilidad_taludes': '#a855f7', // purple-500
    'muros_cimentaciones': '#14b8a6', // teal-500
    'default': '#D2691E' // chocolate
};

const formatTabName = (name) => {
    if (!name) return 'Capa';
    // Mapeo básico de nombres feos a nombres bonitos para la UI
    const niceNames = {
        'geologia_local': 'Geología Local',
        'geomorfologia': 'Geomorfología',
        'geologiaestructural': 'Geología Estructural',
        'geodinamicainterna': 'Geodinámica Interna',
        'geodinamicaexterna': 'Geodinámica Externa',
        'geotecnia_canteras': 'Geotecnia de Canteras',
        'geotecnia_puentes': 'Geotecnia de Puentes',
        'estabilidad_taludes': 'Estabilidad de Taludes',
        'muros_cimentaciones': 'Muros y Cimentaciones'
    };
    return niceNames[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


const GeologiaDashboardMap = ({ projectId, kmlUrl, capas, filters }) => {
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
                center={[-13.5, -71.9]}
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
                            color: '#e74c3c',
                            weight: 4,
                            opacity: 0.8
                        })}
                    />
                )}

                {/* Geology Layers */}
                {capas && filters && capas.map((capa) => {
                    const isVisible = filters[capa.tab_name];
                    if (!isVisible || !capa.geojson_data) return null;

                    let geoData = capa.geojson_data;
                    if (typeof geoData === 'string') {
                        try { geoData = JSON.parse(geoData); } catch (e) { return null; }
                    }

                    return (
                        <GeoJSON
                            key={capa.id}
                            data={geoData}
                            style={(feature) => {
                                const props = feature.properties || {};
                                const nativeColor = props.stroke || props.fill || null;
                                const originalTabName = capa.tab_name || 'default';
                                const defaultTabColor = TAB_COLORS[originalTabName] || TAB_COLORS['default'];


                                if (nativeColor) {
                                    return {
                                        color: nativeColor,
                                        weight: Math.max(3, (props['stroke-width'] || 2) * 1.5),
                                        opacity: props['stroke-opacity'] || 1.0,
                                        fillColor: props.fill || nativeColor,
                                        fillOpacity: Math.max(0.45, props['fill-opacity'] || 0.45)
                                    };
                                }

                                return { color: defaultTabColor, weight: 3, opacity: 0.8, fillColor: defaultTabColor, fillOpacity: 0.45 };
                            }}
                            pointToLayer={(feature, latlng) => {
                                const props = feature.properties || {};
                                const originalTabName = capa.tab_name || 'default';
                                const defaultTabColor = TAB_COLORS[originalTabName] || TAB_COLORS['default'];
                                const markerColor = props['marker-color'] || props.fill || props.stroke || defaultTabColor;

                                return L.circleMarker(latlng, {
                                    radius: 5, // Reducido para que no se vea tan tosco
                                    fillColor: markerColor,
                                    color: '#ffffff',
                                    weight: 1,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                });
                            }}
                            onEachFeature={(feature, layer) => {
                                const props = feature.properties || {};
                                const niceTabName = formatTabName(capa.tab_name);

                                let popupHtml = `
                                    <div style="font-family:'Inter',sans-serif; min-width:200px; max-width:300px; display:flex; flex-direction:column;">
                                        <div style="background-color: #f8fafc; padding: 10px 32px 10px 14px; border-radius: 6px 6px 0 0; border-bottom: 3px solid ${TAB_COLORS[capa.tab_name] || '#ccc'}; margin: 0; position: relative;">
                                            <h4 style="margin:0; color:#1e293b; font-size: 15px; font-weight: 700;">${niceTabName}</h4>
                                        </div>
                                        <div style="padding: 10px 14px;">
                                `;

                                if (props.name) {
                                    popupHtml += `<div style="font-size:13px; margin-bottom:6px;"><strong>Nombre/Código:</strong> <span style="color:#2563eb;">${props.name}</span></div>`;
                                    layer.bindTooltip(`<b>${props.name}</b>`, { direction: 'auto', sticky: true, className: 'geol-kmz-tooltip-label' });
                                }

                                // Si existe un código específico, ponerlo destacado
                                const mainCode = props.CODIGO || props.codigo || props.POG;
                                if (mainCode) {
                                    popupHtml += `<div style="font-size:13px; margin-bottom:6px;"><strong>Identificador:</strong> <span style="color:#d97706; font-weight:600;">${mainCode}</span></div>`;
                                }

                                popupHtml += `<div style="max-height: 350px; overflow-y: auto; padding-right: 4px;">`;
                                const hiddenKeys = ['name', '_layer_name', 'styleUrl', 'CODIGO', 'codigo', 'POG', 'OBJECTID', 'OBJECTID_1', 'Shape_Area', 'Shape_Le_1', 'Shape_Leng', 'Shape_Length', 'BUFF_DIST', 'InPoly_FID', 'SmoPgnFlag'];

                                Object.entries(props).forEach(([k, v]) => {
                                    if (!hiddenKeys.includes(k) && v !== null && v !== undefined && v !== '') {
                                        // Formatear nombres de keys para que se vean mejor (ej. "Unidad_geo" -> "Unidad_geo")
                                        const cleanKey = k.replace(/_/g, ' ');
                                        popupHtml += `<div style="font-size:12px; margin:4px 0; border-bottom: 1px solid #f3f4f6; padding-bottom: 2px;">
                                            <span style="color:#6b7280; font-weight:500; text-transform:capitalize;">${cleanKey}:</span> <span style="color:#111827;">${v}</span>
                                        </div>`;
                                    }
                                });
                                popupHtml += `</div></div></div>`;

                                layer.bindPopup(popupHtml, {
                                    className: 'geolint-custom-popup'
                                });
                            }}
                        />
                    );
                })}

                <MapFitter bounds={mapBounds} />
                <ZoomControl position="topleft" />
            </MapContainer>
        </div>
    );
};

export default GeologiaDashboardMap;
