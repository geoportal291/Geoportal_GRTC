import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../data/contexts/AuthContext';
import CanteraFormModal from './CanteraFormModal';
import SuelosMap from '../mapa/SuelosMap';
import './GestorDeCanteras.css';
import '../proyectos/GestorProyectos.css';
import FormularioEnsayo from '../ensayos/FormularioEnsayo';
import PerfilEstratigraficoModal from '../estratos/PerfilEstratigraficoModal';
import EstratoItem from '../estratos/EstratoItem';
import TramoSelectionModal from '../gestion_tramos/TramoSelectionModal';
import CanteraImageGalleryModal from './CanteraImageGalleryModal';
import CanteraImageThumbnails from './CanteraImageThumbnails';

const formatProgresivaCodigo = (codigo) => {
  if (!codigo || typeof codigo !== 'string') {
    return codigo;
  }
  const parts = codigo.split('-');
  let cleanCodigo = parts[parts.length - 1];
  if (cleanCodigo.includes('+')) {
    return cleanCodigo.replace(/\++/g, '+');
  }
  if (cleanCodigo.length >= 4 && !isNaN(cleanCodigo)) {
    const km = cleanCodigo.substring(0, cleanCodigo.length - 3);
    const meters = cleanCodigo.substring(cleanCodigo.length - 3);
    return `${km}+${meters}`;
  }
  return cleanCodigo;
};

