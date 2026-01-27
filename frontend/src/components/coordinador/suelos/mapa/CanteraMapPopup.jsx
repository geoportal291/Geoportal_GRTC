import React, { useState } from 'react';
import './CanteraMapPopup.css';

const CanteraMapPopup = ({ cantera, onNavigate, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filtrar solo imágenes válidas si es necesario
    const imagenes = cantera?.imagenes || [];
    const hasImages = imagenes.length > 0;
    const currentImage = hasImages ? imagenes[currentIndex] : null;

    const handleNext = (e) => {
        e.stopPropagation();
        if (hasImages && currentIndex < imagenes.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        if (hasImages && currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const isFirst = currentIndex === 0;
    const isLast = !hasImages || currentIndex === imagenes.length - 1;

    const handleViewDetail = () => {
        if (onNavigate) {
            onNavigate(cantera);
        }
    };

    // Status Styling Helper
    const getStatusClass = (status) => {
        if (!status) return '';
        const s = status.toLowerCase();
        if (s.includes('aprobado') || s.includes('bueno')) return 'cmp-status-ok';
        if (s.includes('revis') || s.includes('regular')) return 'cmp-status-pending';
        return 'cmp-status-inactive';
    };

    return (
        <div className="cmp-container">
            {/* Header */}
            <div className="cmp-header">
                <span className="cmp-title" title={cantera.nombre}>{cantera.nombre || 'Cantera'}</span>
                {/* El botón X ya lo pone Leaflet, pero si quisieramos uno custom:
            <i className="fas fa-times" onClick={onClose} style={{cursor:'pointer'}}></i> 
        */}
            </div>

            {/* Gallery Section */}
            <div className="cmp-gallery">
                {hasImages ? (
                    <>
                        <img
                            src={currentImage.imagen_url}
                            alt={currentImage.descripcion || 'Imagen Cantera'}
                            className="cmp-image"
                        />

                        {imagenes.length > 1 && (
                            <>
                                <button className="cmp-nav-btn cmp-prev" onClick={handlePrev} disabled={isFirst}>
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <button className="cmp-nav-btn cmp-next" onClick={handleNext} disabled={isLast}>
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </>
                        )}

                        <div className="cmp-counter">
                            {currentIndex + 1} / {imagenes.length}
                        </div>

                        <div className="cmp-img-info-overlay">
                            <div>{currentImage.nombre_archivo}</div>
                            <div>{currentImage.created_at ? new Date(currentImage.created_at).toLocaleDateString() : ''}</div>
                        </div>
                    </>
                ) : (
                    <div className="cmp-no-image">
                        <i className="fas fa-camera-slash fa-2x"></i>
                        <span>Sin imágenes</span>
                    </div>
                )}
            </div>

            {/* Details Section */}
            <div className="cmp-details">
                <div className="cmp-row">
                    <span className="cmp-label">Código:</span>
                    <span className="cmp-value">{cantera.codigo || '-'}</span>
                </div>
                <div className="cmp-row">
                    <span className="cmp-label">Estado:</span>
                    <span className={`cmp-value ${getStatusClass(cantera.estado)}`}>{cantera.estado || 'N/A'}</span>
                </div>
                <div className="cmp-row">
                    <span className="cmp-label">Ubicación:</span>
                    <span className="cmp-value">
                        {cantera.progresiva_ref_nombre || cantera.progresiva_referencia || 'N/A'}
                    </span>
                </div>
                <div className="cmp-row">
                    <span className="cmp-label">Coordenada:</span>
                    <span className="cmp-value" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                        {cantera.coordenada_este || 0} E<br />
                        {cantera.coordenada_norte || 0} N
                    </span>
                </div>
                <div className="cmp-row">
                    <span className="cmp-label">Categoría:</span>
                    <span className="cmp-value">CANTERA</span>
                </div>
            </div>

            {/* Footer Action */}
            <div className="cmp-footer">
                <button className="cmp-btn-detail" onClick={handleViewDetail}>
                    VER DETALLADO
                </button>
            </div>
        </div>
    );
};

export default CanteraMapPopup;
