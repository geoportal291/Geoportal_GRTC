import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';
import ImageCarousel from './ImageCarousel';
import MiniMap from './MiniMap';

const DetalleInterferenciaView = ({ interferencia, images, route, onCloseDetail }) => {
    const modalRef = useRef(null);
    const mapRef = useRef(null);
    const dataRef = useRef(null);

    const handleExportPDF = async () => {
        let stagingContainer = null;
        try {
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

            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            const titleId = interferencia.progresiva || interferencia.id;
            pdf.text(`Interferencia Eléctrica: ${titleId}`, pdfWidth / 2, cursorY, { align: 'center' });
            cursorY += 10;

            updateProgress(10, 'Preparando estructura...');
            stagingContainer = document.createElement('div');
            stagingContainer.style.position = 'absolute';
            stagingContainer.style.top = '-9999px';
            stagingContainer.style.left = '0';
            stagingContainer.style.width = '1000px';
            stagingContainer.style.fontFamily = 'Arial, sans-serif';
            stagingContainer.style.backgroundColor = '#ffffff';
            document.body.appendChild(stagingContainer);

            const captureElement = async (element) => {
                const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
                const imgData = canvas.toDataURL('image/jpeg', 0.8);
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
                return { imgData, imgHeight };
            };

            updateProgress(15, 'Procesando mapa y datos...');
            const topSection = document.createElement('div');
            topSection.style.display = 'flex';
            topSection.style.gap = '20px';
            topSection.style.padding = '10px';
            stagingContainer.appendChild(topSection);

            if (dataRef.current) {
                const dataClone = dataRef.current.cloneNode(true);
                dataClone.style.flex = '1';
                dataClone.style.border = '1px solid #ccc';
                dataClone.style.padding = '15px';
                dataClone.style.borderRadius = '8px';
                dataClone.style.height = 'auto';
                dataClone.style.overflow = 'visible';
                topSection.appendChild(dataClone);
            }

            if (mapRef.current) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait for map/icon to settle
                try {
                    const mapCanvas = await html2canvas(mapRef.current, { useCORS: true, allowTaint: true, scale: 2 });
                    const mapImg = document.createElement('img');
                    mapImg.src = mapCanvas.toDataURL('image/png');
                    mapImg.style.flex = '1';
                    mapImg.style.objectFit = 'contain';
                    mapImg.style.borderRadius = '8px';
                    mapImg.style.border = '1px solid #ccc';
                    mapImg.style.width = '50%';
                    topSection.appendChild(mapImg);
                } catch (e) { console.error("Map capture error", e); }
            }

            const { imgData: topImg, imgHeight: topHeight } = await captureElement(topSection);
            pdf.addImage(topImg, 'JPEG', xOffset, cursorY, contentWidth, topHeight);
            cursorY += topHeight + 10;
            stagingContainer.removeChild(topSection);
            incrementStep('Datos principales completados');

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
                    rowDiv.style.display = 'grid';
                    rowDiv.style.gridTemplateColumns = '1fr 1fr';
                    rowDiv.style.gap = '15px';
                    rowDiv.style.padding = '5px 10px';
                    stagingContainer.appendChild(rowDiv);

                    const prepareImage = async (imgData) => {
                        if (!imgData) return null;
                        const src = typeof imgData === 'string' ? imgData : imgData.url;
                        if (!src) return null;
                        const img = await loadImage(src);
                        if (!img) return null;
                        const wrapper = document.createElement('div');
                        wrapper.style.border = '1px solid #eee';
                        wrapper.style.padding = '5px';
                        wrapper.style.borderRadius = '5px';
                        wrapper.style.display = 'flex';
                        wrapper.style.flexDirection = 'column';
                        wrapper.style.alignItems = 'center';
                        img.style.width = '100%';
                        img.style.height = '250px';
                        img.style.objectFit = 'cover';
                        wrapper.appendChild(img);
                        if (typeof imgData !== 'string') {
                            const meta = document.createElement('div');
                            meta.style.fontSize = '12px';
                            meta.style.marginTop = '5px';
                            meta.style.textAlign = 'center';
                            meta.style.color = '#555';
                            meta.innerHTML = `${imgData.fecha ? `Fecha: ${imgData.fecha.split('T')[0]}<br>` : ''}${imgData.latitud ? `Coords: ${imgData.latitud.toFixed(6)}, ${imgData.longitud.toFixed(6)}` : ''}`;
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
            pdf.save(`Interferencia_${titleId}.pdf`);
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

    if (!interferencia) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Arial, sans-serif' }}>
            <div ref={modalRef} style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '10px', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)', maxWidth: '1000px', width: '95%', zIndex: 10001, position: 'relative', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '2px' }}>
                    <h2 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>Interferencia: {interferencia.tipo_interferencia}</h2>
                    <button onClick={onCloseDetail} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#555', transition: 'color 0.2s ease', padding: '0 5px', lineHeight: '1' }}>&times;</button>
                </div>
                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div ref={dataRef} style={{ background: '#f9f9f9', borderRadius: '8px', padding: '10px', border: '1px solid #eee', flex: 1, overflowY: 'auto', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '1rem' }}>Datos Técnicos</h4>
                            <p style={{ margin: '3px 0' }}><strong>Progresiva:</strong> {interferencia.progresiva}</p>
                            <p style={{ margin: '3px 0' }}><strong>Tipo:</strong> {interferencia.tipo_interferencia}</p>
                            <p style={{ margin: '3px 0' }}><strong>Material:</strong> {interferencia.material}</p>
                            <p style={{ margin: '3px 0' }}><strong>Tensión:</strong> {interferencia.tension}</p>
                            <p style={{ margin: '3px 0' }}><strong>Lado:</strong> {interferencia.lado}</p>
                            <p style={{ margin: '3px 0' }}><strong>Coordenadas:</strong> {interferencia.latitud ? `${interferencia.latitud.toFixed(6)}, ${interferencia.longitud.toFixed(6)}` : 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Observaciones:</strong> {interferencia.observaciones || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Panel Fotográfico:</strong> {interferencia.panel_fotografico || 'N/A'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Entregable:</strong> {interferencia.entregable || 'N/A'}</p>
                        </div>
                    </div>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div ref={mapRef} style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden' }}>
                            <MiniMap alcantarilla={interferencia} route={route} />
                        </div>
                        <ImageCarousel images={images} />
                    </div>
                </div>
                <div className="no-print" style={{ borderTop: '2px solid #eee', paddingTop: '10px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={handleExportPDF} style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>Exportar a PDF</button>
                    <button onClick={onCloseDetail} style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>Regresar a lista</button>
                </div>
            </div>
        </div>
    );
};

export default DetalleInterferenciaView;
