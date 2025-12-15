import React, { useState } from 'react';
import './EstratoItem.css';
import { useNavigate } from 'react-router-dom';
import alertify from 'alertifyjs';

const EstratoItem = React.memo(({
    estrato,
    expandedEstratos = null,
    onToggle = null,
    canteraSeleccionada = null,
    progresiva = null, // Añadido para el contexto de tramos
    onAddEnsayo = null,
    handleDeleteEnsayo = () => {},
    handleEditEnsayo = () => {},
    handleViewEnsayo = () => {},
    onClasificar = () => {}
}) => {
    const navigate = useNavigate();
    const estratoId = estrato?.id ?? `${estrato?.nombre}-${estrato?.cota_inicial}`;
    const [selectedEnsayoId, setSelectedEnsayoId] = useState(null);

    // Determina el contexto padre (progresiva o cantera)
    const parentContext = progresiva || canteraSeleccionada;

    // Comportamiento controlado o local
    const isControlled = expandedEstratos && typeof onToggle === 'function';
    const [localExpanded, setLocalExpanded] = useState(Boolean(expandedEstratos?.[estratoId]) || false);
    const isExpanded = isControlled ? Boolean(expandedEstratos[estratoId]) : localExpanded;

    const toggleExpand = () => {
        if (isControlled) onToggle(estratoId);
        else setLocalExpanded(prev => !prev);
    };

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
            alertify.error('⚠ No se ha definido la función onAddEnsayo en el componente padre.');
        }
    };

    return (
        <div key={estratoId} className={`estrato-item ${isExpanded ? 'open' : ''}`}>
            {/* HEADER */}
            <div className="estrato-header" onClick={toggleExpand}>
                <div className="estrato-info">
                    <div
                        className="estrato-color"
                        style={{ backgroundColor: estrato?.color || '#8d6e63' }}
                    ></div>

                    <div className="estrato-details">
                        <p className="estrato-depth">
                            <strong>Profundidad:</strong>{' '}
                            {estrato?.profundidad_inicial ?? estrato?.cota_inicial ?? 0}m - {estrato?.profundidad_final ?? estrato?.cota_final ?? 0}m
                        </p>
                        <h4 className="estrato-name">{estrato?.nombre || estrato?.descripcion || 'Estrato sin nombre'}</h4>
                        {estrato?.nombre && estrato?.descripcion && (
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
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => onClasificar(estrato)}
                        >
                            <i className="fas fa-certificate" /> Clasificar Suelo
                        </button>
                        {selectedEnsayo && (
                            <div className="selected-ensayo-actions">
                                <button
                                    type="button"
                                    className="action-btn view"
                                    onClick={() => handleViewEnsayo(selectedEnsayo)}
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
                                    onClick={() => navigate(`/coordinador/suelos/ensayos/${selectedEnsayo?.id}`)}
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
                                            <span className="detail-value">{ensayo?.resultado ?? '—'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Responsable:</span>
                                            <span className="detail-value">{ensayo?.responsable_nombre ?? 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Estado:</span>
                                            <span className={`detail-value status-badge status-${(ensayo?.estado || 'sin-estado').toString().toLowerCase()}`}>
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
});

export default EstratoItem;
