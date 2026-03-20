import React, { useState, useMemo } from 'react';
import './GeologiaTab.css'; // Asumiendo que comparte los mismos estilos base
import GeologiaGeoite from '../map/GeologiaGeoite';
import GeologiaLayerManager from '../map/GeologiaLayerManager';

/**
 * Componente Genérico para Dashboards Geológicos basados en Shapefiles
 * @param {string} tabName - Nombre de la tabla/ruta en el backend (ej. 'geologia_local', 'geomorfologia')
 * @param {string} title - Título del panel izquierdo
 * @param {string} subtitle - Subtítulo del panel izquierdo
 * @param {object} projectData - Datos generales del proyecto (id_proyecto, etc)
 * @param {object} legendColors - Objeto de colores manuales (opcional). Por defecto extrae del GeoJSON. { 'Unidad': '#color' }
 * @param {string} kpiLabelOverride - Forzar nombre de KPI principal (ej. "Tipo de Suelo"). Por defecto es "Unidad Predominante".
 * @param {Array<string>} targetProperties - Lista de propiedades GeoJSON a buscar como unidad principal (ej. ['UNIDAD', 'LITOLOGIA', 'GEOMORFO', 'TIPO_SUELO', 'PELIGRO'])
 */
const GeologiaDynamicDashboard = ({
    tabName,
    title = 'Dashboard Geológico',
    subtitle = 'Análisis automático generado desde las capas Shapefile/GeoJSON',
    projectData,
    kpiLabelOverride = 'Unidad Predominante',
    targetProperties = ['UNIDAD', 'LITOLOGIA', 'unidad', 'litologia', 'Unidad', 'Litologia', 'GEOMORFO', 'geomorfo', 'TIPO_SUELO', 'tipo_suelo', 'PELIGRO', 'peligro', 'RIESGO', 'riesgo', 'ESTRUCTURA', 'estructura']
}) => {
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [geoData, setGeoData] = useState(null);
    const [activeLayersFilter, setActiveLayersFilter] = useState(null);
    const [expandedLayer, setExpandedLayer] = useState(null);
    const [focusedFeature, setFocusedFeature] = useState(null);

    // Calc metrics from geojsonData
    const metrics = useMemo(() => {
        if (!geoData || !geoData.features || geoData.features.length === 0) return null;

        const features = geoData.features;
        const total = features.length;

        const layerData = {};
        const unitCounts = {};
        let totalUnidadesFounds = 0;

        features.forEach((f, idx) => {
            const props = f.properties || {};
            const layerName = (props._layer_name || 'Otros').replace(/_/g, ' ');
            
            if (!layerData[layerName]) {
                layerData[layerName] = { count: 0, features: [] };
            }
            layerData[layerName].count++;
            
            // Get a display name for the feature
            const name = String(props.NAME || props.Name || props.name || props.NOMBRE || props.Nombre || props.nombre || props.ID || props.id || `${layerName} #${layerData[layerName].count}`);
            layerData[layerName].features.push({ ...f, _dashboard_id: idx, _display_name: name });

            // Find the primary unit/property based on the provided list of targets
            let unidadVal = null;
            for (const propName of targetProperties) {
                if (props[propName] !== undefined && props[propName] !== null) {
                    unidadVal = props[propName];
                    break;
                }
            }

            if (unidadVal) {
                const uStr = String(unidadVal).trim();
                if (uStr.length > 0) {
                    unitCounts[uStr] = (unitCounts[uStr] || 0) + 1;
                    totalUnidadesFounds++;
                }
            }
        });

        let dominantUnit = { name: 'No Identificada', count: 0, pct: '0%' };
        Object.entries(unitCounts).forEach(([name, count]) => {
            if (count > dominantUnit.count) {
                dominantUnit = { name, count, pct: totalUnidadesFounds > 0 ? Math.round((count / totalUnidadesFounds) * 100) + '%' : '0%' };
            }
        });

        const layerList = Object.entries(layerData)
            .map(([name, data]) => ({ name, count: data.count, features: data.features }))
            .sort((a, b) => b.count - a.count);

        // Build dynamic lithology/unit legend (polygons and units)
        const legendMap = {};
        features.forEach(f => {
            const props = f.properties || {};
            
            let unidadVal = null;
            for (const propName of targetProperties) {
                if (props[propName] !== undefined && props[propName] !== null) {
                    unidadVal = props[propName];
                    break;
                }
            }
            
            const color = props.fill || props.stroke || props['marker-color'];

            if (unidadVal && color) {
                const uStr = String(unidadVal).trim();
                // Prefer 'fill' colors over 'stroke' if both exist for polygons
                if (!legendMap[uStr] || (props.fill && !legendMap[uStr].isFill)) {
                    legendMap[uStr] = { color: color, isFill: !!props.fill };
                }
            }
        });

        const autoLegend = Object.entries(legendMap).map(([label, data]) => ({ label, color: data.color }));

        return { total, layerList, dominantUnit, autoLegend };
    }, [geoData, targetProperties]);

    return (
        <div className={`geoltab-layout ${isMapExpanded ? 'collapsed' : ''}`}>
            {/* Panel de descripción moderno y estilo dashboard dinámico */}
            <div className="geoltab-info-panel" style={{ backgroundColor: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: 700 }}>{title}</h2>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{subtitle}</span>
                    </div>
                </div>

                {!metrics ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', textAlign: 'center', padding: '40px 20px' }}>
                        <i className="fas fa-map-marked-alt" style={{ fontSize: '48px', marginBottom: '16px', color: '#cbd5e1' }}></i>
                        <h3 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '1.1rem' }}>Sin Datos Espaciales</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                            No se han detectado capas geológicas para este proyecto. Sube un archivo Shapefile (.shp o .zip) o KMZ usando el botón <b>Subir Archivo</b> en el mapa.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Tarjetas de KPI Rápidos */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{kpiLabelOverride}</div>
                                <div style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {metrics.dominantUnit.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '6px', fontWeight: 600 }}>Representa el {metrics.dominantUnit.pct} del área con datos</div>
                            </div>
                            <div style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Elementos Detectados</div>
                                <div style={{ fontSize: '2rem', color: '#1e293b', fontWeight: 800, lineHeight: 1 }}>{metrics.total}</div>
                                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>Objetos espaciales procesados</div>
                            </div>
                        </div>

                        {/* Desglose de Capas (Tipos de Datos) */}
                        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-layer-group" style={{ color: '#f59e0b' }}></i> Desglose de Información
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {metrics.layerList.map((layer, idx) => {
                                    const isLayerActive = !activeLayersFilter || activeLayersFilter.includes(layer.name);
                                    // Custom colors based on wording (e.g., fallas res, pliegues blue, default)
                                    const lowerName = layer.name.toLowerCase();
                                    let layerColor = '#3b82f6'; // default blue
                                    if (lowerName.includes('falla') || lowerName.includes('peligro') || lowerName.includes('deslizamiento') || lowerName.includes('riesgo')) layerColor = '#ef4444'; // red
                                    if (lowerName.includes('pliegue') || lowerName.includes('agua') || lowerName.includes('ríos')) layerColor = '#0284c7'; // dark blue
                                    if (lowerName.includes('cantera') || lowerName.includes('depósito') || lowerName.includes('geomorfo')) layerColor = '#f59e0b'; // amber
                                    if (lowerName.includes('muro') || lowerName.includes('puente')) layerColor = '#8b5cf6'; // purple
                                    
                                    const pctValue = metrics.total > 0 ? Math.round((layer.count / metrics.total) * 100) : 0;

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex', flexDirection: 'column', paddingBottom: '10px',
                                                borderBottom: idx < metrics.layerList.length - 1 ? '1px dashed #e2e8f0' : 'none',
                                            }}
                                        >
                                            <div 
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'pointer', padding: '6px', borderRadius: '6px', backgroundColor: expandedLayer === layer.name ? '#f1f5f9' : 'transparent', transition: 'background-color 0.2s' }}
                                                onClick={() => setExpandedLayer(expandedLayer === layer.name ? null : layer.name)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isLayerActive ? 1 : 0.5 }}>
                                                    <i className={`fas fa-chevron-${expandedLayer === layer.name ? 'down' : 'right'}`} style={{ color: '#94a3b8', fontSize: '10px', width: '12px' }}></i>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: layerColor, boxShadow: isLayerActive ? `0 0 0 2px ${layerColor}33` : 'none' }}></div>
                                                    <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>
                                                        {layer.name}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700, background: '#f8fafc', padding: '2px 8px', borderRadius: '12px' }}>{layer.count}</span>
                                                    <i 
                                                        className={`fas fa-eye${isLayerActive ? '' : '-slash'}`} 
                                                        style={{ color: isLayerActive ? layerColor : '#94a3b8', cursor: 'pointer', fontSize: '14px', width: '20px', textAlign: 'center' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveLayersFilter(prev => {
                                                                if (!prev) return [layer.name];
                                                                if (prev.includes(layer.name)) {
                                                                    const next = prev.filter(n => n !== layer.name);
                                                                    return next.length === 0 ? null : next;
                                                                }
                                                                return [...prev, layer.name];
                                                            });
                                                        }}
                                                        title={isLayerActive ? "Ocultar capa en el mapa" : "Mostrar capa en el mapa"}
                                                    ></i>
                                                </div>
                                            </div>
                                            {/* Progress Bar */}
                                            <div style={{ width: '100%', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '2px', overflow: 'hidden', opacity: isLayerActive ? 1 : 0.4 }}>
                                                <div style={{ width: `${pctValue}%`, height: '100%', backgroundColor: layerColor, borderRadius: '2px', transition: 'width 0.5s ease' }}></div>
                                            </div>

                                            {/* Expanded Feature List */}
                                            {expandedLayer === layer.name && (
                                                <div style={{ marginTop: '10px', padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto' }} className="geol-custom-scrollbar">
                                                    {layer.features.map(f => {
                                                        const isSelected = focusedFeature?._dashboard_id === f._dashboard_id;
                                                        return (
                                                            <div 
                                                                key={f._dashboard_id}
                                                                onClick={(e) => { e.stopPropagation(); setFocusedFeature(f); }}
                                                                style={{
                                                                    padding: '6px 10px',
                                                                    fontSize: '0.8rem',
                                                                    color: isSelected ? '#1e40af' : '#475569',
                                                                    backgroundColor: isSelected ? '#eff6ff' : 'white',
                                                                    border: `1px solid ${isSelected ? '#bfdbfe' : '#e2e8f0'}`,
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    transition: 'all 0.15s'
                                                                }}
                                                            >
                                                                <i className="fas fa-map-marker-alt" style={{ color: isSelected ? layerColor : '#cbd5e1', fontSize: '12px' }}></i>
                                                                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isSelected ? 600 : 400 }}>{f._display_name}</span>
                                                                {isSelected && <i className="fas fa-crosshairs" style={{ color: '#3b82f6', fontSize: '11px', animation: 'pulse 2s infinite' }}></i>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Panel del mapa */}
            <div className="geoltab-map-panel">
                <div className="geoltab-map-header">
                    <span className="geoltab-map-label">MAPA DE ANÁLISIS</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <GeologiaLayerManager tabName={tabName} projectData={projectData} onUploadSuccess={() => setMapKey(prev => prev + 1)} />
                        <button type="button" onClick={() => setIsMapExpanded(!isMapExpanded)} className="geoltab-expand-btn">
                            {isMapExpanded ? '◩ Mostrar Información' : '⛶ Expandir Mapa'}
                        </button>
                    </div>
                </div>
                <div className="geoltab-map-container" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                    <GeologiaGeoite
                        key={mapKey}
                        mapData={[]}
                        tabName={tabName}
                        projectId={projectData?.id_proyecto || projectData?.id}
                        onGeoDataLoaded={setGeoData}
                        activeLayersFilter={activeLayersFilter}
                        focusedFeature={focusedFeature}
                    />
                </div>
                {metrics?.autoLegend && metrics.autoLegend.length > 0 && (
                    <div className="geoltab-legend">
                        <div className="geoltab-legend-title">Leyenda del Elemento</div>
                        <div style={{ maxHeight: '150px', overflowY: 'auto' }} className="geol-custom-scrollbar">
                            {metrics.autoLegend.map(l => (
                                <div className="geoltab-legend-item" key={l.label}>
                                    <span className="geoltab-legend-dot" style={{ backgroundColor: l.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                                    <span className="geoltab-legend-label" title={l.label} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeologiaDynamicDashboard;
