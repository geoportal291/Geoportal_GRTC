import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';

import GestorDeTramosActual from '../gestion_tramos/GestorDeTramosActual';
import GestorDeCanteras from '../canteras/GestorDeCanteras';
import GestorDeFuentesDeAgua from './GestorDeFuentesDeAgua';
import GestorDeMaterialesContainer from './GestorDeMaterialesContainer'; // Importar el nuevo contenedor
import DashboardSuelos from './DashboardSuelos'; // NEW: Import Dashboard
import Vista3D from '../3d/Vista3D'; // IMPORTAR VISTA 3D
import EnsayosContainer from '../ensayos/EnsayosContainer';

import '../proyectos/GestorProyectos.css'; // Importar los estilos de navegación unificada

export default function RecoleccionDeDatosContainer({ viewMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMainModule, setActiveMainModule] = useState('dashboard'); // Siempre inicializar en dashboard

  // Derive activeGestor directly from the URL
  const getActiveGestorFromPath = (pathname) => {
    if (pathname.includes('gestor-canteras')) return 'canteras';
    if (pathname.includes('gestor-fuentes')) return 'fuentes';
    if (pathname.includes('gestor-ensayos')) return 'ensayos';
    // Default to tramos if the last segment is 'gestor-tramos' or if it's the base path
    return 'tramos';
  };

  const activeGestor = getActiveGestorFromPath(location.pathname);
  const baseRoute = '/coordinador/recoleccion-datos';

  const handleGestorChange = (gestor) => {
    if (gestor === 'tramos') navigate(`${baseRoute}/gestor-tramos`);
    else if (gestor === 'canteras') navigate(`${baseRoute}/gestor-canteras`);
    else if (gestor === 'fuentes') navigate(`${baseRoute}/gestor-fuentes`);
    else if (gestor === 'ensayos') {
      const lastId = sessionStorage.getItem('lastSelectedTramoId');
      if (lastId) {
        navigate(`${baseRoute}/gestor-ensayos/tramos/${lastId}`);
      } else {
        navigate(`${baseRoute}/gestor-ensayos/tramos`);
      }
    }
  };

  // Effect to set activeMainModule based on URL
  useEffect(() => {
    if (location.pathname.includes('/uso-materiales')) {
      setActiveMainModule('materiales');
    } else if (location.pathname.includes('/3d')) {
      setActiveMainModule('3d');
    } else if (
      location.pathname.includes('gestor-tramos') ||
      location.pathname.includes('gestor-canteras') ||
      location.pathname.includes('gestor-fuentes') ||
      location.pathname.includes('gestor-ensayos')
    ) {
      setActiveMainModule('recoleccion');
    } else {
      setActiveMainModule('dashboard');
    }
  }, [location.pathname]);

  const handleMainModuleChange = (module) => {
    setActiveMainModule(module);
    if (module === 'dashboard') {
      navigate(`${baseRoute}/dashboard`);
    } else if (module === 'recoleccion') {
      navigate(`${baseRoute}/gestor-tramos`);
    } else if (module === 'materiales') {
      navigate(`${baseRoute}/uso-materiales`);
    } else if (module === '3d') {
      navigate(`${baseRoute}/3d`);
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
            Dashboard
          </div>
          <div
            className={`nav-level-1-item ${activeMainModule === 'recoleccion' ? 'active' : ''}`}
            onClick={() => handleMainModuleChange('recoleccion')}
          >
            Datos de Suelos
          </div>
          <div
            className={`nav-level-1-item ${activeMainModule === 'materiales' ? 'active' : ''}`}
            onClick={() => handleMainModuleChange('materiales')}
          >
            Materiales
          </div>
          <div
            className={`nav-level-1-item ${activeMainModule === '3d' ? 'active' : ''}`}
            onClick={() => handleMainModuleChange('3d')}
          >
            Entorno 3D
          </div>
        </nav>

        {activeMainModule === 'recoleccion' && <div className="nav-separator"></div>}

        {/* Level 2 Navigation */}
        {activeMainModule === 'recoleccion' && (
          <nav className="nav-level-2">
            <div
              className={`nav-level-2-item ${activeGestor === 'tramos' ? 'active' : ''}`}
              onClick={() => handleGestorChange('tramos')}
            >
              Progresivas
            </div>
            <div
              className={`nav-level-2-item ${activeGestor === 'canteras' ? 'active' : ''}`}
              onClick={() => handleGestorChange('canteras')}
            >
              Canteras
            </div>
            <div
              className={`nav-level-2-item ${activeGestor === 'fuentes' ? 'active' : ''}`}
              onClick={() => handleGestorChange('fuentes')}
            >
              Fuentes
            </div>
            <div
              className={`nav-level-2-item ${activeGestor === 'ensayos' ? 'active' : ''}`}
              onClick={() => handleGestorChange('ensayos')}
            >
              Ensayos
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
      <div className={`content-card 
        ${activeMainModule === '3d' ? 'content-card-3d' : ''} 
        ${activeGestor === 'ensayos' ? 'content-card-no-scroll' : ''}
      `}>
        <Routes>
          <Route path="dashboard" element={<DashboardSuelos />} />
          <Route path="gestor-tramos/*" element={<GestorDeTramosActual />} />
          <Route path="gestor-canteras/*" element={<GestorDeCanteras />} />
          <Route path="gestor-fuentes/*" element={<GestorDeFuentesDeAgua />} />
          <Route path="gestor-ensayos/*" element={<EnsayosContainer />} />
          <Route path="uso-materiales/*" element={<GestorDeMaterialesContainer />} />
          <Route path="3d" element={<Vista3D />} />
          {/* Default and Index */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
