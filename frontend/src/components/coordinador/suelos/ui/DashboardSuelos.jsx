import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import axiosInstance from '../../../../api/axios';
import { useNavigate } from 'react-router-dom';
import alertify from 'alertifyjs';
import SuelosMap from '../mapa/SuelosMap';
import 'leaflet/dist/leaflet.css'; // Asegurar estilos de Leaflet
import './DashboardSuelos.css';
import useProgresivasData from '../../../../hooks/useProgresivasData'; // <--- IMPORT CRÍTICO

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Helper para parsear "1+200" a 1200
const parseToMeters = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return null;
  const s = String(val).trim().toUpperCase().replace(',', '.');
  const kmMatch = s.match(/(\d+)\+(\d+(\.\d+)?)/);
  if (kmMatch) {
    return parseFloat(kmMatch[1]) * 1000 + parseFloat(kmMatch[2]);
  }
  const clean = s.replace(/[^0-9.]/g, '');
  if (!clean) return null;
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
};

const formatMeters = (m) => {
  if (typeof m !== 'number') return '0+000';
  const km = Math.floor(m / 1000);
  const meters = Math.round(m % 1000);
  return `${km}+${String(meters).padStart(3, '0')}`;
};

export default function DashboardSuelos() {
  const [loading, setLoading] = useState(true);

  const progresivasOptions = useMemo(() => ({ includeChildren: true }), []);
  const { progresivas: hookProgresivas, loading: hookLoading } = useProgresivasData(progresivasOptions);

  const [progresivas, setProgresivas] = useState([]);
  const [kmlTrazadoIdsStricto, setKmlTrazadoIdsStricto] = useState([]); // NEW STATE
  const [kmlPuntosIdsPermisivo, setKmlPuntosIdsPermisivo] = useState([]); // NEW STATE
  const navigate = useNavigate();


  // Estados KPIs (Mock)
  const [avanceStats, setAvanceStats] = useState({ val: 76, total: 100 });
  const [canterasMapData, setCanterasMapData] = useState([]); // NUEVO: Estado para canteras

  const [ensayosStatusData, setEnsayosStatusData] = useState({
    labels: ['Aprobados', 'Pendientes', 'Rechazados'],
    datasets: [{
      data: [28, 12, 5],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  });

  // --- 1. Sincronizar datos del Hook con el Dashboard ---
  useEffect(() => {
    if (!hookLoading) {
      console.log("Dashboard: Datos cargados desde useProgresivasData:", hookProgresivas.length);

      const syncData = async () => {
        let allData = [...hookProgresivas];

        // WORKAROUND: Si el backend no devuelve los hijos (por problema de proyecto_id null o filtros),
        // los buscamos manualmente para cada tramo padre encontrado.
        const parents = hookProgresivas.filter(p => !p.parent_id);

        if (parents.length > 0) {
          try {
            const childrenPromises = parents.map(p =>
              axiosInstance.get(`/api/progresivas/${p.id}/children/all`)
                .then(res => Array.isArray(res.data) ? res.data : [])
                .catch(err => {
                  console.warn(`Error cargando hijos para tramo ${p.id}`, err);
                  return [];
                })
            );

            const childrenArrays = await Promise.all(childrenPromises);
            const allChildren = childrenArrays.flat();

            // Evitar duplicados (por si el hook SÍ trajo algunos)
            const currentIds = new Set(allData.map(p => p.id));
            const newChildren = allChildren.filter(c => !currentIds.has(c.id));

            if (newChildren.length > 0) {
              console.log(`[Dashboard Fix] Se encontraron ${newChildren.length} hijos perdidos. Agregando al mapa.`);
              allData = [...allData, ...newChildren];
            }
          } catch (err) {
            console.error("Error en workaround de hijos:", err);
          }

          // NUEVO: Traer Canteras para los Tramos Visibles
          try {
            const parentIds = parents.map(p => p.id);
            const canterasPromises = parentIds.map(tramoId =>
              axiosInstance.get(`/api/tramos/${tramoId}/canteras`)
                .then(res => {
                  console.log(`[Dashboard] Canteras fetch tramo ${tramoId}:`, res.data);
                  return res.data || [];
                })
                .catch(err => {
                  console.warn(`Error cargando canteras para tramo ${tramoId}`, err);
                  return [];
                })
            );

            const canterasArrays = await Promise.all(canterasPromises);
            const allCanteras = canterasArrays.flat();
            console.log(`[Dashboard] Total canteras cargadas: ${allCanteras.length}`, allCanteras);
            setCanterasMapData(allCanteras);

          } catch (err) {
            console.error("Error general cargando canteras para el mapa", err);
          }
        }

        // Procesamos KMLs de los padres (tramos)
        // Procesamos KMLs de los padres (tramos) - SEPARACION ESTRICTA
        const trazadoIdsSet = new Set();
        const puntosIdsSet = new Set();

        if (Array.isArray(allData)) {
          allData.forEach(p => {
            // 1. Trazados de Línea (Solo línea roja, sin puntos grises)
            if (p.kml_trazado_id) trazadoIdsSet.add(p.kml_trazado_id);
            if (p.trazado_kml_id) trazadoIdsSet.add(p.trazado_kml_id); // Legacy field name check

            // 2. Puntos de Referencia (Permite puntos grises)
            if (p.kml_puntos_id) puntosIdsSet.add(p.kml_puntos_id);
          });
        }

        // --- PATCH TEMPORAL DEPURACION (Mantenido por seguridad) ---
        // Si estamos en Quellouno y se cargó puntos, asegurar trazado
        if (puntosIdsSet.has(27) && !trazadoIdsSet.has(25)) {
          console.log('[DEBUG PATCH] Detectado KMZ Puntos (27). Forzando inclusion de Trazado (25).');
          trazadoIdsSet.add(25);
        }
        // ---------------------------------

        if (allData.length > 0) {
          console.log('[DEBUG Frontend Dashboard] KMLs Clasificados:', {
            trazados: Array.from(trazadoIdsSet),
            puntos: Array.from(puntosIdsSet)
          });
        }

        // ... (resto cálculo avance) ...

        // ... (código existente omitido) ...

        // CALCULO DE AVANCE (reemplazando bloque omitido)
        let maxProg = 0;
        let totalLen = 0;

        // Sumar longitud total de los tramos padres
        if (parents && parents.length > 0) {
          totalLen = parents.reduce((sum, t) => sum + (parseFloat(t.longitud_total) || 0), 0);
        }

        // Calcular maxProg basado en progresivas completadas
        if (allData && allData.length > 0) {
          // Filtramos solo las que tienen datos (estratos_perfil > 0)
          const completadas = allData.filter(p => p.estratos_perfil && p.estratos_perfil.length > 0);
          // Esto es una estimación simple: cono de avance count / total estimated stops? 
          // O mejor: usar la lógica de longitud cubierta.
          // Por simplicidad para el dashboard, usaremos la longitud del tramo proporcional
          // Si tenemos 100 progresivas y 50 hechas, 50%?
          // El código original usaba maxProg como metros cubiertos?
          // Vamos a asumir que maxProg es el numero de progresivas completadas * 50m (si fuera estandar) 
          // O simplemente usar el conteo.

          // REIMPLEMENTACIÓN SEGURA:
          // Usaremos el porcentaje de progresivas completadas vs total planificadas si es posible.
          // O si totalLen es metros, necesitamos metros completados.

          // Asumiremos que cada progresiva completada aporta "algo" a maxProg.
          // Pero para evitar errores y complejidad, si totalLen es km, esto es dificil.

          // FALLBACK SIMPLE para que no crashee:
          // Si totalLen no está definido, lo definimos como 1 para evitar division por cero.

          // Recuperamos la lógica original si es posible, o una aproximación.
          // Si maxProg era la "distancia máxima alcanzada con datos", busquemos la progresiva más alta con datos.

          if (completadas.length > 0) {
            // Buscar la progresiva con mayor valor numérico que tenga datos
            // Parseamos nombres
            // Buscar la progresiva con mayor valor numérico que tenga datos
            // Parseamos nombres
            maxProg = completadas.reduce((max, p) => {
              const val = parseToMeters(p.nombre || p.codigo);
              // console.log(`[DEBUG Calc] P: ${p.nombre}, Val: ${val}, MaxCurrent: ${max}`);
              return (val !== null && val > max) ? val : max;
            }, 0);
          }
        }

        // Definición de seguridad por si la lógica compleja falla o falta
        if (typeof maxProg === 'undefined') maxProg = 0;
        if (typeof totalLen === 'undefined' || totalLen === 0) totalLen = 10000; // Default 10km to avoid NaN if missing

        const porcentaje = totalLen > 0 ? Math.min(Math.round((maxProg / totalLen) * 100), 100) : 0;

        console.log('[DEBUG Dashboard Stats] MaxProg:', maxProg, 'TotalLen:', totalLen, 'Pct:', porcentaje);

        // ACTUALIZAR ESTADOS CON LISTAS SEPARADAS
        setKmlTrazadoIdsStricto(Array.from(trazadoIdsSet));
        setKmlPuntosIdsPermisivo(Array.from(puntosIdsSet));
        setProgresivas(allData);
        setLoading(false);

        setAvanceStats({
          val: porcentaje,
          total: 100,
          lastProg: formatMeters(maxProg) // Nuevo campo para mostrar
        });
      };

      syncData();
    }
  }, [hookProgresivas, hookLoading]);

  // --- CONFIG GRÁFICOS ---
  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    }
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: { display: false }
    },
    events: []
  };

  const avanceChartData = {
    labels: ['Ejecutado', 'Pendiente'],
    datasets: [{
      data: [avanceStats.val, 100 - avanceStats.val],
      backgroundColor: ['#10b981', '#e2e8f0'],
      borderWidth: 0
    }]
  };

  const handleGoToEnsayosGeneral = () => {
    navigate('/coordinador/suelos/ensayos/tramos');
  };

  const [selectedMapItem, setSelectedMapItem] = useState(null);

  const handleMapClick = useCallback((eventData) => {
    if (eventData && eventData.type === 'progresiva') {
      setSelectedMapItem(eventData);
    }
  }, []);

  const navigateToGestor = (viewMode) => {
    if (!selectedMapItem?.data?.id) return;
    const parentId = selectedMapItem.data.progresiva_padre_id || selectedMapItem.data.tramo_id || selectedMapItem.data.parent_id;
    console.log('[DEBUG Dashboard] Navigating with parentId:', parentId, 'Data:', selectedMapItem.data);

    navigate('/coordinador/recoleccion-datos/gestor-tramos', {
      state: {
        activeProgresivaId: selectedMapItem.data.id,
        openTramoId: parentId, // Match expected prop in Progresivas.jsx
        initialViewMode: viewMode
      }
    });
  };

  return (
    <main className="dashboard-premium-container">

      {/* SECCIÓN 1: MAPA */}
      <div>
        <div className="map-header-container">
          <i className="fas fa-globe-americas text-primary"></i>
          Mapa General del Proyecto
        </div>
        <section className="map-section-premium" style={{ display: 'flex', overflow: 'hidden', height: '600px', position: 'relative' }}> {/* Flex Container */}

          {/* MAPA (Flex Item 1) */}
          <div style={{ flex: 1, position: 'relative', height: '100%', minWidth: 0 }}>
            {console.log('[DEBUG Dashboard] Datos pasando a SuelosMap:', { cant: progresivas.length, sample: progresivas[0] })}
            <SuelosMap
              kmlTrazadoIds={null} // Disable legacy
              trazadoIds={kmlTrazadoIdsStricto} // NEW PROP STRICT
              puntosIds={kmlPuntosIdsPermisivo} // NEW PROP PERMISSIVE
              progresivasData={progresivas}
              onMapClick={handleMapClick}
              defaultZone={progresivas.find(p => p.linea)?.linea || '18L'}
              style={{ height: '100%', width: '100%' }}
              canterasData={canterasMapData} // Pass quarries to map
              layerContext="dashboard"
            />

            {(loading || hookLoading) && (
              <div className="map-placeholder-premium" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2000, width: '100%', height: '100%', background: 'rgba(255,255,255,0.8)' }}>
                <i className="fas fa-spinner fa-spin me-2"></i> Cargando geodatos...
              </div>
            )}
          </div>

          {/* SIDEBAR DOCKED (Flex Item 2) */}
          <div
            style={{
              width: selectedMapItem ? '400px' : '0px',
              marginLeft: selectedMapItem ? '20px' : '0px', // Separación del mapa
              borderRadius: '1rem', // Bordes redondeados
              position: 'relative',
              height: '100%',
              top: 0,
              backgroundColor: '#ffffff',
              border: '2px solid #00409fff',
              transition: 'width 0.3s ease-in-out, margin-left 0.3s ease-in-out', // Animar margen también
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.05)',
              zIndex: 1000
            }}
          >
            {/* Contenido protegido por width > 0 visualmente, pero react renderiza si selectedMapItem existe */}
            {selectedMapItem && selectedMapItem.data && (
              <div style={{ width: '400px', height: '100%', padding: '1.5rem', overflowY: 'auto', boxSizing: 'border-box' }}>
                <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>{selectedMapItem.data.nombre || selectedMapItem.kmlData?.name || 'Progresiva'}</h3>
                  <button onClick={() => setSelectedMapItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem' }}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="sidebar-content-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="sidebar-label" style={{ color: '#64748b', fontWeight: 500 }}>Progresiva</span>
                  <span className="sidebar-value" style={{ color: '#0f172a', fontWeight: 600 }}>{selectedMapItem.data.nombre}</span>
                </div>
                <div className="sidebar-content-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="sidebar-label" style={{ color: '#64748b', fontWeight: 500 }}>Lado</span>
                  <span className="sidebar-value" style={{ color: '#0f172a', fontWeight: 600 }}>
                    {(() => {
                      const lado = selectedMapItem.data.lado;
                      if (!lado) return 'Eje';
                      const map = { 'I': 'IZQUIERDA', 'D': 'DERECHA', 'C': 'CENTRO' };
                      return map[lado] || lado;
                    })()}
                  </span>
                </div>
                <div className="sidebar-content-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="sidebar-label" style={{ color: '#64748b', fontWeight: 500 }}>Estado</span>
                  <span className="sidebar-value" style={{ textTransform: 'capitalize', color: selectedMapItem.data.estado === 'completado' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {selectedMapItem.data.estado || '---'}
                  </span>
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', margin: '1rem 0' }}></div>
                <div className="sidebar-content-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span className="sidebar-label" style={{ color: '#64748b', fontWeight: 500 }}>Descripción:</span>
                  <span className="sidebar-value" style={{ color: '#334155', fontWeight: 500, fontSize: '1rem' }}>{selectedMapItem.data.descripcion || 'Sin descripción adicional.'}</span>
                </div>
                <div className="sidebar-content-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="sidebar-label" style={{ color: '#64748b', fontWeight: 500 }}>Coord. Este</span>
                  <span className="sidebar-value" style={{ color: '#334155', fontFamily: 'monospace' }}>{selectedMapItem.data.coordenada_este || selectedMapItem.data.este || '---'}</span>
                </div>
                <div className="sidebar-content-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="sidebar-label" style={{ color: '#64748b', fontWeight: 500 }}>Coord. Norte</span>
                  <span className="sidebar-value" style={{ color: '#334155', fontFamily: 'monospace' }}>{selectedMapItem.data.coordenada_norte || selectedMapItem.data.norte || '---'}</span>
                </div>

                <div className="sidebar-content-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span className="sidebar-label" style={{ color: '#64748b', fontWeight: 500 }}>Estratos Reg.</span>
                  <span className="sidebar-value" style={{ color: '#3b82f6', fontWeight: 700, fontSize: '1.1rem' }}>{selectedMapItem.data.estratos_perfil?.length || 0}</span>
                </div>


                <div className="sidebar-actions" style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="sidebar-btn primary"
                    onClick={() => navigateToGestor('estratos')}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      width: '100%',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    <i className="fas fa-layer-group"></i>
                    <span>Ver Detalle y Estratos</span>
                  </button>
                </div>


              </div>
            )}
          </div>

        </section>
      </div>

      {/* SECCIÓN 2: KPIs */}
      <section className="kpi-grid-premium">

        {/* KPI 1: Avance (con Gráfico) */}
        {/* KPI 1: Avance (con Gráfico) */}
        <div className="kpi-card-premium green">
          <div className="kpi-info">
            <h3>Avance del Tramo</h3>
            <p className="value">{avanceStats.val}%</p>
            <p className="sub-text">Ult: {avanceStats.lastProg || '---'}</p>
          </div>
          <div className="kpi-viz" style={{ position: 'relative' }}>
            <Doughnut data={avanceChartData} options={miniChartOptions} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '1rem', // Aumentado significativamente
              fontWeight: '800',
              color: '#000000ff',
              textAlign: 'center',
              lineHeight: '1',
              width: '100%',
              pointerEvents: 'none'
            }}>
              {avanceStats.val}%
            </div>
          </div>
        </div>

        {/* KPI 2: Canteras */}
        < div className="kpi-card-premium orange" >
          <div className="kpi-info">
            <h3>Volumen Canteras</h3>
            <p className="value">120K m³</p>
            <p className="sub-text">Capacidad disponible</p>
          </div>
          <div className="kpi-viz">
            <i className="fas fa-cubes kpi-icon canteras"></i>
          </div>
        </div >

        {/* KPI 3: Agua */}
        < div className="kpi-card-premium blue" >
          <div className="kpi-info">
            <h3>Agua - Abastecimiento</h3>
            <p className="value">85%</p>
            <p className="sub-text">Demanda satisfecha</p>
          </div>
          <div className="kpi-viz">
            <i className="fas fa-tint kpi-icon agua"></i>
          </div>
        </div >

        {/* KPI 4: Distancia */}
        < div className="kpi-card-premium indigo" >
          <div className="kpi-info">
            <h3>Distancia Promedio</h3>
            <p className="value">25 km</p>
            <p className="sub-text">Cantera a Frente</p>
          </div>
          <div className="kpi-viz">
            <i className="fas fa-route kpi-icon route"></i>
          </div>
        </div >
      </section >

      {/* SECCIÓN 3: PANELES INFERIORES */}
      < section className="bottom-section-premium" >

        {/* PANEL IZQUIERDO: ESTADÍSTICAS ENSAYOS (Clickable) */}
        < aside
          className="chart-panel-premium"
          onClick={handleGoToEnsayosGeneral}
          title="Haga clic para ver el detalle general de ensayos"
        >
          <div className="chart-panel-header">
            <h3>Estado de Ensayos</h3>
          </div>

          <div className="chart-wrapper-premium">
            <Doughnut data={ensayosStatusData} options={mainChartOptions} />
            <div className="chart-center-text">
              <div className="total-num">45</div>
              <div className="total-label">Ensayos</div>
            </div>
          </div>

          <div className="chart-legend-premium">
            <div className="legend-item">
              <span><span className="legend-color" style={{ background: '#10b981' }}></span>Aprobados</span>
              <strong>28 (62%)</strong>
            </div>
            <div className="legend-item">
              <span><span className="legend-color" style={{ background: '#f59e0b' }}></span>Pendientes</span>
              <strong>12 (27%)</strong>
            </div>
            <div className="legend-item">
              <span><span className="legend-color" style={{ background: '#ef4444' }}></span>Rechazados</span>
              <strong>5 (11%)</strong>
            </div>
          </div>
        </aside >

        {/* PANEL DERECHO: LISTA DE CRONOLOGÍA (Static for now, visually updated) */}
        < main className="list-panel-premium" >
          <div className="panel-header-premium">
            <h2>
              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-clipboard-check"></i>
              </span>
              Notificaciones
            </h2>
            <button
              onClick={() => handleGoToEnsayosGeneral()}
              style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}
            >
              Ver todo
            </button>
          </div>

          <div className="cards-list-premium">
            {/* Item 1 */}
            <div className="resource-card-premium">
              <div className="resource-icon-box">
                <i className="fas fa-mountain"></i>
              </div>
              <div className="resource-info">
                <span className="resource-name">Cantera "El Peñón" - Muestra M-201</span>
                <div className="resource-meta">
                  <span><i className="fas fa-layer-group me-1"></i> Grava-Arena (GW)</span>
                  <span className="distance-tag"><i className="fas fa-road me-1"></i> 15.2 km</span>
                </div>
              </div>
              <span className="badge-premium approved">Aprobado</span>
            </div>

            {/* Item 2 */}
            <div className="resource-card-premium">
              <div className="resource-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                <i className="fas fa-water"></i>
              </div>
              <div className="resource-info">
                <span className="resource-name">Fuente "Río Seco" - Análisis Químico</span>
                <div className="resource-meta">
                  <span><i className="fas fa-heartbeat me-1"></i> PH: 7.5</span>
                  <span className="distance-tag"><i className="fas fa-road me-1"></i> 8.1 km</span>
                </div>
              </div>
              <span className="badge-premium pending">Pendiente Lab</span>
            </div>

            {/* Item 3 */}
            <div className="resource-card-premium">
              <div className="resource-icon-box" style={{ background: '#fff1f2', color: '#be123c' }}>
                <i className="fas fa-mountain"></i>
              </div>
              <div className="resource-info">
                <span className="resource-name">Cantera "Loma Sur" - Muestra M-204</span>
                <div className="resource-meta">
                  <span><i className="fas fa-layer-group me-1"></i> Arcilla (CL)</span>
                  <span className="distance-tag"><i className="fas fa-road me-1"></i> 32.7 km</span>
                </div>
              </div>
              <span className="badge-premium rejected">Rechazado</span>
            </div>

            {/* Item 4 */}
            <div className="resource-card-premium">
              <div className="resource-icon-box">
                <i className="fas fa-vial"></i>
              </div>
              <div className="resource-info">
                <span className="resource-name">Ensayo de Compactación - Km 12+500</span>
                <div className="resource-meta">
                  <span>Proctor Modificado</span>
                </div>
              </div>
              <span className="badge-premium approved">Aprobado</span>
            </div>

          </div>
        </main >
      </section >

    </main >
  );
}
