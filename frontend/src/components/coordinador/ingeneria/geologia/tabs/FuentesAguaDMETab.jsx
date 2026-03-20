import React, { useState } from 'react';
import './GeologiaTab.css';
import GeologiaGeoite from '../map/GeologiaGeoite';
import GeologiaLayerManager from '../map/GeologiaLayerManager';

const FuentesAguaDMETab = ({ projectData }) => {
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [mapKey, setMapKey] = useState(0);

    const puentesAgua = [
        { id: 'FA-01', ubicacion: 'Río San Miguel', caudal: '25 l/s', calidad: 'Aceptable, pH 7.2', uso: 'Concreto, Campamento' },
        { id: 'FA-02', ubicacion: 'Quebrada Honda', caudal: '10 l/s', calidad: 'Alta turbidez (Época húmeda)', uso: 'Riego, Compactación' },
        { id: 'FA-03', ubicacion: 'Manantial El Carmen', caudal: '3 l/s', calidad: 'Buena', uso: 'Consumo Humano' },
    ];

    const dmes = [
        { id: 'DME-01', ubicacion: 'Km 14+200', area: '1.5 Ha', capacidad: '25,000 m³', tipoTerreno: 'Hondonada natural' },
        { id: 'DME-02', ubicacion: 'Km 18+500', area: '0.8 Ha', capacidad: '12,000 m³', tipoTerreno: 'Zona de préstamo abandonada' },
        { id: 'DME-03', ubicacion: 'Km 24+100', area: '2.1 Ha', capacidad: '45,000 m³', tipoTerreno: 'Llanura aluvial inactiva' },
    ];

    return (
        <div className={`geoltab-layout ${isMapExpanded ? 'collapsed' : ''}`}>
            {/* Panel de descripción */}
            <div className="geoltab-info-panel">
                <h2 className="geoltab-section-title">Fuentes de Agua y DMEs</h2>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Fuentes de Agua Identificadas (05)</h3>
                    <p className="geoltab-block-text">
                        Se han identificado cuerpos de agua superficiales y subterráneos con capacidad suficiente
                        para abastecer las necesidades hidrológicas del proyecto durante la etapa de construcción.
                    </p>
                    <table className="geoltab-table" style={{ marginTop: '10px' }}>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Cuerpo de Agua</th>
                                <th>Caudal Est.</th>
                                <th>Calidad/Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {puentesAgua.map(fa => (
                                <tr key={fa.id}>
                                    <td><strong>{fa.id}</strong></td>
                                    <td>{fa.ubicacion}</td>
                                    <td>{fa.caudal}</td>
                                    <td>{fa.calidad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Depósitos de Material Excedente (07 DMEs)</h3>
                    <p className="geoltab-block-text">
                        Se han ubicado 07 zonas aptas para la disposición final de los materiales excedentes de corte,
                        cumpliendo los criterios topográficos y ambientales para evitar la afectación a cauces hídricos.
                    </p>
                    <table className="geoltab-table" style={{ marginTop: '10px' }}>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Ubicación</th>
                                <th>Área</th>
                                <th>Capacidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dmes.map(dme => (
                                <tr key={dme.id}>
                                    <td><strong>{dme.id}</strong></td>
                                    <td>{dme.ubicacion}</td>
                                    <td>{dme.area}</td>
                                    <td>{dme.capacidad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Panel del mapa */}
            <div className="geoltab-map-panel">
                <div className="geoltab-map-header">
                    <span className="geoltab-map-label">MAPA DE FUENTES DE AGUA Y DMEs</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                        <GeologiaLayerManager tabName="fuentesaguadme" projectData={projectData} onUploadSuccess={() => setMapKey(prev => prev + 1)} />
                        <button type="button" onClick={() => setIsMapExpanded(!isMapExpanded)} className="geoltab-expand-btn">
                            {isMapExpanded ? '◩ Mostrar Información' : '⛶ Expandir Mapa'}
                        </button>
                    </div>
                </div>
                                <div className="geoltab-map-container" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
                     <GeologiaGeoite key={mapKey} mapData={[]} tabName="fuentesaguadme" projectId={projectData?.id_proyecto || projectData?.id} />
                </div>
                <div className="geoltab-legend">
                    <div className="geoltab-legend-title">Simbología</div>
                    {[
                        { color: '#3b82f6', label: 'Fuente de Agua Permanente' },
                        { color: '#93c5fd', label: 'Fuente de Agua Estacional' },
                        { color: '#8b5cf6', label: 'DME - Depósito de Material Excedente' },
                        { color: '#10b981', label: 'Zonas de Amortiguamiento Ambiental' },
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

export default FuentesAguaDMETab;





