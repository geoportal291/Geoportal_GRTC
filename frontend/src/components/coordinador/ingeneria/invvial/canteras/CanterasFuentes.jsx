import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import Swal from 'sweetalert2';
import Geoite from '../map/geoite'; // Reusing Geoite map component
import '../map/geoite.css'; // Reusing map styles
import axiosInstance from '../../../../../api/axios';
import '../obras/Alcantarillas.css'; // Reusing styles for sidebars

import ListaCanterasFuentesModal from './ListaCanterasFuentesModal';
import DetalleCanteraFuenteView from './DetalleCanteraFuenteView';
import ExportarMapaModal from '../obras/ExportarMapaModal';
import ImagePreviewModal from '../obras/ImagePreviewModal';
import { saveAs } from 'file-saver';

const tramoData = {
    'TRAMO 1': { id: 'TRAMO 1', elements: [] },
    'TRAMO 2': { id: 'TRAMO 2', elements: [] },
    'TRAMO 3': { id: 'TRAMO 3', elements: [] }
};

const CanterasFuentes = ({ canterasData, fuentesData, projectId, canUpload, onUploadSuccess, showUploadModal, graphicsImages }) => {
    const [highlightedTramoId, setHighlightedTramoId] = useState('TRAMO 1');
    const [kmlRoute, setKmlRoute] = useState([]);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedElementType, setSelectedElementType] = useState(null); // 'cantera' or 'fuente'
    const [showListModal, setShowListModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [initialSelectedElement, setInitialSelectedElement] = useState(null);
    const [showDetailView, setShowDetailView] = useState(false);
    const [elementImages, setElementImages] = useState([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const infoRef = useRef(null);

    const getImagesForElement = useCallback((element) => {
        if (!element.panel_fotografico || !graphicsImages) {
            return [];
        }
        const code = element.panel_fotografico;
        let expectedNames = [];
        if (code.includes('-')) {
            const part = code.split(' ')[0];
            const [startStr, endStr] = part.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    expectedNames.push(`${i}`);
                }
            }
        } else {
            expectedNames.push(code.trim());
        }

        return graphicsImages.filter(img => {
            const imgNameWithoutExt = img.index.split('.')[0];
            return expectedNames.includes(imgNameWithoutExt);
        });
        // Returns objects {id, url, index, ...}
    }, [graphicsImages]);

    // Update images when selection changes
    useEffect(() => {
        if (selectedElement) {
            const images = getImagesForElement(selectedElement);
            setElementImages(images);
        } else {
            setElementImages([]);
        }
    }, [selectedElement, getImagesForElement]);

    const handleNextImage = () => {
        const currentIndex = elementImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex !== -1 && currentIndex < elementImages.length - 1) {
            setPreviewImageUrl(elementImages[currentIndex + 1].url);
        }
    };

    const handlePrevImage = () => {
        const currentIndex = elementImages.findIndex(img => img.url === previewImageUrl);
        if (currentIndex > 0) {
            setPreviewImageUrl(elementImages[currentIndex - 1].url);
        }
    };

    const currentImageIndex = elementImages.findIndex(img => img.url === previewImageUrl);
    const hasNext = currentImageIndex !== -1 && currentImageIndex < elementImages.length - 1;
    const hasPrev = currentImageIndex > 0;

    // Combine data for map display with type distinction and attached images
    const combinedMapData = React.useMemo(() => {
        return [
            ...canterasData.map(c => ({
                ...c,
                type: 'cantera',
                uniqueId: `c-${c.id}`,
                imageUrls: getImagesForElement(c).map(img => img.url) // Map to URLs for the map component
            })),
            ...fuentesData.map(f => ({
                ...f,
                type: 'fuente',
                uniqueId: `f-${f.id}`,
                imageUrls: getImagesForElement(f).map(img => img.url) // Map to URLs for the map component
            }))
        ];
    }, [canterasData, fuentesData, getImagesForElement]);

    const handleTramoSelectFromMap = (properties) => {
        if (properties && properties.id && tramoData[properties.id]) {
            setHighlightedTramoId(properties.id);
        }
    };

    const handleElementClick = useCallback((element) => {
        setSelectedElement(element);
        setSelectedElementType(element.type);
        setIsInfoVisible(true);

        const typeName = element.type === 'cantera' ? 'Cantera' : 'Fuente de Agua';
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            title: `${typeName} Seleccionada`,
            text: `Propietario: ${element.propietario || 'S/N'}`,
            icon: 'success'
        });
    }, []);

    const handleShowDetails = useCallback((elementOverride) => {
        let element = elementOverride;

        if (!element) return;

        // Ensure state is synced when opening details (e.g. from popup)
        setSelectedElement(element);
        setSelectedElementType(element.type);

        if (element.panel_fotografico && graphicsImages) {
            // Logic moved to useEffect and helper, just ensure state is ready if needed immediately
            // or rely on the useEffect that watches selectedElement
            setSelectedElement(element);
            setSelectedElementType(element.type);
            // The useEffect will update elementImages
        }

        setShowDetailView(true);
    }, [graphicsImages]);

    const handleCloseListModal = () => {
        setShowListModal(false);
        setInitialSelectedElement(null); // Reset initial selection on close
    };


    const handleExport = async (selectedItems, format) => {
        if (selectedItems.length === 0) {
            Swal.fire('Error', 'No hay elementos seleccionados para exportar.', 'error');
            return;
        }
        // ... (rest of export logic remains the same)
        // Convert to GeoJSON Point features
        const pointFeatures = selectedItems.map(item => {
            const descriptionTable = `
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr><th style="background-color: #f2f2f2; padding: 5px;">Tipo</th><td style="padding: 5px;">${item.type === 'cantera' ? 'Cantera' : 'Fuente de Agua'}</td></tr>
            <tr><th style="background-color: #f2f2f2; padding: 5px;">Entregable</th><td style="padding: 5px;">${item.entregable || '-'}</td></tr>
            <tr><th style="background-color: #f2f2f2; padding: 5px;">Progresiva</th><td style="padding: 5px;">${item.progresiva || '-'}</td></tr>
            <tr><th style="background-color: #f2f2f2; padding: 5px;">Panel Fotográfico</th><td style="padding: 5px;">${item.panel_fotografico || '-'}</td></tr>
            <tr><th style="background-color: #f2f2f2; padding: 5px;">Coordenadas</th><td style="padding: 5px;">${item.latitud}, ${item.longitud}</td></tr>
            <tr><th style="background-color: #f2f2f2; padding: 5px;">Lado</th><td style="padding: 5px;">${item.lado || '-'}</td></tr>
            <tr><th style="background-color: #f2f2f2; padding: 5px;">Propietario</th><td style="padding: 5px;">${item.propietario || '-'}</td></tr>
          </table>
        `;

            return {
                type: 'Feature',
                properties: {
                    name: `${item.type === 'cantera' ? 'Cantera' : 'Fuente'}: ${item.progresiva}`,
                    description: descriptionTable,
                    ...item
                },
                geometry: {
                    type: 'Point',
                    coordinates: [item.longitud, item.latitud]
                }
            };
        }).filter(f => f.geometry.coordinates[0] && f.geometry.coordinates[1]);

        const geoJsonData = {
            type: 'FeatureCollection',
            features: pointFeatures // Not including route for now as it might clutter
        };

        try {
            Swal.fire({
                title: 'Exportando...',
                text: 'Por favor espere.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const endpoint = format === 'kml' ? '/api/trafico/exportar-kml' : '/api/trafico/exportar-shapefile';
            const response = await axiosInstance.post(endpoint, geoJsonData, { responseType: 'blob' });

            const extension = format === 'kml' ? 'kml' : 'zip';
            saveAs(response.data, `canteras_fuentes_export.${extension}`);

            Swal.close();
            Swal.fire('Éxito', 'Exportación completada correctamente.', 'success');
            setShowExportModal(false);

        } catch (error) {
            console.error('Error exporting:', error);
            Swal.fire('Error', 'Ocurrió un error durante la exportación.', 'error');
        }
    };

    return (
        <div className="alcantarillas-tab-wrapper" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

            {/* Leyenda Simple */}
            {/* Leyenda Simple */}
            <div style={{ padding: '10px', background: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Leyenda:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <img src="/imgs/cantera_icon.svg" alt="Cantera" style={{ width: '20px', height: '20px' }} />
                    <span>Canteras</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <img src="/imgs/fuente_icon.svg" alt="Fuente" style={{ width: '20px', height: '20px' }} />
                    <span>Fuentes de Agua</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, height: '100%' }}>

                {/* Columna Mapa */}
                <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <Geoite
                        onTramoSelect={handleTramoSelectFromMap}
                        highlightedTramoId={highlightedTramoId}
                        alcantarillasData={combinedMapData}
                        onAlcantarillaClick={handleElementClick}
                        onRouteLoaded={setKmlRoute}
                        onShowDetails={handleShowDetails}
                    />

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        {canUpload && (
                            <button
                                onClick={() => showUploadModal(true)}
                                style={{ backgroundColor: 'green', color: 'white', padding: '5px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Subir Datos
                            </button>
                        )}
                        <button
                            onClick={() => { setInitialSelectedElement(null); setShowListModal(true); }}
                            style={{ backgroundColor: '#007bff', color: 'white', padding: '5px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Mostrar Lista
                        </button>
                        <button
                            onClick={() => setShowExportModal(true)}
                            style={{ backgroundColor: '#6c757d', color: 'white', padding: '5px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Exportar Mapa
                        </button>
                    </div>
                </div>

                {/* Columna Información */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <h3 onClick={() => setIsInfoVisible(!isInfoVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Información</span>
                            <i className={`fas fa-chevron-down accordion-icon ${isInfoVisible ? '' : 'collapsed'}`}></i>
                        </h3>

                        <CSSTransition nodeRef={infoRef} in={isInfoVisible} timeout={500} classNames="accordion-content" unmountOnExit>
                            <div ref={infoRef}>
                                {selectedElement ? (
                                    <div>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                                            {selectedElementType === 'cantera' ? 'Cantera' : 'Fuente de Agua'} {selectedElement.item_number || ''}
                                        </h4>
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
                                            <p><strong>Entregable:</strong> {selectedElement.entregable}</p>
                                            <p><strong>Progresiva:</strong> {selectedElement.progresiva}</p>
                                            <p><strong>Panel Fotográfico:</strong> {selectedElement.panel_fotografico}</p>
                                            <p><strong>Coordenadas:</strong> {selectedElement.latitud}, {selectedElement.longitud}</p>
                                            <p><strong>Altitud:</strong> {selectedElement.altitud}</p>
                                            <p><strong>Lado:</strong> {selectedElement.lado}</p>
                                            <p><strong>Propietario:</strong> {selectedElement.propietario}</p>
                                            {selectedElementType === 'fuente' && (
                                                <p><strong>Ubicación:</strong> {selectedElement.ubicacion}</p>
                                            )}
                                        </div>
                                        {/* Button to view detailed modal */}
                                        <button
                                            onClick={() => handleShowDetails(selectedElement)}
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
                                            Ver detallado
                                        </button>

                                        {elementImages.length > 0 && (
                                            <div style={{ marginTop: '20px' }}>
                                                <h4 style={{ marginBottom: '10px', fontSize: '1rem', color: '#333' }}>Imágenes de Panel Fotográfico</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                                    {elementImages.map(img => (
                                                        <div key={img.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                                                            <img
                                                                src={img.url}
                                                                alt={`Imagen ${img.index}`}
                                                                style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                                                                onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }}
                                                            />
                                                            <p style={{ fontSize: '0.8em', margin: '5px 0 0 0', color: '#555' }}>{img.index}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>Seleccione un elemento en el mapa.</p>
                                )}
                            </div>
                        </CSSTransition>
                    </div>
                </div>


            </div >

            {/* Modals */}
            {
                showDetailView && selectedElement && (
                    <DetalleCanteraFuenteView
                        element={selectedElement}
                        images={elementImages}
                        route={kmlRoute}
                        onCloseDetail={() => setShowDetailView(false)}
                    />
                )
            }

            <ListaCanterasFuentesModal
                show={showListModal}
                onClose={handleCloseListModal}
                data={combinedMapData}
                graphicsImages={graphicsImages}
                route={kmlRoute}
                initialSelectedElement={initialSelectedElement}
                onSelect={handleShowDetails}
            />

            <ExportarMapaModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={combinedMapData}
                onExport={handleExport}
                type="canteras" // This type was added to ExportarMapaModal logic
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

        </div >
    );
};

export default CanterasFuentes;
