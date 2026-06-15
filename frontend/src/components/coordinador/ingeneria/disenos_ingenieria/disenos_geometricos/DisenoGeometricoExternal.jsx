import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { GeoJSON, MapContainer, ScaleControl, TileLayer, ZoomControl, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import axiosInstance from '../../../../../api/axios';
import { useAuth } from '../../../../../data/contexts/AuthContext';
import './DisenoGeometricoModes.css';
import './DisenoGeometrico.css';

const DG_EXTERNAL_MAX_MAP_ZOOM = 30;
const DG_POINT_LABEL_MAX_VISIBLE = 140;
const DG_POINT_LABEL_MIN_ZOOM = 16;
const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;

const DG_EXTERNAL_BASEMAPS = {
  street: {
    key: 'street',
    label: 'Mapa',
    icon: 'fa-map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  hybrid: {
    key: 'hybrid',
    label: 'Hibrido',
    icon: 'fa-layer-group',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
};

const DG_EXTERNAL_FALLBACK_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#0f766e'];
const EMPTY_FEATURE_COLLECTION = Object.freeze({
  type: 'FeatureCollection',
  features: []
});

const cloneGeojson = (value) => JSON.parse(JSON.stringify(value || EMPTY_FEATURE_COLLECTION));

const parseGeojson = (value) => {
  if (!value) return cloneGeojson(EMPTY_FEATURE_COLLECTION);
  if (typeof value === 'object') return cloneGeojson(value);

  try {
    return cloneGeojson(JSON.parse(value));
  } catch (error) {
    console.warn('No se pudo parsear GeoJSON en la vista externa de Diseno Geometrico:', error);
    return cloneGeojson(EMPTY_FEATURE_COLLECTION);
  }
};

const normalizeFeatureCollection = (value) => {
  if (!value || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
    return cloneGeojson(EMPTY_FEATURE_COLLECTION);
  }

  const normalizedCollection = {
    type: 'FeatureCollection',
    features: value.features
      .filter((feature) => feature?.geometry)
      .map((feature) => cloneGeojson(feature))
  };

  if (value?.dg_meta && typeof value.dg_meta === 'object') {
    normalizedCollection.dg_meta = cloneGeojson(value.dg_meta);
  }

  return normalizedCollection;
};

const getLayerDisplayName = (layer) => layer?.file_name || layer?.tab_name || 'Capa sin nombre';

const getGeojsonFeatures = (layer) => (
  Array.isArray(layer?.geojson_data?.features) ? layer.geojson_data.features.filter((feature) => feature?.geometry) : []
);

const getFeatureProperties = (feature) => (
  feature?.properties && typeof feature.properties === 'object' ? feature.properties : {}
);

const getLayerMeta = (layer) => (
  layer?.geojson_data?.dg_meta && typeof layer.geojson_data.dg_meta === 'object'
    ? layer.geojson_data.dg_meta
    : {}
);

const getLayerColor = (layer, index) => {
  const firstFeature = getGeojsonFeatures(layer)[0];
  const properties = getFeatureProperties(firstFeature);
  return properties.stroke || properties.fill || DG_EXTERNAL_FALLBACK_COLORS[index % DG_EXTERNAL_FALLBACK_COLORS.length];
};

const countGeometryType = (features, token) => (
  features.reduce((total, feature) => (feature?.geometry?.type || '').includes(token) ? total + 1 : total, 0)
);

const getLayerSummary = (layer) => {
  const features = getGeojsonFeatures(layer);
  return {
    total: features.length,
    points: countGeometryType(features, 'Point'),
    lines: countGeometryType(features, 'Line'),
    polygons: countGeometryType(features, 'Polygon')
  };
};

const getLayerBounds = (geojsonData) => {
  try {
    const bounds = L.geoJSON(geojsonData).getBounds();
    return bounds.isValid() ? bounds : null;
  } catch (error) {
    return null;
  }
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildFeaturePopupHtml = (feature) => {
  const entries = Object.entries(getFeatureProperties(feature))
    .filter(([key, value]) => value !== null && value !== undefined && value !== '' && !key.startsWith('dg_'))
    .slice(0, 12);

  if (!entries.length) {
    return '<div class="dg-external-popup-empty">Sin atributos disponibles</div>';
  }

  return `
    <div class="dg-external-popup">
      ${entries.map(([key, value]) => `
        <div class="dg-external-popup-row">
          <span class="dg-external-popup-key">${escapeHtml(key)}</span>
          <span class="dg-external-popup-value">${escapeHtml(value)}</span>
        </div>
      `).join('')}
    </div>
  `;
};

const getFeatureExternalLabel = (feature, layer) => {
  const properties = getFeatureProperties(feature);
  const meta = getLayerMeta(layer);
  const labelField = String(meta.pointLabelField || '').trim();

  if (labelField && properties[labelField] !== undefined && properties[labelField] !== null && properties[labelField] !== '') {
    return String(properties[labelField]);
  }

  if (properties.dg_name) return String(properties.dg_name);
  return '';
};

const ATTRIBUTE_COLOR_PALETTE = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#db2777', '#0f766e', '#9333ea', '#ea580c', '#0891b2', '#4f46e5', '#65a30d'
];

const ATTRIBUTE_COLOR_OPTIONS = [
  { value: 'descript', label: 'Descript', aliases: ['descript', 'descrip', 'description', 'descripcion'] },
  { value: 'offset', label: 'Offset', aliases: ['offset', 'offsets'] },
  { value: 'eje', label: 'Eje', aliases: ['eje', 'axis'] },
  { value: 'daylight', label: 'Daylight', aliases: ['daylight', 'dylight', 'dylith'] }
];

const isPointFeature = (feature) => feature?.geometry?.type?.includes('Point');
const isLineFeature = (feature) => feature?.geometry?.type?.includes('Line');

const normalizeAttributeToken = (value) =>
  String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const getFeatureSourceAttributes = (feature) => {
  const properties = feature?.properties || {};
  const hiddenKeys = new Set(['stroke', 'stroke-width', 'stroke-opacity', 'fill', 'fill-opacity', 'visible', 'nombre', 'name']);
  return Object.entries(properties).filter(([key, value]) => (
    !String(key).startsWith('dg_') && !hiddenKeys.has(key) && value !== null && value !== undefined && value !== ''
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

const getFeatureAttributeValueByRule = (feature, colorOption) => {
  if (!colorOption) return '';
  if ('aliases' in colorOption) return getFeatureAttributeValue(feature, colorOption.aliases);
  return feature?.properties?.[colorOption.key] || '';
};

const getPointLabelConfig = (collection) => {
  const meta = collection?.dg_meta && typeof collection.dg_meta === 'object' ? collection.dg_meta : {};
  const fields = Array.isArray(meta.pointLabelFields)
    ? meta.pointLabelFields.filter(Boolean)
    : (meta.pointLabelField ? [meta.pointLabelField] : []);
  const modes = Array.isArray(meta.pointLabelModes)
    ? meta.pointLabelModes.filter(Boolean)
    : (meta.pointLabelMode ? [meta.pointLabelMode] : ['none']);
  return { field: fields[0] || '', mode: modes[0] || 'none', fields, modes };
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
  return entries.map((e) => `<span class="dg-label-row"><b>${e.field}:</b> ${e.value}</span>`).join('');
};

const resolvePointLabelText = (feature, labelConfig, isSelected) => {
  if (!isPointFeature(feature)) return '';
  const entries = resolveLabelEntriesFromFields(feature, labelConfig?.fields);
  if (!entries.length) return '';
  if (labelConfig.modes?.includes('all')) return buildVerticalLabelHtml(entries);
  if (labelConfig.modes?.includes('selected') && isSelected) return buildVerticalLabelHtml(entries);
  if (labelConfig.modes?.includes('tagged') && (feature?.properties || {}).dg_label_pinned) return buildVerticalLabelHtml(entries);
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

const buildVerticalLabelPlainText = (entries) => {
  if (!entries.length) return '';
  return entries.map((e) => `${e.field}: ${e.value}`).join('\n');
};

const resolveLineLabelText = (feature, labelConfig, isSelected) => {
  if (!isLineFeature(feature)) return '';
  if (!isSelected) return '';

  const entries = resolveLabelEntriesFromFields(feature, labelConfig?.fields);
  return buildVerticalLabelPlainText(entries);
};

const resolveSelectionHighlightColor = (collection) => {
  const usedColors = new Set();
  const DG_SELECTION_HIGHLIGHT_CANDIDATES = ['#111827', '#ff00a8', '#00c2ff', '#facc15', '#fb7185', '#14b8a6'];

  if (Array.isArray(collection?.features)) {
    collection.features.forEach((feature) => {
      const properties = feature?.properties || {};
      if (properties.stroke) {
        usedColors.add(String(properties.stroke).toLowerCase());
      }
      if (properties.fill) {
        usedColors.add(String(properties.fill).toLowerCase());
      }
    });
  }

  return DG_SELECTION_HIGHLIGHT_CANDIDATES.find((color) => !usedColors.has(String(color).toLowerCase())) || '#111827';
};

const getVectorStyle = (feature, isSelected, selectionHighlightColor = '#111827', fallbackColor = '#32b17e') => {
  const properties = feature?.properties || {};
  const strokeWidth = Math.max(1, Number(properties['stroke-width']) || 3);
  const strokeOpacity = Number(properties['stroke-opacity'] ?? 1);
  const fillOpacity = Number(properties['fill-opacity'] ?? 0.35);
  const isSelectedLine = isSelected && isLineFeature(feature);

  return {
    color: isSelectedLine ? selectionHighlightColor : (properties.stroke || fallbackColor),
    weight: isSelected ? Math.max(strokeWidth + (isSelectedLine ? 2 : 1), 3) : strokeWidth,
    opacity: isSelected ? 1 : strokeOpacity,
    fillColor: properties.fill || properties.stroke || fallbackColor,
    fillOpacity: feature?.geometry?.type?.includes('Polygon') ? (isSelected ? Math.min(fillOpacity + 0.12, 0.7) : fillOpacity) : 0,
    dashArray: isSelectedLine ? '12 8' : (isSelected ? '8 6' : null)
  };
};

const applyLayerStyle = (layer, feature, isSelected, labelConfig = null, selectionHighlightColor = '#111827', fallbackColor = '#32b17e') => {
  if (!layer || !feature) return;

  if (typeof layer.setStyle === 'function') {
    layer.setStyle(getVectorStyle(feature, isSelected, selectionHighlightColor, fallbackColor));
  }

  if (typeof layer.setIcon === 'function' && typeof layer.getLatLng === 'function') {
    layer.setIcon(createExternalPointIcon(feature, isSelected, labelConfig));
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
    layer.eachLayer((childLayer) => applyLayerStyle(childLayer, feature, isSelected, labelConfig, selectionHighlightColor, fallbackColor));
  }
};

const createExternalPointIcon = (feature, isSelected, labelConfig, fallbackColor = '#ef4444', closeFunc = '__dgCloseLabelExternal') => {
  const color = feature?.properties?.fill || feature?.properties?.stroke || fallbackColor;
  const markerSize = Math.max(8, Number(feature?.properties?.dg_marker_size) || 14);
  const selectedBorder = isSelected ? 4 : 3;
  const iconSize = markerSize + selectedBorder * 2;
  const labelText = resolvePointLabelText(feature, labelConfig, isSelected);
  const labelLines = resolvePointLabelLineCount(feature, labelConfig, isSelected);
  const labelHeight = labelLines > 0 ? 16 + labelLines * 22 : 0;
  
  const iconBase64 = feature?.properties?.dg_icon_base64;
  const iconShape = feature?.properties?.dg_icon_shape;
  
  let iconHtml = '';
  if (iconBase64) {
    const size = Math.max(markerSize * 2, 24);
    iconHtml = `<img src="${iconBase64}" class="dg-point-custom-img${isSelected ? ' dg-dot-selected' : ''}" style="width:${size}px; height:${size}px; object-fit:contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" />`;
  } else if (iconShape) {
    const size = Math.max(markerSize * 1.5, 20);
    let faClass = 'fas fa-circle';
    if (iconShape === 'square') faClass = 'fas fa-square';
    else if (iconShape === 'triangle') faClass = 'fas fa-caret-up';
    else if (iconShape === 'star') faClass = 'fas fa-star';
    else if (iconShape === 'cross') faClass = 'fas fa-plus';
    else if (iconShape === 'location') faClass = 'fas fa-map-marker-alt';
    
    const shapeColor = feature?.properties?.stroke || color;
    iconHtml = `<i class="${faClass} dg-point-custom-shape${isSelected ? ' dg-dot-selected' : ''}" style="font-size:${size}px; color:${shapeColor}; text-shadow: 0 2px 4px rgba(0,0,0,0.4); ${isSelected ? 'filter: drop-shadow(0 0 4px #fff);' : ''}"></i>`;
  } else {
    const selectedGlow = isSelected
      ? 'box-shadow: 0 0 0 6px rgba(15,143,149,0.3), 0 0 14px rgba(15,143,149,0.25), 0 0 0 2px #ffffff;'
      : 'box-shadow: 0 8px 16px rgba(15,23,42,0.22);';
    iconHtml = `<span class="dg-point-dot${isSelected ? ' dg-dot-selected' : ''}" style="width:${markerSize}px; height:${markerSize}px; background:${color}; border:${selectedBorder}px solid #ffffff; ${selectedGlow}"></span>`;
  }

  const customSize = iconBase64 ? Math.max(markerSize * 2, 24) : (iconShape ? Math.max(markerSize * 1.5, 20) : iconSize);
  const totalHeight = labelText ? labelHeight + 8 + customSize : customSize;
  const totalWidth = Math.max(customSize, labelText ? 200 : customSize);
  const anchorX = totalWidth / 2;
  const anchorY = totalHeight - customSize / 2;
  
  return L.divIcon({
    className: `dg-point-icon${isSelected ? ' dg-point-selected' : ''}`,
    html: `<div class="dg-point-icon-body">
      ${labelText ? `<em class="dg-point-icon-label">
        <button class="dg-label-close-btn" onclick="event.stopPropagation(); window.${closeFunc} &amp;&amp; window.${closeFunc}()" title="Cerrar">&times;</button>
        ${labelText}
      </em>` : ''}
      ${iconHtml}
    </div>`,
    iconSize: [totalWidth, totalHeight],
    iconAnchor: [anchorX, anchorY]
  });
};

const resolveLayerColorConfig = (layer) => {
  const meta = getLayerMeta(layer);
  const colorKey = meta.colorByAttributeKey || '';
  const palette = meta.colorByAttributePalette && typeof meta.colorByAttributePalette === 'object'
    ? meta.colorByAttributePalette : {};
  if (!colorKey) return null;

  const colorOption = ATTRIBUTE_COLOR_OPTIONS.find((opt) => opt.aliases?.some((alias) => normalizeAttributeToken(alias) === normalizeAttributeToken(colorKey)))
    || { key: colorKey };
  return { colorKey, colorOption, palette };
};

const resolveFeatureColorByAttribute = (feature, colorConfig) => {
  if (!colorConfig) return null;
  const value = getFeatureAttributeValueByRule(feature, colorConfig.colorOption);
  if (!value && value !== 0) return null;
  const key = String(value);
  return colorConfig.palette[key] || null;
};

const getFeatureFocusBounds = (feature) => {
  try {
    const bounds = L.geoJSON(feature).getBounds();
    return bounds.isValid() ? bounds : null;
  } catch (error) {
    return null;
  }
};

const formatMeasurementDistance = (meters) => {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters.toFixed(1)} m`;
};

const formatMeasurementArea = (squareMeters) => {
  if (!Number.isFinite(squareMeters) || squareMeters <= 0) return '0 m²';
  if (squareMeters >= 1000000) return `${(squareMeters / 1000000).toFixed(3)} km²`;
  if (squareMeters >= 10000) return `${(squareMeters / 10000).toFixed(2)} ha`;
  return `${squareMeters.toFixed(1)} m²`;
};

const getLatLngSequenceDistance = (latLngs) => (
  latLngs.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + latLngs[index - 1].distanceTo(point);
  }, 0)
);

const formatCoordinatePair = (latlng) => {
  if (!latlng) return '';
  return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
};

const buildAreaPolygon = (latLngs) => {
  const ring = latLngs.map((point) => [point.lng, point.lat]);
  if (!ring.length) return null;

  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    ring.push([firstLng, firstLat]);
  }

  return turf.polygon([ring]);
};

const getMeasurementSummary = (mode, meters = 0, squareMeters = 0) => {
  if (mode === 'distance') {
    return {
      title: 'Distancia total',
      value: formatMeasurementDistance(meters),
      helper: meters > 0 ? 'Doble clic para cerrar la medición.' : 'Haz clic en el mapa para empezar.'
    };
  }

  if (mode === 'area') {
    return {
      title: 'Área calculada',
      value: formatMeasurementArea(squareMeters),
      helper: squareMeters > 0 ? 'Dibujo terminado sobre el mapa.' : 'Traza un polígono para calcular el área.'
    };
  }

  return {
    title: 'Herramientas listas',
    value: 'Sin medición activa',
    helper: 'Selecciona distancia o área para medir sobre el mapa.'
  };
};

const buildMeasurementSummary = (mode, config = {}) => {
  if (mode === 'distance') {
    const meters = Number(config.meters || 0);
    const pointCount = Number(config.pointCount || 0);

    return {
      title: 'Distancia total',
      value: formatMeasurementDistance(meters),
      helper: meters > 0 ? 'Doble clic para cerrar la medicion.' : 'Haz clic en el mapa para empezar.',
      details: pointCount > 1 ? `${pointCount} puntos trazados` : 'Sin segmentos todavia',
      copyText: meters > 0 ? `Distancia total: ${formatMeasurementDistance(meters)}` : ''
    };
  }

  if (mode === 'area') {
    const squareMeters = Number(config.squareMeters || 0);

    return {
      title: 'Area calculada',
      value: formatMeasurementArea(squareMeters),
      helper: squareMeters > 0 ? 'Dibujo terminado sobre el mapa.' : 'Traza un poligono para calcular el area.',
      details: squareMeters > 0 ? `${(squareMeters / 10000).toFixed(2)} ha` : 'Esperando poligono',
      copyText: squareMeters > 0 ? `Area calculada: ${formatMeasurementArea(squareMeters)}` : ''
    };
  }

  if (mode === 'coordinate') {
    const latlng = config.latlng || null;

    return {
      title: 'Coordenadas del punto',
      value: latlng ? formatCoordinatePair(latlng) : 'Sin punto seleccionado',
      helper: latlng ? 'Haz clic en otro punto para actualizar la referencia.' : 'Haz clic en el mapa para obtener coordenadas.',
      details: latlng ? `Lat ${latlng.lat.toFixed(6)} | Lon ${latlng.lng.toFixed(6)}` : 'Sin coordenadas',
      copyText: latlng ? `Coordenadas: ${formatCoordinatePair(latlng)}` : ''
    };
  }

  if (mode === 'marker') {
    const latlng = config.latlng || null;

    return {
      title: 'Marcador temporal',
      value: latlng ? formatCoordinatePair(latlng) : 'Sin marcador',
      helper: latlng ? 'Haz clic en otro punto para mover el marcador.' : 'Haz clic en el mapa para colocar un marcador temporal.',
      details: latlng ? 'Referencia visual activa en el mapa' : 'Sin referencia activa',
      copyText: latlng ? `Marcador temporal: ${formatCoordinatePair(latlng)}` : ''
    };
  }

  return {
    title: 'Herramientas listas',
    value: 'Sin medicion activa',
    helper: 'Selecciona una herramienta para usarla sobre el mapa.',
    details: 'Distancia, area, coordenadas o marcador temporal',
    copyText: ''
  };
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

const ExternalMaptilerTerrainMap = React.memo(function ExternalMaptilerTerrainMap({ activeGeojson }) {
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

        ensureLayer('dg-active-polygon-fill', 'dg-active-polygons', 'fill', {
          'fill-color': ['coalesce', ['get', 'fill'], ['get', 'stroke'], '#86efac'],
          'fill-opacity': ['coalesce', ['get', 'fill-opacity'], 0.14]
        });
        ensureLayer('dg-active-polygon-line', 'dg-active-polygons', 'line', {
          'line-color': ['coalesce', ['get', 'stroke'], '#1e88e5'],
          'line-width': ['coalesce', ['get', 'stroke-width'], 2.5],
          'line-opacity': ['coalesce', ['get', 'stroke-opacity'], 1]
        });
        ensureLayer('dg-active-line', 'dg-active-lines', 'line', {
          'line-color': ['coalesce', ['get', 'stroke'], '#1e88e5'],
          'line-width': ['coalesce', ['get', 'stroke-width'], 2.5],
          'line-opacity': ['coalesce', ['get', 'stroke-opacity'], 1]
        });
        ensureLayer('dg-active-point', 'dg-active-points', 'circle', {
          'circle-radius': 4.5,
          'circle-color': ['coalesce', ['get', 'fill'], ['get', 'stroke'], '#ef4444'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5
        });

        const boundsCollection = getCombinedBoundsFeatureCollection(activeGeojson);

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
    };

    if (map.loaded()) {
      update();
    } else {
      map.once('load', update);
    }
  }, [activeGeojson]);

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

const resolveLegendGroups = (visibleLayers) => (
  visibleLayers.map((layer, index) => {
    const meta = layer?.geojson_data?.dg_meta && typeof layer.geojson_data.dg_meta === 'object'
      ? layer.geojson_data.dg_meta
      : {};
    const configuredLegend = Array.isArray(meta.colorByAttributeLegend) ? meta.colorByAttributeLegend : [];
    const visibleLegendValues = Array.isArray(meta.visibleLegendValues) ? new Set(meta.visibleLegendValues.map((value) => String(value))) : null;
    const showConfiguredLegend = Boolean(meta.showLegendOnMap && configuredLegend.length);

    if (!showConfiguredLegend) {
      return null;
    }

    const items = configuredLegend
      .filter((item) => !visibleLegendValues || visibleLegendValues.has(String(item.value)))
      .map((item) => ({ label: String(item.value), color: item.color || getLayerColor(layer, index) }));

    return {
      layerKey: layer.tab_name,
      title: getLayerDisplayName(layer),
      items
    };
  }).filter((group) => group && group.items.length > 0)
);

function ExternalMapLifecycle({ onReady }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);

    const container = map.getContainer();
    let frameId = null;
    let timeoutId = null;

    const syncSize = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false, animate: false });
      });
    };

    syncSize();
    timeoutId = window.setTimeout(syncSize, 260);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(container);
      if (container.parentElement) {
        resizeObserver.observe(container.parentElement);
      }
    }

    window.addEventListener('resize', syncSize);

    return () => {
      onReady(null);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', syncSize);
    };
  }, [map, onReady]);

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

function ExternalMapClickDeselect({ onDeselect, measurementMode }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;

    const handleMapClick = (e) => {
      if (measurementMode) return;
      if (e.originalEvent?._featureClicked) return;
      onDeselect();
    };

    map.on('click', handleMapClick);
    return () => { map.off('click', handleMapClick); };
  }, [map, onDeselect, measurementMode]);

  return null;
}

function ExternalMeasurementController({ mode, resetToken, onSummaryChange }) {
  const map = useMap();
  const measurementLayerRef = useRef(null);
  const rubberBandLineRef = useRef(null);
  const distancePointsRef = useRef([]);
  const areaDrawerRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const featureGroup = new L.FeatureGroup();
    measurementLayerRef.current = featureGroup;
    map.addLayer(featureGroup);

    return () => {
      if (rubberBandLineRef.current) {
        map.removeLayer(rubberBandLineRef.current);
        rubberBandLineRef.current = null;
      }
      if (areaDrawerRef.current) {
        areaDrawerRef.current.disable();
        areaDrawerRef.current = null;
      }
      map.removeLayer(featureGroup);
      measurementLayerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const featureGroup = measurementLayerRef.current;
    if (!featureGroup) return undefined;

    featureGroup.clearLayers();
    distancePointsRef.current = [];

    if (rubberBandLineRef.current) {
      map.removeLayer(rubberBandLineRef.current);
      rubberBandLineRef.current = null;
    }

    if (areaDrawerRef.current) {
      areaDrawerRef.current.disable();
      areaDrawerRef.current = null;
    }
    markerRef.current = null;

    if (mode === 'distance') {
      map.getContainer().style.cursor = 'crosshair';
      map.doubleClickZoom.disable();
      onSummaryChange(buildMeasurementSummary('distance', { meters: 0, pointCount: 0 }));
    } else if (mode === 'area') {
      map.getContainer().style.cursor = 'crosshair';
      map.doubleClickZoom.enable();
      onSummaryChange(buildMeasurementSummary('area', { squareMeters: 0 }));
      areaDrawerRef.current = new L.Draw.Polygon(map, {
        showArea: false,
        allowIntersection: false,
        repeatMode: false,
        shapeOptions: {
          color: '#0f8f95',
          weight: 3,
          fillColor: '#0f8f95',
          fillOpacity: 0.14
        }
      });
      areaDrawerRef.current.enable();
    } else if (mode === 'coordinate') {
      map.getContainer().style.cursor = 'crosshair';
      map.doubleClickZoom.enable();
      onSummaryChange(buildMeasurementSummary('coordinate', { latlng: null }));
    } else if (mode === 'marker') {
      map.getContainer().style.cursor = 'crosshair';
      map.doubleClickZoom.enable();
      onSummaryChange(buildMeasurementSummary('marker', { latlng: null }));
    } else {
      map.getContainer().style.cursor = '';
      map.doubleClickZoom.enable();
      onSummaryChange(buildMeasurementSummary(null));
    }

    return () => {
      map.getContainer().style.cursor = '';
      map.doubleClickZoom.enable();
    };
  }, [map, mode, onSummaryChange, resetToken]);

  useEffect(() => {
    const handleDrawCreated = (event) => {
      if (mode !== 'area' || event.layerType !== 'polygon' || !measurementLayerRef.current) return;

      const featureGroup = measurementLayerRef.current;
      featureGroup.clearLayers();
      featureGroup.addLayer(event.layer);

      const polygonLatLngs = event.layer.getLatLngs()?.[0] || [];
      const polygon = buildAreaPolygon(polygonLatLngs);
      const squareMeters = polygon ? turf.area(polygon) : 0;
      const summary = buildMeasurementSummary('area', { squareMeters });

      event.layer.bindPopup(`<strong>${summary.title}:</strong><br>${summary.value}`).openPopup();
      onSummaryChange(summary);

      if (areaDrawerRef.current) {
        areaDrawerRef.current.disable();
        areaDrawerRef.current = null;
      }

      map.getContainer().style.cursor = '';
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  }, [map, mode, onSummaryChange]);

  useMapEvents({
    click(event) {
      if (!measurementLayerRef.current) return;

      if (mode === 'coordinate') {
        onSummaryChange(buildMeasurementSummary('coordinate', { latlng: event.latlng }));
        return;
      }

      if (mode === 'marker') {
        const featureGroup = measurementLayerRef.current;
        featureGroup.clearLayers();
        markerRef.current = L.marker(event.latlng).addTo(featureGroup);
        onSummaryChange(buildMeasurementSummary('marker', { latlng: event.latlng }));
        return;
      }

      if (mode !== 'distance') return;

      const featureGroup = measurementLayerRef.current;
      const currentPoints = distancePointsRef.current;
      if (!currentPoints.length) {
        featureGroup.clearLayers();
      }

      const nextPoints = [...currentPoints, event.latlng];
      distancePointsRef.current = nextPoints;

      L.circleMarker(event.latlng, {
        radius: 5,
        color: '#ffffff',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 1
      }).addTo(featureGroup);

      if (nextPoints.length > 1) {
        const previousPoint = nextPoints[nextPoints.length - 2];
        const segment = L.polyline([previousPoint, event.latlng], {
          color: '#ef4444',
          weight: 3
        }).addTo(featureGroup);
        const segmentDistance = previousPoint.distanceTo(event.latlng);

        L.marker(segment.getCenter(), {
          icon: L.divIcon({
            className: 'dg-measure-label',
            html: `<span>${formatMeasurementDistance(segmentDistance)}</span>`,
            iconAnchor: [0, 0]
          })
        }).addTo(featureGroup);
      }

      const totalDistance = getLatLngSequenceDistance(nextPoints);
      onSummaryChange(buildMeasurementSummary('distance', {
        meters: totalDistance,
        pointCount: nextPoints.length
      }));
    },
    mousemove(event) {
      if (mode !== 'distance' || !distancePointsRef.current.length) return;

      const anchorPoint = distancePointsRef.current[distancePointsRef.current.length - 1];
      if (rubberBandLineRef.current) {
        rubberBandLineRef.current.setLatLngs([anchorPoint, event.latlng]);
      } else {
        rubberBandLineRef.current = L.polyline([anchorPoint, event.latlng], {
          color: '#2563eb',
          weight: 2,
          opacity: 0.6,
          dashArray: '6, 8'
        }).addTo(map);
      }

      const projectedDistance = getLatLngSequenceDistance(distancePointsRef.current) + anchorPoint.distanceTo(event.latlng);
      onSummaryChange(buildMeasurementSummary('distance', {
        meters: projectedDistance,
        pointCount: distancePointsRef.current.length + 1
      }));
    },
    dblclick() {
      if (mode !== 'distance') return;

      if (rubberBandLineRef.current) {
        map.removeLayer(rubberBandLineRef.current);
        rubberBandLineRef.current = null;
      }

      const totalDistance = getLatLngSequenceDistance(distancePointsRef.current);
      onSummaryChange(buildMeasurementSummary('distance', {
        meters: totalDistance,
        pointCount: distancePointsRef.current.length
      }));
      distancePointsRef.current = [];
      map.getContainer().style.cursor = 'crosshair';
    }
  });

  return null;
}

export default function DisenoGeometricoExternal({ onBack, onSwitchMode, canReturnToSelector = true }) {
  const { user, selectedProjectId, selectedProjectName } = useAuth();
  const mapRef = useRef(null);
  const layerRegistryRef = useRef({});
  const selectedFeatureIdRef = useRef('');
  const [layers, setLayers] = useState([]);
  const [visibleTabs, setVisibleTabs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [baseMapKey, setBaseMapKey] = useState('street');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [measurementMode, setMeasurementMode] = useState(null);
  const [measurementResetToken, setMeasurementResetToken] = useState(0);
  const [measurementSummary, setMeasurementSummary] = useState(() => buildMeasurementSummary(null));
  const [isLeftSidebarHidden, setIsLeftSidebarHidden] = useState(false);
  const [isRightSidebarHidden, setIsRightSidebarHidden] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [showLabelTable, setShowLabelTable] = useState(true);
  const [mapZoom, setMapZoom] = useState(6);
  const [isThreeDMode, setIsThreeDMode] = useState(false);
  const [rutasKml, setRutasKml] = useState([]);

  useEffect(() => {
    selectedFeatureIdRef.current = selectedFeatureId;
  }, [selectedFeatureId]);

  useEffect(() => {
    window.__dgCloseLabelExternal = () => { setSelectedFeatureId(''); };
    return () => { delete window.__dgCloseLabelExternal; };
  }, []);

  const handleMapDeselect = useCallback(() => {
    setSelectedFeatureId('');
  }, []);

  useEffect(() => {
    if (!user?.token || !selectedProjectId) {
      setLayers([]);
      setVisibleTabs({});
      return;
    }

    let ignore = false;

    const loadLayers = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await axiosInstance.get(`/api/proyectos/${selectedProjectId}/diseno-geometrico-capas`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        if (ignore) return;

        const nextLayers = (Array.isArray(response.data?.data) ? response.data.data : [])
          .map((layer) => ({
            ...layer,
            geojson_data: normalizeFeatureCollection(parseGeojson(layer?.geojson_data))
          }));
        setLayers(nextLayers);
        setVisibleTabs((current) => {
          const nextState = {};
          nextLayers.forEach((layer) => {
            nextState[layer.tab_name] = current[layer.tab_name] ?? true;
          });
          return nextState;
        });
      } catch (loadError) {
        console.error('Error cargando capas de diseno geometrico externo:', loadError);
        if (!ignore) {
          setLayers([]);
          setVisibleTabs({});
          setError('No se pudieron cargar las capas del diseno geometrico para esta vista.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadLayers();

    return () => {
      ignore = true;
    };
  }, [selectedProjectId, user?.token]);

  // Nuevo efecto para cargar el trazado del proyecto (línea global)
  useEffect(() => {
    let ignore = false;
    const fetchRutaKml = async () => {
      try {
        const response = await axiosInstance.get('/api/ruta-kml');
        if (!ignore) {
          setRutasKml(response.data || []);
        }
      } catch (err) {
        console.warn('No se pudo cargar la ruta KML global en vista externa:', err);
      }
    };
    fetchRutaKml();
    return () => { ignore = true; };
  }, []);

  const filteredLayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return layers;

    return layers.filter((layer) => {
      const label = `${layer?.file_name || ''} ${layer?.tab_name || ''}`.toLowerCase();
      return label.includes(normalizedSearch);
    });
  }, [layers, searchTerm]);

  const visibleLayers = useMemo(
    () => layers.filter((layer) => visibleTabs[layer.tab_name] ?? true),
    [layers, visibleTabs]
  );

  const visibleLegendGroups = useMemo(() => resolveLegendGroups(visibleLayers), [visibleLayers]);

  const totalVisibleFeatures = useMemo(
    () => visibleLayers.reduce((total, layer) => total + getGeojsonFeatures(layer).length, 0),
    [visibleLayers]
  );

  const selectedFeatureInfo = useMemo(() => {
    if (!selectedFeatureId) return null;
    for (const layer of visibleLayers) {
      const features = getGeojsonFeatures(layer);
      const feature = features.find((f) => f?.properties?.dg_feature_id === selectedFeatureId);
      if (feature) {
        return { feature, layer, labelConfig: getPointLabelConfig(layer.geojson_data) };
      }
    }
    return null;
  }, [selectedFeatureId, visibleLayers]);

  useEffect(() => {
    if (!mapRef.current || !visibleLayers.length) return;

    const boundsList = visibleLayers
      .map((layer) => getLayerBounds(layer.geojson_data))
      .filter(Boolean);

    if (!boundsList.length) return;

    const combinedBounds = boundsList.reduce((accumulator, bounds) => {
      if (!accumulator) {
        return L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast());
      }

      accumulator.extend(bounds);
      return accumulator;
    }, null);

    if (combinedBounds?.isValid()) {
      mapRef.current.fitBounds(combinedBounds, {
        padding: [40, 40],
        animate: true,
        duration: 0.6
      });
    }
  }, [visibleLayers]);

  const handleToggleLayer = (tabName) => {
    setVisibleTabs((current) => ({
      ...current,
      [tabName]: !(current[tabName] ?? true)
    }));
  };

  const handleShowAllLayers = () => {
    setVisibleTabs(() => {
      const nextState = {};
      layers.forEach((layer) => {
        nextState[layer.tab_name] = true;
      });
      return nextState;
    });
  };

  const handleHideAllLayers = () => {
    setVisibleTabs(() => {
      const nextState = {};
      layers.forEach((layer) => {
        nextState[layer.tab_name] = false;
      });
      return nextState;
    });
  };

  const handleFocusLayer = (layer) => {
    const bounds = getLayerBounds(layer?.geojson_data);
    if (bounds?.isValid() && mapRef.current) {
      mapRef.current.fitBounds(bounds, {
        padding: [56, 56],
        animate: true,
        duration: 0.6
      });
    }
  };

  const activeBaseMap = DG_EXTERNAL_BASEMAPS[baseMapKey] || DG_EXTERNAL_BASEMAPS.street;

  const handleMeasurementMode = (nextMode) => {
    setMeasurementMode((currentMode) => currentMode === nextMode ? null : nextMode);
    setMeasurementResetToken((currentValue) => currentValue + 1);
  };

  const handleClearMeasurement = () => {
    setMeasurementMode(null);
    setMeasurementResetToken((currentValue) => currentValue + 1);
  };

  const handleCopyMeasurementResult = async () => {
    if (!measurementSummary?.copyText) return;

    try {
      await navigator.clipboard.writeText(measurementSummary.copyText);
      setMeasurementSummary((current) => ({
        ...current,
        helper: 'Resultado copiado al portapapeles.'
      }));
    } catch (error) {
      setMeasurementSummary((current) => ({
        ...current,
        helper: 'No se pudo copiar automaticamente.'
      }));
    }
  };

  const combinedGeojson = useMemo(() => {
    const features = visibleLayers.flatMap(layer => Array.isArray(layer.geojson_data?.features) ? layer.geojson_data.features : []);
    
    // Añadir el trazado global al mapa 3D
    rutasKml.forEach((ruta) => {
      if (ruta.positions && ruta.positions.length > 0) {
        // Convertir [lat, lng] a [lng, lat] para GeoJSON
        const coordinates = ruta.positions.map(p => [p[1], p[0]]);
        features.push({
          type: 'Feature',
          properties: { stroke: '#ef4444', 'stroke-width': 5, dg_is_global_route: true },
          geometry: {
            type: 'LineString',
            coordinates
          }
        });
      }
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }, [visibleLayers, rutasKml]);

  const shellClassName = [
    'dg-mode-shell',
    'dg-external-shell',
    isLeftSidebarHidden ? 'left-collapsed' : '',
    isRightSidebarHidden ? 'right-collapsed' : ''
  ].filter(Boolean).join(' ');

  const content = (
    <div className={shellClassName}>
      {!isLeftSidebarHidden && (
      <aside className="dg-external-sidebar">
        <div className="dg-external-sidebar-head">
          <div>
            <span className="dg-mode-kicker">Geoportal externo</span>
            <h1>Diseno Geometrico</h1>
            <p>{selectedProjectName || 'Proyecto sin seleccionar'}</p>
          </div>
          <div className="dg-sidebar-head-tools">
            <button
              type="button"
              className="dg-column-toggle-btn"
              onClick={() => setIsLeftSidebarHidden(true)}
              title="Ocultar columna izquierda"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          </div>
          <div className="dg-mode-head-actions">
            {canReturnToSelector && (
              <button type="button" className="dg-mode-ghost-btn" onClick={onBack}>
                <i className="fas fa-arrow-left"></i>
                <span>Volver</span>
              </button>
            )}
            <button type="button" className="dg-mode-primary-btn" onClick={() => onSwitchMode?.('internal')}>
              <i className="fas fa-pen-ruler"></i>
              <span>Vista interna</span>
            </button>
          </div>
        </div>

        <div className="dg-external-sidebar-body">
          <section className="dg-mode-card">
            <div className="dg-mode-card-grid">
              <div className="dg-mode-stat-card">
                <span className="dg-mode-stat-label">Capas</span>
                <strong>{layers.length}</strong>
              </div>
              <div className="dg-mode-stat-card">
                <span className="dg-mode-stat-label">Visibles</span>
                <strong>{visibleLayers.length}</strong>
              </div>
              <div className="dg-mode-stat-card">
                <span className="dg-mode-stat-label">Geometrias</span>
                <strong>{totalVisibleFeatures}</strong>
              </div>
            </div>
          </section>

          <section className="dg-mode-card">
            <div className="dg-mode-card-title-row">
              <h2>Herramientas de medicion</h2>
            </div>

            <div className="dg-measure-tool-grid">
              <button
                type="button"
                className={`dg-measure-tool-btn ${measurementMode === 'distance' ? 'active' : ''}`}
                onClick={() => handleMeasurementMode('distance')}
              >
                <i className="fas fa-ruler"></i>
                <span>Medir distancia</span>
              </button>
              <button
                type="button"
                className={`dg-measure-tool-btn ${measurementMode === 'area' ? 'active' : ''}`}
                onClick={() => handleMeasurementMode('area')}
              >
                <i className="fas fa-draw-polygon"></i>
                <span>Medir area</span>
              </button>
              <button
                type="button"
                className={`dg-measure-tool-btn ${measurementMode === 'coordinate' ? 'active' : ''}`}
                onClick={() => handleMeasurementMode('coordinate')}
              >
                <i className="fas fa-location-dot"></i>
                <span>Coordenadas</span>
              </button>
              <button
                type="button"
                className={`dg-measure-tool-btn ${measurementMode === 'marker' ? 'active' : ''}`}
                onClick={() => handleMeasurementMode('marker')}
              >
                <i className="fas fa-map-pin"></i>
                <span>Marcador</span>
              </button>
              <button type="button" className="dg-measure-tool-btn ghost" onClick={handleClearMeasurement}>
                <i className="fas fa-eraser"></i>
                <span>Limpiar</span>
              </button>
            </div>

            <div className={`dg-measure-status ${measurementMode ? 'active' : ''}`}>
              <span>{measurementSummary.title}</span>
              <strong>{measurementSummary.value}</strong>
              <small>{measurementSummary.details}</small>
              <p>{measurementSummary.helper}</p>
              <button
                type="button"
                className="dg-measure-copy-btn"
                onClick={handleCopyMeasurementResult}
                disabled={!measurementSummary.copyText}
              >
                <i className="fas fa-copy"></i>
                <span>Copiar resultado</span>
              </button>
            </div>
          </section>
        </div>
      </aside>
      )}

      <div className="dg-external-map-stage">
        {isLeftSidebarHidden && (
          <button
            type="button"
            className="dg-map-edge-toggle left"
            onClick={() => setIsLeftSidebarHidden(false)}
            title="Mostrar columna izquierda"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        )}

        {isRightSidebarHidden && (
          <button
            type="button"
            className="dg-map-edge-toggle right"
            onClick={() => setIsRightSidebarHidden(false)}
            title="Mostrar columna derecha"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
        )}

        <div className="dg-external-map-topbar">
          <div className="dg-external-map-badge">
            <span className="dg-mode-kicker">Consulta publica</span>
            <strong>Explora el trazado y las capas activas del proyecto</strong>
          </div>
          <div className="dg-external-basemap-switch" role="group" aria-label="Cambiar mapa base">
            <button
              type="button"
              className={`dg-external-basemap-btn ${isThreeDMode ? 'active' : ''}`}
              onClick={() => setIsThreeDMode(!isThreeDMode)}
              title={MAPTILER_KEY ? 'Alternar vista 3D de MapTiler' : 'Configura la key de MapTiler para usar 3D'}
              disabled={!MAPTILER_KEY}
            >
              <i className="fas fa-cube"></i>
              <span>{isThreeDMode ? 'Volver 2D' : '3D'}</span>
            </button>
            {Object.values(DG_EXTERNAL_BASEMAPS).map((baseMap) => (
              <button
                key={baseMap.key}
                type="button"
                className={`dg-external-basemap-btn ${baseMapKey === baseMap.key && !isThreeDMode ? 'active' : ''}`}
                onClick={() => { setBaseMapKey(baseMap.key); setIsThreeDMode(false); }}
                disabled={isThreeDMode}
              >
                <i className={`fas ${baseMap.icon}`}></i>
                <span>{baseMap.label}</span>
              </button>
            ))}
          </div>
        </div>

        {isThreeDMode ? (
          <ExternalMaptilerTerrainMap activeGeojson={combinedGeojson} />
        ) : (
          <MapContainer
            className="dg-external-map"
            center={[-12.0464, -77.0428]}
            zoom={6}
            zoomControl={false}
            preferCanvas
            maxZoom={DG_EXTERNAL_MAX_MAP_ZOOM}
          >
          <ExternalMapLifecycle onReady={(mapInstance) => {
            mapRef.current = mapInstance;
          }} />
          <ExternalMeasurementController
            mode={measurementMode}
            resetToken={measurementResetToken}
            onSummaryChange={setMeasurementSummary}
          />
          <TileLayer
            key={activeBaseMap.key}
            attribution={activeBaseMap.attribution}
            url={activeBaseMap.url}
            maxZoom={DG_EXTERNAL_MAX_MAP_ZOOM}
          />
          <ZoomControl position="topleft" />
          <ScaleControl position="bottomleft" />
          <MapZoomTracker onZoomChange={setMapZoom} />
          <ExternalMapClickDeselect onDeselect={handleMapDeselect} measurementMode={measurementMode} />

          {/* Trazado del Proyecto (ruta global) - Siempre visible */}
          {rutasKml.map((ruta, idx) => (
            ruta.positions && ruta.positions.length > 0 && (
              <Polyline 
                key={`ruta-global-${idx}`} 
                positions={ruta.positions} 
                pathOptions={{ color: '#ef4444', weight: 5, zIndex: 900 }} 
              />
            )
          ))}

          {visibleLayers.map((layer, index) => {
            const rawLabelConfig = getPointLabelConfig(layer.geojson_data);
            const labelConfig = resolveEffectivePointLabelConfig(layer.geojson_data, rawLabelConfig, mapZoom);
            const colorConfig = resolveLayerColorConfig(layer);
            const hasLabelFields = labelConfig.fields.length > 0 && !labelConfig.modes.includes('none');
            const selectionHighlightColor = resolveSelectionHighlightColor(layer.geojson_data);
            const layerColor = getLayerColor(layer, index);

            return (
              <GeoJSON
                key={`${layer.tab_name}-${selectedFeatureId}-${mapZoom}`}
                data={layer.geojson_data}
                style={(feature) => {
                  const featureId = feature?.properties?.dg_feature_id || '';
                  const isSelected = featureId && featureId === selectedFeatureId;
                  const attrColor = resolveFeatureColorByAttribute(feature, colorConfig);
                  const fallbackColor = attrColor || layerColor;
                  return getVectorStyle(feature, isSelected, selectionHighlightColor, fallbackColor);
                }}
                pointToLayer={(feature, latlng) => {
                  const featureId = feature?.properties?.dg_feature_id || '';
                  const isSelected = featureId && featureId === selectedFeatureId;
                  
                  const attrColor = resolveFeatureColorByAttribute(feature, colorConfig);
                  const fallbackColor = attrColor || layerColor;

                  return L.marker(latlng, {
                    icon: createExternalPointIcon(feature, isSelected, labelConfig, fallbackColor)
                  });
                }}
                onEachFeature={(feature, leafletLayer) => {
                  const featureId = feature?.properties?.dg_feature_id || '';
                  const isSelected = featureId && featureId === selectedFeatureId;

                  leafletLayer.bindPopup(buildFeaturePopupHtml(feature), { maxWidth: 320 });
                  
                  const attrColor = resolveFeatureColorByAttribute(feature, colorConfig);
                  const fallbackColor = attrColor || layerColor;
                  
                  applyLayerStyle(leafletLayer, feature, isSelected, labelConfig, selectionHighlightColor, fallbackColor);

                  leafletLayer.on('click', (e) => {
                    if (e.originalEvent) e.originalEvent._featureClicked = true;

                    const alreadySelected = selectedFeatureIdRef.current === featureId;
                    if (featureId) {
                      setSelectedFeatureId(featureId);
                    }

                    if (!alreadySelected && mapRef.current) {
                      if (isPointFeature(feature) && Array.isArray(feature.geometry?.coordinates)) {
                        const currentZoom = mapRef.current.getZoom();
                        const targetZoom = Math.min(Math.max(currentZoom + 2, 18), 22);
                        const [longitude, latitude] = feature.geometry.coordinates;
                        mapRef.current.flyTo([latitude, longitude], targetZoom, { duration: 0.5 });
                      } else {
                        const bounds = getFeatureFocusBounds(feature);
                        if (bounds?.isValid()) {
                          mapRef.current.flyToBounds(bounds, { padding: [72, 72], duration: 0.65, maxZoom: 18 });
                        }
                      }
                    }
                  });

                  if (featureId) {
                    layerRegistryRef.current[featureId] = leafletLayer;
                  }
                }}
              />
            );
          })}
        </MapContainer>
        )}

        {!!visibleLegendGroups.length && (
          <div className="dg-external-map-legend">
            <div className="dg-external-map-legend-head">
              <span className="dg-mode-kicker">Leyenda</span>
              <strong>Capas visibles</strong>
            </div>

            {visibleLegendGroups.map((group) => (
              <div key={group.layerKey} className="dg-external-legend-group">
                <div className="dg-external-legend-group-title">{group.title}</div>
                {group.items.map((item) => (
                  <div key={`${group.layerKey}-${item.label}`} className="dg-external-legend-item">
                    <span className="dg-external-legend-dot" style={{ background: item.color }}></span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {showLabelTable && selectedFeatureInfo && selectedFeatureInfo.labelConfig.fields.length > 0 && (
          <div className="dg-external-label-table-wrap">
            <div className="dg-table-card dg-label-table-card" style={{ margin: 0, borderRadius: '0 0 16px 16px' }}>
              <div className="dg-panel-head" style={{ padding: '10px 16px' }}>
                <div>
                  <h2 style={{ fontSize: '0.82rem', margin: 0 }}>
                    <i className="fas fa-tags" style={{ marginRight: 7, color: '#0f8f95' }}></i>
                    Etiquetas: {selectedFeatureInfo.feature.properties?.dg_name || 'Punto seleccionado'}
                  </h2>
                </div>
                <button type="button" className="dg-secondary-btn" style={{ padding: '4px 10px', fontSize: '0.68rem' }} onClick={() => setSelectedFeatureId('')}>
                  <i className="fas fa-xmark"></i>
                  <span>Cerrar</span>
                </button>
              </div>
              <div className="dg-table-wrap" style={{ padding: '0 12px 12px' }}>
                <table className="dg-feature-table dg-label-data-table">
                  <thead>
                    <tr>
                      <th className="dg-label-th-name">Elemento</th>
                      {selectedFeatureInfo.labelConfig.fields.map((field) => (
                        <th key={field}>{field}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="active">
                      <td className="dg-label-td-name">
                        <strong>{selectedFeatureInfo.feature.properties?.dg_name || 'Sin nombre'}</strong>
                      </td>
                      {selectedFeatureInfo.labelConfig.fields.map((field) => {
                        const val = selectedFeatureInfo.feature.properties?.[field];
                        return (
                          <td key={field}>
                            {val !== null && val !== undefined && val !== '' ? String(val) : <span style={{ color: '#94a3b8' }}>-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isRightSidebarHidden && (
      <aside className="dg-external-sidebar dg-external-sidebar-right">
        <div className="dg-external-sidebar-head dg-external-sidebar-head-compact">
          <div>
            <span className="dg-mode-kicker">Control lateral</span>
            <h2>Capas del proyecto</h2>
            <p>Administra la visibilidad y el enfoque de las capas del proyecto.</p>
          </div>
          <div className="dg-sidebar-head-tools">
            <strong>{filteredLayers.length}</strong>
            <button
              type="button"
              className="dg-column-toggle-btn"
              onClick={() => setIsRightSidebarHidden(true)}
              title="Ocultar columna derecha"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div className="dg-external-sidebar-body">
          <section className="dg-mode-card dg-mode-card-scroll dg-external-layers-card">
            <label className="dg-mode-field dg-mode-field-compact">
              <span>Buscar capa</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre"
              />
            </label>

            <div className="dg-layer-toolbar">
              <button type="button" className="dg-layer-toolbar-btn" onClick={handleShowAllLayers}>
                <i className="fas fa-eye"></i>
                <span>Ver todas</span>
              </button>
              <button type="button" className="dg-layer-toolbar-btn" onClick={handleHideAllLayers}>
                <i className="fas fa-eye-slash"></i>
                <span>Ocultar</span>
              </button>
            </div>

            <div className="dg-layer-list">
              {isLoading && <div className="dg-mode-empty">Cargando capas...</div>}
              {!isLoading && error && <div className="dg-mode-error">{error}</div>}
              {!isLoading && !error && !filteredLayers.length && (
                <div className="dg-mode-empty">No hay capas que coincidan con la busqueda.</div>
              )}

              {!isLoading && !error && filteredLayers.map((layer, index) => {
                const isVisible = visibleTabs[layer.tab_name] ?? true;
                const summary = getLayerSummary(layer);
                const layerColor = getLayerColor(layer, index);

                return (
                  <article key={layer.tab_name} className={`dg-layer-card ${isVisible ? 'active' : ''}`}>
                    <div className="dg-layer-swatch-wrap">
                      <span className="dg-layer-toggle-dot" style={{ background: layerColor }}></span>
                    </div>
                    <div className="dg-layer-card-body">
                      <strong>{getLayerDisplayName(layer)}</strong>
                      <span>{summary.total} elementos</span>
                      <span>{summary.lines} lineas, {summary.points} puntos, {summary.polygons} areas</span>
                    </div>
                    <div className="dg-layer-actions">
                      <button
                        type="button"
                        className={`dg-layer-visibility-btn ${isVisible ? 'active' : ''}`}
                        onClick={() => handleToggleLayer(layer.tab_name)}
                        aria-pressed={isVisible}
                        title={isVisible ? 'Ocultar capa' : 'Mostrar capa'}
                      >
                        <i className={`fas ${isVisible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                      <button type="button" className="dg-layer-focus-btn" onClick={() => handleFocusLayer(layer)} title="Enfocar capa">
                        <i className="fas fa-location-crosshairs"></i>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </aside>
      )}
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return ReactDOM.createPortal(content, document.body);
  }

  return content;
}
