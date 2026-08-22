import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './header';
import Navbar from './navbar';
import ChangelogModal from '../ChangelogModal';
import { TrafficOptionProvider } from '../../data/contexts/TrafficOptionContext';
import { VialOptionProvider } from '../../data/contexts/VialOptionContext';
import { useAuth } from '../../data/contexts/AuthContext';
import CargandoPantalla from '../CargandoPantalla';
import '../ChangelogModal.css';

// Diferidos: Layout los monta según la URL, pero Layout se usa en TODAS las páginas.
// Importarlos de forma directa metía tráfico e inventario vial en el paquete inicial.
const Traficods = lazy(() => import('./ingenieria/trafico/trafico.jsx'));
const TraficoV2 = lazy(() => import('./ingenieria/trafico_v2/TraficoV2.jsx'));
const Vialds = lazy(() => import('./ingenieria/invvial/vial.jsx'));

const EXPANDED_SIDEBAR_WIDTH = '275px';
const COLLAPSED_SIDEBAR_WIDTH = '60px';

export default function Layout({ children, setPageTitle }) {
  const { selectedProjectName } = useAuth();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
  const [trafficOption, setTrafficOption] = useState('resumen');
  const [vialOption, setVialOption] = useState(() => {
    const savedVialOption = localStorage.getItem('vialOption');
    return savedVialOption ? savedVialOption : 'resumen general';
  });

  useEffect(() => {
    localStorage.setItem('vialOption', vialOption);
  }, [vialOption]);

  const location = useLocation();
  const isAmigoSecretoRoute = location.pathname.startsWith('/eventos/amigo-secreto');
  const isTrafficV2Route = location.pathname === '/coordinador/ingenieria/trafico/traficov2';

  const handleTrafficOptionChange = (option) => {
    setTrafficOption(option);
  };

  const handleVialOptionChange = (option) => {
    setVialOption(option);
  };

  const getCalculatedMarginLeft = () => {
    if (window.innerWidth < 768) {
      return '0px'; // On mobile, sidebar overlays, content fills screen
    }
    return collapsed ? COLLAPSED_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH;
  };

  const calculatedMarginLeft = getCalculatedMarginLeft();

  const isFullWidthRoute = [
    '/coordinador/ingenieria/trafico/trafico',
    '/coordinador/ingenieria/trafico/traficov2',
    '/ingenieria/inventario-vial',
    '/coordinador/dashboardprincipal',
    '/ingenieria/geologia',
    '/ingenieria/disenos/geometrico'
  ].includes(location.pathname) || location.pathname.startsWith('/coordinador/recoleccion-datos');


  return (
    <div className="geoportal-layout-root" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {!isAmigoSecretoRoute && location.pathname !== '/coordinador/dashboardprincipal' && !isTrafficV2Route && (
        <Header
          sidebarCollapsed={collapsed}
          setPageTitle={setPageTitle}
          onTrafficOptionChange={handleTrafficOptionChange}
          onVialOptionChange={handleVialOptionChange}
          onToggleSidebar={setCollapsed}
          userProjectEntityName={selectedProjectName}
        />
      )}
      <div className="geoportal-layout-flex" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div
          style={{
            transition: 'width 0.3s ease',
            flexShrink: 0
          }}
          className="geoportal-sidebar-wrapper"
        >
          <Navbar onToggle={setCollapsed} isCollapsed={collapsed} />
        </div>
        <div
          className={`content-wrapper ${collapsed ? 'sidebar-collapsed' : 'sidebar-open'} ${location.pathname === '/ingenieria/inventario-vial' ? 'hide-scrollbar' : ''}`}
          style={{
            flex: 1,
            overflowY: 'auto',
            marginLeft: calculatedMarginLeft,
            transition: 'margin-left 0.3s ease',
            paddingLeft: isFullWidthRoute ? '0px' : '40px',
            paddingTop: isFullWidthRoute ? '0px' : (isAmigoSecretoRoute ? '20px' : '80px'),
            paddingRight: isFullWidthRoute ? '0px' : '40px',
            paddingBottom: isFullWidthRoute ? '0px' : '40px',
            backgroundColor: '#f5f7fa',
            width: '100%',
            maxWidth: 'none',
            minHeight: 'auto',
            position: 'relative',
            zIndex: 0
          }}
        >
          <Suspense fallback={<CargandoPantalla />}>
            {location.pathname === '/coordinador/ingenieria/trafico/trafico' ? (
              <TrafficOptionProvider value={trafficOption}>
                <Traficods isNavbarExpanded={!collapsed} />
              </TrafficOptionProvider>
            ) : location.pathname === '/coordinador/ingenieria/trafico/traficov2' ? (
              <TraficoV2 isNavbarExpanded={!collapsed} />
            ) : location.pathname === '/ingenieria/inventario-vial' ? (
              <VialOptionProvider value={{ vialHeaderOption: vialOption, setVialHeaderOption: setVialOption }}>
                <Vialds isNavbarExpanded={!collapsed} />
              </VialOptionProvider>
            ) : (
              React.cloneElement(children, { isSidebarCollapsed: collapsed })
            )}
          </Suspense>
        </div>
      </div>
      <ChangelogModal />
    </div>
  );
}
