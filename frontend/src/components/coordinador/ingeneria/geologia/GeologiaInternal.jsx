import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../../data/contexts/AuthContext';
import axiosInstance from '../../../../api/axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import GeologiaDashboardMap from './GeologiaDashboardMap';
import GeologiaGeoite from './map/GeologiaGeoite';
import './geologia.css';

import GeologiaTab from './tabs/GeologiaTab';
import GeomorfologiaTab from './tabs/GeomorfologiaTab';
import GeologiaEstructuralTab from './tabs/GeologiaEstructuralTab';
import GeodinamicaInternaTab from './tabs/GeodinamicaInternaTab';
import GeodinamicaExternaTab from './tabs/GeodinamicaExternaTab';
import GeotecniaCanterasTab from './tabs/GeotecniaCanterasTab';
import GeotecniaPuentesTab from './tabs/GeotecniaPuentesTab';
import AnalisisEstabilidadTaludesTab from './tabs/AnalisisEstabilidadTaludesTab';
import GeotecniaMurosCimentacionesTab from './tabs/GeotecniaMurosCimentacionesTab';
import ClasificacionMaterialesTab from './tabs/MuestrasTab';
import PanelFotograficoTab from './tabs/PanelFotograficoTab';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const formatTabName = (name) => {
    if (!name) return 'Capa';
    const niceNames = {
        'geologia_local': 'Geología Local',
        'geomorfologia': 'Geomorfología',
        'geologiaestructural': 'Geología Estructural',
        'geodinamicainterna': 'Geodinámica Interna',
        'geodinamicaexterna': 'Geodinámica Externa',
        'geotecnia_canteras': 'Geotecnia de Canteras',
        'geotecnia_puentes': 'Geotecnia de Puentes',
        'estabilidad_taludes': 'Estabilidad de Taludes',
        'muros_cimentaciones': 'Muros y Cimentaciones'
    };
    return niceNames[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// --- Componente de Dashboard (Contenido de Resumen) ---
const ResumenDashboard = ({ projectId, projectData }) => {
    const [capas, setCapas] = useState([]);
    const [filters, setFilters] = useState({});
    const [showFilters, setShowFilters] = useState(true);
    const [materiales, setMateriales] = useState([]);
    const [muestras, setMuestras] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            if (!projectId) return;
            setLoadingData(true);
            try {
                const [capasRes, matRes, muestrasRes] = await Promise.all([
                    axiosInstance.get(`/api/proyectos/${projectId}/geologia-capas`).catch(() => ({ data: { data: [] } })),
                    axiosInstance.get(`/api/proyectos/${projectId}/clasificacion-materiales`).catch(() => ({ data: [] })),
                    axiosInstance.get(`/api/proyectos/${projectId}/geologia-muestras`).catch(() => ({ data: [] })),
                ]);
                if (capasRes.data?.data) {
                    setCapas(capasRes.data.data);
                    const initFilters = {};
                    capasRes.data.data.forEach(c => { initFilters[c.tab_name] = true; });
                    setFilters(initFilters);
                }
                setMateriales(Array.isArray(matRes.data) ? matRes.data : []);
                setMuestras(Array.isArray(muestrasRes.data) ? muestrasRes.data : []);
            } catch (err) {
                console.error("Error cargando datos del dashboard geológico", err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchAll();
    }, [projectId]);

    const handleFilterChange = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

    // --- Calcular stats reales desde materiales ---
    const matStats = React.useMemo(() => {
        let rfTotal = 0, rsTotal = 0, msTotal = 0, longTotal = 0;
        materiales.forEach(r => {
            rfTotal += parseFloat(r.long_roca_fija) || 0;
            rsTotal += parseFloat(r.long_roca_suelta) || 0;
            msTotal += parseFloat(r.long_material_suelto) || 0;
        });
        longTotal = rfTotal + rsTotal + msTotal;
        return { tramos: materiales.length, rfTotal, rsTotal, msTotal, longTotal };
    }, [materiales]);

    // --- Contar muestras por tipo ---
    const muestrasPorTipo = React.useMemo(() => {
        const counts = {};
        muestras.forEach(m => {
            const tipo = m.tipo_roca || 'Sin clasificar';
            counts[tipo] = (counts[tipo] || 0) + 1;
        });
        return counts;
    }, [muestras]);

    // --- Calcular avance: capas subidas / 9 tabs disponibles ---
    const avance = React.useMemo(() => {
        const totalTabs = 9;
        const subidas = capas.length;
        return Math.min(100, Math.round((subidas / totalTabs) * 100));
    }, [capas]);

    const palette = {
        blue: '#3498db', teal: '#1abc9c', orange: '#e67e22', purple: '#9b59b6',
        red: '#e74c3c', dark: '#1e293b', grey: '#95a5a6'
    };

    const doughnutOptions = {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(15,23,42,0.92)', padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: '600' }, bodyFont: { size: 11 } }
        }
    };

    const barOptions = {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(15,23,42,0.92)', padding: 10, cornerRadius: 8 }
        },
        scales: {
            x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10, family: "'Inter', sans-serif" } } },
            y: { grid: { display: false }, ticks: { font: { size: 11, family: "'Inter', sans-serif", weight: '600' }, color: '#334155' } }
        }
    };

    // --- Datasets dinámicos ---
    const materialesChartData = {
        labels: ['Roca Fija', 'Roca Suelta', 'Mat. Suelto'],
        datasets: [{
            data: [matStats.rfTotal, matStats.rsTotal, matStats.msTotal],
            backgroundColor: ['#334155', '#3b82f6', '#f59e0b'],
            hoverBackgroundColor: ['#1e293b', '#2563eb', '#d97706'],
            borderWidth: 3, borderColor: '#fff', borderRadius: 4
        }]
    };

    const tiposMuestras = Object.keys(muestrasPorTipo);
    const coloresMuestras = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899', '#ef4444', '#8b5cf6'];
    const muestrasChartData = {
        labels: tiposMuestras.length > 0 ? tiposMuestras : ['Sin datos'],
        datasets: [{
            label: 'Cantidad',
            data: tiposMuestras.length > 0 ? tiposMuestras.map(t => muestrasPorTipo[t]) : [0],
            backgroundColor: tiposMuestras.map((_, i) => coloresMuestras[i % coloresMuestras.length]),
            borderRadius: 6, barThickness: 22, borderSkipped: false
        }]
    };

    // Material detail items
    const materialItems = [
        { label: 'Roca Fija', key: 'RF', value: matStats.rfTotal, color: '#334155', icon: 'fa-gem' },
        { label: 'Roca Suelta', key: 'RS', value: matStats.rsTotal, color: '#3b82f6', icon: 'fa-cubes' },
        { label: 'Mat. Suelto', key: 'MS', value: matStats.msTotal, color: '#f59e0b', icon: 'fa-water' },
    ];

    return (
        <div className="geolint-dashboard-wrapper">
            {/* MAPA */}
            <div className="geolint-map-section">
                <div className="geolint-map-container">
                    <GeologiaGeoite
                        projectId={projectId}
                        section="geologia"
                        height="500px"
                        activeLayersFilter={Object.keys(filters).filter(k => filters[k]).map(k => formatTabName(k))}
                    />
                </div>
                <button className="geolint-filter-btn" onClick={() => setShowFilters(!showFilters)}>
                    <span>Capas</span>
                </button>
                {showFilters && (
                    <div className="geolint-filter-panel animate-fade-in">
                        <div className="geolint-filter-header">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-layer-group" style={{ color: '#3b82f6' }}></i> Control de Capas
                            </span>
                            <button style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setShowFilters(false)} title="Cerrar"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="geotech-layer-body geolint-filters-list" style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '8px' }}>
                            {capas.length === 0 && <div style={{ fontSize: '12px', color: '#666', padding: '10px' }}>No hay capas subidas.</div>}
                            {capas.map(capa => (
                                <div key={capa.id} className="geotech-layer-item" style={{ marginBottom: '8px' }}>
                                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', cursor: 'pointer', flex: 1, gap: '12px' }}>
                                        <input type="checkbox" checked={!!filters[capa.tab_name]} onChange={() => handleFilterChange(capa.tab_name)} />
                                        <span title={capa.file_name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{formatTabName(capa.tab_name)}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* KPIs PREMIUM */}
            <div className="geodash-kpi-grid">
                <div className="geodash-kpi">
                    <div className="geodash-kpi-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                        <i className="fas fa-road"></i>
                    </div>
                    <div className="geodash-kpi-info">
                        <span className="geodash-kpi-label">Tramos Clasificados</span>
                        <span className="geodash-kpi-value">{matStats.tramos}</span>
                        <span className="geodash-kpi-sub">Clasificación de materiales</span>
                    </div>
                </div>
                <div className="geodash-kpi">
                    <div className="geodash-kpi-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        <i className="fas fa-ruler-horizontal"></i>
                    </div>
                    <div className="geodash-kpi-info">
                        <span className="geodash-kpi-label">Longitud Total</span>
                        <span className="geodash-kpi-value">{matStats.longTotal.toFixed(0)}<small>m</small></span>
                        <span className="geodash-kpi-sub">RF: {matStats.rfTotal.toFixed(0)}m · RS: {matStats.rsTotal.toFixed(0)}m · MS: {matStats.msTotal.toFixed(0)}m</span>
                    </div>
                </div>
                <div className="geodash-kpi">
                    <div className="geodash-kpi-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        <i className="fas fa-vials"></i>
                    </div>
                    <div className="geodash-kpi-info">
                        <span className="geodash-kpi-label">Muestras</span>
                        <span className="geodash-kpi-value">{muestras.length}</span>
                        <span className="geodash-kpi-sub">Registradas en campo</span>
                    </div>
                </div>
                <div className="geodash-kpi">
                    <div className="geodash-kpi-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <i className="fas fa-layer-group"></i>
                    </div>
                    <div className="geodash-kpi-info">
                        <span className="geodash-kpi-label">Capas Geológicas</span>
                        <span className="geodash-kpi-value">{capas.length}<small>/9</small></span>
                        <div className="geodash-kpi-progress-bar">
                            <div className="geodash-kpi-progress-fill" style={{ width: `${avance}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* GRÁFICOS PREMIUM — 2 columnas */}
            <div className="geodash-charts-grid">
                {/* Distribución de Materiales — Doughnut grande */}
                <div className="geodash-chart-card">
                    <div className="geodash-chart-header">
                        <div>
                            <h3 className="geodash-chart-title">Distribución de Materiales</h3>
                            <p className="geodash-chart-sub">Longitud por tipo de material (m)</p>
                        </div>
                    </div>
                    {matStats.longTotal > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '8px 0' }}>
                            <div style={{ width: '160px', height: '160px', flexShrink: 0 }}>
                                <Pie data={materialesChartData} options={doughnutOptions} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                {materialItems.map(item => {
                                    const pct = matStats.longTotal > 0 ? ((item.value / matStats.longTotal) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: '13px' }}></i>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                                    <span style={{ fontWeight: 600, color: '#334155' }}>{item.label}</span>
                                                    <span style={{ fontWeight: 700, color: item.color }}>{item.value.toFixed(1)}m</span>
                                                </div>
                                                <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '6px', marginTop: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, background: item.color, height: '100%', borderRadius: '6px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{pct}% del total</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="geodash-empty-state">
                            <i className="fas fa-mountain"></i>
                            <span>Sube un Excel de clasificación para ver la distribución</span>
                        </div>
                    )}
                </div>

                {/* Muestras por tipo */}
                <div className="geodash-chart-card">
                    <div className="geodash-chart-header">
                        <div>
                            <h3 className="geodash-chart-title">Muestras por Tipo de Roca</h3>
                            <p className="geodash-chart-sub">Cantidad por categoría de muestra</p>
                        </div>
                        {muestras.length > 0 && (
                            <span className="geodash-chart-badge">{muestras.length} total</span>
                        )}
                    </div>
                    <div style={{ height: '200px' }}>
                        {muestras.length > 0 ? (
                            <Bar data={muestrasChartData} options={barOptions} />
                        ) : (
                            <div className="geodash-empty-state">
                                <i className="fas fa-vials"></i>
                                <span>No hay muestras registradas</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};



// --- Definición de grupos de tabs ---
const TAB_GROUPS = [
    {
        label: 'RESUMEN',
        single: true,
        tab: 'RESUMEN DEL PROYECTO',
    },
    {
        label: 'GEOLOGÍA',
        tabs: [
            { label: 'Geología', key: 'GEOLOGIA' },
            { label: 'Geomorfología', key: 'GEOMORFOLOGIA' },
            { label: 'Geología Estructural', key: 'GEOLOGIA ESTRUCTURAL' },
            { label: 'Clas. Materiales', key: 'CLAS_MATERIALES' },
        ],
    },
    {
        label: 'GEODINÁMICA',
        tabs: [
            { label: 'Geodinámica Interna', key: 'GEODINAMICA INTERNA' },
            { label: 'Geodinámica Externa', key: 'GEODINAMICA EXTERNA' },
        ],
    },
    {
        label: 'GEOTECNIA',
        tabs: [
            { label: 'Geotecnia de Canteras', key: 'GEOTECNIA DE CANTERAS' },
            { label: 'Geotecnia de Puentes', key: 'GEOTECNIA DE PUENTES' },
            { label: 'Estabilidad de Taludes', key: 'ANALISIS DE ESTABILIDAD DE TALUDES' },
            { label: 'Geotecnia de Muros', key: 'GEOTECNIA DE MUROS Y CIMENTACIONES' },
        ],
    },
    {
        label: 'PANEL FOTOGRÁFICO',
        single: true,
        tab: 'PANEL_FOTOGRAFICO',
    },
];

// --- Componente de Tabs Agrupados con Dropdown (Portal) ---
const GroupedTabs = ({ activeTab, setActiveTab }) => {
    const [openGroup, setOpenGroup] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const containerRef = useRef(null);
    const groupRefs = useRef({});

    const handleGroupClick = (group, label) => {
        if (group.single) {
            setActiveTab(group.tab);
            setOpenGroup(null);
        } else {
            if (openGroup === label) {
                setOpenGroup(null);
            } else {
                const el = groupRefs.current[label];
                if (el) {
                    const rect = el.getBoundingClientRect();
                    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
                }
                setOpenGroup(label);
            }
        }
    };

    const handleSubTabClick = (key) => {
        setActiveTab(key);
        setOpenGroup(null);
    };

    const isGroupActive = (group) => {
        if (group.single) return activeTab === group.tab;
        return group.tabs?.some(t => t.key === activeTab);
    };

    const getActiveSubLabel = (group) => {
        const found = group.tabs?.find(t => t.key === activeTab);
        return found ? found.label : null;
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            const dropdownEl = document.getElementById('geolint-portal-dropdown');
            const isInsideContainer = containerRef.current && containerRef.current.contains(e.target);
            const isInsideDropdown = dropdownEl && dropdownEl.contains(e.target);
            if (!isInsideContainer && !isInsideDropdown) {
                setOpenGroup(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="geolint-grouped-tabs" ref={containerRef}>
            {TAB_GROUPS.map(group => {
                const active = isGroupActive(group);
                const subLabel = !group.single ? getActiveSubLabel(group) : null;
                const isOpen = openGroup === group.label;

                return (
                    <div
                        key={group.label}
                        ref={el => groupRefs.current[group.label] = el}
                        className={`geolint-tab-group ${active ? 'active' : ''} ${isOpen ? 'open' : ''}`}
                        onClick={() => handleGroupClick(group, group.label)}
                    >
                        <div className="geolint-tab-group-btn">
                            <span className="geolint-tab-group-label">
                                {group.label}
                                {subLabel && <span className="geolint-tab-group-sub"> › {subLabel}</span>}
                            </span>
                            {!group.single && (
                                <span className={`geolint-tab-group-arrow ${isOpen ? 'up' : ''}`}>▾</span>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Dropdown via Portal — escapa del stacking context del layout */}
            {openGroup && createPortal(
                <div
                    id="geolint-portal-dropdown"
                    className="geolint-tab-dropdown"
                    style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left }}
                    onMouseDown={e => e.stopPropagation()}
                >
                    {TAB_GROUPS.find(g => g.label === openGroup)?.tabs?.map(t => (
                        <button
                            key={t.key}
                            className={`geolint-tab-dropdown-item ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => handleSubTabClick(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const GeologiaInternal = () => {
    const { selectedProjectId: projectId } = useAuth();
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('RESUMEN DEL PROYECTO');

    useEffect(() => {
        const fetchProjectData = async () => {
            if (!projectId) return;
            try {
                setLoading(true);
                const projRes = await axiosInstance.get(`/api/proyectos/${projectId}`);
                setProjectData(projRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error loading geology data", err);
                setLoading(false);
            }
        };
        fetchProjectData();
    }, [projectId]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Cargando Geología...
        </div>
    );

    return (
        <div className="geolint-container">
            <GroupedTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="geolint-content-area">
                {activeTab === 'RESUMEN DEL PROYECTO' && (
                    <ResumenDashboard
                        projectId={projectId}
                        projectData={projectData}
                    />
                )}
                {activeTab === 'GEOLOGIA' && <GeologiaTab projectData={projectData} />}
                {activeTab === 'GEOMORFOLOGIA' && <GeomorfologiaTab projectData={projectData} />}
                {activeTab === 'GEOLOGIA ESTRUCTURAL' && <GeologiaEstructuralTab projectData={projectData} />}
                {activeTab === 'GEODINAMICA INTERNA' && <GeodinamicaInternaTab projectData={projectData} />}
                {activeTab === 'GEODINAMICA EXTERNA' && <GeodinamicaExternaTab projectData={projectData} />}
                {activeTab === 'GEOTECNIA DE CANTERAS' && <GeotecniaCanterasTab projectData={projectData} />}
                {activeTab === 'GEOTECNIA DE PUENTES' && <GeotecniaPuentesTab projectData={projectData} />}
                {activeTab === 'ANALISIS DE ESTABILIDAD DE TALUDES' && <AnalisisEstabilidadTaludesTab projectData={projectData} />}
                {activeTab === 'GEOTECNIA DE MUROS Y CIMENTACIONES' && <GeotecniaMurosCimentacionesTab projectData={projectData} />}
                {activeTab === 'CLAS_MATERIALES' && <ClasificacionMaterialesTab projectData={projectData} />}
                {activeTab === 'PANEL_FOTOGRAFICO' && <PanelFotograficoTab projectData={projectData} />}
            </div>
        </div>
    );
};

export default GeologiaInternal;
