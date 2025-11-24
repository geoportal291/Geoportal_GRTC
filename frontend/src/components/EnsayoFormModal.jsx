import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../data/contexts/AuthContext';
import './coordinador/suelos/ensayos.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import { useNavigate } from 'react-router-dom';

export default function EnsayoFormModal({ showModal, onClose, progresiva, estratoId, canteraId, onAssayCreated, ensayoToEdit }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [tiposEnsayo, setTiposEnsayo] = useState([]);
    const [nombreEnsayo, setNombreEnsayo] = useState('');
    const [selectedTipoEnsayoId, setSelectedTipoEnsayoId] = useState('');
    const [estado, setEstado] = useState('pendiente'); // New state for status

    const isEditMode = Boolean(ensayoToEdit);
    const API_URL = process.env.REACT_APP_API_BASE || '';

    const getAuthHeaders = useCallback(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = userData?.token;
        if (!token) {
            alertify.error('Sesión expirada. Por favor, inicia sesión de nuevo.');
            navigate('/login');
            throw new Error('Token no proporcionado');
        }
        return { Authorization: `Bearer ${token}` };
    }, [navigate]);

    // Fetch available assay types and populate form on modal open
    useEffect(() => {
        if (showModal) {
            const headers = getAuthHeaders();
            axios.get(`${API_URL}/api/config/ensayo-tipos`, { headers })
                .then(response => setTiposEnsayo(response.data))
                .catch(error => console.error('Error al obtener tipos de ensayo:', error));

            if (isEditMode) {
                // Populate form for editing
                setNombreEnsayo(ensayoToEdit.nombre_ensayo || '');
                setSelectedTipoEnsayoId(ensayoToEdit.tipo_ensayo || '');
                setEstado(ensayoToEdit.estado || 'pendiente');
            } else {
                // Reset form for creation
                setNombreEnsayo('');
                setSelectedTipoEnsayoId('');
                setEstado('pendiente');
            }
        }
    }, [showModal, ensayoToEdit, isEditMode, API_URL, getAuthHeaders]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTipoEnsayoId || !nombreEnsayo) {
            alertify.error('Por favor, complete el nombre y tipo de ensayo.');
            return;
        }

        try {
            const headers = getAuthHeaders();
            
            if (isEditMode) {
                // UPDATE LOGIC
                const updatedAssayData = {
                    nombre_ensayo: nombreEnsayo,
                    estado: estado,
                    // Include other fields if they are editable here
                    // For now, we prevent changing type and estrato from this modal
                    tipo_ensayo_id: ensayoToEdit.tipo_ensayo, 
                    estrato_id: ensayoToEdit.estrato_id,
                };

                await axios.put(`${API_URL}/api/ensayos/${ensayoToEdit.id}/base`, updatedAssayData, { headers });
                alertify.success('Ensayo actualizado exitosamente.');

            } else {
                // CREATE LOGIC
                const baseAssayData = {
                    estrato_id: estratoId,
                    cantera_id: canteraId, // Add cantera_id
                    tipo_ensayo_id: selectedTipoEnsayoId,
                    nombre_ensayo: nombreEnsayo,
                };
                const response = await axios.post(`${API_URL}/api/ensayos/base`, baseAssayData, { headers });
                const newAssay = response.data;
                alertify.success('Ensayo base creado exitosamente. Redirigiendo...');
                
                // Redirect to the full details page to complete the form
                navigate(`/coordinador/suelos/ensayos/${newAssay.id}`);
            }
            
            onClose();
            onAssayCreated(); // This function should trigger a refresh in the parent component

        } catch (error) {
            const action = isEditMode ? 'actualizar' : 'crear';
            console.error(`Error al ${action} ensayo:`, error);
            alertify.error(error.response?.data?.message || `Error al ${action} el ensayo.`);
        }
    };

    if (!showModal) {
        return null;
    }

    return (
        <div className="overlay" onClick={onClose}>
            <div className="progresivas-form-container" onClick={(e) => e.stopPropagation()}>
                <form className="progresivas-form" onSubmit={handleSubmit}>
                    <h3>{isEditMode ? 'Editar Ensayo' : 'Crear Nuevo Ensayo'}</h3>
                    
                    <div className="form-group mb-3">
                        <label>Nombre del Ensayo:</label>
                        <input
                            type="text"
                            name="nombre_ensayo"
                            value={nombreEnsayo}
                            onChange={(e) => setNombreEnsayo(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label>Tipo de Ensayo:</label>
                        <select
                            name="tipo_ensayo"
                            value={selectedTipoEnsayoId}
                            onChange={(e) => setSelectedTipoEnsayoId(e.target.value)}
                            required
                            disabled={isEditMode} // Disable when editing
                        >
                            <option value="">Seleccione tipo de ensayo</option>
                            {tiposEnsayo.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.descripcion}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isEditMode && (
                        <div className="form-group mb-3">
                            <label>Estado:</label>
                            <select
                                name="estado"
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                required
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="actualizado">Actualizado</option>
                                <option value="en revision">En Revisión</option>
                                <option value="completado">Completado</option>
                            </select>
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" className="close-btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="submit-btn">
                            {isEditMode ? 'Guardar Cambios' : 'Crear y Continuar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}