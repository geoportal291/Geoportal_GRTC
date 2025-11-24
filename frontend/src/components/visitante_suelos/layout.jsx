import React, { useState } from 'react';
import Header from './header';
import Navbar from './navbar';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header fijo */}
      <div style={{ height: '60px', flexShrink: 0 }}>
        <Header sidebarCollapsed={collapsed} />
      </div>

      {/* Cuerpo con navbar lateral y contenido */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div
          style={{
            width: collapsed ? '80px' : '220px',
            transition: 'width 0.3s ease',
            flexShrink: 0
          }}
        >
          <Navbar onToggle={setCollapsed} />
        </div>

        {/* Contenido con scroll oculto visualmente */}
        <div
          className="content-wrapper"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            backgroundColor: '#f5f7fa',
            scrollbarWidth: 'none',       // Firefox
            msOverflowStyle: 'none'       // IE/Edge
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
