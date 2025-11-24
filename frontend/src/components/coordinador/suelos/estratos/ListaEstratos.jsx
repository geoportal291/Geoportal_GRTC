import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import './GestorProyectos.css';
import ListaEnsayos from './ListaEnsayos';
import FormularioEstrato from './FormularioEstrato'; // Importar el formulario de estrato

const ListaEstratos = ({ parentEntity }) => {
    const [estratos, setEstratos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedEstrato, setExpandedEstrato] = useState(null); // Estado para el estrato expandido
    const [showEstratoForm, setShowEstratoForm] = useState(false); // Estado para controlar la visibilidad del formulario de estrato
    const [estratoToEdit, setEstratoToEdit] = useState(null); // Estado para el estrato a editar

    const API_URL = process.env.REACT_APP_API_BASE || '';
    const token = JSON.parse(localStorage.getItem('user'))?.token;

    const fetchEstratos = useCallback(async () => {
        if (!parentEntity || !parentEntity.id || !parentEntity.type) return;

        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}/api/estratos/${parentEntity.id}?parent_type=${parentEntity.type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setEstratos(res.data);
        } catch (err) {
            console.error("Error al cargar estratos:", err);
            setError('No se pudieron cargar los estratos para esta entidad.');
            alertify.error('Error al cargar estratos.');
        } finally {
            setLoading(false);
        }
    }, [API_URL, token, parentEntity]);

    useEffect(() => {
        fetchEstratos();
    }, [fetchEstratos]);

    const handleToggleExpand = (estratoId) => {
        setExpandedEstrato(prevId => (prevId === estratoId ? null : estratoId));
    };

    const handleAddEstrato = () => {
        setEstratoToEdit(null);
        setShowEstratoForm(true);
    };

    const handleEditEstrato = (estrato) => {
        setEstratoToEdit(estrato);
        setShowEstratoForm(true);
    };

    const handleDeleteEstrato = async (estratoId) => {
        alertify.confirm('Eliminar Estrato', '¿Está seguro que desea eliminar este estrato?', 
            async () => {
                try {
                    await axios.delete(`${API_URL}/api/estratos/${estratoId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    alertify.success('Estrato eliminado correctamente.');
                    fetchEstratos(); // Refrescar la lista
                } catch (error) {
                    console.error("Error al eliminar estrato:", error);
                    alertify.error(`Error al eliminar estrato: ${error.response?.data?.error || error.message}`);
                }
            },
            () => { alertify.error('Eliminación cancelada'); }
        );
    };

    const handleCloseEstratoForm = () => {
        setShowEstratoForm(false);
        setEstratoToEdit(null);
    };

    const handleSaveEstrato = () => {
        fetchEstratos(); // Refrescar la lista de estratos después de guardar
        handleCloseEstratoForm();
    };

    if (loading) {
        return <div className="loading-message">Cargando estratos...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="estratos-list-container"> {/* Contenedor para la lista de estratos */}
            <div className="estratos-header">
                <h3 className="estratos-title"><i className="fas fa-layer-group"></i> Estratos identificados</h3>
                <button className="btn btn-outline addEstratoBtn" onClick={handleAddEstrato}>
                    <i className="fas fa-plus"></i> Añadir Estrato
                </button>
            </div>
            {estratos.length === 0 ? (
                <div className="no-data-message">No hay estratos registrados para esta entidad.</div>
            ) : (
                estratos.map((estrato, index) => (
                    <div className="estrato-item" key={`${estrato.id}-${index}`}>
                        <div className="estrato-header" onClick={() => handleToggleExpand(estrato.id)}>
                            <div className="estrato-info">
                                <div className="estrato-color" style={{ backgroundColor: estrato.color || '#ccc' }}></div>
                                <div className="estrato-details">
                                    <h4>Estrato {estrato.id}: {estrato.nombre}</h4>
                                    <p>Cota Inicial: {estrato.cota_inicial}m - Cota Final: {estrato.cota_final}m</p>
                                </div>
                            </div>
                            <div className="estrato-actions">
                                <button className="action-btn view" /* onClick={() => onViewEnsayos(estrato.id)} */>
                                    <i className="fas fa-eye"></i> Ver Ensayos ({estrato.ensayos ? estrato.ensayos.length : 0})
                                </button>
                                <button className="action-btn add" /* onClick={() => onAddEnsayo(estrato.id)} */>
                                    <i className="fas fa-vial"></i> Agregar Ensayo
                                </button>
                                <button className="action-btn edit" onClick={() => handleEditEstrato(estrato)}>
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button className="action-btn delete" onClick={() => handleDeleteEstrato(estrato.id)}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        {expandedEstrato === estrato.id && (
                            <ListaEnsayos estrato={estrato} />
                        )}
                    </div>
                ))
            )}

            {showEstratoForm && (
                <FormularioEstrato 
                    onClose={handleCloseEstratoForm} 
                    onSave={handleSaveEstrato} 
                    parentEntityId={parentEntity.id} 
                    parentEntityType={parentEntity.type}
                    estratoData={estratoToEdit} // Pasar datos si es edición
                />
            )}
        </div>
    );
};

export default ListaEstratos;



