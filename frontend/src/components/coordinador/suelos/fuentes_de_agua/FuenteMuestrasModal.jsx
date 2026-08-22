import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import '../estratos/PerfilEstratigrafico.css'; // Reutilizar los estilos
import { useAuth } from '@/data/contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_BASE || '';

const FuenteMuestrasModal = ({ isOpen, onClose, onSave, fuenteAgua }) => {
    const [estratos, setEstratos] = useState([]);
    const [originalEstratos, setOriginalEstratos] = useState([]); // Comparar cambios
    const [deletedEstratoIds, setDeletedEstratoIds] = useState([]); // Muestras eliminadas
    const { user } = useAuth();

    // Sincronizar al abrir o cambiar la fuente
    useEffect(() => {
        if (fuenteAgua && fuenteAgua.estratos_perfil) {
            const sortedEstratos = [...fuenteAgua.estratos_perfil].sort((a, b) => a.orden - b.orden);
            setEstratos(sortedEstratos);
            setOriginalEstratos(sortedEstratos);
            setDeletedEstratoIds([]);
        } else {
            setEstratos([]);
            setOriginalEstratos([]);
            setDeletedEstratoIds([]);
        }
    }, [fuenteAgua]);

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

            // Si se cambia la cota final, actualizar la inicial de la siguiente muestra
            if (field === 'cota_final' && index < newEstratos.length - 1) {
                const nextEstrato = { ...newEstratos[index + 1], cota_inicial: value };
                newEstratos[index + 1] = nextEstrato;
            }
            return newEstratos;
        });
    }, []);

    const handleDeleteEstrato = useCallback((indexToDelete) => {
        alertify.confirm('Confirmar Eliminación', '¿Está seguro que desea eliminar esta muestra / testigo? Esta acción eliminará también los ensayos asociados de forma irreversible.', 
            () => {
                setEstratos(prevEstratos => {
                    const estratoToDelete = prevEstratos[indexToDelete];
                    if (!String(estratoToDelete.id).startsWith('temp-')) {
                        setDeletedEstratoIds(prev => [...prev, estratoToDelete.id]);
                    }
                    const newEstratos = prevEstratos.filter((_, i) => i !== indexToDelete);
                    // Re-calcular profundidades
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

        // 1. Eliminar muestras
        deletedEstratoIds.forEach(id => {
            actions.push(axios.delete(`${API_URL}/api/fuentes-agua/estratos/${id}`, { headers }));
        });

        // 2. Crear o actualizar muestras
        for (const [index, estrato] of estratos.entries()) {
            if (!estrato.nombre || estrato.cota_inicial === '' || estrato.cota_final === '') {
                alertify.error(`Error: La Muestra #${index + 1} tiene campos requeridos vacíos.`);
                return;
            }
            if (parseFloat(estrato.cota_final) <= parseFloat(estrato.cota_inicial)) {
                alertify.error(`Error: La profundidad final de la Muestra #${index + 1} debe ser mayor que la inicial.`);
                return;
            }

            const estratoData = { ...estrato, orden: index };

            if (String(estrato.id).startsWith('temp-')) {
                delete estratoData.id;
                actions.push(axios.post(`${API_URL}/api/fuentes-agua/${fuenteAgua.id}/estratos`, estratoData, { headers }));
            } else {
                const original = originalEstratos.find(oe => oe.id === estrato.id);
                if (!original || 
                    original.nombre !== estrato.nombre ||
                    original.descripcion !== estrato.descripcion ||
                    parseFloat(original.cota_inicial) !== parseFloat(estrato.cota_inicial) ||
                    parseFloat(original.cota_final) !== parseFloat(estrato.cota_final) ||
                    original.orden !== estrato.orden
                ) {
                    actions.push(axios.put(`${API_URL}/api/fuentes-agua/estratos/${estrato.id}`, estratoData, { headers }));
                }
            }
        }

        try {
            await Promise.all(actions);
            alertify.success('Muestras y testigos guardados correctamente.');
            onSave();
        } catch (err) {
            console.error('Error al guardar muestras:', err);
            alertify.error(`Error al guardar cambios: ${err.response?.data?.details || err.message}`);
        }
    }, [estratos, deletedEstratoIds, originalEstratos, fuenteAgua, getAuthHeaders, onSave]);

    if (!isOpen) return null;

    return (
        <div className="perfil-overlay-custom" onClick={onClose}>
            <div className="perfil-estratigrafico-modal-custom" onClick={(e) => e.stopPropagation()}>
                <div className="perfil-header-custom">
                    <div className="perfil-header-title">
                        <h3>Sondeo y Muestras Geotécnicas</h3>
                        <div className="perfil-header-subtitle">
                            Fuente de Agua: <span className="highlight-badge">{fuenteAgua?.nombre}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="perfil-close-btn-custom">&times;</button>
                </div>
                <div className="perfil-content-custom custom-scrollbar">
                    {estratos.length === 0 ? (
                        <div className="estratos-empty-state">
                            <i className="fas fa-box-open"></i>
                            <p>No hay muestras o testigos registrados para esta fuente de agua.</p>
                            <p className="subtitle">Haz clic en "Añadir Muestra / Testigo" para registrar la primera extracción.</p>
                        </div>
                    ) : (
                        <div className="estratos-cards-container">
                            {estratos.map((estrato, index) => (
                                <div className="estrato-card" key={estrato.id}>
                                    <div className="estrato-card-header">
                                        <span className="estrato-index-badge">Muestra {index + 1}</span>
                                        <button 
                                            onClick={() => handleDeleteEstrato(index)} 
                                            className="btn-delete-estrato-premium" 
                                            title="Eliminar esta muestra"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                    <div className="estrato-card-grid">
                                        <div className="estrato-field-group">
                                            <label>Código / Identificador de Muestra</label>
                                            <input 
                                                type="text" 
                                                value={estrato.nombre} 
                                                onChange={(e) => handleEstratoChange(index, 'nombre', e.target.value)} 
                                                placeholder="Ej. M-1, Testigo 1, M-2, etc." 
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
                                            <label>Descripción Visual / Tipo de Suelo extraído</label>
                                            <textarea 
                                                value={estrato.descripcion} 
                                                onChange={(e) => handleEstratoChange(index, 'descripcion', e.target.value)} 
                                                placeholder="Describa el material (ej. Arcilla arenosa de plasticidad media, color marrón claro, húmeda)..."
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
                    <button 
                        onClick={handleAddNewEstrato} 
                        className="btn-add-estrato-premium"
                    >
                        <i className="fas fa-plus"></i> Añadir Muestra / Testigo
                    </button>
                    <div className="footer-actions-right">
                        <button onClick={onClose} className="btn-cancel-estrato-premium">
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveAll} 
                            className="btn-save-estrato-premium"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FuenteMuestrasModal;
