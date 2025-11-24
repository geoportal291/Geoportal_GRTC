import React from 'react';

const ImageDisplayModal = ({ isOpen, onClose, imageUrl, isNavbarExpanded }) => {
  if (!isOpen) return null;

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    transition: 'padding-left 0.3s ease-in-out',
    paddingLeft: isNavbarExpanded ? '150px' : '80px',
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        maxWidth: '70%',
        maxHeight: '90%',
        overflow: 'auto',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '1.5em',
          cursor: 'pointer',
          color: '#333'
        }}>X</button>
        {imageUrl && <img src={imageUrl} alt="Imagen" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />}
      </div>
    </div>
  );
};

export default ImageDisplayModal;
