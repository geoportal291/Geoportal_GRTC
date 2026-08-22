import React, { useState, useEffect } from 'react';
import axiosInstance from '@/api/axios';
import Swal from 'sweetalert2';

const ObservationsSidebar = ({ projectId, elementId, elementType, canComment }) => {
    const [observaciones, setObservaciones] = useState([]);
    const [newObservacion, setNewObservacion] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (projectId && elementId && elementType) {
            fetchObservaciones();
        } else {
            setObservaciones([]);
        }
    }, [projectId, elementId, elementType]);

    const fetchObservaciones = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`/api/observaciones/${projectId}/${elementType}/${elementId}`);
            setObservaciones(response.data);
        } catch (error) {
            console.error('Error fetching observaciones:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddObservacion = async () => {
        if (!newObservacion.trim()) return;

        try {
            await axiosInstance.post('/api/observaciones', {
                proyecto_id: projectId,
                elemento_id: elementId,
                tipo_elemento: elementType,
                observacion: newObservacion
            });

            setNewObservacion('');
            fetchObservaciones();
            Swal.fire({
                icon: 'success',
                title: 'Observación agregada',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } catch (error) {
            console.error('Error adding observacion:', error);
            Swal.fire('Error', 'No se pudo agregar la observación', 'error');
        }
    };

    if (!elementId) return null;

    return (
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-comments" style={{ color: '#3498db' }}></i>
                Observaciones
            </h4>

            <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#f8f9fa', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e9ecef' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>Cargando...</div>
                ) : observaciones.length === 0 ? (
                    <p style={{ color: '#aaa', fontStyle: 'italic', margin: 0, textAlign: 'center', fontSize: '0.9rem' }}>No hay observaciones registradas.</p>
                ) : (
                    observaciones.map((obs) => (
                        <div key={obs.id} style={{ background: 'white', border: '1px solid #dee2e6', borderRadius: '6px', padding: '10px', marginBottom: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <strong style={{ fontSize: '0.85rem', color: '#2c3e50' }}>{obs.usuario_nombre || 'Usuario'}</strong>
                                <span style={{ fontSize: '0.75rem', color: '#95a5a6' }}>{new Date(obs.fecha_registro).toLocaleDateString()} {new Date(obs.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#495057', whiteSpace: 'pre-wrap' }}>{obs.observacion}</div>
                        </div>
                    ))
                )}
            </div>

            {canComment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                        value={newObservacion}
                        onChange={(e) => setNewObservacion(e.target.value)}
                        placeholder="Escribe una observación..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #ced4da',
                            resize: 'vertical',
                            minHeight: '60px',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem'
                        }}
                    />
                    <button
                        onClick={handleAddObservacion}
                        disabled={!newObservacion.trim()}
                        style={{
                            alignSelf: 'flex-end',
                            backgroundColor: newObservacion.trim() ? '#3498db' : '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '8px 20px',
                            cursor: newObservacion.trim() ? 'pointer' : 'default',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        Enviar <i className="fas fa-paper-plane" style={{ marginLeft: '5px' }}></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ObservationsSidebar;
