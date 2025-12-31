import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { useAuth } from '../../../../data/contexts/AuthContext';
import './CanteraImageGalleryModal.css';

const CanteraImageGalleryModal = ({ isOpen, onClose, cantera, onDataChange }) => {
    const { user } = useAuth();
    const [imagenes, setImagenes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); // Nuevo estado para la imagen ampliada

    // API URL definition consistent with other components
    const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const API_URL = `${API_BASE}/api`;

    const fetchImagenes = useCallback(async () => {
        if (!cantera?.id) return;
        setLoading(true);
        try {
            // Optional: You might want to fetch fresh images from valid endpoint if needed
            // But currently it relies on 'cantera.imagenes' passed as prop, which is updated by parent
            setImagenes(cantera.imagenes || []);

            // If we wanted to fetch fresh status:
            // const response = await axios.get(`${API_URL}/canteras/${cantera.id}/imagenes`, { headers: { Authorization: `Bearer ${user?.token}` } });
            // setImagenes(response.data);

        } catch (error) {
            alertify.error('Error al cargar las imágenes.');
        } finally {
            setLoading(false);
        }
    }, [cantera]);

    useEffect(() => {
        if (isOpen) {
            fetchImagenes();
            setSelectedImage(null); // Resetear imagen seleccionada al abrir el modal
        }
    }, [isOpen, fetchImagenes]);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('imagen_cantera', file);
        formData.append('canteraId', cantera.id);
        formData.append('descripcion', 'Imagen de la cantera');

        setIsUploading(true);
        try {
            const token = user?.token;
            if (!token) throw new Error('No estás autenticado');

            const response = await axios.post(`${API_URL}/canteras/upload-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setImagenes(prev => [...prev, response.data]);
            alertify.success('Imagen subida correctamente.');
            if (onDataChange) onDataChange();
        } catch (error) {
            console.error('Error al subir imagen:', error);
            const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Error al subir la imagen.';
            alertify.error(errorMsg);
        } finally {
            setIsUploading(false);
            event.target.value = null; // Resetear el input para permitir subir la misma imagen de nuevo
        }
    };

    const handleDeleteImage = async (imagenId) => {
        alertify.confirm('Confirmar Eliminación', '¿Está seguro de que desea eliminar esta imagen?', async () => {
            try {
                const token = user?.token;
                if (!token) throw new Error('No estás autenticado');

                await axios.delete(`${API_URL}/canteras/imagenes/${imagenId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setImagenes(prev => prev.filter(img => img.id !== imagenId));
                alertify.success('Imagen eliminada.');
                if (onDataChange) onDataChange();
            } catch (error) {
                console.error('Error al eliminar imagen:', error);
                alertify.error('Error al eliminar la imagen.');
            }
        }, () => { });
    };

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const handleCloseEnlargedImage = () => {
        setSelectedImage(null);
    };

    if (!isOpen) return null;

    return (
        <div className="overlay" onClick={onClose}>
            <div className="gallery-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="gallery-modal-header">
                    <h3>Galería de Imágenes: {cantera?.nombre}</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="gallery-modal-body">
                    {loading ? (
                        <p>Cargando imágenes...</p>
                    ) : imagenes.length > 0 ? (
                        <div className="image-grid">
                            {imagenes.map(img => (
                                <div key={img.id} className="image-card">
                                    <div className="image-container">
                                        <img
                                            src={img.imagen_url}
                                            alt={img.descripcion || 'Imagen de cantera'}
                                            onClick={() => handleImageClick(img.imagen_url)} // Manejador de clic
                                        />
                                        <button className="delete-image-btn" onClick={() => handleDeleteImage(img.id)}>&times;</button>
                                    </div>
                                    <div className="image-card-footer">
                                        <p title={img.nombre_archivo}>{img.nombre_archivo || 'Nombre no disponible'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-gallery-message">
                            <i className="fas fa-image"></i>
                            <p>No hay imágenes para esta cantera.</p>
                        </div>
                    )}
                </div>
                <div className="gallery-modal-footer">
                    <label htmlFor="add-image-input" className={`btn-add-image ${isUploading ? 'disabled' : ''}`}>
                        {isUploading ? 'Subiendo...' : 'Añadir Imagen'}
                    </label>
                    <input
                        id="add-image-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        disabled={isUploading}
                    />
                </div>
            </div>

            {selectedImage && (
                <div className="enlarged-image-overlay" onClick={handleCloseEnlargedImage}>
                    <div className="enlarged-image-container" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedImage} alt="Imagen ampliada" className="enlarged-image" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        <button onClick={handleCloseEnlargedImage} className="enlarged-image-close-btn">&times;</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CanteraImageGalleryModal;
