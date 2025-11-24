import React from 'react';

export default function GestorDeFuentesDeAgua() {
  return (
    <div className="gestor-container">
      <div className="panel panel-lista">
        <div className="panel-header">
          <h2>Fuentes de Agua</h2>
        </div>
        <ul className="item-list">
          {/* Aquí iría la lista de fuentes de agua */}
          <li className="list-item">Fuente de Ejemplo 1</li>
          <li className="list-item active">Fuente de Ejemplo 2</li>
        </ul>
      </div>
      <div className="panel panel-detalle">
        <div className="panel-header">
          <h2>Detalles de Fuente de Agua</h2>
        </div>
        <div className="detalle-content">
          <div className="detalle-grupo">
            <h3>Información General</h3>
            <div className="detalle-campo"><label>Nombre:</label> <span>Fuente de Ejemplo 2</span></div>
            <div className="detalle-campo"><label>Ubicación:</label> <span>Lat: -12.34, Lon: -76.54</span></div>
            <div className="detalle-campo"><label>Descripción:</label> <span>Esta sección está actualmente en construcción.</span></div>
          </div>
          <p>Aquí se administrarán las fuentes de agua, su ubicación y sus parámetros.</p>
        </div>
      </div>
    </div>
  );
}
