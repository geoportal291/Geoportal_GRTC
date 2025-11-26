import React from 'react';
import ImageCarousel from './ImageCarousel';
import MiniMap from './MiniMap';

const DetalleAlcantarillaView = ({ alcantarilla, images, route, onCloseDetail }) => {
  if (!alcantarilla) {
    return null; // No renderizar si no hay alcantarilla seleccionada
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '1000px', // Aumentar el ancho máximo
        width: '95%',
        zIndex: 10001,
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Alcantarilla: {alcantarilla.codigo || alcantarilla.id_alcantarilla}</h2>
          <button onClick={onCloseDetail} style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#555',
            transition: 'color 0.2s ease'
          }} onMouseOver={(e) => e.currentTarget.style.color = '#333'} onMouseOut={(e) => e.currentTarget.style.color = '#555'}>&times;</button>
        </div>

        {/* Cuerpo Principal - 2 Columnas */}
        <div style={{ display: 'flex', gap: '20px', flex: 1 }}>

          {/* Columna Izquierda - Datos Técnicos */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: '#f9f9f9',
              borderRadius: '8px',
              padding: '15px',
              border: '1px solid #eee',
              flex: 1,
              overflowY: 'auto'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Datos Técnicos</h4>
              <p style={{ margin: '5px 0' }}><strong>Progresiva:</strong> {alcantarilla.progresiva || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>N de alcantarilla:</strong> {alcantarilla.codigo || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Clase:</strong> {alcantarilla.clase || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Tipo:</strong> {alcantarilla.tipo || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Estado:</strong> {alcantarilla.estado || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Longitud:</strong> {alcantarilla.longitud_alcantarilla || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Diámetro / Sección:</strong> {alcantarilla.diametro_lado || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Coordenadas:</strong> {alcantarilla.latitud ? `${alcantarilla.latitud.toFixed(6)}, ${alcantarilla.longitud.toFixed(6)}` : 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Observaciones:</strong> {alcantarilla.observaciones || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Código de Panel Fotográfico:</strong> {alcantarilla.panel_fotografico_codigo || 'N/A'}</p>
            </div>
          </div>

          {/* Columna Derecha - Mapa y Visualizador */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Mini-mapa */}
            <div style={{
              width: '100%',
              height: '250px', // Altura fija para el minimapa
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <MiniMap alcantarilla={alcantarilla} route={route} />
            </div>

            {/* Visualizador Multimedia */}
            <ImageCarousel images={images} alcantarillaId={alcantarilla.id_alcantarilla} />
          </div>

        </div>

        {/* Pie de Tarjeta */}
        <div style={{ borderTop: '2px solid #eee', paddingTop: '15px', textAlign: 'center' }}>
          <button onClick={onCloseDetail} style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 25px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold',
            width: '100%',
            maxWidth: '400px', // Limitar el ancho del botón
            transition: 'background-color 0.2s ease'
          }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Regresar a lista de alcantarillas</button>
        </div>
      </div>
    </div>
  );
};

export default DetalleAlcantarillaView;
