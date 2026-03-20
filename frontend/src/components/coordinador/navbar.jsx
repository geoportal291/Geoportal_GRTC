import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import alertify from 'alertifyjs';
import axios from 'axios';
import { useAuth } from '../../data/contexts/AuthContext'; // Import useAuth
import './navbar.css'; // Direct import of styles

const API_BASE_URL = process.env.REACT_APP_API_BASE || '';

export default function Navbar({ onToggle, isCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Use a more descriptive name for the logout function
  const currentPath = location.pathname;

  const [openMenu, setOpenMenu] = useState({
    ingenieria: false,
    configuracion: false,
    eventos: false,
  });
  const [navbarVisibility, setNavbarVisibility] = useState({});

  useEffect(() => {
    if (currentPath.includes('/ingenieria/')) {
      setOpenMenu((prev) => ({ ...prev, ingenieria: true }));
    }
  }, [currentPath]);

  useEffect(() => {
    const fetchNavbarVisibility = async () => {
      if (user && user.id && user.token) { // Check for user, id, and token
        try {
          const headers = {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          };
          const res = await axios.get(`${API_BASE_URL}/api/navbar-visibility/user/${user.id}`, headers);
          setNavbarVisibility(res.data);
        } catch (err) {
          console.error('Error al cargar la visibilidad de la navbar:', err);
        }
      }
    };

    fetchNavbarVisibility();
  }, [user]); // Re-fetch when user object changes

  const toggleSidebar = () => {
    if (onToggle) onToggle(!isCollapsed);
  };

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
        logout(); // Use logout from context
        alertify.success('Sesión cerrada exitosamente');
        navigate('/');
      },
      () => { }
    ).set('labels', { ok: 'Sí, cerrar sesión', cancel: 'Cancelar' });
  };

  const isActiveLink = (path) => currentPath.startsWith(path);

  const isNavItemVisible = (linkKey) => {
    return navbarVisibility[linkKey] === true;
  };

  const getActiveChildTitle = (menu) => {
    if (menu === 'ingenieria') {
      if (isActiveLink('/ingenieria/basica')) return 'Geoportal';
      if (isActiveLink('/ingenieria/topografia')) return 'Topografía';
      if (isActiveLink('/ingenieria/geologia')) return 'Geología';
      if (isActiveLink('/ingenieria/hidrologia')) return 'Hidrología';
      if (isActiveLink('/coordinador/ingenieria/trafico/trafico')) return 'Tráfico';
      if (isActiveLink('/ingenieria/seguridad-vial')) return 'Seguridad Vial';
      if (isActiveLink('/ingenieria/inventario-vial')) return 'Inventario Vial';
      if (isActiveLink('/coordinador/recoleccion-datos')) return 'Mecánica de Suelos';
    }
    if (menu === 'configuracion') {
      if (isActiveLink('/coordinador/Progresivas')) return 'Gestión de Tramos';
      if (isActiveLink('/coordinador/config/frmusuarios2')) return 'Usuarios';
      if (isActiveLink('/coordinador/config/PermisosManagement')) return 'Permisos';
      if (isActiveLink('/coordinador/config/UserProjectAssignment')) return 'Asignación de Proyectos';
      if (isActiveLink('/coordinador/config/NavbarVisibility')) return 'Visibilidad Navbar';
      if (isActiveLink('/coordinador/config/ChangelogManagement')) return 'Gestión de Novedades';
      if (isActiveLink('/coordinador/config/auditoria')) return 'Auditoría';
    }
    if (menu === 'eventos') {
      if (isActiveLink('/eventos/amigo-secreto')) return 'Amigo Secreto';
    }
    if (menu === 'progresivas') {
      if (isActiveLink('/coordinador/Progresivas')) return 'Gestionar Progresivas';
    }
    return null;
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logos">
          <img src="/imgs/LogoAmarillo.png" alt="Logo" />
        </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isCollapsed ? '»' : '«'}
        </button>
      </div>

      <nav>
        <ul>
          {isNavItemVisible('/coordinador/cordinadords') && (
            <li className={isActiveLink('/coordinador/dashboardprincipal') ? 'active' : ''}>
              <Link to="/coordinador/dashboardprincipal">
                <i className="fas fa-home"></i>
                <span>Inicio</span>
              </Link>
            </li>
          )}

          {/* INGENIERÍA BÁSICA */}
          {isNavItemVisible('ingenieria_basica') && (
            <li className={`has-submenu ${openMenu.ingenieria ? 'open' : ''} ${[
              '/ingenieria/basica',
              '/ingenieria/topografia',
              '/ingenieria/geologia',
              '/ingenieria/hidrologia',
              '/coordinador/ingenieria/trafico/trafico',
              '/ingenieria/seguridad-vial',
              '/ingenieria/inventario-vial',
              '/coordinador/recoleccion-datos'
            ].some(path => isActiveLink(path)) ? 'active' : ''
              }`}>
              <div
                className="nav-link"
                onClick={() => toggleSubmenu('ingenieria')}
              >
                <i className="fas fa-project-diagram"></i>
                <div className="nav-text">
                  <span>Ingeniería Básica</span>
                  {!isCollapsed && !openMenu.ingenieria && getActiveChildTitle('ingenieria') && (
                    <span className="active-subtitle">{getActiveChildTitle('ingenieria')}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className={`submenu-arrow ${openMenu.ingenieria ? 'open' : ''}`} />
                )}
              </div>
              <ul className={`submenu ${openMenu.ingenieria && !isCollapsed ? 'show' : ''}`}>
                {isNavItemVisible('/ingenieria/basica') && (
                  <li className={`${isActiveLink('/ingenieria/basica') ? 'active' : ''} wip-item`}>
                    <Link to="/ingenieria/basica">
                      <i className="fas fa-drafting-compass"></i><span>Geoportal</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/ingenieria/topografia') && (
                  <li className={`${isActiveLink('/ingenieria/topografia') ? 'active' : ''} wip-item`}>
                    <Link to="/ingenieria/topografia">
                      <i className="fas fa-map-marked-alt"></i><span>Topografía</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/ingenieria/geologia') && (
                  <li className={`${isActiveLink('/ingenieria/geologia') ? 'active' : ''}`}>
                    <Link to="/ingenieria/geologia">
                      <i className="fas fa-mountain"></i><span>Geología</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/ingenieria/hidrologia') && (
                  <li className={`${isActiveLink('/ingenieria/hidrologia') ? 'active' : ''} wip-item`}>
                    <Link to="/ingenieria/hidrologia">
                      <i className="fas fa-water"></i><span>Hidrología</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/coordinador/ingenieria/trafico/trafico') && (
                  <li className={isActiveLink('/coordinador/ingenieria/trafico/trafico') ? 'active' : ''}>
                    <Link to="/coordinador/ingenieria/trafico/trafico">
                      <i className="fas fa-car-alt"></i><span>Tráfico</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/ingenieria/seguridad-vial') && (
                  <li className={`${isActiveLink('/ingenieria/seguridad-vial') ? 'active' : ''} wip-item`}>
                    <Link to="/ingenieria/seguridad-vial">
                      <i className="fas fa-traffic-light"></i><span>Seguridad Vial</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/ingenieria/inventario-vial') && (
                  <li className={isActiveLink('/ingenieria/inventario-vial') ? 'active' : ''}>
                    <Link to="/ingenieria/inventario-vial">
                      <i className="fas fa-road"></i><span>Inventario Vial</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/coordinador/ingenieria/mecanicadesuelos') && (
                  <li className={isActiveLink('/coordinador/recoleccion-datos') ? 'active' : ''}>
                    <Link to="/coordinador/recoleccion-datos">
                      <i className="fas fa-layer-group"></i><span>Mecánica de Suelos</span>
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          )}

          {/* EVENTOS */}
          {isNavItemVisible('eventos') && (
            <li className={`has-submenu ${openMenu.eventos ? 'open' : ''} ${['/eventos/amigo-secreto'].some(path => isActiveLink(path)) ? 'active' : ''
              }`}>
              <div
                className="nav-link"
                onClick={() => toggleSubmenu('eventos')}
              >
                <i className="fas fa-calendar-check"></i>
                <div className="nav-text">
                  <span>Eventos</span>
                  {!isCollapsed && !openMenu.eventos && getActiveChildTitle('eventos') && (
                    <span className="active-subtitle">{getActiveChildTitle('eventos')}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className={`submenu-arrow ${openMenu.eventos ? 'open' : ''}`} />
                )}
              </div>
              <ul className={`submenu ${openMenu.eventos && !isCollapsed ? 'show' : ''}`}>
                {isNavItemVisible('/eventos/amigo-secreto') && (
                  <li className={isActiveLink('/eventos/amigo-secreto') ? 'active' : ''}>
                    <Link to="/eventos/amigo-secreto">
                      <i className="fas fa-gift"></i><span>Amigo Secreto</span>
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          )}

          {/* PROGRESIVAS */}
          {isNavItemVisible('progresivas') && (
            <li className={`has-submenu ${openMenu.progresivas ? 'open' : ''} ${['/coordinador/Progresivas'].some(path => isActiveLink(path)) ? 'active' : ''
              }`}>
              <div
                className="nav-link"
                onClick={() => toggleSubmenu('progresivas')}
              >
                <i className="fas fa-road"></i>
                <div className="nav-text">
                  <span>Progresivas</span>
                  {!isCollapsed && !openMenu.progresivas && getActiveChildTitle('progresivas') && (
                    <span className="active-subtitle">{getActiveChildTitle('progresivas')}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className={`submenu-arrow ${openMenu.progresivas ? 'open' : ''}`} />
                )}
              </div>
              <ul className={`submenu ${openMenu.progresivas && !isCollapsed ? 'show' : ''}`}>
                {isNavItemVisible('/coordinador/Progresivas') && (
                  <li className={isActiveLink('/coordinador/Progresivas') ? 'active' : ''}>
                    <Link to="/coordinador/Progresivas">
                      <i className="fas fa-plus"></i><span>Gestionar Progresivas</span>
                    </Link>
                  </li>
                )}
              </ul>
            </li>
          )}

          {isNavItemVisible('/reportes') && (
            <li className={isActiveLink('/reportes') ? 'active' : ''}>
              <Link to="/reportes">
                <i className="fas fa-chart-bar"></i>
                <span>Reportes</span>
              </Link>
            </li>
          )}

          {isNavItemVisible('/coordinador/calendario/calendar') && (
            <li className={isActiveLink('/calendario') ? 'active' : ''}>
              <Link to="/coordinador/calendario/calendar">
                <i className="fas fa-calendar-alt"></i>
                <span>Calendario</span>
              </Link>
            </li>
          )}

          {isNavItemVisible('/coordinador/tareas/tareas') && (
            <li className={isActiveLink('/coordinador/tareas/tareas') ? 'active' : ''}>
              <Link to="/coordinador/tareas/tareas">
                <i className="fas fa-tasks"></i>
                <span>Tareas</span>
              </Link>
            </li>
          )}

          {/* CONFIGURACIÓN */}
          {isNavItemVisible('configuracion') && (
            <li className={`has-submenu ${openMenu.configuracion ? 'open' : ''} ${[
              '/coordinador/Progresivas',
              '/coordinador/config/frmusuarios2',
              '/coordinador/config/PermisosManagement',
              '/coordinador/config/UserProjectAssignment',
              '/coordinador/config/NavbarVisibility',
              '/coordinador/config/ChangelogManagement',
              '/coordinador/config/auditoria'
            ].some(path => isActiveLink(path)) ? 'active' : ''
              }`}>
              <div
                className="nav-link"
                onClick={() => toggleSubmenu('configuracion')}
              >
                <i className="fas fa-cog"></i>
                <div className="nav-text">
                  <span>Configuración</span>
                  {!isCollapsed && !openMenu.configuracion && getActiveChildTitle('configuracion') && (
                    <span className="active-subtitle">{getActiveChildTitle('configuracion')}</span>
                  )}
                </div>
                {!isCollapsed && (
                  <div className={`submenu-arrow ${openMenu.configuracion ? 'open' : ''}`} />
                )}
              </div>
              <ul className={`submenu ${openMenu.configuracion && !isCollapsed ? 'show' : ''}`}>
                <li className={isActiveLink('/coordinador/Progresivas') ? 'active' : ''}>
                  <Link to="/coordinador/Progresivas">
                    <i className="fas fa-route"></i><span>Gestión de Tramos</span>
                  </Link>
                </li>
                {isNavItemVisible('/coordinador/config/frmusuarios2') && (
                  <li className={isActiveLink('/coordinador/config/frmusuarios2') ? 'active' : ''}>
                    <Link to="/coordinador/config/frmusuarios2">
                      <i className="fas fa-users"></i><span>Usuarios</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/coordinador/config/PermisosManagement') && (
                  <li className={isActiveLink('/coordinador/config/PermisosManagement') ? 'active' : ''}>
                    <Link to="/coordinador/config/PermisosManagement">
                      <i className="fas fa-key"></i><span>Permisos</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/coordinador/config/UserProjectAssignment') && (
                  <li className={isActiveLink('/coordinador/config/UserProjectAssignment') ? 'active' : ''}>
                    <Link to="/coordinador/config/UserProjectAssignment">
                      <i className="fas fa-project-diagram"></i><span>Asignación de Proyectos</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/coordinador/config/NavbarVisibility') && (
                  <li className={isActiveLink('/coordinador/config/NavbarVisibility') ? 'active' : ''}>
                    <Link to="/coordinador/config/NavbarVisibility">
                      <i className="fas fa-eye"></i><span>Visibilidad Navbar</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/coordinador/config/ChangelogManagement') && (
                  <li className={isActiveLink('/coordinador/config/ChangelogManagement') ? 'active' : ''}>
                    <Link to="/coordinador/config/ChangelogManagement">
                      <i className="fas fa-clipboard-list"></i><span>Gestión de Novedades</span>
                    </Link>
                  </li>
                )}
                {isNavItemVisible('/coordinador/config/auditoria') && (
                  <li className={isActiveLink('/coordinador/config/auditoria') ? 'active' : ''}>
                    <Link to="/coordinador/config/auditoria">
                      <i className="fas fa-shield-alt"></i><span>Auditoría</span>
                    </Link>
                  </li>
                )}

              </ul>
            </li>
          )}

          {isNavItemVisible('/perfil') && (
            <li className={isActiveLink('/perfil') ? 'active' : ''}>
              <Link to="/perfil">
                <i className="fas fa-user"></i>
                <span>Mi Perfil</span>
              </Link>
            </li>
          )}

          {isNavItemVisible('cerrar_sesion') && (
            <li>
              <a href="#!" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Cerrar sesión</span>
              </a>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
