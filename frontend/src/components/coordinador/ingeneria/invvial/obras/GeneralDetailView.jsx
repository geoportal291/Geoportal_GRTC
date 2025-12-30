import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactDOM from 'react-dom'; // Ensure ReactDOM is imported if not already, usually for Portal but here Component
import Swal from 'sweetalert2';
import ImageCarousel from './ImageCarousel';
import MiniMap from './MiniMap';
import axiosInstance from '../../../../../api/axios';
import { useState, useEffect } from 'react';

const ELEMENT_CONFIGS = {
    'alcantarillas': {
        titlePrefix: 'Alcantarilla',
        idField: 'codigo',
        fields: [
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'N de alcantarilla', key: 'codigo' },
            { label: 'Clase', key: 'clase' },
            { label: 'Tipo', key: 'tipo' },
            { label: 'Estado', key: 'estado' },
            { label: 'Longitud', key: 'longitud_alcantarilla' },
            { label: 'Diámetro / Sección', key: 'diametro_lado' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Observaciones', key: 'observaciones' },
            { label: 'Código de Panel Fotográfico', key: 'panel_fotografico_codigo' }
        ]
    },
    'badenes': {
        titlePrefix: 'Badén',
        idField: 'codigo',
        fields: [
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'N de badén', key: 'codigo' },
            { label: 'Clase', key: 'clase' },
            { label: 'Tipo', key: 'tipo' },
            { label: 'Estado', key: 'estado' },
            { label: 'Longitud', key: 'longitud_baden' },
            { label: 'Diámetro / Sección', key: 'diametro_lado' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Observaciones', key: 'observaciones' },
            { label: 'Código de Panel Fotográfico', key: 'panel_fotografico_codigo' }
        ]
    },
    'puentes': {
        titlePrefix: 'Puente',
        idField: 'nombre', // Fallback to id_puente if empty
        fields: [
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'Nombre', key: 'nombre' },
            { label: 'Clase', key: 'clase' },
            { label: 'Tipo', key: 'tipo' },
            { label: 'Estado', key: 'estado' },
            { label: 'Longitud', key: 'longitud_puente' },
            { label: 'Ancho', key: 'ancho' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Observaciones', key: 'observaciones' },
            { label: 'Código de Panel Fotográfico', key: 'panel_fotografico_codigo' }
        ]
    },
    'muros': {
        titlePrefix: 'Muro',
        idField: 'clase', // Fallback to id_muro
        fields: [
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'Clase', key: 'clase' },
            { label: 'Material', key: 'material' },
            { label: 'Estado', key: 'estado' },
            { label: 'Lado', key: 'lado' },
            { label: 'Longitud', key: 'longitud_muro' },
            { label: 'Alto', key: 'alto' },
            { label: 'Ancho', key: 'ancho' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Observaciones', key: 'observaciones' },
            { label: 'Código de Panel Fotográfico', key: 'panel_fotografico_codigo' }
        ]
    },
    'zonas_criticas': {
        titlePrefix: 'Zona Crítica',
        idField: 'codigo',
        fields: [
            { label: 'Progresiva', key: 'progresiva_formatted' }, // Special formatting
            { label: 'Código', key: 'codigo' },
            { label: 'Tipo', key: 'tipo' },
            { label: 'Clase de Daño', key: 'clase_dano' },
            { label: 'Condición', key: 'condicion' },
            { label: 'Lado', key: 'lado' },
            { label: 'Longitud', key: 'longitud_zona' },
            { label: 'Altitud', key: 'altitud' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Observaciones', key: 'observaciones' },
            { label: 'Panel Fotográfico', key: 'panel_fotografico_codigo' },
            { label: 'Entregable', key: 'entregable' }
        ]
    },
    'senales_informativas': {
        titlePrefix: 'Señal Informativa',
        idField: 'codigo',
        fields: [
            { label: 'Código', key: 'codigo' },
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'Tipo', key: 'tipo' },
            { label: 'Clasificación', key: 'clasificacion' },
            { label: 'Lado', key: 'lado' },
            { label: 'Soporte', key: 'soporte' },
            { label: 'Material', key: 'material' },
            { label: 'Entregable', key: 'entregable' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Observaciones', key: 'observaciones' }
        ]
    },
    'senales_preventivas': {
        titlePrefix: 'Señal Preventiva',
        idField: 'codigo',
        fields: [
            { label: 'Código', key: 'codigo' },
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'Tipo', key: 'tipo' },
            { label: 'Clasificación', key: 'clasificacion' },
            { label: 'Lado', key: 'lado' },
            { label: 'Soporte', key: 'soporte' },
            { label: 'Material', key: 'material' },
            { label: 'Entregable', key: 'entregable' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Observaciones', key: 'observaciones' }
        ]
    },
    'senales_reglamentarias': {
        titlePrefix: 'Señal Reguladora',
        idField: 'codigo',
        fields: [
            { label: 'Código', key: 'codigo' },
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'Tipo', key: 'tipo' },
            { label: 'Clasificación', key: 'clasificacion' },
            { label: 'Lado', key: 'lado' },
            { label: 'Soporte', key: 'soporte' },
            { label: 'Material', key: 'material' },
            { label: 'Entregable', key: 'entregable' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Observaciones', key: 'observaciones' }
        ]
    },
    'interferencias': {
        titlePrefix: 'Interferencia',
        idField: 'tipo_interferencia',
        fields: [
            { label: 'Tipo', key: 'tipo_interferencia' },
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'Material', key: 'material' },
            { label: 'Tensión', key: 'tension' },
            { label: 'Lado', key: 'lado' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Panel Fotográfico', key: 'panel_fotografico' },
            { label: 'Observaciones', key: 'observaciones' },
            { label: 'Entregable', key: 'entregable' }
        ]
    },
    'hitos_kilometricos': {
        titlePrefix: 'Hito Kilométrico',
        idField: 'km',
        fields: [
            { label: 'Kilómetro', key: 'km' },
            { label: 'Progresiva', key: 'progresiva' },
            { label: 'Lado', key: 'lado' },
            { label: 'Norte', key: 'norte' },
            { label: 'Este', key: 'este' },
            { label: 'Coordenadas', key: 'coords' },
            { label: 'Entregable', key: 'entregable' }
        ]
    }
};

// Helper for Zona Critica Progresiva
const formatZonaCriticaProgresiva = (value) => {
    if (!value) return 'N/A';
    const num = parseInt(value, 10);
    if (isNaN(num)) return value;
    const km = Math.floor(num / 1000);
    const m = num % 1000;
    return `${km}+${m.toString().padStart(3, '0')}`;
};

const formatValue = (key, value, data) => {
    if (key === 'progresiva_formatted' && data.progresiva) {
        return formatZonaCriticaProgresiva(data.progresiva);
    }
    if (value === null || value === undefined) return 'N/A';
    if (key === 'coords') {
        const lat = data.latitud || data.lat;
        const lng = data.longitud || data.lng || data.long;
        if (lat != null && lng != null) {
            return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
        }
        return 'N/A';
    }
    return value;
};


const GeneralDetailView = ({ data, elementType, images, route, onClose, projectId, canComment }) => {
    // console.log('GeneralDetailView Mounting with:', { elementType, dataId: data?.id || data?.codigo });
    const modalRef = useRef(null);
    const mapRef = useRef(null);
    const dataRef = useRef(null);
    const [observaciones, setObservaciones] = useState([]);
    const [newObservacion, setNewObservacion] = useState('');
    const [isLoadingObservaciones, setIsLoadingObservaciones] = useState(false);

    const getDbId = () => {
        if (!data) return null;
        return data.id || data.id_alcantarilla || data.id_baden || data.id_puente || data.id_muro || data.id_zona_critica || data.id_senal_informativa || data.id_senal_preventiva || data.id_senal_reguladora || data.id_hito_kilometrico || data.id_estructura;
    };

    const fetchObservaciones = async () => {
        const dbId = getDbId();
        if (!dbId || !projectId) return;
        setIsLoadingObservaciones(true);
        try {
            const response = await axiosInstance.get(`/api/observaciones/${projectId}/${elementType}/${dbId}`);
            setObservaciones(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingObservaciones(false);
        }
    };

    useEffect(() => {
        fetchObservaciones();
    }, [data, projectId, elementType]);

    const handleAddObservacion = async () => {
        if (!newObservacion.trim()) return;
        const dbId = getDbId();
        if (!dbId) { Swal.fire('Error', 'No se encontró ID del elemento', 'error'); return; }

        try {
            await axiosInstance.post('/api/observaciones', {
                proyecto_id: projectId,
                elemento_id: dbId,
                tipo_elemento: elementType,
                observacion: newObservacion
            });
            setNewObservacion('');
            fetchObservaciones();
            Swal.fire({ icon: 'success', title: 'Observación agregada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        } catch (error) {
            console.error('Error creating observacion:', error);
            Swal.fire('Error', 'No se pudo guardar la observación', 'error');
        }
    };

    // Normalize elementType to match keys
    let configKey = elementType;
    if (elementType === 'senales_reguladoras') configKey = 'senales_reglamentarias';
    // Add other aliases if needed

    const config = ELEMENT_CONFIGS[configKey] || {
        titlePrefix: 'Detalle',
        idField: 'id',
        fields: Object.keys(data || {}).map(k => ({ label: k, key: k })) // Fallback: show all keys
    };

    const titleIdentifier = data[config.idField] || data['id'] || 'Sin ID';

    const handleExportPDF = async () => {
        let stagingContainer = null;
        try {
            // Initial Progress Setup
            let currentProgress = 0;
            const updateProgress = (progress, message) => {
                currentProgress = progress;
                const progressBar = document.getElementById('swal-progress-bar');
                const progressText = document.getElementById('swal-progress-text');
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (progressText) progressText.textContent = `${Math.round(progress)}% - ${message}`;
            };

            Swal.fire({
                title: 'Generando PDF',
                html: `
                    <div style="width: 100%; background-color: #f1f1f1; border-radius: 5px; margin-bottom: 10px;">
                        <div id="swal-progress-bar" style="width: 0%; height: 20px; background-color: #4caf50; border-radius: 5px; transition: width 0.3s;"></div>
                    </div>
                    <div id="swal-progress-text" style="font-family: Arial, sans-serif; font-size: 14px; color: #555;">0% - Iniciando...</div>
                `,
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading()
            });

            const totalImageRows = images ? Math.ceil(images.length / 2) : 0;
            const totalSteps = 2 + totalImageRows;
            let completedSteps = 0;

            const incrementStep = (message) => {
                completedSteps++;
                const percentage = Math.min(95, (completedSteps / totalSteps) * 100);
                updateProgress(percentage, message);
            };

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const headerHeight = 35;
            const topMargin = headerHeight + 5;
            const bottomMargin = 10;
            const contentWidth = pdfWidth - 20;
            const xOffset = 10;
            let cursorY = topMargin;

            // Load Header
            updateProgress(5, 'Cargando recursos...');
            const headerResponse = await fetch('/imgs/encabezado_pdf.png');
            const headerBlob = await headerResponse.blob();
            const headerImgData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(headerBlob);
            });

            const addHeader = () => pdf.addImage(headerImgData, 'PNG', 0, 0, pdfWidth, headerHeight);
            addHeader();

            // Title
            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${config.titlePrefix}: ${titleIdentifier}`, pdfWidth / 2, cursorY, { align: 'center' });
            cursorY += 10;

            // Prepare Staging
            updateProgress(10, 'Preparando estructura...');
            stagingContainer = document.createElement('div');
            Object.assign(stagingContainer.style, {
                position: 'absolute', top: '-9999px', left: '0', width: '1000px',
                fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff'
            });
            document.body.appendChild(stagingContainer);

            // Capture Helper
            const captureElement = async (element) => {
                const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/jpeg', 0.8);
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
                return { imgData, imgHeight };
            };

            // Top Section (Data + Map)
            updateProgress(15, 'Procesando mapa y datos...');
            const topSection = document.createElement('div');
            Object.assign(topSection.style, { display: 'flex', gap: '20px', padding: '10px' });
            stagingContainer.appendChild(topSection);

            // Clone Data
            if (dataRef.current) {
                const dataClone = dataRef.current.cloneNode(true);
                Object.assign(dataClone.style, {
                    flex: '1', border: '1px solid #ccc', padding: '15px',
                    borderRadius: '8px', height: 'auto', overflow: 'visible'
                });
                topSection.appendChild(dataClone);
            }

            // Capture Map
            if (mapRef.current) {
                await new Promise(r => setTimeout(r, 500)); // Wait for render
                try {
                    const mapCanvas = await html2canvas(mapRef.current, { useCORS: true, allowTaint: true, scale: 2 });
                    const mapImg = document.createElement('img');
                    mapImg.src = mapCanvas.toDataURL('image/png');
                    Object.assign(mapImg.style, {
                        flex: '1', objectFit: 'contain', borderRadius: '8px',
                        border: '1px solid #ccc', width: '50%'
                    });
                    topSection.appendChild(mapImg);
                } catch (e) {
                    console.error("Map capture error", e);
                    // Add placeholder if map fails?
                }
            }

            const { imgData: topImg, imgHeight: topHeight } = await captureElement(topSection);
            pdf.addImage(topImg, 'JPEG', xOffset, cursorY, contentWidth, topHeight);
            cursorY += topHeight + 10;
            stagingContainer.removeChild(topSection);
            incrementStep('Datos principales completados');

            // Images Section
            if (images && images.length > 0) {
                updateProgress(30, 'Iniciando panel fotográfico...');
                const titleDiv = document.createElement('div');
                titleDiv.innerHTML = '<h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin: 0;">Panel Fotográfico</h3>';
                titleDiv.style.padding = '10px';
                stagingContainer.appendChild(titleDiv);

                const { imgData: titleImg, imgHeight: titleHeight } = await captureElement(titleDiv);
                if (cursorY + titleHeight > pdfHeight - bottomMargin) {
                    pdf.addPage();
                    addHeader();
                    cursorY = topMargin;
                }
                pdf.addImage(titleImg, 'JPEG', xOffset, cursorY, contentWidth, titleHeight);
                cursorY += titleHeight + 5;
                stagingContainer.removeChild(titleDiv);

                // Image Loading Helper
                const loadImage = (src) => new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = () => { console.warn("Failed to load img", src); resolve(null); };
                    img.src = src;
                });

                let imageStepStart = 30;
                let imageStepRange = 65;

                for (let i = 0; i < images.length; i += 2) {
                    const currentRowIndex = i / 2;
                    const progressIncrement = (imageStepRange / totalImageRows);
                    const currentPercent = imageStepStart + (currentRowIndex * progressIncrement);
                    updateProgress(currentPercent, `Procesando imágenes (${i + 1}/${images.length})...`);

                    const rowDiv = document.createElement('div');
                    Object.assign(rowDiv.style, {
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '5px 10px'
                    });
                    stagingContainer.appendChild(rowDiv);

                    const prepareImage = async (imgData) => {
                        if (!imgData) return null;
                        const src = typeof imgData === 'string' ? imgData : imgData.url;
                        if (!src) return null;
                        const img = await loadImage(src);
                        if (!img) return null;

                        const wrapper = document.createElement('div');
                        Object.assign(wrapper.style, {
                            border: '1px solid #eee', padding: '5px', borderRadius: '5px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                        });

                        img.style.width = '100%';
                        img.style.height = '250px';
                        img.style.objectFit = 'cover';
                        wrapper.appendChild(img);

                        if (typeof imgData !== 'string') {
                            const meta = document.createElement('div');
                            Object.assign(meta.style, {
                                fontSize: '12px', marginTop: '5px', textAlign: 'center', color: '#555'
                            });
                            meta.innerHTML = `
                                ${imgData.fecha ? `Fecha: ${imgData.fecha.split('T')[0]}<br>` : ''}
                                ${imgData.hora ? `Hora: ${imgData.hora.split('T')[1].substring(0, 8)}<br>` : ''}
                                ${imgData.latitud ? `Coords: ${imgData.latitud.toFixed(6)}, ${imgData.longitud.toFixed(6)}` : ''}
                            `;
                            wrapper.appendChild(meta);
                        }
                        return wrapper;
                    };

                    const wrapper1 = await prepareImage(images[i]);
                    if (wrapper1) rowDiv.appendChild(wrapper1);
                    if (i + 1 < images.length) {
                        const wrapper2 = await prepareImage(images[i + 1]);
                        if (wrapper2) rowDiv.appendChild(wrapper2);
                    }

                    const { imgData: rowImg, imgHeight: rowHeight } = await captureElement(rowDiv);
                    if (cursorY + rowHeight > pdfHeight - bottomMargin) {
                        pdf.addPage();
                        addHeader();
                        cursorY = topMargin;
                    }
                    pdf.addImage(rowImg, 'JPEG', xOffset, cursorY, contentWidth, rowHeight);
                    cursorY += rowHeight + 5;
                    stagingContainer.removeChild(rowDiv);
                }
            }

            updateProgress(100, 'Finalizando PDF...');
            await new Promise(r => setTimeout(r, 500));
            pdf.save(`${config.titlePrefix}_${titleIdentifier}.pdf`);
            Swal.close();
            Swal.fire({ icon: 'success', title: 'Exportación Exitosa', text: 'PDF generado correctamente.', timer: 2000, showConfirmButton: false });

        } catch (error) {
            console.error('Error generating PDF:', error);
            Swal.close();
            Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un problema al generar el PDF.' });
        } finally {
            if (stagingContainer && stagingContainer.parentNode) stagingContainer.parentNode.removeChild(stagingContainer);
        }
    };

    if (!data) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 9999999,
            fontFamily: 'Arial, sans-serif'
        }}>
            <div ref={modalRef} style={{
                backgroundColor: '#ffffff', padding: '15px', borderRadius: '10px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)', maxWidth: '1000px',
                width: '95%', zIndex: 10000000, position: 'relative',
                maxHeight: '95vh', overflowY: 'auto', display: 'flex',
                flexDirection: 'column', gap: '10px'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '2px' }}>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>{config.titlePrefix}: {titleIdentifier}</h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', fontSize: '1.5rem',
                        cursor: 'pointer', color: '#555', transition: 'color 0.2s ease',
                        padding: '0 5px', lineHeight: '1'
                    }}>&times;</button>
                </div>

                {/* Body - 2 Columns */}
                <div style={{ display: 'flex', gap: '10px', flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                    {/* Left Column: Technical Data */}
                    <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div ref={dataRef} style={{
                            background: '#f9f9f9', borderRadius: '8px', padding: '10px',
                            border: '1px solid #eee', flex: 1, overflowY: 'auto',
                            fontSize: '0.9rem', display: 'flex', flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '1rem' }}>Datos Técnicos</h4>
                            {config.fields.map((field) => (
                                <p key={field.key} style={{ margin: '3px 0' }}>
                                    <strong>{field.label}:</strong> {formatValue(field.key, data[field.key], data)}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Map & Media */}
                    <div style={{ flex: 2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div ref={mapRef} style={{ width: '100%', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                            <MiniMap alcantarilla={data} elementType={elementType} route={route} />
                        </div>
                        <ImageCarousel images={images} />
                    </div>
                </div>

                {/* OBSERVACIONES SECTION */}
                <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>Observaciones de Evaluación</h3>

                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#f9f9f9', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                        {observaciones.length === 0 ? (
                            <p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>No hay observaciones registradas.</p>
                        ) : (
                            observaciones.map((obs) => (
                                <div key={obs.id} style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '5px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>{obs.usuario_nombre || 'Usuario'}</strong>
                                        <span>{new Date(obs.fecha_registro).toLocaleString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#333' }}>{obs.observacion}</div>
                                </div>
                            ))
                        )}
                    </div>

                    {canComment && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <textarea
                                value={newObservacion}
                                onChange={(e) => setNewObservacion(e.target.value)}
                                placeholder="Escribe una observación..."
                                style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc', resize: 'vertical', minHeight: '40px' }}
                            />
                            <button
                                onClick={handleAddObservacion}
                                style={{
                                    backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px',
                                    padding: '0 20px', cursor: 'pointer', fontWeight: 'bold'
                                }}
                            >
                                Enviar
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="no-print" style={{ borderTop: '2px solid #eee', paddingTop: '10px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={handleExportPDF} style={{
                        backgroundColor: '#28a745', color: 'white', padding: '8px 20px',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '1em', fontWeight: 'bold'
                    }}>Exportar a PDF</button>

                    <button onClick={onClose} style={{
                        backgroundColor: '#007bff', color: 'white', padding: '8px 20px',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '1em', fontWeight: 'bold'
                    }}>Regresar a lista</button>
                </div>
            </div>
        </div>
    );
};

export default GeneralDetailView;
