import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import alertify from 'alertifyjs'; // Importar alertify
import { getUsersGroupedByProject } from '../../api/usuariosAPI';
import { getAmigoSecretoParticipantes, updateAmigoSecretoParticipantes } from '../../api/amigoSecretoAPI';
import './GestionarParticipantes.css';

const GestionarParticipantes = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState(new Set());

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Obtener ambas listas en paralelo
                const [usersData, participantIds] = await Promise.all([
                    getUsersGroupedByProject(),
                    getAmigoSecretoParticipantes()
                ]);

                if (usersData) {
                    setProjects(usersData);
                } else {
                    setError('No se pudo obtener la lista de usuarios.');
                }

                if (participantIds) {
                    setSelectedUsers(new Set(participantIds));
                }

            } catch (err) {
                setError('Ocurrió un error al cargar los datos.');
                console.error(err);
            }
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    const handleSelectUser = (userId) => {
        setSelectedUsers(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(userId)) {
                newSelected.delete(userId);
            } else {
                newSelected.add(userId);
            }
            return newSelected;
        });
    };

    const handleSave = async () => {
        try {
            const userIds = Array.from(selectedUsers);
            await updateAmigoSecretoParticipantes(userIds);
            alertify.success(`Selección guardada: ${userIds.length} participantes.`); // Usar alertify.success
            navigate('/eventos/amigo-secreto'); // Volver a la sala de espera
        } catch (error) {
            alertify.error('Error al guardar la selección. Inténtalo de nuevo.'); // Usar alertify.error
        }
    };

    // Nombres a excluir de la lista
    const excludedNamesRaw = [
        //'admin admin system',
        'chescop chescop chescop',
        'prueba prueba prueba',
        'prueba chmapi cardenas'
    ];

    const normalizeString = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const excludedNormalizedNames = new Set(excludedNamesRaw.map(normalizeString));

    return (
        <div className="gestionar-participantes-container">
            <div className="card-principal" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2><i className="fas fa-user-cog"></i> Gestionar Participantes</h2>
                    <button onClick={() => navigate('/eventos/amigo-secreto')} className="btn-ver-lista">
                        <i className="fas fa-arrow-left"></i> Volver a Sala de Espera
                    </button>
                </div>
                <p style={{marginBottom: '1.5rem'}}>Selecciona los usuarios que participarán en el evento. Los cambios se guardarán para el sorteo.</p>
                
                {loading && <div className="loader"></div>}
                {error && <p style={{ color: '#ffcccc' }}>Error: {error}</p>}

                {!loading && !error && (
                    <div className="user-list-scroller" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {Array.isArray(projects) && projects.map(project => {
                             const filteredUsers = project.usuarios.filter(user => 
                                !excludedNormalizedNames.has(normalizeString(user.nombre))
                            );

                            if (filteredUsers.length === 0) return null;

                            return (
                                <div key={project.proyecto_id || 'unassigned'} className="project-group">
                                    <h3>{project.proyecto_nombre} ({filteredUsers.length} usuarios)</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                        {filteredUsers.map(user => (
                                            <li key={user.id}>
                                                <input
                                                    type="checkbox"
                                                    id={`user-${user.id}`}
                                                    checked={selectedUsers.has(user.id)}
                                                    onChange={() => handleSelectUser(user.id)}
                                                    style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                                <label htmlFor={`user-${user.id}`}>{user.nombre}</label>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}
                 <div className="gestion-participantes-footer">
                    <button onClick={handleSave} className="btn-add-deseo">
                        Guardar Selección
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GestionarParticipantes;

