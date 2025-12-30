import React, { useState, useEffect, useRef } from 'react';
import './visualizacionamigo.css';
import './ChatAnonimo.css'; // Importar los estilos del modal unificado
import { Helmet } from "react-helmet-async";
import { getMiAmigoAsignado } from '../../api/amigoSecretoAPI';
import { getWishlistByUserId } from '../../api/wishlistAPI';
import axios from '../../api/axios'; // Importar axios

const VisualizacionAmigo = ({ onGoToDashboard, onClose, isOverlay, eventoId = 1 }) => {
    // STATE
    const [friendName, setFriendName] = useState('');
    const [assignedFriend, setAssignedFriend] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFriendRevealed, setIsFriendRevealed] = useState(false);
    const [rotatingMessage, setRotatingMessage] = useState("¡Feliz Navidad! Construyendo puentes de unión y amistad en todo el Perú.");
    const [giftText, setGiftText] = useState({ text: '', revealed: false });
    const [isModalActive, setIsModalActive] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        description: '',
        link: '#',
        tags: [],
        previewUrl: '',
        isLoadingPreview: false
    });

    // REFS
    const snowContainerRef = useRef(null);
    const lightsContainerRef = useRef(null);
    const revealAreaRef = useRef(null);
    const friendNameRef = useRef(null);
    const elfRef = useRef(null);
    const giftTextRef = useRef(null);
    const modalRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    // CONSTANTS
    const messages = [
        "¡Feliz Navidad! Construyendo puentes de unión y amistad en todo el Perú.",
        "Ingenieros del GRTC: Que la señal de la paz tenga cobertura total en tu hogar.",
        "Uniendo pueblos, integrando vidas y trazando nuevas rutas para el 2026.",
        "Más allá de las obras y el concreto, lo que nos hace fuertes es este equipo.",
        "¡Felices Fiestas! Gracias por conectar al país con tu esfuerzo y dedicación.",
        "Que la alegría de la Navidad llegue a cada kilómetro de tu vida.",
        "Tu compañía en el trabajo es la mejor estructura de soporte. ¡Felicidades!"
    ];

    // --- HELPERS ---
    const isImageUrl = (url) => {
        if (!url) return false;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const lowerCaseUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowerCaseUrl.endsWith(ext) || lowerCaseUrl.includes(ext + '?') || lowerCaseUrl.includes(ext + '#'));
    };


    // --- EFFECTS ---

    useEffect(() => {
        const fetchAmigo = async () => {
            if (!eventoId) return;
            try {
                setIsLoading(true);
                const data = await getMiAmigoAsignado(eventoId);
                setAssignedFriend(data);
                setError(null);
            } catch (err) {
                setError('No se pudo encontrar a tu amigo secreto. ¿Ya se realizó el sorteo?');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAmigo();
    }, [eventoId]);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (assignedFriend && assignedFriend.receptorId) {
                try {
                    const userWishlist = await getWishlistByUserId(assignedFriend.receptorId);
                    setWishlist(userWishlist);
                } catch (error) {
                    console.error("No se pudo obtener la lista de deseos del amigo.", error);
                }
            }
        };
        fetchWishlist();
    }, [assignedFriend]);

    useEffect(() => {
        const createLights = () => {
            const container = lightsContainerRef.current;
            if (!container) return;
            container.innerHTML = '';
            const lightCount = 20;
            const colors = ['#ffffff', '#00ffff', '#3182cf', '#e1f1ff', '#87ceeb'];
            for (let i = 0; i < lightCount; i++) {
                const light = document.createElement('div');
                light.className = 'light';
                light.style.left = (i * (100 / lightCount)) + '%';
                light.style.background = colors[Math.floor(Math.random() * colors.length)];
                light.style.animationDelay = (Math.random() * 2) + 's';
                light.style.boxShadow = `0 0 10px ${light.style.background}`;
                container.appendChild(light);
            }
        };
        createLights();
    }, []);

    useEffect(() => {
        const snowContainer = snowContainerRef.current;
        if (!snowContainer) return;
        const createSnowflakes = () => {
            const snowflakeCount = 40;
            const snowflakeSymbols = ['❄', '❅', '❆'];
            for (let i = 0; i < snowflakeCount; i++) {
                const snowflake = document.createElement('div');
                snowflake.className = 'snowflake';
                snowflake.innerHTML = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
                snowflake.style.left = Math.random() * 100 + 'vw';
                snowflake.style.animationDuration = (Math.random() * 10 + 5) + 's';
                snowflake.style.animationDelay = (Math.random() * 10) + 's';
                snowflake.style.fontSize = (Math.random() * 8 + 6) + 'px';
                snowflake.style.opacity = Math.random() * 0.5 + 0.3;
                snowContainer.appendChild(snowflake);
                setTimeout(() => {
                    if (snowflake.parentNode) {
                        snowflake.parentNode.removeChild(snowflake);
                    }
                }, 20000);
            }
        };
        createSnowflakes();
        const interval = setInterval(createSnowflakes, 3000);
        return () => {
            clearInterval(interval);
            if (snowContainer) snowContainer.innerHTML = '';
        };
    }, []);

    useEffect(() => {
        let msgIndex = 0;
        const rotateMessage = () => {
            msgIndex = (msgIndex + 1) % messages.length;
            setRotatingMessage(messages[msgIndex]);
        };
        const messageInterval = setInterval(rotateMessage, 5000);
        return () => clearInterval(messageInterval);
    }, [messages]);

    // Efecto para buscar la previsualización de la imagen cuando el modal se activa
    useEffect(() => {
        const fetchPreview = async () => {
            const url = modalContent.link;
            if (!isModalActive || !url || url === '#') {
                return;
            }

            if (isImageUrl(url)) {
                setModalContent(prev => ({ ...prev, previewUrl: url, isLoadingPreview: false }));
                return;
            }

            setModalContent(prev => ({ ...prev, isLoadingPreview: true }));
            let newPreviewUrl = '';
            try {
                const response = await axios.get(`/api/url-preview?url=${encodeURIComponent(url)}`);
                if (response.data.imageUrl) {
                    newPreviewUrl = response.data.imageUrl;
                }
            } catch (error) {
                console.error('Error fetching URL preview:', error);
            } finally {
                setModalContent(prev => ({
                    ...prev,
                    previewUrl: newPreviewUrl,
                    isLoadingPreview: false
                }));
            }
        };

        fetchPreview();
    }, [isModalActive, modalContent.link]);


    // --- HANDLERS ---
    const handleRevealFriend = () => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        if (isLoading || error || !assignedFriend || !assignedFriend.nombre) return;
        setFriendName(assignedFriend.nombre);
        setIsFriendRevealed(true);
    };

    const handleHideFriend = () => {
        setIsFriendRevealed(false);
        hideTimeoutRef.current = setTimeout(() => {
            setFriendName('');
        }, 500);
    };

    const handleGiftClick = (wishIndex) => {
        const wish = wishlist[wishIndex];
        if (!wish) return;

        setModalContent({
            title: wish.texto,
            description: "Este es un deseo de tu amigo secreto. Si hay un enlace, puedes ver más detalles del producto.", // Descripción genérica
            tags: wish.tags || [],
            link: wish.url || '#',
            previewUrl: '', // Resetear
            isLoadingPreview: false // Resetear
        });
        setIsModalActive(true);
    };

    const handleElfClick = () => {
        const elf = elfRef.current;
        if (elf) {
            elf.style.animation = 'none';
            setTimeout(() => elf.style.animation = 'elf-bounce 4s infinite ease-in-out', 10);
        }
        setGiftText({ text: "¡Los duendes de obra saludan! 👷‍♂️❄️", revealed: true });
        setTimeout(() => setGiftText({ text: '', revealed: false }), 3000);
    };

    const giftCount = Math.min(wishlist.length, 3);
    const giftArray = Array.from({ length: giftCount }, (_, i) => i);


    return (
        <div className={`visualizacion-amigo-container ${isOverlay ? 'viz-is-overlay' : ''}`}>
            {onClose && (
                <button onClick={onClose} className="close-viz-btn">&times;</button>
            )}
            <Helmet>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
                <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Mountains+of+Christmas:wght@400;700&display=swap" rel="stylesheet" />
            </Helmet>
            <div ref={snowContainerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 2, pointerEvents: 'none' }}></div>
            <div className="christmas-lights" ref={lightsContainerRef}></div>

            <div className="card">
                <div className="holly">❦</div>
                <div className="bell">🔔</div>
                <div className="corner corner-tl"></div>
                <div className="corner corner-tr"></div>
                <div className="corner corner-bl"></div>
                <div className="corner corner-br"></div>
                <div className="elf" ref={elfRef} onClick={handleElfClick}>
                    <div className="elf-hat"></div>
                    <div className="elf-body"></div>
                    <div className="elf-face"></div>
                    <div className="elf-eye left"></div>
                    <div className="elf-eye right"></div>
                </div>
                <h1>Amigo Secreto</h1>
                <div className="year">2025</div>
                <div className="reveal-area" onMouseEnter={handleRevealFriend} onMouseLeave={handleHideFriend}>
                    <div className="reveal-text">
                        {isLoading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Buscando...</>
                        ) : error ? (
                            <><i className="fas fa-exclamation-triangle"></i> Error</>
                        ) : (
                            <><i className="fas fa-snowflake"></i> Pasa el mouse aquí</>
                        )}
                    </div>
                    <div className={`friend-name ${isFriendRevealed ? 'revealed' : ''}`} ref={friendNameRef}>
                        <span>{isFriendRevealed ? friendName : (error ? 'Error al cargar' : '')}</span>
                    </div>
                </div>
                <div className="christmas-message">{rotatingMessage}</div>
                {onGoToDashboard && (
                    <button onClick={onGoToDashboard} className="btn-go-dashboard">
                        Ir al Dashboard
                    </button>
                )}
                <div className="gift-boxes">
                    {giftArray.map(index => (
                        <div className="gift-box" data-gift={index} key={index} onClick={() => handleGiftClick(index)}>
                            <div className="ribbon"></div>
                            <div className="gift-number">{index + 1}</div>
                        </div>
                    ))}
                </div>
                <div className={`gift-text ${giftText.revealed ? 'revealed' : ''}`} ref={giftTextRef}>
                    {giftText.text}
                </div>
            </div>

            {/* Modal refactorizado */}
            {isModalActive && (
                <div className="chat-modal-overlay" onClick={() => setIsModalActive(false)}>
                    <div className="chat-window" onClick={e => e.stopPropagation()}>
                        <header className="chat-header">
                            <h3>{modalContent.title}</h3>
                            <button className="chat-close-btn" onClick={() => setIsModalActive(false)}>&times;</button>
                        </header>
                        <div className="chat-body">
                            <div className="wish-modal-content">
                                <div className="wish-image-container">
                                    {modalContent.isLoadingPreview ? (
                                        <div className="loader-small"></div>
                                    ) : modalContent.previewUrl ? (
                                        <img src={modalContent.previewUrl} alt="Previsualización del deseo" />
                                    ) : (
                                        <div className="gift-placeholder">
                                            <i className="fas fa-gift"></i>
                                        </div>
                                    )}
                                </div>
                                <div className="wish-details">
                                    <div className="tags-container">
                                        {modalContent.tags.map((tag, i) => (
                                            <span key={i} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                    <p>{modalContent.description}</p>
                                    {modalContent.link && modalContent.link !== '#' && (
                                        <a href={modalContent.link} target="_blank" rel="noopener noreferrer">
                                            <i className="fas fa-external-link-alt"></i> Ver producto
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualizacionAmigo;