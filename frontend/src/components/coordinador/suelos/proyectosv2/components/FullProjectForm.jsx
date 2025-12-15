import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import '../ProyectosV2.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './SharedComponents';
import { useAuth } from '../../../../../data/contexts/AuthContext';

// Import Ubigeo JSONs (Fixing the path relative to component location)
// Component is in frontend/src/components/coordinador/suelos/proyectosv2/components
// JSONs are in frontend/src/data/ubigeo
import departamentosData from '../../../../../data/ubigeo/ubigeo_peru_2016_departamentos.json';
import provinciasData from '../../../../../data/ubigeo/ubigeo_peru_2016_provincias.json';
import distritosData from '../../../../../data/ubigeo/ubigeo_peru_2016_distritos.json';

const FullProjectForm = ({ isOpen, onClose, onSave, projectData }) => {
    const API_URL = process.env.REACT_APP_API_BASE || '';
    // Use localStorage directly like V1 to ensure token availability
    const token = JSON.parse(localStorage.getItem('user'))?.token;

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
        // Progresiva fields
        nombre_progresiva: '',
        codigo_progresiva: '',
        linea_progresiva: '18L',
        coordenada_este_progresiva: '',
        coordenada_norte_progresiva: '',
        descripcion_progresiva: '',
        estado_progresiva: 'activo',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [originalProject, setOriginalProject] = useState(null);

    // Debug state can be removed or kept minimal if needed, but JSON load is usually safe.
    const [debugError, setDebugError] = useState(null);

    // Catalogs (initialized with departments from JSON)
    const [departamentos, setDepartamentos] = useState(departamentosData || []);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    // Entities still fetched from API
    const [entidadesSolicitantes, setEntidadesSolicitantes] = useState([]);
    const [otrasEntidades, setOtrasEntidades] = useState([]);

    // UI States
    const [isProyectoNomManual, setIsProyectoNomManual] = useState(false);
    const [isSolicitanteManual, setIsSolicitanteManual] = useState(false);
    const [kmlFile, setKmlFile] = useState(null);
    const [isUploadingKml, setIsUploadingKml] = useState(false);
    const [subProgresivasGeneradas, setSubProgresivasGeneradas] = useState([]);

    // Initial Load & Catalog Fetching (Entities only via API)
    useEffect(() => {
        if (!isOpen) return;

        const fetchCatalogs = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch Entity lists only (API)
                // We use Promise.allSettled to avoid failing if one endpoint is down
                const results = await Promise.allSettled([
                    axios.get(`${API_URL}/api/entidades-solicitantes`, { headers }),
                    axios.get(`${API_URL}/api/otras-entidades`, { headers })
                ]);

                if (results[0].status === 'fulfilled') setEntidadesSolicitantes(results[0].value.data);
                if (results[1].status === 'fulfilled') setOtrasEntidades(results[1].value.data);

                // Initial Cascading Logic using JSONs
                if (projectData) {
                    // Populate Form
                    setOriginalProject(projectData);
                    setFormData({
                        id: projectData.id,
                        nombre_tramo: projectData.nombre_tramo || '',
                        proyecto_nom: projectData.proyecto_nom || '',
                        solicitante: projectData.solicitante || '',
                        departamento: projectData.departamento || '',
                        provincia: projectData.provincia || '',
                        distrito: projectData.distrito || '',
                        localidad: projectData.localidad || '',
                        descripcion_larga: projectData.descripcion_larga || '',
                        estado: projectData.estado || 'Activo',
                        longitud_total: projectData.longitud_total || '',
                        tipo_via: projectData.tipo_via || '500',
                        intervalo_manual: projectData.intervalo_manual || '',
                        isIntervalManual: projectData.is_interval_manual || false,
                        // Progresiva fields
                        nombre_progresiva: projectData.progresivas?.[0]?.nombre || '',
                        codigo_progresiva: projectData.progresivas?.[0]?.codigo || '',
                        linea_progresiva: projectData.progresivas?.[0]?.linea || '18L',
                        coordenada_este_progresiva: projectData.progresivas?.[0]?.coordenada_este || '',
                        coordenada_norte_progresiva: projectData.progresivas?.[0]?.coordenada_norte || '',
                        descripcion_progresiva: projectData.progresivas?.[0]?.descripcion || '',
                        estado_progresiva: projectData.progresivas?.[0]?.estado || 'activo',
                    });

                    // Pre-fill Sub-catalogs based on Project Data
                    if (projectData.departamento) {
                        const filteredProvs = provinciasData.filter(p => p.department_id === projectData.departamento);
                        setProvincias(filteredProvs);
                    }
                    if (projectData.provincia) {
                        const filteredDists = distritosData.filter(d => d.province_id === projectData.provincia);
                        setDistritos(filteredDists);
                    }
                }
            } catch (err) {
                console.error("Error initializing form data", err);
                setDebugError(`Init Error: ${err.message}`);
            }
        };

        fetchCatalogs();
    }, [isOpen, API_URL, token, projectData]);

    // Reactive Cascading (Local Filtering)
    useEffect(() => {
        if (formData.departamento) {
            const filteredProvs = provinciasData.filter(p => p.department_id === formData.departamento);
            setProvincias(filteredProvs);
        } else {
            setProvincias([]);
        }
    }, [formData.departamento]);

    useEffect(() => {
        if (formData.provincia) {
            const filteredDists = distritosData.filter(d => d.province_id === formData.provincia);
            setDistritos(filteredDists);
        } else {
            setDistritos([]);
        }
    }, [formData.provincia]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const next = { ...prev, [name]: val };
            if (name === 'departamento') { next.provincia = ''; next.distrito = ''; }
            if (name === 'provincia') { next.distrito = ''; }
            if (name === 'nombre_progresiva') {
                next.codigo_progresiva = val.toUpperCase().replace(/\s/g, '-');
            }
            return next;
        });
    };

    const handleGenerarProgresivas = () => {
        const totalLength = parseFloat(formData.longitud_total);
        let interval = parseFloat(formData.tipo_via);
        if (formData.isIntervalManual) {
            interval = parseFloat(formData.intervalo_manual);
        }

        if (isNaN(totalLength) || totalLength <= 0) {
            alertify.error("Longitud Total inválida.");
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
        alertify.success(`${generated.length} sub-progresivas calculadas (Guardar para confirmar).`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const projectDataPayload = {
            nombre_tramo: formData.nombre_tramo,
            proyecto_nom: formData.proyecto_nom,
            solicitante: formData.solicitante,
            departamento: formData.departamento,
            provincia: formData.provincia,
            distrito: formData.distrito,
            localidad: formData.localidad,
            longitud_total: parseFloat(formData.longitud_total),
            progresiva_inicial: '0+000',
            tipo_via: formData.tipo_via,
            intervalo_manual: formData.isIntervalManual && formData.intervalo_manual !== '' ? parseFloat(formData.intervalo_manual) : null,
            descripcion_larga: formData.descripcion_larga,
            isIntervalManual: formData.isIntervalManual,
            estado: formData.estado,
        };

        const parentProgresiva = {
            codigo: formData.codigo_progresiva || (formData.nombre_progresiva ? formData.nombre_progresiva.toUpperCase().replace(/\s/g, '-') : ''),
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

        try {
            const headers = { Authorization: `Bearer ${token}` };

            // Logic matching V1 but adapted for V2 "completion" workflow
            await axios.put(`${API_URL}/proyectos/${formData.id}`, { projectData: projectDataPayload, progresivaData }, { headers });

            // KML Upload
            if (kmlFile) {
                setIsUploadingKml(true);
                const kmlData = new FormData();
                kmlData.append('kmlFile', kmlFile);
                await axios.post(`${API_URL}/api/proyectos/${formData.id}/upload-kml`, kmlData, {
                    headers: { ...headers, 'Content-Type': 'multipart/form-data' }
                });
                alertify.success("KML subido correctamente.");
            }

            alertify.success("Información del proyecto actualizada correctamente.");
            onSave();
            onClose();

        } catch (error) {
            console.error("Error saving project:", error);
            alertify.error(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsUploadingKml(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[900px] bg-white">
                <DialogHeader>
                    <DialogTitle>Completar Información del Proyecto</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                    {debugError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-xs">
                            Local Error: {debugError}
                        </div>
                    )}

                    <fieldset>
                        <legend>Información General</legend>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre del Tramo</label>
                                <input type="text" name="nombre_tramo" value={formData.nombre_tramo} onChange={handleInputChange} className="bg-white" />
                            </div>
                            <div className="form-group">
                                <label>{isProyectoNomManual ? "Entidad" : "Entidad Solicitante"}</label>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {!isProyectoNomManual ? (
                                        <select name="proyecto_nom" value={formData.proyecto_nom} onChange={handleInputChange} className="flex-1">
                                            <option value="">Seleccione</option>
                                            {entidadesSolicitantes.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                                        </select>
                                    ) : (
                                        <input type="text" name="proyecto_nom" value={formData.proyecto_nom} onChange={handleInputChange} className="flex-1" />
                                    )}
                                    <button type="button" className="btn-toggle-input" onClick={() => setIsProyectoNomManual(!isProyectoNomManual)}>
                                        {isProyectoNomManual ? 'Lista' : 'Manual'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>{isSolicitanteManual ? "Persona/Entidad" : "Otra Entidad/Persona"}</label>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {!isSolicitanteManual ? (
                                        <select name="solicitante" value={formData.solicitante} onChange={handleInputChange} className="flex-1">
                                            <option value="">Seleccione</option>
                                            {otrasEntidades.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                                        </select>
                                    ) : (
                                        <input type="text" name="solicitante" value={formData.solicitante} onChange={handleInputChange} className="flex-1" />
                                    )}
                                    <button type="button" className="btn-toggle-input" onClick={() => setIsSolicitanteManual(!isSolicitanteManual)}>
                                        {isSolicitanteManual ? 'Lista' : 'Manual'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Ubicación</legend>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Departamento</label>
                                <select name="departamento" value={formData.departamento} onChange={handleInputChange} required>
                                    <option value="">Seleccione</option>
                                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.name || d.nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Provincia</label>
                                <select name="provincia" value={formData.provincia} onChange={handleInputChange} required disabled={!formData.departamento}>
                                    <option value="">Seleccione</option>
                                    {provincias.map(p => <option key={p.id} value={p.id}>{p.name || p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Distrito</label>
                                <select name="distrito" value={formData.distrito} onChange={handleInputChange} required disabled={!formData.provincia}>
                                    <option value="">Seleccione</option>
                                    {distritos.map(d => <option key={d.id} value={d.id}>{d.name || d.nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Localidad (Opcional)</label>
                                <input type="text" name="localidad" value={formData.localidad} onChange={handleInputChange} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Trazado KML</legend>
                        <div className="form-group">
                            <label>Archivo KML/KMZ</label>
                            <input type="file" accept=".kml,.kmz" onChange={(e) => setKmlFile(e.target.files[0])} disabled={isUploadingKml} />
                            {originalProject?.kml_filename && !kmlFile && (
                                <p className="file-info text-xs text-blue-600 mt-1">Actual: {originalProject.kml_filename}</p>
                            )}
                        </div>
                    </fieldset>

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
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {!formData.isIntervalManual ? (
                                        <select name="tipo_via" value={formData.tipo_via} onChange={handleInputChange} className="flex-1">
                                            <option value="100">TIPO I (100m)</option>
                                            <option value="250">Tipo II (250m)</option>
                                            <option value="500">Tipo III (500m)</option>
                                            <option value="1000">Tipo IV (1000m)</option>
                                        </select>
                                    ) : (
                                        <input type="number" name="intervalo_manual" value={formData.intervalo_manual} onChange={handleInputChange} className="flex-1" />
                                    )}
                                    <button type="button" className="btn-toggle-intervalo" onClick={() => setFormData(p => ({ ...p, isIntervalManual: !p.isIntervalManual }))}>
                                        {formData.isIntervalManual ? 'Lista' : 'Manual'}
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
                                <textarea name="descripcion_progresiva" value={formData.descripcion_progresiva} onChange={handleInputChange} rows="2" className="w-full border rounded p-2"></textarea>
                            </div>
                            <div className="form-group full-width">
                                <button type="button" className="btn btn-outline" onClick={handleGenerarProgresivas}>
                                    Generar Sub-progresivas (Preview)
                                </button>
                                {subProgresivasGeneradas.length > 0 && (
                                    <span className="ml-2 text-green-600 text-sm"> {subProgresivasGeneradas.length} generadas</span>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    <DialogFooter className="mt-6">
                        <button type="button" className="btn btn-outline mr-2" onClick={onClose} disabled={isUploadingKml}>Cancelar</button>
                        <button type="submit" className="btn btn-primary bg-blue-600 text-white" disabled={isUploadingKml}>
                            {isUploadingKml ? 'Guardando...' : 'Guardar y Finalizar'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FullProjectForm;
