import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { useAuth } from '../../../../data/contexts/AuthContext';
import './FuenteImageGalleryModal.css';

const FuenteImageGalleryModal = ({ isOpen, onClose, fuenteAgua, onDataChange }) => {
    const { user } = useAuth();
    const [imagenes, setImagenes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null); // Imagen ampliada
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const API_URL = `${API_BASE}/api`;

    const fetchImagenes = useCallback(async () => {
        if (!fuenteAgua?.id) return;
        setLoading(true);
        try {
            setImagenes(fuenteAgua.imagenes || []);
        } catch (error) {
            alertify.error('Error al cargar las imágenes.');
        } finally {
            setLoading(false);
        }
    }, [fuenteAgua]);

    useEffect(() => {
        if (isOpen) {
            fetchImagenes();
            setSelectedImage(null);
            setSelectionMode(false);
            setSelectedIds(new Set());
        }
    }, [isOpen, fetchImagenes]);

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const token = user?.token;
            if (!token) throw new Error('No estás autenticado');

            const response = await axios.post(`${API_URL}/fuentes-agua/${fuenteAgua.id}/upload-bulk`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            const newImages = response.data.images || [];
            setImagenes(prev => [...prev, ...newImages]);
            alertify.success(`${newImages.length} imagen(es) subida(s) correctamente.`);

            if (onDataChange) onDataChange();
        } catch (error) {
            console.error('Error al subir imágenes:', error);
            const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Error al subir las imágenes.';
            alertify.error(errorMsg);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            event.target.value = null; // Reset input
        }
    };

    const handleDeleteImage = async (imagenId) => {
        alertify.confirm('Confirmar Eliminación', '¿Está seguro de que desea eliminar esta imagen?', async () => {
            try {
                const token = user?.token;
                if (!token) throw new Error('No estás autenticado');

                await axios.delete(`${API_URL}/fuentes-agua/imagenes/${imagenId}`, {
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

    const handleImageClick = (img) => {
        if (selectionMode) {
            const newSet = new Set(selectedIds);
            if (newSet.has(img.id)) {
                newSet.delete(img.id);
            } else {
                newSet.add(img.id);
            }
            setSelectedIds(newSet);
        } else {
            setSelectedImage(img.imagen_url);
        }
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedIds(new Set());
    };

    const handleBulkDelete = async () => {
        const idsToDelete = Array.from(selectedIds);
        if (idsToDelete.length === 0) return;

        alertify.confirm(
            'Eliminar Imágenes',
            `¿Estás seguro de que deseas eliminar las ${idsToDelete.length} imágenes seleccionadas?`,
            async () => {
                try {
                    const token = user?.token;
                    if (!token) throw new Error('No estás autenticado');

                    await axios.post(`${API_URL}/fuentes-agua/imagenes/bulk-delete`, { imageIds: idsToDelete }, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    setImagenes(prev => prev.filter(img => !selectedIds.has(img.id)));
                    setSelectedIds(new Set());
                    alertify.success(`${idsToDelete.length} imágenes eliminadas.`);
                    if (onDataChange) onDataChange();
                } catch (error) {
                    console.error('Error al eliminar imágenes:', error);
                    alertify.error('Error al eliminar las imágenes.');
                }
            },
            () => { }
        );
    };

    const handleCloseEnlargedImage = () => {
        setSelectedImage(null);
    };

    if (!isOpen) return null;

    return (
        <div className="overlay" onClick={onClose}>
            <div className="gallery-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="gallery-modal-header">
                    <h3>Galería de Imágenes: {fuenteAgua?.nombre}</h3>
                    <div className="header-actions">
                        {selectionMode ? (
                            <>
                                {selectedIds.size > 0 && (
                                    <button onClick={handleBulkDelete} className="btn-bulk-delete">
                                        Eliminar ({selectedIds.size})
                                    </button>
                                )}
                                <button onClick={toggleSelectionMode} className="btn-cancel-select">Cancelar</button>
                            </>
                        ) : (
                            <button onClick={toggleSelectionMode} className="btn-select-mode">Seleccionar</button>
                        )}
                        <button onClick={onClose} className="close-btn">&times;</button>
                    </div>
                </div>
                <div className="gallery-modal-body" style={{ position: 'relative' }}>
                    {isUploading && (
                        <div className="upload-loading-overlay">
                            <div className="upload-spinner"></div>
                            <span className="upload-status-text">
                                {uploadProgress < 100
                                    ? `Subiendo archivos... ${uploadProgress}%`
                                    : 'Procesando en el servidor...'}
                            </span>
                            <div className="upload-progress-container">
                                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <p>Cargando imágenes...</p>
                    ) : imagenes.length > 0 ? (
                        <div className="image-grid">
                            {imagenes.map(img => {
                                const isSelected = selectedIds.has(img.id);
                                return (
                                    <div key={img.id} className={`image-card ${isSelected ? 'selected' : ''}`} onClick={() => selectionMode && handleImageClick(img)}>
                                        <div className="image-container">
                                            <img
                                                src={img.imagen_url}
                                                alt={img.descripcion || 'Imagen de fuente de agua'}
                                                onClick={() => !selectionMode && handleImageClick(img)}
                                            />
                                            {selectionMode && (
                                                <div className={`selection-checkbox ${isSelected ? 'checked' : ''}`}>
                                                    {isSelected && <i className="fas fa-check"></i>}
                                                </div>
                                            )}
                                            {!selectionMode && (
                                                <button className="delete-image-btn" onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}>&times;</button>
                                            )}
                                        </div>
                                        <div className="image-card-footer">
                                            <p title={img.nombre_archivo}>{img.nombre_archivo || 'Nombre no disponible'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-gallery-message">
                            <i className="fas fa-image"></i>
                            <p>No hay imágenes para esta fuente de agua.</p>
                        </div>
                    )}
                </div>
                <div className="gallery-modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {/* Botón para Añadir Archivos */}
                    <label htmlFor="add-image-input" className={`btn-add-image ${isUploading ? 'disabled' : ''}`} style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                        <i className="fas fa-images" style={{ marginRight: '6px' }}></i>
                        {isUploading ? 'Subiendo...' : 'Añadir Archivos'}
                    </label>
                    <input
                        id="add-image-input"
                        type="file"
                        accept="image/*,.zip,.rar"
                        multiple
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        disabled={isUploading}
                    />

                    {/* Botón para Subir Carpeta */}
                    <label htmlFor="add-folder-input" className={`btn-add-image ${isUploading ? 'disabled' : ''}`} style={{ background: '#f59e0b', borderColor: '#d97706', cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                        <i className="fas fa-folder-open" style={{ marginRight: '6px' }}></i>
                        {isUploading ? 'Subiendo...' : 'Subir Carpeta'}
                    </label>
                    <input
                        id="add-folder-input"
                        type="file"
                        webkitdirectory="true"
                        directory="true"
                        multiple
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

export default FuenteImageGalleryModal;
