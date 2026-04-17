import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents, GeoJSON, Marker, Popup, Tooltip as LeafletTooltip, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axiosInstance from '../../../../api/axios';
import { useAuth } from '../../../../data/contexts/AuthContext';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import { fromLatLon } from 'utm';
import '../invvial/ExternalView.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import { saveAs } from 'file-saver';

// Forzar z-index de alertify por encima del portal externo
if (typeof window !== 'undefined' && alertify.defaults) {
    alertify.defaults.notifier.position = 'top-right';
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- CONFIGURACIÓN DE COLORES POR SECCIÓN ---
const SECTION_COLORS = {
    'geologia_estructural': '#ff3b30', // Rojo vibrante
    'geologia_local': '#ffcc00',       // Oro/Amarillo eléctrico
    'geomorfologia': '#af52de',        // Púrpura neón
    'geotecnia': '#007aff',            // Azul brillante (Agrupa canteras, puentes, etc.)
    'geodinamicaexterna': '#ff9500',    // Naranja intenso
    'hidrologia': '#5ac8fa',            // Cyan/Celeste
    'otros': '#ff2d55'                  // Rosa vibrante
};

const getTabColor = (tab) => {
    const t = (tab || 'otros').toLowerCase().replace(/\s/g, '');
    for (const key in SECTION_COLORS) {
        if (t.includes(key)) return SECTION_COLORS[key];
    }
    return SECTION_COLORS.otros;
};

const resolveGroupTabName = (tabName) => {
    const normalized = (tabName || 'Otros').toUpperCase();
    if (normalized.startsWith('GEOTECNIA')) return 'GEOTECNIA';
    return normalized;
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

const UNIDAD_GEOMORFO_STYLES = {
    'Colinas': { fill: 'url(#lp-colinas)', color: '#b59368', legendColor: '#e0cba8', legendStroke: '#8b4513', legendPattern: 'colinas' },
    'Laderas': { fill: 'url(#lp-laderas)', color: '#f7b959', legendColor: '#fcdb83', legendStroke: '#a07020', legendPattern: 'laderas' },
    'Montaña En Roca Metamorfica': { fill: 'url(#lp-montram)', color: '#f99e69', legendColor: '#fcad81', legendStroke: '#000', legendPattern: 'montram' },
    'Quebrada Disectada': { fill: 'url(#lp-quebrada)', color: '#b9f7de', legendColor: '#c5f5e3', legendStroke: '#000', legendPattern: 'quebrada' },
    'Vertiente Coluvial': { fill: 'url(#lp-vert-col)', color: '#cccccc', legendColor: '#dbdbdb', legendStroke: '#000', legendPattern: 'vert-col' }
};

const LEGEND_PATTERN_DEFS = `<defs>
<pattern id="lp-ananea" patternUnits="userSpaceOnUse" width="10" height="8"><rect width="10" height="8" fill="#fce4b3"/><path d="M 0,2 L 10,2 M 0,6 L 10,6" stroke="#8b4513" stroke-width="1.2"/></pattern>
<pattern id="lp-sangaban" patternUnits="userSpaceOnUse" width="12" height="8"><rect width="12" height="8" fill="#fffbe6"/><path d="M 0,4 L 12,4" stroke="#d4af37" stroke-width="1" stroke-dasharray="3,3"/></pattern>
<pattern id="lp-diorite" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="#f7a7a3"/><path d="M 2,3 L 4,5 L 2,5 Z M 10,10 L 12,12 L 10,12 Z M 7,2 L 8,4 L 6,4 Z" fill="#800000" opacity="0.6"/></pattern>
<pattern id="lp-coluvial" patternUnits="userSpaceOnUse" width="16" height="16"><rect width="16" height="16" fill="#a8a8a8"/><circle cx="4" cy="4" r="2" fill="#4a4a4a" opacity="0.7"/><circle cx="12" cy="12" r="1.5" fill="#333333" opacity="0.6"/></pattern>
<pattern id="lp-aluvio" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="#d3d3d3"/><circle cx="3" cy="3" r="1" fill="#666"/><circle cx="10" cy="5" r="1.5" fill="#555" opacity="0.5"/><circle cx="6" cy="11" r="1" stroke="#444" fill="none"/></pattern>
<pattern id="lp-eluvio" patternUnits="userSpaceOnUse" width="12" height="12"><rect width="12" height="12" fill="#f0f0f0"/><circle cx="4" cy="4" r="1.8" stroke="#999" fill="none" stroke-width="0.8"/><circle cx="9" cy="9" r="1" stroke="#777" fill="none"/></pattern>
<pattern id="lp-eluvial-dep" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#ffff00"/><circle cx="2" cy="2" r="0.8" fill="#8b4513"/><circle cx="7" cy="5" r="0.6" fill="#8b4513"/><circle cx="4" cy="8" r="0.7" fill="#8b4513"/></pattern>
<pattern id="lp-colinas" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#e0cba8"/><rect x="2" y="2" width="2" height="2" fill="#8b4513" opacity="0.6"/><rect x="7" y="6" width="2" height="2" fill="#8b4513" opacity="0.6"/></pattern>
<pattern id="lp-laderas" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#fcdb83"/><rect x="3" y="3" width="2" height="2" fill="#a07020" opacity="0.6"/><rect x="8" y="7" width="2" height="2" fill="#a07020" opacity="0.6"/></pattern>
<pattern id="lp-montram" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="#fcad81"/><circle cx="2" cy="2" r="1" fill="#000"/><circle cx="6" cy="6" r="1.2" fill="#000"/></pattern>
<pattern id="lp-quebrada" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#c5f5e3"/><circle cx="3" cy="3" r="1.5" stroke="#000" fill="none" stroke-width="0.8"/><circle cx="8" cy="8" r="1" fill="#000"/></pattern>
<pattern id="lp-vert-col" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#dbdbdb"/><path d="M2,3 L4,2 L6,3 Z" fill="#000"/><circle cx="8" cy="7" r="1" fill="#000"/></pattern>
</defs>`;

const getLegendSwatch = (style, width = 34, height = 20) => {
    const patternId = style.legendPattern ? `lp-${style.legendPattern}` : null;
    const fillRef = patternId ? `url(#${patternId})` : style.legendColor;
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${patternId ? LEGEND_PATTERN_DEFS : ''}<rect width="${width}" height="${height}" fill="${fillRef}" stroke="${style.legendStroke || style.color}" stroke-width="1.5" rx="3"/></svg>`;
};

const normalizeLegendName = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const GEODINAMICA_EVENT_STYLES = [
    { name: 'Asentamiento De Suelo', color: '#ffd27a' },
    { name: 'Caida De Rocas', color: '#b7ff1a' },
    { name: 'Caida De Rocas Y Deslizamiento(Riesgo Alto)', color: '#76ff03' },
    { name: 'Caida De Rocas y Deslizamientos', color: '#fff21f' },
    { name: 'Deslizamiento De Suelo (Regular Magnitud)', color: '#72d9ff' },
    { name: 'Deslizamiento De Talud', color: '#ffb21a' },
    { name: 'Deslizamiento de menor magnitud', color: '#de86eb' },
    { name: 'Socavacion De La Plataforma', color: '#a85f5f' },
    { name: 'Socavacion Y Riesgo De Deslizamiento', color: '#bdbdbd' },
    { name: 'Talud En Roca Muy Fracturado', color: '#2f80ff' }
];

const getGeodinamicaEventStyle = (name) => {
    const normalizedName = normalizeLegendName(name);
    return GEODINAMICA_EVENT_STYLES.find(item => normalizeLegendName(item.name) === normalizedName) || null;
};

const getGeodinamicaLegendItems = (geojsonData) => {
    const features = Array.isArray(geojsonData?.features) ? geojsonData.features : [];
    const detected = new Set();

    features.forEach((feature) => {
        const props = feature?.properties || {};
        const eventName = props.NAME || props.Name || props.name || props.NOMBRE || props.Nombre || props.nombre;
        const matched = getGeodinamicaEventStyle(eventName);
        if (matched) detected.add(matched.name);
    });

    const items = GEODINAMICA_EVENT_STYLES.filter(item => detected.has(item.name));
    return items.length > 0 ? items : GEODINAMICA_EVENT_STYLES;
};

const getGeodinamicaLegendSvg = (color) => `
    <svg width="22" height="22" viewBox="0 0 24 24">
        <polygon points="12,2 20.5,7 20.5,17 12,22 3.5,17 3.5,7" fill="${color}" stroke="#333" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="2.3" fill="#111"/>
    </svg>
`;

const getFeatureEventName = (props = {}) =>
    props.NAME || props.Name || props.name || props.NOMBRE || props.Nombre || props.nombre || '';

const getFeatureSignature = (feature) => {
    const geometry = feature?.geometry || {};
    const props = feature?.properties || {};
    const keyId = props.OBJECTID_1 || props.OBJECTID || props.Id || props.ID || props.id || props.NAME || props.name || '';
    let coordKey = '';
    try {
        if (geometry.type === 'Point') {
            coordKey = JSON.stringify(geometry.coordinates || []);
        } else if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') {
            coordKey = JSON.stringify((geometry.coordinates || [])[0] || []);
        } else if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') {
            coordKey = JSON.stringify(((geometry.coordinates || [])[0] || [])[0] || []);
        } else if (geometry.type === 'MultiPolygon') {
            coordKey = JSON.stringify((((geometry.coordinates || [])[0] || [])[0] || [])[0] || []);
        }
    } catch (e) {
        coordKey = '';
    }
    return `${geometry.type || 'NA'}|${keyId}|${coordKey}`;
};

const getGeodinamicaPointIcon = (color, isSelected = false) =>
    L.divIcon({
        className: 'geo-point-geodinamica',
        html: `
            <svg width="${isSelected ? 28 : 24}" height="${isSelected ? 28 : 24}" viewBox="0 0 24 24" style="display:block; filter: ${isSelected ? 'drop-shadow(0 0 8px rgba(0,229,255,0.95)) drop-shadow(0 0 2px rgba(255,255,255,1))' : 'drop-shadow(0 0 2px rgba(255,255,255,0.9)) drop-shadow(0 2px 4px rgba(0,0,0,0.45))'};">
                <polygon points="12,2 20.5,7 20.5,17 12,22 3.5,17 3.5,7" fill="${color}" stroke="${isSelected ? '#00e5ff' : '#202020'}" stroke-width="${isSelected ? 2 : 1.6}"/>
                <circle cx="12" cy="12" r="2.4" fill="#111"/>
            </svg>
        `,
        iconSize: [isSelected ? 28 : 24, isSelected ? 28 : 24],
        iconAnchor: [isSelected ? 14 : 12, isSelected ? 14 : 12],
        popupAnchor: [0, -12]
    });

const PANEL_PHOTO_MATCH_RADIUS_METERS = 30;

const normalizePanelPhoto = (photo) => {
    if (!photo) return null;

    const lat = parseFloat(photo.lat ?? photo.latitude ?? photo.latitud);
    const lng = parseFloat(photo.lng ?? photo.lon ?? photo.longitud ?? photo.longitude);
    const imageUrl = photo.image_url || photo.url || photo.imagen_url || photo.imagen;

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !imageUrl) {
        return null;
    }

    return {
        ...photo,
        lat,
        lng,
        image_url: imageUrl,
        nombre: photo.nombre || photo.name || 'Foto de campo',
        descripcion: photo.descripcion || photo.description || ''
    };
};

const haversineDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const toRad = (deg) => deg * Math.PI / 180;
    const earthRadiusMeters = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
};

const getNearbyPanelPhotos = (pointLat, pointLng, photos, radiusMeters = PANEL_PHOTO_MATCH_RADIUS_METERS) => {
    if (!Number.isFinite(pointLat) || !Number.isFinite(pointLng) || !Array.isArray(photos)) {
        return [];
    }

    return photos
        .map((photo) => {
            const normalized = normalizePanelPhoto(photo);
            if (!normalized) return null;
            const distanceMeters = haversineDistanceMeters(pointLat, pointLng, normalized.lat, normalized.lng);
            return distanceMeters <= radiusMeters ? { ...normalized, distanceMeters } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
};

const getFeatureRepresentativeLatLng = (feature, fallbackLatLng = null) => {
    if (fallbackLatLng && Number.isFinite(fallbackLatLng.lat) && Number.isFinite(fallbackLatLng.lng)) {
        return fallbackLatLng;
    }

    const coordinates = feature?.geometry?.coordinates;
    const geometryType = feature?.geometry?.type;

    try {
        if (geometryType === 'Point') {
            return { lat: parseFloat(coordinates[1]), lng: parseFloat(coordinates[0]) };
        }
        if (geometryType === 'MultiPoint' || geometryType === 'LineString') {
            return { lat: parseFloat(coordinates[0][1]), lng: parseFloat(coordinates[0][0]) };
        }
        if (geometryType === 'MultiLineString' || geometryType === 'Polygon') {
            return { lat: parseFloat(coordinates[0][0][1]), lng: parseFloat(coordinates[0][0][0]) };
        }
        if (geometryType === 'MultiPolygon') {
            return { lat: parseFloat(coordinates[0][0][0][1]), lng: parseFloat(coordinates[0][0][0][0]) };
        }
    } catch (error) {
        return null;
    }

    return null;
};

const isZeroLike = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return value === 0;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return false;
        return /^0([.,]0+)?%?$/.test(trimmed);
    }
    return false;
};

const shouldDisplayProperty = (key, value) => {
    if (!key || key.startsWith('_')) return false;
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && !value.trim()) return false;
    if (isZeroLike(value)) return false;
    return true;
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getFirstPropertyValue = (properties, keys = []) => {
    for (const key of keys) {
        const value = properties?.[key];
        if (shouldDisplayProperty(key, value)) return value;
    }
    return '';
};

const buildFeaturePopupHtml = (properties, layerMeta, popupContext = {}) => {
    const p = properties || {};
    const title = p.name || p.nombre || p.NAME || p.NOMBRE || layerMeta?.file_name || 'DETALLE TECNICO';
    const descriptionValue = (
        p.descripcion ||
        p.description ||
        p.descripcion_geotecnica ||
        p.DESCRIPCION ||
        p.DESCRIPTION ||
        p.simbolo ||
        ''
    );

    const normalizedTabName = (layerMeta?.tab_name || '').toLowerCase();
    const isGeologiaLocal = normalizedTabName.includes('geologia_local');
    const isGeomorfologiaLocal = normalizedTabName.includes('geomorfologia');
    const isGeodinamicaExterna = normalizedTabName.includes('geodinamicaexterna');
    if (isGeologiaLocal) {
        const orderedFields = [
            {
                label: 'Unidad Geologica',
                value: getFirstPropertyValue(p, ['Unidad_geo', 'UNIDAD_GEO', 'unidad_geo', 'Unidad geo', 'UNIDAD GEO', 'unidad geo'])
            },
            {
                label: 'Descripcion',
                value: getFirstPropertyValue(p, ['F___Descri', 'F__Descri', 'F_Descri', 'DESCRIPCION', 'Descripcion'])
            },
            {
                label: 'Formacion',
                value: getFirstPropertyValue(p, ['Formacion', 'FORMACION', 'Formación', 'FORMACIÓN'])
            },
            {
                label: 'Tipo de Material',
                value: getFirstPropertyValue(p, ['Geomecanic', 'GEOMECANIC', 'geomecanic'])
            }
        ].filter(({ label, value }) => shouldDisplayProperty(label, value));

        const orderedRows = orderedFields.length > 0
            ? orderedFields.map(({ label, value }) => `
                <div class="geolocalext_popup_row_geo">
                    <b class="geolocalext_popup_label_geo">${escapeHtml(label)}:</b>
                    <span class="geolocalext_popup_value_geo">${escapeHtml(value)}</span>
                </div>
            `).join('')
            : `<div class="geolocalext_popup_empty_geo">Sin atributos visibles para esta capa.</div>`;

        return `
            <div class="geolocalext_popup_card_geo">
                <div class="geolocalext_popup_header_geo">${escapeHtml(title)}</div>
                <div class="geolocalext_popup_body_geo">
                    ${orderedRows}
                </div>
            </div>
        `;
    }

    if (isGeomorfologiaLocal) {
        const unidadGeologica = getFirstPropertyValue(p, ['Unidad_geo', 'UNIDAD_GEO', 'unidad_geo', 'Unidad geo', 'UNIDAD GEO', 'unidad geo']);
        const orderedRows = shouldDisplayProperty('Unidad Geologica', unidadGeologica)
            ? `
                <div class="geolocalext_popup_row_geo">
                    <b class="geolocalext_popup_label_geo">Unidad Geologica:</b>
                    <span class="geolocalext_popup_value_geo">${escapeHtml(unidadGeologica)}</span>
                </div>
            `
            : `<div class="geolocalext_popup_empty_geo">Sin atributos visibles para esta capa.</div>`;

        return `
            <div class="geolocalext_popup_card_geo">
                <div class="geolocalext_popup_header_geo">${escapeHtml(title)}</div>
                <div class="geolocalext_popup_body_geo">
                    ${orderedRows}
                </div>
            </div>
        `;
    }

    if (isGeodinamicaExterna) {
        const nearbyPhotos = Array.isArray(popupContext.nearbyPhotos) ? popupContext.nearbyPhotos : [];
        const tipoDePeligro = getFirstPropertyValue(p, ['NAME', 'Name', 'name', 'NOMBRE', 'Nombre', 'nombre']) || title;
        const eventosGeodinamicos = getFirstPropertyValue(p, ['folder', 'Folder', 'FOLDER']) || 'Eventos Geodinamicos';
        const photosBlock = nearbyPhotos.length > 0
            ? `
                <div style="font-size:11px; color:#64748b; font-weight:800; margin:14px 0 10px; text-transform:uppercase;">
                    Fotos Cercanas (${nearbyPhotos.length})
                </div>
                <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; max-height:260px; overflow-y:auto; padding-right:4px;">
                    ${nearbyPhotos.map((photo, index) => `
                        <button
                            type="button"
                            data-geod-popup-photo-index="${index}"
                            style="display:flex; flex-direction:column; text-align:left; background:#f8fafc; border:1px solid #dbe4f0; border-radius:12px; overflow:hidden; padding:0; cursor:pointer;"
                        >
                            <img
                                src="${escapeHtml(photo.image_url)}"
                                alt="${escapeHtml(photo.nombre)}"
                                style="display:block; width:100%; height:96px; object-fit:cover; background:#dbe4f0;"
                            />
                            <div style="padding:8px 9px;">
                                <div style="font-size:11px; font-weight:800; color:#0f172a; line-height:1.2; margin-bottom:4px; max-height:28px; overflow:hidden;">
                                    ${escapeHtml(photo.nombre)}
                                </div>
                                <div style="font-size:10px; color:#64748b; font-weight:700;">
                                    ${Math.round(photo.distanceMeters)} m
                                </div>
                            </div>
                        </button>
                    `).join('')}
                </div>
            `
            : `
                <div style="margin-top:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; color:#64748b; font-size:12px;">
                    Sin fotos cercanas en el panel fotografico dentro de ${PANEL_PHOTO_MATCH_RADIUS_METERS} m.
                </div>
            `;

        return `
            <div style="font-family:'Inter',sans-serif; padding:14px 16px; min-width:300px; max-width:390px;">
                <div style="margin:0 0 12px 0; color:#1e40af; font-size:14px; font-weight:900; border-bottom:2px solid #3b82f6; padding-bottom:8px; text-transform:uppercase; padding-right:24px;">
                    Eventos Geodinamicos
                </div>
                <div style="font-size:16px; font-weight:800; color:#0f172a; line-height:1.35; margin-bottom:14px;">
                    ${escapeHtml(tipoDePeligro)}
                </div>
                <div class="geolocalext_popup_row_geo" style="padding-left:0; padding-right:0;">
                    <b class="geolocalext_popup_label_geo">Eventos Geodinamicos:</b>
                    <span class="geolocalext_popup_value_geo">${escapeHtml(eventosGeodinamicos)}</span>
                </div>
                <div class="geolocalext_popup_row_geo" style="padding-left:0; padding-right:0;">
                    <b class="geolocalext_popup_label_geo">Tipo de Peligro:</b>
                    <span class="geolocalext_popup_value_geo">${escapeHtml(tipoDePeligro)}</span>
                </div>
                ${photosBlock}
            </div>
        `;
    }

    const hiddenKeys = new Set(['name', 'nombre', 'NAME', 'NOMBRE', 'descripcion', 'description', 'descripcion_geotecnica', 'DESCRIPCION', 'DESCRIPTION']);
    const rows = Object.entries(p)
        .filter(([key, value]) => !hiddenKeys.has(key) && shouldDisplayProperty(key, value))
        .map(([key, value]) => `
            <div class="detail-row" style="display:flex; gap:8px; padding:5px 0; border-bottom:1px solid #e2e8f0;">
                <b style="min-width:92px; color:#1e3a8a;">${escapeHtml(key)}:</b>
                <span style="color:#334155; word-break:break-word;">${escapeHtml(value)}</span>
            </div>
        `)
        .join('');

    const descriptionBlock = shouldDisplayProperty('descripcion', descriptionValue)
        ? `
            <div style="padding:10px 12px; margin-bottom:10px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px;">
                <div style="font-size:10px; font-weight:800; color:#1d4ed8; text-transform:uppercase; margin-bottom:4px;">Descripcion</div>
                <div style="font-size:12px; line-height:1.45; color:#0f172a;">${escapeHtml(descriptionValue)}</div>
            </div>
        `
        : '';

    const detailsBlock = rows || (!descriptionBlock
        ? `<div style="font-size:11px; color:#64748b;">Sin atributos visibles para esta capa.</div>`
        : '');

    return `
        <div class="invvial-map-popup-card" style="min-width:280px; max-width:360px;">
            <div class="popup-header" style="background:#1e3a8a; color:white; padding:10px; font-weight:700;">${escapeHtml(title)}</div>
            <div style="padding:10px; font-size:11px; max-height:260px; overflow-y:auto;">
                ${descriptionBlock}
                ${detailsBlock}
            </div>
        </div>
    `;
};

const getFeaturePopupOptions = (layerMeta) => {
    const normalizedTabName = (layerMeta?.tab_name || '').toLowerCase();
    const usesCompactGeologiaPopup = normalizedTabName.includes('geologia_local') || normalizedTabName.includes('geomorfologia') || normalizedTabName.includes('geodinamicaexterna');
    if (usesCompactGeologiaPopup) {
        return {
            maxWidth: normalizedTabName.includes('geodinamicaexterna') ? 430 : 380,
            minWidth: normalizedTabName.includes('geodinamicaexterna') ? 330 : 310,
            className: 'geolocalext_popup_shell_geo'
        };
    }
    return {
        maxWidth: 420
    };
};

const formatZeroAsBlank = (value, digits = 0, suffix = '') => {
    const numeric = parseFloat(value || 0);
    if (!Number.isFinite(numeric) || numeric === 0) return '';
    return `${numeric.toFixed(digits)}${suffix}`;
};



// --- ICONOS PERSONALIZADOS ---

const getMuestraIcon = (tipo) => {
    const isRoca = (tipo || '').toLowerCase().includes('roca');
    const color = isRoca ? '#a100ff' : '#ff9100'; // Violeta vs Naranja eléctrico
    return L.divIcon({
        className: 'custom-muestra-icon',
        html: `
            <div style="background: ${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display:flex; align-items:center; justify-content:center; border: 2.5px solid white; box-shadow: 0 0 10px ${color}, 0 4px 12px rgba(0,0,0,0.4);">
                <i class="fa-solid ${isRoca ? 'fa-gem' : 'fa-hill-rockslide'}" style="transform: rotate(45deg); color: white; font-size: 13px;"></i>
            </div>
        `,
        iconSize: [28, 30], iconAnchor: [14, 30], popupAnchor: [0, -30]
    });
};

const getCameraIcon = (count = 1) => L.divIcon({
    className: 'custom-camera-icon',
    html: `
        <div style="position: relative; background: #007aff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2.5px solid white; box-shadow: 0 0 8px #007aff, 0 4px 8px rgba(0,0,0,0.4);">
            <i class="fas fa-camera" style="font-size: 12px;"></i>
            ${count > 1 ? `<span style="position: absolute; top: -10px; right: -10px; background: #ff3b30; color: white; border-radius: 12px; padding: 2px 6px; font-size: 10px; font-weight: 900; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${count}</span>` : ''}
        </div>
    `,
    iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -28]
});

// --- COMPONENTE CARRUSEL (Popup) ---
const PhotoCarousel = ({ photos, onSelect }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    if (!photos || photos.length === 0) return null;

    const next = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % photos.length); };
    const prev = (e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length); };

    const current = photos[currentIndex];

    return (
        <div className="ext-carousel-container" style={{ position: 'relative', width: '100%', height: '180px', background: '#000', overflow: 'hidden' }}>
            {current.image_url ? (
                <img src={current.image_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} onClick={() => onSelect(photos, currentIndex)} title="Clic para agrandar" />
            ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-image fa-3x text-slate-400"></i></div>
            )}
            
            {photos.length > 1 && (
                <>
                    <button className="carousel-btn left" onClick={prev} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', zIndex: 10 }}><i className="fas fa-chevron-left"></i></button>
                    <button className="carousel-btn right" onClick={next} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', zIndex: 10 }}><i className="fas fa-chevron-right"></i></button>
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>{currentIndex + 1} / {photos.length}</div>
                </>
            )}
        </div>
    );
};

const renderGeoPoint = (f, latlng, isSelected = false) => {
    const p = f.properties || {};
    const tabName = p._layer_tab || 'otros';
    const eventName = getFeatureEventName(p);
    const isGeodinamicaLayer = (tabName || '').toLowerCase().includes('geodinamicaexterna');
    const geodinamicaStyle = isGeodinamicaLayer ? getGeodinamicaEventStyle(eventName) : null;

    let color = geodinamicaStyle?.color || p['marker-color'] || p.fill || p.stroke || getTabColor(tabName);
    
    const unidadGeo = p['Unidad_geo'] || p['UNIDAD GEO'] || p['unidad geo'] || p['Unidad'] || p['UNIDAD'] || p['unidad'];
    if (unidadGeo) {
        const unidadStr = String(unidadGeo).toLowerCase().trim();
        const unitKey = Object.keys(UNIDAD_GEO_STYLES).find(k => unidadStr.includes(k.toLowerCase()));
        if (unitKey && UNIDAD_GEO_STYLES[unitKey].color) color = UNIDAD_GEO_STYLES[unitKey].color;
    }

    const layerName = (p._layer_name || '').toLowerCase();
    
    if (layerName.includes('rumbo') || layerName.includes('buz') || layerName.includes('estruct')) {
        return L.marker(latlng, {
            icon: L.divIcon({
                className: 'geo-point-tri',
                html: `<div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:14px solid ${color}; filter: ${isSelected ? 'drop-shadow(0 0 8px rgba(0,229,255,0.95)) drop-shadow(0 0 2px #fff)' : 'drop-shadow(0 0 2px white) drop-shadow(0 1px 3px rgba(0,0,0,0.5))'}; transform:rotate(${p.angle || 0}deg) ${isSelected ? 'scale(1.2)' : 'scale(1)'};"></div>`,
                iconSize: [16, 14], iconAnchor: [8, 7]
            })
        });
    }

    if (isGeodinamicaLayer) {
        return L.marker(latlng, {
            icon: getGeodinamicaPointIcon(color, isSelected)
        });
    }

    return L.marker(latlng, {
        icon: L.divIcon({
            className: 'geo-point-dot',
            html: `<div style="width:${isSelected ? 13 : 10}px; height:${isSelected ? 13 : 10}px; background:${color}; border:2px solid ${isSelected ? '#00e5ff' : 'white'}; border-radius:50%; box-shadow: ${isSelected ? '0 0 9px rgba(0,229,255,0.95), 0 2px 6px rgba(0,0,0,0.55)' : `0 0 6px ${color}, 0 2px 4px rgba(0,0,0,0.5)`};"></div>`,
            iconSize: [isSelected ? 18 : 14, isSelected ? 18 : 14], iconAnchor: [isSelected ? 9 : 7, isSelected ? 9 : 7]
        })
    });
};

