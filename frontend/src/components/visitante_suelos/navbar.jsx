import './navbar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../data/contexts/AuthContext';
import alertify from 'alertifyjs';

export default function Navbar({ onToggle }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState({
    ingenieria: false,
    configuracion: false,
  });

  useEffect(() => {
    if (currentPath.includes('/ingenieria/')) {
      setOpenMenu((prev) => ({ ...prev, ingenieria: true }));
    }
  }, [currentPath]);

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onToggle) onToggle(newCollapsed);
  };

  useEffect(() => {
    if (onToggle) onToggle(collapsed);
  }, [collapsed, onToggle]);

  const toggleSubmenu = (menu) => {
    setOpenMenu((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleLogout = (e) => {
    e.preventDefault();
    alertify.confirm(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      () => {
        logout();
        alertify.success('Sesión cerrada exitosamente');
        navigate('/');
      },
      () => {}
    ).set('labels', { ok: 'Sí, cerrar sesión', cancel: 'Cancelar' });
  };

  const isActiveLink = (path) => currentPath === path;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logos">
          <img src="/imgs/LogoAmarillo.png" alt="Logo" />
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav>
        <ul>
          <li className={isActiveLink('/coordinador/cordinadords') ? 'active' : ''}>
            <Link to="/visitante_suelos/dashvisitante">
              <i className="fas fa-home"></i>
              <span>Inicio</span>
            </Link>
          </li>

          {/* INGENIERÍA BÁSICA */}
          <li className={`has-submenu ${openMenu.ingenieria ? 'open' : ''}`}>
            <div
              className="nav-link"
              onClick={() => toggleSubmenu('ingenieria')}
            >
              <i className="fas fa-project-diagram"></i>
              <span>Ingeniería Básica</span>
              {!collapsed && (
                <div className={`submenu-arrow ${openMenu.ingenieria ? 'open' : ''}`} />
              )}
            </div>
            <ul className={`submenu ${openMenu.ingenieria && !collapsed ? 'show' : ''}`}>

              <li className={isActiveLink('/visitante_suelos/ingenieria/mecanicadesuelos') ? 'active' : ''}>
                <Link to="/visitante_suelos/ingenieria/mecanicadesuelos">
                  <i className="fas fa-layer-group"></i><span>Mecánica de Suelos</span>
                </Link>
              </li>
            </ul>
          </li>

          <li className={isActiveLink('/calendario') ? 'active' : ''}>
            <Link to="/coordinador/calendario/calendar">
              <i className="fas fa-calendar-alt"></i>
              <span>Calendario</span>
            </Link>
          </li>

          <li>
            <a href="#!" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Cerrar sesión</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}