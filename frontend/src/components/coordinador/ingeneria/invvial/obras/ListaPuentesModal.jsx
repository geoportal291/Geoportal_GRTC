import React, { useState, useMemo, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import './ListaAlcantarillasModal.css'; // Reusing CSS
import FormularioPuenteView from '../AlcantarillaModalViews/FormularioPuenteView';
import Swal from 'sweetalert2';
import axiosInstance from '../../../../../api/axios';

const ListaPuentesModal = ({ show, onClose, puentesData, route, graphicsImages, initialSelectedPuente }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list', 'edit', 'create'
    const [selectedPuente, setSelectedPuente] = useState(null);
    const [formData, setFormData] = useState({});
    const [puenteImages, setPuenteImages] = useState([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

    useEffect(() => {
        if (show) {
            if (initialSelectedPuente) {
                handleEdit(initialSelectedPuente);
            } else {
                setViewMode('list');
                setSearchTerm('');
            }
        }
    }, [show, initialSelectedPuente]);

    useEffect(() => {
        if (selectedPuente && selectedPuente.panel_fotografico_codigo && graphicsImages) {
            const code = String(selectedPuente.panel_fotografico_codigo); // Ensure code is a string
            const parts = code.split(' - ');
            const rangePart = parts[0];
            const suffix = parts.length > 1 ? `-${parts[1]}` : '';

            let start, end;

            if (rangePart.includes('-')) {
                const [startStr, endStr] = rangePart.split('-');
                start = parseInt(startStr, 10);
                end = parseInt(endStr, 10);
            } else {
                start = parseInt(rangePart, 10);
                end = start; // Treat single number as a range of one
            }

            if (!isNaN(start) && !isNaN(end)) {
                const expectedNames = [];
                for (let i = start; i <= end; i++) {
                    expectedNames.push(`${i}${suffix}`);
                }

                const filtered = graphicsImages.filter(img => {
                    const imgNameWithoutExt = img.index.split('.')[0];
                    return expectedNames.includes(imgNameWithoutExt);
                });
                setPuenteImages(filtered);
            } else {
                setPuenteImages([]);
            }
        } else {
            setPuenteImages([]);
        }
    }, [selectedPuente, graphicsImages]);


    const filteredPuentes = useMemo(() => {
        return puentesData.filter(puente =>
            (puente.progresiva && puente.progresiva.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (puente.nombre && puente.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (puente.clase && puente.clase.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [puentesData, searchTerm]);

    const handleEdit = (puente) => {
        setSelectedPuente(puente);
        setFormData(puente);
        setViewMode('edit');
    };

    const handleCreate = () => {
        setSelectedPuente(null);
        setFormData({});
        setViewMode('create');
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (viewMode === 'create') {
                await axiosInstance.post('/api/puentes', formData);
                Swal.fire('Éxito', 'Puente creado correctamente', 'success');
            } else {
                await axiosInstance.put(`/api/puentes/${selectedPuente.id_puente}`, formData);
                Swal.fire('Éxito', 'Puente actualizado correctamente', 'success');
            }
            onClose(); // Close modal to refresh data (parent should handle refresh)
            // Ideally, we should trigger a refresh in the parent component
            window.location.reload(); // Temporary fix to refresh data
        } catch (error) {
            console.error('Error saving puente:', error);
            Swal.fire('Error', 'No se pudo guardar el puente', 'error');
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminarlo!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Implement delete endpoint if needed, for now just log
                    console.log('Delete puente', id);
                    // await axiosInstance.delete(`/api/puentes/${id}`);
                    Swal.fire('Eliminado!', 'El puente ha sido eliminado.', 'success');
                    onClose();
                    window.location.reload();
                } catch (error) {
                    Swal.fire('Error', 'No se pudo eliminar el puente', 'error');
                }
            }
        });
    };

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{viewMode === 'list' ? 'Lista de Puentes' : (viewMode === 'create' ? 'Nuevo Puente' : 'Editar Puente')}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {viewMode === 'list' ? (
                        <>
                            <div className="search-bar">
                                <input
                                    type="text"
                                    placeholder="Buscar por progresiva, nombre o clase..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <button className="create-button" onClick={handleCreate}>Nuevo Puente</button>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Progresiva</th>
                                            <th>Nombre</th>
                                            <th>Clase</th>
                                            <th>Tipo</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPuentes.map(puente => (
                                            <tr key={puente.id_puente}>
                                                <td>{puente.progresiva}</td>
                                                <td>{puente.nombre}</td>
                                                <td>{puente.clase}</td>
                                                <td>{puente.tipo}</td>
                                                <td>{puente.estado}</td>
                                                <td>
                                                    <button onClick={() => handleEdit(puente)}>Editar</button>
                                                    <button onClick={() => handleDelete(puente.id_puente)}>Eliminar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="form-container">
                            <FormularioPuenteView
                                formData={formData}
                                handleChange={handleFormChange}
                                handleSubmit={handleFormSubmit}
                                modalViewMode={viewMode}
                                setModalViewMode={setViewMode}
                                submitButtonText={viewMode === 'create' ? 'Crear' : 'Guardar Cambios'}
                            />
                            {viewMode === 'edit' && puenteImages.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <h5 style={{ marginBottom: '10px' }}>Imágenes de Panel Fotográfico</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {puenteImages.map(img => (
                                            <div key={img.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                                                <img
                                                    src={`${img.url}?v=${img.id}`}
                                                    alt={`Imagen ${img.index}`}
                                                    style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'cover', cursor: 'pointer' }}
                                                    onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }}
                                                />
                                                <p style={{ fontSize: '0.8em', margin: '5px 0 0 0' }}>{img.index}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {isPreviewModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10002,
                }}>
                    <img src={previewImageUrl} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                    <button onClick={() => setIsPreviewModalOpen(false)} style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#333',
                    }}>&times;</button>
                </div>
            )}
        </div>
    );
};

export default ListaPuentesModal;
