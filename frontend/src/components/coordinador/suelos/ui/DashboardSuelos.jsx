import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { useAuth } from '../../../../data/contexts/AuthContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import axiosInstance from '../../../../api/axios';
import { useNavigate } from 'react-router-dom';
import alertify from 'alertifyjs';
import ReactDOM from 'react-dom';
import SuelosMap from '../mapa/SuelosMap';
import 'leaflet/dist/leaflet.css';
import './DashboardSuelos.css';
import useProgresivasData from '../../../../hooks/useProgresivasData';
import ProgresivaImageGalleryModal from '../gestion_tramos/ProgresivaImageGalleryModal';
import { toLatLon } from 'utm';
import { calcularResultados } from '../ensayos/ensayos.calculos.js';
import VisorGraficos from '../ensayos/secciones/VisorGraficos';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

const parseToMeters = (m) => {
  if (typeof m === 'number') return m;
  if (!m) return 0;
  const s = String(m).trim().toUpperCase();
  const match = s.match(/(\d+)\+(\d+(\.\d+)?)/);
  if (match) return parseInt(match[1]) * 1000 + parseFloat(match[2]);
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
};

// Utilidades locales para extracción dinámica de datos de ensayos
const getNestedValue = (obj, path) => {
  if (!obj || !path) return null;
  const parts = path.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr === null || typeof curr !== 'object') return null;
    curr = curr[p];
  }
  return curr;
};

const getDynamicEnsayoFieldValue = (ensayo, fieldName, resultsConfig) => {
  const datos = ensayo.datos_formulario || ensayo.datos_ensayo || {};
  const resultsKey = resultsConfig?.data_source_key;
  const normName = fieldName.toLowerCase().replace(/_/g, '');

  // 1. Intentar búsqueda en rutas estándar construidas dinámicamente
  const pathsToTry = [
    resultsKey ? `${resultsKey}.${fieldName}` : null,
    `results.${fieldName}`,
    `resultado.${fieldName}`,
    `resultado.calculated_values.finales.${fieldName}`,
    `resultado.calculated_values.${fieldName}`,
    `resultado.resultados.${fieldName}`,
    `resultado.finales.${fieldName}`,
    fieldName
  ].filter(Boolean);

  for (const path of pathsToTry) {
    const cleanPath = path.replace(/^results\./, '');
    let val = getNestedValue(ensayo.resultado, cleanPath);
    if (val === undefined || val === null) {
      val = getNestedValue(datos, cleanPath);
    }
    if (val === undefined || val === null) {
      val = getNestedValue(datos, fieldName);
    }
    if (val !== undefined && val !== null && !isNaN(parseFloat(val))) {
      return parseFloat(val);
    }
  }

  // Helper recursivo para aplanar objetos anidados de cualquier tipo de ensayo
  const flattenObject = (obj, prefix = '', res = {}) => {
    if (!obj || typeof obj !== 'object') return res;
    for (const [key, val] of Object.entries(obj)) {
      const propName = prefix ? `${prefix}.${key}` : key;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        flattenObject(val, propName, res);
      } else {
        res[propName] = val;
      }
    }
    return res;
  };

  const flatResult = flattenObject(ensayo.resultado);
  const flatDatos = flattenObject(datos);
  const combinedFlat = { ...flatDatos, ...flatResult };

  // 2. Búsqueda inteligente por terminación exacta o clave exacta en el objeto aplanado
  for (const [k, v] of Object.entries(combinedFlat)) {
    const kl = k.toLowerCase().replace(/_/g, '');
    if ((kl.endsWith('.' + normName) || kl === normName) && v !== null && !isNaN(parseFloat(v))) {
      return parseFloat(v);
    }
  }

  // 3. Búsqueda inteligente por coincidencia de palabras clave por aproximación lingüística
  for (const [k, v] of Object.entries(combinedFlat)) {
    const kl = k.toLowerCase().replace(/_/g, '');
    if (kl.includes(normName) && v !== null && !isNaN(parseFloat(v)) && !kl.includes('peso') && !kl.includes('ret')) {
      return parseFloat(v);
    }
  }

  return null;
};

const enrichFieldMetadata = (field, originalFieldConfig = {}) => {
  const cfg = originalFieldConfig || {};

  // Configuración 100% genérica y agnóstica guiada exclusivamente por los metadatos de la base de datos
  const meta = {
    ...field,
    // Ejes, unidades y tooltip guiados por configuración
    xLabel: cfg.xLabel || cfg.x_label || (field.isCurvaCompleta ? 'X' : 'Progresiva'),
    xUnit: cfg.xUnit || cfg.x_unit || '',
    yLabel: cfg.yLabel || cfg.y_label || (field.isCurvaCompleta ? 'Y' : (field.label || 'Valor')),
    yUnit: cfg.yUnit || cfg.y_unit || '',
    xTitle: cfg.xTitle || cfg.x_title || (field.isCurvaCompleta ? 'Eje X' : 'Progresivas'),
    yTitle: cfg.yTitle || cfg.y_title || (field.isCurvaCompleta ? 'Eje Y' : (field.label || 'Valor')),

    // Tipo de escala y dirección
    scaleType: cfg.scaleType || cfg.scale_type || 'linear',
    reverseX: cfg.reverseX !== undefined ? cfg.reverseX : (cfg.reverse_x !== undefined ? cfg.reverse_x : false),

    // Rango de ejes (min/max)
    minX: cfg.minX !== undefined ? cfg.minX : (cfg.min_x !== undefined ? cfg.min_x : undefined),
    maxX: cfg.maxX !== undefined ? cfg.maxX : (cfg.max_x !== undefined ? cfg.max_x : undefined),
    minY: cfg.minY !== undefined ? cfg.minY : (cfg.min_y !== undefined ? cfg.min_y : undefined),
    maxY: cfg.maxY !== undefined ? cfg.maxY : (cfg.max_y !== undefined ? cfg.max_y : undefined),

    // Ticks específicos sugeridos
    ticksX: cfg.ticksX || cfg.ticks_x || undefined
  };

  return meta;
};

