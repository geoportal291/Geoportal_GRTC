import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import './PerfilEstratigrafico.css';
import { useAuth } from '../../../../data/contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_BASE || '';

const PerfilEstratigraficoModal = ({ isOpen, onClose, onSave, cantera }) => {
    const [estratos, setEstratos] = useState([]);
    const [originalEstratos, setOriginalEstratos] = useState([]); // Para comparar cambios
    const [deletedEstratoIds, setDeletedEstratoIds] = useState([]); // IDs de estratos a eliminar
    const { user } = useAuth();

    // Sincronizar estratos al abrir el modal o cambiar la cantera
    useEffect(() => {
        if (cantera && cantera.estratos_perfil) {
            const sortedEstratos = [...cantera.estratos_perfil].sort((a, b) => a.orden - b.orden);
            setEstratos(sortedEstratos);
            setOriginalEstratos(sortedEstratos); // Guardar la copia original
            setDeletedEstratoIds([]); // Resetear eliminados
        } else {
            setEstratos([]);
            setOriginalEstratos([]);
            setDeletedEstratoIds([]);
        }
    }, [cantera]);

    const getAuthHeaders = useCallback(() => {
        const token = user?.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [user]);

    const handleAddNewEstrato = useCallback(() => {
        setEstratos(prevEstratos => {
            const lastEstrato = prevEstratos.length > 0 ? prevEstratos[prevEstratos.length - 1] : null;
            const newInitialDepth = lastEstrato ? parseFloat(lastEstrato.cota_final) : 0;

            return [...prevEstratos, {
                id: `temp-${Date.now()}`,
                nombre: '',
                descripcion: '',
                cota_inicial: newInitialDepth,
                cota_final: '',
                orden: prevEstratos.length,
            }];
        });
    }, []);

    const handleEstratoChange = useCallback((index, field, value) => {
        setEstratos(prevEstratos => {
            const newEstratos = [...prevEstratos];
            const currentEstrato = { ...newEstratos[index], [field]: value };
            newEstratos[index] = currentEstrato;

            // Si se cambia la cota final, actualizar la cota inicial del siguiente estrato
            if (field === 'cota_final' && index < newEstratos.length - 1) {
                const nextEstrato = { ...newEstratos[index + 1], cota_inicial: value };
                newEstratos[index + 1] = nextEstrato;
            }
            return newEstratos;
        });
    }, []);

    const handleDeleteEstrato = useCallback((indexToDelete) => {
        alertify.confirm('Confirmar Eliminación', '¿Está seguro que desea eliminar este estrato? Esta acción es irreversible.', 
            () => {
                setEstratos(prevEstratos => {
                    const estratoToDelete = prevEstratos[indexToDelete];
                    if (!String(estratoToDelete.id).startsWith('temp-')) {
                        setDeletedEstratoIds(prev => [...prev, estratoToDelete.id]);
                    }
                    const newEstratos = prevEstratos.filter((_, i) => i !== indexToDelete);
                    // Re-calcular cotas iniciales de los siguientes estratos
                    for (let i = indexToDelete; i < newEstratos.length; i++) {
                        const prevFinal = i > 0 ? parseFloat(newEstratos[i-1].cota_final) : 0;
                        newEstratos[i] = { ...newEstratos[i], cota_inicial: prevFinal };
                    }
                    return newEstratos;
                });
            },
            () => alertify.message('Eliminación cancelada')
        );
    }, []);

    const handleSaveAll = useCallback(async () => {
        const headers = getAuthHeaders();
        const actions = [];

        // 1. Eliminar estratos marcados para eliminación
        deletedEstratoIds.forEach(id => {
            actions.push(axios.delete(`${API_URL}/api/canteras/estratos/${id}`, { headers }));
        });

        // 2. Procesar estratos actuales (crear o actualizar)
        for (const [index, estrato] of estratos.entries()) {
            // Validaciones
            if (!estrato.nombre || estrato.cota_inicial === '' || estrato.cota_final === '') {
                alertify.error(`Error: Estrato en la fila ${index + 1} tiene campos requeridos vacíos.`);
                return; // Detener el proceso
            }
            if (parseFloat(estrato.cota_final) <= parseFloat(estrato.cota_inicial)) {
                alertify.error(`Error: La profundidad final del estrato en la fila ${index + 1} debe ser mayor que la inicial.`);
                return; // Detener el proceso
            }

            const estratoData = { ...estrato, orden: index };

            if (String(estrato.id).startsWith('temp-')) {
                // Nuevo estrato
                delete estratoData.id; // Eliminar ID temporal
                actions.push(axios.post(`${API_URL}/api/canteras/${cantera.id}/estratos`, estratoData, { headers }));
            } else {
                // Estrato existente: verificar si ha cambiado
                const original = originalEstratos.find(oe => oe.id === estrato.id);
                // Comparación simple de campos relevantes para detectar cambios
                if (!original || 
                    original.nombre !== estrato.nombre ||
                    original.descripcion !== estrato.descripcion ||
                    parseFloat(original.cota_inicial) !== parseFloat(estrato.cota_inicial) ||
                    parseFloat(original.cota_final) !== parseFloat(estrato.cota_final) ||
                    original.orden !== estrato.orden
                ) {
                    actions.push(axios.put(`${API_URL}/api/canteras/estratos/${estrato.id}`, estratoData, { headers }));
                }
            }
        }

        try {
            await Promise.all(actions);
            alertify.success('Cambios guardados correctamente.');
            onSave(); // Recargar datos en el componente padre
        } catch (err) {
            console.error('Error al guardar todos los estratos:', err);
            alertify.error(`Error al guardar cambios: ${err.response?.data?.details || err.message}`);
        }
    }, [estratos, deletedEstratoIds, originalEstratos, cantera, getAuthHeaders, onSave]);

    if (!isOpen) return null;

    return (
        <div className="perfil-overlay-custom" onClick={onClose}>
            <div className="perfil-estratigrafico-modal-custom" onClick={(e) => e.stopPropagation()}>
                <div className="perfil-header-custom">
                    <div className="perfil-header-title">
                        <h3>Gestionar Perfil Estratigráfico</h3>
                        <div className="perfil-header-subtitle">
                            Cantera: <span className="highlight-badge">{cantera?.nombre}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="perfil-close-btn-custom">&times;</button>
                </div>
                <div className="perfil-content-custom custom-scrollbar">
                    {estratos.length === 0 ? (
                        <div className="estratos-empty-state">
                            <i className="fas fa-layer-group"></i>
                            <p>No hay estratos definidos para esta cantera.</p>
                            <p className="subtitle">Haz clic en "Añadir Estrato" para comenzar a definir el perfil estratigráfico.</p>
                        </div>
                    ) : (
                        <div className="estratos-cards-container">
                            {estratos.map((estrato, index) => (
                                <div className="estrato-card" key={estrato.id}>
                                    <div className="estrato-card-header">
                                        <span className="estrato-index-badge">Estrato {index + 1}</span>
                                        <button 
                                            onClick={() => handleDeleteEstrato(index)} 
                                            className="btn-delete-estrato-premium" 
                                            title="Eliminar este estrato"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                    <div className="estrato-card-grid">
                                        <div className="estrato-field-group">
                                            <label>Nombre del Material / Estrato</label>
                                            <input 
                                                type="text" 
                                                value={estrato.nombre} 
                                                onChange={(e) => handleEstratoChange(index, 'nombre', e.target.value)} 
                                                placeholder="Ej. Arena arcillosa (SC)" 
                                            />
                                        </div>
                                        <div className="estrato-field-group cota-field">
                                            <label>Prof. Inicial (m)</label>
                                            <input 
                                                type="number" 
                                                value={estrato.cota_inicial} 
                                                readOnly 
                                                disabled 
                                                className="readonly-depth" 
                                            />
                                        </div>
                                        <div className="estrato-field-group cota-field">
                                            <label>Prof. Final (m)</label>
                                            <input 
                                                type="number" 
                                                value={estrato.cota_final} 
                                                onChange={(e) => handleEstratoChange(index, 'cota_final', e.target.value)} 
                                                placeholder="Ej. 1.50" 
                                            />
                                        </div>
                                        <div className="estrato-field-group full-width">
                                            <label>Descripción / Observaciones</label>
                                            <textarea 
                                                value={estrato.descripcion} 
                                                onChange={(e) => handleEstratoChange(index, 'descripcion', e.target.value)} 
                                                placeholder="Descripción del estrato (color, plasticidad, humedad, etc.)" 
                                                rows="2" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="perfil-footer-custom">
                    <button onClick={handleAddNewEstrato} className="btn-add-estrato-premium">
                        <i className="fas fa-plus"></i> Añadir Estrato
                    </button>
                    <button onClick={handleSaveAll} className="btn-save-estrato-premium">
                        <i className="fas fa-save"></i> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PerfilEstratigraficoModal;