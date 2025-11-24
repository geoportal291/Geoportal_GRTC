import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import GestorDeTramosActual from '../gestion_tramos/GestorDeTramosActual';
import GestorDeCanteras from '../canteras/GestorDeCanteras';
import GestorDeFuentesDeAgua from './GestorDeFuentesDeAgua';
import GestorDeMaterialesContainer from './GestorDeMaterialesContainer'; // Importar el nuevo contenedor
import DashboardSuelos from './DashboardSuelos'; // NEW: Import Dashboard

export default function RecoleccionDeDatosContainer() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [activeMainModule, setActiveMainModule] = useState('dashboard'); // 'dashboard', 'recoleccion' or 'materiales'

  // Derive activeGestor directly from the URL
  const getActiveGestorFromPath = (pathname) => {
    const parts = pathname.split('/');
    const lastSegment = parts[parts.length - 1];

    if (lastSegment === 'gestor-canteras') return 'canteras';
    if (lastSegment === 'gestor-fuentes') return 'fuentes';
    // Default to tramos if the last segment is 'gestor-tramos' or if it's the base path
    return 'tramos';
  };

  const activeGestor = getActiveGestorFromPath(location.pathname);

  const handleGestorChange = (gestor) => {
    // Navigate to the specific gestor route relative to the current base path
    if (gestor === 'tramos') navigate('gestor-tramos');
    else if (gestor === 'canteras') navigate('gestor-canteras');
    else if (gestor === 'fuentes') navigate('gestor-fuentes');
  };

  // Effect to set activeMainModule based on URL
  useEffect(() => {
    if (location.pathname.includes('/uso-materiales')) {
      setActiveMainModule('materiales');
    } else if (location.pathname.includes('gestor-tramos') || location.pathname.includes('gestor-canteras') || location.pathname.includes('gestor-fuentes')) {
      setActiveMainModule('recoleccion');
    } else {
      setActiveMainModule('dashboard');
    }
  }, [location.pathname]);

  // Render the active gestor component
  const renderActiveGestor = () => {
    switch (activeGestor) {
      case 'tramos':
        return <GestorDeTramosActual />;
      case 'canteras':
        return <GestorDeCanteras />;
      case 'fuentes':
        return <GestorDeFuentesDeAgua />;
      default:
        return <GestorDeTramosActual />;
    }
  };

  const handleMainModuleChange = (module) => {
    setActiveMainModule(module);
    if (module === 'dashboard') {
      navigate('/coordinador/recoleccion-datos/dashboard');
    } else if (module === 'recoleccion') {
      navigate('/coordinador/recoleccion-datos/gestor-tramos');
    } else if (module === 'materiales') {
      navigate('/coordinador/uso-materiales/gestor-materiales');
    }
  };

  return (
    <div className="gestor-proyectos-container-wrapper">
      {/* Unified Navigation Panel */}
      <div className="unified-navigation-panel">
        {/* Level 1 Navigation */}
        <nav className="nav-level-1">
          <div
            className={`nav-level-1-item ${activeMainModule === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleMainModuleChange('dashboard')}
          >
            Dashboard Principal
          </div>
          <div
            className={`nav-level-1-item ${activeMainModule === 'recoleccion' ? 'active' : ''}`}
            onClick={() => handleMainModuleChange('recoleccion')}
          >
            Recolección de datos
          </div>
          <div
            className={`nav-level-1-item ${activeMainModule === 'materiales' ? 'active' : ''}`}
            onClick={() => handleMainModuleChange('materiales')}
          >
            Uso de materiales
          </div>
        </nav>

        <div className="nav-separator"></div>

        {/* Level 2 Navigation */}
        {activeMainModule === 'recoleccion' && (
          <nav className="nav-level-2">
            <div
              className={`nav-level-2-item ${activeGestor === 'tramos' ? 'active' : ''}`}
              onClick={() => handleGestorChange('tramos')}
            >
              Gestor de Tramos
            </div>
            <div
              className={`nav-level-2-item ${activeGestor === 'canteras' ? 'active' : ''}`}
              onClick={() => handleGestorChange('canteras')}
            >
              Gestor de Canteras
            </div>
            <div
              className={`nav-level-2-item ${activeGestor === 'fuentes' ? 'active' : ''}`}
              onClick={() => handleGestorChange('fuentes')}
            >
              Gestor de Fuentes de Agua
            </div>
          </nav>
        )}

        {activeMainModule === 'materiales' && (
          <nav className="nav-level-2">
            <div
              className={`nav-level-2-item active`}
              onClick={() => navigate('/coordinador/uso-materiales/gestor-materiales')}
            >
              Gestor de Materiales
            </div>
          </nav>
        )}
      </div>

      {/* Content Area */}
      <div className="content-card">
        {activeMainModule === 'dashboard' && <DashboardSuelos />}
        {activeMainModule === 'recoleccion' && renderActiveGestor()}
        {activeMainModule === 'materiales' && <GestorDeMaterialesContainer />}
      </div>
    </div>
  );
}
