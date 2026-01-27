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
import ProgresivaImageGalleryModal from '../gestion_tramos/ProgresivaImageGalleryModal'; // Importar Modal de Galería

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
  const [recentAssays, setRecentAssays] = useState([]);
  const [avgCanteraDistance, setAvgCanteraDistance] = useState('0.0');
  const navigate = useNavigate();


  // Estados KPIs (Mock)
  const [avanceStats, setAvanceStats] = useState({ val: 0, total: 100 });
  const [canterasMapData, setCanterasMapData] = useState([]); // NUEVO: Estado para canteras
  const [viewingGallery, setViewingGallery] = useState(false); // Estado para la galería

  // Stats helpers
  const getTotalAssays = () => {
    return ensayosStatusData.datasets[0].data.reduce((a, b) => a + b, 0);
  }

  const getStatusCount = (index) => {
    return ensayosStatusData.datasets[0].data[index] || 0;
  }

  const getStatusPercent = (index) => {
    const total = getTotalAssays();
    return total > 0 ? Math.round((getStatusCount(index) / total) * 100) : 0;
  }

  const [ensayosStatusData, setEnsayosStatusData] = useState({
    labels: ['Pendiente', 'En revisión', 'Rechazado', 'Aprobado', 'Completado'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#9ca3af', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  });

  // --- 1. Sincronizar datos del Hook con el Dashboard ---
  // --- 1. Sincronizar datos del Hook con el Dashboard ---
  useEffect(() => {
    if (!hookLoading) {

      const syncData = async () => {
        let allData = [...hookProgresivas];
        let allCanteras = [];

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
                  return res.data || [];
                })
                .catch(err => {
                  console.warn(`Error cargando canteras para tramo ${tramoId}`, err);
                  return [];
                })
            );

            const canterasArrays = await Promise.all(canterasPromises);
            allCanteras = canterasArrays.flat();
            setCanterasMapData(allCanteras);

          } catch (err) {
            console.error("Error general cargando canteras para el mapa", err);
          }
        }

        // --- AGREGACIÓN DE ENSAYOS & CÁLCULOS DE ESTADÍSTICAS ---
        const allEnsayos = [];

        // 1. Ensayos de Progresivas
        allData.forEach(prog => {
          if (prog.estratos_perfil && Array.isArray(prog.estratos_perfil)) {
            prog.estratos_perfil.forEach(estrato => {
              if (estrato.ensayos && Array.isArray(estrato.ensayos)) {
                estrato.ensayos.forEach(ensayo => {
                  allEnsayos.push({
                    ...ensayo,
                    sourceType: 'Tramo',
                    sourceName: prog.nombre, // 0+000
                    distance: null // Tramos don't usually have a 'source' distance field in this context
                  });
                });
              }
            });
          }
        });

        // 2. Ensayos de Canteras
        allCanteras.forEach(cantera => {
          // Check if cantera has estratos/ensayos attached. 
          // canterasService.getCanterasByTramoId attaches them!
          if (cantera.estratos && Array.isArray(cantera.estratos)) {
            cantera.estratos.forEach(estrato => {
              if (estrato.ensayos && Array.isArray(estrato.ensayos)) {
                estrato.ensayos.forEach(ensayo => {
                  allEnsayos.push({
                    ...ensayo,
                    sourceType: 'Cantera',
                    sourceName: cantera.nombre,
                    distance: cantera.desplazamiento_km
                  });
                });
              }
            });
          }
        });

        // 3. Calcular Stats de Estado
        const statusCounts = {
          pendiente: 0,
          en_revision: 0,
          rechazado: 0,
          aprobado: 0,
          completado: 0,
          total: 0
        };

        allEnsayos.forEach(ensayo => {
          statusCounts.total++;
          const status = (ensayo.estado || 'pendiente').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

          if (status.includes('aprobado')) statusCounts.aprobado++;
          else if (status.includes('pendiente')) statusCounts.pendiente++;
          else if (status.includes('rechazado')) statusCounts.rechazado++;
          else if (status.includes('revision')) statusCounts.en_revision++;
          else if (status.includes('completado')) statusCounts.completado++;
          else statusCounts.pendiente++; // Default fallback
        });

        // Actualizar datos del gráfico de Estado
        setEnsayosStatusData({
          labels: ['Pendiente', 'En revisión', 'Rechazado', 'Aprobado', 'Completado'],
          datasets: [{
            data: [
              statusCounts.pendiente,
              statusCounts.en_revision,
              statusCounts.rechazado,
              statusCounts.aprobado,
              statusCounts.completado
            ],
            backgroundColor: ['#9ca3af', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        });

        // 4. Calcular KPIs
        // A) Avance del Tramo (Progresivas Terminadas VS Total Activas)
        // Filtrar solo las sub-progresivas (hijas) que son los puntos reales de avance
        const subProgresivas = allData.filter(p => p.parent_id);

        let aprobadasCount = 0;
        let totalActiveCount = 0;

        subProgresivas.forEach(p => {
          const estado = (p.estado || 'pendiente').toLowerCase();
          // Considerar solo las que NO están inactivas (plomas)
          if (estado !== 'inactivo') {
            totalActiveCount++;
            if (estado === 'aprobado' || estado === 'completado') {
              aprobadasCount++;
            }
          }
        });

        const avancePorcentaje = totalActiveCount > 0 ? Math.round((aprobadasCount / totalActiveCount) * 100) : 0;

        // B) Distancia Promedio (Canteras)
        let totalDist = 0;
        let countDist = 0;
        allCanteras.forEach(c => {
          const d = parseFloat(c.desplazamiento_km);
          if (!isNaN(d)) {
            totalDist += d;
            countDist++;
          }
        });
        const avgDistance = countDist > 0 ? (totalDist / countDist).toFixed(1) : '0.0';

        // Update KPI States
        setAvanceStats({
          val: avancePorcentaje,
          total: 100,
          lastProg: `${aprobadasCount}/${totalActiveCount} Progresivas`
        });

        // Save computed data for other components
        // (We can assume canterasMapData is already set above)
        // Store recent assays for Notifications Panel
        const sortedEnsayos = [...allEnsayos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10);
        // We'll use a hack to store this in a state derived from this effect if needed, 
        // but for now let's just use a ref or simplified state if we want to render the list.
        // Actually, let's add a state for notifications!
        setRecentAssays(sortedEnsayos); // Need to define this state!

        // UPDATE PROGRESIVAS MAP DATA
        // Procesamos KMLs de los padres (tramos)
        const trazadoIdsSet = new Set();
        const puntosIdsSet = new Set();

        if (Array.isArray(allData)) {
          allData.forEach(p => {
            if (p.kml_trazado_id) puntosIdsSet.add(p.kml_trazado_id);
            if (p.trazado_kml_id) puntosIdsSet.add(p.trazado_kml_id);
            if (p.kml_puntos_id) puntosIdsSet.add(p.kml_puntos_id);
          });
        }
        trazadoIdsSet.clear();

        if (puntosIdsSet.has(27) && !trazadoIdsSet.has(25)) {
          trazadoIdsSet.add(25);
        }

        setKmlTrazadoIdsStricto(Array.from(trazadoIdsSet));
        setKmlPuntosIdsPermisivo(Array.from(puntosIdsSet));
        setProgresivas(allData);
        setLoading(false);
        setAvgCanteraDistance(avgDistance); // Need state

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

    // Determine the Tramo ID (Parent). 
    // If parent_id exists, it's a child; use parent_id.
    // If no parent_id, it is likely the Tramo itself; use its own id.
    const parentId = selectedMapItem.data.progresiva_padre_id || selectedMapItem.data.tramo_id || selectedMapItem.data.parent_id;
    const tramoIdToOpen = parentId || selectedMapItem.data.id;

    navigate('/coordinador/recoleccion-datos/gestor-tramos', {
      state: {
        activeProgresivaId: selectedMapItem.data.id, // Determine logic: if clicking parent, scroll to parent? Or just open?
        openTramoId: tramoIdToOpen,
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
        <section className="map-section-premium" style={{ display: 'flex', overflow: 'visible', height: '600px', position: 'relative', paddingRight: '15px' }}> {/* Flex Container with padding to prevent clipping */}

          {/* MAPA (Flex Item 1) */}
          <div style={{ flex: 1, position: 'relative', height: '100%', minWidth: 0 }}>
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
              // marginRight prop removed as parent padding handles it consistently
              borderRadius: '1rem', // Bordes redondeados
              position: 'relative',
              height: '100%',
              top: 0,
              backgroundColor: '#ffffff',
              border: '2px solid #000000', // Black Border requested by user
              transition: 'width 0.3s ease-in-out, margin-left 0.3s ease-in-out',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.05)',
              zIndex: 1000,
              boxSizing: 'border-box'
            }}
          >
            {/* Contenido protegido por width > 0 visualmente, pero react renderiza si selectedMapItem existe */}
            {selectedMapItem && selectedMapItem.data && (
              <div style={{ width: '100%', height: '100%', padding: '1.5rem', overflowY: 'auto', boxSizing: 'border-box' }}>
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


                <div className="sidebar-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                  <button
                    className="sidebar-btn secondary"
                    onClick={() => setViewingGallery(true)}
                    style={{
                      marginTop: '0.75rem',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      width: '100%',
                      justifyContent: 'center',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <i className="fas fa-images"></i>
                    <span>Ver Galería</span>
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
            <h3>Canteras Identificadas</h3>
            <p className="value">{canterasMapData.length}</p>
            <p className="sub-text">Total registradas</p>
          </div>
          <div className="kpi-viz">
            <i className="fas fa-cubes kpi-icon canteras"></i>
          </div>
        </div >

        {/* KPI 3: Agua */}
        < div className="kpi-card-premium blue" >
          <div className="kpi-info">
            <h3>Agua - Abastecimiento</h3>
            <p className="value">--</p>
            <p className="sub-text">Datos no disponibles</p>
          </div>
          <div className="kpi-viz">
            <i className="fas fa-tint kpi-icon agua"></i>
          </div>
        </div >

        {/* KPI 4: Distancia */}
        < div className="kpi-card-premium indigo" >
          <div className="kpi-info">
            <h3>Distancia Promedio</h3>
            <p className="value">{avgCanteraDistance} km</p>
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
              <div className="total-num">{getTotalAssays()}</div>
              <div className="total-label">Ensayos</div>
            </div>
          </div>

          <div className="chart-legend-premium">
            <div className="legend-item">
              <span><span className="legend-color" style={{ background: '#9ca3af' }}></span>Pendiente</span>
              <strong>{getStatusCount(0)} ({getStatusPercent(0)}%)</strong>
            </div>
            <div className="legend-item">
              <span><span className="legend-color" style={{ background: '#f59e0b' }}></span>En revisión</span>
              <strong>{getStatusCount(1)} ({getStatusPercent(1)}%)</strong>
            </div>
            <div className="legend-item">
              <span><span className="legend-color" style={{ background: '#ef4444' }}></span>Rechazado</span>
              <strong>{getStatusCount(2)} ({getStatusPercent(2)}%)</strong>
            </div>
            <div className="legend-item">
              <span><span className="legend-color" style={{ background: '#10b981' }}></span>Aprobado</span>
              <strong>{getStatusCount(3)} ({getStatusPercent(3)}%)</strong>
            </div>
            <div className="legend-item">
              <span><span className="legend-color" style={{ background: '#3b82f6' }}></span>Completado</span>
              <strong>{getStatusCount(4)} ({getStatusPercent(4)}%)</strong>
            </div>
          </div>
        </aside >

        {/* PANEL DERECHO: LISTA DE CRONOLOGÍA (Dynamic) */}
        < main className="list-panel-premium" >
          <div className="panel-header-premium">
            <h2>
              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-clipboard-check"></i>
              </span>
              Notificaciones Recientes
            </h2>
            <button
              onClick={() => handleGoToEnsayosGeneral()}
              style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}
            >
              Ver todo
            </button>
          </div>

          <div className="cards-list-premium">
            {recentAssays.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No hay ensayos recientes registrados.
              </div>
            ) : (
              recentAssays.map((ensayo, idx) => {
                const statusClass = (ensayo.estado || 'pendiente').toLowerCase().includes('aprobado') ? 'approved' :
                  (ensayo.estado || 'pendiente').toLowerCase().includes('rechazado') ? 'rejected' : 'pending';
                const fechaStr = new Date(ensayo.fecha).toLocaleDateString();

                return (
                  <div className="resource-card-premium" key={idx}>
                    <div className="resource-icon-box" style={{
                      background: statusClass === 'approved' ? '#ecfdf5' : statusClass === 'rejected' ? '#fff1f2' : '#fef3c7',
                      color: statusClass === 'approved' ? '#059669' : statusClass === 'rejected' ? '#be123c' : '#d97706'
                    }}>
                      <i className="fas fa-vial"></i>
                    </div>
                    <div className="resource-info">
                      <span className="resource-name">{ensayo.nombre_ensayo}</span>
                      <div className="resource-meta">
                        <span><i className="fas fa-map-marker-alt me-1"></i> {ensayo.sourceType}: {ensayo.sourceName}</span>
                        <span className="distance-tag"><i className="far fa-calendar-alt me-1"></i> {fechaStr}</span>
                      </div>
                    </div>
                    <span className={`badge-premium ${statusClass}`}>{ensayo.estado || 'Pendiente'}</span>
                  </div>
                );
              })
            )}

          </div>
        </main >
      </section >

      {viewingGallery && selectedMapItem && selectedMapItem.data && (
        <ProgresivaImageGalleryModal
          isOpen={viewingGallery}
          onClose={() => setViewingGallery(false)}
          progresiva={selectedMapItem.data}
        />
      )}
    </main >
  );
}
