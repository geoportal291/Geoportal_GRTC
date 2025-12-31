import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import '../proyectos/GestorProyectos.css';

const FormularioEnsayo = ({ showModal, onClose, estrato, ensayoData, token, canteraId, progresiva, onAssayCreated }) => {
    const initialFormData = {
        tipo_ensayo_id: '',
        nombre_ensayo: '',
        estado: 'Pendiente',
    };

    // Soluciona el warning de "controlled input" proveyendo siempre valores definidos.
    const [formData, setFormData] = useState(initialFormData);
    const [tiposEnsayo, setTiposEnsayo] = useState([]);

    const API_URL = process.env.REACT_APP_API_BASE || '';

    // Initial load and updates when ensayoData changes
    useEffect(() => {
        if (ensayoData) {
            setFormData({
                tipo_ensayo_id: ensayoData.tipo_ensayo_id || ensayoData.tipo_ensayo || '',
                nombre_ensayo: ensayoData.nombre_ensayo || '',
                estado: ensayoData.estado || 'Pendiente',
            });
        } else {
            setFormData(initialFormData);
        }
    }, [ensayoData]);

    useEffect(() => {
        if (showModal) {
            const fetchTiposEnsayo = async () => {
                try {
                    // Corrige la ruta de la API a /api/tipos-ensayo (con guion)
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (ensayoData) { // Modo edición
                const dataToSend = {
                    nombre_ensayo: formData.nombre_ensayo,
                    estado: formData.estado,
                };
                // Corrige la ruta de la API para PUT
                await axios.put(`${API_URL}/api/ensayos/${ensayoData.id}/base`, dataToSend, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                alertify.success("Ensayo actualizado correctamente.");
            } else { // Modo creación
                const dataToSend = {
                    tipo_ensayo_id: formData.tipo_ensayo_id,
                    nombre_ensayo: formData.nombre_ensayo,
                    estado: formData.estado,
                    estrato_id: estrato?.id,
                    cantera_id: canteraId,
                    progresiva_id: progresiva?.id,
                };
                // Corrige la ruta de la API para POST
                await axios.post(`${API_URL}/api/ensayos/base`, dataToSend, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                alertify.success("Ensayo creado correctamente.");
            }

            if (onAssayCreated) onAssayCreated();
            onClose(); // Cerrar el modal
        } catch (error) {
            console.error("Error al guardar ensayo:", error);
            alertify.error(`Error al guardar ensayo: ${error.response?.data?.error || error.message}`);
        }
    };

    if (!showModal) {
        return null;
    }

    return (
        <div className="progresivas-form-container">
            <h3>{ensayoData ? 'Editar Ensayo' : 'Agregar Nuevo Ensayo'}</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Tipo de Ensayo</label>
                        <select name="tipo_ensayo_id" value={formData.tipo_ensayo_id} onChange={handleInputChange} required disabled={!!ensayoData}>
                            <option value="">Seleccione un tipo de ensayo</option>
                            {tiposEnsayo.map(tipo => (
                                <option key={tipo.id} value={tipo.id}>{tipo.descripcion}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Nombre del Ensayo</label>
                        <input type="text" name="nombre_ensayo" value={formData.nombre_ensayo} onChange={handleInputChange} required />
                    </div>
                    {ensayoData && ( // Solo mostrar estado en modo edición
                        <div className="form-group">
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
                                <option value="Rechazado" style={{ backgroundColor: '#ffcdd2', color: '#d32f2f' }}>⬤ Rechazado</option>
                                <option value="Aprobado" style={{ backgroundColor: '#c8e6c9', color: '#388e3c' }}>⬤ Aprobado</option>
                                <option value="Completado" style={{ backgroundColor: '#bbdefb', color: '#1976d2' }}>⬤ Completado</option>
                            </select>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn">Guardar Ensayo</button>
                </div>
            </form>
        </div>
    );
};

export default FormularioEnsayo;