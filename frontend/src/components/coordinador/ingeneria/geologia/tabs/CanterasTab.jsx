import React, { useState } from 'react';
import './GeologiaTab.css';
import GeologiaGeoite from '../map/GeologiaGeoite';
import GeologiaLayerManager from '../map/GeologiaLayerManager';

const CanterasTab = ({ projectData }) => {
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [mapKey, setMapKey] = useState(0);

    const canterasLista = [
        { id: 'C-01', nombre: 'Cantera Quebrada Ananea', material: 'Hormigón / Agregados', uso: 'Sub Base, Concreto', volumen: '15,000 m³' },
        { id: 'C-02', nombre: 'Cantera San José', material: 'Material Gravoso', uso: 'Capa Base', volumen: '22,500 m³' },
        { id: 'C-03', nombre: 'Cantera Río Urubamba (km 12+500)', material: 'Grava y Arena', uso: 'Asfalto, Concreto', volumen: '85,000 m³' },
        { id: 'C-04', nombre: 'Cantera Quebrada Seca', material: 'Roca Triturada', uso: 'Gaviones, Enrocado', volumen: '10,000 m³' },
    ];

    return (
        <div className={`geoltab-layout ${isMapExpanded ? 'collapsed' : ''}`}>
            {/* Panel de descripción */}
            <div className="geoltab-info-panel">
                <h2 className="geoltab-section-title">Canteras y Fuentes de Materiales</h2>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Identificación y Evaluación</h3>
                    <p className="geoltab-block-text">
                        Se han identificado y evaluado preliminarmente <strong>04 canteras</strong> potenciales
                        a lo largo de la vía en estudio (en el Cauce y Terrazas). Estas fuentes suministrarán
                        los agregados necesarios para las obras civiles, tratamiento asfáltico, sub-bases, y muros.
                    </p>
                </div>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Listado de Canteras Potenciales</h3>
                    <table className="geoltab-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre de Cantera</th>
                                <th>Material</th>
                                <th>Uso Previsto</th>
                                <th>Volumen Est.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {canterasLista.map(cantera => (
                                <tr key={cantera.id}>
                                    <td><strong>{cantera.id}</strong></td>
                                    <td>{cantera.nombre}</td>
                                    <td>{cantera.material}</td>
                                    <td>{cantera.uso}</td>
                                    <td>{cantera.volumen}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="geoltab-block" style={{ marginTop: '20px' }}>
                    <h3 className="geoltab-block-title">Restricciones Ambientales</h3>
                    <ul className="geoltab-list">
                        <li><span className="geoltab-tag geoltab-tag-green">Aprobado</span> Plan de Manejo Ambiental (PMA) en trámite de certificación.</li>
                        <li><span className="geoltab-tag geoltab-tag-red">Restringido</span> Extracción prohibida entre los meses de Enero a Marzo por temporada de grandes avenidas.</li>
                    </ul>
                </div>
            </div>

            {/* Panel del mapa */}
            <div className="geoltab-map-panel">
                <div className="geoltab-map-header">
                    <span className="geoltab-map-label">MAPA DE UBICACIÓN DE CANTERAS</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                        <GeologiaLayerManager tabName="canteras" projectData={projectData} onUploadSuccess={() => setMapKey(prev => prev + 1)} />
                        <button type="button" onClick={() => setIsMapExpanded(!isMapExpanded)} className="geoltab-expand-btn">
                            {isMapExpanded ? '◩ Mostrar Información' : '⛶ Expandir Mapa'}
                        </button>
                    </div>
                </div>
                                <div className="geoltab-map-container" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                     <GeologiaGeoite key={mapKey} mapData={[]} tabName="canteras" projectId={projectData?.id_proyecto || projectData?.id} />
                </div>
                <div className="geoltab-legend">
                    <div className="geoltab-legend-title">Tipos de Fuentes</div>
                    {[
                        { color: '#3b82f6', label: 'Cantera de Cauce de Río (Aluvial)' },
                        { color: '#8b5cf6', label: 'Cantera de Cerro (Roca Fija)' },
                        { color: '#10b981', label: 'Zaranda y Chancadora Proyectada' },
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

export default CanterasTab;





