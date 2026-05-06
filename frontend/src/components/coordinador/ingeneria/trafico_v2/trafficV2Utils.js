const NAS_PUBLIC_BASE_URL = 'https://files.dafe.it.com/geoportal';

export const TOP_LEVEL_TABS = [
  { id: 'resumen', label: 'Resumen General' },
  { id: 'procesamiento', label: 'Recolección y procesamiento de datos' },
  { id: 'reporte', label: 'Reporte Final' }
];

export const SUMMARY_SUBTABS = [
  { id: 'estaciones', label: 'Estación de control' },
  { id: 'tramos', label: 'Tramos homogéneos' },
  { id: 'formatos', label: 'Formatos de recolección de datos' }
];

export const PROCESSING_SUBTABS = [
  { id: 'conteo_vehicular', label: 'Conteo Vehicular' },
  { id: 'encuesta_origen_destino', label: 'Encuesta de Origen/Destino' },
  { id: 'censo_de_cargas', label: 'Censo de Cargas' },
  { id: 'encuesta_velocidad', label: 'Encuesta de velocidad' }
];

export const REPORT_SUBTABS = [
  { id: 'conteo_vehicular', label: 'Conteo Vehicular' },
  { id: 'encuesta_origen_destino', label: 'Encuesta de Origen/Destino' },
  { id: 'censo_de_cargas', label: 'Censo de Cargas' },
  { id: 'encuesta_velocidad', label: 'Encuesta de velocidad' },
  { id: 'ejes_equivalentes', label: 'Ejes Equivalentes' }
];

export const FORMAT_LIBRARY = [
  {
    id: 'CV',
    shortLabel: 'CV',
    name: 'Clasificación Vehicular',
    url: `${NAS_PUBLIC_BASE_URL}/formato_de_recoleccion/Aforos%20Vehiculares.pdf`
  },
  {
    id: 'EV',
    shortLabel: 'EV',
    name: 'Encuesta de Velocidad',
    url: `${NAS_PUBLIC_BASE_URL}/formato_de_recoleccion/encuesta%20de%20velocidad.pdf`
  },
  {
    id: 'OD',
    shortLabel: 'O/D',
    name: 'Encuesta Origen/Destino',
    url: `${NAS_PUBLIC_BASE_URL}/formato_de_recoleccion/Encuesta%20OD%20Pasajeros.pdf`
  },
  {
    id: 'CC',
    shortLabel: 'C/C',
    name: 'Censo de Carga',
    url: `${NAS_PUBLIC_BASE_URL}/formato_de_recoleccion/Censo%20de%20Carga.pdf`
  }
];

