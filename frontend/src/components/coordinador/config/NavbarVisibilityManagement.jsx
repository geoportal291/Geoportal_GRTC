import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { FaEye, FaEyeSlash, FaSave, FaTimes } from 'react-icons/fa';
import './PermisosManagement.css'; // Reutilizamos el CSS de PermisosManagement
import { useAuth } from '../../../data/contexts/AuthContext'; // Importar useAuth

const API_BASE_URL = process.env.REACT_APP_API_BASE || '';

const NavbarVisibilityManagement = () => {
    const { user } = useAuth(); // Obtener el usuario del contexto

    const [roles, setRoles] = useState([]);
    const [especialidades, setEspecialidades] = useState([]); // Nuevo estado para especialidades
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(''); // Nuevo estado para especialidad seleccionada
    const [navbarOptions, setNavbarOptions] = useState([]);
    const [visibilitySettings, setVisibilitySettings] = useState({}); // { link: isVisible }
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

        const loggedInUserRoleName = user?.rol_nombre; // Get from context

        try {
            const [rolesRes, especialidadesRes, navbarOptionsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/roles`, getAuthHeaders()),
                axios.get(`${API_BASE_URL}/api/especialidades`, getAuthHeaders()), // Obtener especialidades
                axios.get(`${API_BASE_URL}/api/navbar-options`, getAuthHeaders())
            ]);

            let rolesData = rolesRes.data;
            // Si el usuario logueado es COORDINADOR PROYECTO, filtra su propio rol
            if (loggedInUserRoleName === 'COORDINADOR PROYECTO') {
                rolesData = rolesData.filter(rol => rol.nombre !== 'COORDINADOR PROYECTO');
            }
            setRoles(rolesData);
            setEspecialidades(especialidadesRes.data); // Guardar especialidades
            setNavbarOptions(navbarOptionsRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error al cargar datos iniciales para Navbar Visibility:', err);
            setError('Error al cargar datos iniciales. Verifique la conexión al backend y los permisos.');
            setLoading(false);
        }
    }, [API_BASE_URL, getAuthHeaders, user]);

    const fetchVisibilitySettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        let res;

        if (!user || !user.token) {
            setLoading(false);
            return;
        }

        try {
            if (selectedRoleId) {
                res = await axios.get(`${API_BASE_URL}/api/navbar-visibility/${selectedRoleId}`, getAuthHeaders());
                if (res) setVisibilitySettings(res.data);
            } else if (selectedSpecialtyId) {
                res = await axios.get(`${API_BASE_URL}/api/navbar-visibility/specialty/${selectedSpecialtyId}`, getAuthHeaders());
                if (res) setVisibilitySettings(res.data);
            } else {
                setVisibilitySettings({});
            }
        } catch (err) {
            console.error('Error al cargar configuración de visibilidad de navbar:', err);
            setError('Error al cargar configuración de visibilidad. Asegúrese de que la selección es válida y tiene permisos.');
            setVisibilitySettings({});
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, selectedRoleId, selectedSpecialtyId, getAuthHeaders, user]);

    useEffect(() => {
        if (user && user.token) {
            fetchInitialData();
        }
    }, [user, fetchInitialData]);

    useEffect(() => {
        fetchVisibilitySettings();
    }, [fetchVisibilitySettings]);

    const handleToggleVisibility = (link) => {
        setVisibilitySettings(prevSettings => ({
            ...prevSettings,
            [link]: !prevSettings[link]
        }));
    };

    const handleSaveVisibility = async () => {
        if (!selectedRoleId && !selectedSpecialtyId) {
            alertify.warning('Seleccione un rol o una especialidad para guardar la configuración de visibilidad.');
            return;
        }

        setLoading(true);
        setError(null);

        if (!user || !user.token) {
            alertify.error('No has iniciado sesión o tu sesión ha expirado. Por favor, inicia sesión.');
            setLoading(false);
            return;
        }

        try {
            if (selectedRoleId) {
                await axios.post(`${API_BASE_URL}/api/navbar-visibility/${selectedRoleId}`, visibilitySettings, getAuthHeaders());
                alertify.success('Configuración de visibilidad de navbar por rol actualizada correctamente.');
            } else if (selectedSpecialtyId) {
                await axios.post(`${API_BASE_URL}/api/navbar-visibility/specialty/${selectedSpecialtyId}`, visibilitySettings, getAuthHeaders());
                alertify.success('Configuración de visibilidad de navbar por especialidad actualizada correctamente.');
            }
        } catch (err) {
            console.error('Error al guardar configuración de visibilidad de navbar:', err);
            alertify.error('Error al guardar configuración de visibilidad. Verifique la consola para más detalles.');
            setError('Error al guardar configuración de visibilidad.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-message">Cargando...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;

    const currentSelectionName = selectedRoleId 
        ? roles.find(r => r.id == selectedRoleId)?.nombre 
        : (selectedSpecialtyId ? especialidades.find(e => e.codigo_esp == selectedSpecialtyId)?.nombre : '');

    return (
        <div className="permisos-container">
            <header className="permisos-header">
                <h1><FaEye /> Gestión de Visibilidad de Navbar</h1>
            </header>

            <div className="permisos-selector">
                <div className="selector-group">
                    <label htmlFor="select-role">Seleccionar Rol:</label>
                    <select 
                        id="select-role"
                        value={selectedRoleId}
                        onChange={(e) => { setSelectedRoleId(e.target.value); setSelectedSpecialtyId(''); }} // Limpiar especialidad al seleccionar rol
                    >
                        <option value="">-- Seleccione un Rol --</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="selector-group">
                    <label htmlFor="select-specialty">Seleccionar Especialidad:</label>
                    <select 
                        id="select-specialty"
                        value={selectedSpecialtyId}
                        onChange={(e) => { setSelectedSpecialtyId(e.target.value); setSelectedRoleId(''); }} // Limpiar rol al seleccionar especialidad
                    >
                        <option value="">-- Seleccione una Especialidad --</option>
                        {especialidades.map(specialty => (
                            <option key={specialty.codigo_esp} value={specialty.codigo_esp}>{specialty.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {(selectedRoleId || selectedSpecialtyId) && (
                <div className="permisos-list-container">
                    <h2>Visibilidad de Navbar para {currentSelectionName}</h2>
                    <div className="navbar-visibility-items">
                        {navbarOptions.map(option => (
                            <div key={option.id} className="navbar-visibility-item">
                                <span>{option.nombre}</span>
                                <button 
                                    onClick={() => handleToggleVisibility(option.link)}
                                    className={visibilitySettings[option.link] ? 'visible-btn' : 'hidden-btn'}
                                >
                                    {visibilitySettings[option.link] ? <FaEye /> : <FaEyeSlash />}
                                    {visibilitySettings[option.link] ? ' Visible' : ' Oculto'}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="permisos-actions">
                        <button className="save-btn" onClick={handleSaveVisibility}><FaSave /> Guardar Cambios</button>
                        <button className="cancel-btn" onClick={() => { setSelectedRoleId(''); setSelectedSpecialtyId(''); }}><FaTimes /> Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NavbarVisibilityManagement;
