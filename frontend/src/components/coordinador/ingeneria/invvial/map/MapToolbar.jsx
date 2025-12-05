import React, { useState, useRef, useEffect } from 'react';
import './geoite.css'; // Ensure CSS is imported

const MapToolbar = ({
    onZoomIn,
    onZoomOut,
    onMeasureDistance,
    onMeasureArea,
    onUbicarProgresiva,
    onToggleEdit,
    onChangeColor,
    onDeleteLastPoint,
    onUploadKml,
    onDownloadKml, // Changed from onSaveProject to match geoite logic
    onDeleteKml,   // New prop for deleting KML
    onChangeMapLayer,
    onClearAll,
    onSavePoints, // New prop
    onCalibrate,   // New prop
    calibrationData // Prop to know if calibration exists
}) => {
    const [activeMenu, setActiveMenu] = useState(null);
    const [progresivaInput, setProgresivaInput] = useState('');

    // State for drawing tools
    const [drawColor, setDrawColor] = useState('#ff4500');
    const [isEditEnabled, setIsEditEnabled] = useState(false);

    // State for map layers
    const [selectedMapLayer, setSelectedMapLayer] = useState('Estándar');

    const toggleMenu = (menuId) => {
        if (activeMenu === menuId) {
            setActiveMenu(null);
        } else {
            setActiveMenu(menuId);
        }
    };

    const closeAll = () => {
        setActiveMenu(null);
    };

    // Helper to get button class
    const getBtnClass = (menuId) => {
        return `tool-btn ${activeMenu === menuId ? 'active' : ''}`;
    };

    return (
        <>
            {/* --- 1. BARRA VERTICAL --- */}
            <div className="toolbar-container">
                <div className="tool-group">
                    <button className="tool-btn" onClick={onZoomIn} title="Acercar"><i className="fas fa-plus"></i></button>
                    <button className="tool-btn" onClick={onZoomOut} title="Alejar"><i className="fas fa-minus"></i></button>
                </div>

                <div className="tool-group">
                    <button
                        className={getBtnClass('menu-medir')}
                        onClick={() => toggleMenu('menu-medir')}
                        title="Mediciones"
                    >
                        <i className="fas fa-ruler-combined"></i>
                    </button>
                    <button
                        className={getBtnClass('menu-dibujo')}
                        onClick={() => toggleMenu('menu-dibujo')}
                        title="Dibujo"
                    >
                        <i className="fas fa-pencil-alt" style={{ color: '#e67e22' }}></i>
                    </button>
                    <button
                        className={getBtnClass('menu-kml')}
                        onClick={() => toggleMenu('menu-kml')}
                        title="Gestión KML"
                    >
                        <i className="fas fa-save" style={{ color: '#6c5ce7' }}></i>
                    </button>
                    <button
                        className={getBtnClass('menu-capas')}
                        onClick={() => toggleMenu('menu-capas')}
                        title="Capas"
                    >
                        <i className="fas fa-layer-group" style={{ color: '#004080' }}></i>
                    </button>
                    <button
                        className={getBtnClass('menu-acciones')}
                        onClick={() => toggleMenu('menu-acciones')}
                        title="Acciones"
                    >
                        <i className="fas fa-tools" style={{ color: '#28a745' }}></i>
                    </button>
                </div>

                <div className="tool-group">
                    <button className="tool-btn" onClick={onClearAll} title="Limpiar Todo"><i className="fas fa-trash-alt"></i></button>
                </div>
            </div>

            {/* --- 2. TARJETAS FLOTANTES --- */}

            {/* Menú Medir */}
            {activeMenu === 'menu-medir' && (
                <div id="menu-medir" className="flyout-card card-blue" style={{ display: 'block', top: '80px', left: '70px' }}>
                    <div className="card-header header-blue">
                        <span>Mediciones</span>
                        <i className="fas fa-times" style={{ cursor: 'pointer' }} onClick={closeAll}></i>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <button className="btn-block" onClick={onMeasureDistance}><i className="fas fa-ruler"></i> Distancia</button>
                            <button className="btn-block" onClick={onMeasureArea}><i className="fas fa-draw-polygon"></i> Área</button>
                        </div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Ubicar Progresiva:</label>
                        <div className="input-flex">
                            <input
                                type="text"
                                placeholder="Km 4+780"
                                value={progresivaInput}
                                onChange={(e) => setProgresivaInput(e.target.value)}
                            />
                            <button onClick={() => onUbicarProgresiva(progresivaInput)}>Ir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Menú Dibujo */}
            {activeMenu === 'menu-dibujo' && (
                <div id="menu-dibujo" className="flyout-card card-orange" style={{ display: 'block', top: '135px', left: '70px' }}>
                    <div className="card-header header-orange">
                        <span>Herramientas de Dibujo</span>
                        <i className="fas fa-times" style={{ cursor: 'pointer' }} onClick={closeAll}></i>
                    </div>
                    <div className="card-body">
                        {/* 
                            Nota: La funcionalidad de "Habilitar edición" y "Color" requeriría 
                            lógica adicional en geoite.jsx para conectarse con Leaflet Draw.
                            Por ahora las dejamos visuales o conectadas a props simples.
                        */}
                        <label className="ui-row">
                            <input
                                type="checkbox"
                                checked={isEditEnabled}
                                onChange={(e) => {
                                    setIsEditEnabled(e.target.checked);
                                    onToggleEdit && onToggleEdit(e.target.checked);
                                }}
                            /> Habilitar edición
                        </label>
                        <label className="ui-row">
                            <input
                                type="color"
                                value={drawColor}
                                onChange={(e) => {
                                    setDrawColor(e.target.value);
                                    onChangeColor && onChangeColor(e.target.value);
                                }}
                            /> Color de línea
                        </label>
                        <button
                            className="btn-block"
                            style={{ background: '#fff0e6', color: '#d35400', borderColor: '#fadbd8' }}
                            onClick={onDeleteLastPoint}
                        >
                            Borrar último punto
                        </button>
                    </div>
                </div>
            )}

            {/* Menú KML */}
            {activeMenu === 'menu-kml' && (
                <div id="menu-kml" className="flyout-card card-purple" style={{ display: 'block', top: '190px', left: '70px' }}>
                    <div className="card-header header-purple">
                        <span>Gestión de Archivos</span>
                        <i className="fas fa-times" style={{ cursor: 'pointer' }} onClick={closeAll}></i>
                    </div>
                    <div className="card-body">
                        <button className="btn-block" onClick={() => document.getElementById('kml-upload-input').click()}>
                            <i className="fas fa-upload"></i> Cargar KML
                        </button>
                        <input
                            type="file"
                            id="kml-upload-input"
                            accept=".kml"
                            style={{ display: 'none' }}
                            onChange={(e) => onUploadKml(e.target.files[0])}
                        />
                        <button className="btn-block" onClick={onDownloadKml}>
                            <i className="fas fa-download"></i> Descargar KML
                        </button>
                        <button className="btn-block" onClick={onDeleteKml} style={{ color: '#dc3545', borderColor: '#dc3545', background: '#fff' }}>
                            <i className="fas fa-trash"></i> Eliminar KML
                        </button>
                    </div>
                </div>
            )}

            {/* Menú Capas */}
            {activeMenu === 'menu-capas' && (
                <div id="menu-capas" className="flyout-card card-blue" style={{ display: 'block', top: '245px', left: '70px' }}>
                    <div className="card-header header-blue">
                        <span>Información General</span>
                        <i className="fas fa-times" style={{ cursor: 'pointer' }} onClick={closeAll}></i>
                    </div>
                    <div className="card-body">
                        <label className="ui-row">
                            <input
                                type="radio"
                                name="map"
                                checked={selectedMapLayer === 'Estándar'}
                                onChange={() => { setSelectedMapLayer('Estándar'); onChangeMapLayer('Estándar'); }}
                            /> Estándar
                        </label>
                        <label className="ui-row">
                            <input
                                type="radio"
                                name="map"
                                checked={selectedMapLayer === 'Topográfico'}
                                onChange={() => { setSelectedMapLayer('Topográfico'); onChangeMapLayer('Topográfico'); }}
                            /> Topográfico
                        </label>
                        <label className="ui-row">
                            <input
                                type="radio"
                                name="map"
                                checked={selectedMapLayer === 'Satélite'}
                                onChange={() => { setSelectedMapLayer('Satélite'); onChangeMapLayer('Satélite'); }}
                            /> Satélite
                        </label>
                    </div>
                </div>
            )}

            {/* Menú Acciones (Nuevo para mantener funcionalidad de geoite.jsx) */}
            {activeMenu === 'menu-acciones' && (
                <div id="menu-acciones" className="flyout-card card-green" style={{ display: 'block', top: '300px', left: '70px' }}>
                    <div className="card-header header-green" style={{ backgroundColor: '#28a745' }}>
                        <span>Acciones del Proyecto</span>
                        <i className="fas fa-times" style={{ cursor: 'pointer' }} onClick={closeAll}></i>
                    </div>
                    <div className="card-body">
                        <button className="btn-block" onClick={onSavePoints}>
                            <i className="fas fa-save"></i> Guardar Puntos
                        </button>
                        <button className="btn-block" onClick={onCalibrate}>
                            <i className="fas fa-cog"></i> Calibrar Trazado
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MapToolbar;