export const MODULE_CONFIG = {
  estacion_control: {
    id: 'estacion_control',
    label: 'Estación de control',
    entityType: 'station',
    uploadUrl: '/api/trafico/estacion/upload-image',
    uploadFieldName: 'image',
    entityIdName: 'stationId',
    sourceTypeImage: 'estacion_control',
    sourceTypeFile: null,
    acceptedSourceTypes: ['estacion_control']
  },
  tramos_homogeneos: {
    id: 'tramos_homogeneos',
    label: 'Tramos homogéneos',
    entityType: 'section',
    uploadUrl: '/api/trafico/tramo/upload-image',
    uploadFieldName: 'image',
    entityIdName: 'tramoId',
    sourceTypeImage: 'tramo',
    sourceTypeFile: null,
    acceptedSourceTypes: ['tramo']
  },
  conteo_vehicular: {
    id: 'conteo_vehicular',
    label: 'Conteo Vehicular',
    entityType: 'station',
    uploadUrl: '/api/trafico/conteovehicular/upload-file',
    uploadFieldName: 'file',
    entityIdName: 'stationId',
    sourceTypeImage: 'conteo_vehicular_image',
    sourceTypeFile: 'conteo_vehicular_file',
    acceptedSourceTypes: ['conteo_vehicular_image', 'conteo_vehicular_file', 'conteo_vehicular_excel']
  },
  encuesta_origen_destino: {
    id: 'encuesta_origen_destino',
    label: 'Encuesta de Origen/Destino',
    entityType: 'station',
    uploadUrl: '/api/trafico/encuestaorigendestino/upload-file',
    uploadFieldName: 'file',
    entityIdName: 'stationId',
    sourceTypeImage: 'encuesta_origen_destino_image',
    sourceTypeFile: 'encuesta_origen_destino_file',
    acceptedSourceTypes: ['encuesta_origen_destino_image', 'encuesta_origen_destino_file']
  },
  censo_de_cargas: {
    id: 'censo_de_cargas',
    label: 'Censo de Cargas',
    entityType: 'station',
    uploadUrl: '/api/trafico/censodecargas/upload-file',
    uploadFieldName: 'file',
    entityIdName: 'stationId',
    sourceTypeImage: 'censo_de_cargas_image',
    sourceTypeFile: 'censo_de_cargas_file',
    acceptedSourceTypes: ['censo_de_cargas_image', 'censo_de_cargas_file']
  },
  encuesta_velocidad: {
    id: 'encuesta_velocidad',
    label: 'Encuesta de velocidad',
    entityType: 'section',
    uploadUrl: '/api/trafico/encuestavelocidad/upload-file',
    uploadFieldName: 'file',
    entityIdName: 'sectionId',
    sourceTypeImage: 'encuesta_velocidad_image',
    sourceTypeFile: 'encuesta_velocidad_file',
    acceptedSourceTypes: ['encuesta_velocidad_image', 'encuesta_velocidad_file']
  }
};

export const REPORT_TAB_TO_MODULE = {
  conteo_vehicular: 'conteo_vehicular',
  encuesta_origen_destino: 'encuesta_origen_destino',
  censo_de_cargas: 'censo_de_cargas',
  encuesta_velocidad: 'encuesta_velocidad',
  ejes_equivalentes: 'conteo_vehicular'
};

export function formatDate(value) {
  if (!value) return 'Sin registros';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getImageDate(asset) {
  return asset.upload_date || asset.updated_at || asset.created_at || null;
}

export function getSafeImages(entity) {
  return Array.isArray(entity?.imagenes) ? entity.imagenes : [];
}

export function matchesAcceptedTypes(asset, acceptedTypes = []) {
  if (!acceptedTypes.length) return true;
  return acceptedTypes.includes(asset.source_type);
}

export function isAnalyticalAsset(asset) {
  const type = String(asset?.source_type || '').toLowerCase();
  return type.includes('_file') || type.includes('excel');
}

export function getEntityModuleAssets(entity, moduleKey) {
  const config = MODULE_CONFIG[moduleKey];
  if (!config) return [];
  return getSafeImages(entity).filter((asset) => matchesAcceptedTypes(asset, config.acceptedSourceTypes));
}

export function getEntityStats(entity, moduleKey = null) {
  const assets = moduleKey ? getEntityModuleAssets(entity, moduleKey) : getSafeImages(entity);
  const imageCount = assets.filter((asset) => String(asset.source_type || '').includes('_image') || asset.source_type === 'estacion_control' || asset.source_type === 'tramo').length;
  const fileCount = assets.filter((asset) => String(asset.source_type || '').includes('_file')).length;
  const excelCount = assets.filter((asset) => String(asset.source_type || '').includes('excel')).length;
  const descriptions = new Set(assets.map((asset) => asset.description).filter(Boolean));
  const lastUpload = assets
    .map(getImageDate)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] || null;

  return {
    assets,
    totalUploads: assets.length,
    imageCount,
    fileCount,
    excelCount,
    groupCount: descriptions.size,
    lastUpload
  };
}

export function getCriticalityLabel(totalUploads, moduleCoverage) {
  if (totalUploads >= 8 || moduleCoverage >= 4) return 'Alta';
  if (totalUploads >= 4 || moduleCoverage >= 2) return 'Media';
  return 'Baja';
}

