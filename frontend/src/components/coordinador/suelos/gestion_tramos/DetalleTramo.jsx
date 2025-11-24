import React, { useState, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';

// Helper functions copied from the previous version of GestorProyectos
const formatCodigoForDisplay = (codigo) => {
    if (!codigo || typeof codigo !== 'string') return codigo;
    if (codigo.includes('+')) return codigo.replace(/\++/g, '+');
    if (codigo.length < 4) return codigo;
    const km = codigo.substring(0, codigo.length - 3);
    const meters = codigo.substring(codigo.length - 3);
    return `${km}+${meters}`;
};

const getStatusClass = (status) => {
    switch (status) {
        case 'activo': return 'status-activo';
        case 'inactivo': return 'status-inactivo';
        case 'completado': return 'status-completado';
        case 'pendiente': return 'status-pendiente';
        case 'en revicion': return 'status-en-revicion';
        default: return '';
    }
};

export default function DetalleTramo({ tramos, onAuthError }) {
    const [tramoSeleccionado, setTramoSeleccionado] = useState(null);
    const [subProgresivas, setSubProgresivas] = useState([]);
    const [loadingProgresivas, setLoadingProgresivas] = useState(false);

    const API_URL = process.env.REACT_APP_API_BASE || '';

    const getAuthHeaders = useCallback(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = userData?.token;
        if (!token) {
            onAuthError();
            throw new Error('Token no proporcionado');
        }
        return { Authorization: `Bearer ${token}` };
    }, [onAuthError]);

    const handleSelectTramo = useCallback(async (tramo) => {
        setTramoSeleccionado(tramo);
        setLoadingProgresivas(true);
        try {
            const headers = getAuthHeaders();
            const res = await axios.get(`${API_URL}/progresivas/${tramo.id}/children`, { headers });
            setSubProgresivas(res.data);
        } catch (err) {
            if (err.message !== 'Token no proporcionado') {
                console.error("Error al cargar progresivas:", err);
                alertify.error('Error al cargar las progresivas del tramo.');
            }
        } finally {
            setLoadingProgresivas(false);
        }
    }, [API_URL, getAuthHeaders]);

    if (!tramos) {
        return <div className="detalle-proyecto-panel">Seleccione un proyecto para ver sus tramos.</div>;
    }

    return (
        <div className="detalle-proyecto-panel">
            <h3>Tramos del Proyecto</h3>
            <div className="progresivas-table-container">
                <table className="progresivas-table">
                    <thead>
                        <tr>
                            <th>Tramo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tramos.map((tramo) => (
                            <tr key={tramo.id} onClick={() => handleSelectTramo(tramo)} className={tramoSeleccionado?.id === tramo.id ? 'selected' : ''}>
                                <td>{tramo.nombre}</td>
                                <td><div className={`status-badge ${getStatusClass(tramo.estado)}`}>{tramo.estado}</div></td>
                                <td><button className="view-btn">Ver Progresivas</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {tramoSeleccionado && (
                <div style={{ marginTop: '20px' }}>
                    <h4>Progresivas de {tramoSeleccionado.nombre}</h4>
                    {loadingProgresivas ? <p>Cargando...</p> : (
                        <div className="progresivas-table-container">
                            <table className="progresivas-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Progresiva</th>
                                        <th>Nombre</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subProgresivas.map((p, index) => (
                                        <tr key={p.id}>
                                            <td>{index + 1}</td>
                                            <td>{formatCodigoForDisplay(p.codigo)}</td>
                                            <td>{p.nombre}</td>
                                            <td><div className={`status-badge ${getStatusClass(p.estado)}`}>{p.estado}</div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
