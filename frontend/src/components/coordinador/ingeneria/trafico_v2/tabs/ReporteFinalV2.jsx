import { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  ReferenceLine
} from 'recharts';
import { MODULE_CONFIG, REPORT_TAB_TO_MODULE, formatDate } from '../trafficV2Utils';
import { getMockTrafficData } from '../trafficV2MockData';
import TrafficExcelUploadModal from '../components/TrafficExcelUploadModal';

// Paleta de colores premium para los gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Componente para formatear números grandes (como los ESALs) de manera legible
const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)} M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} k`;
  return String(num);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="traffic-v2-chart-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry, index) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }}>
            <span className="dot" style={{ backgroundColor: entry.color }} />
            {entry.name}: <strong>{typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ReporteFinalV2 = ({ activeSubTab, stations = [], sections = [], extractedTrafficData = {}, setExtractedTrafficData }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const moduleKey = REPORT_TAB_TO_MODULE[activeSubTab];
  const moduleConfig = MODULE_CONFIG[moduleKey];
  const isSectionBased = moduleConfig?.entityType === 'section' || activeSubTab === 'encuesta_velocidad';
  
  // Dataset de entidades a usar
  const entities = isSectionBased ? sections : stations;

  // Garantizar que siempre haya al menos una entidad virtual para demostración si el array viene vacío
  const activeEntities = useMemo(() => {
    if (entities && entities.length > 0) return entities;
    
    // Entidades por defecto de demostración
    if (isSectionBased) {
      return [
        { id: 'tramo-virtual-1', nombre: 'Tramo Homogéneo TH-01 (Demostración)', tipo: 'tramo', coordenadas: '-12.04637,-76.94236' },
        { id: 'tramo-virtual-2', nombre: 'Tramo Homogéneo TH-02 (Demostración)', tipo: 'tramo', coordenadas: '-12.05210,-76.92480' }
      ];
    } else {
      return [
        { id: 'estacion-virtual-1', nombre: 'Estación de Control EC-01 (Demostración)', tipo: 'estacion', coordenadas: '-12.08472,-77.03153' },
        { id: 'estacion-virtual-2', nombre: 'Estación de Control EC-02 (Demostración)', tipo: 'estacion', coordenadas: '-12.12053,-77.02941' }
      ];
    }
  }, [entities, isSectionBased]);

  // Selección de entidad activa
  const [selectedEntityId, setSelectedEntityId] = useState('');

  // Sincronizar el selector cuando cambie la pestaña o las entidades cargadas
  useEffect(() => {
    if (activeEntities.length > 0) {
      setSelectedEntityId(String(activeEntities[0].id));
    }
  }, [activeSubTab, activeEntities]);

  const selectedEntity = useMemo(() => {
    return activeEntities.find((e) => String(e.id) === String(selectedEntityId)) || activeEntities[0] || null;
  }, [activeEntities, selectedEntityId]);

  // Obtener datos detallados del estudio para la entidad seleccionada
  const trafficData = useMemo(() => {
    if (!selectedEntity) return { isRealData: false };
    
    // Si hay data real extraída del Excel
    if (extractedTrafficData && extractedTrafficData[selectedEntity.id]) {
      const realData = extractedTrafficData[selectedEntity.id];
      
      // Filtro de Calidad QA/QC: Solo consumimos la data si está "approved"
      const currentStatus = realData.moduleStatus?.[moduleKey] || 'pending';
      if (currentStatus !== 'approved') {
        return { isRealData: false, qaStatus: currentStatus };
      }
      
      if (activeSubTab === 'conteo_vehicular' && realData.hourlyLabels) {
        const hourlyVariation = realData.hourlyLabels.map((label, idx) => ({
           hora: label,
           Total: realData.hourlyData[idx] || 0
        }));
        
        const vehicleClassification = realData.classificationLabels.map((label, idx) => ({
           name: label,
           value: realData.classificationData[idx] || 0
        })).filter(item => item.value > 0);
        
        const imda = realData.classificationData.reduce((a, b) => a + b, 0);
        
        const sortedClass = [...vehicleClassification].sort((a,b) => b.value - a.value);
        const dominantVehicle = sortedClass.length > 0 ? sortedClass[0].name : 'N/A';

        const dailyVariation = realData.dailyLabels.map((label, idx) => ({
           dia: label,
           Total: realData.dailyData[idx] || 0
        }));

        return {
           imda: Math.round(imda),
           dominantVehicle,
           hourlyVariation,
           vehicleClassification,
           dailyVariation,
           isRealData: true
        };
      }

      if (activeSubTab === 'encuesta_origen_destino' && (realData.odLivianos || realData.odPesados || realData.odPairs)) {
        // Función para limpiar datos OD (redondear decimales, filtrar orígenes/destinos inválidos)
        const cleanODData = (odData) => {
          if (!odData || !odData.data || !odData.origins) return null;
          
          // Filtrar orígenes que sean números (porcentajes escapados como 0.133...)
          const validOrigins = odData.origins.filter(o => {
            if (typeof o === 'number') return false;
            const num = Number(o);
            return isNaN(num) || o === '';
          });
          
          // Limpiar los datos: redondear valores, eliminar destinos genéricos
          const cleanedData = odData.data
            .filter(dest => {
              if (/^Destino \d+$/i.test(dest.name)) return false;
              const nameUpper = (dest.name || '').toUpperCase();
              if (nameUpper.includes('PARTICIPACI') || nameUpper === 'TOTAL' || nameUpper === 'TOTALES' || nameUpper.includes('%')) return false;
              return true;
            })
            .map(dest => {
              const cleaned = { name: dest.name };
              // Tomar TODOS los keys del destino que no sean 'name' y que correspondan a orígenes válidos
              const allKeys = Object.keys(dest).filter(k => k !== 'name');
              allKeys.forEach(key => {
                // Solo incluir si el key es un origen válido (string no numérico)
                if (validOrigins.includes(key)) {
                  const rounded = Math.round(Number(dest[key]));
                  if (rounded > 0) {
                    cleaned[key] = rounded;
                  }
                }
              });
              return cleaned;
            })
            .filter(dest => {
              return Object.keys(dest).some(k => k !== 'name' && dest[k] > 0);
            });
          
          if (cleanedData.length === 0) return null;
          return { data: cleanedData, origins: validOrigins.filter(o => 
            cleanedData.some(d => d[o] !== undefined && d[o] > 0)
          )};
        };
        
        const cleanedLiv = cleanODData(realData.odLivianos);
        const cleanedPes = cleanODData(realData.odPesados);
        
        // Si después de limpiar no hay datos válidos, marcar como sin datos para mostrar botón de subir
        if (!cleanedLiv && !cleanedPes) {
          return { isRealData: false, qaStatus: 'missing', needsReupload: true };
        }
        
        return {
          odLivianos: cleanedLiv,
          odPesados: cleanedPes,
          isRealData: true
        };
      }

      if (activeSubTab === 'encuesta_velocidad' && realData.speedDistribution) {
        return {
          speedDistribution: realData.speedDistribution,
          speedStats: realData.speedStats,
          isRealData: true
        };
      }

      if (activeSubTab === 'censo_de_cargas' && (realData.cargasCE2 || realData.cargasCE3)) {
        return {
          cargasCE2: realData.cargasCE2 || [],
          cargasCE3: realData.cargasCE3 || [],
          isRealData: true
        };
      }

      if (activeSubTab === 'ejes_equivalentes' && realData.ejesEquivalentes) {
        return {
          esalsProjection: [
             { year: 2024, projectedEsals: 1200000 },
             { year: 2029, projectedEsals: 1500000 },
             { year: 2034, projectedEsals: 2100000 },
             { year: 2044, projectedEsals: 3500000 },
          ],
          ejesTableData: realData.ejesEquivalentes.tableData,
          ejesEquivalentes: realData.ejesEquivalentes,
          isRealData: true
        };
      }
    }

    // Si no hay data real extraída, enviamos objeto vacío
    return { isRealData: false, qaStatus: 'missing' };
  }, [extractedTrafficData, selectedEntity, activeSubTab, moduleKey]);

  if (!selectedEntity || !trafficData) {
    return (
      <div className="traffic-v2-grid single">
        <section className="traffic-v2-panel">
          <div className="traffic-v2-empty-state">No hay datos disponibles para emitir reportes.</div>
        </section>
      </div>
    );
  }

  // Renderizado dinámico de gráficos según la subpestaña activa
  const renderCurrentView = () => {
    if (!trafficData) return null;
    
    if (!trafficData.isRealData) {
      const isRejected = trafficData.qaStatus === 'rejected';
      const isPending = trafficData.qaStatus === 'pending';

      return (
        <div className="traffic-v2-grid-sub">
          <div className="traffic-v2-chart-card traffic-v2-span-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', backgroundColor: isRejected ? '#fef2f2' : isPending ? '#fefce8' : '#f8fafc', border: `2px dashed ${isRejected ? '#fca5a5' : isPending ? '#fde047' : '#cbd5e1'}` }}>
             <i className={isRejected ? "fas fa-times-circle" : isPending ? "fas fa-clock" : "fas fa-file-excel"} style={{ fontSize: '48px', color: isRejected ? '#ef4444' : isPending ? '#eab308' : '#94a3b8', marginBottom: '16px' }}></i>
             <h4 style={{ color: isRejected ? '#991b1b' : isPending ? '#854d0e' : '#475569', margin: '0 0 8px 0' }}>
               {isRejected ? 'Datos Rechazados' : isPending ? 'Pendiente de Aprobación' : 'Sin datos extraídos'}
             </h4>
             <p style={{ color: isRejected ? '#b91c1c' : isPending ? '#a16207' : '#64748b', textAlign: 'center', maxWidth: '400px' }}>
               {isRejected 
                 ? `El Excel de ${titleMap[activeSubTab]} tiene errores detectados y fue rechazado. No se puede generar el reporte hasta que se corrija.` 
                 : isPending 
                 ? `Los datos de ${titleMap[activeSubTab]} han sido extraídos pero están a la espera de la revisión del Coordinador.`
                 : `Sube el archivo Excel oficial de tráfico usando el botón superior para visualizar los gráficos de ${titleMap[activeSubTab]}.`}
             </p>
          </div>
        </div>
      );
    }

    switch (activeSubTab) {
      case 'conteo_vehicular':
        return (
          <>
            <div className="traffic-v2-grid-sub">
              {/* Gráfico 1: Variación Horaria */}
              <div className="traffic-v2-chart-card traffic-v2-span-7">
                <div className="chart-header">
                  <h4>Variación Horaria del Tráfico</h4>
                  <p>Volumen de vehículos agrupados por tipo durante un día típico de 24 horas.</p>
                </div>
                <div className="chart-container" style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <AreaChart data={trafficData.hourlyVariation} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLigeros" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="hora" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Area type="monotone" dataKey="Total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLigeros)" name="Total Vehículos (Excel)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico 2: Composición del Tráfico */}
              <div className="traffic-v2-chart-card traffic-v2-span-5">
                <div className="chart-header">
                  <h4>Clasificación Vehicular</h4>
                  <p>Porcentaje de participación por tipo de vehículo del IMDa.</p>
                </div>
                <div className="chart-container" style={{ width: '100%', minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={trafficData.vehicleClassification}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {trafficData.vehicleClassification.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} veh/día`, 'Cantidad']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="traffic-v2-pie-legend">
                    {trafficData.vehicleClassification.map((item, index) => (
                      <div key={item.name} className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="legend-label">{item.name} ({((item.value / trafficData.imda) * 100).toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gráfico 3: Tráfico Diario */}
              <div className="traffic-v2-chart-card traffic-v2-span-full" style={{ marginTop: '22px' }}>
                <div className="chart-header">
                  <h4>Tráfico Diario (Semana Representativa)</h4>
                  <p>Volumen total de vehículos por cada día de la semana según el conteo extraído del Excel.</p>
                </div>
                <div className="chart-container" style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={trafficData.dailyVariation} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="dia" tick={{ fill: '#94a3b8' }} />
                      <YAxis tick={{ fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Total" fill="#8b5cf6" name="Total Vehículos" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        );

      case 'encuesta_origen_destino':
        const COLORS_OD = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
        
        const renderCustomBarLabel = (props) => {
          const { x, y, width, height, payload, dataKey } = props;
          
          // Extraemos el valor real desde el payload usando el dataKey (el nombre del origen)
          const val = payload && dataKey ? payload[dataKey] : 0;
          
          if (!val || val <= 0) return null;
          
          return (
            <text x={x + width / 2} y={y + height / 2} fill="#000" fontSize={11} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
              {val}
            </text>
          );
        };

        return (
          <div className="traffic-v2-grid-sub">
            {trafficData.odLivianos && trafficData.odLivianos.data.length > 0 && (
              <div className="traffic-v2-chart-card traffic-v2-span-full">
                <div className="chart-header" style={{ textAlign: 'center' }}>
                  <h4 style={{ textTransform: 'uppercase' }}>Comparación de Orígenes y Destino en la Estación {selectedEntity ? selectedEntity.id.replace('E-', '') : ''} - Vehículos Livianos</h4>
                </div>
                <div className="chart-container" style={{ width: '100%', height: Math.max(400, trafficData.odLivianos.data.length * 40) }}>
                  <ResponsiveContainer>
                    <BarChart data={trafficData.odLivianos.data} margin={{ top: 20, right: 30, left: 100, bottom: 20 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" tick={{ fill: '#94a3b8' }} allowDecimals={false} label={{ value: 'Conteo de Vehículos', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} label={{ value: 'Destino (Rutas)', angle: -90, position: 'insideLeft', offset: -100, fill: '#64748b', fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      {trafficData.odLivianos.origins.map((origen, idx) => (
                        <Bar key={origen} dataKey={origen} stackId="a" fill={COLORS_OD[idx % COLORS_OD.length]}
                          label={renderCustomBarLabel} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {trafficData.odPesados && trafficData.odPesados.data.length > 0 && (
              <div className="traffic-v2-chart-card traffic-v2-span-full" style={{ marginTop: '20px' }}>
                <div className="chart-header" style={{ textAlign: 'center' }}>
                  <h4 style={{ textTransform: 'uppercase' }}>Comparación de Orígenes y Destinos Estación {selectedEntity ? selectedEntity.id.replace('E-', '') : ''} Vehículos Pesados</h4>
                </div>
                <div className="chart-container" style={{ width: '100%', height: Math.max(400, trafficData.odPesados.data.length * 40) }}>
                  <ResponsiveContainer>
                    <BarChart data={trafficData.odPesados.data} margin={{ top: 20, right: 30, left: 100, bottom: 20 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" tick={{ fill: '#94a3b8' }} allowDecimals={false} label={{ value: 'Conteo de Vehículos', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={130} label={{ value: 'Origen', angle: -90, position: 'insideLeft', offset: -100, fill: '#64748b', fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      {trafficData.odPesados.origins.map((origen, idx) => (
                        <Bar key={origen} dataKey={origen} stackId="a" fill={COLORS_OD[(idx + 8) % COLORS_OD.length]}
                          label={renderCustomBarLabel} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        );

      case 'censo_de_cargas':
        const dataCE2 = trafficData.cargasCE2 || [];
        const dataCE3 = trafficData.cargasCE3 || [];
        return (
          <div className="traffic-v2-grid-sub">
            {dataCE2.length > 0 && (
              <div className="traffic-v2-chart-card traffic-v2-span-8">
                <div className="chart-header">
                  <h4>Cantidades por Producto (Camión CE2 / E-2)</h4>
                  <p>Frecuencia absoluta de productos transportados por vehículos de 2 ejes.</p>
                </div>
                <div className="chart-container" style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={dataCE2} margin={{ top: 20, right: 30, left: 20, bottom: 90 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-45} textAnchor="end" />
                      <YAxis tick={{ fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {dataCE3.length > 0 && (
              <div className="traffic-v2-chart-card traffic-v2-span-8">
                <div className="chart-header">
                  <h4>Cantidades por Producto (Camión CE3 / E-3)</h4>
                  <p>Frecuencia absoluta de productos transportados por vehículos de 3 ejes.</p>
                </div>
                <div className="chart-container" style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={dataCE3} margin={{ top: 20, right: 30, left: 20, bottom: 90 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-45} textAnchor="end" />
                      <YAxis tick={{ fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        );

      case 'encuesta_velocidad':
        return (
          <div className="traffic-v2-grid-sub">
            <div className="traffic-v2-chart-card traffic-v2-span-8">
              <div className="chart-header">
                <h4>Distribución Porcentual de Velocidad</h4>
                <p>Distribución de vehículos por rangos de velocidad (km/h).</p>
              </div>
              <div className="chart-container" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={trafficData.speedDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="vehiculos" nameKey="rango" labelLine={false}>
                      {trafficData.speedDistribution && trafficData.speedDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="traffic-v2-chart-card traffic-v2-span-4">
              <div className="chart-header">
                <h4>Velocidades de Operación</h4>
              </div>
              <div className="traffic-v2-speed-kpis">
                <div className="speed-kpi-item">
                  <span>Velocidad de Diseño del Tramo</span>
                  <strong>{trafficData.speedStats.vDiseno} km/h</strong>
                </div>
                <div className="speed-kpi-item highlight">
                  <span>Velocidad Percentil 85 (V85)</span>
                  <strong>{trafficData.speedStats.v85} km/h</strong>
                </div>
              </div>
            </div>
          </div>
        );

      case 'ejes_equivalentes':
        return (
          <div className="traffic-v2-grid-sub">
            <div className="traffic-v2-chart-card traffic-v2-span-full" style={{ padding: '20px', overflowX: 'auto' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h4>Cálculo de Ejes Equivalentes</h4>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                <tbody>
                  {trafficData.ejesTableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} style={{ border: '1px solid #cbd5e1', padding: '4px 6px' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getObservationText = () => {
    if (!trafficData || !trafficData.isRealData) return 'Sube un archivo Excel de Tráfico para generar las observaciones de ingeniería automáticamente.';
    switch (activeSubTab) {
      case 'conteo_vehicular':
        return `El control ${selectedEntity.nombre || selectedEntity.id} presenta un IMDa calculado de ${trafficData.imda} vehículos por día. La composición principal está liderada por la categoría ${trafficData.dominantVehicle}.`;
      case 'encuesta_origen_destino':
        const topOD = trafficData.odPairs && trafficData.odPairs.length > 0 ? trafficData.odPairs[0].pair : 'N/A';
        return `La dinámica de viajes de la zona está dominada por el par Origen-Destino "${topOD}". Esto confirma la dependencia económica y logística entre dichos centros poblados/urbanos a través de este corredor.`;
      case 'censo_de_cargas':
        return `Las mediciones del censo de cargas de la entidad ${selectedEntity.nombre || selectedEntity.id} han sido extraídas correctamente. Revisa la distribución de productos para identificar las principales materias primas o manufacturas transportadas en la zona.`;
      case 'encuesta_velocidad':
        if (trafficData.speedStats) {
           return `El tramo en análisis ${selectedEntity.nombre || selectedEntity.id} cuenta con una velocidad de diseño de ${trafficData.speedStats.vDiseno} km/h. La velocidad del percentil 85 (V85) se midió en ${trafficData.speedStats.v85} km/h. ${trafficData.speedStats.v85 > trafficData.speedStats.vDiseno ? 'Se requiere implementar reductores de velocidad o señalización adicional debido a que los conductores circulan por encima de la velocidad de diseño seguro.' : 'Las velocidades observadas demuestran un comportamiento de conducción conforme al diseño geométrico.'}`;
        }
        return `Datos de velocidad extraídos correctamente para ${selectedEntity.nombre || selectedEntity.id}.`;
      case 'ejes_equivalentes':
        return `Los cálculos de ejes equivalentes (ESALs) para el tramo ${selectedEntity.nombre || selectedEntity.id} han sido extraídos. Este parámetro servirá de base directa para el diseño estructural de pavimentos de la vía.`;
      default:
        return 'No hay observaciones automáticas registradas para este módulo.';
    }
  };

  const titleMap = {
    conteo_vehicular: 'Conteo Vehicular',
    encuesta_origen_destino: 'Encuesta de Origen/Destino',
    censo_de_cargas: 'Censo de Cargas',
    encuesta_velocidad: 'Encuesta de velocidad',
    ejes_equivalentes: 'Ejes Equivalentes'
  };

  return (
    <div className="traffic-v2-grid-sub-parent">
      {/* Barra de Controles y Selector de Entidad */}
      <div className="traffic-v2-report-toolbar">
        <div className="toolbar-left">
          <label htmlFor="entity-selector" className="toolbar-label">
            {isSectionBased ? 'Seleccionar Tramo:' : 'Seleccionar Estación:'}
          </label>
          <select
            id="entity-selector"
            className="traffic-v2-select"
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
          >
            {activeEntities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.nombre || entity.id}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-right">
          <button
            type="button"
            className="traffic-v2-action-btn"
            onClick={() => window.print()}
            title="Exportar reporte limpio en PDF"
          >
            <i className="fas fa-file-pdf" style={{ marginRight: '6px' }} />
            Imprimir Reporte
          </button>
        </div>
      </div>

      <div className="traffic-v2-grid report">
        {/* Panel Izquierdo: Ficha Ejecutiva y Observaciones */}
        <section className={`traffic-v2-panel ${activeSubTab === 'encuesta_origen_destino' ? 'traffic-v2-span-12' : 'traffic-v2-span-5'}`} style={{ display: 'flex', flexDirection: activeSubTab === 'encuesta_origen_destino' ? 'row' : 'column', flexWrap: 'wrap', gap: '20px' }}>
          <div className="traffic-v2-panel-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '4px', width: '100%', flexBasis: '100%' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', color: '#1e293b', margin: '0 0 4px 0' }}>
                <i className="fas fa-clipboard-list" style={{ color: '#3b82f6' }}></i>
                Consolidado Ejecutivo
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Ficha de resumen del {titleMap[activeSubTab]} para la entidad seleccionada.</p>
            </div>
            {trafficData.isRealData ? (
              <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #bbf7d0' }}>
                <i className="fas fa-check-circle" /> Validado (QA/QC)
              </span>
            ) : trafficData.qaStatus === 'rejected' ? (
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #fecaca' }}>
                <i className="fas fa-times-circle" /> Rechazado
              </span>
            ) : trafficData.qaStatus === 'pending' ? (
              <span style={{ background: '#fefce8', color: '#854d0e', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #fef08a' }}>
                <i className="fas fa-clock" /> Pendiente
              </span>
            ) : (
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #e2e8f0' }}>
                <i className="fas fa-exclamation-triangle" /> Sin Excel
              </span>
            )}
          </div>

          <div className="traffic-v2-kpi-grid" style={{ gridTemplateColumns: activeSubTab === 'encuesta_origen_destino' ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap: '12px', flexGrow: 1, minWidth: '300px' }}>
            <div className="traffic-v2-kpi-card" style={{ padding: '16px', background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderLeft: '4px solid #3b82f6' }}>
              <span className="traffic-v2-kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-map-marker-alt" style={{ color: '#3b82f6' }}></i> Entidad Seleccionada
              </span>
              <strong className="traffic-v2-kpi-value" style={{ fontSize: '1.1rem', marginTop: '6px' }}>{selectedEntity.nombre || selectedEntity.id}</strong>
              <span className="traffic-v2-kpi-hint" style={{ marginTop: '4px' }}>Coordenadas: {selectedEntity.coordenadas || 'N/A'}</span>
            </div>

            <div className="traffic-v2-kpi-card" style={{ padding: '16px' }}>
              <span className="traffic-v2-kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-chart-line" style={{ color: '#8b5cf6' }}></i> 
                {activeSubTab === 'conteo_vehicular' ? 'IMDa Estimado' : 
                 activeSubTab === 'encuesta_velocidad' ? 'V85 Registrada' :
                 activeSubTab === 'ejes_equivalentes' ? 'Ejes de Diseño' :
                 'Indicador Principal'}
              </span>
              <strong className="traffic-v2-kpi-value" style={{ fontSize: '1.4rem', color: '#1e293b', marginTop: '6px' }}>
                {trafficData.isRealData ? (
                   activeSubTab === 'conteo_vehicular' ? `${trafficData.imda} veh/día` :
                   activeSubTab === 'encuesta_velocidad' ? `${trafficData.speedStats?.v85 || '-'} km/h` :
                   activeSubTab === 'ejes_equivalentes' ? `Procesado` :
                   'Disponible'
                ) : <span style={{ color: '#94a3b8', fontSize: '1.1rem' }}>No calculado</span>}
              </strong>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <div className="traffic-v2-kpi-card" style={{ padding: '14px 12px' }}>
                 <span className="traffic-v2-kpi-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}><i className="fas fa-file-excel" style={{ color: '#10b981' }}></i> Archivos Base</span>
                 <strong className="traffic-v2-kpi-value" style={{ fontSize: '1rem' }}>{trafficData.isRealData ? '1 oficial' : '0 archivos'}</strong>
               </div>
               <div className="traffic-v2-kpi-card" style={{ padding: '14px 12px' }}>
                 <span className="traffic-v2-kpi-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}><i className="fas fa-clock" style={{ color: '#f59e0b' }}></i> Actualización</span>
                 <strong className="traffic-v2-kpi-value" style={{ fontSize: '0.9rem' }}>{trafficData.isRealData ? formatDate(new Date()) : '-'}</strong>
               </div>
            </div>
          </div>

          <div className="traffic-v2-observation-box" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
            <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
               <i className="fas fa-robot" style={{ color: '#6366f1' }}></i> 
               Observaciones de Ingeniería
            </h5>
            <p style={{ lineHeight: '1.6', color: '#475569', fontSize: '0.9rem' }}>{getObservationText()}</p>
            
            {!trafficData.isRealData && (
               <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', justifyContent: 'center' }}>
                 <button 
                   className="traffic-v2-btn primary"
                   onClick={() => setIsUploadModalOpen(true)}
                   style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
                 >
                   <i className="fas fa-upload" style={{ marginRight: '8px' }} />
                   Subir Excel de Campo
                 </button>
               </div>
            )}
          </div>
        </section>

        {/* Panel Derecho: Visualización Gráfica */}
        <section className={`traffic-v2-panel ${activeSubTab === 'encuesta_origen_destino' ? 'traffic-v2-span-12' : 'traffic-v2-span-7'}`}>
          <div className="traffic-v2-panel-header">
            <div>
              <h3>Visualización de Datos</h3>
              <p>Gráficos interactivos construidos a partir de los datos consolidados.</p>
            </div>
          </div>
          <div className="traffic-v2-charts-wrapper">
            {renderCurrentView()}
          </div>
        </section>
      </div>

      <TrafficExcelUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        entityId={selectedEntity?.id}
        selectedEntity={selectedEntity}
        moduleConfig={moduleConfig}
        setExtractedTrafficData={setExtractedTrafficData}
      />
    </div>
  );
};

export default ReporteFinalV2;
