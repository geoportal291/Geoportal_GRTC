import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import '../ProyectosV2.css';

import { useAuth } from '../../../../../data/contexts/AuthContext';
import { DOMParser } from 'xmldom';
import * as toGeoJSON from '@tmcw/togeojson';
import shp from 'shpjs';
import { Button, Input, Select, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Card, CardHeader, CardTitle, CardContent } from './SharedComponents';

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
        // Nuevos campos del esquema
        codigo: '',
        nombre_proyecto: '',
        descripcion_proyecto: '',
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

    // Calibration States
    const [identifiedTramos, setIdentifiedTramos] = useState([]);
    const [calibrationData, setCalibrationData] = useState({});
    const [manualTramoCount, setManualTramoCount] = useState(0); // For manual override

    // -------------------------------------------------------------------------
    // KML / SHAPEFILE Handling
    // -------------------------------------------------------------------------

    // Helper: Process features generic (KML or Shapefile)
    const processGeoJSONFeatures = (features, existingData = null) => {
        const tramos = [];
        features.forEach(f => {
            // Check meaningful properties for name
            const name = f.properties?.name || f.properties?.Name || f.properties?.NAME || f.properties?.tramo || f.properties?.TRAMO;
            if (name) {
                tramos.push(name);
            }
        });

        // Sort tramos logically (Tramo 1, Tramo 2, etc.)
        tramos.sort((a, b) => {
            const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
            return numA - numB;
        });

        // Always update identified tramos
        setIdentifiedTramos(tramos);

        // Smart merge with existing calibration
        const baseCalibration = existingData || calibrationData;

        // Normalize base for case-insensitive check
        const normalizedBase = {};
        if (baseCalibration) {
            Object.keys(baseCalibration).forEach(k => {
                normalizedBase[k.toUpperCase()] = baseCalibration[k];
            });
        }

        const newCalib = { ...baseCalibration };

        // 1. Add detected tramos
        tramos.forEach(t => {
            const upperT = t.toUpperCase();
            if (normalizedBase[upperT]) {
                newCalib[t] = normalizedBase[upperT];
            } else if (!newCalib[t]) {
                newCalib[t] = { start: '', end: '' };
            }
        });

        setCalibrationData(newCalib);
    };

    const handleKmlUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        console.log("File selected:", file.name);

        setIsUploadingKml(true);
        try {
            // Upload to Blob (remote storage) - Note: backend token needed? Assuming existing logic worked or we use a public token here?
            // The previous code had a 'put' call but I don't see the import. 
            // WAIT - The previous code used a backend endpoint for uploading KML in handleSubmit, but here we seem to be wanting to preview it.
            // The snippet I replaced had `handleKmlFileChange`.
            // Let's stick to the previous pattern: 
            // 1. Set file to state (for submit later).
            // 2. Parse LOCALLY for preview.

            setKmlFile(file);
            setIdentifiedTramos([]);
            setCalibrationData({});

            // Parse content locally
            const reader = new FileReader();

            if (file.name.toLowerCase().endsWith('.zip')) {
                // Handle Shapefile (ZIP)
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        const geojson = await shp(arrayBuffer);
                        // shpjs might return a FeatureCollection or an array of them if zip has multiple shps
                        let features = [];
                        if (Array.isArray(geojson)) {
                            geojson.forEach(g => features = features.concat(g.features));
                        } else {
                            features = geojson.features;
                        }
                        processGeoJSONFeatures(features);
                        alertify.success(`Archivo ZIP analizado: ${features.length} elementos.`);
                    } catch (err) {
                        console.error("Error parsing Shapefile", err);
                        alertify.error("Error leyendo el archivo Shapefile (ZIP).");
                    }
                };
                reader.readAsArrayBuffer(file);

            } else {
                // Handle KML/KMZ (Text)
                reader.onload = (e) => {
                    const text = e.target.result;
                    parseKmlText(text);
                };
                reader.readAsText(file);
            }


        } catch (error) {
            console.error("Error processing file", error);
            alertify.error("Error al procesar el archivo.");
        } finally {
            setIsUploadingKml(false);
        }
    };

    const parseKmlText = (kmlText, existingData = null) => {
        try {
            const parser = new DOMParser();
            const kmlDom = parser.parseFromString(kmlText, 'text/xml');
            // use generic toGeoJSON.kml
            const geojson = toGeoJSON.kml(kmlDom);

            // Reuse generic processor
            processGeoJSONFeatures(geojson.features, existingData);

        } catch (error) {
            console.error("Error parsing KML", error);
        }
    };

    // Keep this for fetching remote existing ones
    const fetchAndParseRemoteKml = async (url, existingData = null) => {
        try {
            const proxyUrl = `${API_URL}/api/proxy?url=${encodeURIComponent(url)}`;

            // Simple check extension from URL
            if (url.toLowerCase().endsWith('.zip')) {
                const response = await axios.get(proxyUrl, { responseType: 'arraybuffer' });
                const geojson = await shp(response.data);
                let features = [];
                if (Array.isArray(geojson)) {
                    geojson.forEach(g => features = features.concat(g.features));
                } else {
                    features = geojson.features;
                }
                processGeoJSONFeatures(features, existingData);
            } else {
                const response = await axios.get(proxyUrl, { responseType: 'text' });
                parseKmlText(response.data, existingData);
            }
        } catch (error) {
            console.error("Error remote file via proxy", error);
            // Fallback direct?
            try {
                if (url.toLowerCase().endsWith('.zip')) {
                    // Direct fetch might fail CORS if generic.
                } else {
                    const response = await axios.get(url);
                    parseKmlText(response.data, existingData);
                }
            } catch (directError) {
                console.error("Direct download also failed", directError);
            }
        }
    };

    // Manual Tramo Handler
    const handleManualTramoCountChange = (e) => {
        const count = parseInt(e.target.value) || 0;
        setManualTramoCount(count);

        // Generate generic tramos if count > 0
        if (count > 0) {
            const newTramos = [];
            for (let i = 1; i <= count; i++) {
                newTramos.push(`TRAMO ${i}`);
            }
            setIdentifiedTramos(newTramos);

            // Sync calibration keys
            const newCalib = { ...calibrationData };
            newTramos.forEach(t => {
                if (!newCalib[t]) {
                    newCalib[t] = { start: '', end: '' };
                }
            });
            setCalibrationData(newCalib);
        }
    };
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

                // Fetch full project data to ensure calibration and KML URL are present
                let fullProject = projectData;
                if (projectData && projectData.id) {
                    try {
                        const projRes = await axios.get(`${API_URL}/api/proyectos/${projectData.id}`, { headers });
                        fullProject = projRes.data;
                    } catch (e) {
                        console.error("Could not fetch full project details, using fallback", e);
                    }
                }

                if (fullProject) {
                    // Populate Form
                    setOriginalProject(fullProject);
                    setFormData({
                        id: fullProject.id,
                        nombre_tramo: fullProject.nombre_tramo || '',
                        proyecto_nom: fullProject.proyecto_nom || '',
                        solicitante: fullProject.solicitante || '',
                        departamento: fullProject.departamento || '',
                        provincia: fullProject.provincia || '',
                        distrito: fullProject.distrito || '',
                        localidad: fullProject.localidad || '',
                        descripcion_larga: fullProject.descripcion_larga || '',
                        estado: fullProject.estado || 'Activo',
                        longitud_total: fullProject.longitud_total || '',
                        tipo_via: fullProject.tipo_via || '500',
                        intervalo_manual: fullProject.intervalo_manual || '',
                        isIntervalManual: fullProject.is_interval_manual || false,
                        // Update new fields
                        codigo: fullProject.codigo || `PROJ-${String(fullProject.id).padStart(3, '0')}`,
                        nombre_proyecto: fullProject.nombre_proyecto || fullProject.nombre_tramo || '',
                        descripcion_proyecto: fullProject.descripcion_proyecto || '',
                        // Progresiva fields
                        nombre_progresiva: fullProject.progresivas?.[0]?.nombre || '',
                        codigo_progresiva: fullProject.progresivas?.[0]?.codigo || '',
                        linea_progresiva: fullProject.progresivas?.[0]?.linea || '18L',
                        coordenada_este_progresiva: fullProject.progresivas?.[0]?.coordenada_este || '',
                        coordenada_norte_progresiva: fullProject.progresivas?.[0]?.coordenada_norte || '',
                        descripcion_progresiva: fullProject.progresivas?.[0]?.descripcion || '',
                        estado_progresiva: fullProject.progresivas?.[0]?.estado || 'activo',
                    });

                    // Pre-fill Sub-catalogs based on Project Data
                    if (fullProject.departamento) {
                        const filteredProvs = provinciasData.filter(p => p.department_id === fullProject.departamento);
                        setProvincias(filteredProvs);
                    }
                    if (fullProject.provincia) {
                        const filteredDists = distritosData.filter(d => d.province_id === fullProject.provincia);
                        setDistritos(filteredDists);
                    }

                    if (fullProject.calibracion) {
                        setCalibrationData(fullProject.calibracion);
                    }

                    const kmlUrlToUse = fullProject.url_kml || fullProject.kml_url; // Handle potential varied naming

                    if (kmlUrlToUse) {
                        fetchAndParseRemoteKml(kmlUrlToUse, fullProject.calibracion);
                    } else if (fullProject.calibracion) {
                        // Fallback if no URL but data exists (unlikely given flow, but safe)
                        setIdentifiedTramos(Object.keys(fullProject.calibracion));
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

    // (Merged above)

    const handleCalibrationChange = (tramo, field, value) => {
        setCalibrationData(prev => ({
            ...prev,
            [tramo]: {
                ...prev[tramo],
                [field]: value
            }
        }));
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
            is_interval_manual: formData.isIntervalManual, // Fixed key to snake_case
            estado: formData.estado,
            // New fields mapping
            codigo: formData.codigo,
            nombre_proyecto: formData.nombre_proyecto,
            descripcion_proyecto: formData.descripcion_proyecto,
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
            await axios.put(`${API_URL}/api/proyectos/${formData.id}`, {
                projectData: projectDataPayload,
                progresivaData,
                calibrationData: identifiedTramos.length > 0 ? calibrationData : null
            }, { headers });

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
                                <label>Código de Proyecto</label>
                                <input type="text" name="codigo" value={formData.codigo} onChange={handleInputChange} className="bg-white" placeholder="Ej: PROJ-001" />
                            </div>
                            <div className="form-group">
                                <label>Nombre del Proyecto</label>
                                <input type="text" name="nombre_proyecto" value={formData.nombre_proyecto} onChange={handleInputChange} className="bg-white" placeholder="Nombre general del proyecto" />
                            </div>
                            <div className="form-group">
                                <label>Nombre del Tramo</label>
                                <input type="text" name="nombre_tramo" value={formData.nombre_tramo} onChange={handleInputChange} className="bg-white" />
                            </div>
                            <div className="form-group full-width">
                                <label>Descripción del Proyecto</label>
                                <textarea name="descripcion_proyecto" value={formData.descripcion_proyecto} onChange={handleInputChange} rows="2" className="w-full border rounded p-2" placeholder="Descripción general del proyecto"></textarea>
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
                        <legend>Trazado KML y Calibración</legend>
                        <div className="form-group">
                            <label>Archivo KML/KMZ o Shapefile (.zip)</label>

                            {!kmlFile && (formData.url_kml || originalProject?.kml_filename) ? (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded text-blue-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">Archivo Actual Cargado</p>
                                            <a
                                                href={formData.url_kml || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-700 truncate max-w-[200px] hover:underline block"
                                                title={originalProject?.kml_filename || formData.url_kml}
                                            >
                                                {originalProject?.kml_filename || (formData.url_kml ? formData.url_kml.split('/').pop() : 'Archivo KML/ZIP')}
                                            </a>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOriginalProject(prev => ({ ...prev, kml_filename: null }));
                                            setFormData(prev => ({ ...prev, url_kml: null }));
                                            setIdentifiedTramos([]);
                                            setCalibrationData({});
                                            setManualTramoCount(0);
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium underline px-2"
                                    >
                                        Cambiar Archivo
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="file"
                                    accept=".kml,.kmz,.zip"
                                    onChange={handleKmlUpload}
                                    disabled={isUploadingKml}
                                    className="border p-2 rounded w-full"
                                />
                            )}

                            {kmlFile && (
                                <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                    Nuevo archivo seleccionado: {kmlFile.name}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Soporta: .kml, .kmz, .zip (Shapefile con .shp/.dbf)</p>
                        </div>

                        {/* Manual Override Control - Only show if no tramos detected yet */}
                        {identifiedTramos.length === 0 && (
                            <div className="mt-4 mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm">¿Definir tramos manualmente?</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="50"
                                        className="w-24"
                                        value={manualTramoCount}
                                        onChange={handleManualTramoCountChange}
                                        placeholder="# Tramos"
                                    />
                                    <span className="text-xs text-gray-400">(Ingresa cantidad e.g. 3)</span>
                                </div>
                            </div>
                        )}



                        {identifiedTramos.length > 0 && (
                            <div className="mt-4 p-4 border border-blue-200 rounded bg-blue-50">
                                <h4 className="text-sm font-bold text-blue-800 mb-2">Calibración de Tramos Identificados</h4>
                                <div className="text-xs text-gray-600 mb-3">
                                    Ingrese la progresiva oficial de inicio y fin para cada tramo (ej: 0+000).
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white text-sm border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="border px-2 py-1 bg-gray-100">Tramo</th>
                                                <th className="border px-2 py-1 bg-gray-100">Prog. Inicio</th>
                                                <th className="border px-2 py-1 bg-gray-100">Prog. Fin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {identifiedTramos.map(tramo => (
                                                <tr key={tramo}>
                                                    <td className="border px-2 py-1 font-medium">{tramo}</td>
                                                    <td className="border px-2 py-1">
                                                        <input
                                                            type="text"
                                                            placeholder="0+000"
                                                            className="w-full p-1 border rounded focus:border-blue-500"
                                                            value={calibrationData[tramo]?.start || ''}
                                                            onChange={(e) => handleCalibrationChange(tramo, 'start', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="border px-2 py-1">
                                                        <input
                                                            type="text"
                                                            placeholder="5+000"
                                                            className="w-full p-1 border rounded focus:border-blue-500"
                                                            value={calibrationData[tramo]?.end || ''}
                                                            onChange={(e) => handleCalibrationChange(tramo, 'end', e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
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

                    <DialogFooter className="mt-6 flex flex-row justify-end gap-3 sm:gap-3">
                        <button
                            type="button"
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            onClick={onClose}
                            disabled={isUploadingKml}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-colors flex items-center"
                            disabled={isUploadingKml}
                        >
                            {isUploadingKml ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Guardando...
                                </>
                            ) : 'Guardar y Finalizar'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FullProjectForm;
