import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardActual() {
  const navigate = useNavigate();

  const irAensayos = () => {
    navigate('/coordinador/ensayos');
  };

  const irAProyectos = () => {
    navigate('/coordinador/proyectos');
  };
  const irAProgresivas = () => {
    navigate('/coordinador/Progresivas');
  };
  const irAGestorProyectos = () => {
    navigate('/coordinador/recoleccion-datos');
  };

  return (
    <div className="coordinador-dashboard-content">
      <h1>Inicio</h1>

      

      {/* Sección Proyectos */}
      <h2 className="section-title">Proyectos</h2>
      <div className="card-grid">
        <div className="card-proyecto" onClick={irAProyectos}>
          <h3>📁 Proyectos</h3>
          <p>Haz clic aquí para ver tus proyectos.</p>
        </div>
        <div className="card-proyecto" onClick={irAGestorProyectos}>
          <h3>⚙️ Gestión de Tramos</h3>
          <p>Haz clic aquí para gestionar tus proyectos.</p>
        </div>
      </div>

      {/*Tarjeta de progresivas */}
      <h2 className="section-title">Progresivas</h2>
      <div className="card-grid">
        <div className="card-progresivas" onClick={irAProgresivas}>
          <h2>Tramos</h2>
          <p>Haz click aqui para ir a los Tramos</p> 
        </div>
      </div>
    </div>
  );
}