import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import alertify from 'alertifyjs';
import './ensayos.css';

export default function Ensayos() {
    const navigate = useNavigate();
    const [listadoData, setListadoData] = useState([]);
    const [loadingListado, setLoadingListado] = useState(true);

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

    useEffect(() => {
        const fetchListado = async () => {
            setLoadingListado(true);
            try {
                const headers = getAuthHeaders();
                const response = await axios.get(`${API_URL}/api/ensayos`, { headers });
                setListadoData(response.data);
            } catch (error) {
                console.error("Error fetching listado de ensayos:", error);
                alertify.error('Error al cargar la lista de ensayos.');
            } finally {
                setLoadingListado(false);
            }
        };

        fetchListado();
    }, [API_URL, getAuthHeaders]);

    const handleCreateNew = () => {
        // TODO: Implementar la navegación a un formulario de creación de ensayo.
        alertify.message('La creación de nuevos ensayos se implementará en un formulario dedicado.');
        // navigate('/coordinador/suelos/ensayos/nuevo');
    };

    if (loadingListado) return <div>Cargando lista de ensayos...</div>;

    return (
        <div className="ensayos-layout-container container-fluid mt-4">
            <div className="header text-center mb-4">
                <h4>Listado de Ensayos de Suelos</h4>
                <p>Seleccione un ensayo para ver sus detalles o cree uno nuevo.</p>
            </div>

            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <span>Ensayos Registrados</span>
                    <button className="btn btn-success" onClick={handleCreateNew}>
                        <i className="fas fa-plus me-1"></i> Crear Nuevo Ensayo
                    </button>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Proyecto</th>
                                    <th>Tramo</th>
                                    <th>Progresiva</th>
                                    <th>Estrato</th>
                                    <th>Tipo de Ensayo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listadoData.map(ensayo => (
                                    <tr key={ensayo.id}>
                                        <td>{ensayo.id}</td>
                                        <td>{ensayo.proyecto_nombre}</td>
                                        <td>{ensayo.tramo_nombre}</td>
                                        <td>{ensayo.progresiva_codigo}</td>
                                        <td>{ensayo.estrato_descripcion}</td>
                                        <td>{ensayo.tipo_ensayo}</td>
                                        <td>
                                            <button className="btn btn-sm btn-primary" onClick={() => navigate(`/coordinador/suelos/ensayos/${ensayo.id}`)}>
                                                <i className="fas fa-eye"></i> Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}