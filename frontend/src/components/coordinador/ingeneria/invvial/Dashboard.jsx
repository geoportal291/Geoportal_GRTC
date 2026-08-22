
import React, { useEffect, useState } from 'react';
import axiosInstance from '@/api/axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import DashboardMap from './DashboardMap';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = ({ projectId }) => {
    const [stats, setStats] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [mapData, setMapData] = useState(null);
    const [calibrations, setCalibrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        alcantarillas: true, badenes: true, puentes: true, muros: true,
        senales_informativas: true, senales_preventivas: true, hitos_kilometricos: true,
        canteras: true, fuentes: true, zonas_criticas: true,
        estructuras_existentes: true, interferencias_electricas: true
    });
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!projectId) return;
            try {
                setLoading(true);
                const projRes = await axiosInstance.get(`/api/proyectos/${projectId}`);

                const data = projRes.data;
                setProjectData(data);
                
                try {
                    const kmlRes = await axiosInstance.get(`/api/proyectos/${projectId}/kml`, {
                        params: { section: 'invvial' }
                    });
                    if (kmlRes.data && kmlRes.data.url) {
                        setProjectData(prev => ({ ...prev, url_kml: kmlRes.data.url }));
                    }
                } catch (e) { console.warn("KML url fetch failed", e); }
                const statsRes = await axiosInstance.get(`/api/proyectos/${projectId}/estadisticas`);
                setStats(statsRes.data);
                try {
                    const mapRes = await axiosInstance.get(`/api/proyectos/${projectId}/map-data`);
                    setMapData(mapRes.data);
                } catch (e) { console.warn("Map data missing", e); }
                try {
                    const calRes = await axiosInstance.get(`/api/proyectos/${projectId}/calibracion`);
                    setCalibrations(calRes.data);
                } catch (e) { console.warn("Calibrations missing", e); }
                setLoading(false);
            } catch (err) {
                console.error("Error dashboard", err);
                setError("Error al cargar datos");
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [projectId]);

    const handleFilterChange = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>Cargando...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
    if (!stats) return <div style={{ padding: '20px' }}>No data</div>;

    const { kpis, activos, senalizacion, recursos, zonas_criticas, entregables, debug_unassigned } = stats;

    const zcLabels = zonas_criticas?.map(z => z.tipo || 'Sin Tipo') || [];
    const zcValues = zonas_criticas?.map(z => parseInt(z.count)) || [];
    const entLabels = Object.keys(entregables || {});
    const entValues = Object.values(entregables || {});

    // Only for debugging: show breakdown if 'Sin Asignar' has items
    const unassignedCount = entregables?.['Sin Asignar'] || 0;
    const hasUnassigned = unassignedCount > 0 && debug_unassigned;

    const palette = {
        blue: '#3498db', teal: '#1abc9c', orange: '#e67e22', purple: '#9b59b6',
        red: '#e74c3c', dark: '#34495e', grey: '#95a5a6'
    };

    const commonChartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { labels: { font: { family: "'Inter', sans-serif", size: 10 }, usePointStyle: true, boxWidth: 6 } },
            tooltip: { backgroundColor: 'rgba(44,62,80,0.95)', padding: 6, cornerRadius: 4 }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { grid: { borderDash: [4, 4] }, ticks: { font: { size: 9 } } }
        }
    };

    const datasets = {
        activos: {
            labels: ['Alcantarillas', 'Badenes', 'Puentes', 'Muros'],
            datasets: [{
                label: 'Cantidad',
                data: [activos?.alcantarillas || 0, activos?.badenes || 0, activos?.puentes || 0, activos?.muros || 0],
                backgroundColor: [palette.blue, palette.red, palette.purple, palette.orange],
                borderRadius: 4, barThickness: 30
            }]
        },
        zc: {
            labels: zcLabels,
            datasets: [{ data: zcValues, backgroundColor: [palette.orange, '#d35400', '#c0392b', palette.red, palette.purple], borderWidth: 1, borderColor: '#fff' }]
        },
        senales: {
            labels: ['Informativas', 'Preventivas', 'Reguladoras', 'Hitos'],
            datasets: [{ data: [senalizacion?.informativas || 0, senalizacion?.preventivas || 0, senalizacion?.reguladoras || 0, senalizacion?.hitos || 0], backgroundColor: [palette.teal, palette.orange, palette.purple, palette.dark], borderWidth: 1, borderColor: '#fff' }]
        },
        entregables: {
            labels: entLabels,
            datasets: [{ label: 'Elementos', data: entValues, backgroundColor: 'rgba(26, 188, 156, 0.8)', borderRadius: 4, barThickness: 18 }]
        }
    };

    return (
        <div className="invvial-dashboard-wrapper">
            {/* ROW 1: MAP */}
            <div className="invvial-map-section">
                <div className="map-card-container">
                    <DashboardMap projectId={projectId} kmlUrl={projectData?.url_kml} mapData={mapData} filters={filters} calibrations={calibrations} />
                </div>
                <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                    <span>Capas</span>
                </button>
                {showFilters && (
                    <div className="filter-panel animate-fade-in">
                        <div className="filter-header"><h4>Control de Capas</h4><button className="close-panel-btn" onClick={() => setShowFilters(false)}>×</button></div>
                        <div className="filter-toggles-list">
                            <div className="filter-group-title">Estructuras</div>
                            <div className="toggle-item"><span>Alcantarillas</span><label className="switch"><input type="checkbox" checked={filters.alcantarillas} onChange={() => handleFilterChange('alcantarillas')} /><span className="slider round"></span></label></div>
                            <div className="toggle-item"><span>Badenes/Puentes</span><label className="switch"><input type="checkbox" checked={filters.badenes} onChange={() => { handleFilterChange('badenes'); handleFilterChange('puentes'); }} /><span className="slider round"></span></label></div>
                            <div className="toggle-item"><span>Muros</span><label className="switch"><input type="checkbox" checked={filters.muros} onChange={() => handleFilterChange('muros')} /><span className="slider round"></span></label></div>
                            <div className="toggle-item"><span>Est. Existentes</span><label className="switch"><input type="checkbox" checked={filters.estructuras_existentes} onChange={() => handleFilterChange('estructuras_existentes')} /><span className="slider round"></span></label></div>

                            <div className="filter-group-title">Señalización</div>
                            <div className="toggle-item"><span>Señales</span><label className="switch"><input type="checkbox" checked={filters.senales_informativas} onChange={() => { handleFilterChange('senales_informativas'); handleFilterChange('senales_preventivas'); }} /><span className="slider round"></span></label></div>
                            <div className="toggle-item"><span>Hitos</span><label className="switch"><input type="checkbox" checked={filters.hitos_kilometricos} onChange={() => handleFilterChange('hitos_kilometricos')} /><span className="slider round"></span></label></div>

                            <div className="filter-group-title">Recursos y Otros</div>
                            <div className="toggle-item"><span>Canteras/Fuentes</span><label className="switch"><input type="checkbox" checked={filters.canteras} onChange={() => { handleFilterChange('canteras'); handleFilterChange('fuentes'); }} /><span className="slider round"></span></label></div>
                            <div className="toggle-item"><span>Zonas Críticas</span><label className="switch"><input type="checkbox" checked={filters.zonas_criticas} onChange={() => handleFilterChange('zonas_criticas')} /><span className="slider round"></span></label></div>
                            <div className="toggle-item"><span>Interferencias</span><label className="switch"><input type="checkbox" checked={filters.interferencias_electricas} onChange={() => handleFilterChange('interferencias_electricas')} /><span className="slider round"></span></label></div>
                        </div>
                    </div>
                )}
            </div>

            {/* DASHBOARD GRID */}
            <div className="dashboard-content-grid">

                {/* ROW 1: KPIs */}
                <div className="kpi-row">
                    <div className="kpi-modern blue-theme">
                        <div className="kpi-flex-row">
                            <div className="kpi-content-main">
                                <div className="kpi-top-label">LONGITUD TOTAL</div>
                                <div className="kpi-metric-huge">{(kpis?.totalCalibratedKm || 0)}<span className="kpi-unit-small">km</span></div>
                                <div className="kpi-sub-text">Max Progresiva: {(kpis?.maxRegisteredMeters / 1000).toFixed(2)} km</div>
                            </div>
                            <div className="kpi-visual-container"><div className="icon-circle-glass">🌐</div></div>
                        </div>
                        <div className="kpi-progress-bar-container"><div className="kpi-progress-track"><div className="kpi-progress-fill" style={{ width: '100%' }}></div></div></div>
                    </div>

                    <div className="kpi-modern teal-theme">
                        <div className="kpi-flex-row">
                            <div className="kpi-content-main">
                                <div className="kpi-top-label">AVANCE GEOGRÁFICO</div>
                                <div className="kpi-metric-huge">{kpis?.avanceGeograficoPct || 0}<span className="kpi-unit-small">%</span></div>
                                <div className="kpi-sub-text">Progreso del proyecto</div>
                            </div>
                            <div className="kpi-visual-container">
                                <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="30" cy="30" r="26" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                                    <circle cx="30" cy="30" r="26" stroke="white" strokeWidth="6" fill="none" strokeDasharray={163} strokeDashoffset={163 - ((kpis?.avanceGeograficoPct || 0) / 100) * 163} strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="kpi-modern orange-theme">
                        <div className="kpi-flex-row">
                            <div className="kpi-content-main">
                                <div className="kpi-top-label">TOTAL ELEMENTOS</div>
                                <div className="kpi-metric-huge">{kpis?.totalElementos || 0}</div>
                                <div className="kpi-sub-text-list">
                                    <span>• {activos?.alcantarillas + activos?.badenes + activos?.puentes + activos?.muros || 0} Estructuras</span>
                                    <span>• {senalizacion?.informativas + senalizacion?.preventivas + senalizacion?.reguladoras + senalizacion?.hitos || 0} Señales/Hitos</span>
                                </div>
                            </div>
                            <div className="kpi-visual-container"><div className="icon-circle-glass">📊</div></div>
                        </div>
                    </div>
                </div>

                {/* ROW 2: Activos / Señales / Zonas */}
                <div className="dashboard-main-row-3col">
                    <div className="dashboard-card main-card">
                        <h5 className="card-title-small">Distribución de Activos</h5>
                        <div className="chart-area-main">
                            <Bar data={datasets.activos} options={commonChartOptions} />
                        </div>
                    </div>

                    <div className="dashboard-card main-card">
                        <h5 className="card-title-small">Tipos de Señales</h5>
                        <div className="chart-area-main flex-center">
                            <div className="chart-container-pie"><Pie data={datasets.senales} options={{ ...commonChartOptions, plugins: { legend: { display: false } } }} /></div>
                            <div className="legend-grid">
                                <div className="lg-item"><span className="lg-dot" style={{ background: palette.teal }}></span> Inf: {senalizacion?.informativas}</div>
                                <div className="lg-item"><span className="lg-dot" style={{ background: palette.orange }}></span> Prev: {senalizacion?.preventivas}</div>
                                <div className="lg-item"><span className="lg-dot" style={{ background: palette.purple }}></span> Reg: {senalizacion?.reguladoras}</div>
                                <div className="lg-item"><span className="lg-dot" style={{ background: palette.dark }}></span> Hit: {senalizacion?.hitos}</div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card main-card">
                        <h5 className="card-title-small">Zonas Críticas</h5>
                        <div className="chart-area-main flex-center">
                            {zcValues.length > 0 ? (
                                <>
                                    <div className="chart-container-pie"><Pie data={datasets.zc} options={{ ...commonChartOptions, plugins: { legend: { display: false } } }} /></div>
                                    <div className="legend-column">
                                        {datasets.zc.labels.slice(0, 4).map((l, i) => (
                                            <div key={i} className="lg-item-small" title={l}>
                                                <span className="lg-dot" style={{ background: datasets.zc.datasets[0].backgroundColor[i] }}></span>
                                                <span className="lg-text">{l}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : <div className="no-data-placeholder">Sin zonas registradas</div>}
                        </div>
                    </div>
                </div>

                {/* ROW 3: Entregables & Recursos */}
                <div className="dashboard-bottom-row">
                    <div className="dashboard-card wide-card">
                        <h5 className="card-title-small flex-between">
                            Distribución por Entregable
                            {hasUnassigned && <span className="unassigned-badge">⚠️ {unassignedCount} Sin Asignar</span>}
                        </h5>
                        <div className="chart-area-h150">
                            <Bar data={datasets.entregables} options={{ ...commonChartOptions, indexAxis: 'y' }} />
                        </div>
                    </div>

                    <div className="dashboard-card resources-card">
                        <h5 className="card-title-small">Recursos Disponibles</h5>
                        <div className="resources-grid-compact">
                            <div className="res-card-mini">
                                <div className="res-icon">⛰️</div>
                                <div className="res-data"><span className="res-val">{recursos?.canteras || 0}</span><span className="res-lbl">Canteras</span></div>
                            </div>
                            <div className="res-card-mini">
                                <div className="res-icon">💧</div>
                                <div className="res-data"><span className="res-val">{recursos?.fuentes || 0}</span><span className="res-lbl">Fuentes</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .invvial-dashboard-wrapper { padding: 0 0 20px 0; background-color: #f4f7fa; display: flex; flex-direction: column; gap: 12px; font-family: 'Inter', system-ui, sans-serif; }
                .invvial-map-section { position: relative; width: 100%; height: 48vh; min-height: 400px; border-radius: 0 0 20px 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                .map-card-container { width: 100%; height: 100%; }
                
                .filter-toggle-btn { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-radius: 10px; border: 1px solid rgba(0,0,0,0.05); display:flex; align-items:center; gap: 8px; padding: 10px 16px; cursor:pointer; color:#1a202c; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); z-index:2002; font-weight: 700; font-size: 0.85rem; transition: all 0.2s ease; }
                .filter-toggle-btn:hover { transform: translateY(-2px); background: white; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
                
                .filter-panel { position: absolute; top: 75px; right: 20px; width: 240px; max-height: calc(100% - 100px); overflow-y: auto; padding: 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-radius: 16px; font-size: 0.8rem; z-index:2001; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.6); animation: slideIn 0.3s ease-out; }
                @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
                
                .filter-header { display:flex; justify-content:space-between; margin-bottom:12px; font-weight:800; color:#2c3e50; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 8px; }
                .filter-group-title { font-weight:800; margin-top:12px; color:#718096; font-size:0.7rem; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; }
                .toggle-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem; color: #2d3748; font-weight: 600; }
                
                .switch { position: relative; display: inline-block; width: 34px; height: 18px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e0; transition: .3s; border-radius: 34px; }
                .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 2px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                input:checked + .slider { background-color: #48bb78; }
                input:checked + .slider:before { transform: translateX(16px); }
                .close-panel-btn { border:none; background:none; cursor:pointer; font-size:1.5rem; line-height:0.5; color: #a0aec0; transition: color 0.2s; }
                .close-panel-btn:hover { color: #e53e3e; }

                .dashboard-content-grid { padding: 0 20px; display: flex; flex-direction: column; gap: 15px; }
                
                /* KPIs */
                .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                .kpi-modern { border-radius: 16px; color: white; padding: 20px; position: relative; min-height: 130px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.3s ease; }
                .kpi-modern:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
                
                .blue-theme { background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%) !important; }
                .teal-theme { background: linear-gradient(135deg, #38b2ac 0%, #2c7a7b 100%) !important; }
                .orange-theme { background: linear-gradient(135deg, #ed8936 0%, #c05621 100%) !important; }

                .kpi-metric-huge { font-size: 2.8rem; font-weight: 800; line-height: 1; letter-spacing: -2px; }
                .kpi-top-label { font-size: 0.75rem; font-weight: 700; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.05em; }
                .icon-circle-glass { width: 56px; height: 56px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; }

                /* MAIN GRID ROWS */
                .dashboard-main-row-3col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                .dashboard-bottom-row { display: grid; grid-template-columns: 2fr 1fr; gap: 15px; }
                
                /* CARDS */
                .dashboard-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05); transition: all 0.2s; }
                .dashboard-card:hover { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
                
                .card-title-small { margin: 0 0 15px 0; font-size: 0.9rem; font-weight: 800; color: #2d3748; display: flex; align-items: center; gap: 8px; }
                .card-title-small::before { content: ''; width: 4px; height: 16px; background: #3182ce; border-radius: 2px; }

                /* CHART AREAS */
                .chart-area-main { height: 160px; width: 100%; position: relative; }
                .chart-area-h150 { height: 200px; width: 100%; position: relative; }
                .chart-container-pie { width: 110px; height: 110px; flex-shrink: 0; }

                /* LEGENDS */
                .legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.75rem; color: #4a5568; }
                .legend-column { display: flex; flex-direction: column; gap: 5px; font-size: 0.7rem; color: #4a5568; max-height: 140px; overflow-y: auto; padding-right: 5px; }
                .lg-item { display: flex; align-items: center; gap: 8px; font-weight: 600; white-space: nowrap; }
                .lg-item-small { display: flex; align-items: center; gap: 6px; font-weight: 500; }
                .lg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .lg-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                /* RESOURCES */
                .resources-grid-compact { display: grid; grid-template-columns: 1fr; gap: 10px; }
                .res-card-mini { display: flex; align-items: center; gap: 15px; padding: 12px 15px; background: #f7fafc; border-radius: 12px; border: 1px solid #edf2f7; }
                .res-icon { font-size: 1.5rem; }
                .res-data { display: flex; flex-direction: column; }
                .res-val { font-size: 1.25rem; font-weight: 800; color: #2d3748; line-height: 1; }
                .res-lbl { font-size: 0.75rem; font-weight: 600; color: #718096; }

                /* BADGES */
                .unassigned-badge { background: #fff5f5; color: #c53030; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; border: 1px solid #feb2b2; }
                .flex-between { display: flex; justify-content: space-between; align-items: center; width: 100%; }
                .no-data-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.85rem; color: #a0aec0; font-style: italic; }

                @media (max-width: 1200px) { 
                    .dashboard-main-row-3col { grid-template-columns: 1fr 1fr; }
                    .dashboard-bottom-row { grid-template-columns: 1fr; }
                }
                @media (max-width: 800px) {
                    .kpi-row, .dashboard-main-row-3col { grid-template-columns: 1fr; }
                }
            `}</style>
        </div >
    );
};
export default Dashboard;
