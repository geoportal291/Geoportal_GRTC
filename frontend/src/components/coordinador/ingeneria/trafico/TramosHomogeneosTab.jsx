import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, useMap } from 'react-leaflet';
import axiosInstance from '../../../../api/axios';
import ImageDisplayModal from './ImageDisplayModal';
import UploadModal from './UploadModal';
import ImageFileExplorerModal from './ImageFileExplorerModal';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import { CSSTransition } from 'react-transition-group';
import './EstacionControlTab.css';
import ErrorBoundary from '../../../ErrorBoundary';
import Geoite from '../invvial/map/geoite';

// Componente para manejar la vista del mapa
const MapViewController = ({ setView, view }) => {
  const map = useMap();
  const isInitialFitDone = useRef(false);

  // Removida la lógica de fitBounds basada en coordinates hardcodeadas

  const onMove = useCallback(() => {
    setView({ center: map.getCenter(), zoom: map.getZoom() });
  }, [map, setView]);

  useEffect(() => {
    map.on('moveend', onMove);
    map.on('zoomend', onMove);
    return () => {
      map.off('moveend', onMove);
      map.off('zoomend', onMove);
    };
  }, [map, onMove]);

  return null;
};

const TramosHomogeneosTab = ({
  projectId,
  sectionData,
  selectedSection,
  handleSectionSelect,
  isNavbarExpanded,
  refreshData,
  isLoadingImages,
  setShowTraffic
}) => {
  const [view, setView] = useState({ center: [-12.5, -72.5], zoom: 11 });
  const currentSectionData = sectionData[selectedSection];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sectionIdToUpload, setSectionIdToUpload] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToDisplay, setImageToDisplay] = useState(null);
  const [isImageFileExplorerModalOpen, setIsImageFileExplorerModalOpen] = useState(false);
  const [isSectionDataVisible, setIsSectionDataVisible] = useState(true);
  const [isPhotosVisible, setIsPhotosVisible] = useState(true);
  const sectionDataRef = useRef(null);
  const photosRef = useRef(null);
  const [visibility, setVisibility] = useState(() => {
    const initialVisibility = {};
    Object.keys(sectionData).forEach(tramoId => {
      initialVisibility[tramoId] = true;
    });
    return initialVisibility;
  });

  const openImageFileExplorerModal = () => {
    setIsImageFileExplorerModalOpen(true);
  };

  const closeImageFileExplorerModal = () => {
    setIsImageFileExplorerModalOpen(false);
  };

  const openImageModal = (imageUrl) => {
    setImageToDisplay(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageToDisplay(null);
  };

  const handleUploadSuccess = (sectionId, newImageData) => {
    refreshData();
  };

  const openUploadModal = (sectionId) => {
    setSectionIdToUpload(sectionId);
    setIsModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsModalOpen(false);
    setSectionIdToUpload(null);
  };

  const handleDeleteImageGroup = async (sectionId, description, uploadDate) => {
    alertify.confirm(
      'Eliminar Grupo de Imágenes',
      '¿Estás seguro de que quieres eliminar este grupo de imágenes?',
      async function () {
        try {
          await axiosInstance.delete(`/api/trafico/delete-image-group`, {
            data: { stationId: sectionId, description, uploadDate }
          });
          refreshData();
          alertify.success('Grupo de imágenes eliminado con éxito.');
        } catch (error) {
          console.error('Error al eliminar el grupo de imágenes:', error);
          alertify.error('Error al eliminar el grupo de imágenes.');
        }
      },
      function () {
        alertify.error('Eliminación cancelada.');
      }
    );
  };

  const handleVisibilityChange = (tramoId) => {
    setVisibility(prev => ({ ...prev, [tramoId]: !prev[tramoId] }));
  };

  const showAll = () => {
    setVisibility(Object.keys(sectionData).reduce((acc, tramoId) => ({ ...acc, [tramoId]: true }), {}));
    setShowTraffic(true);
  };

  const hideAll = () => {
    setVisibility(Object.keys(sectionData).reduce((acc, tramoId) => ({ ...acc, [tramoId]: false }), {}));
    setShowTraffic(false);
  };

  const colors = {
    'T-1': '#27ae60', // Verde
    'T-2': '#3498db', // Azul
    'T-3': '#f39c12'  // Naranja
  };

  return (
    <div className="estacion-control-tab-wrapper">
      <div style={{ display: 'flex', minHeight: '600px', padding: '20px', gap: '20px', alignItems: 'stretch' }}>
        <div style={{ flex: '3', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '820px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <ErrorBoundary>
              <Geoite height="100%" projectId={projectId} section="trafico">
                <MapViewController setView={setView} />
              </Geoite>
            </ErrorBoundary>
          </div>
          <div style={{ display: 'grid', gap: '20px', marginTop: '12px' }}>
            <div className="stations-container-box" style={{ width: '100%' }}>
              <div className="stations-header">
                <h3 className="stations-title">
                  <i className="fas fa-map-marker-alt"></i>
                  Tramos
                </h3>
                <button
                  onClick={openImageFileExplorerModal}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '5px',
                    border: '1px solid #007bff',
                    backgroundColor: '#007bff',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    marginLeft: '10px'
                  }}
                >
                  Explorador de Archivos
                </button>
              </div>
              <div className="stations-content">
                <div className="stations-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', overflowX: 'auto', paddingBottom: '10px', width: '100%', gap: '10px' }}>
                  {Object.keys(sectionData).map((sectionId) => (
                    <div
                      key={sectionId}
                      className={`station-btn-large ${selectedSection === sectionId ? 'active' : ''}`}
                      onClick={() => handleSectionSelect(sectionId)}
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        flex: '1 1 calc(33.33% - 10px)', // Make buttons take 33.33% of the width minus gap
                        maxWidth: 'calc(33.33% - 10px)', // Ensure they don't grow beyond 33.33% minus gap
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingBottom: '10px' // Add some padding at the bottom
                      }}
                    >
                      <div className="station-info" style={{ marginBottom: '10px' }}>
                        <strong>{sectionData[sectionId].info.id}</strong>
                        <small>{sectionData[sectionId].info.nombre}</small>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); openUploadModal(sectionId); }}
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          right: '5px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          fontSize: '1.2em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fas fa-upload"></i>
                      </button>
                      {sectionData[sectionId].info && sectionData[sectionId].info.imagenes && sectionData[sectionId].info.imagenes.filter(img => img.source_type === 'tramo').length > 0 && (() => {
                        const sortedImages = [...sectionData[sectionId].info.imagenes.filter(img => img.source_type === 'tramo')].sort((a, b) => {
                          return new Date(b.upload_date) - new Date(a.upload_date);
                        });
                        const latestImage = sortedImages[0];
                        return (
                          <div
                            style={{
                              width: '100%',
                              marginTop: '10px',
                              textAlign: 'center',
                              padding: '8px',
                              backgroundColor: '#f0f0f0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: '1px solid #ddd',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              fontSize: '12px',
                              color: '#333',
                              fontWeight: 'bold'
                            }}
                            onClick={(e) => { e.stopPropagation(); openImageModal(latestImage.image_url); }}
                          >
                            {latestImage.description || 'Ver última imagen'}
                          </div>
                        );
                      })()}
                      {!(sectionData[sectionId].info && sectionData[sectionId].info.imagenes && sectionData[sectionId].info.imagenes.filter(item => item.source_type === 'tramo').length > 0) && (
                        <div style={{ width: '100%', marginTop: '10px', textAlign: 'center', color: '#777', fontSize: '12px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', border: '1px solid #ddd' }}>
                          <p style={{ margin: '0' }}>No hay imagen.</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="legend-container-box" style={{ width: '100%' }}>
              <div className="legend-header">
                <h3 className="legend-title">
                  <i className="fas fa-layer-group"></i>
                  Leyenda
                </h3>
                <div className="legend-controls">
                  <button className="legend-btn" onClick={showAll}>
                    <i className="fas fa-eye"></i> Mostrar Todo
                  </button>
                  <button className="legend-btn" onClick={hideAll}>
                    <i className="fas fa-eye-slash"></i> Ocultar Todo
                  </button>
                </div>
              </div>
              <div className="legend-content">
                <div className="legend-group">
                  <div className="legend-group-header">
                    <div className="group-title">
                      <i className="fas fa-road"></i>
                      <span>Tramos Homogéneos</span>
                    </div>
                  </div>
                  <div className="legend-items">
                    {Object.keys(visibility).map(tramoId => (
                      <div className="legend-item" key={tramoId}>
                        <div className="legend-icon" style={{ color: colors[tramoId] || '#000000' }}>
                          <i className="fas fa-route"></i>
                        </div>
                        <span className="legend-label">{sectionData[tramoId]?.info?.nombre}</span>
                        <label className="toggle-switch small">
                          <input
                            type="checkbox"
                            checked={visibility[tramoId]}
                            onChange={() => handleVisibilityChange(tramoId)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: '0.8', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h3 onClick={() => setIsSectionDataVisible(!isSectionDataVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Tramo Datos</span>
              <i className={`fas fa-chevron-down accordion-icon ${isSectionDataVisible ? '' : 'collapsed'}`}></i>
            </h3>
            <CSSTransition
              nodeRef={sectionDataRef}
              in={isSectionDataVisible}
              timeout={500}
              classNames="accordion-content"
              unmountOnExit
            >
              <div ref={sectionDataRef}>
                {currentSectionData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <strong>Nombre:</strong> {currentSectionData.info.nombre}
                    </div>
                    <div>
                      <strong>Ubicación:</strong> {currentSectionData.info.ubicacion}
                    </div>
                    <div>
                      <strong>Coordenadas:</strong>
                      {currentSectionData.info.coordenadas &&
                        (() => {
                          const parts = currentSectionData.info.coordenadas.split('-');
                          const startCoords = parts[0] ? parts[0].trim() : 'N/A';
                          const endCoords = parts[1] ? parts[1].trim() : 'N/A';
                          return (
                            <div style={{ marginTop: '5px' }}>
                              <div style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '4px', backgroundColor: '#f9f9f9', marginBottom: '5px' }}>
                                <strong>Inicio:</strong> {startCoords}
                              </div>
                              <div style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                                <strong>Fin:</strong> {endCoords}
                              </div>
                            </div>
                          );
                        })()
                      }
                    </div>
                    <div>
                      <strong>Descripción:</strong> {currentSectionData.info.descripcion}
                    </div>
                  </div>
                )}
              </div>
            </CSSTransition>
          </div>
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h3 onClick={() => setIsPhotosVisible(!isPhotosVisible)} style={{ margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Fotos y Gráficos</span>
              <i className={`fas fa-chevron-down accordion-icon ${isPhotosVisible ? '' : 'collapsed'}`}></i>
            </h3>
            <CSSTransition
              nodeRef={photosRef}
              in={isPhotosVisible}
              timeout={500}
              classNames="accordion-content"
              unmountOnExit
            >
              <div ref={photosRef}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {currentSectionData && currentSectionData.info && currentSectionData.info.imagenes &&
                    Object.values(currentSectionData.info.imagenes.filter(image => image.source_type === 'tramo').reduce((acc, image) => {
                      const key = `${image.description || 'Sin descripción'}-${image.upload_date || 'Sin fecha'}`;
                      if (!acc[key]) {
                        acc[key] = { description: image.description, upload_date: image.upload_date, images: [] };
                      }
                      acc[key].images.push(image);
                      return acc;
                    }, {})).map((group, groupIndex) => (
                      <div key={groupIndex} style={{ gridColumn: '1 / -1', marginBottom: '15px', border: '1px solid #eee', padding: '10px', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#34495e', fontSize: '1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            {group.description || 'Sin descripción'} ({group.upload_date ? new Date(group.upload_date).toLocaleDateString() : 'Sin fecha'})
                          </span>
                          <button
                            onClick={() => handleDeleteImageGroup(selectedSection, group.description, group.upload_date)}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '5px 10px',
                              cursor: 'pointer',
                              fontSize: '0.8em'
                            }}
                          >
                            Eliminar Grupo
                          </button>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                          {group.images.map((image, imageIndex) => (
                            <div key={imageIndex} style={{ position: 'relative', width: '100%', height: '100px', overflow: 'hidden', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => openImageModal(image.image_url)}>
                              <img src={image.image_url} alt={`Uploaded ${imageIndex}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <small style={{ color: '#666' }}>Galería de imágenes del tramo</small>
                </div>
              </div>
            </CSSTransition>
          </div>
        </div>
      </div>
      <UploadModal
        isOpen={isModalOpen}
        onClose={closeUploadModal}
        entityId={sectionIdToUpload}
        onUploadSuccess={handleUploadSuccess}
        uploadUrl="/api/trafico/tramo/upload-image"
        entityIdName="tramoId"
      />
      <ImageFileExplorerModal
        isOpen={isImageFileExplorerModalOpen}
        onClose={closeImageFileExplorerModal}
        data={sectionData}
        dataType="tramo"
        isNavbarExpanded={isNavbarExpanded}
      />
      <ImageDisplayModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        imageUrl={imageToDisplay}
        isNavbarExpanded={isNavbarExpanded}
      />
    </div>
  );
};

export default TramosHomogeneosTab;
