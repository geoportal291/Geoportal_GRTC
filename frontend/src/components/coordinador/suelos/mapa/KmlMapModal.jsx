import React from 'react';
import SuelosMap from './SuelosMap'; // Assuming SuelosMap is in the same directory
import './KmlMapModal.css'; // We'll create this CSS file

const KmlMapModal = ({ isOpen, onClose, progresiva, subProgresivas }) => {
  console.log('[DEBUG] KmlMapModal.jsx - Received props:', { isOpen, progresiva, subProgresivas });
  if (!isOpen || !progresiva) return null;

  // Extract KML Trazado ID and coordinates for map centering
  const kmlTrazadoId = progresiva.kml_trazado_id;
  const mapCenter = progresiva.coordenada_este && progresiva.coordenada_norte
    ? [parseFloat(progresiva.coordenada_norte), parseFloat(progresiva.coordenada_este)] // Assuming Lat, Lon for Leaflet
    : null; // Default center if no coordinates

  return (
    <div className="kml-map-modal-overlay" onClick={onClose}>
      <div className="kml-map-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="kml-map-modal-header">
          <h3>Mapa de Tramo: {progresiva.nombre}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="kml-map-modal-body">
          {kmlTrazadoId ? (
            <SuelosMap
              center={mapCenter}
              zoom={14} // Adjust default zoom as needed
              kmlTrazadoIds={kmlTrazadoId ? [kmlTrazadoId] : []} // Pass the KML Trazado ID as an array
              progresivasData={subProgresivas} // Pass sub-progresivas data to map
            />
          ) : (
            <p>No hay un archivo KML asociado a este tramo para mostrar en el mapa.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KmlMapModal;