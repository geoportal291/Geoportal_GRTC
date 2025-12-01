import React, { useState, useEffect } from 'react';
import './Alcantarillas.css'; // Reusing existing styles for consistency

const ExportarMapaModal = ({ show, onClose, data, type, onExport }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (show) {
            // Reset selection when modal opens
            setSelectedIds([]);
            setSearchTerm('');
        }
    }, [show]);

    if (!show) return null;

    const filteredData = data.filter(item =>
        (item.codigo && item.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.nombre && item.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.prog_ini && item.prog_ini.toString().includes(searchTerm))
    );

    const handleSelectAll = () => {
        if (selectedIds.length === filteredData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(item => item.id_alcantarilla || item.id_baden));
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleExportClick = (format) => {
        const selectedItems = data.filter(item => selectedIds.includes(item.id_alcantarilla || item.id_baden));
        onExport(selectedItems, format);
    };

    return (
        <div className="alcantarilla-modal-overlay">
            <div className="alcantarilla-modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                <button className="alcantarilla-modal-close" onClick={onClose}>&times;</button>
                <div className="alcantarilla-modal-header">
                    <h2>Exportar {type === 'alcantarillas' ? 'Alcantarillas' : 'Badenes'}</h2>
                </div>

                <div className="alcantarilla-modal-body">
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="text"
                            placeholder="Buscar por código o progresiva..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <button
                            onClick={handleSelectAll}
                            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', padding: 0 }}
                        >
                            {selectedIds.length === filteredData.length && filteredData.length > 0 ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                        </button>
                        <span>{selectedIds.length} seleccionados</span>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                    <th style={{ padding: '10px', width: '40px' }}></th>
                                    <th style={{ padding: '10px' }}>Código</th>
                                    <th style={{ padding: '10px' }}>Progresiva</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(item => {
                                    const id = item.id_alcantarilla || item.id_baden;
                                    return (
                                        <tr key={id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(id)}
                                                    onChange={() => handleSelectOne(id)}
                                                />
                                            </td>
                                            <td style={{ padding: '10px' }}>{item.codigo || 'S/C'}</td>
                                            <td style={{ padding: '10px' }}>{item.prog_ini || '-'}</td>
                                        </tr>
                                    );
                                })}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                            No se encontraron elementos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => handleExportClick('kml')}
                            disabled={selectedIds.length === 0}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: selectedIds.length === 0 ? 0.6 : 1
                            }}
                        >
                            Exportar KML
                        </button>
                        <button
                            onClick={() => handleExportClick('shapefile')}
                            disabled={selectedIds.length === 0}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: selectedIds.length === 0 ? 0.6 : 1
                            }}
                        >
                            Exportar Shapefile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportarMapaModal;
