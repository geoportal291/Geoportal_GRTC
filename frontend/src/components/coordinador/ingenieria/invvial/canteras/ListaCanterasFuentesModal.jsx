import React, { useRef, useEffect, useState } from 'react';
import DetalleCanteraFuenteView from './DetalleCanteraFuenteView';
import '../obras/ListaAlcantarillasModal.css'; // Reuse CSS

const ListaCanterasFuentesModal = ({ show, onClose, data, onSelect }) => {
    const modalRef = useRef();
    const [filterType, setFilterType] = useState('all'); // 'all', 'cantera', 'fuente'
    const [sortedData, setSortedData] = useState([]);

    useEffect(() => {
        if (data) {
            let filtered = data;
            if (filterType !== 'all') {
                filtered = data.filter(item => item.type === filterType);
            }

            // Sort by item_number if possible, else by id/progresiva
            const sorted = [...filtered].sort((a, b) => {
                const numA = parseInt(a.item_number || '0', 10);
                const numB = parseInt(b.item_number || '0', 10);
                return numA - numB;
            });
            setSortedData(sorted);
        }
    }, [data, filterType]);

    const handleRowClick = (item) => {
        if (onSelect) {
            onSelect(item);
        }
        // We assume the parent component handles showing the detail view map/panel when selected
        // Or do we want to show the detail modal ON TOP of this list?
        // In CanterasFuentes.jsx, handleElementClick sets selectedElement and isInfoVisible=true (sidebar).
        // The user can then click "Ver detallado".
        // Or we can replicate the behavior of ListaAlcantarillasModal which shows detail view INLINE.

        // However, the previous implementation of CanterasFuentes.jsx (lines 208-219 of original) 
        // passed `setShowListModal(false)`? No.
        // Let's implement row click to just select and maybe close?
        // Or keep it simple.
        // The prompt implied "detailed view for selected elements".
        // CanterasFuentes passes `onSelect={handleElementClick}`.
        // handleElementClick sets state in parent. 
        // If we want to show DetailView *inside* this modal, we need local state here like ListaAlcantarillasModal.
        // BUT CanterasFuentes also has a separate DetalleView logic in the parent (lines 300+ of CanterasFuentes.jsx).
        // Let's just select and close for now to avoid duplications, OR mimics Alcantarillas fully.

        // ListaAlcantarillasModal handles detail view internally.
        // Let's stick to closing the list and focusing the element on map/sidebar, 
        // UNLESS the user explicitly wants to browse details from list.
        // Given the reuse of `ListaAlcantarillasModal.css`, let's try to mimic its behavior: click row -> switch to Detail View inside modal?
        // But `data` passed here has `imageUrls` already attached? Yes, `combinedMapData` has it.

        // Wait, CanterasFuentes.jsx:289 `onSelect={handleElementClick}`.
        // If I mimic internals, I should call `onSelect` AND maybe show detail?
        // Let's simpler: Click -> Select in map -> Close list.
        // This is often better for "Search/List" workflow.

        onSelect(item);
        onClose();
    };

    const handleOverlayClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, fontFamily: 'Arial, sans-serif'
        }} onClick={handleOverlayClick}>

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
                display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'none', border: 'none', fontSize: '1.5rem',
                    cursor: 'pointer', color: '#555'
                }}>&times;</button>

                <h2 style={{ marginBottom: '10px', color: '#333', textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    Lista de Canteras y Fuentes de Agua
                </h2>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
                    <button
                        onClick={() => setFilterType('all')}
                        style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: filterType === 'all' ? '#007bff' : '#eee', color: filterType === 'all' ? 'white' : '#333' }}
                    >Todos</button>
                    <button
                        onClick={() => setFilterType('cantera')}
                        style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: filterType === 'cantera' ? '#ff9800' : '#eee', color: filterType === 'cantera' ? 'white' : '#333' }}
                    >Canteras</button>
                    <button
                        onClick={() => setFilterType('fuente')}
                        style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: filterType === 'fuente' ? '#03a9f4' : '#eee', color: filterType === 'fuente' ? 'white' : '#333' }}
                    >Fuentes</button>
                </div>

                <div className="hide-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '5px' }}>
                    <table className="invvial-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>#</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Tipo</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Progresiva</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Lado</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Propietario</th>
                                <th style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Entregable</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((item) => (
                                <tr key={item.uniqueId}
                                    onClick={() => handleRowClick(item)}
                                    style={{
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #eee',
                                        backgroundColor: item.type === 'cantera' ? '#fffaf0' : '#f0f8ff' // Subtle difference
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e6e6e6'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = item.type === 'cantera' ? '#fffaf0' : '#f0f8ff'}
                                >
                                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#555' }}>
                                        {item.type === 'cantera' ? 'C' : 'F'}-{item.item_number}
                                    </td>
                                    <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img
                                            src={item.type === 'cantera' ? '/imgs/cantera_icon.svg' : '/imgs/fuente_icon.svg'}
                                            alt={item.type}
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        {item.type === 'cantera' ? 'Cantera' : 'Fuente'}
                                    </td>
                                    <td style={{ padding: '10px' }}>{item.progresiva}</td>
                                    <td style={{ padding: '10px' }}>{item.lado}</td>
                                    <td style={{ padding: '10px' }}>{item.propietario}</td>
                                    <td style={{ padding: '10px' }}>{item.entregable}</td>
                                </tr>
                            ))}
                            {sortedData.length === 0 && (
                                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No se encontraron elementos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ListaCanterasFuentesModal;
