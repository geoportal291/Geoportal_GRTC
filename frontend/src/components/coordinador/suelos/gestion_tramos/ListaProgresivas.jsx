import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import '../../proyectos/GestorProyectos.css'; // Reutilizamos estilos generales
import ListaEstratos from '../../estratos/ListaEstratos';
import FormularioProgresiva from './FormularioProgresiva';

const ListaProgresivas = ({ proyecto, refreshTrigger }) => {
    const [progresivas, setProgresivas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedProgresiva, setExpandedProgresiva] = useState(null); // Estado para la progresiva expandida
    const [showProgresivaForm, setShowProgresivaForm] = useState(false); // Estado para controlar la visibilidad del formulario de progresiva
    const [progresivaToEdit, setProgresivaToEdit] = useState(null); // Estado para la progresiva a editar

    const API_URL = process.env.REACT_APP_API_BASE || '';
    const token = JSON.parse(localStorage.getItem('user'))?.token;

    const fetchProgresivas = useCallback(async () => {
        if (!proyecto || !proyecto.id) return;

        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}/api/progresivas/proyecto/${proyecto.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProgresivas(res.data);

        } catch (err) {
            console.error("Error al cargar progresivas:", err);
            setError('No se pudieron cargar las progresivas para este proyecto.');
            alertify.error('Error al cargar progresivas.');
        } finally {
            setLoading(false);
        }
    }, [API_URL, token, proyecto]);

    useEffect(() => {
        fetchProgresivas();
    }, [fetchProgresivas, refreshTrigger]); // Añadir refreshTrigger a las dependencias

    const handleToggleExpand = (progresivaId) => {
        setExpandedProgresiva(prevId => (prevId === progresivaId ? null : progresivaId));
    };

    const handleEditProgresiva = (progresiva) => {
        setProgresivaToEdit(progresiva);
        setShowProgresivaForm(true);
    };

    const handleDeleteProgresiva = async (progresivaId) => {
        alertify.confirm('Eliminar Progresiva', '¿Está seguro que desea eliminar esta progresiva y todas sus sub-progresivas?',
            async () => {
                try {
                    await axios.delete(`${API_URL}/api/progresivas/${progresivaId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    alertify.success('Progresiva eliminada correctamente.');
                    fetchProgresivas(); // Refrescar la lista
                } catch (error) {
                    console.error("Error al eliminar progresiva:", error);
                    alertify.error(`Error al eliminar progresiva: ${error.response?.data?.error || error.message}`);
                }
            },
            () => { alertify.error('Eliminación cancelada'); }
        );
    };

    const handleCloseProgresivaForm = () => {
        setShowProgresivaForm(false);
        setProgresivaToEdit(null);
    };

    const handleSaveProgresiva = () => {
        fetchProgresivas(); // Refrescar la lista de progresivas después de guardar
        handleCloseProgresivaForm();
    };

    const handleAddProgresiva = () => {
        console.log("handleAddProgresiva called!");
        setProgresivaToEdit(null);
        setShowProgresivaForm(true);
        console.log("showProgresivaForm after setShowProgresivaForm(true):", true); // Log after setting
    };



    if (loading) {
        return <div className="loading-message">Cargando progresivas...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (progresivas.length === 0) {
        return <div className="no-data-message">No hay progresivas registradas para este proyecto.</div>;
    }

    return (
        <div className="progressiva-list-wrapper"> {/* Wrapper for the whole section */}
            <div className="progresivas-header-actions">
                <button className="btn btn-primary btn-sm" onClick={handleAddProgresiva} disabled={!proyecto}>
                    <i className="fas fa-plus"></i> Nueva Progresiva
                </button>
            </div>
            <div className="progressiva-list">
                {progresivas.map(prog => (
                    <div className="progressiva-item" key={prog.id}>
                        <div className="progressiva-header" onClick={() => handleToggleExpand(prog.id)}>
                            <div className="progressiva-toggle-icon">
                                <i className={`fas ${expandedProgresiva === prog.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                            </div>
                            <div className="progressiva-info">
                                <div className="progressiva-icon">
                                    <i className="fas fa-map-pin"></i>
                                </div>
                                <div className="progressiva-details">
                                    <h3>{prog.codigo}</h3>
                                    <p>
                                        <span><i className="fas fa-calendar"></i> {new Date(prog.creado_en).toLocaleDateString()}</span>
                                        <span><i className="fas fa-map"></i> {prog.coordenada_este}, {prog.coordenada_norte}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="progressiva-meta">
                                <div className="meta-item">
                                    <div className="meta-value">{prog.estratos_perfil ? prog.estratos_perfil.length : 0}</div>
                                    <div className="meta-label">Estratos</div>
                                </div>
                                <div className="meta-item">
                                    <div className="meta-value">0</div> {/* Placeholder para ensayos */}
                                    <div className="meta-label">Ensayos</div>
                                </div>
                                <div className="meta-item">
                                    <div className="meta-value">0</div> {/* Placeholder para fotos */}
                                    <div className="meta-label">Fotos</div>
                                </div>
                                <div className="meta-item">
                                    <button className="action-btn edit" onClick={() => handleEditProgresiva(prog)}>
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button className="action-btn delete" onClick={() => handleDeleteProgresiva(prog.id)}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {expandedProgresiva === prog.id && (
                            <div className="estratos-container">

                                <ListaEstratos progresiva={prog} />
                            </div>
                        )}
                    </div>
                ))}

                {showProgresivaForm && (
                    <FormularioProgresiva
                        onClose={handleCloseProgresivaForm}
                        onSave={handleSaveProgresiva}
                        proyectoId={proyecto.id}
                        progresivaData={progresivaToEdit} // Pasar datos si es edición
                    />
                )}
            </div> {/* Close progressiva-list-wrapper */}
        </div>
    );
};

export default ListaProgresivas;
