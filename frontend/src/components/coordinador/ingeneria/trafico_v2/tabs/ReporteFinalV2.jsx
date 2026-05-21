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

const ReporteFinalV2 = ({ activeSubTab, stations = [], sections = [] }) => {
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
    if (!selectedEntity) return null;
    return getMockTrafficData(selectedEntity.id, isSectionBased ? 'section' : 'station');
  }, [selectedEntity, isSectionBased]);

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
  const renderCharts = () => {
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
                        <linearGradient id="colorBuses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCamiones" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="hora" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Area type="monotone" dataKey="Ligeros" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLigeros)" name="Vehículos Ligeros" />
                      <Area type="monotone" dataKey="Buses" stroke="#10b981" fillOpacity={1} fill="url(#colorBuses)" name="Buses" />
                      <Area type="monotone" dataKey="Camiones" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCamiones)" name="Camiones de Carga" />
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
            </div>
          </>
        );

      case 'encuesta_origen_destino':
        return (
          <div className="traffic-v2-grid-sub">
            <div className="traffic-v2-chart-card traffic-v2-span-full">
              <div className="chart-header">
                <h4>Principales Flujos de Origen y Destino Vial</h4>
                <p>Distribución porcentual de los pares O-D de mayor tránsito captados en el estudio.</p>
              </div>
              <div className="chart-container" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={trafficData.odPairs} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fill: '#94a3b8' }} />
                    <YAxis dataKey="pair" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Pasajeros" fill="#3b82f6" name="Tránsito de Pasajeros (%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Carga" fill="#f59e0b" name="Tránsito de Carga (%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'censo_de_cargas':
        return (
          <div className="traffic-v2-grid-sub">
            <div className="traffic-v2-chart-card traffic-v2-span-full">
              <div className="chart-header">
                <h4>Espectro de Pesos por Eje vs Límite Legal MTC</h4>
                <p>Peso promedio medido por tipo de eje en el censo frente al límite de carga máxima autorizada.</p>
              </div>
              <div className="chart-container" style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer>
                  <BarChart data={trafficData.loadSpectrum} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="tipo" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis label={{ value: 'Peso (Toneladas)', angle: -90, position: 'insideLeft', fill: '#94a3b8', style: { textAnchor: 'middle' } }} tick={{ fill: '#94a3b8' }} />
                    <Tooltip formatter={(value) => `${value} TN`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Medido" fill="#ef4444" name="Peso Promedio Medido (TN)" radius={[4, 4, 0, 0]}>
                      {trafficData.loadSpectrum.map((entry, index) => {
                        const isOverloaded = entry.Medido > entry.Limite;
                        return <Cell key={`cell-${index}`} fill={isOverloaded ? '#ef4444' : '#10b981'} />;
                      })}
                    </Bar>
                    <Bar dataKey="Limite" fill="#64748b" name="Límite Legal MTC (TN)" radius={[4, 4, 0, 0]} opacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <span>🟢 Dentro del límite legal</span>
                <span>🔴 Eje sobrecargado (Riesgo estructural de pavimento)</span>
              </div>
            </div>
          </div>
        );

      case 'encuesta_velocidad':
        return (
          <div className="traffic-v2-grid-sub">
            {/* Gráfico de Histograma de Velocidades */}
            <div className="traffic-v2-chart-card traffic-v2-span-8">
              <div className="chart-header">
                <h4>Distribución General de Velocidades</h4>
                <p>Histograma de velocidad de vehículos y curva acumulada del tramo.</p>
              </div>
              <div className="chart-container" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <ComposedChart data={trafficData.speedDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="rango" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fill: '#94a3b8' }} label={{ value: 'Vehículos Medidos', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="vehiculos" fill="#8b5cf6" name="Número de Vehículos" radius={[4, 4, 0, 0]} />
                    <ReferenceLine yAxisId="left" x={trafficData.speedDistribution.find((s) => s.rango.includes(String(Math.floor(trafficData.speedStats.v85 / 10) * 10)))?.rango} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `V85 = ${trafficData.speedStats.v85} km/h`, fill: '#ef4444', position: 'top' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ficha técnica de velocidades */}
            <div className="traffic-v2-chart-card traffic-v2-span-4">
              <div className="chart-header">
                <h4>Velocidades de Operación</h4>
                <p>Estadísticos de diseño vial y control de velocidad en el tramo.</p>
              </div>
              <div className="traffic-v2-speed-kpis">
                <div className="speed-kpi-item">
                  <span>Velocidad de Diseño del Tramo</span>
                  <strong>{trafficData.speedStats.vDiseno} km/h</strong>
                </div>
                <div className="speed-kpi-item highlight">
                  <span>Velocidad Percentil 85 (V85)</span>
                  <strong>{trafficData.speedStats.v85} km/h</strong>
                  <small>Velocidad máxima segura de operación</small>
                </div>
                <div className="speed-kpi-item">
                  <span>Velocidad Media Operativa</span>
                  <strong>{trafficData.speedStats.vMedia} km/h</strong>
                </div>
              </div>
              <div className="traffic-v2-observation-box" style={{ fontSize: '11px', marginTop: '15px' }}>
                {trafficData.speedStats.v85 > trafficData.speedStats.vDiseno
                  ? '⚠️ Alerta: La velocidad del percentil 85 supera la velocidad de diseño del tramo. Se recomienda revisar señalización o geometría vial.'
                  : '✔️ Estado Óptimo: La velocidad operativa V85 está dentro del límite de diseño geométrico aprobado.'}
              </div>
            </div>
          </div>
        );

      case 'ejes_equivalentes':
        return (
          <div className="traffic-v2-grid-sub">
            <div className="traffic-v2-chart-card traffic-v2-span-full">
              <div className="chart-header">
                <h4>Proyección de Ejes Equivalentes Acumulados (ESALs)</h4>
                <p>Crecimiento acumulado en el carril de diseño para un horizonte de diseño de 20 años bajo tres escenarios.</p>
              </div>
              <div className="chart-container" style={{ width: '100%', height: 340 }}>
                <ResponsiveContainer>
                  <AreaChart data={trafficData.esalsProjection} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="año" tick={{ fill: '#94a3b8' }} />
                    <YAxis tickFormatter={formatNumber} tick={{ fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="Escenario Alto (5.5%)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} name="Alto (5.5% Crecimiento)" />
                    <Area type="monotone" dataKey="Escenario Medio (4.0%)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Medio (4.0% Crecimiento)" />
                    <Area type="monotone" dataKey="Escenario Bajo (2.5%)" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Bajo (2.5% Crecimiento)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="traffic-v2-empty-state">Seleccione un reporte temático.</div>;
    }
  };

  // Construcción del reporte ejecutivo automático
  const totalUploads = selectedEntity.imagenes ? selectedEntity.imagenes.length : 0;
  const lastUpload = selectedEntity.imagenes && selectedEntity.imagenes.length > 0 
    ? selectedEntity.imagenes[0].upload_date 
    : null;

  const getObservationText = () => {
    switch (activeSubTab) {
      case 'conteo_vehicular':
        return `La estación de control ${selectedEntity.nombre || selectedEntity.id} presenta un IMDa calculado de ${trafficData.imda} vehículos por día. La composición principal está liderada por vehículos ligeros con un ${((trafficData.vehicleClassification[0].value / trafficData.imda) * 100).toFixed(1)}%. Se registran picos de flujo de tráfico significativos a las 08:00 hrs y a las 18:00 hrs.`;
      case 'encuesta_origen_destino':
        return `Para la estación ${selectedEntity.nombre || selectedEntity.id}, el principal par de origen-destino detectado para el transporte de carga es el corredor ${trafficData.odPairs[0].pair} con un ${trafficData.odPairs[0].Carga}% del tráfico total de pesados, seguido por ${trafficData.odPairs[1].pair} (${trafficData.odPairs[1].Carga}%).`;
      case 'censo_de_cargas':
        const overloadedAxis = trafficData.loadSpectrum.filter((a) => a.Medido > a.Limite);
        if (overloadedAxis.length > 0) {
          return `⚠️ ALERTA DE CARGAS: Se ha detectado sobrecarga vehicular en el censo. Particularmente, el ${overloadedAxis.map(a => a.tipo).join(', ')} excede el límite legal del MTC (Medido: ${overloadedAxis.map(a => `${a.Medido} TN vs Límite ${a.Limite} TN`).join(', ')}). Esto acelerará el deterioro del pavimento en el tramo.`;
        }
        return `Las mediciones del censo de cargas de la estación ${selectedEntity.nombre || selectedEntity.id} indican que todos los conjuntos de ejes (simples, tándem y trídem) se encuentran operando dentro de los límites máximos permitidos por el MTC peruano.`;
      case 'encuesta_velocidad':
        return `El tramo en análisis ${selectedEntity.nombre || selectedEntity.id} cuenta con una velocidad de diseño de ${trafficData.speedStats.vDiseno} km/h. La velocidad del percentil 85 (V85) se midió en ${trafficData.speedStats.v85} km/h. ${trafficData.speedStats.v85 > trafficData.speedStats.vDiseno ? 'Se requiere implementar reductores de velocidad o señalización adicional debido a que los conductores circulan por encima de la velocidad de diseño seguro.' : 'Las velocidades observadas demuestran un comportamiento de conducción conforme al diseño geométrico.'}`;
      case 'ejes_equivalentes':
        const finalEsals = trafficData.esalsProjection[19]['Escenario Medio (4.0%)'];
        return `La proyección de ejes equivalentes acumulados (ESALs) para un periodo de diseño de 20 años en la estación ${selectedEntity.nombre || selectedEntity.id} estima un tráfico de diseño de ${formatNumber(finalEsals)} ejes equivalentes en el escenario de crecimiento del 4.0%. Este parámetro servirá de base directa para el diseño estructural de pavimentos de la vía.`;
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
        <section className="traffic-v2-panel traffic-v2-span-5">
          <div className="traffic-v2-panel-header">
            <div>
              <h3>Consolidado Ejecutivo</h3>
              <p>Ficha de resumen del {titleMap[activeSubTab]} para la entidad seleccionada.</p>
            </div>
          </div>

          <div className="traffic-v2-report-summary vertical">
            <article>
              <span>Entidad Seleccionada</span>
              <strong>{selectedEntity.nombre || selectedEntity.id}</strong>
            </article>
            <article>
              <span>IMDa Estimado</span>
              <strong>{trafficData.imda} veh/día</strong>
            </article>
            <article>
              <span>Archivos en Registro</span>
              <strong>{totalUploads} evidencias</strong>
            </article>
            <article>
              <span>Última Actualización</span>
              <strong>{formatDate(lastUpload)}</strong>
            </article>
          </div>

          <div className="traffic-v2-observation-box">
            <h5>Observaciones de Ingeniería de Tránsito</h5>
            <p>{getObservationText()}</p>
          </div>
        </section>

        {/* Panel Derecho: Visualización Gráfica */}
        <section className="traffic-v2-panel traffic-v2-span-7">
          <div className="traffic-v2-panel-header">
            <div>
              <h3>Visualización de Datos</h3>
              <p>Gráficos interactivos construidos a partir de los datos consolidados.</p>
            </div>
          </div>
          <div className="traffic-v2-charts-wrapper">
            {renderCharts()}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReporteFinalV2;
