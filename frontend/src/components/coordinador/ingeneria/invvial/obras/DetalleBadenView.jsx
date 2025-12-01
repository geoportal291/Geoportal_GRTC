import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ImageCarousel from './ImageCarousel';
import MiniMap from './MiniMap';

const DetalleBadenView = ({ alcantarilla: baden, images, route, onCloseDetail }) => {
    const modalRef = useRef(null);
    const mapRef = useRef(null);
    const dataRef = useRef(null);

    const handleExportPDF = async () => {
        // Create a temporary container for the PDF content
        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.top = '-9999px';
        pdfContainer.style.left = '0';
        pdfContainer.style.width = '1000px'; // Fixed width for consistent rendering
        pdfContainer.style.backgroundColor = '#ffffff';
        pdfContainer.style.padding = '40px';
        pdfContainer.style.display = 'flex';
        pdfContainer.style.flexDirection = 'column';
        pdfContainer.style.gap = '20px';
        pdfContainer.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(pdfContainer);

        // 1. Header
        const header = document.createElement('h2');
        header.innerText = `Badén: ${baden.codigo || baden.id_baden}`;
        header.style.textAlign = 'center';
        header.style.marginBottom = '10px';
        header.style.color = '#333';
        pdfContainer.appendChild(header);

        // 2. Top Section: Data (Left) + Map (Right)
        const topSection = document.createElement('div');
        topSection.style.display = 'flex';
        topSection.style.gap = '20px';
        topSection.style.marginBottom = '20px';
        pdfContainer.appendChild(topSection);

        // Clone Data
        if (dataRef.current) {
            const dataClone = dataRef.current.cloneNode(true);
            dataClone.style.flex = '1';
            dataClone.style.height = 'auto';
            dataClone.style.overflow = 'visible';
            dataClone.style.border = '1px solid #ccc';
            dataClone.style.padding = '15px';
            dataClone.style.borderRadius = '8px';
            topSection.appendChild(dataClone);
        }

        // Capture and Add Map
        if (mapRef.current) {
            try {
                const mapCanvas = await html2canvas(mapRef.current, {
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    scale: 2
                });
                const mapImg = document.createElement('img');
                mapImg.src = mapCanvas.toDataURL('image/png');
                mapImg.style.flex = '1';
                mapImg.style.width = '50%'; // Take up half width
                mapImg.style.objectFit = 'contain';
                mapImg.style.borderRadius = '8px';
                mapImg.style.border = '1px solid #ccc';
                topSection.appendChild(mapImg);
            } catch (e) {
                console.error("Error capturing map", e);
            }
        }

        // 3. Images Section (Grid of all images)
        if (images && images.length > 0) {
            const imagesHeader = document.createElement('h3');
            imagesHeader.innerText = 'Panel Fotográfico';
            imagesHeader.style.marginTop = '20px';
            imagesHeader.style.marginBottom = '10px';
            imagesHeader.style.borderBottom = '1px solid #eee';
            pdfContainer.appendChild(imagesHeader);

            const imagesGrid = document.createElement('div');
            imagesGrid.style.display = 'grid';
            imagesGrid.style.gridTemplateColumns = 'repeat(2, 1fr)'; // 2 columns
            imagesGrid.style.gap = '15px';
            pdfContainer.appendChild(imagesGrid);

            // Helper to load image
            const loadImage = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

            for (const imgData of images) {
                const imgWrapper = document.createElement('div');
                imgWrapper.style.display = 'flex';
                imgWrapper.style.flexDirection = 'column';
                imgWrapper.style.alignItems = 'center';
                imgWrapper.style.border = '1px solid #eee';
                imgWrapper.style.padding = '5px';
                imgWrapper.style.borderRadius = '5px';

                try {
                    // Preload image to ensure it renders
                    await loadImage(imgData.url);

                    const imgEl = document.createElement('img');
                    imgEl.src = imgData.url;
                    imgEl.style.width = '100%';
                    imgEl.style.height = '250px';
                    imgEl.style.objectFit = 'cover';
                    imgEl.style.borderRadius = '4px';
                    imgWrapper.appendChild(imgEl);

                    // Metadata
                    const metaDiv = document.createElement('div');
                    metaDiv.style.fontSize = '12px';
                    metaDiv.style.marginTop = '5px';
                    metaDiv.style.textAlign = 'center';
                    metaDiv.style.color = '#555';
                    metaDiv.innerHTML = `
                    ${imgData.fecha ? `Fecha: ${imgData.fecha.split('T')[0]}<br>` : ''}
                    ${imgData.hora ? `Hora: ${imgData.hora.split('T')[1].substring(0, 8)}<br>` : ''}
                    ${imgData.latitud ? `Coords: ${imgData.latitud.toFixed(6)}, ${imgData.longitud.toFixed(6)}` : ''}
                `;
                    imgWrapper.appendChild(metaDiv);

                    imagesGrid.appendChild(imgWrapper);
                } catch (err) {
                    console.warn("Could not load image for PDF", imgData.url);
                }
            }
        }

        // 4. Generate PDF
        try {
            const canvas = await html2canvas(pdfContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`Baden_${baden.codigo || baden.id_baden}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al exportar PDF');
        } finally {
            document.body.removeChild(pdfContainer);
        }
    };

    if (!baden) {
        return null; // No renderizar si no hay baden seleccionada
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            fontFamily: 'Arial, sans-serif'
        }}>
            <div ref={modalRef} style={{
                backgroundColor: '#ffffff',
                padding: '15px', // Reduced padding
                borderRadius: '10px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                maxWidth: '1000px',
                width: '95%',
                zIndex: 10001,
                position: 'relative',
                maxHeight: '95vh', // Increased max height slightly
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px' // Reduced gap
            }}>
                {/* Encabezado */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '2px' }}>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>Badén: {baden.codigo || baden.id_baden}</h2>
                    <button onClick={onCloseDetail} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#555',
                        transition: 'color 0.2s ease',
                        padding: '0 5px',
                        lineHeight: '1'
                    }} onMouseOver={(e) => e.currentTarget.style.color = '#333'} onMouseOut={(e) => e.currentTarget.style.color = '#555'}>&times;</button>
                </div>

                {/* Cuerpo Principal - 2 Columnas */}
                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>

                    {/* Columna Izquierda - Datos Técnicos */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div ref={dataRef} style={{
                            background: '#f9f9f9',
                            borderRadius: '8px',
                            padding: '10px',
                            border: '1px solid #eee',
                            flex: 1,
                            overflowY: 'auto',
                            fontSize: '0.9rem',
                            display: 'flex', // Enable flexbox
                            flexDirection: 'column', // Stack content vertically
                            justifyContent: 'center' // Center content vertically
                        }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '1rem' }}>Datos Técnicos</h4>
                            <p style={{ margin: '3px 0' }}><strong>Progresiva:</strong> {baden.progresiva || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>N de badén:</strong> {baden.codigo || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Clase:</strong> {baden.clase || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Tipo:</strong> {baden.tipo || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Estado:</strong> {baden.estado || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Longitud:</strong> {baden.longitud_baden || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Diámetro / Sección:</strong> {baden.diametro_lado || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Coordenadas:</strong> {baden.latitud ? `${baden.latitud.toFixed(6)}, ${baden.longitud.toFixed(6)}` : 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Observaciones:</strong> {baden.observaciones || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Código de Panel Fotográfico:</strong> {baden.panel_fotografico_codigo || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Columna Derecha - Mapa y Visualizador */}
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Mini-mapa */}
                        <div ref={mapRef} style={{
                            width: '100%',
                            height: '150px', // Reduced height further
                            borderRadius: '8px',
                            overflow: 'hidden',
                        }}>
                            <MiniMap alcantarilla={baden} route={route} />
                        </div>

                        {/* Visualizador Multimedia */}
                        <ImageCarousel images={images} alcantarillaId={baden.id_baden} />
                    </div>

                </div>

                {/* Pie de Tarjeta */}
                <div className="no-print" style={{ borderTop: '2px solid #eee', paddingTop: '10px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={handleExportPDF} style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '8px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1em',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s ease'
                    }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}>Exportar a PDF</button>

                    <button onClick={onCloseDetail} style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '8px 20px', // Reduced padding
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1em', // Reduced font size
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s ease'
                    }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Regresar a lista</button>
                </div>
            </div>
        </div>
    );
};

export default DetalleBadenView;
