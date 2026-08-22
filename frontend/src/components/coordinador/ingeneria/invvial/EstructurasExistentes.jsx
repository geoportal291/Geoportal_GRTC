import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/api/axios';
import alertify from 'alertifyjs';
import Geoite from './map/geoite';
import DataManagementModal from './DataManagementModal';
import * as XLSX from 'xlsx';
import ListaEstructurasExistentesModal from './EstructurasExistentes/ListaEstructurasExistentesModal.jsx';
import ExportarMapaModal from './obras/ExportarMapaModal';
import { saveAs } from 'file-saver';
import './vial.css';
import ImagePreviewModal from './obras/ImagePreviewModal';
import { CSSTransition } from 'react-transition-group';
import ObservationsSidebar from './obras/ObservationsSidebar';

const EstructurasExistentes = ({ projectId, isVisible, graphicsImages, canComment }) => {
    const [estructurasData, setEstructurasData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDataManagementModalOpen, setIsDataManagementModalOpen] = useState(false);
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState(null);
    const [structureImages, setStructureImages] = useState([]);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const infoRef = useRef(null);

    const [initialSelectedStructure, setInitialSelectedStructure] = useState(null);
    const [kmlRoute, setKmlRoute] = useState(null);

    // Cargar datos
    const fetchData = async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/estructuras-existentes/by-project/${projectId}`);
            // Map data to include 'type' so Geoite knows how to render it
            const mappedData = response.data.map(item => ({
                ...item,
                type: 'estructura_existente',
                // Map images if needed, though they are stored as single string usually
                imageUrls: item.panel_fotografico ? [{ url: item.panel_fotografico }] : []
            }));
            setEstructurasData(mappedData);
        } catch (error) {
            console.error("Error fetching structures:", error);
            alertify.error("Error al cargar estructuras existentes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isVisible && projectId) {
            fetchData();
        }
    }, [isVisible, projectId]);

    const handleDataUploadSuccess = () => {
        setIsDataManagementModalOpen(false);
        fetchData();
        alertify.success('Datos de Estructuras Existentes cargados correctamente.');
    };

    useEffect(() => {
        if (selectedStructure && selectedStructure.panel_fotografico && graphicsImages) {
            const code = String(selectedStructure.panel_fotografico).trim();

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
                const entregable = selectedStructure.entregable ? String(selectedStructure.entregable).trim() : null;

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
            setStructureImages(filtered);
        } else {
            setStructureImages([]);
        }
    }, [selectedStructure, graphicsImages]);

    // Validar y filtrar imágenes para cada estructura (para el mapa y otros usos)
    const enrichedEstructurasData = React.useMemo(() => {
        if (!estructurasData || !graphicsImages) return estructurasData;

        return estructurasData.map(structure => {
            const code = String(structure.panel_fotografico || '').trim();
            let images = [];

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
                images = graphicsImages.filter(img => {
                    const imgNameWithoutExt = img.index.split('.')[0];
                    const imgEntregable = img.entregable ? String(img.entregable).trim() : null;
                    const entregable = structure.entregable ? String(structure.entregable).trim() : null;

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
            }
            // Ensure compatibility with Geoite which looks for imageUrls usually, but here we keep images array too
            const imageUrls = images.map(img => img.url);
            return { ...structure, images, imageUrls };
        });
    }, [estructurasData, graphicsImages]);

    const handleStructureClick = React.useCallback((structure) => {
        setSelectedStructure(structure);
        setIsInfoVisible(true);
    }, []);

    const handleShowDetails = (structure) => {
        setInitialSelectedStructure(structure);
        setIsListModalOpen(true);
    };

    const handleExport = async (selectedItems, format) => {
        if (selectedItems.length === 0) {
            alertify.error('No hay elementos seleccionados para exportar.');
            return;
        }

        const pointFeatures = selectedItems.map(item => {
            const descriptionTable = `
                <table border="1" style="border-collapse: collapse; width: 100%;">
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Progresiva Inicio</th><td style="padding: 5px;">${item.progresiva_inicio}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Progresiva Final</th><td style="padding: 5px;">${item.progresiva_final}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Ancho Calzada</th><td style="padding: 5px;">${item.ancho_calzada}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Entregable</th><td style="padding: 5px;">${item.entregable}</td></tr>
                    <tr><th style="background-color: #f2f2f2; padding: 5px;">Observaciones</th><td style="padding: 5px;">${item.observaciones}</td></tr>
                </table>
            `;
            return {
                type: 'Feature',
                properties: {
                    name: `Estructura ${item.progresiva_inicio}`,
                    description: descriptionTable,
                    ...item
                },
                geometry: {
                    type: 'Point',
                    coordinates: [item.longitud_inicio, item.latitud_inicio]
                }
            };
        });

        // For now, simpler export not including route slice in export unless requested, keeping it simple like Zonas
        const geoJsonData = {
            type: 'FeatureCollection',
            features: pointFeatures
        };

        try {
            const endpoint = format === 'kml' ? '/api/trafico/exportar-kml' : '/api/trafico/exportar-shapefile'; // Reusing generic export endpoints if possible, or need specific one?
            // Actually, ZonasCriticas uses '/api/trafico/exportar-kml' which seems to be a generic geometry exporter based on the input GeoJSON.
            const response = await axiosInstance.post(endpoint, geoJsonData, {
                responseType: 'blob'
            });

            const extension = format === 'kml' ? 'kml' : 'zip';
            saveAs(response.data, `estructuras_existentes.${extension}`);
            setShowExportModal(false);
            alertify.success('Exportación completada.');
        } catch (error) {
            console.error('Error exporting:', error);
            alertify.error('Error al exportar.');
        }
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

                {/* Columna del Mapa - Izquierda */}
                <div style={{ flex: '4', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <Geoite
                        projectId={projectId}
                        section="invvial"
                        alcantarillasData={enrichedEstructurasData}
                        onAlcantarillaClick={handleStructureClick}
                        selectedAlcantarilla={selectedStructure}
                        highlightedTramoId={selectedStructure ? selectedStructure.id_estructura : null}
                        onShowDetails={handleShowDetails}
                        onRouteLoaded={setKmlRoute}
                    />

                    {/* Botones Inferiores */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <div onClick={() => setIsDataManagementModalOpen(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: 'green', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Subir Datos</button>
                        </div>
                        <div onClick={() => setIsListModalOpen(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#007bff', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Mostrar Estructuras Existentes</button>
                        </div>
                        <div onClick={() => setShowExportModal(true)} style={{ display: 'inline-block' }}>
                            <button style={{ backgroundColor: '#6c757d', color: 'white', padding: '3px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: 'fit-content' }}>Exportar Mapa</button>
                        </div>
                    </div>
                </div>

                {/* Columna de Información - Derecha */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
                        <h3 onClick={() => setIsInfoVisible(!isInfoVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Información Estructura</span>
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
                                {selectedStructure ? (
                                    <div>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Detalles</h4>
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', fontSize: '12px', overflow: 'hidden' }}>
                                            <div style={{ padding: '12px' }}>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Entregable:</strong> {selectedStructure.entregable}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Inicio:</strong> {formatProgresiva(selectedStructure.progresiva_inicio)}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Fin:</strong> {formatProgresiva(selectedStructure.progresiva_final)}</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Ancho:</strong> {selectedStructure.ancho_calzada} m</p>
                                                <p style={{ margin: '0 0 5px 0' }}><strong>Observaciones:</strong> {selectedStructure.observaciones}</p>
                                            </div>
                                        </div>
                                        {structureImages.length > 0 ? (
                                            <div style={{ marginTop: '20px' }}>
                                                <h5 style={{ marginBottom: '10px' }}>Panel Fotográfico ({selectedStructure.panel_fotografico})</h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                                    {structureImages.map(img => (
                                                        <div key={img.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center' }}>
                                                            <img
                                                                src={`${img.url}?v=${img.id}`}
                                                                alt={`Imagen ${img.index}`}
                                                                style={{ maxWidth: '100%', height: 'auto', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                                                                onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }}
                                                            />
                                                            <p style={{ fontSize: '0.8em', margin: '5px 0 0 0' }}>{img.index}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            selectedStructure.panel_fotografico && (
                                                <div style={{ marginTop: '20px' }}>
                                                    <h5 style={{ marginBottom: '10px' }}>Panel Fotográfico</h5>
                                                    <p style={{ fontSize: '0.9em', color: '#666' }}>Código: {selectedStructure.panel_fotografico} (Imágenes no encontradas)</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p>Seleccione una estructura en el mapa para ver sus detalles.</p>
                                )}
                            </div>
                        </CSSTransition>
                    </div>

                    <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                        {selectedStructure && (
                            <ObservationsSidebar
                                projectId={projectId || selectedStructure.id_proyecto}
                                elementId={selectedStructure.id_estructura || selectedStructure.id || selectedStructure.codigo}
                                elementType="estructuras_existentes"
                                canComment={canComment}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Modales */}
            {isDataManagementModalOpen && (
                <DataManagementModal
                    show={isDataManagementModalOpen}
                    onClose={() => setIsDataManagementModalOpen(false)}
                    projectId={projectId}
                    onUploadExcelData={handleDataUploadSuccess}
                    type="estructuras-existentes"
                    vialHeaderOption="1er entregable"
                    listData={estructurasData}
                />
            )}

            {isListModalOpen && (
                <ListaEstructurasExistentesModal
                    isOpen={isListModalOpen}
                    onClose={() => setIsListModalOpen(false)}
                    data={enrichedEstructurasData}
                    route={kmlRoute}
                    initialSelectedStructure={initialSelectedStructure}
                />
            )}

            <ExportarMapaModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                data={estructurasData}
                type="estructuras-existentes"
                onExport={handleExport}
            />

            <ImagePreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                imageUrl={previewImageUrl}
                onNext={() => { }} // Simple view only for now
                onPrev={() => { }}
                hasNext={false}
                hasPrev={false}
            />
        </div>
    );
};

export default EstructurasExistentes;
