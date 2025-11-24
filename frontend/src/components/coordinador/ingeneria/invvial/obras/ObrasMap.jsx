import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Component to auto-fit map bounds to the segments
const FitBounds = ({ segments }) => {
  const map = useMap();
  useEffect(() => {
    if (segments && segments.length > 0) {
      const allPositions = segments.flatMap(segment => segment.positions);
      if (allPositions.length > 0) {
        const bounds = new L.latLngBounds(allPositions);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [segments, map]);
  return null;
};

const ObrasMap = ({ segments }) => {
  return (
    <MapContainer center={[-12.5, -72.5]} zoom={10} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {segments.map((segment, index) => (
        <Polyline
          key={index}
          positions={segment.positions}
          pathOptions={{ color: segment.color, weight: 5 }}
        >
          <Popup>
            <b>{segment.name}</b>
          </Popup>
        </Polyline>
      ))}
      <FitBounds segments={segments} />
    </MapContainer>
  );
};

export default ObrasMap;
