import React, { useRef, useEffect, useState } from 'react';
import DetalleZonaCriticaView from './DetalleZonaCriticaView';
import './ListaAlcantarillasModal.css'; // Reusing CSS

const ListaZonasCriticasModal = ({ show, onClose, zonasCriticasData, route, graphicsImages, initialSelectedZona }) => {
    const modalRef = useRef();
    const [showDetailView, setShowDetailView] = useState(false);
    const [selectedZonaDetail, setSelectedZonaDetail] = useState(null);
    const [detailedImages, setDetailedImages] = useState([]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);

            // Check if there is an initial selection
            if (initialSelectedZona) {
                handleRowClick(initialSelectedZona);
            } else {
                // Reset view when modal is reopened without initial selection
                setShowDetailView(false);
                setSelectedZonaDetail(null);
                setDetailedImages([]);
            }
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [show, onClose, initialSelectedZona]);

    const handleRowClick = (zona) => {
        // Set the selected zona for detail view
        setSelectedZonaDetail(zona);

        // Filter images based on the selected zona's photo panel code
        if (zona && zona.panel_fotografico_codigo && graphicsImages) {
            const code = String(zona.panel_fotografico_codigo); // Ensure code is a string
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
                end = start; // Treat single number as a range of one
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
                setDetailedImages(filtered);
            } else {
                setDetailedImages([]);
            }
        } else {
            setDetailedImages([]);
        }

        // Switch to detail view
        setShowDetailView(true);
    };

    const handleCloseDetailView = () => {
        setShowDetailView(false);
        setSelectedZonaDetail(null);
        setDetailedImages([]);
    };

    if (!show) {
        return null;
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
            {!showDetailView ? (
                <div ref={modalRef} className="hide-scrollbar" style={{
                    backgroundColor: '#ffffff',
                    padding: '30px',
                    borderRadius: '10px',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                    maxWidth: '1000px', // Slightly wider for more columns
                    width: '95%',
                    zIndex: 10001,
                    position: 'relative',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <button onClick={onClose} style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#555'
                    }}>&times;</button>

                    <h2 style={{ marginBottom: '20px', color: '#333', textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                        Lista de Zonas Críticas
                    </h2>

                    {zonasCriticasData && zonasCriticasData.length > 0 ? (
                        <div className="hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '5px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                <thead style={{ position: 'sticky', top: '0', backgroundColor: '#f8f8f8', zIndex: 1 }}>
                                    <tr>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Código</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Progresiva</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Tipo</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Lado</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Longitud</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Clase Daño</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {zonasCriticasData.sort((a, b) => {
                                        // Simple sort by ID or Progresiva logic if consistent
                                        const getItem = (item) => {
                                            if (!item.progresiva) return 0;
                                            return parseFloat(item.progresiva.replace('+', ''));
                                        }
                                        return getItem(a) - getItem(b);
                                    }).map((element) => (
                                        <tr key={element.id_zona_critica} className="alcantarilla-row" onClick={() => handleRowClick(element)} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.codigo}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>
                                                {(() => {
                                                    const formatProgresiva = (value) => {
                                                        if (!value) return '';
                                                        const num = parseInt(value, 10);
                                                        if (isNaN(num)) return value;
                                                        const km = Math.floor(num / 1000);
                                                        const m = num % 1000;
                                                        return `${km}+${m.toString().padStart(3, '0')}`;
                                                    };
                                                    return formatProgresiva(element.progresiva);
                                                })()}
                                            </td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.tipo}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.lado}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.longitud_zona}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.clase_dano}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#777', padding: '20px' }}>
                            <p>No hay zonas críticas para mostrar.</p>
                        </div>
                    )}
                </div>
            ) : (
                <DetalleZonaCriticaView
                    zonaCritica={selectedZonaDetail}
                    images={detailedImages}
                    route={route}
                    onCloseDetail={handleCloseDetailView}
                />
            )}
        </div>
    );
};

export default ListaZonasCriticasModal;
