import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import './GestorProyectos.css';

const FormularioProyecto = ({ onClose, onSave, proyectoData }) => {
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
        longitud_total: '',
        progresiva_inicial: '0+000',
        tipo_via: '500',
        intervalo_manual: '',
        isIntervalManual: false,
        // Campos de Progresivas (para la progresiva principal)
        nombre_progresiva: '',
        linea_progresiva: '18L',
        coordenada_este_progresiva: '',
        coordenada_norte_progresiva: '',
        descripcion_progresiva: '',
        estado_progresiva: 'activo',
    };

    const [formData, setFormData] = useState(proyectoData || initialFormData);
    const [kmlFile, setKmlFile] = useState(null);
    const [isUploadingKml, setIsUploadingKml] = useState(false);
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const [entidadesSolicitantes, setEntidadesSolicitantes] = useState([]);
    const [otrasEntidades, setOtrasEntidades] = useState([]);
    const [isProyectoNomManual, setIsProyectoNomManual] = useState(false);
    const [isSolicitanteManual, setIsSolicitanteManual] = useState(false);

    const API_URL = process.env.REACT_APP_API_BASE || '';
    const token = JSON.parse(localStorage.getItem('usuario'))?.token;

    // Fetch Ubigeo data and entities
    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [depsRes, entSolicitantesRes, otrasEntidadesRes] = await Promise.all([
                    axios.get(`${API_URL}/codigo_departamentos`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/entidades-solicitantes`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/otras-entidades`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                setDepartamentos(depsRes.data);
                setEntidadesSolicitantes(entSolicitantesRes.data);
                setOtrasEntidades(otrasEntidadesRes.data);
            } catch (err) {
                console.error("Error fetching catalogs:", err);
                alertify.error("Error al cargar catálogos.");
            }
        };
        fetchCatalogs();
    }, [API_URL, token]);

    // Fetch provincias when departamento changes
    useEffect(() => {
        const fetchProvincias = async () => {
            if (formData.departamento) {
                try {
                    const res = await axios.get(`${API_URL}/provincias/${formData.departamento}`, { headers: { 'Authorization': `Bearer ${token}` } });
                    setProvincias(res.data);
                    setFormData(prev => ({ ...prev, provincia: '', distrito: '' }));
                } catch (err) {
                    console.error("Error fetching provincias:", err);
                    alertify.error("Error al cargar provincias.");
                }
            } else {
                setProvincias([]);
            }
        };
        fetchProvincias();
    }, [formData.departamento, API_URL, token]);

    // Fetch distritos when provincia changes
    useEffect(() => {
        const fetchDistritos = async () => {
            if (formData.provincia) {
                try {
                    const res = await axios.get(`${API_URL}/distritos/${formData.provincia}`, { headers: { 'Authorization': `Bearer ${token}` } });
                    setDistritos(res.data);
                    setFormData(prev => ({ ...prev, distrito: '' }));
                } catch (err) {
                    console.error("Error fetching distritos:", err);
                    alertify.error("Error al cargar distritos.");
                }
            } else {
                setDistritos([]);
            }
        };
        fetchDistritos();
    }, [formData.provincia, API_URL, token]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleKmlFileChange = (e) => {
        setKmlFile(e.target.files[0]);
    };

    const toggleProyectoNomManual = () => {
        setIsProyectoNomManual(prev => !prev);
        setFormData(prev => ({ ...prev, proyecto_nom: '' }));
    };

    const toggleSolicitanteManual = () => {
        setIsSolicitanteManual(prev => !prev);
        setFormData(prev => ({ ...prev, solicitante: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const projectData = {
            nombre_tramo: formData.nombre_tramo,
            proyecto_nom: formData.proyecto_nom,
            solicitante: formData.solicitante,
            departamento: formData.departamento,
            provincia: formData.provincia,
            distrito: formData.distrito,
            localidad: formData.localidad,
            longitud_total: parseFloat(formData.longitud_total),
            progresiva_inicial: '0+000', // Siempre 0+000 para el proyecto principal
            tipo_via: formData.tipo_via,
            intervalo_manual: formData.isIntervalManual ? parseFloat(formData.intervalo_manual) : null,
            descripcion_larga: formData.descripcion_larga,
            estado: formData.estado,
        };

        const parentProgresiva = {
            nombre: formData.nombre_progresiva,
            linea: formData.linea_progresiva,
            coordenada_este: formData.coordenada_este_progresiva,
            coordenada_norte: formData.coordenada_norte_progresiva,
            descripcion: formData.descripcion_progresiva,
            estado: formData.estado_progresiva,
            estratos_perfil: [], // Se manejarán en el formulario de progresivas
        };

        const generationParams = {
            valorTotal: parseFloat(formData.longitud_total),
            intervalo: formData.isIntervalManual ? parseFloat(formData.intervalo_manual) : parseFloat(formData.tipo_via),
        };

        const dataToSend = {
            projectData,
            progresivaData: { parentProgresiva, generationParams },
        };

        try {
            let projectIdToUpdate = proyectoData ? proyectoData.id : null;

            if (proyectoData) {
                // Lógica para actualizar proyecto existente
                await axios.put(`${API_URL}/proyectos/${proyectoData.id}`, dataToSend.projectData, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                alertify.success("Proyecto actualizado correctamente.");
            } else {
                // Lógica para crear nuevo proyecto
                const createRes = await axios.post(`${API_URL}/proyectos/create-full`, dataToSend, {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                });
                projectIdToUpdate = createRes.data.projectId; // Get the newly created project ID
                alertify.success("Proyecto creado correctamente.");
            }

            // --- KML Upload Logic ---
            if (kmlFile && projectIdToUpdate) {
                setIsUploadingKml(true);
                const kmlFormData = new FormData();
                kmlFormData.append('kmlFile', kmlFile);

                try {
                    await axios.post(`${API_URL}/api/proyectos/${projectIdToUpdate}/upload-kml`, kmlFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    alertify.success("Archivo KML cargado correctamente.");
                    setKmlFile(null); // Clear selected file after upload
                } catch (kmlUploadError) {
                    console.error("Error al subir archivo KML:", kmlUploadError);
                    alertify.error(`Error al subir KML: ${kmlUploadError.response?.data?.error || kmlUploadError.message}`);
                } finally {
                    setIsUploadingKml(false);
                }
            }
            // --- End KML Upload Logic ---

            onSave(); // Notificar al padre que se guardó
            onClose(); // Cerrar el modal
        } catch (error) {
            console.error("Error al guardar proyecto:", error);
            alertify.error(`Error al guardar proyecto: ${error.response?.data?.error || error.message}`);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{proyectoData ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Información del Tramo</legend>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="nombre_tramo">Nombre del Tramo</label>
                                <input type="text" id="nombre_tramo" name="nombre_tramo" value={formData.nombre_tramo} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="proyecto_nom">{isProyectoNomManual ? "Entidad" : "Entidad Solicitante"}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isProyectoNomManual ? (
                                        <input type="text" id="proyecto_nom" name="proyecto_nom" value={formData.proyecto_nom} onChange={handleInputChange} placeholder="Escriba la entidad" required />
                                    ) : (
                                        <select id="proyecto_nom" name="proyecto_nom" value={formData.proyecto_nom} onChange={handleInputChange} required>
                                            <option value="">Seleccione</option>
                                            {entidadesSolicitantes.map(e => (
                                                <option key={e.id} value={e.nombre}>{e.nombre}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button type="button" onClick={toggleProyectoNomManual} className="btn-toggle-input">
                                        {isProyectoNomManual ? "Seleccionar" : "Escribir"}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="solicitante">{isSolicitanteManual ? "Persona/Entidad" : "Otra Entidad/Persona"}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isSolicitanteManual ? (
                                        <input type="text" id="solicitante" name="solicitante" value={formData.solicitante} onChange={handleInputChange} placeholder="Escriba la persona/entidad" />
                                    ) : (
                                        <select id="solicitante" name="solicitante" value={formData.solicitante} onChange={handleInputChange}>
                                            <option value="">Seleccione</option>
                                            {otrasEntidades.map(e => (
                                                <option key={e.id} value={e.nombre}>{e.nombre}</option>
                                            ))}
                                        </select>
                                    )}
                                    <button type="button" onClick={toggleSolicitanteManual} className="btn-toggle-input">
                                        {isSolicitanteManual ? "Seleccionar" : "Escribir"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Ubicación</legend>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="departamento">Departamento</label>
                                <select id="departamento" name="departamento" value={formData.departamento} onChange={handleInputChange} required>
                                    <option value="">Seleccione Departamento</option>
                                    {departamentos.map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="provincia">Provincia</label>
                                <select id="provincia" name="provincia" value={formData.provincia} onChange={handleInputChange} required disabled={!formData.departamento || provincias.length === 0}>
                                    <option value="">Seleccione Provincia</option>
                                    {provincias.map(prov => (
                                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="distrito">Distrito</label>
                                <select id="distrito" name="distrito" value={formData.distrito} onChange={handleInputChange} required disabled={!formData.provincia || distritos.length === 0}>
                                    <option value="">Seleccione Distrito</option>
                                    {distritos.map(dist => (
                                        <option key={dist.id} value={dist.id}>{dist.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="localidad">Localidad (Opcional)</label>
                                <input type="text" id="localidad" name="localidad" value={formData.localidad} onChange={handleInputChange} />
                            </div>
                        </div>
                    </fieldset>

                    {/* NEW: KML Upload Section */}
                    <fieldset>
                        <legend>Trazado KML</legend>
                        <div className="form-group">
                            <label htmlFor="kmlFile">Archivo KML/KMZ</label>
                            <input
                                type="file"
                                id="kmlFile"
                                name="kmlFile"
                                accept=".kml,.kmz"
                                onChange={handleKmlFileChange}
                                disabled={isUploadingKml}
                                required={!proyectoData}
                            />
                            {kmlFile && (
                                <p className="file-info">Archivo seleccionado: {kmlFile.name}</p>
                            )}
                            {proyectoData?.kml_filename && (
                                <p className="file-info">
                                    KML actual: {proyectoData.kml_filename} (cargado el {new Date(proyectoData.kml_uploaded_at).toLocaleDateString()})
                                    <br />
                                    <small>Selecciona un nuevo archivo para reemplazarlo.</small>
                                </p>
                            )}
                            {isUploadingKml && (
                                <p className="loading-text">Subiendo KML... por favor espera.</p>
                            )}
                        </div>
                    </fieldset>
                    {/* END NEW: KML Upload Section */}

                    {!proyectoData && (
                        <fieldset>
                            <legend>Progresiva Principal (Generación)</legend>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nombre Progresiva</label>
                                    <input type="text" name="nombre_progresiva" value={formData.nombre_progresiva} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Longitud Total (metros)</label>
                                    <input type="number" name="longitud_total" value={formData.longitud_total} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Intervalo (metros)</label>
                                    <div className="intervalo-container">
                                        {formData.isIntervalManual ? (
                                            <input type="number" name="intervalo_manual" value={formData.intervalo_manual} onChange={handleInputChange} className="intervalo-input" required />
                                        ) : (
                                            <select name="tipo_via" value={formData.tipo_via} onChange={handleInputChange} className="intervalo-select" required>
                                                <option value="100">TIPO I - Autopistas (100m)</option>
                                                <option value="250">Tipo II - Vias principales (250m)</option>
                                                <option value="500">Tipo III - Vias secundarias (500m)</option>
                                                <option value="1000">Tipo IV Vias locales (1000m)</option>
                                            </select>
                                        )}
                                        <button type="button" className="btn-toggle-intervalo" onClick={() => setFormData(prev => ({ ...prev, isIntervalManual: !prev.isIntervalManual, intervalo_manual: '' }))}>
                                            {formData.isIntervalManual ? "Seleccionar" : "Manual"}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Zona</label>
                                    <select name="linea_progresiva" value={formData.linea_progresiva} onChange={handleInputChange} required>
                                        <option value="17L">17L</option>
                                        <option value="18L">18L</option>
                                        <option value="19L">19L</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Coordenada Este</label>
                                    <input type="text" name="coordenada_este_progresiva" value={formData.coordenada_este_progresiva} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Coordenada Norte</label>
                                    <input type="text" name="coordenada_norte_progresiva" value={formData.coordenada_norte_progresiva} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Estado Progresiva</label>
                                    <select name="estado_progresiva" value={formData.estado_progresiva} onChange={handleInputChange} required>
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                        <option value="completado">Completado</option>
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>Descripción Progresiva</label>
                                    <textarea name="descripcion_progresiva" value={formData.descripcion_progresiva} onChange={handleInputChange} rows="2"></textarea>
                                </div>
                            </div>
                        </fieldset>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn">Guardar Proyecto</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioProyecto;
