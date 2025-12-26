import React from 'react';
import SuelosMap from './SuelosMap'; // Assuming SuelosMap is in the same directory
import './KmlMapModal.css'; // We'll create this CSS file

const KmlMapModal = ({ isOpen, onClose, progresiva, subProgresivas }) => {
  console.log('[DEBUG] KmlMapModal.jsx - Received props:', { isOpen, progresiva, subProgresivas });

  // Extract KML Trazado ID and Puntos ID
  const kmlTrazadoId = progresiva?.kml_trazado_id;
  const kmlPuntosId = progresiva?.kml_puntos_id;

  // Memoize props to prevent unnecessary re-renders of SuelosMap
  // FIX: Do NOT use raw UTM coordinates for centering as SuelosMap expects Lat/Lng.
  // Instead, pass null to let SuelosMap use its default center or fitBounds to the KML.
  const mapCenter = React.useMemo(() => null, []);

  const kmlIds = React.useMemo(() => {
    const ids = [];
    if (kmlTrazadoId) ids.push(kmlTrazadoId);
    if (kmlPuntosId) ids.push(kmlPuntosId);
    return ids;
  }, [kmlTrazadoId, kmlPuntosId]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !progresiva) return null;

  return (
    <div className="kml-map-modal-overlay" onClick={onClose}>
      <div className="kml-map-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="kml-map-modal-header">
          <h3>Mapa de Tramo: {progresiva.nombre}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="kml-map-modal-body">
          <SuelosMap
            initialCoords={mapCenter}
            initialZoom={14}
            kmlTrazadoIds={kmlIds}
            progresivasData={subProgresivas}
            defaultZone={progresiva.linea}
          />
        </div>
      </div>
    </div>
  );
};

export default KmlMapModal;