export function buildTrafficV2Dataset(rawRows = []) {
  const stations = [];
  const sections = [];
  const allAssets = [];

  rawRows.forEach((row) => {
    const assets = getSafeImages(row);
    const moduleCoverage = Object.keys(MODULE_CONFIG).filter((moduleKey) => getEntityModuleAssets(row, moduleKey).length > 0).length;
    const stats = getEntityStats(row);
    const enriched = {
      ...row,
      imagenes: assets,
      moduleCoverage,
      totalUploads: stats.totalUploads,
      analyticalFiles: stats.fileCount + stats.excelCount,
      imageCount: stats.imageCount,
      fileCount: stats.fileCount,
      excelCount: stats.excelCount,
      groupCount: stats.groupCount,
      lastUpload: stats.lastUpload,
      criticality: getCriticalityLabel(stats.totalUploads, moduleCoverage)
    };

    allAssets.push(...assets);

    if (row.tipo === 'estacion') {
      stations.push(enriched);
    } else if (row.tipo === 'tramo') {
      sections.push(enriched);
    }
  });

  const analyticalAssets = allAssets.filter(isAnalyticalAsset);
  const latestProcessing = allAssets
    .map(getImageDate)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] || null;

  const sourceTypeCounts = allAssets.reduce((acc, asset) => {
    const key = asset.source_type || 'sin_tipo';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const moduleCoverage = Object.values(MODULE_CONFIG).filter((config) =>
    allAssets.some((asset) => matchesAcceptedTypes(asset, config.acceptedSourceTypes))
  ).length;

  const summary = {
    stationCount: stations.length,
    sectionCount: sections.length,
    analyticalFileCount: analyticalAssets.length,
    latestProcessing,
    moduleCoverage,
    criticalStationCount: stations.filter((station) => station.criticality !== 'Baja').length,
    criticalSectionCount: sections.filter((section) => section.criticality !== 'Baja').length
  };

  return {
    rawRows,
    stations,
    sections,
    allAssets,
    sourceTypeCounts,
    summary
  };
}

export function getTopEntity(entities = [], predicate = null) {
  const filtered = predicate ? entities.filter(predicate) : entities;
  if (!filtered.length) return null;
  return [...filtered].sort((a, b) => {
    if (b.totalUploads !== a.totalUploads) return b.totalUploads - a.totalUploads;
    return (b.moduleCoverage || 0) - (a.moduleCoverage || 0);
  })[0];
}

export function buildProcessingPipeline(entity, moduleKey) {
  const stats = getEntityStats(entity, moduleKey);
  const available = stats.totalUploads > 0;

  return [
    {
      id: 'captura',
      label: 'Archivo cargado',
      status: available ? 'done' : 'pending'
    },
    {
      id: 'validacion',
      label: 'Validación básica',
      status: available ? 'done' : 'pending'
    },
    {
      id: 'parsing',
      label: 'Parsing / clasificación',
      status: stats.fileCount + stats.excelCount > 0 ? 'done' : available ? 'in_progress' : 'pending'
    },
    {
      id: 'metricas',
      label: 'Extracción de métricas',
      status: stats.fileCount + stats.excelCount > 0 ? 'done' : 'pending'
    },
    {
      id: 'dashboard',
      label: 'Disponible para dashboard',
      status: stats.totalUploads > 0 ? 'done' : 'pending'
    },
    {
      id: 'reporte',
      label: 'Disponible para reporte final',
      status: stats.fileCount + stats.excelCount > 0 ? 'done' : 'pending'
    }
  ];
}

export function parseTrafficCoordinateString(value) {
  if (!value) return null;

  const normalized = String(value).trim();
  const matches = normalized.match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 2) return null;

  const first = Number(matches[0]);
  const second = Number(matches[1]);

  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
    return [first, second];
  }

  if (Math.abs(second) <= 90 && Math.abs(first) <= 180) {
    return [second, first];
  }

  return null;
}

export function enrichEntitiesWithMapData(entities = []) {
  return entities.map((entity) => {
    const parsed = parseTrafficCoordinateString(entity.coordenadas);
    return {
      ...entity,
      mapPosition: parsed ? { lat: parsed[0], lng: parsed[1] } : null
    };
  });
}
