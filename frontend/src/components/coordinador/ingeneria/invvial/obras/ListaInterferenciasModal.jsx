import React, { useRef, useEffect, useState } from 'react';
import DetalleInterferenciaView from './DetalleInterferenciaView';
import './ListaAlcantarillasModal.css'; // Reusing CSS

const ListaInterferenciasModal = ({ show, onClose, interferenciasData, route, graphicsImages, initialSelectedInterferencia }) => {
    const modalRef = useRef();
    const [showDetailView, setShowDetailView] = useState(false);
    const [selectedInterferenciaDetail, setSelectedInterferenciaDetail] = useState(null);
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

            if (initialSelectedInterferencia) {
                handleRowClick(initialSelectedInterferencia);
            } else {
                setShowDetailView(false);
                setSelectedInterferenciaDetail(null);
                setDetailedImages([]);
            }
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [show, onClose, initialSelectedInterferencia]);

    const handleRowClick = (interferencia) => {
        setSelectedInterferenciaDetail(interferencia);

        if (interferencia && interferencia.panel_fotografico && graphicsImages) {
            const code = String(interferencia.panel_fotografico);
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
                setDetailedImages(filtered);
            } else {
                setDetailedImages([]);
            }
        } else {
            setDetailedImages([]);
        }
        setShowDetailView(true);
    };

    const handleCloseDetailView = () => {
        setShowDetailView(false);
        setSelectedInterferenciaDetail(null);
        setDetailedImages([]);
    };

    if (!show) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, fontFamily: 'Arial, sans-serif' }}>
            {!showDetailView ? (
                <div ref={modalRef} className="hide-scrollbar" style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)', maxWidth: '1000px', width: '95%', zIndex: 10001, position: 'relative', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#555' }}>&times;</button>
                    <h2 style={{ marginBottom: '20px', color: '#333', textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Lista de Interferencias Eléctricas</h2>
                    {interferenciasData && interferenciasData.length > 0 ? (
                        <div className="hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '5px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                <thead style={{ position: 'sticky', top: '0', backgroundColor: '#f8f8f8', zIndex: 1 }}>
                                    <tr>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Progresiva</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Tipo</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Material</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Tensión</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Lado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interferenciasData.sort((a, b) => {
                                        const getItem = (item) => {
                                            if (!item.progresiva) return 0;
                                            return parseFloat(item.progresiva.replace('+', '').replace('km', ''));
                                        }
                                        return getItem(a) - getItem(b);
                                    }).map((element) => (
                                        <tr key={element.id} className="alcantarilla-row" onClick={() => handleRowClick(element)} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>
                                                {element.progresiva}
                                            </td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.tipo_interferencia}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.material}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.tension}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.lado}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#777', padding: '20px' }}><p>No hay interferencias para mostrar.</p></div>
                    )}
                </div>
            ) : (
                <DetalleInterferenciaView interferencia={selectedInterferenciaDetail} images={detailedImages} route={route} onCloseDetail={handleCloseDetailView} />
            )}
        </div>
    );
};

export default ListaInterferenciasModal;
