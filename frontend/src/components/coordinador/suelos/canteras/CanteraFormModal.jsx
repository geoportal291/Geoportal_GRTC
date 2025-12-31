import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import SuelosMap from '../mapa/SuelosMap'; // Mapa de suelos
import proj4 from 'proj4'; // Para conversión de coordenadas
import { kml } from '@tmcw/togeojson'; // Conversión KML a GeoJSON
import JSZip from 'jszip';
import { useAuth } from '../../../../data/contexts/AuthContext'; // Import useAuth

// Definiciones de proyecciones para proj4
const wgs84 = 'EPSG:4326';
// Asumimos Zona 18S para Perú. Esto debería ser configurable si hay otras zonas en el futuro.
const utm18S = '+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs';

const initialFormData = {
  nombre: 'cantera-nueva',
  descripcion: '',
  material: '',
  estado: 'Activa',
  accesibilidad: '',
  coordenada_este: '',
  coordenada_norte: '',
  id_progresiva_referencia: '',
  desplazamiento_km: '',
  lado: 'Izquierda',
  latitud: '',
  longitud: '',
};

export default function CanteraFormModal({
  showModal, onClose, onSave, onSaveComplete, projectId, isSubmitting, selectedTramoId, selectedTramoName, canteraToEdit
}) {
  const { user } = useAuth(); // Use useAuth hook
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(canteraToEdit ? {
    nombre: canteraToEdit.nombre || '',
    descripcion: canteraToEdit.descripcion || '',
    material: canteraToEdit.material || '',
    estado: canteraToEdit.estado || 'Activa',
    accesibilidad: canteraToEdit.accesibilidad || '',
    coordenada_este: canteraToEdit.coordenada_este || '',
    coordenada_norte: canteraToEdit.coordenada_norte || '',
    id_progresiva_referencia: canteraToEdit.id_progresiva_referencia || '',
    desplazamiento_km: canteraToEdit.desplazamiento_km || '',
    lado: canteraToEdit.lado || 'Izquierda',
    latitud: canteraToEdit.latitud || '',
    longitud: canteraToEdit.longitud || '',
  } : initialFormData);

  // Efecto para precargar datos de la cantera si se está editando
  useEffect(() => {
    // Este useEffect ahora solo maneja la lógica del mapa y otros estados que no sean formData
    if (canteraToEdit) {
      // Si hay coordenadas Lat/Lon, centrar el mapa y poner el marcador
      if (canteraToEdit.latitud && canteraToEdit.longitud) {
        try {
          const lat = parseFloat(canteraToEdit.latitud);
          const lon = parseFloat(canteraToEdit.longitud);
          setMapCenter([lat, lon]);
          setCanteraMarkerPosition([lat, lon]);
        } catch (error) {
          console.error('Error al usar Lat/Lon de canteraToEdit:', error);
        }
      } else if (canteraToEdit.coordenada_este && canteraToEdit.coordenada_norte) {
        // Si no hay Lat/Lon pero sí UTM, intentar convertir (para canteras antiguas)
        try {
          const este = parseFloat(canteraToEdit.coordenada_este);
          const norte = parseFloat(canteraToEdit.coordenada_norte);
          // Asumimos Zona 18S para Perú y datum WGS84 para la conversión inversa
          const [lon, lat] = proj4(utm18S, wgs84, [este, norte]);
          setMapCenter([lat, lon]);
          setCanteraMarkerPosition([lat, lon]);
        } catch (error) {
          console.error('Error al convertir UTM de canteraToEdit:', error);
        }
      }
      // También cargar el KML si existe
      if (canteraToEdit.kml_id) {
        // Aquí necesitaríamos una función para cargar el KML por ID y establecer uploadedKmlGeoJson y processedKmlText
        // Por ahora, solo se precargan los datos del formulario.
        // La visualización del KML en el mapa ya se maneja con kmlTrazadoIds en SuelosMap
      }
    } else {
      setMapCenter(null);
      setCanteraMarkerPosition(null);
      setUploadedKmlGeoJson(null);
      setStep(1); // Volver al primer paso al crear nueva cantera
    }
  }, [canteraToEdit]);

  const [isSelecting, setIsSelecting] = useState(false); // Estado para el modo de selección en mapa

  const [progresivas, setProgresivas] = useState([]);
  const [loadingProgresivas, setLoadingProgresivas] = useState(false);
  const [tramoKmlTrazadoId, setTramoKmlTrazadoId] = useState(null);
  const [canteraMarkerPosition, setCanteraMarkerPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [uploadedKmlGeoJson, setUploadedKmlGeoJson] = useState(null); // Estado para el GeoJSON del KML subido

  const API_URL = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // ✅ Formatear código de progresiva tipo 001-02-0005000 -> 0+500
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

  // ✅ Cargar progresivas según tramo seleccionado
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
          alertify.error('Sesión expirada. Por favor, inicia sesión de nuevo.');
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

  // ✅ Obtener el KML trazado del tramo seleccionado
  useEffect(() => {
    const fetchTramoKml = async () => {
      if (!selectedTramoId) {
        setTramoKmlTrazadoId(null);
        return;
      }
      try {
        const token = user?.token;
        if (!token) {
          alertify.error('Sesión expirada. Por favor, inicia sesión de nuevo.');
          return;
        }
        const response = await axios.get(`${API_URL}/api/tramos/${selectedTramoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTramoKmlTrazadoId(response.data.kml_trazado_id);
      } catch (error) {
        console.error('Error fetching tramo KML ID:', error);
        setTramoKmlTrazadoId(null);
      }
    };
    fetchTramoKml();
  }, [selectedTramoId, API_URL, user]);

  // ✅ Manejo de cambios de formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'id_progresiva_referencia') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Subida de KML para establecer coordenadas
  const handleKmlUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Helper para encontrar la primera coordenada en una estructura GeoJSON
    const getFirstCoordinate = (geometry) => {
      if (!geometry) return null;
      switch (geometry.type) {
        case 'Point':
          return geometry.coordinates;
        case 'LineString':
        case 'MultiPoint':
          return geometry.coordinates[0];
        case 'Polygon':
        case 'MultiLineString':
          return geometry.coordinates[0][0];
        case 'MultiPolygon':
          return geometry.coordinates[0][0][0];
        default:
          return null;
      }
    };

    try {
      let kmlText = '';
      // Comprobar si es un KMZ y descomprimirlo
      if (file.name.toLowerCase().endsWith('.kmz')) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const kmlFileInZip = Object.values(loadedZip.files).find(f => f.name.toLowerCase().endsWith('.kml'));

        if (kmlFileInZip) {
          kmlText = await kmlFileInZip.async('string');
        } else {
          alertify.error('El archivo KMZ no contiene ningún archivo KML en su interior.');
          return;
        }
      } else {
        // Si no es KMZ, leerlo como texto plano (KML)
        kmlText = await file.text();
      }

      const parser = new DOMParser();
      const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
      const geojson = kml(kmlDoc);

      if (!geojson || !geojson.features || geojson.features.length === 0) {
        alertify.error('El archivo KML no contiene ninguna geometría (feature).');
        return;
      }

      setUploadedKmlGeoJson(geojson); // Guardar el GeoJSON completo para visualización

      const firstFeature = geojson.features[0];
      const coords = getFirstCoordinate(firstFeature.geometry);

      if (!coords || coords.length < 2) {
        alertify.error('No se pudieron extraer coordenadas válidas del KML.');
        return;
      }

      const [lon, lat] = coords; // GeoJSON es [lon, lat]

      // 1. Actualizar la posición del marcador para el mapa
      setCanteraMarkerPosition([lat, lon]);
      setMapCenter([lat, lon]);

      // 2. Convertir a UTM y actualizar el formulario
      try {
        const [este, norte] = proj4(wgs84, utm18S, [lon, lat]);
        setFormData((prev) => ({
          ...prev,
          coordenada_este: este.toFixed(2),
          coordenada_norte: norte.toFixed(2),
          latitud: lat.toFixed(8), // Guardar Lat/Lon también
          longitud: lon.toFixed(8),
        }));
      } catch (error) {
        console.error('Error al convertir Lat/Lon a UTM desde KML:', error);
        alertify.error('Error al convertir coordenadas Lat/Lon a UTM desde KML.');
      }

      alertify.success('Coordenadas cargadas desde KML.');

    } catch (error) {
      alertify.error('Error al procesar el archivo KML.');
      console.error(error);
    }
  };

  // ✅ Click en el mapa
  const handleMapClick = (e) => { // Leaflet pasa el objeto de evento completo
    if (!isSelecting) return; // Prevent selection if not in active mode
    if (!e.latlng) return;
    const { lat, lng } = e.latlng;
    setCanteraMarkerPosition([lat, lng]); // Guardamos la posición para el marcador

    try {
      // Convertir Lat/Lon a UTM usando proj4
      const [este, norte] = proj4(wgs84, utm18S, [lng, lat]);
      setFormData((prev) => ({
        ...prev,
        coordenada_este: este.toFixed(2),
        coordenada_norte: norte.toFixed(2),
        latitud: lat.toFixed(8), // Guardar Lat/Lon también
        longitud: lng.toFixed(8),
      }));
    } catch (error) {
      console.error('Error al convertir Lat/Lon a UTM en handleMapClick:', error);
      alertify.error('Error al convertir coordenadas Lat/Lon a UTM.');
    }
    setIsSelecting(false); // Desactivar el modo de selección después de hacer clic
  };

  // Memoize KML IDs to prevent map reload/flicker
  const kmlIdsMemo = useMemo(() => tramoKmlTrazadoId ? [tramoKmlTrazadoId] : [], [tramoKmlTrazadoId]);

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handlePrevStep = () => setStep((prev) => prev - 1);

  // ✅ Guardar
  const [imagenFile, setImagenFile] = useState(null);

  const handleImagenChange = (e) => {
    setImagenFile(e.target.files[0]);
  };

  // ... (resto de los hooks y funciones)

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 2) {
      alertify.error('Por favor complete todos los pasos.');
      return;
    }

    // 1. Prepare base data for Cantera (without image logic yet)
    const dataToSave = {
      ...formData,
      id_proyecto: projectId,
      tramo_id: selectedTramoId, // <-- FIX: Include the tramo_id
      coordenada_este: formData.coordenada_este ? parseFloat(formData.coordenada_este) : null,
      coordenada_norte: formData.coordenada_norte ? parseFloat(formData.coordenada_norte) : null,
      id_progresiva_referencia: formData.id_progresiva_referencia
        ? parseInt(formData.id_progresiva_referencia, 10)
        : null,
      desplazamiento_km: formData.desplazamiento_km ? parseFloat(formData.desplazamiento_km) : null,
    };

    try {
      // 2. Save Cantera (Create or Update) first to ensure we have an ID
      const savedCantera = await onSave(dataToSave);

      if (savedCantera && savedCantera.id && imagenFile) {
        // 3. If there is an image, upload it associated with the cantera ID
        try {
          const token = user?.token;
          if (!token) throw new Error('No estás autenticado');

          const formDataImg = new FormData();
          formDataImg.append('imagen_cantera', imagenFile);
          formDataImg.append('canteraId', savedCantera.id);
          formDataImg.append('descripcion', 'Imagen principal (Formulario)');

          await axios.post(`${API_URL}/api/canteras/upload-image`, formDataImg, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
          });
          alertify.success('Imagen asociada correctamente.');
        } catch (uploadError) {
          console.error('Error al subir la imagen:', uploadError);
          const detailMsg = uploadError.response?.data?.details || uploadError.response?.data?.error || 'Error desconocido';
          alertify.warning(`La cantera se guardó, pero falló la imagen: ${detailMsg}`);
        }
      }

      if (savedCantera) {
        onSaveComplete();
      }

    } catch (error) {
      console.error("Error saving cantera:", error);
      // Alertify error should be handled by onSave in parent, but good to ensure
    }
  };

  if (!showModal) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="progresivas-form-container" onClick={(e) => e.stopPropagation()}>
        <form className="progresivas-form">
          <h3>Nueva Cantera</h3>

          {/* Paso indicador */}
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
                  <label htmlFor="nombre">Nombre</label>
                  <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="material">Material</label>
                  <input type="text" id="material" name="material" value={formData.material} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="estado">Estado</label>
                  <select id="estado" name="estado" value={formData.estado} onChange={handleChange} required>
                    <option value="Activa">Activa</option>
                    <option value="Potencial">Potencial</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="accesibilidad">Accesibilidad</label>
                  <input type="text" id="accesibilidad" name="accesibilidad" value={formData.accesibilidad} onChange={handleChange} />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="3" />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="imagen">Imagen de la Cantera</label>
                  <input type="file" id="imagen" name="imagen" accept="image/*" onChange={handleImagenChange} />
                </div>
              </div>
            </div>
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <div className="form-step-content">
              <div className="form-grid">
                {/* Coordenadas absolutas */}
                <div className="form-group">
                  <label htmlFor="coordenada_este">Coordenada Este (UTM)</label>
                  <input type="number" step="any" id="coordenada_este" name="coordenada_este" value={formData.coordenada_este} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="coordenada_norte">Coordenada Norte (UTM)</label>
                  <input type="number" step="any" id="coordenada_norte" name="coordenada_norte" value={formData.coordenada_norte} onChange={handleChange} />
                </div>

                {/* Botón para seleccionar en mapa */}
                <div className="form-group full-width">
                  <button type="button" className={`btn-secondary ${isSelecting ? 'active' : ''}`} onClick={() => setIsSelecting(!isSelecting)}>
                    <i className="fas fa-map-marker-alt"></i>
                    {isSelecting ? 'Seleccionando... (clic en el mapa)' : 'Seleccionar en Mapa'}
                  </button>
                </div>

                {/* Archivo KML */}
                <div className="form-group full-width">
                  <label htmlFor="kml_upload">Importar KML/KMZ</label>
                  <input type="file" id="kml_upload" name="kml_upload" accept=".kml,.kmz" onChange={handleKmlUpload} />
                </div>

                {/* Mapa */}
                <div className="form-group full-width" style={{ marginBottom: '20px' }}>
                  <SuelosMap // Renderizar mapa
                    displayMode="form"
                    style={{ height: '400px', width: '100%' }}
                    kmlTrazadoIds={kmlIdsMemo}
                    markerPosition={canteraMarkerPosition}
                    onMapClick={handleMapClick}
                    center={mapCenter}
                    transientGeoJson={uploadedKmlGeoJson} // Pasar el GeoJSON para renderizar
                    isSelecting={isSelecting} // Pasar el estado de selección
                    layerContext="modal" // Isolate map layers from global dashboard
                    hideKmlPoints={true} // Clean view: only show tramo line, no points
                    hideToolbar={true} // Hide toolbar in modal
                  />
                </div>

                {/* Referencia de progresiva */}
                <div className="form-group full-width">
                  <hr style={{ margin: '20px 0', border: '1px solid #eee' }} />
                  <h4 style={{ textAlign: 'center', color: '#555', marginBottom: '20px' }}>
                    Referencia a Progresiva (Opcional)
                  </h4>
                </div>

                <div className="form-group">
                  <label>Tramo de Referencia</label>
                  <span>{selectedTramoName || 'No seleccionado'}</span>
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
                      {progresivas.map((prog) => (
                        <option key={prog.id} value={prog.id}>
                          {formatProgresivaCodigo(prog.codigo)} - {prog.nombre}
                        </option>
                      ))}
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
                  {isSubmitting ? 'Guardando...' : 'Guardar Cantera'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}