import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './navbar';
import Header from './header';
import './navbar.css';
import './header.css';
import './menu.css';


export default function Menu() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const irAensayos = () => {
    navigate('../ensayos');
  };

  const irAProyectos = () => {
    navigate('/proyectos.jsx');
  };

  return (
    <div>
      <Navbar onToggle={setSidebarCollapsed} />
      <Header sidebarCollapsed={sidebarCollapsed} />
      
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <h1>Inicio</h1>

        {/* Filtros */}
        <div className="filtros-container">
          <div className="filtro-item">
            <label>Proyecto</label>
            <select>
              <option value="">Seleccionar proyecto</option>
              {/* Opciones dinámicas desde la DB se insertarán aquí */}
            </select>
          </div>

          <div className="filtro-item">
            <label>Especialidad</label>
            <select>
              <option value="">Seleccionar especialidad</option>
              {/* Opciones dinámicas desde la DB se insertarán aquí */}
            </select>
          </div>

          <div className="filtro-item">
            <label>Estado</label>
            <select>
              <option value="">Seleccion estado</option>
              <option>Completado</option>
              <option>En progreso</option>
              <option>Atrasado</option>
              <option>Planificado</option>
            </select>
          </div>

          <div className="filtro-item">
            <label>Fecha</label>
            <input type="date" />
          </div>
        </div>

        {/* Sección Proyectos */}
        <h2 className="section-title">Proyectos</h2>
        <div className="card-grid">
          <div className="card-proyecto" onClick={irAProyectos}>
            <h3>📁 Proyectos</h3>
            <p>Haz clic aquí para ver tus proyectos.</p>
          </div>
        </div>

        {/* Sección Ensayos */}
        <h2 className="section-title">Ensayos</h2>
        <div className="card-grid">
          <div className="card-ensayos" onClick={irAensayos}>
            <h3>🧪 Ensayos</h3>
            <p>Haz clic aquí para ver los ensayos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
