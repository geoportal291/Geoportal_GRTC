import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FeatureGroup, GeoJSON, MapContainer, ScaleControl, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import { kml } from '@tmcw/togeojson';
import alertify from 'alertifyjs';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import shp from 'shpjs';
import { DOMParser } from 'xmldom';
import axiosInstance from '../../../../../api/axios';
import { useAuth } from '../../../../../data/contexts/AuthContext';
import { usePageTitle } from '../../../../contexts/PageTitleContext';
import './DisenoGeometrico.css';

const ACCEPTED_FILE_TYPES = '.zip,.rar,.kml,.kmz';
const AUTO_SAVE_DELAY_MS = 1500;
const DG_MAX_MAP_ZOOM = 30;
const DG_TABLE_PAGE_SIZE = 25;
const DG_POINT_LABEL_MAX_VISIBLE = 140;
const DG_POINT_LABEL_MIN_ZOOM = 16;
const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY || '';
const BASEMAPS = {
  street: {
    key: 'street',
    label: 'Mapa',
    icon: 'fa-map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19,
    maxZoom: DG_MAX_MAP_ZOOM
  },
  /*
  ortho: {
    key: 'ortho',
    label: 'Ortofoto',
    icon: 'fa-satellite',
    url: MAPTILER_KEY
      ? `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: MAPTILER_KEY
      ? '&copy; MapTiler &copy; OpenStreetMap contributors'
      : 'Tiles &copy; Esri',
    maxNativeZoom: MAPTILER_KEY ? 22 : 19,
    maxZoom: DG_MAX_MAP_ZOOM
  },*/
  hybrid: {
    key: 'hybrid',
    label: 'Hibrido',
    icon: 'fa-layer-group',
    url: MAPTILER_KEY
      ? `https://api.maptiler.com/maps/hybrid-v4/256/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: MAPTILER_KEY
      ? '&copy; MapTiler &copy; OpenStreetMap contributors'
      : 'Tiles &copy; Esri',
    maxNativeZoom: MAPTILER_KEY ? 22 : 19,
    maxZoom: DG_MAX_MAP_ZOOM
  }
};
const STATUS_LABELS = {
  saved: 'Guardado',
  saving: 'Guardando...',
  dirty: 'Cambios sin guardar',
  error: 'Error al guardar'
};
const ATTRIBUTE_COLOR_PALETTE = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#db2777',
  '#0f766e',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#4f46e5',
  '#65a30d'
];
const DG_SELECTION_HIGHLIGHT_CANDIDATES = ['#111827', '#ff00a8', '#00c2ff', '#facc15', '#fb7185', '#14b8a6'];
const ATTRIBUTE_COLOR_OPTIONS = [
  { value: 'descript', label: 'Descript', aliases: ['descript', 'descrip', 'description', 'descripcion'] },
  { value: 'offset', label: 'Offset', aliases: ['offset', 'offsets'] },
  { value: 'eje', label: 'Eje', aliases: ['eje', 'axis'] },
  { value: 'daylight', label: 'Daylight', aliases: ['daylight', 'dylight', 'dylith'] }
];

const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: 'FeatureCollection',
  features: []
});

const DRAW_MARKER_ICON = L.divIcon({
  className: 'dg-draw-marker-icon',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const slugifyTabName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

const cloneGeojson = (value) => JSON.parse(JSON.stringify(value || EMPTY_FEATURE_COLLECTION));
const serializeGeojson = (value) => JSON.stringify(value || EMPTY_FEATURE_COLLECTION);

const parseGeojson = (value) => {
  if (!value) return cloneGeojson(EMPTY_FEATURE_COLLECTION);
  if (typeof value === 'object') return cloneGeojson(value);

  try {
    return cloneGeojson(JSON.parse(value));
  } catch (error) {
    console.warn('No se pudo parsear GeoJSON de Diseño Geometrico:', error);
    return cloneGeojson(EMPTY_FEATURE_COLLECTION);
  }
};

const ensureDisplayFeatureCollection = (value) => {
  if (!value || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    return cloneGeojson(EMPTY_FEATURE_COLLECTION);
  }

  return {
    type: 'FeatureCollection',
    features: value.features
      .filter((feature) => feature?.geometry)
      .map((feature) => cloneGeojson(feature))
  };
};

const getRemoteFileExtension = (value) => {
  if (!value) return '';

  try {
    const parsedUrl = new URL(value, window.location.origin);
    const pathname = decodeURIComponent(parsedUrl.pathname || '').toLowerCase();

    if (pathname.endsWith('.kmz')) return '.kmz';
    if (pathname.endsWith('.zip')) return '.zip';
    if (pathname.endsWith('.kml')) return '.kml';
    return '';
  } catch (error) {
    const normalizedValue = String(value).toLowerCase();
    if (normalizedValue.endsWith('.kmz')) return '.kmz';
    if (normalizedValue.endsWith('.zip')) return '.zip';
    if (normalizedValue.endsWith('.kml')) return '.kml';
    return '';
  }
};

const parseKmlTextToFeatureCollection = (xmlText) =>
  ensureDisplayFeatureCollection(kml(new DOMParser().parseFromString(typeof xmlText === 'string' ? xmlText : '', 'text/xml')));

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** unitIndex);

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
};

const formatRemainingTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Calculando...';
  if (seconds < 60) return `${Math.ceil(seconds)} s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return `${minutes} min ${remainingSeconds.toString().padStart(2, '0')} s`;
};

const canParseStoredKmlText = (value) => {
  if (typeof value !== 'string') return false;

  const trimmedValue = value.trim();
  if (!trimmedValue) return false;
  if (trimmedValue === 'CONTENIDO_BINARIO_ZIP_SHAPEFILE') return false;

  return trimmedValue.startsWith('<');
};

const flattenFeatureCollections = (value) => {
  if (Array.isArray(value)) {
    return ensureDisplayFeatureCollection({
      type: 'FeatureCollection',
      features: value.flatMap((item) => (Array.isArray(item?.features) ? item.features : []))
    });
  }

  return ensureDisplayFeatureCollection(value);
};

const loadProjectReferenceGeojson = async (referenceUrl) => {
  const extension = getRemoteFileExtension(referenceUrl);

  if (extension === '.zip') {
    const response = await axiosInstance.get('/api/proxy', {
      params: { url: referenceUrl },
      responseType: 'arraybuffer'
    });

    return flattenFeatureCollections(await shp(response.data));
  }

  if (extension === '.kmz') {
    const response = await axiosInstance.get('/api/proxy', {
      params: { url: referenceUrl },
      responseType: 'arraybuffer'
    });
    const zip = await JSZip.loadAsync(response.data);
    const kmlEntry = Object.values(zip.files).find((file) => !file.dir && file.name.toLowerCase().endsWith('.kml'));

    if (!kmlEntry) {
      throw new Error('El archivo KMZ no contiene un KML legible');
    }

    return parseKmlTextToFeatureCollection(await kmlEntry.async('text'));
  }

  const response = await axiosInstance.get('/api/proxy', {
    params: { url: referenceUrl },
    responseType: 'text'
  });

  return parseKmlTextToFeatureCollection(response.data);
};

const getFeatureId = (feature) => feature?.properties?.dg_feature_id || '';

const getFeatureType = (feature) => {
  const explicitType = feature?.properties?.dg_type;
  if (explicitType) return explicitType;

  const geometryType = feature?.geometry?.type || '';
  if (geometryType.includes('Point')) return 'point';
  if (geometryType.includes('Line')) return 'line';
  if (geometryType.includes('Polygon')) return 'polygon';
  return 'feature';
};

const getFeatureLabel = (feature) => {
  const featureType = getFeatureType(feature);
  if (featureType === 'point') return 'Punto';
  if (featureType === 'line') return 'Linea';
  if (featureType === 'circle') return 'Circulo';
  if (featureType === 'rectangle') return 'Rectangulo';
  if (featureType === 'polygon') return 'Poligono';
  return feature?.geometry?.type || 'Geometria';
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const getFeatureCount = (layer) => {
  const geojson = parseGeojson(layer?.geojson_data);
  return Array.isArray(geojson.features) ? geojson.features.length : 0;
};

const getLayerGroupKey = (tabName) => String(tabName || '').replace(/__part_\d+$/i, '');

const getLayerGroupLabel = (layer) =>
  String(layer?.file_name || layer?.tab_name || 'Sin nombre')
    .replace(/\s*\(Parte\s+\d+\/\d+\)\s*$/i, '')
    .trim();

const getPointLabelConfig = (collection) => {
  const meta = collection?.dg_meta && typeof collection.dg_meta === 'object' ? collection.dg_meta : {};
  const fields = Array.isArray(meta.pointLabelFields)
    ? meta.pointLabelFields.filter(Boolean)
    : (meta.pointLabelField ? [meta.pointLabelField] : []);
  const modes = Array.isArray(meta.pointLabelModes)
    ? meta.pointLabelModes.filter(Boolean)
    : (meta.pointLabelMode ? [meta.pointLabelMode] : ['none']);

  return {
    field: fields[0] || '',
    mode: modes[0] || 'none',
    fields,
    modes
  };
};

const isPointFeature = (feature) => feature?.geometry?.type?.includes('Point');
const isLineFeature = (feature) => feature?.geometry?.type?.includes('Line');

const countPointFeatures = (collection) =>
  Array.isArray(collection?.features)
    ? collection.features.reduce((total, feature) => (
      isPointFeature(feature) ? total + 1 : total
    ), 0)
    : 0;

const resolveEffectivePointLabelConfig = (collection, labelConfig, mapZoom) => {
  if (!labelConfig?.fields?.length || !labelConfig?.modes?.length || labelConfig.modes.includes('none')) {
    return labelConfig;
  }

  const pointCount = countPointFeatures(collection);
  const shouldReduceLabels = pointCount > DG_POINT_LABEL_MAX_VISIBLE && mapZoom < DG_POINT_LABEL_MIN_ZOOM;

  if (!shouldReduceLabels || labelConfig.modes.includes('tagged')) {
    return labelConfig;
  }

  return {
    ...labelConfig,
    mode: 'selected',
    modes: labelConfig.modes.includes('hover') ? ['selected', 'hover'] : ['selected']
  };
};

const resolveLabelValuesFromFields = (feature, fields) => {
  if (!Array.isArray(fields) || !fields.length) return [];

  const properties = feature?.properties || {};
  return fields
    .map((field) => {
      const rawValue = properties[field];
      if (rawValue === null || rawValue === undefined || rawValue === '') return '';
      return String(rawValue);
    })
    .filter(Boolean);
};

const resolveLabelEntriesFromFields = (feature, fields) => {
  if (!Array.isArray(fields) || !fields.length) return [];

  const properties = feature?.properties || {};
  return fields
    .map((field) => {
      const rawValue = properties[field];
      if (rawValue === null || rawValue === undefined || rawValue === '') return null;
      return { field, value: String(rawValue) };
    })
    .filter(Boolean);
};

const buildVerticalLabelHtml = (entries) => {
  if (!entries.length) return '';
  return entries
    .map((e) => `<span class="dg-label-row"><b>${e.field}:</b> ${e.value}</span>`)
    .join('');
};

const buildVerticalLabelPlainText = (entries) => {
  if (!entries.length) return '';
  return entries.map((e) => `${e.field}: ${e.value}`).join('\n');
};

const resolvePointLabelText = (feature, labelConfig, isSelected) => {
  if (!isPointFeature(feature)) return '';
  const entries = resolveLabelEntriesFromFields(feature, labelConfig?.fields);
  if (!entries.length) return '';

  if (labelConfig.modes?.includes('all')) {
    return buildVerticalLabelHtml(entries);
  }

  if (labelConfig.modes?.includes('selected') && isSelected) {
    return buildVerticalLabelHtml(entries);
  }

  if (labelConfig.modes?.includes('tagged') && (feature?.properties || {}).dg_label_pinned) {
    return buildVerticalLabelHtml(entries);
  }

  return '';
};

const resolvePointLabelLineCount = (feature, labelConfig, isSelected) => {
  if (!isPointFeature(feature)) return 0;
  const entries = resolveLabelEntriesFromFields(feature, labelConfig?.fields);
  if (!entries.length) return 0;

  if (labelConfig.modes?.includes('all')) return entries.length;
  if (labelConfig.modes?.includes('selected') && isSelected) return entries.length;
  if (labelConfig.modes?.includes('tagged') && (feature?.properties || {}).dg_label_pinned) return entries.length;
  return 0;
};

const resolveLineLabelText = (feature, labelConfig, isSelected) => {
  if (!isLineFeature(feature)) return '';
  if (!isSelected) return '';

  const entries = resolveLabelEntriesFromFields(feature, labelConfig?.fields);
  return buildVerticalLabelPlainText(entries);
};

const normalizeAttributeToken = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const getLayerSwatchColor = (layer) => {
  const geojson = parseGeojson(layer?.geojson_data);
  const firstFeature = Array.isArray(geojson?.features)
    ? geojson.features.find((feature) => feature?.geometry && feature?.properties?.stroke)
    || geojson.features.find((feature) => feature?.geometry)
    : null;

  return firstFeature?.properties?.stroke || firstFeature?.properties?.fill || '#32b17e';
};

const createFeatureId = () => `dg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getDefaultStyleByType = (featureType) => {
  if (featureType === 'point') {
    return { stroke: '#dc2626', 'stroke-width': 2, 'stroke-opacity': 1, fill: '#ef4444', 'fill-opacity': 1 };
  }

  if (featureType === 'line') {
    return { stroke: '#1e88e5', 'stroke-width': 4, 'stroke-opacity': 1, fill: '#1e88e5', 'fill-opacity': 0 };
  }

  if (featureType === 'circle') {
    return { stroke: '#f59e0b', 'stroke-width': 3, 'stroke-opacity': 1, fill: '#fde68a', 'fill-opacity': 0.3 };
  }

  return { stroke: '#22c55e', 'stroke-width': 3, 'stroke-opacity': 1, fill: '#86efac', 'fill-opacity': 0.35 };
};

const normalizeColorToken = (value) => String(value || '').trim().toLowerCase();

const resolveSelectionHighlightColor = (collection) => {
  const usedColors = new Set();

  if (Array.isArray(collection?.features)) {
    collection.features.forEach((feature) => {
      const properties = feature?.properties || {};
      if (properties.stroke) {
        usedColors.add(normalizeColorToken(properties.stroke));
      }
      if (properties.fill) {
        usedColors.add(normalizeColorToken(properties.fill));
      }
    });
  }

  return DG_SELECTION_HIGHLIGHT_CANDIDATES.find((color) => !usedColors.has(normalizeColorToken(color))) || '#111827';
};

const syncCircleProperties = (feature) => {
  if (getFeatureType(feature) !== 'circle' || !feature?.geometry) {
    return feature;
  }

  try {
    const centroid = turf.centroid(feature);
    const [longitude, latitude] = centroid.geometry.coordinates || [];
    const area = turf.area(feature);

    return {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        dg_radius_m: area > 0 ? Math.sqrt(area / Math.PI) : 0,
        dg_center_lng: longitude,
        dg_center_lat: latitude
      }
    };
  } catch (error) {
    return feature;
  }
};

const normalizeFeature = (feature, index = 0) => {
  const normalizedFeature = cloneGeojson(feature);
  normalizedFeature.type = 'Feature';
  normalizedFeature.properties = normalizedFeature.properties || {};
  normalizedFeature.geometry = normalizedFeature.geometry || null;

  const featureType = getFeatureType(normalizedFeature);
  const styleDefaults = getDefaultStyleByType(featureType);

  normalizedFeature.properties.dg_feature_id = normalizedFeature.properties.dg_feature_id || createFeatureId();
  normalizedFeature.properties.dg_type = featureType;
  normalizedFeature.properties.dg_created_at = normalizedFeature.properties.dg_created_at || new Date().toISOString();
  normalizedFeature.properties.dg_name =
    normalizedFeature.properties.dg_name ||
    normalizedFeature.properties.nombre ||
    normalizedFeature.properties.name ||
    `${getFeatureLabel(normalizedFeature)} ${index + 1}`;
  normalizedFeature.properties.nombre = normalizedFeature.properties.dg_name;
  normalizedFeature.properties.visible = normalizedFeature.properties.visible !== false;
  normalizedFeature.properties.stroke = normalizedFeature.properties.stroke || styleDefaults.stroke;
  normalizedFeature.properties['stroke-width'] = Number(normalizedFeature.properties['stroke-width']) || styleDefaults['stroke-width'];
  normalizedFeature.properties['stroke-opacity'] = Number(normalizedFeature.properties['stroke-opacity'] ?? styleDefaults['stroke-opacity']);
  normalizedFeature.properties.fill = normalizedFeature.properties.fill || styleDefaults.fill;
  normalizedFeature.properties['fill-opacity'] = Number(normalizedFeature.properties['fill-opacity'] ?? styleDefaults['fill-opacity']);

  return syncCircleProperties(normalizedFeature);
};

const normalizeFeatureCollection = (value) => {
  if (!value || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    return cloneGeojson(EMPTY_FEATURE_COLLECTION);
  }

  const normalizedCollection = {
    type: 'FeatureCollection',
    features: value.features.filter((feature) => feature?.geometry).map((feature, index) => normalizeFeature(feature, index))
  };

  if (value?.dg_meta && typeof value.dg_meta === 'object') {
    normalizedCollection.dg_meta = cloneGeojson(value.dg_meta);
  }

  return normalizedCollection;
};

const createPointIcon = (feature, isSelected, labelConfig = null) => {
  const color = feature?.properties?.fill || feature?.properties?.stroke || '#ef4444';
  const markerSize = Math.max(8, Number(feature?.properties?.dg_marker_size) || 14);
  const selectedBorder = isSelected ? 4 : 3;
  const iconSize = markerSize + selectedBorder * 2;
  const labelText = resolvePointLabelText(feature, labelConfig, isSelected);
  const labelLines = resolvePointLabelLineCount(feature, labelConfig, isSelected);
  const labelHeight = labelLines > 0 ? 16 + labelLines * 22 : 0;
  const totalHeight = labelText ? labelHeight + 8 + iconSize : iconSize;
  const totalWidth = Math.max(iconSize, labelText ? 200 : iconSize);
  const anchorX = totalWidth / 2;
  const anchorY = totalHeight - iconSize / 2;
  const selectedGlow = isSelected
    ? `box-shadow: 0 0 0 6px rgba(15,143,149,0.3), 0 0 14px rgba(15,143,149,0.25), 0 0 0 2px #ffffff;`
    : `box-shadow: 0 8px 16px rgba(15,23,42,0.22);`;
  return L.divIcon({
    className: `dg-point-icon${isSelected ? ' dg-point-selected' : ''}`,
    html: `<div class="dg-point-icon-body">
      ${labelText ? `<em class="dg-point-icon-label">
        <button class="dg-label-close-btn" onclick="event.stopPropagation(); window.__dgCloseLabel &amp;&amp; window.__dgCloseLabel()" title="Cerrar">&times;</button>
        ${labelText}
      </em>` : ''}
      <span class="dg-point-dot${isSelected ? ' dg-dot-selected' : ''}" style="width:${markerSize}px; height:${markerSize}px; background:${color}; border:${selectedBorder}px solid #ffffff; ${selectedGlow}"></span>
    </div>`,
    iconSize: [totalWidth, totalHeight],
    iconAnchor: [anchorX, anchorY]
  });
};

const getProjectReferenceStyle = (feature) => {
  const geometryType = feature?.geometry?.type || '';

  if (geometryType.includes('Line')) {
    return {
      color: '#f97316',
      weight: 4,
      opacity: 0.95,
      dashArray: '16 10',
      lineCap: 'round'
    };
  }

  if (geometryType.includes('Polygon')) {
    return {
      color: '#f97316',
      weight: 3,
      opacity: 0.9,
      fillColor: '#fdba74',
      fillOpacity: 0.1,
      dashArray: '12 8'
    };
  }

  return {
    color: '#f97316',
    weight: 2,
    opacity: 1,
    fillColor: '#fff7ed',
    fillOpacity: 1
  };
};

const getVectorStyle = (feature, isSelected, selectionHighlightColor = '#111827') => {
  const properties = feature?.properties || {};
  const strokeWidth = Math.max(1, Number(properties['stroke-width']) || 3);
  const strokeOpacity = Number(properties['stroke-opacity'] ?? 1);
  const fillOpacity = Number(properties['fill-opacity'] ?? 0.35);
  const isSelectedLine = isSelected && isLineFeature(feature);

  return {
    color: isSelectedLine ? selectionHighlightColor : (properties.stroke || '#1e88e5'),
    weight: isSelected ? Math.max(strokeWidth + (isSelectedLine ? 2 : 1), 3) : strokeWidth,
    opacity: isSelected ? 1 : strokeOpacity,
    fillColor: properties.fill || properties.stroke || '#86efac',
    fillOpacity: feature?.geometry?.type?.includes('Polygon') ? (isSelected ? Math.min(fillOpacity + 0.12, 0.7) : fillOpacity) : 0,
    dashArray: isSelectedLine ? '12 8' : (isSelected ? '8 6' : null)
  };
};

const applyLayerStyle = (layer, feature, isSelected, labelConfig = null, selectionHighlightColor = '#111827') => {
  if (!layer || !feature) return;

  if (typeof layer.setStyle === 'function') {
    layer.setStyle(getVectorStyle(feature, isSelected, selectionHighlightColor));
  }

  if (typeof layer.setIcon === 'function' && typeof layer.getLatLng === 'function') {
    layer.setIcon(createPointIcon(feature, isSelected, labelConfig));
    if (typeof layer.setZIndexOffset === 'function') {
      layer.setZIndexOffset(isSelected ? 1000 : 0);
    }

    const hoverEntries = (!isSelected && labelConfig?.modes?.includes('hover'))
      ? resolveLabelEntriesFromFields(feature, labelConfig?.fields)
      : [];
    const hoverLabelHtml = hoverEntries.length
      ? `<div class="dg-hover-label-vertical">${hoverEntries.map((e) => `<span><b>${e.field}:</b> ${e.value}</span>`).join('')}</div>`
      : '';

    if (isSelected && layer.getTooltip()) {
      layer.closeTooltip();
      layer.unbindTooltip();
    } else if (hoverLabelHtml) {
      const tooltipOptions = {
        permanent: false,
        direction: 'top',
        className: 'dg-point-hover-tooltip',
        opacity: 0.96
      };

      if (layer.getTooltip()) {
        layer.setTooltipContent(hoverLabelHtml);
      } else {
        layer.bindTooltip(hoverLabelHtml, tooltipOptions);
      }
    } else if (layer.getTooltip()) {
      layer.closeTooltip();
      layer.unbindTooltip();
    }
  }

  if (typeof layer.bindTooltip === 'function' && !layer.getLatLng && isLineFeature(feature)) {
    const lineLabelText = resolveLineLabelText(feature, labelConfig, isSelected);

    if (lineLabelText) {
      const tooltipOptions = {
        permanent: true,
        direction: 'center',
        className: 'dg-line-label-tooltip',
        opacity: 0.96
      };

      if (layer.getTooltip()) {
        layer.setTooltipContent(lineLabelText);
      } else {
        layer.bindTooltip(lineLabelText, tooltipOptions);
      }

      layer.openTooltip();
    } else if (layer.getTooltip()) {
      layer.closeTooltip();
      layer.unbindTooltip();
    }
  }

  if (typeof layer.eachLayer === 'function' && !layer.getLatLng && !layer.setStyle) {
    layer.eachLayer((childLayer) => applyLayerStyle(childLayer, feature, isSelected, labelConfig, selectionHighlightColor));
  }
};

const getLayerBounds = (geojsonOrFeature) => {
  try {
    const bounds = L.geoJSON(geojsonOrFeature).getBounds();
    return bounds.isValid() ? bounds : null;
  } catch (error) {
    console.warn('No se pudieron calcular los limites del mapa:', error);
    return null;
  }
};

const getFeatureMetrics = (feature) => {
  if (!feature?.geometry) {
    return { lengthKm: 0, areaHa: 0, perimeterKm: 0, summary: '-' };
  }

  const geometryType = feature.geometry.type || '';

  if (geometryType.includes('Point')) {
    return { lengthKm: 0, areaHa: 0, perimeterKm: 0, summary: '-' };
  }

  if (geometryType.includes('Line')) {
    try {
      const lengthKm = turf.length(feature, { units: 'kilometers' });
      return { lengthKm, areaHa: 0, perimeterKm: 0, summary: `${lengthKm.toFixed(2)} km` };
    } catch (error) {
      return { lengthKm: 0, areaHa: 0, perimeterKm: 0, summary: '-' };
    }
  }

  if (!geometryType.includes('Polygon')) {
    return { lengthKm: 0, areaHa: 0, perimeterKm: 0, summary: '-' };
  }

  try {
    const areaHa = turf.area(feature) / 10000;
    const polygonLine = turf.polygonToLine(feature);
    const perimeterKm = polygonLine.type === 'FeatureCollection'
      ? polygonLine.features.reduce((total, item) => total + turf.length(item, { units: 'kilometers' }), 0)
      : turf.length(polygonLine, { units: 'kilometers' });

    return { lengthKm: 0, areaHa, perimeterKm, summary: `${areaHa.toFixed(2)} ha` };
  } catch (error) {
    return { lengthKm: 0, areaHa: 0, perimeterKm: 0, summary: '-' };
  }
};

const getFeatureCoordinates = (feature) => {
  if (!feature?.geometry) {
    return { latitude: '-', longitude: '-' };
  }

  if (feature.geometry.type === 'Point') {
    const [longitude, latitude] = feature.geometry.coordinates || [];
    return {
      latitude: typeof latitude === 'number' ? latitude.toFixed(6) : '-',
      longitude: typeof longitude === 'number' ? longitude.toFixed(6) : '-'
    };
  }

  if (getFeatureType(feature) === 'circle') {
    const latitude = feature?.properties?.dg_center_lat;
    const longitude = feature?.properties?.dg_center_lng;
    return {
      latitude: typeof latitude === 'number' ? latitude.toFixed(6) : '-',
      longitude: typeof longitude === 'number' ? longitude.toFixed(6) : '-'
    };
  }

  try {
    const centroid = turf.centroid(feature);
    const [longitude, latitude] = centroid.geometry.coordinates || [];
    return {
      latitude: typeof latitude === 'number' ? latitude.toFixed(6) : '-',
      longitude: typeof longitude === 'number' ? longitude.toFixed(6) : '-'
    };
  } catch (error) {
    return { latitude: '-', longitude: '-' };
  }
};

const getFeatureSourceAttributes = (feature) => {
  const properties = feature?.properties || {};
  const hiddenKeys = new Set([
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'fill',
    'fill-opacity',
    'visible',
    'nombre',
    'name'
  ]);

  return Object.entries(properties).filter(([key, value]) => (
    !String(key).startsWith('dg_')
    && !hiddenKeys.has(key)
    && value !== null
    && value !== undefined
    && value !== ''
  ));
};

const findFeatureAttributeEntry = (feature, aliases = []) => {
  if (!aliases.length) return null;

  const aliasSet = new Set(aliases.map(normalizeAttributeToken));
  return getFeatureSourceAttributes(feature).find(([key]) => aliasSet.has(normalizeAttributeToken(key))) || null;
};

const getFeatureAttributeValue = (feature, aliases = []) => {
  const match = findFeatureAttributeEntry(feature, aliases);
  return match ? match[1] : '';
};

const getFeatureAttributeValueByRule = (feature, selectedLayerColorOption) => {
  if (!selectedLayerColorOption) return '';

  if ('aliases' in selectedLayerColorOption) {
    return getFeatureAttributeValue(feature, selectedLayerColorOption.aliases);
  }

  return feature?.properties?.[selectedLayerColorOption.key] || '';
};

const featureToPopupHtml = (feature) => {
  const entries = getFeatureSourceAttributes(feature);

  if (!entries.length) {
    return '<div class="dg-popup-empty">Sin atributos disponibles</div>';
  }

  return `
    <div class="dg-popup-table">
      ${entries.slice(0, 10).map(([key, value]) => `
        <div class="dg-popup-row">
          <span class="dg-popup-key">${key}</span>
          <span class="dg-popup-value">${String(value)}</span>
        </div>
      `).join('')}
    </div>
  `;
};

const createMaptilerDataset = (geojsonData) => {
  const features = Array.isArray(geojsonData?.features) ? geojsonData.features : [];

  return {
    points: {
      type: 'FeatureCollection',
      features: features.filter((feature) => feature?.geometry?.type?.includes('Point'))
    },
    lines: {
      type: 'FeatureCollection',
      features: features.filter((feature) => feature?.geometry?.type?.includes('Line'))
    },
    polygons: {
      type: 'FeatureCollection',
      features: features.filter((feature) => feature?.geometry?.type?.includes('Polygon'))
    }
  };
};

const getCombinedBoundsFeatureCollection = (...collections) => {
  const features = collections.flatMap((collection) => (
    Array.isArray(collection?.features) ? collection.features.filter((feature) => feature?.geometry) : []
  ));

  return {
    type: 'FeatureCollection',
    features
  };
};

const MaptilerTerrainMap = React.memo(function MaptilerTerrainMap({
  activeGeojson,
  projectReferenceGeojson,
  showProjectReference
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const terrainEnabledRef = useRef(false);
  const sdkRef = useRef(null);
  const [isThreeDLoading, setIsThreeDLoading] = useState(Boolean(MAPTILER_KEY));

  useEffect(() => {
    if (!containerRef.current || !MAPTILER_KEY) return undefined;

    let cancelled = false;
    let localMap = null;

    const setupMap = async () => {
      setIsThreeDLoading(true);
      const sdkModule = await import('@maptiler/sdk');
      await import('@maptiler/sdk/dist/maptiler-sdk.css');

      if (cancelled || !containerRef.current) return;

      const sdk = sdkModule;
      sdk.config.apiKey = MAPTILER_KEY;
      sdkRef.current = sdk;

      localMap = new sdk.Map({
        container: containerRef.current,
        style: sdk.MapStyle.SATELLITE,
        center: [-77.0428, -12.0464],
        zoom: 12,
        pitch: 0,
        bearing: 0,
        maxPitch: 60,
        terrain: false,
        hash: false,
        navigationControl: false,
        terrainControl: false,
        geolocateControl: false,
        scaleControl: false,
        attributionControl: true,
        fadeDuration: 0,
        canvasContextAttributes: {
          antialias: false,
          powerPreference: 'low-power'
        }
      });

      const ensureLayer = (layerId, sourceId, type, paint) => {
        if (localMap.getLayer(layerId)) return;
        localMap.addLayer({
          id: layerId,
          type,
          source: sourceId,
          paint
        });
      };

      const apply3dView = (enabled) => {
        if (enabled) {
          localMap.enableTerrain(1.12);
          localMap.easeTo({ pitch: 54, bearing: 0, duration: 700 });
        } else {
          localMap.easeTo({ pitch: 0, bearing: 0, duration: 520 });
          window.setTimeout(() => {
            if (mapRef.current === localMap) {
              localMap.disableTerrain();
            }
          }, 540);
        }

        terrainEnabledRef.current = enabled;
      };

      const ThreeDToggleControl = function () { };
      ThreeDToggleControl.prototype.onAdd = function () {
        const container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dg-maptiler-terrain-btn';
        button.title = 'Alternar vista 3D';
        button.innerHTML = '<i class="fas fa-layer-group"></i>';
        button.onclick = () => {
          const nextEnabled = !terrainEnabledRef.current;
          apply3dView(nextEnabled);
          button.classList.toggle('active', nextEnabled);
        };

        container.appendChild(button);
        return container;
      };
      ThreeDToggleControl.prototype.onRemove = function () { };

      localMap.on('load', () => {
        localMap.addControl(new sdk.NavigationControl(), 'top-left');
        localMap.addControl(new ThreeDToggleControl(), 'top-left');

        localMap.addSource('dg-active-points', { type: 'geojson', data: createMaptilerDataset(activeGeojson).points, tolerance: 1.5, maxzoom: 14 });
        localMap.addSource('dg-active-lines', { type: 'geojson', data: createMaptilerDataset(activeGeojson).lines, tolerance: 2.0, maxzoom: 14 });
        localMap.addSource('dg-active-polygons', { type: 'geojson', data: createMaptilerDataset(activeGeojson).polygons, tolerance: 2.0, maxzoom: 14 });
        localMap.addSource('dg-project-reference', { type: 'geojson', data: projectReferenceGeojson, tolerance: 2.5, maxzoom: 14 });

        ensureLayer('dg-active-polygon-fill', 'dg-active-polygons', 'fill', {
          'fill-color': ['coalesce', ['get', 'fill'], ['get', 'stroke'], '#86efac'],
          'fill-opacity': 0.14
        });
        ensureLayer('dg-active-polygon-line', 'dg-active-polygons', 'line', {
          'line-color': ['coalesce', ['get', 'stroke'], '#1e88e5'],
          'line-width': ['coalesce', ['get', 'stroke-width'], 2.5]
        });
        ensureLayer('dg-active-line', 'dg-active-lines', 'line', {
          'line-color': ['coalesce', ['get', 'stroke'], '#1e88e5'],
          'line-width': ['coalesce', ['get', 'stroke-width'], 2.5]
        });
        ensureLayer('dg-active-point', 'dg-active-points', 'circle', {
          'circle-radius': 4.5,
          'circle-color': ['coalesce', ['get', 'fill'], ['get', 'stroke'], '#ef4444'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5
        });
        ensureLayer('dg-project-reference-line', 'dg-project-reference', 'line', {
          'line-color': '#f97316',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        });

        const boundsCollection = getCombinedBoundsFeatureCollection(
          activeGeojson,
          showProjectReference ? projectReferenceGeojson : null
        );



        if (boundsCollection.features.length) {
          const [minX, minY, maxX, maxY] = turf.bbox(boundsCollection);
          localMap.fitBounds([[minX, minY], [maxX, maxY]], { padding: 48, duration: 0 });
        }

        setIsThreeDLoading(false);
      });

      mapRef.current = localMap;
    };

    setupMap().catch((error) => {
      console.error('No se pudo cargar la vista 3D de MapTiler:', error);
      if (!cancelled) {
        setIsThreeDLoading(false);
      }
    });

    return () => {
      cancelled = true;
      terrainEnabledRef.current = false;
      mapRef.current = null;
      if (localMap) {
        localMap.remove();
      }
    };
  }, []);

  useEffect(() => {

    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) return;

    const activeData = createMaptilerDataset(activeGeojson);

    const update = () => {
      const setSourceData = (sourceId, data) => {
        const source = map.getSource(sourceId);
        if (source) {
          source.setData(data);
        }
      };

      setSourceData('dg-active-points', activeData.points);
      setSourceData('dg-active-lines', activeData.lines);
      setSourceData('dg-active-polygons', activeData.polygons);
      setSourceData('dg-project-reference', showProjectReference ? projectReferenceGeojson : cloneGeojson(EMPTY_FEATURE_COLLECTION));
    };

    if (map.loaded()) {
      update();
    } else {
      map.once('load', update);
    }
  }, [activeGeojson, projectReferenceGeojson, showProjectReference]);

  if (!MAPTILER_KEY) {
    return (
      <div className="dg-map-empty">
        <div>
          <h2>Vista 3D no disponible</h2>
          <p>Configura `REACT_APP_MAPTILER_KEY` para habilitar el modo 3D de MapTiler.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dg-map dg-maptiler-3d">
      <div ref={containerRef} className="dg-maptiler-3d-canvas"></div>
      {isThreeDLoading && (
        <div className="dg-maptiler-loading">
          <div>
            <strong>Cargando vista 3D</strong>
            <span>Optimizando el mapa para esta sesion...</span>
          </div>
        </div>
      )}
    </div>
  );
});

function MapLifecycle({ mapRef, measurementLayerRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    if (measurementLayerRef.current && !map.hasLayer(measurementLayerRef.current)) {
      measurementLayerRef.current.addTo(map);
    }

    return () => {
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef, measurementLayerRef]);

  useEffect(() => {
    if (!map) return undefined;

    const container = map.getContainer();
    let frameId = null;
    let timeoutId = null;

    const syncMapSize = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false, animate: false });
      });
    };

    syncMapSize();
    timeoutId = window.setTimeout(syncMapSize, 280);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        syncMapSize();
      });
      resizeObserver.observe(container);
      if (container.parentElement) {
        resizeObserver.observe(container.parentElement);
      }
    }

    window.addEventListener('resize', syncMapSize);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', syncMapSize);
    };
  }, [map]);

  return null;
}

