import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import { useAuth } from '@/data/contexts/AuthContext';
import axiosInstance from '@/api/axios';
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

const SECTION_COLORS = {
    'geomorfologia': '#af52de',
    'geologia_local': '#ffcc00',
    'geologiaestructural': '#ff3b30',
    'geodinamicainterna': '#ff2d55',
    'geodinamicaexterna': '#ff9500',
    'geotecnia_canteras': '#34c759',
    'geotecnia_puentes': '#007aff',
    'estabilidad_taludes': '#f43f5e',
    'muros_cimentaciones': '#0ea5e9',
    'clas_materiales': '#6366f1',
    'hidrologia': '#06b6d4',
    'otros': '#94a3b8'
};

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
    const [allLayers, setAllLayers] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [geoData, setGeoData] = useState(null);
    const [editingLayerId, setEditingLayerId] = useState(null);
    const [editTempName, setEditTempName] = useState('');

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
                    const layersData = capasRes.data.data;
                    setCapas(layersData);
                    setAllLayers(layersData);
                    const initFilters = {};
                    layersData.forEach(c => { initFilters[c.tab_name] = true; });
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

    // --- ANALISIS POR ESPECIALIDAD (Agregación de GeoJSON) ---
    const resumenEspecialidades = useMemo(() => {
        const groupData = {};
        const targetProps = ['UNIDAD', 'LITOLOGIA', 'unidad', 'litologia', 'Unidad', 'Litologia', 'GEOMORFO', 'geomorfo', 'TIPO_SUELO', 'tipo_suelo', 'PELIGRO', 'RIESGO', 'riesgo', 'ESTRUCTURA'];

        allLayers.forEach(l => {
            try {
                const gdata = typeof l.geojson_data === 'string' ? JSON.parse(l.geojson_data) : l.geojson_data;
                if (gdata?.features) {
                    const tabName = l.tab_name || 'Otros';
                    if (!groupData[tabName]) groupData[tabName] = { count: 0, units: {} };

                    gdata.features.forEach(f => {
                        groupData[tabName].count++;
                        const props = f.properties || {};
                        for (const pName of targetProps) {
                            if (props[pName]) {
                                const u = String(props[pName]).trim();
                                if (u) {
                                    groupData[tabName].units[u] = (groupData[tabName].units[u] || 0) + 1;
                                    break;
                                }
                            }
                        }
                    });
                }
            } catch (e) { console.warn("Error en resumen especialidad:", e); }
        });

        return Object.entries(groupData).map(([tab, data]) => {
            let topUnit = 'N/A';
            let max = 0;
            Object.entries(data.units).forEach(([u, count]) => {
                if (count > max) { max = count; topUnit = u; }
            });
            return { tab, count: data.count, topUnit };
        });
    }, [allLayers]);

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

    // --- DETECCIÓN DE MUESTRAS (Combinar API + GeoJSON) ---
    const muestrasCalculadas = useMemo(() => {
        let mc = [...muestras];
        
        // Escaneo global de todas las capas del proyecto (allLayers)
        allLayers.forEach(l => {
            try {
                const gdata = typeof l.geojson_data === 'string' ? JSON.parse(l.geojson_data) : l.geojson_data;
                if (gdata?.features) {
                    gdata.features.forEach(f => {
                        const props = f.properties || {};
                        const lowerTab = (l.tab_name || props._layer_tab || '').toLowerCase();
                        const lowerName = (props.name || props.nombre || props.id || '').toString().toLowerCase();
                        
                        // Patrones más amplios de muestras técnicas
                        const isSamplePattern = 
                            lowerName.startsWith('s-') || lowerName.startsWith('p-') || 
                            lowerName.startsWith('m-') || lowerName.startsWith('c-') ||
                            lowerName.startsWith('s') && !isNaN(lowerName.substring(1,2)) ||
                            lowerName.startsWith('p') && !isNaN(lowerName.substring(1,2)) ||
                            lowerName.startsWith('ma-') || lowerName.startsWith('st-') ||
                            lowerName.startsWith('tp-') || lowerName.startsWith('cal-') ||
                            lowerName.startsWith('c') && !isNaN(lowerName.substring(1,2)) ||
                            lowerName.includes('muestra') || lowerName.includes('calicata') ||
                            lowerName.includes('sondaje') || lowerName.includes('investig');

                        const isGeotechTab = 
                            lowerTab.includes('material') || lowerTab.includes('muestr') || 
                            lowerTab.includes('calicata') || lowerTab.includes('geotec') ||
                            lowerTab.includes('investig') || lowerTab.includes('sondaje') ||
                            lowerTab.includes('cantera');

                        // Si es un Punto y tiene propiedades de identificación o pertenece a una capa técnica
                        if (f.geometry?.type === 'Point' && (
                            isGeotechTab || isSamplePattern || props.PUNTO || props.CODIGO || props.MUESTRA
                        )) {
                            let discoveredCode = props.CODIGO || props.PUNTO || props.name || props.nombre || props.id;
                            
                            // Si no hay nombre directo, buscar un valor que parezca un ID técnico en cualquier propiedad
                            if (!discoveredCode) {
                                for (const val of Object.values(props)) {
                                    if (typeof val === 'string' && val.length < 15 && /^(s|p|c|m|ma|st|tp|cal)-?\d+/i.test(val)) {
                                        discoveredCode = val;
                                        break;
                                    }
                                }
                            }

                            const code = (discoveredCode || `P-${Math.floor(Math.random()*9000)+1000}`).toString();
                            const exists = mc.some(existing => existing.codigo === code);
                            
                            if (!exists && code && code !== 'undefined') {
                                mc.push({
                                    id: `auto-${f.id || Math.random()}`,
                                    codigo: code,
                                    progresiva: props.PROGRESIVA || props.KILOMETRAJE || props.KM || props.PROG || props.PROG_INI || '-',
                                    tipo_roca: props.TIPO || props.UNIDAD || props.desc || props.TIPO_MUESTRA || props.MATERIAL || (lowerTab.includes('calicata') ? 'Calicata' : 'Muestra'),
                                    latitud: f.geometry.coordinates[1],
                                    longitud: f.geometry.coordinates[0],
                                    norte: props.NORTE || props.NORTHING || props.Y || props.LAT || '',
                                    este: props.ESTE || props.EASTING || props.X || props.LON || '',
                                    cota: props.COTA || props.ELEVATION || props.Z || props.ALTITUDE || '',
                                    isAuto: true
                                });
                            }
                        }
                    });
                }
            } catch (e) { console.warn("Error procesando capa para resumen:", e); }
        });

        // Complementar con geoData (por si hay algo cargado localmente no persistido aún)
        if (geoData?.features) {
            geoData.features.forEach(f => {
                const props = f.properties || {};
                const name = (props.name || props.nombre || props.id || 'M-POI').toString();
                if (f.geometry?.type === 'Point' && !mc.some(m => m.codigo === name)) {
                    // Solo añadir si es una muestra obvia
                    if (name.toLowerCase().startsWith('s-') || name.toLowerCase().startsWith('p-') || props.CODIGO) {
                        mc.push({
                            codigo: name,
                            progresiva: props.PROGRESIVA || props.KILOMETRAJE || props.KM || '-',
                            tipo_roca: props.TIPO || props.UNIDAD || props.desc || 'Muestra',
                            isAuto: true
                        });
                    }
                }
            });
        }
        return mc;
    }, [muestras, allLayers, geoData]);

    // --- Contar muestras por tipo ---
    const muestrasPorTipo = React.useMemo(() => {
        const counts = {};
        muestrasCalculadas.forEach(m => {
            const tipo = m.tipo_roca || 'Sin clasificar';
            counts[tipo] = (counts[tipo] || 0) + 1;
        });
        return counts;
    }, [muestrasCalculadas]);

    // --- Calcular avance: capas subidas / 11 tabs disponibles ---
    const avance = useMemo(() => {
        const totalTabs = 11;
        const subidas = capas.length;
        return Math.min(100, Math.round((subidas / totalTabs) * 100));
    }, [capas]);

    // --- Memoizar filtros activos para evitar ciclos de renderizado en el mapa ---
    const activeLayersFilter = useMemo(() => {
        return Object.keys(filters)
            .filter(k => filters[k])
            .map(k => formatTabName(k));
    }, [filters]);

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

    const handlePrintReport = () => {
        const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const nombrePrj = projectData?.nombre || 'GEOPORTAL';

        // ---- LEYENDA TÉCNICA (Basada en especialidades reales detectadas) ----
        const leyendaHtml = Object.entries(SECTION_COLORS).map(([key, color]) => {
            // Unificar coincidencia (incluye o es igual a la clave)
            const count = capas.filter(c => {
                const tab = (c.tab_name || '').toLowerCase();
                const normKey = key.toLowerCase();
                return tab === normKey || tab.includes(normKey.replace(/ /g, '')) || normKey.includes(tab);
            }).length;

            if (count === 0 && !resumenEspecialidades.some(r => r.tab.toLowerCase().includes(key.toLowerCase()))) return '';
            
            return `<div style="display:flex;align-items:center;gap:8px;font-size:11px;margin-bottom:6px">
                <div style="width:13px;height:13px;background:${color};border-radius:3px;border:1px solid rgba(0,0,0,0.2);flex-shrink:0"></div>
                <span style="font-weight:600;flex:1">${formatTabName(key)}</span>
                <span style="font-size:10px;color:#64748b;font-weight:700">${count} capa${count !== 1 ? 's' : ''}</span>
            </div>`;
        }).filter(Boolean).join('');

        // ---- DETECCIÓN DE MUESTRAS (Combinado anterior en componente) ----
        // Ya calculamos muestrasCalculadas arriba en el componente
        const totalLong = matStats.longTotal || 0;
        const totalRF = matStats.rfTotal || 0;
        const totalRS = matStats.rsTotal || 0;
        const totalMS = matStats.msTotal || 0;
        const pctRF = totalLong > 0 ? ((totalRF / totalLong) * 100).toFixed(0) : 0;
        const pctRS = totalLong > 0 ? ((totalRS / totalLong) * 100).toFixed(0) : 0;
        const pctMS = totalLong > 0 ? ((totalMS / totalLong) * 100).toFixed(0) : 0;

        // ---- MUESTRAS POR TIPO ----
        const tiposMuestra = {};
        muestrasCalculadas.forEach(m => { const t = m.tipo_roca || 'Sin tipo'; tiposMuestra[t] = (tiposMuestra[t] || 0) + 1; });
        const muestrasPorTipoHtml = Object.entries(tiposMuestra).length > 0
            ? Object.entries(tiposMuestra).map(([tipo, cnt]) => 
                `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:11px">
                    <span style="font-weight:600">${tipo}</span>
                    <span style="background:#af52de;color:white;border-radius:10px;padding:1px 8px;font-size:10px;font-weight:800">${cnt}</span>
                </div>`).join('')
            : '<p style="color:#94a3b8;font-size:11px;padding:10px 0">Sin muestras detectadas</p>';

        const html = `<!DOCTYPE html><html lang="es"><head>
        <meta charset="UTF-8">
        <title>Reporte Geología - ${nombrePrj}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background:#f1f5f9; color:#0f172a; }
            .toolbar { background:#1e3a8a; color:white; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:99; }
            .btn-print { background:#af52de; color:white; border:none; border-radius:8px; padding:10px 24px; font-size:13px; font-weight:800; cursor:pointer; }
            .page { width:210mm; margin:20px auto 40px; background:white; padding:16mm; box-shadow:0 4px 24px rgba(0,0,0,0.12); border-radius:10px; }
            .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:15px; border-bottom:3px solid #1e3a8a; margin-bottom:22px; }
            h1 { font-size:20px; color:#1e3a8a; font-weight:900; }
            .header-right { text-align:right; font-size:11px; color:#64748b; }
            .header-right strong { color:#1e3a8a; font-size:12px; display:block; }
            .kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:24px; }
            .kpi { border:1px solid #e2e8f0; padding:12px; border-radius:8px; text-align:center; }
            .kpi-label { font-size:8px; font-weight:800; color:#64748b; text-transform:uppercase; }
            .kpi-value { font-size:20px; font-weight:900; margin-top:4px; }
            h3 { font-size:12px; color:#1e3a8a; border-left:4px solid #1e3a8a; padding-left:10px; margin:22px 0 10px; font-weight:800; text-transform:uppercase; }
            .card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin-top:10px; }
            .two-col { display:grid; grid-template-columns:1fr 1fr; gap:15px; }
            .dist-bar { height:10px; border-radius:5px; margin-top:5px; display:flex; overflow:hidden; }
            .dist-seg { height:100%; }
            table { width:100%; border-collapse:collapse; font-size:10px; margin-top:8px; }
            thead th { background:#1e3a8a; color:white; padding:7px 8px; text-align:left; font-size:9px; font-weight:800; }
            tbody td { padding:5px 8px; border-bottom:1px solid #f1f5f9; }
            tbody tr:nth-child(even) td { background:#f8fafc; }
            .totals-row td { background:#e0f2fe !important; font-weight:800; color:#0369a1; border-top:2px solid #0369a1; }
            .footer { text-align:center; font-size:9px; color:#94a3b8; margin-top:30px; padding-top:12px; border-top:1px solid #e2e8f0; }
            @media print {
                @page { size:A4 portrait; margin:8mm; }
                .toolbar { display:none !important; }
                body { background:white !important; }
                .page { box-shadow:none !important; margin:0 !important; border-radius:0 !important; padding:0 !important; width:100% !important; }
            }
        </style>
        </head><body>
        <div class="toolbar">
            <div>
                <span style="font-weight:800">📋 Informe Técnico Geológico - GRTC</span>
                <div style="font-size:10px; opacity:0.8; margin-top:2px">PROYECTO: ${nombrePrj} · ${fecha} ${hora}</div>
            </div>
            <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        </div>
        <div class="page">
            <div class="header">
                <div>
                    <h1>INFORME TÉCNICO: GEOLOGÍA Y GEOTECNIA</h1>
                    <div style="font-size:12px;color:#64748b;margin-top:4px">Proyecto: <strong style="color:#1e3a8a">${nombrePrj}</strong></div>
                </div>
                <div class="header-right">
                    <strong>SUBDIRECCIÓN DE INGENIERÍA - GRTC</strong>
                    Generado el ${fecha}
                </div>
            </div>

            <div class="kpis">
                <div class="kpi">
                    <div class="kpi-label">Longitud Total</div>
                    <div class="kpi-value" style="color:#0f172a">${totalLong.toFixed(0)}<span style="font-size:10px;color:#94a3b8"> m</span></div>
                </div>
                <div class="kpi">
                    <div class="kpi-label">Avance</div>
                    <div class="kpi-value" style="color:#34c759">${avance}%</div>
                </div>
                <div class="kpi">
                    <div class="kpi-label">Muestras</div>
                    <div class="kpi-value" style="color:#af52de">${muestrasCalculadas.length}</div>
                </div>
                <div class="kpi">
                    <div class="kpi-label">Capas Cargadas</div>
                    <div class="kpi-value" style="color:#007aff">${capas.length}<span style="font-size:10px;color:#94a3b8">/11</span></div>
                </div>
                <div class="kpi">
                    <div class="kpi-label">Registros</div>
                    <div class="kpi-value" style="color:#ff9500">${materiales.length}</div>
                </div>
            </div>

            <div class="two-col">
                <div class="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:8px;text-transform:uppercase">Distribución de Materiales</div>
                    <div class="dist-bar">
                        <div class="dist-seg" style="width:${pctRF}%;background:#1e3a8a"></div>
                        <div class="dist-seg" style="width:${pctRS}%;background:#007aff"></div>
                        <div class="dist-seg" style="width:${pctMS}%;background:#ff9500"></div>
                    </div>
                    <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
                        <div style="font-size:9px"><span style="color:#1e3a8a;font-weight:900">●</span> RF: ${pctRF}%</div>
                        <div style="font-size:9px"><span style="color:#007aff;font-weight:900">●</span> RS: ${pctRS}%</div>
                        <div style="font-size:9px"><span style="color:#ff9500;font-weight:900">●</span> MS: ${pctMS}%</div>
                    </div>
                </div>
                <div className="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:8px;text-transform:uppercase">Análisis por Especialidad</div>
                    <div style="font-size:10px;color:#334155">
                        ${resumenEspecialidades.map(r => `
                            <div style="display:flex;justify-content:space-between;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:2px">
                                <span style="font-weight:700">${formatTabName(r.tab)}:</span>
                                <span>${r.count} elem. · <small style="color:#64748b">${r.topUnit}</small></span>
                            </div>
                        `).join('')}
                        ${resumenEspecialidades.length === 0 ? '<p style="color:#94a3b8">Buscando datos...</p>' : ''}
                    </div>
                </div>
                <div className="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:8px;text-transform:uppercase">Inventario de Capas</div>
                    ${leyendaHtml}
                </div>
            </div>

            <h3>Clasificación Detallada de Materiales</h3>
            <div class="card" style="padding:0;overflow:hidden">
                <table>
                    <thead><tr>
                        <th>PROGRESIVA</th><th>TRAMO (m)</th><th>ROCA FIJA (m)</th><th>ROCA SUELTA (m)</th><th>MAT. SUELTO (m)</th><th>CLASIFICACIÓN</th>
                    </tr></thead>
                    <tbody>
                        ${materiales.map(m => `<tr>
                            <td>${m.prog_inicio || '-'} - ${m.prog_fin || ''}</td>
                            <td>${parseFloat(m.tramo_m || 0).toFixed(1)}</td>
                            <td>${parseFloat(m.long_roca_fija || 0).toFixed(1)}</td>
                            <td>${parseFloat(m.long_roca_suelta || 0).toFixed(1)}</td>
                            <td>${parseFloat(m.long_material_suelto || 0).toFixed(1)}</td>
                            <td style="font-weight:600">${m.simbolo || m.clasificacion || '-'}</td>
                        </tr>`).join('')}
                        ${materiales.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:15px">Sin datos de materiales registrados</td></tr>' : ''}
                        <tr class="totals-row">
                            <td>TOTALES</td>
                            <td>${totalLong.toFixed(1)}</td>
                            <td>${totalRF.toFixed(1)}</td>
                            <td>${totalRS.toFixed(1)}</td>
                            <td>${totalMS.toFixed(1)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- MUESTRAS AL FINAL (GLOBALES) -->
            <h3>Muestras de Campo y Geotecnia</h3>
            <div class="two-col">
                <div class="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:8px;text-transform:uppercase">Registro de Muestras (Auto-detectadas)</div>
                    <div style="max-height: 480px; overflow-y: auto;">
                        <table>
                            <thead><tr><th>CÓDIGO</th><th>PROGRESIVA</th><th>TIPO/DESCRIPCIÓN</th></tr></thead>
                            <tbody>
                                ${muestrasCalculadas.length > 0 
                                    ? muestrasCalculadas.map(m => `<tr>
                                        <td style="font-weight:700; color:#1e293b">${m.codigo || m.id || '-'} ${m.isAuto ? '<small style="color:#94a3b8;font-weight:normal">(Capa)</small>' : ''}</td>
                                        <td style="color:#2563eb; font-weight:600">${m.progresiva || '-'}</td>
                                        <td><span style="font-size:9px; background:#f1f5f9; padding:2px 5px; border-radius:4px">${m.tipo_roca || '-'}</span></td>
                                    </tr>`).join('')
                                    : '<tr><td colspan="3" style="text-align:center;color:#94a3b8;padding:25px; font-style:italic;">No se han detectado muestras en las capas del proyecto.</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card">
                    <div style="font-size:11px;font-weight:800;color:#1e3a8a;margin-bottom:8px;text-transform:uppercase">Resumen Técnico de Muestreo</div>
                    ${muestrasPorTipoHtml}
                    ${muestrasCalculadas.length > 0 ? `<div style="margin-top:20px; padding-top:10px; border-top:1px solid #e2e8f0; font-size:10px; color:#64748b">Total de puntos de investigación detectados: <b>${muestrasCalculadas.length}</b></div>` : ''}
                </div>
            </div>

            <p class="footer">
                Documento generado automáticamente por SISTEMA GEOPORTAL · GRTC · ${fecha} · ${hora}<br>
                Este informe es de carácter técnico y para uso institucional interno.
            </p>
        </div>
        </body></html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 15000);
    };

    const handleSaveRename = async (layer) => {
        if (!editTempName || !editTempName.trim()) {
            setEditingLayerId(null);
            return;
        }
        try {
            const resp = await axiosInstance.patch(`/api/proyectos/${projectId}/geologia-capas/${layer.tab_name}/rename`, {
                newName: editTempName.trim()
            });
            if (resp.data.status === 'success') {
                setCapas(prev => prev.map(c => c.id === layer.id ? { ...c, file_name: editTempName.trim() } : c));
                alertify.success('Capa renombrada');
            }
        } catch (err) {
            console.error(err);
            alertify.error('Error al renombrar');
        } finally {
            setEditingLayerId(null);
        }
    };

    const handleEditDriveLink = async (layer) => {
        const nextUrl = window.prompt(
            `Pega el enlace de la carpeta para "${layer.file_name}".\n\nDeja vacío para quitarlo.`,
            layer.drive_url || ''
        );

        if (nextUrl === null) return;

        try {
            const resp = await axiosInstance.patch(`/api/proyectos/${projectId}/geologia-capas/${layer.tab_name}/drive-link`, {
                driveUrl: nextUrl.trim()
            });

            if (resp.data.status === 'success') {
                const updatedLayer = resp.data.data;
                setCapas(prev => prev.map(c => c.id === layer.id ? { ...c, drive_url: updatedLayer.drive_url } : c));
                setAllLayers(prev => prev.map(c => c.id === layer.id ? { ...c, drive_url: updatedLayer.drive_url } : c));
                alertify.success(updatedLayer.drive_url ? 'Carpeta actualizada' : 'Carpeta eliminada');
            }
        } catch (err) {
            console.error(err);
            alertify.error('Error al guardar carpeta');
        }
    };


    return (
        <div className="geolint-dashboard-wrapper">
            <div className="geolint-map-section">
                <div className="geolint-map-container" style={{ position: 'relative' }}>
                    <GeologiaGeoite
                        projectId={projectId}
                        section="geologia"
                        height="500px"
                        onGeoDataLoaded={setGeoData}
                    />

                    {/* BOTÓN REPORTE PDF (RELOCALIZADO DENTRO DEL MAPA) */}
                    <button 
                        onClick={handlePrintReport} 
                        className="geodash-print-btn" 
                        title="Generar Reporte PDF Profesional"
                        style={{ 
                            position: 'absolute', 
                            bottom: '25px', 
                            left: '60px', /* En la esquina inferior izquierda, al costado de los controles de Leaflet */
                            zIndex: 1000, 
                            background: '#af52de', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '50px', 
                            padding: '10px 20px', 
                            fontWeight: 800, 
                            fontSize: '11px',
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            boxShadow: '0 4px 15px rgba(175,82,222,0.4)',
                            transition: 'transform 0.2s',
                            pointerEvents: 'auto'
                        }}
                    >
                        <i className="fa-solid fa-file-pdf"></i> Reporte PDF
                    </button>

                    <button className={`geolint-filter-btn ${showFilters ? 'active' : ''}`} style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 1000 }} onClick={() => setShowFilters(!showFilters)}>
                        <i className="fas fa-filter" style={{ marginRight: '6px' }}></i>
                        <span>Filtrar Capas</span>
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
                                {capas.map(capa => (
                                    <div key={capa.id} className="geotech-layer-item" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={!!filters[capa.tab_name]} 
                                            onChange={() => handleFilterChange(capa.tab_name)} 
                                            style={{ cursor: 'pointer' }}
                                        />
                                        
                                        {editingLayerId === capa.id ? (
                                            <input 
                                                autoFocus
                                                type="text"
                                                value={editTempName}
                                                onChange={(e) => setEditTempName(e.target.value)}
                                                onBlur={() => handleSaveRename(capa)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveRename(capa);
                                                    if (e.key === 'Escape') setEditingLayerId(null);
                                                }}
                                                style={{ 
                                                    fontSize: '12px', 
                                                    padding: '2px 6px', 
                                                    border: '1px solid #3b82f6', 
                                                    borderRadius: '4px', 
                                                    width: '100%',
                                                    outline: 'none'
                                                }}
                                            />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
                                                <span 
                                                    title={capa.file_name} 
                                                    style={{ 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap', 
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        color: '#334155'
                                                    }}
                                                >
                                                    {capa.file_name}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleEditDriveLink(capa);
                                                        }}
                                                        style={{ 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            padding: '4px', 
                                                            color: capa.drive_url ? '#f59e0b' : '#94a3b8', 
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        title={capa.drive_url ? 'Actualizar carpeta de Drive' : 'Asignar carpeta de Drive'}
                                                    >
                                                        <i className="fa-solid fa-folder-open" style={{ fontSize: '11px' }}></i>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setEditingLayerId(capa.id);
                                                            setEditTempName(capa.file_name);
                                                        }}
                                                        style={{ 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            padding: '4px', 
                                                            color: '#94a3b8', 
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        title="Renombrar capa"
                                                    >
                                                        <i className="fa-solid fa-pen" style={{ fontSize: '11px' }}></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
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
                        <span className="geodash-kpi-value">{muestrasCalculadas.length}</span>
                        <span className="geodash-kpi-sub">Registradas en campo</span>
                    </div>
                </div>
                <div className="geodash-kpi">
                    <div className="geodash-kpi-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <i className="fas fa-layer-group"></i>
                    </div>
                    <div className="geodash-kpi-info">
                        <span className="geodash-kpi-label">Capas Geológicas</span>
                        <span className="geodash-kpi-value">{capas.length}<small>/11</small></span>
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
                {/* Muestras por tipo — Columna Derecha */}
                <div className="geodash-chart-card">
                    <div className="geodash-chart-header">
                        <div>
                            <h3 className="geodash-chart-title">Muestras por Tipo de Roca</h3>
                            <p className="geodash-chart-sub">Cantidad por categoría de muestra</p>
                        </div>
                        {muestrasCalculadas.length > 0 && (
                            <span className="geodash-chart-badge">{muestrasCalculadas.length} total</span>
                        )}
                    </div>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {muestrasCalculadas.length > 0 ? (
                            <Bar data={muestrasChartData} options={barOptions} />
                        ) : (
                            <div className="geodash-empty-state">
                                <i className="fas fa-vials"></i>
                                <span>No hay muestras registradas en este proyecto</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TABLA RESUMEN DE CAPAS — Ancho completo debajo de los gráficos */}
            <div className="geodash-chart-card" style={{ padding: '0', overflow: 'hidden', marginTop: '14px' }}>
                <div className="geodash-chart-header" style={{ padding: '20px 20px 10px 20px' }}>
                    <div>
                        <h3 className="geodash-chart-title">Inventario de Información Base</h3>
                        <p className="geodash-chart-sub">Listado de capas geológicas y carpetas técnicas procesadas</p>
                    </div>
                    <span className="geodash-chart-badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                        {capas.length} capas online
                    </span>
                </div>
                <div style={{ padding: '0 20px 20px 20px' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '500px' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 10px', color: '#64748b', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Especialidad / Categoría</th>
                                    <th style={{ textAlign: 'left', padding: '12px 10px', color: '#64748b', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Archivo Fuente</th>
                                    <th style={{ textAlign: 'center', padding: '12px 10px', color: '#64748b', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Elementos</th>
                                    <th style={{ textAlign: 'left', padding: '12px 10px', color: '#64748b', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unidad Predominante</th>
                                    <th style={{ textAlign: 'center', padding: '12px 10px', color: '#64748b', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {capas.length > 0 ? capas.map(c => {
                                    const meta = resumenEspecialidades.find(r => r.tab === c.tab_name);
                                    return (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', fontWeight: '600', color: '#334155' }}>
                                                <i className="fas fa-folder-open" style={{ marginRight: '8px', color: '#94a3b8', fontSize: '12px' }}></i>
                                                {formatTabName(c.tab_name)}
                                            </td>
                                            <td style={{ padding: '10px', color: '#64748b', fontSize: '0.78rem', fontFamily: 'monospace' }}>{c.file_name}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#1e293b' }}>
                                                {meta ? meta.count : '...'}
                                            </td>
                                            <td style={{ padding: '10px', color: '#475569', fontSize: '0.8rem', fontWeight: '500' }}>
                                                {meta ? meta.topUnit : 'Analizando...'}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <span style={{ 
                                                    background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: '800', border: '1px solid #bbf7d0',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    <i className="fas fa-check-circle" style={{ marginRight: '4px' }}></i> ONLINE
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', marginBottom: '8px', display: 'block', opacity: 0.5 }}></i>
                                                No se han detectado capas procesadas en la base de datos.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
            { label: 'Muestras y Clasif.', key: 'CLAS_MATERIALES' },
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
