import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import '../ProyectosV2.css'; // Import the new CSS
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from './SharedComponents'; // Using SharedComponents where possible, but keeping custom form layout
import { useAuth } from '../../../../../data/contexts/AuthContext';

const FullProjectForm = ({ isOpen, onClose, onSave, projectData }) => {
    const API_URL = process.env.REACT_APP_API_BASE || '';
    const { user } = useAuth();
    const token = user?.token;

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
        longitud_total_progresiva: '',
        tipo_via_progresiva: '500',
        intervalo_manual_progresiva: '',
        isIntervalManual_progresiva: false,
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

    // Catalogs
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const [entidadesSolicitantes, setEntidadesSolicitantes] = useState([]);
    const [otrasEntidades, setOtrasEntidades] = useState([]);

    // UI States
    const [isProyectoNomManual, setIsProyectoNomManual] = useState(false);
    const [isSolicitanteManual, setIsSolicitanteManual] = useState(false);
    const [kmlFile, setKmlFile] = useState(null);
    const [isUploadingKml, setIsUploadingKml] = useState(false);
    const [subProgresivasGeneradas, setSubProgresivasGeneradas] = useState([]); // Kept for logic compatibility

    useEffect(() => {
        if (isOpen && projectData) {
            // Load project data into form
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
                longitud_total_progresiva: projectData.longitud_total || '',
                tipo_via_progresiva: projectData.tipo_via || '500',
                intervalo_manual_progresiva: projectData.intervalo_manual || '',
                isIntervalManual_progresiva: projectData.is_interval_manual || false,
                // Load First Progresiva info if available
                nombre_progresiva: projectData.progresivas?.[0]?.nombre || '',
                codigo_progresiva: projectData.progresivas?.[0]?.codigo || '',
                linea_progresiva: projectData.progresivas?.[0]?.linea || '18L',
                coordenada_este_progresiva: projectData.progresivas?.[0]?.coordenada_este || '',
                coordenada_norte_progresiva: projectData.progresivas?.[0]?.coordenada_norte || '',
                descripcion_progresiva: projectData.progresivas?.[0]?.descripcion || '',
                estado_progresiva: projectData.progresivas?.[0]?.estado || 'activo',
            });

            // Trigger province/district load is handled by useEffects below?
            // Need to manually trigger or let effects run. Effects depend on formData.departamento
        }
    }, [isOpen, projectData]);

    // Fetch Catalogs
    useEffect(() => {
        if (!isOpen) return;

        const fetchCatalogs = async () => {
            try {
                // Using relative paths to data might be tricky if not imported.
                // Assuming endpoints exist for these (as per FormularioProyecto.jsx)
                // Formulario uses: /codigo_departamentos, /api/entidades-solicitantes, /api/otras-entidades
                // And /provincias/:id, /distritos/:id

                const headers = { Authorization: `Bearer ${token}` };

                // Departments - Check if endpoint works, otherwise I might need to import JSON if frontend-only
                // FormularioProyecto.jsx used axios.get(`${API_URL}/codigo_departamentos`)
                const depsRes = await axios.get(`${API_URL}/codigo_departamentos`, { headers }).catch(() => ({ data: [] }));
                setDepartamentos(depsRes.data);

                const entRes = await axios.get(`${API_URL}/api/entidades-solicitantes`, { headers }).catch(() => ({ data: [] }));
                setEntidadesSolicitantes(entRes.data);

                const otrasRes = await axios.get(`${API_URL}/api/otras-entidades`, { headers }).catch(() => ({ data: [] }));
                setOtrasEntidades(otrasRes.data);

            } catch (error) {
                console.error("Error fetching catalogs", error);
            }
        };
        fetchCatalogs();
    }, [isOpen, API_URL, token]);

    // Load Provinces
    useEffect(() => {
        if (formData.departamento && token) {
            axios.get(`${API_URL}/provincias/${formData.departamento}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setProvincias(res.data))
                .catch(err => console.error(err));
        } else {
            setProvincias([]);
        }
    }, [formData.departamento, API_URL, token]);

    // Load Districts
    useEffect(() => {
        if (formData.provincia && token) {
            axios.get(`${API_URL}/distritos/${formData.provincia}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setDistritos(res.data))
                .catch(err => console.error(err));
        } else {
            setDistritos([]);
        }
    }, [formData.provincia, API_URL, token]);

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
        const totalLength = parseFloat(formData.longitud_total_progresiva);
        let interval = parseFloat(formData.tipo_via_progresiva);
        if (formData.isIntervalManual_progresiva) {
            interval = parseFloat(formData.intervalo_manual_progresiva);
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

        // Prepare Data
        const projectDataPayload = {
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

        try {
            const headers = { Authorization: `Bearer ${token}` };

            // Logic form proyectos.jsx: PUT with { projectData, progresivaData }
            // This assumes the backend handles creating the parent progresiva if it's new/updated within the PUT
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
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Completar Información del Proyecto</h3>
                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Información General</legend>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre del Tramo</label>
                                <input type="text" name="nombre_tramo" value={formData.nombre_tramo} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Entidad Solicitante</label>
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
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Ubicación Geográfica</legend>
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
                                <select name="provincia" value={formData.provincia} onChange={handleInputChange} required>
                                    <option value="">Seleccione</option>
                                    {provincias.map(p => <option key={p.id} value={p.id}>{p.name || p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Distrito</label>
                                <select name="distrito" value={formData.distrito} onChange={handleInputChange} required>
                                    <option value="">Seleccione</option>
                                    {distritos.map(d => <option key={d.id} value={d.id}>{d.name || d.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Trazado KML</legend>
                        <div className="form-group">
                            <label>Archivo KML/KMZ</label>
                            <input type="file" accept=".kml,.kmz" onChange={(e) => setKmlFile(e.target.files[0])} disabled={isUploadingKml} />
                            {originalProject?.kml_filename && !kmlFile && (
                                <p className="file-info">Actual: {originalProject.kml_filename}</p>
                            )}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Progresiva Principal</legend>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nombre Progresiva</label>
                                <input type="text" name="nombre_progresiva" value={formData.nombre_progresiva} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Longitud Total (m)</label>
                                <input type="number" name="longitud_total_progresiva" value={formData.longitud_total_progresiva} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Intervalo</label>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {!formData.isIntervalManual_progresiva ? (
                                        <select name="tipo_via_progresiva" value={formData.tipo_via_progresiva} onChange={handleInputChange} className="flex-1">
                                            <option value="100">100m (Tipo I)</option>
                                            <option value="250">250m (Tipo II)</option>
                                            <option value="500">500m (Tipo III)</option>
                                            <option value="1000">1000m (Tipo IV)</option>
                                        </select>
                                    ) : (
                                        <input type="number" name="intervalo_manual_progresiva" value={formData.intervalo_manual_progresiva} onChange={handleInputChange} className="flex-1" />
                                    )}
                                    <button type="button" className="btn-toggle-intervalo" onClick={() => setFormData(p => ({ ...p, isIntervalManual_progresiva: !p.isIntervalManual_progresiva }))}>
                                        {formData.isIntervalManual_progresiva ? 'Lista' : 'Manual'}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Coordenada Este</label>
                                <input type="text" name="coordenada_este_progresiva" value={formData.coordenada_este_progresiva} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Coordenada Norte</label>
                                <input type="text" name="coordenada_norte_progresiva" value={formData.coordenada_norte_progresiva} onChange={handleInputChange} />
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

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={isUploadingKml}>Cancelar</button>
                        <button type="submit" className="btn" disabled={isUploadingKml}>
                            {isUploadingKml ? 'Guardando...' : 'Guardar y Finalizar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FullProjectForm;
