import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import '../../proyectos/GestorProyectos.css';
import '../estratos/EstratoItem.css';
import FormularioEnsayo from './FormularioEnsayo'; // Importar el formulario de ensayo

const ListaEnsayos = ({ estrato, estratoRealId }) => {
    const [ensayos, setEnsayos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showEnsayoForm, setShowEnsayoForm] = useState(false); // Estado para controlar la visibilidad del formulario de ensayo
    const [ensayoToEdit, setEnsayoToEdit] = useState(null); // Estado para el ensayo a editar

    const API_URL = process.env.REACT_APP_API_BASE || '';
    const token = JSON.parse(localStorage.getItem('user'))?.token;

    const fetchEnsayos = useCallback(async () => {
        if (!estratoRealId) return;

        setLoading(true);
        setError(null);
        try {
            // Asumiendo que tienes una ruta en tu backend para obtener ensayos por estratoId
            const res = await axios.get(`${API_URL}/ensayos/estrato/${estratoRealId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setEnsayos(res.data);
        } catch (err) {
            console.error("Error al cargar ensayos:", err);
            setError('No se pudieron cargar los ensayos para este estrato.');
            alertify.error('Error al cargar ensayos.');
        } finally {
            setLoading(false);
        }
    }, [API_URL, token, estratoRealId]);

    useEffect(() => {
        fetchEnsayos();
    }, [fetchEnsayos]);

    const handleAddEnsayo = () => {
        setEnsayoToEdit(null);
        setShowEnsayoForm(true);
    };

    const handleEditEnsayo = (ensayo) => {
        setEnsayoToEdit(ensayo);
        setShowEnsayoForm(true);
    };

    const handleDeleteEnsayo = async (ensayoId) => {
        alertify.confirm('Eliminar Ensayo', '¿Está seguro que desea eliminar este ensayo?',
            async () => {
                try {
                    await axios.delete(`${API_URL}/ensayos/${ensayoId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    alertify.success('Ensayo eliminado correctamente.');
                    fetchEnsayos(); // Refrescar la lista
                } catch (error) {
                    console.error("Error al eliminar ensayo:", error);
                    alertify.error(`Error al eliminar ensayo: ${error.response?.data?.error || error.message}`);
                }
            },
            () => { alertify.error('Eliminación cancelada'); }
        );
    };

    const handleCloseEnsayoForm = () => {
        setShowEnsayoForm(false);
        setEnsayoToEdit(null);
    };

    const handleSaveEnsayo = () => {
        fetchEnsayos(); // Refrescar la lista de ensayos después de guardar
        handleCloseEnsayoForm();
    };

    if (loading) {
        return <div className="loading-message">Cargando ensayos...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="ensayos-container">
            <div className="ensayos-header">
                <h4>Ensayos realizados</h4>
                <button className="btn btn-secondary btn-sm addEnsayosBtn" onClick={handleAddEnsayo}>
                    <i className="fas fa-plus"></i> Nuevo Ensayo
                </button>
            </div>
            {ensayos.length === 0 ? (
                <div className="no-data-message">No hay ensayos registrados para este estrato.</div>
            ) : (
                <div className="ensayos-list">
                    {ensayos.map(ensayo => (
                        <div className="ensayo-card" key={ensayo.id}>
                            <div className="ensayo-header">
                                <div className="ensayo-title">{ensayo.tipo_ensayo}</div>
                                <div className="ensayo-date">{new Date(ensayo.fecha).toLocaleDateString()}</div>
                            </div>
                            <div className="ensayo-details">
                                <div className="detail-item">
                                    <span className="detail-label">Método</span>
                                    <span className="detail-value">{ensayo.metodo}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Resultado</span>
                                    <span className="detail-value">
                                        {typeof ensayo.resultado === 'object' && ensayo.resultado !== null 
                                            ? 'Ver detalles' 
                                            : (ensayo.resultado || '—')}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Responsable</span>
                                    <span className="detail-value">{ensayo.responsable}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Estado</span>
                                    <span className={`detail-value status-badge status-${(ensayo.estado || 'sin-estado').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}>
                                        {ensayo.estado}
                                    </span>
                                </div>
                            </div>
                            <div className="ensayo-actions">
                                <button className="action-btn edit" onClick={() => handleEditEnsayo(ensayo)}>
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button className="action-btn delete" onClick={() => handleDeleteEnsayo(ensayo.id)}>
                                    <i className="fas fa-trash"></i>
                                </button>
                                <button className="action-btn view" /* onClick={() => onViewEnsayo(ensayo.id)} */>
                                    <i className="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showEnsayoForm && (
                <FormularioEnsayo
                    onClose={handleCloseEnsayoForm}
                    onSave={handleSaveEnsayo}
                    estratoId={estratoRealId}
                    ensayoData={ensayoToEdit} // Pasar datos si es edición
                />
            )}
        </div>
    );
};

export default ListaEnsayos;

