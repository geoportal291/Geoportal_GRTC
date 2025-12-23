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
import './DashboardSuelos.css';
import useProgresivasData from '../../../../hooks/useProgresivasData'; // <--- IMPORT CRÍTICO

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function DashboardSuelos() {
  const [loading, setLoading] = useState(true);

  // Usamos el hook que SÍ funciona en Progresivas.jsx
  const { progresivas: hookProgresivas, loading: hookLoading } = useProgresivasData();

  const [progresivas, setProgresivas] = useState([]);
  const [kmlIds, setKmlIds] = useState([]);
  const navigate = useNavigate();

  // Estados KPIs (Mock)
  const [avanceStats, setAvanceStats] = useState({ val: 76, total: 100 });
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
      // Cuando el hook termine de cargar, procesamos los datos
      const tramoIds = new Set();

      console.log("Dashboard: Datos cargados desde useProgresivasData:", hookProgresivas.length);

      if (Array.isArray(hookProgresivas)) {
        hookProgresivas.forEach(p => {
          // Extraer KML IDs de los tramos (progresivas padre)
          if (p.kml_trazado_id) tramoIds.add(p.kml_trazado_id);
          // Si tienen estructura anidada o diferente, aquí adaptamos
          if (p.trazado_kml_id) tramoIds.add(p.trazado_kml_id);
        });
      }

      setKmlIds(Array.from(tramoIds));
      setProgresivas(hookProgresivas); // Usamos las progresivas del hook para los puntos en el mapa
      setLoading(false);

      // Update fake KPIs
      setAvanceStats({ val: 78, total: 100 });
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

    navigate('/coordinador/recoleccion-datos/gestor-tramos', {
      state: {
        activeProgresivaId: selectedMapItem.data.id,
        activeTramoId: parentId,
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
        <section className="map-section-premium" style={{ position: 'relative' }}>

          <SuelosMap
            kmlTrazadoIds={kmlIds}
            progresivasData={progresivas}
            onMapClick={handleMapClick}
            style={{ height: '100%', width: '100%' }}
          />

          {(loading || hookLoading) && (
            <div className="map-placeholder-premium" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2000, width: '100%', height: '100%', background: 'rgba(255,255,255,0.8)' }}>
              <i className="fas fa-spinner fa-spin me-2"></i> Cargando geodatos...
            </div>
          )}

          {/* SIDEBAR DE DETALLES */}
          <div className={`map-sidebar-premium ${selectedMapItem ? 'open' : ''}`}>
            {selectedMapItem && selectedMapItem.data && (
              <>
                <div className="sidebar-header">
                  <h3>{selectedMapItem.data.nombre || selectedMapItem.kmlData?.name || 'Progresiva'}</h3>
                  <button className="sidebar-close-btn" onClick={() => setSelectedMapItem(null)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="sidebar-content-row">
                  <span className="sidebar-label">Progresiva</span>
                  <span className="sidebar-value">{selectedMapItem.data.nombre}</span>
                </div>
                <div className="sidebar-content-row">
                  <span className="sidebar-label">Lado</span>
                  <span className="sidebar-value">
                    {(() => {
                      const lado = selectedMapItem.data.lado;
                      if (!lado) return 'Eje';
                      const map = { 'I': 'IZQUIERDA', 'D': 'DERECHA', 'C': 'CENTRO' };
                      return map[lado] || lado;
                    })()}
                  </span>
                </div>
                <div className="sidebar-content-row">
                  <span className="sidebar-label">Estado</span>
                  <span className="sidebar-value" style={{ textTransform: 'capitalize' }}>
                    {selectedMapItem.data.estado || '---'}
                  </span>
                </div>

                <div style={{ borderTop: '1px dotted #e2e8f0', margin: '8px 0' }}></div>

                <div className="sidebar-content-row">
                  <span className="sidebar-label">Coord. Este</span>
                  <span className="sidebar-value">{selectedMapItem.data.coordenada_este || selectedMapItem.data.este || '---'}</span>
                </div>
                <div className="sidebar-content-row">
                  <span className="sidebar-label">Coord. Norte</span>
                  <span className="sidebar-value">{selectedMapItem.data.coordenada_norte || selectedMapItem.data.norte || '---'}</span>
                </div>

                <div className="sidebar-content-row">
                  <span className="sidebar-label">Estratos Reg.</span>
                  <span className="sidebar-value">{selectedMapItem.data.estratos_perfil?.length || 0}</span>
                </div>

                <div className="sidebar-actions">
                  <button className="sidebar-btn primary" onClick={() => navigateToGestor('estratos')}>
                    <i className="fas fa-layer-group"></i>
                    <span>Ver Detalle y Estratos</span>
                  </button>
                </div>

                <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                  {selectedMapItem.data.descripcion || 'Sin descripción adicional.'}
                </div>
              </>
            )}
          </div>

        </section>
      </div>

      {/* SECCIÓN 2: KPIs */}
      <section className="kpi-grid-premium">

        {/* KPI 1: Avance (con Gráfico) */}
        <div className="kpi-card-premium green">
          <div className="kpi-info">
            <h3>Avance del Tramo</h3>
            <p className="value">{avanceStats.val}%</p>
            <p className="sub-text">Progresiva ejecutada</p>
          </div>
          <div className="kpi-viz" style={{ position: 'relative' }}>
            <Doughnut data={avanceChartData} options={miniChartOptions} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '0.65rem',
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
        <div className="kpi-card-premium orange">
          <div className="kpi-info">
            <h3>Volumen Canteras</h3>
            <p className="value">120K m³</p>
            <p className="sub-text">Capacidad disponible</p>
          </div>
          <div className="kpi-viz">
            <i className="fas fa-cubes kpi-icon canteras"></i>
          </div>
        </div>

        {/* KPI 3: Agua */}
        <div className="kpi-card-premium blue">
          <div className="kpi-info">
            <h3>Agua - Abastecimiento</h3>
            <p className="value">85%</p>
            <p className="sub-text">Demanda satisfecha</p>
          </div>
          <div className="kpi-viz">
            <i className="fas fa-tint kpi-icon agua"></i>
          </div>
        </div>

        {/* KPI 4: Distancia */}
        <div className="kpi-card-premium indigo">
          <div className="kpi-info">
            <h3>Distancia Promedio</h3>
            <p className="value">25 km</p>
            <p className="sub-text">Cantera a Frente</p>
          </div>
          <div className="kpi-viz">
            <i className="fas fa-route kpi-icon route"></i>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: PANELES INFERIORES */}
      <section className="bottom-section-premium">

        {/* PANEL IZQUIERDO: ESTADÍSTICAS ENSAYOS (Clickable) */}
        <aside
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
        </aside>

        {/* PANEL DERECHO: LISTA DE CRONOLOGÍA (Static for now, visually updated) */}
        <main className="list-panel-premium">
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
        </main>
      </section>

    </main>
  );
}
