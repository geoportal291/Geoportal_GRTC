import React from 'react';
import './VisorGraficosProgresivaModal.css';

export default function VisorGraficosProgresivaModal({ progresiva, onClose }) {
  if (!progresiva) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="visor-graficos-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Gráficos de Progresiva: {progresiva.codigo}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-content">
          <p>Aquí se mostrarán los gráficos para la progresiva {progresiva.codigo}.</p>
          {/* TODO: Implement actual graphic rendering logic */}
        </div>
      </div>
    </div>
  );
}