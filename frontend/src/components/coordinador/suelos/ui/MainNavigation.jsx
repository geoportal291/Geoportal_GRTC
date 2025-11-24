import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MainNavigation.css'; // NEW: Import MainNavigation.css

export default function MainNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Initial state based on current path
  const getInitialActiveState = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      return { module: 'dashboard', gestor: '' };
    } else if (path.includes('/recoleccion-datos')) {
      if (path.includes('./gestion/gestor-tramos')) return { module: 'dataCollection', gestor: 'tramos' };
      if (path.includes('./canteras/gestor-canteras')) return { module: 'dataCollection', gestor: 'canteras' };
      if (path.includes('/gestor-fuentes')) return { module: 'dataCollection', gestor: 'fuentes' };
    } else if (path.includes('/uso-materiales')) {
      // Add logic for material usage gestores later
      return { module: 'materialUsage', gestor: '' };
    }
    return { module: 'dashboard', gestor: '' }; // Default to dashboard
  };

  const [activeState, setActiveState] = useState(getInitialActiveState);

  const handleModuleChange = (module) => {
    setActiveState(prev => ({ ...prev, module, gestor: '' })); // Reset gestor when changing module
    // Navigate to a default route within the module
    if (module === 'dashboard') navigate('/coordinador/dashboard');
    else if (module === 'dataCollection') navigate('/coordinador/recoleccion-datos/gestor-tramos');
    else if (module === 'materialUsage') navigate('/coordinador/uso-materiales/dashboard'); // Placeholder
  };

  const handleGestorChange = (gestor) => {
    setActiveState(prev => ({ ...prev, gestor }));
    if (activeState.module === 'dataCollection') {
      if (gestor === 'tramos') navigate('/coordinador/recoleccion-datos/gestor-tramos');
      else if (gestor === 'canteras') navigate('/coordinador/recoleccion-datos/gestor-canteras');
      else if (gestor === 'fuentes') navigate('/coordinador/recoleccion-datos/gestor-fuentes');
    } else if (activeState.module === 'materialUsage') {
      // Add navigation for material usage gestores later
    }
  };

  return (
    <div className="main-header">
        <nav className="nav-level-1">
            <div 
                className={`nav-level-1-item ${activeState.module === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleModuleChange('dashboard')}
            >
                Dashboard Principal
            </div>
            <div 
                className={`nav-level-1-item ${activeState.module === 'dataCollection' ? 'active' : ''}`}
                onClick={() => handleModuleChange('dataCollection')}
            >
                Recolección de datos
            </div>
            <div 
                className={`nav-level-1-item ${activeState.module === 'materialUsage' ? 'active' : ''}`}
                onClick={() => handleModuleChange('materialUsage')}
            >
                Uso de materiales
            </div>
        </nav>
        {activeState.module === 'dataCollection' && (
            <nav className="nav-level-2">
                <div 
                    className={`nav-level-2-item ${activeState.gestor === 'tramos' ? 'active' : ''}`}
                    onClick={() => handleGestorChange('tramos')}
                >
                    Gestor de Tramos
                </div>
                <div 
                    className={`nav-level-2-item ${activeState.gestor === 'canteras' ? 'active' : ''}`}
                    onClick={() => handleGestorChange('canteras')}
                >
                    Gestor de Canteras
                </div>
                <div 
                    className={`nav-level-2-item ${activeState.gestor === 'fuentes' ? 'active' : ''}`}
                    onClick={() => handleGestorChange('fuentes')}
                >
                    Gestor de Fuentes de Agua
                </div>
            </nav>
        )}
        {activeState.module === 'materialUsage' && (
            <nav className="nav-level-2">
                {/* Placeholder for material usage gestores */}
                <div className="nav-level-2-item active">Dashboard de Uso</div>
            </nav>
        )}
    </div>
  );
}
