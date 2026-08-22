import React, { useRef, useEffect, useState } from 'react';
import DetalleEstructuraExistenteView from './DetalleEstructuraExistenteView';

const ListaEstructurasExistentesModal = ({ isOpen, onClose, data, route, initialSelectedStructure }) => {
    const modalRef = useRef();
    const [showDetailView, setShowDetailView] = useState(false);
    const [selectedStructureDetail, setSelectedStructureDetail] = useState(null);

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
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);

            if (initialSelectedStructure) {
                handleRowClick(initialSelectedStructure);
            } else {
                setShowDetailView(false);
                setSelectedStructureDetail(null);
            }
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose, initialSelectedStructure]);

    const formatProgresiva = (value) => {
        if (value === null || value === undefined) return '';
        const num = Number(value);
        if (isNaN(num)) return value;
        const km = Math.floor(num / 1000);
        const m = Math.round(num % 1000);
        return `${km}+${m.toString().padStart(3, '0')}`;
    };

    const handleRowClick = (structure) => {
        setSelectedStructureDetail(structure);
        setShowDetailView(true);
    };

    const handleCloseDetailView = () => {
        setShowDetailView(false);
        setSelectedStructureDetail(null);
    };

    if (!isOpen) return null;

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
                    maxWidth: '1000px',
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
                        Lista de Estructuras Existentes
                    </h2>

                    {data && data.length > 0 ? (
                        <div className="hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '5px' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                <thead style={{ position: 'sticky', top: '0', backgroundColor: '#f8f8f8', zIndex: 1 }}>
                                    <tr>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Entregable</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>PF</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Prog. Inicio</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Prog. Fin</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Ancho</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onClick={() => handleRowClick(item)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{item.entregable}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{item.panel_fotografico}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{formatProgresiva(item.progresiva_inicio)}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{formatProgresiva(item.progresiva_final)}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{item.ancho_calzada}</td>
                                            <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{item.observaciones}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#777', padding: '20px' }}>
                            <p>No hay estructuras existentes para mostrar.</p>
                        </div>
                    )}
                </div>
            ) : (
                <DetalleEstructuraExistenteView
                    structure={selectedStructureDetail}
                    images={selectedStructureDetail?.images || []}
                    route={route}
                    onCloseDetail={handleCloseDetailView}
                />
            )}
        </div>
    );
};

export default ListaEstructurasExistentesModal;
