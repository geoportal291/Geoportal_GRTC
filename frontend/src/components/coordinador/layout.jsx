import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './header';
import Navbar from './navbar';
import ChangelogModal from '../ChangelogModal';
import Traficods from './ingeneria/trafico/trafico.jsx';
import Vialds from './ingeneria/invvial/vial.jsx';
import { TrafficOptionProvider } from '../../data/contexts/TrafficOptionContext';
import { VialOptionProvider } from '../../data/contexts/VialOptionContext';
import { useAuth } from '../../data/contexts/AuthContext';
import '../ChangelogModal.css';

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
    return collapsed ? '60px' : '200px'; // On desktop, sidebar pushes content
  };

  const calculatedMarginLeft = getCalculatedMarginLeft();

  const isFullWidthRoute = [
    '/coordinador/ingenieria/trafico/trafico',
    '/ingenieria/inventario-vial',
    '/coordinador/dashboardprincipal',
    '/ingenieria/geologia'
  ].includes(location.pathname) || location.pathname.startsWith('/coordinador/recoleccion-datos');


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {!isAmigoSecretoRoute && location.pathname !== '/coordinador/dashboardprincipal' && (
        <Header
          sidebarCollapsed={collapsed}
          setPageTitle={setPageTitle}
          onTrafficOptionChange={handleTrafficOptionChange}
          onVialOptionChange={handleVialOptionChange}
          onToggleSidebar={setCollapsed}
          userProjectEntityName={selectedProjectName}
        />
      )}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div
          style={{
            transition: 'width 0.3s ease',
            flexShrink: 0
          }}
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
          {location.pathname === '/coordinador/ingenieria/trafico/trafico' ? (
            <TrafficOptionProvider value={trafficOption}>
              <Traficods isNavbarExpanded={!collapsed} />
            </TrafficOptionProvider>
          ) : location.pathname === '/ingenieria/inventario-vial' ? (
            <VialOptionProvider value={{ vialHeaderOption: vialOption, setVialHeaderOption: setVialOption }}>
              <Vialds isNavbarExpanded={!collapsed} />
            </VialOptionProvider>
          ) : (
            React.cloneElement(children, { isSidebarCollapsed: collapsed })
          )}
        </div>
      </div>
      <ChangelogModal />
    </div>
  );
}
