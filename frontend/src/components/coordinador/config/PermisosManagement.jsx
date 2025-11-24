import React, { useState, useEffect, useCallback } from 'react';
import { FaUserShield, FaUsers, FaKey, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import alertify from 'alertifyjs';
import './PermisosManagement.css';
import { useAuth } from '../../../data/contexts/AuthContext'; // Importar useAuth

const API_BASE_URL = process.env.REACT_APP_API_BASE || '';

const PermisosManagement = () => {
    const { user } = useAuth(); // Obtener el usuario del contexto

    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [rolePermissions, setRolePermissions] = useState({});
    const [userPermissions, setUserPermissions] = useState({});
    const [generalAccessType, setGeneralAccessType] = useState('none'); // 'none', 'read', 'read_edit'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getAuthHeaders = useCallback(() => {
        if (!user || !user.token) return {};
        return {
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        };
    }, [user]);

    const fetchInitialData = useCallback(async () => {
        if (!user || !user.token) {
            setLoading(false);
            return;
        }
        try {
            const [rolesRes, usersRes, permsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/roles`, getAuthHeaders()),
                axios.get(`${API_BASE_URL}/api/users/simple`, getAuthHeaders()),
                axios.get(`${API_BASE_URL}/api/permissions/all`, getAuthHeaders())
            ]);

            setRoles(rolesRes.data);
            setUsers(usersRes.data);
            setPermissions(permsRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error al cargar datos iniciales:', err);
            setError('Error al cargar datos iniciales. Verifique la conexión al backend y los permisos.');
            setLoading(false);
        }
    }, [API_BASE_URL, getAuthHeaders, user]);

    const loadPermissions = useCallback(async () => {
        setLoading(true);
        setError(null);
        let currentPerms = {};

        if (!user || !user.token) {
            setLoading(false);
            return;
        }

        try {
            if (selectedRole) {
                const res = await axios.get(`${API_BASE_URL}/api/permissions/role/${selectedRole}`, getAuthHeaders());
                currentPerms = res.data;
                setRolePermissions(currentPerms);
                setUserPermissions({});
            } else if (selectedUser) {
                const res = await axios.get(`${API_BASE_URL}/api/permissions/user/${selectedUser}`, getAuthHeaders());
                currentPerms = res.data;
                setUserPermissions(currentPerms);
                setRolePermissions({});
            } else {
                setRolePermissions({});
                setUserPermissions({});
            }

            // Determinar el tipo de acceso general
            let hasEdit = false;
            let hasRead = false;
            for (const permKey in currentPerms) {
                if (currentPerms[permKey]) {
                    if (permKey.endsWith('_edicion')) {
                        hasEdit = true;
                        break; // Si hay edición, ya sabemos que es read_edit
                    } else if (permKey.endsWith('_lectura')) {
                        hasRead = true;
                    }
                }
            }

            if (hasEdit) {
                setGeneralAccessType('read_edit');
            } else if (hasRead) {
                setGeneralAccessType('read');
            } else {
                setGeneralAccessType('none');
            }

        } catch (err) {
            console.error('Error al cargar permisos:', err);
            setError('Error al cargar permisos. Asegúrese de que el ID es válido y tiene permisos.');
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, selectedRole, selectedUser, getAuthHeaders, user]);

    useEffect(() => {
        if (user && user.token) {
            fetchInitialData();
        }
    }, [user, fetchInitialData]);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    const handleSavePermissions = async () => {
        setLoading(true);
        setError(null);
        let permissionsToSend = {};

        if (!user || !user.token) {
            alertify.error('No has iniciado sesión o tu sesión ha expirado. Por favor, inicia sesión.');
            setLoading(false);
            return;
        }

        if (generalAccessType === 'read_edit') {
            permissions.forEach(perm => {
                permissionsToSend[`${perm.nombre}_lectura`] = true;
                permissionsToSend[`${perm.nombre}_edicion`] = true;
            });
        } else if (generalAccessType === 'read') {
            permissions.forEach(perm => {
                permissionsToSend[`${perm.nombre}_lectura`] = true;
                permissionsToSend[`${perm.nombre}_edicion`] = false;
            });
        } else if (generalAccessType === 'none') {
            // No permissions to send, or send all as false
            permissions.forEach(perm => {
                permissionsToSend[`${perm.nombre}_lectura`] = false;
                permissionsToSend[`${perm.nombre}_edicion`] = false;
            });
        }

        try {
            if (selectedRole) {
                await axios.post(`${API_BASE_URL}/api/permissions/role/${selectedRole}`, permissionsToSend, getAuthHeaders());
                alertify.success('Permisos del rol actualizados correctamente.');
            } else if (selectedUser) {
                await axios.post(`${API_BASE_URL}/api/permissions/user/${selectedUser}`, permissionsToSend, getAuthHeaders());
                alertify.success('Permisos del usuario actualizados correctamente.');
            } else {
                alertify.warning('Seleccione un rol o un usuario para guardar permisos.');
            }
        } catch (err) {
            console.error('Error al guardar permisos:', err);
            alertify.error('Error al guardar permisos. Verifique la consola para más detalles.');
            setError('Error al guardar permisos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="permisos-container">
            <header className="permisos-header">
                <h1><FaUserShield /> Gestión de Permisos</h1>
            </header>

            <div className="permisos-selector">
                <div className="selector-group">
                    <label htmlFor="select-role">Seleccionar Rol:</label>
                    <select 
                        id="select-role"
                        value={selectedRole}
                        onChange={(e) => { setSelectedRole(e.target.value); setSelectedUser(''); }}
                    >
                        <option value="">-- Seleccione un Rol --</option>
                        {roles
                            .filter(role => {
                                if (!role.nombre) return false; // Asegurarse de que role.nombre no sea undefined
                                const roleNameLower = role.nombre.toLowerCase();
                                const loggedInUserRoleLower = user?.rol_nombre ? user.rol_nombre.toLowerCase() : ''; // Get from context
                                // Ocultar el rol 'admin' para todos
                                if (roleNameLower === 'admin') {
                                    return false;
                                }
                                // Ocultar el rol 'COORDINADOR PROYECTO' si el usuario logueado es 'COORDINADOR PROYECTO'
                                if (loggedInUserRoleLower === 'coordinador proyecto' && roleNameLower === 'coordinador proyecto') {
                                    return false;
                                }
                                return true;
                            })
                            .map(role => (
                                <option key={role.id} value={role.id}>{role.nombre}</option>
                            ))}
                    </select>
                </div>
                <div className="selector-group">
                    <label htmlFor="select-user">Seleccionar Usuario:</label>
                    <select 
                        id="select-user"
                        value={selectedUser}
                        onChange={(e) => { setSelectedUser(e.target.value); setSelectedRole(''); }}
                    >
                        <option value="">-- Seleccione un Usuario --</option>
                        {users
                            .filter(u => {
                                if (!u.usuario || !u.rol_nombre) return false; // Asegurarse de que user.usuario y user.rol_nombre no sean undefined
                                const userNameLower = u.usuario.toLowerCase();
                                const userRoleNameLower = u.rol_nombre.toLowerCase();
                                const loggedInUserRoleLower = user?.rol_nombre ? user.rol_nombre.toLowerCase() : ''; // Get from context

                                // Ocultar usuarios con nombre de usuario 'admin' y 'sadmin' para todos
                                if (userNameLower === 'admin' || userNameLower === 'sadmin') {
                                    return false;
                                }
                                // Ocultar usuarios con rol COORDINADOR PROYECTO si el usuario logueado es COORDINADOR PROYECTO
                                if (loggedInUserRoleLower === 'coordinador proyecto' && userRoleNameLower === 'coordinador proyecto') {
                                    return false;
                                }
                                return true;
                            })
                            .map(u => (
                                <option key={u.id} value={u.id}>{u.nombre}</option>
                            ))}
                    </select>
                </div>
            </div>

            {(selectedRole || selectedUser) && (
                <div className="permisos-list-container">
                    <h2>Permisos para {selectedRole ? roles.find(r => r.id == selectedRole)?.nombre : users.find(u => u.id == selectedUser)?.nombre}</h2>
                    <div className="permisos-general-options">
                        <h3>Tipo de Acceso General:</h3>
                        <label>
                            <input
                                type="radio"
                                name="generalAccess"
                                value="none"
                                checked={generalAccessType === 'none'}
                                onChange={() => setGeneralAccessType('none')}
                            />
                            Sin Acceso
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="generalAccess"
                                value="read"
                                checked={generalAccessType === 'read'}
                                onChange={() => setGeneralAccessType('read')}
                            />
                            Solo Lectura
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="generalAccess"
                                value="read_edit"
                                checked={generalAccessType === 'read_edit'}
                                onChange={() => setGeneralAccessType('read_edit')}
                            />
                            Lectura y Edición
                        </label>
                    </div>
                    <div className="permisos-actions">
                        <button className="save-btn" onClick={handleSavePermissions}><FaSave /> Guardar Cambios</button>
                        <button className="cancel-btn" onClick={() => { setSelectedRole(''); setSelectedUser(''); setGeneralAccessType('none'); }}><FaTimes /> Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermisosManagement;
