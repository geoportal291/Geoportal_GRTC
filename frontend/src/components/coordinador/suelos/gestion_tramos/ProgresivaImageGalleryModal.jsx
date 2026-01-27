import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { useAuth } from '../../../../data/contexts/AuthContext';
import '../canteras/CanteraImageGalleryModal.css'; // Reutilizamos estilos

const ProgresivaImageGalleryModal = ({ isOpen, onClose, progresiva, onDataChange }) => {
    const { user } = useAuth();
    const [imagenes, setImagenes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const API_URL = `${API_BASE}/api`;

    const fetchImagenes = useCallback(async () => {
        if (!progresiva?.id) return;
        console.log('[DEBUG Gallery] Fetching images for ID:', progresiva.id);
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${user?.token}` };
            const response = await axios.get(`${API_URL}/progresivas/${progresiva.id}/imagenes`, { headers });
            console.log('[DEBUG Gallery] Response:', response.data);
            setImagenes(response.data || []);
        } catch (error) {
            console.error(error);
            alertify.error('Error al cargar las imágenes.');
        } finally {
            setLoading(false);
        }
    }, [progresiva, user, API_URL]);

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
        formData.append('imagen', files[0]); // Por ahora individual según API simple, o iterar si queremos múltiple
        formData.append('progresivaId', progresiva.id);

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const token = user?.token;
            if (!token) throw new Error('No estás autenticado');

            // Subida individual básica por ahora, se puede mejorar a Bulk si el backend lo soporta
            // Iteramos si son varios (fallback simple si la API es single)
            const totalFiles = files.length;
            let completed = 0;

            for (let i = 0; i < totalFiles; i++) {
                const singleFormData = new FormData();
                singleFormData.append('imagen', files[i]);
                singleFormData.append('progresivaId', progresiva.id);
                singleFormData.append('descripcion', 'Subida desde galería');

                await axios.post(`${API_URL}/progresiva-imagen/upload`, singleFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    }
                });
                completed++;
                setUploadProgress(Math.round((completed / totalFiles) * 100));
            }

            alertify.success(`${completed} imagen(es) subida(s) correctamente.`);
            fetchImagenes(); // Recargar
            if (onDataChange) onDataChange();

        } catch (error) {
            console.error('Error al subir imágenes:', error);
            alertify.error('Error al subir las imágenes.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            event.target.value = null;
        }
    };

    const handleDeleteImage = async (imagenId) => {
        alertify.confirm('Confirmar Eliminación', '¿Está seguro de que desea eliminar esta imagen?', async () => {
            try {
                const token = user?.token;
                await axios.delete(`${API_URL}/progresiva-imagen/${imagenId}`, {
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

    // Funcionalidad de selección y zoom (copiada igual)
    const handleImageClick = (img) => {
        if (selectionMode) {
            const newSet = new Set(selectedIds);
            if (newSet.has(img.id)) newSet.delete(img.id);
            else newSet.add(img.id);
            setSelectedIds(newSet);
        } else {
            setSelectedImage(img.imagen_url);
        }
    };

    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedIds(new Set());
    };

    // Placeholder para bulk delete si implementamos backend route mas tarde
    const handleBulkDelete = async () => {
        alertify.alert('Eliminación Masiva', 'Funcionalidad pendiente de implementar en backend de progresivas.');
    };

    const handleCloseEnlargedImage = () => setSelectedImage(null);

    if (!isOpen) return null;

    return (
        <div className="overlay" onClick={onClose}>
            <div className="gallery-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="gallery-modal-header">
                    <h3>Galería: {progresiva?.nombre}</h3>
                    <div className="header-actions">
                        {/* Selection mode hidden for now until Bulk Delete backend ready */}
                        {/* 
                        {selectionMode ? (
                            <>
                                <button onClick={handleBulkDelete} className="btn-bulk-delete">Eliminar ({selectedIds.size})</button>
                                <button onClick={toggleSelectionMode} className="btn-cancel-select">Cancelar</button>
                            </>
                        ) : (
                            <button onClick={toggleSelectionMode} className="btn-select-mode">Seleccionar</button>
                        )} 
                        */}
                        <button onClick={onClose} className="close-btn">&times;</button>
                    </div>
                </div>
                <div className="gallery-modal-body" style={{ position: 'relative' }}>
                    {isUploading && (
                        <div className="upload-loading-overlay">
                            <div className="upload-spinner"></div>
                            <span className="upload-status-text">Subiendo... {uploadProgress}%</span>
                        </div>
                    )}

                    {loading ? (
                        <p>Cargando...</p>
                    ) : imagenes.length > 0 ? (
                        <div className="image-grid">
                            {imagenes.map(img => (
                                <div key={img.id} className="image-card" onClick={() => selectionMode && handleImageClick(img)}>
                                    <div className="image-container">
                                        <img
                                            src={img.imagen_url}
                                            alt="Foto progresiva"
                                            onClick={() => !selectionMode && handleImageClick(img)}
                                        />
                                        {!selectionMode && (
                                            <button className="delete-image-btn" onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}>&times;</button>
                                        )}
                                    </div>
                                    <div className="image-card-footer">
                                        <p title={img.nombre_archivo}>{img.nombre_archivo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-gallery-message">
                            <i className="fas fa-camera"></i>
                            <p>Sin imágenes. Sube fotos o usa la importación masiva DOCX.</p>
                        </div>
                    )}
                </div>
                <div className="gallery-modal-footer">
                    <label htmlFor="add-prog-image" className={`btn-add-image ${isUploading ? 'disabled' : ''}`}>
                        {isUploading ? 'Subiendo...' : 'Añadir Foto'}
                    </label>
                    <input
                        id="add-prog-image"
                        type="file"
                        accept="image/*"
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
                        <img src={selectedImage} alt="Ampliada" className="enlarged-image" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                        <button onClick={handleCloseEnlargedImage} className="enlarged-image-close-btn">&times;</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgresivaImageGalleryModal;
