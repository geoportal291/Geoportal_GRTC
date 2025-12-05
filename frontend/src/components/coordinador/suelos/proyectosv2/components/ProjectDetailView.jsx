import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from './SharedComponents';
import AssignModal from './AssignModal';
import FullProjectForm from './FullProjectForm';
import { useAuth } from '../../../../../data/contexts/AuthContext';

const ProjectDetailView = ({ project, onRefresh }) => {
    const API_URL = process.env.REACT_APP_API_BASE || '';
    const { user } = useAuth();
    const token = user?.token;

    const [assignments, setAssignments] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [allUsers, setAllUsers] = useState([]);

    const isAdmin = user?.rol_nombre === 'ADMIN';

    const fetchAssignments = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_URL}/proyectos/${project.id}/assignments`, { headers });
            setAssignments(res.data);
        } catch (error) {
            console.error("Error fetching assignments", error);
        }
    };

    const fetchUsers = async () => {
        if (!isAdmin) return; // Only admin needs to fetch all users for assignment
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_URL}/usuarios`, { headers });
            const formattedUsers = res.data.map(u => ({
                id: u.id,
                nombre: `${u.nombre} ${u.ap_paterno} ${u.ap_materno}`.trim(),
                rol_nombre: u.rol_nombre,
                cargo: u.rol_nombre,
                CO: u.especialidad_nombre,
            }));
            setAllUsers(formattedUsers);
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    useEffect(() => {
        if (project) {
            fetchAssignments();
            fetchUsers();
        }
    }, [project]);

    // Format location
    const getLocationString = () => {
        if (!project) return 'N/A';
        return `${project.departamento || '-'} / ${project.provincia || '-'} / ${project.distrito || '-'}`;
    };

    return (
        <div className="space-y-6">
            {/* Header / Banner */}
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        {project.nombre_tramo}
                        <Badge variant={project.estado === 'Activo' ? 'success' : 'secondary'}>{project.estado}</Badge>
                    </h1>
                    <p className="text-gray-500 mt-1">{project.proyecto_nom || 'Sin Entidad Asignada'}</p>
                    <p className="text-sm text-gray-400 mt-2">ID Proyecto: {project.id}</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsFormOpen(true)}>
                        ✏️ Completar Información
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info Card */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>📍 Ubicación y Datos Técnicos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Ubicación</label>
                                    <p className="text-gray-700 font-medium">{getLocationString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Localidad</label>
                                    <p className="text-gray-700 font-medium">{project.localidad || 'No registrada'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Longitud Total</label>
                                    <p className="text-gray-700 font-medium">{project.longitud_total ? `${project.longitud_total} km` : '---'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Intervalo de Progresivas</label>
                                    <p className="text-gray-700 font-medium">{project.tipo_via ? `Cada ${project.tipo_via}m` : '---'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Descripción</label>
                                    <p className="text-gray-700">{project.descripcion_larga || 'Sin descripción'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Archivo KMZ/KML</label>
                                    <p className="text-blue-600">{project.kml_filename ? `📂 ${project.kml_filename}` : 'No cargado'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progressiva Summary (Future implementation) */}
                    {/* Could show first and last progresivas here */}
                </div>

                {/* Team / Actions Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center">
                            <CardTitle>👥 Equipo de Trabajo</CardTitle>
                            {isAdmin && (
                                <Button size="sm" variant="outline" onClick={() => setIsAssignModalOpen(true)}>Gestionar</Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {assignments.length === 0 ? (
                                <p className="text-gray-400 italic text-sm text-center py-4">Sin personal asignado</p>
                            ) : (
                                <ul className="space-y-3">
                                    {assignments.map((assign, idx) => (
                                        <li key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {(assign.nombre || assign.usuario || 'U').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {assign.nombre ? `${assign.nombre} ${assign.ap_paterno}` : (assign.usuario || 'Usuario')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{assign.rol_proyecto || 'Colaborador'}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>⚙️ Acciones Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full justify-start" variant="secondary" onClick={() => alertify.message("Reporte PDF no implementado.")}>
                                📄 Generar Reporte PDF
                            </Button>
                            <Button className="w-full justify-start" variant="secondary" onClick={() => alertify.message("Exportar Excel no implementado.")}>
                                📊 Exportar Datos
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <FullProjectForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={() => { onRefresh(); setIsFormOpen(false); }}
                projectData={project}
            />

            <AssignModal
                isOpen={isAssignModalOpen}
                onClose={() => { setIsAssignModalOpen(false); fetchAssignments(); }}
                project={project}
                allUsers={allUsers}
            />
        </div>
    );
};

export default ProjectDetailView;
