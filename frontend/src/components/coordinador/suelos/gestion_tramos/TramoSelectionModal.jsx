import React from 'react';

// Reutilizamos los estilos de Progresivas.css para consistencia
import './Progresivas.css';

export default function TramoSelectionModal({ isOpen, tramos, onSelect, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="overlay">
      <div className="progresivas-form-container" style={{ maxWidth: '500px' }}>
        <div className="progresivas-form">
          <h3>Seleccionar Tramo</h3>
          <p style={{ marginBottom: '20px', color: '#555' }}>
            Se han encontrado múltiples tramos asociados a tu usuario. Por favor, selecciona uno para continuar.
          </p>
          
          <div className="tramos-selection-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '40vh', overflowY: 'auto' }}>
            {tramos.map(tramo => (
              <button 
                key={tramo.id} 
                onClick={() => onSelect(tramo.id)} 
                className="btn-secondary" // Reutilizamos un estilo de botón que se adapte
                style={{ width: '100%', textAlign: 'left', background: '#e8eaf6', color: '#1a237e' }}
              >
                {tramo.nombre}
              </button>
            ))}
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="close-btn" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
