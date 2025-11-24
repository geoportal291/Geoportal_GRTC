import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../../../data/contexts/AuthContext';
import SuelosMap from '../mapa/SuelosMap';
import './DashboardSuelos.css';

export default function DashboardSuelos() {
  const { selectedProjectId, user } = useAuth();
  const [tramos, setTramos] = useState([]);
  const [progresivas, setProgresivas] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const API_URL = `${API_BASE}/api`;

  const getAuthHeaders = useCallback(() => {
    const token = user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [user]);

  const fetchTramos = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/user/tramos`, { headers, params: { projectId: selectedProjectId } });
      setTramos(response.data || []);
    } catch (err) {
      console.error('Error fetching user tramos for dashboard:', err);
    }
  }, [selectedProjectId, getAuthHeaders, API_URL]);

  const fetchProgresivas = useCallback(async () => {
    if (!selectedProjectId) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const headers = getAuthHeaders();
        // Note: The route in index.js is /progresivas/proyecto/:proyectoId, but it might be exposed under /api
        const response = await axios.get(`${API_URL}/progresivas/proyecto/${selectedProjectId}`, { headers });
        setProgresivas(response.data || []);
    } catch (err) {
        console.error('Error fetching progresivas for dashboard:', err);
    } finally {
        setLoading(false);
    }
  }, [selectedProjectId, getAuthHeaders, API_URL]);


  useEffect(() => {
    fetchTramos();
    fetchProgresivas();
  }, [fetchTramos, fetchProgresivas]);

  const kmlIds = useMemo(() => {
    return tramos.map(tramo => tramo.kml_trazado_id).filter(Boolean);
  }, [tramos]);

  const avanceTramo = useMemo(() => {
    if (!progresivas || progresivas.length === 0) {
      return 0;
    }
    const totalProgresivas = progresivas.length;
    const completedProgresivas = progresivas.filter(p => p.estratos_perfil && p.estratos_perfil.length > 0).length;
    
    return (completedProgresivas / totalProgresivas) * 100;
  }, [progresivas]);

  return (
    <main className="dashboard-main-content">
      <section className="map-section">
        {loading ? (
          <div id="map-placeholder"><p>Cargando mapa...</p></div>
        ) : (
          <SuelosMap kmlTrazadoIds={kmlIds} />
        )}
      </section>

      <section className="kpi-grid">
        <div className="kpi-card canteras">
          <h3>Volumen de Canteras</h3>
          <p className="metric-value">120,000 m³</p>
          <p className="sub-metric">Capacidad disponible</p>
        </div>
        <div className="kpi-card agua">
          <h3>Abastecimiento de Agua</h3>
          <p className="metric-value">85%</p>
          <p className="sub-metric">Satisfacción de demanda</p>
        </div>
        <div className="kpi-card tramos">
          <h3>Avance del Tramo</h3>
          <p className="metric-value">{avanceTramo.toFixed(2)}%</p>
          <p className="sub-metric">Progresiva ejecutada</p>
        </div>
        <div className="kpi-card distancia">
          <h3>Distancia Promedio</h3>
          <p className="metric-value">25 km</p>
          <p className="sub-metric">Cantera a Frente de Trabajo</p>
        </div>
      </section>

      <section className="details-table">
        <h2>📋 Detalle de Certificaciones y Ensayos</h2>
        <table>
          <thead>
            <tr>
              <th>Recurso</th>
              <th>Estado</th>
              <th>Clasificación</th>
              <th>Distancia (km)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cantera "El Peñón"</td>
              <td>**Aprobado**</td>
              <td>Grava-Arena (GW)</td>
              <td>15.2</td>
            </tr>
            <tr>
              <td>Fuente "Río Seco"</td>
              <td>**Pendiente Lab**</td>
              <td>PH: 7.5</td>
              <td>8.1</td>
            </tr>
            <tr>
              <td>Cantera "Loma Sur"</td>
              <td>**Rechazado**</td>
              <td>Arcilla de baja Plasticidad (CL)</td>
              <td>32.7</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
