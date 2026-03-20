import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { CSSTransition } from 'react-transition-group';
import './Alcantarillas.css'; // Reusing CSS
import Geoite from '../map/geoite';
import '../map/geoite.css';
import ListaPuentesModal from './ListaPuentesModal';
import ExportarMapaModal from './ExportarMapaModal';
import axiosInstance from '../../../../../api/axios';

import { saveAs } from 'file-saver';
import { fromLatLon } from 'utm';
import ObservationsSidebar from './ObservationsSidebar';

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

const Puentes = ({ projectId, onEditElementSelect, puentesData, graphicsImages, canUpload, showModal, canComment }) => {

    const [highlightedTramoId, setHighlightedTramoId] = useState('TRAMO 1');
    const [kmlRoute, setKmlRoute] = useState([]); // Estado para la ruta del KML
    const [selectedTramo, setSelectedTramo] = useState(null);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    const [isGeneralInfoVisible, setIsGeneralInfoVisible] = useState(true); // Nuevo estado para el panel de información general
    const [isElementVisible, setIsElementVisible] = useState({}); // Estado para el acordeón de cada elemento
    const [selectedPuente, setSelectedPuente] = useState(null); // Nuevo estado para el puente seleccionado
    const [puenteImages, setPuenteImages] = useState([]); // NEW: State for filtered images
    const [puentesWithImages, setPuentesWithImages] = useState([]); // NEW: State to hold puentes with their images
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [showListModal, setShowListModal] = useState(false);
    const infoRef = useRef(null);
    const generalInfoRef = useRef(null); // Nueva referencia para el panel de información general

    const getImagesForElement = useCallback((element, graphicsImages) => {
        if (!element.panel_fotografico_codigo || !graphicsImages) {
            return [];
        }
        const code = String(element.panel_fotografico_codigo).trim();
        const entregable = element.entregable ? String(element.entregable).trim() : null;

        // 1. Parse Ranges (e.g. "238-241" or "19")
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
        return graphicsImages.filter(img => {
            const imgNameWithoutExt = img.index ? img.index.split('.')[0] : '';
            const imgEntregable = img.entregable ? String(img.entregable).trim() : null;

            // A. Name Check (Always Required)
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

            // Scenario 3: No Entregable on element.
            return true;
        });
    }, []);

    useEffect(() => {
        if (selectedPuente && graphicsImages) {
            const filtered = getImagesForElement(selectedPuente, graphicsImages);
            setPuenteImages(filtered);
        } else {
            setPuenteImages([]);
        }
    }, [selectedPuente, graphicsImages, getImagesForElement]);

    useEffect(() => {
        if (puentesData.length > 0 && graphicsImages.length > 0) {
            const processedPuentes = puentesData.map(puente => {
                const foundImages = getImagesForElement(puente, graphicsImages);
                const imageUrls = foundImages.map(img => `${img.url}?v=${img.id}`);
                return { ...puente, imageUrls: imageUrls, images: foundImages, type: 'puente' };
            });
            setPuentesWithImages(processedPuentes);
        } else {
            setPuentesWithImages(puentesData.map(puente => ({ ...puente, imageUrls: [], type: 'puente' })));
        }
    }, [puentesData, graphicsImages, getImagesForElement]);

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

    const toggleElementVisibility = (elementId) => {
        setIsElementVisible(prevState => ({
            ...prevState,
            [elementId]: !prevState[elementId]
        }));
    };

    const [initialSelectedPuente, setInitialSelectedPuente] = useState(null); // Nuevo estado para pasar al modal

    const handlePuenteClick = useCallback((puente) => {
        setSelectedPuente(puente);
        setIsInfoVisible(true); // Asegurarse de que el panel de información esté visible
        Swal.fire({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            title: 'Puente Seleccionado',
            text: `Se seleccionó el puente: ${puente.nombre || puente.id_puente}`,
            icon: 'success'
        });
    }, []);

    const handleShowDetails = useCallback((puente) => {
        setInitialSelectedPuente(puente);
        setShowListModal(true);
    }, []);

    // --- Export Logic ---
    const [showExportModal, setShowExportModal] = useState(false);

    const handleExport = async (selectedItems, format) => {
        if (selectedItems.length === 0) {
            Swal.fire('Error', 'No hay elementos seleccionados para exportar.', 'error');
            return;
        }

        // 1. Convert selected items (Puentes) to GeoJSON Point features
        const pointFeatures = selectedItems.map(item => {
            // Create HTML table for description
            const descriptionTable = `
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Progresiva</th><td style="padding: 5px;">${item.progresiva || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Nombre</th><td style="padding: 5px;">${item.nombre || item.id_puente}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Clase</th><td style="padding: 5px;">${item.clase || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Tipo</th><td style="padding: 5px;">${item.tipo || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Estado</th><td style="padding: 5px;">${item.estado || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Longitud</th><td style="padding: 5px;">${item.longitud_puente || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Ancho</th><td style="padding: 5px;">${item.ancho || '-'}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Coordenadas</th><td style="padding: 5px;">${item.latitud.toFixed(6)}, ${item.longitud.toFixed(6)}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Observaciones</th><td style="padding: 5px;">${item.observaciones || '-'}</td></tr>
                </table>
            `;

            return {
                type: 'Feature',
                properties: {
                    name: item.nombre || `Puente ${item.id_puente}`,
                    description: descriptionTable, // Use HTML table for KML description
                    ...item // Keep raw properties for Shapefile attributes
                },
                geometry: {
                    type: 'Point',
                    coordinates: [item.longitud, item.latitud]
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
            saveAs(response.data, `puentes_export.${extension}`);

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
            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0, height: '100%' }}>        {/* Columna del Mapa - Izquierda */}
                <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <Geoite projectId={projectId} section="invvial" onTramoSelect={handleTramoSelectFromMap} highlightedTramoId={highlightedTramoId} alcantarillasData={puentesWithImages} onAlcantarillaClick={handlePuenteClick} selectedAlcantarilla={selectedPuente} onRouteLoaded={setKmlRoute} onShowDetails={handleShowDetails} />
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        {canUpload && (
                            <div onClick={() => { if (showModal) showModal(true); }} style={{ display: 'inline-block' }}>
                                <button style={{ backgroundColor: 'green', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Subir Datos</button>
                            </div>
                        )}
                        <div onClick={() => setShowListModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#007bff', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Mostrar Puentes</button>
                        </div>
                        <div onClick={() => setShowExportModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Exportar Mapa</button>
                        </div>
                    </div>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e2e8f0',
                        padding: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid #f1f5f9'
                        }}>
                            <h3 style={{
                                fontSize: '1.1em',
                                fontWeight: 600,
                                color: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                margin: 0
                            }}>
                                <i className="fas fa-road" style={{ color: '#3b82f6' }}></i>
                                Tramos
                            </h3>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '10px'
                        }}>
                            {
                                Object.keys(tramoData).map(tramoId => {
                                    const tramo = tramoData[tramoId];
                                    const ranges = { 'TRAMO 1': '0+00 - 34+00', 'TRAMO 2': '34+00 - 66+00', 'TRAMO 3': '66+00 - 86+500' };
                                    const isActive = highlightedTramoId === tramo.id;

                                    const baseButtonStyle = {
                                        padding: '15px',
                                        border: 'none',
                                        backgroundColor: '#f8f9fa',
                                        color: '#6c757d',
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'left',
                                        flex: '1 1 calc(33.33% - 10px)',
                                        maxWidth: 'calc(33.33% - 10px)',
                                        minWidth: '150px'
                                    };

                                    const activeButtonStyle = {
                                        backgroundColor: '#3498db',
                                        color: 'white'
                                    };

                                    const buttonStyle = isActive ? { ...baseButtonStyle, ...activeButtonStyle } : baseButtonStyle;

                                    const topTextStyle = {
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        display: 'block'
                                    };

                                    const bottomTextStyle = {
                                        fontSize: '12px',
                                        opacity: isActive ? 0.9 : 0.8,
                                        display: 'block'
                                    };

                                    return (
                                        <div key={tramo.id} style={buttonStyle} onClick={() => setHighlightedTramoId(tramo.id)}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <strong style={topTextStyle}>{tramo.id.replace('TRAMO ', 'T-')}</strong>
                                                <small style={bottomTextStyle}>{ranges[tramo.id]}</small>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                </div>

                {/* Columna de Información - Derecha */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

                    {/* Panel de InformaciÃ³n */}
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <h3 onClick={() => setIsInfoVisible(!isInfoVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Información del Puente</span>
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
                                {selectedPuente ? (
                                    <div>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Detalles del Puente</h4>
                                        <div>
                                            <div style={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                marginBottom: '10px',
                                                fontSize: '12px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ padding: '12px' }}>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Progresiva:</strong> {selectedPuente.progresiva || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Nombre:</strong> {selectedPuente.nombre || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Clase:</strong> {selectedPuente.clase || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Tipo:</strong> {selectedPuente.tipo || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Estado:</strong> {selectedPuente.estado || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Longitud:</strong> {selectedPuente.longitud_puente || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Ancho:</strong> {selectedPuente.ancho || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}>
                                                        <strong>Coordenadas:</strong>{' '}
                                                        {(() => {
                                                            if (selectedPuente.latitud && selectedPuente.longitud) {
                                                                try {
                                                                    const { easting, northing, zoneNum, zoneLetter } = fromLatLon(selectedPuente.latitud, selectedPuente.longitud);
                                                                    return <>{zoneNum}{zoneLetter} {easting.toFixed(2)} E<br />{northing.toFixed(2)} N</>;
                                                                } catch (e) { return `${selectedPuente.latitud}, ${selectedPuente.longitud}`; }
                                                            }
                                                            return '---';
                                                        })()}
                                                    </p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Observaciones:</strong> {selectedPuente.observaciones || 'datos sin encontrar'}</p>
                                                    <p style={{ margin: '0 0 5px 0' }}><strong>Código de Panel Fotográfico:</strong> {selectedPuente.panel_fotografico_codigo || 'datos sin encontrar'}</p>
                                                    <button
                                                        onClick={() => handleEditElement(selectedPuente)}
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
                                        {puenteImages.length > 0 && (
                                            <div style={{ marginTop: '20px' }}>
                                                <h5 style={{ marginBottom: '10px' }}>Imágenes de Panel Fotográfico</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                                    {puenteImages.map(img => (
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
                                    <p>Seleccione un puente en el mapa para ver sus detalles.</p>
                                )}
                            </div>
                        </CSSTransition>
                    </div>

                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                        {selectedPuente && (
                            <ObservationsSidebar
                                projectId={selectedPuente.id_proyecto}
                                elementId={selectedPuente.id_puente || selectedPuente.id || selectedPuente.codigo}
                                elementType="puentes"
                                canComment={canComment}
                            />
                        )}
                    </div>
                </div>
            </div>
            {isPreviewModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10002,
                }}>
                    <img src={previewImageUrl} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                    <button onClick={() => setIsPreviewModalOpen(false)} style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#333',
                    }}>&times;</button>
                </div>
            )}
            <ListaPuentesModal
                show={showListModal}
                onClose={() => setShowListModal(false)}
                puentesData={puentesWithImages} // Usar puentesWithImages para pasar también las URLs de las imágenes
                route={kmlRoute} // Pasar la ruta del KML al modal de lista
                graphicsImages={graphicsImages} // Pasar la lista completa de imágenes gráficas
                initialSelectedPuente={initialSelectedPuente} // Pasar el puente seleccionada inicialmente
            />
            <ExportarMapaModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={puentesData}
                type="puentes"
                onExport={handleExport}
            />
        </div>
    );
};

export default Puentes;
