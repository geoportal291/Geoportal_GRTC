
import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PageTitleProvider, usePageTitle } from '@/data/contexts/PageTitleContext';
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
import DashPrincipal from './components/coordinador/DashPrincipal.jsx'; // NUEVO: Importar DashPrincipal
import AmigoSecretoDashboard from './components/eventos/AmigoSecretoDashboard'; // NUEVO
import GestionarParticipantes from './components/eventos/GestionarParticipantes'; // NUEVO
// Coordinado
import Proyectos from './components/coordinador/suelos/proyectosv2/ProyectosV2';
import SuelosIndex from './components/coordinador/suelos/SuelosIndex';
import Progresivas from './components/coordinador/suelos/gestion_tramos/Progresivas';
import EnsayosContainer from './components/coordinador/suelos/ensayos/EnsayosContainer';
import EnsayoReporteImprimible from './components/coordinador/suelos/ensayos/EnsayoReporteImprimible'; // NUEVO REPORT A4
//import GestorDeMaterialesContainer from './components/coordinador/suelos/GestorDeMaterialesContainer'; // NUEVO: Importar  
// Visitante


import Traficods from './components/coordinador/ingeneria/trafico/trafico.jsx';
import TraficoV2 from './components/coordinador/ingeneria/trafico_v2/TraficoV2.jsx';
import GeoTestPage from './components/coordinador/ingeneria/trafico/GeoTestPage.jsx'; // <-- Importar página de prueba
import TestMapWithRoute from './components/coordinador/testmapa'; // <-- Importar componente de mapa de prueba
import Geoite from './components/coordinador/pruebas/geoite'; // <-- Importar componente de mapa de prueba
import Vialds from './components/coordinador/ingeneria/invvial/vial.jsx'; // <-- NUEVO: Importar Vialds
import Geologia from './components/coordinador/ingeneria/geologia/Geologia.jsx'; // <-- NUEVO: Importar Geologia
import DisenosIngenieria from './components/coordinador/ingeneria/DisenosIngenieria.jsx';
import DisenoGeometricoModule from './components/coordinador/ingeneria/disenos_ingenieria/disenos_geometricos/DisenoGeometricoModule.jsx';

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
            {/* <div className="app-version">
                Versión: 0.1.0-alpha.3
            </div> */}
            {showProjectSelectionModal && <ProjectSelectionModal />}
        </div>
    );
}

export default App;
