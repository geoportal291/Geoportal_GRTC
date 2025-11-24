import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import VistaGeneralEnsayos from './VistaGeneralEnsayos';
import VistaEnsayosCantera from './VistaEnsayosCantera';
import DetalleEnsayo from './DetalleEnsayo';
import './EnsayosContainer.css';

const EnsayosContainer = () => {
    const location = useLocation();
    const [lastTramoId, setLastTramoId] = useState(null);

    return (
        <div className="ensayos-container">
            <div className="ensayos-navigation">
                <Link 
                    to={lastTramoId ? `/coordinador/suelos/ensayos/tramos/${lastTramoId}` : "/coordinador/suelos/ensayos/tramos"}
                    className={`nav-link ${location.pathname.includes('/tramos') ? 'active' : ''}`}
                >
                    <i className="fas fa-road"></i> Ensayos por Tramo
                </Link>
                <Link 
                    to="/coordinador/suelos/ensayos/canteras" 
                    className={`nav-link ${location.pathname.includes('/canteras') ? 'active' : ''}`}
                >
                    <i className="fas fa-mountain"></i> Ensayos por Cantera
                </Link>
                {/* Add more links here in the future */}
            </div>
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
