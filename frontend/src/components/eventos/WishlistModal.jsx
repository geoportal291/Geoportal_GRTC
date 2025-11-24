import React from 'react';
import './ChatAnonimo.css'; // Reutilizamos los estilos del chat modal que sabemos que funcionan

const WishlistModal = ({ isOpen, onClose, recipientName, wishlist }) => {
  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-window" onClick={e => e.stopPropagation()}>
        <header className="chat-header">
          <h3>Lista de Deseos de {recipientName}</h3>
          <button className="chat-close-btn" onClick={onClose}>&times;</button>
        </header>

        <div className="chat-body">
          {wishlist && wishlist.length > 0 ? (
            <ul style={{listStyle: 'none', padding: 0}}>
              {wishlist.map(item => (
                <li key={item.id} style={{padding: '10px 0', borderBottom: '1px solid #eee'}}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.texto} <i className="fas fa-external-link-alt"></i>
                    </a>
                  ) : (
                    <span>{item.texto}</span>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div style={{marginTop: '5px'}}>
                      {item.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>Este participante aún no ha añadido deseos a su lista.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;

