import React, { useState } from 'react';
import './EstratoItem.css';
import alertify from 'alertifyjs';

const EstratoItem = React.memo(React.forwardRef(({
    estrato,
    expandedEstratos = null,
    onToggle = null,
    canteraSeleccionada = null,
    progresiva = null,
    onAddEnsayo = null,
    handleDeleteEnsayo = () => { },
    handleEditEnsayo = () => { },
    handleViewEnsayo = () => { },
    onClasificar = () => { },
    // Props adicionales soportadas por GestorDeTramosActual
    isExpanded: propIsExpanded,
    onToggleExpand,
    handleManageProgresiva,
    handleViewEstratos,
    handleViewGraficos,
    selectedProgresivaId
}, ref) => {
    // Determinar si estamos renderizando una Progresiva (modo fila) o un Estrato (modo detalle)
    const isProgresivaRow = !!progresiva && !estrato;
    const itemData = estrato || progresiva;
    const estratoId = itemData?.id ?? `${itemData?.nombre}-${itemData?.cota_inicial}`;

    // Contexto padre
    const parentContext = progresiva || canteraSeleccionada;

    // Estado expandido:
    // 1. Si se pasa 'propIsExpanded' (desde GestorDeTramosActual), usarlo.
    // 2. Si se pasa 'expandedEstratos' y 'onToggle' (modo antiguo), usarlo.
    // 3. Si no, usar estado local.
    const [localExpanded, setLocalExpanded] = useState(false);

    let isExpanded = localExpanded;
    if (typeof propIsExpanded !== 'undefined') {
        isExpanded = propIsExpanded;
    } else if (expandedEstratos && typeof onToggle === 'function') {
        isExpanded = !!expandedEstratos[estratoId];
    }

    const toggleExpand = (e) => {
        if (e) e.stopPropagation();

        if (typeof onToggleExpand === 'function') {
            onToggleExpand();
        } else if (expandedEstratos && typeof onToggle === 'function') {
            onToggle(estratoId);
        } else {
            setLocalExpanded(prev => !prev);
        }
    };

    const [selectedEnsayoId, setSelectedEnsayoId] = useState(null);
    const handleSelectEnsayo = (ensayoId) => {
        setSelectedEnsayoId(prevId => prevId === ensayoId ? null : ensayoId);
    };

    const selectedEnsayo = selectedEnsayoId && estrato?.ensayos
        ? estrato.ensayos.find(e => e.id === selectedEnsayoId)
        : null;

    const handleAddEnsayoClick = (e) => {
        e.stopPropagation();
        if (typeof onAddEnsayo === 'function') {
            onAddEnsayo(parentContext, estrato);
        } else {
            console.warn('onAddEnsayo no definido');
        }
    };

    // --- RENDERIZADO DE FILA DE PROGRESIVA (GestorDeTramosActual) ---
    if (isProgresivaRow) {
        return (
            <div
                ref={ref}
                key={progresiva.id}
                className={`estrato-item progresiva-row ${isExpanded ? 'open' : ''} ${selectedProgresivaId === progresiva.id ? 'highlight-pulse' : ''}`}
            >
                <div className="estrato-header" onClick={toggleExpand}>
                    <div className="estrato-info">
                        <div className="estrato-color" style={{ backgroundColor: '#1e293b' }}></div> {/* Azul marino para progresivas */}
                        <div className="estrato-details">
                            <h4 className="estrato-name">{progresiva.nombre}</h4>
                            <p className="estrato-description">
                                <strong>Código:</strong> {progresiva.codigo} | <strong>Lado:</strong> {progresiva.lado || 'Eje'} | <strong>Prof. Total:</strong> {progresiva.estratos_perfil?.length > 0 ? progresiva.estratos_perfil[progresiva.estratos_perfil.length - 1].profundidad_final + 'm' : '0m'}
                            </p>
                        </div>
                    </div>
                    <div className="estrato-actions" onClick={(e) => e.stopPropagation()}>
                        {/* Botones de acción específicos de progresiva */}
                        {handleViewGraficos && (
                            <button className="action-btn view" title="Ver Gráficos" onClick={() => handleViewGraficos(progresiva)}>
                                <i className="fas fa-chart-line"></i>
                            </button>
                        )}
                        {handleViewEstratos && (
                            <button className="action-btn view" title="Ver Detalles de Estratos" onClick={() => handleViewEstratos(progresiva)}>
                                <i className="fas fa-layer-group"></i>
                            </button>
                        )}
                        {handleManageProgresiva && (
                            <button className="action-btn edit" title="Editar Progresiva" onClick={() => handleManageProgresiva(progresiva)}>
                                <i className="fas fa-edit"></i>
                            </button>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="estrato-body">
                        {/* Renderizar lista de estratos de la progresiva */}
                        <div className="estratos-list-container">
                            <h5>Estratos ({progresiva.estratos_perfil?.length || 0})</h5>
                            {progresiva.estratos_perfil?.map((est, idx) => (
                                <div key={idx} className="sub-estrato-row">
                                    <span className="depth-badge">{est.profundidad_inicial}m - {est.profundidad_final}m</span>
                                    <span className="estrato-desc">{est.descripcion}</span>
                                </div>
                            ))}
                            {(!progresiva.estratos_perfil || progresiva.estratos_perfil.length === 0) && (
                                <p className="no-data-msg">Sin estratos registrados.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDERIZADO DE ESTRATO INDIVIDUAL (Modo Original) ---
    return (
        <div ref={ref} key={estratoId} className={`estrato-item ${isExpanded ? 'open' : ''}`}>
            {/* HEADER */}
            <div className="estrato-header" onClick={toggleExpand}>
                <div className="estrato-info">
                    <div
                        className="estrato-color"
                        style={{ backgroundColor: estrato?.nlp_color_hex || estrato?.color || '#8d6e63' }}
                    ></div>

                    <div className="estrato-details">
                        <p className="estrato-depth">
                            <strong>Profundidad:</strong>{' '}
                            {estrato?.profundidad_inicial ?? estrato?.cota_inicial ?? 0}m - {estrato?.profundidad_final ?? estrato?.cota_final ?? 0}m
                            {(estrato?.nlp_clasificacion_sucs || estrato?.nlp_clasificacion_aashto) && (
                                <span className="estrato-nlp-badges">
                                    {estrato.nlp_clasificacion_sucs && <span className="nlp-badge sucs">{estrato.nlp_clasificacion_sucs}</span>}
                                    {estrato.nlp_clasificacion_aashto && <span className="nlp-badge aashto">{estrato.nlp_clasificacion_aashto}</span>}
                                </span>
                            )}
                        </p>
                        <h4 className="estrato-name">{estrato?.nombre || estrato?.descripcion || 'Estrato sin nombre'}</h4>
                        {(estrato?.nombre || estrato?.nlp_clasificacion_sucs) && estrato?.descripcion && (
                            <p className="estrato-description">{estrato.descripcion}</p>
                        )}
                    </div>
                </div>

                <div className="estrato-actions" onClick={(e) => e.stopPropagation()}>
                    {/* Botón de acción principal (si es necesario en el futuro) */}
                </div>
            </div>

            {/* CONTENIDO EXPANDIBLE */}
            {isExpanded && (
                <div className="estrato-body">
                    <div className="ensayos-header">
                        <h4>Ensayos realizados</h4>
                        <button
                            type="button"
                            className="btn btn-add-assay"
                            onClick={handleAddEnsayoClick}
                        >
                            <i className="fas fa-plus" /> Añadir Ensayo
                        </button>
                        {selectedEnsayo && (
                            <div className="selected-ensayo-actions">
                                <button
                                    type="button"
                                    className="action-btn view"
                                    onClick={() => handleViewEnsayo(selectedEnsayo, Array.isArray(estrato?.ensayos) ? estrato.ensayos : [])}
                                >
                                    <i className="fas fa-eye" /> Ver
                                </button>
                                <button
                                    type="button"
                                    className="action-btn edit"
                                    onClick={() => handleEditEnsayo(parentContext, estrato, selectedEnsayo)}
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
                                <button
                                    type="button"
                                    className="action-btn go"
                                    onClick={() => handleViewEnsayo(selectedEnsayo, Array.isArray(estrato?.ensayos) ? estrato.ensayos : [])}
                                >
                                    Ir a Ensayo
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ensayos-list">
                        {Array.isArray(estrato?.ensayos) && estrato.ensayos.length > 0 ? (
                            estrato.ensayos.map((ensayo) => (
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
                            <p className="no-ensayos">No hay ensayos registrados para este estrato.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}));

export default EstratoItem;
