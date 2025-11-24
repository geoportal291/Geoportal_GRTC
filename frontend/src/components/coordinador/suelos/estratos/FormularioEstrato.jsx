import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import './GestorProyectos.css';

const FormularioEstrato = ({ onClose, onSave, progresivaId, estratoData }) => {
    const initialFormData = {
        nombre: '',
        clasificacion: '',
        profundidad_inicial: '',
        profundidad_final: '',
        color: '#8d6e63',
        descripcion: '',
    };

    const [formData, setFormData] = useState(estratoData || initialFormData);
    const [estratosDisponibles, setEstratosDisponibles] = useState([]);

    const API_URL = process.env.REACT_APP_API_BASE || '';
    const token = JSON.parse(localStorage.getItem('usuario'))?.token;

    useEffect(() => {
        const fetchEstratos = async () => {
            try {
                const res = await axios.get(`${API_URL}/estratos`, { headers: { 'Authorization': `Bearer ${token}` } });
                setEstratosDisponibles(res.data);
            } catch (err) {
                console.error("Error fetching estratos disponibles:", err);
                alertify.error("Error al cargar los estratos disponibles.");
            }
        };
        fetchEstratos();
    }, [API_URL, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSend = {
            ...formData,
            progresiva_id: progresivaId,
            profundidad_inicial: parseFloat(formData.profundidad_inicial),
            profundidad_final: parseFloat(formData.profundidad_final),
        };

        try {
            if (estratoData) {
                // Lógica para actualizar estrato existente
                await axios.put(`${API_URL}/estratos/${estratoData.id}`, dataToSend, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                alertify.success("Estrato actualizado correctamente.");
            } else {
                // Lógica para crear nuevo estrato
                await axios.post(`${API_URL}/estratos`, dataToSend, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                alertify.success("Estrato creado correctamente.");
            }
            onSave(); // Notificar al padre que se guardó
            onClose(); // Cerrar el modal
        } catch (error) {
            console.error("Error al guardar estrato:", error);
            alertify.error(`Error al guardar estrato: ${error.response?.data?.error || error.message}`);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{estratoData ? 'Editar Estrato' : 'Agregar Nuevo Estrato'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre del Estrato</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Clasificación SUCS</label>
                            <input type="text" name="clasificacion" value={formData.clasificacion} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Profundidad Inicial (m)</label>
                            <input type="number" name="profundidad_inicial" value={formData.profundidad_inicial} onChange={handleInputChange} step="0.01" required />
                        </div>
                        <div className="form-group">
                            <label>Profundidad Final (m)</label>
                            <input type="number" name="profundidad_final" value={formData.profundidad_final} onChange={handleInputChange} step="0.01" required />
                        </div>
                        <div className="form-group">
                            <label>Color Representativo</label>
                            <input type="color" name="color" value={formData.color} onChange={handleInputChange} />
                        </div>
                        <div className="form-group full-width">
                            <label>Descripción</label>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows="3"></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn">Guardar Estrato</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioEstrato;
