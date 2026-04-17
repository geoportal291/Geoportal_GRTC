import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
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
import ReactDOM from 'react-dom';
import SuelosMap from '../mapa/SuelosMap';
import 'leaflet/dist/leaflet.css';
import './DashboardSuelos.css';
import useProgresivasData from '../../../../hooks/useProgresivasData';
import ProgresivaImageGalleryModal from '../gestion_tramos/ProgresivaImageGalleryModal';
import { toLatLon } from 'utm';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const parseToMeters = (m) => {
  if (typeof m === 'number') return m;
  if (!m) return 0;
  const s = String(m).trim().toUpperCase();
  const match = s.match(/(\d+)\+(\d+(\.\d+)?)/);
  if (match) return parseInt(match[1]) * 1000 + parseFloat(match[2]);
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
};

export default function DashboardSuelos({ isExternalView, onBackToSelection }) {
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
  const [filterType, setFilterType] = useState('all');
  const [viewingGallery, setViewingGallery] = useState(false);
  const [trazadoIds, setTrazadoIds] = useState([]);

  const [ensayosStatusData, setEnsayosStatusData] = useState({
    labels: ['Pendiente', 'En revisión', 'Rechazado', 'Aprobado', 'Completado'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#9ca3af', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  });

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
          p.estratos_perfil?.forEach(est => {
            est.ensayos?.forEach(ens => allEnsayos.push({ ...ens, sourceType: 'Tramo', sourceName: p.nombre }));
          });
        });
        allCanteras.forEach(c => {
          c.estratos?.forEach(est => {
            est.ensayos?.forEach(ens => allEnsayos.push({ ...ens, sourceType: 'Cantera', sourceName: c.nombre }));
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

        const sub = allData.filter(p => p.parent_id);
        const ok = sub.filter(p => ['aprobado', 'completado'].includes(p.estado?.toLowerCase())).length;
        setAvanceStats({ val: sub.length > 0 ? Math.round((ok / sub.length) * 100) : 0, lastProg: `${ok}/${sub.length} Progresivas` });

        const dist = allCanteras.reduce((acc, c) => acc + (parseFloat(c.desplazamiento_km) || 0), 0);
        setAvgCanteraDistance(allCanteras.length > 0 ? (dist / allCanteras.length).toFixed(1) : '0.0');

        setRecentAssays([...allEnsayos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10));
        setProgresivas(allData);
        setLoading(false);
      };
      syncData();
    }
  }, [hookProgresivas, hookLoading]);

  const handleMapClick = useCallback((e) => {
    if (e?.type === 'progresiva') {
      setSelectedMapItem(e);
      setSidebarView('details');
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
          {isExternalView && onBackToSelection && (
            <button
              onClick={onBackToSelection}
              className="btn-ghost-dark"
              style={{
                position: 'absolute', bottom: '25px', left: '20px', zIndex: 1000,
                backgroundColor: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '10px 20px',
                border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                fontWeight: '600'
              }}
            >
              <i className="fas fa-arrow-left"></i> Salir / Volver
            </button>
          )}

          <button
            onClick={() => setMapCenterTo('reset')}
            title="Centrar mapa general"
            style={{
              position: 'absolute', bottom: '30px', right: '20px', zIndex: 1000,
              width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#ffffff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '50%',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)', cursor: 'pointer', transition: 'all 0.2s ease',
              fontSize: '1.2rem'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)'; }}
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
                <button onClick={() => setFilterType('all')} className={`seg-btn ${filterType === 'all' ? 'active' : ''}`}>Todas</button>
                <button onClick={() => setFilterType('data')} className={`seg-btn ${filterType === 'data' ? 'active' : ''}`}>Con Datos</button>
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
                  <div className="chart-container-inner" style={{ height: '220px', position: 'relative', flex: 1 }}>
                    <Doughnut data={ensayosStatusData} options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }} />
                    <div className="chart-overlay-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '900' }}>{ensayosStatusData.datasets[0].data.reduce((a, b) => a + b, 0)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Ensayos</div>
                    </div>
                  </div>

                  <div className="chart-legend custom-scrollbar">
                    {ensayosStatusData.labels.map((label, i) => {
                      const val = ensayosStatusData.datasets[0].data[i];
                      const total = ensayosStatusData.datasets[0].data.reduce((a, b) => a + b, 0);
                      const perc = total > 0 ? Math.round((val / total) * 100) : 0;
                      return (
                        <div key={label} className="legend-item">
                          <div className="legend-label">
                            <span className="dot" style={{ backgroundColor: ensayosStatusData.datasets[0].backgroundColor[i] }}></span>
                            <span className="name">{label}</span>
                          </div>
                          <div className="legend-value">
                            <span className="count">{val}</span>
                            <span className="perc">({perc}%)</span>
                          </div>
                        </div>
                      );
                    })}
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
    </main>
  );

  return isExternalView ? ReactDOM.createPortal(content, document.body) : content;
}