function MapZoomTracker({ onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;

    const syncZoom = () => onZoomChange(map.getZoom());
    syncZoom();
    map.on('zoomend', syncZoom);

    return () => {
      map.off('zoomend', syncZoom);
    };
  }, [map, onZoomChange]);

  return null;
}

function MapClickDeselect({ onDeselect }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;

    const handleMapClick = (e) => {
      if (e.originalEvent?._featureClicked) return;
      onDeselect();
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onDeselect]);

  return null;
}

function ActiveToolController({
  activeTool,
  editableGroupRef,
  measurementLayerRef,
  canEdit,
  onFeatureCreated,
  onFeaturesEdited,
  onFeaturesDeleted,
  onMeasurementUpdate,
  onToolReset
}) {
  const map = useMap();
  const handlerRef = useRef(null);

  useEffect(() => {
    if (!map) return undefined;

    const editableGroup = editableGroupRef.current;
    const measurementLayer = measurementLayerRef.current;

    if (handlerRef.current) {
      handlerRef.current.disable();
      handlerRef.current = null;
    }

    if (!measurementLayer || !map.hasLayer(measurementLayer)) {
      measurementLayer?.addTo(map);
    }

    const cleanupFns = [];
    const addCleanup = (fn) => cleanupFns.push(fn);

    const enableDrawHandler = (handlerFactory, createdHandler) => {
      handlerRef.current = handlerFactory();
      handlerRef.current.enable();
      map.on(L.Draw.Event.CREATED, createdHandler);
      addCleanup(() => map.off(L.Draw.Event.CREATED, createdHandler));
    };

    if (canEdit && activeTool === 'point') {
      enableDrawHandler(
        () => new L.Draw.Marker(map, { icon: DRAW_MARKER_ICON }),
        (event) => onFeatureCreated(event.layer, 'marker')
      );
    }

    if (canEdit && activeTool === 'line') {
      enableDrawHandler(
        () => new L.Draw.Polyline(map, {
          shapeOptions: { color: '#1e88e5', weight: 4 }
        }),
        (event) => onFeatureCreated(event.layer, 'polyline')
      );
    }

    if (canEdit && activeTool === 'polygon') {
      enableDrawHandler(
        () => new L.Draw.Polygon(map, {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#22c55e',
            weight: 3,
            fillColor: '#86efac',
            fillOpacity: 0.35
          }
        }),
        (event) => onFeatureCreated(event.layer, 'polygon')
      );
    }

    if (canEdit && activeTool === 'rectangle') {
      enableDrawHandler(
        () => new L.Draw.Rectangle(map, {
          shapeOptions: {
            color: '#16a34a',
            weight: 3,
            fillColor: '#bbf7d0',
            fillOpacity: 0.3
          }
        }),
        (event) => onFeatureCreated(event.layer, 'rectangle')
      );
    }

    if (canEdit && activeTool === 'circle') {
      enableDrawHandler(
        () => new L.Draw.Circle(map, {
          shapeOptions: {
            color: '#f59e0b',
            weight: 3,
            fillColor: '#fde68a',
            fillOpacity: 0.3
          }
        }),
        (event) => onFeatureCreated(event.layer, 'circle')
      );
    }

    if (canEdit && activeTool === 'edit' && editableGroup) {
      const editHandler = new L.EditToolbar.Edit(map, {
        featureGroup: editableGroup,
        selectedPathOptions: { maintainColor: true }
      });

      handlerRef.current = editHandler;
      editHandler.enable();

      const handleEdited = (event) => onFeaturesEdited(event.layers);
      const handleEditStop = () => onToolReset();

      map.on(L.Draw.Event.EDITED, handleEdited);
      map.on(L.Draw.Event.EDITSTOP, handleEditStop);
      addCleanup(() => map.off(L.Draw.Event.EDITED, handleEdited));
      addCleanup(() => map.off(L.Draw.Event.EDITSTOP, handleEditStop));
    }

    if (canEdit && activeTool === 'delete' && editableGroup) {
      const deleteHandler = new L.EditToolbar.Delete(map, {
        featureGroup: editableGroup
      });

      handlerRef.current = deleteHandler;
      deleteHandler.enable();

      const handleDeleted = (event) => onFeaturesDeleted(event.layers);
      const handleDeleteStop = () => onToolReset();

      map.on(L.Draw.Event.DELETED, handleDeleted);
      map.on(L.Draw.Event.DELETESTOP, handleDeleteStop);
      addCleanup(() => map.off(L.Draw.Event.DELETED, handleDeleted));
      addCleanup(() => map.off(L.Draw.Event.DELETESTOP, handleDeleteStop));
    }

    if (activeTool === 'measure-distance' && measurementLayer) {
      let measuredPoints = [];
      let workingPolyline = null;
      let rubberBandLine = null;
      let totalDistance = 0;

      const updateDistance = (distanceKm) => {
        onMeasurementUpdate({
          distanceKm,
          areaHa: 0,
          perimeterKm: 0
        });
      };

      const clearRubberBand = () => {
        if (rubberBandLine) {
          measurementLayer.removeLayer(rubberBandLine);
          rubberBandLine = null;
        }
      };

      const handleClick = (event) => {
        measuredPoints.push(event.latlng);

        L.marker(event.latlng, {
          icon: L.divIcon({
            className: 'dg-measure-node',
            html: '<span></span>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })
        }).addTo(measurementLayer);

        if (!workingPolyline) {
          workingPolyline = L.polyline([event.latlng], {
            color: '#0f766e',
            weight: 3,
            dashArray: '12 6'
          }).addTo(measurementLayer);
        } else {
          const previousPoint = measuredPoints[measuredPoints.length - 2];
          const segmentDistance = previousPoint.distanceTo(event.latlng);
          totalDistance += segmentDistance;
          workingPolyline.addLatLng(event.latlng);

          const labelCenter = L.latLng(
            (previousPoint.lat + event.latlng.lat) / 2,
            (previousPoint.lng + event.latlng.lng) / 2
          );

          L.marker(labelCenter, {
            icon: L.divIcon({
              className: 'dg-measure-label',
              html: `<span>${(segmentDistance / 1000).toFixed(2)} km</span>`,
              iconSize: [56, 20],
              iconAnchor: [28, 10]
            })
          }).addTo(measurementLayer);
        }

        updateDistance(totalDistance / 1000);
      };

      const handleMouseMove = (event) => {
        if (!measuredPoints.length) return;

        const lastPoint = measuredPoints[measuredPoints.length - 1];
        if (rubberBandLine) {
          rubberBandLine.setLatLngs([lastPoint, event.latlng]);
        } else {
          rubberBandLine = L.polyline([lastPoint, event.latlng], {
            color: '#0f766e',
            weight: 2,
            opacity: 0.6,
            dashArray: '6 8'
          }).addTo(measurementLayer);
        }
      };

      const handleDoubleClick = () => {
        clearRubberBand();
        onToolReset();
      };

      map.doubleClickZoom.disable();
      map.getContainer().style.cursor = 'crosshair';
      map.on('click', handleClick);
      map.on('mousemove', handleMouseMove);
      map.on('dblclick', handleDoubleClick);

      addCleanup(() => {
        map.off('click', handleClick);
        map.off('mousemove', handleMouseMove);
        map.off('dblclick', handleDoubleClick);
        map.doubleClickZoom.enable();
        map.getContainer().style.cursor = '';
        clearRubberBand();
      });
    }

    if (activeTool === 'measure-area' && measurementLayer) {
      enableDrawHandler(
        () => new L.Draw.Polygon(map, {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#f59e0b',
            weight: 3,
            fillColor: '#fde68a',
            fillOpacity: 0.25,
            dashArray: '10 6'
          }
        }),
        (event) => {
          const geojsonFeature = normalizeFeature(event.layer.toGeoJSON());
          const metrics = getFeatureMetrics(geojsonFeature);
          event.layer.bindPopup(
            `<strong>Area:</strong> ${metrics.areaHa.toFixed(2)} ha<br/><strong>Perimetro:</strong> ${metrics.perimeterKm.toFixed(2)} km`
          );
          event.layer.addTo(measurementLayer);
          onMeasurementUpdate({
            distanceKm: 0,
            areaHa: metrics.areaHa,
            perimeterKm: metrics.perimeterKm
          });
          onToolReset();
        }
      );
    }

    return () => {
      if (handlerRef.current) {
        handlerRef.current.disable();
        handlerRef.current = null;
      }

      cleanupFns.forEach((fn) => fn());
    };
  }, [
    activeTool,
    canEdit,
    editableGroupRef,
    map,
    measurementLayerRef,
    onFeatureCreated,
    onFeaturesDeleted,
    onFeaturesEdited,
    onMeasurementUpdate,
    onToolReset
  ]);

  return null;
}

