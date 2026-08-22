import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import ProjectTable from './components/ProjectTable';
import FullProjectForm from './components/FullProjectForm';
import { useAuth } from '@/data/contexts/AuthContext';

import ProjectDetailView from './components/ProjectDetailView';

const CoordinatorProjectsView = ({ simulatedProject }) => { // Accept prop
    const API_URL = process.env.REACT_APP_API_BASE || '';
    const { user } = useAuth();
    const token = user?.token;

    const [projects, setProjects] = useState([]);
    const [detailProject, setDetailProject] = useState(null);
    const hasNavigatedBack = React.useRef(false); // Ref to track if user explicitly went back

    // If simulating, we directly show the detail view for that project
    const isSimulationMode = !!simulatedProject;

    const fetchProjects = useCallback(async () => {
        // If simulating, use that project only
        if (simulatedProject) {
            setProjects([simulatedProject]);
            setDetailProject(simulatedProject);
            return;
        }

        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_URL}/api/proyectos/assigned-detailed`, { headers });
            setProjects(res.data);

            // Auto-navigate if only one project and user hasn't gone back
            if (res.data.length === 1 && !hasNavigatedBack.current) {
                setDetailProject(res.data[0]);
            }

        } catch (error) {
            console.error("Error fetching projects", error);
            alertify.error("Error al cargar mis proyectos.");
        }
    }, [API_URL, token, simulatedProject]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Update detailProject when simulatedProject changes
    useEffect(() => {
        if (simulatedProject) {
            setDetailProject(simulatedProject);
        } else {
            // Only force reset if we are NOT in auto-nav mode or manual nav
            // Actually, if simulatedProject becomes null, we might want to clear detailProject 
            // BUT we don't want to interfere with normal navigation.
            // Since simulatedProject is prop-driven from parent, let's respect it if it becomes null.
            if (isSimulationMode) {
                setDetailProject(null);
            }
        }
    }, [simulatedProject, isSimulationMode]);

    const handleViewProject = (project) => {
        setDetailProject(project);
    };

    const handleBackToList = () => {
        hasNavigatedBack.current = true; // Mark as manually navigated back
        setDetailProject(null);
        fetchProjects();
    };

    if (detailProject) {
        return (
            <div className="p-6 bg-white rounded-lg shadow mt-8">
                {!isSimulationMode && (
                    <button
                        onClick={handleBackToList}
                        className="mb-4 text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Volver a Mis Proyectos
                    </button>
                )}
                <ProjectDetailView
                    project={detailProject}
                    onRefresh={fetchProjects}
                />
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow mt-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Mis Proyectos Asignados</h2>
                <p className="text-gray-600">Complete la información de los proyectos que le han sido asignados.</p>
            </div>

            <ProjectTable
                projects={projects}
                onEdit={handleViewProject} // Action "Completar" now opens the Detail View
                onDelete={() => { }}
                onAssign={() => { }}
                showAssignAction={false}
            />
        </div>
    );
};

export default CoordinatorProjectsView;
