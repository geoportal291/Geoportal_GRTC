import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import './FormularioEnsayo.css';

const FormularioEnsayo = ({ showModal, onClose, estrato, ensayoData, ensayoToEdit, token, canteraId, progresiva, onAssayCreated, onSave, estratoId }) => {
    const activeEnsayoData = ensayoData || ensayoToEdit;

    const initialFormData = {
        tipo_ensayo_id: '',
        nombre_ensayo: '',
        estado: 'Pendiente',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [tiposEnsayo, setTiposEnsayo] = useState([]);

    const API_URL = process.env.REACT_APP_API_BASE || '';

    useEffect(() => {
        if (activeEnsayoData) {
            setFormData({
                tipo_ensayo_id: activeEnsayoData.tipo_ensayo_id || activeEnsayoData.tipo_ensayo || '',
                nombre_ensayo: activeEnsayoData.nombre_ensayo || '',
                estado: activeEnsayoData.estado || 'Pendiente',
            });
        } else {
            setFormData(initialFormData);
        }
    }, [activeEnsayoData]);

    useEffect(() => {
        if (showModal || showModal === undefined) {
            const fetchTiposEnsayo = async () => {
                try {
                    const res = await axios.get(`${API_URL}/api/tipos-ensayo`, { headers: { 'Authorization': `Bearer ${token}` } });
                    setTiposEnsayo(res.data);
                } catch (err) {
                    console.error("Error fetching tipos de ensayo:", err);
                    alertify.error("Error al cargar los tipos de ensayo.");
                }
            };
            fetchTiposEnsayo();
        }
    }, [API_URL, token, showModal]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'tipo_ensayo_id') {
            const selectedTipo = tiposEnsayo.find(t => t.id === parseInt(value, 10) || t.id === value);
            const tipoNombre = selectedTipo ? selectedTipo.descripcion : '';
            setFormData(prev => ({
                ...prev,
                tipo_ensayo_id: value,
                nombre_ensayo: prev.nombre_ensayo === '' || prev.nombre_ensayo === undefined || tiposEnsayo.some(t => t.descripcion === prev.nombre_ensayo) ? tipoNombre : prev.nombre_ensayo
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let nombreEnsayo = formData.nombre_ensayo ? formData.nombre_ensayo.trim() : '';
        if (!nombreEnsayo) {
            const selectedTipo = tiposEnsayo.find(t => t.id === parseInt(formData.tipo_ensayo_id, 10) || t.id === formData.tipo_ensayo_id);
            nombreEnsayo = selectedTipo ? selectedTipo.descripcion : 'Ensayo';
        }

        try {
            if (activeEnsayoData) { // Modo edición
                const dataToSend = {
                    nombre_ensayo: nombreEnsayo,
                    estado: formData.estado,
                };
                await axios.put(`${API_URL}/api/ensayos/${activeEnsayoData.id}/base`, dataToSend, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                alertify.success("Ensayo actualizado correctamente.");
            } else { // Modo creación
                const dataToSend = {
                    tipo_ensayo_id: formData.tipo_ensayo_id,
                    nombre_ensayo: nombreEnsayo,
                    estado: formData.estado,
                    estrato_id: estrato?.id || estratoId,
                    cantera_id: canteraId,
                    progresiva_id: progresiva?.id,
                };
                await axios.post(`${API_URL}/api/ensayos/base`, dataToSend, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                alertify.success("Ensayo creado correctamente.");
            }

            if (onSave) onSave();
            if (onAssayCreated) onAssayCreated();
            onClose(); // Cerrar el modal
        } catch (error) {
            console.error("Error al guardar ensayo:", error);
            alertify.error(`Error al guardar ensayo: ${error.response?.data?.error || error.message}`);
        }
    };

    if (showModal !== undefined && !showModal) {
        return null;
    }

    return (
        <div className="ensayo-overlay-custom" onClick={onClose}>
            <div className="ensayo-modal-container-custom" onClick={(e) => e.stopPropagation()}>
                <div className="ensayo-modal-header">
                    <h3>{activeEnsayoData ? 'Editar Ensayo' : 'Agregar Nuevo Ensayo'}</h3>
                    <button type="button" onClick={onClose} className="ensayo-close-btn-custom">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="ensayo-form-body">
                    <div className="ensayo-field-group">
                        <label>Tipo de Ensayo</label>
                        <select name="tipo_ensayo_id" value={formData.tipo_ensayo_id} onChange={handleInputChange} required disabled={!!activeEnsayoData}>
                            <option value="">Seleccione un tipo de ensayo</option>
                            {tiposEnsayo.map(tipo => (
                                <option key={tipo.id} value={tipo.id}>{tipo.descripcion}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ensayo-field-group">
                        <label>Nombre del Ensayo</label>
                        <input 
                            type="text" 
                            name="nombre_ensayo" 
                            value={formData.nombre_ensayo} 
                            onChange={handleInputChange} 
                            placeholder="Dejar vacío para usar nombre del tipo"
                        />
                    </div>
                    {activeEnsayoData && ( // Solo mostrar estado en modo edición
                        <div className="ensayo-field-group">
                            <label>Estado</label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleInputChange}
                                required
                                style={{
                                    backgroundColor:
                                        formData.estado === 'Pendiente' ? '#f0f0f0' :
                                            formData.estado === 'En revisión' ? '#fff9c4' :
                                                formData.estado === 'Rechazado' ? '#ffcdd2' :
                                                    formData.estado === 'Aprobado' ? '#c8e6c9' :
                                                        formData.estado === 'Completado' ? '#bbdefb' : 'white',
                                    color: '#333',
                                    fontWeight: '500'
                                }}
                            >
                                <option value="Pendiente" style={{ backgroundColor: '#f0f0f0', color: '#616161' }}>⬤ Pendiente</option>
                                <option value="En revisión" style={{ backgroundColor: '#fff9c4', color: '#fbc02d' }}>⬤ En revisión</option>
                                <option value="Rechazado" style={{ backgroundColor: '#ffcdd2', color: '#d32f2f' }}>⬤ ... Rechazado</option>
                                <option value="Aprobado" style={{ backgroundColor: '#c8e6c9', color: '#388e3c' }}>⬤ Aprobado</option>
                                <option value="Completado" style={{ backgroundColor: '#bbdefb', color: '#1976d2' }}>⬤ Completado</option>
                            </select>
                        </div>
                    )}
                    <div className="ensayo-modal-footer">
                        <button type="button" className="btn-ensayo-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-ensayo-submit">Guardar Ensayo</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioEnsayo;