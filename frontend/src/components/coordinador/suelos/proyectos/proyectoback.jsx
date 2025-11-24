import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './proyectos.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import { useAuth } from '../../../data/contexts/AuthContext'; // Import useAuth
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

// Import local Ubigeo data
import departamentosData from '../../../data/ubigeo/ubigeo_peru_2016_departamentos.json';
import provinciasData from '../../../data/ubigeo/ubigeo_peru_2016_provincias.json';
import distritosData from '../../../data/ubigeo/ubigeo_peru_2016_distritos.json';

export default function Proyectos() {
    const API_URL = process.env.REACT_APP_API_BASE || '';
    const navigate = useNavigate();

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
    const [proyectos, setProyectos] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    const [subProgresivasGeneradas, setSubProgresivasGeneradas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isProyectoNomManual, setIsProyectoNomManual] = useState(false);
    const [isSolicitanteManual, setIsSolicitanteManual] = useState(false);

    const [entidadesSolicitantes, setEntidadesSolicitantes] = useState([]);
    const [otrasEntidades, setOtrasEntidades] = useState([]);

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
            const res = await axios.get(`${API_URL}/proyectos/detallado`, { headers });
            setProyectos(res.data);
        } catch (error) {
            if (error.message !== 'Token no proporcionado') {
                console.error("Error al cargar proyectos:", error);
                alertify.error("Error al cargar la lista de proyectos.");
            }
        } finally {
            setLoading(false);
        }
    }, [API_URL, getAuthHeaders]);

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

    useEffect(() => {
        setDepartamentos(departamentosData);
        fetchProyectos();
        fetchEntidades();
    }, [fetchProyectos, fetchEntidades]);

    useEffect(() => {
        if (formData.departamento) {
            const filteredProvinces = provinciasData.filter(prov => prov.department_id === formData.departamento);
            setProvincias(filteredProvinces);
            setDistritos([]);
            setFormData(prev => ({ ...prev, provincia: '', distrito: '' }));
        } else {
            setProvincias([]);
            setDistritos([]);
        }
    }, [formData.departamento]);

    useEffect(() => {
        if (formData.provincia) {
            const filteredDistricts = distritosData.filter(dist => dist.province_id === formData.provincia);
            setDistritos(filteredDistricts);
            setFormData(prev => ({ ...prev, distrito: '' }));
        } else {
            setDistritos([]);
        }
    }, [formData.provincia]);


    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'nombre_progresiva') {
            const codigo = value.toUpperCase().replace(/\s/g, '-');
            setFormData(prev => ({ ...prev, nombre_progresiva: value, codigo_progresiva: codigo }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
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

        if (subProgresivasGeneradas.length === 0 && !isEditing) { // Only require generated progresivas for new projects
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
                codigo: formData.codigo_progresiva, // Add this line
                nombre: formData.nombre_progresiva,
                linea: formData.linea_progresiva,
                coordenada_este: formData.coordenada_este_progresiva,
                coordenada_norte: formData.coordenada_norte_progresiva,
                descripcion: formData.descripcion_progresiva,
                estado: formData.estado_progresiva,
            };

            const progresivaData = {
                parentProgresiva,
                generatedChildren: subProgresivasGeneradas // This will be empty for edits unless re-generated
            };

            if (isEditing) {
                await axios.put(`${API_URL}/proyectos/${formData.id}`, {
                    projectData,
                    progresivaData // Send progressive data for update as well
                }, {
                    headers: { ...headers, 'Content-Type': 'application/json' }
                });
                alertify.success("Proyecto actualizado correctamente.");
            } else {
                await axios.post(`${API_URL}/proyectos/create-full`, {
                    projectData,
                    progresivaData
                }, {
                    headers: { ...headers, 'Content-Type': 'application/json' }
                });
                alertify.success("Proyecto y Tramo guardados correctamente.");
            }

            setShowForm(false);
            fetchProyectos();
            setFormData(initialFormData);
            setSubProgresivasGeneradas([]);
            setIsEditing(false); // Reset editing state

        } catch (error) {
            if (error.message === 'Token no proporcionado') {
                // The getAuthHeaders function already handles the alert and navigation
            } else if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                alertify.error('Tu sesión ha expirado o no tienes permiso. Por favor, inicia sesión de nuevo.');
                navigate('/login');
            } else if (error.response) {
                alertify.error(`Error: ${error.response.data.error || error.message}`);
            } else {
                alertify.error(`Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData(initialFormData);
        setSubProgresivasGeneradas([]);
        setIsEditing(false); // Reset editing state
    };

    const handleEditProject = async (proyectoId) => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const res = await axios.get(`${API_URL}/proyectos/${proyectoId}`, { headers });
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
                longitud_total_progresiva: projectToEdit.longitud_total,
                tipo_via_progresiva: projectToEdit.tipo_via,
                intervalo_manual_progresiva: projectToEdit.intervalo_manual,
                isIntervalManual_progresiva: projectToEdit.isIntervalManual,
                nombre_progresiva: projectToEdit.progresivas[0]?.nombre || '',
                linea_progresiva: projectToEdit.progresivas[0]?.linea || '18L',
                coordenada_este_progresiva: projectToEdit.progresivas[0]?.coordenada_este || '',
                coordenada_norte_progresiva: projectToEdit.progresivas[0]?.coordenada_norte || '',
                descripcion_progresiva: projectToEdit.progresivas[0]?.descripcion || '',
                estado_progresiva: projectToEdit.progresivas[0]?.estado || 'activo',
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
                    await axios.delete(`${API_URL}/proyectos/${proyectoId}`, { headers });
                    setProyectos(proyectos.filter((proyecto) => proyecto.id !== proyectoId));
                    alertify.success("Proyecto eliminado correctamente");
                } catch (error) {
                    console.error("Error al eliminar el proyecto:", error);
                    alertify.error("Error al eliminar el proyecto");
                }
            },
            function() { alertify.message('Eliminación cancelada.'); }
        ).set('labels', {ok:'Eliminar', cancel:'Cancelar'});
    };

    const handleExportarExcel = async () => {
        try {
            const dataToExport = [
                ["Campo", "Valor"],
                ["Nombre del Tramo", formData.nombre_tramo],
                ["Entidad Solicitante", formData.proyecto_nom],
                ["Solicitante", formData.solicitante],
                ["Departamento", getDepartmentName(formData.departamento)],
                ["Provincia", getProvinceName(formData.provincia)],
                ["Distrito", getDistrictName(formData.distrito)],
                ["Localidad", formData.localidad],
                ["Longitud Total (m)", formData.longitud_total_progresiva],
                ["Progresiva Inicial", '0+000'],
                ["Tipo de Vía", formData.tipo_via_progresiva],
                ["Intervalo Manual", formData.intervalo_manual_progresiva || 'N/A'],
                ["Descripción Larga", formData.descripcion_larga],
                ["Estado", formData.estado],
                ["Nombre Progresiva", formData.nombre_progresiva],
                ["Línea Progresiva", formData.linea_progresiva],
                ["Coordenada Este", formData.coordenada_este_progresiva],
                ["Coordenada Norte", formData.coordenada_norte_progresiva],
                ["Descripción Progresiva", formData.descripcion_progresiva],
                ["Estado Progresiva", formData.estado_progresiva],
                ["Valor Total Sub-Progresivas", parseFloat(formData.longitud_total_progresiva)],
                ["Intervalo Sub-Progresivas", formData.isIntervalManual_progresiva ? parseFloat(formData.intervalo_manual_progresiva) : parseFloat(formData.tipo_via_progresiva)],
            ];

            const ws = XLSX.utils.aoa_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Datos del Proyecto");

            // Generar el archivo Excel
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
            FileSaver.saveAs(data, `Proyecto_${formData.nombre_tramo || 'NuevoProyecto'}.xlsx`);

            alertify.success("Datos exportados a Excel correctamente.");
        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            alertify.error("Error al exportar a Excel.");
        }
    };

    const handleImportarExcel = async (e) => {
        alertify.warning("Funcionalidad de Importar Excel en desarrollo.");
    };

    return (
        <div className="proyectos-container">
            {loading && <div className="loading-overlay">Cargando...</div>}

            {/* Formulario Modal */}
            {showForm && (
                <div className="overlay">
                    <div className="progresivas-form-container"> {/* Re-using class from Progresivas.jsx for similar styling */}
                        <form className="proyecto-form" onSubmit={handleGuardar}>
                            <h3>Nuevo Proyecto y Tramo Inicial</h3>

                            <fieldset>
                                <legend>1. Información del Proyecto</legend>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="nombre_tramo">Nombre del Proyecto</label>
                                        <input type="text" id="nombre_tramo" name="nombre_tramo" value={formData.nombre_tramo} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="proyecto_nom">Entidad Solicitante</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {isProyectoNomManual ? (
                                                <input type="text" id="proyecto_nom" name="proyecto_nom" value={formData.proyecto_nom} onChange={handleInputChange} placeholder="Escriba la entidad" required />
                                            ) : (
                                                <select id="proyecto_nom" name="proyecto_nom" value={formData.proyecto_nom} onChange={handleInputChange} required>
                                                    <option value="">Seleccione</option>
                                                    {entidadesSolicitantes.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                                                </select>
                                            )}
                                            <button type="button" onClick={toggleProyectoNomManual} className="btn-toggle-input">{isProyectoNomManual ? "Seleccionar" : "Escribir"}</button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="solicitante">Otra Entidad/Persona</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {isSolicitanteManual ? (
                                                <input type="text" id="solicitante" name="solicitante" value={formData.solicitante} onChange={handleInputChange} placeholder="Escriba la persona/entidad" />
                                            ) : (
                                                <select id="solicitante" name="solicitante" value={formData.solicitante} onChange={handleInputChange}>
                                                    <option value="">Seleccione</option>
                                                    {otrasEntidades.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                                                </select>
                                            )}
                                            <button type="button" onClick={toggleSolicitanteManual} className="btn-toggle-input">{isSolicitanteManual ? "Seleccionar" : "Escribir"}</button>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend>2. Ubicación</legend>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="departamento">Departamento</label>
                                        <select id="departamento" name="departamento" value={formData.departamento} onChange={handleInputChange} required>
                                            <option value="">Seleccione</option>
                                            {departamentos.map(dep => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="provincia">Provincia</label>
                                        <select id="provincia" name="provincia" value={formData.provincia} onChange={handleInputChange} required disabled={!formData.departamento || provincias.length === 0}>
                                            <option value="">Seleccione</option>
                                            {provincias.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="distrito">Distrito</label>
                                        <select id="distrito" name="distrito" value={formData.distrito} onChange={handleInputChange} required disabled={!formData.provincia || distritos.length === 0}>
                                            <option value="">Seleccione</option>
                                            {distritos.map(dist => <option key={dist.id} value={dist.id}>{dist.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="localidad">Localidad (Opcional)</label>
                                        <input type="text" id="localidad" name="localidad" value={formData.localidad} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend>3. Tramo</legend>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nombre del Tramo</label>
                                        <input type="text" name="nombre_progresiva" value={formData.nombre_progresiva} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Código del Tramo</label>
                                        <input
                                            type="number"
                                            name="codigo_progresiva"
                                            value={formData.codigo_progresiva}
                                            onChange={handleInputChange}
                                            placeholder="ejem 0000"
                                            required
                                            min="0"
                                            step="1"
                                            max="9999"
                                            disabled={isEditing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Valor Total (metros)</label>
                                        <input type="number" name="longitud_total_progresiva" value={formData.longitud_total_progresiva} onChange={handleInputChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Intervalo (metros)</label>
                                        <div className="intervalo-container">
                                            {formData.isIntervalManual_progresiva ? (
                                                <input type="number" name="intervalo_manual_progresiva" value={formData.intervalo_manual_progresiva} onChange={handleInputChange} className="intervalo-input" />
                                            ) : (
                                                <select name="tipo_via_progresiva" value={formData.tipo_via_progresiva} onChange={handleInputChange} className="intervalo-select">
                                                    <option value="100">TIPO I - Autopistas (100m)</option>
                                                    <option value="250">Tipo II - Vias principales (250m)</option>
                                                    <option value="500">Tipo III - Vias secundarias (500m)</option>
                                                    <option value="1000">Tipo IV Vias locales (1000m)</option>
                                                </select>
                                            )}
                                            <button type="button" className="btn-toggle-intervalo" onClick={() => setFormData(prev => ({ ...prev, isIntervalManual_progresiva: !prev.isIntervalManual_progresiva, intervalo_manual_progresiva: '' }))}>
                                                {formData.isIntervalManual_progresiva ? 'Seleccionar' : 'Manual'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Zona</label>
                                        <select name="linea_progresiva" value={formData.linea_progresiva} onChange={handleInputChange}>
                                            <option value="17L">17L</option>
                                            <option value="18L">18L</option>
                                            <option value="19L">19L</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Ubicación (Coordenadas)</label>
                                        <div className="coordenadas-group">
                                            <input type="text" name="coordenada_este_progresiva" placeholder="Coord. Este" value={formData.coordenada_este_progresiva} onChange={handleInputChange} />
                                            <input type="text" name="coordenada_norte_progresiva" placeholder="Coord. Norte" value={formData.coordenada_norte_progresiva} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                     <div className="form-group">
                                        <label>Estado del Tramo</label>
                                        <select name="estado_progresiva" value={formData.estado_progresiva} onChange={handleInputChange} required>
                                            <option value="activo">Activo</option>
                                            <option value="inactivo">Inactivo</option>
                                            <option value="completado">Completado</option>
                                        </select>
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Descripción del Tramo</label>
                                        <textarea name="descripcion_progresiva" value={formData.descripcion_progresiva} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group full-width">
                                        <button type="button" onClick={handleGenerarProgresivas} className="btn-generar-progresivas">Generar Progresivas</button>
                                        {subProgresivasGeneradas.length > 0 && (
                                            <div className="sub-progresivas-container">
                                                <h4>Progresivas Generadas ({subProgresivasGeneradas.length})</h4>
                                                <ul className="sub-progresivas-list">
                                                    {subProgresivasGeneradas.map((p, i) => <li key={i}>{p.nombre}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </fieldset>

                            <div className="form-actions">
                                <button type="button" className="close-btn" onClick={handleCancel}>Cancelar</button>
                                <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Guardando...' : 'Crear Proyecto'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="proyectos-header">
                <h2>Listado de Proyectos</h2>
                <button className="btn-nuevo" onClick={() => setShowForm(true)}>
                    + Nuevo Proyecto
                </button>
            </div>

            <div className="tabla-contenedor">
                <table className="tabla-proyectos">
                    <thead>
                        <tr>
                            <th>Nombre Tramo</th>
                            <th>Entidad Solicitante</th>
                            <th>Ubicación</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proyectos.length > 0 ? (
                            proyectos.map(p => (
                                <tr key={p.id}>
                                    <td><div className="caja-sombreada">{p.nombre_tramo}</div></td>
                                    <td><div className="caja-sombreada">{p.proyecto_nom || 'N/A'}</div></td>
                                    <td><div className="caja-sombreada">{`${getDepartmentName(p.departamento)}, ${getProvinceName(p.provincia)}, ${getDistrictName(p.distrito)}`}</div></td>
                                    <td>
                                        <div className={`caja-sombreada estado-${p.estado ? p.estado.toLowerCase().replace(' ', '-') : 'desconocido'}`}>
                                            {p.estado || 'Desconocido'}
                                        </div>
                                    </td>
                                    <td className="actions-cell">
                                        <button onClick={() => handleEditProject(p.id)} className="edit-btn">Editar</button>
                                        <button onClick={() => handleDeleteProject(p.id)} className="delete-btn">Eliminar</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">No hay proyectos registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Helper function to get department name by ID
function getDepartmentName(id) {
    const dept = departamentosData.find(d => d.id === id);
    return dept ? dept.name : 'Desconocido';
}

// Helper function to get province name by ID
function getProvinceName(id) {
    const prov = provinciasData.find(p => p.id === id);
    return prov ? prov.name : 'Desconocido';
}

// Helper function to get district name by ID
function getDistrictName(id) {
    const dist = distritosData.find(d => d.id === id);
    return dist ? dist.name : 'Desconocido';
}