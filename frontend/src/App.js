
import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PageTitleProvider, usePageTitle } from '@/data/contexts/PageTitleContext';
import { useAuth, AuthProvider } from './data/contexts/AuthContext';
import { logAuditEvent } from './api/audit';
import { HelmetProvider } from 'react-helmet-async';

// --- Carga inmediata ---
// Solo lo que se necesita en el primer render: la pantalla de acceso, el guardián
// de rutas, la cáscara común y la pantalla de error. El resto va más abajo, diferido.
import Login from './components/login';
import RutaPrivada from './components/RutaPrivada';
import Layout from './components/coordinador/layout';
import NotFound from './components/coordinador/NotFound';
import ProjectSelectionModal from './components/ProjectSelectionModal';
import CargandoPantalla from './components/CargandoPantalla';

// --- Carga diferida (un archivo por pantalla, se descarga al entrar) ---
const Menu = lazy(() => import('./components/menu'));
const Perfil = lazy(() => import('./components/Perfil'));
const Calendario = lazy(() => import('./components/coordinador/calendario/calendar.jsx'));
const CoordinadorDashboard = lazy(() => import('./components/coordinador/cordinadords.jsx'));
const DashPrincipal = lazy(() => import('./components/coordinador/DashPrincipal.jsx'));
const Tareas = lazy(() => import('./components/coordinador/tareas/tareas'));
const Reportes = lazy(() => import('./components/coordinador/reportes/Reportes'));

// Configuración
const FrmUsuarios = lazy(() => import('./components/coordinador/config/frmusuarios'));
const FrmUsuarios2 = lazy(() => import('./components/coordinador/config/frmusuarios2'));
const PermisosManagement = lazy(() => import('./components/coordinador/config/PermisosManagement'));
const NavbarVisibilityManagement = lazy(() => import('./components/coordinador/config/NavbarVisibilityManagement'));
const UserProjectAssignment = lazy(() => import('./components/coordinador/config/UserProjectAssignment'));
const Auditoria = lazy(() => import('./components/coordinador/config/Auditoria'));
const ChangelogManagement = lazy(() => import('./components/coordinador/config/ChangelogManagement'));

// Eventos
const AmigoSecretoDashboard = lazy(() => import('./components/eventos/AmigoSecretoDashboard'));
const GestionarParticipantes = lazy(() => import('./components/eventos/GestionarParticipantes'));

// Suelos
const Proyectos = lazy(() => import('./components/coordinador/suelos/proyectosv2/ProyectosV2'));
const SuelosIndex = lazy(() => import('./components/coordinador/suelos/SuelosIndex'));
const Progresivas = lazy(() => import('./components/coordinador/suelos/gestion_tramos/Progresivas'));
const EnsayosContainer = lazy(() => import('./components/coordinador/suelos/ensayos/EnsayosContainer'));
const EnsayoReporteImprimible = lazy(() => import('./components/coordinador/suelos/ensayos/EnsayoReporteImprimible'));

// Ingeniería
const Mdesuelos = lazy(() => import('./components/coordinador/ingenieria/mecanicadesuelos'));
const Geologia = lazy(() => import('./components/coordinador/ingenieria/geologia/Geologia.jsx'));
const DisenosIngenieria = lazy(() => import('./components/coordinador/ingenieria/DisenosIngenieria.jsx'));
const DisenoGeometricoModule = lazy(() => import('./components/coordinador/ingenieria/disenos_ingenieria/disenos_geometricos/DisenoGeometricoModule.jsx'));

// Tráfico e inventario vial: estas 3 las monta Layout por su cuenta según la URL
// (ver layout.jsx), pero se declaran aquí para que las rutas existan.
const Traficods = lazy(() => import('./components/coordinador/ingenieria/trafico/trafico.jsx'));
const TraficoV2 = lazy(() => import('./components/coordinador/ingenieria/trafico_v2/TraficoV2.jsx'));
const Vialds = lazy(() => import('./components/coordinador/ingenieria/invvial/vial.jsx'));

// Pantallas de prueba (sin enlace en el menú, ver docs/rutas-y-modulos.md)
const GeoTestPage = lazy(() => import('./components/coordinador/ingenieria/trafico/GeoTestPage.jsx'));
const TestMapWithRoute = lazy(() => import('./components/coordinador/testmapa'));
const Geoite = lazy(() => import('./components/coordinador/pruebas/geoite'));
const Ensayos = lazy(() => import('./ensayos/layout.jsx'));

function App() {
    return (
        <HelmetProvider>
            <PageTitleProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </PageTitleProvider>
        </HelmetProvider>
    );
}

function AppContent() {
    const { setPageTitle } = usePageTitle();
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, showProjectSelectionModal } = useAuth(); // NEW: Get showProjectSelectionModal from useAuth

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                // Solo cerrar sesión si el error es 403 y el mensaje es específicamente de token expirado
                if (error.response && error.response.status === 403 && error.response.data.error === 'Token expirado. Por favor, inicia sesión de nuevo.') {
                    logout();
                    navigate('/');
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [logout, navigate]);

    useEffect(() => {
        // Actualizar el título según la ruta
        if (location.pathname === '/coordinador/ingenieria/trafico/trafico') {
            setPageTitle('Área de Tráfico');
        } else if (location.pathname === '/coordinador/ingenieria/trafico/traficov2') {
            setPageTitle('Área de Tráfico V2');
        } else if (location.pathname === '/perfil') {
            setPageTitle('Mi Perfil');
        } else if (location.pathname === '/coordinador/Progresivas') {
            setPageTitle('Registro de Progresivas'); // Título para la nueva página
        } else if (location.pathname === '/ingenieria/inventario-vial') {
            setPageTitle('Inventario Vial');
        } else {
            setPageTitle('');
        }
    }, [location, setPageTitle]);

    useEffect(() => {
        // No registrar la visita a la página de login inicial
        if (location.pathname === '/') {
            return;
        }
        logAuditEvent('PAGE_VIEW', { path: location.pathname });

        // Limpiar la selección de vista de Mecánica de Suelos si navegamos fuera de ese módulo
        if (!location.pathname.startsWith('/coordinador/recoleccion-datos')) {
            sessionStorage.removeItem('suelosViewMode');
        }
    }, [location.pathname]);

    return (
        <div className="principal">
          <Suspense fallback={<CargandoPantalla />}>
            <Routes>
                {/* Login */}
                <Route path="/" element={<Login />} />

                {/* Ruta general */}
                <Route path="/menu" element={<RutaPrivada><Menu /></RutaPrivada>} />

                {/* Coordinador */}
                <Route path="/coordinador/cordinadords" element={<RutaPrivada><Layout><CoordinadorDashboard /></Layout></RutaPrivada>} />
                <Route path="/coordinador/dashboardprincipal" element={<RutaPrivada><Layout><DashPrincipal /></Layout></RutaPrivada>} />
                <Route path="/coordinador/ingenieria/mecanicadesuelos" element={<RutaPrivada><Layout><Mdesuelos /></Layout></RutaPrivada>} />
                <Route path="/coordinador/calendario/calendar" element={<RutaPrivada><Layout><Calendario /></Layout></RutaPrivada>} />
                <Route path="/coordinador/config/frmusuarios" element={<RutaPrivada><Layout><FrmUsuarios /></Layout></RutaPrivada>} />
                <Route path="/coordinador/config/frmusuarios2" element={<RutaPrivada><Layout><FrmUsuarios2 /></Layout></RutaPrivada>} />
                <Route path="/coordinador/config/PermisosManagement" element={<RutaPrivada><Layout><PermisosManagement /></Layout></RutaPrivada>} />
                <Route path="/coordinador/config/NavbarVisibility" element={<RutaPrivada><Layout><NavbarVisibilityManagement /></Layout></RutaPrivada>} />
                <Route path="/coordinador/config/ChangelogManagement" element={<RutaPrivada><Layout><ChangelogManagement /></Layout></RutaPrivada>} />
                <Route path="/coordinador/config/UserProjectAssignment" element={<RutaPrivada><Layout><UserProjectAssignment /></Layout></RutaPrivada>} />
                <Route path="/coordinador/config/auditoria" element={<RutaPrivada><Layout><Auditoria /></Layout></RutaPrivada>} />
                <Route path="/coordinador/tareas/tareas" element={<RutaPrivada><Layout><Tareas /></Layout></RutaPrivada>} />
                <Route path="/eventos/amigo-secreto" element={<RutaPrivada><Layout><AmigoSecretoDashboard /></Layout></RutaPrivada>} />
                <Route path="/eventos/amigo-secreto/gestionar" element={<RutaPrivada><Layout><GestionarParticipantes /></Layout></RutaPrivada>} />
                <Route path="/gestionar-participantes" element={<RutaPrivada><Layout><GestionarParticipantes /></Layout></RutaPrivada>} />
                <Route path="/coordinador/proyectos" element={<RutaPrivada><Layout><Proyectos /></Layout></RutaPrivada>} />
                <Route path="/coordinador/recoleccion-datos/*" element={<RutaPrivada><Layout><SuelosIndex /></Layout></RutaPrivada>} />
                <Route path="/coordinador/suelos/ensayos/:ensayoId/reporte" element={<RutaPrivada><EnsayoReporteImprimible /></RutaPrivada>} />
                <Route path="/coordinador/suelos/ensayos/*" element={<RutaPrivada><Layout><EnsayosContainer /></Layout></RutaPrivada>} />


                {/* Nueva ruta para Progresivas */}
                <Route path="/coordinador/Progresivas" element={<RutaPrivada><Layout><Progresivas /></Layout></RutaPrivada>} />

                {/* NUEVO: Ruta para Uso de Materiales */}
                {/* <Route path="/coordinador/uso-materiales/*" element={<RutaPrivada><Layout><GestorDeMaterialesContainer /></Layout></RutaPrivada>} /> */}

                {/* Nuevo: Perfil del usuario */}
                <Route path="/perfil" element={<RutaPrivada><Layout><Perfil /></Layout></RutaPrivada>} />



                {/* Coordinador: Trafico */}
                <Route path="/coordinador/ingenieria/trafico/trafico" element={<RutaPrivada><Layout><Traficods /></Layout></RutaPrivada>} />
                <Route path="/coordinador/ingenieria/trafico/traficov2" element={<RutaPrivada><Layout><TraficoV2 /></Layout></RutaPrivada>} />
                <Route path="/geotest" element={<RutaPrivada><Layout><GeoTestPage /></Layout></RutaPrivada>} />

                {/* NUEVO: Ruta para Inventario Vial */}
                <Route path="/ingenieria/inventario-vial" element={<RutaPrivada><Layout><Vialds /></Layout></RutaPrivada>} />

                {/* NUEVO: Ruta para Geología */}
                <Route path="/ingenieria/geologia" element={<RutaPrivada><Layout><Geologia /></Layout></RutaPrivada>} />
                <Route path="/ingenieria/disenos-ingenieria" element={<RutaPrivada><Layout><DisenosIngenieria /></Layout></RutaPrivada>} />
                <Route path="/ingenieria/disenos/geometrico" element={<RutaPrivada><Layout><DisenoGeometricoModule /></Layout></RutaPrivada>} />

                {/* Ruta de prueba para el mapa */}
                <Route path="/test-map" element={<RutaPrivada><Layout><TestMapWithRoute /></Layout></RutaPrivada>} />

                {/* Ruta de prueba para el mapa interactivo */}
                <Route path="/geoite" element={<RutaPrivada><Layout><Geoite /></Layout></RutaPrivada>} />

                {/* Ensayos */}
                <Route path="/ensayos" element={<RutaPrivada><Layout><Ensayos /></Layout></RutaPrivada>} />


                {/* Reportes */}
                <Route path="/reportes" element={<RutaPrivada><Layout><Reportes /></Layout></RutaPrivada>} />

                {/* Página No Encontrada */}
                <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
            {/* <div className="app-version">
                Versión: 0.1.0-alpha.3
            </div> */}
            {showProjectSelectionModal && <ProjectSelectionModal />}
        </div>
    );
}

export default App;
