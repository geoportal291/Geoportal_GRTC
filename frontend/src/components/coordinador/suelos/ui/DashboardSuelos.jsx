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

// Define options using useMemo to avoid infinite loop while keeping it reactive
export default function DashboardSuelos() {
  const [loading, setLoading] = useState(true);

  const progresivasOptions = useMemo(() => ({ includeChildren: true }), []);
  const { progresivas: hookProgresivas, loading: hookLoading } = useProgresivasData(progresivasOptions);

  const [progresivas, setProgresivas] = useState([]);
  const [kmlIds, setKmlIds] = useState([]);
  const navigate = useNavigate();
  // ... (omitted lines)


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
        const tramoIds = new Set();
        if (Array.isArray(allData)) {
          allData.forEach(p => {
            // Solo agregamos KMLs de tramos principales o que tengan trazado explícito
            if ((!p.parent_id || p.es_principal) && p.kml_trazado_id) tramoIds.add(p.kml_trazado_id);
            if (p.kml_puntos_id) tramoIds.add(p.kml_puntos_id);
            if (p.trazado_kml_id) tramoIds.add(p.trazado_kml_id);
          });
        }

        if (allData.length > 0) {
          console.log('[DEBUG Frontend Dashboard] Total Progresivas (DB + Children):', allData.length);

          // Debug de TODOS los KMLs encontrados en la data
          const allTrazadoIds = new Set();
          const allPuntosIds = new Set();
          allData.forEach(p => {
            if (p.kml_trazado_id) allTrazadoIds.add(p.kml_trazado_id);
            if (p.kml_puntos_id) allPuntosIds.add(p.kml_puntos_id);
            if (p.trazado_kml_id) allTrazadoIds.add(p.trazado_kml_id);
          });
          console.log('[DEBUG Frontend Dashboard] IDs de KML encontrados en TODA la data:', {
            trazados: Array.from(allTrazadoIds),
            puntos: Array.from(allPuntosIds)
          });

          // --- PATCH TEMPORAL DEPURACION ---
          // Si estamos en Quellouno (ID 24) y tenemos el ID 27, forzamos también el 25 (Trazado)
          if (Array.from(allTrazadoIds).includes(27) || Array.from(allPuntosIds).includes(27)) {
            console.log('[DEBUG PATCH] Detectado KMZ Puntos (27). Forzando inclusion de Trazado (25).');
            allTrazadoIds.add(25);
          }
          // ---------------------------------

          const withCoords = allData.filter(p => p.coordenada_este && p.coordenada_norte);
          console.log('[DEBUG Frontend Dashboard] Progresivas CON coordenadas:', withCoords.length);
          console.log('[DEBUG Frontend Dashboard] Progresivas SIN coordenadas:', allData.length - withCoords.length);
        } else {
          console.warn('[DEBUG Frontend Dashboard] No se encontraron progresivas.');
        }

        // Calcular Avance Real
        let maxProg = 0;
        let totalLen = 0; // Default fallback

        // Helper to parse 'XX+YYY' to meters
        const parseProgToMeters = (p) => {
          if (!p) return 0;
          // Si es un objeto, intentar usar 'progresiva_final' numérico si existe
          if (typeof p === 'object') {
            if (p.progresiva_final && !isNaN(p.progresiva_final)) return Number(p.progresiva_final);
            // Sino, intentar parsear el 'nombre' o 'codigo'
            p = p.nombre || p.codigo || '';
          }
          if (typeof p !== 'string') return 0;

          p = p.trim().toUpperCase().replace(',', '.');
          const match = p.match(/(\d+)\+(\d+(\.\d+)?)/);
          if (match) {
            return (parseFloat(match[1]) * 1000) + parseFloat(match[2]);
          }
          return parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
        };

        // 1. Obtener Longitud Total del Tramo Principal
        // Buscamos un padre o "es_principal"
        const mainTramo = allData.find(d => d.es_principal || !d.parent_id);
        if (mainTramo) {
          // Preferir propiedad longitud_total explicita
          if (mainTramo.longitud_total > 0) {
            totalLen = Number(mainTramo.longitud_total) * 1000; // Asumiendo km en DB, o metros? Ajustar segun DB.
            // Si la DB guarda en KM y es 86km -> 86000. Si guarda metros, directo.
            // Usually 'longitud_total' in DB is float KM. Let's assume KM for now, or check value.
            // Si el valor es pequeño (< 500), es KM. Si es grande (> 1000), son metros.
            if (totalLen < 1000000 && mainTramo.longitud_total < 1000) totalLen = mainTramo.longitud_total * 1000;
            else totalLen = mainTramo.longitud_total;
          }

          // Fallback: Si no hay longitud_total, buscar la progresiva final del nombre/codigo
          if (!totalLen || totalLen === 0) {
            totalLen = parseProgToMeters(mainTramo.progresiva_final || mainTramo.nombre);
          }
        }

        // Fallback global si aun es 0 (buscar maximo absoluto en la data)
        if (totalLen === 0) {
          const allMeters = allData.map(d => parseProgToMeters(d));
          totalLen = Math.max(...allMeters, 86000); // 86km default hardcode worst case
        }

        // 2. Buscar ultima progresiva completada (con datos)
        const completadas = allData.filter(d => {
          // Criterio de "completado": tiene estratos o estado 'completado'
          return (d.estratos_perfil && d.estratos_perfil.length > 0) || d.estado === 'completado';
        });

        if (completadas.length > 0) {
          const metersCompletados = completadas.map(d => parseProgToMeters(d));
          maxProg = Math.max(...metersCompletados);
        }

        // Formatear para display (XX+YYY)
        const formatMeters = (m) => {
          const km = Math.floor(m / 1000);
          const mts = Math.round(m % 1000); // round to integer
          return `${km}+${mts.toString().padStart(3, '0')}`;
        };

        const porcentaje = totalLen > 0 ? Math.min(Math.round((maxProg / totalLen) * 100), 100) : 0;

        console.log('[DEBUG Dashboard Stats] MaxProg:', maxProg, 'TotalLen:', totalLen, 'Pct:', porcentaje);

        setKmlIds(Array.from(tramoIds));
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
              kmlTrazadoIds={kmlIds}
              progresivasData={progresivas}
              onMapClick={handleMapClick}
              defaultZone={progresivas.find(p => p.linea)?.linea || '18L'}
              style={{ height: '100%', width: '100%' }}
              canterasData={canterasMapData} // Pass quarries to map
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
