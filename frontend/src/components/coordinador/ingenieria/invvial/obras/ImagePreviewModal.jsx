import React from 'react';
import { saveAs } from 'file-saver';

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, onNext, onPrev, hasNext, hasPrev }) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        saveAs(imageUrl, 'imagen_detalle.jpg');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.3s ease-in-out'
        }} onClick={onClose}>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px', // Espacio entre flechas e imagen
                maxWidth: '95%',
                maxHeight: '95%',
                marginTop: '60px'
            }} onClick={(e) => e.stopPropagation()}>

                {/* Left Arrow */}
                {hasPrev ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            padding: '10px 15px',
                            borderRadius: '50%',
                            transition: 'background 0.3s',
                            zIndex: 10003,
                            flexShrink: 0 // Evitar que se encoja
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        &#10094;
                    </button>
                ) : (
                    <div style={{ width: '50px' }}></div> // Espacio reservado si no hay flecha
                )}

                <div style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: 'calc(100% - 140px)' // Restar espacio de las flechas
                }}>

                    <img
                        src={imageUrl}
                        alt="Preview"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '75vh',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                        }}
                    />

                    <div style={{
                        marginTop: '15px',
                        display: 'flex',
                        gap: '15px'
                    }}>
                        <button
                            onClick={handleDownload}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                        >
                            <i className="fas fa-download"></i> Descargar
                        </button>

                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                        >
                            <i className="fas fa-times"></i> Cerrar
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '-40px',
                            right: '-40px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            opacity: 0.8,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
                    >
                        &times;
                    </button>
                </div>

                {/* Right Arrow */}
                {hasNext ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            fontSize: '2rem',
                            cursor: 'pointer',
                            padding: '10px 15px',
                            borderRadius: '50%',
                            transition: 'background 0.3s',
                            zIndex: 10003,
                            flexShrink: 0
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        &#10095;
                    </button>
                ) : (
                    <div style={{ width: '50px' }}></div>
                )}

            </div>

            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
};

export default ImagePreviewModal;
