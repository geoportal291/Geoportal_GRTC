import React, { useState, useEffect } from 'react'; // React imported
import axios from 'axios';
import AdminProjectsView from './AdminProjectsView';
import CoordinatorProjectsView from './CoordinatorProjectsView'; // Ensure this matches filename case
import { useAuth } from '@/data/contexts/AuthContext';
import { Button } from './components/SharedComponents'; // Import Button
import { API_BASE_URL } from '@/api/config';

const ProyectosV2 = () => {
    const { user } = useAuth();
    const API_URL = API_BASE_URL;

    const [viewMode, setViewMode] = useState(null); // 'admin', 'coordinator', 'simulation_selection'
    const [simulatedProject, setSimulatedProject] = useState(null);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);

    // Determine Role
    // Adjust role check logic based on your actual database roles
    // Common conventions: 'Administrador', 'Super Admin'
    const isAdmin = user?.rol_nombre?.toLowerCase().includes('administrador') || user?.rol_nombre?.toLowerCase().includes('admin');

    // Auto-select for non-admins
    useEffect(() => {
        if (!isAdmin) {
            setViewMode('coordinator');
        }
    }, [isAdmin]);

    // Fetch projects for simulation selector
    const fetchProjectsForSimulation = async () => {
        setLoadingProjects(true);
        try {
            // Fetch all projects (reusing detailed endpoint or similar)
            const headers = { Authorization: `Bearer ${user.token}` };
            const res = await axios.get(`${API_URL}/api/proyectos/assigned-detailed`, { headers });
            setAvailableProjects(res.data);
            setViewMode('simulation_selection');
        } catch (error) {
            console.error("Error fetching projects", error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleSimulationSelect = (project) => {
        setSimulatedProject(project);
        setViewMode('coordinator');
    };

    if (!viewMode && isAdmin) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 transform transition-all scale-100">
                    <div className="text-center mb-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Modo de Visualización</h2>
                        <p className="text-gray-500">
                            Como administrador, puedes elegir cómo interactuar con el módulo de proyectos.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => setViewMode('admin')}
                            className="w-full flex items-center justify-between p-4 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                        >
                            <div className="flex items-center">
                                <span className="bg-blue-600 p-2 rounded-lg mr-4 group-hover:bg-blue-700 transition-colors">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                </span>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900">Vista de Administrador</h3>
                                    <p className="text-sm text-gray-500">Gestionar, crear y asignar proyectos</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={fetchProjectsForSimulation}
                            className="w-full flex items-center justify-between p-4 bg-white border-2 border-green-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                        >
                            <div className="flex items-center">
                                <span className="bg-green-600 p-2 rounded-lg mr-4 group-hover:bg-green-700 transition-colors">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </span>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900">Vista de Coordinador</h3>
                                    <p className="text-sm text-gray-500">Simular vista para completar proyectos</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'simulation_selection' && isAdmin) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Seleccione un Proyecto para Simular</h3>
                    {loadingProjects ? (
                        <p>Cargando proyectos...</p>
                    ) : (
                        <div className="grid gap-3">
                            {availableProjects.map(p => (
                                <div key={p.id} className="border p-4 rounded hover:bg-gray-50 flex justify-between items-center cursor-pointer" onClick={() => handleSimulationSelect(p)}>
                                    <div>
                                        <h4 className="font-bold text-blue-800">{p.nombre_tramo}</h4>
                                        <p className="text-sm text-gray-600">{p.proyecto_nom || 'Sin Entidad'}</p>
                                    </div>
                                    <Button size="sm">Seleccionar</Button>
                                </div>
                            ))}
                            {availableProjects.length === 0 && <p className="text-gray-500">No hay proyectos disponibles.</p>}
                        </div>
                    )}
                    <div className="mt-6 flex justify-end">
                        <Button variant="outline" onClick={() => setViewMode(null)}>Cancelar</Button>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'admin') {
        return (
            <div>
                <div className="bg-blue-600 px-4 py-2 text-white text-sm flex justify-between items-center">
                    <span>Estás en: <strong>Vista de Administrador</strong></span>
                    <button
                        onClick={() => { setViewMode(null); setSimulatedProject(null); }}
                        className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs transition-colors"
                    >
                        Cambiar Vista
                    </button>
                </div>
                <AdminProjectsView />
            </div>
        );
    } else if (viewMode === 'coordinator') {
        return (
            <div>
                {isAdmin && (
                    <div className="bg-green-600 px-4 py-2 text-white text-sm flex justify-between items-center">
                        <span>Estás en: <strong>Vista de Coordinador (Simulando: {simulatedProject?.nombre_tramo || 'N/A'})</strong></span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchProjectsForSimulation()}
                                className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-xs transition-colors"
                            >
                                Cambiar Proyecto
                            </button>
                            <button
                                onClick={() => { setViewMode(null); setSimulatedProject(null); }}
                                className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-xs transition-colors"
                            >
                                Salir
                            </button>
                        </div>
                    </div>
                )}
                <CoordinatorProjectsView simulatedProject={simulatedProject} />
            </div>
        );
    }

    return null; // Should not reach here
};

export default ProyectosV2;
