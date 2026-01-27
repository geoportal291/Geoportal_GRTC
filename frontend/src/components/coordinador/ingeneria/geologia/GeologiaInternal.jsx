import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../data/contexts/AuthContext';
import axiosInstance from '../../../../api/axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import GeologiaDashboardMap from './GeologiaDashboardMap';
import './geologia.css'; // Import new styles

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- Componente de Dashboard (Contenido de Resumen) ---
const ResumenDashboard = ({ projectId, projectData, stats, datasets, palette }) => {
    const [filters, setFilters] = useState({ muestras: true, fallas: true });
    const [showFilters, setShowFilters] = useState(true);

    const handleFilterChange = (key) => setFilters(prev => ({ ...prev, [key]: !prev[key] }));

    // Mock Map Data (Mover al padre si es necesario compartir)
    const mapData = {
        muestras: [
            { lat: -12.612858, lng: -72.537347, codigo: 'M-001' },
            { lat: -12.608985, lng: -72.535753, codigo: 'M-002' }
        ],
        fallas: [
            { lat: -12.602895, lng: -72.534466, codigo: 'F-01' }
        ]
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

    return (
        <div className="geo-dashboard-wrapper">
            {/* MAP SECTION */}
            <div className="geo-map-section">
                <div className="geo-map-container">
                    <GeologiaDashboardMap
                        projectId={projectId}
                        kmlUrl={projectData?.url_kml}
                        mapData={mapData}
                        filters={filters}
                    />
                </div>
                <button className="geo-filter-btn" onClick={() => setShowFilters(!showFilters)}>
                    <span>Capas</span>
                </button>
                {showFilters && (
                    <div className="geo-filter-panel animate-fade-in">
                        <div className="geo-filter-header">
                            <span>Control de Capas</span>
                            <button style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setShowFilters(false)}>×</button>
                        </div>
                        <div className="geo-filters-list">
                            {/* Reusing slider standard classes or needs replacement if totally isolated. 
                                For now, assuming basic checkbox is safer or copying slider styles to geologia.css if needed. 
                                Let's use simple inputs to be safe against conflict for now or stick to standard HTML */}

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Muestras</span>
                                    <input type="checkbox" checked={filters.muestras} onChange={() => handleFilterChange('muestras')} />
                                </label>
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Fallas/Pliegues</span>
                                    <input type="checkbox" checked={filters.fallas} onChange={() => handleFilterChange('fallas')} />
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* DASHBOARD KPIS */}
            <div className="geo-kpi-row">
                <div className="geo-kpi-card geo-theme-blue">
                    <div className="geo-kpi-label">MUESTRAS TOTALES</div>
                    <div className="geo-kpi-val">{stats.muestras}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Registradas en campo</div>
                </div>

                <div className="geo-kpi-card geo-theme-green">
                    <div className="geo-kpi-label">AVANCE ESTUDIO</div>
                    <div className="geo-kpi-val">{stats.avance}%</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Progreso estimado</div>
                </div>

                <div className="geo-kpi-card geo-theme-orange">
                    <div className="geo-kpi-label">PUNTOS CRÍTICOS</div>
                    <div className="geo-kpi-val">{stats.fallas}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Fallas geológicas</div>
                </div>
            </div>

            {/* CHARTS */}
            <div className="geo-charts-row">
                <div className="geo-chart-card">
                    <div className="geo-chart-title">Tipos de Muestras</div>
                    <div style={{ height: '200px' }}>
                        <Bar data={datasets.muestras} options={commonChartOptions} />
                    </div>
                </div>
                <div className="geo-chart-card">
                    <div className="geo-chart-title">Riesgo Geológico</div>
                    <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '150px' }}><Pie data={datasets.riesgos} options={{ ...commonChartOptions, plugins: { legend: { display: false } } }} /></div>
                    </div>
                </div>
                {/* Empty 3rd column for now or stretch */}
                <div className="geo-chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    <span>Info Adicional</span>
                </div>
            </div>
        </div>
    );
};

// --- Componente Placeholder para otras pestañas ---
const PlaceholderTab = ({ title }) => (
    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <h3>{title}</h3>
        <p>Módulo en desarrollo.</p>
    </div>
);

// --- COMPONENTE PRINCIPAL (Gestión Interna) ---
const GeologiaInternal = () => {
    const { selectedProjectId: projectId, user } = useAuth();
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('RESUMEN DEL PROYECTO');

    // List of Tabs
    const tabs = [
        'RESUMEN DEL PROYECTO',
        'MUESTRAS',
        'FALLAS GEOLÓGICAS',
        'ESTUDIOS',
        'MAPA DE RIESGOS'
    ];

    // Mock Stats
    const stats = { muestras: 150, fallas: 12, estudios: 5, avance: 35 };

    const palette = {
        blue: '#3498db', teal: '#1abc9c', orange: '#e67e22', purple: '#9b59b6',
        red: '#e74c3c', dark: '#34495e', grey: '#95a5a6'
    };

    const datasets = {
        muestras: {
            labels: ['Calicatas', 'Sondeos', 'Muestras Lab', 'Ensayos in situ'],
            datasets: [{
                label: 'Cantidad',
                data: [45, 12, 80, 13],
                backgroundColor: [palette.blue, palette.teal, palette.orange, palette.purple],
                borderRadius: 4, barThickness: 30
            }]
        },
        riesgos: {
            labels: ['Alto', 'Medio', 'Bajo'],
            datasets: [{ data: [5, 15, 30], backgroundColor: [palette.red, palette.orange, palette.teal], borderWidth: 1, borderColor: '#fff' }]
        }
    };

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

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando Geología...</div>;

    return (
        <div className="geo-container">
            {/* Tabs */}
            <div className="geo-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`geo-tab-button ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="geo-content-area">
                {activeTab === 'RESUMEN DEL PROYECTO' && (
                    <ResumenDashboard
                        projectId={projectId}
                        projectData={projectData}
                        stats={stats}
                        datasets={datasets}
                        palette={palette}
                    />
                )}
                {activeTab === 'MUESTRAS' && <PlaceholderTab title="Gestión de Muestras" />}
                {activeTab === 'FALLAS GEOLÓGICAS' && <PlaceholderTab title="Gestión de Fallas" />}
                {activeTab === 'ESTUDIOS' && <PlaceholderTab title="Estudios Geotécnicos" />}
                {activeTab === 'MAPA DE RIESGOS' && <PlaceholderTab title="Mapa de Riesgos" />}
            </div>
        </div>
    );
};

export default GeologiaInternal;
