
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../api/axios';
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
                const projRes = await axiosInstance.get(`/proyectos/${projectId}`);
                setProjectData(projRes.data);
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
                borderRadius: 4, barThickness: 20
            }]
        },
        zc: {
            labels: zcLabels,
            datasets: [{ data: zcValues, backgroundColor: [palette.orange, '#d35400', '#c0392b'], borderWidth: 0 }]
        },
        senales: {
            labels: ['Informativas', 'Preventivas', 'Hitos'],
            datasets: [{ data: [senalizacion?.informativas || 0, senalizacion?.preventivas || 0, senalizacion?.hitos || 0], backgroundColor: [palette.teal, palette.orange, palette.dark], borderWidth: 1, borderColor: '#fff' }]
        },
        entregables: {
            labels: entLabels,
            datasets: [{ label: 'Elementos', data: entValues, backgroundColor: palette.teal, borderRadius: 4, barThickness: 15 }]
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
                    {/* KPI 1: LONGITUD */}
                    <div className="kpi-modern blue-theme">
                        <div className="kpi-flex-row">
                            <div className="kpi-content-main">
                                <div className="kpi-top-label">LONGITUD TOTAL</div>
                                <div className="kpi-metric-huge">
                                    {(kpis?.totalCalibratedKm || 0)}<span className="kpi-unit-small">km</span>
                                </div>
                                <div className="kpi-sub-text">Max Progresiva: {(kpis?.maxRegisteredMeters / 1000).toFixed(2)} km</div>
                            </div>
                            <div className="kpi-visual-container">
                                <div className="icon-circle-glass">🌐</div>
                            </div>
                        </div>
                        <div className="kpi-progress-bar-container">
                            <div className="kpi-progress-track">
                                <div className="kpi-progress-fill" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* KPI 2: AVANCE */}
                    <div className="kpi-modern teal-theme">
                        <div className="kpi-flex-row">
                            <div className="kpi-content-main">
                                <div className="kpi-top-label">AVANCE GEOGRÁFICO</div>
                                <div className="kpi-metric-huge">
                                    {kpis?.avanceGeograficoPct || 0}<span className="kpi-unit-small">%</span>
                                </div>
                                <div className="kpi-sub-text">Progreso del proyecto</div>
                            </div>
                            <div className="kpi-visual-container">
                                <svg width="64" height="64" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="30" cy="30" r="26" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                                    <circle cx="30" cy="30" r="26" stroke="white" strokeWidth="6" fill="none" strokeDasharray={163} strokeDashoffset={163 - ((kpis?.avanceGeograficoPct || 0) / 100) * 163} strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* KPI 3: ELEMENTOS */}
                    <div className="kpi-modern orange-theme">
                        <div className="kpi-flex-row">
                            <div className="kpi-content-main">
                                <div className="kpi-top-label">TOTAL ELEMENTOS</div>
                                <div className="kpi-metric-huge">
                                    {kpis?.totalElementos || 0}
                                </div>
                                <div className="kpi-sub-text-list">
                                    <span>• {activos?.alcantarillas + activos?.badenes + activos?.puentes + activos?.muros || 0} Obras</span>
                                    <span>• {senalizacion?.informativas + senalizacion?.preventivas + senalizacion?.hitos || 0} Señales</span>
                                </div>
                            </div>
                            <div className="kpi-visual-container" style={{ width: '60px', height: '60px' }}>
                                <Doughnut data={{ labels: ['Obs', 'Señ'], datasets: [{ data: [70, 30], backgroundColor: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.3)'], borderWidth: 0, cutout: '75%' }] }} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2: Activos / Zonas */}
                <div className="charts-row-1">
                    <div className="dashboard-card compact-chart-card wide">
                        <h5 className="card-title-small">Distribución de Activos</h5>
                        <div className="chart-area-h120">
                            <Bar data={datasets.activos} options={commonChartOptions} />
                        </div>
                    </div>
                    <div className="dashboard-card compact-chart-card narrow">
                        <h5 className="card-title-small">Estado de Zonas Críticas</h5>
                        <div className="chart-area-h120 flex-center">
                            {zcValues.length > 0 ? (
                                <div style={{ width: '90px', height: '90px', flexShrink: 0 }}>
                                    <Pie data={datasets.zc} options={{ ...commonChartOptions, plugins: { legend: { display: false } } }} />
                                </div>
                            ) : <span className="no-data-text">Sin datos</span>}
                            <div className="legend-vertical scrollable-legend">
                                {datasets.zc.labels.map((l, i) => (
                                    <div key={i} className="legend-item" title={l}>
                                        <span className="dot" style={{ background: datasets.zc.datasets[0].backgroundColor[i], flexShrink: 0 }}></span>
                                        <span className="legend-text">{l}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 3: Bottom Cols */}
                <div className="charts-row-2">
                    <div className="dashboard-card compact-chart-card">
                        <h5 className="card-title-small" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Distribución por Entregable
                            {hasUnassigned && (
                                <span className="warning-badge" title={Object.entries(debug_unassigned).map(([k, v]) => `${k}: ${v}`).join('\n')}>
                                    ⚠️ {unassignedCount} Sin Asignar
                                </span>
                            )}
                        </h5>
                        <div className="chart-area-h120" style={{ position: 'relative' }}>
                            <Bar data={datasets.entregables} options={{ ...commonChartOptions, indexAxis: 'y' }} />
                            {hasUnassigned && (
                                <div className="unassigned-breakdown-overlay">
                                    <div className="ub-title">Detalle Sin Asignar:</div>
                                    <div className="ub-list">
                                        {Object.entries(debug_unassigned).map(([key, val]) => (
                                            <div key={key} className="ub-item"><span>{key}:</span> <strong>{val}</strong></div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="dashboard-card compact-chart-card">
                        <h5 className="card-title-small">Tipos de Señales</h5>
                        <div className="chart-area-h120 flex-center">
                            <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                                <Pie data={datasets.senales} options={{ ...commonChartOptions, plugins: { legend: { display: false } } }} />
                            </div>
                            <div className="legend-vertical">
                                <div className="legend-item"><span className="dot-teal"></span> Inf: {senalizacion?.informativas}</div>
                                <div className="legend-item"><span className="dot-orange"></span> Prev: {senalizacion?.preventivas}</div>
                                <div className="legend-item"><span className="dot-dark" style={{ background: '#34495e' }}></span> Hit: {senalizacion?.hitos}</div>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-card compact-chart-card">
                        <h5 className="card-title-small">Recursos</h5>
                        <div className="resources-list-compact">
                            <div className="res-item-compact"><div className="icon-box-small">⛰️</div><div className="res-info"><span className="res-num">{recursos?.canteras || 0}</span><span className="res-name">Canteras</span></div></div>
                            <div className="res-item-compact"><div className="icon-box-small">💧</div><div className="res-info"><span className="res-num">{recursos?.fuentes || 0}</span><span className="res-name">Fuentes</span></div></div>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .invvial-dashboard-wrapper { padding: 0; background-color: #f0f2f5; display: flex; flex-direction: column; gap: 10px; font-family: 'Inter', sans-serif; }
                .invvial-map-section { position: relative; width: 100%; height: 50vh; min-height: 400px; border-radius: 0 0 12px 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
                .map-card-container { width: 100%; height: 100%; }
                .filter-toggle-btn { position: absolute; top: 15px; right: 15px; background: white; border-radius: 8px; border:none; display:flex; align-items:center; gap: 8px; padding: 8px 12px; cursor:pointer; color:#333; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:2002; font-weight: 600; font-size: 0.85rem; transition: transform 0.2s; }
                .filter-toggle-btn:hover { transform: translateY(-2px); }
                .filter-panel { position: absolute; top: 60px; right: 15px; width: 220px; max-height: calc(100% - 80px); overflow-y: auto; padding: 15px; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); border-radius: 12px; font-size: 0.75rem; z-index:2001; box-shadow:0 8px 32px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.5); animation: fadeIn 0.3s ease; }
                /* Custom Scrollbar for panel */
                .filter-panel::-webkit-scrollbar { width: 4px; }
                .filter-panel::-webkit-scrollbar-track { background: transparent; }
                .filter-panel::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
                @keyframes fadeIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
                .filter-header { display:flex; justify-content:space-between; margin-bottom:10px; font-weight:700; color:#2c3e50; text-transform: uppercase; letter-spacing: 0.5px; }
                .close-panel-btn { border:none; background:none; cursor:pointer; font-size:1.2rem; line-height:0.5; color: #999; }
                .filter-group-title { font-weight:bold; margin-top:8px; color:#7f8c8d; font-size:0.7rem; letter-spacing: 0.5px; margin-bottom: 4px; }
                .toggle-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.85rem; color: #34495e; }
                .switch { position: relative; display: inline-block; width: 20px; height: 12px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #bdc3c7; transition: .2s; border-radius: 34px; }
                .slider:before { position: absolute; content: ""; height: 8px; width: 8px; left: 2px; bottom: 2px; background-color: white; transition: .2s; border-radius: 50%; }
                input:checked + .slider { background-color: #3498db; }
                input:checked + .slider:before { transform: translateX(8px); }
                
                /* GRID */
                .dashboard-content-grid { padding: 0 15px 15px 15px; display: flex; flex-direction: column; gap: 10px; }
                .kpi-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
                
                /* KPI NEW PREMIUM STYLES */
                .kpi-modern { border-radius: 12px; color: white; padding: 16px; position: relative; min-height: 120px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s; }
                .kpi-modern:hover { transform: translateY(-2px); }
                .blue-theme { background: linear-gradient(135deg, #2980b9, #2c3e50) !important; }
                .teal-theme { background: linear-gradient(135deg, #1abc9c, #16a085) !important; }
                .orange-theme { background: linear-gradient(135deg, #e67e22, #d35400) !important; }

                .kpi-flex-row { display: flex; justify-content: space-between; align-items: center; width: 100%; height: 100%; }
                .kpi-content-main { display: flex; flex-direction: column; z-index: 2; }
                .kpi-top-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; font-weight: 700; margin-bottom: 2px; }
                .kpi-metric-huge { font-size: 2.6rem; font-weight: 800; line-height: 1.1; letter-spacing: -1px; text-shadow: 0 2px 10px rgba(0,0,0,0.15); }
                .kpi-unit-small { font-size: 1rem; font-weight: 500; margin-left: 2px; opacity: 0.8; }
                .kpi-sub-text { font-size: 0.7rem; opacity: 0.8; margin-top: 4px; font-weight: 500; }
                .kpi-sub-text-list { display:flex; flex-direction:column; font-size:0.65rem; opacity:0.85; margin-top:4px; gap:2px; }

                .kpi-visual-container { display: flex; align-items: center; justify-content: center; z-index: 1; }
                .icon-circle-glass { width: 50px; height: 50px; background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 1px solid rgba(255,255,255,0.2); }
                
                .kpi-progress-bar-container { margin-top: 10px; width: 100%; }
                .kpi-progress-track { background: rgba(255,255,255,0.2); height: 6px; border-radius: 3px; overflow: hidden; }
                .kpi-progress-fill { background: rgba(255,255,255,0.95); height: 100%; border-radius: 3px; box-shadow: 0 0 10px rgba(255,255,255,0.5); }

                .teal-theme { background: linear-gradient(135deg, #16a085, #1abc9c) !important; }
                .orange-theme { background: linear-gradient(135deg, #d35400, #e67e22) !important; }

                .kpi-top { display: flex; justify-content: space-between; font-size: 0.65rem; font-weight: 700; opacity: 0.9; margin-bottom: 5px; }
                .kpi-big-num { font-size: 1.8rem; font-weight: 700; line-height: 1; }
                .kpi-unit { font-size: 0.8rem; margin-left: 5px; opacity: 0.8; }
                .progresiva-info { display:flex; justify-content:space-between; font-size:0.65rem; margin-bottom:4px; margin-top:5px; }
                .linear-progress-bg { background: rgba(255,255,255,0.2); height: 5px; border-radius:3px; overflow:hidden; }
                .linear-progress-fill { background: #3498db; height: 100%; }
                .kpi-mid-radial { display: flex; align-items: center; justify-content: space-between; }
                .radial-circle { width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; }
                .mini-map-placeholder { width: 70px; height: 40px; opacity: 0.6; }
                .kpi-mid-row { display: flex; align-items: center; gap: 8px; }
                .kpi-donut-container { position: relative; width: 50px; height: 50px; }
                .donut-center-text { position: absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:0.7rem; font-weight:bold; }
                .kpi-list-right { font-size: 0.65rem; }
                .kpi-list-item { margin-bottom: 2px; display:flex; align-items:center; gap:4px; }
                .dot-white { width:5px; height:5px; background:white; border-radius:50%; }
                .dot-white-50 { width:5px; height:5px; background:rgba(255,255,255,0.5); border-radius:50%; }

                /* CHARTS */
                .charts-row-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; }
                .charts-row-2 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
                .dashboard-card { background: white; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); padding: 10px; }
                .card-title-small { margin: 0 0 8px 0; font-size: 0.8rem; color: #333; border-left: 3px solid #3498db; padding-left: 6px; font-weight: 700; }
                .chart-area-h120 { height: 120px; position:relative; width: 100%; overflow: hidden; }
                .flex-center { display: flex; align-items: center; justify-content: center; gap: 8px; }
                .legend-vertical { display: flex; flex-direction: column; gap: 2px; font-size: 0.7rem; color: #666; overflow-y: auto; max-height: 110px; }
                .legend-item { display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
                .legend-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .dot { width: 6px; height: 6px; border-radius: 50%; }
                .dot-teal { background: #1abc9c; } .dot-orange { background: #e67e22; }
                .resources-list-compact { display: flex; flex-direction: column; gap: 6px; }
                .res-item-compact { display: flex; align-items: center; gap: 8px; background: #f9f9f9; padding: 6px; border-radius: 6px; }
                .icon-box-small { width: 26px; height: 26px; background: #e1e4e8; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
                .res-info { display: flex; flex-direction: column; line-height: 1; overflow: hidden; }
                .res-num { font-weight: 700; color: #333; font-size: 0.85rem; }
                .res-name { font-size: 0.65rem; color: #777; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                
                .warning-badge { background: #f1c40f; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; cursor:help; }
                .unassigned-breakdown-overlay { position: absolute; right: 0; top: 0; background: rgba(255,255,255,0.95); padding: 5px; border: 1px solid #eee; border-radius: 4px; font-size: 0.65rem; max-height: 100%; overflow-y: auto; box-shadow: -2px 2px 5px rgba(0,0,0,0.1); pointer-events: none; }
                .ub-title { font-weight: bold; margin-bottom: 2px; color: #e74c3c; border-bottom: 1px solid #eee; }
                .ub-list { display: flex; flex-direction: column; gap: 1px; }
                .ub-item { display: flex; justify-content: space-between; gap: 8px; color: #555; }
                
                @media (max-width: 1000px) { .kpi-row, .charts-row-1, .charts-row-2 { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
};
export default Dashboard;