export default function DashboardSuelos({ isExternalView, onBackToSelection }) {
  // Inicialización del contexto de autenticación de Geoportal
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const progresivasOptions = useMemo(() => ({ includeChildren: true }), []);
  const { progresivas: hookProgresivas, loading: hookLoading } = useProgresivasData(progresivasOptions);

  const [progresivas, setProgresivas] = useState([]);
  const [canterasMapData, setCanterasMapData] = useState([]);
  const [recentAssays, setRecentAssays] = useState([]);
  const [avgCanteraDistance, setAvgCanteraDistance] = useState('0.0');
  const [avanceStats, setAvanceStats] = useState({ val: 0, lastProg: '---' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedMapItem, setSelectedMapItem] = useState(null);
  const [sidebarView, setSidebarView] = useState('list');
  const [mapCenterTo, setMapCenterTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('data');
  const [viewingGallery, setViewingGallery] = useState(false);
  const [trazadoIds, setTrazadoIds] = useState([]);
  const [allEnsayosList, setAllEnsayosList] = useState([]);

  // Estados para el Carrusel de Fotos en el Sidebar de Detalles
  const [progresivaImages, setProgresivaImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Estados para los Paneles de Analíticas Flotantes (Vista Externa)
  const [showAnalyticPanels, setShowAnalyticPanels] = useState(true);
  const [panelsCollapsed, setPanelsCollapsed] = useState({
    superior: false,
    medio: false,
    inferior: false
  });
  const [selectedTrendType, setSelectedTrendType] = useState('');
  const [selectedAnalyticEnsayo, setSelectedAnalyticEnsayo] = useState(null);
  const [showTrendModal, setShowTrendModal] = useState(false);

  // Obtener dinámicamente los tipos de ensayo únicos y sus metadatos reales presentes en el sistema de forma 100% agnóstica
  const availableTrendTypes = useMemo(() => {
    const types = new Map();
    allEnsayosList.forEach(ens => {
      if (ens.config_key) {
        if (!types.has(ens.config_key)) {
          types.set(ens.config_key, {
            config_key: ens.config_key,
            nombre: ens.tipo_ensayo_descripcion || ens.nombre_ensayo || ens.config_key,
            results_config: ens.results_config || null,
            config_graficos: ens.config_graficos || null,
            config_tabla: ens.config_tabla || null,
            config_calculos: ens.config_calculos || null
          });
        }
      }
    });
    return Array.from(types.values());
  }, [allEnsayosList]);

  // Autoseleccionar el primer tipo de ensayo disponible
  useEffect(() => {
    if (availableTrendTypes.length > 0 && !selectedTrendType) {
      setSelectedTrendType(availableTrendTypes[0].config_key);
    }
  }, [availableTrendTypes, selectedTrendType]);

  // Procesamiento dinámico de tendencias geotécnicas basado en el tipo de ensayo seleccionado con depuración rica
  const processedGeotechData = useMemo(() => {
    if (!selectedTrendType) {
      return { trendData: [], fieldsToExtract: [] };
    }

    const activeProgs = progresivas.filter(p => p.parent_id && p.estratos_perfil && p.estratos_perfil.length > 0);
    const sortedProgs = [...activeProgs].sort((a, b) => parseToMeters(a.nombre) - parseToMeters(b.nombre));

    const keyNorm = selectedTrendType.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Determinar qué campos geotécnicos extraer para graficar de forma 100% dinámica
    let fieldsToExtract = [];

    const trendTypeInfo = availableTrendTypes.find(t => t.config_key === selectedTrendType);
    const resultsConfig = trendTypeInfo?.results_config;

    // 1. Extraer a partir de results_config si existe en la base de datos
    if (resultsConfig?.groups) {
      let count = 0;
      resultsConfig.groups.forEach(g => {
        g.fields?.forEach(f => {
          const nameLower = (f.name || '').toLowerCase();
          const labelLower = (f.label || '').toLowerCase();
          // Excluir clasificaciones o textos que no sean graficables de forma numérica directa
          if (!nameLower.includes('sucs') && !labelLower.includes('sucs') && !nameLower.includes('clasificacion') && !nameLower.includes('aashto')) {
            const rawField = {
              name: f.name,
              label: f.label || f.name,
              color: count === 0 ? '#ef4444' : (count === 1 ? '#f87171' : '#3b82f6'),
              yAxisID: count === 0 ? 'y' : 'y1',
              isCurvaCompleta: nameLower.includes('curva') || nameLower.includes('puntos')
            };
            fieldsToExtract.push(enrichFieldMetadata(rawField, f));
            count++;
          }
        });
      });
    }

    // 2. Si no hay results_config, realizar escaneo automático recursivo para autodetectar variables numéricas
    if (fieldsToExtract.length === 0) {
      let sampleEnsayo = null;
      for (const p of sortedProgs) {
        const estWithEns = p.estratos_perfil?.find(est =>
          est.ensayos?.some(ens => ens.config_key === selectedTrendType)
        );
        if (estWithEns) {
          sampleEnsayo = estWithEns.ensayos.find(ens => ens.config_key === selectedTrendType);
          break;
        }
      }

      if (sampleEnsayo) {
        const resultadoObj = sampleEnsayo.resultado || {};
        const datosObj = sampleEnsayo.datos_formulario || {};

        const findNumericKeys = (obj, prefix = '', list = []) => {
          if (!obj || typeof obj !== 'object') return list;
          for (const [k, v] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${k}` : k;
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
              findNumericKeys(v, path, list);
            } else if (v !== null && !isNaN(parseFloat(v)) && isFinite(v)) {
              list.push({ name: path, label: k });
            } else if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && v[0].x !== undefined && v[0].y !== undefined) {
              list.push({ name: path, label: k, isCurvaCompleta: true });
            }
          }
          return list;
        };

        const availableFields = [
          ...findNumericKeys(resultadoObj),
          ...findNumericKeys(datosObj)
        ].filter((item, idx, self) => self.findIndex(t => t.name === item.name) === idx);

        availableFields.slice(0, 3).forEach((f, idx) => {
          const rawField = {
            name: f.name,
            label: f.label.toUpperCase(),
            color: idx === 0 ? '#ef4444' : (idx === 1 ? '#f87171' : '#3b82f6'),
            yAxisID: idx === 0 ? 'y' : 'y1',
            isCurvaCompleta: f.isCurvaCompleta
          };
          fieldsToExtract.push(enrichFieldMetadata(rawField, f));
        });
      }
    }

    if (fieldsToExtract.length === 0) {
      const rawField = { name: 'valor', label: 'Resultado', color: '#ef4444' };
      fieldsToExtract = [enrichFieldMetadata(rawField)];
    }

    const trendData = [];
    sortedProgs.forEach(prog => {
      const fieldValues = {};
      let hasData = false;

      prog.estratos_perfil?.forEach(estrato => {
        estrato.ensayos?.forEach(ensayo => {
          const ensKeyNorm = (ensayo.config_key || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

          if (ensayo.config_key === selectedTrendType || ensKeyNorm === keyNorm) {
            let resultadoFinal = ensayo.resultado;
            if ((!resultadoFinal || Object.keys(resultadoFinal).length === 0) && ensayo.config_calculos && ensayo.datos_formulario) {
              try {
                resultadoFinal = calcularResultados(ensayo.config_calculos, ensayo.datos_formulario, ensayo.config_tabla);
              } catch (e) {
                console.error('[DEBUG INGENIERIA] Error calculando al vuelo:', e);
              }
            }

            const mockEnsayo = { ...ensayo, resultado: resultadoFinal };

            // Extraer dinámicamente curvas completas o variables discretas normales
            fieldsToExtract.forEach(field => {
              if (field.isCurvaCompleta) {
                let puntos = getNestedValue(resultadoFinal, field.name) ||
                  getNestedValue(resultadoFinal, `resultados.${field.name}`);

                if (!puntos) {
                  // Fallback dinámico agnóstico: buscar cualquier propiedad que sea un array de puntos/coordenadas
                  for (const v of Object.values(resultadoFinal)) {
                    if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object' && (v[0].x !== undefined || v[0].mm !== undefined)) {
                      puntos = v;
                      break;
                    }
                  }
                }

                if (!puntos) {
                  const configTabla = mockEnsayo.config_tabla || mockEnsayo.tableConfig;
                  const tablas = configTabla?.tables || [];
                  const puntosMapeados = [];

                  // Mapeo dinámico y agnóstico de curvas basado en config_tabla y metadatos de base de datos
                  const scanTables = Array.isArray(tablas) ? tablas : Object.values(tablas);
                  scanTables.forEach(tbl => {
                    const tblKey = tbl?.key || '';
                    const rows = tbl?.rows || [];
                    const scanRows = Array.isArray(rows) ? rows : Object.values(rows);
                    
                    scanRows.forEach(row => {
                      if (row && row.key) {
                        // 1. Determinar el valor de la coordenada X de forma agnóstica (primer número de la fila de configuración)
                        let xVal = undefined;
                        
                        // Si en la base de datos se especifica qué columna es el eje X, la usamos
                        const xSourceKey = field.xSourceKey || field.x_source_key;
                        if (xSourceKey && row[xSourceKey] !== undefined && !isNaN(parseFloat(row[xSourceKey]))) {
                          xVal = parseFloat(row[xSourceKey]);
                        } else {
                          // Fallback agnóstico: buscar cualquier número finito directo en la fila de configuración
                          for (const [rk, rv] of Object.entries(row)) {
                            if (rk !== 'key' && rk !== 'label' && typeof rv === 'number' && Number.isFinite(rv)) {
                              xVal = rv;
                              break;
                            }
                          }
                        }

                        if (xVal !== undefined) {
                          // 2. Determinar el valor de la coordenada Y de forma agnóstica buscando en resultados
                          let yVal = null;
                          const ySourceKey = field.ySourceKey || field.y_source_key;
                          
                          if (ySourceKey) {
                            yVal = getNestedValue(resultadoFinal, `${tblKey}.${row.key}.${ySourceKey}`) ||
                                   getNestedValue(resultadoFinal, `${row.key}.${ySourceKey}`) ||
                                   getNestedValue(resultadoFinal, `${ySourceKey}.${row.key}`) ||
                                   getNestedValue(mockEnsayo.datos_formulario, `tables.${tblKey}.${row.key}.${ySourceKey}`);
                          }

                          if (yVal === undefined || yVal === null) {
                            const paths = [
                              tblKey ? `${tblKey}.${row.key}` : null,
                              row.key
                            ].filter(Boolean);

                            for (const path of paths) {
                              const val = getNestedValue(resultadoFinal, path) || 
                                          getNestedValue(mockEnsayo.datos_formulario, `tables.${path}`) ||
                                          getNestedValue(mockEnsayo.datos_formulario, path);
                              if (val !== undefined && val !== null) {
                                if (typeof val === 'number' && !isNaN(val)) {
                                  yVal = val;
                                  break;
                                }
                                if (typeof val === 'object' && !Array.isArray(val)) {
                                  for (const [ck, cv] of Object.entries(val)) {
                                    if (typeof cv === 'number' && !isNaN(cv)) {
                                      yVal = cv;
                                      break;
                                    }
                                  }
                                }
                              }
                            }
                          }

                          if (yVal === undefined || yVal === null) {
                            yVal = getDynamicEnsayoFieldValue(mockEnsayo, row.key, resultsConfig);
                          }

                          if (yVal !== undefined && yVal !== null && !isNaN(parseFloat(yVal))) {
                            puntosMapeados.push({ x: xVal, y: parseFloat(yVal) });
                          }
                        }
                      }
                    });
                  });
                  if (puntosMapeados.length > 0) puntos = puntosMapeados;
                }

                if (Array.isArray(puntos) && puntos.length > 0) {
                  const xKey = field.xSourceKey || field.x_source_key;
                  const yKey = field.ySourceKey || field.y_source_key;

                  fieldValues[field.name] = puntos.map(pt => {
                    let xVal = pt.x;
                    if (xVal === undefined && xKey) xVal = pt[xKey];
                    if (xVal === undefined) {
                      for (const [k, v] of Object.entries(pt)) {
                        if (k !== 'y' && typeof v === 'number' && Number.isFinite(v)) {
                          xVal = v;
                          break;
                        }
                      }
                    }

                    let yVal = pt.y;
                    if (yVal === undefined && yKey) yVal = pt[yKey];
                    if (yVal === undefined) {
                      for (const [k, v] of Object.entries(pt)) {
                        if (k !== 'x' && k !== String(xKey) && typeof v === 'number' && Number.isFinite(v)) {
                          yVal = v;
                          break;
                        }
                      }
                    }

                    return { x: xVal, y: yVal };
                  }).filter(pt => pt.x !== undefined && pt.y !== undefined).sort((a, b) => a.x - b.x);
                  hasData = true;
                }
              } else {
                const val = getDynamicEnsayoFieldValue(mockEnsayo, field.name, resultsConfig);
                if (val !== null && !isNaN(val)) {
                  fieldValues[field.name] = val;
                  hasData = true;
                }
              }
            });
          }
        });
      });

      trendData.push({
        id: prog.id,
        nombre: prog.nombre,
        fieldValues,
        hasData
      });
    });

    return {
      trendData,
      fieldsToExtract
    };
  }, [progresivas, selectedTrendType, availableTrendTypes]);

  // Cálculo del Suelo Predominante (SUCS) Global
  const sueloPredominanteGlobal = useMemo(() => {
    const sucsCounts = {};
    progresivas.filter(p => p.parent_id).forEach(prog => {
      prog.estratos_perfil?.forEach(est => {
        const name = (est.nombre_estrato || est.descripcion || '').trim().toUpperCase();
        if (name && name.length <= 4) { // Filtro rápido para códigos SUCS como SC, CL, GP
          sucsCounts[name] = (sucsCounts[name] || 0) + 1;
        }
      });
    });
    const sorted = Object.entries(sucsCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? `${sorted[0][0]} (${sorted[0][1]} reg.)` : 'Sin datos';
  }, [progresivas]);

  // Filtrar todos los ensayos recopilados que correspondan al tipo de tendencia seleccionado para la superposición grupal masiva
  const groupEnsayosFiltrados = useMemo(() => {
    if (!selectedTrendType || !allEnsayosList.length) return [];
    return allEnsayosList.filter(ens => {
      const keyNorm = (ens.config_key || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const selNorm = selectedTrendType.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return ens.config_key === selectedTrendType || keyNorm === selNorm;
    });
  }, [allEnsayosList, selectedTrendType]);

  // Obtener la configuración del tipo de tendencia activo para el Visor de Gráficos
  const activeTrendTypeConfig = useMemo(() => {
    return availableTrendTypes.find(t => t.config_key === selectedTrendType) || null;
  }, [availableTrendTypes, selectedTrendType]);

  const [ensayosStatusData, setEnsayosStatusData] = useState({
    labels: ['Pendiente', 'En revisión', 'Rechazado', 'Aprobado', 'Completado'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#9ca3af', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  });

  const [ensayosDistribution, setEnsayosDistribution] = useState([]);

  useEffect(() => {
    if (!hookLoading) {
      const syncData = async () => {
        let allData = [...hookProgresivas];
        let allCanteras = [];
        const parents = hookProgresivas.filter(p => !p.parent_id);

        // Extraer kml_trazado_id de los tramos padres
        const kmlIds = parents.map(p => p.kml_trazado_id).filter(Boolean);
        setTrazadoIds(kmlIds);

        if (parents.length > 0) {
          try {
            const childrenPromises = parents.map(p =>
              axiosInstance.get(`/api/progresivas/${p.id}/children/all`)
                .then(res => res.data || [])
                .catch(() => [])
            );
            const childrenArrays = await Promise.all(childrenPromises);
            const allChildren = childrenArrays.flat();
            const ids = new Set(allData.map(p => p.id));
            allData = [...allData, ...allChildren.filter(c => !ids.has(c.id))];

            const canterasPromises = parents.map(p =>
              axiosInstance.get(`/api/tramos/${p.id}/canteras`)
                .then(res => res.data || [])
                .catch(() => [])
            );
            const canterasArrays = await Promise.all(canterasPromises);
            allCanteras = canterasArrays.flat();
            setCanterasMapData(allCanteras);
          } catch (e) { console.error(e); }
        }

        const allEnsayos = [];
        allData.forEach(p => {
          p.estratos_perfil?.forEach((est, estIdx) => {
            est.ensayos?.forEach(ens => allEnsayos.push({
              ...ens,
              sourceType: 'Tramo',
              sourceName: p.nombre,
              progresiva_nombre: p.nombre,
              progresiva_codigo: p.nombre,
              estrato_orden: estIdx + 1,
              estrato_nombre: est.nombre_estrato || est.descripcion || `E${estIdx + 1}`,
              identificador: p.nombre
            }));
          });
        });
        allCanteras.forEach(c => {
          c.estratos?.forEach((est, estIdx) => {
            est.ensayos?.forEach(ens => allEnsayos.push({
              ...ens,
              sourceType: 'Cantera',
              sourceName: c.nombre,
              progresiva_nombre: c.nombre,
              progresiva_codigo: c.nombre,
              estrato_orden: estIdx + 1,
              estrato_nombre: est.nombre_estrato || est.descripcion || `E${estIdx + 1}`,
              identificador: c.nombre
            }));
          });
        });

        const counts = { pendiente: 0, revision: 0, rechazado: 0, aprobado: 0, completado: 0 };
        allEnsayos.forEach(ens => {
          const st = (ens.estado || 'pendiente').toLowerCase();
          if (st.includes('aprobado')) counts.aprobado++;
          else if (st.includes('rechazado')) counts.rechazado++;
          else if (st.includes('revision')) counts.revision++;
          else if (st.includes('completado')) counts.completado++;
          else counts.pendiente++;
        });

        setEnsayosStatusData(prev => ({
          ...prev,
          datasets: [{ ...prev.datasets[0], data: [counts.pendiente, counts.revision, counts.rechazado, counts.aprobado, counts.completado] }]
        }));

        // Generar distribución por tipo de ensayo
        const typeCounts = {};
        allEnsayos.forEach(ens => {
          const typeName = ens.tipo_ensayo_descripcion || ens.nombre_ensayo || 'Otro Ensayo';
          if (!typeCounts[typeName]) {
            typeCounts[typeName] = { total: 0, aprobado: 0, completado: 0, pendiente: 0 };
          }
          typeCounts[typeName].total++;
          const st = (ens.estado || 'pendiente').toLowerCase();
          if (st.includes('aprobado')) typeCounts[typeName].aprobado++;
          else if (st.includes('completado')) typeCounts[typeName].completado++;
          else if (st.includes('pendiente')) typeCounts[typeName].pendiente++;
        });

        const typeArray = Object.entries(typeCounts).map(([name, counts]) => ({
          name,
          ...counts,
          avancePerc: counts.total > 0 ? Math.round(((counts.aprobado + counts.completado) / counts.total) * 100) : 0
        })).sort((a, b) => b.total - a.total);

        setEnsayosDistribution(typeArray);

        const sub = allData.filter(p => p.parent_id);
        const ok = sub.filter(p => ['aprobado', 'completado'].includes(p.estado?.toLowerCase())).length;
        setAvanceStats({ val: sub.length > 0 ? Math.round((ok / sub.length) * 100) : 0, lastProg: `${ok}/${sub.length} Progresivas` });

        const dist = allCanteras.reduce((acc, c) => acc + (parseFloat(c.desplazamiento_km) || 0), 0);
        setAvgCanteraDistance(allCanteras.length > 0 ? (dist / allCanteras.length).toFixed(1) : '0.0');

        setRecentAssays([...allEnsayos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10));
        setAllEnsayosList(allEnsayos);
        setProgresivas(allData);
        setLoading(false);
      };
      syncData();
    }
  }, [hookProgresivas, hookLoading]);

  // Carga de fotos reactiva para el carrusel del sidebar
  useEffect(() => {
    let isMounted = true;
    const fetchImagesForSidebar = async () => {
      if (selectedMapItem?.type === 'progresiva' && selectedMapItem?.data?.id) {
        setLoadingImages(true);
        setProgresivaImages([]);
        setCurrentImageIndex(0);
        try {
          // El interceptor de axiosInstance ya incluye el token de autorización automáticamente
          const res = await axiosInstance.get(`/api/progresivas/${selectedMapItem.data.id}/imagenes`);
          if (isMounted) {
            setProgresivaImages(res.data || []);
          }
        } catch (err) {
          console.error("Error al obtener imágenes para el sidebar:", err);
        } finally {
          if (isMounted) setLoadingImages(false);
        }
      } else {
        setProgresivaImages([]);
        setCurrentImageIndex(0);
      }
    };

    fetchImagesForSidebar();
    return () => {
      isMounted = false;
    };
  }, [selectedMapItem]);

  const handleMapClick = useCallback((e) => {
    if (e?.type === 'progresiva') {
      setSelectedMapItem(e);
      setSidebarView('details');
      setSelectedAnalyticEnsayo(null); // Limpiar selección de ensayo de analíticas
      const p = e.data;
      if (p.coordenada_este && p.coordenada_norte) {
        try {
          const z = p.linea || '18L';
          const pos = toLatLon(parseFloat(p.coordenada_este), parseFloat(p.coordenada_norte), parseInt(z), z.replace(/[0-9]/g, '') || 'L');
          setMapCenterTo({ lat: pos.latitude, lng: pos.longitude, zoom: 18 });
        } catch { }
      }
    }
  }, []);

  const handleSelectFromList = (p) => {
    setSelectedMapItem({ type: 'progresiva', data: p });
    setSidebarView('details');
    setSelectedAnalyticEnsayo(null); // Limpiar selección de ensayo de analíticas
    if (p.coordenada_este && p.coordenada_norte) {
      try {
        const z = p.linea || '18L';
        const pos = toLatLon(parseFloat(p.coordenada_este), parseFloat(p.coordenada_norte), parseInt(z), z.replace(/[0-9]/g, '') || 'L');
        setMapCenterTo({ lat: pos.latitude, lng: pos.longitude, zoom: 18 });
      } catch { }
    }
  };

  const filtered = progresivas.filter(p => p.parent_id).filter(p => {
    if (filterType === 'data') return p.estratos_perfil?.length > 0;
    return !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => parseToMeters(a.nombre) - parseToMeters(b.nombre));

  if (loading && !hookLoading) return <div className="loading-screen">Cargando...</div>;

  const content = (
    <main className="dashboard-premium-container" style={isExternalView ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', padding: 0, margin: 0, overflow: 'hidden', zIndex: 9999999, background: '#0f172a' } : {}}>
      <section className="map-section-premium" style={isExternalView ? { height: '100%', borderRadius: 0, border: 'none' } : {}}>
        <div style={{ flex: 1, position: 'relative' }}>
          {isExternalView && (
            <div style={{ position: 'absolute', bottom: '25px', left: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
              {onBackToSelection && (
                <button
                  onClick={onBackToSelection}
                  className="btn-ghost-dark"
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '10px 20px',
                    border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <i className="fas fa-arrow-left"></i> Salir / Volver
                </button>
              )}

              <button
                onClick={() => setShowAnalyticPanels(!showAnalyticPanels)}
                className="btn-ghost-dark"
                style={{
                  backgroundColor: showAnalyticPanels ? 'rgba(37, 99, 235, 0.9)' : 'rgba(15, 23, 42, 0.9)',
                  color: 'white', padding: '10px 20px',
                  border: showAnalyticPanels ? '1px solid #3b82f6' : '1px solid #334155',
                  borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  fontWeight: '600', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <i className="fas fa-chart-pie"></i> {showAnalyticPanels ? 'Ocultar Analíticas' : 'Ver Analíticas'}
              </button>
            </div>
          )}

          {isExternalView && showAnalyticPanels && (
            <div className="floating-analytics-container">
              {/* PANEL SUPERIOR: KPIs del Proyecto / Progresiva */}
              <div className={`floating-analytic-card ${panelsCollapsed.superior ? 'collapsed' : ''}`}>
                <div className="floating-card-header" onClick={() => setPanelsCollapsed(prev => ({ ...prev, superior: !prev.superior }))}>
                  <h4><i className="fas fa-chart-bar"></i> {selectedMapItem?.data ? `Resumen: ${selectedMapItem.data.nombre}` : 'Métricas del Proyecto'}</h4>
                  <div className="header-actions">
                    <button><i className={`fas fa-${panelsCollapsed.superior ? 'plus' : 'minus'}`}></i></button>
                  </div>
                </div>
                {!panelsCollapsed.superior && (
                  <div className="floating-card-body">
                    {selectedMapItem?.data ? (
                      <div className="geotech-kpi-grid">
                        <div className="geotech-kpi-item">
                          <span className="kpi-label">Exploración</span>
                          <span className="kpi-val text-blue">
                            {selectedMapItem.data.estratos_perfil?.length > 0
                              ? `${selectedMapItem.data.estratos_perfil[selectedMapItem.data.estratos_perfil.length - 1].profundidad_final} m`
                              : '0.0 m'}
                          </span>
                        </div>
                        <div className="geotech-kpi-item">
                          <span className="kpi-label">Lado</span>
                          <span className="kpi-val text-orange">{selectedMapItem.data.lado || 'EJE'}</span>
                        </div>
                        <div className="geotech-kpi-item full-width">
                          <span className="kpi-label">Ensayos Realizados (Clic para ver)</span>
                          <div className="geotech-assay-list">
                            {selectedMapItem.data.estratos_perfil?.flatMap((e, eIdx) =>
                              (e.ensayos || []).map(ens => ({ ...ens, estratoOrden: e.orden || (eIdx + 1) }))
                            ).length > 0 ? (
                              selectedMapItem.data.estratos_perfil.flatMap((e, eIdx) =>
                                (e.ensayos || []).map(ens => ({ ...ens, estratoOrden: e.orden || (eIdx + 1) }))
                              ).map((ens, idx) => {
                                const isSelected = selectedAnalyticEnsayo?.id === ens.id;
                                return (
                                  <button
                                    key={idx}
                                    className={`assay-pill-clickable ${isSelected ? 'active' : ''}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedAnalyticEnsayo(ens);
                                      // Cambiar tipo de tendencia de forma dinámica al tipo respectivo de forma 100% agnóstica
                                      setSelectedTrendType(ens.config_key);
                                    }}
                                    title={`${ens.tipo_ensayo_descripcion || ens.nombre_ensayo} - ${selectedMapItem.data.nombre} - E.${ens.estratoOrden}`}
                                  >
                                    <i className="fas fa-vial" style={{ marginRight: '4px' }}></i>
                                    {ens.tipo_ensayo_descripcion || ens.nombre_ensayo || 'Ensayo'} - {selectedMapItem.data.nombre} - E.{ens.estratoOrden}
                                  </button>
                                );
                              })
                            ) : (
                              <span className="no-assays-text">Sin ensayos registrados</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="geotech-kpi-grid">
                        <div className="geotech-kpi-item">
                          <span className="kpi-label">Ensayos Totales</span>
                          <span className="kpi-val text-blue">
                            {progresivas.filter(p => p.parent_id).reduce((acc, p) => acc + (p.estratos_perfil?.flatMap(e => e.ensayos || []).length || 0), 0)}
                          </span>
                        </div>
                        <div className="geotech-kpi-item">
                          <span className="kpi-label">Suelo Predominante</span>
                          <span className="kpi-val text-orange truncate" title={sueloPredominanteGlobal}>{sueloPredominanteGlobal}</span>
                        </div>
                        <div className="geotech-kpi-item full-width">
                          <span className="kpi-label">Estudio por Kilómetro</span>
                          <span className="kpi-val text-green">{avanceStats.lastProg || 'Sin progreso'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PANEL MEDIO: Resultados Detallados de Ensayo / Gráfico de Estados / Perfil SUCS */}
              <div className={`floating-analytic-card ${panelsCollapsed.medio ? 'collapsed' : ''}`}>
                <div className="floating-card-header" onClick={() => setPanelsCollapsed(prev => ({ ...prev, medio: !prev.medio }))}>
                  {selectedAnalyticEnsayo ? (
                    <h4 style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <span><i className="fas fa-vial" style={{ color: '#10b981' }}></i> Resultados de Ensayo</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAnalyticEnsayo(null); }}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                        title="Volver a estadísticas"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </h4>
                  ) : (
                    <h4><i className="fas fa-chart-pie"></i> {selectedMapItem?.data ? 'Perfil SUCS Local' : 'Auditoría de Ensayos'}</h4>
                  )}
                  {!selectedAnalyticEnsayo && (
                    <div className="header-actions">
                      <button><i className={`fas fa-${panelsCollapsed.medio ? 'plus' : 'minus'}`}></i></button>
                    </div>
                  )}
                </div>
                {!panelsCollapsed.medio && (
                  <div className="floating-card-body" style={{ display: 'flex', flexDirection: 'column' }}>
                    {selectedAnalyticEnsayo ? (
                      // RENDERIZADO DE RESULTADOS DE ENSAYO SELECCIONADO
                      <div className="assay-detailed-results">
                        <div className="assay-result-title">
                          {selectedAnalyticEnsayo.tipo_ensayo_descripcion || 'Detalles del Ensayo'}
                        </div>
                        <div className="assay-result-meta">
                          <span><i className="fas fa-map-marker-alt"></i> {selectedMapItem?.data?.nombre || 'Progresiva'}</span>
                          <span><i className="fas fa-layer-group"></i> Estrato {selectedAnalyticEnsayo.estratoOrden || '1'}</span>
                        </div>

                        <div className="assay-result-grid">
                          {(() => {
                            const keyNorm = (selectedAnalyticEnsayo.config_key || '')
                              .normalize("NFD")
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .toLowerCase();

                            // 1. Parsear robustamente datos_formulario
                            let datos = selectedAnalyticEnsayo.datos_formulario || selectedAnalyticEnsayo.datos_ensayo || {};
                            if (typeof datos === 'string') {
                              try {
                                datos = JSON.parse(datos);
                              } catch (e) {
                                datos = {};
                              }
                            }

                            // 2. Parsear robustamente resultado
                            let resultadoFinal = selectedAnalyticEnsayo.resultado;
                            if (typeof resultadoFinal === 'string') {
                              try {
                                resultadoFinal = JSON.parse(resultadoFinal);
                              } catch (e) {
                                resultadoFinal = {};
                              }
                            }

                            // 3. Parsear robustamente configuraciones de tipo_ensayo
                            let configCalculos = selectedAnalyticEnsayo.config_calculos;
                            if (typeof configCalculos === 'string') {
                              try {
                                configCalculos = JSON.parse(configCalculos);
                              } catch (e) {
                                configCalculos = null;
                              }
                            }

                            let configTabla = selectedAnalyticEnsayo.config_tabla;
                            if (typeof configTabla === 'string') {
                              try {
                                configTabla = JSON.parse(configTabla);
                              } catch (e) {
                                configTabla = null;
                              }
                            }

                            let resultsConfig = selectedAnalyticEnsayo.results_config;
                            if (typeof resultsConfig === 'string') {
                              try {
                                resultsConfig = JSON.parse(resultsConfig);
                              } catch (e) {
                                resultsConfig = null;
                              }
                            }

                            // 4. Determinar recursivamente si hay al menos un valor real útil en el resultado
                            const hasValidValues = (obj) => {
                              if (!obj || typeof obj !== 'object') return false;
                              for (const val of Object.values(obj)) {
                                if (val !== null && val !== undefined && val !== '') {
                                  if (typeof val === 'object') {
                                    if (hasValidValues(val)) return true;
                                  } else {
                                    return true;
                                  }
                                }
                              }
                              return false;
                            };

                            // 5. Evaluar o calcular al vuelo en caliente si el resultado está vacío o carece de valores válidos
                            const needsCalculation = !resultadoFinal || 
                                                     Object.keys(resultadoFinal).length === 0 || 
                                                     !hasValidValues(resultadoFinal);

                            if (needsCalculation && configCalculos && datos) {
                              try {
                                resultadoFinal = calcularResultados(configCalculos, datos, configTabla);
                              } catch (e) {
                                console.error('[DEBUG INGENIERIA] Error al calcular resultados al vuelo para panel:', e);
                              }
                            }

                            // (logs de diagnóstico eliminados)

                            const mockEnsayo = { 
                              ...selectedAnalyticEnsayo, 
                              datos_formulario: datos,
                              resultado: resultadoFinal 
                            };

                            const config = resultsConfig;
                            const fieldsToRender = [];
                            if (config && Array.isArray(config.groups)) {
                              config.groups.forEach(g => {
                                if (Array.isArray(g.fields)) {
                                  g.fields.forEach(f => {
                                    fieldsToRender.push(f);
                                  });
                                }
                              });
                            }

                            if (fieldsToRender.length > 0) {
                              return (
                                <>
                                  {fieldsToRender.map((f, idx) => {
                                    const val = getDynamicEnsayoFieldValue(mockEnsayo, f.name, config);
                                    let formattedVal = '---';

                                    if (val !== null && !isNaN(val)) {
                                      // Heurística de precisión agnóstica y matemática: si es menor a 10 y tiene decimales usar 3, si no 1 decimal
                                      const precision = f.precision !== undefined
                                        ? f.precision
                                        : (val < 10 && val > 0 && !Number.isInteger(val) ? 3 : 1);

                                      formattedVal = `${val.toFixed(precision)}`;

                                      if (f.unit) {
                                        formattedVal += ` ${f.unit}`;
                                      }
                                    } else {
                                      const rawVal = getNestedValue(datos, f.name) ||
                                        getNestedValue(selectedAnalyticEnsayo.resultado, f.name) ||
                                        getNestedValue(selectedAnalyticEnsayo.resultado, `resultados.${f.name}`) ||
                                        getNestedValue(datos, `resultados.${f.name}`) ||
                                        getNestedValue(datos, `general_fields.${f.name}`);
                                      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                                        formattedVal = String(rawVal);
                                      }
                                    }

                                    // Resaltado e interfaz genérica y agnóstica
                                    const isHighlight = idx === 0 || f.highlight === true || f.isHighlight === true;
                                    const isFullWidth = f.fullWidth === true || (f.label && f.label.length > 22) || formattedVal.length > 15;

                                    // Paleta de colores rotativos premium (Agnóstica y Dinámica)
                                    const colors = ['text-blue', 'text-orange', 'text-purple', 'text-green', 'text-teal', 'text-pink'];
                                    const colorClass = f.colorClass || f.color || colors[idx % colors.length];

                                    return (
                                      <div key={idx} className={`result-val-box ${isHighlight ? 'highlight' : ''} ${isFullWidth ? 'full' : ''}`}>
                                        <span className="res-label">{f.label || f.name}</span>
                                        <span className={`res-value ${colorClass}`} style={isFullWidth && colorClass ? { fontSize: '1rem' } : {}}>{formattedVal}</span>
                                      </div>
                                    );
                                  })}
                                </>
                              );
                            }

                            // Fallback agnóstico si no hay una configuración explícita en results_config
                            const resultadoFinalFallback = resultadoFinal || {};
                            const generalFields = selectedAnalyticEnsayo.datos_formulario?.general_fields ||
                              selectedAnalyticEnsayo.datos_formulario?.general ||
                              selectedAnalyticEnsayo.datos_formulario || {};

                            const itemsToShow = [];

                            // 1. Recorrer claves de resultado
                            for (const [k, v] of Object.entries(resultadoFinalFallback)) {
                              if (v !== null && typeof v !== 'object' && String(v).trim() !== '') {
                                itemsToShow.push({ label: k.replace(/_/g, ' ').toUpperCase(), value: String(v) });
                              } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                                for (const [subK, subV] of Object.entries(v)) {
                                  if (subV !== null && typeof subV !== 'object' && String(subV).trim() !== '') {
                                    itemsToShow.push({ label: subK.replace(/_/g, ' ').toUpperCase(), value: String(subV) });
                                  }
                                }
                              }
                            }

                            // 2. Si no hay nada en resultado, intentar con campos generales del formulario
                            if (itemsToShow.length === 0) {
                              const tableRowKeys = new Set();
                              const configTabla = selectedAnalyticEnsayo.config_tabla || selectedAnalyticEnsayo.tableConfig;
                              if (configTabla?.tables) {
                                const tablas = Array.isArray(configTabla.tables) ? configTabla.tables : Object.values(configTabla.tables);
                                tablas.forEach(tbl => {
                                  const rows = tbl?.rows || [];
                                  const scanRows = Array.isArray(rows) ? rows : Object.values(rows);
                                  scanRows.forEach(r => {
                                    if (r?.key) tableRowKeys.add(String(r.key).toLowerCase());
                                  });
                                });
                              }

                              for (const [k, v] of Object.entries(generalFields)) {
                                const keyLower = k.toLowerCase();
                                if (v !== null && typeof v !== 'object' && String(v).trim() !== '' && !tableRowKeys.has(keyLower)) {
                                  itemsToShow.push({ label: k.replace(/_/g, ' ').toUpperCase(), value: String(v) });
                                }
                              }
                            }

                            if (itemsToShow.length > 0) {
                              return (
                                <>
                                  {itemsToShow.slice(0, 8).map((item, idx) => {
                                    const isFullWidth = item.value.length > 12 || item.label.length > 18;
                                    return (
                                      <div key={idx} className={`result-val-box ${idx === 0 ? 'highlight' : ''} ${isFullWidth ? 'full' : ''}`}>
                                        <span className="res-label">{item.label}</span>
                                        <span className="res-value text-blue">{item.value}</span>
                                      </div>
                                    );
                                  })}
                                </>
                              );
                            }

                            return <span className="no-assays-text">No hay resumen de resultados para este tipo de ensayo</span>;
                          })()}
                        </div>
                      </div>
                    ) : selectedMapItem?.data ? (
                      // PERFIL SUCS LOCAL
                      <div className="strata-chart-visual" style={{ width: '100%' }}>
                        {selectedMapItem.data.estratos_perfil?.length > 0 ? (
                          <div className="strata-bar-visual-container">
                            {selectedMapItem.data.estratos_perfil.map((est, idx) => {
                              const totalDepth = parseFloat(selectedMapItem.data.estratos_perfil[selectedMapItem.data.estratos_perfil.length - 1].profundidad_final) || 1.5;
                              const start = idx === 0 ? 0 : parseFloat(selectedMapItem.data.estratos_perfil[idx - 1].profundidad_final) || 0;
                              const end = parseFloat(est.profundidad_final) || start + 0.5;
                              const thickness = end - start;
                              const percentage = (thickness / totalDepth) * 100;
                              return (
                                <div
                                  key={idx}
                                  className="strata-bar-segment"
                                  style={{
                                    height: `${percentage}%`,
                                    backgroundColor: est.nlp_color_hex || '#475569',
                                    minHeight: '28px'
                                  }}
                                  title={`${est.nombre_estrato || est.descripcion} (${start.toFixed(2)}m - ${end.toFixed(2)}m)`}
                                >
                                  <span className="strata-bar-label">{est.nombre_estrato || est.descripcion || 'Estrato'}</span>
                                  <span className="strata-bar-depth">{end.toFixed(1)}m</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="no-assays-text">Sin estratos registrados en esta progresiva</span>
                        )}
                      </div>
                    ) : (
                      // DONA DE AUDITORÍA GENERAL REDISEÑADA Y ULTRA ESTÉTICA
                      // PANEL DE AUDITORÍA GEOTÉCNICA PREMIUM Y ULTRA ESTÉTICA (LIBRE DE CANVAS)
                      <div className="geotech-audit-container">
                        {/* Progreso por Estados en Barras Horizontales */}
                        <div className="audit-section-title">Progreso General por Estado</div>
                        <div className="stacked-progress-bar">
                          {(() => {
                            const data = ensayosStatusData.datasets[0].data;
                            const total = data.reduce((a, b) => a + b, 0);
                            const labels = ensayosStatusData.labels;
                            const colors = ['#9ca3af', '#f59e0b', '#ef4444', '#10b981', '#3b82f6']; // Gris, Naranja, Rojo, Verde, Azul

                            if (total === 0) return <div className="progress-segment" style={{ width: '100%', backgroundColor: '#cbd5e1', borderRadius: '8px' }} title="Sin ensayos"></div>;

                            return data.map((val, idx) => {
                              if (val === 0) return null;
                              const pct = ((val / total) * 100).toFixed(1);
                              return (
                                <div
                                  key={idx}
                                  className="progress-segment"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: colors[idx],
                                  }}
                                  title={`${labels[idx]}: ${val} (${pct}%)`}
                                />
                              );
                            });
                          })()}
                        </div>

                        {/* Leyenda interactiva de Estados */}
                        <div className="audit-states-grid">
                          {ensayosStatusData.labels.map((label, idx) => {
                            const val = ensayosStatusData.datasets[0].data[idx];
                            const total = ensayosStatusData.datasets[0].data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            const colors = ['#9ca3af', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

                            if (val === 0) return null;

                            return (
                              <div key={label} className="audit-state-chip">
                                <span className="state-dot" style={{ backgroundColor: colors[idx] }}></span>
                                <span className="state-name">{label}</span>
                                <span className="state-count">{val} <small className="state-pct">({pct}%)</small></span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desglose por Tipo de Ensayo */}
                        <div className="audit-section-title" style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                          Desglose por Tipo de Ensayo
                        </div>
                        <div className="assay-dist-list custom-scrollbar">
                          {ensayosDistribution.length > 0 ? (
                            ensayosDistribution.map((item, idx) => (
                              <div key={idx} className="assay-dist-item">
                                <div className="assay-dist-meta">
                                  <span className="assay-dist-name" title={item.name}>{item.name}</span>
                                  <span className="assay-dist-counts">
                                    <span className="ok-count">{item.aprobado + item.completado}</span>
                                    <span className="separator">/</span>
                                    <span className="total-count">{item.total}</span>
                                  </span>
                                </div>
                                <div className="mini-progress-track">
                                  <div
                                    className="mini-progress-fill"
                                    style={{
                                      width: `${item.avancePerc}%`,
                                      background: item.avancePerc === 100
                                        ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                        : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                                    }}
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="empty-dist-text">Sin ensayos registrados</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PANEL INFERIOR: Gráfico de Tendencias Geoespaciales interactivo */}
              <div className={`floating-analytic-card ${panelsCollapsed.inferior ? 'collapsed' : ''}`}>
                <div className="floating-card-header" onClick={() => setPanelsCollapsed(prev => ({ ...prev, inferior: !prev.inferior }))}>
                  <h4>
                    <i className="fas fa-chart-line"></i> Tendencia: {
                      availableTrendTypes.find(t => t.config_key === selectedTrendType)?.nombre || 'Curva de Tendencia'
                    }
                  </h4>
                  <div className="header-actions">
                    <button><i className={`fas fa-${panelsCollapsed.inferior ? 'plus' : 'minus'}`}></i></button>
                  </div>
                </div>
                {!panelsCollapsed.inferior && (
                  <div className="floating-card-body">
                    <div className="trend-selectors">
                      {availableTrendTypes.map(type => {
                        const isActive = selectedTrendType === type.config_key;
                        return (
                          <button
                            key={type.config_key}
                            onClick={(e) => { e.stopPropagation(); setSelectedTrendType(type.config_key); }}
                            className={`trend-sel-btn ${isActive ? 'active' : ''}`}
                            title={selectedAnalyticEnsayo !== null && selectedAnalyticEnsayo.config_key !== type.config_key 
                              ? `Desactivado: el ensayo seleccionado es de tipo ${selectedAnalyticEnsayo.tipo_ensayo_descripcion || selectedAnalyticEnsayo.nombre_ensayo}`
                              : `Curva de tendencia de ${type.nombre}`}
                            disabled={selectedAnalyticEnsayo !== null && selectedAnalyticEnsayo.config_key !== type.config_key}
                          >
                            {type.nombre.split(' ')[0]} {/* Primera palabra del nombre para ahorrar espacio */}
                          </button>
                        );
                      })}
                      {availableTrendTypes.length === 0 && (
                        <span className="no-assays-text" style={{ padding: '6px' }}>Sin tipos de tendencia</span>
                      )}
                    </div>

                     {activeTrendTypeConfig?.config_graficos ? (
                        <div 
                          className="trend-preview-cta-card"
                          onClick={() => setShowTrendModal(true)}
                          title="Haga clic para ampliar los gráficos a pantalla completa"
                        >
                          <div className="trend-cta-glow"></div>
                          <div className="trend-cta-icon-box">
                            <i className="fas fa-chart-line"></i>
                          </div>
                          <div className="trend-cta-content">
                            <span className="trend-cta-title">Visualizar Gráficos de Tendencia</span>
                            <span className="trend-cta-desc">Consolidado del tramo y analíticas</span>
                            <span className="trend-cta-action">
                              <i className="fas fa-expand-alt" style={{ marginRight: '4px' }}></i> Clic para pantalla completa
                            </span>
                          </div>
                          <div className="trend-cta-badge">
                            {groupEnsayosFiltrados.length}
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '140px', width: '100%', marginTop: '10px', position: 'relative' }}>
                          {(() => {
                            const { trendData, fieldsToExtract } = processedGeotechData;
                            const dataPoints = trendData.filter(d => d.hasData);
                            const isCurvaCompleta = fieldsToExtract.some(f => f.isCurvaCompleta) ||
                              dataPoints.some(d => {
                                const firstField = fieldsToExtract[0]?.name;
                                return firstField && Array.isArray(d.fieldValues[firstField]);
                              });
                              
                            if (isCurvaCompleta) {
                              return (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', margin: '-4px 0 6px 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ display: 'inline-block', width: '12px', height: '2px', backgroundColor: 'rgba(37, 99, 235, 0.7)', borderRadius: '1px' }}></span>
                                    <span>Curvas de tendencia</span>
                                  </div>
                                  {selectedMapItem?.data && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ display: 'inline-block', width: '12px', height: '3px', backgroundColor: '#fbbf24', borderRadius: '1px' }}></span>
                                      <span style={{ color: '#fbbf24', fontWeight: '600' }}>Seleccionado ({selectedMapItem.data.nombre})</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          <Line
                            style={{ background: 'transparent', backgroundColor: 'transparent' }}
                            data={(() => {
                              const { trendData, fieldsToExtract } = processedGeotechData;
                              const dataPoints = trendData.filter(d => d.hasData);

                              // Determinar dinámicamente si es un ensayo de curvas completas (ej. granulometría)
                              // Se cumple si algún campo se marcó como isCurvaCompleta o si los valores son arrays
                              const isCurvaCompleta = fieldsToExtract.some(f => f.isCurvaCompleta) ||
                                dataPoints.some(d => {
                                  const firstField = fieldsToExtract[0]?.name;
                                  return firstField && Array.isArray(d.fieldValues[firstField]);
                                });

                              if (isCurvaCompleta) {
                                // Renderizar curvas completas y superpuestas dinámicamente de forma 100% agnóstica
                                const curveField = fieldsToExtract.find(f => f.isCurvaCompleta)?.name || fieldsToExtract[0]?.name;
                                const datasets = dataPoints.map(d => {
                                  const points = d.fieldValues[curveField] || [];
                                  const isSelected = selectedMapItem?.data && d.nombre === selectedMapItem.data.nombre;

                                  return {
                                    label: d.nombre,
                                    data: points,
                                    borderColor: isSelected ? '#fbbf24' : 'rgba(37, 99, 235, 0.4)',
                                    backgroundColor: 'transparent',
                                    borderWidth: isSelected ? 3.5 : 1.2,
                                    pointRadius: isSelected ? 5 : 1,
                                    pointBackgroundColor: isSelected ? '#fbbf24' : 'rgba(37, 99, 235, 0.5)',
                                    pointBorderColor: isSelected ? '#fff' : 'rgba(37, 99, 235, 0.3)',
                                    tension: 0.15,
                                    fill: false,
                                    showLine: true
                                  };
                                });
                                return { datasets };
                              } else {
                                // Eje X = Progresivas (categorías)
                                const labels = dataPoints.map(d => d.nombre);
                                const datasets = [];

                                fieldsToExtract.forEach((field) => {
                                  datasets.push({
                                    label: field.label,
                                    data: dataPoints.map(d => d.fieldValues[field.name]),
                                    borderColor: field.color || '#ef4444',
                                    backgroundColor: `${field.color || '#ef4444'}1a`,
                                    pointBackgroundColor: dataPoints.map(d =>
                                      d.nombre === selectedMapItem?.data?.nombre
                                        ? '#fbbf24'
                                        : (field.limit && d.fieldValues[field.name] > field.limit ? '#ef4444' : field.color || '#f87171')
                                    ),
                                    pointBorderColor: dataPoints.map(d =>
                                      d.nombre === selectedMapItem?.data?.nombre
                                        ? '#fbbf24'
                                        : (field.limit && d.fieldValues[field.name] > field.limit ? '#ef4444' : field.color || '#f87171')
                                    ),
                                    pointRadius: dataPoints.map(d =>
                                      d.nombre === selectedMapItem?.data?.nombre ? 7 : 4
                                    ),
                                    pointHoverRadius: 8,
                                    tension: 0.2,
                                    borderWidth: 2,
                                    yAxisID: field.yAxisID || 'y'
                                  });

                                  // Dataset para el límite de control geotécnico si existe
                                  if (field.limit) {
                                    datasets.push({
                                      label: field.limitLabel,
                                      data: dataPoints.map(() => field.limit),
                                      borderColor: 'rgba(239, 68, 68, 0.4)',
                                      borderWidth: 1.2,
                                      borderDash: [5, 5],
                                      pointRadius: 0,
                                      fill: false
                                    });
                                  }
                                });

                                return { labels, datasets };
                              }
                            })()}
                            options={(() => {
                              const { trendData, fieldsToExtract } = processedGeotechData;
                              const dataPoints = trendData.filter(d => d.hasData);
                              const isCurvaCompleta = fieldsToExtract.some(f => f.isCurvaCompleta) ||
                                dataPoints.some(d => {
                                  const firstField = fieldsToExtract[0]?.name;
                                  return firstField && Array.isArray(d.fieldValues[firstField]);
                                });

                              const fieldMeta = fieldsToExtract[0] || {};

                              return {
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    display: !isCurvaCompleta,
                                    position: 'top',
                                    labels: {
                                      color: 'rgba(255, 255, 255, 0.8)',
                                      font: { size: 9, weight: '600' },
                                      boxWidth: 12,
                                      padding: 8
                                    }
                                  },
                                  datalabels: {
                                    display: false,
                                    formatter: () => '',
                                    opacity: 0,
                                    color: 'transparent',
                                    font: { size: 0 }
                                  }, // Desactivar datalabels para prevenir traslapes
                                  tooltip: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    titleColor: '#fff',
                                    bodyColor: '#fff',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    borderWidth: 1,
                                    padding: 10,
                                    callbacks: {
                                      title: function (context) {
                                        if (isCurvaCompleta) {
                                          return `Muestra: ${context[0].dataset.label}`;
                                        }
                                        return `Progresiva: ${context[0].label}`;
                                      },
                                      label: function (context) {
                                        const yVal = context.parsed.y;
                                        if (isCurvaCompleta) {
                                          const xVal = context.parsed.x;
                                          const xLabel = fieldMeta.xLabel || 'X';
                                          const xUnit = fieldMeta.xUnit || '';
                                          const yLabel = fieldMeta.yLabel || 'Y';
                                          const yUnit = fieldMeta.yUnit || '';
                                          return ` ${xLabel}: ${xVal.toFixed(3)}${xUnit} - ${yLabel}: ${yVal.toFixed(1)}${yUnit}`;
                                        }
                                        const datasetLabel = context.dataset.label || '';
                                        return ` ${datasetLabel}: ${yVal.toFixed(2)}`;
                                      }
                                    }
                                  },
                                  engineeringDecorations: {
                                    background: false,
                                    gridGlow: 'transparent'
                                  }
                                },
                                scales: {
                                  x: isCurvaCompleta ? {
                                    type: fieldMeta.scaleType || 'linear',
                                    position: 'bottom',
                                    reverse: !!fieldMeta.reverseX,
                                    min: fieldMeta.minX,
                                    max: fieldMeta.maxX,
                                    grid: { color: 'rgba(255, 255, 255, 0.06)' },
                                    ticks: {
                                      color: 'rgba(255, 255, 255, 0.6)',
                                      font: { size: 8 },
                                      callback: function (value) {
                                        const ticksX = fieldMeta.ticksX;
                                        if (ticksX && Array.isArray(ticksX)) {
                                          const tickStr = String(value);
                                          const shouldShow = ticksX.some(t => Math.abs(t - value) < 0.001 || String(t) === tickStr);
                                          return shouldShow ? value : '';
                                        }
                                        return value;
                                      }
                                    },
                                    title: {
                                      display: true,
                                      text: fieldMeta.xTitle || 'Eje X',
                                      color: 'rgba(255, 255, 255, 0.7)',
                                      font: { size: 9, weight: '600' }
                                    }
                                  } : {
                                    grid: { display: false },
                                    ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 8 } }
                                  },
                                  y: {
                                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                                    ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 8 } },
                                    position: 'left',
                                    min: isCurvaCompleta ? fieldMeta.minY : undefined,
                                    max: isCurvaCompleta ? fieldMeta.maxY : undefined,
                                    title: isCurvaCompleta ? {
                                      display: true,
                                      text: fieldMeta.yTitle || 'Eje Y',
                                      color: 'rgba(255, 255, 255, 0.7)',
                                      font: { size: 9, weight: '600' }
                                    } : undefined
                                  },
                                  y1: (!isCurvaCompleta && fieldsToExtract.length > 1) ? {
                                    grid: { drawOnChartArea: false },
                                    ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 8 } },
                                    position: 'right'
                                  } : {
                                    display: false
                                  }
                                },
                                onClick: (event, elements, chart) => {
                                  if (elements && elements.length > 0) {
                                    const element = elements[0];
                                    if (isCurvaCompleta) {
                                      const chartInstance = chart || event.chart || element.chart;
                                      if (chartInstance) {
                                        const datasetLabel = chartInstance.data.datasets[element.datasetIndex].label;
                                        const targetProg = progresivas.find(p => p.nombre === datasetLabel);
                                        if (targetProg) {
                                          handleSelectFromList(targetProg);
                                        }
                                      }
                                    } else {
                                      const activeIdx = element.index;
                                      const { trendData } = processedGeotechData;
                                      const dataPoints = trendData.filter(d => d.hasData);
                                      const targetItem = dataPoints[activeIdx];
                                      if (targetItem) {
                                        const fullItem = progresivas.find(p => p.id === targetItem.id);
                                        if (fullItem) {
                                          handleSelectFromList(fullItem);
                                        }
                                      }
                                    }
                                  }
                                }
                              };
                            })()}
                          />
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setMapCenterTo('reset')}
            title="Centrar mapa general"
            className={isExternalView ? "btn-compress-center-premium" : ""}
            style={isExternalView ? {
              position: 'absolute',
              bottom: '110px',
              right: isSidebarOpen ? '420px' : '20px', // Alinear perfectamente a 20px con ZoomControl y capas
              zIndex: 1000,
              width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.3s ease, background-color 0.2s, color 0.2s, transform 0.2s',
              fontSize: '1.2rem'
            } : {
              position: 'absolute', bottom: '30px', right: '20px', zIndex: 1000,
              width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '50%',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)', cursor: 'pointer', transition: 'all 0.2s ease',
              fontSize: '1.2rem'
            }}
            onMouseOver={(e) => {
              if (!isExternalView) {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#2563eb';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (!isExternalView) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
              }
            }}
          >
            <i className="fas fa-compress-arrows-alt"></i>
          </button>

          <SuelosMap
            onMapClick={handleMapClick}
            progresivasData={sidebarView === 'details' && selectedMapItem?.data ? [selectedMapItem.data] : progresivas}
            trazadoIds={trazadoIds}
            defaultZone={progresivas.find(p => p.linea)?.linea || '18L'}
            canterasData={canterasMapData}
            centerTo={mapCenterTo}
            layerContext={isExternalView ? "dashboard" : "dashboard"}
            isExternalView={isExternalView}
            displayMode={isExternalView ? "horizontal-bottom" : "full"}
            isSidebarOpen={isSidebarOpen}
          />

          {isExternalView && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`external-sidebar-toggle-btn ${isSidebarOpen ? 'open' : 'closed'}`}
              title={isSidebarOpen ? "Ocultar panel" : "Mostrar panel"}
            >
              <i className={`fas fa-chevron-${isSidebarOpen ? 'right' : 'left'}`}></i>
            </button>
          )}

        </div>

        <aside className={`sidebar-premium custom-scrollbar ${isExternalView ? 'external-mode' : ''} ${!isSidebarOpen && isExternalView ? 'collapsed' : ''}`} style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          {sidebarView === 'list' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} className="custom-scrollbar">
              <div className="sidebar-header-ultra">
                <h3 className="sidebar-title-ultra">
                  <i className="fas fa-compass gradient-icon me-2" style={{ marginRight: '8px' }}></i> Exploración
                </h3>
              </div>

              <div className="segmented-control-ultra">
                <button onClick={() => setFilterType('data')} className={`seg-btn ${filterType === 'data' ? 'active' : ''}`}>Con Datos</button>
                <button onClick={() => setFilterType('all')} className={`seg-btn ${filterType === 'all' ? 'active' : ''}`}>Todas</button>
              </div>

              <div className="search-wrapper-ultra">
                <i className="fas fa-search search-icon"></i>
                <input type="text" placeholder="Buscar progresiva, tramo..." value={searchTerm} onChange={ev => setSearchTerm(ev.target.value)} className="search-input-ultra" />
              </div>

              <div className="prog-list-container">
                {filtered.map(p => (
                  <div key={p.id} onClick={() => handleSelectFromList(p)} className="sidebar-prog-card-ultra">
                    <div className="card-header-flex">
                      <span className="prog-name">{p.nombre}</span>
                      <span className={`status-badge-glow ${(!p.estratos_perfil || p.estratos_perfil.length === 0) ? 'sin-datos' : (p.estado || 'pendiente').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}>
                        <span className="glow-dot"></span>
                        {(!p.estratos_perfil || p.estratos_perfil.length === 0) ? 'SIN DATOS' : (p.estado || 'PENDIENTE').toUpperCase()}
                      </span>
                    </div>
                    <div className="card-meta-row">
                      <div className="meta-badge">
                        <div className="icon-box-blue"><i className="fas fa-layer-group"></i></div>
                        <span>{p.estratos_perfil?.length || 0} Estratos</span>
                      </div>
                      <div className="meta-badge">
                        <div className="icon-box-gray"><i className="fas fa-map-pin"></i></div>
                        <span>Lado {p.lado?.charAt(0).toUpperCase() || 'E'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="empty-state">No se encontraron progresivas.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="sidebar-detail-ultra custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="detail-header-ultra">
                <button onClick={() => { setSidebarView('list'); setSelectedMapItem(null); setMapCenterTo('reset'); }} className="icon-btn-glass"><i className="fas fa-chevron-left"></i></button>
                <h3 className="detail-title-ultra">
                  <span className="text-gradient">{selectedMapItem.data.nombre}</span>
                </h3>
                <button onClick={() => { setSidebarView('list'); setSelectedMapItem(null); setMapCenterTo('reset'); }} className="icon-btn-fade"><i className="fas fa-times"></i></button>
              </div>

              <div className="status-banner-ultra">
                <div className={`status-glow-chip ${(!selectedMapItem.data.estratos_perfil || selectedMapItem.data.estratos_perfil.length === 0) ? 'sin-datos' : (selectedMapItem.data.estado || 'pendiente').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}>
                  <div className="pulse-dot"></div>
                  {(!selectedMapItem.data.estratos_perfil || selectedMapItem.data.estratos_perfil.length === 0) ? 'SIN DATOS' : (selectedMapItem.data.estado || 'PENDIENTE').toUpperCase()}
                </div>
              </div>

              <div className="detail-meta-grid">
                <div className="meta-card">
                  <div className="icon-wrap map-color"><i className="fas fa-map-signs"></i></div>
                  <div className="meta-content">
                    <span className="label">Lado</span>
                    <span className="value">{selectedMapItem.data.lado || 'EJE'}</span>
                  </div>
                </div>
                <div className="meta-card">
                  <div className="icon-wrap layers-color"><i className="fas fa-layer-group"></i></div>
                  <div className="meta-content">
                    <span className="label">Estratos</span>
                    <span className="value">{selectedMapItem.data.estratos_perfil?.length || 0} Reg.</span>
                  </div>
                </div>

                <div className="meta-card full-width coords-card">
                  <div className="coord-block">
                    <span className="label text-blue-muted">ESTE (X)</span>
                    <span className="value text-mono text-dark">{selectedMapItem.data.coordenada_este || '-'}</span>
                  </div>
                  <div className="coord-divider"></div>
                  <div className="coord-block">
                    <span className="label text-purple-muted">NORTE (Y)</span>
                    <span className="value text-mono text-dark">{selectedMapItem.data.coordenada_norte || '-'}</span>
                  </div>
                </div>

                <div className="meta-card full-width">
                  <div className="icon-wrap text-color"><i className="fas fa-align-left"></i></div>
                  <div className="meta-content">
                    <span className="label">Descripción</span>
                    <span className="value">{selectedMapItem.data.descripcion || 'Sin descripción adicional'}</span>
                  </div>
                </div>
              </div>

              <div className="strata-timeline-wrapper">
                <h4 className="strata-title-mini"><i className="fas fa-stream"></i> Perfil Estratigráfico</h4>
                <div className="strata-timeline">
                  {selectedMapItem.data.estratos_perfil?.length > 0 ? (
                    selectedMapItem.data.estratos_perfil.map((est, i) => (
                      <div key={i} className="strata-node">
                        <div className="strata-color-bar" style={{ backgroundColor: est.nlp_color_hex || '#cbd5e1' }}></div>
                        <div className="strata-info">
                          <span className="strata-depth">m - {est.profundidad_final}m</span>
                          <span className="strata-name">{est.nombre_estrato || est.descripcion}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-strata">No hay estratos registrados</div>
                  )}
                </div>
              </div>

              {/* Carrusel de Imágenes Integrado en Sidebar */}
              <div className="sidebar-carrusel-wrapper">
                <h4 className="sidebar-carrusel-title-mini">
                  <i className="fas fa-camera"></i> Registro Fotográfico
                </h4>
                {loadingImages ? (
                  <div className="integrated-carrusel-loading">
                    <div className="spinner-mini"></div>
                    <span>Cargando imágenes...</span>
                  </div>
                ) : progresivaImages.length > 0 ? (
                  <div className="sidebar-carrusel-integrated">
                    <img
                      src={progresivaImages[currentImageIndex]?.imagen_url}
                      alt="Registro de Progresiva"
                      className="integrated-carrusel-img"
                      onClick={() => setViewingGallery(true)}
                      title="Haga clic para abrir la galería a pantalla completa"
                    />

                    {progresivaImages.length > 1 && (
                      <>
                        <button
                          className="integrated-carrusel-btn prev"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : progresivaImages.length - 1));
                          }}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <button
                          className="integrated-carrusel-btn next"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) => (prev < progresivaImages.length - 1 ? prev + 1 : 0));
                          }}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </>
                    )}

                    <div className="integrated-carrusel-counter">
                      {currentImageIndex + 1} / {progresivaImages.length}
                    </div>

                    <div className="integrated-carrusel-caption">
                      {progresivaImages[currentImageIndex]?.nombre_archivo || 'Foto de terreno'}
                    </div>
                  </div>
                ) : (
                  <div
                    className="integrated-carrusel-empty"
                    onClick={() => !isExternalView && setViewingGallery(true)}
                    style={{ cursor: !isExternalView ? 'pointer' : 'default' }}
                  >
                    <i className="fas fa-camera-slash"></i>
                    <p>Sin fotografías registradas</p>
                    {!isExternalView && <span className="upload-hint">Haz clic para subir fotos</span>}
                  </div>
                )}
              </div>

              <div className="action-buttons-ultra">
                {!isExternalView && (
                  <button onClick={() => navigate('/coordinador/recoleccion-datos/gestor-tramos', { state: { activeProgresivaId: selectedMapItem.data.id, openTramoId: selectedMapItem.data.parent_id || selectedMapItem.data.progresiva_padre_id || selectedMapItem.data.id, initialViewMode: 'estratos' } })} className="btn-marvel">
                    <i className="fas fa-chart-area"></i> Ver Estudio y Estratos
                  </button>
                )}
                <button onClick={() => setViewingGallery(true)} className="btn-ghost-dark">
                  <i className="fas fa-images"></i> Ver Galería
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>

      {!isExternalView && (
        <>
          <section className="kpi-grid-premium">
            <div className="kpi-card green"><h3>Avance</h3><p className="value">{avanceStats.val}%</p><p className="sub">{avanceStats.lastProg}</p></div>
            <div className="kpi-card orange"><h3>Canteras</h3><p className="value">{canterasMapData.length}</p><p className="sub">Fuentes de material</p></div>
            <div className="kpi-card blue"><h3>Agua</h3><p className="value">--</p><p className="sub">Sin datos</p></div>
            <div className="kpi-card indigo"><h3>Distancia</h3><p className="value">{avgCanteraDistance} km</p><p className="sub">Promedio a obra</p></div>
          </section>

          <section className="bottom-section-premium">
            <div>
              <div className="map-header-container">
                <i className="fas fa-chart-pie text-primary me-2"></i> Estado de Ensayos
              </div>
              <div className="chart-panel">
                <div className="chart-content-wrapper">
                  {/* PANEL DE AUDITORÍA GEOTÉCNICA PREMIUM Y ULTRA ESTÉTICA (LIBRE DE CANVAS) */}
                  <div className="geotech-audit-container">
                    {/* Progreso por Estados en Barras Horizontales */}
                    <div className="audit-section-title">Progreso General por Estado</div>
                    <div className="stacked-progress-bar">
                      {(() => {
                        const data = ensayosStatusData.datasets[0].data;
                        const total = data.reduce((a, b) => a + b, 0);
                        const labels = ensayosStatusData.labels;
                        const colors = ['#9ca3af', '#f59e0b', '#ef4444', '#10b981', '#3b82f6']; // Gris, Naranja, Rojo, Verde, Azul

                        if (total === 0) return <div className="progress-segment" style={{ width: '100%', backgroundColor: '#cbd5e1', borderRadius: '8px' }} title="Sin ensayos"></div>;

                        return data.map((val, idx) => {
                          if (val === 0) return null;
                          const pct = ((val / total) * 100).toFixed(1);
                          return (
                            <div
                              key={idx}
                              className="progress-segment"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: colors[idx],
                              }}
                              title={`${labels[idx]}: ${val} (${pct}%)`}
                            />
                          );
                        });
                      })()}
                    </div>

                    {/* Leyenda interactiva de Estados */}
                    <div className="audit-states-grid">
                      {ensayosStatusData.labels.map((label, idx) => {
                        const val = ensayosStatusData.datasets[0].data[idx];
                        const total = ensayosStatusData.datasets[0].data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                        const colors = ['#9ca3af', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

                        if (val === 0) return null;

                        return (
                          <div key={label} className="audit-state-chip">
                            <span className="state-dot" style={{ backgroundColor: colors[idx] }}></span>
                            <span className="state-name">{label}</span>
                            <span className="state-count">{val} <small className="state-pct">({pct}%)</small></span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desglose por Tipo de Ensayo */}
                    <div className="audit-section-title" style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                      Desglose por Tipo de Ensayo
                    </div>
                    <div className="assay-dist-list custom-scrollbar" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                      {ensayosDistribution.length > 0 ? (
                        ensayosDistribution.map((item, idx) => (
                          <div key={idx} className="assay-dist-item">
                            <div className="assay-dist-meta">
                              <span className="assay-dist-name" title={item.name}>{item.name}</span>
                              <span className="assay-dist-counts">
                                <span className="ok-count">{item.aprobado + item.completado}</span>
                                <span className="separator">/</span>
                                <span className="total-count">{item.total}</span>
                              </span>
                            </div>
                            <div className="mini-progress-track">
                              <div
                                className="mini-progress-fill"
                                style={{
                                  width: `${item.avancePerc}%`,
                                  background: item.avancePerc === 100
                                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                    : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                                }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-dist-text">Sin ensayos registrados</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="map-header-container justify-content-between w-100">
                <div><i className="fas fa-history text-primary me-2"></i> Notificaciones Recientes</div>
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/coordinador/recoleccion-datos/gestor-tramos'); }} className="ver-todo-link">Ver todo</a>
              </div>
              <div className="list-panel">
                <div className="notif-list custom-scrollbar">
                  {recentAssays.map((ens, i) => (
                    <div key={i} className="notif-card-premium">
                      <div className="notif-icon-vial">
                        <i className="fas fa-vial"></i>
                      </div>
                      <div className="notif-body">
                        <div className="notif-title-row">
                          <span className="notif-name">{ens.nombre_ensayo || 'Ensayo'}</span>
                          <span className={`notif-status-pill ${ens.estado?.toLowerCase() || 'pendiente'}`}>
                            {ens.estado?.toUpperCase() || 'PENDIENTE'}
                          </span>
                        </div>
                        <div className="notif-meta-row">
                          <span><i className="fas fa-map-marker-alt"></i> Tramo: {ens.sourceName}</span>
                          {ens.fecha && (
                            <span><i className="fas fa-calendar-alt"></i> {new Date(ens.fecha).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentAssays.length === 0 && (
                    <div className="empty-state">No hay actividad reciente</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {viewingGallery && selectedMapItem?.data && <ProgresivaImageGalleryModal isOpen={viewingGallery} onClose={() => setViewingGallery(false)} progresiva={selectedMapItem.data} />}

      {showTrendModal && (
        <div className="trend-graphics-modal-overlay" onClick={() => setShowTrendModal(false)}>
          <div className="trend-graphics-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="trend-graphics-modal-header">
              <h3>
                <i className="fas fa-chart-line trend-modal-header-icon" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                <span className="trend-modal-title">
                  Tendencia: {availableTrendTypes.find(t => t.config_key === selectedTrendType)?.nombre || 'Curvas de Tendencia'}
                </span>
                <span className="trend-modal-badge">
                  {groupEnsayosFiltrados.length} {groupEnsayosFiltrados.length === 1 ? 'ensayo' : 'ensayos'}
                </span>
              </h3>
              <button className="close-trend-modal-btn" onClick={() => setShowTrendModal(false)} title="Cerrar ventana">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="trend-graphics-modal-body custom-scrollbar">
              <div className="trend-modal-graphics-panel">
                <VisorGraficos
                  graficosConfig={activeTrendTypeConfig?.config_graficos}
                  scope="group"
                  groupEnsayos={groupEnsayosFiltrados}
                  calculationConfig={activeTrendTypeConfig?.config_calculos}
                  tableConfig={activeTrendTypeConfig?.config_tabla}
                  activeEnsayoId={selectedAnalyticEnsayo?.id}
                  theme="dark"
                />
              </div>

              {selectedAnalyticEnsayo && (
                <div className="trend-modal-sidebar custom-scrollbar">
                  {/* 1. Resultados Detallados de Ensayo */}
                  <div className="trend-sidebar-section">
                    <div className="trend-sidebar-section-title">
                      <i className="fas fa-file-invoice trend-sidebar-icon" style={{ color: '#f59e0b' }}></i>
                      Resultados del Ensayo
                    </div>
                    
                    <div className="trend-sidebar-assay-box">
                      <span className="trend-sidebar-assay-code">
                        {selectedAnalyticEnsayo.codigo_ensayo || `Ensayo ID: ${selectedAnalyticEnsayo.id}`}
                      </span>
                      <span className="trend-sidebar-assay-desc">
                        {selectedAnalyticEnsayo.tipo_ensayo_descripcion || selectedAnalyticEnsayo.nombre_ensayo}
                      </span>
                    </div>

                    <div className="trend-sidebar-results-grid">
                      {(() => {
                        let datos = selectedAnalyticEnsayo.datos_formulario || selectedAnalyticEnsayo.datos_ensayo || {};
                        if (typeof datos === 'string') {
                          try { datos = JSON.parse(datos); } catch (e) { datos = {}; }
                        }
                        let resultadoFinal = selectedAnalyticEnsayo.resultado;
                        if (typeof resultadoFinal === 'string') {
                          try { resultadoFinal = JSON.parse(resultadoFinal); } catch (e) { resultadoFinal = {}; }
                        }
                        let configCalculos = selectedAnalyticEnsayo.config_calculos;
                        if (typeof configCalculos === 'string') {
                          try { configCalculos = JSON.parse(configCalculos); } catch (e) { configCalculos = null; }
                        }
                        let configTabla = selectedAnalyticEnsayo.config_tabla;
                        if (typeof configTabla === 'string') {
                          try { configTabla = JSON.parse(configTabla); } catch (e) { configTabla = null; }
                        }
                        let resultsConfig = selectedAnalyticEnsayo.results_config;
                        if (typeof resultsConfig === 'string') {
                          try { resultsConfig = JSON.parse(resultsConfig); } catch (e) { resultsConfig = null; }
                        }

                        const hasValidValues = (obj) => {
                          if (!obj || typeof obj !== 'object') return false;
                          for (const val of Object.values(obj)) {
                            if (val !== null && val !== undefined && val !== '') {
                              if (typeof val === 'object') {
                                if (hasValidValues(val)) return true;
                              } else {
                                return true;
                              }
                            }
                          }
                          return false;
                        };

                        if ((!resultadoFinal || Object.keys(resultadoFinal).length === 0 || !hasValidValues(resultadoFinal)) && configCalculos && datos) {
                          try {
                            resultadoFinal = calcularResultados(configCalculos, datos, configTabla);
                          } catch (e) {
                            console.error('[DEBUG] Error calculando al vuelo en modal:', e);
                          }
                        }

                        const mockEnsayo = { 
                          ...selectedAnalyticEnsayo, 
                          datos_formulario: datos,
                          resultado: resultadoFinal 
                        };

                        const fieldsToRender = [];
                        if (resultsConfig && Array.isArray(resultsConfig.groups)) {
                          resultsConfig.groups.forEach(g => {
                            if (Array.isArray(g.fields)) {
                              g.fields.forEach(f => {
                                fieldsToRender.push(f);
                              });
                            }
                          });
                        }

                        if (fieldsToRender.length > 0) {
                          return fieldsToRender.map((f, idx) => {
                            const val = getDynamicEnsayoFieldValue(mockEnsayo, f.name, resultsConfig);
                            let formattedVal = '---';

                            if (val !== null && !isNaN(val)) {
                              const precision = f.precision !== undefined
                                ? f.precision
                                : (val < 10 && val > 0 && !Number.isInteger(val) ? 3 : 1);

                              formattedVal = `${val.toFixed(precision)}`;
                              if (f.unit) formattedVal += ` ${f.unit}`;
                            } else {
                              const rawVal = getNestedValue(datos, f.name) ||
                                getNestedValue(resultadoFinal, f.name) ||
                                getNestedValue(resultadoFinal, `resultados.${f.name}`);
                              if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                                formattedVal = String(rawVal);
                              }
                            }

                            const isHighlight = idx === 0 || f.highlight === true || f.isHighlight === true;
                            const colors = ['text-blue', 'text-orange', 'text-purple', 'text-green', 'text-teal'];
                            const colorClass = f.colorClass || f.color || colors[idx % colors.length];

                            return (
                              <div key={idx} className={`trend-sidebar-val-box ${isHighlight ? 'highlight' : ''}`}>
                                <span className="ts-res-label">{f.label || f.name}</span>
                                <span className={`ts-res-value ${colorClass}`}>{formattedVal}</span>
                              </div>
                            );
                          });
                        }

                        const itemsToShow = [];
                        for (const [k, v] of Object.entries(resultadoFinal || {})) {
                          if (v !== null && typeof v !== 'object' && String(v).trim() !== '') {
                            itemsToShow.push({ label: k.replace(/_/g, ' ').toUpperCase(), value: String(v) });
                          }
                        }
                        if (itemsToShow.length > 0) {
                          return itemsToShow.slice(0, 6).map((item, idx) => (
                            <div key={idx} className="trend-sidebar-val-box">
                              <span className="ts-res-label">{item.label}</span>
                              <span className="ts-res-value text-blue">{item.value}</span>
                            </div>
                          ));
                        }

                        return <span className="no-assays-text">No hay resumen de resultados para este ensayo</span>;
                      })()}
                    </div>
                  </div>

                  {/* 2. Perfil Estratigráfico Resaltado */}
                  <div className="trend-sidebar-section" style={{ marginTop: '20px' }}>
                    <div className="trend-sidebar-section-title">
                      <i className="fas fa-layer-group trend-sidebar-icon" style={{ color: '#3b82f6' }}></i>
                      Perfil Estratigráfico Resaltado
                    </div>

                    <div className="trend-sidebar-strata-container">
                      {(() => {
                        const estratoDelEnsayoSeleccionado = selectedMapItem?.data?.estratos_perfil?.find(est => 
                          est.ensayos?.some(ens => ens.id === selectedAnalyticEnsayo?.id)
                        );
                        
                        if (selectedMapItem?.data?.estratos_perfil?.length > 0) {
                          return (
                            <div className="trend-sidebar-strata-list">
                              {selectedMapItem.data.estratos_perfil.map((est, idx) => {
                                const isSelectedstrata = estratoDelEnsayoSeleccionado?.id === est.id;
                                const start = idx === 0 ? 0 : parseFloat(selectedMapItem.data.estratos_perfil[idx - 1].profundidad_final) || 0;
                                const end = parseFloat(est.profundidad_final) || start + 0.5;
                                const thickness = end - start;

                                return (
                                  <div 
                                    key={idx} 
                                    className={`trend-sidebar-strata-row ${isSelectedstrata ? 'active' : ''}`}
                                    title={`${est.nombre_estrato || est.descripcion} (${start.toFixed(2)}m - ${end.toFixed(2)}m)`}
                                  >
                                    <div 
                                      className="trend-sidebar-strata-color-pill" 
                                      style={{ backgroundColor: est.nlp_color_hex || '#475569' }} 
                                    />
                                    <div className="trend-sidebar-strata-info">
                                      <span className="strata-row-title">{est.nombre_estrato || est.descripcion || 'Estrato'}</span>
                                      <span className="strata-row-depth">De {start.toFixed(2)}m a {end.toFixed(2)}m ({thickness.toFixed(2)}m)</span>
                                    </div>
                                    {isSelectedstrata && (
                                      <div className="trend-sidebar-strata-badge">
                                        <i className="fas fa-vial" style={{ marginRight: '4px' }}></i> Ensayo Aquí
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return <span className="no-assays-text">Sin estratos registrados en esta progresiva</span>;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );

  return isExternalView ? ReactDOM.createPortal(content, document.body) : content;
}
