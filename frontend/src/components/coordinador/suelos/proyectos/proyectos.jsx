// Final, merged component
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../../../data/contexts/AuthContext";
import axios from 'axios';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';

import departamentosData from "../../../../data/ubigeo/ubigeo_peru_2016_departamentos.json";
import provinciasData from "../../../../data/ubigeo/ubigeo_peru_2016_provincias.json";
import distritosData from "../../../../data/ubigeo/ubigeo_peru_2016_distritos.json";

// Helper functions to get names from IDs
const getDepartmentName = (id) => departamentosData.find(d => d.id === id)?.name || id;
const getProvinceName = (id) => provinciasData.find(p => p.id === id)?.name || id;

// #region Custom Components
/* eslint-disable no-unused-vars */
const Button = ({ children, variant = "primary", size = "md", onClick, className = "", ...props }) => {
    const baseClasses = "font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3 text-lg"
    };
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500",
      outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    };

    return (
      <button
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  };

  const Input = ({ className = "", ...props }) => {
    return (
      <input
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
        {...props}
      />
    );
  };

  const Select = ({ children, value, onChange, onValueChange, className = "", ...props }) => {
    const handleChange = onChange || ((e) => onValueChange(e.target.value));
    return (
      <select
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  };

  const Label = ({ children, className = "", ...props }) => {
    return (
      <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}>
        {children}
      </label>
    );
  };

  const Textarea = ({ className = "", ...props }) => {
    return (
      <textarea
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
        {...props}
      />
    );
  };

  const Badge = ({ children, className = "", ...props }) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  };

  const Table = ({ children, className = "", ...props }) => {
    return (
      <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
        {children}
      </table>
    );
  };

  const TableHeader = ({ children, className = "", ...props }) => {
    return (
      <thead className={`bg-gray-50 ${className}`} {...props}>
        {children}
      </thead>
    );
  };

  const TableBody = ({ children, className = "", ...props }) => {
    return (
      <tbody className={`bg-white divide-y divide-gray-200 ${className}`} {...props}>
        {children}
      </tbody>
    );
  };

  const TableRow = ({ children, className = "", ...props }) => {
    return (
      <tr className={className} {...props}>
        {children}
      </tr>
    );
  };

  const TableHead = ({ children, className = "", ...props }) => {
    return (
      <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`} {...props}>
        {children}
      </th>
    );
  };

  const TableCell = ({ children, className = "", ...props }) => {
    return (
      <td className={`px-6 py-4 whitespace-nowrap ${className}`} {...props}>
        {children}
      </td>
    );
  };

  const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => onOpenChange(false)}></div>
          </div>
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          {children}
        </div>
      </div>
    );
  };

  const DialogContent = ({ children, className = "", ...props }) => {
    return (
      <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${className}`} {...props}>
        {children}
      </div>
    );
  };

  const DialogHeader = ({ children, className = "", ...props }) => {
    return (
      <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  };

  const DialogTitle = ({ children, className = "", ...props }) => {
    return (
      <h3 className={`text-lg leading-6 font-medium text-gray-900 ${className}`} {...props}>
        {children}
      </h3>
    );
  };

  const DialogFooter = ({ children, className = "", ...props }) => {
    return (
      <div className={`bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${className}`} {...props}>
        {children}
      </div>
    );
  };
/* eslint-enable no-unused-vars */
// #endregion

export default function SGVProjectsManager() {
  const API_URL = process.env.REACT_APP_API_BASE || '';
  const navigate = useNavigate();
  const location = useLocation();
  const { openProjectSwitcher } = useAuth();

  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  const [entidadesSolicitantes, setEntidadesSolicitantes] = useState([]);
  const [otrasEntidades, setOtrasEntidades] = useState([]);

  const [assignments, setAssignments] = useState({});
  const [permissions, setPermissions] = useState({});
  const [historial, setHistorial] = useState({});

  const initialFormData = {
    nombre_tramo: '',
    proyecto_nom: '',
    solicitante: '',
    departamento: '',
    provincia: '',
    distrito: '',
    localidad: '',
    descripcion_larga: '',
    estado: 'Activo',
    codigo_progresiva: '',
    nombre_progresiva: '',
    linea_progresiva: '18L',
    coordenada_este_progresiva: '',
    coordenada_norte_progresiva: '',
    descripcion_progresiva: '',
    estado_progresiva: 'activo',
    longitud_total_progresiva: '',
    tipo_via_progresiva: '500',
    intervalo_manual_progresiva: '',
    isIntervalManual_progresiva: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const [subProgresivasGeneradas, setSubProgresivasGeneradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isProyectoNomManual, setIsProyectoNomManual] = useState(false);
  const [isSolicitanteManual, setIsSolicitanteManual] = useState(false);
  const selectedProject = useMemo(() => projects.find((p) => p.id === selectedProjectId), [projects, selectedProjectId]);

  const getAuthHeaders = useCallback(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const token = userData?.token;
    if (!token) {
        alertify.error('Sesión expirada. Por favor, inicia sesión de nuevo.');
        navigate('/login');
        throw new Error('Token no proporcionado');
    }
    return { Authorization: `Bearer ${token}` };
  }, [navigate]);

  const fetchProyectos = useCallback(async () => {
    setLoading(true);
    try {
        const headers = getAuthHeaders();
        const res = await axios.get(`${API_URL}/api/proyectos/assigned-detailed`, { headers });
        setProjects(res.data);
        if (res.data.length > 0 && !selectedProjectId) { // Set initial project only if none is selected
          // Check location state first
          const locationState = location.state;
          if (locationState?.selectedProjectId) {
            setSelectedProjectId(locationState.selectedProjectId);
          } else {
            setSelectedProjectId(res.data[0].id);
          }
        }
    } catch (error) {
        if (error.message !== 'Token no proporcionado') {
            console.error("Error al cargar proyectos:", error);
            alertify.error("Error al cargar la lista de proyectos.");
        }
    } finally {
        setLoading(false);
    }
  }, [API_URL, getAuthHeaders, location.state, selectedProjectId]);

  const fetchEntidades = useCallback(async () => {
      try {
          const headers = getAuthHeaders();
          const [resSolicitantes, resOtras] = await Promise.all([
              axios.get(`${API_URL}/api/entidades-solicitantes`, { headers }),
              axios.get(`${API_URL}/api/otras-entidades`, { headers })
          ]);
          setEntidadesSolicitantes(resSolicitantes.data);
          setOtrasEntidades(resOtras.data);
      } catch (error) {
          if (error.message !== 'Token no proporcionado') {
              console.error("Error al cargar catálogos de entidades:", error);
              alertify.error("Error al cargar las listas de entidades.");
          }
      }
  }, [API_URL, getAuthHeaders]);
  
  const fetchUsers = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/usuarios`, { headers });
      const formattedUsers = res.data.map(user => ({
        id: user.id,
        nombre: `${user.nombre} ${user.ap_paterno} ${user.ap_materno}`.trim(),
        CO: user.especialidad_nombre, // Ahora jala el nombre de la especialidad
        cargo: user.rol_nombre,
        contacto: user.telefono,
        nacimiento: user.fecha_nacimiento,
        dni: user.dni
      }));
      setUsers(formattedUsers);
    } catch (error) {
        if (error.message !== 'Token no proporcionado') {
            console.error("Error al cargar usuarios:", error);
            alertify.error("Error al cargar la lista de usuarios.");
        }
    }
  }, [API_URL, getAuthHeaders]);

  const fetchProjectAssignments = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/proyectos/${selectedProjectId}/assignments`, { headers });
      const assignedUsers = res.data.map(assignment => assignment.usuario_id);
      const permissionsMap = {};
      res.data.forEach(assignment => {
        permissionsMap[assignment.usuario_id] = { view: true, edit: assignment.rol_proyecto === 'edit' || assignment.rol_proyecto === 'admin', admin: assignment.rol_proyecto === 'admin' };
      });

      setAssignments(prev => ({ ...prev, [selectedProjectId]: assignedUsers }));
      setPermissions(prev => ({ ...prev, [selectedProjectId]: permissionsMap }));
    } catch (error) {
      console.error('Error al cargar asignaciones del proyecto:', error);
      alertify.error('Error al cargar las asignaciones del proyecto.');
    }
  }, [selectedProjectId, API_URL, getAuthHeaders]);

  const fetchProjectHistory = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${API_URL}/api/proyectos/${selectedProjectId}/history`, { headers });
      // Assuming the backend returns an array of history records
      setHistorial(prev => ({ ...prev, [selectedProjectId]: res.data }));
    } catch (error) {
      console.error('Error al cargar historial del proyecto:', error);
      alertify.error('Error al cargar el historial del proyecto.');
    }
  }, [selectedProjectId, API_URL, getAuthHeaders]);

  useEffect(() => {
    setDepartamentos(departamentosData);
    fetchProyectos();
    fetchEntidades();
    fetchUsers();
  }, [fetchProyectos, fetchEntidades, fetchUsers]);

  useEffect(() => {
    const state = location.state;
    if (state?.selectedProjectId && projects.find(p => p.id === state.selectedProjectId)) {
      setSelectedProjectId(state.selectedProjectId);
    }
    // NOTE: expandTramoId logic needs to be implemented in the relevant tab/component
    // that displays the tramos.
  }, [location.state, projects]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectAssignments();
      fetchProjectHistory(); // Added this line
    }
  }, [selectedProjectId, fetchProjectAssignments, fetchProjectHistory]);

  useEffect(() => {
    if (formData.departamento) {
      const filteredProvinces = provinciasData.filter(prov => prov.department_id === formData.departamento);
      setProvincias(filteredProvinces);
    } else {
      setProvincias([]);
    }
  }, [formData.departamento]);

  useEffect(() => {
    if (formData.provincia) {
      const filteredDistricts = distritosData.filter(dist => dist.province_id === formData.provincia);
      setDistritos(filteredDistricts);
    } else {
      setDistritos([]);
    }
  }, [formData.provincia]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
        const newFormData = { ...prev, [name]: val };

        if (name === 'departamento') {
            newFormData.provincia = '';
            newFormData.distrito = '';
        }
        if (name === 'provincia') {
            newFormData.distrito = '';
        }

        if (name === 'nombre_progresiva') {
            newFormData.codigo_progresiva = val.toUpperCase().replace(/\s/g, '-');
        }
        return newFormData;
    });
  };

  const toggleProyectoNomManual = () => {
    setIsProyectoNomManual(prev => !prev);
    setFormData(prev => ({ ...prev, proyecto_nom: '' }));
  };

  const toggleSolicitanteManual = () => {
    setIsSolicitanteManual(prev => !prev);
    setFormData(prev => ({ ...prev, solicitante: '' }));
  };

  const handleGenerarProgresivas = () => {
    const totalLength = parseFloat(formData.longitud_total_progresiva);
    let interval = parseFloat(formData.tipo_via_progresiva);

    if (formData.isIntervalManual_progresiva) {
      interval = parseFloat(formData.intervalo_manual_progresiva);
    }

    if (isNaN(totalLength) || totalLength <= 0) {
      alertify.error("La Longitud Total de la Progresiva debe ser un número mayor a 0.");
      return;
    }
    if (isNaN(interval) || interval <= 0) {
      alertify.error("El Intervalo de la Progresiva debe ser un número mayor a 0.");
      return;
    }

    const generated = [];
    let currentTotalMeters = 0;

    while (currentTotalMeters <= totalLength) {
      const km = Math.floor(currentTotalMeters / 1000);
      const meters = currentTotalMeters % 1000;
      const codigo = `${km}${String(meters).padStart(3, '0')}`;
      generated.push({
        codigo: codigo,
        nombre: `Progresiva ${km}+${String(meters).padStart(3, '0')}`,
        descripcion: `Progresiva generada automáticamente`,
        estado: 'activo',
        linea: formData.linea_progresiva,
      });
      currentTotalMeters += interval;
    }
    setSubProgresivasGeneradas(generated);
    alertify.success(`${generated.length} sub-progresivas generadas correctamente.`);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (subProgresivasGeneradas.length === 0 && !isEditing) {
        alertify.error('Por favor, genere las progresivas antes de guardar un nuevo proyecto.');
        setLoading(false);
        return;
    }

    try {
        const headers = getAuthHeaders();
        const projectData = {
            nombre_tramo: formData.nombre_tramo,
            proyecto_nom: formData.proyecto_nom,
            solicitante: formData.solicitante,
            departamento: formData.departamento,
            provincia: formData.provincia,
            distrito: formData.distrito,
            localidad: formData.localidad,
            longitud_total: formData.longitud_total_progresiva === '' ? null : parseFloat(formData.longitud_total_progresiva),
            progresiva_inicial: '0+000',
            tipo_via: formData.tipo_via_progresiva === '' ? null : parseFloat(formData.tipo_via_progresiva),
            intervalo_manual: formData.isIntervalManual_progresiva && formData.intervalo_manual_progresiva !== '' ? parseFloat(formData.intervalo_manual_progresiva) : null,
            descripcion_larga: formData.descripcion_larga,
            isIntervalManual: formData.isIntervalManual_progresiva,
            estado: formData.estado,
        };
        const parentProgresiva = {
            codigo: formData.codigo_progresiva,
            nombre: formData.nombre_progresiva,
            linea: formData.linea_progresiva,
            coordenada_este: formData.coordenada_este_progresiva,
            coordenada_norte: formData.coordenada_norte_progresiva,
            descripcion: formData.descripcion_progresiva,
            estado: formData.estado_progresiva,
        };
        const progresivaData = {
            parentProgresiva,
            generatedChildren: subProgresivasGeneradas
        };

        if (isEditing) {
            await axios.put(`${API_URL}/api/proyectos/${formData.id}`, { projectData, progresivaData }, { headers });
            alertify.success("Proyecto actualizado correctamente.");
        } else {
            await axios.post(`${API_URL}/api/proyectos/create-full`, { projectData, progresivaData }, { headers });
            alertify.success("Proyecto y Tramo guardados correctamente.");
        }

        setShowForm(false);
        fetchProyectos();
        setFormData(initialFormData);
        setSubProgresivasGeneradas([]);
        setIsEditing(false);

    } catch (error) {
        if (error.message !== 'Token no proporcionado') {
          alertify.error(`Error: ${error.response?.data?.error || error.message}`);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(initialFormData);
    setSubProgresivasGeneradas([]);
    setIsEditing(false);
  };

  function openAdvancedProject() {
    setShowForm(true);
    setFormData(initialFormData);
    setIsEditing(false);
  }

  const handleEditProject = async (proyectoId) => {
    setLoading(true);
    try {
        const headers = getAuthHeaders();
        const res = await axios.get(`${API_URL}/api/proyectos/${proyectoId}`, { headers });
        const projectToEdit = res.data;

        // Populate form data with existing project details
        setFormData({
            ...initialFormData, // Start with initial to clear any previous new project data
            id: projectToEdit.id,
            nombre_tramo: projectToEdit.nombre_tramo,
            proyecto_nom: projectToEdit.proyecto_nom,
            solicitante: projectToEdit.solicitante,
            departamento: projectToEdit.departamento,
            provincia: projectToEdit.provincia,
            distrito: projectToEdit.distrito,
            localidad: projectToEdit.localidad,
            descripcion_larga: projectToEdit.descripcion_larga,
            estado: projectToEdit.estado,
            longitud_total_progresiva: projectToEdit.longitud_total || '',
            tipo_via_progresiva: projectToEdit.tipo_via || '',
            intervalo_manual_progresiva: projectToEdit.intervalo_manual || '',
            isIntervalManual_progresiva: projectToEdit.is_interval_manual,
            // Assuming the first progresiva is the main one for the tramo
            nombre_progresiva: projectToEdit.progresivas && projectToEdit.progresivas[0] ? projectToEdit.progresivas[0].nombre : '',
            codigo_progresiva: projectToEdit.progresivas && projectToEdit.progresivas[0] ? projectToEdit.progresivas[0].codigo : '',
            linea_progresiva: projectToEdit.progresivas && projectToEdit.progresivas[0] ? projectToEdit.progresivas[0].linea : '18L',
            coordenada_este_progresiva: projectToEdit.progresivas && projectToEdit.progresivas[0] ? projectToEdit.progresivas[0].coordenada_este : '',
            coordenada_norte_progresiva: projectToEdit.progresivas && projectToEdit.progresivas[0] ? projectToEdit.progresivas[0].coordenada_norte : '',
            descripcion_progresiva: projectToEdit.progresivas && projectToEdit.progresivas[0] ? projectToEdit.progresivas[0].descripcion : '',
            estado_progresiva: projectToEdit.progresivas && projectToEdit.progresivas[0] ? projectToEdit.progresivas[0].estado : 'activo',
        });
        setIsEditing(true);
        setShowForm(true);
    } catch (error) {
        console.error("Error al cargar datos del proyecto para editar:", error);
        alertify.error("Error al cargar datos del proyecto para editar.");
    } finally {
        setLoading(false);
    }
  };

  
  
  const handleDeleteProject = (proyectoId) => {
    alertify.confirm('Confirmar Eliminación', `¿Está seguro de que desea eliminar el proyecto ${proyectoId}? Esta acción no se puede deshacer.`,
        async () => {
            try {
                const headers = getAuthHeaders();
                await axios.delete(`${API_URL}/api/proyectos/${proyectoId}`, { headers });
                fetchProyectos(); // Refetch the list
                alertify.success("Proyecto eliminado correctamente");
            } catch (error) {
                if (error.message !== 'Token no proporcionado') {
                  console.error("Error al eliminar el proyecto:", error);
                  alertify.error("Error al eliminar el proyecto");
                }
            }
        },
        () => { alertify.message('Eliminación cancelada.'); }
    ).set('labels', {ok:'Eliminar', cancel:'Cancelar'});
  };

  const assignUserToProject = useCallback(async (userId) => {
    if (!selectedProjectId) return;
    try {
      const headers = getAuthHeaders();
      // Make API call to assign user to project
      await axios.post(`${API_URL}/api/proyectos/${selectedProjectId}/assignUser`, { userId, rolProyecto: 'view' }, { headers });
      
      // Update local state after successful API call
      setAssignments((prev) => {
        const list = new Set(prev[selectedProjectId] || []);
        list.add(userId);
        return { ...prev, [selectedProjectId]: Array.from(list) };
      });
      setPermissions((prev) => ({ ...prev, [selectedProjectId]: { ...(prev[selectedProjectId] || {}), [userId]: { view: true, edit: false, admin: false } } }));
      setHistorial((prev) => ({ ...prev, [selectedProjectId]: [...(prev[selectedProjectId] || []), { userId, action: 'Asignado', date: new Date().toISOString() }] }));
      alertify.success('Usuario asignado al proyecto correctamente.');
    } catch (error) {
      console.error('Error al asignar usuario a proyecto:', error);
      alertify.error(`Error al asignar usuario: ${error.response?.data?.error || error.message}`);
    }
  }, [selectedProjectId, API_URL, getAuthHeaders]);

  const removeUserFromProject = useCallback(async (userId) => {
    if (!selectedProjectId) return;
    try {
      const headers = getAuthHeaders();
      // Make API call to remove user from project
      await axios.delete(`${API_URL}/api/proyectos/${selectedProjectId}/removeUser/${userId}`, { headers });

      // Update local state after successful API call
      setAssignments((prev) => ({ ...prev, [selectedProjectId]: (prev[selectedProjectId] || []).filter((u) => u !== userId) }));
      setHistorial((prev) => ({ ...prev, [selectedProjectId]: [...(prev[selectedProjectId] || []), { userId, action: 'Retirado', date: new Date().toISOString() }] }));
      alertify.success('Usuario desasignado del proyecto correctamente.');
    } catch (error) {
      console.error('Error al desasignar usuario de proyecto:', error);
      alertify.error(`Error al desasignar usuario: ${error.response?.data?.error || error.message}`);
    }
  }, [selectedProjectId, API_URL, getAuthHeaders]);

  function togglePermission(userId, perm) {
    setPermissions((prev) => {
      const projPerms = prev[selectedProjectId] || {};
      const userPerms = projPerms[userId] || { view: false, edit: false, admin: false };
      const updated = { ...userPerms, [perm]: !userPerms[perm] };
      return { ...prev, [selectedProjectId]: { ...projPerms, [userId]: updated } };
    });
  }

  // #region Render Functions
  function ProjectsTab() {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Listado de Proyectos</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openProjectSwitcher}>Cambiar de Proyecto</Button>
            <Button onClick={openAdvancedProject}>+ Nuevo Proyecto (Avanzado)</Button>
          </div>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">ID</TableHead>
                <TableHead className="text-center">NOMBRE DE PROYECTO</TableHead>
                <TableHead className="text-center" style={{ width: '100px' }}>ENTIDAD</TableHead>
                <TableHead className="text-center">UBICACIÓN</TableHead>
                <TableHead className="text-center">ESTADO</TableHead>
                <TableHead className="text-center">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedProjectId(p.id); setActiveTab('assign'); }}>
                  <TableCell className="font-medium text-center">{p.id}</TableCell>
                  <TableCell className="text-left">{p.nombre_tramo}</TableCell>
                  <TableCell className="text-center" style={{ width: '100px', whiteSpace: 'normal' }}>{p.proyecto_nom}</TableCell>
                  <TableCell className="text-center">{`${getDepartmentName(p.departamento)} / ${getProvinceName(p.provincia)}`}</TableCell>
                  <TableCell className="text-center">{p.estado}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={(ev) => { ev.stopPropagation(); handleEditProject(p.id); }}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={(ev) => { ev.stopPropagation(); handleDeleteProject(p.id); }}>Eliminar</Button>
                      <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); setSelectedProjectId(p.id); setActiveTab('assign'); }}>Ver</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  function AssignTab({ selectedProject }) {
    if (!selectedProject) {
      return (
        <div className="p-6 bg-white rounded-lg shadow text-center text-gray-600">
          <h2 className="text-xl font-semibold mb-4">Asignación de Personal</h2>
          <p>Por favor, seleccione un proyecto de la pestaña "Proyectos" para gestionar las asignaciones.</p>
        </div>
      );
    }
    const assigned = assignments[selectedProjectId] || [];
    const excludedKeywords = ['admin', 'prueba', 'chescop', 'system admin'];
    const filteredUsers = users.filter(u => {
      const userNameLower = u.nombre.toLowerCase();
      return !excludedKeywords.some(keyword => userNameLower.includes(keyword));
    });
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold bg-blue-100 p-3 rounded-md text-blue-800">Asignación de Personal para: {selectedProject?.nombre_tramo || 'Ningún Proyecto Seleccionado'}</h2>
          <div className="flex gap-2">
            
          </div>
        </div>

        <div> {/* Contenedor simple, sin grid */}
          <div className="overflow-x-auto mb-6"> {/* Añadir margen inferior para separación */}
            <h3 className="font-medium mb-1">Usuarios Disponibles</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombres</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="text-left">{u.nombre}</TableCell>
                    <TableCell>{u.CO}</TableCell>
                    <TableCell>{u.cargo}</TableCell>
                    <TableCell>
                      {assigned.includes(u.id) ? (
                        <Button size="sm" variant="secondary" onClick={() => removeUserFromProject(u.id)}>Quitar</Button>
                      ) : (
                        <Button size="sm" onClick={() => assignUserToProject(u.id)}>Asignar</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
            </Table>
          </div>

          <div> {/* Sin col-span, ocupará el ancho completo por defecto */}
            <h3 className="font-medium mb-3">Listado General (Asignados)</h3>
            <div className="space-y-1">
              {assigned.length === 0 && <div className="text-sm text-gray-500">No hay personal asignado</div>}
              {assigned.map((uid) => {
                const u = users.find((x) => x.id === uid);
                if (!u) return null;
                return (
                  <div key={uid} className="flex items-center justify-between border rounded bg-gray-50 p-2">
                    <div>
                      <div className="font-semibold">{u.nombre}</div>
                      <div className="text-sm text-gray-500">{u.cargo} • {u.contacto}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => alertify.alert('Detalles de Usuario', `Nombre: ${u.nombre}<br>Cargo: ${u.cargo}`)}>Ver</Button>
                      <Button size="sm" variant="destructive" onClick={() => removeUserFromProject(u.id)}>Remover</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function HistorialTab() {
    const records = historial[selectedProjectId] || [];
    const assigned = assignments[selectedProjectId] || [];

    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Historial de Control</h2>
        <div className="mb-3">Resumen de personas asignadas: <Badge>{assigned.length}</Badge></div>
        <div className="space-y-2">
          {records.length === 0 && <div className="text-sm text-gray-500">No hay registros históricos aún.</div>}
          {records.map((r, i) => {
            const actorFullName = `${r.actor_nombre || ''} ${r.actor_ap_paterno || ''} ${r.actor_ap_materno || ''}`.trim();
            return (
              <div key={i} className="border rounded p-3 bg-white">
                <div className="text-sm text-gray-600">{new Date(r.fecha).toLocaleString()}</div>
                <div className="font-medium">{actorFullName || r.actor_id} — {r.accion}</div>
                {r.detalles && <div className="text-xs text-gray-500">{r.detalles}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  // #endregion

  return (
    <div className="mx-auto p-6">
      {loading && <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 text-white font-bold text-lg">Cargando...</div>}

      <header className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow">
          <i className="fas fa-road text-2xl text-blue-600"></i>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gestion de Proyectos</h1>
          
          
        </div>
      </header>

      <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-1 rounded-lg mb-6">
        <nav className="bg-white rounded-lg p-2 flex gap-2">
          <button 
            className={`px-4 py-2 rounded ${activeTab === 'projects' ? 'bg-blue-600 text-white' : 'text-gray-600'}`} 
            onClick={() => setActiveTab('projects')}
          >
            Proyectos
          </button>
          <button 
            className={`px-4 py-2 rounded ${activeTab === 'assign' ? 'bg-blue-600 text-white' : 'text-gray-600'}`} 
            onClick={() => setActiveTab('assign')}
          >
            Asignación
          </button>
          {/* <button 
            className={`px-4 py-2 rounded ${activeTab === 'permissions' ? 'bg-blue-600 text-white' : 'text-gray-600'}`} 
            onClick={() => setActiveTab('permissions')}
          >
            Permisos
          </button> */}
          <button 
            className={`px-4 py-2 rounded ${activeTab === 'historial' ? 'bg-blue-600 text-white' : 'text-gray-600'}`} 
            onClick={() => setActiveTab('historial')}
          >
            Historial
          </button>
        </nav>
      </div>

      <main>
        {activeTab === 'projects' && <ProjectsTab />}
        {activeTab === 'assign' && <AssignTab selectedProject={selectedProject} />}
        {activeTab === 'historial' && <HistorialTab />}
      </main>

      

      {/* Advanced Dialog for complete project creation */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <form onSubmit={handleGuardar}>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto y Tramo Inicial'}</DialogTitle>
            </DialogHeader>
            
            <div className="p-6" style={{maxHeight: '70vh', overflowY: 'auto'}}>
              <fieldset className="mb-6">
                <legend className="text-lg font-medium text-gray-900 mb-4">1. Información del Proyecto</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nombre_tramo">Nombre del Proyecto</Label>
                    <Input type="text" id="nombre_tramo" name="nombre_tramo" value={formData.nombre_tramo} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="proyecto_nom">Entidad Solicitante</Label>
                    <div className="flex items-center gap-2">
                      {isProyectoNomManual ? (
                        <Input type="text" id="proyecto_nom" name="proyecto_nom" value={formData.proyecto_nom} onChange={handleInputChange} placeholder="Escriba la entidad" required />
                      ) : (
                        <Select id="proyecto_nom" name="proyecto_nom" value={formData.proyecto_nom} onChange={handleInputChange} required>
                          <option value="">Seleccione</option>
                          {entidadesSolicitantes.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                        </Select>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={toggleProyectoNomManual}>{isProyectoNomManual ? "Seleccionar" : "Escribir"}</Button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="solicitante">Otra Entidad/Persona</Label>
                    <div className="flex items-center gap-2">
                      {isSolicitanteManual ? (
                        <Input type="text" id="solicitante" name="solicitante" value={formData.solicitante} onChange={handleInputChange} placeholder="Escriba la persona/entidad" />
                      ) : (
                        <Select id="solicitante" name="solicitante" value={formData.solicitante} onChange={handleInputChange}>
                          <option value="">Seleccione</option>
                          {otrasEntidades.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                        </Select>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={toggleSolicitanteManual}>{isSolicitanteManual ? "Seleccionar" : "Escribir"}</Button>
                    </div>
                  </div>
                </div>
              </fieldset>

              <fieldset className="mb-6">
                <legend className="text-lg font-medium text-gray-900 mb-4">2. Ubicación</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="departamento">Departamento</Label>
                    <Select id="departamento" name="departamento" value={formData.departamento} onChange={handleInputChange} required>
                      <option value="">Seleccione</option>
                      {departamentos.map(dep => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="provincia">Provincia</Label>
                    <Select id="provincia" name="provincia" value={formData.provincia} onChange={handleInputChange} required disabled={!formData.departamento || provincias.length === 0}>
                      <option value="">Seleccione</option>
                      {provincias.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="distrito">Distrito</Label>
                    <Select id="distrito" name="distrito" value={formData.distrito} onChange={handleInputChange} required disabled={!formData.provincia || distritos.length === 0}>
                      <option value="">Seleccione</option>
                      {distritos.map(dist => <option key={dist.id} value={dist.id}>{dist.name}</option>)}
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="localidad">Localidad (Opcional)</Label>
                    <Input type="text" id="localidad" name="localidad" value={formData.localidad} onChange={handleInputChange} />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-lg font-medium text-gray-900 mb-4">3. Tramo</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Nombre del Tramo</Label>
                    <Input type="text" name="nombre_progresiva" value={formData.nombre_progresiva} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label>Código del Tramo</Label>
                    <Input type="number" name="codigo_progresiva" value={formData.codigo_progresiva} onChange={handleInputChange} placeholder="ejem 0000" required min="0" step="1" max="9999" disabled={isEditing} />
                  </div>
                  <div>
                    <Label>Valor Total (metros)</Label>
                    <Input type="number" name="longitud_total_progresiva" value={formData.longitud_total_progresiva} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label>Intervalo (metros)</Label>
                    <div className="flex items-center gap-2">
                      {formData.isIntervalManual_progresiva ? (
                        <Input type="number" name="intervalo_manual_progresiva" value={formData.intervalo_manual_progresiva} onChange={handleInputChange} />
                      ) : (
                        <Select name="tipo_via_progresiva" value={formData.tipo_via_progresiva} onChange={handleInputChange}>
                          <option value="100">TIPO I - Autopistas (100m)</option>
                          <option value="250">Tipo II - Vias principales (250m)</option>
                          <option value="500">Tipo III - Vias secundarias (500m)</option>
                          <option value="1000">Tipo IV Vias locales (1000m)</option>
                        </Select>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, isIntervalManual_progresiva: !prev.isIntervalManual_progresiva, intervalo_manual_progresiva: '' }))}>
                        {formData.isIntervalManual_progresiva ? 'Seleccionar' : 'Manual'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Zona</Label>
                    <Select name="linea_progresiva" value={formData.linea_progresiva} onChange={handleInputChange}>
                      <option value="17L">17L</option>
                      <option value="18L">18L</option>
                      <option value="19L">19L</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Ubicación (Coordenadas)</Label>
                    <div className="flex gap-2">
                      <Input type="text" name="coordenada_este_progresiva" placeholder="Coord. Este" value={formData.coordenada_este_progresiva} onChange={handleInputChange} />
                      <Input type="text" name="coordenada_norte_progresiva" placeholder="Coord. Norte" value={formData.coordenada_norte_progresiva} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label>Estado del Tramo</Label>
                    <Select name="estado_progresiva" value={formData.estado_progresiva} onChange={handleInputChange} required>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="completado">Completado</option>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descripción del Tramo</Label>
                    <Textarea name="descripcion_progresiva" value={formData.descripcion_progresiva} onChange={handleInputChange} />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="button" variant="secondary" onClick={handleGenerarProgresivas}>Generar Progresivas</Button>
                    {subProgresivasGeneradas.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-medium text-gray-800">Progresivas Generadas ({subProgresivasGeneradas.length})</h4>
                        <ul className="list-disc list-inside mt-2 text-sm text-gray-600" style={{maxHeight: '100px', overflowY: 'auto'}}>
                          {subProgresivasGeneradas.map((p, i) => <li key={i}>{p.nombre}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleCancel}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : (isEditing ? 'Actualizar Proyecto' : 'Crear Proyecto')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
