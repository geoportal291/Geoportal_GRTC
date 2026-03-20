import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { CSSTransition } from 'react-transition-group';
import './obras/Alcantarillas.css'; // Reusing styles
import Geoite from './map/geoite';
import './map/geoite.css';
import ListaSenalesInformativasModal from './obras/ListaSenalesInformativasModal';
import ExportarMapaModal from './obras/ExportarMapaModal';
import ImagePreviewModal from './obras/ImagePreviewModal';
import { saveAs } from 'file-saver';
import axiosInstance from '../../../../api/axios';
import ObservationsSidebar from './obras/ObservationsSidebar';
import { fromLatLon } from 'utm';

const SenalesInformativas = ({ senalesData, graphicsImages, canUpload, showModal, onElementSelect, canComment, projectId }) => {
    // State layout consistent with ZonasCriticas/Alcantarillas
    const [selectedSenal, setSelectedSenal] = useState(null);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    const [senalImages, setSenalImages] = useState([]);
    const [senalesWithImages, setSenalesWithImages] = useState([]);

    // Modals
    const [showListModal, setShowListModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

    const infoRef = useRef(null);

    // Filter images effect (Side Panel)
    useEffect(() => {
        if (selectedSenal && selectedSenal.panel_fotografico_codigo && graphicsImages) {
            const code = String(selectedSenal.panel_fotografico_codigo).trim();

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
                const entregable = selectedSenal.entregable ? String(selectedSenal.entregable).trim() : null;

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
            setSenalImages(filtered);
        } else {
            setSenalImages([]);
        }
    }, [selectedSenal, graphicsImages]);

    // Bulk Image Processing for Map
    useEffect(() => {
        if (senalesData.length > 0 && graphicsImages.length > 0) {
            const processed = senalesData.map(senal => {
                const code = senal.panel_fotografico_codigo ? String(senal.panel_fotografico_codigo) : null;
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
                        const entregable = senal.entregable ? String(senal.entregable).trim() : null;

                        // A. Name Check
                        const nameMatches = expectedNames.includes(imgNameWithoutExt);
                        if (!nameMatches) return false;

                        // B. Entregable Logic (Hybrid Legacy/Strict)
                        const normalize = (str) => String(str || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                        if (entregable) {
                            const normElement = normalize(entregable);
                            const normImage = normalize(imgEntregable);

                            // Scenario 1: Element is "E1". Allow matching "E1" OR null (legacy).
                            if (normElement === 'E1') {
                                return (!imgEntregable) || (normImage === 'E1');
                            }

                            // Scenario 2: Element is "E2" (etc). STRICT match. Reject nulls.
                            return normImage === normElement;
                        }

                        // Scenario 3: No Entregable on Element. loose match.
                        return true;
                    });

                    if (foundImages.length > 0) {
                        imageUrls = foundImages.map(img => `${img.url}?v=${img.id}`);
                    }
                }
                return { ...senal, imageUrls, type: 'senales_informativas' };
            });
            setSenalesWithImages(processed);
        } else {
            setSenalesWithImages(senalesData.map(s => ({ ...s, imageUrls: [], type: 'senales_informativas' })));
        }
    }, [senalesData, graphicsImages]);

    const handleSenalClick = useCallback((senal) => {
        setSelectedSenal(senal);
        setIsInfoVisible(true);
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            title: 'Señal Seleccionada',
            text: `Código: ${senal.codigo}`,
            icon: 'success'
        });
    }, []);

    const handleShowDetails = useCallback((senal) => {
        setSelectedSenal(senal);
        setShowListModal(true);
    }, []);

    const handleEditElement = (element) => {
        if (onElementSelect) {
            onElementSelect(element);
        }
    };

    // Image preview navigation
    const handleNextImage = () => {
        const currentIndex = senalImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex !== -1 && currentIndex < senalImages.length - 1) {
            setPreviewImageUrl(senalImages[currentIndex + 1].url);
        }
    };

    const handlePrevImage = () => {
        const currentIndex = senalImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex > 0) {
            setPreviewImageUrl(senalImages[currentIndex - 1].url);
        }
    };

    const currentImageIndex = senalImages.findIndex(img => img.url === previewImageUrl);
    const hasNext = currentImageIndex !== -1 && currentImageIndex < senalImages.length - 1;
    const hasPrev = currentImageIndex > 0;

    // Export Logic
    const handleExport = async (selectedItems, format) => {
        // Basic export placeholder reused from other modules logic or just simple toast for now if complex logic needed
        Swal.fire('Exportar', 'Funcionalidad en desarrollo para Señales Informativas.', 'info');
        setShowExportModal(false);
    };



    return (
        <div className="alcantarillas-tab-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, height: '100%' }}>

                {/* Left Column: Map + Buttons */}
                <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <Geoite
                        projectId={projectId}
                        section="invvial"
                        alcantarillasData={senalesWithImages} // Use processed data with type
                        type="senales_informativas"
                        onAlcantarillaClick={handleSenalClick} // Reusing prop name
                        selectedAlcantarilla={selectedSenal} // Reusing prop name
                        onShowDetails={handleShowDetails}
                        graphicsImages={graphicsImages}
                    />

                    {/* Buttons Row */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        {canUpload && (
                            <div onClick={() => { if (showModal) showModal(true); }} style={{ display: 'inline-block' }}>
                                <button style={{ backgroundColor: 'green', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Subir Datos</button>
                            </div>
                        )}
                        <div onClick={() => setShowListModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#007bff', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Mostrar Señales</button>
                        </div>
                        <div onClick={() => setShowExportModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Exportar Mapa</button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Info Panel */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <h3 onClick={() => setIsInfoVisible(!isInfoVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Detalle de Señal</span>
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
                                {selectedSenal ? (
                                    <div>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Información Ténica</h4>
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', overflow: 'hidden' }}>
                                            <div style={{ padding: '12px' }}>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Código:</strong> {selectedSenal.codigo || 'S/N'}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Progresiva:</strong> {selectedSenal.progresiva}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Tipo:</strong> {selectedSenal.tipo}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Clasificación:</strong> {selectedSenal.clasificacion}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Lado:</strong> {selectedSenal.lado}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Material:</strong> {selectedSenal.material}</p>
                                                <p style={{ margin: '0 0 5px 0' }}>
                                                    <strong>Coordenadas:</strong>{' '}
                                                    {(() => {
                                                        if (selectedSenal.latitud && selectedSenal.longitud) {
                                                            try {
                                                                const { easting, northing, zoneNum, zoneLetter } = fromLatLon(selectedSenal.latitud, selectedSenal.longitud);
                                                                return <>{zoneNum}{zoneLetter} {easting.toFixed(2)} E<br />{northing.toFixed(2)} N</>;
                                                            } catch (e) { return `${selectedSenal.latitud}, ${selectedSenal.longitud}`; }
                                                        }
                                                        return '---';
                                                    })()}
                                                </p>
                                                <button
                                                    onClick={() => handleEditElement(selectedSenal)}
                                                    style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9em' }}
                                                >
                                                    Editar Elemento
                                                </button>
                                            </div>
                                        </div>

                                        {senalImages.length > 0 && (
                                            <div style={{ marginTop: '20px' }}>
                                                <h5 style={{ marginBottom: '10px' }}>Panel Fotográfico</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                                    {senalImages.map((img, idx) => (
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
                                    <p>Seleccione una señal en el mapa para ver información.</p>
                                )}
                            </div>
                        </CSSTransition>
                    </div>

                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                        {selectedSenal && (
                            <ObservationsSidebar
                                projectId={projectId || selectedSenal.id_proyecto}
                                elementId={selectedSenal.id_senal_informativa || selectedSenal.id || selectedSenal.codigo}
                                elementType="senales_informativas"
                                canComment={canComment}
                            />
                        )}
                    </div>
                </div>
            </div>

            <ListaSenalesInformativasModal
                show={showListModal}
                onClose={() => setShowListModal(false)}
                senalesData={senalesWithImages}
                graphicsImages={graphicsImages}
                initialSelection={selectedSenal}
            />

            <ExportarMapaModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={senalesData}
                type="senales_informativas"
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

export default SenalesInformativas;
