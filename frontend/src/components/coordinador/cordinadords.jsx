import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardActual from './DashboardActual'; // Import the new component
import IndiceExpedienteSPP from './ingenieria/IndiceExpedienteSPP'; // Import the new component

export default function CoordinadorDashboard() {
  const [sidebarCollapsed] = useState(false);
  const [activeDashboard, setActiveDashboard] = useState('dash1'); // New state for active dashboard
  const navigate = useNavigate();



  return (
    <div>
      <div className={`coordinador-dashboard-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div style={{ marginTop: '80px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveDashboard('dash1')}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db', // Lighter gray border
              borderBottom: activeDashboard === 'dash1' ? 'none' : '1px solid #d1d5db',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              background: activeDashboard === 'dash1' ? 'linear-gradient(to bottom, #ffffff, #f0f4f8)' : '#e5e7eb', // Subtle gradient for active, light gray for inactive
              color: '#374151', // Darker text color
              fontWeight: activeDashboard === 'dash1' ? 'bold' : 'normal',
              transition: 'all 0.3s ease',
              boxShadow: activeDashboard === 'dash1' ? '0 -2px 8px rgba(0,0,0,0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.05)', // Enhanced shadow for active, inset for inactive
              zIndex: activeDashboard === 'dash1' ? 1 : 0,
              position: 'relative',
            }}
            onMouseEnter={(e) => { if (activeDashboard !== 'dash1') e.currentTarget.style.backgroundColor = '#d1d5db'; }} // Darker hover for inactive
            onMouseLeave={(e) => { if (activeDashboard !== 'dash1') e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
          >
            Dash 1 (Actual)
          </button>
          <button
            onClick={() => setActiveDashboard('dash2')}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderBottom: activeDashboard === 'dash2' ? 'none' : '1px solid #d1d5db',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              background: activeDashboard === 'dash2' ? 'linear-gradient(to bottom, #ffffff, #f0f4f8)' : '#e5e7eb',
              color: '#374151',
              fontWeight: activeDashboard === 'dash2' ? 'bold' : 'normal',
              transition: 'all 0.3s ease',
              boxShadow: activeDashboard === 'dash2' ? '0 -2px 8px rgba(0,0,0,0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.05)',
              zIndex: activeDashboard === 'dash2' ? 1 : 0,
              position: 'relative',
            }}
            onMouseEnter={(e) => { if (activeDashboard !== 'dash2') e.currentTarget.style.backgroundColor = '#d1d5db'; }}
            onMouseLeave={(e) => { if (activeDashboard !== 'dash2') e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
          >
            Dash 2 (Índice SPP)
          </button>
          <button
            onClick={() => setActiveDashboard('dash3')}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderBottom: activeDashboard === 'dash3' ? 'none' : '1px solid #d1d5db',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              background: activeDashboard === 'dash3' ? 'linear-gradient(to bottom, #ffffff, #f0f4f8)' : '#e5e7eb',
              color: '#374151',
              fontWeight: activeDashboard === 'dash3' ? 'bold' : 'normal',
              transition: 'all 0.3s ease',
              boxShadow: activeDashboard === 'dash3' ? '0 -2px 8px rgba(0,0,0,0.1)' : 'inset 0 1px 3px rgba(0,0,0,0.05)',
              zIndex: activeDashboard === 'dash3' ? 1 : 0,
              position: 'relative',
            }}
            onMouseEnter={(e) => { if (activeDashboard !== 'dash3') e.currentTarget.style.backgroundColor = '#d1d5db'; }}
            onMouseLeave={(e) => { if (activeDashboard !== 'dash3') e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
          >
            Geoportal Múltiple
          </button>
        </div>

        {activeDashboard === 'dash1' && <DashboardActual />}
        {activeDashboard === 'dash2' && <IndiceExpedienteSPP />}
        {activeDashboard === 'dash3' && <p>La funcionalidad de Geoportal Múltiple se ha movido a la sección de Tráfico.</p>}
      </div>
    </div>
  );
}