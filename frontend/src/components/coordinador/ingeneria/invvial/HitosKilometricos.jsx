import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { CSSTransition } from 'react-transition-group';
import './obras/Alcantarillas.css'; // Reusing styles
import Geoite from './map/geoite';
import './map/geoite.css';
import ListaHitosKilometricosModal from './obras/ListaHitosKilometricosModal';
import ExportarMapaModal from './obras/ExportarMapaModal';
import ImagePreviewModal from './obras/ImagePreviewModal';
import { saveAs } from 'file-saver';
import axiosInstance from '../../../../api/axios';

const HitosKilometricos = ({ hitosData, graphicsImages, canUpload, showModal, onElementSelect }) => {
    const [selectedHito, setSelectedHito] = useState(null);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    const [hitoImages, setHitoImages] = useState([]);
    const [hitosWithImages, setHitosWithImages] = useState([]);

    // Modals
    const [showListModal, setShowListModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

    const infoRef = useRef(null);

    // Filter images effect (Side Panel)
    useEffect(() => {
        if (selectedHito && selectedHito.panel_fotografico_codigo && graphicsImages) {
            const code = String(selectedHito.panel_fotografico_codigo).trim();

            // 1. Parse Ranges
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
                end = start;
            }

            const expectedNames = [];
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) expectedNames.push(`${i}${suffix}`);
            } else {
                expectedNames.push(code);
            }

            // 2. Filter Images
            const filtered = graphicsImages.filter(img => {
                const imgNameWithoutExt = img.index.split('.')[0];
                const imgEntregable = img.entregable ? String(img.entregable).trim() : null;
                const entregable = selectedHito.entregable ? String(selectedHito.entregable).trim() : null;

                // A. Name Check
                const nameMatches = expectedNames.includes(imgNameWithoutExt);
                if (!nameMatches) return false;

                // B. Entregable Logic
                const normalize = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                if (entregable) {
                    const normElement = normalize(entregable);
                    const normImage = normalize(imgEntregable);

                    if (normElement === 'E1') {
                        return (!imgEntregable) || (normImage === 'E1');
                    }
                    return normImage === normElement;
                }
                return true;
            });
            setHitoImages(filtered);
        } else {
            setHitoImages([]);
        }
    }, [selectedHito, graphicsImages]);

    // Bulk Image Processing for Map
    useEffect(() => {
        if (hitosData.length > 0 && graphicsImages.length > 0) {
            const processed = hitosData.map(hito => {
                const code = hito.panel_fotografico_codigo ? String(hito.panel_fotografico_codigo) : null;
                let imageUrls = [];

                if (code) {
                    // 1. Parse Ranges
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
                        end = start;
                    }

                    const expectedNames = [];
                    if (!isNaN(start) && !isNaN(end)) {
                        for (let i = start; i <= end; i++) expectedNames.push(`${i}${suffix}`);
                    } else {
                        expectedNames.push(code);
                    }

                    // 2. Filter Images
                    const foundImages = graphicsImages.filter(img => {
                        const imgNameWithoutExt = img.index.split('.')[0];
                        const imgEntregable = img.entregable ? String(img.entregable).trim() : null;
                        const entregable = hito.entregable ? String(hito.entregable).trim() : null;

                        const nameMatches = expectedNames.includes(imgNameWithoutExt);
                        if (!nameMatches) return false;

                        const normalize = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                        if (entregable) {
                            const normElement = normalize(entregable);
                            const normImage = normalize(imgEntregable);
                            if (normElement === 'E1') {
                                return (!imgEntregable) || (normImage === 'E1');
                            }
                            return normImage === normElement;
                        }
                        return true;
                    });

                    if (foundImages.length > 0) {
                        imageUrls = foundImages.map(img => `${img.url}?v=${img.id}`);
                    }
                }
                return { ...hito, imageUrls, type: 'hitos_kilometricos' };
            });
            setHitosWithImages(processed);
        } else {
            setHitosWithImages(hitosData.map(s => ({ ...s, imageUrls: [], type: 'hitos_kilometricos' })));
        }
    }, [hitosData, graphicsImages]);

    const handleHitoClick = useCallback((hito) => {
        setSelectedHito(hito);
        setIsInfoVisible(true);
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            title: 'Hito Seleccionado',
            text: `Código: ${hito.codigo}`,
            icon: 'success'
        });
    }, []);

    const handleShowDetails = useCallback((hito) => {
        setSelectedHito(hito);
        setShowListModal(true);
    }, []);

    const handleEditElement = (element) => {
        if (onElementSelect) {
            onElementSelect(element);
        }
    };

    const handleNextImage = () => {
        const currentIndex = hitoImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex !== -1 && currentIndex < hitoImages.length - 1) {
            setPreviewImageUrl(hitoImages[currentIndex + 1].url);
        }
    };

    const handlePrevImage = () => {
        const currentIndex = hitoImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex > 0) {
            setPreviewImageUrl(hitoImages[currentIndex - 1].url);
        }
    };

    const currentImageIndex = hitoImages.findIndex(img => img.url === previewImageUrl);
    const hasNext = currentImageIndex !== -1 && currentImageIndex < hitoImages.length - 1;
    const hasPrev = currentImageIndex > 0;

    const handleExport = async (selectedItems, format) => {
        Swal.fire('Exportar', 'Funcionalidad en desarrollo para Hitos Kilométricos.', 'info');
        setShowExportModal(false);
    };



    const formatProgresiva = (value) => {
        if (value === null || value === undefined) return '';
        const num = Number(value);
        if (isNaN(num)) return value;
        const km = Math.floor(num / 1000);
        const m = Math.round(num % 1000);
        return `${km}+${m.toString().padStart(3, '0')}`;
    };

    return (
        <div className="alcantarillas-tab-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, height: '100%' }}>

                <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <Geoite
                        alcantarillasData={hitosWithImages}
                        type="hitos_kilometricos"
                        onAlcantarillaClick={handleHitoClick}
                        selectedAlcantarilla={selectedHito}
                        onShowDetails={handleShowDetails}
                        graphicsImages={graphicsImages}
                    />

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        {canUpload && (
                            <div onClick={() => { if (showModal) showModal(true); }} style={{ display: 'inline-block' }}>
                                <button style={{ backgroundColor: 'green', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Subir Datos</button>
                            </div>
                        )}
                        <div onClick={() => setShowListModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#007bff', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Mostrar Hitos</button>
                        </div>
                        <div onClick={() => setShowExportModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Exportar Mapa</button>
                        </div>
                    </div>
                </div>

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <h3 onClick={() => setIsInfoVisible(!isInfoVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Detalle de Hito</span>
                            <i className={`fas fa-chevron-down accordion-icon ${isInfoVisible ? '' : 'collapsed'}`}></i>
                        </h3>

                        <CSSTransition
                            nodeRef={infoRef}
                            in={isInfoVisible}
                            timeout={500}
                            classNames="accordion-content"
                            unmountOnExit
                        >
                            <div ref={infoRef}>
                                {selectedHito ? (
                                    <div>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Información Ténica</h4>
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', overflow: 'hidden' }}>
                                            <div style={{ padding: '12px' }}>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Código:</strong> {selectedHito.codigo || 'S/N'}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Progresiva:</strong> {formatProgresiva(selectedHito.progresiva)}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Tipo:</strong> {selectedHito.tipo}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Clasificación:</strong> {selectedHito.clasificacion}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Lado:</strong> {selectedHito.lado}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Material:</strong> {selectedHito.material}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Coordenadas:</strong> {selectedHito.latitud?.toFixed(6) || '-'}, {selectedHito.longitud?.toFixed(6) || '-'}</p>
                                                <button
                                                    onClick={() => handleEditElement(selectedHito)}
                                                    style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9em' }}
                                                >
                                                    Editar Hito
                                                </button>
                                            </div>
                                        </div>

                                        {hitoImages.length > 0 && (
                                            <div style={{ marginTop: '20px' }}>
                                                <h5 style={{ marginBottom: '10px' }}>Panel Fotográfico</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                                    {hitoImages.map((img, idx) => (
                                                        <div key={idx} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                                                            <img
                                                                src={img.url}
                                                                alt={`Foto ${idx}`}
                                                                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', cursor: 'pointer' }}
                                                                onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>Seleccione un hito en el mapa para ver información.</p>
                                )}
                            </div>
                        </CSSTransition>
                    </div>
                </div>
            </div>

            <ListaHitosKilometricosModal
                show={showListModal}
                onClose={() => setShowListModal(false)}
                hitosData={hitosWithImages}
                graphicsImages={graphicsImages}
                initialSelection={selectedHito}
            />

            <ExportarMapaModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={hitosData}
                type="hitos_kilometricos"
                onExport={handleExport}
            />

            <ImagePreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                imageUrl={previewImageUrl}
                onNext={handleNextImage}
                onPrev={handlePrevImage}
                hasNext={hasNext}
                hasPrev={hasPrev}
            />
        </div>
    );
};

export default HitosKilometricos;
