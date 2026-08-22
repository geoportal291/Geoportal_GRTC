import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Doughnut } from 'react-chartjs-2';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import './mecanicadesuelos.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MecanicaDeSuelos = () => {
  

  const [activeTab, setActiveTab] = useState('Ensayos');

  const testLocations = [
    { lat: -12.0464, lng: -77.0428, name: "KM 12+350", type: "CBR", result: "9.2%" },
    { lat: -12.0521, lng: -77.0365, name: "KM 10+125", type: "Atterberg", result: "LL=42, PL=24" },
    { lat: -12.0583, lng: -77.0287, name: "KM 8+750", type: "Densidad", result: "2.12 g/cm³" },
    { lat: -12.0382, lng: -77.0184, name: "Cantera A", type: "Granulometría", result: "Pendiente" },
    { lat: -12.0256, lng: -77.0421, name: "Cantera B", type: "Abrasión LA", result: "28%" }
  ];

  const chartData = {
    labels: ['Arena (SM)', 'Limo (ML)', 'Arcilla (CL)', 'Grava (GW)', 'Orgánico (OH)'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#f39c12',
          '#3498db',
          '#e74c3c',
          '#2ecc71',
          '#9b59b6'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="mecanica-content">
      <h1 className="page-title">
        <i className="fas fa-road"></i> Dashboard de Mecánica de Suelos y Pavimentos
      </h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'Ensayos' ? 'active' : ''}
          onClick={() => setActiveTab('Ensayos')}
        >
          Ensayos
        </button>
        <button
          className={activeTab === 'Análisis' ? 'active' : ''}
          onClick={() => setActiveTab('Análisis')}
        >
          Análisis
        </button>
        <button
          className={activeTab === 'Reportes' ? 'active' : ''}
          onClick={() => setActiveTab('Reportes')}
        >
          Reportes
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'Ensayos' && (
          <>
            <div className="map-container">
              <MapContainer center={[-12.0464, -77.0428]} zoom={13} style={{ height: '400px', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                {testLocations.map((loc, idx) => (
                  <Marker key={idx} position={[loc.lat, loc.lng]}>
                    <Popup>
                      <b>{loc.name}</b><br />Tipo: {loc.type}<br />Resultado: {loc.result}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="indicators-container">
              <div className="indicator-card">
                <h3>Ensayos Pendientes</h3>
                <div className="indicator-value status-pending">24</div>
                <div>Última actualización: hoy</div>
              </div>
              <div className="indicator-card">
                <h3>Ensayos por Aprobación</h3>
                <div className="indicator-value">18</div>
                <div>5 <span className="status-rejected">rechazados</span></div>
              </div>
              <div className="indicator-card">
                <h3>CBR Promedio</h3>
                <div className="indicator-value">8.6%</div>
                <div>Rango: 5.2% - 12.4%</div>
              </div>
              <div className="indicator-card">
                <h3>Suelos Clasificados</h3>
                <div className="indicator-value">143</div>
                <div>Este mes: 28 nuevos</div>
              </div>
            </div>

            <div className="tests-table">
              <h3>Últimos Ensayos Registrados</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo de Ensayo</th>
                    <th>Ubicación</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#2458</td>
                    <td>CBR</td>
                    <td>KM 12+350</td>
                    <td>15/06/2023</td>
                    <td><span className="badge badge-success">Aprobado</span></td>
                    <td>9.2%</td>
                  </tr>
                  <tr>
                    <td>#2457</td>
                    <td>Granulometría</td>
                    <td>Cantera A</td>
                    <td>14/06/2023</td>
                    <td><span className="badge badge-warning">Pendiente</span></td>
                    <td>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'Análisis' && (
          <div className="soil-distribution">
            <h3>Distribución de Suelos por Tipo</h3>
            <div className="chart-container">
              <Doughnut data={chartData} />
            </div>
          </div>
        )}

        {activeTab === 'Reportes' && (
          <div className="report-section">
            <h3>Opciones de Reporte</h3>
            <ul>
              <li>Reporte de Ensayos</li>
              <li>Exportar Datos en Excel</li>
              <li>Informe Técnico PDF</li>
              <li>Exportar GeoJSON</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MecanicaDeSuelos;
 