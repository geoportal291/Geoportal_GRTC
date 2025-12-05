import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import ProjectTable from './components/ProjectTable';
import FullProjectForm from './components/FullProjectForm';
import { useAuth } from '../../../../data/contexts/AuthContext';

import ProjectDetailView from './components/ProjectDetailView';

const CoordinatorProjectsView = ({ simulatedProject }) => { // Accept prop
    const API_URL = process.env.REACT_APP_API_BASE || '';
    const { user } = useAuth();
    const token = user?.token;

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // If simulating, we directly show the detail view for that project
    const isSimulationMode = !!simulatedProject;

    const fetchProjects = useCallback(async () => {
        // If simulating, use that project only
        if (simulatedProject) {
            setProjects([simulatedProject]);
            return;
        }

        try {
            const headers = { Authorization: `Bearer ${token}` };
            // Fetch projects assigned to the logged-in user
            const res = await axios.get(`${API_URL}/api/proyectos/assigned-detailed`, { headers });
            setProjects(res.data);
        } catch (error) {
            console.error("Error fetching projects", error);
            alertify.error("Error al cargar mis proyectos.");
        }
    }, [API_URL, token, simulatedProject]); // Add dependency

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleOpenForm = (project) => {
        setSelectedProject(project);
        setIsFormOpen(true);
    };

    const handleFormSave = () => {
        fetchProjects(); // Refresh list to show updated status
    };

    if (isSimulationMode) {
        return (
            <div className="p-6 bg-white rounded-lg shadow mt-8">
                <ProjectDetailView
                    project={simulatedProject}
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
                onEdit={handleOpenForm} // "Edit" becomes "Completar"
                onDelete={() => { }} // Delete disabled/hidden for Coordinator usually
                onAssign={() => { }} // Assign disabled for Coordinator
                showAssignAction={false}
            />

            <FullProjectForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleFormSave}
                projectData={selectedProject}
            />
        </div>
    );
};

export default CoordinatorProjectsView;
