import React, { useEffect, useState, useRef } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { MapContainer, TileLayer, LayersControl, useMap, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { fromLatLon, toLatLon } from 'utm';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import * as turf from '@turf/turf';
import alertify from 'alertifyjs'; // Add this line
import { fetchNearbyPlaces } from '../../invvial/map/mapUtils';
import './GeologiaGeoite.css';
import axiosInstance from '../../../../../api/axios';
import { saveAs } from 'file-saver';


// legendColor = color sólido para mostrar en la leyenda (los patrones SVG no funcionan en CSS background de div)
// fill = referencia al patrón SVG para el relleno de polígonos en el mapa Leaflet
const UNIDAD_GEO_STYLES = {
    'Fm. Ananea':            { fill: 'url(#geol-pattern-ananea)',        color: '#8b4513', legendColor: '#fce4b3', legendStroke: '#8b4513', legendPattern: 'ananea' },
    'Fm San gaban':          { fill: 'url(#geol-pattern-sangaban)',       color: '#d4af37', legendColor: '#fffbe6', legendStroke: '#d4af37', legendPattern: 'sangaban' },
    'Dique de Diorita':      { fill: 'url(#geol-pattern-diorite)',        color: '#8b0000', legendColor: '#f7a7a3', legendStroke: '#8b0000', legendPattern: 'diorite' },
    'Deposito Coluvial':     { fill: 'url(#geol-pattern-coluvial)',       color: '#4a4a4a', legendColor: '#a8a8a8', legendStroke: '#333333', legendPattern: 'coluvial' },
    'Deposito Aluvio-Coluvial': { fill: 'url(#geol-pattern-aluvio)',     color: '#666666', legendColor: '#d3d3d3', legendStroke: '#555555', legendPattern: 'aluvio' },
    'Deposito Eluvio-Coluvial': { fill: 'url(#geol-pattern-eluvio)',     color: '#999999', legendColor: '#f0f0f0', legendStroke: '#999999', legendPattern: 'eluvio' },
    'Deposito. Eluvial':     { fill: 'url(#geol-pattern-eluvial-dep)',   color: '#8b4513', legendColor: '#ffff00', legendStroke: '#8b4513', legendPattern: 'eluvial-dep' },
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

// Genera el HTML del swatch SVG para la leyenda (funciona con patrones inline)
const LEGEND_PATTERN_DEFS = `
    <defs>
        <pattern id="lp-ananea" patternUnits="userSpaceOnUse" width="10" height="8">
            <rect width="10" height="8" fill="#fce4b3"/>
            <path d="M 0,2 L 10,2 M 0,6 L 10,6" stroke="#8b4513" stroke-width="1.2"/>
        </pattern>
        <pattern id="lp-sangaban" patternUnits="userSpaceOnUse" width="12" height="8">
            <rect width="12" height="8" fill="#fffbe6"/>
            <path d="M 0,4 L 12,4" stroke="#d4af37" stroke-width="1" stroke-dasharray="3,3"/>
        </pattern>
        <pattern id="lp-diorite" patternUnits="userSpaceOnUse" width="14" height="14">
            <rect width="14" height="14" fill="#f7a7a3"/>
            <path d="M 2,3 L 4,5 L 2,5 Z M 10,10 L 12,12 L 10,12 Z M 7,2 L 8,4 L 6,4 Z" fill="#800000" opacity="0.6"/>
        </pattern>
        <pattern id="lp-coluvial" patternUnits="userSpaceOnUse" width="16" height="16">
            <rect width="16" height="16" fill="#a8a8a8"/>
            <circle cx="4" cy="4" r="2" fill="#4a4a4a" opacity="0.7"/>
            <circle cx="12" cy="12" r="1.5" fill="#333333" opacity="0.6"/>
        </pattern>
        <pattern id="lp-aluvio" patternUnits="userSpaceOnUse" width="14" height="14">
            <rect width="14" height="14" fill="#d3d3d3"/>
            <circle cx="3" cy="3" r="1" fill="#666"/>
            <circle cx="10" cy="5" r="1.5" fill="#555" opacity="0.5"/>
            <circle cx="6" cy="11" r="1" stroke="#444" fill="none"/>
        </pattern>
        <pattern id="lp-eluvio" patternUnits="userSpaceOnUse" width="12" height="12">
            <rect width="12" height="12" fill="#f0f0f0"/>
            <circle cx="4" cy="4" r="1.8" stroke="#999" fill="none" stroke-width="0.8"/>
            <circle cx="9" cy="9" r="1" stroke="#777" fill="none"/>
        </pattern>
        <pattern id="lp-eluvial-dep" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#ffff00"/>
            <circle cx="2" cy="2" r="0.8" fill="#8b4513"/>
            <circle cx="7" cy="5" r="0.6" fill="#8b4513"/>
            <circle cx="4" cy="8" r="0.7" fill="#8b4513"/>
        </pattern>
        <pattern id="lp-colinas" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#e0cba8"/>
            <rect x="2" y="2" width="2" height="2" fill="#8b4513" opacity="0.6"/>
            <rect x="7" y="6" width="2" height="2" fill="#8b4513" opacity="0.6"/>
        </pattern>
        <pattern id="lp-laderas" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#fcdb83"/>
            <rect x="3" y="3" width="2" height="2" fill="#a07020" opacity="0.6"/>
            <rect x="8" y="7" width="2" height="2" fill="#a07020" opacity="0.6"/>
        </pattern>
        <pattern id="lp-montram" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="#fcad81"/>
            <circle cx="2" cy="2" r="1" fill="#000"/>
            <circle cx="6" cy="6" r="1.2" fill="#000"/>
        </pattern>
        <pattern id="lp-quebrada" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#c5f5e3"/>
            <circle cx="3" cy="3" r="1.5" stroke="#000" fill="none" stroke-width="0.8"/>
            <circle cx="8" cy="8" r="1" fill="#000"/>
        </pattern>
        <pattern id="lp-vert-col" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#dbdbdb"/>
            <path d="M2,3 L4,2 L6,3 Z" fill="#000"/>
            <circle cx="8" cy="7" r="1" fill="#000"/>
        </pattern>
    </defs>
`;

const getLegendSwatch = (style, width = 34, height = 20) => {
    const patternId = style.legendPattern ? `lp-${style.legendPattern}` : null;
    const fillRef = patternId ? `url(#${patternId})` : style.legendColor;
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${patternId ? LEGEND_PATTERN_DEFS : ''}
        <rect width="${width}" height="${height}" fill="${fillRef}" stroke="${style.legendStroke || style.color}" stroke-width="1.5" rx="3"/>
    </svg>`;
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

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildGeodinamicaPopupHtml = (eventName, nearbyPhotos) => {
    const safeName = escapeHtml(eventName || 'Evento Geodinamico');

    if (!nearbyPhotos.length) {
        return `
            <div style="font-family:'Inter',sans-serif; padding:14px 16px; min-width:260px; max-width:320px;">
                <div style="margin:0 0 10px 0; color:#1e40af; font-size:14px; font-weight:800; border-bottom:2px solid #3b82f6; padding-bottom:6px; text-transform:uppercase; padding-right:24px;">
                    Eventos Geodinamicos
                </div>
                <div style="font-size:14px; font-weight:700; color:#0f172a; line-height:1.35; margin-bottom:10px;">
                    ${safeName}
                </div>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 12px; color:#64748b; font-size:12px;">
                    Sin fotos cercanas en el panel fotografico dentro de ${PANEL_PHOTO_MATCH_RADIUS_METERS} m.
                </div>
            </div>
        `;
    }

    return `
        <div style="font-family:'Inter',sans-serif; padding:14px 16px; min-width:280px; max-width:360px;">
            <div style="margin:0 0 10px 0; color:#1e40af; font-size:14px; font-weight:800; border-bottom:2px solid #3b82f6; padding-bottom:6px; text-transform:uppercase; padding-right:24px;">
                Eventos Geodinamicos
            </div>
            <div style="font-size:14px; font-weight:700; color:#0f172a; line-height:1.35; margin-bottom:12px;">
                ${safeName}
            </div>
            <div style="font-size:11px; color:#64748b; font-weight:700; margin-bottom:8px; text-transform:uppercase;">
                Fotos cercanas (${nearbyPhotos.length})
            </div>
            <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; max-height:245px; overflow-y:auto; padding-right:2px;">
                ${nearbyPhotos.map((photo) => `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                        <img
                            src="${escapeHtml(photo.image_url)}"
                            alt="${escapeHtml(photo.nombre)}"
                            style="display:block; width:100%; height:82px; object-fit:cover; background:#e2e8f0;"
                        />
                        <div style="padding:7px 8px;">
                            <div style="font-size:11px; font-weight:700; color:#0f172a; line-height:1.2; margin-bottom:4px; max-height:28px; overflow:hidden;">
                                ${escapeHtml(photo.nombre)}
                            </div>
                            <div style="font-size:10px; color:#64748b; font-weight:600;">
                                ${Math.round(photo.distanceMeters)} m
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

const CANTERAS_MATERIAL_STYLES = [
    { name: 'Cantera De Rocas Igneo', fillColor: '#ffbf3c', color: '#9a6500', icon: 'igneo' },
    { name: 'Cantera De Rocas Igneo-Metamorfico', fillColor: '#e7c7da', color: '#7b5b6d', icon: 'igneo-metamorfico' },
    { name: 'Cantera De Rocas Igneo-Alterado', fillColor: '#ff8c42', color: '#9a3f00', icon: 'igneo-alterado' },
    { name: 'Cantera De Arcilla de Alta Plasticidad', fillColor: '#e6b6b6', color: '#8d6363', icon: 'arcilla' },
    { name: 'Cantera Chahuares - Talud', fillColor: '#e8c8b8', color: '#8c6d5b', icon: 'talud' },
    { name: 'Cantera Chahuares - Cantera Fluvial', fillColor: '#c8ebf8', color: '#5f8090', icon: 'fluvial' }
];

const getCanterasMaterialConfig = (materialName) => {
    const category = getCanterasMaterialCategory(materialName);
    return CANTERAS_MATERIAL_STYLES.find((item) => item.name === category) || CANTERAS_MATERIAL_STYLES[0];
};

const getCanterasMaterialCategory = (materialName) => {
    const normalized = normalizeLegendName(materialName);

    if (!normalized) {
        return 'Cantera De Rocas Igneo';
    }

    if (normalized.includes('arcilla') && normalized.includes('alta plasticidad')) {
        return 'Cantera De Arcilla de Alta Plasticidad';
    }

    if (normalized.includes('chahuares') && normalized.includes('fluvial')) {
        return 'Cantera Chahuares - Cantera Fluvial';
    }

    if (normalized.includes('chahuares') && normalized.includes('talud')) {
        return 'Cantera Chahuares - Talud';
    }

    if (normalized.includes('alterado')) {
        return 'Cantera De Rocas Igneo-Alterado';
    }

    if (normalized === 'cantera de rocas igneo' || normalized.endsWith('rocas igneo')) {
        return 'Cantera De Rocas Igneo';
    }

    if (
        normalized.includes('igneo-metamorfico') ||
        normalized.includes('igneo metamorfico') ||
        normalized.includes('metamorfico')
    ) {
        return 'Cantera De Rocas Igneo-Metamorfico';
    }

    return String(materialName).trim();
};

const getCanterasLegendItems = (geojsonData) => {
    const features = Array.isArray(geojsonData?.features) ? geojsonData.features : [];
    const detected = new Set();

    features.forEach((feature) => {
        const props = feature?.properties || {};
        const material = props['MAT CANTER'] || props.MAT_CANTER || props.mat_canter || props.MATERIAL || props.material;
        if (material) detected.add(getCanterasMaterialCategory(material));
    });

    const orderedDetected = CANTERAS_MATERIAL_STYLES
        .map((item) => item.name)
        .filter((name) => detected.has(name));

    return orderedDetected.length > 0
        ? orderedDetected
        : CANTERAS_MATERIAL_STYLES.map((item) => item.name);
};

const getCanterasMaterialSvg = (materialName) => {
    const config = getCanterasMaterialConfig(materialName);
    const normalized = normalizeLegendName(config.name);

    if (normalized === 'cantera de rocas igneo') {
        return `
            <svg width="34" height="22" viewBox="0 0 34 22">
                <rect x="1.5" y="4" width="31" height="16" rx="2.5" fill="${config.fillColor}" stroke="${config.color}" stroke-width="1.5"/>
                <line x1="12" y1="4" x2="12" y2="11" stroke="#444" stroke-width="1.5"/>
                <line x1="17" y1="4" x2="17" y2="11" stroke="#444" stroke-width="1.5"/>
                <line x1="22" y1="4" x2="22" y2="11" stroke="#444" stroke-width="1.5"/>
            </svg>
        `;
    }

    if (normalized.includes('igneo-metamorfico') || normalized.includes('igneo metamorfico')) {
        return `
            <svg width="34" height="22" viewBox="0 0 34 22">
                <rect x="1.5" y="4" width="31" height="16" rx="2.5" fill="${config.fillColor}" stroke="${config.color}" stroke-width="1.5"/>
                <line x1="8" y1="4" x2="8" y2="11" stroke="#444" stroke-width="1.5"/>
                <line x1="26" y1="4" x2="26" y2="11" stroke="#444" stroke-width="1.5"/>
            </svg>
        `;
    }

    if (normalized.includes('igneo-alterado') || normalized.includes('igneo alterado')) {
        return `
            <svg width="34" height="22" viewBox="0 0 34 22">
                <rect x="1.5" y="4" width="31" height="16" rx="2.5" fill="${config.fillColor}" stroke="${config.color}" stroke-width="1.5"/>
                <line x1="12" y1="4" x2="12" y2="11" stroke="#444" stroke-width="1.5"/>
                <line x1="17" y1="4" x2="17" y2="11" stroke="#444" stroke-width="1.5"/>
                <line x1="22" y1="4" x2="22" y2="11" stroke="#444" stroke-width="1.5"/>
            </svg>
        `;
    }

    if (normalized.includes('arcilla de alta plasticidad')) {
        return `
            <svg width="34" height="22" viewBox="0 0 34 22">
                <rect x="1.5" y="4" width="31" height="16" rx="2.5" fill="${config.fillColor}" stroke="${config.color}" stroke-width="1.5"/>
                <line x1="6" y1="12" x2="17" y2="12" stroke="#444" stroke-width="1.5"/>
                <line x1="17" y1="8" x2="28" y2="8" stroke="#444" stroke-width="1.5"/>
            </svg>
        `;
    }

    if (normalized.includes('chahuares') && normalized.includes('talud')) {
        return `
            <svg width="34" height="22" viewBox="0 0 34 22">
                <rect x="1.5" y="4" width="31" height="16" rx="2.5" fill="${config.fillColor}" stroke="${config.color}" stroke-width="1.5"/>
                <circle cx="8" cy="9" r="2" fill="none" stroke="#666" stroke-width="1.2"/>
                <circle cx="15" cy="14" r="2.2" fill="none" stroke="#666" stroke-width="1.2"/>
                <circle cx="23" cy="8" r="1.8" fill="none" stroke="#666" stroke-width="1.2"/>
                <circle cx="28" cy="14" r="2" fill="none" stroke="#666" stroke-width="1.2"/>
            </svg>
        `;
    }

    if (normalized.includes('chahuares') && normalized.includes('fluvial')) {
        return `
            <svg width="34" height="22" viewBox="0 0 34 22">
                <rect x="1.5" y="4" width="31" height="16" rx="2.5" fill="${config.fillColor}" stroke="${config.color}" stroke-width="1.5"/>
                <circle cx="7" cy="15" r="2.4" fill="none" stroke="#666" stroke-width="1.1"/>
                <circle cx="13" cy="8" r="1.9" fill="none" stroke="#666" stroke-width="1.1"/>
                <circle cx="22" cy="15" r="2.2" fill="none" stroke="#666" stroke-width="1.1"/>
                <circle cx="27" cy="8" r="2" fill="none" stroke="#666" stroke-width="1.1"/>
            </svg>
        `;
    }

    return `
        <svg width="34" height="22" viewBox="0 0 34 22">
            <rect x="1.5" y="4" width="31" height="16" rx="2.5" fill="${config.fillColor}" stroke="${config.color}" stroke-width="1.5"/>
        </svg>
    `;
};

const getCanterasMaterialStyle = (materialName) => {
    const config = getCanterasMaterialConfig(materialName);
    const normalized = normalizeLegendName(config.name);

    if (normalized === 'cantera de rocas igneo') {
        return {
            color: config.color,
            weight: 3,
            opacity: 1,
            fillColor: config.fillColor,
            fillOpacity: 0.85
        };
    }

    if (normalized.includes('igneo-metamorfico') || normalized.includes('igneo metamorfico')) {
        return {
            color: config.color,
            weight: 3,
            opacity: 1,
            fillColor: config.fillColor,
            fillOpacity: 0.85
        };
    }

    if (normalized.includes('igneo-alterado') || normalized.includes('igneo alterado')) {
        return {
            color: config.color,
            weight: 3,
            opacity: 1,
            fillColor: config.fillColor,
            fillOpacity: 0.85
        };
    }

    if (normalized.includes('arcilla de alta plasticidad')) {
        return {
            color: config.color,
            weight: 3,
            opacity: 1,
            fillColor: config.fillColor,
            fillOpacity: 0.85
        };
    }

    if (normalized.includes('chahuares') && normalized.includes('talud')) {
        return {
            color: config.color,
            weight: 3,
            opacity: 1,
            fillColor: config.fillColor,
            fillOpacity: 0.85
        };
    }

    if (normalized.includes('chahuares') && normalized.includes('fluvial')) {
        return {
            color: config.color,
            weight: 3,
            opacity: 1,
            fillColor: config.fillColor,
            fillOpacity: 0.85
        };
    }

    return {
        color: config.color,
        weight: 3,
        opacity: 1,
        fillColor: config.fillColor,
        fillOpacity: 0.85
    };
};

// Este componente encapsula TODA la lógica imperativa para no causar re-renders.
const MapLogic = ({ tabName, projectId, section, geologiaCapaUrl, geologiaGeojsonData, initialRoute, onTramoSelect, highlightedTramoId, mapData, onElementoClick, onRouteLoaded, onShowDetails, graphicsImages, activeLayersFilter, focusedFeature }) => {
    const map = useMap();
    const geoJsonLayerRef = React.useRef(null);
    const poiLayerRef = React.useRef(new L.FeatureGroup());
    const geologiaKmlLayerRef = React.useRef(new L.FeatureGroup()); // NEW: FeatureGroup para POIs (Start/End/Cities)
    const citiesLayerRef = React.useRef(new L.FeatureGroup()); // NEW: Cities only
    const mapDataLayerRef = React.useRef(new L.FeatureGroup()); // FeatureGroup para alcantarillas
    const [calibrationData, setCalibrationData] = useState(null); // NEW: State for calibration
    const calibrationDataRef = useRef(null); // NEW: Ref to avoid stale closures
    const [activePopup, setActivePopup] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null); // State for lightbox preview
    const [panelPhotos, setPanelPhotos] = useState([]);
    const [showCities, setShowCities] = useState(true); // Toggle state for cities
    const showCitiesRef = useRef(true); // NEW: Ref to avoid stale closures in listeners
    showCitiesRef.current = showCities; // Always sync with state

    // NEW: refs to avoid stale closures for project/section
    const projectIdRef = useRef(projectId);
    const sectionRef = useRef(section);
    useEffect(() => {
        projectIdRef.current = projectId;
        sectionRef.current = section;
    }, [projectId, section]);

    // NEW: Refs for dynamic loading moved to top level
    // Map<Key, { marker: L.Marker, type: string }>
    const allDynamicCitiesRef = useRef(new Map());
    const debounceTimerRef = useRef(null);

    const popupContainer = React.useMemo(() => {
        const div = document.createElement('div');
        div.className = "leaflet-popup-content-wrapper-react";
        return div;
    }, []);

    useEffect(() => {
        let cancelled = false;

        const propPhotos = Array.isArray(graphicsImages)
            ? graphicsImages.map(normalizePanelPhoto).filter(Boolean)
            : [];

        if (propPhotos.length > 0) {
            setPanelPhotos(propPhotos);
            return undefined;
        }

        if (!projectId) {
            setPanelPhotos([]);
            return undefined;
        }

        const fetchPanelPhotos = async () => {
            try {
                const response = await axiosInstance.get(`/api/proyectos/${projectId}/panel-fotografico`);
                if (cancelled) return;
                const fetchedPhotos = Array.isArray(response.data?.fotos)
                    ? response.data.fotos.map(normalizePanelPhoto).filter(Boolean)
                    : [];
                setPanelPhotos(fetchedPhotos);
            } catch (error) {
                if (!cancelled) {
                    console.error('[GeologiaGeoite] Error cargando fotos cercanas del panel fotográfico:', error);
                    setPanelPhotos([]);
                }
            }
        };

        fetchPanelPhotos();

        return () => {
            cancelled = true;
        };
    }, [projectId, graphicsImages]);

    // NEW: ResizeObserver para manejar correctamente el redimensionamiento del layout (Focus Mode)
    useEffect(() => {
        if (!map) return;
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(map.getContainer());
        return () => resizeObserver.disconnect();
    }, [map]);

    // --- GESTOR DE CAPAS SHAPEFILES ---
    const [availableLayers, setAvailableLayers] = useState([]); // Lista de nombres de archivos .shp
    const [visibleLayers, setVisibleLayers] = useState({}); // { 'nombre_capa': true/false }
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
    const shpLayersGroupRef = useRef(new L.LayerGroup());
    const leafletLayerMapRef = useRef(new Map()); // Lookup rápido por _geol_id

    // Sincronizar capas disponibles cuando cambian los datos GeoJSON
    useEffect(() => {
        if (!geologiaGeojsonData) {
            setAvailableLayers([]);
            setVisibleLayers({});
            return;
        }
        let data = geologiaGeojsonData;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { return; }
        }

        const layers = new Set();
        if (data.features) {
            data.features.forEach(f => {
                const layerName = f.properties?._layer_name || 'Otros';
                layers.add(layerName);
            });
        }
        const layerList = Array.from(layers);
        setAvailableLayers(layerList);

        // Inicializar visibilidad (todas encendidas por defecto)
        const visibility = {};
        layerList.forEach(l => visibility[l] = true);
        setVisibleLayers(visibility);
    }, [geologiaGeojsonData]);

    const prevGeoJsonDataStrRef = useRef(null);
    const userNavigatingRef = useRef(false); // Flag: bloquea autofit mientras el usuario navega por selecciones
    const userNavTimeoutRef = useRef(null);
    // --- RE-RENDERIZAR CAPAS CUANDO CAMBIA VISIBILIDAD ---
    const handleHighlightLayer = (layer) => {
        if (!layer || !map) return;

        // Marcar que el usuario está navegando activamente — bloquea el autofit por 3s
        if (userNavTimeoutRef.current) clearTimeout(userNavTimeoutRef.current);
        userNavigatingRef.current = true;
        userNavTimeoutRef.current = setTimeout(() => {
            userNavigatingRef.current = false;
        }, 3000);

        try {
            // 1. Centrar mapa y Zoom
            const bounds = layer.getBounds ? layer.getBounds() : L.latLngBounds([layer.getLatLng()]);
            if (bounds.isValid()) {
                if (layer.getLatLng) {
                    // Para puntos: desplazamos el centro hacia el norte para que el punto
                    // quede en la parte baja del viewport y el popup (que abre hacia arriba)
                    // tenga espacio suficiente para mostrarse completo
                    const center = bounds.getCenter();
                    const offsetLat = center.lat + 0.0015; // Centro ~160m al norte → punto queda abajo
                    map.setView([offsetLat, center.lng], 17, { animate: true });
                } else {
                    map.fitBounds(bounds, { padding: [80, 130, 80, 80], maxZoom: 17, animate: true });
                }
            }

            // 2. Abrir Popup (explícito para evitar que se pierda)
            setTimeout(() => {
                if (layer.openPopup) layer.openPopup();
            }, 300);

            // 3. Efecto visual de resaltado (flash dorado)
            const originalStyle = layer.options.style ? layer.options.style(layer.feature) : null;
            
            if (layer.setStyle) {
                // Para Polígonos y Líneas
                layer.setStyle({ color: '#fbbf24', weight: 8, opacity: 1, fillOpacity: 0.8 });
                setTimeout(() => {
                    if (layer.setStyle) {
                        // Restauramos solo si el estilo original existe o es válido
                        layer.setStyle(originalStyle || { weight: 3, opacity: 0.8 });
                    }
                }, 2500);
            } else if (layer.getElement) {
                // Para Marcadores (Puntos)
                const el = layer.getElement();
                if (el) {
                    const originalTransition = el.style.transition;
                    el.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    el.style.transform = `${el.style.transform} scale(1.8)`;
                    el.style.filter = 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))';
                    setTimeout(() => {
                        if (el.style) {
                            el.style.transform = el.style.transform.replace(' scale(1.8)', '');
                            el.style.filter = '';
                            el.style.transition = originalTransition;
                        }
                    }, 2500);
                }
            }
        } catch (error) {
            console.error("[GeologiaGeoite] Error highlighting layer:", error);
        }
    };

    useEffect(() => {
        if (!map || !geologiaGeojsonData) return;

        shpLayersGroupRef.current.clearLayers();
        leafletLayerMapRef.current.clear(); // Limpiar el índice de capas sincronizado
        // shpLayersGroupRef ahora se agrega directamente al mapa en la inicialización
        // para evitar que se borre cuando se limpia geologiaKmlLayerRef.current

        let data = geologiaGeojsonData;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { return; }
        }



        const getLayerStyle = (f) => {
            const props = f?.properties || {};
            const nativeColor = props.stroke || props.fill || null;
            const layerName = (props._layer_name || 'otros').toLowerCase();
            const isGeotecniaCanteras = tabName?.toLowerCase().includes('geotecnia_canteras');
            const canteraMaterial = props['MAT CANTER'] || props.MAT_CANTER || props.mat_canter || props.MATERIAL || props.material;

            if (isGeotecniaCanteras && canteraMaterial) {
                return getCanterasMaterialStyle(canteraMaterial);
            }

            // 1. Verificar si tiene la propiedad UNIDAD GEO y mapear usando nuestro diccionario de estilos
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

                const geomorfoKey = Object.keys(UNIDAD_GEOMORFO_STYLES).find(k => unidadStr.includes(k.toLowerCase()));
                if (geomorfoKey) {
                    const style = UNIDAD_GEOMORFO_STYLES[geomorfoKey];
                    return {
                        color: style.color,
                        weight: 2,
                        opacity: 0.9,
                        fillColor: style.fill,
                        fillOpacity: 0.85
                    };
                }
            }

            // 2. Si el KMZ ya trae su propio color (polígonos dibujados por el usuario, líneas con estilo), lo respetamos
            if (nativeColor) {
                return {
                    color: nativeColor,
                    weight: Math.max(5, (props['stroke-width'] || 2) * 1.5),
                    opacity: props['stroke-opacity'] || 1.0,
                    fillColor: props.fill || nativeColor,
                    fillOpacity: Math.max(0.45, props['fill-opacity'] || 0.45)
                };
            }

            // 3. Si no trae color (Puntos sueltos sin estilo GE o fallas por defecto sin estilo GE)
            if (layerName.includes('falla') || layerName.includes('fault') || layerName.includes('estructur') || layerName.includes('lineam')) {
                return { color: '#8B0000', weight: 4, opacity: 0.9, dashArray: '8, 4' };
            }
            if (layerName.includes('pliegue')) {
                return { color: '#000080', weight: 4.5, opacity: 0.8 };
            }
            return { color: '#D2691E', weight: 3, opacity: 0.8 };
        };

        const layerList = Object.keys(visibleLayers).filter(name => visibleLayers[name]);

        // Inyectar IDs para vinculación con el dashboard
        if (data && data.features) {
            data.features.forEach((f, idx) => {
                if (!f._geol_id) f._geol_id = `geol_${idx}`;
            });
        }

        if (layerList.length > 0) {
            let filteredFeatures = data.features.filter(f => {
                const layerName = f.properties?._layer_name || 'Otros';
                return visibleLayers[layerName];
            });

            // Apply dashboard activeLayersFilter if provided
            if (activeLayersFilter && activeLayersFilter.length > 0) {
                const normalize = (str) => {
                    if (!str) return "";
                    return String(str)
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                        .replace(/[^a-zA-Z0-9\s]/g, ' ') // Solo alfanuméricos y espacios
                        .replace(/\s+/g, ' ')            // Colapsar espacios
                        .toUpperCase()
                        .trim();
                };

                const upperActiveFilters = activeLayersFilter.map(f => normalize(f));
                
                filteredFeatures = filteredFeatures.filter(f => {
                    const rawName = f.properties?._layer_name || 'Otros';
                    const rawTab = f.properties?._layer_tab || '';
                    
                    const normName = normalize(rawName);
                    const normTab = normalize(rawTab);
                    
                    // Match si el nombre del filtro está contenido en el nombre de la capa o viceversa
                    return upperActiveFilters.some(filter => 
                        normName.includes(filter) || filter.includes(normName) ||
                        normTab.includes(filter) || filter.includes(normTab)
                    );
                });
                console.log(`[Geoite] FILTRADO -> Antes: ${data.features.length} | Después: ${filteredFeatures.length} | Filtros:`, upperActiveFilters);
            }

            const filteredData = {
                ...data,
                features: filteredFeatures
            };

            const counts = {};
            const layersDetected = new Set();
            filteredData.features.forEach(f => {
                const type = f.geometry?.type;
                counts[type] = (counts[type] || 0) + 1;
                if (f.properties?._layer_name) layersDetected.add(f.properties._layer_name);
            });
            console.log(`[Geoite] RESUMEN GEOJSON -> Geometrías:`, counts, `| Capas en lista:`, Array.from(layersDetected));
            if (data.warnings && data.warnings.length > 0) {
                console.warn(`[Geoite] ⚠️ ADVERTENCIAS DEL SERVIDOR:`, data.warnings);
                data.warnings.forEach(w => alertify.warning(w, 5));
            }

            const geojsonLayer = L.geoJSON(filteredData, {
                style: getLayerStyle,
                pointToLayer: (f, latlng) => {
                    const props = f.properties || {};

                    const markerColor = props['marker-color'] || props.fill || props.stroke || null;
                    const layerName = (props._layer_name || '').toLowerCase();
                    const isGeodinamicaExterna = tabName?.toLowerCase().includes('geodinamicaexterna');
                    const isGeotecniaCanteras = tabName?.toLowerCase().includes('geotecnia_canteras');
                    const eventName = props.NAME || props.Name || props.name || props.NOMBRE || props.Nombre || props.nombre;
                    const canteraMaterial = props['MAT CANTER'] || props.MAT_CANTER || props.mat_canter || props.MATERIAL || props.material;
                    const geodinamicaStyle = isGeodinamicaExterna ? getGeodinamicaEventStyle(eventName) : null;
                    const canterasStyle = isGeotecniaCanteras && canteraMaterial ? getCanterasMaterialStyle(canteraMaterial) : null;

                    if (!markerColor && (layerName.includes('rumbo') || layerName.includes('buz'))) {
                        return L.marker(latlng, {
                            icon: L.divIcon({
                                className: 'shp-point-rumbo',
                                html: `
                                    <div style="
                                        width: 0; height: 0; 
                                        border-left: 8px solid transparent; border-right: 8px solid transparent;
                                        border-top: 14px solid #2C3E50;
                                        filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.5));
                                    "></div>
                                `,
                                iconSize: [16, 14],
                                iconAnchor: [8, 7]
                            }),
                            zIndexOffset: 1000
                        });
                    }

                    if (geodinamicaStyle) {
                        return L.marker(latlng, {
                            icon: L.divIcon({
                                className: 'shp-point-geodinamica',
                                html: getGeodinamicaLegendSvg(geodinamicaStyle.color),
                                iconSize: [22, 22],
                                iconAnchor: [11, 11]
                            }),
                            zIndexOffset: 1100
                        });
                    }

                    if (canterasStyle) {
                        return L.marker(latlng, {
                            icon: L.divIcon({
                                className: 'shp-point-cantera',
                                html: `
                                    <div style="
                                        width: 18px; height: 18px;
                                        background-color: ${canterasStyle.fillColor};
                                        border: 2px solid ${canterasStyle.color};
                                        border-radius: 4px;
                                        box-shadow: 0 0 0 2px rgba(255,255,255,0.9), 0 2px 5px rgba(0,0,0,0.35);
                                    "></div>
                                `,
                                iconSize: [18, 18],
                                iconAnchor: [9, 9]
                            }),
                            zIndexOffset: 1100
                        });
                    }

                    // Por defecto, dibujar un marcador circular destacado usando el color que tenga el KMZ
                    const finalColor = markerColor || '#E74C3C'; // Rojo tomate como fallback

                    return L.marker(latlng, {
                        icon: L.divIcon({
                            className: 'shp-point-colored',
                            html: `
                                <div style="
                                    width: 20px; height: 20px;
                                    background-color: ${finalColor};
                                    border: 3px solid white;
                                    border-radius: 50%;
                                    box-shadow: 0 0 0 2px rgba(0,0,0,0.8), 0 3px 6px rgba(0,0,0,0.6);
                                    position: relative;
                                ">
                                    <div style="
                                        width: 5px; height: 5px;
                                        background-color: black;
                                        border-radius: 50%;
                                        position: absolute;
                                        top: 50%; left: 50%;
                                        transform: translate(-50%, -50%);
                                    "></div>
                                </div>
                            `,
                            iconSize: [26, 26],
                            iconAnchor: [13, 13]
                        }),
                        zIndexOffset: 1000
                    });
                },
                onEachFeature: (feature, layer) => {
                    // Vincular ID para búsqueda desde dashboard y registrar en el índice
                    layer._geol_id = feature._geol_id;
                    if (feature._geol_id) {
                        leafletLayerMapRef.current.set(feature._geol_id, layer);
                    }

                    // NUEVO: Zoom y Resaltado al hacer clic directo en el mapa
                    layer.on('click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        handleHighlightLayer(layer);
                    });

                    if (feature.properties) {
                        const props = feature.properties;
                        const layerName = (props._layer_name || 'Capa').replace(/_/g, ' ');
                        const isGeodinamicaExterna = tabName?.toLowerCase().includes('geodinamicaexterna');
                        const eventName = props.NAME || props.Name || props.name || props.NOMBRE || props.Nombre || props.nombre;
                        const featureCoordinates = feature.geometry?.type === 'Point'
                            ? feature.geometry.coordinates
                            : null;

                        if (isGeodinamicaExterna && Array.isArray(featureCoordinates) && featureCoordinates.length >= 2) {
                            const pointLng = parseFloat(featureCoordinates[0]);
                            const pointLat = parseFloat(featureCoordinates[1]);
                            const nearbyPhotos = getNearbyPanelPhotos(pointLat, pointLng, panelPhotos);
                            const geodinamicaPopupHtml = buildGeodinamicaPopupHtml(eventName, nearbyPhotos);

                            layer.bindPopup(geodinamicaPopupHtml, {
                                className: 'geolpopup-main-container',
                                maxWidth: 380,
                                minWidth: 280,
                                autoPan: false
                            });

                            if (eventName) {
                                layer.bindTooltip(`<b>${escapeHtml(eventName)}</b>`, {
                                    permanent: true,
                                    direction: 'right',
                                    className: 'geol-kmz-tooltip-label',
                                    offset: [14, 0]
                                });
                            }

                            return;
                        }

                        let html = `<div style="font-family:'Inter',sans-serif; padding:14px 16px 12px 16px; max-height:350px; overflow-y:auto; overflow-x:hidden;" class="geolpopup-scrollbar-content">
                            <h4 style="margin:0 0 12px 0; color:#1e40af; font-size:14px; font-weight:700; border-bottom:2px solid #3b82f6; padding-bottom:6px; text-transform:uppercase; padding-right:24px;">${layerName}</h4>
                            <div style="background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; padding:0 10px;" class="geolpopup-inner-wrapper">`;

                        // Campos técnicos a omitir en el popup visual
                        const excludedKeys = [
                            '_LAYER_NAME', 'OBJECTID', 'OBJECTID_1', 'ZONA', 'FECHA', 'UTM_E', 'UTM_N',
                            'LATITUD', 'LONGITUD', 'LAT', 'LON', 'CODHOJA', 'CUADRANTE', 'COMISION', 'TIPO_POG',
                            'GEOLOGO', 'SHAPE_LENG', 'SHAPE_AREA', 'STYLEURL', 'STYLEHASH', 'VISIBILITY',
                            'FILL', 'STROKE', 'MARKER-COLOR', 'STROKE-WIDTH', 'STROKE-OPACITY', 'FILL-OPACITY', 'ICON',
                            'GLOBALID', 'SHAPE', 'ID'
                        ];

                        const propEntries = Object.entries(props).filter(([k, v]) => {
                            const upperK = k.toUpperCase();
                            return !excludedKeys.includes(upperK) && v !== null && v !== undefined && v !== '' && String(v).trim() !== '';
                        });

                        if (propEntries.length === 0) {
                            html += `<div style="font-size:12px;color:#6b7280;font-style:italic;padding:10px 0;">Sin datos adicionales</div>`;
                        } else {
                            html += `<table style="width:100%; border-collapse:collapse; table-layout:fixed;">
                                <tbody>`;
                            
                            propEntries.forEach(([k, v], index) => {
                                const label = k.replace(/_/g, ' ').toUpperCase();
                                const isLast = index === propEntries.length - 1;
                                html += `<tr style="border-bottom:${isLast ? 'none' : '1px solid #f1f5f9'};">
                                    <td style="padding: 8px 0; vertical-align:top; width:90px; overflow:hidden;">
                                        <div style="font-weight:700; color:#64748b; font-size:10px; text-transform:uppercase; letter-spacing:0.4px; line-height:1.2; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" title="${label}">${label}</div>
                                    </td>
                                    <td style="padding: 8px 0 8px 8px; vertical-align:top; text-align:right;">
                                        <div style="color:#0f172a; font-size:12px; word-break:break-word; font-weight:500; line-height:1.3;">${v}</div>
                                    </td>
                                </tr>`;
                            });
                            
                            html += `</tbody></table>`;
                        }
                        html += '</div></div>';
                        layer.bindPopup(html, { className: 'geolpopup-main-container', maxWidth: 300, minWidth: 260, autoPan: false });

                        const hasRealName = props.name && String(props.name).trim().length > 0;
                        const isPoint = feature.geometry && feature.geometry.type === 'Point';
                        const nameEqualsLayer = hasRealName && String(props.name).trim().toLowerCase().replace(/_/g, ' ') === String(props._layer_name || '').trim().toLowerCase().replace(/_/g, ' ');

                        let labelText = null;
                        let isPermanent = isPoint;

                        if (isPoint) {
                            if (hasRealName && !nameEqualsLayer && props.name.toLowerCase() !== 'punto' && props.name.toLowerCase() !== 'ruta sin título') {
                                labelText = props.name;
                            } else {
                                // No usamos label permanente para puntos genéricos para evitar saturación del mapa
                                labelText = layerName;
                                isPermanent = false;
                            }
                        } else {
                            if (hasRealName && !nameEqualsLayer && props.name !== 'Polígono') {
                                labelText = props.name;
                            }
                        }

                        if (labelText) {
                            layer.bindTooltip(`<b>${labelText}</b>`, {
                                permanent: isPermanent,
                                sticky: !isPoint,
                                direction: isPoint ? 'right' : 'auto',
                                className: 'geol-kmz-tooltip-label',
                                offset: isPoint ? [14, 0] : [0, 0]
                            });
                        }
                    }
                }
            });
            shpLayersGroupRef.current.addLayer(geojsonLayer);

            // Auto-focus inteligente: solo si los datos cambian sustancialmente (nueva capa/pestaña)
            try {
                // Identificador único para el conjunto de datos (tab + total features)
                // Esto evita que actualizaciones menores o re-renders por selección disparen el fitBounds general
                const dataId = `${geologiaGeojsonData.features?.length || 0}_${activeLayersFilter?.length || 0}`;
                const currentDataStr = JSON.stringify(geologiaGeojsonData);
                
                if (prevGeoJsonDataStrRef.current !== currentDataStr) {
                    prevGeoJsonDataStrRef.current = currentDataStr;
                    
                    // Solo hacemos fitBounds si el usuario NO está navegando activamente
                    // y si NO hay un elemento siendo enfocado activamente
                    if (!focusedFeature && !userNavigatingRef.current) {
                        const bounds = geojsonLayer.getBounds();
                        if (bounds.isValid()) {
                            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                        }
                    } else {
                        // Si hay focusedFeature, marcamos que ya hemos "visto" estos datos
                        // para que no dispare fitBounds si se limpia focusedFeature después
                    }
                }
            } catch (e) {
                console.error("[GeologiaGeoite] auto-fit error:", e);
            }
        }
    }, [map, geologiaGeojsonData, visibleLayers, activeLayersFilter, panelPhotos, tabName]);

    // --- CENTRAR Y RESALTAR ELEMENTO SELECCIONADO DESDE DASHBOARD ---
    useEffect(() => {
        if (!map || !focusedFeature) return;

        // Lookup directo por ID (O(1), elimina el bug de selección consecutiva)
        const geolId = focusedFeature._geol_id;
        let targetLayer = geolId ? leafletLayerMapRef.current.get(geolId) : null;

        // Fallback: búsqueda por OBJECTID si no se encontró por ID
        if (!targetLayer && focusedFeature.properties?.OBJECTID !== undefined) {
            shpLayersGroupRef.current.eachLayer(mainGroup => {
                if (mainGroup.eachLayer) {
                    mainGroup.eachLayer(layer => {
                        if (!targetLayer && layer.feature?.properties?.OBJECTID === focusedFeature.properties.OBJECTID) {
                            targetLayer = layer;
                        }
                    });
                }
            });
        }

        if (targetLayer) {
            map.closePopup(); // Cerrar cualquier popup previo antes de abrir el nuevo
            handleHighlightLayer(targetLayer);
        }
    }, [map, focusedFeature]);

    // --- RENDER DEL PANEL DE CAPAS ---
    const renderLayerPanel = () => {
        if (!isLayerPanelOpen || availableLayers.length === 0) return null;

        return createPortal(
            <div className="geotech-layer-panel-v2" id="geolmap-menu-capas-geologia">
                <div className="geotech-layer-header">
                    <span><i className="fas fa-layer-group" style={{ color: '#3b82f6', marginRight: '8px' }}></i> Capas de Geología</span>
                    <button onClick={() => setIsLayerPanelOpen(false)} title="Cerrar"><i className="fas fa-times"></i></button>
                </div>
                <div className="geotech-layer-body">
                    {availableLayers.map(layer => (
                        <div key={layer} className="geotech-layer-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!visibleLayers[layer]}
                                    onChange={() => setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
                                />
                                <span title={layer}>{layer.replace(/_/g, ' ')}</span>
                            </label>
                            <div className="layer-color-indicator" style={{
                                backgroundColor: (layer.toLowerCase().includes('falla') || layer.toLowerCase().includes('estruct')) ? '#ef4444' : '#10b981'
                            }}></div>
                        </div>
                    ))}
                </div>
            </div>,
            map.getContainer()
        );
    };

    // --- AGREGAR BOTÓN DE GESTOR AL MAPA (DEPRECATED: Movido a toolbar principal) ---
    /*
    useEffect(() => {
        if (!map || availableLayers.length === 0) return;

        const LGToolbar = L.Control.extend({
            options: { position: 'topright' },
            onAdd: function () {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                const button = L.DomUtil.create('a', 'geolmap-shp-manager-btn', container);
                button.innerHTML = '<i class="fas fa-layer-group"></i>';
                button.title = 'Gestionar capas de Geología';
                button.href = '#';

                L.DomEvent.on(button, 'click', (e) => {
                    L.DomEvent.stop(e);
                    setIsLayerPanelOpen(prev => !prev);
                });

                return container;
            }
        });

        const toolbar = new LGToolbar();
        map.addControl(toolbar);
        return () => map.removeControl(toolbar);
    }, [map, availableLayers]);
    */

    // --- LOAD GEOLOGIA CAPA (Fallback KML) ---
    useEffect(() => {
        if (!map) return;

        // El resto de la lógica de KML permanece igual
        // Ahora permitimos ver ambos simultáneamente (Base KML + GeoJSON de capas)

        if (!geologiaCapaUrl) {
            geologiaKmlLayerRef.current.clearLayers();
            return;
        }

        const loadCapa = async () => {
            try {
                const urlLower = geologiaCapaUrl.toLowerCase();
                // Bloquear que intente renderizar archivos comprimidos a la fuerza si GeoJSON es nulo
                if (urlLower.includes('.rar') || urlLower.includes('.zip') || urlLower.includes('.kmz')) {
                    if (geologiaGeojsonData) {
                        console.log("[Geoite] No procesar KML fallback, ya hay GeoJSON.");
                        return;
                    }
                    console.warn(`[Geoite] Se bloqueó intento de leer comprimido ${geologiaCapaUrl} como texto KML. Por favor vuelva a subir la capa. El GeoJSON es nulo.`);
                    return;
                }

                const res = await axiosInstance.get('/api/proxy?url=' + encodeURIComponent(geologiaCapaUrl), { responseType: 'text' });
                const xmlText = res.data;
                const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
                const geojson = kml(doc);

                geologiaKmlLayerRef.current.clearLayers();

                // --- COLORES POR TRAMO ---
                const TRAMO_PALETTE = [
                    '#e74c3c', // rojo
                    '#3498db', // azul
                    '#2ecc71', // verde
                    '#f39c12', // naranja
                    '#9b59b6', // morado
                    '#1abc9c', // turquesa
                    '#e67e22', // naranja oscuro
                    '#2980b9', // azul oscuro
                    '#27ae60', // verde oscuro
                    '#8e44ad', // morado oscuro
                    '#c0392b', // rojo oscuro
                    '#16a085', // verde azulado
                ];

                // Extraer nombres únicos de tramos
                const tramoNames = [];
                (geojson.features || []).forEach(f => {
                    const name = f.properties?.name || f.properties?.Name || '';
                    if (name && !tramoNames.includes(name)) tramoNames.push(name);
                });
                // Mapear nombre → color
                const tramoColorMap = {};
                tramoNames.forEach((name, idx) => {
                    tramoColorMap[name] = TRAMO_PALETTE[idx % TRAMO_PALETTE.length];
                });

                const geojsonLayer = L.geoJSON(geojson, {
                    style: (feature) => {
                        const name = feature.properties?.name || feature.properties?.Name || '';
                        const color = tramoColorMap[name] || '#95a5a6';
                        return { color, weight: 5, opacity: 0.9 };
                    },
                    onEachFeature: (feature, layer) => {
                        const name = feature.properties?.name || feature.properties?.Name || '';
                        const desc = feature.properties?.description || '';
                        const color = tramoColorMap[name] || '#95a5a6';
                        const popupHtml = `
                            <div style="font-family:'Inter',sans-serif; min-width:160px;">
                                <div style="background:${color}; color:white; padding:6px 10px; border-radius:4px 4px 0 0; font-weight:700; font-size:13px;">
                                    ${name || 'Sin nombre'}
                                </div>
                                ${desc ? `<div style="padding:8px 10px; font-size:12px; color:#333;">${desc}</div>` : ''}
                            </div>`;
                        layer.bindPopup(popupHtml, { className: 'geolint-custom-popup' });
                        if (name) {
                            layer.bindTooltip(`<b>${name}</b>`, {
                                permanent: false, sticky: true,
                                className: 'geol-kmz-tooltip-label'
                            });
                        }
                    }
                });
                geologiaKmlLayerRef.current.addLayer(geojsonLayer);

                // --- MARCADORES DE INICIO Y FIN DEL TRAZADO ---
                // Recolectar todas las coordenadas de líneas en orden
                const allCoords = [];
                (geojson.features || []).forEach(f => {
                    const geom = f.geometry;
                    if (!geom) return;
                    if (geom.type === 'LineString') {
                        allCoords.push(...geom.coordinates);
                    } else if (geom.type === 'MultiLineString') {
                        geom.coordinates.forEach(line => allCoords.push(...line));
                    }
                });

                if (allCoords.length >= 2) {
                    const startCoord = allCoords[0];                    // [lng, lat]
                    const endCoord = allCoords[allCoords.length - 1];   // [lng, lat]

                    const makeRouteEndpointIcon = (type) => L.divIcon({
                        className: '',
                        html: `
                            <div style="
                                position: relative;
                                width: 36px; height: 36px;
                            ">
                                <div style="
                                    width: 36px; height: 36px;
                                    background: ${type === 'start' ? '#16a34a' : '#dc2626'};
                                    border-radius: 50% 50% 50% 0;
                                    transform: rotate(-45deg);
                                    border: 3px solid white;
                                    box-shadow: 0 0 0 2px ${type === 'start' ? '#16a34a' : '#dc2626'}, 0 4px 14px rgba(0,0,0,0.45);
                                    display: flex; align-items: center; justify-content: center;
                                "></div>
                                <div style="
                                    position: absolute; top: 7px; left: 7px;
                                    font-size: 14px;
                                    transform: rotate(0deg);
                                    filter: drop-shadow(0 1px 1px rgba(0,0,0,0.4));
                                ">${type === 'start' ? '🚀' : '🏁'}</div>
                            </div>
                        `,
                        iconSize: [36, 42],
                        iconAnchor: [18, 42],
                        popupAnchor: [0, -44]
                    });

                    // Marcador INICIO
                    const startMarker = L.marker([startCoord[1], startCoord[0]], {
                        icon: makeRouteEndpointIcon('start'),
                        zIndexOffset: 5000
                    }).bindTooltip('<b>📍 Inicio del trazado</b>', { direction: 'top', className: 'geol-kmz-tooltip-label' });

                    // Marcador FIN
                    const endMarker = L.marker([endCoord[1], endCoord[0]], {
                        icon: makeRouteEndpointIcon('end'),
                        zIndexOffset: 5000
                    }).bindTooltip('<b>🏁 Fin del trazado</b>', { direction: 'top', className: 'geol-kmz-tooltip-label' });

                    geologiaKmlLayerRef.current.addLayer(startMarker);
                    geologiaKmlLayerRef.current.addLayer(endMarker);
                }

                // --- NUEVA LEYENDA TÉCNICA: UNIDADES LITOLÓGICAS LOCALES ---
                const existingLegend = document.getElementById('geol-kml-tramos-legend');
                if (existingLegend) existingLegend.remove();

                const GeologyLegend = L.Control.extend({
                    options: { position: 'bottomright' },
                    onAdd: function () {
                        const div = L.DomUtil.create('div', 'leaflet-control');
                        div.id = 'geol-kml-tramos-legend';
                        div.style.cssText = 'background:#f1f5f9;border:3px solid #000;padding:12px 18px;font-family:Inter,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.3);';
                        
                        const isGeomorfo = tabName?.toLowerCase().includes('geomorfologia');
                        const isEstructural = tabName?.toLowerCase().includes('estructural');

                        const isGeodinamicaExterna = tabName?.toLowerCase().includes('geodinamicaexterna');
                        const isGeotecniaCanteras = tabName?.toLowerCase().includes('geotecnia_canteras');

                        if (isEstructural) {
                            
                            div.innerHTML = `
                                <div style="font-weight:900; color:#000; font-size:15px; text-transform:uppercase; text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px; letter-spacing:1px;">Simbología</div>
                                <div style="display:flex; flex-direction:column; gap:8px;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 3 L22 19 L2 19 Z" fill="#ffff00" stroke="#000" stroke-width="1.5"/><circle cx="12" cy="14" r="2.5" fill="#000"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Inicio Del Tramo</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 3 L22 19 L2 19 Z" fill="#ffa500" stroke="#000" stroke-width="1.5"/><circle cx="12" cy="14" r="2.5" fill="#000"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Fin Del Tramo</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="#000"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Progresivas De La Carretera Actual</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="30" height="16" viewBox="0 0 30 16"><path d="M1 10 C6 2, 10 2, 15 10 S24 18, 29 10" fill="none" stroke="#000" stroke-width="1.4"/><path d="M1 10 C6 18, 10 18, 15 10 S24 2, 29 10" fill="none" stroke="#000" stroke-width="1.4" stroke-dasharray="5 3"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Eje De La Carretera Actual</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00c8ff" stroke="#000" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="22" stroke="#000" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="#000" stroke-width="2"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Puentes</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="18" height="22" viewBox="0 0 18 22"><line x1="9" y1="2" x2="9" y2="20" stroke="#000" stroke-width="1.6"/><line x1="9" y1="11" x2="15" y2="11" stroke="#000" stroke-width="1.6"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Buzamientos</span>
                                    </div>
                                </div>
                            `;
                        } else if (isGeodinamicaExterna) {
                            const geodinamicaLegendItems = getGeodinamicaLegendItems(geologiaGeojsonData);
                            div.style.cssText = 'background:#f1f5f9;border:3px solid #000;padding:10px 12px;font-family:Inter,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.3);max-width:360px;';
                            div.innerHTML = `
                                <div style="font-weight:900; color:#000; font-size:13px; text-transform:uppercase; text-align:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px; letter-spacing:0.6px;">LEYENDA</div>
                                <div style="font-weight:700; color:#000; font-size:11px; margin-bottom:10px;">Eventos Geodinamicos</div>
                                <div style="display:flex; flex-direction:column; gap:6px;">
                                    ${geodinamicaLegendItems.map(({ name, color }) => `
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            ${getGeodinamicaLegendSvg(color)}
                                            <span style="font-weight:600; color:#000; font-size:11px; line-height:1.15;">${name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        } else if (isGeotecniaCanteras) {
                            const canterasMaterialItems = getCanterasLegendItems(geologiaGeojsonData);
                            div.style.cssText = 'background:#f1f5f9;border:3px solid #000;padding:10px 12px;font-family:Inter,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.3);max-width:340px;';
                            div.innerHTML = `
                                <div style="font-weight:900; color:#000; font-size:13px; text-transform:uppercase; text-align:center; border-bottom:2px solid #000; padding-bottom:6px; margin-bottom:8px;">LEYENDA</div>
                                <div style="font-weight:700; color:#000; font-size:11px; margin-bottom:10px;">Material De Canteras</div>
                                <div style="display:flex; flex-direction:column; gap:6px;">
                                    ${canterasMaterialItems.map((name) => `
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            ${getCanterasMaterialSvg(name)}
                                            <span style="font-weight:600; color:#000; font-size:11px; line-height:1.15;">${name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        } else if (isGeomorfo) {
                            div.innerHTML = `
                                <div style="font-weight:900; color:#000; font-size:15px; text-transform:uppercase; text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px; letter-spacing:1px;">LEYENDA</div>
                                <div style="font-weight:700; color:#000; font-size:12px; margin-bottom:12px;">Unidades Geomorfológicas Locales</div>
                                <div style="display:flex; flex-direction:column; gap:7px;">
                                    ${Object.entries(UNIDAD_GEOMORFO_STYLES).map(([name, style]) => `
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            ${getLegendSwatch(style, 38, 22)}
                                            <span style="font-weight:600; color:#000; font-size:12px;">${name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        } else if (isEstructural && false) {
                            div.innerHTML = `
                                <div style="font-weight:900; color:#000; font-size:15px; text-transform:uppercase; text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px; letter-spacing:1px;">Simbología</div>
                                <div style="display:flex; flex-direction:column; gap:8px;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 3 L22 19 L2 19 Z" fill="#ffff00" stroke="#000" stroke-width="1.5"/><circle cx="12" cy="14" r="2.5" fill="#000"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Inicio Del Tramo</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 3 L22 19 L2 19 Z" fill="#ffa500" stroke="#000" stroke-width="1.5"/><circle cx="12" cy="14" r="2.5" fill="#000"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Fin Del Tramo</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="#000"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Progresivas De La Carretera Actual</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="12" viewBox="0 0 24 12"><line x1="0" y1="6" x2="24" y2="6" stroke="#000" stroke-width="4"/><line x1="0" y1="6" x2="24" y2="6" stroke="#fff" stroke-width="2" stroke-dasharray="5,5"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Eje De La Carretera Actual</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00ced1" stroke="#000" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="22" stroke="#000" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="#000" stroke-width="2"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Puentes</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <svg width="22" height="22" viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="18" stroke="#000" stroke-width="2"/><line x1="7" y1="18" x2="17" y2="18" stroke="#000" stroke-width="2"/></svg>
                                        <span style="font-weight:600; color:#000; font-size:12px;">Buzamientos</span>
                                    </div>
                                </div>
                            `;
                        } else {
                            div.innerHTML = `
                                <div style="font-weight:900; color:#000; font-size:15px; text-transform:uppercase; text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px; letter-spacing:1px;">LEYENDA</div>
                                <div style="font-weight:700; color:#000; font-size:12px; margin-bottom:12px;">Unidades Litológicas Locales</div>
                                <div style="display:flex; flex-direction:column; gap:7px;">
                                    ${Object.entries(UNIDAD_GEO_STYLES).filter(([key]) => !['Fm. Sandia', 'Dep. Morrenico', 'Cuaternario', 'Ambo', 'Tarma', 'Copacabana', 'Mitu'].includes(key)).map(([name, style]) => `
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            ${getLegendSwatch(style, 38, 22)}
                                            <span style="font-weight:600; color:#000; font-size:12px;">${name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }
                        L.DomEvent.disableClickPropagation(div);
                        return div;
                    }
                });

                if (map && map._loaded && map._controlCorners) {
                    new GeologyLegend().addTo(map);
                }

                const bounds = geojsonLayer.getBounds();
                if (map && map._loaded && bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (err) {
                console.error('Error cargando capa geologica:', err);
            }
        };
        loadCapa();
    }, [map, geologiaCapaUrl, geologiaGeojsonData]);

    useEffect(() => {
        if (!map) return;

        // Check for a flag on the map object itself to prevent re-initialization
        if (map.isInitialized) return;
        map.isInitialized = true;

        let isComponentMounted = true;

        // --- Variables de estado internas ---
        const drawnItems = new L.FeatureGroup().addTo(map);
        poiLayerRef.current.addTo(map);
        geologiaKmlLayerRef.current.addTo(map); // Añadir POIs estáticos al mapa
        shpLayersGroupRef.current.addTo(map); // Añadir grupo de Capas GeoJSON al mapa (independiente)
        // citiesLayerRef managed by zoom logic (citiesLayerRef is defined at top level)
        mapDataLayerRef.current.addTo(map); // Añadir el FeatureGroup de alcantarillas al mapa

        // --- LOGIC FOR ZOOM-DEPENDENT CITIES ---

        // Defined BEFORE usage in handleZoomChange
        const updateVisibleCities = () => {
            if (!map || !showCitiesRef.current) return;

            const zoom = map.getZoom();
            const citiesLayer = citiesLayerRef.current;

            // thresholds (PERMANENT VISIBILITY): 
            // All zoom levels allowed.
            allDynamicCitiesRef.current.forEach((item, key) => {
                const { marker, type } = item;
                // ALWAYS SHOW.
                let shouldShow = true;

                if (shouldShow) {
                    if (!citiesLayer.hasLayer(marker)) {
                        marker.setZIndexOffset(10000); // FORCE TOP VISIBILITY
                        citiesLayer.addLayer(marker);
                    }
                } else {
                    if (citiesLayer.hasLayer(marker)) {
                        citiesLayer.removeLayer(marker);
                    }
                }
            });
        };
        const handleZoomChange = () => {
            const isEnabled = showCitiesRef.current; // Use Ref for latest state

            if (isEnabled) {
                // Ensure layer is on map if any are visible (optimization: always add group, manage children)
                if (!map.hasLayer(citiesLayerRef.current)) {
                    map.addLayer(citiesLayerRef.current);
                }
                // Update which children are visible
                updateVisibleCities();
            } else {
                if (map.hasLayer(citiesLayerRef.current)) {
                    map.removeLayer(citiesLayerRef.current);
                }
            }
        };

        map.on('zoomend', handleZoomChange);
        handleZoomChange(); // Initial check

        // --- DYNAMIC CITY LOADING (SEMANTIC ZOOMING) ---
        // Map<Key, { marker: L.Marker, type: string }>
        // allDynamicCitiesRef is defined at top level
        // debounceTimerRef is defined at top level

        // Function to update visibility based on zoom level and place type
        /* const updateVisibleCities_DUPLICATE = () => {
            if (!map || !showCitiesRef.current) return;
    
            const zoom = map.getZoom();
            const citiesLayer = citiesLayerRef.current;
    
            // thresholds (Extreme visibility for all discovered places): 
            // All types > 5 to ensure they remain visible when zooming out
            allDynamicCitiesRef.current.forEach((item, key) => {
                const { marker, type } = item;
                let shouldShow = false;
                
                // FORCE SHOW for manually added KML points (type === 'city' default)
                // or if zoom is decent (> 5)
                if (type === 'city' || zoom > 5) shouldShow = true;
    
                if (shouldShow) {
                    if (!citiesLayer.hasLayer(marker)) {
                        marker.setZIndexOffset(10000); // FORCE TOP VISIBILITY
                        citiesLayer.addLayer(marker);
                    }
                } else {
                    if (citiesLayer.hasLayer(marker)) {
                        citiesLayer.removeLayer(marker);
                    }
                }
            });
        }; */

        const loadDynamicCities = async () => {
            const zoom = map.getZoom();
            const isEnabled = showCitiesRef.current; // Use Ref for latest state

            if (!isEnabled || zoom <= 3) return; // Fetch if > 3 (Broader visibility)

            const bounds = map.getBounds();

            try {
                const places = await fetchNearbyPlaces(bounds);
                if (places && places.length > 0) {
                    let addedCount = 0;
                    places.forEach(p => {
                        const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
                        if (!allDynamicCitiesRef.current.has(key)) {
                            // console.log("Adding new place:", p.name, p.type); // Debug log

                            const marker = L.marker([p.lat, p.lng], { icon: getPoiIcon('city') })
                                .bindPopup(`<b>${p.name}</b><br><small>Tipo: ${p.type || 'Lugar'}</small>${p.desc ? '<br>' + p.desc : ''}`)
                                .bindTooltip(p.name, { permanent: true, direction: 'right', className: 'poi-tooltip', offset: [10, 0] });

                            // Store in Map, don't add to layer yet (let updateVisibleCities handle it)
                            allDynamicCitiesRef.current.set(key, { marker, type: p.type });

                            addedCount++;
                        }
                    });

                    if (addedCount > 0) {
                        updateVisibleCities(); // Update visibility for new markers
                    }
                }
            } catch (e) {
                console.warn("Dynamic city load failed", e);
            }
        };

        const handleMoveEnd = () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                loadDynamicCities();
            }, 2000); // 2 seconds debounce
        };

        map.on('moveend', handleMoveEnd);

        // --- TOGGLE BUTTON UI ---
        const toggleContainer = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        toggleContainer.style.backgroundColor = showCities ? 'white' : '#eee';
        toggleContainer.style.padding = '5px';
        toggleContainer.style.cursor = 'pointer';
        toggleContainer.title = 'Mostrar/Ocultar Ciudades (Auto)';
        toggleContainer.innerHTML = `<i class="fa-solid fa-city" style="font-size:16px; color:${showCities ? '#333' : '#aaa'};"></i>`;

        const toggleControl = new L.Control({ position: 'topright' });
        toggleControl.onAdd = function () { return toggleContainer; };
        toggleControl.addTo(map);

        toggleContainer.onclick = () => {
            const newState = !showCitiesRef.current;
            showCitiesRef.current = newState; // Immediate Ref update
            setShowCities(newState); // State update for React (eventual consistency)

            // Imperative UI Update
            toggleContainer.style.backgroundColor = newState ? 'white' : '#eee';
            toggleContainer.querySelector('i').style.color = newState ? '#333' : '#aaa';

            // Immediate Map Layer Update
            if (newState) {
                if (!map.hasLayer(citiesLayerRef.current)) {
                    map.addLayer(citiesLayerRef.current);
                }
                loadDynamicCities(); // Fetch data immediately if needed
                updateVisibleCities();
            } else {
                if (map.hasLayer(citiesLayerRef.current)) {
                    map.removeLayer(citiesLayerRef.current);
                }
            }
        };


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
        const measureModal = L.DomUtil.create('div', 'geolmap-flyout-card-v2 geolmap-card-blue', map.getContainer());
        measureModal.id = "geolmap-menu-medir";
        L.DomEvent.disableClickPropagation(measureModal);

        measureModal.innerHTML = `
            <div class="geolmap-card-header geolmap-header-blue">
                <span>Mediciones</span>
                <i class="fas fa-times" style="cursor:pointer"></i>
            </div>
            <div class="geolmap-card-body">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <button class="geolmap-btn-block" id="geolmap-distanceButton"><i class="fas fa-ruler"></i> Distancia</button>
                    <button class="geolmap-btn-block" id="geolmap-areaButton"><i class="fas fa-draw-polygon"></i> Área</button>
                    <button class="geolmap-btn-block" id="geolmap-clearMeasureButton"><i class="fas fa-trash"></i> Limpiar</button>
                </div>
                <div id="geolmap-distanceDisplay" style="margin-bottom: 10px; font-weight: bold;">Seleccione una herramienta.</div>
                <label style="font-size:12px; font-weight:bold; color:#666;">Ubicar Progresiva:</label>
                <div class="geolmap-input-flex">
                    <input type="text" id="geolmap-progresivaInput" placeholder="Km 4+780">
                    <button id="geolmap-ubicarProgresivaBtn">Ir</button>
                </div>
            </div>
        `;

        const distanceDisplay = measureModal.querySelector('#geolmap-distanceDisplay');


        // --- Lógica para Ubicar Progresiva ---
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
            const progresivaInput = document.getElementById('geolmap-progresivaInput');
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

            // Filtrar capas que tienen la propiedad "name" (tramos)
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

        measureModal.querySelector('#geolmap-ubicarProgresivaBtn').onclick = handleUbicarProgresiva;


        // --- Lógica del Modal de Dibujo ---
        const drawModal = L.DomUtil.create('div', 'geolmap-flyout-card-v2 geolmap-card-orange', map.getContainer());
        drawModal.id = "geolmap-menu-dibujo";
        drawModal.style.width = '340px'; // Reducido para que no se salga del mapa
        L.DomEvent.disableClickPropagation(drawModal);

        drawModal.innerHTML = `
            <div class="geolmap-card-header geolmap-header-orange">
                <span>Herramientas de Dibujo</span>
                <i class="fas fa-times" style="cursor:pointer"></i>
            </div>
            <div class="geolmap-card-body">
                <div class="geolmap-input-group">
                    <label for="geolmap-inputTypeSelect">Tipo de Entrada:</label>
                    <select id="geolmap-inputTypeSelect" class="geolmap-form-select">
                        <option value="coordinates">Coordenadas</option>
                        <option value="kml">KML</option>
                    </select>
                </div>

                <div id="geolmap-coordinateInputSection"> 
                    <div class="geolmap-input-group">
                        <label for="geolmap-projectionSelect">Proyección:</label>
                        <select id="geolmap-projectionSelect" class="geolmap-form-select">
                            <option value="geographic">Geográficas</option>
                            <option value="utm" selected>UTM</option>
                        </select>
                    </div>
                    <div class="geolmap-input-group" id="geolmap-utmZoneGroup" style="display: none;">
                        <label for="geolmap-utmZoneSelect">Zona:</label>
                        <select id="geolmap-utmZoneSelect" class="geolmap-form-select">
                            <option value="17">ZONA 17</option>
                            <option value="18" selected>ZONA 18</option>
                            <option value="19">ZONA 19</option>
                        </select>
                    </div>
                    <div id="geolmap-geographicCoordInputs"> 
                        <div class="geolmap-input-group">
                             <label for="geolmap-coordFormatSelect">Formato:</label>
                             <select id="geolmap-coordFormatSelect" class="geolmap-form-select">
                                <option value="decimal">Decimal</option>
                                <option value="degrees">Grados (GMS)</option>
                            </select>
                        </div>
                        <div id="geolmap-decimalInputs">
                           <div class="geolmap-input-flex"><input type="text" id="geolmap-lonDecimal" class="geolmap-form-input" placeholder="Longitud"/><input type="text" id="geolmap-latDecimal" class="geolmap-form-input" placeholder="Latitud"/></div>
                        </div>
                        <div id="geolmap-degreesInputs" style="display: none;">
                            <div class="geolmap-input-flex">
                                <input type="text" id="geolmap-lonDeg" placeholder="G" class="geolmap-gms-input"/>
                                <input type="text" id="geolmap-lonMin" placeholder="M" class="geolmap-gms-input"/>
                                <input type="text" id="geolmap-lonSec" placeholder="S" class="geolmap-gms-input"/>
                            </div>
                             <div class="geolmap-input-flex">
                                <input type="text" id="geolmap-latDeg" placeholder="G" class="geolmap-gms-input"/>
                                <input type="text" id="geolmap-latMin" placeholder="M" class="geolmap-gms-input"/>
                                <input type="text" id="geolmap-latSec" placeholder="S" class="geolmap-gms-input"/>
                            </div>
                        </div>
                    </div>
                    <div id="geolmap-utmCoordInputs" style="display: none;">
                        <div class="geolmap-input-flex"><input type="text" id="geolmap-utmX" class="geolmap-form-input" placeholder="Latitud"/><input type="text" id="geolmap-utmY" class="geolmap-form-input" placeholder="Longitud"/></div>
                    </div>
                </div> 

                <div id="geolmap-kmlInputs" style="display: none; margin-top: 10px;">
                    <input type="file" id="geolmap-kmlFileInput" accept=".kml" class="geolmap-btn-block"/>
                    <button id="geolmap-processKmlBtn" class="geolmap-btn-primary">PROCESAR KML</button>
                </div>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button id="geolmap-drawPointBtn" class="geolmap-btn-primary">DIBUJAR</button>
                    <button id="geolmap-clearCoordsBtn" class="geolmap-btn-secondary">LIMPIAR</button>
                </div>
            </div>
        `;

        // --- Lógica del Modal de Descarga ---
        const downloadModal = L.DomUtil.create('div', 'geolmap-flyout-card-v2 geolmap-card-purple', map.getContainer());
        downloadModal.id = 'geolmap-menu-kml-descarga';
        L.DomEvent.disableClickPropagation(downloadModal);


        const extractStylesForExport = (featureGroup) => {
            const features = [];
            if (!featureGroup) return features;
            
            featureGroup.eachLayer(layer => {
                if (layer.toGeoJSON) {
                    const geojson = layer.toGeoJSON();
                    
                    const processFeature = (f, l) => {
                        f.properties = f.properties || {};
                        // Ensure it has a name for tokml
                        if (!f.properties.nombre && !f.properties.name) {
                            f.properties.nombre = f.properties._layer_name || f.properties.layer || 'Elemento';
                        }
                        
                        if (l.options) {
                            if (l.options.color) f.properties.stroke = l.options.color;
                            if (l.options.weight) f.properties['stroke-width'] = l.options.weight;
                            if (l.options.opacity !== undefined) f.properties['stroke-opacity'] = l.options.opacity;
                            if (l.options.fillColor) f.properties.fill = l.options.fillColor;
                            if (l.options.fillOpacity !== undefined) f.properties['fill-opacity'] = l.options.fillOpacity;
                            
                            if (f.geometry?.type === 'Point' && l.options.icon && l.options.icon.options?.html) {
                                const html = l.options.icon.options.html;
                                const match = html.match(/background-color:\s*([^;]+);/);
                                if (match) f.properties['marker-color'] = match[1].trim();
                            }
                        }
                        return f;
                    };

                    if (geojson.type === 'FeatureCollection') {
                        geojson.features.forEach((f, i) => {
                            const childLayer = layer.getLayers ? layer.getLayers()[i] : null;
                            if (childLayer) features.push(processFeature(f, childLayer));
                            else features.push(f);
                        });
                    } else {
                        features.push(processFeature(geojson, layer));
                    }
                }
            });
            return features;
        };

        const handleExportKML = async () => {
            const drawnFeatures = extractStylesForExport(drawnItems);
            const measuredFeatures = extractStylesForExport(measurementLayers);
            const loadedFeatures = extractStylesForExport(shpLayersGroupRef.current);

            const geoJsonToExport = {
                type: 'FeatureCollection',
                features: [...drawnFeatures, ...measuredFeatures, ...loadedFeatures]
            };

            if (geoJsonToExport.features.length === 0) {
                alertify.error('No hay elementos dibujados ni cargados para exportar.');
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
            const drawnFeatures = extractStylesForExport(drawnItems);
            const measuredFeatures = extractStylesForExport(measurementLayers);
            const loadedFeatures = extractStylesForExport(shpLayersGroupRef.current);

            const geoJsonToExport = {
                type: 'FeatureCollection',
                features: [...drawnFeatures, ...measuredFeatures, ...loadedFeatures]
            };

            if (geoJsonToExport.features.length === 0) {
                alertify.error('No hay elementos dibujados ni cargados para exportar.');
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

        downloadModal.innerHTML = `
          <div class="geolmap-card-header geolmap-header-purple">
              <span>Descargar Datos</span>
              <i class="fas fa-times" style="cursor:pointer"></i>
          </div>
          <div class="geolmap-card-body">
              <p style="margin-top: 0; margin-bottom: 10px;">Exportar todas las geometrías dibujadas en el mapa.</p>
              <button id="geolmap-exportKmlBtn" class="geolmap-btn-block"><i class="fas fa-file-code"></i> Descargar como KML</button>
              <button id="geolmap-exportShpBtn" class="geolmap-btn-block"><i class="fas fa-file-archive"></i> Descargar como Shapefile (ZIP)</button>
          </div>
        `;

        downloadModal.querySelector('#geolmap-exportKmlBtn').onclick = handleExportKML;
        downloadModal.querySelector('#geolmap-exportShpBtn').onclick = handleExportShapefile;


        // --- Lógica del Modal de Subida ---
        const uploadModal = L.DomUtil.create('div', 'geolmap-flyout-card-v2 geolmap-card-purple', map.getContainer());
        uploadModal.id = 'geolmap-menu-kml-carga';
        L.DomEvent.disableClickPropagation(uploadModal);

        // --- Helper de Iconos POI ---
        const getPoiIcon = (type) => {
            let html = '';
            let className = 'poi-marker';
            let size = [30, 30];
            let anchor = [15, 30];

            if (type === 'start') {
                html = '<i class="fa-solid fa-play" style="color:white; font-size:14px;"></i>';
                className = 'poi-marker start';
            } else if (type === 'end') {
                html = '<i class="fa-solid fa-flag-checkered" style="color:white; font-size:14px;"></i>';
                className = 'poi-marker end';
            } else if (type === 'city') {
                html = '<i class="fa-solid fa-city" style="color:white; font-size:12px;"></i>';
                className = 'poi-marker city';
                size = [24, 24];
                anchor = [12, 12];
            }

            return L.divIcon({
                className: `custom-div-icon ${className}`,
                html: `<div style="
                    display:flex; 
                    align-items:center; 
                    justify-content:center; 
                    width:100%; 
                    height:100%; 
                    background-color: ${type === 'start' ? '#28a745' : (type === 'end' ? '#dc3545' : '#17a2b8')}; 
                    border-radius: 50%; 
                    border: 2px solid white; 
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                    ${html}
                </div>`,
                iconSize: size,
                iconAnchor: anchor,
                popupAnchor: [0, -anchor[1]]
            });
        };

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

                // --- PROCESS POIS (Start/End/Cities) ---
                poiLayerRef.current.clearLayers();
                citiesLayerRef.current.clearLayers();
                allDynamicCitiesRef.current.clear(); // Clear semantic zoom cache too

                if (convertedGeoJson && convertedGeoJson.features) {
                    // 1. Find Route Line(s) for Start/End
                    const lineFeatures = convertedGeoJson.features.filter(f => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString');

                    if (lineFeatures.length > 0) {
                        // SORT FEATURES BY NAME (TRAMO 1, TRAMO 2, ...)
                        lineFeatures.sort((a, b) => {
                            const nameA = a.properties?.name || '';
                            const nameB = b.properties?.name || '';
                            const numA = parseInt(nameA.replace(/[^0-9]/g, ''), 10);
                            const numB = parseInt(nameB.replace(/[^0-9]/g, ''), 10);
                            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                            return nameA.localeCompare(nameB);
                        });

                        try {
                            // Start
                            const firstLine = lineFeatures[0];
                            const firstCoords = firstLine.geometry.type === 'LineString'
                                ? firstLine.geometry.coordinates
                                : firstLine.geometry.coordinates[0];

                            if (firstCoords && firstCoords.length > 0) {
                                // GeoJSON [lng, lat] -> Leaflet [lat, lng]
                                const startLL = [firstCoords[0][1], firstCoords[0][0]];
                                L.marker(startLL, { icon: getPoiIcon('start') })
                                    .bindPopup('<b>Inicio del Tramo</b>')
                                    .bindTooltip('Inicio', { permanent: true, direction: 'right', className: 'poi-tooltip', offset: [15, 0] })
                                    .addTo(poiLayerRef.current);
                            }

                            // End
                            const lastLine = lineFeatures[lineFeatures.length - 1];
                            let finalPointArr = null;
                            if (lastLine.geometry.type === 'LineString') {
                                finalPointArr = lastLine.geometry.coordinates[lastLine.geometry.coordinates.length - 1];
                            } else {
                                const segments = lastLine.geometry.coordinates;
                                const lastSegment = segments[segments.length - 1];
                                finalPointArr = lastSegment[lastSegment.length - 1];
                            }

                            if (finalPointArr) {
                                const endLL = [finalPointArr[1], finalPointArr[0]];
                                L.marker(endLL, { icon: getPoiIcon('end') })
                                    .bindPopup('<b>Fin del Tramo</b>')
                                    .bindTooltip('Fin', { permanent: true, direction: 'right', className: 'poi-tooltip', offset: [15, 0] })
                                    .addTo(poiLayerRef.current);
                            }
                        } catch (err) {
                            console.warn("Error extracting start/end from KML", err);
                        }
                    }

                    // 2. Find Cities/Points
                    convertedGeoJson.features.forEach(f => {
                        if (f.geometry.type === 'Point') {
                            const lat = f.geometry.coordinates[1];
                            const lng = f.geometry.coordinates[0];
                            const name = f.properties.name || 'Punto Notable';
                            const desc = f.properties.description || '';

                            // Create marker but DO NOT add to layer yet
                            const marker = L.marker([lat, lng], { icon: getPoiIcon('city') })
                                .bindPopup(`<b>${name}</b>${desc ? '<br>' + desc : ''}`)
                                .bindTooltip(name, { permanent: true, direction: 'right', className: 'poi-tooltip', offset: [10, 0] });

                            // Add to semantic map (default to 'city' visibility for manual KML points)
                            const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
                            allDynamicCitiesRef.current.set(key, { marker, type: 'city' });

                            // Let updateVisibleCities handle adding it to the layer
                        }
                    });

                    // 3. AUTO-DETECT Cities via Overpass API
                    try {
                        const tempLayer = L.geoJSON(convertedGeoJson);
                        const bounds = tempLayer.getBounds();
                        if (bounds.isValid()) {
                            // alertify.message('Buscando ciudades cercanas (Auto)...', 2);
                            // Pad bounds by 50%
                            const paddedBounds = bounds.pad(0.5);
                            fetchNearbyPlaces(paddedBounds).then(places => {
                                if (places.length > 0) {
                                    alertify.success(`Detectados ${places.length} poblados cercanos.`);
                                    let addedCount = 0;
                                    places.forEach(p => {
                                        const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
                                        if (!allDynamicCitiesRef.current.has(key)) {
                                            const marker = L.marker([p.lat, p.lng], { icon: getPoiIcon('city') })
                                                .bindPopup(`<b>${p.name}</b><br><small>Tipo: ${p.type || 'Lugar'}</small>${p.desc ? '<br>' + p.desc : ''}`)
                                                .bindTooltip(p.name, { permanent: true, direction: 'right', className: 'poi-tooltip', offset: [10, 0] });

                                            // Store in Map for semantic zoom logic
                                            allDynamicCitiesRef.current.set(key, { marker, type: p.type });
                                            addedCount++;
                                        }
                                    });

                                    if (addedCount > 0) {
                                        updateVisibleCities();
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        console.warn('Error auto-detecting cities:', e);
                    }
                }

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

            } catch (error) {
                alertify.error('No se pudo cargar el KML desde la URL.');
            }
        };

        const handleKmlUpload = async () => {
            const kmlUploadInput = uploadModal.querySelector('#kmlUploadInput');
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
                await axiosInstance.post(`/api/proyectos/${projectIdRef.current}/kml`, { 
                    url: newUrl, 
                    section: sectionRef.current 
                });
                alertify.message('Asociando KML con el proyecto.');

                uploadModal.style.display = 'none';

                // Clear existing layers before loading the new one
                // Clear existing layers before loading the new one
                drawnItems.clearLayers();
                measurementLayers.clearLayers();
                poiLayerRef.current.clearLayers();

                if (newUrl) {
                    await loadKmlFromUrl(newUrl);
                }

            } catch (error) {
                alertify.error('Ocurrió un error al subir el archivo.');
            }
        };

        uploadModal.innerHTML = `
            <div class="geolmap-card-header geolmap-header-purple">
                <span>Gestión de Archivos KML</span>
                <i class="fas fa-times" style="cursor:pointer"></i>
            </div>
            <div class="geolmap-card-body">
                <label for="geolmap-kmlUploadInput" class="geolmap-btn-block" style="text-align: center; display: block;"><i class="fas fa-upload"></i> Cargar KML</label>
                <input type="file" id="geolmap-kmlUploadInput" accept=".kml" style="display: none;"/>
                <button id="geolmap-uploadKmlBtn" class="geolmap-btn-block" style="margin-top: 5px;">Subir y Mostrar KML</button>
            </div>
        `;

        uploadModal.querySelector('#geolmap-uploadKmlBtn').onclick = handleKmlUpload;
        uploadModal.querySelector('#geolmap-kmlUploadInput').onchange = handleKmlUpload;


        // Lógica para mostrar/ocultar campos de coordenadas según el formato
        const coordFormatSelect = document.getElementById('geolmap-coordFormatSelect');
        const decimalInputs = document.getElementById('geolmap-decimalInputs');
        const degreesInputs = document.getElementById('geolmap-degreesInputs');

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
        const projectionSelect = document.getElementById('geolmap-projectionSelect');
        const utmZoneGroup = document.getElementById('geolmap-utmZoneGroup');
        const geographicCoordInputs = document.getElementById('geolmap-geographicCoordInputs');
        const utmCoordInputs = document.getElementById('geolmap-utmCoordInputs');

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
        const inputTypeSelect = document.getElementById('geolmap-inputTypeSelect');
        const coordinateInputSection = document.getElementById('geolmap-coordinateInputSection');
        const kmlInputs = document.getElementById('geolmap-kmlInputs');

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
        const kmlFileInput = document.getElementById('geolmap-kmlFileInput');
        const processKmlBtn = document.getElementById('geolmap-processKmlBtn');

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
                    closeAll();
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
        const drawPointBtn = document.getElementById('geolmap-drawPointBtn');
        const clearCoordsBtn = document.getElementById('geolmap-clearCoordsBtn');

        // Función para limpiar los campos de coordenadas
        const clearCoords = () => {
            // Campos decimales
            document.getElementById('geolmap-lonDecimal').value = '';
            document.getElementById('geolmap-latDecimal').value = '';
            // Campos grados
            document.getElementById('geolmap-lonDeg').value = '';
            document.getElementById('geolmap-lonMin').value = '';
            document.getElementById('geolmap-lonSec').value = '';
            document.getElementById('geolmap-latDeg').value = '';
            document.getElementById('geolmap-latMin').value = '';
            document.getElementById('geolmap-latSec').value = '';
            // Campos UTM
            document.getElementById('geolmap-utmX').value = '';
            document.getElementById('geolmap-utmY').value = '';
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
            const projectionType = document.getElementById('geolmap-projectionSelect').value;

            if (projectionType === 'geographic') {
                let lat, lon;
                const coordFormat = document.getElementById('geolmap-coordFormatSelect').value;

                if (coordFormat === 'decimal') {
                    lon = parseFloat(document.getElementById('geolmap-lonDecimal').value);
                    lat = parseFloat(document.getElementById('geolmap-latDecimal').value);
                } else { // grados (DMS)
                    const lonDeg = document.getElementById('geolmap-lonDeg').value;
                    const lonMin = document.getElementById('geolmap-lonMin').value;
                    const lonSec = document.getElementById('geolmap-lonSec').value;
                    const latDeg = document.getElementById('geolmap-latDeg').value;
                    const latMin = document.getElementById('geolmap-latMin').value;
                    const latSec = document.getElementById('geolmap-latSec').value;

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
                const utmX = parseFloat(document.getElementById('geolmap-utmX').value);
                const utmY = parseFloat(document.getElementById('geolmap-utmY').value);
                const utmZone = parseInt(document.getElementById('geolmap-utmZoneSelect').value);

                if (isNaN(utmX) || isNaN(utmY) || isNaN(utmZone)) {
                    alertify.error('Por favor, ingrese coordenadas UTM válidas y seleccione una zona.');
                    return;
                }
                const utmZoneLetter = 'M';
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
            closeAll();
            clearCoords(); // Limpiar campos después de dibujar
        };

        // Asignar evento al botón de dibujar
        drawPointBtn.onclick = drawPoint;

        const addNumericInputValidation = (inputId) => {
            const input = document.getElementById('geolmap-' + inputId);
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value;
                    value = value.replace(/[^-0-9.]/g, '');
                    const negativeCount = (value.match(/-/g) || []).length;
                    if (negativeCount > 0) {
                        const firstChar = value.charAt(0);
                        value = value.replace(/-/g, '');
                        if (firstChar === '-') {
                            value = '-' + value;
                        }
                    }
                    const parts = value.split('.');
                    if (parts.length > 2) {
                        value = parts[0] + '.' + parts.slice(1).join('');
                    }
                    e.target.value = value;
                });
            }
        };

        addNumericInputValidation('lonDecimal');
        addNumericInputValidation('latDecimal');
        addNumericInputValidation('utmX');
        addNumericInputValidation('utmY');

        const toolbarContainer = L.DomUtil.create('div', 'geolmap-toolbar-container');
        toolbarContainer.innerHTML = `
            <div class="geolmap-tool-group">
                <button class="geolmap-tool-btn" data-menu="geolmap-menu-medir"><i class="fas fa-ruler-combined"></i></button>
                <button class="geolmap-tool-btn" data-menu="geolmap-menu-dibujo"><i class="fas fa-pencil-alt" style="color: #e67e22;"></i></button>
                <button class="geolmap-tool-btn" data-menu="geolmap-menu-kml-carga"><i class="fas fa-upload" style="color: #6c5ce7;"></i></button>
                <button class="geolmap-tool-btn" data-menu="geolmap-menu-kml-descarga"><i class="fas fa-download" style="color: #6c5ce7;"></i></button>
                <button class="geolmap-tool-btn" id="geolmap-btn-capas-geologia" title="Capas de Geología"><i class="fas fa-layer-group" style="color: #3b82f6;"></i></button>
                <button class="geolmap-tool-btn" data-menu="geolmap-menu-calibrar"><i class="fas fa-cog"></i></button>
            </div>
            <div class="geolmap-tool-group">
                <button class="geolmap-tool-btn" id="geolmap-updateInfo"><i class="fas fa-save"></i></button>
                <button class="geolmap-tool-btn" id="geolmap-deleteKml"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        const toolbarControl = new L.Control({ position: 'topleft' });
        toolbarControl.onAdd = () => toolbarContainer;
        toolbarControl.addTo(map);

        L.DomEvent.disableClickPropagation(toolbarContainer);

        const closeAll = () => {
            document.querySelectorAll('.geolmap-flyout-card-v2').forEach(m => m.style.display = 'none');
            document.querySelectorAll('.geolmap-tool-btn').forEach(b => b.classList.remove('active'));
        };

        const toggleMenu = (menuId, btnElement) => {
            const menu = document.getElementById(menuId);
            if (!menu) return;
            const isVisible = menu.style.display === 'block';

            closeAll();

            if (!isVisible) {
                // Usamos requestAnimationFrame para asegurar que el navegador tenga tiempo de renderizar
                // el contenido insertado dinámicamente antes de medir.
                requestAnimationFrame(() => {
                    // 1. Mostrar (invisible) para poder medir dimensiones
                    menu.style.visibility = 'hidden';
                    menu.style.display = 'block';

                    const rect = btnElement.getBoundingClientRect();
                    const menuHeight = menu.offsetHeight;
                    const windowHeight = window.innerHeight;

                    // 2. Calcular Top Inicial (Alineado Top-Top por defecto)
                    // El usuario prefiere que empiece alineado al botón, no centrado.
                    let top = rect.top;

                    // 3. Verificar desbordamiento inferior
                    // Si (Top + AlturaMenu) > AlturaVentana, lo subimos lo justo para que quepa
                    const margin = 20; // Margen de seguridad
                    if (top + menuHeight > windowHeight - margin) {
                        top = windowHeight - menuHeight - margin;
                    }

                    // 4. Verificar desbordamiento superior (por seguridad)
                    if (top < margin) {
                        top = margin;
                    }

                    menu.style.left = (rect.right + 15) + 'px';
                    menu.style.top = top + 'px';
                    menu.style.bottom = 'auto';

                    // 5. Ajustar flecha para que siempre apunte al CENTRO del botón
                    // ArrowTop relative to Modal = (Button Center Y) - (Modal Top Y)
                    const buttonCenterY = rect.top + (rect.height / 2);
                    let arrowTop = buttonCenterY - top - 7; // -7 para centrar la flecha de 14px

                    // Clampear la flecha para que no se salga del modal si el desfazase es mucho (bordes redondeados)
                    arrowTop = Math.max(8, Math.min(arrowTop, menuHeight - 22));

                    menu.style.setProperty('--arrow-top', `${arrowTop}px`);

                    // 6. Hacer visible
                    menu.style.visibility = 'visible';
                    btnElement.classList.add('active');
                });
            }
        };

        toolbarContainer.querySelectorAll('.geolmap-tool-btn[data-menu]').forEach(btn => {
            btn.onclick = () => toggleMenu(btn.dataset.menu, btn);
        });

        const capasGeolBtn = toolbarContainer.querySelector('#geolmap-btn-capas-geologia');
        if (capasGeolBtn) {
            capasGeolBtn.onclick = () => {
                const isVisible = isLayerPanelOpen;
                closeAll();
                if (!isVisible) {
                    setIsLayerPanelOpen(true);
                    capasGeolBtn.classList.add('active');
                    
                    // Posicionamiento dinámico similar a toggleMenu
                    setTimeout(() => {
                        const menu = document.getElementById('geolmap-menu-capas-geologia');
                        if (menu) {
                            const rect = capasGeolBtn.getBoundingClientRect();
                            menu.style.display = 'block';
                            menu.style.left = (rect.right + 15) + 'px';
                            menu.style.top = rect.top + 'px';
                            menu.style.setProperty('--arrow-top', '15px');
                        }
                    }, 50);
                } else {
                    setIsLayerPanelOpen(false);
                }
            };
        }

        const calibrateButton = toolbarContainer.querySelector('[data-menu="geolmap-menu-calibrar"]');

        const deleteKmlButton = toolbarContainer.querySelector('#geolmap-deleteKml');

        const updateInfoButton = toolbarContainer.querySelector('#geolmap-updateInfo');


        // --- NEW: Calibration Modal ---
        const calibrationModal = L.DomUtil.create('div', 'geolmap-flyout-card-v2 geolmap-card-blue', map.getContainer());
        calibrationModal.id = "geolmap-menu-calibrar";
        L.DomEvent.disableClickPropagation(calibrationModal);

        const calibrationHeader = L.DomUtil.create('div', 'geolmap-card-header geolmap-header-blue', calibrationModal);
        calibrationHeader.innerHTML = '<span>Calibrar Progresivas por Tramo</span><i class="fas fa-times" style="cursor:pointer"></i>';
        calibrationHeader.querySelector('.fa-times').onclick = closeAll;

        const calibrationContent = L.DomUtil.create('div', 'geolmap-card-body', calibrationModal);

        // --- KML Persistence (Internal handlers moved to useEffect at top level) ---

        const loadInitialCalibrationData = async () => {
            try {
                const response = await axiosInstance.get(`/api/proyectos/${projectIdRef.current}/calibracion`);
                setCalibrationData(response.data);
                calibrationDataRef.current = response.data;
            } catch (error) {
                if (error.response && error.response.status !== 404) {
                    console.error('Error loading calibration data:', error);
                    alertify.error('Error al cargar datos de calibración.');
                }
            }
        };

        loadInitialCalibrationData();

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
                        <td style="padding: 8px; border: 1px solid #ddd;"><input type="text" class="geolmap-calib-input" data-tramo="${tramoName}" data-type="start" value="${currentCalib.start}" placeholder="Ej: 0+000"></td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><input type="text" class="geolmap-calib-input" data-tramo="${tramoName}" data-type="end" value="${currentCalib.end}" placeholder="Ej: 34+000"></td>
                    </tr>
                `;
            });

            calibrationContent.innerHTML = `
                <p>Ingrese la progresiva oficial de inicio y fin para cada tramo del KML.</p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tramo</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Inicio</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fin</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <button id="geolmap-saveCalibrationBtn" class="geolmap-btn-block" style="background-color: #28a745; color: white;">Guardar Calibración</button>
                <button id="geolmap-deleteCalibrationBtn" class="geolmap-btn-block" style="background-color: #dc3545; color: white; margin-top:5px;">Borrar Calibración</button>
            `;

            calibrationModal.querySelector('#geolmap-saveCalibrationBtn').onclick = async () => {
                const inputs = calibrationModal.querySelectorAll('.geolmap-calib-input');
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
                    await axiosInstance.post(`/api/proyectos/${projectIdRef.current}/calibracion`, newCalibData);
                    setCalibrationData(newCalibData);
                    calibrationDataRef.current = newCalibData;
                    closeAll();
                    alertify.success('Datos de calibración guardados exitosamente en la base de datos.');
                } catch (error) {
                    console.error('Error saving calibration data:', error);
                    alertify.error('Error al guardar datos de calibración: ' + (error.response?.data?.error || error.message));
                }
            };

            calibrationModal.querySelector('#geolmap-deleteCalibrationBtn').onclick = async () => {
                alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar TODOS los datos de calibración para este proyecto?',
                    async function () {
                        try {
                            await axiosInstance.delete(`/api/proyectos/${projectIdRef.current}/calibracion`);
                            setCalibrationData(null); // Clear local state
                            calibrationDataRef.current = null;
                            closeAll();
                            alertify.success('Datos de calibración eliminados exitosamente.');
                        } catch (error) {
                            console.error('Error deleting calibration data:', error);
                            alertify.error('Error al eliminar datos de calibración: ' + (error.response?.data?.error || error.message));
                        }
                    },
                    function () { alertify.message('Eliminación cancelada.'); }
                );
            };

            // Now call toggleMenu AFTER content is populated so height is correct
            toggleMenu('geolmap-menu-calibrar', calibrateButton);
        };

        const handleDeleteKml = async () => {
            alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar el KML de este proyecto? Esta acción no se puede deshacer.',
                async function () {
                    try {
                        alertify.message('Eliminando KML...');
                        await axiosInstance.delete(`/api/proyectos/${projectIdRef.current}/kml`, {
                            params: { section: sectionRef.current }
                        });
                        drawnItems.clearLayers();
                        alertify.success('El KML ha sido eliminado del proyecto.');
                    } catch (error) {
                        console.error("Error deleting KML:", error);
                        const errorMessage = error.response?.data?.error || 'No se pudo eliminar el KML.';
                        alertify.error(errorMessage);
                    }
                },
                function () {
                    alertify.error('Eliminación cancelada.');
                }
            );
        };

        deleteKmlButton.onclick = handleDeleteKml;

        const handleUpdateInfo = async () => {
            const geoJsonDrawn = drawnItems.toGeoJSON();
            const points = geoJsonDrawn.features.filter(feature => feature.geometry.type === 'Point');

            if (points.length === 0) {
                alertify.warning('No hay nuevos puntos para guardar.');
                return;
            }
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
                const response = await axiosInstance.post('/api/puntos-mapa/bulk', { puntos: puntosParaGuardar });
                alertify.success(`${response.data.count} puntos guardados correctamente.`);
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

        measureModal.querySelector('#geolmap-clearMeasureButton').onclick = clearMeasurement;

        const handleCoordsMouseMove = (e) => {
            if (isDrawing || isMeasuring) {
                coordContainer.style.display = 'none'; // Ocultar si está dibujando o midiendo
                return;
            }

            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            const zoom = map.getZoom();
            const metersPerPixel = 156543.03 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
            const scale = Math.round(metersPerPixel * 3779.52);
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

        measureModal.querySelector('#geolmap-distanceButton').onclick = () => {
            isMeasuring = !isMeasuring;
            if (areaDrawer) { areaDrawer.disable(); areaDrawer = null; }
            clearMeasurement();
            if (isMeasuring) {
                map.getContainer().style.cursor = 'crosshair';
                distanceDisplay.innerHTML = 'Haga clic para añadir puntos.';
                map.on('mousemove', handleMeasureMouseMove);
            } else {
                map.getContainer().style.cursor = '';
                map.off('mousemove', handleMeasureMouseMove);
            }
        };

        measureModal.querySelector('#geolmap-areaButton').onclick = () => {
            if (isMeasuring) { isMeasuring = false; map.getContainer().style.cursor = ''; map.off('mousemove', handleMeasureMouseMove); }
            clearMeasurement();
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
            map.getContainer().style.cursor = '';
            map.off('mousemove', handleMeasureMouseMove);

        };

        const handleDrawCreated = (e) => {
            const layer = e.layer;

            if (areaDrawer && e.layerType === 'polygon') {
                const area = getPolygonArea(layer.getLatLngs()[0]);
                const areaHa = (area / 10000).toFixed(2);
                const areaKm = (area / 1000000).toFixed(4);
                const popupContent = `<b>Área:</b><br>${area.toFixed(2)} m²<br>${areaHa} ha<br>${areaKm} km²`;
                layer.bindPopup(popupContent).openPopup();
            }

            drawnItems.addLayer(layer);

            if (areaDrawer) {
                areaDrawer = null;
            }
            if (currentDrawer) {
                currentDrawer = null;
            }
            closeAll();
        };

        // Create an array of modals for easy iteration
        const modals = [measureModal, drawModal, downloadModal, uploadModal, calibrationModal];

        // Add 'X' click logic to close all modals
        modals.forEach(modal => {
            const closeIcon = modal.querySelector('.fa-times');
            if (closeIcon) {
                closeIcon.style.cursor = 'pointer'; // Ensure pointer cursor
                closeIcon.onclick = (e) => {
                    e.stopPropagation(); // Prevent bubbling just in case
                    closeAll();
                };
            }
        });

        const handleDocumentClick = (e) => {
            // Check if the click is outside all modals and not on a toolbar button
            const clickedInsideModal = modals.some(modal => modal.contains(e.target));
            const clickedOnToolbarBtn = e.target.closest('.geolmap-tool-btn');

            if (!clickedInsideModal && !clickedOnToolbarBtn) {
                closeAll();
            }
        };

        // Attach global click listener. useCapture = true to catch it early if needed, or false.
        // Usually bubbling phase (false) is fine, but we need to match how stopPropagation is used elsewhere.
        // We'll attach to document.body or document
        document.addEventListener('click', handleDocumentClick);


        // --- Adjuntar y Limpiar Listeners ---
        map.on('mousemove', handleCoordsMouseMove).on('mouseout', handleCoordsMouseOut);
        map.on(L.Draw.Event.CREATED, handleDrawCreated);
        map.on(L.Draw.Event.DRAWSTART, handleDrawStart).on(L.Draw.Event.DRAWSTOP, handleDrawStop);
        map.on('click', handleMapClick).on('dblclick', handleMapDoubleClick);
        map.on('zoomstart', () => map.closePopup()); // Close popup on zoom start
        map.on('click', () => map.closePopup());     // ensure click anywhere on map closes popup

        return () => {
            if (map) {
                map.off('zoomend', handleZoomChange);
                map.off('moveend', handleMoveEnd);
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                // toggleControl is within scope
                try { toggleControl.remove(); } catch (e) { }
            }
            isComponentMounted = false;
            // Remove global click listener
            document.removeEventListener('click', handleDocumentClick);

            if (map) {
                map.isInitialized = false;
            }
            map.off('mousemove', handleCoordsMouseMove).off('mouseout', handleCoordsMouseOut);
            map.off(L.Draw.Event.CREATED, handleDrawCreated);
            map.off(L.Draw.Event.DRAWSTART, handleDrawStart).off(L.Draw.Event.DRAWSTOP, handleDrawStop);
            map.off('click', handleMapClick).off('dblclick', handleMapDoubleClick);
            map.off('mousemove', handleMeasureMouseMove);
            coordControl.remove();
            toolbarControl.remove();

            [measureModal, drawModal, downloadModal, uploadModal, calibrationModal].forEach(modal => {
                // Safely remove modal from its parent if it exists
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            });
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
    const ImageGallery = ({ imageProp, onShowDetails, onEnlarge }) => {
        const [currentIndex, setCurrentIndex] = useState(0);
        const [isPaused, setIsPaused] = useState(false);

        // Normalize the input to always be an array of objects with a `url` property
        const images = (imageProp || []).map(item => {
            if (typeof item === 'string') {
                return { url: item }; // Convert string to object
            }
            return item; // It's already an object
        }).filter(item => item && item.url); // Ensure we only have valid items

        // Auto-rotation effect
        useEffect(() => {
            if (images.length <= 1 || isPaused) return;

            const interval = setInterval(() => {
                setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
            }, 3000); // Change every 3 seconds

            return () => clearInterval(interval);
        }, [images.length, isPaused]);

        if (images.length === 0) {
            return (
                <div style={{ marginTop: '5px', textAlign: 'center' }}>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>No hay imágenes.</p>
                </div>
            );
        }

        const goToPrevious = (e) => {
            e.stopPropagation();
            setCurrentIndex(prevIndex => (prevIndex - 1 + images.length) % images.length);
            setIsPaused(true); // Pause on manual interaction
        };

        const goToNext = (e) => {
            e.stopPropagation();
            setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
            setIsPaused(true); // Pause on manual interaction
        };

        return (
            <div
                className="popup-gallery-container"
                style={{ position: 'relative', width: '100%', height: '100%' }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <img
                    src={images[currentIndex].url}
                    alt={`Imagen ${currentIndex + 1}`}
                    className="popup-image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsPaused(true);
                        if (onEnlarge) onEnlarge(images[currentIndex]);
                    }}
                />

                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            style={{
                                position: 'absolute', left: '5px', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                                width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', zIndex: 10
                            }}
                        >
                            &#10094;
                        </button>
                        <button
                            onClick={goToNext}
                            style={{
                                position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                                width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px', zIndex: 10
                            }}
                        >
                            &#10095;
                        </button>
                        <div style={{
                            position: 'absolute', bottom: '5px', left: '0', right: '0', textAlign: 'center', color: 'white',
                            fontSize: '10px', textShadow: '1px 1px 2px black', pointerEvents: 'none'
                        }}>
                            {currentIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>
        );
    };

    // --- MODAL DE VISTA PREVIA DE IMAGEN (Lightbox) ---
    const ImagePreviewModal = ({ image, onClose }) => {
        if (!image) return null;

        const handleDownload = () => {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `imagen_detalle_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 99999, // Max z-index
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
            }} onClick={onClose}>
                <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '-40px',
                            right: '-40px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '30px',
                            cursor: 'pointer'
                        }}
                    >
                        &times;
                    </button>

                    <img
                        src={image.url}
                        alt="Vista previa"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '85vh',
                            border: '2px solid white',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                        }}
                    />

                    <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '10px',
                        borderRadius: '5px',
                        color: 'white',
                        fontFamily: 'monospace',
                        textAlign: 'right'
                    }}>
                        {image.panel_fotografico_codigo && <div>Ref: {image.panel_fotografico_codigo}</div>}
                        {image.fecha_hora && <div>{image.fecha_hora}</div>}
                        <div>{image.latitud && image.longitud ? `${image.latitud}, ${image.longitud}` : ''}</div>
                    </div>

                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                        <button
                            onClick={handleDownload}
                            className="geolmap-btn-success"
                            style={{ padding: '8px 20px', fontSize: '14px' }}
                        >
                            <i className="fas fa-download"></i> Descargar
                        </button>
                        <button
                            onClick={onClose}
                            className="geolmap-btn-danger"
                            style={{ padding: '8px 20px', fontSize: '14px', marginLeft: '10px' }}
                        >
                            <i className="fas fa-times"></i> Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const markerRefMap = React.useRef({});
    const popupRoots = React.useRef({});

    const getIcon = React.useCallback((zoom, type, subtype = '', elementData = null) => {
        let iconSize = [24, 24]; // Increased base size
        let iconAnchor = [12, 24];
        let popupAnchor = [0, -24];

        // Default sizing for alcantarillas/badenes
        if (zoom > 15) {
            iconSize = [42, 42]; // Was 32x32
            iconAnchor = [21, 42];
            popupAnchor = [0, -42];
        } else if (zoom > 13) {
            iconSize = [32, 32]; // Was 24x24
            iconAnchor = [16, 32];
            popupAnchor = [0, -32];
        }

        // Custom sizing for Puentes and Muros (Larger)
        if (type === 'puente' || type === 'muro') {
            if (zoom > 15) {
                iconSize = [64, 64]; // Was 48x48
                iconAnchor = [32, 64];
                popupAnchor = [0, -64];
            } else if (zoom > 13) {
                iconSize = [48, 48]; // Was 36x36
                iconAnchor = [24, 48];
                popupAnchor = [0, -48];
            } else {
                iconSize = [32, 32]; // Was 24x24
                iconAnchor = [16, 32];
                popupAnchor = [0, -32];
            }
        }

        // Custom sizing for Canteras and Fuentes (Vertical Pin aspect ratio ~ 0.72)
        if (type === 'cantera' || type === 'fuente') {
            if (zoom > 15) {
                iconSize = [46, 64]; // Was 32x44 -> significantly larger
                iconAnchor = [23, 64];
                popupAnchor = [0, -64];
            } else if (zoom > 13) {
                iconSize = [34, 47]; // Was 24x33
                iconAnchor = [17, 47];
                popupAnchor = [0, -47];
            } else {
                iconSize = [22, 30]; // Was 16x22
                iconAnchor = [11, 30];
                popupAnchor = [0, -30];
            }
        }


        if (type === 'zona_critica') {
            if (zoom > 15) {
                iconSize = [40, 40];
                iconAnchor = [20, 40];
                popupAnchor = [0, -40];
            } else {
                iconSize = [28, 28];
                iconAnchor = [14, 28];
                popupAnchor = [0, -28];
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
        } else if (type === 'cantera') {
            iconUrl = '/imgs/cantera_icon.svg';
        } else if (type === 'fuente') {
            iconUrl = '/imgs/fuente_icon.svg';
        } else if (type === 'hitos_kilometricos') {
            // ... existing hitos logic ...
            const size = Math.max(20, zoom * 2.5);
            const iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 40" width="${size}" height="${size}" style="filter: drop-shadow(3px 3px 2px rgba(0,0,0,0.4));">
                <defs>
                    <linearGradient id="postGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#e0e0e0;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#ffffff;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#d0d0d0;stop-opacity:1" />
                    </linearGradient>
                    <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#404040;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#000000;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#303030;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <ellipse cx="15" cy="38" rx="10" ry="2" fill="rgba(0,0,0,0.3)" />
                <path d="M5 10 L 5 36 Q 15 40 25 36 L 25 10 Z" fill="url(#postGradient)" stroke="#999" stroke-width="0.5"/>
                <path d="M5 10 L 5 6 Q 15 2 25 6 L 25 10 Q 15 14 5 10 Z" fill="url(#capGradient)" stroke="none"/>
                <ellipse cx="15" cy="6" rx="10" ry="2" fill="#555" />
                <rect x="8" y="15" width="14" height="14" rx="2" fill="#fff" stroke="#ccc" stroke-width="0.5" />
                <text x="15" y="25" font-size="10" text-anchor="middle" font-weight="900" fill="#000" font-family="Arial Black, Arial, sans-serif">K</text>
            </svg>
            `;
            return L.divIcon({
                className: 'custom-icon',
                html: iconSvg,
                iconSize: [size, size],
                iconAnchor: [size / 2, size],
                popupAnchor: [0, -size + 10] // Adjust popup anchor relative to icon size
            });

            // For image icons defined below
            let iconUrl = '';
            // ... (icon URL selection) ...

            if (iconUrl) {
                // If it's a standard image icon
                return L.icon({
                    iconUrl: iconUrl,
                    iconSize: iconSize,
                    iconAnchor: iconAnchor,
                    popupAnchor: [0, -iconSize[1]] // Exact top-center of the icon
                });
            }
        }
        else if (type === 'senales_informativas') {
            iconUrl = '/imgs/senal_informativa_icon.svg';
        } else if (type === 'senales_preventivas') {
            iconUrl = '/imgs/senal_preventiva_icon.svg';
        } else if (type === 'zona_critica') {
            const t = (subtype || '').toUpperCase();
            if (t.includes('DESPRENDIMIENTO') || t.includes('TALUD') || t.includes('DESLIZAMIENTO')) {
                iconUrl = '/imgs/zona_deslizamiento.svg';
            } else if (t.includes('AHUELLAMIENTO')) {
                iconUrl = '/imgs/ahuellamiento.svg';
            } else {
                iconUrl = '/imgs/zona_critica.svg';
            }
        } else if (type === 'interferencia_electrica' || (typeof subtype === 'string' && subtype.toLowerCase().includes('poste'))) {
            iconUrl = '/imgs/interferencia_icon.svg';
        } else if (type === 'estructura_existente') {
            iconUrl = '/imgs/estructura_icon.svg';
            // Custom sizing for structures if needed, reusing standard for now
            if (zoom > 15) {
                iconSize = [42, 42];
                iconAnchor = [21, 42];
                popupAnchor = [0, -42];
            } else {
                iconSize = [32, 32];
                iconAnchor = [16, 32];
                popupAnchor = [0, -32];
            }

        } else {
            // Fallback/Default
            // Check if it might be an estructura by properties?
            if (elementData && elementData.progresiva_inicio) {
                // Estructuras usually have progresiva_inicio
                iconUrl = '/imgs/estructura_icon.svg';
            } else {
                iconUrl = '/imgs/alcantarilla_icon.png';
            }
        }

        return L.icon({
            iconUrl: iconUrl,
            iconSize: iconSize,
            iconAnchor: iconAnchor,
            popupAnchor: popupAnchor
        });
    }, []);

    // Efecto para RENDERIZAR los marcadores de alcantarillas
    React.useEffect(() => {
        try {
            if (!map || !mapData) return;

            const mapDataLayer = mapDataLayerRef.current;

            const formatProgresiva = (value) => {
                if (value === null || value === undefined) return '';
                const num = Number(value);
                if (isNaN(num)) return value;
                const km = Math.floor(num / 1000);
                const m = Math.round(num % 1000);
                return `${km}+${m.toString().padStart(3, '0')}`;
            };



            const renderMarkers = () => {
                mapDataLayer.clearLayers();
                markerRefMap.current = {};
                const zoom = map.getZoom();

                if (!Array.isArray(mapData)) {
                    console.warn('[Geoite] mapData no es un array, abortando render de marcadores:', mapData);
                    return;
                }

                mapData.forEach(alcantarilla => {
                    if (typeof alcantarilla.latitud === 'number' && !isNaN(alcantarilla.latitud) &&
                        typeof alcantarilla.longitud === 'number' && !isNaN(alcantarilla.longitud)) {

                        // Normalize type for robust comparison
                        const normalizedType = String(alcantarilla.type || '').trim();
                        // DEBUG: Check what is actually being passed
                        if (normalizedType !== 'alcantarilla' && normalizedType !== 'baden') {
                            console.log('Rendering marker type:', normalizedType);
                        }
                        const icon = getIcon(zoom, normalizedType, alcantarilla.tipo, alcantarilla);

                        const marker = L.marker([alcantarilla.latitud, alcantarilla.longitud], { icon: icon });

                        marker.on('click', (e) => {
                            L.DomEvent.stop(e); // Keep this to prevent map click events

                            const targetZoom = 15; // Reduced from 16 as requested
                            const latLng = [alcantarilla.latitud, alcantarilla.longitud];

                            // Proyectar a píxeles, restar offset en Y (mover centro arriba -> marcador baja), y desproyectar
                            const point = map.project(latLng, targetZoom);
                            const targetPoint = point.subtract([0, 150]); // 150px de offset hacia arriba
                            const targetLatLng = map.unproject(targetPoint, targetZoom);

                            map.flyTo(targetLatLng, targetZoom, {
                                animate: true,
                                duration: 1.5
                            });

                            if (onElementoClick) {
                                onElementoClick(alcantarilla);
                            }
                        });

                        // Use a robust, unique ID for the popup container
                        const popupContainerId = `popup-gallery-${alcantarilla.type}-${alcantarilla.id || alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro}`;

                        let typeLabel = 'Elemento';
                        let idValue = alcantarilla.id;

                        // Bind the shared container to the marker
                        marker.bindPopup(popupContainer, {
                            maxWidth: 300,
                            minWidth: 200,
                            offset: [0, 15] // Push popup down further as requested
                        });

                        marker.on('popupopen', () => {
                            // Unconditional log to verify event firing and data availability
                            console.log('DEBUG: POPUP OPENED', {
                                id: alcantarilla.id,
                                type: alcantarilla.type,
                                hasGraphics: !!graphicsImages,
                                graphicsCount: graphicsImages?.length,
                                panelCode: alcantarilla.panel_fotografico_codigo,
                                ent: alcantarilla.entregable
                            });

                            // Calculate display values
                            let typeLabel = 'Elemento';
                            let idValue = alcantarilla.id;
                            let elementImages = alcantarilla.images || alcantarilla.imageUrls || [];

                            if (alcantarilla.type === 'alcantarilla') {
                                typeLabel = 'Alcantarilla';
                                idValue = alcantarilla.codigo || alcantarilla.id_alcantarilla;
                            } else if (alcantarilla.type === 'baden') {
                                typeLabel = 'Badén';
                                idValue = alcantarilla.codigo || alcantarilla.id_baden;
                            } else if (alcantarilla.type === 'puente') {
                                typeLabel = 'Puente';
                                idValue = alcantarilla.nombre || alcantarilla.id_puente;
                            } else if (alcantarilla.type === 'muro') {
                                typeLabel = 'Muro';
                                idValue = alcantarilla.id_muro;
                            } else if (alcantarilla.type === 'cantera') {
                                typeLabel = 'Cantera';
                                idValue = alcantarilla.item_number ? `${alcantarilla.item_number}` : (alcantarilla.progresiva || alcantarilla.id);
                            } else if (alcantarilla.type === 'fuente') {
                                typeLabel = 'Fuente de Agua';
                                idValue = alcantarilla.item_number ? `${alcantarilla.item_number}` : (alcantarilla.progresiva || alcantarilla.id);
                            } else if (alcantarilla.type === 'zona_critica') {
                                typeLabel = alcantarilla.tipo || 'Zona Crítica';
                                idValue = alcantarilla.codigo || alcantarilla.id_zona_critica;
                                if (alcantarilla.numero_seguimiento) {
                                    idValue += ` (Seg: ${alcantarilla.numero_seguimiento})`;
                                }
                            } else if (alcantarilla.type === 'interferencia_electrica') {
                                typeLabel = 'Interferencia Eléctrica';
                                idValue = alcantarilla.tipo_interferencia || alcantarilla.id;
                            } else if (alcantarilla.type === 'senales_informativas' || alcantarilla.type === 'senales_preventivas' || alcantarilla.type === 'senales_reguladoras') {
                                typeLabel = alcantarilla.type === 'senales_preventivas' ? 'Señal Preventiva' : (alcantarilla.type === 'senales_reguladoras' ? 'Señal Reguladora' : 'Señal Informativa');
                                idValue = alcantarilla.codigo;
                            } else if (alcantarilla.type === 'hitos_kilometricos') {
                                typeLabel = 'Hito Kilométrico';
                                idValue = `${alcantarilla.codigo} (Prog: ${alcantarilla.progresiva || 'S/D'})`;
                            } else if (alcantarilla.type === 'estructura_existente') {
                                typeLabel = 'Estructura Existente';
                                idValue = alcantarilla.id_estructura || alcantarilla.id;
                            }

                            // --- IMPROVED IMAGE LOOKUP LOGIC ---
                            // This logic now applies to more element types and includes robust range parsing and entregable normalization.
                            const shouldLookupImages = ['alcantarilla', 'baden', 'puente', 'muro', 'senales_informativas', 'senales_preventivas', 'senales_reguladoras', 'hitos_kilometricos', 'zona_critica'].includes(alcantarilla.type);

                            if (shouldLookupImages && graphicsImages && alcantarilla.panel_fotografico_codigo) {
                                const code = String(alcantarilla.panel_fotografico_codigo).trim();
                                const entregable = alcantarilla.entregable ? String(alcantarilla.entregable).trim() : null;

                                // 1. Parse Ranges (e.g. "238-241" or "19")
                                const parts = code.split(' - ');
                                const rangePart = parts[0];
                                const suffix = parts.length > 1 ? `-${parts[1]}` : '';

                                let start, end;
                                if (rangePart.includes('-')) {
                                    const [startStr, endStr] = rangePart.split('-');
                                    start = parseInt(startStr, 10);
                                    end = parseInt(endStr, 10);
                                } else {
                                    start = parseInt(rangePart, 10);
                                    end = start;
                                }

                                const expectedNames = [];
                                if (!isNaN(start) && !isNaN(end)) {
                                    for (let i = start; i <= end; i++) expectedNames.push(`${i}${suffix}`);
                                } else {
                                    expectedNames.push(code);
                                }

                                console.log('DEBUG FILTER (GEOITE):', {
                                    elId: alcantarilla.id,
                                    elCode: code,
                                    elEntregable: entregable,
                                    expectedNames
                                });

                                elementImages = graphicsImages.filter(img => {
                                    const imgCode = String(img.panel_fotografico_codigo || '').trim();
                                    const imgIndex = img.index ? String(img.index).trim() : '';
                                    const imgIndexNoExt = imgIndex.split('.')[0];

                                    // Extract filename from URL
                                    let urlFileName = '';
                                    if (img.url) {
                                        const urlParts = img.url.split('/');
                                        const fileNameWithExt = urlParts[urlParts.length - 1];
                                        urlFileName = fileNameWithExt.split('.')[0];
                                    }

                                    // A. Name Match (Check against all expected names from range)
                                    const nameMatches = expectedNames.includes(imgCode) ||
                                        expectedNames.includes(imgIndex) ||
                                        expectedNames.includes(imgIndexNoExt) ||
                                        expectedNames.includes(urlFileName);

                                    if (!nameMatches) return false;

                                    // B. Entregable Logic (Hybrid Legacy/Strict)
                                    const imgEntregable = img.entregable ? String(img.entregable).trim() : null;
                                    const normalize = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                                    if (entregable) {
                                        const normElement = normalize(entregable);
                                        const normImage = normalize(imgEntregable);

                                        // Scenario 1: Element is "E1". Allow matching "E1" OR null (legacy).
                                        if (normElement === 'E1') {
                                            return (!imgEntregable) || (normImage === 'E1');
                                        }

                                        // Scenario 2: Element is "E2", "E3", etc. STRICT match.
                                        return normImage === normElement;
                                    }

                                    // Scenario 3: No Entregable on Element.
                                    return true;
                                });

                                console.log(`FILTER SUMMARY (GEOITE): Found ${elementImages.length} images for delivered ${entregable}`);
                            }

                            // --- LOGIC FOR CARD TITLE ---
                            let cardTitle = 'ELEMENTO';
                            if (['alcantarilla', 'baden', 'puente', 'muro'].includes(alcantarilla.type)) {
                                cardTitle = 'OBRAS DE ARTE';
                            } else if (['senales_preventivas', 'senales_informativas', 'senales_reguladoras'].includes(alcantarilla.type)) {
                                cardTitle = 'SEÑALIZACIÓN';
                            } else if (alcantarilla.type === 'hitos_kilometricos') {
                                cardTitle = 'HITO KILOMÉTRICO';
                            } else if (alcantarilla.type === 'cantera') {
                                cardTitle = 'CANTERA';
                            } else if (alcantarilla.type === 'fuente') {
                                cardTitle = 'FUENTE';
                            } else if (alcantarilla.type === 'zona_critica') {
                                cardTitle = 'ZONA CRÍTICA';
                            } else if (alcantarilla.type === 'interferencia_electrica') {
                                cardTitle = 'INTERFERENCIA';
                            } else if (alcantarilla.type === 'estructura_existente') {
                                cardTitle = 'ESTRUCTURA EXISTENTE';
                            }

                            setActivePopup({
                                ...alcantarilla,
                                typeLabel, // Keep for fallback or other uses
                                cardTitle, // New field for the header
                                idValue,
                                images: elementImages
                            });
                        });

                        marker.on('popupclose', () => {
                            setActivePopup(null);
                        });

                        mapDataLayer.addLayer(marker);
                        // Use a robust key for the marker ref map
                        // Use a robust key for the marker ref map
                        const markerKey = alcantarilla.uniqueId || alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro || alcantarilla.id_zona_critica || alcantarilla.id_estructura;
                        if (markerKey) {
                            markerRefMap.current[markerKey] = marker;
                        }

                    } else if (alcantarilla.type === 'estructura_existente') {
                        // --- LOGICA ESTRUCTURA EXISTENTE (Segmento) ---

                        // 1. Validar coordenadas de Inicio y Fin
                        const hasStart = typeof alcantarilla.latitud_inicio === 'number';
                        const hasEnd = typeof alcantarilla.latitud_final === 'number';

                        if (hasStart && hasEnd) {
                            // --- A. Dibujar Línea Simplificada (Performance Fix) ---
                            // NOTA: Se ha deshabilitado el cálculo de turf.lineSlice aquí por problemas de rendimiento masivo.
                            // Solo dibujaremos lineas rectas en el mapa general. El detalle real se ve en el MiniMap del popup/detalle.

                            const polyline = L.polyline([
                                [alcantarilla.latitud_inicio, alcantarilla.longitud_inicio],
                                [alcantarilla.latitud_final, alcantarilla.longitud_final]
                            ], { color: '#FFFF00', weight: 6, dashArray: '10, 10' }).addTo(mapDataLayer);

                            // Bind popup if needed
                            // polyline.bindPopup(...) - ya tenemos marcadores de inicio/fin con popups.
                            // Si queremos popup en la linea:
                            polyline.bindPopup(`<b>Tramo Estructura:</b> ${formatProgresiva(alcantarilla.progresiva_inicio)} - ${formatProgresiva(alcantarilla.progresiva_final)}`);


                            /* LOGICA COMENTADA POR PERFORMANCE
                            const routeLayer = geoJsonLayerRef.current;
                            let slicedGeoJSON = null;
     
                             if (routeLayer) {
                                // Buscar en las capas del KML cuál contiene estos puntos (o está más cerca)
                                // Para simplificar, iteramos y buscamos el tramo donde encajen mejor o simplemente el primero que funcione??
                                // Mejor estrategia: Usar turf.lineSlice en cada LineString del KML y ver cuál tiene sentido?
                                // O simplemente calcular la distancia de los puntos a la linea.
     
                                const startPt = turf.point([alcantarilla.longitud_inicio, alcantarilla.latitud_inicio]);
                                const endPt = turf.point([alcantarilla.longitud_final, alcantarilla.latitud_final]);
     
                                routeLayer.eachLayer((layer) => {
                                    if (slicedGeoJSON) return; // Ya encontramos uno
     
                                    if (layer.feature && (layer.feature.geometry.type === 'LineString' || layer.feature.geometry.type === 'MultiLineString')) {
                                        try {
                                            // Convert Leaflet latlngs to Turf LineString
                                            // layer.toGeoJSON() da el feature geojson
                                            const lineGeoJson = layer.toGeoJSON();
     
                                            // Verificar si los puntos estan cerca de esta linea (opcional, por ahora slicing directo)
                                            // Nota: lineSlice recorta entre el punto inicial y final proyectados en la linea.
                                            // Si la linea es incorrecta (otro tramo), el resultado podría ser extraño o valido geometricamente pero erroneo.
                                            // Asumimos que los puntos caen "sobre" la linea correcta debido al calculo del backend.
     
                                            // Calcular distancias minimas para confirmar que es el tramo correcto?
                                            // Por performance, vamos a intentar slicear. 
     
                                            const sliced = turf.lineSlice(startPt, endPt, lineGeoJson);
                                            if (sliced) {
                                                // Validar longitud? Si es demasiado largo quizas equivocamos de tramo? 
                                                // Ojo: Si los puntos estan en tramos diferentes esto falahara.
                                                // Asumimos mismo tramo.
     
                                                // Check if points are actually close to this line?
                                                const d1 = turf.pointToLineDistance(startPt, lineGeoJson);
                                                const d2 = turf.pointToLineDistance(endPt, lineGeoJson);
     
                                                if (d1 < 0.1 && d2 < 0.1) { // 100 metros tolerancia? (turf default units kilometers?) yes km. 0.1km = 100m.
                                                    slicedGeoJSON = sliced;
                                                }
                                            }
                                        } catch (err) {
                                            console.warn('Error slicing line for structure:', err);
                                        }
                                    }
                                });
                            }
     
                            // Dibujar la linea (Slice o Recta Fallback)
                            if (slicedGeoJSON) {
                                const sliceLayer = L.geoJSON(slicedGeoJSON, {
                                    style: { color: '#FFFF00', weight: 6, opacity: 0.9 } // Amarillo brillante
                                }).addTo(mapDataLayer);
                                sliceLayer.bindPopup(`<b>Tramo Estructura:</b> ${formatProgresiva(alcantarilla.progresiva_inicio)} - ${formatProgresiva(alcantarilla.progresiva_final)}`);
                            } else {
                                // Fallback: Linea Recta
                                const polyline = L.polyline([
                                    [alcantarilla.latitud_inicio, alcantarilla.longitud_inicio],
                                    [alcantarilla.latitud_final, alcantarilla.longitud_final]
                                ], { color: '#FFFF00', weight: 6, dashArray: '10, 10' }).addTo(mapDataLayer);
                                polyline.bindPopup(`<b>Tramo Estructura:</b> ${formatProgresiva(alcantarilla.progresiva_inicio)} - ${formatProgresiva(alcantarilla.progresiva_final)}`);
                            }
                            */


                            // --- B. Dibujar Marcadores Inicio/Fin ---
                            // --- B. Dibujar Marcadores Inicio/Fin ---
                            const createMarker = (lat, lon, label, isStart) => {
                                // Start: Triángulo Verde, End: Cuadrado Rojo
                                const html = isStart
                                    ? `<div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 20px solid #00FF00; filter: drop-shadow(0px 0px 2px black);"></div>`
                                    : `<div style="background-color:#FF0000; width:16px; height:16px; border:2px solid white; box-shadow: 0 0 4px black;"></div>`;

                                const icon = L.divIcon({
                                    className: 'custom-div-icon',
                                    html: html,
                                    iconSize: [20, 20],
                                    iconAnchor: [10, 10]
                                });
                                const m = L.marker([lat, lon], { icon: icon, zIndexOffset: 1000 }).addTo(mapDataLayer);

                                // USAR POPUP REACTIVO (CON CARRUSEL)
                                // Bind del container compartido
                                m.bindPopup(popupContainer, { minWidth: 200, maxWidth: 300 });

                                m.on('popupopen', () => {
                                    // Construct the popup data object
                                    const popupData = {
                                        ...alcantarilla,
                                        typeLabel: 'Estructura Existente',
                                        idValue: `${formatProgresiva(alcantarilla.progresiva_inicio)} - ${formatProgresiva(alcantarilla.progresiva_final)}`, // Combined range for clarity
                                        images: alcantarilla.images || alcantarilla.imageUrls || [] // Ensure images are passed
                                    };
                                    setActivePopup(popupData);
                                });

                                m.on('popupclose', () => {
                                    setActivePopup(null);
                                });

                                // Restore click functionality for "zoom" or selection in parent
                                m.on('click', (e) => {
                                    L.DomEvent.stop(e); // Prevent map click (which closes popups)
                                    if (onElementoClick) {
                                        onElementoClick(alcantarilla);
                                    }
                                });

                                return m;
                            };

                            // Store ref for zooming (using the first marker - start)
                            // We can store the start marker as the reference for the structure
                            // Access the start marker via the createMarker return value (we'll capture the first one)
                            // But createMarker is void in my previous valid code, wait, I made it return m in the LAST edit.

                            // Re-structure to be clean:
                            const mStart = createMarker(alcantarilla.latitud_inicio, alcantarilla.longitud_inicio, "Inicio Estructura", true);
                            // createMarker(alcantarilla.latitud_final, alcantarilla.longitud_final, "Fin Estructura", false); // DISABLED by user request to avoid overlap

                            // Add click handler to polyline as well to be safe?
                            // polyline.on('click', ...) if we want line clicks to work.

                            // Store ref for zooming
                            const structureKey = alcantarilla.id_estructura || alcantarilla.id;
                            if (structureKey && mStart) {
                                markerRefMap.current[structureKey] = mStart;
                            }
                        }

                    } else {
                        // Fallback for unknown types or catch-all
                        const elementId = alcantarilla.id || alcantarilla.id_alcantarilla || alcantarilla.id_baden || alcantarilla.id_puente || alcantarilla.id_muro || 'N/A';
                        // Only warn if it's not one of the handled types above
                        if (!['alcantarilla', 'baden', 'puente', 'muro', 'cantera', 'fuente', 'zona_critica'].includes(alcantarilla.type)) {
                            console.warn(`Tipo de elemento desconocido o coordenadas inválidas: ${elementId}`);
                        }
                    }
                });
            };

            renderMarkers();

            if (mapData.length > 0) {
                const latLngs = mapData.map(a => [a.latitud, a.longitud]).filter(p => p[0] !== undefined && p[1] !== undefined);
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
                mapDataLayer.clearLayers();
            };
        } catch (error) {
            console.error('ERROR: Uncaught error in alcantarillas useEffect:', error);
        }
    }, [mapData, map, onShowDetails, graphicsImages]);

    // NEW: Zoom to highlighted element
    useEffect(() => {
        if (highlightedTramoId && map && markerRefMap.current[highlightedTramoId]) {
            const marker = markerRefMap.current[highlightedTramoId];
            const targetLatLng = marker.getLatLng();
            const targetZoom = 18;

            // Calcular nuevo centro para que el punto aparezca más abajo (desplazar centro hacia arriba)
            // Convertir LatLng a Pixels, restar offset en Y, convertir de nuevo
            const targetPoint = map.project(targetLatLng, targetZoom);
            const mapSize = map.getSize();
            const offset = mapSize.y * 0.25; // Desplazar 25% de la altura hacia arriba (el punto baja)

            const newCenterPoint = targetPoint.subtract([0, offset]);
            const newCenterLatLng = map.unproject(newCenterPoint, targetZoom);

            map.flyTo(newCenterLatLng, targetZoom, {
                animate: true,
                duration: 1.5
            });
            // Optional: Open popup
            marker.openPopup();
        }
    }, [highlightedTramoId, map]);

    // === CLASIFICACIÓN DE MATERIALES: Render markers from progresivas using calibration ===
    useEffect(() => {
        if (!map) return;
        if (!mapData || typeof mapData !== 'object' || mapData.tipo !== 'clasificacion_materiales') return;
        if (!mapData.data || mapData.data.length === 0) return;

        const materialesLayer = L.featureGroup().addTo(map);

        // Helper: convert progresiva string to meters
        const progToMeters = (prog) => {
            if (!prog || typeof prog !== 'string') return NaN;
            const cleaned = prog.replace(/km/i, '').trim();
            const parts = cleaned.split('+');
            if (parts.length === 2) {
                const km = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                if (!isNaN(km) && !isNaN(m)) return km * 1000 + m;
            } else if (parts.length === 1) {
                const v = parseInt(parts[0], 10);
                if (!isNaN(v)) return v;
            }
            return NaN;
        };

        // Helper: interpolate a progresiva to a lat/lng using calibration data + KML route
        const getCoordFromProgresiva = (progresiva) => {
            const targetMeters = progToMeters(progresiva);
            if (isNaN(targetMeters)) return null;

            const routeLayer = geoJsonLayerRef.current;
            if (!routeLayer) return null;

            // Get all route sub-layers (tramos)
            const sourceLayers = [];
            routeLayer.eachLayer(l => {
                if (l.feature && l.feature.geometry && (l.feature.geometry.type === 'LineString' || l.feature.geometry.type === 'MultiLineString')) {
                    sourceLayers.push(l);
                }
            });
            if (sourceLayers.length === 0) return null;

            sourceLayers.sort((a, b) => {
                const numA = parseInt((a.feature.properties.name || '0').replace(/[^0-9]/g, ''), 10);
                const numB = parseInt((b.feature.properties.name || '0').replace(/[^0-9]/g, ''), 10);
                return numA - numB;
            });

            const calibData = calibrationDataRef.current;

            if (calibData) {
                // Calibrated mode: find the tramo that contains this progresiva
                for (const layer of sourceLayers) {
                    const tramoName = layer.feature.properties.name;
                    const calib = calibData[tramoName];
                    if (calib && calib.start && calib.end) {
                        const startM = progToMeters(calib.start);
                        const endM = progToMeters(calib.end);
                        if (targetMeters >= startM && targetMeters <= endM) {
                            const officialLength = endM - startM;
                            const distInTramo = targetMeters - startM;
                            const ratio = officialLength === 0 ? 0 : distInTramo / officialLength;

                            const tramoLatLngs = layer.getLatLngs();
                            let geoLength = 0;
                            for (let i = 0; i < tramoLatLngs.length - 1; i++) {
                                geoLength += tramoLatLngs[i].distanceTo(tramoLatLngs[i + 1]);
                            }
                            const targetGeoDist = geoLength * ratio;

                            let acc = 0;
                            for (let i = 0; i < tramoLatLngs.length - 1; i++) {
                                const segLen = tramoLatLngs[i].distanceTo(tramoLatLngs[i + 1]);
                                if (acc + segLen >= targetGeoDist) {
                                    const r = segLen === 0 ? 0 : (targetGeoDist - acc) / segLen;
                                    return {
                                        lat: tramoLatLngs[i].lat + (tramoLatLngs[i + 1].lat - tramoLatLngs[i].lat) * r,
                                        lng: tramoLatLngs[i].lng + (tramoLatLngs[i + 1].lng - tramoLatLngs[i].lng) * r
                                    };
                                }
                                acc += segLen;
                            }
                            // End of tramo
                            const last = tramoLatLngs[tramoLatLngs.length - 1];
                            return { lat: last.lat, lng: last.lng };
                        }
                    }
                }
            } else {
                // Non-calibrated fallback: simple geometric interpolation along entire route
                let allLatLngs = [];
                sourceLayers.forEach(layer => {
                    const latlngs = layer.getLatLngs();
                    if (allLatLngs.length > 0 && allLatLngs[allLatLngs.length - 1].equals(latlngs[0], 1)) {
                        latlngs.shift();
                    }
                    allLatLngs = allLatLngs.concat(latlngs);
                });
                if (allLatLngs.length < 2) return null;

                let totalLength = 0;
                for (let i = 0; i < allLatLngs.length - 1; i++) {
                    totalLength += allLatLngs[i].distanceTo(allLatLngs[i + 1]);
                }
                const targetDist = Math.min(targetMeters, totalLength);
                let acc = 0;
                for (let i = 0; i < allLatLngs.length - 1; i++) {
                    const segLen = allLatLngs[i].distanceTo(allLatLngs[i + 1]);
                    if (acc + segLen >= targetDist) {
                        const r = segLen === 0 ? 0 : (targetDist - acc) / segLen;
                        return {
                            lat: allLatLngs[i].lat + (allLatLngs[i + 1].lat - allLatLngs[i].lat) * r,
                            lng: allLatLngs[i].lng + (allLatLngs[i + 1].lng - allLatLngs[i].lng) * r
                        };
                    }
                    acc += segLen;
                }
                const last = allLatLngs[allLatLngs.length - 1];
                return { lat: last.lat, lng: last.lng };
            }
            return null;
        };

        // Render markers for each material record
        const bounds = [];
        let placed = 0;

        // Slight delay to allow KML to load first
        const timer = setTimeout(() => {
            mapData.data.forEach(item => {
                const prog = item.progresiva || item.name?.split(' - ')[0];
                if (!prog) return;

                const coord = getCoordFromProgresiva(prog);
                if (!coord) return;

                // Determine color
                let fillColor = '#f59e0b'; // amber = Material Suelto
                const desc = (item.cardTitle || '').toLowerCase();
                if (desc.includes('roca fija')) fillColor = '#1e293b';
                else if (desc.includes('roca suelta')) fillColor = '#3b82f6';

                const marker = L.circleMarker([coord.lat, coord.lng], {
                    radius: 7,
                    fillColor: fillColor,
                    color: '#ffffff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                }).addTo(materialesLayer);

                if (item.popupContent) {
                    marker.bindPopup(item.popupContent, { maxWidth: 280, className: 'geolmap-material-popup' });
                }

                bounds.push([coord.lat, coord.lng]);
                placed++;
            });

            if (bounds.length > 0 && map.getContainer()) {
                try {
                    const latLngBounds = L.latLngBounds(bounds);
                    if (latLngBounds.isValid()) {
                        map.fitBounds(latLngBounds, { maxZoom: 14, padding: [20, 20] });
                    }
                } catch (e) { /* ignore bounds errors */ }
            }
            console.log(`[ClasMat] ${placed}/${mapData.data.length} marcadores de materiales colocados en el mapa`);
            
            // --- LEYENDA DE MATERIALES ---
            const existingMatLegend = document.getElementById('geol-mat-legend');
            if (existingMatLegend) existingMatLegend.remove();

            if (placed > 0) {
                const MatLegendControl = L.Control.extend({
                    options: { position: 'bottomleft' },
                    onAdd: function () {
                        const div = L.DomUtil.create('div', 'leaflet-control');
                        div.id = 'geol-mat-legend';
                        div.style.cssText = 'background:white;padding:10px 14px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-family:Inter,sans-serif;font-size:11px;';
                        div.innerHTML = `
                            <div style="font-weight:700;color:#1e40af;margin-bottom:8px;font-size:12px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;">
                                <i class="fas fa-layer-group" style="margin-right:5px;"></i>Leyenda Materiales
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                                <div style="width:12px;height:12px;background:#1e293b;border:1px solid white;border-radius:50%;flex-shrink:0;"></div>
                                <span style="color:#374151;">Roca Fija (RF)</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                                <div style="width:12px;height:12px;background:#3b82f6;border:1px solid white;border-radius:50%;flex-shrink:0;"></div>
                                <span style="color:#374151;">Roca Suelta (RS)</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                                <div style="width:12px;height:12px;background:#f59e0b;border:1px solid white;border-radius:50%;flex-shrink:0;"></div>
                                <span style="color:#374151;">Mat. Suelto (MS)</span>
                            </div>
                        `;
                        L.DomEvent.disableClickPropagation(div);
                        return div;
                    }
                });
                new MatLegendControl().addTo(map);
            }
        }, 2000); // Wait 2s for KML to load

        return () => {
            clearTimeout(timer);
            const existingMatLegend = document.getElementById('geol-mat-legend');
            if (existingMatLegend) existingMatLegend.remove();
            materialesLayer.clearLayers();
            map.removeLayer(materialesLayer);
        };
    }, [mapData, map]);

    return (
        <>
            {createPortal(
                activePopup ? (
                    <div className="geolmap-map-popup-card">
                        <div className="popup-header">
                            {activePopup.typeLabel?.toUpperCase() || 'DETALLE'}
                        </div>

                        <div className="popup-content">
                            <div className="popup-image-container">
                                <ImageGallery
                                    imageProp={activePopup.images}
                                    onShowDetails={() => onShowDetails(activePopup)}
                                    onEnlarge={(img) => setEnlargedImage(img)}
                                />
                            </div>

                            <div className="popup-details-grid">
                                <div className="detail-row">
                                    <span className="label">CÓDIGO:</span>
                                    <span className="value">{activePopup.idValue}</span>
                                </div>
                                {activePopup.estado && (
                                    <div className="detail-row">
                                        <span className="label">ESTADO:</span>
                                        <span className="value">{activePopup.estado}</span>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="label">UBICACIÓN:</span>
                                    <span className="value">{activePopup.progresiva ? `KM ${activePopup.progresiva}` : (activePopup.km ? `KM ${activePopup.km}` : '---')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">COORDENADA:</span>
                                    <span className="value">
                                        {(() => {
                                            if (typeof activePopup.latitud === 'number' && typeof activePopup.longitud === 'number') {
                                                try {
                                                    const { easting, northing, zoneNum, zoneLetter } = fromLatLon(activePopup.latitud, activePopup.longitud);
                                                    return <>{zoneNum}{zoneLetter} {easting.toFixed(2)} E<br />{northing.toFixed(2)} N</>;
                                                } catch (e) {
                                                    return `${activePopup.latitud.toFixed(6)}, ${activePopup.longitud.toFixed(6)}`;
                                                }
                                            }
                                            return '---';
                                        })()}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">CATEGORÍA:</span>
                                    <span className="value">{activePopup.cardTitle}</span>
                                </div>
                                {activePopup.entregable && (
                                    <div className="detail-row">
                                        <span className="label">ENTREGABLE:</span>
                                        <span className="value">{activePopup.entregable}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            className="popup-footer-btn"
                            onClick={() => onShowDetails(activePopup)}
                        >
                            VER DETALLADO
                        </button>
                    </div>
                ) : null,
                popupContainer
            )}
            {enlargedImage && createPortal(
                <ImagePreviewModal image={enlargedImage} onClose={() => setEnlargedImage(null)} />,
                document.body
            )}
            {renderLayerPanel()}
        </>
    );
};

const GeologiaGeoite = ({ tabName, projectId, section = 'geologia', onTramoSelect, highlightedTramoId, height = '700px', mapData, onElementoClick, onRouteLoaded, onShowDetails, graphicsImages, onGeoDataLoaded, activeLayersFilter, focusedFeature, children }) => {
    const [capaAgregadaUrl, setCapaAgregadaUrl] = useState(null);
    const [geojsonData, setGeojsonData] = useState(null);

    // NUEVO: Cargar KML base según proyecto y sección (aislamiento)
    useEffect(() => {
        const fetchKml = async () => {
            if (!projectId || !section) return;
            try {
                const response = await axiosInstance.get(`/api/proyectos/${projectId}/kml`, {
                    params: { section: section }
                });
                if (response.data && response.data.url) {
                    setCapaAgregadaUrl(response.data.url);
                }
            } catch (error) {
                if (error.response && error.response.status !== 404) {
                    console.error("Error cargando KML base de geología:", error);
                }
            }
        };
        fetchKml();
    }, [projectId, section]);

    useEffect(() => {
        const fetchCapa = async () => {
            if (!projectId) return;
            try {
                const url = tabName 
                    ? `/api/proyectos/${projectId}/geologia-capas/${tabName}` 
                    : `/api/proyectos/${projectId}/geologia-capas`;
                
                const res = await axiosInstance.get(url);
                // Si viene del endpoint por tabName, data es un objeto único o null.
                // Si viene del endpoint general, data es un array.
                const rawData = res.data?.data;
                const layers = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);

                if (layers.length > 0) {
                    // Fusionar todos los GeoJSON disponibles de todas las capas subidas a esta pestaña
                    const allFeatures = [];
                    let firstKmlUrl = null;

                    layers.forEach(layer => {
                        if (layer.geojson_data) {
                            let gdata = layer.geojson_data;
                            if (typeof gdata === 'string') {
                                try { gdata = JSON.parse(gdata); } catch (e) { }
                            }
                            if (gdata && gdata.features) {
                                // Asegurarnos de que cada layer conserve su identidad si no la tiene
                                gdata.features.forEach((f, idx) => {
                                    if (!f.properties) f.properties = {};
                                    // Inyectar ID determinista para vinculación entre dashboard y mapa
                                    f._geol_id = `geol_${layer.tab_name || 'raw'}_${idx}`;
                                    if (!f.properties._layer_name) f.properties._layer_name = layer.file_name || 'Capa sin nombre';
                                    f.properties._layer_tab = layer.tab_name || 'Otros';
                                });
                                allFeatures.push(...gdata.features);
                            }
                        }
                        if (!firstKmlUrl && layer.file_url) firstKmlUrl = layer.file_url;
                    });

                    if (allFeatures.length > 0) {
                        const mergedGeoJSON = { type: 'FeatureCollection', features: allFeatures };
                        setGeojsonData(mergedGeoJSON);
                        if (onGeoDataLoaded) onGeoDataLoaded(mergedGeoJSON);
                    } else if (firstKmlUrl) {
                        // Fallback por si hay archivos pero no se pudieron convertir a GeoJSON
                        setCapaAgregadaUrl(firstKmlUrl);
                        setGeojsonData(null);
                        if (onGeoDataLoaded) onGeoDataLoaded(null);
                    }
                } else {
                    setGeojsonData(null);
                    if (onGeoDataLoaded) onGeoDataLoaded(null);
                }
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    // Silencio: es normal que algunas pestañas no tengan capas GeoJSON asociadas
                } else {
                    console.error("Error fetching geologia capas", err);
                }
                setGeojsonData(null);
                if (onGeoDataLoaded) onGeoDataLoaded(null);
            }
        };
        fetchCapa();
    }, [projectId, tabName, onGeoDataLoaded]);

    // Coordenadas para centrar el mapa en Perú, ya que no hay ruta inicial
    const center = [-12, -75];

    return (
        <div className="geolmap-internal-map-container" style={{ height: height, width: '100%', minHeight: 0 }}>
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
                <g dangerouslySetInnerHTML={{ __html: LEGEND_PATTERN_DEFS }} />
            </svg>
            <MapContainer center={center} zoom={6} maxZoom={16} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <LayersControl position="topright" key="layers-v2">
                    <LayersControl.BaseLayer name="Estándar">
                        <TileLayer 
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
                            maxNativeZoom={19}
                            maxZoom={16}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer checked name="Topográfico">
                        <TileLayer 
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" 
                            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/30/">CC-BY-SA</a>)' 
                            maxNativeZoom={17}
                            maxZoom={16}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satélite">
                        <TileLayer 
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' 
                            maxNativeZoom={14}
                            maxZoom={16}
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>
                <MapLogic
                    tabName={tabName}
                    projectId={projectId}
                    section={section}
                    geologiaCapaUrl={capaAgregadaUrl}
                    geologiaGeojsonData={geojsonData}
                    initialRoute={null}
                    onTramoSelect={onTramoSelect}
                    highlightedTramoId={highlightedTramoId}
                    mapData={mapData}
                    onElementoClick={onElementoClick}
                    onRouteLoaded={onRouteLoaded}
                    onShowDetails={onShowDetails}
                    graphicsImages={graphicsImages}
                    activeLayersFilter={activeLayersFilter}
                    focusedFeature={focusedFeature}
                />
                {children}
            </MapContainer>
        </div>
    );
};

export default GeologiaGeoite;
