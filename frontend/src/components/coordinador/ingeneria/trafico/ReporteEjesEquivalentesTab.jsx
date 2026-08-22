import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, useMap } from 'react-leaflet';
import axiosInstance from '@/api/axios';
import ImageDisplayModal from './ImageDisplayModal';

import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import { CSSTransition } from 'react-transition-group';
import * as XLSX from 'xlsx';
import UploadTrafficDataModal from './UploadTrafficDataModal';
import EjesEquivalentesModal from './EjesEquivalentesModal';
import ErrorBoundary from '@/components/ErrorBoundary';

// Componente para manejar la vista del mapa (adaptado para sectionData)
const MapViewController = ({ sectionData, setView, view }) => {
  const map = useMap();
  const isInitialFitDone = useRef(false);

  useEffect(() => {
    if (sectionData && Object.keys(sectionData).length > 0 && !isInitialFitDone.current) {
      const allCoords = Object.values(sectionData).flatMap(section => section.info.coordinates);
      if (allCoords.length > 0) {
        map.fitBounds(allCoords, { padding: [50, 50] });
        isInitialFitDone.current = true;
      }
    }
  }, [sectionData, map]);

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

function ReporteEjesEquivalentesTab({
  sectionData, // Recibido como prop
  selectedSection, // Recibido como prop
  handleSectionSelect, // Recibido como prop
  refreshData, // Recibido como prop
  isNavbarExpanded
}) {
  const [view, setView] = useState({ center: [-12.5, -72.5], zoom: 11 });
  const [showTraffic, setShowTraffic] = useState(true); // Asegurar que los tramos se muestren

  const currentSectionData = sectionData && selectedSection ? sectionData[selectedSection] : null;

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToDisplay, setImageToDisplay] = useState(null);

  const [isSectionDataVisible, setIsSectionDataVisible] = useState(true);
  const [isPhotosVisible, setIsPhotosVisible] = useState(true);
  const sectionDataRef = useRef(null);
  const photosRef = useRef(null);

  const [visibility, setVisibility] = useState(() => {
    const initialVisibility = {};
    if (sectionData) {
      Object.keys(sectionData).forEach(tramoId => {
        initialVisibility[tramoId] = true;
      });
    }
    return initialVisibility;
  });

  const [showEjesEquivalentesModal, setShowEjesEquivalentesModal] = useState(false);

  const openImageModal = (imageUrl) => {
    setImageToDisplay(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageToDisplay(null);
  };

  const handleVisibilityChange = (tramoId) => {
    setVisibility(prev => ({ ...prev, [tramoId]: !prev[tramoId] }));
  };

  const showAll = () => {
    if (sectionData) {
      setVisibility(Object.keys(sectionData).reduce((acc, tramoId) => ({ ...acc, [tramoId]: true }), {}));
    }
    setShowTraffic(true);
  };

  const hideAll = () => {
    if (sectionData) {
      setVisibility(Object.keys(sectionData).reduce((acc, tramoId) => ({ ...acc, [tramoId]: false }), {}));
    }
    setShowTraffic(false);
  };

  const colors = {
    'T-1': '#27ae60', // Verde
    'T-2': '#3498db', // Azul
    'T-3': '#f39c12'  // Naranja
  };

  // useEffect para actualizar la visibilidad cuando sectionData cambia
  useEffect(() => {
    if (sectionData) {
      setVisibility(Object.keys(sectionData).reduce((acc, tramoId) => ({ ...acc, [tramoId]: true }), {}));
    }
  }, [sectionData]);

  return (
    <div className="estacion-control-tab-wrapper">
      <div style={{display: 'flex', minHeight: '600px', padding: '20px', gap: '20px', alignItems: 'stretch'}}>
        {/* MAPA principal - a la izquierda */}
        <div style={{flex: '3', display: 'flex', flexDirection: 'column'}}>
          <div style={{height: '500px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
            <ErrorBoundary>
              <MapContainer center={view.center} zoom={13} zoomControl={false} className="map-container-custom-controls" style={{height: '100%', width: '100%'}}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapViewController setView={setView} sectionData={sectionData} />
              {showTraffic && sectionData && Object.keys(sectionData).map(sectionId => {
                const section = sectionData[sectionId];
                const isSelected = selectedSection === sectionId;

                if (!visibility[sectionId] || !section.info.coordinates) {
                  return null;
                }

                return (
                  <Polyline
                    key={`${sectionId}-${isSelected}`}
                    positions={section.info.coordinates}
                    pathOptions={{
                      color: isSelected ? '#00FFFF' : (colors[sectionId] || '#3388ff'),
                      weight: 8,
                    }}
                    eventHandlers={{
                      click: (e) => {
                        handleSectionSelect(sectionId);
                      },
                      mouseover: (e) => {
                        e.target.openPopup();
                      },
                      mouseout: (e) => {
                        e.target.closePopup();
                      },
                    }}
                  >
                    <Popup>
                      Tramo: {section.info.nombre}<br/>
                      {section.info.imagenes && section.info.imagenes.filter(img => img.source_type === 'encuesta_velocidad_image').length > 0 && (() => {
                        const filteredImages = section.info.imagenes.filter(img => img.source_type === 'encuesta_velocidad_image');
                        const randomIndex = Math.floor(Math.random() * filteredImages.length);
                        const randomImage = filteredImages[randomIndex];
                        return (
                          <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            <img src={randomImage.image_url} alt={randomImage.description || 'Imagen del tramo'} style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                            <p style={{ fontSize: '0.8em', margin: '5px 0 0 0' }}>{randomImage.description || 'Imagen'}</p>
                          </div>
                        );
                      })()}
                      <p style={{ fontSize: '0.9em', margin: '5px 0 0 0' }}>Ubicación: {section.info.ubicacion}</p>
                    </Popup>
                  </Polyline>
                );
              })}
            </MapContainer>
            </ErrorBoundary>
          </div>
          <div style={{display: 'grid', gap: '20px', marginTop: '12px'}}>
            <div className="stations-container-box" style={{ width: '100%', position: 'relative', paddingBottom: '50px' }}>
              <div className="stations-header">
                <h3 className="stations-title">
                  <i className="fas fa-map-marker-alt"></i>
                  Tramos
                </h3>

              </div>
              <div className="stations-content">
                <div className="stations-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', overflowX: 'auto', paddingBottom: '10px', width: '100%', gap: '10px' }}>
                  {sectionData && Object.keys(sectionData).map((sectionId) => (
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
                      <div className="station-info" style={{ marginBottom: '10px' }}> {/* Add margin to separate from image */}
                        <strong>{sectionData[sectionId].info.id}</strong>
                        <small>{sectionData[sectionId].info.nombre}</small>
                      </div>


                      {sectionData[sectionId].info && sectionData[sectionId].info.imagenes && sectionData[sectionId].info.imagenes.filter(item => item.source_type === 'encuesta_velocidad_file').length > 0 && (() => {
                        const sortedItems = [...sectionData[sectionId].info.imagenes.filter(item => item.source_type === 'encuesta_velocidad_file')].sort((a, b) => {
                          return new Date(b.upload_date) - new Date(a.upload_date);
                        });
                        const latestItem = sortedItems[0];
                        const isImage = latestItem.image_url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i);

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
                            onClick={(e) => { e.stopPropagation(); isImage ? openImageModal(latestItem.image_url) : window.open(latestItem.image_url, '_blank'); }}
                          >
                            {isImage ? (
                              <img src={latestItem.image_url} alt={latestItem.description || 'Última imagen'} style={{ width: '100%', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                            ) : (
                              <i className="fas fa-file-alt" style={{ marginRight: '5px' }}></i>
                            )}
                            <p style={{ margin: '5px 0 0 0' }}>{latestItem.description || latestItem.image_url.split('/').pop()}</p>
                          </div>
                        );
                      })()}

                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
          {selectedSection && (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '20px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <button
                onClick={() => setShowEjesEquivalentesModal(true)}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: 'auto'
                }}
              >
                Mostrar Ejes Equivalentes
              </button>
            </div>
          )}
        </div>

        <div style={{flex: '0.8', display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px'}}>
            <h3 onClick={() => setIsSectionDataVisible(!isSectionDataVisible)} style={{margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
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
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px'}}>
                    <div>
                      <strong>Nombre:</strong> {currentSectionData.info.nombre}
                    </div>
                    <div>
                      <strong>Ubicación:</strong> {currentSectionData.info.ubicacion}
                    </div>
                    <div>
                      <strong>Coordenadas:</strong> {currentSectionData.info.coordenadas}
                    </div>
                    <div>
                      <strong>Altitud:</strong> {currentSectionData.info.altitud} msnm
                    </div>
                    <div>
                      <strong>Descripción:</strong> {currentSectionData.info.descripcion}
                    </div>
                  </div>
                )}
              </div>
            </CSSTransition>
          </div>
                   {currentSectionData && (
            <button
              onClick={() => alert('Descargar Reporte Clicked!')} // Placeholder for future functionality
              style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: '100%',
                  marginTop: '20px',
                  boxSizing: 'border-box', // Ensure padding and border are included in the width
                  margin: '0 auto' // Center horizontally
              }}
            >
                Descargar Reporte
            </button>
          )}

        </div>

      </div>


      <ImageDisplayModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        imageUrl={imageToDisplay}
        isNavbarExpanded={isNavbarExpanded}
      />

      <EjesEquivalentesModal
        isOpen={showEjesEquivalentesModal}
        onClose={() => setShowEjesEquivalentesModal(false)}
        selectedSection={selectedSection}
        isNavbarExpanded={isNavbarExpanded}
      />
    </div>
  );
};
export default ReporteEjesEquivalentesTab;