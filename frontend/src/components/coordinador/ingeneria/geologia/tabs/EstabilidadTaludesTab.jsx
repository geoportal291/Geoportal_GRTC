import React, { useState } from 'react';
import './GeologiaTab.css';
import GeologiaGeoite from '../map/GeologiaGeoite';
import GeologiaLayerManager from '../map/GeologiaLayerManager';

const EstabilidadTaludesTab = ({ projectData }) => {
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [mapKey, setMapKey] = useState(0);

    return (
        <div className={`geoltab-layout ${isMapExpanded ? 'collapsed' : ''}`}>
            {/* Panel de descripción */}
            <div className="geoltab-info-panel">
                <h2 className="geoltab-section-title">Análisis de Estabilidad de Taludes</h2>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Metodología de Análisis</h3>
                    <p className="geoltab-block-text">
                        La evaluación geotécnica de los taludes críticos se realizó utilizando métodos de equilibrio límite
                        con el software <strong>Slide v6.0</strong> (Morgenstern-Price, Bishop Modificado). Se han calculado los Factores
                        de Seguridad (FS) bajo condiciones estáticas y pseudoestáticas (considerando el sismo de diseño).
                    </p>
                </div>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Resultados de Factores de Seguridad (FS)</h3>
                    <ul className="geoltab-list">
                        <li>
                            <span className="geoltab-tag geoltab-tag-green">FS Estático &gt; 1.50</span>
                            Condición de estabilidad exigida a largo plazo. Aplicado en taludes en roca sana con inclinación V:H 1:1 a 2:1.
                        </li>
                        <li>
                            <span className="geoltab-tag geoltab-tag-orange">FS Pseudoestático &gt; 1.25</span>
                            Estabilidad garantizada bajo aceleración sísmica (Ah = 0.15g). Los taludes en depósitos coluviales
                            frecuentemente no cumplen esta condición sin obras de estabilización.
                        </li>
                        <li>
                            <span className="geoltab-tag geoltab-tag-red">Zonas Críticas (FS &lt; 1.0)</span>
                            Sectores identificados donde las cuñas de falla activas requieren terraceo inmediato, muros de contención
                            (suelo reforzado/gaviones) y drenaje profundo (subdrenes).
                        </li>
                    </ul>
                </div>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Recomendaciones Geotécnicas</h3>
                    <p className="geoltab-block-text">
                        En base a las conclusiones sintéticas, se determina que la inestabilidad principal está
                        gobernada por fallas activas y la alta meteorización. Se recomienda:
                    </p>
                    <ul className="geoltab-list">
                        <li><span className="geoltab-tag geoltab-tag-gray">Drenaje</span> Zanjas de coronación revestidas y subdrenes franceses en áreas de alta infiltración.</li>
                        <li><span className="geoltab-tag geoltab-tag-gray">Estabilización</span> Terraceo con banquetas cada 7m de altura en laderas de material deleznable.</li>
                        <li><span className="geoltab-tag geoltab-tag-gray">Monitoreo</span> Instalación de inclinómetros y piezómetros en el deslizamiento del Km 21+400.</li>
                    </ul>
                </div>
            </div>

            {/* Panel del mapa */}
            <div className="geoltab-map-panel">
                <div className="geoltab-map-header">
                    <span className="geoltab-map-label">MAPA DE SÍNTESIS GEOTÉCNICA</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                        <GeologiaLayerManager tabName="estabilidadtaludes" projectData={projectData} onUploadSuccess={() => setMapKey(prev => prev + 1)} />
                        <button type="button" onClick={() => setIsMapExpanded(!isMapExpanded)} className="geoltab-expand-btn">
                            {isMapExpanded ? '◩ Mostrar Información' : '⛶ Expandir Mapa'}
                        </button>
                    </div>
                </div>
                                <div className="geoltab-map-container" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                     <GeologiaGeoite key={mapKey} mapData={[]} tabName="estabilidadtaludes" projectId={projectData?.id_proyecto || projectData?.id} />
                </div>
                <div className="geoltab-legend">
                    <div className="geoltab-legend-title">Simbología Geotécnica</div>
                    {[
                        { color: '#dc2626', label: 'Talud Inestable (FS < 1.0)' },
                        { color: '#f59e0b', label: 'Talud Marginalmente Estable (FS ~ 1.2)' },
                        { color: '#10b981', label: 'Talud Estable (FS &gt; 1.5)' },
                        { color: '#3b82f6', label: 'Muros de Contención Proyectados' },
                        { color: '#8b5cf6', label: 'Zonas de Monitoreo Geotécnico' },
                    ].map(l => (
                        <div className="geoltab-legend-item" key={l.label}>
                            <span className="geoltab-legend-dot" style={{ backgroundColor: l.color }} />
                            <span className="geoltab-legend-label">{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EstabilidadTaludesTab;





