import React, { useState, useEffect } from 'react';
import DetalleSenalInformativaView from './DetalleSenalInformativaView'; // Reusing details view for now
import './ListaSenalesInformativasModal.css'; // Reusing styles

const ListaHitosKilometricosModal = ({ show, onClose, hitosData, graphicsImages, initialSelection }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHito, setSelectedHito] = useState(null);

    useEffect(() => {
        if (show && initialSelection) {
            setSelectedHito(initialSelection);
        } else if (!show) {
            setSelectedHito(null);
        }
    }, [show, initialSelection]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const parseProgresivaValue = (val) => {
        if (!val) return 0;
        const cleanVal = String(val).toUpperCase().replace(/KM/g, '').replace(/\+/g, '').replace(/\s/g, '');
        const num = Number(cleanVal);
        return isNaN(num) ? 0 : num;
    };

    const filteredData = (hitosData || []).filter((item) =>
        item.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.progresiva?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clasificacion?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => parseProgresivaValue(a.progresiva) - parseProgresivaValue(b.progresiva));

    const handleRowClick = (item) => {
        setSelectedHito(item);
    };

    const handleBackToList = () => {
        setSelectedHito(null);
    };

    const selectedImages = selectedHito
        ? graphicsImages.filter(img => {
            const code = String(selectedHito.panel_fotografico_codigo || '').trim();
            const imgCode = String(img.panel_fotografico_codigo || '').trim();
            const imgIndex = img.index ? String(img.index).trim() : '';

            let urlFileName = '';
            if (img.url) {
                const parts = img.url.split('/');
                const fileNameWithExt = parts[parts.length - 1];
                urlFileName = fileNameWithExt.split('.')[0];
            }

            return imgCode === code || imgIndex === code || urlFileName === code;
        })
        : [];

    if (!show) return null;

    const formatProgresiva = (prog) => {
        if (!prog) return '';
        if (String(prog).toUpperCase().includes('KM') || String(prog).includes('+')) {
            return prog;
        }
        const val = Number(prog);
        if (isNaN(val)) return prog;

        const km = Math.floor(val / 1000);
        const m = Math.round(val % 1000);
        return `KM ${km}+${String(m).padStart(3, '0')}`;
    };

    return (
        <div className="lista-senales-modal-overlay">
            <div className="lista-senales-modal-content">
                <button className="lista-senales-modal-close" onClick={onClose}>&times;</button>

                {!selectedHito ? (
                    <>
                        <h2 className="lista-senales-modal-title" style={{ textAlign: 'center' }}>Lista de Hitos Kilométricos</h2>
                        <div className="lista-senales-search-container">
                            <input
                                type="text"
                                placeholder="Buscar por código, progresiva..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="lista-senales-search-input"
                            />
                        </div>

                        <div className="lista-senales-table-container">
                            <table className="lista-senales-table">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Progresiva</th>
                                        <th>Tipo</th>
                                        <th>Clasificación</th>
                                        <th>Lado</th>
                                        <th>Material</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length > 0 ? (
                                        filteredData.map((item, index) => (
                                            <tr key={index} onClick={() => handleRowClick(item)}>
                                                <td>{item.codigo}</td>
                                                <td>{formatProgresiva(item.progresiva)}</td>
                                                <td>{item.tipo}</td>
                                                <td>{item.clasificacion}</td>
                                                <td>{item.lado}</td>
                                                <td>{item.material}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center">No se encontraron registros</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <DetalleSenalInformativaView
                        senal={selectedHito}
                        images={selectedImages}
                        onBack={handleBackToList}
                    />
                )}
            </div>
        </div>
    );
};

export default ListaHitosKilometricosModal;
