import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { CSSTransition } from 'react-transition-group';
import './obras/Alcantarillas.css'; // Corrected path
import Geoite from './map/geoite'; // Corrected path
import './map/geoite.css'; // Corrected path
import ListaZonasCriticasModal from './obras/ListaZonasCriticasModal'; // Corrected path
import ExportarMapaModal from './obras/ExportarMapaModal'; // Corrected path
import axiosInstance from '../../../../api/axios'; // Corrected path (4 levels up to src)
import { saveAs } from 'file-saver';
import ImagePreviewModal from './obras/ImagePreviewModal'; // Corrected path

// Estructura de datos de ejemplo
const tramoData = {
    'TRAMO 1': {
        id: 'TRAMO 1',
        elements: []
    },
    'TRAMO 2': {
        id: 'TRAMO 2',
        elements: []
    },
    'TRAMO 3': {
        id: 'TRAMO 3',
        elements: []
    }
};

const ZonasCriticas = ({ onEditElementSelect, zonasCriticasData, graphicsImages, canUpload, showModal }) => {

    const [highlightedTramoId, setHighlightedTramoId] = useState('TRAMO 1');
    const [kmlRoute, setKmlRoute] = useState([]); // Estado para la ruta del KML
    const [selectedTramo, setSelectedTramo] = useState(null);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    const [selectedZona, setSelectedZona] = useState(null); // Nuevo estado para la zona seleccionada
    const [zonaImages, setZonaImages] = useState([]); // NEW: State for filtered images
    const [zonasWithImages, setZonasWithImages] = useState([]); // NEW: State to hold zonas with their images
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [showListModal, setShowListModal] = useState(false);
    const infoRef = useRef(null);

    useEffect(() => {
        if (selectedZona && selectedZona.panel_fotografico_codigo && graphicsImages) {
            const code = String(selectedZona.panel_fotografico_codigo);
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
                for (let i = start; i <= end; i++) {
                    expectedNames.push(`${i}${suffix}`);
                }

                const filtered = graphicsImages.filter(img => {
                    const imgNameWithoutExt = img.index.split('.')[0];
                    const imgEntregable = img.entregable ? String(img.entregable).trim() : null;
                    const entregable = selectedZona.entregable ? String(selectedZona.entregable).trim() : null;

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
                setZonaImages(filtered);
            } else {
                setZonaImages([]);
            }
        } else {
            setZonaImages([]);
        }
    }, [selectedZona, graphicsImages]);

    useEffect(() => {
        if (zonasCriticasData.length > 0 && graphicsImages.length > 0) {
            const processedZonas = zonasCriticasData.map(zona => {
                const code = zona.panel_fotografico_codigo ? String(zona.panel_fotografico_codigo) : null;
                let imageUrls = [];

                if (code) {
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
                        for (let i = start; i <= end; i++) {
                            expectedNames.push(`${i}${suffix}`);
                        }

                        const foundImages = graphicsImages.filter(img => {
                            const imgNameWithoutExt = img.index.split('.')[0];
                            const imgEntregable = img.entregable ? String(img.entregable).trim() : null;
                            const entregable = zona.entregable ? String(zona.entregable).trim() : null;

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
                }
                return { ...zona, imageUrls: imageUrls, type: 'zona_critica' };
            });
            setZonasWithImages(processedZonas);
        } else {
            // If no images or no data, just map type and empty images
            setZonasWithImages(zonasCriticasData.map(zona => ({ ...zona, imageUrls: [], type: 'zona_critica' })));
        }
    }, [zonasCriticasData, graphicsImages]);

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

    const [initialSelectedZona, setInitialSelectedZona] = useState(null);

    const handleZonaClick = useCallback((zona) => {
        setSelectedZona(zona);
        setIsInfoVisible(true);
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            title: 'Zona Crítica Seleccionada',
            text: `Se seleccionó: ${zona.codigo || zona.id_zona_critica}`,
            icon: 'success'
        });
    }, []);

    const handleShowDetails = useCallback((zona) => {
        setInitialSelectedZona(zona);
        setShowListModal(true);
    }, []);

    // --- Export Logic ---
    const [showExportModal, setShowExportModal] = useState(false);

    const handleExport = async (selectedItems, format) => {
        if (selectedItems.length === 0) {
            Swal.fire('Error', 'No hay elementos seleccionados para exportar.', 'error');
            return;
        }

        // 1. Convert selected items to GeoJSON Point features
        const pointFeatures = selectedItems.map(item => {
            // Create HTML table for description
            const descriptionTable = `
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Código</th><td style="padding: 5px;">${item.codigo || item.id_zona_critica}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Progresiva</th><td style="padding: 5px;">${item.progresiva || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Tipo</th><td style="padding: 5px;">${item.tipo || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Clase Daño</th><td style="padding: 5px;">${item.clase_dano || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Condición</th><td style="padding: 5px;">${item.condicion || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Coordenadas</th><td style="padding: 5px;">${item.latitud ? item.latitud.toFixed(6) : '-'}, ${item.longitud ? item.longitud.toFixed(6) : '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Observaciones</th><td style="padding: 5px;">${item.observaciones || '-'}</td></tr>
                </table>
            `;

            return {
                type: 'Feature',
                properties: {
                    name: item.codigo || `ZC ${item.id_zona_critica}`,
                    description: descriptionTable,
                    ...item
                },
                geometry: {
                    type: 'Point',
                    coordinates: [item.longitud || 0, item.latitud || 0]
                }
            };
        }).filter(f => f.geometry.coordinates[0] && f.geometry.coordinates[1]);

        // 2. Get Route features (if available)
        let routeFeatures = [];
        if (kmlRoute && kmlRoute.features) {
            routeFeatures = kmlRoute.features;
        } else if (kmlRoute && kmlRoute.type === 'FeatureCollection') {
            routeFeatures = kmlRoute.features;
        } else if (Array.isArray(kmlRoute)) {
            routeFeatures = kmlRoute;
        }

        // 3. Combine all features
        const allFeatures = [...pointFeatures, ...routeFeatures];

        const geoJsonData = {
            type: 'FeatureCollection',
            features: allFeatures
        };

        try {
            Swal.fire({
                title: 'Exportando...',
                text: 'Por favor espere.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const endpoint = format === 'kml' ? '/api/trafico/exportar-kml' : '/api/trafico/exportar-shapefile';
            const response = await axiosInstance.post(endpoint, geoJsonData, {
                responseType: 'blob'
            });

            const extension = format === 'kml' ? 'kml' : 'zip';
            saveAs(response.data, `zonas_criticas_export.${extension}`);

            Swal.close();
            Swal.fire('Éxito', 'Exportación completada correctamente.', 'success');
            setShowExportModal(false);

        } catch (error) {
            console.error('Error exporting:', error);
            Swal.fire('Error', 'Ocurrió un error durante la exportación.', 'error');
        }
    };

    const handleNextImage = () => {
        const currentIndex = zonaImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex !== -1 && currentIndex < zonaImages.length - 1) {
            setPreviewImageUrl(zonaImages[currentIndex + 1].url);
        }
    };

    const handlePrevImage = () => {
        const currentIndex = zonaImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex > 0) {
            setPreviewImageUrl(zonaImages[currentIndex - 1].url);
        }
    };

    const currentImageIndex = zonaImages.findIndex(img => img.url === previewImageUrl);
    const hasNext = currentImageIndex !== -1 && currentImageIndex < zonaImages.length - 1;
    const hasPrev = currentImageIndex > 0;

    return (
        <div className="alcantarillas-tab-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, height: '100%' }}>        {/* Columna del Mapa - Izquierda */}
                <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    {/* Reuse Geoite but pass ZonasCriticas data. Geoite expects 'alcantarillasData' prop for general elements */}
                    <Geoite
                        onTramoSelect={handleTramoSelectFromMap}
                        highlightedTramoId={highlightedTramoId}
                        alcantarillasData={zonasWithImages}
                        onAlcantarillaClick={handleZonaClick}
                        selectedAlcantarilla={selectedZona}
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
                            <button style={{ backgroundColor: '#007bff', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Mostrar Zonas Críticas</button>
                        </div>
                        <div onClick={() => setShowExportModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Exportar Mapa</button>
                        </div>
                    </div>

                </div>

                {/* Columna de Información - Derecha */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

                    {/* Panel de InformaciÃ³n */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <h3 onClick={() => setIsInfoVisible(!isInfoVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Información de Zona Crítica</span>
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
                                {selectedZona ? (
                                    <div>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Detalles</h4>
                                        <div>
                                            <div style={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                marginBottom: '10px',
                                                fontSize: '12px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ padding: '12px' }}>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Progresiva:</strong> {(() => {
                                                        const value = selectedZona.progresiva;
                                                        if (!value) return 'datos sin encontrar';
                                                        const num = parseInt(value, 10);
                                                        if (isNaN(num)) return value;
                                                        const km = Math.floor(num / 1000);
                                                        const m = num % 1000;
                                                        return `${km}+${m.toString().padStart(3, '0')}`;
                                                    })()}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Código:</strong> {selectedZona.codigo || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Tipo:</strong> {selectedZona.tipo || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Condición:</strong> {selectedZona.condicion || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Clase Daño:</strong> {selectedZona.clase_dano || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Coordenadas:</strong> {selectedZona.latitud ? selectedZona.latitud.toFixed(6) : 'N/A'}, {selectedZona.longitud ? selectedZona.longitud.toFixed(6) : 'N/A'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Observaciones:</strong> {selectedZona.observaciones || 'datos sin encontrar'}</p>
                                                    <button
                                                        onClick={() => handleEditElement(selectedZona)}
                                                        style={{
                                                            marginTop: '10px',
                                                            padding: '8px 12px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9em'
                                                        }}
                                                    >
                                                        Editar Elemento
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {zonaImages.length > 0 && (
                                            <div style={{ marginTop: '20px' }}>
                                                <h5 style={{ marginBottom: '10px' }}>Imágenes de Panel Fotográfico</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                                    {zonaImages.map(img => (
                                                        <div key={img.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                                                            <img
                                                                src={`${img.url}?v=${img.id}`}
                                                                alt={`Imagen ${img.index}`}
                                                                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', cursor: 'pointer' }}
                                                                onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }}
                                                            />
                                                            <p style={{ fontSize: '0.8em', margin: '5px 0 0 0' }}>{img.index}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>Seleccione una zona crítica en el mapa para ver sus detalles.</p>
                                )}
                            </div>
                        </CSSTransition>
                    </div>

                </div>
            </div>
            <ImagePreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                imageUrl={previewImageUrl}
                onNext={handleNextImage}
                onPrev={handlePrevImage}
                hasNext={hasNext}
                hasPrev={hasPrev}
            />
            <ListaZonasCriticasModal
                show={showListModal}
                onClose={() => setShowListModal(false)}
                zonasCriticasData={zonasWithImages}
                route={kmlRoute}
                graphicsImages={graphicsImages}
                initialSelectedZona={initialSelectedZona}
            />
            <ExportarMapaModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={zonasCriticasData}
                type="zonas-criticas"
                onExport={handleExport}
            />
        </div>
    );
};

export default ZonasCriticas;