export default function GestorDeCanteras() {
  const location = useLocation();
  const navigate = useNavigate();

  // ... (resto de hooks)
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryCantera, setGalleryCantera] = useState(null);

  const handleOpenGallery = (cantera) => {
    setGalleryCantera(cantera);
    setShowImageGallery(true);
  };

  // ... (resto del componente)
  // =========== HOOKS DECLARATION ===========
  const { selectedProjectId, user } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [canteras, setCanteras] = useState([]);
  const [canteraSeleccionada, setCanteraSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canteraToEdit, setCanteraToEdit] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedTramoId, setSelectedTramoId] = useState(null);
  const [showTramoModal, setShowTramoModal] = useState(false);
  const [userTramos, setUserTramos] = useState([]);
  const [selectedTramoName, setSelectedTramoName] = useState('');
  const [newFormKey, setNewFormKey] = useState(0);
  const [expandedEstratos, setExpandedEstratos] = useState({});
  const [showGestionarEstratosModal, setShowGestionarEstratosModal] = useState(false);
  const [canteraParaGestionar, setCanteraParaGestionar] = useState(null);
  const [estratosEnEdicion, setEstratosEnEdicion] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showEnsayoModal, setShowEnsayoModal] = useState(false);
  const [currentCanteraForAssay, setCurrentCanteraForAssay] = useState(null);
  const [currentEstratoForAssay, setCurrentEstratoForAssay] = useState(null);
  const [ensayoToEdit, setEnsayoToEdit] = useState(null);
  const [showClasificacionModal, setShowClasificacionModal] = useState(false);
  const [estratoToClasificar, setEstratoToClasificar] = useState(null);

  const handleOpenClasificacionModal = (estrato) => {
    setEstratoToClasificar(estrato);
    // Por ahora, solo mostramos un mensaje. Luego abrirá el modal.
    alertify.message(`Próximamente: Clasificación para estrato ID: ${estrato.id}`);
    // setShowClasificacionModal(true); // Esto se activará cuando el modal exista
  };


  useEffect(() => {
  }, [showEnsayoModal]);

  // API_URL: defensiva por si no tienes REACT_APP_API_BASE
  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const API_URL = `${API_BASE}/api`;

  const mapKmlIds = useMemo(() => {
    const tramo = userTramos.find(t => t.id === selectedTramoId);
    const tramoKmlId = tramo?.kml_trazado_id;
    const tramoPuntosId = tramo?.kml_puntos_id;
    const canteraKmlId = canteraSeleccionada?.kml_id;
    return [tramoKmlId, tramoPuntosId, canteraKmlId].filter(Boolean);
  }, [selectedTramoId, userTramos, canteraSeleccionada]);

  const getAuthHeaders = useCallback(() => {
    const token = user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [user]);

  // Fetch tramos del usuario (por proyecto)
  const fetchTramos = useCallback(async () => {
    if (!selectedProjectId) {
      setInitialLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/user/tramos`, { headers, params: { projectId: selectedProjectId } });
      setUserTramos(response.data || []);
    } catch (err) {
      alertify.error('Error al cargar los tramos del usuario.');
      console.error('Error fetching user tramos:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [selectedProjectId, getAuthHeaders, API_URL]);

  useEffect(() => {
    fetchTramos();
  }, [fetchTramos]);

  const handleTramoSelect = useCallback((tramoId) => {
    setSelectedTramoId(tramoId);
    setCanteraSeleccionada(null);
    setShowTramoModal(false);
    const tramo = userTramos.find(t => t.id === tramoId);
    if (tramo) {
      setSelectedTramoName(tramo.nombre || tramo.nombre_tramo || '');
    }
  }, [userTramos]);

  useEffect(() => {
    const { tramoId } = location.state || {};
    if (tramoId && userTramos.length > 0 && tramoId !== selectedTramoId) {
      handleTramoSelect(tramoId);
    } else if (userTramos.length > 0 && !selectedTramoId && !location.state) {
      if (userTramos.length === 1) {
        handleTramoSelect(userTramos[0].id);
      } else {
        setShowTramoModal(true);
      }
    }
  }, [userTramos, location.state, selectedTramoId, handleTramoSelect]);

  // Fetch canteras por tramo
  const fetchCanteras = useCallback(async () => {
    if (!selectedTramoId) {
      setCanteras([]);
      return;
    }
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/tramos/${selectedTramoId}/canteras`, { headers });
      const fetchedCanteras = response.data || [];
      setCanteras(fetchedCanteras);

      // If not coming from a navigation state, select the first cantera
      if (!location.state?.canteraId) {
        setCanteraSeleccionada(fetchedCanteras.length > 0 ? fetchedCanteras[0] : null);
      }

    } catch (err) {
      alertify.error('Error al cargar las canteras.');
      console.error('Error al cargar canteras:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTramoId, getAuthHeaders, API_URL, location.state]);

  useEffect(() => {
    fetchCanteras();
  }, [fetchCanteras]);

  // Auto-expand logic from navigation state
  useEffect(() => {
    const { canteraId, estratoId } = location.state || {};
    if (canteraId && estratoId && canteras.length > 0) {
      const canteraToSelect = canteras.find(c => c.id === canteraId);
      if (canteraToSelect) {
        setCanteraSeleccionada(canteraToSelect);
        setExpandedEstratos(prev => ({ ...prev, [estratoId]: true }));
        // Clear state to prevent re-triggering
        navigate(location.pathname, { replace: true });
      }
    }
  }, [canteras, location.state, navigate, location.pathname]);

  const handleSelectCantera = useCallback((canteraId) => {
    const selected = canteras.find(c => c.id === canteraId);
    if (selected) {
      setCanteraSeleccionada(selected);
    }
  }, [canteras]);

  useEffect(() => {
    if (canteraSeleccionada && canteraSeleccionada.latitud && canteraSeleccionada.longitud) {
      setMapCenter([parseFloat(canteraSeleccionada.latitud), parseFloat(canteraSeleccionada.longitud)]);
    } else {
      setMapCenter(null);
    }
  }, [canteraSeleccionada]);

  const handleSaveCantera = useCallback(async (canteraData) => {
    setIsSubmitting(true);
    try {
      const headers = getAuthHeaders();
      if (canteraToEdit) {
        const response = await axios.put(`${API_URL}/canteras/${canteraToEdit.id}`, canteraData, { headers });
        alertify.success('Cantera actualizada correctamente.');
        return response.data;
      } else {
        const response = await axios.post(`${API_URL}/canteras`, canteraData, { headers });
        alertify.success('Cantera creada correctamente.');
        return response.data;
      }
    } catch (error) {
      alertify.error(`Error al guardar la cantera: ${error.response?.data?.details || error.message}`);
      console.error('Error al guardar cantera:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [canteraToEdit, getAuthHeaders, API_URL]);

  const handleSaveComplete = useCallback(() => {
    setShowFormModal(false);
    fetchCanteras();
  }, [fetchCanteras]);

  const handleEditCantera = useCallback((canteraId) => {
    const cantera = canteras.find(c => c.id === canteraId);
    if (cantera) {
      setCanteraToEdit(cantera);
      setNewFormKey(prev => prev + 1);
      setShowFormModal(true);
    }
  }, [canteras]);

  const handleDeleteCantera = useCallback(async (canteraId) => {
    alertify.confirm(
      'Eliminar Cantera',
      '¿Está seguro que desea eliminar esta cantera? Esta acción es irreversible.',
      async function () {
        try {
          const headers = getAuthHeaders();
          await axios.delete(`${API_URL}/canteras/${canteraId}`, { headers });
          alertify.success('Cantera eliminada correctamente.');
          fetchCanteras();
        } catch (err) {
          alertify.error(`Error al eliminar la cantera: ${err.response?.data?.error || err.message}`);
          console.error('Error al eliminar cantera:', err);
        }
      },
      function () {
        alertify.message('Eliminación cancelada');
      }
    );
  }, [getAuthHeaders, fetchCanteras, API_URL]);

  const toggleEstrato = (estratoId) => {
    setExpandedEstratos(prev => ({ ...prev, [estratoId]: !prev[estratoId] }));
  };

  const handleAddEnsayo = (cantera, estrato) => {
    setCurrentCanteraForAssay(cantera);
    setCurrentEstratoForAssay(estrato);
    setEnsayoToEdit(null);
    setShowEnsayoModal(true);
  };

  const handleEditEnsayo = (cantera, estrato, ensayo) => {
    setCurrentCanteraForAssay(cantera);
    setCurrentEstratoForAssay(estrato);
    setEnsayoToEdit(ensayo);
    setShowEnsayoModal(true);
  };

  const handleDeleteEnsayo = async (ensayoId) => {
    alertify.confirm(
      'Eliminar Ensayo',
      '¿Está seguro que desea eliminar este ensayo?',
      async function () {
        try {
          const headers = getAuthHeaders();
          // Asegúrate de que la URL es correcta. Basado en tu backend, debería ser /api/ensayos/:id
          await axios.delete(`${API_URL}/ensayos/${ensayoId}`, { headers });
          alertify.success('Ensayo eliminado correctamente.');
          fetchCanteras(); // Refrescar los datos
        } catch (err) {
          console.error('Error al eliminar ensayo:', err);
          alertify.error(err.response?.data?.mensaje || 'Error al eliminar ensayo. Intenta nuevamente.');
        }
      },
      function () {
        alertify.message('Eliminación cancelada');
      }
    );
  };

  const handleCloseEnsayoModal = () => {
    setShowEnsayoModal(false);
    setCurrentCanteraForAssay(null);
    setCurrentEstratoForAssay(null);
    setEnsayoToEdit(null);
    fetchCanteras();
  };

  const handleOpenGestionarEstratos = (cantera) => {
    setCanteraParaGestionar(cantera);
    setShowGestionarEstratosModal(true);
    setEstratosEnEdicion(cantera?.estratos_perfil ? JSON.parse(JSON.stringify(cantera.estratos_perfil)) : []);
  };

  const handleViewEnsayo = (ensayo) => {
    const assayDetails = `
    <div class="ensayo-details-modal-container">
        <div class="ensayo-details-modal-header">
            <i class="fas fa-vial"></i>
            <h2>Detalles del Ensayo</h2>
        </div>
        <div class="ensayo-details-modal-content">
            <div class="modal-detail-item">
                <i class="fas fa-tag"></i>
                <span class="modal-detail-label">Nombre:</span>
                <span class="modal-detail-value">${ensayo.nombre_ensayo}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-flask"></i>
                <span class="modal-detail-label">Tipo:</span>
                <span class="modal-detail-value">${ensayo.tipo_ensayo_descripcion || ensayo.tipo_ensayo}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-calendar-alt"></i>
                <span class="modal-detail-label">Fecha:</span>
                <span class="modal-detail-value">${new Date(ensayo.fecha).toLocaleDateString()}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-chart-bar"></i>
                <span class="modal-detail-label">Resultado:</span>
                <span class="modal-detail-value">${ensayo.resultado}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-user"></i>
                <span class="modal-detail-label">Responsable:</span>
                <span class="modal-detail-value">${ensayo.responsable_nombre || 'N/A'}</span>
            </div>
            <div class="modal-detail-item">
                <i class="fas fa-info-circle"></i>
                <span class="modal-detail-label">Estado:</span>
                <span class="modal-detail-value status-badge status-${ensayo.estado?.toLowerCase()}">${ensayo.estado}</span>
            </div>
        </div>
    </div>
    `;
    alertify.alert('', assayDetails).set('padding', false);
  };

  const handleAssayCreated = useCallback(() => {
    fetchCanteras();
  }, [fetchCanteras]);

  // =========== CONDITIONAL RETURNS ===========
  if (initialLoading) {
    return <div className="gestor-proyectos-container"><p>Cargando configuración de tramos...</p></div>;
  }

  if (!selectedTramoId && !showTramoModal) {
    return <div className="gestor-proyectos-container"><p>No tienes tramos asignados o no se pudo cargar la configuración para este proyecto.</p></div>;
  }

  // =========== RENDER ===========
  return (
    <div className="gestor-proyectos-container">
      {(loading || isSubmitting || submitting) && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      )}

      <TramoSelectionModal
        isOpen={showTramoModal}
        tramos={userTramos}
        onSelect={handleTramoSelect}
        onClose={() => alertify.warning('Debe seleccionar un tramo para continuar.')}
      />

      <div className="tramo-context-bar">
        <span>Tramo Actual: <strong>{selectedTramoName}</strong></span>
        {userTramos.length > 1 && (
          <button onClick={() => setShowTramoModal(true)} className="btn-change-tramo">Cambiar de Tramo</button>
        )}
      </div>

      <div className="gestor-main">
        <div className="lista-tramos-panel">
          <div className="panel-header"><h2>Canteras del Tramo</h2></div>
          <div className="tramos-list">
            {loading && <p>Cargando canteras...</p>}
            {!loading && canteras.length === 0 && <p>No hay canteras para este tramo.</p>}
            {canteras.map((cantera) => (
              <div
                key={cantera.id}
                onClick={() => handleSelectCantera(cantera.id)}
                className={`tramo-list-item ${canteraSeleccionada?.id === cantera.id ? 'active' : ''}`}
              >
                {cantera.nombre}
              </div>
            ))}
          </div>
          <div className="panel-footer">
            <button onClick={() => { setNewFormKey(prev => prev + 1); setCanteraToEdit(null); setShowFormModal(true); }} className="btn btn-add-strata">
              <i className="fas fa-plus"></i> Añadir Cantera
            </button>
          </div>
        </div>

        <div className="detalle-proyecto-panel">
          {canteraSeleccionada ? (
            <>
              <div className="panel-header">
                <h2>{canteraSeleccionada.nombre}</h2>
                <div className="progresiva-actions">
                  <button onClick={() => handleEditCantera(canteraSeleccionada.id)} className="btn-edit"><i className="fas fa-edit"></i></button>
                  <button onClick={() => handleDeleteCantera(canteraSeleccionada.id)} className="btn-delete"><i className="fas fa-trash"></i></button>
                </div>
              </div>

              <div className="detalle-content">
                <div className="map-section">
                  <SuelosMap
                    key={canteraSeleccionada.id}
                    center={mapCenter}
                    markerPosition={mapCenter}
                    isExpanded={mapExpanded}
                    onExpand={setMapExpanded}
                    kmlTrazadoIds={mapKmlIds}
                    cantera={canteraSeleccionada} // <-- Pasar la cantera completa
                    onMarkerClick={() => handleOpenGallery(canteraSeleccionada)}
                    layerContext="gestor-canteras" // Contexto aislado
                    hideKmlPoints={true} // Ocultar puntos KML (progresivas)
                  />
                </div>

                <CanteraImageThumbnails
                  imagenes={canteraSeleccionada.imagenes}
                  onContainerClick={() => handleOpenGallery(canteraSeleccionada)}
                />

                <div className="info-section-grouped">
                  <h4 className="info-section-header">Información General</h4>
                  <div className="info-grid">
                    <p><strong>Material:</strong> {canteraSeleccionada.material || 'N/A'}</p>
                    <p><strong>Estado:</strong> <span className={`status-badge status-${canteraSeleccionada.estado}`}>{canteraSeleccionada.estado}</span></p>
                    <p className="full-width-info"><strong>Accesibilidad:</strong> {canteraSeleccionada.accesibilidad || 'N/A'}</p>
                    <p className="full-width-info"><strong>Descripción:</strong> {canteraSeleccionada.descripcion || 'Sin descripción.'}</p>
                  </div>
                </div>

                <div className="info-section-grouped">
                  <h4 className="info-section-header">Ubicación de Cantera</h4>
                  <div className="info-grid">
                    <p><strong>Coord. Este (UTM):</strong> {canteraSeleccionada.coordenada_este || 'N/A'}</p>
                    <p><strong>Coord. Norte (UTM):</strong> {canteraSeleccionada.coordenada_norte || 'N/A'}</p>
                    <p><strong>Latitud:</strong> {canteraSeleccionada.latitud || 'N/A'}</p>
                    <p><strong>Longitud:</strong> {canteraSeleccionada.longitud || 'N/A'}</p>
                    <p><strong>Progresiva Ref.:</strong> {canteraSeleccionada.progresiva_ref_codigo ? `${formatProgresivaCodigo(canteraSeleccionada.progresiva_ref_codigo)} / ${canteraSeleccionada.progresiva_ref_nombre}` : 'N/A'}</p>
                    <p><strong>Desplazamiento (km):</strong> {canteraSeleccionada.desplazamiento_km || 'N/A'}</p>
                    <p><strong>Lado:</strong> {canteraSeleccionada.lado || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="info-section-grouped">
                <div className="estratos-header estratos-header-canteras">
                  <h4 className="info-section-header">Datos de Cantera</h4>
                  <button onClick={() => handleOpenGestionarEstratos(canteraSeleccionada)} className="btn btn-add-strata">
                    <i className="fas fa-layer-group"></i> Gestionar Estratos
                  </button>
                </div>

                <div className="estratos-list">
                  {canteraSeleccionada?.estratos_perfil && canteraSeleccionada.estratos_perfil.length > 0 ? (
                    canteraSeleccionada.estratos_perfil.map((estrato) => {
                      if (!estrato || estrato.id === undefined || estrato.id === null) {
                        console.warn('Estrato inválido encontrado:', estrato);
                        return null;
                      }
                      return (
                        <EstratoItem
                          key={estrato.id}
                          estrato={estrato}
                          expandedEstratos={expandedEstratos}
                          onToggle={toggleEstrato}
                          canteraSeleccionada={canteraSeleccionada}
                          onAddEnsayo={handleAddEnsayo}
                          handleDeleteEnsayo={handleDeleteEnsayo}
                          handleEditEnsayo={handleEditEnsayo}
                          handleViewEnsayo={handleViewEnsayo}
                          onClasificar={handleOpenClasificacionModal}
                        />
                      );
                    })
                  ) : (
                    <p>No hay estratos definidos para esta cantera.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <i className="fas fa-hand-pointer fa-3x"></i>
              <p>Seleccione una cantera para ver sus detalles.</p>
            </div>
          )}
        </div>
      </div>

      <CanteraFormModal
        key={newFormKey}
        showModal={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveCantera}
        onSaveComplete={handleSaveComplete}
        projectId={selectedProjectId}
        isSubmitting={isSubmitting}
        selectedTramoId={selectedTramoId}
        selectedTramoName={selectedTramoName}
        canteraToEdit={canteraToEdit}
      />

      {showEnsayoModal && (
        <div className="overlay" onClick={handleCloseEnsayoModal}>
          <div className="progresivas-form-container" onClick={(e) => e.stopPropagation()}>
            <FormularioEnsayo
              showModal={showEnsayoModal}
              onClose={handleCloseEnsayoModal}
              estrato={currentEstratoForAssay}
              canteraId={currentCanteraForAssay?.id}
              progresiva={null} // No hay progresiva en el contexto de canteras
              ensayoToEdit={ensayoToEdit}
              onAssayCreated={handleAssayCreated}
              token={user?.token}
            />
          </div>
        </div>
      )}

      {showGestionarEstratosModal && (
        <PerfilEstratigraficoModal
          isOpen={showGestionarEstratosModal}
          onClose={() => setShowGestionarEstratosModal(false)}
          cantera={canteraParaGestionar}
          onSave={fetchCanteras} // Simpler callback
        />
      )}
      <CanteraImageGalleryModal
        isOpen={showImageGallery}
        onClose={() => { setShowImageGallery(false); fetchCanteras(); }}
        cantera={galleryCantera}
        onDataChange={fetchCanteras}
      />

    </div> /* <-- cierre del contenedor principal */
  );
}