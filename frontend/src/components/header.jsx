import React, { useState } from 'react';
import './header.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/contexts/AuthContext';

export default function Header({ sidebarCollapsed, pageTitle }) {
  const { user, logout } = useAuth();
  const usuario = user || { nombre: 'Invitado', ap_paterno: '' };
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();

  const configuracion = () => {
    navigate('/configuraciones');
  };

  const cerrarSesion = () => {
    logout();
    navigate('/');
  };

  return (
    <header className={`main-header ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
        <h2>{pageTitle}</h2>
      </div>
      <div className="header-right">
        <button
          className="bienvenido-btn"
          onClick={() => setMostrarModal(!mostrarModal)}
        >
          👋 Bienvenido, <b>{usuario.nombre} {usuario.ap_paterno}</b>
        </button>

        {mostrarModal && (
          <div className="modal-usuario animate-dropdown">
            <div className="contenido-modal">
              <div className="usuario-info">
                <img src="/imgs/user.png" alt="avatar" className="avatar" />
                <p><strong>Usuario:</strong> {usuario.usuario}</p>
              </div>
              <button className="logout-config" onClick={configuracion}>
                Configuración
              </button>
              <button className="logout-btn" onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}