import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../data/contexts/AuthContext';
import axiosInstance from '../../api/axios'; // Importar instancia de axios

export default function DashPrincipal() {
    const [activeTab, setActiveTab] = useState('tab1');
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();
    const { user, selectedProjectName, selectedProjectId } = useAuth();

    // Estados para KPIs
    const [kpiData, setKpiData] = useState({
        totalRecords: 0,
        teamCount: 0,
        alertCount: 0,
        activeSpecialties: 0,
        loading: false
    });

    const specialties = [
        { name: 'Tráfico', path: '/coordinador/ingenieria/trafico/trafico', icon: 'fa-car', status: 'Operativo', color: 'green', active: true, desc: 'Gestión de aforo y conteo' },
        { name: 'Inventario Vial', path: '/ingenieria/inventario-vial', icon: 'fa-road', status: 'Operativo', color: 'green', active: true, desc: 'Registro de elementos viales' },
        { name: 'Topografía', path: '/ingenieria/topografia', icon: 'fa-mountain', status: 'Próximamente', color: 'gray', active: false, desc: 'Levantamiento topográfico' },
        { name: 'Geología', path: '/ingenieria/geologia', icon: 'fa-hill-rockslide', status: 'En Trabajo', color: 'orange', active: false, desc: 'Estudios geológicos' },
        { name: 'Hidrología', path: '/ingenieria/hidrologia', icon: 'fa-water', status: 'Próximamente', color: 'gray', active: false, desc: 'Estudios hidrológicos' },
        { name: 'Seguridad Vial', path: '/ingenieria/seguridad-vial', icon: 'fa-shield-halved', status: 'Próximamente', color: 'gray', active: false, desc: 'Auditoría de seguridad' },
        { name: 'Mecánica de Suelos', path: '/coordinador/recoleccion-datos', icon: 'fa-layer-group', status: 'En Trabajo', color: 'orange', active: false, desc: 'Calicatas y ensayos' },
    ];

    // Fetch de datos para el Dashboard
    const fetchDashboardData = useCallback(async () => {
        if (!selectedProjectId) return;

        setKpiData(prev => ({ ...prev, loading: true }));
        try {
            // 1. Obtener conteos de registros (Volumen de datos)
            const trafficRes = await axiosInstance.get(`/api/elementos-trafico?proyectoId=${selectedProjectId}`);
            const stationsCount = trafficRes.data.filter(item => item.tipo === 'estacion').length;

            const [alcantarillas, badenes, puentes, muros, criticalZones, assignments] = await Promise.allSettled([
                axiosInstance.get(`/api/proyectos/${selectedProjectId}/alcantarillas`),
                axiosInstance.get(`/api/proyectos/${selectedProjectId}/badenes`),
                axiosInstance.get(`/api/puentes/by-project/${selectedProjectId}`),
                axiosInstance.get(`/api/muros/by-project/${selectedProjectId}`),
                axiosInstance.get(`/api/zonas-criticas/${selectedProjectId}`),
                axiosInstance.get(`/proyectos/${selectedProjectId}/assignments`)
            ]);

            const countVal = (res) => (res.status === 'fulfilled' && Array.isArray(res.value.data)) ? res.value.data.length : 0;

            const alcantarillasCount = countVal(alcantarillas);
            const badenesCount = countVal(badenes);
            const puentesCount = countVal(puentes);
            const murosCount = countVal(muros);

            const totalInventory = alcantarillasCount + badenesCount + puentesCount + murosCount;
            const totalAlerts = countVal(criticalZones);
            const totalRecords = totalInventory + stationsCount;
            const teamCount = countVal(assignments);

            // 2. Especialidades Activas
            const activeSpecialtiesCount = specialties.filter(s => s.status === 'Operativo').length;

            setKpiData({
                totalRecords: totalRecords,
                teamCount: teamCount,
                alertCount: totalAlerts,
                activeSpecialties: activeSpecialtiesCount,
                inventoryBreakdown: {
                    alcantarillas: alcantarillasCount,
                    badenes: badenesCount,
                    puentes: puentesCount,
                    muros: murosCount
                },
                loading: false
            });

        } catch (error) {
            console.error("Error cargando KPIs:", error);
            setKpiData(prev => ({ ...prev, loading: false }));
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Función para manejar el cambio de pestañas
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
    };

    const getColorClasses = (color) => {
        switch (color) {
            case 'green': return 'bg-green-100 text-green-700 border-green-200';
            case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'gray': return 'bg-gray-100 text-gray-500 border-gray-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white font-inter">
            {/* Header personalizado del diseño nuevo */}
            <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-8 shrink-0 z-20 shadow-sm relative">
                <div>
                    <div className="dashp-title-container flex flex-col justify-center gap-0">
                        <span className="dashp-subtitle text-gray-400 text-[10px] uppercase font-bold tracking-wider leading-none mb-1">PROYECTO ACTIVO</span>
                        <div className="flex items-center gap-3">
                            <div className="dashp-project-name font-bold text-gray-800 text-xl leading-none m-0 p-0">
                                {selectedProjectName || 'Sin Proyecto Asignado'}
                            </div>
                            <span className="dashp-status-badge px-3 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-bold border border-green-200 leading-tight">
                                {selectedProjectName ? 'En Ejecución' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 border-r border-gray-200 pr-6 relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-center relative"
                        >
                            <i className="fa-solid fa-bell text-lg"></i>
                            <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>

                        {/* Modal de Notificaciones */}
                        {showNotifications && (
                            <div className="absolute top-12 right-0 w-80 bg-white shadow-xl rounded-xl border border-gray-200 z-50 animate-fadeIn origin-top-right">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 text-sm">Notificaciones</h3>
                                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                    <div className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs">
                                            <i className="fa-solid fa-info"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-800 font-medium">Nueva actualización del sistema</p>
                                            <p className="text-xs text-gray-500">Hace 5 min</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start">
                                        <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 text-xs">
                                            <i className="fa-solid fa-triangle-exclamation"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-800 font-medium">Alerta de geología en Km 12+500</p>
                                            <p className="text-xs text-gray-500">Hace 2 horas</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center rounded-b-xl">
                                    <button className="text-blue-600 text-xs font-bold hover:underline">Ver todas</button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/coordinador/config/frmusuarios2')}
                            className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-center"
                        >
                            <i className="fa-solid fa-gear text-lg"></i>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-gray-50 transition" onClick={() => navigate('/perfil')}>
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white uppercase">
                            {user?.nombre?.substring(0, 2) || 'US'}
                        </div>
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-bold text-gray-800 leading-tight">
                                {user?.nombre || 'Usuario'} {user?.ap_paterno || ''}
                            </p>
                            <p className="text-xs text-gray-500">
                                {user?.rol_nombre || user?.rol || 'Rol Desconocido'}
                            </p>
                        </div>
                        <i className="fa-solid fa-chevron-down text-gray-400 text-xs ml-1"></i>
                    </div>
                </div>
            </header>

            {/* Área de Contenido Principal Común */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">

                {/* Barra de Pestañas */}
                <div className="bg-gray-50 border-b border-gray-200 px-8 pt-6 pb-0 shrink-0">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleTabChange('tab1')}
                            className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all relative top-[1px] z-10 ${activeTab === 'tab1'
                                ? 'bg-white text-blue-900 border-t border-l border-r border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                                : 'bg-gray-200 text-gray-500 border border-transparent hover:bg-gray-300 hover:text-gray-700'
                                }`}
                        >
                            Dash 1 (Actual)
                        </button>
                        <button
                            onClick={() => handleTabChange('tab2')}
                            className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all relative top-[1px] z-10 ${activeTab === 'tab2'
                                ? 'bg-white text-blue-900 border-t border-l border-r border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                                : 'bg-gray-200 text-gray-500 border border-transparent hover:bg-gray-300 hover:text-gray-700'
                                }`}
                        >
                            Dash 2 (Índice SPP)
                        </button>
                        <button
                            onClick={() => handleTabChange('tab3')}
                            className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all relative top-[1px] z-10 ${activeTab === 'tab3'
                                ? 'bg-white text-blue-900 border-t border-l border-r border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                                : 'bg-gray-200 text-gray-500 border border-transparent hover:bg-gray-300 hover:text-gray-700'
                                }`}
                        >
                            Geoportal Múltiple
                        </button>
                    </div>
                </div>

                {/* Contenido de las Pestañas */}
                <div className="flex-1 overflow-y-auto p-8 relative">

                    {/* Contenido TAB 1 */}
                    {activeTab === 'tab1' && (
                        <div className="space-y-8 animate-fadeIn">
                            {/* Tarjetas Superiores (Resumen Ejecutivo) */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Card 1: Registros Totales (Volumen) */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 hover:border-blue-300 transition group cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                                            Registros Totales
                                        </span>
                                        <i className="fa-solid fa-database text-gray-300 group-hover:text-blue-500 transition"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-bold text-gray-800">
                                            {kpiData.loading ? '...' : kpiData.totalRecords}
                                        </h3>
                                        <p className="text-xs text-blue-600 font-semibold mt-1">
                                            <i className="fa-solid fa-layer-group"></i> Datos recolectados
                                        </p>
                                    </div>
                                </div>

                                {/* Card 2: Especialidades Activas (Alcance) */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 hover:border-blue-300 transition group cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                                            Especialidades
                                        </span>
                                        <i className="fa-solid fa-list-check text-gray-300 group-hover:text-indigo-500 transition"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-bold text-gray-800">
                                            {kpiData.activeSpecialties} <span className="text-sm font-normal text-gray-400">/ {specialties.length}</span>
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium mt-1">Módulos operativos</p>
                                    </div>
                                </div>

                                {/* Card 3: Alertas Globales (Riesgo) */}
                                <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between h-32 cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-white text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                                            Alertas Globales
                                        </span>
                                        <i className="fa-solid fa-triangle-exclamation text-red-400 animate-pulse"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-bold text-red-700">
                                            {kpiData.loading ? '...' : kpiData.alertCount}
                                        </h3>
                                        <p className="text-xs text-red-600 font-medium mt-1">Incidencias críticas</p>
                                    </div>
                                </div>

                                {/* Card 4: Equipo (Personas) */}
                                <div
                                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 hover:border-blue-300 transition group cursor-pointer"
                                    onClick={() => navigate('/coordinador/config/frmusuarios2')}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide">
                                            Equipo
                                        </span>
                                        <i className="fa-solid fa-users text-gray-300 group-hover:text-emerald-500 transition"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-bold text-gray-800">
                                            {kpiData.teamCount}
                                        </h3>
                                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                                            <i className="fa-solid fa-user-check"></i> Usuarios asignados
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Columna Izquierda: Estado Operativo */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                <i className="fa-solid fa-server text-blue-600"></i>
                                                Estado Operativo por Especialidad
                                            </h2>
                                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                                Ver detalles <i className="fa-solid fa-arrow-right ml-1"></i>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {specialties.map((item, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => item.active && navigate(item.path)}
                                                    className={`flex items-center justify-between p-4 border rounded-xl transition bg-white ${item.active ? 'border-gray-200 hover:shadow-md cursor-pointer hover:border-blue-300' : 'border-gray-100 opacity-80 cursor-not-allowed bg-gray-50'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.active ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                            <i className={`fa-solid ${item.icon} text-lg`}></i>
                                                        </div>
                                                        <div>
                                                            <h3 className={`font-bold ${item.active ? 'text-gray-800' : 'text-gray-500'}`}>{item.name}</h3>
                                                            <p className="text-xs text-gray-400">{item.desc}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getColorClasses(item.color)}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Sección Inferior: Estado Operativo y Map Preview */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Resumen General del Proyecto (Sketch) */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                            <i className="fa-solid fa-chart-line text-blue-500"></i> Resumen del Proyecto
                                        </h3>

                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                            {/* Avance Físico */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-bold text-gray-700">Avance Físico</span>
                                                    <span className="text-sm font-bold text-blue-600">45%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 text-right">Programado: 48%</p>
                                            </div>

                                            {/* Avance Financiero */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-bold text-gray-700">Ejecución Financiera</span>
                                                    <span className="text-sm font-bold text-green-600">S/. 1,250,400</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '32%' }}></div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 text-right">Presupuesto Total: S/. 3,850,000</p>
                                            </div>

                                            {/* Tiempo - Días Transcurridos */}
                                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Tiempo Transcurrido</p>
                                                    <h4 className="text-lg font-bold text-gray-800">120 Días</h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Plazo Total</p>
                                                    <h4 className="text-lg font-bold text-gray-800">365 Días</h4>
                                                </div>
                                            </div>

                                            {/* Estado Actual */}
                                            <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                <p className="text-sm text-blue-700 font-medium">
                                                    <span className="font-bold">Estado:</span> En Ejecución - Sin paralizaciones reportadas.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Vista Previa Mapa */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-gray-700 text-sm">Vista Previa</h3>
                                        <span className="text-xs text-gray-400">
                                            <i className="fa-solid fa-location-dot"></i> Cusco, PE
                                        </span>
                                    </div>
                                    <div className="flex-1 rounded-lg overflow-hidden relative group bg-gray-100 min-h-[200px]">
                                        <div
                                            className="absolute inset-0 bg-cover opacity-60 grayscale group-hover:grayscale-0 transition duration-500"
                                            style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/OpenStreetMap_bicycling_layer.png/800px-OpenStreetMap_bicycling_layer.png')" }}
                                        ></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <button
                                                onClick={() => handleTabChange('tab3')}
                                                className="bg-white text-blue-600 px-4 py-2 rounded-lg shadow-lg font-bold text-sm hover:scale-105 transition flex items-center gap-2"
                                            >
                                                <i className="fa-solid fa-expand"></i> Abrir Visor
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contenido TAB 2: SPP */}
                    {activeTab === 'tab2' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-blue-900 flex items-center gap-3">
                                    <i className="fa-solid fa-book-open"></i> INDICE DE EXPEDIENTE ACUMULADO SPP
                                </h3>
                                <div className="relative">
                                    <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <i className="fa-solid fa-search absolute left-3 top-3 text-gray-400 text-xs"></i>
                                </div>
                            </div>

                            {/* Item Geoportal */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg mb-3 hover:bg-blue-100 transition cursor-pointer px-5 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <span className="bg-blue-200 text-blue-800 text-sm font-bold px-3 py-1 rounded">1.00</span>
                                    <i className="fa-solid fa-folder text-blue-500 text-lg"></i>
                                    <span className="font-bold text-gray-800">Geoportal</span>
                                </div>
                                <i className="fa-solid fa-chevron-right text-blue-400"></i>
                            </div>

                            {/* Item Topografía (Accordion) */}
                            <details className="group mb-3" open>
                                <summary className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition list-none">
                                    <div className="flex items-center gap-4">
                                        <span className="bg-blue-200 text-blue-800 text-sm font-bold px-3 py-1 rounded group-open:bg-blue-600 group-open:text-white transition">2.00</span>
                                        <i className="fa-solid fa-folder text-blue-500 text-lg"></i>
                                        <span className="font-bold text-gray-800">Topografía</span>
                                    </div>
                                    <i className="fa-solid fa-chevron-down text-blue-400 transition-transform group-open:rotate-180"></i>
                                </summary>
                                <div className="bg-white border-l-2 border-l-blue-500 border-r border-b border-gray-200 rounded-b-lg p-4 space-y-2 ml-2 mr-0 shadow-inner">
                                    <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded transition border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded">2.01</span>
                                            <span className="text-gray-700 font-medium">Memoria Descriptiva</span>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1">
                                            <i className="fa-solid fa-check"></i> Aprobado
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded transition">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded">2.02</span>
                                            <span className="text-gray-700 font-medium">Planos Generales</span>
                                        </div>
                                        <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded flex items-center gap-1">
                                            <i className="fa-solid fa-circle-exclamation"></i> Observado
                                        </span>
                                    </div>
                                </div>
                            </details>
                        </div>
                    )}

                    {/* Contenido TAB 3: Geoportal */}
                    {activeTab === 'tab3' && (
                        <div className="h-full animate-fadeIn">
                            <div className="flex h-[calc(100vh-220px)] border border-gray-300 rounded-xl overflow-hidden shadow-lg relative bg-slate-100">
                                <div className="absolute inset-0 bg-cover" style={{ backgroundImage: "url('https://tile.openstreetmap.org/14/4690/10321.png')" }}></div>
                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-xl p-4 w-64 border border-gray-200">
                                    <h4 className="font-bold text-gray-700 border-b pb-2 mb-2 text-sm">Capas</h4>
                                    <label className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="text-blue-600 rounded" /> Curvas de Nivel
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="text-blue-600 rounded" /> Eje de Vía
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
