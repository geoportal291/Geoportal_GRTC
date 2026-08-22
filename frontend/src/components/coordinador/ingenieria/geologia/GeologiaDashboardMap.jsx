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
    const useMapHook = useMap;
    const map = useMapHook();
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

// --- Marcadores de inicio y fin del trazado KML ---
const makeEndpointIcon = (type) => L.divIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:36px;">
        <div style="width:36px;height:36px;background:${type === 'start' ? '#16a34a' : '#dc2626'};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 0 0 2px ${type === 'start' ? '#16a34a' : '#dc2626'},0 4px 14px rgba(0,0,0,0.45);"></div>
        <div style="position:absolute;top:7px;left:7px;font-size:14px;">${type === 'start' ? '🚀' : '🏁'}</div>
    </div>`,
    iconSize: [36, 42], iconAnchor: [18, 42], popupAnchor: [0, -44]
});

const RouteEndpointsLayer = ({ geoJson }) => {
    if (!geoJson) return null;
    const allCoords = [];
    (geoJson.features || []).forEach(f => {
        const geom = f.geometry;
        if (!geom) return;
        if (geom.type === 'LineString') allCoords.push(...geom.coordinates);
        else if (geom.type === 'MultiLineString') geom.coordinates.forEach(l => allCoords.push(...l));
    });
    if (allCoords.length < 2) return null;
    const startC = allCoords[0];
    const endC = allCoords[allCoords.length - 1];
    return (
        <>
            <Marker position={[startC[1], startC[0]]} icon={makeEndpointIcon('start')} zIndexOffset={5000} />
            <Marker position={[endC[1], endC[0]]} icon={makeEndpointIcon('end')} zIndexOffset={5000} />
        </>
    );
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

const UNIDAD_GEO_STYLES = {
    'Fm. Ananea':            { fill: 'url(#geol-pattern-ananea)',       color: '#8b4513', legendColor: '#fce4b3', legendStroke: '#8b4513', legendPattern: 'ananea' },
    'Fm San gaban':          { fill: 'url(#geol-pattern-sangaban)',      color: '#d4af37', legendColor: '#fffbe6', legendStroke: '#d4af37', legendPattern: 'sangaban' },
    'Dique de Diorita':      { fill: 'url(#geol-pattern-diorite)',       color: '#8b0000', legendColor: '#f7a7a3', legendStroke: '#8b0000', legendPattern: 'diorite' },
    'Deposito Coluvial':     { fill: 'url(#geol-pattern-coluvial)',      color: '#4a4a4a', legendColor: '#a8a8a8', legendStroke: '#333333', legendPattern: 'coluvial' },
    'Deposito Aluvio-Coluvial': { fill: 'url(#geol-pattern-aluvio)',    color: '#666666', legendColor: '#d3d3d3', legendStroke: '#555555', legendPattern: 'aluvio' },
    'Deposito Eluvio-Coluvial': { fill: 'url(#geol-pattern-eluvio)',    color: '#999999', legendColor: '#f0f0f0', legendStroke: '#999999', legendPattern: 'eluvio' },
    'Deposito. Eluvial':     { fill: 'url(#geol-pattern-eluvial-dep)',  color: '#8b4513', legendColor: '#ffff00', legendStroke: '#8b4513', legendPattern: 'eluvial-dep' },
    // Fallbacks
    'Fm. Sandia':   { fill: 'url(#geol-pattern-ananea)', color: '#8b4513', legendColor: '#fce4b3', legendStroke: '#8b4513', legendPattern: 'ananea' },
    'Dep. Morrenico': { fill: 'url(#geol-pattern-eluvio)', color: '#999999', legendColor: '#f0f0f0', legendStroke: '#999999', legendPattern: 'eluvio' },
    'Cuaternario':  { fill: '#ffff00', color: '#cccc00', legendColor: '#ffff00', legendStroke: '#cccc00' },
    'Ambo':         { fill: '#6b8e23', color: '#556b2f', legendColor: '#6b8e23', legendStroke: '#556b2f' },
    'Tarma':        { fill: '#4682b4', color: '#27408b', legendColor: '#4682b4', legendStroke: '#27408b' },
    'Copacabana':   { fill: '#00ced1', color: '#008b8b', legendColor: '#00ced1', legendStroke: '#008b8b' },
    'Mitu':         { fill: '#cd5c5c', color: '#8b3a3a', legendColor: '#cd5c5c', legendStroke: '#8b3a3a' }
};

const LEGEND_PATTERN_DEFS = `<defs>
<pattern id="lp-ananea" patternUnits="userSpaceOnUse" width="10" height="8"><rect width="10" height="8" fill="#fce4b3"/><path d="M 0,2 L 10,2 M 0,6 L 10,6" stroke="#8b4513" stroke-width="1.2"/></pattern>
<pattern id="lp-sangaban" patternUnits="userSpaceOnUse" width="12" height="8"><rect width="12" height="8" fill="#fffbe6"/><path d="M 0,4 L 12,4" stroke="#d4af37" stroke-width="1" stroke-dasharray="3,3"/></pattern>
<pattern id="lp-diorite" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="#f7a7a3"/><path d="M 2,3 L 4,5 L 2,5 Z M 10,10 L 12,12 L 10,12 Z M 7,2 L 8,4 L 6,4 Z" fill="#800000" opacity="0.6"/></pattern>
<pattern id="lp-coluvial" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="#a8a8a8"/><circle cx="4" cy="4" r="2" fill="#4a4a4a" opacity="0.7"/><circle cx="12" cy="12" r="1.5" fill="#333333" opacity="0.6"/></pattern>
<pattern id="lp-aluvio" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="#d3d3d3"/><circle cx="3" cy="3" r="1" fill="#666"/><circle cx="10" cy="5" r="1.5" fill="#555" opacity="0.5"/><circle cx="6" cy="11" r="1" stroke="#444" fill="none"/></pattern>
<pattern id="lp-eluvio" patternUnits="userSpaceOnUse" width="12" height="12"><rect width="12" height="12" fill="#f0f0f0"/><circle cx="4" cy="4" r="1.8" stroke="#999" fill="none" stroke-width="0.8"/><circle cx="9" cy="9" r="1" stroke="#777" fill="none"/></pattern>
<pattern id="lp-eluvial-dep" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#ffff00"/><circle cx="2" cy="2" r="0.8" fill="#8b4513"/><circle cx="7" cy="5" r="0.6" fill="#8b4513"/><circle cx="4" cy="8" r="0.7" fill="#8b4513"/></pattern>
</defs>`;

const getLegendSwatch = (style, width = 34, height = 20) => {
    const patternId = style.legendPattern ? `lp-${style.legendPattern}` : null;
    const fillRef = patternId ? `url(#${patternId})` : style.legendColor;
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${patternId ? LEGEND_PATTERN_DEFS : ''}<rect width="${width}" height="${height}" fill="${fillRef}" stroke="${style.legendStroke || style.color}" stroke-width="1.5" rx="3"/></svg>`;
};

const GeologyLegend = () => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const LegendControl = L.Control.extend({
            options: { position: 'bottomright' },
            onAdd: function () {
                const div = L.DomUtil.create('div', 'leaflet-control');
                div.id = 'geol-dashboard-legend';
                div.style.cssText = 'background:#f1f5f9;border:3px solid #000;padding:12px 18px;font-family:Inter,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.3);max-height:400px;overflow-y:auto;';
                
                div.innerHTML = `
                    <div style="font-weight:900; color:#000; font-size:14px; text-transform:uppercase; text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px; letter-spacing:1px;">LEYENDA</div>
                    <div style="font-weight:700; color:#000; font-size:11px; margin-bottom:12px;">Unidades Litológicas Locales</div>
                    <div style="display:flex; flex-direction:column; gap:7px;">
                        ${Object.entries(UNIDAD_GEO_STYLES).filter(([key]) => !['Fm. Sandia', 'Dep. Morrenico', 'Cuaternario', 'Ambo', 'Tarma', 'Copacabana', 'Mitu'].includes(key)).map(([name, style]) => `
                            <div style="display:flex; align-items:center; gap:10px;">
                                ${getLegendSwatch(style, 36, 20)}
                                <span style="font-weight:600; color:#000; font-size:11px;">${name}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                L.DomEvent.disableClickPropagation(div);
                return div;
            }
        });

        const legend = new LegendControl();
        legend.addTo(map);
        return () => {
            map.removeControl(legend);
        };
    }, [map]);

    return null;
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



                                const unidadGeo = props['Unidad_geo'] || props['UNIDAD GEO'] || props['unidad geo'] || props['Unidad'] || props['UNIDAD'] || props['unidad'];
                                if (unidadGeo) {
                                    const unidadStr = String(unidadGeo).toLowerCase().trim();
                                    const unitKey = Object.keys(UNIDAD_GEO_STYLES).find(k => unidadStr.includes(k.toLowerCase()));
                                    if (unitKey) {
                                        const style = UNIDAD_GEO_STYLES[unitKey];
                                        return {
                                            color: style.color,
                                            weight: 2,
                                            opacity: 0.9,
                                            fillColor: style.fill,
                                            fillOpacity: 0.85
                                        };
                                    }
                                }

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
                                
                                let finalColor = props['marker-color'] || props.fill || props.stroke || defaultTabColor;
                                const unidadGeo = props['Unidad_geo'] || props['UNIDAD GEO'] || props['unidad geo'] || props['Unidad'] || props['UNIDAD'] || props['unidad'];
                                if (unidadGeo) {
                                    const unidadStr = String(unidadGeo).toLowerCase().trim();
                                    const unitKey = Object.keys(UNIDAD_GEO_STYLES).find(k => unidadStr.includes(k.toLowerCase()));
                                    if (unitKey && UNIDAD_GEO_STYLES[unitKey].color) {
                                        finalColor = UNIDAD_GEO_STYLES[unitKey].color;
                                    }
                                }

                                return L.circleMarker(latlng, {
                                    radius: 5, // Reducido para que no se vea tan tosco
                                    fillColor: finalColor,
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

                <RouteEndpointsLayer geoJson={kmlGeoJson} />
                <GeologyLegend />
                <MapFitter bounds={mapBounds} />
                <ZoomControl position="topleft" />
            </MapContainer>
        </div>
    );
};

export default GeologiaDashboardMap;