const MapEventsController = ({ setZoom, onMapClick, featureClickGuardRef }) => {
    const map = useMap();
    const [coordsInfo, setCoordsInfo] = useState(null);
    useMapEvents({
        zoomend() { setZoom(map.getZoom()); },
        click() {
            const lastFeatureClickAt = featureClickGuardRef?.current || 0;
            if (Date.now() - lastFeatureClickAt < 250) return;
            onMapClick?.();
        },
        mousemove(e) {
            const { lat, lng } = e.latlng;
            const zoom = map.getZoom();
            const metersPerPixel = 156543.03 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
            const scale = Math.round(metersPerPixel * 3779.52);
            try {
                const utm = fromLatLon(lat, lng);
                setCoordsInfo({ scale, lat: lat.toFixed(5), lon: lng.toFixed(5), easting: utm.easting.toFixed(2), northing: utm.northing.toFixed(2), zone: `${utm.zoneNum}${utm.zoneLetter}` });
            } catch { setCoordsInfo(null); }
        }
    });
    return coordsInfo && (
        <div style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none', background: 'rgba(15, 23, 42, 0.85)', color: 'white', padding: '10px 18px', borderRadius: '12px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', width: 'auto', maxWidth: '90vw' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: '1em', fontSize: '9px', fontWeight: 600 }}>
                <div style={{opacity:0.7}}>ESCALA ~1:{coordsInfo.scale.toLocaleString()}</div>
                <div style={{textAlign:'right'}}>ZONA {coordsInfo.zone}</div>
                <div>E: {coordsInfo.easting} | N: {coordsInfo.northing}</div>
                <div style={{textAlign:'right'}}>LAT: {coordsInfo.lat} | LON: {coordsInfo.lon}</div>
            </div>
        </div>
    );
};

