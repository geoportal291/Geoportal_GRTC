import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CanteraMapPopup.css'; // Reutilizamos estilos

const ProgresivaMapPopup = ({ progresiva, onNavigate, token }) => {
    const [imagenes, setImagenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        let isMounted = true;
        const fetchImages = async () => {
            try {
                setLoading(true);
                // Construir URL base simple si no hay ENV disponible en este contexto aislado
                // Pero process.env suele estar disponible en build time.
                const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';

                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const res = await axios.get(`${API_BASE}/api/progresivas/${progresiva.id}/imagenes`, { headers });
                if (isMounted) {
                    setImagenes(res.data || []);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching progresiva images", err);
                if (isMounted) setLoading(false);
            }
        };

        if (progresiva?.id) {
            fetchImages();
        }
        return () => { isMounted = false; };
    }, [progresiva, token]);

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
            onNavigate(progresiva);
        }
    };

    const getStatusClass = (status) => {
        if (!status) return 'cmp-status-pending';
        const s = status.toLowerCase();
        if (s.includes('aprobado') || s.includes('listo')) return 'cmp-status-ok';
        if (s.includes('revis')) return 'cmp-status-warning'; // Amarillo
        if (s.includes('inactivo')) return 'cmp-status-inactive';
        return 'cmp-status-pending';
    };

    // Calcular "Ubicación" tipo "Km 04+500"
    const formatProgresiva = (progObj) => {
        if (progObj.nombre && progObj.nombre.toUpperCase().includes('KM')) return progObj.nombre;
        if (typeof progObj.progresiva_inicial === 'number') {
            const km = Math.floor(progObj.progresiva_inicial / 1000);
            const m = Math.round(progObj.progresiva_inicial % 1000);
            return `Km ${String(km).padStart(2, '0')}+${String(m).padStart(3, '0')}`;
        }
        return progObj.nombre || '-';
    };

    const formatCoord = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? '-' : num.toFixed(3);
    };

    return (
        <div className="cmp-container">
            {/* Header */}
            <div className="cmp-header">
                <span className="cmp-title" title={progresiva.nombre}>
                    {progresiva.nombre?.toUpperCase() || 'PROGRESIVA'}
                </span>
            </div>

            {/* Gallery Section */}
            <div className="cmp-gallery">
                {loading ? (
                    <div className="cmp-no-image">
                        <span>Cargando fotos...</span>
                    </div>
                ) : hasImages ? (
                    <>
                        <img
                            src={currentImage.imagen_url}
                            alt={currentImage.descripcion || 'Imagen Progresiva'}
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
                    <span className="cmp-label">CÓDIGO:</span>
                    <span className="cmp-value">{progresiva.codigo || '-'}</span>
                </div>
                <div className="cmp-row">
                    <span className="cmp-label">ESTADO:</span>
                    <span className={`cmp-value ${getStatusClass(progresiva.estado)}`}>
                        {progresiva.estado || 'Pendiente'}
                    </span>
                </div>
                <div className="cmp-row">
                    <span className="cmp-label">UBICACIÓN:</span>
                    <span className="cmp-value">{formatProgresiva(progresiva)}</span>
                </div>
                <div className="cmp-row">
                    <span className="cmp-label">COORDENADA:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className="cmp-value-mono">{formatCoord(progresiva.coordenada_este)} E</span>
                        <span className="cmp-value-mono">{formatCoord(progresiva.coordenada_norte)} N</span>
                    </div>
                </div>
                <div className="cmp-row">
                    <span className="cmp-label">CATEGORÍA:</span>
                    <span className="cmp-value">PROGRESIVA</span>
                </div>
            </div>

            {/* Footer / Action */}
            <button className="cmp-action-btn" onClick={handleViewDetail}>
                VER DETALLADO
            </button>
        </div>
    );
};

export default ProgresivaMapPopup;
