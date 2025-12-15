import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../contexts/PageTitleContext';
import { useAuth } from '../../data/contexts/AuthContext';
import './header.css';

export default function Header({ sidebarCollapsed, onTrafficOptionChange, onVialOptionChange, onToggleSidebar, userProjectEntityName }) {
  const { user, logout } = useAuth();
  const usuario = user || { nombre: 'Invitado', ap_paterno: '', usuario: 'Invitado' };
  const navigate = useNavigate();
  const [activeTrafficOption, setActiveTrafficOption] = useState('resumen');
  const [activeVialOption, setActiveVialOption] = useState(() => {
    const savedActiveVialOption = localStorage.getItem('activeVialOption');
    return savedActiveVialOption ? savedActiveVialOption : 'resumen general';
  });

  useEffect(() => {
    localStorage.setItem('activeVialOption', activeVialOption);
  }, [activeVialOption]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const { pageTitle } = usePageTitle();

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const goToProfile = () => {
    navigate('/perfil');
    setShowProfileMenu(false);
  };

  const cerrarSesion = () => {
    logout();
    navigate('/');
  };

  const handleTrafficOptionClick = (option) => {
    setActiveTrafficOption(option);
    if (onTrafficOptionChange) {
      onTrafficOptionChange(option);
    }
  };

  const handleVialOptionClick = (option) => {
    setActiveVialOption(option);
    if (onVialOptionChange) {
      onVialOptionChange(option);
    }
  };

  return (
    <header className={`main-header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-content">
        <div className="header-left-section">
          <button className="mobile-sidebar-toggle" onClick={() => onToggleSidebar(!sidebarCollapsed)}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="title-wrapper">
            <h1 className="page-title">{pageTitle}</h1>
            {userProjectEntityName && (
              <span className="project-entity-header">Proyecto: <strong>{userProjectEntityName}</strong></span>
            )}
            {pageTitle === "Área de Tráfico" && (
              <div className="traffic-options">
                <button
                  className={`traffic-option ${activeTrafficOption === 'resumen' ? 'active' : ''}`}
                  onClick={() => handleTrafficOptionClick('resumen')}
                >
                  Resumen General
                </button>
                <button
                  className={`traffic-option ${activeTrafficOption === 'opcion2' ? 'active' : ''}`}
                  onClick={() => handleTrafficOptionClick('opcion2')}
                >
                  Recoleccion y procesamiento de datos
                </button>
                <button
                  className={`traffic-option ${activeTrafficOption === 'opcion3' ? 'active' : ''}`}
                  onClick={() => handleTrafficOptionClick('opcion3')}
                >
                  Reporte Final
                </button>
              </div>
            )}
            {pageTitle === "Inventario Vial" && (
              <div className="traffic-options">
                {/* Options removed as per user request */}
              </div>
            )}
          </div>
        </div>

        <div className="header-right-section">
          <div className="welcome-container">
            <button
              className="welcome-button"
              onClick={toggleProfileMenu}
            >
              Bienvenido, {usuario.nombre} {usuario.ap_paterno}
            </button>
            {showProfileMenu && (
              <div className="profile-menu-modal">
                <button onClick={goToProfile}>Mi Perfil</button>
                <button onClick={cerrarSesion}>Cerrar Sesión</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}