function ToolbarButton({ active, disabled, icon, label, onClick, compact }) {
  return (
    <button
      type="button"
      className={`dg-toolbar-btn ${active ? 'active' : ''} ${compact ? 'compact' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      <i className={`fas ${icon}`}></i>
      <span>{label}</span>
    </button>
  );
}

export default function DisenoGeometrico() {
  const { setPageTitle } = usePageTitle();
  const { selectedProjectId: projectId, selectedProjectName, user } = useAuth();

  const canManage = user?.rol_nombre === 'ADMIN' || user?.rol_nombre === 'COORDINADOR PROYECTO';

  const [layers, setLayers] = useState([]);
  const [visibleTabs, setVisibleTabs] = useState({});
  const [selectedTabName, setSelectedTabName] = useState('');
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [featureTablePage, setFeatureTablePage] = useState(1);
  const [activeTool, setActiveTool] = useState('select');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [newLayerName, setNewLayerName] = useState('');
  const [saveStateByTab, setSaveStateByTab] = useState({});
  const [measurementSummary, setMeasurementSummary] = useState({
    distanceKm: 0,
    areaHa: 0,
    perimeterKm: 0
  });
  const [mapZoom, setMapZoom] = useState(6);
  const [manualColorAttributeInput, setManualColorAttributeInput] = useState('');
  const [baseMapKey, setBaseMapKey] = useState('street');
  const [isThreeDMode, setIsThreeDMode] = useState(false);
  const [showLabelTable, setShowLabelTable] = useState(false);
  const [showProjectReference, setShowProjectReference] = useState(false);
  const [projectReferenceGeojson, setProjectReferenceGeojson] = useState(() => cloneGeojson(EMPTY_FEATURE_COLLECTION));
  const [hasProjectReference, setHasProjectReference] = useState(false);

  const mapRef = useRef(null);
  const editableGroupRef = useRef(null);
  const measurementLayerRef = useRef(new L.FeatureGroup());
  const tableSectionRef = useRef(null);
  const layerRegistryRef = useRef({});
  const layersRef = useRef([]);
  const selectedTabRef = useRef('');
  const selectedFeatureIdRef = useRef('');
  const saveTimersRef = useRef({});
  const dirtyTabsRef = useRef({});
  const inflightSavesRef = useRef({});
  const historyRef = useRef({});

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    selectedTabRef.current = selectedTabName;
  }, [selectedTabName]);

  useEffect(() => {
    selectedFeatureIdRef.current = selectedFeatureId;
  }, [selectedFeatureId]);

  useEffect(() => {
    setFeatureTablePage(1);
  }, [selectedTabName]);

  useEffect(() => {
    setPageTitle('Diseno Geometrico');
    return () => setPageTitle('');
  }, [setPageTitle]);

  useEffect(() => {
    window.__dgCloseLabel = () => {
      setSelectedFeatureId('');
    };
    return () => {
      delete window.__dgCloseLabel;
    };
  }, []);

  const clearSaveTimer = useCallback((tabName) => {
    if (saveTimersRef.current[tabName]) {
      window.clearTimeout(saveTimersRef.current[tabName]);
      delete saveTimersRef.current[tabName];
    }
  }, []);

  const setLayerSaveState = useCallback((tabName, nextState) => {
    setSaveStateByTab((current) => ({
      ...current,
      [tabName]: nextState
    }));
  }, []);

  const ensureHistory = useCallback((tabName, geojsonData) => {
    if (!tabName) return;

    const normalized = normalizeFeatureCollection(geojsonData);
    const currentHistory = historyRef.current[tabName];

    if (!currentHistory) {
      historyRef.current[tabName] = {
        past: [],
        present: cloneGeojson(normalized),
        future: []
      };
      return;
    }

    if (serializeGeojson(currentHistory.present) !== serializeGeojson(normalized)) {
      historyRef.current[tabName] = {
        ...currentHistory,
        present: cloneGeojson(normalized)
      };
    }
  }, []);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.tab_name === selectedTabName) || null,
    [layers, selectedTabName]
  );
  const groupedLayers = useMemo(() => {
    const groups = new Map();

    layers.forEach((layer) => {
      const groupKey = getLayerGroupKey(layer.tab_name);
      const currentGroup = groups.get(groupKey) || {
        key: groupKey,
        label: getLayerGroupLabel(layer),
        layers: [],
        totalFeatures: 0,
        swatchColor: getLayerSwatchColor(layer)
      };

      currentGroup.layers.push(layer);
      currentGroup.totalFeatures += getFeatureCount(layer);
      groups.set(groupKey, currentGroup);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      isSplit: group.layers.length > 1
    }));
  }, [layers]);
  const selectedLayerGroupKey = useMemo(
    () => getLayerGroupKey(selectedTabName),
    [selectedTabName]
  );

  const activeFeatureCollection = useMemo(
    () => normalizeFeatureCollection(selectedLayer?.geojson_data || EMPTY_FEATURE_COLLECTION),
    [selectedLayer]
  );
  const pointLabelConfig = useMemo(
    () => getPointLabelConfig(activeFeatureCollection),
    [activeFeatureCollection]
  );
  const effectivePointLabelConfig = useMemo(
    () => resolveEffectivePointLabelConfig(activeFeatureCollection, pointLabelConfig, mapZoom),
    [activeFeatureCollection, mapZoom, pointLabelConfig]
  );
  const selectionHighlightColor = useMemo(
    () => resolveSelectionHighlightColor(activeFeatureCollection),
    [activeFeatureCollection]
  );

  const activeFeatures = useMemo(
    () => activeFeatureCollection.features || [],
    [activeFeatureCollection]
  );

  const selectedFeature = useMemo(
    () => activeFeatures.find((feature) => getFeatureId(feature) === selectedFeatureId) || null,
    [activeFeatures, selectedFeatureId]
  );
  const totalFeatureTablePages = useMemo(
    () => Math.max(1, Math.ceil(activeFeatures.length / DG_TABLE_PAGE_SIZE)),
    [activeFeatures.length]
  );
  const paginatedActiveFeatures = useMemo(() => {
    const startIndex = (featureTablePage - 1) * DG_TABLE_PAGE_SIZE;
    return activeFeatures.slice(startIndex, startIndex + DG_TABLE_PAGE_SIZE);
  }, [activeFeatures, featureTablePage]);

  const selectedFeatureMetrics = useMemo(() => getFeatureMetrics(selectedFeature), [selectedFeature]);
  const selectedFeatureCoordinates = useMemo(() => getFeatureCoordinates(selectedFeature), [selectedFeature]);
  const selectedFeatureType = useMemo(() => getFeatureType(selectedFeature), [selectedFeature]);
  const selectedFeatureSupportsFill = selectedFeatureType === 'polygon' || selectedFeatureType === 'rectangle' || selectedFeatureType === 'circle';
  const selectedFeatureSourceAttributes = useMemo(() => getFeatureSourceAttributes(selectedFeature), [selectedFeature]);
  const selectedLayerColorRule = selectedLayer?.geojson_data?.dg_meta?.colorByAttribute || '';
  const selectedLayerColorKey = selectedLayer?.geojson_data?.dg_meta?.colorByAttributeKey || '';
  const selectedLayerStatus = selectedTabName ? (saveStateByTab[selectedTabName] || 'saved') : 'saved';
  const activeFeatureSummary = useMemo(() => {
    return activeFeatures.reduce((summary, feature) => {
      const featureType = getFeatureType(feature);

      if (featureType === 'point') {
        summary.points += 1;
      } else if (featureType === 'line') {
        summary.lines += 1;
      } else {
        summary.areas += 1;
      }

      return summary;
    }, { points: 0, lines: 0, areas: 0 });
  }, [activeFeatures]);
  const availableAttributeFields = useMemo(() => {
    const keyMap = new Map();

    activeFeatures.forEach((feature) => {
      getFeatureSourceAttributes(feature).forEach(([key, value]) => {
        if (!keyMap.has(key)) {
          keyMap.set(key, {
            key,
            count: 0,
            distinctValues: new Set()
          });
        }

        const item = keyMap.get(key);
        item.count += 1;
        if (value !== null && value !== undefined && value !== '') {
          item.distinctValues.add(String(value));
        }
      });
    });

    return Array.from(keyMap.values())
      .map((item) => ({
        key: item.key,
        count: item.count,
        valueCount: item.distinctValues.size
      }))
      .sort((left, right) => left.key.localeCompare(right.key, 'es'));
  }, [activeFeatures]);
  const availableAttributeColorOptions = useMemo(() => ATTRIBUTE_COLOR_OPTIONS.map((option) => {
    const actualKey = activeFeatures
      .map((feature) => findFeatureAttributeEntry(feature, option.aliases)?.[0] || '')
      .find(Boolean);

    if (!actualKey) return null;

    const distinctValues = [...new Set(
      activeFeatures
        .map((feature) => getFeatureAttributeValue(feature, option.aliases))
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map((value) => String(value))
    )];

    return {
      ...option,
      actualKey,
      valueCount: distinctValues.length
    };
  }).filter(Boolean), [activeFeatures]);
  const selectedLayerColorOption = useMemo(
    () => (
      availableAttributeColorOptions.find((option) => option.actualKey === selectedLayerColorKey)
      || availableAttributeFields.find((option) => option.key === selectedLayerColorKey)
      || null
    ),
    [availableAttributeFields, availableAttributeColorOptions, selectedLayerColorKey]
  );
  const selectedLayerColorPalette = useMemo(
    () => (
      selectedLayer?.geojson_data?.dg_meta?.colorByAttributePalette
        && typeof selectedLayer.geojson_data.dg_meta.colorByAttributePalette === 'object'
        ? selectedLayer.geojson_data.dg_meta.colorByAttributePalette
        : {}
    ),
    [selectedLayer]
  );
  const selectedLayerLegendEnabledOnMap = Boolean(selectedLayer?.geojson_data?.dg_meta?.showLegendOnMap);
  const selectedLayerLegendVisibleValues = useMemo(
    () => Array.isArray(selectedLayer?.geojson_data?.dg_meta?.visibleLegendValues)
      ? selectedLayer.geojson_data.dg_meta.visibleLegendValues.map((value) => String(value))
      : [],
    [selectedLayer]
  );
  const selectedLayerColorLegend = useMemo(() => {
    if (!selectedLayerColorOption) return [];

    const distinctValues = [...new Set(
      activeFeatures
        .map((feature) => getFeatureAttributeValueByRule(feature, selectedLayerColorOption))
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map((value) => String(value))
    )];

    return distinctValues.map((value, index) => ({
      value,
      color: selectedLayerColorPalette[value] || ATTRIBUTE_COLOR_PALETTE[index % ATTRIBUTE_COLOR_PALETTE.length]
    }));
  }, [activeFeatures, selectedLayerColorOption, selectedLayerColorPalette]);
  const selectedPresetColorRule = useMemo(
    () => availableAttributeColorOptions.some((option) => option.value === selectedLayerColorRule) ? selectedLayerColorRule : '',
    [availableAttributeColorOptions, selectedLayerColorRule]
  );
  const visibleLegendItemsOnMap = useMemo(() => {
    if (!selectedLayerLegendEnabledOnMap) return [];

    const allowedValues = selectedLayerLegendVisibleValues.length
      ? new Set(selectedLayerLegendVisibleValues)
      : new Set(selectedLayerColorLegend.map((item) => String(item.value)));

    return selectedLayerColorLegend.filter((item) => allowedValues.has(String(item.value)));
  }, [selectedLayerColorLegend, selectedLayerLegendEnabledOnMap, selectedLayerLegendVisibleValues]);

  useEffect(() => {
    setManualColorAttributeInput(selectedLayerColorKey || '');
  }, [selectedLayerColorKey]);
  const availablePointLabelFields = useMemo(() => {
    const keyMap = new Map();

    activeFeatures
      .filter((feature) => isPointFeature(feature) || isLineFeature(feature))
      .forEach((feature) => {
        getFeatureSourceAttributes(feature).forEach(([key]) => {
          if (!keyMap.has(key)) {
            keyMap.set(key, {
              key,
              count: 1
            });
          } else {
            keyMap.get(key).count += 1;
          }
        });
      });

    return Array.from(keyMap.values()).sort((left, right) => left.key.localeCompare(right.key, 'es'));
  }, [activeFeatures]);
  const activeBaseMap = BASEMAPS[baseMapKey] || BASEMAPS.street;
  const isThreeDToolLocked = isThreeDMode;
  const projectReferenceHasFeatures = useMemo(
    () => Array.isArray(projectReferenceGeojson?.features) && projectReferenceGeojson.features.length > 0,
    [projectReferenceGeojson]
  );

  useEffect(() => {
    if (!isThreeDMode) return;

    if (activeTool !== 'select') {
      setActiveTool('select');
    }

    setMeasurementSummary({
      distanceKm: 0,
      areaHa: 0,
      perimeterKm: 0
    });
  }, [activeTool, isThreeDMode]);

  const commitHistory = useCallback((tabName, nextGeojson) => {
    ensureHistory(tabName, layersRef.current.find((layer) => layer.tab_name === tabName)?.geojson_data || EMPTY_FEATURE_COLLECTION);

    const history = historyRef.current[tabName];
    const normalized = normalizeFeatureCollection(nextGeojson);
    const nextSerialized = serializeGeojson(normalized);
    const currentSerialized = serializeGeojson(history.present);

    if (nextSerialized === currentSerialized) {
      history.present = cloneGeojson(normalized);
      return;
    }

    history.past.push(cloneGeojson(history.present));
    if (history.past.length > 40) {
      history.past.shift();
    }
    history.present = cloneGeojson(normalized);
    history.future = [];
  }, [ensureHistory]);

  const fitBounds = useCallback((bounds) => {
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        animate: true,
        duration: 0.55
      });
    }
  }, []);

  const focusFeatureById = useCallback((featureId) => {
    const feature = activeFeatures.find((item) => getFeatureId(item) === featureId);
    if (!feature) return;

    const bounds = getLayerBounds(feature);
    if (bounds && mapRef.current) {
      const map = mapRef.current;
      const currentZoom = map.getZoom();

      if (isPointFeature(feature)) {
        const targetZoom = Math.min(Math.max(currentZoom + 2, 18), 22);
        const [longitude, latitude] = feature.geometry.coordinates;
        map.flyTo([latitude, longitude], targetZoom, { duration: 0.5 });
        return;
      }

      if (typeof map.flyToBounds === 'function') {
        map.flyToBounds(bounds, {
          padding: [72, 72],
          duration: 0.65,
          maxZoom: isLineFeature(feature) ? Math.max(currentZoom, 17) : undefined
        });
      } else {
        fitBounds(bounds);
      }

      return;
    }

    if (feature.geometry?.type === 'Point' && mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      const targetZoom = Math.min(Math.max(currentZoom + 2, 18), 22);
      const [longitude, latitude] = feature.geometry.coordinates;
      mapRef.current.flyTo([latitude, longitude], targetZoom, { duration: 0.5 });
    }
  }, [activeFeatures, fitBounds]);

  const scrollToFeatureTable = useCallback(() => {
    if (!tableSectionRef.current) return;

    tableSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, []);

  const handleMapDeselect = useCallback(() => {
    if (activeTool !== 'select') return;
    setSelectedFeatureId('');
  }, [activeTool]);

  const attachEditableLayer = useCallback((leafletLayer, feature) => {
    const normalizedFeature = normalizeFeature(feature);
    const featureId = getFeatureId(normalizedFeature);

    leafletLayer.feature = normalizedFeature;
    leafletLayer.off('click');
    leafletLayer.on('click', (e) => {
      if (e.originalEvent) e.originalEvent._featureClicked = true;
      const isAlreadySelected = selectedFeatureIdRef.current === featureId;
      setSelectedFeatureId(featureId);
      setActiveTool('select');
      if (!isAlreadySelected) {
        focusFeatureById(featureId);
      }
    });

    applyLayerStyle(leafletLayer, normalizedFeature, featureId === selectedFeatureIdRef.current, effectivePointLabelConfig, selectionHighlightColor);
    layerRegistryRef.current[featureId] = leafletLayer;
  }, [effectivePointLabelConfig, focusFeatureById, selectionHighlightColor]);

  const rebuildEditableGroup = useCallback((geojsonData) => {
    const editableGroup = editableGroupRef.current;
    if (!editableGroup) return;

    editableGroup.clearLayers();
    layerRegistryRef.current = {};

    const normalized = normalizeFeatureCollection(geojsonData);
    const geoJsonLayer = L.geoJSON(normalized, {
      style: (feature) => getVectorStyle(feature, getFeatureId(feature) === selectedFeatureIdRef.current, selectionHighlightColor),
      pointToLayer: (feature, latlng) => L.marker(latlng, {
        icon: createPointIcon(feature, getFeatureId(feature) === selectedFeatureIdRef.current, effectivePointLabelConfig)
      }),
      onEachFeature: (feature, leafletLayer) => {
        leafletLayer.bindPopup(featureToPopupHtml(feature));
        attachEditableLayer(leafletLayer, feature);
      }
    });

    geoJsonLayer.eachLayer((leafletLayer) => {
      editableGroup.addLayer(leafletLayer);
    });

    const activeIds = normalized.features.map((feature) => getFeatureId(feature));
    if (selectedFeatureIdRef.current && !activeIds.includes(selectedFeatureIdRef.current)) {
      setSelectedFeatureId(activeIds[0] || '');
    }
  }, [attachEditableLayer, effectivePointLabelConfig, selectionHighlightColor]);

  const extractFeatureCollection = useCallback(() => {
    const editableGroup = editableGroupRef.current;
    if (!editableGroup) {
      return cloneGeojson(EMPTY_FEATURE_COLLECTION);
    }

    return normalizeFeatureCollection(editableGroup.toGeoJSON());
  }, []);

  const scheduleAutoSave = useCallback((tabName) => {
    if (!tabName || !canManage) return;

    clearSaveTimer(tabName);
    saveTimersRef.current[tabName] = window.setTimeout(() => {
      const saveFn = inflightSavesRef.current[`fn:${tabName}`];
      if (saveFn) {
        saveFn(true);
      }
    }, AUTO_SAVE_DELAY_MS);
  }, [canManage, clearSaveTimer]);

  const markLayerDirty = useCallback((tabName) => {
    if (!tabName) return;

    dirtyTabsRef.current[tabName] = true;
    setLayerSaveState(tabName, 'dirty');
    scheduleAutoSave(tabName);
  }, [scheduleAutoSave, setLayerSaveState]);

  const updateLayerRecord = useCallback((tabName, nextData, options = {}) => {
    const normalized = normalizeFeatureCollection(nextData);

    setLayers((current) => current.map((layer) => (
      layer.tab_name === tabName
        ? { ...layer, ...options.meta, geojson_data: normalized }
        : layer
    )));
  }, []);

  const saveLayerGeojson = useCallback(async (tabName, isAutoSave = false) => {
    if (!projectId || !tabName || !canManage) return false;

    clearSaveTimer(tabName);

    const layer = layersRef.current.find((item) => item.tab_name === tabName);
    if (!layer) return false;

    const payloadGeojson = normalizeFeatureCollection(layer.geojson_data || EMPTY_FEATURE_COLLECTION);
    const payloadHash = serializeGeojson(payloadGeojson);

    inflightSavesRef.current[tabName] = payloadHash;
    setLayerSaveState(tabName, 'saving');

    try {
      const response = await axiosInstance.patch(
        `/api/proyectos/${projectId}/diseno-geometrico-capas/${tabName}/geojson`,
        { geojsonData: payloadGeojson, fileName: layer.file_name }
      );

      const savedLayer = response.data?.data || {};
      const latestLayer = layersRef.current.find((item) => item.tab_name === tabName);
      const latestHash = latestLayer ? serializeGeojson(normalizeFeatureCollection(latestLayer.geojson_data)) : payloadHash;

      setLayers((current) => current.map((item) => (
        item.tab_name === tabName
          ? {
            ...item,
            uploaded_at: savedLayer.uploaded_at || item.uploaded_at,
            file_name: savedLayer.file_name || item.file_name,
            drive_url: savedLayer.drive_url ?? item.drive_url,
            geojson_data: latestHash === payloadHash
              ? normalizeFeatureCollection(savedLayer.geojson_data || payloadGeojson)
              : item.geojson_data
          }
          : item
      )));

      if (latestHash === payloadHash) {
        dirtyTabsRef.current[tabName] = false;
        setLayerSaveState(tabName, 'saved');
        if (!isAutoSave) {
          alertify.success('Capa guardada correctamente');
        }
      } else {
        dirtyTabsRef.current[tabName] = true;
        setLayerSaveState(tabName, 'dirty');
        scheduleAutoSave(tabName);
      }

      return true;
    } catch (error) {
      console.error('Error al guardar capa geometrica:', error);
      dirtyTabsRef.current[tabName] = true;
      setLayerSaveState(tabName, 'error');
      if (!isAutoSave) {
        alertify.error(error.response?.data?.message || 'No se pudo guardar la capa');
      }
      return false;
    } finally {
      delete inflightSavesRef.current[tabName];
    }
  }, [canManage, clearSaveTimer, projectId, scheduleAutoSave, setLayerSaveState]);

  useEffect(() => {
    const saveKey = `fn:${selectedTabName}`;
    const inflightMap = inflightSavesRef.current;
    inflightMap[saveKey] = (isAutoSave) => saveLayerGeojson(selectedTabName, isAutoSave);
    return () => {
      delete inflightMap[saveKey];
    };
  }, [saveLayerGeojson, selectedTabName]);

  const flushLayerIfDirty = useCallback(async (tabName) => {
    if (!tabName || !dirtyTabsRef.current[tabName]) return true;
    return saveLayerGeojson(tabName, false);
  }, [saveLayerGeojson]);

  const commitActiveCollection = useCallback((nextGeojson, options = {}) => {
    const tabName = selectedTabRef.current;
    if (!tabName) return;

    const normalized = normalizeFeatureCollection(nextGeojson);
    commitHistory(tabName, normalized);
    updateLayerRecord(tabName, normalized);
    ensureHistory(tabName, normalized);

    if (options.selectedFeatureId !== undefined) {
      setSelectedFeatureId(options.selectedFeatureId);
    }

    markLayerDirty(tabName);
  }, [commitHistory, ensureHistory, markLayerDirty, updateLayerRecord]);

  const fetchLayers = useCallback(async () => {
    if (!projectId) {
      setLayers([]);
      setVisibleTabs({});
      setSelectedTabName('');
      setSelectedFeatureId('');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/api/proyectos/${projectId}/diseno-geometrico-capas`);
      const layerRows = Array.isArray(response.data?.data) ? response.data.data : [];
      const normalizedRows = layerRows.map((layer) => ({
        ...layer,
        geojson_data: normalizeFeatureCollection(parseGeojson(layer.geojson_data))
      }));

      setLayers(normalizedRows);
      setVisibleTabs((current) => {
        const nextState = {};
        normalizedRows.forEach((layer) => {
          nextState[layer.tab_name] = current[layer.tab_name] ?? true;
          ensureHistory(layer.tab_name, layer.geojson_data);
        });
        return nextState;
      });

      setSelectedTabName((current) => {
        if (current && normalizedRows.some((layer) => layer.tab_name === current)) {
          return current;
        }
        return normalizedRows[0]?.tab_name || '';
      });
    } catch (error) {
      console.error('Error al cargar capas de Diseno Geometrico:', error);
      alertify.error('No se pudieron cargar las capas del modulo');
    } finally {
      setIsLoading(false);
    }
  }, [ensureHistory, projectId]);

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  useEffect(() => {
    let cancelled = false;

    const loadProjectReference = async () => {
      if (!projectId) {
        setProjectReferenceGeojson(cloneGeojson(EMPTY_FEATURE_COLLECTION));
        setHasProjectReference(false);
        return;
      }

      try {
        let kmlUrl = '';
        let kmlTrazadoId = null;

        try {
          const projectRes = await axiosInstance.get(`/api/proyectos/${projectId}`);
          kmlUrl = projectRes.data?.url_kml || '';
          kmlTrazadoId = projectRes.data?.kml_trazado_id || null;
        } catch (projectError) {
          console.warn('No se pudo leer el detalle del proyecto para obtener el trazado:', projectError);
        }

        if (kmlTrazadoId) {
          try {
            const storedKmlRes = await axiosInstance.get(`/api/kml-trazados/${kmlTrazadoId}/content`);
            const storedKmlText = storedKmlRes.data?.kmlContent;

            if (canParseStoredKmlText(storedKmlText)) {
              const storedGeojson = parseKmlTextToFeatureCollection(storedKmlText);

              if (!cancelled && Array.isArray(storedGeojson.features) && storedGeojson.features.length > 0) {
                setProjectReferenceGeojson(storedGeojson);
                setHasProjectReference(true);
                return;
              }
            }
          } catch (storedKmlError) {
            console.warn('No se pudo cargar el trazado desde kml_trazados, se intentará la URL del proyecto:', storedKmlError);
          }
        }

        if (!kmlUrl) {
          const kmlRes = await axiosInstance.get(`/api/proyectos/${projectId}/kml`, {
            params: { section: 'invvial' }
          });
          kmlUrl = kmlRes.data?.url || '';
        }

        if (!kmlUrl) {
          if (!cancelled) {
            setProjectReferenceGeojson(cloneGeojson(EMPTY_FEATURE_COLLECTION));
            setHasProjectReference(false);
          }
          return;
        }

        const geojson = await loadProjectReferenceGeojson(kmlUrl);

        if (!cancelled) {
          setProjectReferenceGeojson(geojson);
          setHasProjectReference(Array.isArray(geojson.features) && geojson.features.length > 0);
        }
      } catch (error) {
        console.warn('No se pudo cargar el trazado de referencia del proyecto:', error);
        if (!cancelled) {
          setProjectReferenceGeojson(cloneGeojson(EMPTY_FEATURE_COLLECTION));
          setHasProjectReference(false);
        }
      }
    };

    loadProjectReference();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    const currentLayer = layersRef.current.find((layer) => layer.tab_name === selectedTabName) || null;

    if (!currentLayer) {
      rebuildEditableGroup(EMPTY_FEATURE_COLLECTION);
      return;
    }

    ensureHistory(currentLayer.tab_name, currentLayer.geojson_data);
    rebuildEditableGroup(currentLayer.geojson_data);
    setVisibleTabs((current) => ({
      ...current,
      [currentLayer.tab_name]: true
    }));
    setMeasurementSummary({
      distanceKm: 0,
      areaHa: 0,
      perimeterKm: 0
    });
    setActiveTool('select');
  }, [ensureHistory, rebuildEditableGroup, selectedTabName]);

  useEffect(() => {
    const currentLayer = layersRef.current.find((layer) => layer.tab_name === selectedTabName) || null;
    const layerBounds = currentLayer ? getLayerBounds(currentLayer.geojson_data) : null;
    const projectBounds = projectReferenceHasFeatures ? getLayerBounds(projectReferenceGeojson) : null;
    const targetBounds = layerBounds || projectBounds;

    if (!targetBounds) return;

    window.setTimeout(() => {
      fitBounds(targetBounds);
    }, 0);
  }, [fitBounds, projectId, projectReferenceGeojson, projectReferenceHasFeatures, selectedTabName]);

  useEffect(() => {
    Object.entries(layerRegistryRef.current).forEach(([featureId, leafletLayer]) => {
      applyLayerStyle(leafletLayer, leafletLayer.feature, featureId === selectedFeatureId, effectivePointLabelConfig, selectionHighlightColor);
    });
  }, [effectivePointLabelConfig, selectedFeatureId, selectionHighlightColor]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const hasDirty = Object.values(dirtyTabsRef.current).some(Boolean);
      if (!hasDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => () => {
    const currentTab = selectedTabRef.current;
    if (currentTab && dirtyTabsRef.current[currentTab]) {
      saveLayerGeojson(currentTab, true);
    }
    Object.keys(saveTimersRef.current).forEach((tabName) => clearSaveTimer(tabName));
  }, [clearSaveTimer, saveLayerGeojson]);

  const handleSelectLayer = useCallback(async (tabName) => {
    if (tabName === selectedTabRef.current) return;

    const currentTab = selectedTabRef.current;
    if (currentTab) {
      await flushLayerIfDirty(currentTab);
    }

    setSelectedFeatureId('');
    setSelectedTabName(tabName);
  }, [flushLayerIfDirty]);
  const handleSelectLayerGroup = useCallback(async (group) => {
    const targetTabName = group?.layers?.[0]?.tab_name;
    if (!targetTabName) return;
    await handleSelectLayer(targetTabName);
  }, [handleSelectLayer]);

  const handleCreateLayer = async (event) => {
    event.preventDefault();

    if (!projectId || !canManage) {
      alertify.warning('Selecciona un proyecto y asegurate de tener permisos');
      return;
    }

    const cleanName = newLayerName.trim();
    const tabName = slugifyTabName(cleanName);

    if (!cleanName || !tabName) {
      alertify.warning('Ingresa un nombre valido para la capa');
      return;
    }

    if (layers.some((layer) => layer.tab_name === tabName)) {
      alertify.warning('Ya existe una capa con ese nombre');
      return;
    }

    try {
      const response = await axiosInstance.post(`/api/proyectos/${projectId}/diseno-geometrico-capas/blank`, {
        tabName,
        displayName: cleanName
      });

      const createdLayer = {
        ...(response.data?.data || {}),
        geojson_data: normalizeFeatureCollection(parseGeojson(response.data?.data?.geojson_data))
      };

      setLayers((current) => [createdLayer, ...current]);
      setVisibleTabs((current) => ({
        ...current,
        [tabName]: true
      }));
      ensureHistory(tabName, createdLayer.geojson_data);
      setSaveStateByTab((current) => ({
        ...current,
        [tabName]: 'saved'
      }));
      setNewLayerName('');
      setSelectedTabName(tabName);
      alertify.success('Capa creada');
    } catch (error) {
      console.error('Error al crear capa vacia:', error);
      alertify.error(error.response?.data?.message || 'No se pudo crear la capa');
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!projectId || !canManage) {
      alertify.warning('Selecciona un proyecto y asegurate de tener permisos');
      return;
    }

    const cleanName = uploadName.trim();
    const tabName = slugifyTabName(cleanName);

    if (!cleanName || !tabName) {
      alertify.warning('Ingresa un nombre para la capa');
      return;
    }

    if (!uploadFile) {
      alertify.warning('Selecciona un archivo ZIP, RAR, KML o KMZ');
      return;
    }

    const uploadStartedAt = Date.now();
    setIsUploading(true);
    setUploadProgress({
      loadedBytes: 0,
      totalBytes: uploadFile.size || 0,
      percentage: 0,
      remainingSeconds: null,
      bytesPerSecond: 0
    });
    try {
      const formData = new FormData();
      formData.append('archivo', uploadFile);
      formData.append('tabName', tabName);
      formData.append('displayName', cleanName);

      const response = await axiosInstance.post(
        `/api/proyectos/${projectId}/diseno-geometrico-capas`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const loadedBytes = progressEvent.loaded || 0;
            const totalBytes = progressEvent.total || uploadFile.size || 0;
            const elapsedSeconds = Math.max((Date.now() - uploadStartedAt) / 1000, 0.001);
            const bytesPerSecond = loadedBytes / elapsedSeconds;
            const remainingBytes = Math.max(totalBytes - loadedBytes, 0);
            const remainingSeconds = remainingBytes > 0 && bytesPerSecond > 0
              ? remainingBytes / bytesPerSecond
              : null;

            setUploadProgress({
              loadedBytes,
              totalBytes,
              percentage: totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 0,
              remainingSeconds,
              bytesPerSecond
            });
          }
        }
      );

      const uploadedLayers = (Array.isArray(response.data?.data) ? response.data.data : [response.data?.data])
        .filter(Boolean)
        .map((layer) => ({
          ...layer,
          geojson_data: normalizeFeatureCollection(parseGeojson(layer?.geojson_data))
        }));

      setLayers((current) => {
        const withoutPrevious = current.filter((layer) => (
          layer.tab_name !== tabName && !layer.tab_name?.startsWith(`${tabName}__part_`)
        ));
        return [...uploadedLayers, ...withoutPrevious];
      });
      setVisibleTabs((current) => {
        const nextState = { ...current };
        uploadedLayers.forEach((layer) => {
          nextState[layer.tab_name] = true;
        });
        return nextState;
      });
      setSaveStateByTab((current) => {
        const nextState = { ...current };
        uploadedLayers.forEach((layer) => {
          nextState[layer.tab_name] = 'saved';
        });
        return nextState;
      });
      uploadedLayers.forEach((layer) => {
        ensureHistory(layer.tab_name, layer.geojson_data);
      });
      setUploadProgress(null);
      setUploadName('');
      setUploadFile(null);
      setSelectedTabName(uploadedLayers[0]?.tab_name || tabName);
      alertify.success(response.data?.split
        ? `Capa subida y dividida en ${response.data?.parts || uploadedLayers.length} partes`
        : 'Capa subida correctamente');
    } catch (error) {
      console.error('Error al subir capa geometrica:', error);
      alertify.error(error.response?.data?.message || error.response?.data?.detail || 'No se pudo subir la capa');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteLayerGroup = async (group) => {
    if (!group?.layers?.length) return;
    if (!projectId || !canManage) return;

    alertify.confirm(
      'Eliminar capa',
      `Se eliminara la capa "${group.label}"${group.layers.length > 1 ? ` y sus ${group.layers.length} partes internas` : ''}.`,
      async () => {
        try {
          for (const layer of group.layers) {
            // eslint-disable-next-line no-await-in-loop
            await axiosInstance.delete(`/api/proyectos/${projectId}/diseno-geometrico-capas/${layer.tab_name}`);
            clearSaveTimer(layer.tab_name);
            delete dirtyTabsRef.current[layer.tab_name];
            delete historyRef.current[layer.tab_name];
          }

          setSaveStateByTab((current) => {
            const nextState = { ...current };
            group.layers.forEach((layer) => {
              delete nextState[layer.tab_name];
            });
            return nextState;
          });
          setVisibleTabs((current) => {
            const nextState = { ...current };
            group.layers.forEach((layer) => {
              delete nextState[layer.tab_name];
            });
            return nextState;
          });
          setLayers((current) => current.filter((item) => !group.layers.some((layer) => layer.tab_name === item.tab_name)));

          if (group.layers.some((layer) => layer.tab_name === selectedTabRef.current)) {
            const remainingLayers = layersRef.current.filter((item) => !group.layers.some((layer) => layer.tab_name === item.tab_name));
            setSelectedTabName(remainingLayers[0]?.tab_name || '');
            setSelectedFeatureId('');
          }

          alertify.success(group.layers.length > 1 ? 'Capa agrupada eliminada' : 'Capa eliminada');
        } catch (error) {
          console.error('Error al eliminar grupo de capas:', error);
          alertify.error('No se pudo eliminar la capa');
        }
      },
      () => { }
    ).set('labels', { ok: 'Eliminar', cancel: 'Cancelar' });
  };

  const toggleLayerGroupVisibility = (group) => {
    if (!group?.layers?.length) return;

    const hasActiveLayer = group.layers.some((layer) => layer.tab_name === selectedTabName);
    if (hasActiveLayer) {
      alertify.message('La capa activa siempre permanece visible durante la edicion');
      return;
    }

    const shouldShow = group.layers.some((layer) => !(visibleTabs[layer.tab_name] ?? true));
    setVisibleTabs((current) => {
      const nextState = { ...current };
      group.layers.forEach((layer) => {
        nextState[layer.tab_name] = shouldShow;
      });
      return nextState;
    });
  };

  const handleSaveCurrentLayer = async () => {
    if (!selectedTabName) return;
    await saveLayerGeojson(selectedTabName, false);
  };

  const handleExportGeojson = () => {
    if (!selectedLayer) return;

    const blob = new Blob(
      [JSON.stringify(normalizeFeatureCollection(selectedLayer.geojson_data), null, 2)],
      { type: 'application/geo+json;charset=utf-8' }
    );

    saveAs(blob, `${selectedLayer.tab_name || 'diseno_geometrico'}.geojson`);
  };

  const handleExportKml = async () => {
    if (!selectedLayer) return;

    try {
      const response = await axiosInstance.post(
        '/api/trafico/exportar-kml',
        normalizeFeatureCollection(selectedLayer.geojson_data),
        { responseType: 'blob' }
      );

      saveAs(response.data, `${selectedLayer.tab_name || 'diseno_geometrico'}.kml`);
    } catch (error) {
      console.error('Error al exportar KML:', error);
      alertify.error('No se pudo exportar la capa activa');
    }
  };
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
  const handleExportshape = async () => {
    const drawnFeatures = extractStylesForExport(editableGroupRef.current);
    const measuredFeatures = extractStylesForExport(measurementLayerRef.current);

    const geoJsonToExport = {
      type: 'FeatureCollection',
      features: [...drawnFeatures, ...measuredFeatures]

    };

    if (geoJsonToExport.features.length === 0) {
      alertify.error("no ahi elemetos dibujados o cargados para exportar");
      return;
    };
    try {
      alertify.message('exportando a shapefile');
      const response = await axiosInstance.post('/api/trafico/exportar-shapefile', geoJsonToExport, {
        responseType: 'blob',
      });
      saveAs(response.data, 'geoportal_export.zip');
      alertify.success('Exportacion a shape completada');

    } catch (error) {
      console.error("error interno al exportar:", error);
      alertify.error("Ocurrio un error durante la exportacion");
    }
  };

  const handleFeatureCreated = useCallback((createdLayer, layerType) => {
    const editableGroup = editableGroupRef.current;
    if (!editableGroup) return;

    let workingLayer = createdLayer;
    let rawFeature = createdLayer.toGeoJSON();

    if (layerType === 'circle') {
      const center = createdLayer.getLatLng();
      const radiusMeters = createdLayer.getRadius();

      rawFeature = turf.circle([center.lng, center.lat], radiusMeters / 1000, {
        steps: 72,
        units: 'kilometers',
        properties: {
          dg_type: 'circle',
          dg_radius_m: radiusMeters,
          dg_center_lng: center.lng,
          dg_center_lat: center.lat
        }
      });

      workingLayer = L.geoJSON(rawFeature).getLayers()[0];
    }

    const normalizedFeature = normalizeFeature({
      ...rawFeature,
      properties: {
        ...rawFeature.properties,
        dg_type: layerType === 'polyline' ? 'line' : layerType
      }
    }, activeFeatures.length);

    workingLayer.feature = normalizedFeature;
    workingLayer.bindPopup(featureToPopupHtml(normalizedFeature));
    attachEditableLayer(workingLayer, normalizedFeature);
    applyLayerStyle(workingLayer, normalizedFeature, true, effectivePointLabelConfig, selectionHighlightColor);
    editableGroup.addLayer(workingLayer);

    const nextCollection = extractFeatureCollection();
    commitActiveCollection(nextCollection, {
      selectedFeatureId: getFeatureId(normalizedFeature)
    });
    setActiveTool('select');
  }, [activeFeatures.length, attachEditableLayer, commitActiveCollection, effectivePointLabelConfig, extractFeatureCollection, selectionHighlightColor]);

  const handleFeaturesEdited = useCallback(() => {
    const nextCollection = extractFeatureCollection();
    commitActiveCollection(nextCollection, {
      selectedFeatureId: selectedFeatureIdRef.current
    });
  }, [commitActiveCollection, extractFeatureCollection]);

  const handleFeaturesDeleted = useCallback(() => {
    const nextCollection = extractFeatureCollection();
    const stillExists = nextCollection.features.some((feature) => getFeatureId(feature) === selectedFeatureIdRef.current);

    commitActiveCollection(nextCollection, {
      selectedFeatureId: stillExists ? selectedFeatureIdRef.current : ''
    });
    setActiveTool('select');
  }, [commitActiveCollection, extractFeatureCollection]);

  const updateSelectedFeature = useCallback((propertyPatch) => {
    if (!selectedLayer || !selectedFeatureId) return;

    const nextCollection = cloneGeojson(activeFeatureCollection);
    nextCollection.features = nextCollection.features.map((feature) => {
      if (getFeatureId(feature) !== selectedFeatureId) return feature;

      const nextFeature = normalizeFeature(feature);
      nextFeature.properties = {
        ...nextFeature.properties,
        ...propertyPatch
      };

      if (propertyPatch.dg_name) {
        nextFeature.properties.nombre = propertyPatch.dg_name;
      }

      return nextFeature;
    });

    const updatedFeature = nextCollection.features.find((feature) => getFeatureId(feature) === selectedFeatureId);
    const layer = layerRegistryRef.current[selectedFeatureId];
    if (layer && updatedFeature) {
      layer.feature = updatedFeature;
      applyLayerStyle(layer, updatedFeature, true, effectivePointLabelConfig, selectionHighlightColor);
      if (layer.getPopup()) {
        layer.setPopupContent(featureToPopupHtml(updatedFeature));
      }
    }

    commitActiveCollection(nextCollection, { selectedFeatureId });
  }, [activeFeatureCollection, commitActiveCollection, effectivePointLabelConfig, selectedFeatureId, selectedLayer, selectionHighlightColor]);

  const updatePointLabelSettings = useCallback((patch) => {
    if (!selectedLayer) return;

    const nextCollection = cloneGeojson(activeFeatureCollection);
    const currentFields = Array.isArray(pointLabelConfig.fields) ? pointLabelConfig.fields : [];
    const currentModes = Array.isArray(pointLabelConfig.modes) ? pointLabelConfig.modes : [];
    const nextFields = patch.fields !== undefined ? patch.fields : currentFields;
    const nextModes = patch.modes !== undefined ? patch.modes : currentModes;
    const nextMeta = {
      ...(nextCollection.dg_meta && typeof nextCollection.dg_meta === 'object' ? nextCollection.dg_meta : {}),
      pointLabelField: nextFields[0] || '',
      pointLabelFields: nextFields,
      pointLabelMode: nextModes[0] || 'none',
      pointLabelModes: nextModes.length ? nextModes : ['none']
    };

    if (!nextMeta.pointLabelFields.length) {
      nextMeta.pointLabelMode = 'none';
      nextMeta.pointLabelModes = ['none'];
    }

    nextCollection.dg_meta = nextMeta;
    commitActiveCollection(nextCollection, { selectedFeatureId: selectedFeatureIdRef.current });
  }, [activeFeatureCollection, commitActiveCollection, pointLabelConfig.fields, pointLabelConfig.modes, selectedLayer]);

  const toggleSelectedPointLabelPin = useCallback(() => {
    if (selectedFeatureType !== 'point' || !selectedFeatureId) return;

    updateSelectedFeature({
      dg_label_pinned: !selectedFeature?.properties?.dg_label_pinned
    });
  }, [selectedFeature?.properties?.dg_label_pinned, selectedFeatureId, selectedFeatureType, updateSelectedFeature]);

  const handleTogglePointLabelField = useCallback((fieldKey) => {
    const nextFields = pointLabelConfig.fields.includes(fieldKey)
      ? pointLabelConfig.fields.filter((item) => item !== fieldKey)
      : [...pointLabelConfig.fields, fieldKey];

    updatePointLabelSettings({ fields: nextFields });
  }, [pointLabelConfig.fields, updatePointLabelSettings]);

  const handleTogglePointLabelMode = useCallback((modeKey) => {
    let nextModes = pointLabelConfig.modes.includes(modeKey)
      ? pointLabelConfig.modes.filter((item) => item !== modeKey)
      : [...pointLabelConfig.modes.filter((item) => item !== 'none'), modeKey];

    if (!nextModes.length) {
      nextModes = ['none'];
    }

    if (nextModes.includes('none') && nextModes.length > 1) {
      nextModes = nextModes.filter((item) => item !== 'none');
    }

    updatePointLabelSettings({ modes: nextModes });
  }, [pointLabelConfig.modes, updatePointLabelSettings]);

  const handleApplyBorderColorsByAttribute = useCallback((attributeName) => {
    if (!selectedLayer) return;

    const normalizedAttributeName = String(attributeName || '').trim();
    const nextCollection = cloneGeojson(activeFeatureCollection);
    const nextMeta = {
      ...(nextCollection.dg_meta && typeof nextCollection.dg_meta === 'object' ? nextCollection.dg_meta : {})
    };

    if (!normalizedAttributeName) {
      nextMeta.colorByAttribute = '';
      nextMeta.colorByAttributeKey = '';
      nextMeta.colorByAttributePalette = {};
      nextCollection.dg_meta = nextMeta;
      commitActiveCollection(nextCollection, { selectedFeatureId: selectedFeatureIdRef.current });
      alertify.success('Coloreo automatico desactivado');
      return;
    }

    const selectedPresetOption = availableAttributeColorOptions.find((option) => option.value === normalizedAttributeName);
    const selectedManualField = availableAttributeFields.find((option) => option.key === normalizedAttributeName);

    if (!selectedPresetOption && !selectedManualField) {
      alertify.warning('Ese atributo no esta disponible en la capa activa');
      return;
    }

    const selectedActualKey = selectedPresetOption?.actualKey || selectedManualField?.key || '';
    const selectedLabel = selectedPresetOption?.label || selectedManualField?.key || normalizedAttributeName;

    const distinctValues = [...new Set(
      activeFeatures
        .map((feature) => {
          if (selectedPresetOption?.aliases) {
            return getFeatureAttributeValue(feature, selectedPresetOption.aliases);
          }

          return feature?.properties?.[selectedActualKey];
        })
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map((value) => String(value))
    )];
    const colorMap = new Map(
      distinctValues.map((value, index) => [
        value,
        selectedLayerColorPalette[value] || ATTRIBUTE_COLOR_PALETTE[index % ATTRIBUTE_COLOR_PALETTE.length]
      ])
    );

    nextCollection.features = nextCollection.features.map((feature) => {
      const nextFeature = normalizeFeature(feature);
      const attributeValue = selectedPresetOption?.aliases
        ? getFeatureAttributeValue(nextFeature, selectedPresetOption.aliases)
        : nextFeature?.properties?.[selectedActualKey];

      if (attributeValue === null || attributeValue === undefined || attributeValue === '') {
        return nextFeature;
      }

      nextFeature.properties.stroke = colorMap.get(String(attributeValue)) || nextFeature.properties.stroke;
      return nextFeature;
    });

    nextMeta.colorByAttribute = selectedPresetOption?.value || 'manual';
    nextMeta.colorByAttributeKey = selectedActualKey;
    nextMeta.colorByAttributePalette = Object.fromEntries(colorMap.entries());
    nextCollection.dg_meta = nextMeta;

    nextCollection.features.forEach((feature) => {
      const featureId = getFeatureId(feature);
      const layer = layerRegistryRef.current[featureId];
      if (!layer) return;

      layer.feature = feature;
      applyLayerStyle(layer, feature, featureId === selectedFeatureIdRef.current, effectivePointLabelConfig, selectionHighlightColor);
      if (layer.getPopup()) {
        layer.setPopupContent(featureToPopupHtml(feature));
      }
    });

    commitActiveCollection(nextCollection, { selectedFeatureId: selectedFeatureIdRef.current });
    alertify.success(`Bordes coloreados por ${selectedLabel}`);
  }, [activeFeatureCollection, activeFeatures, availableAttributeColorOptions, availableAttributeFields, commitActiveCollection, effectivePointLabelConfig, selectedLayer, selectedLayerColorPalette, selectionHighlightColor]);

  const handleLegendColorChange = useCallback((legendValue, nextColor) => {
    if (!selectedLayer || !selectedLayerColorOption || !legendValue || !nextColor) return;

    const nextCollection = cloneGeojson(activeFeatureCollection);
    const nextMeta = {
      ...(nextCollection.dg_meta && typeof nextCollection.dg_meta === 'object' ? nextCollection.dg_meta : {}),
      colorByAttributePalette: {
        ...(selectedLayerColorPalette || {}),
        [legendValue]: nextColor
      }
    };

    nextCollection.features = nextCollection.features.map((feature) => {
      const nextFeature = normalizeFeature(feature);
      const attributeValue = getFeatureAttributeValueByRule(nextFeature, selectedLayerColorOption);

      if (String(attributeValue || '') !== String(legendValue)) {
        return nextFeature;
      }

      nextFeature.properties.stroke = nextColor;
      return nextFeature;
    });

    nextCollection.dg_meta = nextMeta;

    nextCollection.features.forEach((feature) => {
      const featureId = getFeatureId(feature);
      const layer = layerRegistryRef.current[featureId];
      if (!layer) return;

      layer.feature = feature;
      applyLayerStyle(layer, feature, featureId === selectedFeatureIdRef.current, effectivePointLabelConfig, selectionHighlightColor);
      if (layer.getPopup()) {
        layer.setPopupContent(featureToPopupHtml(feature));
      }
    });

    commitActiveCollection(nextCollection, { selectedFeatureId: selectedFeatureIdRef.current });
  }, [activeFeatureCollection, commitActiveCollection, effectivePointLabelConfig, selectedLayer, selectedLayerColorOption, selectedLayerColorPalette, selectionHighlightColor]);

  const updateLegendVisibilitySettings = useCallback((patch) => {
    if (!selectedLayer) return;

    const nextCollection = cloneGeojson(activeFeatureCollection);
    const nextMeta = {
      ...(nextCollection.dg_meta && typeof nextCollection.dg_meta === 'object' ? nextCollection.dg_meta : {}),
      showLegendOnMap: patch.showLegendOnMap !== undefined ? patch.showLegendOnMap : selectedLayerLegendEnabledOnMap,
      visibleLegendValues: patch.visibleLegendValues !== undefined ? patch.visibleLegendValues : selectedLayerLegendVisibleValues
    };

    nextCollection.dg_meta = nextMeta;
    commitActiveCollection(nextCollection, { selectedFeatureId: selectedFeatureIdRef.current });
  }, [activeFeatureCollection, commitActiveCollection, selectedLayer, selectedLayerLegendEnabledOnMap, selectedLayerLegendVisibleValues]);

  const toggleLegendValueOnMap = useCallback((legendValue) => {
    if (!selectedLayer) return;

    const normalizedValue = String(legendValue);
    const currentValues = selectedLayerLegendVisibleValues.length
      ? selectedLayerLegendVisibleValues
      : selectedLayerColorLegend.map((item) => String(item.value));

    const nextValues = currentValues.includes(normalizedValue)
      ? currentValues.filter((value) => value !== normalizedValue)
      : [...currentValues, normalizedValue];

    updateLegendVisibilitySettings({
      showLegendOnMap: true,
      visibleLegendValues: nextValues
    });
  }, [selectedLayer, selectedLayerColorLegend, selectedLayerLegendVisibleValues, updateLegendVisibilitySettings]);

  const handleDeleteFeature = (featureId) => {
    const layer = layerRegistryRef.current[featureId];
    const editableGroup = editableGroupRef.current;
    if (!layer || !editableGroup) return;

    editableGroup.removeLayer(layer);
    const nextCollection = extractFeatureCollection();
    commitActiveCollection(nextCollection, {
      selectedFeatureId: selectedFeatureId === featureId ? '' : selectedFeatureId
    });
  };

  const handleUndo = () => {
    const tabName = selectedTabRef.current;
    if (!tabName) return;

    ensureHistory(tabName, activeFeatureCollection);
    const history = historyRef.current[tabName];
    if (!history || !history.past.length) {
      alertify.message('No hay cambios para deshacer');
      return;
    }

    history.future.unshift(cloneGeojson(history.present));
    history.present = history.past.pop();
    updateLayerRecord(tabName, history.present);
    rebuildEditableGroup(history.present);
    markLayerDirty(tabName);
    setSelectedFeatureId('');
  };

  const handleRedo = () => {
    const tabName = selectedTabRef.current;
    if (!tabName) return;

    ensureHistory(tabName, activeFeatureCollection);
    const history = historyRef.current[tabName];
    if (!history || !history.future.length) {
      alertify.message('No hay cambios para rehacer');
      return;
    }

    history.past.push(cloneGeojson(history.present));
    history.present = history.future.shift();
    updateLayerRecord(tabName, history.present);
    rebuildEditableGroup(history.present);
    markLayerDirty(tabName);
    setSelectedFeatureId('');
  };

  const handleToolSelection = (toolName) => {
    const requiresLayer = ['point', 'line', 'polygon', 'rectangle', 'circle', 'edit', 'delete'];
    const requiresProject = [...requiresLayer, 'measure-distance', 'measure-area'];

    if (requiresProject.includes(toolName) && !projectId) {
      alertify.warning('Selecciona un proyecto antes de usar el editor');
      return;
    }

    if (requiresLayer.includes(toolName) && !selectedLayer) {
      alertify.warning('Crea o selecciona una capa antes de dibujar');
      return;
    }

    if (requiresLayer.includes(toolName) && !canManage) {
      alertify.warning('No tienes permisos para editar este modulo');
      return;
    }

    setActiveTool((current) => (current === toolName ? 'select' : toolName));
  };

  const clearMeasurements = () => {
    measurementLayerRef.current.clearLayers();
    setMeasurementSummary({
      distanceKm: 0,
      areaHa: 0,
      perimeterKm: 0
    });
    if (activeTool === 'measure-distance' || activeTool === 'measure-area') {
      setActiveTool('select');
    }
  };

  const handleFocusProjectReference = () => {
    const bounds = projectReferenceHasFeatures ? getLayerBounds(projectReferenceGeojson) : null;
    if (!bounds) {
      alertify.message('El proyecto activo no tiene un trazado de referencia disponible');
      return;
    }

    setShowProjectReference(true);
    fitBounds(bounds);
  };

  const emptyStateMessage = !projectId
    ? 'Selecciona un proyecto para comenzar a trabajar en el editor.'
    : !selectedLayer
      ? 'Crea o selecciona una capa para empezar a dibujar y editar.'
      : 'No hay geometrias en la capa activa todavia.';

  return (
    <section className="diseno-geometrico-shell">
      <div className="dg-header-card">
        <div>
          <span className="dg-header-kicker">Modulo activo</span>
          <h1>Diseño Geometrico</h1>
          <p>Editor geoespacial por capas con guardado, autosave y exportacion de la capa activa.</p>
        </div>
        <div className="dg-project-pill">
          <span>Proyecto</span>
          <strong>{selectedProjectName || 'Sin proyecto seleccionado'}</strong>
          <span>{hasProjectReference ? 'Trazado de referencia cargado' : 'Sin trazado de referencia'}</span>
        </div>
      </div>

      <div className="dg-workspace">
        <aside className="dg-left-column">
          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Contexto del editor</h2>
                <p>Las herramientas de dibujo, edicion, medicion y exportacion ahora estan unificadas en la barra superior.</p>
              </div>
            </div>

            <div className="dg-metric-list">
              <div className="dg-property-item">
                <span>Capa activa</span>
                <strong>{selectedLayer ? (selectedLayer.file_name || selectedLayer.tab_name) : 'Sin capa seleccionada'}</strong>
              </div>
              <div className="dg-property-item">
                <span>Trazado del proyecto</span>
                <strong>{hasProjectReference ? (showProjectReference ? 'Visible' : 'Oculto') : 'No cargado'}</strong>
              </div>
              <div className="dg-property-item">
                <span>Modo actual</span>
                <strong>{STATUS_LABELS[selectedLayerStatus] || 'Editor listo'}</strong>
              </div>
            </div>

            <div className="dg-inline-actions">
              <button type="button" className="dg-secondary-btn" disabled={!projectReferenceHasFeatures} onClick={handleFocusProjectReference}>
                <i className="fas fa-route"></i>
                <span>Ir al trazado</span>
              </button>
              <button
                type="button"
                className="dg-secondary-btn"
                disabled={!projectReferenceHasFeatures}
                onClick={() => setShowProjectReference((current) => !current)}
              >
                <i className={`fas ${showProjectReference ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                <span>{showProjectReference ? 'Ocultar trazado' : 'Mostrar trazado'}</span>
              </button>
            </div>
          </section>

          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Capas</h2>
                <p>{isLoading ? 'Cargando capas...' : `${groupedLayers.length} registradas`}</p>
              </div>
            </div>

            <form className="dg-mini-form" onSubmit={handleCreateLayer}>
              <input type="text" value={newLayerName} onChange={(event) => setNewLayerName(event.target.value)} placeholder="Nueva capa" disabled={!projectId || !canManage} />
              <button type="submit" disabled={!projectId || !canManage}>
                <i className="fas fa-plus"></i>
                <span>Nueva capa</span>
              </button>
            </form>

            {!groupedLayers.length ? (
              <div className="dg-empty-box">Todavia no hay capas para este proyecto.</div>
            ) : (
              <div className="dg-layer-list">
                {groupedLayers.map((group) => {
                  const isActive = group.key === selectedLayerGroupKey;
                  const isVisible = isActive ? true : group.layers.some((layer) => visibleTabs[layer.tab_name] ?? true);
                  const groupBounds = getLayerBounds({
                    type: 'FeatureCollection',
                    features: group.layers.flatMap((layer) => parseGeojson(layer.geojson_data)?.features || [])
                  });

                  return (
                    <div key={group.key} className={`dg-layer-row ${isActive ? 'active' : ''}`}>
                      <button type="button" className="dg-layer-main" onClick={() => handleSelectLayerGroup(group)}>
                        <span
                          className={`dg-layer-swatch ${isActive ? 'active' : ''}`}
                          style={{ background: group.swatchColor }}
                        ></span>
                        <div>
                          <strong>{group.label}</strong>
                          <small>
                            {group.totalFeatures} elementos
                            {group.isSplit ? ` · ${group.layers.length} partes internas` : ''}
                          </small>
                        </div>
                      </button>

                      <div className="dg-layer-actions">
                        <button type="button" title={isVisible ? 'Ocultar capa' : 'Mostrar capa'} onClick={() => toggleLayerGroupVisibility(group)}>
                          <i className={`fas ${isVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        </button>
                        <button type="button" title="Zoom a capa" onClick={() => fitBounds(groupBounds)}>
                          <i className="fas fa-expand"></i>
                        </button>
                        <button type="button" title="Eliminar capa" disabled={!canManage} onClick={() => handleDeleteLayerGroup(group)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Subir shapefile</h2>
                <p>  ZIP, RAR, KML o KMZ</p>
              </div>
            </div>

            <form className="dg-upload-form" onSubmit={handleUpload}>
              <label>
                Nombre de la capa
                <input type="text" value={uploadName} onChange={(event) => setUploadName(event.target.value)} placeholder="Ej. Eje vial propuesto" disabled={!projectId || !canManage} />
              </label>

              <label>
                Archivo
                <input type="file" accept={ACCEPTED_FILE_TYPES} onChange={(event) => setUploadFile(event.target.files?.[0] || null)} disabled={!projectId || !canManage} />
              </label>

              {isUploading && uploadProgress && (
                <div className="dg-upload-progress" aria-live="polite">
                  <div className="dg-upload-progress-head">
                    <strong>Subiendo archivo</strong>
                    <span>{uploadProgress.percentage}%</span>
                  </div>
                  <div className="dg-upload-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={uploadProgress.percentage}>
                    <span style={{ width: `${uploadProgress.percentage}%` }}></span>
                  </div>
                  <div className="dg-upload-progress-meta">
                    <span>{formatFileSize(uploadProgress.loadedBytes)} / {formatFileSize(uploadProgress.totalBytes)}</span>
                    <span>{uploadProgress.bytesPerSecond > 0 ? `${formatFileSize(uploadProgress.bytesPerSecond)}/s` : 'Calculando velocidad...'}</span>
                    <span>{uploadProgress.percentage >= 100 ? 'Procesando en servidor...' : `Faltan ${formatRemainingTime(uploadProgress.remainingSeconds)}`}</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={!projectId || !canManage || isUploading}>
                <i className="fas fa-upload"></i>
                <span>{isUploading && uploadProgress ? `Subiendo ${uploadProgress.percentage}%` : 'Publicar capa'}</span>
              </button>
            </form>
          </section>
        </aside>

        <main className="dg-center-column">
          <section className="dg-toolbar-card">
            <div className="dg-toolbar-top">
              <div>
                <h2>Herramientas del editor</h2>
                <p>{isThreeDMode ? 'En vista 3D el mapa queda en modo visual, por eso se bloquean las herramientas de edicion y medicion.' : 'Ordenadas por flujo de trabajo para dibujar, corregir y exportar sin duplicaciones.'}</p>
              </div>
            </div>

            <div className="dg-toolbar-layout">
              <div className="dg-tool-section">
                <div className="dg-tool-section-head">
                  <span className="dg-tool-section-kicker">Edicion</span>
                  <strong>Selecciona y corrige</strong>
                </div>
                <div className="dg-toolbar-group dg-toolbar-group--compact">
                  <ToolbarButton active={activeTool === 'select'} compact disabled={!projectId || isThreeDToolLocked} icon="fa-arrow-pointer" label="Seleccionar" onClick={() => setActiveTool('select')} />
                  <ToolbarButton active={activeTool === 'edit'} compact disabled={!projectId || !selectedLayer || !canManage || isThreeDToolLocked} icon="fa-pen" label="Editar" onClick={() => handleToolSelection('edit')} />
                  <ToolbarButton active={activeTool === 'delete'} compact disabled={!projectId || !selectedLayer || !canManage || isThreeDToolLocked} icon="fa-trash" label="Borrar" onClick={() => handleToolSelection('delete')} />
                  <ToolbarButton active={false} compact disabled={!projectId || !selectedLayer || isThreeDToolLocked} icon="fa-rotate-left" label="Deshacer" onClick={handleUndo} />
                  <ToolbarButton active={false} compact disabled={!projectId || !selectedLayer || isThreeDToolLocked} icon="fa-rotate-right" label="Rehacer" onClick={handleRedo} />
                </div>
              </div>

              <div className="dg-tool-section">
                <div className="dg-tool-section-head">
                  <span className="dg-tool-section-kicker">Dibujo</span>
                  <strong>Crea geometrias</strong>
                </div>
                <div className="dg-toolbar-group dg-toolbar-group--compact">
                  <ToolbarButton active={activeTool === 'point'} compact disabled={!projectId || !selectedLayer || !canManage || isThreeDToolLocked} icon="fa-location-dot" label="Punto" onClick={() => handleToolSelection('point')} />
                  <ToolbarButton active={activeTool === 'line'} compact disabled={!projectId || !selectedLayer || !canManage || isThreeDToolLocked} icon="fa-share-nodes" label="Linea" onClick={() => handleToolSelection('line')} />
                  <ToolbarButton active={activeTool === 'polygon'} compact disabled={!projectId || !selectedLayer || !canManage || isThreeDToolLocked} icon="fa-draw-polygon" label="Poligono" onClick={() => handleToolSelection('polygon')} />
                  <ToolbarButton active={activeTool === 'rectangle'} compact disabled={!projectId || !selectedLayer || !canManage || isThreeDToolLocked} icon="fa-vector-square" label="Rectangulo" onClick={() => handleToolSelection('rectangle')} />
                  <ToolbarButton active={activeTool === 'circle'} compact disabled={!projectId || !selectedLayer || !canManage || isThreeDToolLocked} icon="fa-circle-notch" label="Circulo" onClick={() => handleToolSelection('circle')} />
                </div>
              </div>

              <div className="dg-tool-section">
                <div className="dg-tool-section-head">
                  <span className="dg-tool-section-kicker">Salida</span>
                  <strong>Mide, guarda y exporta</strong>
                </div>
                <div className="dg-toolbar-group dg-toolbar-group--compact">
                  <ToolbarButton active={activeTool === 'measure-distance'} compact disabled={!projectId || isThreeDToolLocked} icon="fa-ruler" label="Medir" onClick={() => handleToolSelection('measure-distance')} />
                  <ToolbarButton active={activeTool === 'measure-area'} compact disabled={!projectId || isThreeDToolLocked} icon="fa-ruler-combined" label="Medir area" onClick={() => handleToolSelection('measure-area')} />
                  <ToolbarButton active={false} compact disabled={!projectId || !selectedLayer || !canManage || isThreeDToolLocked} icon="fa-floppy-disk" label="Guardar" onClick={handleSaveCurrentLayer} />
                  <ToolbarButton active={false} compact disabled={!projectId || !selectedLayer} icon="fa-file-export" label="GeoJSON" onClick={handleExportGeojson} />
                  <ToolbarButton active={false} compact disabled={!projectId || !selectedLayer} icon="fa-earth-americas" label="KML" onClick={handleExportKml} />
                  <ToolbarButton active={false} compact disabled={!projectId || !selectedLayer} icon="fa-file" label="Shapefile" onClick={handleExportshape} />
                </div>
              </div>
            </div>

            <div className={`dg-save-badge ${selectedLayerStatus}`}>
              <span>{STATUS_LABELS[selectedLayerStatus] || STATUS_LABELS.saved}</span>
            </div>
          </section>

          <section className="dg-map-card">
            {projectId ? (
              <>
                <div className="dg-map-view-switch" role="group" aria-label="Cambiar vista del mapa">
                  {!isThreeDMode && Object.values(BASEMAPS).map((baseMap) => (
                    <button
                      key={baseMap.key}
                      type="button"
                      className={`dg-map-view-btn ${baseMapKey === baseMap.key ? 'active' : ''}`}
                      onClick={() => setBaseMapKey(baseMap.key)}
                    >
                      <i className={`fas ${baseMap.icon}`}></i>
                      <span>{baseMap.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`dg-map-view-btn ${isThreeDMode ? 'active' : ''}`}
                    onClick={() => setIsThreeDMode((current) => !current)}
                    disabled={!MAPTILER_KEY}
                    title={MAPTILER_KEY ? 'Alternar vista 3D de MapTiler' : 'Configura la key de MapTiler para usar 3D'}
                  >
                    <i className="fas fa-cubes"></i>
                    <span>{isThreeDMode ? 'Volver 2D' : '3D'}</span>
                  </button>
                </div>

                {isThreeDMode ? (
                  <MaptilerTerrainMap
                    activeGeojson={activeFeatureCollection}
                    projectReferenceGeojson={projectReferenceGeojson}
                    showProjectReference={showProjectReference && projectReferenceHasFeatures}
                  />
                ) : (
                  <MapContainer
                    className="dg-map"
                    center={[-12.0464, -77.0428]}
                    zoom={6}
                    zoomControl={false}
                    doubleClickZoom
                    preferCanvas
                    maxZoom={activeBaseMap.maxZoom || DG_MAX_MAP_ZOOM}
                    zoomSnap={0.25}
                    zoomDelta={0.5}
                    wheelPxPerZoomLevel={80}
                  >
                    <TileLayer
                      key={activeBaseMap.key}
                      attribution={activeBaseMap.attribution}
                      url={activeBaseMap.url}
                      maxNativeZoom={activeBaseMap.maxNativeZoom || 19}
                      maxZoom={activeBaseMap.maxZoom || DG_MAX_MAP_ZOOM}
                    />
                    <ZoomControl position="topleft" />
                    <ScaleControl position="bottomleft" />
                    <MapLifecycle mapRef={mapRef} measurementLayerRef={measurementLayerRef} />
                    <MapZoomTracker onZoomChange={setMapZoom} />
                    <MapClickDeselect onDeselect={handleMapDeselect} />
                    <ActiveToolController
                      activeTool={activeTool}
                      editableGroupRef={editableGroupRef}
                      measurementLayerRef={measurementLayerRef}
                      canEdit={canManage}
                      onFeatureCreated={handleFeatureCreated}
                      onFeaturesEdited={handleFeaturesEdited}
                      onFeaturesDeleted={handleFeaturesDeleted}
                      onMeasurementUpdate={setMeasurementSummary}
                      onToolReset={() => setActiveTool('select')}
                    />

                    {projectReferenceHasFeatures && showProjectReference && (
                      <GeoJSON
                        key="project-reference"
                        data={projectReferenceGeojson}
                        style={getProjectReferenceStyle}
                        pointToLayer={(feature, latlng) => L.circleMarker(latlng, {
                          radius: 5,
                          color: '#ffffff',
                          weight: 2,
                          fillColor: '#f97316',
                          fillOpacity: 1
                        })}
                        onEachFeature={(feature, leafletLayer) => {
                          leafletLayer.bindPopup(`
                            <div class="dg-popup-reference-title">Trazado del proyecto</div>
                            ${featureToPopupHtml(feature)}
                          `);
                        }}
                      />
                    )}

                    {layers
                      .filter((layer) => layer.tab_name !== selectedTabName && (visibleTabs[layer.tab_name] ?? true))
                      .map((layer) => (
                        <GeoJSON
                          key={layer.tab_name}
                          data={layer.geojson_data}
                          style={(feature) => getVectorStyle(feature, false, selectionHighlightColor)}
                          pointToLayer={(feature, latlng) => {
                            const pointColor = feature?.properties?.fill || feature?.properties?.stroke || '#ef4444';
                            const pointRadius = Math.max(4, Math.min(8, (Number(feature?.properties?.dg_marker_size) || 14) / 2.1));

                            return L.circleMarker(latlng, {
                              radius: pointRadius,
                              color: '#ffffff',
                              weight: 2,
                              fillColor: pointColor,
                              fillOpacity: 0.95
                            });
                          }}
                          onEachFeature={(feature, leafletLayer) => {
                            leafletLayer.bindPopup(featureToPopupHtml(feature));
                          }}
                        />
                      ))}

                    <FeatureGroup ref={editableGroupRef}></FeatureGroup>
                  </MapContainer>
                )}

                {visibleLegendItemsOnMap.length > 0 && (
                  <div className="dg-map-inline-legend">
                    <div className="dg-map-inline-legend-title">Leyenda</div>
                    {visibleLegendItemsOnMap.map((item) => (
                      <div key={item.value} className="dg-map-inline-legend-row">
                        <span className="dg-map-inline-legend-swatch" style={{ background: item.color }}></span>
                        <span className="dg-map-inline-legend-label">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="dg-map-empty">
                <div>
                  <h2>Mapa de Diseno Geometrico</h2>
                  <p>{emptyStateMessage}</p>
                </div>
              </div>
            )}
          </section>

          {showLabelTable && selectedFeature && isPointFeature(selectedFeature) && pointLabelConfig.fields.length > 0 && (
            <section className="dg-table-card dg-label-table-card">
              <div className="dg-panel-head">
                <div>
                  <h2>
                    <i className="fas fa-tags" style={{ marginRight: 7, color: 'var(--dg-primary)' }}></i>
                    Tabla de etiquetas
                  </h2>
                  <p>Datos del punto seleccionado: {selectedFeature.properties?.dg_name || 'Sin nombre'}</p>
                </div>
                <button type="button" className="dg-secondary-btn" onClick={() => setShowLabelTable(false)}>
                  <i className="fas fa-xmark"></i>
                  <span>Cerrar</span>
                </button>
              </div>
              <div className="dg-table-wrap">
                <table className="dg-feature-table dg-label-data-table">
                  <thead>
                    <tr>
                      <th className="dg-label-th-name">Punto</th>
                      {pointLabelConfig.fields.map((field) => (
                        <th key={field}>{field}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="active">
                      <td className="dg-label-td-name">
                        <strong>{selectedFeature.properties?.dg_name || 'Sin nombre'}</strong>
                      </td>
                      {pointLabelConfig.fields.map((field) => {
                        const val = selectedFeature.properties?.[field];
                        return (
                          <td key={field}>
                            {val !== null && val !== undefined && val !== '' ? String(val) : <span style={{ color: 'var(--dg-muted)' }}>-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section ref={tableSectionRef} className="dg-table-card">
            <div className="dg-panel-head">
              <div>
                <h2>Geometrias creadas ({activeFeatures.length})</h2>
                <p>{selectedLayer ? `Capa activa: ${selectedLayer.file_name || selectedLayer.tab_name}` : 'Sin capa activa'}</p>
              </div>
            </div>

            {!activeFeatures.length ? (
              <div className="dg-empty-box">{emptyStateMessage}</div>
            ) : (
              <div className="dg-table-wrap">
                <table className="dg-feature-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Longitud / Area</th>
                      <th>Fecha de creacion</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedActiveFeatures.map((feature) => {
                      const featureId = getFeatureId(feature);
                      const metrics = getFeatureMetrics(feature);
                      const isSelected = selectedFeatureId === featureId;

                      return (
                        <tr key={featureId} className={isSelected ? 'active' : ''}>
                          <td>
                            <button type="button" className="dg-feature-link" onClick={() => {
                              setSelectedFeatureId(featureId);
                              focusFeatureById(featureId);
                              setActiveTool('select');
                            }}>
                              {feature.properties?.dg_name || 'Sin nombre'}
                            </button>
                          </td>
                          <td>{getFeatureLabel(feature)}</td>
                          <td>{metrics.summary}</td>
                          <td>{formatDate(feature.properties?.dg_created_at)}</td>
                          <td>
                            <div className="dg-row-actions">
                              <button type="button" title="Seleccionar" onClick={() => {
                                setSelectedFeatureId(featureId);
                                focusFeatureById(featureId);
                              }}>
                                <i className="fas fa-crosshairs"></i>
                              </button>
                              <button type="button" title="Editar" onClick={() => {
                                setSelectedFeatureId(featureId);
                                setActiveTool('select');
                              }}>
                                <i className="fas fa-pen"></i>
                              </button>
                              <button type="button" title="Eliminar" disabled={!canManage} onClick={() => handleDeleteFeature(featureId)}>
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {activeFeatures.length > DG_TABLE_PAGE_SIZE && (
                  <div className="dg-table-pagination">
                    <span className="dg-table-pagination-status">
                      Mostrando {((featureTablePage - 1) * DG_TABLE_PAGE_SIZE) + 1}
                      {' '}a {Math.min(featureTablePage * DG_TABLE_PAGE_SIZE, activeFeatures.length)}
                      {' '}de {activeFeatures.length}
                    </span>
                    <div className="dg-table-pagination-actions">
                      <button type="button" className="dg-secondary-btn" disabled={featureTablePage <= 1} onClick={() => setFeatureTablePage((current) => Math.max(1, current - 1))}>
                        <i className="fas fa-chevron-left"></i>
                        <span>Anterior</span>
                      </button>
                      <span className="dg-table-pagination-page">Pagina {featureTablePage} / {totalFeatureTablePages}</span>
                      <button type="button" className="dg-secondary-btn" disabled={featureTablePage >= totalFeatureTablePages} onClick={() => setFeatureTablePage((current) => Math.min(totalFeatureTablePages, current + 1))}>
                        <span>Siguiente</span>
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        <aside className="dg-right-column">
          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Resumen de capa</h2>
                <p>{selectedLayer ? `Capa activa: ${selectedLayer.file_name || selectedLayer.tab_name}` : 'Sin capa activa'}</p>
              </div>
            </div>

            <div className="dg-metric-list">
              <div className="dg-property-item">
                <span>Geometrias creadas</span>
                <strong>{activeFeatures.length}</strong>
              </div>
              <div className="dg-property-item">
                <span>Puntos</span>
                <strong>{activeFeatureSummary.points}</strong>
              </div>
              <div className="dg-property-item">
                <span>Lineas</span>
                <strong>{activeFeatureSummary.lines}</strong>
              </div>
              <div className="dg-property-item">
                <span>Areas</span>
                <strong>{activeFeatureSummary.areas}</strong>
              </div>
            </div>

            <button type="button" className="dg-secondary-btn dg-full-btn" onClick={scrollToFeatureTable} disabled={!activeFeatures.length}>
              <i className="fas fa-table-list"></i>
              <span>Ver lista completa</span>
            </button>
          </section>

          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Colores por atributo</h2>
                <p>Aplica colores distintos al borde segun los campos del shape o KML.</p>
              </div>
            </div>

            <div className="dg-property-stack">
              <label>
                Sugerencias automaticas
                <select
                  value={selectedPresetColorRule}
                  onChange={(event) => handleApplyBorderColorsByAttribute(event.target.value)}
                  disabled={!canManage || !selectedLayer || !availableAttributeColorOptions.length}
                >
                  <option value="">Manual</option>
                  {availableAttributeColorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.actualKey} - {option.valueCount} valores)
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Campo manual
                <input
                  type="text"
                  list="dg-color-attribute-options"
                  value={manualColorAttributeInput}
                  onChange={(event) => setManualColorAttributeInput(event.target.value)}
                  placeholder="Escribe o elige el nombre exacto del atributo"
                  disabled={!canManage || !selectedLayer || !availableAttributeFields.length}
                />
                <datalist id="dg-color-attribute-options">
                  {availableAttributeFields.map((option) => (
                    <option key={option.key} value={option.key}>
                      {`${option.key} (${option.valueCount} valores)`}
                    </option>
                  ))}
                </datalist>
              </label>

              <button
                type="button"
                className="dg-secondary-btn dg-full-btn"
                onClick={() => handleApplyBorderColorsByAttribute(manualColorAttributeInput)}
                disabled={!canManage || !selectedLayer || !manualColorAttributeInput.trim()}
              >
                <i className="fas fa-palette"></i>
                <span>Aplicar campo manual</span>
              </button>

              {!!availableAttributeFields.length && (
                <div className="dg-attribute-chip-list">
                  {availableAttributeFields.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`dg-attribute-chip ${selectedLayerColorKey === option.key ? 'active' : ''}`}
                      onClick={() => {
                        setManualColorAttributeInput(option.key);
                        handleApplyBorderColorsByAttribute(option.key);
                      }}
                      disabled={!canManage || !selectedLayer}
                    >
                      {option.key}
                    </button>
                  ))}
                </div>
              )}

              <div className="dg-property-item">
                <span>Estado</span>
                <strong>
                  {selectedLayerColorOption
                    ? `Activo por ${selectedLayerColorKey || selectedLayerColorOption.actualKey || selectedLayerColorOption.key}`
                    : 'Sin regla automatica'}
                </strong>
              </div>

              {!!availableAttributeFields.length && (
                <div className="dg-property-item">
                  <span>Atributos detectados</span>
                  <strong>{availableAttributeFields.length} disponibles</strong>
                </div>
              )}

              {selectedLayerColorLegend.length > 0 && (
                <div className="dg-property-item">
                  <span>Leyenda en el mapa</span>
                  <button
                    type="button"
                    className={`dg-legend-toggle-btn ${selectedLayerLegendEnabledOnMap ? 'active' : ''}`}
                    onClick={() => updateLegendVisibilitySettings({
                      showLegendOnMap: !selectedLayerLegendEnabledOnMap,
                      visibleLegendValues: selectedLayerLegendVisibleValues.length
                        ? selectedLayerLegendVisibleValues
                        : selectedLayerColorLegend.map((item) => String(item.value))
                    })}
                    disabled={!canManage || !selectedLayer}
                  >
                    {selectedLayerLegendEnabledOnMap ? 'Habilitada' : 'Habilitar'}
                  </button>
                </div>
              )}

              {selectedLayerColorLegend.length ? (
                <div className="dg-color-legend">
                  {selectedLayerColorLegend.map((item) => (
                    <div key={item.value} className="dg-color-legend-row">
                      <label className="dg-color-legend-swatch-button" title={`Cambiar color de ${item.value}`}>
                        <span className="dg-color-legend-swatch" style={{ background: item.color }}></span>
                        <input
                          type="color"
                          value={item.color}
                          onChange={(event) => handleLegendColorChange(item.value, event.target.value)}
                          disabled={!canManage || !selectedLayer}
                        />
                      </label>
                      <span className="dg-color-legend-label">{item.value}</span>
                      <button
                        type="button"
                        className={`dg-legend-visibility-btn ${visibleLegendItemsOnMap.some((legendItem) => String(legendItem.value) === String(item.value)) ? 'active' : ''}`}
                        onClick={() => toggleLegendValueOnMap(item.value)}
                        disabled={!canManage || !selectedLayer}
                      >
                        {visibleLegendItemsOnMap.some((legendItem) => String(legendItem.value) === String(item.value)) ? 'Se muestra' : 'Oculta'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dg-empty-box">Elige una sugerencia o escribe el nombre exacto de cualquier atributo detectado en la capa para repartir colores automaticamente.</div>
              )}
            </div>
          </section>

          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Propiedades</h2>

                <p> {selectedFeature ? 'Datos de la geometria seleccionada' : ' Eliga una geometria para poder ver sus propiedades.'} </p>
              </div>
            </div>

            {selectedFeature ? (
              <div className="dg-property-stack">
                <div className="dg-property-item">
                  <span>Tipo</span>
                  <strong>{getFeatureLabel(selectedFeature)}</strong>
                </div>

                <label>
                  Nombre
                  <input type="text" value={selectedFeature.properties?.dg_name || ''} onChange={(event) => updateSelectedFeature({ dg_name: event.target.value })} disabled={!canManage} />
                </label>

                <div className="dg-property-item">
                  <span>{selectedFeatureType === 'line' ? 'Longitud' : selectedFeatureType === 'point' ? 'Medida' : 'Area'}</span>
                  <strong>
                    {selectedFeatureType === 'line'
                      ? (selectedFeatureMetrics.lengthKm ? `${selectedFeatureMetrics.lengthKm.toFixed(2)} km` : '-')
                      : selectedFeatureType === 'point'
                        ? '-'
                        : (selectedFeatureMetrics.areaHa ? `${selectedFeatureMetrics.areaHa.toFixed(2)} ha` : '-')}
                  </strong>
                </div>

                {selectedFeatureType === 'circle' && (
                  <div className="dg-property-item">
                    <span>Radio</span>
                    <strong>{selectedFeature?.properties?.dg_radius_m ? `${Number(selectedFeature.properties.dg_radius_m).toFixed(1)} m` : '-'}</strong>
                  </div>
                )}

                <div className="dg-property-item">
                  <span>Color de borde</span>
                  <label className="dg-color-field">
                    <input
                      type="color"
                      value={selectedFeature.properties?.stroke || '#1e88e5'}
                      onChange={(event) => updateSelectedFeature(
                        selectedFeatureType === 'point'
                          ? { stroke: event.target.value, fill: event.target.value }
                          : { stroke: event.target.value }
                      )}
                      disabled={!canManage}
                    />
                    <span>{selectedFeature.properties?.stroke || '#1e88e5'}</span>
                  </label>
                </div>

                {selectedFeatureSupportsFill && (
                  <div className="dg-property-item">
                    <span>Color de relleno</span>
                    <label className="dg-color-field">
                      <input
                        type="color"
                        value={selectedFeature.properties?.fill || selectedFeature.properties?.stroke || '#86efac'}
                        onChange={(event) => updateSelectedFeature({ fill: event.target.value })}
                        disabled={!canManage}
                      />
                      <span>{selectedFeature.properties?.fill || selectedFeature.properties?.stroke || '#86efac'}</span>
                    </label>
                  </div>
                )}

                <label>
                  Grosor
                  <select value={selectedFeature.properties?.['stroke-width'] || 3} onChange={(event) => updateSelectedFeature({ 'stroke-width': Number(event.target.value) })} disabled={!canManage}>
                    <option value={2}>2 px</option>
                    <option value={3}>3 px</option>
                    <option value={4}>4 px</option>
                    <option value={5}>5 px</option>
                    <option value={6}>6 px</option>
                  </select>
                </label>

                <div className="dg-attributes-section">
                  <div className="dg-attributes-head">
                    <span>Atributos de origen</span>
                    <strong>{selectedFeatureSourceAttributes.length}</strong>
                  </div>

                  {selectedFeatureSourceAttributes.length ? (
                    <div className="dg-attributes-list">
                      {selectedFeatureSourceAttributes.map(([key, value]) => (
                        <div key={key} className="dg-attribute-row">
                          <span className="dg-attribute-key">{key}</span>
                          <strong className="dg-attribute-value">{String(value)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dg-empty-box">Esta geometria no trae atributos adicionales del shape o KML.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="dg-empty-box">No hay una geometria seleccionada.</div>
            )}
          </section>

          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Etiquetas</h2>
                <p>Muestra un campo sobre puntos y tambien sobre lineas seleccionadas.</p>
              </div>
            </div>

            <div className="dg-property-stack">
              <label>
                Campo a mostrar
                <div className="dg-option-chip-list">
                  {availablePointLabelFields.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`dg-option-chip ${pointLabelConfig.fields.includes(option.key) ? 'active' : ''}`}
                      onClick={() => handleTogglePointLabelField(option.key)}
                      disabled={!canManage || !selectedLayer || !availablePointLabelFields.length}
                    >
                      {option.key} ({option.count} puntos)
                    </button>
                  ))}
                </div>
              </label>

              <label>
                Donde mostrar
                <div className="dg-option-chip-list">
                  {[
                    { key: 'none', label: 'No mostrar' },
                    { key: 'selected', label: 'Geometria seleccionada' },
                    { key: 'tagged', label: 'Puntos marcados' },
                    { key: 'all', label: 'Todos los puntos' },
                    { key: 'hover', label: 'Al pasar el cursor' }
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`dg-option-chip ${pointLabelConfig.modes.includes(option.key) ? 'active' : ''}`}
                      onClick={() => handleTogglePointLabelMode(option.key)}
                      disabled={!canManage || !selectedLayer || !pointLabelConfig.fields.length}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </label>

              <div className="dg-property-item">
                <span>Estado</span>
                <strong>
                  {!pointLabelConfig.fields.length
                    ? 'Sin campo activo'
                    : pointLabelConfig.modes.includes('none')
                      ? 'Etiquetas desactivadas'
                      : `${pointLabelConfig.fields.length} campo(s) y ${pointLabelConfig.modes.length} ubicacion(es) activas`}
                </strong>
              </div>

              <div className="dg-property-item">
                <span>Comportamiento en lineas</span>
                <strong>Usa los mismos campos y se muestra al seleccionar la linea</strong>
              </div>

              {selectedFeatureType === 'point' && pointLabelConfig.modes.includes('tagged') && (
                <button type="button" className="dg-secondary-btn dg-full-btn" disabled={!canManage || !selectedFeature} onClick={toggleSelectedPointLabelPin}>
                  <i className={`fas ${selectedFeature?.properties?.dg_label_pinned ? 'fa-tag' : 'fa-thumbtack'}`}></i>
                  <span>{selectedFeature?.properties?.dg_label_pinned ? 'Quitar marca de etiqueta' : 'Marcar punto para etiqueta'}</span>
                </button>
              )}

              {!availablePointLabelFields.length && (
                <div className="dg-empty-box">La capa activa no tiene atributos disponibles en puntos o lineas para etiquetar.</div>
              )}

              <button
                type="button"
                className={`dg-secondary-btn dg-full-btn ${showLabelTable ? 'active' : ''}`}
                disabled={!selectedLayer || !pointLabelConfig.fields.length}
                onClick={() => setShowLabelTable((v) => !v)}
                style={showLabelTable ? { background: 'linear-gradient(135deg, var(--dg-primary), #11a2b0)', color: '#fff', borderColor: 'rgba(15,143,149,0.85)' } : {}}
              >
                <i className={`fas ${showLabelTable ? 'fa-table-columns' : 'fa-table'}`}></i>
                <span>{showLabelTable ? 'Ocultar tabla de etiquetas' : 'Ver tabla de etiquetas al seleccionar'}</span>
              </button>
            </div>
          </section>

          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Mediciones</h2>
                <p>Sesion libre del mapa</p>
              </div>
            </div>

            <div className="dg-metric-list">
              <div className="dg-property-item">
                <span>Distancia total</span>
                <strong>{measurementSummary.distanceKm ? `${measurementSummary.distanceKm.toFixed(2)} km` : '-'}</strong>
              </div>
              <div className="dg-property-item">
                <span>Area total</span>
                <strong>{measurementSummary.areaHa ? `${measurementSummary.areaHa.toFixed(2)} ha` : '-'}</strong>
              </div>
              <div className="dg-property-item">
                <span>Perimetro</span>
                <strong>{measurementSummary.perimeterKm ? `${measurementSummary.perimeterKm.toFixed(2)} km` : '-'}</strong>
              </div>
            </div>

            <button type="button" className="dg-primary-btn" onClick={clearMeasurements}>
              <i className="fas fa-broom"></i>
              <span>Limpiar mediciones</span>
            </button>
          </section>

          <section className="dg-panel">
            <div className="dg-panel-head">
              <div>
                <h2>Coordenadas</h2>
                <p>{selectedFeature ? 'Referencia de la geometria' : 'Sin seleccion'}</p>
              </div>
            </div>

            <div className="dg-metric-list">
              <div className="dg-property-item">
                <span>Latitud</span>
                <strong>{selectedFeatureCoordinates.latitude}</strong>
              </div>
              <div className="dg-property-item">
                <span>Longitud</span>
                <strong>{selectedFeatureCoordinates.longitude}</strong>
              </div>
              <div className="dg-property-item">
                <span>Elevacion</span>
                <strong>{selectedFeature?.properties?.elevation || 'No disponible'}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
