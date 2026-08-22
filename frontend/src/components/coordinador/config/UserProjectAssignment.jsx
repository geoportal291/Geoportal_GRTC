import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { FaUserPlus, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/data/contexts/AuthContext';
import './PermisosManagement.css'; // Reusing some styles

const API_BASE_URL = process.env.REACT_APP_API_BASE || '';

const UserProjectAssignment = () => {
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tramos, setTramos] = useState({}); // { projectId: [tramos] }
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedProjectTramos, setSelectedProjectTramos] = useState({}); // { projectId: [tramoIds] }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);

    const getAuthHeaders = useCallback(() => {
        if (!user || !user.token) return {};
        return {
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        };
    }, [user]);

    const fetchInitialData = useCallback(async () => {
        if (!user || !user.token) {
            setLoading(false);
            return;
        }
        try {
            const [usersRes, projectsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/usuarios`, getAuthHeaders()),
                axios.get(`${API_BASE_URL}/proyectos`, getAuthHeaders()) // Assuming /proyectos endpoint exists
            ]);
            setUsers(usersRes.data.filter(u => !['admin', 'sadmin', 'invitado', 'prueba'].includes(u.usuario)));
            setProjects(projectsRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error al cargar datos iniciales para asignación de proyectos:', err);
            setError('Error al cargar datos iniciales. Verifique la conexión al backend y los permisos.');
            setLoading(false);
        }
    }, [API_BASE_URL, getAuthHeaders, user]);

    const fetchUserAssignments = useCallback(async () => {
        if (!selectedUserId || !user || !user.token) {
            setSelectedProjectTramos({});
            return;
        }
        setLoading(true);
        try {
            // Assuming an endpoint to get assignments for a user
            const res = await axios.get(`${API_BASE_URL}/usuarios/${selectedUserId}/assignments`, getAuthHeaders());
            const assignments = res.data; // Expected format: [{ projectId: 'id', tramoId: 'id' }]

            const newSelectedProjectTramos = {};
            assignments.forEach(assignment => {
                if (!newSelectedProjectTramos[assignment.projectId]) {
                    newSelectedProjectTramos[assignment.projectId] = [];
                }
                newSelectedProjectTramos[assignment.projectId].push(assignment.tramoId);
            });
            setSelectedProjectTramos(newSelectedProjectTramos);
        } catch (err) {
            console.error('Error al cargar asignaciones del usuario:', err);
            alertify.error('Error al cargar asignaciones del usuario.');
            setSelectedProjectTramos({});
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, selectedUserId, getAuthHeaders, user]);

    const fetchTramosForProject = useCallback(async (projectId) => {
        if (!user || !user.token) return [];
        if (tramos[projectId]) return tramos[projectId]; // Cache hit
        try {
            // Assuming an endpoint to get tramos for a project
            const res = await axios.get(`${API_BASE_URL}/proyectos/${projectId}/tramos`, getAuthHeaders());
            setTramos(prev => ({ ...prev, [projectId]: res.data }));
            return res.data;
        } catch (err) {
            console.error(`Error al cargar tramos para el proyecto ${projectId}:`, err);
            alertify.error(`Error al cargar tramos para el proyecto ${projectId}.`);
            return [];
        }
    }, [API_BASE_URL, getAuthHeaders, user, tramos]);

    useEffect(() => {
        if (user && user.token) {
            fetchInitialData();
        }
    }, [user, fetchInitialData]);

    useEffect(() => {
        fetchUserAssignments();
    }, [fetchUserAssignments]);

    const handleUserChange = (e) => {
        setSelectedUserId(e.target.value);
    };

    const handleProjectToggle = async (projectId) => {
        setSelectedProjectTramos(prev => {
            const newSelection = { ...prev };
            if (newSelection[projectId]) {
                delete newSelection[projectId]; // Deselect project
            } else {
                newSelection[projectId] = []; // Select project, initialize with empty tramos
                // Optionally fetch tramos immediately if not cached
                fetchTramosForProject(projectId);
            }
            return newSelection;
        });
    };

    const handleTramoToggle = (projectId, tramoId) => {
        setSelectedProjectTramos(prev => {
            const newSelection = { ...prev };
            if (!newSelection[projectId]) {
                newSelection[projectId] = [];
            }
            if (newSelection[projectId].includes(tramoId)) {
                newSelection[projectId] = newSelection[projectId].filter(id => id !== tramoId);
            } else {
                newSelection[projectId].push(tramoId);
            }
            return newSelection;
        });
    };

    const handleSaveAssignments = async () => {
        if (!selectedUserId) {
            alertify.warning('Seleccione un usuario para guardar las asignaciones.');
            return;
        }

        setEnviando(true);
        setError(null);

        if (!user || !user.token) {
            alertify.error('No has iniciado sesión o tu sesión ha expirado. Por favor, inicia sesión.');
            setEnviando(false);
            return;
        }

        const assignmentsToSend = [];
        for (const projectId in selectedProjectTramos) {
            selectedProjectTramos[projectId].forEach(tramoId => {
                assignmentsToSend.push({ projectId, tramoId });
            });
        }

        try {
            // Assuming a POST endpoint to save assignments for a user
            await axios.post(`${API_BASE_URL}/usuarios/${selectedUserId}/assignments`, assignmentsToSend, getAuthHeaders());
            alertify.success('Asignaciones de proyectos y tramos guardadas correctamente.');
        } catch (err) {
            console.error('Error al guardar asignaciones:', err);
            alertify.error('Error al guardar asignaciones. Verifique la consola para más detalles.');
            setError('Error al guardar asignaciones.');
        } finally {
            setEnviando(false);
        }
    };

    if (loading) return <div className="loading-message">Cargando...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="permisos-container">
            <header className="permisos-header">
                <h1><FaUserPlus /> Asignación de Proyectos y Tramos</h1>
            </header>

            <div className="permisos-selector">
                <div className="selector-group">
                    <label htmlFor="select-user">Seleccionar Usuario:</label>
                    <select 
                        id="select-user"
                        value={selectedUserId}
                        onChange={handleUserChange}
                    >
                        <option value="">-- Seleccione un Usuario --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre} ({u.usuario})</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedUserId && (
                <div className="permisos-list-container">
                    <h2>Proyectos y Tramos Asignados</h2>
                    <div className="project-assignment-items">
                        {projects.map(project => (
                            <div key={project.id} className="project-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={!!selectedProjectTramos[project.id]}
                                        onChange={() => handleProjectToggle(project.id)}
                                    />
                                    {project.nombre}
                                </label>
                                {selectedProjectTramos[project.id] && (
                                    <div className="tramos-list">
                                        {tramos[project.id] && tramos[project.id].map(tramo => (
                                            <label key={tramo.id}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProjectTramos[project.id].includes(tramo.id)}
                                                    onChange={() => handleTramoToggle(project.id, tramo.id)}
                                                />
                                                {tramo.nombre}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="permisos-actions">
                        <button className="save-btn" onClick={handleSaveAssignments}><FaSave /> Guardar Asignaciones</button>
                        <button className="cancel-btn" onClick={() => setSelectedUserId('')}><FaTimes /> Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProjectAssignment;
