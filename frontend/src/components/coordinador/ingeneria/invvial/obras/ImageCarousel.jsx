import React, { useState, useEffect } from 'react';

const ImageCarousel = ({ images, metadata, alcantarillaId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    // Reset index and set initial image when images or alcantarillaId changes
    setCurrentIndex(0);
    if (images && images.length > 0) {
      setIsLoading(true);
      setImageSrc(images[0].url);
    }
  }, [images, alcantarillaId]);

  useEffect(() => {
    // Update image source and show loader when index changes
    if (images && images.length > 0) {
      setIsLoading(true);
      setImageSrc(images[currentIndex].url);
    }
  }, [currentIndex, images]);

  if (!images || images.length === 0) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', // Relación de aspecto 16:9
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '1.2em'
      }}>
        <img src="https://via.placeholder.com/600x337?text=No+Image" alt="No hay imagen disponible" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }} />
        {metadata && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '0.8em'
          }}>
            {metadata.fecha} {metadata.hora}<br />
            {metadata.coordenadas}<br />
            {metadata.altitud}
          </div>
        )}
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : prevIndex));
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Función para formatear las coordenadas de la imagen
  const formatCoordinates = (lat, lon) => {
    if (lat && lon) {
      return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
    }
    return "N/A";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '40%', // Reduced aspect ratio from 56.25% (16:9) to make it shorter
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '1.2em'
      }}>
        {/* Loading Overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 2
          }}>
            Cargando...
          </div>
        )}

        <img
          src={imageSrc}
          onLoad={handleImageLoad}
          alt={`Alcantarilla ${alcantarillaId} - ${currentIndex + 1}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoading ? 0.5 : 1, // Optionally make the old image less visible while loading
            transition: 'opacity 0.2s'
          }}
        />
        {/* Metadatos superpuestos */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '0.8em',
          zIndex: 1 // Ensure metadata is above the image but below the loader
        }}>
          {currentImage.fecha && <>Fecha: {currentImage.fecha.split('T')[0]}<br /></>}
          {currentImage.hora && <>Hora: {currentImage.hora.split('T')[1].substring(0, 8)}<br /></>}
          {currentImage.latitud && currentImage.longitud && <>Coords: {formatCoordinates(currentImage.latitud, currentImage.longitud)}<br /></>}
          {currentImage.altitud && <>Altitud: {currentImage.altitud} m<br /></>}
        </div>
      </div>
      {/* Controles de navegación de carrusel */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <button onClick={goToPrevious} disabled={currentIndex === 0 || isLoading} style={{ padding: '8px 15px', border: '1px solid #ccc', borderRadius: '5px', background: '#f8f8f8', cursor: 'pointer' }}>Anterior</button>
        <span>{currentIndex + 1} de {images.length}</span>
        <button onClick={goToNext} disabled={currentIndex === images.length - 1 || isLoading} style={{ padding: '8px 15px', border: '1px solid #ccc', borderRadius: '5px', background: '#f8f8f8', cursor: 'pointer' }}>Siguiente</button>
      </div>
    </div>
  );
};

export default ImageCarousel;
