import React from 'react';
import './ExcelDisplayModal.css'; // Necesitará un archivo CSS para el modal

const ExcelDisplayModal = ({ isOpen, onClose, excelUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        {excelUrl ? (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(excelUrl)}`}
            title="Visor de Excel"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            webkitallowfullscreen="true"
            
          ></iframe>
        ) : (
          <p>No hay URL de Excel para mostrar.</p>
        )}
      </div>
    </div>
  );
};

export default ExcelDisplayModal;