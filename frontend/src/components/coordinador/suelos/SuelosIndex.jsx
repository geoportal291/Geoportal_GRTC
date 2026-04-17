import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../data/contexts/AuthContext';
import RecoleccionDeDatosContainer from './ui/RecoleccionDeDatosContainer';
import DashboardSuelos from './ui/DashboardSuelos';

// --- Modal Selection Component ---
const ViewSelectionModal = ({ onSelect }) => {
  return (
    <div className="view-selection-overlay">
      <div className="view-selection-card">
        <h3>Bienvenido al Geoportal</h3>
        <p>Seleccione el modo de visualización:</p>

        <div className="view-options">
          <div className="view-option" onClick={() => onSelect('internal')}>
            <div className="icon-box">📊</div>
            <h4>Gestión Interna</h4>
            <p>Administración y edición de inventario.</p>
          </div>

          <div className="view-option" onClick={() => onSelect('external')}>
            <div className="icon-box">🗺️</div>
            <h4>Vista Externa</h4>
            <p>Visualización geográfica interactiva.</p>
          </div>
        </div>
      </div>
      <style>{`
                .view-selection-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.8); z-index: 9999;
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(5px);
                }
                .view-selection-card {
                    background: white; padding: 40px; border-radius: 20px;
                    text-align: center; max-width: 600px; width: 90%;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    font-family: 'Segoe UI', sans-serif;
                }
                .view-selection-card h3 { margin-top: 0; color: #333; font-size: 1.8rem; }
                .view-options {
                    display: flex; gap: 20px; margin-top: 30px;
                    justify-content: center;
                }
                .view-option {
                    flex: 1; padding: 20px; border-radius: 12px;
                    border: 2px solid #eee; cursor: pointer;
                    transition: all 0.3s ease;
                }
                .view-option:hover {
                    border-color: #0056b3; transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0,86,179,0.1);
                }
                .icon-box { font-size: 3rem; margin-bottom: 10px; }
                .view-option h4 { margin: 10px 0; color: #0056b3; }
                .view-option p { font-size: 0.9rem; color: #666; }
            `}</style>
    </div>
  );
};

export default function SuelosIndex() {
  const { user } = useAuth();
  const location = useLocation();
  const [viewMode, setViewMode] = useState(() => sessionStorage.getItem('suelosViewMode') || null);
  const [showSelection, setShowSelection] = useState(false);

  useEffect(() => {
    if (user) {
      if (!viewMode) {
        if (location.pathname === '/coordinador/recoleccion-datos' || location.pathname === '/coordinador/recoleccion-datos/') {
          setShowSelection(true); 
        } else {
          setViewMode('internal');
          sessionStorage.setItem('suelosViewMode', 'internal');
          setShowSelection(false);
        }
      }
    }
  }, [user, location.pathname, viewMode]);

  const handleViewSelect = (mode) => {
    setViewMode(mode);
    sessionStorage.setItem('suelosViewMode', mode);
    setShowSelection(false);
  };

  if (showSelection) {
    return <ViewSelectionModal onSelect={handleViewSelect} />;
  }

  if (viewMode === 'external') {
    // Modo "Vista Externa" es puramente el Mapa Inmersivo Premium (el Dashboard)
    return <DashboardSuelos isExternalView={true} onBackToSelection={() => setShowSelection(true)} />;
  }

  if (viewMode === 'internal') {
    // Modo "Gestión Interna" carga toda la consola de edición y modales (Recolección Container)
    return <RecoleccionDeDatosContainer viewMode="internal" />;
  }

  return null;
}
