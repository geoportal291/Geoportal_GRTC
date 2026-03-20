import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../../../api/axios';
import { useAuth } from '../../../../../data/contexts/AuthContext';
import GeologiaGeoite from '../map/GeologiaGeoite';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import './MuestrasTab.css';

const ClasificacionMaterialesTab = ({ projectData }) => {
    const { user } = useAuth();
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [isTableExpanded, setIsTableExpanded] = useState(false);
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        prog_inicio: '', prog_fin: '', descripcion_geotecnica: '', simbolo: '', tramo_m: '',
        pct_roca_fija: '', pct_roca_suelta: '', pct_material_suelto: '', corte_talud: '',
        long_roca_fija: '', long_roca_suelta: '', long_material_suelto: '', porcentaje: '',
        grupo_formacion: '', descripcion_detallada: ''
    });

    // Map data for progresiva markers
    const [mapData, setMapData] = useState({ tipo: 'clasificacion_materiales', data: [] });

    const isAdmin = user?.rol_nombre === 'ADMIN' || user?.rol_nombre === 'COORDINADOR';

    useEffect(() => { fetchData(); }, [projectData]);

    const fetchData = async () => {
        if (!projectData?.id) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/api/proyectos/${projectData.id}/clasificacion-materiales`);
            setRegistros(res.data);
            buildMapData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const buildMapData = (data) => {
        // Generate map markers from progresivas
        // Each row becomes a marker with a popup showing its details
        const features = data.map((r, idx) => {
            // Determine color based on material type
            let color = '#f59e0b'; // amber default
            const desc = (r.descripcion_geotecnica || '').toLowerCase();
            if (desc.includes('roca fija')) color = '#1e293b';
            else if (desc.includes('roca suelta')) color = '#3b82f6';
            else if (desc.includes('material suelto')) color = '#f59e0b';

            return {
                id: r.id,
                name: `${r.prog_inicio || ''} - ${r.prog_fin || ''}`,
                progresiva: r.prog_inicio,
                cardTitle: r.descripcion_geotecnica || 'Material',
                color,
                popupContent: `
                    <div style="font-family:'Inter',sans-serif;min-width:220px;">
                        <h4 style="margin:0 0 8px;color:#1e40af;font-size:13px;border-bottom:2px solid #3b82f6;padding-bottom:4px;">
                            KM ${r.prog_inicio || '?'} → ${r.prog_fin || '?'}
                        </h4>
                        <div style="background:#f8fafc;border-radius:6px;padding:8px;border:1px solid #e2e8f0;">
                            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                                <span style="font-weight:700;color:#64748b;font-size:11px;">MATERIAL</span>
                                <span style="font-size:12px;font-weight:600;color:#0f172a;">${r.descripcion_geotecnica || '-'}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                                <span style="font-weight:700;color:#64748b;font-size:11px;">TRAMO</span>
                                <span style="font-size:12px;color:#0f172a;">${r.tramo_m ? r.tramo_m + ' m' : '-'}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                                <span style="font-weight:700;color:#64748b;font-size:11px;">FORMACIÓN</span>
                                <span style="font-size:11px;color:#0f172a;max-width:140px;word-break:break-word;">${r.grupo_formacion || '-'}</span>
                            </div>
                            <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;">
                                <div style="display:flex;gap:8px;font-size:10px;">
                                    ${r.pct_roca_fija ? `<span style="background:#1e293b;color:white;padding:2px 6px;border-radius:10px;">RF ${r.pct_roca_fija}%</span>` : ''}
                                    ${r.pct_roca_suelta ? `<span style="background:#3b82f6;color:white;padding:2px 6px;border-radius:10px;">RS ${r.pct_roca_suelta}%</span>` : ''}
                                    ${r.pct_material_suelto ? `<span style="background:#f59e0b;color:white;padding:2px 6px;border-radius:10px;">MS ${r.pct_material_suelto}%</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `
            };
        });
        setMapData({ tipo: 'clasificacion_materiales', data: features });
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
    const stats = React.useMemo(() => {
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

    return (
        <div className={`mgeo-wrapper ${isMapExpanded ? 'mgeo-expanded' : ''} ${isTableExpanded ? 'mgeo-table-expanded' : ''}`}>
            {/* PANEL IZQUIERDO: Tabla */}
            <div className="mgeo-table-panel">
                <div className="mgeo-header" style={{ flexDirection: 'column', gap: '8px' }}>
                    {/* Fila 1: Título */}
                    <div style={{ width: '100%' }}>
                        <h2 className="mgeo-title" style={{ fontSize: '1rem', margin: 0 }}>Clasificación de Materiales</h2>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Carretera Proyectada</span>
                    </div>

                    {/* Fila 2: Botones de acción */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', width: '100%' }}>
                        <button
                            className="mgeo-btn-table-toggle"
                            onClick={() => { setIsTableExpanded(!isTableExpanded); if (isMapExpanded) setIsMapExpanded(false); }}
                            title={isTableExpanded ? 'Contraer tabla' : 'Expandir tabla'}
                        >
                            <i className={`fas fa-${isTableExpanded ? 'compress-alt' : 'expand-alt'}`} style={{ marginRight: '4px' }}></i>
                            {isTableExpanded ? 'Contraer' : 'Expandir'}
                        </button>
                        {isAdmin && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleUploadExcel}
                                    style={{ display: 'none' }}
                                    id="upload-excel-clas"
                                />
                                <label htmlFor="upload-excel-clas" className="mgeo-btn-new" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1, fontSize: '0.72rem', padding: '4px 10px' }}>
                                    {uploading ? '⏳...' : '📤 Subir Excel'}
                                </label>
                                <button className="mgeo-btn-new" onClick={() => setShowAddModal(true)} style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#10b981' }}>
                                    + Agregar
                                </button>
                                {registros.length > 0 && (
                                    <button className="mgeo-btn-new" onClick={handleDeleteAll} style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#ef4444' }}>
                                        🗑️ Limpiar
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Quick Stats */}
                    {stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', width: '100%' }}>
                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', textAlign: 'center', borderLeft: '3px solid #6366f1' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>TRAMOS</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{stats.count}</div>
                            </div>
                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', textAlign: 'center', borderLeft: '3px solid #1e293b' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>R. FIJA</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{stats.rfTotal.toFixed(1)}m</div>
                            </div>
                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', textAlign: 'center', borderLeft: '3px solid #3b82f6' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>R. SUELTA</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>{stats.rsTotal.toFixed(1)}m</div>
                            </div>
                            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', textAlign: 'center', borderLeft: '3px solid #f59e0b' }}>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>M. SUELTO</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>{stats.msTotal.toFixed(1)}m</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mgeo-table-scroll">
                    {loading ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Cargando datos...</p> : registros.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#94a3b8', textAlign: 'center' }}>
                            <i className="fas fa-file-excel" style={{ fontSize: '48px', marginBottom: '16px', color: '#cbd5e1' }}></i>
                            <h3 style={{ margin: '0 0 8px', color: '#64748b', fontSize: '1rem' }}>Sin Datos de Clasificación</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                Sube un archivo Excel (.xlsx) con la clasificación de materiales usando el botón <b>Subir Excel</b>.
                            </p>
                        </div>
                    ) : (
                        <table className="mgeo-table" style={{ fontSize: '0.72rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#1e293b', minWidth: '55px' }}>INICIO</th>
                                    <th style={{ position: 'sticky', left: '55px', zIndex: 2, background: '#1e293b', minWidth: '55px' }}>FIN</th>
                                    <th style={{ minWidth: '130px' }}>DESC. GEOTÉCNICA</th>
                                    <th style={{ minWidth: '40px' }}>SIMB.</th>
                                    <th style={{ minWidth: '60px' }}>TRAMO</th>
                                    <th style={{ minWidth: '50px' }}>RF %</th>
                                    <th style={{ minWidth: '50px' }}>RS %</th>
                                    <th style={{ minWidth: '50px' }}>MS %</th>
                                    <th style={{ minWidth: '60px' }}>CORTE</th>
                                    <th style={{ minWidth: '55px' }}>RF (m)</th>
                                    <th style={{ minWidth: '55px' }}>RS (m)</th>
                                    <th style={{ minWidth: '55px' }}>MS (m)</th>
                                    <th style={{ minWidth: '150px' }}>UNID. LITOLÓGICA</th>
                                    <th style={{ minWidth: '180px' }}>DESC. DETALLADA</th>
                                    {isAdmin && <th style={{ minWidth: '40px' }}></th>}
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
                                                borderLeft: isSelected ? `3px solid ${badge.bg}` : undefined
                                            }}
                                        >
                                            <td style={{ position: 'sticky', left: 0, zIndex: 1, background: isSelected ? '#eff6ff' : 'white', fontWeight: 700 }}>{r.prog_inicio || '-'}</td>
                                            <td style={{ position: 'sticky', left: '55px', zIndex: 1, background: isSelected ? '#eff6ff' : 'white', fontWeight: 700 }}>{r.prog_fin || '-'}</td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: badge.bg, display: 'inline-block', flexShrink: 0 }}></span>
                                                    {r.descripcion_geotecnica || '-'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.simbolo || '-'}</td>
                                            <td style={{ textAlign: 'right' }}>{r.tramo_m ? `${r.tramo_m} m` : '-'}</td>
                                            <td style={{ textAlign: 'right', color: r.pct_roca_fija ? '#1e293b' : '#cbd5e1' }}>{r.pct_roca_fija ? `${r.pct_roca_fija}%` : '-'}</td>
                                            <td style={{ textAlign: 'right', color: r.pct_roca_suelta ? '#3b82f6' : '#cbd5e1' }}>{r.pct_roca_suelta ? `${r.pct_roca_suelta}%` : '-'}</td>
                                            <td style={{ textAlign: 'right', color: r.pct_material_suelto ? '#f59e0b' : '#cbd5e1' }}>{r.pct_material_suelto ? `${r.pct_material_suelto}%` : '-'}</td>
                                            <td>{r.corte_talud || '-'}</td>
                                            <td style={{ textAlign: 'right' }}>{r.long_roca_fija ? `${r.long_roca_fija}` : '0.0'}</td>
                                            <td style={{ textAlign: 'right' }}>{r.long_roca_suelta ? `${r.long_roca_suelta}` : '0.0'}</td>
                                            <td style={{ textAlign: 'right' }}>{r.long_material_suelto ? `${r.long_material_suelto}` : '0.0'}</td>
                                            <td style={{ fontSize: '0.7rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.grupo_formacion}>{r.grupo_formacion || '-'}</td>
                                            <td style={{ fontSize: '0.7rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.descripcion_detallada}>{r.descripcion_detallada || '-'}</td>
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
                    )}
                </div>

                {/* Leyenda al fondo */}
                {registros.length > 0 && (
                    <div style={{ padding: '8px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '16px', fontSize: '0.7rem', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#1e293b', display: 'inline-block' }}></span> Roca Fija (RF)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3b82f6', display: 'inline-block' }}></span> Roca Suelta (RS)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b', display: 'inline-block' }}></span> Material Suelto (MS)</span>
                    </div>
                )}
            </div>

            {/* PANEL DERECHO: Mapa */}
            <div className="mgeo-map-panel">
                <div className="mgeo-map-bar">
                    <div className="mgeo-map-bar-left">
                        <h2 className="mgeo-map-heading">MAPA DE MATERIALES</h2>
                        <span className="mgeo-map-sub">Ubicación por Progresivas</span>
                    </div>
                    <button className="mgeo-btn-expand" onClick={() => { setIsMapExpanded(!isMapExpanded); if (isTableExpanded) setIsTableExpanded(false); }}>
                        {isMapExpanded ? '◁ Contraer' : 'Expandir ▷'}
                    </button>
                </div>
                <div className="mgeo-map-body">
                    <GeologiaGeoite tabName="clasificacion_materiales" projectId={projectData?.id} mapData={mapData} />
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
