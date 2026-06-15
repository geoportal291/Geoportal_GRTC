import React from 'react';
import './FuenteImageThumbnails.css';

const FuenteImageThumbnails = ({ imagenes, onContainerClick }) => {
    const hasImages = imagenes && imagenes.length > 0;
    const thumbnailsToShow = hasImages ? imagenes.slice(0, 8) : [];

    return (
        <div className="thumbnail-section-container" onClick={onContainerClick} style={{ cursor: 'pointer' }}>
            <h4 className="thumbnail-section-header">
                Galería {hasImages ? `(${imagenes.length} imágenes)` : ''}
            </h4>
            {hasImages ? (
                <div className="thumbnail-grid">
                    {thumbnailsToShow.map(img => (
                        <div key={img.id} className="thumbnail-card">
                            <div className="thumbnail-image-container">
                                <img 
                                    src={img.imagen_url} 
                                    alt={img.descripcion || 'Imagen de fuente de agua'} 
                                />
                            </div>
                            <div className="thumbnail-card-footer">
                                <p title={img.nombre_archivo}>{img.nombre_archivo || 'Nombre no disponible'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-images-message">
                    <p>No hay imágenes en esta fuente de agua</p>
                </div>
            )}
        </div>
    );
};

export default FuenteImageThumbnails;