const MapFitter = ({ bounds }) => {
    const map = useMap();
    useEffect(() => { if (bounds && bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] }); }, [bounds, map]);
    return null;
};

const MapReferenceCapturer = ({ setMap }) => {
    const map = useMap();
    useEffect(() => { if (map) setMap(map); }, [map, setMap]);
    return null;
};

// --- Marcadores de inicio y fin del trazado KML ---
const makeEndpointIconExt = (type) => L.divIcon({
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
            <Marker position={[startC[1], startC[0]]} icon={makeEndpointIconExt('start')} zIndexOffset={5000} />
            <Marker position={[endC[1], endC[0]]} icon={makeEndpointIconExt('end')} zIndexOffset={5000} />
        </>
    );
};


const GeologiaExternal = ({ onBack }) => {
    const { selectedProjectId: projectId } = useAuth();
    const sectionOrderStorageKey = `geoportal:geologia:external:section-order:${projectId || 'default'}`;
    const [baseKml, setBaseKml] = useState(null);
    const [layers, setLayers] = useState([]);
    const [muestras, setMuestras] = useState([]);
    const [fotos, setFotos] = useState([]);
    const [clasificacion, setClasificacion] = useState([]);
    
    const [visible, setVisible] = useState({ route: true, muestras: true, fotos: false });
    const [opacities, setOpacities] = useState({}); // { 'layer-1': 1.0 }
    const [currentZoom, setCurrentZoom] = useState(6);
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [kmSearch, setKmSearch] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [expanded, setExpanded] = useState({ route: true, base: true, stats: true });
    const [map, setMap] = useState(null);
    const [layerToExport, setLayerToExport] = useState(null);
    const selectedFeatureRef = useRef(null);
    const featureClickGuardRef = useRef(0);
    const [selectedFeatureTarget, setSelectedFeatureTarget] = useState(null);
    const [activeLayerId, setActiveLayerId] = useState(null);
    const [sectionOrder, setSectionOrder] = useState([]);
    const [draggedSection, setDraggedSection] = useState(null);
    const [dropTargetSection, setDropTargetSection] = useState(null);
    const handleOpenDriveFolder = () => {};

    const openPhotoGallery = useCallback((photoList, startIndex = 0) => {
        if (typeof photoList === 'string') {
            setSelectedPhoto({
                photos: [{ image_url: photoList, nombre: 'Foto de campo', descripcion: '' }],
                currentIndex: 0
            });
            return;
        }

        const normalizedPhotos = Array.isArray(photoList)
            ? photoList.map(normalizePanelPhoto).filter(Boolean)
            : [];

        if (normalizedPhotos.length === 0) return;

        const safeIndex = Math.max(0, Math.min(startIndex, normalizedPhotos.length - 1));
        setSelectedPhoto({
            photos: normalizedPhotos,
            currentIndex: safeIndex
        });
    }, []);

    useEffect(() => {
        if (!selectedPhoto) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.keyCode === 27) {
                setSelectedPhoto(null);
                return;
            }
            if (e.key === 'ArrowRight') {
                setSelectedPhoto((prev) => {
                    if (!prev || prev.photos.length <= 1) return prev;
                    return { ...prev, currentIndex: (prev.currentIndex + 1) % prev.photos.length };
                });
            }
            if (e.key === 'ArrowLeft') {
                setSelectedPhoto((prev) => {
                    if (!prev || prev.photos.length <= 1) return prev;
                    return { ...prev, currentIndex: (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length };
                });
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhoto]);
    const [mapBounds, setMapBounds] = useState(null);

    const getLayerFeatureStyle = useCallback((feature, layerMeta) => {
        const layerOpacity = opacities[`layer-${layerMeta.id}`] !== undefined
            ? opacities[`layer-${layerMeta.id}`]
            : 0.4;
        const isSelected = selectedFeatureTarget
            && selectedFeatureTarget.layerId === layerMeta.id
            && selectedFeatureTarget.signature === getFeatureSignature(feature);

        const applySelected = (style) => {
            if (!isSelected) return style;
            return {
                ...style,
                color: '#00e5ff',
                weight: Math.max((style.weight || 2) + 3, 5),
                opacity: Math.min((style.opacity || 0.4) + 0.12, 0.95),
                fillOpacity: Math.min((style.fillOpacity || 0.4) + 0.1, 0.95),
                dashArray: null
            };
        };

        const p = feature?.properties || {};
        const unidadGeo = p['Unidad_geo'] || p['UNIDAD GEO'] || p['unidad geo'] || p['Unidad'] || p['UNIDAD'] || p['unidad'];
        if (unidadGeo) {
            const unidadStr = String(unidadGeo).toLowerCase().trim();

            const unitKey = Object.keys(UNIDAD_GEO_STYLES).find(k => unidadStr.includes(k.toLowerCase()));
            if (unitKey) {
                const style = UNIDAD_GEO_STYLES[unitKey];
                return applySelected({
                    color: style.color,
                    weight: 2,
                    opacity: layerOpacity,
                    fillColor: style.fill,
                    fillOpacity: layerOpacity
                });
            }

            const geomorfoKey = Object.keys(UNIDAD_GEOMORFO_STYLES).find(k => unidadStr.includes(k.toLowerCase()));
            if (geomorfoKey) {
                const style = UNIDAD_GEOMORFO_STYLES[geomorfoKey];
                return applySelected({
                    color: style.color,
                    weight: 2,
                    opacity: layerOpacity,
                    fillColor: style.fill,
                    fillOpacity: layerOpacity
                });
            }
        }

        return applySelected({
            color: getTabColor(layerMeta.tab_name),
            weight: 4,
            opacity: layerOpacity,
            fillColor: getTabColor(layerMeta.tab_name),
            fillOpacity: layerOpacity,
            dashArray: layerMeta.tab_name?.toLowerCase().includes('estructural') ? '5, 5' : null
        });
    }, [opacities, selectedFeatureTarget]);

    const getImmediateSelectedFeatureStyle = useCallback((feature, layerMeta) => {
        const baseStyle = getLayerFeatureStyle(feature, layerMeta);
        return {
            ...baseStyle,
            color: '#00e5ff',
            weight: Math.max((baseStyle.weight || 2) + 3, 5),
            opacity: Math.min((baseStyle.opacity || 0.4) + 0.12, 0.95),
            fillOpacity: Math.min((baseStyle.fillOpacity || 0.4) + 0.1, 0.95),
            dashArray: null
        };
    }, [getLayerFeatureStyle]);

    const clearSelectedFeature = useCallback(() => {
        if (!selectedFeatureRef.current) {
            setSelectedFeatureTarget(null);
            return;
        }
        const { layer, feature, layerMeta, markerState } = selectedFeatureRef.current;
        if (layer?.setStyle) {
            layer.setStyle(getLayerFeatureStyle(feature, layerMeta));
        }
        if (layer?.getElement && markerState) {
            const markerEl = layer.getElement();
            if (markerEl) {
                markerEl.style.transform = markerState.transform || '';
                markerEl.style.filter = markerState.filter || '';
                markerEl.style.transition = markerState.transition || '';
            }
            if (typeof layer.setZIndexOffset === 'function') {
                layer.setZIndexOffset(markerState.zIndexOffset || 0);
            }
        }
        selectedFeatureRef.current = null;
        setSelectedFeatureTarget(null);
    }, [getLayerFeatureStyle]);

    const focusSingleLayer = useCallback((layerId) => {
        if (!layerId) return;
        setVisible(prev => {
            const next = { ...prev };
            layers.forEach(layer => {
                next[`layer-${layer.id}`] = layer.id === layerId;
            });
            return next;
        });
        setOpacities(prev => ({ ...prev, [`layer-${layerId}`]: 1 }));
        setActiveLayerId(layerId);
    }, [layers]);

    const resetLayerFocus = useCallback(() => {
        setVisible(prev => {
            const next = { ...prev };
            layers.forEach(layer => {
                next[`layer-${layer.id}`] = true;
            });
            return next;
        });
        setActiveLayerId(null);
        clearSelectedFeature();
    }, [clearSelectedFeature, layers]);

    const focusSectionLayers = useCallback((tabName) => {
        if (!tabName) return;
        const sectionLayers = layers.filter(layer => resolveGroupTabName(layer.tab_name) === tabName);
        if (sectionLayers.length === 0) return;

        setVisible(prev => {
            const next = { ...prev };
            layers.forEach(layer => {
                next[`layer-${layer.id}`] = resolveGroupTabName(layer.tab_name) === tabName;
            });
            return next;
        });
        setOpacities(prev => {
            const next = { ...prev };
            sectionLayers.forEach(layer => {
                next[`layer-${layer.id}`] = 1;
            });
            return next;
        });

        setActiveLayerId(sectionLayers[0]?.id || null);
        clearSelectedFeature();
        setExpanded(prev => {
            const next = { ...prev };
            Object.keys(next).forEach((key) => {
                if (key.startsWith('sec-')) next[key] = false;
            });
            next[`sec-${tabName}`] = true;
            return next;
        });
    }, [clearSelectedFeature, layers]);

    // --- CÁLCULOS TÉCNICOS ---
    const matStats = useMemo(() => {
        let rfTotal = 0, rsTotal = 0, msTotal = 0;
        clasificacion.forEach(r => {
            rfTotal += parseFloat(r.long_roca_fija) || 0;
            rsTotal += parseFloat(r.long_roca_suelta) || 0;
            msTotal += parseFloat(r.long_material_suelto) || 0;
        });
        return { rfTotal, rsTotal, msTotal, longTotal: rfTotal + rsTotal + msTotal };
    }, [clasificacion]);

    // --- DETECCIÓN DE MUESTRAS (Combinar API + GeoJSON) ---
    const muestrasCalculadas = useMemo(() => {
        let mc = [...muestras];
        
        // Si no hay muestras manuales o queremos potenciar la detección desde capas
        // Escaneamos todas las capas GeoJSON cargadas
        layers.forEach(l => {
            try {
                const gdata = typeof l.geojson_data === 'string' ? JSON.parse(l.geojson_data) : l.geojson_data;
                if (gdata && gdata.features) {
                    gdata.features.forEach(f => {
                        const props = f.properties || {};
                        const lowerTab = (l.tab_name || '').toLowerCase();
                        const lowerName = (props.name || props.nombre || props.id || '').toString().toLowerCase();
                        
                        // Patrones comunes de muestras técnicas en proyectos de ingeniería
                        const isSamplePattern = 
                            lowerName.startsWith('s-') || lowerName.startsWith('p-') || 
                            lowerName.startsWith('m-') || lowerName.startsWith('c-') ||
                            lowerName.startsWith('ma-') || lowerName.startsWith('st-') ||
                            lowerName.includes('muestra') || lowerName.includes('calicata') ||
                            lowerName.includes('sondaje') || lowerName.includes('punto');

                        const isGeotechTab = 
                            lowerTab.includes('material') || lowerTab.includes('muestr') || 
                            lowerTab.includes('calicata') || lowerTab.includes('geotec') ||
                            lowerTab.includes('investig') || lowerTab.includes('sondaje');

                        // Si es un Punto y tiene propiedades de identificación o pertenece a una capa técnica
                        if (f.geometry?.type === 'Point' && (
                            isGeotechTab || isSamplePattern || props.PUNTO || props.CODIGO || props.MUESTRA
                        )) {
                            const code = (props.CODIGO || props.PUNTO || props.name || props.nombre || props.id || 'M-POI').toString();
                            const exists = mc.some(existing => existing.codigo === code);
                            
                            if (!exists && code && code !== 'undefined') {
                                mc.push({
                                    id: `auto-${f.id || Math.random()}`,
                                    codigo: code,
                                    progresiva: props.PROGRESIVA || props.KILOMETRAJE || props.KM || props.PROG || props.PROG_INI || '-',
                                    tipo_roca: props.TIPO || props.UNIDAD || props.desc || props.TIPO_MUESTRA || props.MATERIAL || (lowerTab.includes('calicata') ? 'Calicata' : 'Muestra'),
                                    latitud: f.geometry.coordinates[1],
                                    longitud: f.geometry.coordinates[0],
                                    norte: props.NORTE || props.NORTHING || props.Y || props.LAT || '',
                                    este: props.ESTE || props.EASTING || props.X || props.LON || '',
                                    cota: props.COTA || props.ELEVATION || props.Z || props.ALTITUDE || '',
                                    isAuto: true
                                });
                            }
                        }
                    });
                }
            } catch(e) { console.warn("Error procesando capa para muestras", e); }
        });
        return mc;
    }, [muestras, layers]);

    const muestrasPorTipo = useMemo(() => {
        const counts = {};
        muestrasCalculadas.forEach(m => {
            const t = m.tipo_roca || 'Sin clasificar';
            counts[t] = (counts[t] || 0) + 1;
        });
        return counts;
    }, [muestrasCalculadas]);

    const avance = useMemo(() => {
        const totalTabs = 9;
        const subidas = layers.length;
        return Math.min(100, Math.round((subidas / totalTabs) * 100));
    }, [layers]);

    // Config de Gráficos
    const matChartData = {
        labels: ['Roca Fija', 'Roca Suelta', 'Mat. Suelto'],
        datasets: [{
            data: [matStats.rfTotal, matStats.rsTotal, matStats.msTotal],
            backgroundColor: ['#1e293b', '#007aff', '#ff9500'],
            borderWidth: 0, hoverOffset: 10
        }]
    };

    const muestrasChartData = {
        labels: Object.keys(muestrasPorTipo),
        datasets: [{
            label: 'Cantidad',
            data: Object.values(muestrasPorTipo),
            backgroundColor: '#af52de',
            borderRadius: 4
        }]
    };

    useEffect(() => {
        const load = async () => {
            if (!projectId) return;
            try {
                const [kmlRes, layersRes, muestrasRes, clasRes, fotosRes] = await Promise.all([
                    axiosInstance.get(`/api/proyectos/${projectId}/kml`, { params: { section: 'geologia' } }),
                    axiosInstance.get(`/api/proyectos/${projectId}/geologia-capas`),
                    axiosInstance.get(`/api/proyectos/${projectId}/geologia-muestras`),
                    axiosInstance.get(`/api/proyectos/${projectId}/clasificacion-materiales`),
                    axiosInstance.get(`/api/proyectos/${projectId}/panel-fotografico`)
                ]);

                const layersData = Array.isArray(layersRes.data?.data) ? layersRes.data.data : [];
                const muestrasData = Array.isArray(muestrasRes.data) ? muestrasRes.data : [];
                const fotosData = Array.isArray(fotosRes.data?.fotos) ? fotosRes.data.fotos : [];

                setLayers(layersData);
                setMuestras(muestrasData);
                setClasificacion(Array.isArray(clasRes.data) ? clasRes.data : []);
                setFotos(fotosData);

                const vis = { route: true, muestras: true, fotos: false };
                layersData.forEach(l => { vis[`layer-${l.id}`] = true; });
                setVisible(vis);

                // --- CÁLCULO DE BOUNDS PARA AUTO-ZOOM ---
                const groupBounds = L.latLngBounds();
                let hasBounds = false;

                // 1. KML Base (usar el geojson ya procesado arriba)
                if (kmlRes.data?.url) {
                    try {
                        const proxyRes = await axiosInstance.get('/api/proxy?url=' + encodeURIComponent(kmlRes.data.url), { responseType: 'text' });
                        const geojson = kml(new DOMParser().parseFromString(proxyRes.data, 'text/xml'));
                        setBaseKml(geojson);
                        const tempLayer = L.geoJSON(geojson);
                        if (tempLayer.getBounds().isValid()) {
                            groupBounds.extend(tempLayer.getBounds());
                            hasBounds = true;
                        }
                    } catch (e) { console.warn("Error bounds baseKml", e); }
                }

                // 2. Capas GeoJSON
                layersData.forEach(l => {
                    try {
                        const gdata = typeof l.geojson_data === 'string' ? JSON.parse(l.geojson_data) : l.geojson_data;
                        const tempLayer = L.geoJSON(gdata);
                        if (tempLayer.getBounds().isValid()) {
                            groupBounds.extend(tempLayer.getBounds());
                            hasBounds = true;
                        }
                    } catch (e) { }
                });

                // 3. Muestras
                muestrasData.forEach(m => {
                    if (m.latitud && m.longitud) {
                        groupBounds.extend([parseFloat(m.latitud), parseFloat(m.longitud)]);
                        hasBounds = true;
                    }
                });

                // 4. Fotos (usar fotosData directamente para evitar estado stale)
                fotosData.forEach(f => {
                    if (f.lat && f.lng) {
                        groupBounds.extend([parseFloat(f.lat), parseFloat(f.lng)]);
                        hasBounds = true;
                    }
                });

                if (hasBounds) {
                    setMapBounds(groupBounds);
                }
            } catch (err) { console.error(err); }
        };
        load();
    }, [projectId]);

    // Agrupamiento de Fotos (Lógica de PanelFotograficoTab)
    const agrupadas = useMemo(() => {
        const groups = [];
        const THRESHOLD = 0.00018; // ~20m
        fotos.filter(f => f.lat && f.lng).forEach(foto => {
            let found = false;
            for (const g of groups) {
                if (Math.abs(g.lat - parseFloat(foto.lat)) < THRESHOLD && Math.abs(g.lng - parseFloat(foto.lng)) < THRESHOLD) {
                    g.photos.push(foto); found = true; break;
                }
            }
            if (!found) groups.push({ lat: parseFloat(foto.lat), lng: parseFloat(foto.lng), photos: [foto] });
        });
        return groups;
    }, [fotos]);

    const layersByTab = useMemo(() => {
        const groups = {};
        layers.forEach(l => {
            const t = resolveGroupTabName(l.tab_name);
            if (!groups[t]) groups[t] = []; 
            groups[t].push(l);
        });
        return groups;
    }, [layers]);

    useEffect(() => {
        const currentTabs = Object.keys(layersByTab);
        if (currentTabs.length === 0) return;

        let savedOrder = [];
        try {
            const raw = window.localStorage.getItem(sectionOrderStorageKey);
            savedOrder = raw ? JSON.parse(raw) : [];
        } catch (error) {
            console.warn('No se pudo leer el orden guardado de capas:', error);
        }

        const kept = savedOrder.filter(tab => currentTabs.includes(tab));
        const missing = currentTabs.filter(tab => !kept.includes(tab));
        setSectionOrder([...kept, ...missing]);
    }, [layersByTab, sectionOrderStorageKey]);

    useEffect(() => {
        if (!projectId || sectionOrder.length === 0) return;
        try {
            window.localStorage.setItem(sectionOrderStorageKey, JSON.stringify(sectionOrder));
        } catch (error) {
            console.warn('No se pudo guardar el orden de capas:', error);
        }
    }, [projectId, sectionOrder, sectionOrderStorageKey]);

    useEffect(() => {
        if (!activeLayerId) return;
        if (!layers.some(layer => layer.id === activeLayerId)) {
            setActiveLayerId(null);
        }
    }, [activeLayerId, layers]);

    const orderedTabs = useMemo(() => {
        const currentTabs = Object.keys(layersByTab);
        const ordered = sectionOrder.filter(tab => currentTabs.includes(tab));
        const missing = currentTabs.filter(tab => !ordered.includes(tab));
        return [...ordered, ...missing];
    }, [layersByTab, sectionOrder]);

    const orderedLayers = useMemo(() => {
        const flatLayers = orderedTabs.flatMap(tab => layersByTab[tab] || []);
        return [...flatLayers].sort((a, b) => {
            const opacityA = opacities[`layer-${a.id}`] !== undefined ? opacities[`layer-${a.id}`] : 0.4;
            const opacityB = opacities[`layer-${b.id}`] !== undefined ? opacities[`layer-${b.id}`] : 0.4;
            if (opacityA !== opacityB) return opacityA - opacityB;
            if (activeLayerId === a.id && activeLayerId !== b.id) return 1;
            if (activeLayerId === b.id && activeLayerId !== a.id) return -1;
            return 0;
        });
    }, [orderedTabs, layersByTab, opacities, activeLayerId]);

    const activeLayerMeta = useMemo(() => {
        if (!activeLayerId) return null;
        return layers.find(layer => layer.id === activeLayerId) || null;
    }, [activeLayerId, layers]);

    const [mapBase, setMapBase] = useState('satellite');
    const [showTechTable, setShowTechTable] = useState(false);

    const toggle = (id) => {
        if (id.startsWith('layer-')) {
            const layerId = Number(id.replace('layer-', ''));
            if (activeLayerId === layerId) {
                setActiveLayerId(null);
            }
        }
        setVisible(prev => {
            const nextValue = !prev[id];
            if (id.startsWith('layer-') && nextValue) {
                setOpacities(current => ({ ...current, [id]: 1 }));
            }
            return { ...prev, [id]: nextValue };
        });
    };
    const setOpacity = (id, val) => setOpacities(p => ({ ...p, [id]: parseFloat(val) }));
    const moveSection = useCallback((fromTab, toTab) => {
        if (!fromTab || !toTab || fromTab === toTab) return;
        setSectionOrder(prev => {
            const baseOrder = prev.length ? [...prev] : Object.keys(layersByTab);
            const filtered = baseOrder.filter(tab => tab !== fromTab);
            const targetIndex = filtered.indexOf(toTab);
            if (targetIndex === -1) return prev;
            filtered.splice(targetIndex, 0, fromTab);
            return filtered;
        });
    }, [layersByTab]);

    const toggleSec = (s) => {
        setExpanded(prev => {
            // Caso 1: Se quiere cerrar lo que ya está abierto (toggle behavior normal)
            if (prev[s]) {
                return { ...prev, [s]: false };
            }

            // Caso 2: Se quiere abrir una sección técnica (comienza con 'sec-')
            if (s.startsWith('sec-')) {
                // Creamos un nuevo objeto, cerrando solo las demás secciones técnicas 'sec-'
                const newState = { ...prev };
                Object.keys(newState).forEach(key => {
                    if (key.startsWith('sec-')) {
                        newState[key] = false;
                    }
                });
                // Abrimos la seleccionada
                newState[s] = true;
                return newState;
            }

            // Caso 3: Otras secciones (base, route, stats, etc.)
            // Las abrimos manteniendo el resto de las secciones base como estén, 
            // pero cerramos las secciones técnicas si hay alguna abierta para mejorar el foco.
            const newStateFallback = { ...prev };
            newStateFallback[s] = true;
            return newStateFallback;
        });
    };

    const handleKmSearchInput = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleKmSearch();
        }
    };

    const handleKmSearch = () => {
        const rawInput = kmSearch.trim();
        if (!rawInput) return;

        const clean = (s) => s.toString().replace(/[+.\s-]/g, '').toLowerCase().replace(/^0+/, '');
        const searchNorm = clean(rawInput);
        
        let targetPoint = null;
        // 1. Buscar en Capas GeoJSON
        const allLayers = baseKml ? [baseKml] : [];
        layers.forEach(l => {
            try {
                const gdata = typeof l.geojson_data === 'string' ? JSON.parse(l.geojson_data) : l.geojson_data;
                if (gdata) allLayers.push(gdata);
            } catch(e){}
        });

        for (const geojson of allLayers) {
            if (!geojson.features) continue;
            for (const f of geojson.features) {
                const props = f.properties || {};
                for (const val of Object.values(props)) {
                    if (val && clean(val).includes(searchNorm)) {
                        if (f.geometry.type === 'Point') {
                            targetPoint = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
                        } else if (f.geometry.coordinates && f.geometry.coordinates.length > 0) {
                            const first = f.geometry.type === 'LineString' ? f.geometry.coordinates[0] : 
                                        f.geometry.type === 'Polygon' ? f.geometry.coordinates[0][0] : null;
                            if (first) targetPoint = [first[1], first[0]];
                        }
                        if (targetPoint) break;
                    }
                }
                if (targetPoint) break;
            }
            if (targetPoint) break;
        }

        // 2. Buscar en Muestras
        if (!targetPoint) {
            const matchedMuestra = muestras.find(m => 
                (m.progresiva && clean(m.progresiva).includes(searchNorm)) || 
                (m.codigo && clean(m.codigo).includes(searchNorm))
            );
            if (matchedMuestra && matchedMuestra.latitud && matchedMuestra.longitud) {
                targetPoint = [parseFloat(matchedMuestra.latitud), parseFloat(matchedMuestra.longitud)];
            }
        }

        if (targetPoint && map) {
            map.setView(targetPoint, 17);
        } else {
            alertify.warning(`No se encontró "${rawInput}". Intente otro formato.`);
        }
    };

    const toggleFullScreen = () => {
        const doc = window.document;
        const docEl = doc.documentElement;
        const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            requestFullScreen.call(docEl);
            setIsFullScreen(true);
        } else {
            cancelFullScreen.call(doc);
            setIsFullScreen(false);
        }
    };



    const toggleWholeSection = (tabName) => {
        const sectionLayers = layers.filter(l => (l.tab_name || 'Otros').toLowerCase() === tabName.toLowerCase());
        const allVisible = sectionLayers.every(l => visible[`layer-${l.id}`]);
        const updates = {};
        sectionLayers.forEach(l => { updates[`layer-${l.id}`] = !allVisible; });
        setVisible(prev => ({ ...prev, ...updates }));
        if (allVisible === false) {
            setOpacities(prev => {
                const next = { ...prev };
                sectionLayers.forEach(l => {
                    next[`layer-${l.id}`] = 1;
                });
                return next;
            });
        }
        setActiveLayerId(null);
        clearSelectedFeature();
    };

    const handleExportLayerKML = async () => {
        if (!layerToExport) return;
        try {
            alertify.message('Exportando a KML...');
            const geoJsonData = typeof layerToExport.geojson_data === 'string' ? JSON.parse(layerToExport.geojson_data) : layerToExport.geojson_data;
            const geoJsonToExport = {
                type: 'FeatureCollection',
                features: geoJsonData.features || [geoJsonData]
            };
            const response = await axiosInstance.post('/api/trafico/exportar-kml', geoJsonToExport, {
                responseType: 'blob',
            });
            saveAs(response.data, `${(layerToExport.file_name || 'capa').replace('.rar', '').replace('.zip', '')}.kml`);
            alertify.success('Exportación KML completada.');
            setLayerToExport(null);
        } catch (error) {
            console.error('Error al exportar a KML:', error);
            alertify.error('Error durante la exportación a KML.');
        }
    };

    const handleExportLayerShapefile = async () => {
        if (!layerToExport) return;
        try {
            alertify.message('Exportando a Shapefile (ZIP)...');
            const geoJsonData = typeof layerToExport.geojson_data === 'string' ? JSON.parse(layerToExport.geojson_data) : layerToExport.geojson_data;
            const geoJsonToExport = {
                type: 'FeatureCollection',
                features: geoJsonData.features || [geoJsonData]
            };
            const response = await axiosInstance.post('/api/trafico/exportar-shapefile', geoJsonToExport, {
                responseType: 'blob',
            });
            saveAs(response.data, `${(layerToExport.file_name || 'capa').replace('.rar', '').replace('.zip', '')}.zip`);
            alertify.success('Exportación a Shapefile completada.');
            setLayerToExport(null);
        } catch (error) {
            console.error('Error al exportar a Shapefile:', error);
            alertify.error('Error durante la exportación a Shapefile.');
        }
    };

    const handleEditDriveLink = async (tabName) => {
        const currentLink = (layersByTab[tabName] || []).find(l => l.drive_url)?.drive_url || '';
        alertify.prompt(
            '📁 CONFIGURAR CARPETA DRIVE',
            `Ingrese el link de Google Drive para la sección ${tabName}:`,
            currentLink,
            async (evt, value) => {
                if (evt.cancel) return;
                try {
                    alertify.message('Actualizando link...');
                    await axiosInstance.patch(`/api/proyectos/${projectId}/geologia-capas/${tabName}/drive-link`, { driveUrl: value });
                    alertify.success('Link de carpeta actualizado correctamente');
                    
                    // Refrescar capas
                    const layersRes = await axiosInstance.get(`/api/proyectos/${projectId}/geologia-capas`);
                    setLayers(Array.isArray(layersRes.data?.data) ? layersRes.data.data : []);
                } catch (err) {
                    console.error('Error al actualizar link:', err);
                    alertify.error('Error al actualizar el link de la carpeta');
                }
            },
            () => {}
        ).set('labels', {ok:'Guardar', cancel:'Cancelar'}).set('closable', false);
    };

    const mapTiles = {
        satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        terrain: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    };

    const handlePrintReport = () => {
        const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        // ---- LEYENDA ----
        const leyendaHtml = Object.entries(SECTION_COLORS).map(([key, color]) => {
            const count = layers.filter(l => (l.tab_name || '').toLowerCase().includes(key.replace(/_/g, ''))).length;
            return `<div style="display:flex;align-items:center;gap:8px;font-size:11px;margin-bottom:6px">
                <div style="width:13px;height:13px;background:${color};border-radius:3px;border:1px solid rgba(0,0,0,0.2);flex-shrink:0"></div>
                <span style="text-transform:capitalize;font-weight:600;flex:1">${key.replace(/_/g, ' ')}</span>
                <span style="font-size:10px;color:#64748b;font-weight:700">${count} capa${count !== 1 ? 's' : ''}</span>
            </div>`;
        }).join('');

        // ---- RESUMEN POR SECCIÓN ----
        const seccionesHtml = Object.entries(layersByTab).length > 0
            ? Object.entries(layersByTab).map(([tab, group]) => {
                const color = getTabColor(tab);
                return `<tr>
                    <td style="border-left:4px solid ${color};padding-left:8px;font-weight:600">${tab}</td>
                    <td style="text-align:center;font-weight:700">${group.length}</td>
                    <td style="font-size:10px;color:#64748b">${group.map(l => l.file_name || l.id).join(', ')}</td>
                </tr>`;
            }).join('')
            : `<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:12px">Sin capas geológicas cargadas</td></tr>`;

        // ---- TOTALES MATERIALES ----
        const totalLong = clasificacion.reduce((s, c) => s + parseFloat(c.tramo_m || 0), 0);
        const totalRF   = clasificacion.reduce((s, c) => s + parseFloat(c.long_roca_fija || 0), 0);
        const totalRS   = clasificacion.reduce((s, c) => s + parseFloat(c.long_roca_suelta || 0), 0);
        const totalMS   = clasificacion.reduce((s, c) => s + parseFloat(c.long_material_suelto || 0), 0);
        const pctRF = totalLong > 0 ? ((totalRF / totalLong) * 100).toFixed(0) : 0;
        const pctRS = totalLong > 0 ? ((totalRS / totalLong) * 100).toFixed(0) : 0;
        const pctMS = totalLong > 0 ? ((totalMS / totalLong) * 100).toFixed(0) : 0;

        // ---- MUESTRAS POR TIPO ----
        const tiposRoca = {};
        muestrasCalculadas.forEach(m => { const t = m.tipo_roca || 'Sin tipo'; tiposRoca[t] = (tiposRoca[t] || 0) + 1; });
        const tiposHtml = Object.entries(tiposRoca).length > 0
            ? Object.entries(tiposRoca).map(([tipo, cnt]) =>
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:11px">
                    <span style="font-weight:600">${tipo}</span>
                    <span style="background:#af52de;color:white;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:800">${cnt}</span>
                </div>`).join('')
            : `<p style="color:#94a3b8;font-size:11px;padding:10px 0">Sin muestras registradas</p>`;

        const html = `<!DOCTYPE html><html lang="es"><head>
        <meta charset="UTF-8">
        <title>Reporte Técnico de Geología</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background:#f1f5f9; color:#0f172a; }
            /* BARRA DE HERRAMIENTAS */
            .toolbar { background:#1e3a8a; color:white; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:99; }
            .toolbar-title { font-size:14px; font-weight:800; }
            .toolbar-sub { font-size:11px; opacity:0.75; margin-top:2px; }
            .btn-print { background:#af52de; color:white; border:none; border-radius:8px; padding:10px 24px; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:8px; }
            /* PÁGINA */
            .page { width:210mm; margin:20px auto 40px; background:white; padding:16mm; box-shadow:0 4px 24px rgba(0,0,0,0.12); border-radius:10px; }
            /* ENCABEZADO */
            .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:16px; border-bottom:3px solid #1e3a8a; margin-bottom:22px; }
            .header-logo { display:flex; align-items:center; gap:12px; }
            .header-badge { background:#1e3a8a; color:white; width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; flex-shrink:0; }
            h1 { font-size:20px; color:#1e3a8a; font-weight:900; line-height:1.2; }
            .header-sub { font-size:12px; color:#64748b; margin-top:3px; }
            .header-right { text-align:right; font-size:11px; color:#64748b; line-height:1.7; }
            .header-right strong { color:#1e3a8a; font-size:12px; display:block; }
            /* KPIs */
            .kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:24px; }
            .kpi { border:1px solid #e2e8f0; padding:12px; border-radius:8px; text-align:center; }
            .kpi-label { font-size:8px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
            .kpi-value { font-size:20px; font-weight:900; margin:4px 0 0; }
            .kpi-unit { font-size:10px; font-weight:600; color:#94a3b8; }
            /* SECCIONES */
            h3 { font-size:12px; color:#1e3a8a; border-left:4px solid #1e3a8a; padding-left:10px; margin:22px 0 10px; text-transform:uppercase; letter-spacing:0.5px; font-weight:800; }
            .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:10px; }
            .card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; }
            /* BARRAS DE DISTRIBUCIÓN */
            .dist-bar { height:10px; border-radius:5px; margin-top:4px; display:flex; overflow:hidden; }
            .dist-seg { height:100%; }
            .dist-legend { display:flex; gap:12px; margin-top:6px; flex-wrap:wrap; }
            .dist-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:3px; }
            /* TABLAS */
            table { width:100%; border-collapse:collapse; font-size:10px; margin-top:8px; }
            thead th { background:#1e3a8a; color:white; padding:7px 8px; text-align:left; font-size:9px; font-weight:800; text-transform:uppercase; }
            tbody td { padding:5px 8px; border-bottom:1px solid #f1f5f9; }
            tbody tr:nth-child(even) td { background:#f8fafc; }
            .totals-row td { background:#e0f2fe !important; font-weight:800; color:#0369a1; border-top:2px solid #0369a1; }
            /* FOOTER */
            .footer { text-align:center; font-size:9px; color:#94a3b8; margin-top:32px; padding-top:12px; border-top:1px solid #e2e8f0; }
            @media print {
                @page { size:A4 portrait; margin:8mm; }
                .toolbar { display:none !important; }
                body { background:white !important; }
                .page { box-shadow:none !important; margin:0 !important; border-radius:0 !important; padding:0 !important; width:100% !important; }
            }
        </style>
        </head><body>

        <!-- BARRA HERRAMIENTAS -->
        <div class="toolbar">
            <div>
                <div class="toolbar-title">📋 Informe Técnico de Geología · GRTC</div>
                <div class="toolbar-sub">Generado el ${fecha} a las ${hora}</div>
            </div>
            <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        </div>

        <!-- PÁGINA A4 -->
        <div class="page">

            <!-- ENCABEZADO -->
            <div class="header">
                <div class="header-logo">
                    <div class="header-badge">G</div>
                    <div>
                        <h1>REPORTE TÉCNICO: GEOLOGÍA DEL CORREDOR</h1>
                        <div class="header-sub">Sistema GEOPORTAL · Vista Externa · Dirección de Caminos</div>
                    </div>
                </div>
                <div class="header-right">
                    <strong>GOBIERNO REGIONAL DE TRANSPORTES Y COMUNICACIONES</strong>
                    ${fecha} · ${hora}
                </div>
            </div>

            <!-- KPIs -->
            <div class="kpis">
                <div class="kpi">
                    <div class="kpi-label">Longitud Analizada</div>
                    <div class="kpi-value" style="color:#0f172a">${matStats.longTotal.toFixed(0)}</div>
                    <div class="kpi-unit">metros</div>
                </div>
                <div class="kpi">
                    <div class="kpi-label">Avance Técnico</div>
                    <div class="kpi-value" style="color:#34c759">${avance}%</div>
                    <div class="kpi-unit">completado</div>
                </div>
                <div class="kpi">
                    <div class="kpi-label">Total Capas</div>
                    <div class="kpi-value" style="color:#007aff">${layers.length}</div>
                    <div class="kpi-unit">geológicas</div>
                </div>
                <div class="kpi">
                    <div class="kpi-label">Muestras</div>
                    <div class="kpi-value" style="color:#af52de">${muestrasCalculadas.length}</div>
                    <div class="kpi-unit">de campo</div>
                </div>
                <div class="kpi">
                    <div class="kpi-label">Registros Mat.</div>
                    <div class="kpi-value" style="color:#ff9500">${clasificacion.length}</div>
                    <div class="kpi-unit">tramos</div>
                </div>
            </div>

            <!-- DISTRIBUCIÓN MATERIALES + LEYENDA -->
            <div class="two-col">
                <div class="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:10px;text-transform:uppercase">Distribución de Materiales</div>
                    <div class="dist-bar">
                        <div class="dist-seg" style="width:${pctRF}%;background:#1e3a8a"></div>
                        <div class="dist-seg" style="width:${pctRS}%;background:#007aff"></div>
                        <div class="dist-seg" style="width:${pctMS}%;background:#ff9500"></div>
                    </div>
                    <div class="dist-legend">
                        <div style="display:flex;align-items:center;gap:4px;font-size:10px"><div class="dist-dot" style="background:#1e3a8a"></div> Roca Fija: <b>${pctRF}%</b> (${totalRF.toFixed(0)} m)</div>
                        <div style="display:flex;align-items:center;gap:4px;font-size:10px"><div class="dist-dot" style="background:#007aff"></div> Roca Suelta: <b>${pctRS}%</b> (${totalRS.toFixed(0)} m)</div>
                        <div style="display:flex;align-items:center;gap:4px;font-size:10px"><div class="dist-dot" style="background:#ff9500"></div> Mat. Suelto: <b>${pctMS}%</b> (${totalMS.toFixed(0)} m)</div>
                    </div>
                    <div style="margin-top:12px;font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px">
                        <b>Longitud Total Analizada:</b> ${totalLong.toFixed(2)} m
                    </div>
                </div>
                <div class="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:10px;text-transform:uppercase">Leyenda de Secciones</div>
                    ${leyendaHtml}
                </div>
            </div>

            <!-- TABLA DE CAPAS POR SECCIÓN -->
            <h3>Resumen de Capas Geológicas por Sección</h3>
            <div class="card">
                <table>
                    <thead><tr>
                        <th>SECCIÓN GEOLÓGICA</th><th style="text-align:center">N° CAPAS</th><th>ARCHIVOS CARGADOS</th>
                    </tr></thead>
                    <tbody>${seccionesHtml}</tbody>
                </table>
            </div>

            <!-- TABLA COMPLETA DE MATERIALES -->
            <h3>Tabla de Clasificación de Materiales</h3>
            <div class="card" style="padding:0;overflow:hidden">
                <table>
                    <thead><tr>
                        <th>DESCRIPCIÓN GEOTÉCNICA</th>
                        <th>PROG. INICIO</th><th>PROG. FIN</th>
                        <th>TRAMO (m)</th>
                        <th>ROCA FIJA (%)</th><th>ROCA SUELTA (%)</th><th>MAT. SUELTO (%)</th>
                    </tr></thead>
                    <tbody>
                        ${clasificacion.map(c => `<tr>
                            <td>${c.descripcion_geotecnica || c.simbolo || '-'}</td>
                            <td>${parseFloat(c.prog_inicio || 0).toFixed(2)}</td>
                            <td>${parseFloat(c.prog_fin || 0).toFixed(2)}</td>
                            <td style="font-weight:700">${formatZeroAsBlank(c.tramo_m, 2)}</td>
                            <td style="color:#1e3a8a;font-weight:700">${formatZeroAsBlank(c.pct_roca_fija, 0, '%')}</td>
                            <td style="color:#007aff;font-weight:700">${formatZeroAsBlank(c.pct_roca_suelta, 0, '%')}</td>
                            <td style="color:#ff9500;font-weight:700">${formatZeroAsBlank(c.pct_material_suelto, 0, '%')}</td>
                        </tr>`).join('')}
                        ${clasificacion.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:15px">Sin datos de clasificación registrados</td></tr>' : ''}
                        ${clasificacion.length > 0 ? `<tr class="totals-row">
                            <td><b>TOTALES</b></td>
                            <td></td><td></td>
                            <td>${totalLong.toFixed(2)}</td>
                            <td>${pctRF}%</td>
                            <td>${pctRS}%</td>
                            <td>${pctMS}%</td>
                        </tr>` : ''}
                    </tbody>
                </table>
            </div>

            <!-- MUESTRAS DE CAMPO Y GEOTECNIA (AL FINAL) -->
            <h3>Muestras de Campo y Geotecnia</h3>
            <div class="two-col">
                <div class="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:8px;text-transform:uppercase">Resumen por Tipo</div>
                    ${tiposHtml}
                </div>
                <div class="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:8px;text-transform:uppercase">Muestras Registradas</div>
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table>
                            <thead><tr><th>CÓDIGO</th><th>PROGRESIVA</th><th>TIPO</th></tr></thead>
                            <tbody>
                                ${muestrasCalculadas.length > 0 
                                    ? muestrasCalculadas.map(m => `<tr>
                                        <td style="font-weight:700; color:#1e293b">${m.codigo || m.id || '-'}</td>
                                        <td style="color:#1e3a8a; font-weight:600">${m.progresiva || '-'}</td>
                                        <td><span style="font-size:9px; background:#f1f5f9; padding:2px 5px; border-radius:4px">${m.tipo_roca || '-'}</span></td>
                                    </tr>`).join('')
                                    : '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:20px; font-style:italic;">Sin muestras detectadas</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                    ${muestrasCalculadas.length > 0 ? `<p style="font-size:9px; color:#64748b; margin-top:10px; text-align:right;">Total de muestras: <b>${muestrasCalculadas.length}</b></p>` : ''}
                </div>
            </div>

            <!-- FOOTER -->
            <div class="footer">
                Documento técnico generado automáticamente por SISTEMA GEOPORTAL · GRTC · ${fecha} ${hora}<br>
                Este documento es de carácter técnico y de uso interno. No válido como documento oficial sin firma autorizada.
            </div>
        </div>
        </body></html>`;

        // Blob URL: no bloqueado por Brave/Chrome
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 15000);
    };




    return ReactDOM.createPortal(
        <div className="external-view-container" style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'block' }}>
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
                <g dangerouslySetInnerHTML={{ __html: LEGEND_PATTERN_DEFS }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <MapContainer center={[-12, -75]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <MapReferenceCapturer setMap={setMap} />
                    <TileLayer url={mapTiles[mapBase]} attribution='&copy; ESRI/OSM' />
                    <ZoomControl position="topright" />
                    <MapEventsController setZoom={setCurrentZoom} onMapClick={clearSelectedFeature} featureClickGuardRef={featureClickGuardRef} />
                    <MapFitter bounds={mapBounds} />

                    {baseKml && visible.route && <GeoJSON data={baseKml} style={{ color: "#007aff", weight: 6, opacity: 0.4, filter: 'drop-shadow(0 0 3px rgba(0,122,255,0.5))' }} />}
                    <RouteEndpointsLayer geoJson={baseKml} />
                    
                    {orderedLayers.map(l => (visible[`layer-${l.id}`] && (
                        <GeoJSON
                            key={`lay-${l.id}-${opacities[`layer-${l.id}`] !== undefined ? opacities[`layer-${l.id}`] : 0.4}-${selectedFeatureTarget?.layerId === l.id ? selectedFeatureTarget.signature : 'idle'}`}
                            data={typeof l.geojson_data === 'string' ? JSON.parse(l.geojson_data) : l.geojson_data} 
                            style={(feature) => getLayerFeatureStyle(feature, l)} 
                            pointToLayer={(f, latlng) => {
                                if (f.properties) {
                                    f.properties._layer_tab = l.tab_name;
                                    f.properties._layer_name = l.file_name;
                                }
                                const signature = getFeatureSignature(f);
                                const isSelectedPoint = !!selectedFeatureTarget
                                    && selectedFeatureTarget.layerId === l.id
                                    && selectedFeatureTarget.signature === signature;
                                return renderGeoPoint(f, latlng, isSelectedPoint);
                            }} 
                            onEachFeature={(f, layer) => {
                                const signature = getFeatureSignature(f);
                                const isSelectedFeature = !!selectedFeatureTarget
                                    && selectedFeatureTarget.layerId === l.id
                                    && selectedFeatureTarget.signature === signature;

                                if (isSelectedFeature) {
                                    if (layer.setStyle) {
                                        layer.setStyle(getImmediateSelectedFeatureStyle(f, l));
                                    }
                                    if (layer.bringToFront) {
                                        setTimeout(() => layer.bringToFront(), 0);
                                    }
                                }

                                layer.on('click', (e) => {
                                    featureClickGuardRef.current = Date.now();
                                    if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
                                    focusSingleLayer(l.id);
                                    clearSelectedFeature();
                                    setSelectedFeatureTarget({ layerId: l.id, signature });
                                    selectedFeatureRef.current = { layer, feature: f, layerMeta: l };
                                    if (layer.setStyle) {
                                        layer.setStyle(getImmediateSelectedFeatureStyle(f, l));
                                    }
                                    if (layer.bringToFront) layer.bringToFront();
                                    const useLegacyPopup = false;
                                    if (!useLegacyPopup) {
                                        const isGeodinamicaLayer = (l.tab_name || '').toLowerCase().includes('geodinamicaexterna');
                                        const representativeLatLng = getFeatureRepresentativeLatLng(f, e.latlng);
                                        const nearbyPhotos = isGeodinamicaLayer && representativeLatLng
                                            ? getNearbyPanelPhotos(representativeLatLng.lat, representativeLatLng.lng, fotos)
                                            : [];
                                        const popupLayer = e.target.bindPopup(
                                            buildFeaturePopupHtml(f.properties || {}, l, { nearbyPhotos }),
                                            getFeaturePopupOptions(l)
                                        );
                                        popupLayer.openPopup();
                                        if (isGeodinamicaLayer && nearbyPhotos.length > 0) {
                                            setTimeout(() => {
                                                const popupElement = popupLayer.getPopup?.()?.getElement?.();
                                                if (!popupElement) return;
                                                popupElement.querySelectorAll('[data-geod-popup-photo-index]').forEach((photoNode) => {
                                                    photoNode.addEventListener('click', (domEvent) => {
                                                        domEvent.preventDefault();
                                                        domEvent.stopPropagation();
                                                        const photoIndex = Number(photoNode.getAttribute('data-geod-popup-photo-index') || 0);
                                                        openPhotoGallery(nearbyPhotos, photoIndex);
                                                    });
                                                });
                                            }, 0);
                                        }
                                    } else {
                                    const p = f.properties || {};
                                    let h = `<div class="invvial-map-popup-card" style="min-width:260px;"><div class="popup-header" style="background:#1e3a8a; color:white; padding:10px; font-weight:700;">${p.name || 'DETALLE TÉCNICO'}</div><div style="padding:10px; font-size:11px; max-height:200px; overflow-y:auto;">`;
                                    Object.entries(p).forEach(([k, v]) => { if (!k.startsWith('_')) h += `<div class="detail-row"><b>${k}:</b> <span>${v}</span></div>`; });
                                    h += `</div></div>`; e.target.bindPopup(h).openPopup();
                                    }
                                });
                            }} />
                    )))}

                    {visible.muestras && muestrasCalculadas.map(m => (
                        <Marker key={`m-${m.id}`} position={[parseFloat(m.latitud), parseFloat(m.longitud)]} icon={getMuestraIcon(m.tipo_roca)}>
                            <Popup className="dashboard-map-container">
                                <div className="invvial-map-popup-card" style={{ minWidth: '280px' }}>
                                    <div className="popup-header" style={{ background: 'var(--primary-gradient)', color: 'white', padding: '10px' }}>MUESTRA: {m.codigo}</div>
                                    <div style={{ padding: '12px', fontSize: '11px' }}>
                                        <div className="detail-row"><b>TIPO:</b> <span>{m.tipo_roca}</span></div>
                                        {m.isAuto && <div className="detail-row" style={{color:'#0369a1', fontWeight:'bold'}}><b>DETECTADA EN CAPAS DEL MAPA</b></div>}
                                        {m.archivo_pdf_url && <a href={m.archivo_pdf_url} target="_blank" rel="noreferrer" className="pdf-link-btn" style={{ background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '6px', textDecoration: 'none', marginTop: '10px' }}><i className="fa-solid fa-file-pdf"></i> PANEL FOTOGRÁFICO</a>}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* FOTOS AGRUPADAS (CARRUSEL) */}
                    {visible.fotos && (currentZoom > 12) && agrupadas.map((g, idx) => (
                        <Marker key={`g-${idx}`} position={[g.lat, g.lng]} icon={getCameraIcon(g.photos.length)}>
                            <Popup className="dashboard-map-container">
                                <div className="invvial-map-popup-card" style={{ minWidth: '280px', background: 'white' }}>
                                    <div className="popup-header" style={{ background: '#1e3a8a', color: 'white', padding: '10px', fontWeight: 800 }}>PUNTO FOTOGRÁFICO</div>
                                    <PhotoCarousel photos={g.photos} onSelect={openPhotoGallery} />
                                    <div style={{ padding: '12px', fontSize: '11px' }}>
                                        <div style={{ fontWeight: 700, color: '#1e3a8a' }}>{g.photos[0]?.nombre || 'Geología'}</div>
                                        <div style={{ color: '#64748b', marginTop: '4px' }}>{g.photos[0]?.descripcion}</div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
                <button className="map-tool-btn" style={{ position: 'absolute', top: '20px', left: '20px', pointerEvents: 'auto', background: 'white', border: 'none', borderRadius: '8px', width: '42px', height: '42px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 110 }} onClick={() => setLeftOpen(!leftOpen)}>
                    <i className={`fa-solid ${leftOpen ? 'fa-xmark' : 'fa-layer-group'}`}></i>
                </button>

                <button className="map-tool-btn" style={{ position: 'absolute', top: '20px', right: '60px', pointerEvents: 'auto', background: 'white', border: 'none', borderRadius: '8px', width: '42px', height: '42px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 110 }} onClick={() => setRightOpen(!rightOpen)}>
                    <i className={`fa-solid ${rightOpen ? 'fa-xmark' : 'fa-chart-pie'}`}></i>
                </button>


                <aside className={`external-sidebar sidebar-left ${leftOpen ? 'active' : ''}`} style={{ position: 'absolute', left: leftOpen ? 0 : -340, top: 0, height: '100%', width: '330px', pointerEvents: 'auto', transition: 'left 0.4s ease-out', zIndex: 120, background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '5px 0 15px rgba(0,0,0,0.1)' }}>
                    <div className="ext-sidebar-header" style={{ background: '#1e3a8a', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px' }}><i className="fa-solid fa-layer-group"></i> CAPAS TÉCNICAS</span>
                        <button onClick={() => setLeftOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
                    </div>
                    
                    {/* LEYENDA GENERAL */}
                    <div className="ext-legend-container" style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leyenda General</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {Object.entries(SECTION_COLORS).map(([key, color]) => {
                                const sectionLayers = layers.filter(l => l.tab_name?.toLowerCase().includes(key.toLowerCase().replace(/_/g, '')));
                                const isVisible = sectionLayers.length > 0 && sectionLayers.every(l => visible[`layer-${l.id}`]);
                                const hasLayers = sectionLayers.length > 0;

                                return (
                                    <div key={key} 
                                        onClick={() => hasLayers && toggleWholeSection(key)}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', 
                                            cursor: hasLayers ? 'pointer' : 'default',
                                            opacity: hasLayers ? (isVisible ? 1 : 0.5) : 0.3,
                                            transition: 'all 0.2s ease',
                                            textDecoration: hasLayers && !isVisible ? 'line-through' : 'none'
                                        }}
                                        title={hasLayers ? `Clic para alternar ${key.replace(/_/g, ' ')}` : 'No hay capas en esta sección'}
                                    >
                                        <div style={{ width: '10px', height: '10px', background: color, borderRadius: '2px', boxShadow: isVisible ? `0 0 4px ${color}` : 'none' }}></div>
                                        <span style={{ color: '#1e293b', fontWeight: 600, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {activeLayerMeta && (
                            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #dbeafe' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Capa Activa</div>
                                        <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {activeLayerMeta.file_name}
                                        </div>
                                    </div>
                                    <button
                                        onClick={resetLayerFocus}
                                        style={{ border: 'none', background: '#dbeafe', color: '#1d4ed8', fontSize: '10px', fontWeight: 800, borderRadius: '999px', padding: '7px 10px', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        Mostrar todas
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ext-panel-content" style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
                        <div className="ext-layer-group" style={{ marginBottom: '15px' }}>
                            <div className="ext-layer-title" onClick={() => toggleSec('base')}><span>Datos Principales</span><i className="fa-solid fa-chevron-down"></i></div>
                            {expanded.base && (
                                <div className="ext-layer-list">
                                    <label className="ext-layer-item"><input type="checkbox" checked={!!visible.route} onChange={() => toggle('route')} /> Trazo Proyecto</label>
                                    <label className="ext-layer-item"><input type="checkbox" checked={!!visible.muestras} onChange={() => toggle('muestras')} /> Muestras Técnicas</label>
                                    <label className="ext-layer-item"><input type="checkbox" checked={!!visible.fotos} onChange={() => toggle('fotos')} /> Panel Fotográfico {currentZoom <= 12 && visible.fotos && <span style={{fontSize:9, color:'red'}}>(Acerca zoom)</span>}</label>
                                </div>
                            )}
                        </div>
                        {orderedTabs.map((tab) => {
                            const group = layersByTab[tab] || [];
                            const groupDriveUrl = (group || []).find(l => l.drive_url)?.drive_url;

                            return (
                                <div
                                    key={tab}
                                    className="ext-layer-group"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggedSection && draggedSection !== tab) {
                                            setDropTargetSection(tab);
                                        }
                                    }}
                                    onDragLeave={() => {
                                        if (dropTargetSection === tab) {
                                            setDropTargetSection(null);
                                        }
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        moveSection(draggedSection, tab);
                                        setDraggedSection(null);
                                        setDropTargetSection(null);
                                    }}
                                    style={{
                                        marginBottom: '15px',
                                        borderTop: `2px solid ${getTabColor(tab)}`,
                                        paddingTop: '10px',
                                        opacity: draggedSection === tab ? 0.72 : 1,
                                        transform: draggedSection === tab ? 'scale(1.015)' : 'scale(1)',
                                        boxShadow: draggedSection === tab
                                            ? '0 14px 28px rgba(15, 23, 42, 0.16)'
                                            : dropTargetSection === tab
                                                ? '0 0 0 2px rgba(0, 122, 255, 0.22), 0 8px 20px rgba(0, 122, 255, 0.12)'
                                                : 'none',
                                        borderRadius: '18px',
                                        background: dropTargetSection === tab ? 'linear-gradient(180deg, rgba(0,122,255,0.04), rgba(255,255,255,0.9))' : 'transparent',
                                        transition: 'transform 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease, background 0.22s ease'
                                    }}
                                >
                                    <div className="ext-layer-title" style={{ color: getTabColor(tab), display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '10px' }}>
                                        <div
                                            onClick={() => focusSectionLayers(tab)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}
                                        >
                                            <span
                                                draggable
                                                onClick={(e) => e.stopPropagation()}
                                                onDragStart={(e) => {
                                                    e.stopPropagation();
                                                    setDraggedSection(tab);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }}
                                                onDragEnd={(e) => {
                                                    e.stopPropagation();
                                                    setDraggedSection(null);
                                                    setDropTargetSection(null);
                                                }}
                                                style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, padding: '4px', color: draggedSection === tab ? getTabColor(tab) : '#94a3b8', cursor: draggedSection === tab ? 'grabbing' : 'grab' }}
                                                title="Arrastrar para reordenar"
                                            >
                                                <i className="fa-solid fa-grip-vertical" style={{ fontSize: '12px', transition: 'color 0.2s ease, transform 0.2s ease', transform: draggedSection === tab ? 'scale(1.15)' : 'scale(1)' }}></i>
                                            </span>
                                            <span style={{ textTransform: 'uppercase', fontWeight: 'bold', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (groupDriveUrl) window.open(groupDriveUrl, '_blank', 'noopener,noreferrer');
                                                        else alertify.warning(`No hay carpeta configurada para ${tab}`);
                                                    }}
                                                    style={{ background: 'none', border: 'none', padding: '4px', color: groupDriveUrl ? '#f59e0b' : '#cbd5e1', cursor: groupDriveUrl ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
                                                    title={groupDriveUrl ? `Abrir carpeta de ${tab}` : 'Sin carpeta'}
                                                >
                                                    <i className="fa-solid fa-folder-open" style={{ fontSize: '13px' }}></i>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEditDriveLink(tab); }}
                                                    style={{ background: 'none', border: 'none', padding: '4px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    title="Editar link de carpeta"
                                                >
                                                    <i className="fa-solid fa-pen-to-square" style={{ fontSize: '11px' }}></i>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSec(`sec-${tab}`);
                                            }}
                                            style={{ background: 'none', border: 'none', color: getTabColor(tab), cursor: 'pointer', flexShrink: 0, width: '24px', padding: 0, textAlign: 'center' }}
                                            title={expanded[`sec-${tab}`] ? 'Contraer sección' : 'Expandir sección'}
                                        >
                                            <i className="fa-solid fa-chevron-down" style={{ width: '14px', textAlign: 'center' }}></i>
                                        </button>
                                    </div>
                                    {expanded[`sec-${tab}`] && (
                                        <div className="ext-layer-list">
                                            {group.map(l => (
                                                <div key={l.id} style={{ marginBottom: '8px' }}>
                                                    <div
                                                        onClick={() => {
                                                            setActiveLayerId(l.id);
                                                            setVisible(prev => ({ ...prev, [`layer-${l.id}`]: true }));
                                                            setOpacities(prev => ({ ...prev, [`layer-${l.id}`]: 1 }));
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            marginBottom: '2px',
                                                            padding: '6px 8px',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            background: activeLayerId === l.id ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
                                                            border: activeLayerId === l.id ? '1px solid rgba(0, 122, 255, 0.2)' : '1px solid transparent'
                                                        }}
                                                    >
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!visible[`layer-${l.id}`]} 
                                                            onChange={() => toggle(`layer-${l.id}`)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ cursor: 'pointer' }}
                                                        /> 
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                                            <span 
                                                                title={l.file_name}
                                                                style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155', fontWeight: 500 }}
                                                            >
                                                                {l.file_name}
                                                            </span>
                                                            {/* No mostrar folder individual ya que ahora es por grupo */}
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setLayerToExport(l);
                                                            }}
                                                            style={{ 
                                                                background: 'none', 
                                                                border: 'none', 
                                                                padding: '4px', 
                                                                color: '#007aff', 
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Descargar capa"
                                                        >
                                                            <i className="fa-solid fa-download" style={{ fontSize: '10px' }}></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                {visible[`layer-${l.id}`] && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '22px' }}>
                                                        <i className="fa-solid fa-circle-half-stroke" style={{ fontSize: '9px', color: '#64748b' }}></i>
                                                        <input 
                                                            type="range" min="0" max="1" step="0.1" 
                                                            value={opacities[`layer-${l.id}`] !== undefined ? opacities[`layer-${l.id}`] : 0.4} 
                                                            onChange={(e) => setOpacity(`layer-${l.id}`, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ width: '100%', height: '4px', cursor: 'pointer' }}
                                                        />
                                                        <span style={{ fontSize: '10px', color: '#475569', fontWeight: 700, minWidth: '34px', textAlign: 'right' }}>
                                                            {Math.round((opacities[`layer-${l.id}`] !== undefined ? opacities[`layer-${l.id}`] : 0.4) * 100)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <button className="ext-back-btn" onClick={onBack} style={{ position: 'absolute', bottom: '30px', left: '30px', pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.95)', color: 'white', borderRadius: '50px', padding: '12px 28px', fontWeight: 'bold', zIndex: 110, border: '2px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                    <i className="fa-solid fa-arrow-left"></i> Volver
                </button>

                {/* LEYENDA DINÁMICA FLOTANTE (DERECHA ABAJO) */}
                {Object.keys(expanded).some(k => k.startsWith('sec-') && expanded[k]) && (
                    <div style={{ position: 'absolute', bottom: '110px', right: '10px', zIndex: 110, background: '#f1f5f9', padding: '12px 18px', borderRadius: '4px', border: '3px solid #000', boxShadow: '0 6px 20px rgba(0,0,0,0.3)', minWidth: '220px', pointerEvents: 'auto', fontFamily: 'Inter, sans-serif' }}>
                        <div style={{ fontWeight: 900, color: '#000', fontSize: 13, textTransform: 'uppercase', textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 10, letterSpacing: '1px' }}>LEYENDA</div>
                        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                            {Object.keys(expanded).filter(k => k.startsWith('sec-') && expanded[k]).map(k => k.replace('sec-', '')).map(tab => {
                                const color = getTabColor(tab);
                                const isGeodinamicaExterna = tab.includes('GEODINAMICAEXTERNA');
                                const isGeoLocal = tab.includes('GEOLOGIA_LOCAL') || tab === 'GEOLOGIA';
                                const isClasMateriales = tab.includes('CLAS_MATERIALES') || tab.includes('CLASIFICACION_MATERIALES');
                                const isGeomorfo = tab.includes('GEOMORFOLOGIA');
                                const sectionLayers = layersByTab[tab] || [];

                                if (isGeodinamicaExterna) {
                                    let legendItems = [];
                                    try {
                                        const selectedLayer =
                                            sectionLayers.find(layer => visible[`layer-${layer.id}`]) ||
                                            sectionLayers[0];
                                        const geoJsonData = selectedLayer
                                            ? (typeof selectedLayer.geojson_data === 'string'
                                                ? JSON.parse(selectedLayer.geojson_data)
                                                : selectedLayer.geojson_data)
                                            : null;
                                        legendItems = getGeodinamicaLegendItems(geoJsonData);
                                    } catch (error) {
                                        console.warn('No se pudo construir leyenda geodinámica derecha:', error);
                                    }

                                    if (!legendItems.length) return null;

                                    return (
                                        <div key={tab} style={{ marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 700, color: '#000', fontSize: 11, marginBottom: 8 }}>Eventos Geodinámicos</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                                {legendItems.map(({ name, color: eventColor }) => (
                                                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span dangerouslySetInnerHTML={{ __html: getGeodinamicaLegendSvg(eventColor) }} />
                                                        <span style={{ fontWeight: 600, color: '#000', fontSize: 11 }}>{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                if (isGeoLocal) {
                                    return (
                                        <div key={tab} style={{ marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 700, color: '#000', fontSize: 11, marginBottom: 8 }}>{'Unidades Litol\u00f3gicas Locales'}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                                {Object.entries(UNIDAD_GEO_STYLES).filter(([key]) => !['Fm. Sandia', 'Dep. Morrenico', 'Cuaternario', 'Ambo', 'Tarma', 'Copacabana', 'Mitu'].includes(key)).map(([name, style]) => (
                                                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div dangerouslySetInnerHTML={{ __html: getLegendSwatch(style, 36, 20) }} />
                                                        <span style={{ fontWeight: 600, color: '#000', fontSize: 11 }}>{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                } else if (isClasMateriales) {
                                    return (
                                        <div key={tab} style={{ marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 700, color: '#000', fontSize: 11, marginBottom: 8 }}>{'Unidades Litol\u00f3gicas Locales'}</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                                {Object.entries(UNIDAD_GEO_STYLES).filter(([key]) => !['Fm. Sandia', 'Dep. Morrenico', 'Cuaternario', 'Ambo', 'Tarma', 'Copacabana', 'Mitu'].includes(key)).map(([name, style]) => (
                                                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div dangerouslySetInnerHTML={{ __html: getLegendSwatch(style, 36, 20) }} />
                                                        <span style={{ fontWeight: 600, color: '#000', fontSize: 11 }}>{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                } else if (isGeomorfo) {
                                    return (
                                        <div key={tab} style={{ marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 700, color: '#000', fontSize: 11, marginBottom: 8 }}>Unidades Geomorfológicas Locales</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                                {Object.entries(UNIDAD_GEOMORFO_STYLES).map(([name, style]) => (
                                                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div dangerouslySetInnerHTML={{ __html: getLegendSwatch(style, 36, 20) }} />
                                                        <span style={{ fontWeight: 600, color: '#000', fontSize: 11 }}>{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                } else if (tab.includes('ESTRUCTURAL')) {
                                    return (
                                        <div key={tab} style={{ marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 700, color: '#000', fontSize: 11, marginBottom: 8 }}>Simbología Estructural</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3 L22 19 L2 19 Z" fill="#ffff00" stroke="#000" stroke-width="1.5"/><circle cx="12" cy="14" r="2.5" fill="#000"/></svg>
                                                    <span style={{ fontWeight: 600, color: '#000', fontSize: 10 }}>Inicio Del Tramo</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 3 L22 19 L2 19 Z" fill="#ffa500" stroke="#000" stroke-width="1.5"/><circle cx="12" cy="14" r="2.5" fill="#000"/></svg>
                                                    <span style={{ fontWeight: 600, color: '#000', fontSize: 10 }}>Fin Del Tramo</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="#000"/></svg>
                                                    <span style={{ fontWeight: 600, color: '#000', fontSize: 10 }}>Progresivas Calzada</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <svg width="20" height="12" viewBox="0 0 24 12"><line x1="0" y1="6" x2="24" y2="6" stroke="#000" stroke-width="4"/><line x1="0" y1="6" x2="24" y2="6" stroke="#fff" stroke-width="2" stroke-dasharray="5,5"/></svg>
                                                    <span style={{ fontWeight: 600, color: '#000', fontSize: 10 }}>Eje de Vía</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00ced1" stroke="#000" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="22" stroke="#000" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="#000" stroke-width="2"/></svg>
                                                    <span style={{ fontWeight: 600, color: '#000', fontSize: 10 }}>Puentes</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="18" stroke="#000" stroke-width="2"/><line x1="7" y1="18" x2="17" y2="18" stroke="#000" stroke-width="2"/></svg>
                                                    <span style={{ fontWeight: 600, color: '#000', fontSize: 10 }}>Buzamientos</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const hasStruct = tab.includes('ESTRUCTURAL');
                                    return (
                                        <div key={tab} style={{ marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 700, color: '#000', fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>{tab.replace(/_/g, ' ')}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {hasStruct ? (
                                                    <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `16px solid ${color}`, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}></div>
                                                ) : (
                                                    <div style={{ width: 14, height: 14, background: color, border: '2px solid white', borderRadius: '50%', boxShadow: `0 0 6px ${color}` }}></div>
                                                )}
                                                <span style={{ fontWeight: 600, color: '#000', fontSize: 11, textTransform: 'capitalize' }}>Elementos de {tab.replace(/_/g, ' ').toLowerCase()}</span>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>
                )}

                {/* SELECTOR DE MAPA BASE (FLOATING) */}
                <div style={{ position: 'absolute', top: '20px', right: '115px', pointerEvents: 'auto', display: 'flex', gap: '5px', background: 'white', padding: '4px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 110 }}>
                    {['satellite', 'terrain', 'streets'].map(m => (
                        <button key={m} onClick={() => setMapBase(m)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: mapBase === m ? '#1e3a8a' : 'transparent', color: mapBase === m ? 'white' : '#64748b', fontSize: '10px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
                            {m === 'satellite' ? 'Satélite' : m === 'terrain' ? 'Relieve' : 'Calles'}
                        </button>
                    ))}
                </div>

                {/* BARRA DE HERRAMIENTAS SUPERIOR CENTRAL */}
                <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', display: 'flex', gap: '8px', zIndex: 110 }}>
                    <div style={{ background: 'white', borderRadius: '50px', padding: '4px 15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-magnifying-glass-location" style={{ color: '#1e3a8a', cursor: 'pointer' }} onClick={handleKmSearch}></i>
                        <input 
                            type="text" 
                            placeholder="Buscar KM (ej. 0+440)" 
                            value={kmSearch} 
                            onChange={(e) => setKmSearch(e.target.value)} 
                            onKeyDown={handleKmSearchInput}
                            style={{ border: 'none', outline: 'none', fontSize: '12px', width: '150px', fontWeight: 600, color: '#1e293b' }}
                        />
                    </div>
                </div>

                <div style={{ position: 'absolute', bottom: '30px', right: '25px', pointerEvents: 'auto', zIndex: 110, display: 'flex', gap: '10px', whiteSpace: 'nowrap' }}>
                    {false && <button
                        onClick={handleOpenDriveFolder}
                        title="Abrir carpeta de Google Drive de Geología"
                        style={{ background: '#f59e0b', color: 'white', borderRadius: '50px', padding: '12px 25px', fontSize: '13px', fontWeight: 800, border: 'none', boxShadow: '0 4px 15px rgba(245,158,11,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <i className="fa-solid fa-folder-open"></i> Carpeta Drive
                    </button>}
                    <button onClick={toggleFullScreen} style={{ background: isFullScreen ? '#1e293b' : 'white', color: isFullScreen ? 'white' : '#1e293b', borderRadius: '50px', padding: '12px 25px', fontSize: '13px', fontWeight: 800, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}>
                        <i className={`fa-solid ${isFullScreen ? 'fa-compress' : 'fa-expand'}`}></i> {isFullScreen ? 'Salir' : 'Pantalla Completa'}
                    </button>
                    <button onClick={() => setShowTechTable(true)} style={{ background: '#007aff', color: 'white', borderRadius: '50px', padding: '12px 25px', fontSize: '13px', fontWeight: 800, border: 'none', boxShadow: '0 4px 15px rgba(0,122,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-table-list"></i> Tablas Técnicas
                    </button>
                    <button onClick={handlePrintReport} style={{ background: '#af52de', color: 'white', borderRadius: '50px', padding: '12px 25px', fontSize: '13px', fontWeight: 800, border: 'none', boxShadow: '0 4px 15px rgba(175,82,222,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-file-pdf"></i> Reporte PDF
                    </button>
                </div>

                {/* MODAL DE TABLAS TÉCNICAS */}
                {showTechTable && (
                    <div className="ext-photo-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', pointerEvents: 'auto' }} onClick={() => setShowTechTable(false)}>
                        <div style={{ width: '1100px', maxWidth: '95%', background: 'white', borderRadius: '15px', overflow: 'hidden', animation: 'scaleUp 0.3s ease-out', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                            <div style={{ background: '#1e3a8a', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <i className="fa-solid fa-table-columns" style={{ fontSize: '18px' }}></i>
                                    <span style={{ fontWeight: 800, letterSpacing: '0.5px' }}>GEOPORTAL: TABLAS TÉCNICAS GEOLOGÍA</span>
                                </div>
                                <button onClick={() => setShowTechTable(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>×</button>
                            </div>
                            
                            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }} className="geol-custom-scrollbar">
                                
                                {/* SECCIÓN 1: CLASIFICACIÓN DE MATERIALES */}
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                                        <i className="fa-solid fa-road" style={{ color: '#007aff' }}></i> CLASIFICACIÓN DE MATERIALES POR PROGRESIVAS
                                    </h3>
                                    {clasificacion.length > 0 ? (
                                        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                                                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                                    <tr>
                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>DESCRIPCIÓN GEOTÉCNICA</th>
                                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>PROG. INICIO</th>
                                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>PROG. FIN</th>
                                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>LONG (m)</th>
                                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>RF (%)</th>
                                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>RS (%)</th>
                                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>MS (%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {clasificacion.map((c, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fcfcfc' }}>
                                                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.descripcion_geotecnica || c.simbolo || '-'}</td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{c.prog_inicio || '0+000'}</td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{c.prog_fin || '-'}</td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{formatZeroAsBlank(c.tramo_m, 2, 'm')}</td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#1e293b', fontWeight: 700 }}>{formatZeroAsBlank(c.pct_roca_fija, 0, '%')}</td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#007aff', fontWeight: 700 }}>{formatZeroAsBlank(c.pct_roca_suelta, 0, '%')}</td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#ff9500', fontWeight: 700 }}>{formatZeroAsBlank(c.pct_material_suelto, 0, '%')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                                            <i className="fa-solid fa-road-barrier" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                                            <p>No hay datos de clasificación de materiales registrados.</p>
                                        </div>
                                    )}
                                </div>

                                {/* SECCIÓN 2: REGISTRO DE MUESTRAS */}
                                <div>
                                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                                        <i className="fa-solid fa-vials" style={{ color: '#af52de' }}></i> REGISTRO DE MUESTRAS DE CAMPO Y GEOTECNIA
                                    </h3>
                                    {muestrasCalculadas.length > 0 ? (
                                        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                                                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                                                    <tr>
                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>CÓDIGO</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>PUNTO / TIPO</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>PROGRESIVA</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>ESTE (X)</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>NORTE (Y)</th>
                                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>COTA (Z)</th>
                                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>FUENTE</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {muestrasCalculadas.map((m, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fcfcfc' }}>
                                                            <td style={{ padding: '8px 10px', fontWeight: 800, color: '#1e293b' }}>{m.codigo}</td>
                                                            <td style={{ padding: '8px 10px', color: '#475569' }}>{m.tipo_roca}</td>
                                                            <td style={{ padding: '8px 10px', color: '#1e3a8a', fontWeight: 700 }}>{m.progresiva}</td>
                                                            <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{m.este || (m.longitud ? m.longitud.toFixed(2) : '-')}</td>
                                                            <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{m.norte || (m.latitud ? m.latitud.toFixed(2) : '-')}</td>
                                                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{m.cota || '-'}</td>
                                                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', background: m.isAuto ? '#f0f9ff' : '#f0fdf4', color: m.isAuto ? '#0369a1' : '#166534', border: `1px solid ${m.isAuto ? '#bae6fd' : '#bbf7d0'}`, fontWeight: 700 }}>
                                                                    {m.isAuto ? 'CAPA MAPA' : 'DB'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                                            <i className="fa-solid fa-vials-slash" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                                            <p>No se detectaron muestras en el proyecto actual.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SIDEBAR DERECHO (ESTADÍSTICAS) */}
                <aside className={`external-sidebar sidebar-right ${rightOpen ? 'active' : ''}`} style={{ position: 'absolute', right: rightOpen ? 0 : -360, top: 0, height: '100%', width: '350px', pointerEvents: 'auto', transition: 'right 0.4s ease-out', zIndex: 120, background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 15px rgba(0,0,0,0.1)' }}>
                    <div className="ext-sidebar-header" style={{ background: '#0f172a', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px' }}><i className="fa-solid fa-chart-pie"></i> ESTADÍSTICAS TÉCNICAS</span>
                        <button onClick={() => setRightOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
                    </div>

                    <div className="ext-panel-content" style={{ overflowY: 'auto', flex: 1, padding: '25px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px' }}>
                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>LONGITUD TOTAL</div>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', marginTop: '5px' }}>{matStats.longTotal.toFixed(2)}m</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>AVANCE TÉCNICO</div>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: '#34c759', marginTop: '5px' }}>{avance}%</div>
                            </div>
                        </div>

                        {matStats.longTotal > 0 && (
                            <div style={{ marginBottom: '30px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', marginBottom: '15px', borderLeft: '4px solid #007aff', paddingLeft: '10px' }}>DISTRIBUCIÓN DE MATERIALES</div>
                                <div style={{ height: '200px' }}><Doughnut data={matChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } } } }} /></div>
                            </div>
                        )}

                        {Object.keys(muestrasPorTipo).length > 0 && (
                            <div style={{ marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', marginBottom: '15px', borderLeft: '4px solid #af52de', paddingLeft: '10px' }}>TIPOS DE MUESTRAS</div>
                                <div style={{ height: '180px' }}><Bar data={muestrasChartData} options={{ maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { ticks: { font: { size: 10, weight: '600' } } } } }} /></div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* MODAL DE IMAGEN AGRANDADA */}
                {selectedPhoto && (
                    <div className="ext-photo-modal" 
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backdropFilter: 'blur(5px)', animation: 'fadeIn 0.3s ease', cursor: 'pointer', pointerEvents: 'auto' }} 
                        onClick={() => setSelectedPhoto(null)}
                        tabIndex={0}
                    >
                        <button onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }} style={{ position: 'absolute', top: '30px', right: '30px', background: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 10 }}>×</button>
                        <img src={selectedPhoto} alt="Zoom" style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', border: '4px solid white', cursor: 'default' }} onClick={(e) => e.stopPropagation()} />
                    </div>
                )}

                {/* MODAL DE DESCARGA */}
                {layerToExport && (
                    <div className="ext-photo-modal" 
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', pointerEvents: 'auto', backdropFilter: 'blur(3px)' }} 
                        onClick={() => setLayerToExport(null)}
                    >
                        <div style={{ width: '350px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                            <div style={{ background: '#af52de', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fa-solid fa-download"></i>
                                    <span style={{ fontWeight: 800 }}>Descargar Capa</span>
                                </div>
                                <button onClick={() => setLayerToExport(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>×</button>
                            </div>
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Seleccione el formato para descargar: <br/><b style={{ color: '#1e3a8a' }}>{layerToExport.file_name}</b></p>
                                <button onClick={handleExportLayerKML} style={{ width: '100%', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '12px', fontWeight: 700, marginBottom: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.background = '#e2e8f0'} onMouseOut={(e) => e.target.style.background = '#f8fafc'}>
                                    <i className="fa-solid fa-file-code" style={{ color: '#007aff' }}></i> Descargar como KML
                                </button>
                                <button onClick={handleExportLayerShapefile} style={{ width: '100%', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.background = '#e2e8f0'} onMouseOut={(e) => e.target.style.background = '#f8fafc'}>
                                    <i className="fa-solid fa-file-zipper" style={{ color: '#10b981' }}></i> Descargar como Shapefile
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`.alertify-notifier { z-index: 200000 !important; }`}</style>
        </div>,
        document.body
    );
};

export default GeologiaExternal;


