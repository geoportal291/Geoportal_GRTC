import React, { useState, useEffect, useRef } from 'react';
import './visualizacionamigo.css';
import { Helmet } from "react-helmet";
import { getMiAmigoAsignado } from '../../api/amigoSecretoAPI';

const VisualizacionAmigo = ({ onGoToDashboard, onClose, isOverlay, eventoId = 1 }) => {
    // STATE
    const [friendName, setFriendName] = useState('');
    const [assignedFriend, setAssignedFriend] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFriendRevealed, setIsFriendRevealed] = useState(false);
    const [rotatingMessage, setRotatingMessage] = useState("¡Feliz Navidad! Construyendo puentes de unión y amistad en todo el Perú.");
    const [giftText, setGiftText] = useState({ text: '', revealed: false });
    const [isModalActive, setIsModalActive] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', image: '', description: '', link: '#' });

    // REFS
    const snowContainerRef = useRef(null);
    const lightsContainerRef = useRef(null);
    const revealAreaRef = useRef(null);
    const friendNameRef = useRef(null);
    const elfRef = useRef(null);
    const giftTextRef = useRef(null);
    const modalRef = useRef(null);
    const hideTimeoutRef = useRef(null); // Ref para el timeout

    // CONSTANTS
    const gifts = {
        1: [{ name: "Agenda Ejecutiva", description: "Para planificar las próximas obras del año", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400", link: "#" }, { name: "Termo Todo Terreno", description: "Ideal para las visitas a campo", image: "https://images.unsplash.com/photo-1517420879524-86d64ac2f339?w=400", link: "#" }],
        2: [{ name: "Kit de Herramientas", description: "Siempre listos para cualquier imprevisto", image: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400", link: "#" }],
        3: [{ name: "Café Reserva Nacional", description: "Energía pura para largas jornadas de diseño", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400", link: "#" }]
    };
    const messages = [
        "¡Feliz Navidad! Construyendo puentes de unión y amistad en todo el Perú.",
        "Ingenieros del GRTC: Que la señal de la paz tenga cobertura total en tu hogar.",
        "Uniendo pueblos, integrando vidas y trazando nuevas rutas para el 2026.",
        "Más allá de las obras y el concreto, lo que nos hace fuertes es este equipo.",
        "¡Felices Fiestas! Gracias por conectar al país con tu esfuerzo y dedicación.",
        "Que la alegría de la Navidad llegue a cada kilómetro de tu vida.",
        "Tu compañía en el trabajo es la mejor estructura de soporte. ¡Felicidades!"
    ];

    // --- EFFECTS ---

    useEffect(() => {
        const fetchAmigo = async () => {
            try {
                setIsLoading(true);
                const data = await getMiAmigoAsignado(eventoId);
                setAssignedFriend(data.nombre);
                setError(null);
            } catch (err) {
                setError('No se pudo encontrar a tu amigo secreto. ¿Ya se realizó el sorteo?');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (eventoId) {
            fetchAmigo();
        }
    }, [eventoId]);

    // Effect for creating christmas lights
    useEffect(() => {
        const createLights = () => {
            const container = lightsContainerRef.current;
            if (!container) return;
            // Clear existing lights to prevent duplication on re-renders
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

    // Effect for creating snowflakes
    useEffect(() => {
        const snowContainer = snowContainerRef.current;
        if (!snowContainer) return;

        const createSnowflakes = () => {
            const snowflakeCount = 40;
            const snowflakeSymbols = ['❄', '❅', '❆']; // Removed '•'
            for (let i = 0; i < snowflakeCount; i++) {
                const snowflake = document.createElement('div');
                snowflake.className = 'snowflake';
                snowflake.innerHTML = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
                snowflake.style.left = Math.random() * 100 + 'vw';
                snowflake.style.animationDuration = (Math.random() * 10 + 5) + 's';
                snowflake.style.animationDelay = (Math.random() * 10) + 's';
                snowflake.style.fontSize = (Math.random() * 8 + 6) + 'px'; // Smaller font sizes
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


    // Effect for rotating messages
    useEffect(() => {
        let msgIndex = 0;
        const rotateMessage = () => {
            msgIndex = (msgIndex + 1) % messages.length;
            setRotatingMessage(messages[msgIndex]);
        };
        const messageInterval = setInterval(rotateMessage, 5000); // 5 seconds for easier testing
        return () => clearInterval(messageInterval);
    }, [messages]);


    // --- HANDLERS ---

    const handleRevealFriend = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        if (isLoading || error) return;

        setFriendName(assignedFriend);
        setIsFriendRevealed(true);
    };

    const handleHideFriend = () => {
        setIsFriendRevealed(false);
        hideTimeoutRef.current = setTimeout(() => {
            setFriendName('');
        }, 500);
    };

    const handleGiftClick = (giftNum) => {
        const giftList = gifts[giftNum] || [{ name: "Detalle Sorpresa", description: "Un presente especial para un gran colega", image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400", link: "#" }];
        const selectedGift = giftList[Math.floor(Math.random() * giftList.length)];
        setModalContent(selectedGift);
        setIsModalActive(true);
    };

    const handleElfClick = () => {
        const elf = elfRef.current;
        if (elf) {
            elf.style.animation = 'none';
            setTimeout(() => elf.style.animation = 'elf-bounce 4s infinite ease-in-out', 10);
        }
        setGiftText({ text: "¡Los duendes de obra saludan! 👷‍♂️❄️", revealed: true });
        setTimeout(() => {
            setGiftText({ text: '', revealed: false });
        }, 3000);
    };


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
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Buscando...
                            </>
                        ) : error ? (
                             <>
                                <i className="fas fa-exclamation-triangle"></i> Error
                            </>
                        ) : (
                            <>
                                <i className="fas fa-snowflake"></i> Pasa el mouse aquí
                            </>
                        )}
                    </div>
                    <div className={`friend-name ${isFriendRevealed ? 'revealed' : ''}`} ref={friendNameRef}>
                        <span>{isFriendRevealed ? friendName : (error ? error : '')}</span>
                    </div>
                </div>

                <div className="christmas-message">
                    {rotatingMessage}
                </div>

                {onGoToDashboard && (
                    <button onClick={onGoToDashboard} className="btn-go-dashboard">
                        Ver Lista de Deseos
                    </button>
                )}

                <div className="gift-boxes">
                    {[1, 2, 3].map(num => (
                        <div className="gift-box" data-gift={num} key={num} onClick={() => handleGiftClick(num)}>
                            <div className="ribbon"></div>
                            <div className="gift-number">{num}</div>
                        </div>
                    ))}
                </div>

                <div className={`gift-text ${giftText.revealed ? 'revealed' : ''}`} ref={giftTextRef}>
                    {giftText.text}
                </div>
            </div>

            <div className={`gift-modal ${isModalActive ? 'active' : ''}`} ref={modalRef} onClick={(e) => e.target === modalRef.current && setIsModalActive(false)}>
                <div className="modal-content">
                    <button className="close-modal" onClick={() => setIsModalActive(false)}>&times;</button>
                    <h3 id="modalTitle">{modalContent.title}</h3>
                    <img id="modalImage" src={modalContent.image} alt="Imagen del regalo" />
                    <p id="modalDescription">{modalContent.description}</p>
                    <a href={modalContent.link} id="modalLink" className="gift-link" target="_blank" rel="noopener noreferrer">Ver más detalles</a>
                </div>
            </div>
        </div>
    );
};

export default VisualizacionAmigo;