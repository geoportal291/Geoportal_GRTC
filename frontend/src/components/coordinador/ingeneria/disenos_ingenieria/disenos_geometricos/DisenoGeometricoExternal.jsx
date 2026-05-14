import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { GeoJSON, MapContainer, ScaleControl, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import axiosInstance from '../../../../../api/axios';
import { useAuth } from '../../../../../data/contexts/AuthContext';
import './DisenoGeometricoModes.css';

const DG_EXTERNAL_MAX_MAP_ZOOM = 22;
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
            {Object.values(DG_EXTERNAL_BASEMAPS).map((baseMap) => (
              <button
                key={baseMap.key}
                type="button"
                className={`dg-external-basemap-btn ${baseMapKey === baseMap.key ? 'active' : ''}`}
                onClick={() => setBaseMapKey(baseMap.key)}
              >
                <i className={`fas ${baseMap.icon}`}></i>
                <span>{baseMap.label}</span>
              </button>
            ))}
          </div>
        </div>

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

          {visibleLayers.map((layer, index) => (
            <GeoJSON
              key={layer.tab_name}
              data={layer.geojson_data}
              style={(feature) => {
                const properties = getFeatureProperties(feature);
                return {
                  color: properties.stroke || getLayerColor(layer, index),
                  weight: Number(properties['stroke-width']) || 3,
                  opacity: properties['stroke-opacity'] !== undefined ? Number(properties['stroke-opacity']) : 0.95,
                  fillColor: properties.fill || properties.stroke || getLayerColor(layer, index),
                  fillOpacity: properties['fill-opacity'] !== undefined ? Number(properties['fill-opacity']) : ((feature?.geometry?.type || '').includes('Polygon') ? 0.2 : 0.9),
                  dashArray: properties['stroke-dasharray'] || null
                };
              }}
              pointToLayer={(feature, latlng) => {
                const properties = getFeatureProperties(feature);
                return L.circleMarker(latlng, {
                  radius: Math.max(4, Math.min(8, Number(properties.dg_marker_size || 12) / 2)),
                  color: '#ffffff',
                  weight: 2,
                  fillColor: properties.fill || properties.stroke || getLayerColor(layer, index),
                  fillOpacity: 0.95
                });
              }}
              onEachFeature={(feature, leafletLayer) => {
                const externalLabel = getFeatureExternalLabel(feature, layer);

                leafletLayer.bindPopup(buildFeaturePopupHtml(feature), {
                  maxWidth: 320
                });

                leafletLayer.on('click', () => {
                  const bounds = getFeatureFocusBounds(feature);

                  if (bounds?.isValid() && mapRef.current) {
                    mapRef.current.flyToBounds(bounds, {
                      padding: [72, 72],
                      duration: 0.65,
                      maxZoom: 18
                    });
                  } else if (feature?.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates) && mapRef.current) {
                    const [longitude, latitude] = feature.geometry.coordinates;
                    mapRef.current.flyTo([latitude, longitude], Math.max(mapRef.current.getZoom(), 17), { duration: 0.55 });
                  }

                  if (externalLabel) {
                    const popupNode = leafletLayer.getPopup();
                    const popupContent = `
                      <div class="dg-external-popup-label">${escapeHtml(externalLabel)}</div>
                      ${buildFeaturePopupHtml(feature)}
                    `;
                    popupNode?.setContent(popupContent);
                  }

                  leafletLayer.openPopup();
                });
              }}
            />
          ))}
        </MapContainer>

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
