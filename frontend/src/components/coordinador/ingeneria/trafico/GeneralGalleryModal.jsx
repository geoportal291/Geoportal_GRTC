import React, { useState } from 'react';

const GeneralGalleryModal = ({ isOpen, onClose, images, isNavbarExpanded }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  const modalPaddingTop = isNavbarExpanded ? '60px' : '0';

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const currentImage = images[currentImageIndex];

  return (
    <div style={{
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
      paddingTop: modalPaddingTop,
      transition: 'padding-top 0.3s ease-in-out'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        maxWidth: '90%',
        maxHeight: '90%',
        overflow: 'hidden', 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'max-height 0.3s ease-in-out'
      }} onClick={e => e.stopPropagation()}> 
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '1.5em',
          cursor: 'pointer',
          color: '#333'
        }}>X</button>

        {images.length > 0 ? (
          <>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', textAlign: 'center' }}>
              Galería General ({currentImageIndex + 1} de {images.length})
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flexGrow: 1 }}>
              <button onClick={goToPreviousImage} disabled={images.length <= 1} style={{
                background: 'none',
                border: 'none',
                fontSize: '2em',
                cursor: 'pointer',
                color: '#555',
                marginRight: '10px'
              }}>&lt;</button>
              <img 
                src={currentImage.image_url} 
                alt={`Galería ${currentImageIndex}`} 
                style={{ maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain' }}
              />
              <button onClick={goToNextImage} disabled={images.length <= 1} style={{
                background: 'none',
                border: 'none',
                fontSize: '2em',
                cursor: 'pointer',
                color: '#555',
                marginLeft: '10px'
              }}>&gt;</button>
            </div>
            <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.9em', color: '#666' }}>
              <p style={{ margin: '5px 0' }}>Descripción: {currentImage.description || 'Sin descripción'}</p>
              <p style={{ margin: '5px 0' }}>Fecha: {currentImage.upload_date ? new Date(currentImage.upload_date).toLocaleDateString() : 'Sin fecha'}</p>
              <p style={{ margin: '5px 0' }}>Estación: {currentImage.stationId || 'N/A'}</p>
            </div>
          </>
        ) : (
          <p>No hay imágenes disponibles en la galería general.</p>
        )}
      </div>
    </div>
  );
};

export default GeneralGalleryModal;
