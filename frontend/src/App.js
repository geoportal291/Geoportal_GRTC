import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for portals
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { PageTitleProvider, usePageTitle } from './components/contexts/PageTitleContext';
import { useAuth } from './data/contexts/AuthContext';
import { logAuditEvent } from './api/audit';

// Importa tus componentes
import Login from './components/login';
import Menu from './components/menu';
import FrmUsuarios from './components/coordinador/config/frmusuarios';
import FrmUsuarios2 from './components/coordinador/config/frmusuarios2';
import Tareas from './components/coordinador/tareas/tareas';
import Layout from './components/coordinador/layout';
import Mdesuelos from './components/coordinador/ingeneria/mecanicadesuelos';
import RutaPrivada from './components/RutaPrivada';
import Perfil from './components/Perfil'; // Nuevo componente de perfil
import PermisosManagement from './components/coordinador/config/PermisosManagement';
import NavbarVisibilityManagement from './components/coordinador/config/NavbarVisibilityManagement'; // Nuevo
import UserProjectAssignment from './components/coordinador/config/UserProjectAssignment'; // Nuevo
import Auditoria from './components/coordinador/config/Auditoria'; // Nuevo
import Calendario from './components/coordinador/calendario/calendar.jsx';
import CoordinadorDashboard from './components/coordinador/cordinadords.jsx';
import AmigoSecretoDashboard from './components/eventos/AmigoSecretoDashboard'; // NUEVO
import GestionarParticipantes from './components/eventos/GestionarParticipantes'; // NUEVO
import VisualizacionAmigo from './components/eventos/visualizacionamigo.jsx'; // NUEVO
import NewYearCountdown from './components/eventos/NewYearCountdown.jsx'; // NUEVO: Importar Countdown
// Coordinado
import Proyectos from './components/coordinador/suelos/proyectosv2/ProyectosV2';
import GestorDeTramosActual from './components/coordinador/suelos/gestion_tramos/GestorDeTramosActual';
import RecoleccionDeDatosContainer from './components/coordinador/suelos/ui/RecoleccionDeDatosContainer';
import Progresivas from './components/coordinador/suelos/gestion_tramos/Progresivas';
import EnsayosSuelos from './components/coordinador/suelos/ensayos/ensayos';
import DetalleEnsayo from './components/coordinador/suelos/ensayos/DetalleEnsayo'; // NUEVO                                
import VistaGeneralEnsayos from './components/coordinador/suelos/ensayos/VistaGeneralEnsayos'; // NUEVO
import EnsayosContainer from './components/coordinador/suelos/ensayos/EnsayosContainer';
//import GestorDeMaterialesContainer from './components/coordinador/suelos/GestorDeMaterialesContainer'; // NUEVO: Importar  
// Visitante


// Especialista
import Ambiental from './components/especialista/ambiental';
import Estructuras from './components/especialista/estructuras';
import Topografico from './components/especialista/topografico';
import Traficods from './components/coordinador/ingeneria/trafico/trafico.jsx';
import GeoTestPage from './components/coordinador/ingeneria/trafico/GeoTestPage.jsx'; // <-- Importar página de prueba
import TestMapWithRoute from './components/coordinador/testmapa'; // <-- Importar componente de mapa de prueba
import Geoite from './components/coordinador/pruebas/geoite'; // <-- Importar componente de mapa de prueba
import Vialds from './components/coordinador/ingeneria/invvial/vial.jsx'; // <-- NUEVO: Importar Vialds

// Ensayos
import Ensayos from './ensayos/layout.jsx';

// Página No Encontrada
import NotFound from './components/coordinador/NotFound';



import ChangelogManagement from './components/coordinador/config/ChangelogManagement';
import Reportes from './components/coordinador/reportes/Reportes';
import ProjectSelectionModal from './components/ProjectSelectionModal'; // NEW: Import ProjectSelectionModal






import { AuthProvider } from './data/contexts/AuthContext';

import { HelmetProvider } from 'react-helmet-async';

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

    const [isInitialViz, setIsInitialViz] = useState(false);

    useEffect(() => {
        // Se cambió 'showAmigoSecretoViz' a 'showNewYearViz'
        if (sessionStorage.getItem('showNewYearViz') === 'true' && location.pathname !== '/') {
            setIsInitialViz(true);
            sessionStorage.removeItem('showNewYearViz');
        }
    }, [location.pathname]);

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
    }, [location.pathname]);

    const handleCloseInitialViz = () => {
        setIsInitialViz(false);
        navigate('/coordinador/cordinadords'); // Navegar a la vista principal del coordinador
    };

    return (
        <div className="principal">
            {isInitialViz && ReactDOM.createPortal(
                <NewYearCountdown onClose={handleCloseInitialViz} />,
                document.getElementById('overlay-root')
            )}
            <Routes>
                {/* Login */}
                <Route path="/" element={<Login />} />

                {/* Ruta general */}
                <Route path="/menu" element={<RutaPrivada><Menu /></RutaPrivada>} />

                {/* Coordinador */}
                <Route path="/coordinador/cordinadords" element={<RutaPrivada><Layout><CoordinadorDashboard /></Layout></RutaPrivada>} />
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
                <Route path="/coordinador/recoleccion-datos/*" element={<RutaPrivada><Layout><RecoleccionDeDatosContainer /></Layout></RutaPrivada>} />
                <Route path="/coordinador/suelos/ensayos/*" element={<RutaPrivada><Layout><EnsayosContainer /></Layout></RutaPrivada>} />


                {/* Nueva ruta para Progresivas */}
                <Route path="/coordinador/Progresivas" element={<RutaPrivada><Layout><Progresivas /></Layout></RutaPrivada>} />

                {/* NUEVO: Ruta para Uso de Materiales */}
                {/* <Route path="/coordinador/uso-materiales/*" element={<RutaPrivada><Layout><GestorDeMaterialesContainer /></Layout></RutaPrivada>} /> */}

                {/* Nuevo: Perfil del usuario */}
                <Route path="/perfil" element={<RutaPrivada><Layout><Perfil /></Layout></RutaPrivada>} />



                {/* Especialista 
                <Route path="/especialista/ambiental" element={<RutaPrivada><Layout><Ambiental /></Layout></RutaPrivada>} />
                <Route path="/especialista/estructuras" element={<RutaPrivada><Layout><Estructuras /></Layout></RutaPrivada>} />
                <Route path="/especialista/topografico" element={<RutaPrivada><Layout><Topografico /></Layout></RutaPrivada>} />
                <Route path="/especialista/suelos" element={<RutaPrivada><Layout><Suelos /></Layout></RutaPrivada>} />*/}
                {/* Coordinador: Trafico */}
                <Route path="/coordinador/ingenieria/trafico/trafico" element={<RutaPrivada><Layout><Traficods /></Layout></RutaPrivada>} />
                <Route path="/geotest" element={<RutaPrivada><Layout><GeoTestPage /></Layout></RutaPrivada>} />

                {/* NUEVO: Ruta para Inventario Vial */}
                <Route path="/ingenieria/inventario-vial" element={<RutaPrivada><Layout><Vialds /></Layout></RutaPrivada>} />

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
            <div className="app-version">
                Versión: 0.1.0-alpha.3
            </div>
            {showProjectSelectionModal && <ProjectSelectionModal />}
        </div>
    );
}

export default App;

