import React, { useState } from 'react';

const ImageFileExplorerModal = ({ isOpen, onClose, data, isNavbarExpanded, dataType, allowedSourceTypes }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  const filterImages = (images) => {
    if (!allowedSourceTypes || allowedSourceTypes.length === 0) return images;
    return images.filter(image => allowedSourceTypes.includes(image.source_type));
  };

  if (!isOpen) return null;

  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const groupImages = (images) => {
    return images.reduce((acc, image) => {
      const groupName = image.group_name || image.description || 'Sin descripción';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(image);
      return acc;
    }, {});
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
        transition: 'padding-left 0.3s ease-in-out',
    paddingLeft: isNavbarExpanded ? '200px' : '80px', // Adjust based on navbar state
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    width: '95%',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  };

  const title = dataType === 'station' ? 'Estaciones' : 'Tramos';

  return (
    <div
      style={modalStyle}
      onClick={onClose}
    >
      <div
        style={modalContentStyle}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '1.5em',
            cursor: 'pointer',
            color: '#333',
            zIndex: 10
          }}
        >
          X
        </button>

        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', textAlign: 'center' }}>
          Explorador de Archivos de Imágenes
        </h3>

        <div style={{ display: 'flex', flexGrow: 1, border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
          <div
            style={{
              width: '300px',
              borderRight: '1px solid #eee',
              padding: '15px',
              overflowY: 'auto',
              backgroundColor: '#f8f8f8'
            }}
          >
            <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>{title}</h4>
            {Object.values(data).map(item => {
              const filteredImages = filterImages(item.info.imagenes || [], dataType === 'conteo_vehicular' ? 'conteo_vehicular' : 'estacion_control');
                            const imagesByGroup = groupImages(filteredImages);

              return (
                <div key={item.info.id} style={{ marginBottom: '10px' }}>
                  <div
                    onClick={() => toggleItemExpansion(item.info.id)}
                    style={{
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      padding: '5px 0',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#007bff'
                    }}
                  >
                    <i className={`fas ${expandedItems[item.info.id] ? 'fa-folder-open' : 'fa-folder'}`} style={{ marginRight: '8px' }}></i>
                    {item.info.nombre} ({item.info.id})
                  </div>

                  {expandedItems[item.info.id] && (
                    <div style={{ marginLeft: '20px', borderLeft: '1px dashed #ccc', paddingLeft: '10px' }}>
                      {filteredImages.length > 0 ? (
                        Object.keys(imagesByGroup).map(groupName => (
                          <div key={groupName} style={{ marginBottom: '5px' }}>
                            <div
                              onClick={() => toggleGroupExpansion(`${item.info.id}-${groupName}`)}
                              style={{
                                cursor: 'pointer',
                                fontWeight: 'normal',
                                padding: '3px 0',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#28a745'
                              }}
                            >
                              <i className={`fas ${expandedGroups[`${item.info.id}-${groupName}`] ? 'fa-folder-open' : 'fa-folder'}`} style={{ marginRight: '8px' }}></i>
                              {groupName}
                            </div>

                            {expandedGroups[`${item.info.id}-${groupName}`] && (
                              <div style={{ marginLeft: '20px', borderLeft: '1px dotted #ddd', paddingLeft: '10px' }}>
                                {imagesByGroup[groupName].map(image => (
                                  <div
                                    key={image.image_url}
                                    onClick={() => setSelectedImage({ ...image, itemId: item.info.id })}
                                    style={{
                                      cursor: 'pointer',
                                      padding: '2px 0',
                                      fontSize: '0.85em',
                                      color: selectedImage?.image_url === image.image_url ? '#007bff' : '#555',
                                      fontWeight: selectedImage?.image_url === image.image_url ? 'bold' : 'normal',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <i className={`fas ${image.image_url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i) ? 'fa-image' : 'fa-file-alt'}`} style={{ marginRight: '8px' }}></i>
                                    {image.image_url.split('/').pop().split('.')[0]}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.9em', color: '#777' }}>No hay imágenes.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backgroundColor: '#fff'
            }}
          >
            {selectedImage ? (
              <>
                {(() => {
                  const fileExtension = selectedImage.image_url.split('.').pop().toLowerCase();
                  const isImage = ['jpeg', 'jpg', 'gif', 'png', 'webp', 'svg', 'bmp'].includes(fileExtension);
                  const isPdf = fileExtension === 'pdf';
                  const isDocx = fileExtension === 'docx';
                  const isXlsx = fileExtension === 'xlsx';

                  if (isImage) {
                    return (
                      <img
                        src={selectedImage.image_url}
                        alt={selectedImage.description || 'Imagen seleccionada'}
                        style={{ maxWidth: '100%', maxHeight: '80%', objectFit: 'contain', marginBottom: '15px' }}
                      />
                    );
                  } else if (isPdf) {
                    return (
                      <iframe
                        src={selectedImage.image_url}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="PDF Viewer"
                      ></iframe>
                    );
                  } else if (isDocx || isXlsx) {
                    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(selectedImage.image_url)}&embedded=true`;
                    return (
                      <iframe
                        src={googleViewerUrl}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="Document Viewer"
                      ></iframe>
                    );
                  } else {
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <p>No se puede previsualizar este tipo de archivo.</p>
                        <a href={selectedImage.image_url} target="_blank" rel="noopener noreferrer">
                          Descargar {selectedImage.image_url.split('/').pop()}
                        </a>
                      </div>
                    );
                  }
                })()}
                <div style={{ textAlign: 'center', fontSize: '0.9em', color: '#333' }}>
                  <p style={{ margin: '5px 0' }}>Descripción: {selectedImage.description || 'Sin descripción'}</p>
                  <p style={{ margin: '5px 0' }}>Fecha: {selectedImage.upload_date ? new Date(selectedImage.upload_date).toLocaleDateString() : 'Sin fecha'}</p>
                  <p style={{ margin: '5px 0' }}>{selectedImage.source_type === 'conteo_vehicular_image' || selectedImage.source_type === 'conteo_vehicular_file' ? 'Estación' : 'Tramo'}: {selectedImage.itemId || 'N/A'}</p>
                  <a 
                    href={selectedImage.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      padding: '8px 15px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '5px',
                      textDecoration: 'none',
                      fontSize: '0.9em'
                    }}
                  >
                    <i className="fas fa-download" style={{ marginRight: '5px' }}></i>
                    Descargar Archivo
                  </a>
                </div>
              </>
            ) : (
              <p style={{ color: '#777' }}>Selecciona un archivo del explorador para visualizarlo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageFileExplorerModal;