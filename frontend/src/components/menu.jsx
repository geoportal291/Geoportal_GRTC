import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './coordinador/navbar'; // <-- CORREGIDO
import Header from './header';
import './navbar.css';
import './header.css';
import './menu.css';

export default function Menu() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const navigate = useNavigate();
  const irAensayos = ()=> {
    navigate('./ensayos');
  };
  const irAProyectos = () => {
    navigate('./coordinador/proyectos');
  };
  const irAProgresivas = () => {
    navigate('./coordinador/Progresivas');
  }
  return (
    <div>
      {/* CORREGIDO: Añadido isCollapsed prop */}
      <Navbar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />
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

        {/* Tarjeta de Proyectos */}
        <div className="card-grid">
          <div className="card-proyecto" onClick={irAProyectos}>
            <h2>📁 Gestión de Proyectos</h2>
            <p>Haz clic aquí para ver tus proyectos.</p>
          </div>
        </div>
        {/*Tarjeta de ensayos */}
        <div className="card-grid">
          <div className="card-ensayos" onClick={irAensayos}>
            <h2>Ensayos</h2>
            <p>Haz click para ver los ensayos</p>
          </div>
        </div>
        {/*Tarjeta de progresivas */}
        <div className="card-grid">
          <div className="card-progresivas" onClick={irAProgresivas}>
            <h2>Progresivas</h2>
            <p>Haz click aqui para ir a Progresivas</p> 
          </div>
        </div>
      </div>
    </div>
  );
}
