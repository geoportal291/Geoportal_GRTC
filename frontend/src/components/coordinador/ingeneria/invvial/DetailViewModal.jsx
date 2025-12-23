import React, { useState, useEffect } from 'react';
import DetalleAlcantarillaView from './obras/DetalleAlcantarillaView';
import DetalleBadenView from './obras/DetalleBadenView';
import DetallePuenteView from './obras/DetallePuenteView';
import DetalleMuroView from './obras/DetalleMuroView';
import DetalleZonaCriticaView from './obras/DetalleZonaCriticaView';
import DetalleSenalInformativaView from './obras/DetalleSenalInformativaView';
import DetalleSenalPreventivaView from './obras/DetalleSenalPreventivaView';
import DetalleInterferenciaView from './obras/DetalleInterferenciaView';
import axiosInstance from '../../../../api/axios';

/**
 * Modal independiente para mostrar vista detallada de elementos desde el mapa externo
 */
const DetailViewModal = ({ show, onClose, elementData, elementType, projectId, vialHeaderOption }) => {
    const [images, setImages] = useState([]);
    const [isLoadingImages, setIsLoadingImages] = useState(false);

    useEffect(() => {
        if (show && elementData && projectId) {
            fetchImages();
        }
    }, [show, elementData, projectId, vialHeaderOption]);

    const fetchImages = async () => {
        setIsLoadingImages(true);
        try {
            const entregableMatch = vialHeaderOption?.match(/(\d+)/);
            const entregableNum = entregableMatch ? entregableMatch[1] : null;

            const response = await axiosInstance.get(
                `/api/alcantarillas/graphics/${projectId}`,
                {
                    params: entregableNum ? { entregable: `E-${entregableNum}` } : {}
                }
            );

            if (response.data && response.data.images) {
                setImages(response.data.images);
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            setImages([]);
        } finally {
            setIsLoadingImages(false);
        }
    };

    if (!show) {
        return null;
    }

    const renderDetailView = () => {
        if (!elementData) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p>No hay datos disponibles para mostrar.</p>
                </div>
            );
        }

        switch (elementType) {
            case 'alcantarillas':
                return (
                    <DetalleAlcantarillaView
                        alcantarilla={elementData}
                        images={images}
                        onBack={onClose}
                    />
                );
            case 'badenes':
                return (
                    <DetalleBadenView
                        baden={elementData}
                        images={images}
                        onBack={onClose}
                    />
                );
            case 'puentes':
                return (
                    <DetallePuenteView
                        puente={elementData}
                        images={images}
                        onBack={onClose}
                    />
                );
            case 'muros':
                return (
                    <DetalleMuroView
                        muro={elementData}
                        images={images}
                        onBack={onClose}
                    />
                );
            case 'zonas_criticas':
                return (
                    <DetalleZonaCriticaView
                        zonaCritica={elementData}
                        images={images}
                        onBack={onClose}
                    />
                );
            case 'senales_informativas':
                return (
                    <DetalleSenalInformativaView
                        senalInformativa={elementData}
                        images={images}
                        onBack={onClose}
                    />
                );
            case 'senales_preventivas':
                return (
                    <DetalleSenalPreventivaView
                        senalPreventiva={elementData}
                        images={images}
                        onBack={onClose}
                    />
                );
            case 'interferencias':
                return (
                    <DetalleInterferenciaView
                        interferencia={elementData}
                        images={images}
                        onBack={onClose}
                    />
                );
            default:
                return (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p>Vista de detalle no disponible para este tipo de elemento: {elementType}</p>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                );
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200000,
            fontFamily: 'Arial, sans-serif',
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                maxWidth: '900px',
                width: '95%',
                zIndex: 200001,
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.8rem',
                    cursor: 'pointer',
                    color: '#555',
                    transition: 'color 0.2s ease',
                    zIndex: 10
                }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#333'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#555'}
                >
                    &times;
                </button>

                <div className="detail-modal-body">
                    {isLoadingImages ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <p>Cargando imágenes...</p>
                        </div>
                    ) : (
                        renderDetailView()
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailViewModal;
