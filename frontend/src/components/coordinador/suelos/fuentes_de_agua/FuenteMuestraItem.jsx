import React, { useState } from 'react';
import '../estratos/EstratoItem.css';
import alertify from 'alertifyjs';

const FuenteMuestraItem = React.memo(React.forwardRef(({
    estrato: muestra,
    expandedEstratos = null,
    onToggle = null,
    fuenteAguaSeleccionada = null,
    onAddEnsayo = null,
    handleDeleteEnsayo = () => { },
    handleEditEnsayo = () => { },
    handleViewEnsayo = () => { },
    onClasificar = () => { },
    isExpanded: propIsExpanded,
    onToggleExpand
}, ref) => {
    const itemData = muestra;
    const muestraId = itemData?.id ?? `${itemData?.nombre}-${itemData?.cota_inicial}`;
    const parentContext = fuenteAguaSeleccionada;

    const [localExpanded, setLocalExpanded] = useState(false);

    let isExpanded = localExpanded;
    if (typeof propIsExpanded !== 'undefined') {
        isExpanded = propIsExpanded;
    } else if (expandedEstratos && typeof onToggle === 'function') {
        isExpanded = !!expandedEstratos[muestraId];
    }

    const toggleExpand = (e) => {
        if (e) e.stopPropagation();

        if (typeof onToggleExpand === 'function') {
            onToggleExpand();
        } else if (expandedEstratos && typeof onToggle === 'function') {
            onToggle(muestraId);
        } else {
            setLocalExpanded(prev => !prev);
        }
    };

    const [selectedEnsayoId, setSelectedEnsayoId] = useState(null);
    const handleSelectEnsayo = (ensayoId) => {
        setSelectedEnsayoId(prevId => prevId === ensayoId ? null : ensayoId);
    };

    const selectedEnsayo = selectedEnsayoId && muestra?.ensayos
        ? muestra.ensayos.find(e => e.id === selectedEnsayoId)
        : null;

    const handleAddEnsayoClick = (e) => {
        e.stopPropagation();
        if (typeof onAddEnsayo === 'function') {
            onAddEnsayo(parentContext, muestra);
        } else {
            console.warn('onAddEnsayo no definido');
        }
    };

    return (
        <div ref={ref} key={muestraId} className={`estrato-item ${isExpanded ? 'open' : ''}`}>
            {/* HEADER */}
            <div className="estrato-header" onClick={toggleExpand}>
                <div className="estrato-info">
                    {/* Icono de gota o probeta en vez del color plano de estrato */}
                    <div className="estrato-color" style={{ backgroundColor: '#0d47a1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <i className="fas fa-vial" style={{ fontSize: '0.8rem' }}></i>
                    </div>

                    <div className="estrato-details">
                        <p className="estrato-depth">
                            <strong>Profundidad de Sondeo:</strong>{' '}
                            {muestra?.profundidad_inicial ?? muestra?.cota_inicial ?? 0}m - {muestra?.profundidad_final ?? muestra?.cota_final ?? 0}m
                            {(muestra?.nlp_clasificacion_sucs || muestra?.nlp_clasificacion_aashto) && (
                                <span className="estrato-nlp-badges">
                                    {muestra.nlp_clasificacion_sucs && <span className="nlp-badge sucs">{muestra.nlp_clasificacion_sucs}</span>}
                                    {muestra.nlp_clasificacion_aashto && <span className="nlp-badge aashto">{muestra.nlp_clasificacion_aashto}</span>}
                                </span>
                            )}
                        </p>
                        <h4 className="estrato-name">{muestra?.nombre || 'Muestra sin código'}</h4>
                        {muestra?.descripcion && (
                            <p className="estrato-description">{muestra.descripcion}</p>
                        )}
                    </div>
                </div>

                <div className="estrato-actions" onClick={(e) => e.stopPropagation()}>
                    {/* Acciones del header si se requieren */}
                </div>
            </div>

            {/* CONTENIDO EXPANDIBLE */}
            {isExpanded && (
                <div className="estrato-body">
                    <div className="ensayos-header">
                        <h4>Ensayos Realizados</h4>
                        <button
                            type="button"
                            className="btn btn-add-assay"
                            onClick={handleAddEnsayoClick}
                        >
                            <i className="fas fa-plus" /> Registrar Ensayo
                        </button>
                        {selectedEnsayo && (
                            <div className="selected-ensayo-actions">
                                <button
                                    type="button"
                                    className="action-btn view"
                                    onClick={() => handleViewEnsayo(selectedEnsayo, Array.isArray(muestra?.ensayos) ? muestra.ensayos : [])}
                                >
                                    <i className="fas fa-eye" /> Ver
                                </button>
                                <button
                                    type="button"
                                    className="action-btn edit"
                                    onClick={() => handleEditEnsayo(parentContext, muestra, selectedEnsayo)}
                                >
                                    <i className="fas fa-edit" /> Editar
                                </button>
                                <button
                                    type="button"
                                    className="action-btn delete"
                                    onClick={() => {
                                        handleDeleteEnsayo(selectedEnsayo?.id);
                                        setSelectedEnsayoId(null);
                                    }}
                                >
                                    <i className="fas fa-trash" /> Eliminar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ensayos-list">
                        {Array.isArray(muestra?.ensayos) && muestra.ensayos.length > 0 ? (
                            muestra.ensayos.map((ensayo) => (
                                <div
                                    key={ensayo?.id ?? `${ensayo?.nombre_ensayo}-${ensayo?.fecha}`}
                                    className={`ensayo-card selectable ${selectedEnsayoId === ensayo?.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectEnsayo(ensayo?.id)}
                                >
                                    <div className="ensayo-header">
                                        <div className="ensayo-title">{ensayo?.nombre_ensayo}</div>
                                        <div className="ensayo-date">
                                            {ensayo?.fecha ? new Date(ensayo.fecha).toLocaleDateString() : 'Sin fecha'}
                                        </div>
                                    </div>
                                    <div className="ensayo-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Tipo:</span>
                                            <span className="detail-value">
                                                {ensayo?.tipo_ensayo_descripcion || ensayo?.tipo_ensayo || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Resultado:</span>
                                            <span className="detail-value">
                                                {typeof ensayo?.resultado === 'object' && ensayo?.resultado !== null 
                                                    ? 'Ver detalles' 
                                                    : (ensayo?.resultado || '—')}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Responsable:</span>
                                            <span className="detail-value">{ensayo?.responsable_nombre ?? 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Estado:</span>
                                            <span className={`detail-value status-badge status-${(ensayo?.estado || 'sin-estado').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}>
                                                {ensayo?.estado ?? 'Sin estado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-ensayos">No hay ensayos registrados para esta muestra de sondeo.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}));

export default FuenteMuestraItem;
