import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from './SharedComponents';
import AssignModal from './AssignModal';
import FullProjectForm from './FullProjectForm';
import { useAuth } from '@/data/contexts/AuthContext';

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
            const res = await axios.get(`${API_URL}/api/proyectos/${project.id}/assignments`, { headers });
            setAssignments(res.data);
        } catch (error) {
            console.error("Error fetching assignments", error);
        }
    };

    const fetchUsers = async () => {
        if (!isAdmin) return;
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_URL}/api/usuarios`, { headers });
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

    // Helper for Initials
    const getInitials = (assign) => {
        const u = assign.nombre || assign.usuario || 'U';
        return u.substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. HERO HEADER */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900 to-indigo-800 text-white shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <i className="fa-solid fa-map-location-dot text-9xl"></i>
                </div>
                <div className="relative p-8 z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant={project.estado === 'Activo' ? 'success' : 'secondary'} className="text-sm px-3 py-1 shadow-sm border-none">
                                    {project.estado}
                                </Badge>
                                <span className="text-blue-200 text-sm font-mono tracking-wider">ID: {project.id}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                                {project.nombre_tramo}
                            </h1>
                            <p className="text-blue-100 text-lg flex items-center gap-2">
                                <i className="fa-regular fa-building"></i>
                                {project.proyecto_nom || 'Entidad no asignada'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => setIsFormOpen(true)} className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md shadow-lg transition-all hover:scale-105">
                                <i className="fa-solid fa-pen-to-square mr-2"></i> Editar Datos
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats Row in Header */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 border-t border-white/10 pt-6">
                        <div>
                            <p className="text-blue-300 text-xs uppercase font-bold tracking-wider mb-1">Ubicación</p>
                            <p className="font-semibold text-lg">{getLocationString()}</p>
                        </div>
                        <div>
                            <p className="text-blue-300 text-xs uppercase font-bold tracking-wider mb-1">Longitud</p>
                            <p className="font-semibold text-lg">{project.longitud_total ? `${project.longitud_total} km` : '---'}</p>
                        </div>
                        <div>
                            <p className="text-blue-300 text-xs uppercase font-bold tracking-wider mb-1">Intervalo</p>
                            <p className="font-semibold text-lg">{project.tipo_via ? `${project.tipo_via} m` : '---'}</p>
                        </div>
                        <div>
                            <p className="text-blue-300 text-xs uppercase font-bold tracking-wider mb-1">Trazo KML</p>
                            <div className="flex items-center gap-2">
                                {project.kml_filename ? (
                                    <>
                                        <i className="fa-solid fa-file-code text-green-400"></i>
                                        <span className="truncate max-w-[150px] text-sm" title={project.kml_filename}>{project.kml_filename}</span>
                                    </>
                                ) : (
                                    <span className="text-white/50 text-sm italic">No cargado</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: MAIN CONTENT */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Detalles Card */}
                    <Card className="border-none shadow-md overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-gray-800">
                                <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <i className="fa-solid fa-circle-info"></i>
                                </div>
                                Detalles del Proyecto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Solicitante / Contratista</label>
                                    <p className="text-gray-900 font-medium text-lg">{project.solicitante || '---'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Localidad Específica</label>
                                    <p className="text-gray-900 font-medium text-lg">{project.localidad || '---'}</p>
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Descripción General</label>
                                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        {project.descripcion_larga || 'Sin descripción detallada disponible para este tramo.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: TEAM & META */}
                <div className="space-y-8">
                    <Card className="border-none shadow-md h-full flex flex-col">
                        <CardHeader className="flex flex-row justify-between items-center border-b border-gray-100 pb-4 bg-gray-50/50">
                            <CardTitle className="text-gray-800 flex items-center gap-2">
                                <i className="fa-solid fa-users text-blue-500"></i>
                                Equipo
                            </CardTitle>
                            {isAdmin && (
                                <Button size="sm" variant="ghost" onClick={() => setIsAssignModalOpen(true)} className="text-blue-600 hover:bg-blue-50">
                                    <i className="fa-solid fa-gear mr-1"></i> Gestionar
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            {assignments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                    <i className="fa-regular fa-user text-3xl mb-2 opacity-50"></i>
                                    <p className="text-sm">No hay personal asignado</p>
                                </div>
                            ) : (
                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                    <div className="divide-y divide-gray-100">
                                        {assignments.map((assign, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                        {getInitials(assign)}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">
                                                        {assign.nombre ? `${assign.nombre} ${assign.ap_paterno}` : (assign.usuario || 'Usuario')}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                                                            {assign.rol_proyecto || 'Colaborador'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400">
                                {assignments.length} miembros activos
                            </p>
                        </div>
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
