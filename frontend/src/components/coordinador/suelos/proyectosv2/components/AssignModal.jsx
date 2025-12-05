import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from './SharedComponents';
import { useAuth } from '../../../../../data/contexts/AuthContext';

const AssignModal = ({ isOpen, onClose, project, allUsers = [] }) => {
    const API_URL = process.env.REACT_APP_API_BASE || '';
    const { user } = useAuth();
    const token = user?.token;

    const [assignedUsers, setAssignedUsers] = useState([]);

    // Filter users to exclude admins/system accounts if needed
    const excludedKeywords = ['admin', 'prueba', 'chescop', 'system admin'];
    const filteredUsers = allUsers.filter(u => {
        const userNameLower = u.nombre.toLowerCase();
        return !excludedKeywords.some(keyword => userNameLower.includes(keyword));
    });

    const fetchAssignments = useCallback(async () => {
        if (!project) return;
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_URL}/proyectos/${project.id}/assignments`, { headers });
            // API returns array of assignments. We need the user IDs.
            const userIds = res.data.map(a => a.usuario_id);
            setAssignedUsers(userIds);
        } catch (error) {
            console.error("Error fetching assignments", error);
            alertify.error("Error al cargar asignaciones.");
        }
    }, [project, API_URL, token]);

    useEffect(() => {
        if (isOpen && project) {
            fetchAssignments();
        } else {
            setAssignedUsers([]);
        }
    }, [isOpen, project, fetchAssignments]);

    const handleAssign = async (userId) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(`${API_URL}/proyectos/${project.id}/assignUser`, { userId, rolProyecto: 'view' }, { headers });
            setAssignedUsers(prev => [...prev, userId]);
            alertify.success('Usuario asignado.');
        } catch (error) {
            console.error(error);
            alertify.error('Error al asignar usuario.');
        }
    };

    const handleRemove = async (userId) => {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`${API_URL}/proyectos/${project.id}/removeUser/${userId}`, { headers });
            setAssignedUsers(prev => prev.filter(id => id !== userId));
            alertify.success('Usuario desasignado.');
        } catch (error) {
            console.error(error);
            alertify.error('Error al desasignar usuario.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Asignar Personal - {project?.nombre_tramo}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <div className="overflow-y-auto max-h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Cargo/Especialidad</TableHead>
                                    <TableHead>Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map(u => {
                                    const isAssigned = assignedUsers.includes(u.id);
                                    return (
                                        <TableRow key={u.id}>
                                            <TableCell>{u.nombre}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{u.cargo}</span>
                                                    <span className="text-xs text-gray-500">{u.CO}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isAssigned ? (
                                                    <Button size="sm" variant="secondary" onClick={() => handleRemove(u.id)}>
                                                        Quitar
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" onClick={() => handleAssign(u.id)}>
                                                        Asignar
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600">
                            Usuarios asignados: <Badge>{assignedUsers.length}</Badge>
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AssignModal;
