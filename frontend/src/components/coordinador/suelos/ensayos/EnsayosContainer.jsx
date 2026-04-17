import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import VistaGeneralEnsayos from './VistaGeneralEnsayos';
import VistaEnsayosCantera from './VistaEnsayosCantera';
import DetalleEnsayo from './DetalleEnsayo';
import './EnsayosContainer.css';

const EnsayosContainer = () => {
    const location = useLocation();
    const [lastTramoId, setLastTramoId] = useState(null);

    // Determinar la ruta base dinámicamente según si estamos en la consola unificada o standalone
    const basePath = location.pathname.includes('/recoleccion-datos/gestor-ensayos')
        ? '/coordinador/recoleccion-datos/gestor-ensayos'
        : '/coordinador/suelos/ensayos';

    return (
        <div className="ensayos-container">
            <nav className="nav-level-2" style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                <Link 
                    to={lastTramoId ? `${basePath}/tramos/${lastTramoId}` : `${basePath}/tramos`}
                    className={`nav-level-2-item ${location.pathname.includes('/tramos') ? 'active' : ''}`}
                >
                    <i className="fas fa-road" style={{ marginRight: '8px' }}></i> Ensayos por Tramo
                </Link>
                <Link 
                    to={`${basePath}/canteras`} 
                    className={`nav-level-2-item ${location.pathname.includes('/canteras') ? 'active' : ''}`}
                >
                    <i className="fas fa-mountain" style={{ marginRight: '8px' }}></i> Ensayos por Cantera
                </Link>
            </nav>
            <div className="ensayos-content">
                <Routes>
                    <Route path="tramos" element={<VistaGeneralEnsayos setLastTramoId={setLastTramoId} />} />
                    <Route path="tramos/:tramoId" element={<VistaGeneralEnsayos setLastTramoId={setLastTramoId} />} />
                    <Route path="canteras" element={<VistaEnsayosCantera />} />
                    <Route path=":ensayoId" element={<DetalleEnsayo />} />
                    <Route index element={
                        <div className="ensayos-placeholder">
                            <h2>Bienvenido al Gestor de Ensayos</h2>
                            <p>Selecciona una categoría de la navegación superior para comenzar.</p>
                        </div>
                    } />
                </Routes>
            </div>
        </div>
    );
};

export default EnsayosContainer;
