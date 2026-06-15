import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import alertify from 'alertifyjs';
import SuelosMap from '../mapa/SuelosMap'; // Mapa de suelos
import proj4 from 'proj4'; // Para conversión de coordenadas
import { kml } from '@tmcw/togeojson'; // Conversión KML a GeoJSON
import JSZip from 'jszip';
import { useAuth } from '../../../../data/contexts/AuthContext';
import '../gestion_tramos/Progresivas.css'; // Reutilizar estilos de progresivas/canteras

// Iconos (SVG)
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// Definiciones de proyecciones para proj4
const wgs84 = 'EPSG:4326';
const utm18S = '+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';

const initialFormData = {
  nombre: 'fuente-nueva',
  descripcion: '',
  estado: 'Activa',
  propietario: '',
  coordenada_este: '',
  coordenada_norte: '',
  id_progresiva_referencia: '',
  desplazamiento_km: '',
  lado: 'Izquierda',
  latitud: '',
  longitud: '',
};

export default function FuenteFormModal({
  showModal, onClose, onSave, onSaveComplete, projectId, isSubmitting, selectedTramoId, selectedTramoName, fuenteToEdit
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(fuenteToEdit ? {
    nombre: fuenteToEdit.nombre || '',
    descripcion: fuenteToEdit.descripcion || '',
    estado: fuenteToEdit.estado || 'Activa',
    propietario: fuenteToEdit.propietario || '',
    coordenada_este: fuenteToEdit.coordenada_este || '',
    coordenada_norte: fuenteToEdit.coordenada_norte || '',
    id_progresiva_referencia: fuenteToEdit.id_progresiva_referencia || '',
    desplazamiento_km: fuenteToEdit.desplazamiento_km || '',
    lado: fuenteToEdit.lado || 'Izquierda',
    latitud: fuenteToEdit.latitud || '',
    longitud: fuenteToEdit.longitud || '',
  } : initialFormData);

  const [metodoUbicacion, setMetodoUbicacion] = useState('coordenadas'); // 'coordenadas', 'mapa', 'kml'
  const [progresivas, setProgresivas] = useState([]);
  const [loadingProgresivas, setLoadingProgresivas] = useState(false);
  const [tramoKmlTrazadoId, setTramoKmlTrazadoId] = useState(null);
  const [fuenteMarkerPosition, setFuenteMarkerPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [uploadedKmlGeoJson, setUploadedKmlGeoJson] = useState(null);
  const [imagenFiles, setImagenFiles] = useState([]);

  const API_URL = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Sincronizar datos de edición
  useEffect(() => {
    if (fuenteToEdit) {
      setFormData({
        nombre: fuenteToEdit.nombre || '',
        descripcion: fuenteToEdit.descripcion || '',
        estado: fuenteToEdit.estado || 'Activa',
        propietario: fuenteToEdit.propietario || '',
        coordenada_este: fuenteToEdit.coordenada_este || '',
        coordenada_norte: fuenteToEdit.coordenada_norte || '',
        id_progresiva_referencia: fuenteToEdit.id_progresiva_referencia || '',
        desplazamiento_km: fuenteToEdit.desplazamiento_km || '',
        lado: fuenteToEdit.lado || 'Izquierda',
        latitud: fuenteToEdit.latitud || '',
        longitud: fuenteToEdit.longitud || '',
      });

      if (fuenteToEdit.latitud && fuenteToEdit.longitud) {
        try {
          const lat = parseFloat(fuenteToEdit.latitud);
          const lon = parseFloat(fuenteToEdit.longitud);
          setMapCenter([lat, lon]);
          setFuenteMarkerPosition([lat, lon]);
        } catch (error) {
          console.error('Error al usar Lat/Lon de fuenteToEdit:', error);
        }
      } else if (fuenteToEdit.coordenada_este && fuenteToEdit.coordenada_norte) {
        try {
          const este = parseFloat(fuenteToEdit.coordenada_este);
          const norte = parseFloat(fuenteToEdit.coordenada_norte);
          const [lon, lat] = proj4(utm18S, wgs84, [este, norte]);
          setMapCenter([lat, lon]);
          setFuenteMarkerPosition([lat, lon]);
        } catch (error) {
          console.error('Error al convertir UTM de fuenteToEdit:', error);
        }
      }
    } else {
      setFormData(initialFormData);
      setMapCenter(null);
      setFuenteMarkerPosition(null);
      setUploadedKmlGeoJson(null);
      setStep(1);
    }
  }, [fuenteToEdit]);

  // Formatear código de progresiva
  const formatProgresivaCodigo = (rawCodigo) => {
    if (!rawCodigo) return '';
    const parts = rawCodigo.split('-');
    if (parts.length < 2) return rawCodigo;
    const metersStr = parts[parts.length - 1];
    const meters = parseInt(metersStr, 10);
    if (isNaN(meters)) return rawCodigo;
    const km = Math.floor(meters / 1000);
    const remainingMeters = meters % 1000;
    return `${km}+${String(remainingMeters).padStart(3, '0')}`;
  };

  // Cargar progresivas
  useEffect(() => {
    const fetchProgresivas = async () => {
      if (!selectedTramoId) {
        setProgresivas([]);
        return;
      }
      setLoadingProgresivas(true);
      try {
        const token = user?.token;
        if (!token) {
          alertify.error('Sesión expirada. Inicie sesión de nuevo.');
          return;
        }
        const response = await axios.get(`${API_URL}/api/progresivas/${selectedTramoId}/children/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProgresivas(response.data);
      } catch {
        alertify.error('Error al cargar las progresivas de referencia.');
      } finally {
        setLoadingProgresivas(false);
      }
    };
    fetchProgresivas();
  }, [selectedTramoId, API_URL, user]);

  // Cargar KML trazado del tramo
  useEffect(() => {
    const fetchTramoKml = async () => {
      if (!selectedTramoId) {
        setTramoKmlTrazadoId(null);
        return;
      }
      try {
        const token = user?.token;
        if (!token) return;
        const response = await axios.get(`${API_URL}/api/tramos/${selectedTramoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTramoKmlTrazadoId(response.data.kml_trazado_id);
      } catch (error) {
        console.error('Error al obtener KML de tramo:', error);
        setTramoKmlTrazadoId(null);
      }
    };
    fetchTramoKml();
  }, [selectedTramoId, API_URL, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKmlUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const findFirstCoordinate = (geojson) => {
      if (!geojson || !geojson.features || geojson.features.length === 0) return null;
      const point = geojson.features.find(f => f.geometry?.type === 'Point');
      if (point && point.geometry.coordinates) return point.geometry.coordinates;

      for (const feature of geojson.features) {
        const geom = feature.geometry;
        if (!geom || !geom.coordinates) continue;
        const flatten = (coords) => {
          if (Array.isArray(coords) && typeof coords[0] === 'number') return coords;
          if (Array.isArray(coords) && coords.length > 0) return flatten(coords[0]);
          return null;
        };
        const result = flatten(geom.coordinates);
        if (result) return result;
      }
      return null;
    };

    try {
      let kmlText = '';
      if (file.name.toLowerCase().endsWith('.kmz')) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const kmlFileInZip = Object.values(loadedZip.files).find(f => f.name.toLowerCase().endsWith('.kml'));
        if (kmlFileInZip) {
          kmlText = await kmlFileInZip.async('string');
        } else {
          alertify.error('El archivo KMZ no contiene ningún archivo KML.');
          return;
        }
      } else {
        kmlText = await file.text();
      }

      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
      const geojson = kml(kmlDoc);

      if (!geojson || !geojson.features || geojson.features.length === 0) {
        alertify.error('El archivo KML no contiene geometría válida.');
        return;
      }

      setUploadedKmlGeoJson(geojson);
      const coords = findFirstCoordinate(geojson);

      if (!coords || coords.length < 2) {
        alertify.error('No se encontraron coordenadas válidas en el KML.');
        return;
      }

      const [lon, lat] = coords;
      setFuenteMarkerPosition([lat, lon]);
      setMapCenter([lat, lon]);

      try {
        const [este, norte] = proj4(wgs84, utm18S, [lon, lat]);
        setFormData((prev) => ({
          ...prev,
          coordenada_este: este.toFixed(2),
          coordenada_norte: norte.toFixed(2),
          latitud: lat.toFixed(8),
          longitud: lon.toFixed(8),
        }));
        alertify.success('Coordenadas importadas correctamente.');
      } catch (err) {
        console.error('Error al convertir coordenadas:', err);
        alertify.error('Error al proyectar coordenadas a UTM.');
      }
    } catch (error) {
      alertify.error('Error al procesar el archivo KML/KMZ.');
      console.error(error);
    }
  };

  const handleMapClick = (e) => {
    if (metodoUbicacion !== 'mapa') return;
    if (!e.latlng) return;
    const { lat, lng } = e.latlng;
    setFuenteMarkerPosition([lat, lng]);

    try {
      const [este, norte] = proj4(wgs84, utm18S, [lng, lat]);
      setFormData((prev) => ({
        ...prev,
        coordenada_este: este.toFixed(2),
        coordenada_norte: norte.toFixed(2),
        latitud: lat.toFixed(8),
        longitud: lng.toFixed(8),
      }));
    } catch (error) {
      console.error('Error en conversión al hacer click:', error);
      alertify.error('Error al calcular coordenadas UTM.');
    }
  };

  const kmlIdsMemo = useMemo(() => tramoKmlTrazadoId ? [tramoKmlTrazadoId] : [], [tramoKmlTrazadoId]);

  const progresivasAgrupadas = useMemo(() => {
    const parseProgresivaToMeters = (rawCodigo) => {
      if (!rawCodigo) return 0;
      if (rawCodigo.includes('-')) {
        const parts = rawCodigo.split('-');
        const metersStr = parts[parts.length - 1];
        const meters = parseInt(metersStr, 10);
        if (!isNaN(meters)) return meters;
      }
      if (rawCodigo.includes('+')) {
        const clean = rawCodigo.replace(/km\s*/gi, '').trim();
        const parts = clean.split('+');
        if (parts.length === 2) {
          const km = parseInt(parts[0], 10) || 0;
          const meters = parseInt(parts[1], 10) || 0;
          return km * 1000 + meters;
        }
      }
      return parseInt(rawCodigo, 10) || 0;
    };

    const conDatos = [];
    const sinDatos = [];

    progresivas.forEach(prog => {
      const tienePerfil = Array.isArray(prog.estratos_perfil) && prog.estratos_perfil.length > 0;
      if (tienePerfil) {
        conDatos.push(prog);
      } else {
        sinDatos.push(prog);
      }
    });

    const sortByMeters = (a, b) => parseProgresivaToMeters(a.codigo) - parseProgresivaToMeters(b.codigo);
    conDatos.sort(sortByMeters);
    sinDatos.sort(sortByMeters);

    return { conDatos, sinDatos };
  }, [progresivas]);

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handlePrevStep = () => setStep((prev) => prev - 1);

  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files);
    setImagenFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setImagenFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearFiles = () => {
    setImagenFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 2) {
      alertify.error('Por favor complete todos los pasos.');
      return;
    }

    const dataToSave = {
      ...formData,
      id_proyecto: projectId,
      tramo_id: selectedTramoId,
      coordenada_este: formData.coordenada_este ? parseFloat(formData.coordenada_este) : null,
      coordenada_norte: formData.coordenada_norte ? parseFloat(formData.coordenada_norte) : null,
      id_progresiva_referencia: formData.id_progresiva_referencia
        ? parseInt(formData.id_progresiva_referencia, 10)
        : null,
      desplazamiento_km: formData.desplazamiento_km ? parseFloat(formData.desplazamiento_km) : null,
      latitud: formData.latitud ? parseFloat(formData.latitud) : null,
      longitud: formData.longitud ? parseFloat(formData.longitud) : null,
    };

    try {
      const savedFuente = await onSave(dataToSave);

      if (savedFuente && savedFuente.id && imagenFiles.length > 0) {
        try {
          const token = user?.token;
          if (!token) throw new Error('No autenticado');

          const formDataImg = new FormData();
          for (let i = 0; i < imagenFiles.length; i++) {
            formDataImg.append('files', imagenFiles[i]);
          }

          await axios.post(`${API_URL}/api/fuentes-agua/${savedFuente.id}/upload-bulk`, formDataImg, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          });
          alertify.success('Imágenes procesadas y subidas correctamente.');
        } catch (uploadError) {
          console.error('Error al subir fotos:', uploadError);
          const detailMsg = uploadError.response?.data?.details || uploadError.response?.data?.error || 'Error desconocido';
          alertify.warning(`Se guardó la fuente de agua, pero falló la subida de fotos: ${detailMsg}`);
        }
      }

      if (savedFuente) {
        onSaveComplete();
      }
    } catch (error) {
      console.error("Error al guardar fuente de agua:", error);
    }
  };

  if (!showModal) return null;

  return createPortal(
    <div className="overlay cantera-overlay-custom" onClick={onClose}>
      <div className="progresivas-form-container cantera-form-modal-custom" onClick={(e) => e.stopPropagation()}>
        {isSubmitting && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Guardando fuente de agua...</p>
          </div>
        )}

        <form className="progresivas-form">
          <h3>{fuenteToEdit ? 'Editar Fuente de Agua' : 'Nueva Fuente de Agua'}</h3>

          {/* Stepper */}
          <div className="stepper-container">
            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
              <div className="step-counter">1</div>
              <div className="step-name">Información</div>
            </div>
            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
              <div className="step-counter">2</div>
              <div className="step-name">Ubicación</div>
            </div>
          </div>

          {/* Paso 1 */}
          {step === 1 && (
            <div className="form-step-content">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre de la Fuente</label>
                  <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="propietario">Propietario / Concesionario</label>
                  <input type="text" id="propietario" name="propietario" value={formData.propietario} onChange={handleChange} placeholder="Ej. Municipalidad, Privado, etc." />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {[
                      { value: 'Activa', label: 'Activa', className: 'status-pill-btn activa' },
                      { value: 'Potencial', label: 'Potencial', className: 'status-pill-btn potencial' },
                      { value: 'Inactiva', label: 'Inactiva', className: 'status-pill-btn inactiva' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, estado: opt.value }))}
                        className={`${opt.className} ${formData.estado === opt.value ? 'active' : ''}`}
                        style={{
                          flex: 1,
                          padding: '10px 8px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="descripcion">Descripción / Observaciones</label>
                  <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" placeholder="Información sobre caudal, calidad preliminar del agua, accesos..." />
                </div>

                {/* Galería inicial al crear/editar */}
                <div className="form-group full-width" style={{ marginTop: '5px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Fotografías de la Fuente (Imágenes, ZIP/RAR o Carpetas)</span>
                    {imagenFiles.length > 0 && (
                      <button type="button" onClick={handleClearFiles} className="btn-clear-uploads" style={{ padding: '2px 8px', fontSize: '0.75rem', background: '#fee2e2', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Limpiar ({imagenFiles.length})
                      </button>
                    )}
                  </label>
                  <div className="upload-options-premium" style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <label htmlFor="imagen-files-input" className="btn-upload-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#475569', transition: 'all 0.2s' }}>
                      <i className="fas fa-images" style={{ color: '#0d47a1' }}></i>
                      <span>Seleccionar Archivos</span>
                    </label>
                    <input
                      id="imagen-files-input"
                      type="file"
                      accept="image/*,.zip,.rar"
                      multiple
                      onChange={handleImagenesChange}
                      style={{ display: 'none' }}
                    />

                    <label htmlFor="imagen-folder-input" className="btn-upload-premium" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#475569', transition: 'all 0.2s' }}>
                      <i className="fas fa-folder-open" style={{ color: '#f59e0b' }}></i>
                      <span>Subir Carpeta</span>
                    </label>
                    <input
                      id="imagen-folder-input"
                      type="file"
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={handleImagenesChange}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {imagenFiles.length > 0 && (
                    <div className="uploaded-files-preview-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      {imagenFiles.map((file, idx) => {
                        const isArchive = file.name.endsWith('.zip') || file.name.endsWith('.rar');
                        const iconClass = isArchive ? 'fa-file-archive' : 'fa-file-image';
                        const iconColor = isArchive ? '#f59e0b' : '#0d47a1';
                        return (
                          <div key={idx} className="preview-file-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155', padding: '4px 8px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <i className={`fas ${iconClass}`} style={{ color: iconColor }}></i>
                              <span title={file.name}>{file.name}</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveFile(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '2px', fontWeight: 'bold' }}>
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <div className="form-step-content">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label style={{ marginBottom: '10px' }}>Método de Ubicación</label>
                  <div className="button-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={metodoUbicacion === 'coordenadas' ? { backgroundColor: '#0d47a1', color: 'white', borderColor: '#0d47a1' } : { backgroundColor: 'white', color: '#0d47a1', borderColor: '#0d47a1', border: '2px solid #0d47a1' }}
                      onClick={() => setMetodoUbicacion('coordenadas')}
                    >
                      <i className="fas fa-edit"></i> Ingresar Coordenadas
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      style={metodoUbicacion === 'mapa' ? { backgroundColor: '#0d47a1', color: 'white', borderColor: '#0d47a1' } : { backgroundColor: 'white', color: '#0d47a1', borderColor: '#0d47a1', border: '2px solid #0d47a1' }}
                      onClick={() => setMetodoUbicacion('mapa')}
                    >
                      <i className="fas fa-map-marker-alt"></i> Seleccionar en Mapa
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      style={metodoUbicacion === 'kml' ? { backgroundColor: '#0d47a1', color: 'white', borderColor: '#0d47a1' } : { backgroundColor: 'white', color: '#0d47a1', borderColor: '#0d47a1', border: '2px solid #0d47a1' }}
                      onClick={() => setMetodoUbicacion('kml')}
                    >
                      <i className="fas fa-file-upload"></i> Importar KML/KMZ
                    </button>
                  </div>
                </div>

                <div className="form-group full-width">
                  <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '5px 0 15px 0' }} />
                </div>

                {metodoUbicacion === 'coordenadas' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="coordenada_este">Coordenada Este (UTM)</label>
                      <input type="number" step="any" id="coordenada_este" name="coordenada_este" value={formData.coordenada_este} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="coordenada_norte">Coordenada Norte (UTM)</label>
                      <input type="number" step="any" id="coordenada_norte" name="coordenada_norte" value={formData.coordenada_norte} onChange={handleChange} />
                    </div>
                  </>
                )}

                {metodoUbicacion === 'mapa' && (
                  <div className="form-group full-width">
                    <p style={{ marginBottom: '10px', color: '#555', fontWeight: 'bold' }}>
                      <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i> 
                      Haga clic en el mapa para ubicar la fuente de agua.
                    </p>
                    <div className="map-section" style={{ minHeight: '400px', height: '400px', width: '100%', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                      <SuelosMap
                        displayMode="form"
                        style={{ height: '100%', width: '100%' }}
                        kmlTrazadoIds={kmlIdsMemo}
                        markerPosition={fuenteMarkerPosition}
                        onMapClick={handleMapClick}
                        center={mapCenter}
                        transientGeoJson={uploadedKmlGeoJson}
                        isSelecting={true}
                        layerContext="modal"
                        hideKmlPoints={true}
                        hideToolbar={true}
                      />
                    </div>
                  </div>
                )}

                {metodoUbicacion === 'kml' && (
                  <div className="form-group full-width">
                    <label htmlFor="kml_upload">Subir archivo KML/KMZ</label>
                    <input type="file" id="kml_upload" name="kml_upload" accept=".kml,.kmz" onChange={handleKmlUpload} />
                    <p style={{ marginTop: '8px', fontSize: '0.9em', color: '#666' }}>
                      Se extraerá el primer marcador o coordenada del archivo KML.
                    </p>
                  </div>
                )}

                {/* Referencia de progresiva */}
                <div className="form-group full-width">
                  <fieldset>
                    <legend>Referencia Geográfica (Opcional)</legend>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tramo de Referencia</label>
                        <p className="form-static-text">{selectedTramoName || 'No seleccionado'}</p>
                      </div>

                      <div className="form-group">
                        <label htmlFor="id_progresiva_referencia">Progresiva de Referencia</label>
                        <div className="select-with-loader">
                          <select
                            id="id_progresiva_referencia"
                            name="id_progresiva_referencia"
                            value={formData.id_progresiva_referencia}
                            onChange={handleChange}
                            disabled={!selectedTramoId || loadingProgresivas}
                          >
                            <option value="">Seleccione una progresiva</option>
                            {progresivasAgrupadas.conDatos.length > 0 && (
                              <optgroup label="📍 Progresivas con Ensayos / Muestras">
                                {progresivasAgrupadas.conDatos.map((prog) => (
                                  <option key={prog.id} value={prog.id}>
                                    ⭐ {formatProgresivaCodigo(prog.codigo)} - {prog.nombre || `Km ${formatProgresivaCodigo(prog.codigo)}`}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {progresivasAgrupadas.sinDatos.length > 0 && (
                              <optgroup label="🗺️ Progresivas de Trazado KML">
                                {progresivasAgrupadas.sinDatos.map((prog) => (
                                  <option key={prog.id} value={prog.id}>
                                    {formatProgresivaCodigo(prog.codigo)} - {prog.nombre || `Km ${formatProgresivaCodigo(prog.codigo)}`}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          {loadingProgresivas && <div className="loading-spinner-inline"></div>}
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="desplazamiento_km">Desplazamiento (km)</label>
                        <input
                          type="number"
                          step="any"
                          id="desplazamiento_km"
                          name="desplazamiento_km"
                          value={formData.desplazamiento_km}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="lado">Lado</label>
                        <select id="lado" name="lado" value={formData.lado} onChange={handleChange}>
                          <option value="Izquierda">Izquierda</option>
                          <option value="Derecha">Derecha</option>
                        </select>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="form-actions">
            <button type="button" className="close-btn" onClick={onClose}>
              Cancelar
            </button>
            <div className="wizard-nav-buttons">
              {step > 1 && (
                <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                  Anterior
                </button>
              )}
              {step < 2 ? (
                <button type="button" className="submit-btn" onClick={handleNextStep}>
                  Siguiente
                </button>
              ) : (
                <button type="button" className="submit-btn" disabled={isSubmitting} onClick={handleSubmit}>
                  {isSubmitting ? 'Guardando...' : (fuenteToEdit ? 'Actualizar Fuente' : 'Finalizar y Guardar')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
