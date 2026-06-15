import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../data/contexts/AuthContext';
import FuenteFormModal from './FuenteFormModal';
import SuelosMap from '../mapa/SuelosMap';
import './GestorDeFuentesDeAgua.css';
import '../proyectos/GestorProyectos.css';
import '../ui/DashboardSuelos.css';
import FormularioEnsayo from '../ensayos/FormularioEnsayo';
import EnsayoDetalleModal from '../ensayos/EnsayoDetalleModal';
import TramoSelectionModal from '../gestion_tramos/TramoSelectionModal';
import FuenteImageGalleryModal from './FuenteImageGalleryModal';
import FuenteImageThumbnails from './FuenteImageThumbnails';
import FuenteMuestrasModal from './FuenteMuestrasModal';
import FuenteMuestraItem from './FuenteMuestraItem';

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

export default function GestorDeFuentesDeAgua() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryFuente, setGalleryFuente] = useState(null);

  const handleOpenGallery = (fuente) => {
    setGalleryFuente(fuente);
    setShowImageGallery(true);
  };

  // =========== HOOKS DECLARATION ===========
  const { selectedProjectId, user } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [fuentes, setFuentes] = useState([]);
  const [fuenteSeleccionada, setFuenteSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fuenteToEdit, setFuenteToEdit] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [selectedTramoId, setSelectedTramoId] = useState(null);
  const [showTramoModal, setShowTramoModal] = useState(false);
  const [userTramos, setUserTramos] = useState([]);
  const [selectedTramoName, setSelectedTramoName] = useState('');
  const [newFormKey, setNewFormKey] = useState(0);
  const [expandedEstratos, setExpandedEstratos] = useState({});
  const [showGestionarEstratosModal, setShowGestionarEstratosModal] = useState(false);
  const [fuenteParaGestionar, setFuenteParaGestionar] = useState(null);
  const [showEnsayoModal, setShowEnsayoModal] = useState(false);
  const [currentFuenteForAssay, setCurrentFuenteForAssay] = useState(null);
  const [currentEstratoForAssay, setCurrentEstratoForAssay] = useState(null);
  const [ensayoToEdit, setEnsayoToEdit] = useState(null);
  const [selectedEnsayoForDetail, setSelectedEnsayoForDetail] = useState(null);
  const [centerToTrigger, setCenterToTrigger] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [sidebarView, setSidebarView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEstratosEnsayosModal, setShowEstratosEnsayosModal] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const API_URL = `${API_BASE}/api`;

  const mapKmlIds = useMemo(() => {
    const tramo = userTramos.find(t => t.id === selectedTramoId);
    const tramoKmlId = tramo?.kml_trazado_id;
    const tramoPuntosId = tramo?.kml_puntos_id;
    const fuenteKmlId = fuenteSeleccionada?.kml_id;
    return [tramoKmlId, tramoPuntosId, fuenteKmlId].filter(Boolean);
  }, [selectedTramoId, userTramos, fuenteSeleccionada]);

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
    setFuenteSeleccionada(null);
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

  const fetchFuentes = useCallback(async () => {
    if (!selectedTramoId) {
      setFuentes([]);
      return;
    }
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/tramos/${selectedTramoId}/fuentes-agua`, { headers });
      const fetchedFuentes = response.data || [];
      setFuentes(fetchedFuentes);

      if (!location.state?.fuenteId) {
        setFuenteSeleccionada(fetchedFuentes.length > 0 ? fetchedFuentes[0] : null);
      }
    } catch (err) {
      alertify.error('Error al cargar las fuentes de agua.');
      console.error('Error al cargar fuentes de agua:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTramoId, getAuthHeaders, API_URL, location.state]);

  useEffect(() => {
    fetchFuentes();
  }, [fetchFuentes]);

  // Auto-expandir desde navegación externa
  useEffect(() => {
    const { fuenteId, estratoId } = location.state || {};
    if (fuenteId && estratoId && fuentes.length > 0) {
      const fuenteToSelect = fuentes.find(f => f.id === fuenteId);
      if (fuenteToSelect) {
        setFuenteSeleccionada(fuenteToSelect);
        setExpandedEstratos(prev => ({ ...prev, [estratoId]: true }));
        navigate(location.pathname, { replace: true });
      }
    }
  }, [fuentes, location.state, navigate, location.pathname]);

  const handleSelectFuente = useCallback((fuenteId) => {
    const selected = fuentes.find(f => f.id === fuenteId);
    if (selected) {
      setFuenteSeleccionada(selected);
    }
  }, [fuentes]);

  useEffect(() => {
    if (fuenteSeleccionada && fuenteSeleccionada.latitud && fuenteSeleccionada.longitud) {
      setMapCenter([parseFloat(fuenteSeleccionada.latitud), parseFloat(fuenteSeleccionada.longitud)]);
    } else {
      setMapCenter(null);
    }
  }, [fuenteSeleccionada]);

  useEffect(() => {
    if (fuenteSeleccionada) {
      const updated = fuentes.find(f => f.id === fuenteSeleccionada.id);
      if (updated) {
        setFuenteSeleccionada(updated);
      }
    }
  }, [fuentes]);

  const handleSaveFuente = useCallback(async (fuenteData) => {
    setIsSubmitting(true);
    try {
      const headers = getAuthHeaders();
      if (fuenteToEdit) {
        const response = await axios.put(`${API_URL}/fuentes-agua/${fuenteToEdit.id}`, fuenteData, { headers });
        alertify.success('Fuente de agua actualizada correctamente.');
        return response.data;
      } else {
        const response = await axios.post(`${API_URL}/fuentes-agua`, fuenteData, { headers });
        alertify.success('Fuente de agua creada correctamente.');
        return response.data;
      }
    } catch (error) {
      alertify.error(`Error al guardar la fuente de agua: ${error.response?.data?.details || error.message}`);
      console.error('Error al guardar fuente de agua:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [fuenteToEdit, getAuthHeaders, API_URL]);

  const handleSaveComplete = useCallback(() => {
    setShowFormModal(false);
    fetchFuentes();
  }, [fetchFuentes]);

  const handleEditFuente = useCallback((fuenteId) => {
    const fuente = fuentes.find(f => f.id === fuenteId);
    if (fuente) {
      setFuenteToEdit(fuente);
      setNewFormKey(prev => prev + 1);
      setShowFormModal(true);
    }
  }, [fuentes]);

  const handleDeleteFuente = useCallback(async (fuenteId) => {
    alertify.confirm(
      'Eliminar Fuente de Agua',
      '¿Está seguro que desea eliminar esta fuente de agua? Se borrarán también sus registros de muestras y ensayos. Esta acción es irreversible.',
      async function () {
        try {
          const headers = getAuthHeaders();
          await axios.delete(`${API_URL}/fuentes-agua/${fuenteId}`, { headers });
          alertify.success('Fuente de agua eliminada correctamente.');
          fetchFuentes();
        } catch (err) {
          alertify.error(`Error al eliminar la fuente de agua: ${err.response?.data?.error || err.message}`);
          console.error('Error al eliminar fuente de agua:', err);
        }
      },
      function () {
        alertify.message('Eliminación cancelada');
      }
    );
  }, [getAuthHeaders, fetchFuentes, API_URL]);

  const toggleEstrato = (estratoId) => {
    setExpandedEstratos(prev => ({ ...prev, [estratoId]: !prev[estratoId] }));
  };

  const handleAddEnsayo = (fuente, estrato) => {
    setCurrentFuenteForAssay(fuente);
    setCurrentEstratoForAssay(estrato);
    setEnsayoToEdit(null);
    setShowEnsayoModal(true);
  };

  const handleEditEnsayo = (fuente, estrato, ensayo) => {
    setCurrentFuenteForAssay(fuente);
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
          await axios.delete(`${API_URL}/ensayos/${ensayoId}`, { headers });
          alertify.success('Ensayo eliminado correctamente.');
          fetchFuentes();
        } catch (err) {
          console.error('Error al eliminar ensayo:', err);
          alertify.error(err.response?.data?.mensaje || 'Error al eliminar ensayo.');
        }
      },
      function () {
        alertify.message('Eliminación cancelada');
      }
    );
  };

  const handleCloseEnsayoModal = () => {
    setShowEnsayoModal(false);
    setCurrentFuenteForAssay(null);
    setCurrentEstratoForAssay(null);
    setEnsayoToEdit(null);
    fetchFuentes();
  };

  const handleOpenGestionarEstratos = (fuente) => {
    setFuenteParaGestionar(fuente);
    setShowGestionarEstratosModal(true);
  };

  const handleViewEnsayo = (ensayo) => {
    setSelectedEnsayoForDetail(ensayo);
  };

  const handleAssayCreated = useCallback(() => {
    fetchFuentes();
  }, [fetchFuentes]);

  // =========== CONDITIONAL RETURNS ===========
  if (initialLoading) {
    return <div className="gestor-proyectos-container"><p>Cargando configuración de tramos...</p></div>;
  }

  if (!selectedTramoId && !showTramoModal) {
    return <div className="gestor-proyectos-container"><p>No tienes tramos asignados o no se pudo cargar la configuración.</p></div>;
  }

  // =========== RENDER ===========
  const filteredFuentes = fuentes.filter(f => {
    return !searchTerm || f.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <main className="dashboard-premium-container">
      {(loading || isSubmitting) && (
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
            fuentesData={fuentes} // Nuevo prop para Fuentes de Agua
            onMarkerClick={(f) => { handleSelectFuente(f.id); setSidebarView('details'); setIsPanelCollapsed(false); }}
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
                  <i className="fas fa-tint me-2" style={{ marginRight: '8px', color: '#38bdf8' }}></i> Fuentes de Agua
                </h3>
              </div>

              <div className="search-wrapper-ultra">
                <i className="fas fa-search search-icon"></i>
                <input type="text" placeholder="Buscar fuente..." value={searchTerm} onChange={ev => setSearchTerm(ev.target.value)} className="search-input-ultra" />
              </div>

              <div className="prog-list-container">
                <button onClick={() => { setNewFormKey(prev => prev + 1); setFuenteToEdit(null); setShowFormModal(true); }} className="btn-marvel" style={{ width: '100%', marginBottom: '15px', background: '#0d47a1', borderColor: '#0d47a1' }}>
                  <i className="fas fa-plus"></i> Añadir Fuente de Agua
                </button>

                {filteredFuentes.map(f => (
                  <div key={f.id} onClick={() => { handleSelectFuente(f.id); setSidebarView('details'); }} className="sidebar-prog-card-ultra">
                    <div className="card-header-flex">
                      <span className="prog-name">{f.nombre}</span>
                      <span className={`status-badge-glow ${(!f.estratos_perfil || f.estratos_perfil.length === 0) ? 'sin-datos' : (f.estado || 'activa').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}>
                        <span className="glow-dot"></span>
                        {(!f.estratos_perfil || f.estratos_perfil.length === 0) ? 'SIN DATOS' : (f.estado || 'ACTIVA').toUpperCase()}
                      </span>
                    </div>
                    <div className="card-meta-row" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="meta-badge">
                          <div className="icon-box-blue" style={{ background: 'rgba(13,71,161,0.1)', color: '#0d47a1' }}><i className="fas fa-vial"></i></div>
                          <span>{f.estratos_perfil?.length || 0} Muestras</span>
                        </div>
                        <div className="meta-badge">
                          <div className="icon-box-gray"><i className="fas fa-map-pin"></i></div>
                          <span>Lado {f.lado?.charAt(0).toUpperCase() || 'E'}</span>
                        </div>
                      </div>

                      <div className="cantera-item-actions" style={{ display: 'flex', gap: '5px' }}>
                        <button className="icon-btn-fade" onClick={(e) => { e.stopPropagation(); handleEditFuente(f.id); }} title="Editar"><i className="fas fa-edit"></i></button>
                        <button className="icon-btn-fade" onClick={(e) => { e.stopPropagation(); handleDeleteFuente(f.id); }} title="Eliminar"><i className="fas fa-trash text-danger"></i></button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredFuentes.length === 0 && (
                  <div className="empty-state">No se encontraron fuentes de agua.</div>
                )}
              </div>
            </div>
          ) : (
            fuenteSeleccionada && (
              <div className="sidebar-detail-ultra custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="detail-header-ultra">
                  <button onClick={() => { setSidebarView('list'); setFuenteSeleccionada(null); setMapCenter(null); setCenterToTrigger(null); }} className="icon-btn-glass"><i className="fas fa-chevron-left"></i></button>
                  <h3 className="detail-title-ultra">
                    <span className="text-gradient" style={{ backgroundImage: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}>{fuenteSeleccionada.nombre}</span>
                  </h3>
                  <button onClick={() => { setSidebarView('list'); setFuenteSeleccionada(null); setMapCenter(null); setCenterToTrigger(null); }} className="icon-btn-fade"><i className="fas fa-times"></i></button>
                </div>

                <div className="status-banner-ultra">
                  <select
                    value={fuenteSeleccionada.estado || 'Activa'}
                    onChange={async (e) => {
                      const newEstado = e.target.value;
                      try {
                        const headers = getAuthHeaders();
                        const updatedData = {
                          ...fuenteSeleccionada,
                          estado: newEstado,
                          coordenada_este: fuenteSeleccionada.coordenada_este ? parseFloat(fuenteSeleccionada.coordenada_este) : null,
                          coordenada_norte: fuenteSeleccionada.coordenada_norte ? parseFloat(fuenteSeleccionada.coordenada_norte) : null,
                          id_progresiva_referencia: fuenteSeleccionada.id_progresiva_referencia ? parseInt(fuenteSeleccionada.id_progresiva_referencia, 10) : null,
                          desplazamiento_km: fuenteSeleccionada.desplazamiento_km ? parseFloat(fuenteSeleccionada.desplazamiento_km) : null,
                          latitud: fuenteSeleccionada.latitud ? parseFloat(fuenteSeleccionada.latitud) : null,
                          longitud: fuenteSeleccionada.longitud ? parseFloat(fuenteSeleccionada.longitud) : null,
                        };
                        await axios.put(`${API_URL}/fuentes-agua/${fuenteSeleccionada.id}`, updatedData, { headers });
                        alertify.success(`Estado actualizado a ${newEstado}`);
                        setFuenteSeleccionada(prev => ({ ...prev, estado: newEstado }));
                        fetchFuentes();
                      } catch (err) {
                        alertify.error('Error al actualizar el estado de la fuente.');
                        console.error(err);
                      }
                    }}
                    className={`status-glow-chip select-inline-estado ${(!fuenteSeleccionada.estratos_perfil || fuenteSeleccionada.estratos_perfil.length === 0) ? 'sin-datos' : (fuenteSeleccionada.estado || 'activa').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`}
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
                      <span className="value">{fuenteSeleccionada.progresiva_ref_codigo ? formatProgresivaCodigo(fuenteSeleccionada.progresiva_ref_codigo) : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="meta-card">
                    <div className="icon-wrap map-color"><i className="fas fa-arrows-alt-h"></i></div>
                    <div className="meta-content">
                      <span className="label">Desplaz. (km)</span>
                      <span className="value">{fuenteSeleccionada.desplazamiento_km || '0'}</span>
                    </div>
                  </div>
                  <div className="meta-card">
                    <div className="icon-wrap map-color"><i className="fas fa-map-signs"></i></div>
                    <div className="meta-content">
                      <span className="label">Lado</span>
                      <span className="value">{fuenteSeleccionada.lado || 'EJE'}</span>
                    </div>
                  </div>
                  <div className="meta-card">
                    <div className="icon-wrap layers-color" style={{ color: '#0d47a1', background: 'rgba(13,71,161,0.1)' }}><i className="fas fa-user-tie"></i></div>
                    <div className="meta-content">
                      <span className="label">Propietario</span>
                      <span className="value">{fuenteSeleccionada.propietario || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="meta-card full-width coords-card">
                    <div className="coord-block">
                      <span className="label text-blue-muted">ESTE (X)</span>
                      <span className="value text-mono text-dark">{fuenteSeleccionada.coordenada_este || '-'}</span>
                    </div>
                    <div className="coord-divider"></div>
                    <div className="coord-block">
                      <span className="label text-purple-muted">NORTE (Y)</span>
                      <span className="value text-mono text-dark">{fuenteSeleccionada.coordenada_norte || '-'}</span>
                    </div>
                  </div>

                  <div className="meta-card full-width">
                    <div className="icon-wrap text-color"><i className="fas fa-align-left"></i></div>
                    <div className="meta-content">
                      <span className="label">Descripción</span>
                      <span className="value">{fuenteSeleccionada.descripcion || 'Sin descripción adicional'}</span>
                    </div>
                  </div>
                </div>

                <div className="strata-summary-box-trigger" onClick={() => setShowEstratosEnsayosModal(true)}>
                  <div className="summary-card-header" style={{ marginBottom: '15px' }}>
                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: '800', color: '#1e293b' }}>
                      <i className="fas fa-vials" style={{ color: '#0d47a1', marginRight: '6px' }}></i> Sondeos y Muestras
                    </h4>
                    <span className="badge-count" style={{ backgroundColor: 'rgba(13,71,161,0.1)', color: '#0d47a1' }}>
                      {fuenteSeleccionada.estratos_perfil?.length || 0} Muestra(s)
                    </span>
                  </div>
                  
                  <div className="strata-timeline">
                    {fuenteSeleccionada.estratos_perfil && fuenteSeleccionada.estratos_perfil.length > 0 ? (
                      fuenteSeleccionada.estratos_perfil.map((est, i) => (
                        <div key={i} className="strata-node">
                          <div className="strata-color-bar" style={{ backgroundColor: '#0d47a1' }}></div>
                          <div className="strata-info" style={{ padding: '8px 0' }}>
                            <span className="strata-depth">{est.cota_inicial || est.profundidad_inicial || '0.00'}m - {est.cota_final || est.profundidad_final || '0.00'}m</span>
                            <span className="strata-name" style={{ fontSize: '0.85rem' }}>{est.nombre || 'Sin nombre'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-strata" style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                        No hay muestras registradas
                      </div>
                    )}
                  </div>

                  <div className="summary-action-hint" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', fontWeight: '700', color: '#0d47a1', gap: '6px' }}>
                    <span>Administrar sondeos y ensayos</span> <i className="fas fa-external-link-alt"></i>
                  </div>
                </div>

                {/* Registro Fotográfico */}
                <div className="sidebar-carrusel-wrapper">
                  <h4 className="sidebar-carrusel-title-mini">
                    <i className="fas fa-camera"></i> Registro Fotográfico
                  </h4>
                  {fuenteSeleccionada.imagenes && fuenteSeleccionada.imagenes.length > 0 ? (
                    <div className="sidebar-carrusel-integrated">
                      <img
                        src={fuenteSeleccionada.imagenes[0]?.imagen_url}
                        alt="Registro de Fuente"
                        className="integrated-carrusel-img"
                        onClick={() => handleOpenGallery(fuenteSeleccionada)}
                        title="Abrir galería"
                      />
                      <div className="integrated-carrusel-counter">
                        1 / {fuenteSeleccionada.imagenes.length}
                      </div>
                      <div className="integrated-carrusel-caption">
                        {fuenteSeleccionada.imagenes[0]?.nombre_archivo || 'Foto de fuente'}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="integrated-carrusel-empty"
                      onClick={() => handleOpenGallery(fuenteSeleccionada)}
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
                    if (fuenteSeleccionada.latitud && fuenteSeleccionada.longitud) {
                      setCenterToTrigger({ lat: parseFloat(fuenteSeleccionada.latitud), lng: parseFloat(fuenteSeleccionada.longitud), zoom: 17, key: Date.now() });
                    } else {
                      alertify.warning('Coordenadas no válidas.');
                    }
                  }} className="btn-marvel" style={{ background: '#0d47a1', borderColor: '#0d47a1' }}>
                    <i className="fas fa-crosshairs"></i> Centrar en Mapa
                  </button>
                  <button onClick={() => handleOpenGallery(fuenteSeleccionada)} className="btn-ghost-dark">
                    <i className="fas fa-images"></i> Galería Completa
                  </button>
                </div>
              </div>
            )
          )}
        </aside>
      </section>

      <FuenteFormModal
        key={newFormKey}
        showModal={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveFuente}
        onSaveComplete={handleSaveComplete}
        projectId={selectedProjectId}
        isSubmitting={isSubmitting}
        selectedTramoId={selectedTramoId}
        selectedTramoName={selectedTramoName}
        fuenteToEdit={fuenteToEdit}
      />

      {showEnsayoModal && (
        <FormularioEnsayo
          showModal={showEnsayoModal}
          onClose={handleCloseEnsayoModal}
          estrato={currentEstratoForAssay}
          fuenteId={currentFuenteForAssay?.id}
          progresiva={null}
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
        onSaved={fetchFuentes}
      />

      {showGestionarEstratosModal && (
        <FuenteMuestrasModal
          isOpen={showGestionarEstratosModal}
          onClose={() => setShowGestionarEstratosModal(false)}
          fuenteAgua={fuenteParaGestionar}
          onSave={fetchFuentes}
        />
      )}

      {showEstratosEnsayosModal && fuenteSeleccionada && (
        <div className="perfil-overlay-custom" onClick={() => setShowEstratosEnsayosModal(false)}>
          <div className="perfil-estratigrafico-modal-custom" style={{ maxWidth: '1200px', width: '95%', height: '85vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="perfil-header-custom">
              <div className="perfil-header-title">
                <h3>Sondeos y Ensayos Realizados</h3>
                <div className="perfil-header-subtitle">
                  Fuente de Agua: <span className="highlight-badge">{fuenteSeleccionada.nombre}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => { setShowEstratosEnsayosModal(false); handleOpenGestionarEstratos(fuenteSeleccionada); }} 
                  className="btn-add-estrato-premium" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#0d47a1', borderColor: '#0d47a1' }}
                >
                  <i className="fas fa-cog"></i> Administrar Sondeos
                </button>
                <button onClick={() => setShowEstratosEnsayosModal(false)} className="perfil-close-btn-custom">&times;</button>
              </div>
            </div>
            <div className="perfil-content-custom custom-scrollbar" style={{ padding: '25px', overflowY: 'auto', backgroundColor: '#f8fafc', flex: 1 }}>
              <div className="estratos-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {fuenteSeleccionada.estratos_perfil && fuenteSeleccionada.estratos_perfil.length > 0 ? (
                  fuenteSeleccionada.estratos_perfil.map((muestra) => {
                    if (!muestra || muestra.id === undefined || muestra.id === null) return null;
                    return (
                      <FuenteMuestraItem
                        key={muestra.id}
                        estrato={muestra}
                        expandedEstratos={expandedEstratos}
                        onToggle={toggleEstrato}
                        fuenteAguaSeleccionada={fuenteSeleccionada}
                        onAddEnsayo={handleAddEnsayo}
                        handleDeleteEnsayo={handleDeleteEnsayo}
                        handleEditEnsayo={handleEditEnsayo}
                        handleViewEnsayo={handleViewEnsayo}
                        onClasificar={null}
                      />
                    );
                  })
                ) : (
                  <div className="estratos-empty-state">
                    <i className="fas fa-vials" style={{ color: '#94a3b8' }}></i>
                    <p>No hay muestras ni testigos registrados para esta fuente de agua.</p>
                    <p className="subtitle">Haz clic en "Administrar Sondeos" para comenzar a registrar extracciones.</p>
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

      <FuenteImageGalleryModal
        isOpen={showImageGallery}
        onClose={() => { setShowImageGallery(false); fetchFuentes(); }}
        fuenteAgua={galleryFuente}
        onDataChange={fetchFuentes}
      />
    </main>
  );
}
