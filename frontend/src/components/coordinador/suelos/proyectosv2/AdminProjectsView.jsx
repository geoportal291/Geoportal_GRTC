import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import ProjectTable from './components/ProjectTable';
import SimpleCreateModal from './components/SimpleCreateModal';
import AssignModal from './components/AssignModal';
import FullProjectForm from './components/FullProjectForm';
import { Button } from './components/SharedComponents';
import { useAuth } from '../../../../data/contexts/AuthContext';

const AdminProjectsView = () => {
    const API_URL = process.env.REACT_APP_API_BASE || '';
    const { user } = useAuth();
    const token = user?.token;

    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [otherEntidades, setOtherEntidades] = useState([]); // In case needed

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectToEdit, setProjectToEdit] = useState(null);

    const fetchProjects = useCallback(async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            // Admin should ideally see all projects. Assuming assigned-detailed gives all for Admin or there's an all endpoint
            // If not, we might need a specific endpoint. For now reusing existing one.
            const res = await axios.get(`${API_URL}/api/proyectos/assigned-detailed`, { headers });
            setProjects(res.data);
        } catch (error) {
            console.error("Error fetching projects", error);
            alertify.error("Error al cargar proyectos.");
        }
    }, [API_URL, token]);

    const fetchCatalogs = useCallback(async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };

            // Users
            const userRes = await axios.get(`${API_URL}/api/usuarios`, { headers });
            // Formatting similar to proyectos.jsx
            const formattedUsers = userRes.data.map(u => ({
                id: u.id,
                nombre: `${u.nombre} ${u.ap_paterno} ${u.ap_materno}`.trim(),
                rol_nombre: u.rol_nombre,
                cargo: u.rol_nombre,
                CO: u.especialidad_nombre, // Assuming this field exists based on previous file
            }));
            setUsers(formattedUsers);

            // Entidades
            const entRes = await axios.get(`${API_URL}/api/entidades-solicitantes`, { headers });
            setEntidades(entRes.data);

            const otherEntRes = await axios.get(`${API_URL}/api/otras-entidades`, { headers });
            setOtherEntidades(otherEntRes.data);

        } catch (error) {
            console.error("Error fetching catalogs", error);
        }
    }, [API_URL, token]);

    useEffect(() => {
        fetchProjects();
        fetchCatalogs();
    }, [fetchProjects, fetchCatalogs]);

    const handleCreateProject = async (formData) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            // Admin creates shell. The backend endpoint usually expects some structure.
            // Using /proyectos/create-full but with minimal data?
            // Or maybe there is a simpler create endpoint? 
            // proyectos.jsx used /proyectos/create-full.
            // We'll mimic the structure but with nulls for tech data.

            const projectData = {
                nombre_tramo: formData.nombre_tramo,
                proyecto_nom: formData.proyecto_nom,
                // Defaults for shell
                estado: 'Activo',
                longitud_total: null,
                tipo_via: null,
                progresiva_inicial: '0+000',
                descripcion_larga: '',
                // Auto-fill new fields
                nombre_proyecto: formData.nombre_tramo, // Default to tramo name
                codigo: `PROJ-${Date.now().toString().slice(-4)}`, // Temp code
                descripcion_proyecto: '',
            };

            const parentProgresiva = {
                nombre: 'Progresiva Principal', // Placeholder
                estado: 'activo'
                // minimal fields
            };

            // Create Shell
            const res = await axios.post(`${API_URL}/api/proyectos/create-full`, {
                projectData,
                progresivaData: { parentProgresiva, generatedChildren: [] }
            }, { headers });

            const newProjectId = res.data.projectId || res.data.id; // Check backend response structure if possible, usually projectId or id

            // If coordinator selected, assign them
            if (formData.coordinator_id && newProjectId) {
                await axios.post(`${API_URL}/api/proyectos/${newProjectId}/assignUser`, {
                    userId: formData.coordinator_id,
                    rolProyecto: 'admin' // Make them admin of the project? or 'edit'? 'admin' gives full control.
                }, { headers });
            }

            alertify.success("Proyecto creado correctamente.");
            setIsCreateModalOpen(false);
            fetchProjects();

        } catch (error) {
            console.error("Error creating project", error);
            alertify.error("Error al crear proyecto.");
        }
    };

    const handleDelete = async (id) => {
        alertify.confirm('Confirmar Eliminación', '¿Está seguro?', async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                await axios.delete(`${API_URL}/api/proyectos/${id}`, { headers });
                alertify.success("Proyecto eliminado.");
                fetchProjects();
            } catch (error) {
                console.error("Error deleting", error);
                alertify.error("Error al eliminar.");
            }
        }, () => { });
    };

    const openAssign = (projectId) => {
        const proj = projects.find(p => p.id === projectId);
        setSelectedProject(proj);
        setIsAssignModalOpen(true);
    };

    const handleEdit = (project) => {
        setProjectToEdit(project);
        setIsEditModalOpen(true);
    };

    const handleEditSave = () => {
        setIsEditModalOpen(false);
        fetchProjects();
    };

    // Filter users for coordinator dropdown (e.g. users with 'coordinador' role)
    // Assuming rol_nombre has 'Coordinador' or dealing with 'admin' logic. 
    // I'll pass all users for now or filter if I knew the rigorous role name.

    return (
        <div className="p-6 bg-white rounded-lg shadow mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Proyectos (Admin)</h2>
                <Button onClick={() => setIsCreateModalOpen(true)}>+ Nuevo Proyecto</Button>
            </div>

            <ProjectTable
                projects={projects}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAssign={openAssign}
                showAssignAction={true}
            />

            <SimpleCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateProject}
                users={users}
                entidades={entidades}
            />

            <AssignModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                project={selectedProject}
                allUsers={users}
            />

            <FullProjectForm
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleEditSave}
                projectData={projectToEdit}
            />
        </div>
    );
};

export default AdminProjectsView;
