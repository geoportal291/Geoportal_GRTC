

import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';

import ErrorBoundary from '../../../ErrorBoundary';

const RecoleccionDatosTab = ({
  projectId,
  stationData,
  selectedStation,
  handleStationSelect,
  showTraffic,
  setShowTraffic
}) => {
  const mapKey = `map-${Object.keys(stationData).length}`;

  return (
    <div style={{ width: '90%', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingBottom: '20px' }}>
      <div style={{ height: 'calc(100vh - 250px)', width: '100%' }}>
        <ErrorBoundary>
          <MapContainer key={mapKey} center={[-12.45, -72.5]} zoom={10} zoomControl={false} style={{ height: '100%', width: '100%', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {showTraffic && Object.values(stationData).map((station) => {
            if (!station || !station.info || station.info.lat === undefined || station.info.lng === undefined || station.info.lat === null || station.info.lng === null) {
              return null;
            }
            return (
            <CircleMarker
              key={station.info.id}
              center={[station.info.lat, station.info.lng]}
              radius={10}
              pathOptions={{
                fillColor: '#27ae60',
                color: '#27ae60',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
              }}
            >
              <Popup>
                <strong>{station.info.nombre}</strong><br/>
                {station.info.descripcion}
              </Popup>
            </CircleMarker>
          )})
        }
        </MapContainer>
        </ErrorBoundary>
      </div>
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '15px', 
        backgroundColor: '#f9f9f9', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
        width: '100%' 
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>
          MEJORAMIENTO DEL SERVICIO DE TRANSITABILIDAD VIAL INTERURBANA EN LA CARRETERADEPARTAMENTAL CU-104 TRAMO: EMP. 105(LOROHUACHANA)-TINKURI-YAVERO CHICO-ABRA REYNADEL CARMEN-DV ESTRELLA-CUMUPAMPA-SAN MARTIN DEL DISTRITO DE QUELLOUNO DE LA PROVINCIADE LA CONVENCIÓN DEL DEPARTAMENTO DE CUSCO
        </p>
      </div>
    </div>
  );
};

export default RecoleccionDatosTab;
