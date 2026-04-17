import React, { useState, useEffect, useRef, useMemo } from 'react';
import axiosInstance from '../../../../../api/axios';
import { useAuth } from '../../../../../data/contexts/AuthContext';
import GeologiaGeoite from '../map/GeologiaGeoite';
import GeologiaLayerManager from '../map/GeologiaLayerManager';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import './GeologiaTab.css';
import './MuestrasTab.css';

const ClasificacionMaterialesTab = ({ projectData }) => {
    const { user } = useAuth();
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [isInfoExpanded, setIsInfoExpanded] = useState(false);
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [geoData, setGeoData] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        prog_inicio: '', prog_fin: '', descripcion_geotecnica: '', simbolo: '', tramo_m: '',
        pct_roca_fija: '', pct_roca_suelta: '', pct_material_suelto: '', corte_talud: '',
        long_roca_fija: '', long_roca_suelta: '', long_material_suelto: '', porcentaje: '',
        grupo_formacion: '', descripcion_detallada: ''
    });

    const isAdmin = user?.rol_nombre === 'ADMIN' || user?.rol_nombre === 'COORDINADOR';

    useEffect(() => { fetchData(); }, [projectData]);

    const fetchData = async () => {
        if (!projectData?.id) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/api/proyectos/${projectData.id}/clasificacion-materiales`);
            setRegistros(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('archivo', file);

        try {
            const res = await axiosInstance.post(
                `/api/proyectos/${projectData.id}/clasificacion-materiales/upload-excel`,
                formDataUpload,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            alertify.success(`✅ ${res.data.count} registros importados desde Excel`);
            fetchData();
        } catch (error) {
            console.error(error);
            alertify.error('Error al procesar el archivo Excel');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('¿Está seguro de eliminar TODOS los registros de clasificación de materiales?')) return;
        try {
            await axiosInstance.delete(`/api/proyectos/${projectData.id}/clasificacion-materiales`);
            alertify.success('Todos los registros eliminados');
            fetchData();
        } catch (error) {
            console.error(error);
            alertify.error('Error al eliminar registros');
        }
    };

    const handleDeleteOne = async (id) => {
        if (!window.confirm('¿Eliminar este registro?')) return;
        try {
            await axiosInstance.delete(`/api/proyectos/${projectData.id}/clasificacion-materiales/${id}`);
            alertify.success('Registro eliminado');
            fetchData();
        } catch (error) {
            console.error(error);
            alertify.error('Error al eliminar');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post(`/api/proyectos/${projectData.id}/clasificacion-materiales`, formData);
            alertify.success('Registro agregado');
            setShowAddModal(false);
            setFormData({
                prog_inicio: '', prog_fin: '', descripcion_geotecnica: '', simbolo: '', tramo_m: '',
                pct_roca_fija: '', pct_roca_suelta: '', pct_material_suelto: '', corte_talud: '',
                long_roca_fija: '', long_roca_suelta: '', long_material_suelto: '', porcentaje: '',
                grupo_formacion: '', descripcion_detallada: ''
            });
            fetchData();
        } catch (error) {
            console.error(error);
            alertify.error('Error al guardar registro');
        }
    };

    // Helper to get color badge for material type
    const getMaterialBadge = (desc) => {
        const d = (desc || '').toLowerCase();
        if (d.includes('roca fija')) return { bg: '#1e293b', text: 'RF', label: 'Roca Fija' };
        if (d.includes('roca suelta')) return { bg: '#3b82f6', text: 'RS', label: 'Roca Suelta' };
        if (d.includes('material suelto')) return { bg: '#f59e0b', text: 'MS', label: 'Material Suelto' };
        return { bg: '#94a3b8', text: '?', label: desc || '-' };
    };

    // Summary stats
    const stats = useMemo(() => {
        if (registros.length === 0) return null;
        let totalTramo = 0;
        let rfTotal = 0, rsTotal = 0, msTotal = 0;
        registros.forEach(r => {
            totalTramo += parseFloat(r.tramo_m) || 0;
            rfTotal += parseFloat(r.long_roca_fija) || 0;
            rsTotal += parseFloat(r.long_roca_suelta) || 0;
            msTotal += parseFloat(r.long_material_suelto) || 0;
        });
        return { totalTramo, rfTotal, rsTotal, msTotal, count: registros.length };
    }, [registros]);

    // Distribución por tipo de material
    const materialDistribution = useMemo(() => {
        const dist = { 'Roca Fija': 0, 'Roca Suelta': 0, 'Material Suelto': 0, 'Otros': 0 };
        registros.forEach(r => {
            const d = (r.descripcion_geotecnica || '').toLowerCase();
            if (d.includes('roca fija')) dist['Roca Fija']++;
            else if (d.includes('roca suelta')) dist['Roca Suelta']++;
            else if (d.includes('material suelto')) dist['Material Suelto']++;
            else dist['Otros']++;
        });
        return Object.entries(dist).filter(([, v]) => v > 0);
    }, [registros]);

    const materialColors = {
        'Roca Fija': '#1e293b',
        'Roca Suelta': '#3b82f6',
        'Material Suelto': '#f59e0b',
        'Otros': '#94a3b8'
    };

    const handleToggleMapExpanded = () => {
        setIsInfoExpanded(false);
        setIsMapExpanded(prev => !prev);
    };

    const handleToggleInfoExpanded = () => {
        setIsMapExpanded(false);
        setIsInfoExpanded(prev => !prev);
    };

    return (
        <div className={`geoltab-layout ${isMapExpanded ? 'collapsed' : ''} ${isInfoExpanded ? 'info-expanded' : ''}`}>
            {/* ═══════════════ PANEL IZQUIERDO: Info + Tabla ═══════════════ */}
            <div className="geoltab-info-panel" style={{ backgroundColor: '#f8fafc', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                {/* Header con título y acciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 700 }}>Clasificación de Materiales</h2>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Carretera Proyectada · Análisis por tramos</span>
                    </div>
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleToggleInfoExpanded} className="geoltab-info-expand-btn">
                        {isInfoExpanded ? '◫ Mostrar Mapa' : '⛶ Agrandar Información'}
                    </button>
                </div>

                {isAdmin && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleUploadExcel}
                            style={{ display: 'none' }}
                            id="upload-excel-clas"
                        />
                        <label htmlFor="upload-excel-clas" className="mgeo-btn-new" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1, fontSize: '0.72rem', padding: '5px 12px' }}>
                            {uploading ? '⏳...' : '📤 Subir Excel'}
                        </label>
                        <button className="mgeo-btn-new" onClick={() => setShowAddModal(true)} style={{ fontSize: '0.72rem', padding: '5px 12px', background: '#10b981' }}>
                            + Agregar
                        </button>
                        {registros.length > 0 && (
                            <button className="mgeo-btn-new" onClick={handleDeleteAll} style={{ fontSize: '0.72rem', padding: '5px 12px', background: '#ef4444' }}>
                                🗑️ Limpiar
                            </button>
                        )}
                    </div>
                )}

                {/* KPIs rápidos */}
                {stats ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        <div style={{ background: 'white', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #6366f1' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Tramos Clasificados</div>
                            <div style={{ fontSize: '1.6rem', color: '#1e293b', fontWeight: 800, lineHeight: 1 }}>{stats.count}</div>
                            <div style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: '4px', fontWeight: 600 }}>Total: {stats.totalTramo.toFixed(1)}m</div>
                        </div>
                        <div style={{ background: 'white', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Longitud Total</div>
                            <div style={{ fontSize: '1.2rem', color: '#1e293b', fontWeight: 800, lineHeight: 1 }}>{(stats.rfTotal + stats.rsTotal + stats.msTotal).toFixed(1)}<small style={{ fontSize: '0.65rem', color: '#94a3b8' }}>m</small></div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <span><b style={{ color: '#1e293b' }}>RF:</b> {stats.rfTotal.toFixed(1)}m</span>
                                <span><b style={{ color: '#3b82f6' }}>RS:</b> {stats.rsTotal.toFixed(1)}m</span>
                                <span><b style={{ color: '#f59e0b' }}>MS:</b> {stats.msTotal.toFixed(1)}m</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    !loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', color: '#94a3b8', textAlign: 'center' }}>
                            <i className="fas fa-file-excel" style={{ fontSize: '42px', marginBottom: '14px', color: '#cbd5e1' }}></i>
                            <h3 style={{ margin: '0 0 8px', color: '#64748b', fontSize: '1rem' }}>Sin Datos de Clasificación</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                Sube un archivo Excel (.xlsx) con la clasificación de materiales usando el botón <b>Subir Excel</b>.
                            </p>
                        </div>
                    )
                )}

                {/* Distribución de materiales por tipo */}
                {stats && materialDistribution.length > 0 && (
                    <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-chart-pie" style={{ color: '#6366f1' }}></i> Distribución por Material
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {materialDistribution.map(([name, count]) => {
                                const pct = stats.count > 0 ? Math.round((count / stats.count) * 100) : 0;
                                const color = materialColors[name] || '#94a3b8';
                                return (
                                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></div>
                                                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{name}</span>
                                            </div>
                                            <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 700, background: '#f8fafc', padding: '2px 8px', borderRadius: '12px' }}>{count} <small style={{ color: '#94a3b8' }}>({pct}%)</small></span>
                                        </div>
                                        <div style={{ width: '100%', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '2px', transition: 'width 0.5s ease' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tabla de datos dentro del panel izquierdo */}
                {registros.length > 0 && (
                    <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-table" style={{ color: '#3b82f6' }}></i> Detalle de Tramos
                            </h3>
                            <span style={{ fontSize: '0.7rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                                {registros.length} registros
                            </span>
                        </div>
                        <div className="mgeo-table-scroll" style={{ flex: 1 }}>
                            <table className="mgeo-table" style={{ fontSize: '0.7rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#1e293b', minWidth: '50px' }}>INICIO</th>
                                        <th style={{ position: 'sticky', left: '50px', zIndex: 2, background: '#1e293b', minWidth: '50px' }}>FIN</th>
                                        <th style={{ minWidth: '100px' }}>MATERIAL</th>
                                        <th style={{ minWidth: '35px' }}>SIMB.</th>
                                        <th style={{ minWidth: '55px' }}>TRAMO</th>
                                        <th style={{ minWidth: '42px' }}>RF%</th>
                                        <th style={{ minWidth: '42px' }}>RS%</th>
                                        <th style={{ minWidth: '42px' }}>MS%</th>
                                        <th style={{ minWidth: '50px' }}>RF(m)</th>
                                        <th style={{ minWidth: '50px' }}>RS(m)</th>
                                        <th style={{ minWidth: '50px' }}>MS(m)</th>
                                        <th style={{ minWidth: '120px' }}>UNID. LITOL.</th>
                                        {isAdmin && <th style={{ minWidth: '35px' }}></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {registros.map((r) => {
                                        const badge = getMaterialBadge(r.descripcion_geotecnica);
                                        const isSelected = selectedRow === r.id;
                                        return (
                                            <tr
                                                key={r.id}
                                                onClick={() => setSelectedRow(r.id === selectedRow ? null : r.id)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? '#eff6ff' : undefined,
                                                    borderLeft: isSelected ? `3px solid ${badge.bg}` : '3px solid transparent',
                                                    transition: 'background-color 0.15s'
                                                }}
                                            >
                                                <td style={{ position: 'sticky', left: 0, zIndex: 1, background: isSelected ? '#eff6ff' : 'white', fontWeight: 700, fontSize: '0.7rem' }}>{r.prog_inicio || '-'}</td>
                                                <td style={{ position: 'sticky', left: '50px', zIndex: 1, background: isSelected ? '#eff6ff' : 'white', fontWeight: 700, fontSize: '0.7rem' }}>{r.prog_fin || '-'}</td>
                                                <td>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: badge.bg, display: 'inline-block', flexShrink: 0 }}></span>
                                                        <span style={{ fontSize: '0.68rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isSelected ? 'normal' : 'nowrap', wordBreak: isSelected ? 'break-word' : 'normal' }}>{r.descripcion_geotecnica || '-'}</span>
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.simbolo || '-'}</td>
                                                <td style={{ textAlign: 'right' }}>{r.tramo_m ? `${r.tramo_m}m` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: r.pct_roca_fija ? '#1e293b' : '#cbd5e1' }}>{r.pct_roca_fija ? `${r.pct_roca_fija}%` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: r.pct_roca_suelta ? '#3b82f6' : '#cbd5e1' }}>{r.pct_roca_suelta ? `${r.pct_roca_suelta}%` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: r.pct_material_suelto ? '#f59e0b' : '#cbd5e1' }}>{r.pct_material_suelto ? `${r.pct_material_suelto}%` : '-'}</td>
                                                <td style={{ textAlign: 'right' }}>{r.long_roca_fija || '0.0'}</td>
                                                <td style={{ textAlign: 'right' }}>{r.long_roca_suelta || '0.0'}</td>
                                                <td style={{ textAlign: 'right' }}>{r.long_material_suelto || '0.0'}</td>
                                                <td style={{
                                                    fontSize: '0.65rem',
                                                    maxWidth: isSelected ? 'none' : '120px',
                                                    overflow: isSelected ? 'visible' : 'hidden',
                                                    textOverflow: isSelected ? 'unset' : 'ellipsis',
                                                    whiteSpace: isSelected ? 'normal' : 'nowrap',
                                                    wordBreak: isSelected ? 'break-word' : 'normal',
                                                    backgroundColor: isSelected ? '#fefce8' : undefined,
                                                    padding: isSelected ? '4px 6px' : undefined,
                                                    borderRadius: isSelected ? '4px' : undefined,
                                                    fontWeight: isSelected ? 600 : undefined,
                                                    transition: 'all 0.2s'
                                                }}>{r.grupo_formacion || '-'}</td>
                                                {isAdmin && (
                                                    <td>
                                                        <button className="mgeo-btn-delete" onClick={(e) => { e.stopPropagation(); handleDeleteOne(r.id); }} title="Eliminar">🗑️</button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {/* Leyenda al fondo de la tabla */}
                        <div style={{ padding: '6px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', fontSize: '0.65rem', color: '#64748b', flexWrap: 'wrap', flexShrink: 0 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#1e293b', display: 'inline-block' }}></span> RF</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6', display: 'inline-block' }}></span> RS</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b', display: 'inline-block' }}></span> MS</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════ PANEL DERECHO: Mapa ═══════════════ */}
            <div className="geoltab-map-panel">
                <div className="geoltab-map-header">
                    <span className="geoltab-map-label">MAPA DE ANÁLISIS</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <GeologiaLayerManager tabName="clasificacion_materiales" projectData={projectData} onUploadSuccess={() => setMapKey(prev => prev + 1)} />
                        <button type="button" onClick={handleToggleMapExpanded} className="geoltab-expand-btn">
                            {isMapExpanded ? '◩ Mostrar Información' : '⛶ Expandir Mapa'}
                        </button>
                    </div>
                </div>
                <div className="geoltab-map-container" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                    <GeologiaGeoite
                        key={mapKey}
                        mapData={[]}
                        tabName="clasificacion_materiales"
                        projectId={projectData?.id_proyecto || projectData?.id}
                        onGeoDataLoaded={setGeoData}
                    />
                </div>

            </div>

            {/* MODAL AGREGAR */}
            {showAddModal && (
                <div className="mgeo-modal-overlay">
                    <div className="mgeo-modal-card" style={{ maxWidth: '700px' }}>
                        <h3 className="mgeo-modal-title">📋 Agregar Registro de Material</h3>
                        <form onSubmit={handleAddSubmit} className="mgeo-form">
                            <div className="mgeo-form-row">
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Prog. Inicio</label>
                                    <input required type="text" name="prog_inicio" value={formData.prog_inicio} onChange={handleInputChange} className="mgeo-form-input" placeholder="0+000" />
                                </div>
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Prog. Fin</label>
                                    <input required type="text" name="prog_fin" value={formData.prog_fin} onChange={handleInputChange} className="mgeo-form-input" placeholder="0+105" />
                                </div>
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Tramo (m)</label>
                                    <input type="number" step="0.01" name="tramo_m" value={formData.tramo_m} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                            </div>
                            <div className="mgeo-form-row">
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Descripción Geotécnica</label>
                                    <select name="descripcion_geotecnica" value={formData.descripcion_geotecnica} onChange={handleInputChange} className="mgeo-form-input">
                                        <option value="">-- Seleccionar --</option>
                                        <option value="ROCA FIJA">Roca Fija</option>
                                        <option value="ROCA SUELTA">Roca Suelta</option>
                                        <option value="MATERIAL SUELTO">Material Suelto</option>
                                    </select>
                                </div>
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Símbolo</label>
                                    <select name="simbolo" value={formData.simbolo} onChange={handleInputChange} className="mgeo-form-input">
                                        <option value="">--</option>
                                        <option value="RF">RF</option>
                                        <option value="RS">RS</option>
                                        <option value="MS">MS</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mgeo-form-row">
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Roca Fija (%)</label>
                                    <input type="number" step="0.01" name="pct_roca_fija" value={formData.pct_roca_fija} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Roca Suelta (%)</label>
                                    <input type="number" step="0.01" name="pct_roca_suelta" value={formData.pct_roca_suelta} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Material Suelto (%)</label>
                                    <input type="number" step="0.01" name="pct_material_suelto" value={formData.pct_material_suelto} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                            </div>
                            <div className="mgeo-form-row">
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Long. Roca Fija (m)</label>
                                    <input type="number" step="0.01" name="long_roca_fija" value={formData.long_roca_fija} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Long. Roca Suelta (m)</label>
                                    <input type="number" step="0.01" name="long_roca_suelta" value={formData.long_roca_suelta} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Long. Material Suelto (m)</label>
                                    <input type="number" step="0.01" name="long_material_suelto" value={formData.long_material_suelto} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                            </div>
                            <div className="mgeo-form-row">
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Corte en Talud</label>
                                    <input type="text" name="corte_talud" value={formData.corte_talud} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                                <div className="mgeo-form-group">
                                    <label className="mgeo-form-label">Porcentaje (%)</label>
                                    <input type="number" step="0.01" name="porcentaje" value={formData.porcentaje} onChange={handleInputChange} className="mgeo-form-input" />
                                </div>
                            </div>
                            <div className="mgeo-form-group">
                                <label className="mgeo-form-label">Grupo/Formación/Unidad Litológica</label>
                                <input type="text" name="grupo_formacion" value={formData.grupo_formacion} onChange={handleInputChange} className="mgeo-form-input" />
                            </div>
                            <div className="mgeo-form-group">
                                <label className="mgeo-form-label">Descripción Geotécnica Detallada</label>
                                <textarea name="descripcion_detallada" value={formData.descripcion_detallada} onChange={handleInputChange} rows="2" className="mgeo-form-textarea"></textarea>
                            </div>
                            <div className="mgeo-modal-actions">
                                <button type="button" onClick={() => setShowAddModal(false)} className="mgeo-btn-cancel">Cancelar</button>
                                <button type="submit" className="mgeo-btn-save">💾 Guardar Registro</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClasificacionMaterialesTab;
