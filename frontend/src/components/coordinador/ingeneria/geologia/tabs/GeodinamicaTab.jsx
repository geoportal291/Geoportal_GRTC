import React, { useState } from 'react';
import './GeologiaTab.css';
import GeologiaGeoite from '../map/GeologiaGeoite';
import GeologiaLayerManager from '../map/GeologiaLayerManager';

const GeodinamicaTab = ({ projectData }) => {
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [mapKey, setMapKey] = useState(0);

    return (
        <div className={`geoltab-layout ${isMapExpanded ? 'collapsed' : ''}`}>
            {/* Panel de descripción */}
            <div className="geoltab-info-panel">
                <h2 className="geoltab-section-title">Geodinámica y Puntos Críticos</h2>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Control Estructural de la Geodinámica</h3>
                    <p className="geoltab-block-text">
                        Los procesos geodinámicos externos en el área de estudio están estrechamente
                        ligados al fallamiento activo. El análisis indica que aproximadamente el <strong>65% </strong>
                        de las inestabilidades y deformaciones observadas a lo largo de la traza proyectada
                        están bajo el control directo de las fallas geológicas regionales.
                    </p>
                </div>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Tipos de Fallas Relacionadas</h3>
                    <ul className="geoltab-list">
                        <li>
                            <span className="geoltab-tag geoltab-tag-red">Fallas Inversas (45%)</span>
                            Generan zonas de cizalle intensamente fracturadas (panizo), que actúan como planos
                            de debilidad favorables para deslizamientos rotacionales profundos.
                        </li>
                        <li>
                            <span className="geoltab-tag geoltab-tag-orange">Fallas de Rumbo (20%)</span>
                            Responsables de fenómenos de hundimiento localizado y agrietamiento tensional en las laderas adyacentes a las zonas de falla, favoreciendo la infiltración.
                        </li>
                        <li>
                            <span className="geoltab-tag geoltab-tag-green">Sin Relación Estructural Directa (35%)</span>
                            Inestabilidades causadas principalmente por factores hidro-climáticos, socavación basal y pendientes extremas, procesos puramente gravitacionales.
                        </li>
                    </ul>
                </div>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Puntos Críticos Identificados</h3>
                    <div className="geoltab-kpi-row">
                        <div className="geoltab-kpi geoltab-theme-red">
                            <div className="geoltab-kpi-val">12</div>
                            <div className="geoltab-kpi-label">Deslizamientos Mayores</div>
                        </div>
                        <div className="geoltab-kpi geoltab-theme-orange">
                            <div className="geoltab-kpi-val">8</div>
                            <div className="geoltab-kpi-label">Zonas de Derrumbes</div>
                        </div>
                        <div className="geoltab-kpi geoltab-theme-blue">
                            <div className="geoltab-kpi-val">5</div>
                            <div className="geoltab-kpi-label">Cruces de Huaycos</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel del mapa */}
            <div className="geoltab-map-panel">
                <div className="geoltab-map-header">
                    <span className="geoltab-map-label">MAPA DE PUNTOS CRÍTICOS</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                        <GeologiaLayerManager tabName="geodinamica" projectData={projectData} onUploadSuccess={() => setMapKey(prev => prev + 1)} />
                        <button type="button" onClick={() => setIsMapExpanded(!isMapExpanded)} className="geoltab-expand-btn">
                            {isMapExpanded ? '◩ Mostrar Información' : '⛶ Expandir Mapa'}
                        </button>
                    </div>
                </div>
                                <div className="geoltab-map-container" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                     <GeologiaGeoite key={mapKey} mapData={[]} tabName="geodinamica" projectId={projectData?.id_proyecto || projectData?.id} />
                </div>
                <div className="geoltab-legend">
                    <div className="geoltab-legend-title">Severidad de Puntos Críticos</div>
                    {[
                        { color: '#dc2626', label: 'Riesgo Muy Alto (Requiere Obra de Retención/Drenaje)' },
                        { color: '#f97316', label: 'Riesgo Alto (Desvío o Perfilado de Talud)' },
                        { color: '#eab308', label: 'Riesgo Moderado (Monitoreo)' },
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

export default GeodinamicaTab;





