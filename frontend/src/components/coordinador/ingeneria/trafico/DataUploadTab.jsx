import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import axiosInstance from '../../../../api/axios';
import ImageDisplayModal from './ImageDisplayModal';
import UploadModal from './UploadModal';
import ImageFileExplorerModal from './ImageFileExplorerModal';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import { CSSTransition } from 'react-transition-group';
import './EstacionControlTab.css';

// Componente para manejar la vista del mapa
const MapViewController = ({ cu104Route, setView, view }) => {
  const map = useMap();
  const isInitialFitDone = useRef(false);

  useEffect(() => {
    if (cu104Route && cu104Route.length > 0 && !isInitialFitDone.current) {
      const latLngs = cu104Route.map(point => [point.lat, point.lng]);
      map.fitBounds(latLngs, { padding: [50, 50] });
      isInitialFitDone.current = true;
    }
  }, [cu104Route, map]);

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


const DataUploadTab = ({ 
  cu104Route,
  stationData,
  selectedStation,
  handleStationSelect,
  showRoute,
  setShowRoute,
  showTraffic,
  setShowTraffic,
  refreshStationData,
  setIsLoadingImages,
  isLoadingImages,
  isNavbarExpanded
}) => {
  const [view, setView] = useState({ center: [-12.5, -72.5], zoom: 11 });
  const currentStationData = stationData[selectedStation];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stationIdToUpload, setStationIdToUpload] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageToDisplay, setImageToDisplay] = useState(null);
  const [isImageFileExplorerModalOpen, setIsImageFileExplorerModalOpen] = useState(false);
  const [isStationDataVisible, setIsStationDataVisible] = useState(true);
  const [isPhotosVisible, setIsPhotosVisible] = useState(true);
  const [isDataCollectionVisible, setIsDataCollectionVisible] = useState(true);
  const stationDataRef = useRef(null);
  const photosRef = useRef(null);
  const dataCollectionRef = useRef(null);

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

  const handleUploadSuccess = (stationId, newImageData) => {
    refreshStationData();
  };

  const openUploadModal = (stationId) => {
    setStationIdToUpload(stationId);
    setIsModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsModalOpen(false);
    setStationIdToUpload(null);
  };

  const handleDeleteImageGroup = async (stationId, description, uploadDate) => {
    alertify.confirm(
      'Eliminar Grupo de Imágenes',
      '¿Estás seguro de que quieres eliminar este grupo de imágenes?\nEsta acción eliminará todas las imágenes con la descripción "' + description + '" y fecha "' + uploadDate + '" para esta estación.',
      async function() {
        try {
          await axiosInstance.delete(`/api/trafico/delete-image-group`, {
            data: { stationId, description, uploadDate }
          });
          refreshStationData();
          alertify.success('Grupo de imágenes eliminado con éxito.');
        } catch (error) {
          console.error('Error al eliminar el grupo de imágenes:', error);
          alertify.error('Error al eliminar el grupo de imágenes.');
        }
      },
      function() {
        alertify.error('Eliminación cancelada.');
      }
    );
  };

  return (
    <div className="estacion-control-tab-wrapper">
      <div style={{display: 'flex', minHeight: '600px', padding: '20px', gap: '20px', alignItems: 'stretch'}}>
        {/* Mapa principal - a la izquierda */}
        <div style={{flex: '3', display: 'flex', flexDirection: 'column'}}>
          <div style={{height: '500px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
            <MapContainer center={view.center} zoom={view.zoom} zoomControl={false} className="map-container-custom-controls" style={{height: '100%', width: '100%'}}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapViewController setView={setView} cu104Route={cu104Route} />
              {showRoute && (
                <Polyline
                  positions={cu104Route.map(point => [point.lat, point.lng])}
                  color="#e74c3c"
                  weight={4}
                  opacity={0.8}
                />
              )}
              {showTraffic && Object.values(stationData).map((station) => {
                const images = station.info.imagenes;
                let randomImageUrl = null;
                if (images && images.length > 0) {
                  const randomIndex = Math.floor(Math.random() * images.length);
                  randomImageUrl = images[randomIndex].image_url;
                }

                return (
                  <Marker
                    key={station.info.id}
                    position={[station.info.lat, station.info.lng]}
                    eventHandlers={{
                      click: () => {
                        handleStationSelect(station.info.id);
                      },
                      mouseover: (event) => {
                        event.target.openPopup();
                      },
                      mouseout: (event) => {
                        event.target.closePopup();
                      },
                    }}
                    icon={divIcon({
                      className: 'custom-station-icon',
                      html: `<div style="
                      background-color: ${selectedStation === station.info.id ? '#1abc9c' : '#2ecc71'};
                        border: ${selectedStation === station.info.id ? '4px solid #34495e' : '2px solid #27ae60'};
                        border-radius: 50%;
                        width: ${selectedStation === station.info.id ? '40px' : '30px'};
                        height: ${selectedStation === station.info.id ? '40px' : '30px'};
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: white;
                        font-weight: bold;
                        font-size: ${selectedStation === station.info.id ? '14px' : '12px'};
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      ">${station.info.id}</div>`,
                      iconSize: selectedStation === station.info.id ? [50, 50] : [40, 40],
                      iconAnchor: selectedStation === station.info.id ? [25, 25] : [20, 20],
                      popupAnchor: selectedStation === station.info.id ? [0, -25] : [0, -20],
                    })}
                  >
                                        <Popup>
                      <div style={{ maxWidth: '250px', fontFamily: 'Arial, sans-serif' }}>
                        <strong style={{ fontSize: '14px', color: '#333' }}>{station.info.nombre}</strong>
                        {randomImageUrl && (
                          <img 
                            src={randomImageUrl} 
                            alt={`Foto de ${station.info.nombre}`}
                            style={{ 
                              width: '100%', 
                              height: '150px',
                              objectFit: 'cover',
                              marginTop: '8px', 
                              borderRadius: '4px' 
                            }} 
                          />
                        )}
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#555' }}>
                          <strong>Ubicación:</strong> {station.info.ubicacion}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          <div style={{display: 'grid', gap: '20px', marginTop: '12px'}}>
            <div className="stations-container-box" style={{ width: '100%' }}>
              <div className="stations-header">
                <h3 className="stations-title">
                  <i className="fas fa-map-marker-alt"></i>
                  Estaciones
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
                  {Object.keys(stationData).map((stationId) => (
                    <div
                      key={stationId}
                      className={`station-btn-large ${selectedStation === stationId ? 'active' : ''}`}
                      onClick={() => handleStationSelect(stationId)}
                      style={{
                        cursor: 'pointer',
                        position: 'relative',
                        flex: '1 1 calc(25% - 10px)', // Make buttons take up 25% of the width minus gap
                        maxWidth: 'calc(25% - 10px)', // Ensure they don't grow beyond 25% minus gap
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingBottom: '10px' // Add some padding at the bottom
                      }}
                    >
                      <div className="station-info" style={{ marginBottom: '10px' }}> {/* Add margin to separate from image */}
                        <strong>{stationData[stationId].info.id}</strong>
                        <small>{stationData[stationId].info.nombre}</small>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); openUploadModal(stationId); }}
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
                      {stationData[stationId].info && stationData[stationId].info.imagenes && stationData[stationId].info.imagenes.length > 0 && (() => {
                        const sortedImages = [...stationData[stationId].info.imagenes].sort((a, b) => {
                          return new Date(b.upload_date) - new Date(a.upload_date);
                        });
                        const latestImage = sortedImages[0];
                        const fileName = latestImage.image_url.split('/').pop(); // Obtener el nombre del archivo
                        const displayFileName = fileName.substring(0, fileName.lastIndexOf('.')); // Quitar la extensión
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
                      {!(stationData[stationId].info && stationData[stationId].info.imagenes && stationData[stationId].info.imagenes.length > 0) && (
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
                  <button className="legend-btn" onClick={() => {setShowRoute(true); setShowTraffic(true);}}>
                    <i className="fas fa-eye"></i> Mostrar Todo
                  </button>
                  <button className="legend-btn" onClick={() => {setShowRoute(false); setShowTraffic(false);}}>
                    <i className="fas fa-eye-slash"></i> Ocultar Todo
                  </button>
                </div>
              </div>
              <div className="legend-content">
                <div className="legend-group">
                  <div className="legend-group-header">
                    <div className="group-title">
                      <i className="fas fa-road"></i>
                      <span>Infraestructura Vial</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={showRoute}
                        onChange={(e) => setShowRoute(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="legend-items">
                    <div className="legend-item">
                      <div className="legend-icon" style={{color: '#e74c3c'}}>
                        <i className="fas fa-route"></i>
                      </div>
                      <span className="legend-label">Ruta CU-104</span>
                      <label className="toggle-switch small">
                        <input
                          type="checkbox"
                          checked={showRoute}
                          onChange={(e) => setShowRoute(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="legend-group">
                  <div className="legend-group-header">
                    <div className="group-title">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>Estaciones de Tráfico</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={showTraffic}
                        onChange={(e) => setShowTraffic(e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="legend-items">
                    <div className="legend-item">
                      <div className="legend-icon" style={{color: '#3498db'}}>
                        <i className="fas fa-traffic-light"></i>
                      </div>
                      <span className="legend-label">Puntos de Control</span>
                      <label className="toggle-switch small">
                        <input
                          type="checkbox"
                          checked={showTraffic}
                          onChange={(e) => setShowTraffic(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{flex: '0.8', display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px'}}>
            <h3 onClick={() => setIsStationDataVisible(!isStationDataVisible)} style={{margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Estación Datos</span>
              <i className={`fas fa-chevron-down accordion-icon ${isStationDataVisible ? '' : 'collapsed'}`}></i>
            </h3>
            <CSSTransition
              nodeRef={stationDataRef}
              in={isStationDataVisible}
              timeout={500}
              classNames="accordion-content"
              unmountOnExit
            >
              <div ref={stationDataRef}>
                {currentStationData && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px'}}>
                    <div>
                      <strong>Nombre:</strong> {currentStationData.info.nombre}
                    </div>
                    <div>
                      <strong>Ubicación:</strong> {currentStationData.info.ubicacion}
                    </div>
                    <div>
                      <strong>Coordenadas:</strong> {currentStationData.info.coordenadas}
                    </div>
                    <div>
                      <strong>Altitud:</strong> {currentStationData.info.altitud} msnm
                    </div>
                    <div>
                      <strong>Descripción:</strong> {currentStationData.info.descripcion}
                    </div>
                  </div>
                )}
              </div>
            </CSSTransition>
          </div>
          <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px'}}>
            <h3 onClick={() => setIsPhotosVisible(!isPhotosVisible)} style={{margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
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
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'}}>
                    {/* Agrupar imágenes por descripción y fecha */}
                    {currentStationData && currentStationData.info && currentStationData.info.imagenes &&
                      Object.values(currentStationData.info.imagenes.reduce((acc, image) => {
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
                            onClick={() => handleDeleteImageGroup(selectedStation, group.description, group.upload_date)}
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
                              <div key={imageIndex} style={{ position: 'relative', width: '100%', height: '100px', overflow: 'hidden', borderRadius: '4px', border: '1px solid #ddd' }}>
                                <img src={image.image_url} alt={`Uploaded ${imageIndex}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
              
                <div style={{marginTop: '15px', textAlign: 'center'}}>
                  <small style={{color: '#666'}}>Galería de imágenes de la estación</small>
                </div>
              </div>
            </CSSTransition>
          </div>
          <div style={{background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px'}}>
            <h3 onClick={() => setIsDataCollectionVisible(!isDataCollectionVisible)} style={{margin: '0 0 15px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>Fichas De Recoleccion De Data</span>
              <i className={`fas fa-chevron-down accordion-icon ${isDataCollectionVisible ? '' : 'collapsed'}`}></i>
            </h3>
            <CSSTransition
              nodeRef={dataCollectionRef}
              in={isDataCollectionVisible}
              timeout={500}
              classNames="accordion-content"
              unmountOnExit
            >
              <div ref={dataCollectionRef}>
                {/* Contenido de Fichas De Recoleccion De Data */}
                <p>Aquí se mostrarán las fichas de recolección de datos.</p>
              </div>
            </CSSTransition>
          </div>
        </div>
      </div>
      <UploadModal 
        isOpen={isModalOpen}
        onClose={closeUploadModal}
        entityId={stationIdToUpload}
        onUploadSuccess={handleUploadSuccess}
        uploadUrl="https://backend-nameless-log-553.fly.dev/api/trafico/conteovehicular/upload-image"
        entityIdName="stationId"
      />
      <ImageFileExplorerModal
        isOpen={isImageFileExplorerModalOpen}
        onClose={closeImageFileExplorerModal}
        data={stationData}
        dataType="station"
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

export default DataUploadTab;
