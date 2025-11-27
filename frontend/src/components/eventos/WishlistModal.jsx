import React, { useState, useEffect } from 'react';
import axios from '../../api/axios'; // Usar la instancia de axios configurada
import './ChatAnonimo.css';

// Subcomponente para cada elemento de la lista de deseos
const WishlistItem = ({ item }) => {
    const [previewUrl, setPreviewUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            // No hacer nada si no hay URL o si ya es una imagen directa
            if (!item.url || isImageUrl(item.url)) {
                if (isImageUrl(item.url)) {
                    setPreviewUrl(item.url); // Es una imagen directa, usarla
                }
                return;
            }

            setIsLoading(true);
            try {
                // Llamar al nuevo endpoint del backend
                const response = await axios.get(`/api/url-preview?url=${encodeURIComponent(item.url)}`);
                if (response.data.imageUrl) {
                    setPreviewUrl(response.data.imageUrl);
                }
            } catch (error) {
                console.error('Error fetching URL preview:', error);
                // No se muestra un error al usuario, simplemente no se muestra la previsualización
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreview();
    }, [item.url]);

    const isImageUrl = (url) => {
        if (!url) return false;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const lowerCaseUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowerCaseUrl.endsWith(ext) || lowerCaseUrl.includes(ext + '?') || lowerCaseUrl.includes(ext + '#'));
    };

    return (
        <li>
            {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.texto} <i className="fas fa-external-link-alt"></i>
                </a>
            ) : (
                <span>{item.texto}</span>
            )}

            {/* Contenedor de previsualización */}
            <div className="image-preview-container">
                {isLoading && <div className="loader-small"></div>}
                {previewUrl && !isLoading && (
                    <img src={previewUrl} alt="Previsualización del producto" className="product-preview-image" />
                )}
            </div>

            {item.tags && item.tags.length > 0 && (
                <div style={{ marginTop: '5px' }}>
                    {item.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                </div>
            )}
        </li>
    );
};


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
            <ul>
              {wishlist.map(item => (
                <WishlistItem key={item.id} item={item} />
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
