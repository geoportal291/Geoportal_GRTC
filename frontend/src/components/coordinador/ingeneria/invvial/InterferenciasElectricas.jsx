import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { CSSTransition } from 'react-transition-group';
import './obras/Alcantarillas.css';
import Geoite from './map/geoite';
import './map/geoite.css';
import ListaInterferenciasModal from './obras/ListaInterferenciasModal';
import ExportarMapaModal from './obras/ExportarMapaModal';
import axiosInstance from '../../../../api/axios';
import { saveAs } from 'file-saver';
import ImagePreviewModal from './obras/ImagePreviewModal';
import ObservationsSidebar from './obras/ObservationsSidebar';
import { fromLatLon } from 'utm';

const tramoData = {
    'TRAMO 1': { id: 'TRAMO 1', elements: [] },
    'TRAMO 2': { id: 'TRAMO 2', elements: [] },
    'TRAMO 3': { id: 'TRAMO 3', elements: [] }
};

const InterferenciasElectricas = ({ onEditElementSelect, interferenciasData, graphicsImages, canUpload, showModal, canComment, projectId }) => {

    const [highlightedTramoId, setHighlightedTramoId] = useState('TRAMO 1');
    const [kmlRoute, setKmlRoute] = useState([]);
    const [selectedTramo, setSelectedTramo] = useState(null);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    const [selectedInterferencia, setSelectedInterferencia] = useState(null);
    const [interferenciaImages, setInterferenciaImages] = useState([]);
    const [interferenciasWithImages, setInterferenciasWithImages] = useState([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [showListModal, setShowListModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const infoRef = useRef(null);
    const [initialSelectedInterferencia, setInitialSelectedInterferencia] = useState(null);

    useEffect(() => {
        if (selectedInterferencia && selectedInterferencia.panel_fotografico && graphicsImages) {
            const code = String(selectedInterferencia.panel_fotografico);
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

            if (!isNaN(start) && !isNaN(end)) {
                const expectedNames = [];
                for (let i = start; i <= end; i++) {
                    expectedNames.push(`${i}${suffix}`);
                }
                const filtered = graphicsImages.filter(img => {
                    const imgNameWithoutExt = img.index.split('.')[0];
                    return expectedNames.includes(imgNameWithoutExt);
                });
                setInterferenciaImages(filtered);
            } else {
                setInterferenciaImages([]);
            }
        } else {
            setInterferenciaImages([]);
        }
    }, [selectedInterferencia, graphicsImages]);

    useEffect(() => {
        if (interferenciasData.length > 0) {
            const processed = interferenciasData.map(item => {
                const code = item.panel_fotografico ? String(item.panel_fotografico) : null;
                let imageUrls = [];
                if (code && graphicsImages.length > 0) {
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
                        const entregable = item.entregable ? String(item.entregable).trim() : null;

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

                            // Scenario 2: Element is "E2". STRICT match.
                            return normImage === normElement;
                        }

                        // Scenario 3: No Entregable.
                        return true;
                    });

                    if (foundImages.length > 0) {
                        imageUrls = foundImages.map(img => `${img.url}?v=${img.id}`);
                    }
                }
                return { ...item, imageUrls: imageUrls, type: 'interferencia_electrica', id_estructura: item.id };
            });
            setInterferenciasWithImages(processed);
        } else {
            setInterferenciasWithImages([]);
        }
    }, [interferenciasData, graphicsImages]);

    useEffect(() => {
        if (highlightedTramoId && tramoData[highlightedTramoId]) {
            setSelectedTramo(tramoData[highlightedTramoId]);
        }
    }, [highlightedTramoId]);

    const handleTramoSelectFromMap = (properties) => {
        if (properties && properties.id && tramoData[properties.id]) {
            setHighlightedTramoId(properties.id);
        }
    };

    const handleEditElement = (element) => {
        if (onEditElementSelect) {
            onEditElementSelect(element);
        }
    };

    const handleInterferenciaClick = useCallback((interferencia) => {
        setSelectedInterferencia(interferencia);
        setIsInfoVisible(true);
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            title: 'Interferencia Seleccionada',
            text: `Se seleccionó: ${interferencia.tipo_interferencia}`,
            icon: 'success'
        });
    }, []);

    const handleShowDetails = useCallback((interferencia) => {
        setInitialSelectedInterferencia(interferencia);
        setShowListModal(true);
    }, []);

    const handleExport = async (selectedItems, format) => {
        if (selectedItems.length === 0) {
            Swal.fire('Error', 'No hay elementos seleccionados para exportar.', 'error');
            return;
        }

        const pointFeatures = selectedItems.map(item => {
            const descriptionTable = `
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Progresiva</th><td style="padding: 5px;">${item.progresiva || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Tipo</th><td style="padding: 5px;">${item.tipo_interferencia || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Material</th><td style="padding: 5px;">${item.material || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Tensión</th><td style="padding: 5px;">${item.tension || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Lado</th><td style="padding: 5px;">${item.lado || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Coordenadas</th><td style="padding: 5px;">${item.latitud ? item.latitud.toFixed(6) : '-'}, ${item.longitud ? item.longitud.toFixed(6) : '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Observaciones</th><td style="padding: 5px;">${item.observaciones || '-'}</td></tr>
                </table>
            `;

            return {
                type: 'Feature',
                properties: {
                    name: `INT. ELEC. ${item.progresiva}`,
                    description: descriptionTable,
                    ...item
                },
                geometry: {
                    type: 'Point',
                    coordinates: [item.longitud || 0, item.latitud || 0]
                }
            };
        }).filter(f => f.geometry.coordinates[0] && f.geometry.coordinates[1]);

        let routeFeatures = [];
        if (kmlRoute && kmlRoute.features) {
            routeFeatures = kmlRoute.features;
        } else if (kmlRoute && kmlRoute.type === 'FeatureCollection') {
            routeFeatures = kmlRoute.features;
        } else if (Array.isArray(kmlRoute)) {
            routeFeatures = kmlRoute;
        }

        const allFeatures = [...pointFeatures, ...routeFeatures];
        const geoJsonData = { type: 'FeatureCollection', features: allFeatures };

        try {
            Swal.fire({ title: 'Exportando...', text: 'Por favor espere.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const endpoint = format === 'kml' ? '/api/trafico/exportar-kml' : '/api/trafico/exportar-shapefile';
            const response = await axiosInstance.post(endpoint, geoJsonData, { responseType: 'blob' });
            const extension = format === 'kml' ? 'kml' : 'zip';
            saveAs(response.data, `interferencias_export.${extension}`);
            Swal.close();
            Swal.fire('Éxito', 'Exportación completada correctamente.', 'success');
            setShowExportModal(false);
        } catch (error) {
            console.error('Error exporting:', error);
            Swal.fire('Error', 'Ocurrió un error durante la exportación.', 'error');
        }
    };

    const handleNextImage = () => {
        const currentIndex = interferenciaImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex !== -1 && currentIndex < interferenciaImages.length - 1) setPreviewImageUrl(interferenciaImages[currentIndex + 1].url);
    };

    const handlePrevImage = () => {
        const currentIndex = interferenciaImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex > 0) setPreviewImageUrl(interferenciaImages[currentIndex - 1].url);
    };

    const currentImageIndex = interferenciaImages.findIndex(img => img.url === previewImageUrl);
    const hasNext = currentImageIndex !== -1 && currentImageIndex < interferenciaImages.length - 1;
    const hasPrev = currentImageIndex > 0;

    return (
        <div className="alcantarillas-tab-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, height: '100%' }}>
                <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <Geoite
                        onTramoSelect={handleTramoSelectFromMap}
                        highlightedTramoId={highlightedTramoId}
                        alcantarillasData={interferenciasWithImages}
                        onAlcantarillaClick={handleInterferenciaClick}
                        selectedAlcantarilla={selectedInterferencia}
                        onRouteLoaded={setKmlRoute}
                        onShowDetails={handleShowDetails}
                    />
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        {canUpload && (
                            <div onClick={() => { if (showModal) showModal(true); }} style={{ display: 'inline-block' }}>
                                <button style={{ backgroundColor: 'green', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Subir Datos</button>
                            </div>
                        )}
                        <div onClick={() => setShowListModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#007bff', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Mostrar Lista</button>
                        </div>
                        <div onClick={() => setShowExportModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Exportar Mapa</button>
                        </div>
                    </div>
                </div>

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <h3 onClick={() => setIsInfoVisible(!isInfoVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Información de Interferencia</span>
                            <i className={`fas fa-chevron-down accordion-icon ${isInfoVisible ? '' : 'collapsed'}`}></i>
                        </h3>
                        <CSSTransition nodeRef={infoRef} in={isInfoVisible} timeout={500} classNames="accordion-content" unmountOnExit>
                            <div ref={infoRef}>
                                {selectedInterferencia ? (
                                    <div>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Detalles</h4>
                                        <div>
                                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', overflow: 'hidden' }}>
                                                <div style={{ padding: '12px' }}>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Progresiva:</strong> {selectedInterferencia.progresiva || 'N/A'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Tipo:</strong> {selectedInterferencia.tipo_interferencia || 'N/A'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Material:</strong> {selectedInterferencia.material || 'N/A'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Tensión:</strong> {selectedInterferencia.tension || 'N/A'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Lado:</strong> {selectedInterferencia.lado || 'N/A'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}>
                                                        <strong>Coordenadas:</strong>{' '}
                                                        {(() => {
                                                            if (selectedInterferencia.latitud && selectedInterferencia.longitud) {
                                                                try {
                                                                    const { easting, northing, zoneNum, zoneLetter } = fromLatLon(selectedInterferencia.latitud, selectedInterferencia.longitud);
                                                                    return <>{zoneNum}{zoneLetter} {easting.toFixed(2)} E<br />{northing.toFixed(2)} N</>;
                                                                } catch (e) { return `${selectedInterferencia.latitud}, ${selectedInterferencia.longitud}`; }
                                                            }
                                                            return '---';
                                                        })()}
                                                    </p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Observaciones:</strong> {selectedInterferencia.observaciones || 'N/A'}</p>
                                                    <button
                                                        onClick={() => handleEditElement(selectedInterferencia)}
                                                        style={{
                                                            marginTop: '10px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            padding: '6px 12px',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            cursor: 'pointer',
                                                            width: '100%',
                                                            fontSize: '13px'
                                                        }}
                                                    >
                                                        Editar Elemento
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {interferenciaImages.length > 0 && (
                                            <div style={{ marginTop: '20px' }}>
                                                <h5 style={{ marginBottom: '10px' }}>Imágenes</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                                    {interferenciaImages.map(img => (
                                                        <div key={img.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                                                            <img src={`${img.url}?v=${img.id}`} alt={`Imagen ${img.index}`} style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }} />
                                                            <p style={{ fontSize: '0.8em', margin: '5px 0 0 0' }}>{img.index}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>Seleccione una interferencia en el mapa para ver sus detalles.</p>
                                )}
                            </div>
                        </CSSTransition>
                    </div>

                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                        {selectedInterferencia && (
                            <ObservationsSidebar
                                projectId={projectId || selectedInterferencia.id_proyecto}
                                elementId={selectedInterferencia.id_interferencia || selectedInterferencia.id || selectedInterferencia.codigo}
                                elementType="interferencias"
                                canComment={canComment}
                            />
                        )}
                    </div>
                </div>
            </div>
            <ImagePreviewModal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} imageUrl={previewImageUrl} onNext={handleNextImage} onPrev={handlePrevImage} hasNext={hasNext} hasPrev={hasPrev} />
            <ListaInterferenciasModal show={showListModal} onClose={() => setShowListModal(false)} interferenciasData={interferenciasWithImages} route={kmlRoute} graphicsImages={graphicsImages} initialSelectedInterferencia={initialSelectedInterferencia} />
            <ExportarMapaModal show={showExportModal} onClose={() => setShowExportModal(false)} data={interferenciasData} type="interferencias" onExport={handleExport} />
        </div>
    );
};

export default InterferenciasElectricas;
