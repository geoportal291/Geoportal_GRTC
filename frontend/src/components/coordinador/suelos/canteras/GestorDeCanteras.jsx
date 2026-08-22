import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/data/contexts/AuthContext';
import CanteraFormModal from './CanteraFormModal';
import SuelosMap from '../mapa/SuelosMap';
import './GestorDeCanteras.css';
import '../ui/GestorProyectos.css';
import '../ui/DashboardSuelos.css';
import FormularioEnsayo from '../ensayos/FormularioEnsayo';
import EnsayoDetalleModal from '../ensayos/EnsayoDetalleModal';
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
  const [selectedEnsayoForDetail, setSelectedEnsayoForDetail] = useState(null);
  const [showClasificacionModal, setShowClasificacionModal] = useState(false);
  const [estratoToClasificar, setEstratoToClasificar] = useState(null);
  const [centerToTrigger, setCenterToTrigger] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false); // Cambiado a false por defecto
  const [sidebarView, setSidebarView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewingGallery, setViewingGallery] = useState(false);
  const [showEstratosEnsayosModal, setShowEstratosEnsayosModal] = useState(false);

  const handleOpenClasificacionModal = (estrato) => {
    setEstratoToClasificar(estrato);

    alertify.message(`Próximamente: Clasificación para estrato ID: ${estrato.id}`);

  };


  useEffect(() => {
  }, [showEnsayoModal]);


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

  useEffect(() => {
    if (canteraSeleccionada) {
      const updated = canteras.find(c => c.id === canteraSeleccionada.id);
      if (updated) {
        setCanteraSeleccionada(updated);
      }
    }
  }, [canteras]);

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
    setSelectedEnsayoForDetail(ensayo);
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
  const filteredCanteras = canteras.filter(c => {
    if (filterType === 'data') return c.estratos_perfil && c.estratos_perfil.length > 0;
    return !searchTerm || c.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <main className="dashboard-premium-container">
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

      <section className="map-section-premium" style={{ height: 'calc(100vh - 100px)', minHeight: '650px', borderRadius: 0, border: 'none' }}>
        <div style={{ flex: 1, position: 'relative' }}>

          <SuelosMap
            key={selectedTramoId}
            center={mapCenter}
            markerPosition={mapCenter}
            isExpanded={mapExpanded}
            onExpand={setMapExpanded}
            kmlTrazadoIds={mapKmlIds}
            canterasData={canteras}
            onMarkerClick={(c) => { handleSelectCantera(c.id); setSidebarView('details'); setIsPanelCollapsed(false); }}
            layerContext="dashboard"
            hideKmlPoints={true}
            centerTo={centerToTrigger}
            isSidebarOpen={!isPanelCollapsed}
          />

        </div>

        <aside className={`sidebar-premium custom-scrollbar ${isPanelCollapsed ? 'collapsed' : ''}`} style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          {sidebarView === 'list' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} className="custom-scrollbar">
              <div className="sidebar-header-ultra">
                <h3 className="sidebar-title-ultra">
                  <i className="fas fa-mountain gradient-icon me-2" style={{ marginRight: '8px' }}></i> Canteras
                </h3>
              </div>

              <div className="search-wrapper-ultra">
                <i className="fas fa-search search-icon"></i>
                <input type="text" placeholder="Buscar cantera..." value={searchTerm} onChange={ev => setSearchTerm(ev.target.value)} className="search-input-ultra" />
              </div>

              <div className="prog-list-container">
                <button onClick={() => { setNewFormKey(prev => prev + 1); setCanteraToEdit(null); setShowFormModal(true); }} className="btn-marvel" style={{ width: '100%', marginBottom: '15px' }}>
                  <i className="fas fa-plus"></i> Añadir Cantera
                </button>

                {filteredCanteras.map(c => (
                  <div key={c.id} onClick={() => { handleSelectCantera(c.id); setSidebarView('details'); }} className="sidebar-prog-card-ultra">
                    <div className="card-header-flex">
                      <span className="prog-name">{c.nombre}</span>
                      <span className={`status-badge-glow ${(!c.estratos_perfil || c.estratos_perfil.length === 0) ? 'sin-datos' : (c.estado || 'activa').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}>
                        <span className="glow-dot"></span>
                        {(!c.estratos_perfil || c.estratos_perfil.length === 0) ? 'SIN DATOS' : (c.estado || 'ACTIVA').toUpperCase()}
                      </span>
                    </div>
                    <div className="card-meta-row" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="meta-badge">
                          <div className="icon-box-blue"><i className="fas fa-layer-group"></i></div>
                          <span>{c.estratos_perfil?.length || 0} Estratos</span>
                        </div>
                        <div className="meta-badge">
                          <div className="icon-box-gray"><i className="fas fa-map-pin"></i></div>
                          <span>Lado {c.lado?.charAt(0).toUpperCase() || 'E'}</span>
                        </div>
                      </div>

                      <div className="cantera-item-actions" style={{ display: 'flex', gap: '5px' }}>
                        <button className="icon-btn-fade" onClick={(e) => { e.stopPropagation(); handleEditCantera(c.id); }} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="icon-btn-fade" onClick={(e) => { e.stopPropagation(); handleDeleteCantera(c.id); }} title="Eliminar"><i className="fas fa-trash text-danger"></i></button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredCanteras.length === 0 && (
                  <div className="empty-state">No se encontraron canteras.</div>
                )}
              </div>
            </div>
          ) : (
            canteraSeleccionada && (
              <div className="sidebar-detail-ultra custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="detail-header-ultra">
                  <button onClick={() => { setSidebarView('list'); setCanteraSeleccionada(null); setMapCenter(null); setCenterToTrigger(null); }} className="icon-btn-glass"><i className="fas fa-chevron-left"></i></button>
                  <h3 className="detail-title-ultra">
                    <span className="text-gradient">{canteraSeleccionada.nombre}</span>
                  </h3>
                  <button onClick={() => { setSidebarView('list'); setCanteraSeleccionada(null); setMapCenter(null); setCenterToTrigger(null); }} className="icon-btn-fade"><i className="fas fa-times"></i></button>
                </div>

                <div className="status-banner-ultra">
                  <select
                    value={canteraSeleccionada.estado || 'Activa'}
                    onChange={async (e) => {
                      const newEstado = e.target.value;
                      try {
                        const headers = getAuthHeaders();
                        const updatedData = {
                          ...canteraSeleccionada,
                          estado: newEstado,
                          coordenada_este: canteraSeleccionada.coordenada_este ? parseFloat(canteraSeleccionada.coordenada_este) : null,
                          coordenada_norte: canteraSeleccionada.coordenada_norte ? parseFloat(canteraSeleccionada.coordenada_norte) : null,
                          id_progresiva_referencia: canteraSeleccionada.id_progresiva_referencia ? parseInt(canteraSeleccionada.id_progresiva_referencia, 10) : null,
                          desplazamiento_km: canteraSeleccionada.desplazamiento_km ? parseFloat(canteraSeleccionada.desplazamiento_km) : null,
                          latitud: canteraSeleccionada.latitud ? parseFloat(canteraSeleccionada.latitud) : null,
                          longitud: canteraSeleccionada.longitud ? parseFloat(canteraSeleccionada.longitud) : null,
                        };
                        await axios.put(`${API_URL}/canteras/${canteraSeleccionada.id}`, updatedData, { headers });
                        alertify.success(`Estado actualizado a ${newEstado}`);
                        
                        setCanteraSeleccionada(prev => ({ ...prev, estado: newEstado }));
                        fetchCanteras();
                      } catch (err) {
                        alertify.error('Error al actualizar el estado de la cantera.');
                        console.error(err);
                      }
                    }}
                    className={`status-glow-chip select-inline-estado ${(!canteraSeleccionada.estratos_perfil || canteraSeleccionada.estratos_perfil.length === 0) ? 'sin-datos' : (canteraSeleccionada.estado || 'activa').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}
                  >
                    <option value="Activa">🟢 Activa</option>
                    <option value="Potencial">🟡 Potencial</option>
                    <option value="Inactiva">🔴 Inactiva</option>
                  </select>
                </div>

                <div className="detail-meta-grid">
                  <div className="meta-card">
                    <div className="icon-wrap map-color"><i className="fas fa-road"></i></div>
                    <div className="meta-content">
                      <span className="label">Progresiva Ref.</span>
                      <span className="value">{canteraSeleccionada.progresiva_ref_codigo ? formatProgresivaCodigo(canteraSeleccionada.progresiva_ref_codigo) : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="meta-card">
                    <div className="icon-wrap map-color"><i className="fas fa-arrows-alt-h"></i></div>
                    <div className="meta-content">
                      <span className="label">Desplaz. (km)</span>
                      <span className="value">{canteraSeleccionada.desplazamiento_km || '0'}</span>
                    </div>
                  </div>
                  <div className="meta-card">
                    <div className="icon-wrap map-color"><i className="fas fa-map-signs"></i></div>
                    <div className="meta-content">
                      <span className="label">Lado</span>
                      <span className="value">{canteraSeleccionada.lado || 'EJE'}</span>
                    </div>
                  </div>
                  <div className="meta-card">
                    <div className="icon-wrap layers-color"><i className="fas fa-cube"></i></div>
                    <div className="meta-content">
                      <span className="label">Material</span>
                      <span className="value">{canteraSeleccionada.material || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="meta-card full-width coords-card">
                    <div className="coord-block">
                      <span className="label text-blue-muted">ESTE (X)</span>
                      <span className="value text-mono text-dark">{canteraSeleccionada.coordenada_este || '-'}</span>
                    </div>
                    <div className="coord-divider"></div>
                    <div className="coord-block">
                      <span className="label text-purple-muted">NORTE (Y)</span>
                      <span className="value text-mono text-dark">{canteraSeleccionada.coordenada_norte || '-'}</span>
                    </div>
                  </div>

                  <div className="meta-card full-width">
                    <div className="icon-wrap text-color"><i className="fas fa-align-left"></i></div>
                    <div className="meta-content">
                      <span className="label">Descripción</span>
                      <span className="value">{canteraSeleccionada.descripcion || 'Sin descripción adicional'}</span>
                    </div>
                  </div>
                </div>

                <div className="strata-summary-box-trigger" onClick={() => setShowEstratosEnsayosModal(true)}>
                  <div className="summary-card-header" style={{ marginBottom: '15px' }}>
                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: '800', color: '#1e293b' }}>
                      <i className="fas fa-stream"></i> Perfil Estratigráfico
                    </h4>
                    <span className="badge-count">
                      {canteraSeleccionada.estratos_perfil?.length || 0} Estrato(s)
                    </span>
                  </div>
                  
                  <div className="strata-timeline">
                    {canteraSeleccionada.estratos_perfil && canteraSeleccionada.estratos_perfil.length > 0 ? (
                      canteraSeleccionada.estratos_perfil.map((est, i) => (
                        <div key={i} className="strata-node">
                          <div className="strata-color-bar" style={{ backgroundColor: est.nlp_color_hex || '#cbd5e1' }}></div>
                          <div className="strata-info" style={{ padding: '8px 0' }}>
                            <span className="strata-depth">m - {(est.cota_final || est.profundidad_final || '0.00')}m</span>
                            <span className="strata-name" style={{ fontSize: '0.85rem' }}>{est.nombre || est.nombre_estrato || est.descripcion || 'Sin nombre'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-strata" style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                        No hay estratos registrados
                      </div>
                    )}
                  </div>

                  <div className="summary-action-hint" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', fontWeight: '700', color: '#2563eb', gap: '6px' }}>
                    <span>Administrar estratos y ensayos</span> <i className="fas fa-external-link-alt"></i>
                  </div>
                </div>

                {/* Carrusel de Imágenes Integrado en Sidebar */}
                <div className="sidebar-carrusel-wrapper">
                  <h4 className="sidebar-carrusel-title-mini">
                    <i className="fas fa-camera"></i> Registro Fotográfico
                  </h4>
                  {canteraSeleccionada.imagenes && canteraSeleccionada.imagenes.length > 0 ? (
                    <div className="sidebar-carrusel-integrated">
                      <img
                        src={canteraSeleccionada.imagenes[0]?.imagen_url}
                        alt="Registro de Cantera"
                        className="integrated-carrusel-img"
                        onClick={() => handleOpenGallery(canteraSeleccionada)}
                        title="Haga clic para abrir la galería a pantalla completa"
                      />
                      <div className="integrated-carrusel-counter">
                        1 / {canteraSeleccionada.imagenes.length}
                      </div>
                      <div className="integrated-carrusel-caption">
                        {canteraSeleccionada.imagenes[0]?.nombre_archivo || 'Foto de cantera'}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="integrated-carrusel-empty"
                      onClick={() => handleOpenGallery(canteraSeleccionada)}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fas fa-camera-slash"></i>
                      <p>Sin fotografías registradas</p>
                      <span className="upload-hint">Haz clic para subir fotos</span>
                    </div>
                  )}
                </div>

                <div className="action-buttons-ultra">
                  <button onClick={() => {
                    if (canteraSeleccionada.latitud && canteraSeleccionada.longitud) {
                      setCenterToTrigger({ lat: parseFloat(canteraSeleccionada.latitud), lng: parseFloat(canteraSeleccionada.longitud), zoom: 17, key: Date.now() });
                    } else {
                      alertify.warning('Coordenadas no válidas.');
                    }
                  }} className="btn-marvel">
                    <i className="fas fa-crosshairs"></i> Centrar en Mapa
                  </button>
                  <button onClick={() => handleOpenGallery(canteraSeleccionada)} className="btn-ghost-dark">
                    <i className="fas fa-images"></i> Galería Completa
                  </button>
                </div>
              </div>
            )
          )}
        </aside>
      </section>

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
      )}

      <EnsayoDetalleModal
        isOpen={!!selectedEnsayoForDetail}
        ensayos={selectedEnsayoForDetail ? [selectedEnsayoForDetail] : []}
        initialEnsayoId={selectedEnsayoForDetail?.id ?? null}
        showEnsayoTabs={false}
        onClose={() => setSelectedEnsayoForDetail(null)}
        onSaved={fetchCanteras}
      />

      {showGestionarEstratosModal && (
        <PerfilEstratigraficoModal
          isOpen={showGestionarEstratosModal}
          onClose={() => setShowGestionarEstratosModal(false)}
          cantera={canteraParaGestionar}
          onSave={fetchCanteras}
        />
      )}
      {showEstratosEnsayosModal && canteraSeleccionada && (
        <div className="perfil-overlay-custom" onClick={() => setShowEstratosEnsayosModal(false)}>
          <div className="perfil-estratigrafico-modal-custom" style={{ maxWidth: '1200px', width: '95%', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="perfil-header-custom">
              <div className="perfil-header-title">
                <h3>Estratos y Ensayos Realizados</h3>
                <div className="perfil-header-subtitle">
                  Cantera: <span className="highlight-badge">{canteraSeleccionada.nombre}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => { setShowEstratosEnsayosModal(false); handleOpenGestionarEstratos(canteraSeleccionada); }} 
                  className="btn-add-estrato-premium" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <i className="fas fa-cog"></i> Administrar Perfil
                </button>
                <button onClick={() => setShowEstratosEnsayosModal(false)} className="perfil-close-btn-custom">&times;</button>
              </div>
            </div>
            <div className="perfil-content-custom custom-scrollbar" style={{ padding: '25px', overflowY: 'auto', backgroundColor: '#f8fafc', flex: 1 }}>
              <div className="estratos-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {canteraSeleccionada.estratos_perfil && canteraSeleccionada.estratos_perfil.length > 0 ? (
                  canteraSeleccionada.estratos_perfil.map((estrato) => {
                    if (!estrato || estrato.id === undefined || estrato.id === null) return null;
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
                  <div className="estratos-empty-state">
                    <i className="fas fa-layer-group"></i>
                    <p>No hay estratos definidos para esta cantera.</p>
                    <p className="subtitle">Haz clic en "Administrar Perfil" para comenzar a definir el perfil estratigráfico.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="perfil-footer-custom" style={{ justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEstratosEnsayosModal(false)} className="btn-save-estrato-premium" style={{ background: '#64748b' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <CanteraImageGalleryModal
        isOpen={showImageGallery}
        onClose={() => { setShowImageGallery(false); fetchCanteras(); }}
        cantera={galleryCantera}
        onDataChange={fetchCanteras}
      />

    </main>
  );
}
