import React from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import FitBoundsControl from './FitBoundsControl';
import ErrorBoundary from '../../../ErrorBoundary';

const MapOnlyDisplay = ({
  cu104Route
}) => {
  return (
    <div style={{ height: '100%', width: '100%', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <ErrorBoundary>
        <MapContainer center={[-12.5, -72.5]} zoom={11} zoomControl={false} className="map-container-custom-controls" style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <FitBoundsControl cu104Route={cu104Route} />
        <Polyline
          positions={cu104Route.map(point => [point.lat, point.lng])}
          color="#e74c3c"
          weight={4}
          opacity={0.8}
        />
      </MapContainer>
      </ErrorBoundary>
    </div>
  );
};

export default MapOnlyDisplay;