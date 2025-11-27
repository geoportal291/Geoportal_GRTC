import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import alertify from 'alertifyjs';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../data/contexts/AuthContext'; 
import { socket } from '../../socket';
import './AmigoSecreto.css';
import { getAmigoSecretoParticipantes } from '../../api/amigoSecretoAPI';
import { getMyWishlist, addWishlistItem, deleteWishlistItem, getWishlistByUserId } from '../../api/wishlistAPI';
import ChatAnonimo from './ChatAnonimo';
import WishlistModal from './WishlistModal';
import VisualizacionAmigo from './visualizacionamigo';
import { SorteoAnimation } from './SorteoAnimation';

// --- Componente de Nieve (Local) ---
const SnowEffect = () => {
    const [snowflakes, setSnowflakes] = useState([]);
    useEffect(() => {
        const count = 60; 
        const flakes = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            width: Math.random() * 4 + 2 + 'px',
            animationDuration: Math.random() * 5 + 3 + 's',
            animationDelay: Math.random() * 5 + 's',
            opacity: Math.random() * 0.6 + 0.4
        }));
        setSnowflakes(flakes);
    }, []);

    return (
        <div className="snow-container-theme">
            {snowflakes.map(flake => (
                <div key={flake.id} className="snowflake-theme"
                    style={{
                        left: flake.left, width: flake.width, height: flake.width,
                        animationDuration: flake.animationDuration, animationDelay: flake.animationDelay, opacity: flake.opacity
                    }}
                />
            ))}
        </div>
    );
};

// --- Componente Contador ---
const Countdown = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};
        if (difference > 0) {
            timeLeft = {
                Días: Math.floor(difference / (1000 * 60 * 60 * 24)),
                Horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
                Minutos: Math.floor((difference / 1000 / 60) % 60),
                Segundos: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearTimeout(timer);
    });

    return (
        <div className="countdown-container">
            {Object.entries(timeLeft).length > 0 ? (
                Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} className="countdown-item">
                        <span className="countdown-value">{value}</span>
                        <span className="countdown-unit">{unit}</span>
                    </div>
                ))
            ) : (
                <span className="evento-finalizado">¡El evento ha comenzado!</span>
            )}
        </div>
    );
};

export default function AmigoSecretoDashboard({ isSidebarCollapsed }) {
    const { width, height } = useWindowSize();
    const navigate = useNavigate();
    const { user } = useAuth(); 
    
    // --- STATE MANAGEMENT ---
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [participantesServer, setParticipantesServer] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [sorteoIniciado, setSorteoIniciado] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [asignacion, setAsignacion] = useState({ nombre: '', revelado: false, receptorId: null }); // Añadir receptorId
    const [animationStage, setAnimationStage] = useState('idle');
    const [runConfetti, setRunConfetti] = useState(false);
    const [finalResultName, setFinalResultName] = useState('');
    const [selectedParticipantIds, setSelectedParticipantIds] = useState([]); // NUEVO ESTADO

    const [miListaDeseos, setMiListaDeseos] = useState([]); // Iniciar vacía
    const [nuevoDeseo, setNuevoDeseo] = useState({ texto: '', url: '', tags: '' });

    const [showWishlistModal, setShowWishlistModal] = useState(false);
    const [selectedRecipientWishlist, setSelectedRecipientWishlist] = useState({ name: '', items: [] });

    const fechaDelEvento = "2025-12-12T19:00:00";

    // --- SOCKET.IO LOGIC & DATA FETCHING ---
    useEffect(() => {
        const token = user?.token; 
        if (!token) {
            alertify.error('Error de autenticación.');
            navigate('/');
            return;
        }
        socket.auth = { token };
        socket.connect();

        // --- Fetch de datos iniciales ---
        const fetchInitialData = () => {
            // Mi lista de deseos
            getMyWishlist()
                .then(setMiListaDeseos)
                .catch(err => console.error("Error al cargar mi lista de deseos", err));

            // IDs de participantes (si es organizador)
            if (isOrganizer) {
                getAmigoSecretoParticipantes()
                    .then(ids => setSelectedParticipantIds(ids))
                    .catch(err => console.error("Error al cargar IDs de participantes seleccionados", err));
            }
        };

        function onConnect() { 
            setIsConnected(true); 
            alertify.success('Conectado al servidor mágico');
            fetchInitialData(); // Cargar datos al conectar
        }
        function onDisconnect() { setIsConnected(false); alertify.error('Desconectado'); }
        function onError(error) { alertify.error(`Error: ${error.message}`); navigate('/'); }

        function onInitialState({ participantes, esSorteoIniciado, isOrganizer, asignacion }) {
            console.log('DEBUG: Recibido initial_state, asignacion:', asignacion); // DEBUG
            setParticipantesServer(participantes);
            setIsOrganizer(isOrganizer);
            setSorteoIniciado(esSorteoIniciado || !!asignacion); 
            if (asignacion) {
                setAsignacion({ nombre: `¡${asignacion.nombre}!`, revelado: true, receptorId: asignacion.receptorId });
            }
            const decodedToken = jwtDecode(token);
            const self = participantes.find(p => p.id.toString() === decodedToken.id.toString());
            setCurrentUser(self);
        }

        function onUpdateParticipants(participantes) { setParticipantesServer(participantes); }
        function onDrawStarted() {
            setSorteoIniciado(true);
            setAnimationStage('drawInProgress');
        } 
        
        function onFinalAssignment({ nombre, receptorId }) { // Recibir objeto
            console.log('DEBUG: Recibido final_assignment:', { nombre, receptorId }); // DEBUG
            setFinalResultName(nombre.replace(/[¡!]/g, ''));
            setAsignacion(prev => ({ ...prev, receptorId: receptorId })); // Guardar el ID del receptor
        }

        const resetToVisualizacion = () => {
            setAnimationStage('idle');
            setAsignacion({ nombre: '', revelado: false, receptorId: null });
            setRunConfetti(false);
            setFinalResultName('');
            setSorteoIniciado(false);
            alertify.warning('El sorteo ha sido reiniciado.');
        };
        
        socket.on('draw_restarted', resetToVisualizacion);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onError);
        socket.on('initial_state', onInitialState);
        socket.on('update_participants', onUpdateParticipants);
        socket.on('draw_started', onDrawStarted);
        socket.on('final_assignment', onFinalAssignment);
        socket.on('error_event', onError);

        return () => {
            socket.off('connect'); socket.off('disconnect'); socket.off('connect_error');
            socket.off('initial_state'); socket.off('update_participants'); socket.off('draw_started');
            socket.off('final_assignment'); socket.off('error_event');
            socket.off('draw_restarted');
            socket.disconnect();
        };
    }, [navigate, user, isOrganizer]);

    // --- HANDLERS ---
    const handleStartDraw = () => {
        alertify.confirm('Iniciar Sorteo', '¿Estás seguro?', () => socket.emit('start_draw'), () => {}).set('labels', { ok: 'Sí', cancel: 'No' });
    };
    const handleRestartDraw = () => {
        alertify.confirm('Reiniciar Sorteo', '¿Reiniciar todo?', () => socket.emit('restart_draw'), () => {}).set('labels', { ok: 'Sí', cancel: 'No' });
    };

    const handleAnimationComplete = () => {
        setAsignacion(prev => ({ 
            ...prev, // Preserva el receptorId existente
            revelado: true, 
            nombre: `¡${finalResultName}!` 
        }));
        setAnimationStage('revealingContent');
        setRunConfetti(true);
        setTimeout(() => setRunConfetti(false), 5000);
    };

    const handleGoToVisualizacion = () => setAnimationStage('idle');
    const handleInputChange = (e) => setNuevoDeseo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handleAddDeseo = async () => {
        if (nuevoDeseo.texto.trim() !== '') {
            try {
                const newItem = await addWishlistItem(nuevoDeseo);
                setMiListaDeseos([newItem, ...miListaDeseos]);
                setNuevoDeseo({ texto: '', url: '', tags: '' });
                alertify.success('Deseo añadido.');
            } catch (error) {
                alertify.error('No se pudo añadir el deseo.');
            }
        }
    };
    
    const handleRemoveDeseo = async (id) => {
        try {
            await deleteWishlistItem(id);
            setMiListaDeseos(miListaDeseos.filter(d => d.id !== id));
            alertify.warning('Deseo eliminado.');
        } catch (error) {
            alertify.error('No se pudo eliminar el deseo.');
        }
    };

    const handleViewRecipientWishlist = async () => {
        if (!asignacion.receptorId) {
            alertify.error('Aún no se te ha asignado un amigo secreto.');
            return;
        }
        try {
            const recipientName = asignacion.nombre.replace(/[¡!]/g, '');
            const items = await getWishlistByUserId(asignacion.receptorId);
            setSelectedRecipientWishlist({ name: recipientName, items: items || [] });
            setShowWishlistModal(true);
        } catch (error) {
            alertify.error('No se pudo cargar la lista de deseos.');
        }
    };

    const handleGoToDashboard = () => setAnimationStage('revealingContent');

    const handleCloseAndRedirect = () => {
        navigate('/coordinador/cordinadords');
    };

    if (animationStage === 'idle') {
        return <VisualizacionAmigo 
                    onGoToDashboard={asignacion.revelado ? handleGoToDashboard : null}
                    onClose={handleCloseAndRedirect} // Usar la nueva función de redirección
                />;
    }

    if (animationStage === 'drawInProgress') {
        return <SorteoAnimation 
                    finalName={finalResultName || 'SORTEANDO'} 
                    onAnimationComplete={handleAnimationComplete} 
                />;
    }

    return (
        <div className="amigo-secreto-dashboard">
            <SnowEffect />
            {runConfetti && <Confetti width={width} height={height} />}
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Amigo Secreto 2025</h1>
                    <p>¡Bienvenido al Frío, {currentUser.nombre}!</p>
                    {isOrganizer && (
                        <button onClick={() => setAnimationStage('idle')} className="btn-reiniciar-sorteo" style={{backgroundColor: 'rgba(0,0,0,0.3)', marginTop:'10px'}}>
                            <i className="fas fa-envelope"></i> Ver carta de invitación
                        </button>
                    )}
                </div>
                <div className="header-countdown"><Countdown targetDate={fechaDelEvento} /></div>
            </header>

                        <div className="dashboard-main-grid">
                <div className="card-principal" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '350px'}}>
                    <h2><i className="fas fa-gift"></i> Tu Amigo Secreto</h2>
                    
                    {asignacion.revelado ? (
                        <div className="asignacion-revelada" style={{animation: 'fadeInUp 0.5s ease-out'}}>
                            <h3 className="nombre-asignado">{asignacion.nombre}</h3>
                            <div className="budget-badge">Presupuesto: S/ 80.00</div>
                            <button className="btn-ver-lista" onClick={handleViewRecipientWishlist}>
                                <i className="fas fa-list"></i> Ver su Lista de Deseos
                            </button>
                        </div>
                    ) : (
                        <div className="asignacion-oculta">
                            <p style={{color:'#e1f1ff', fontSize: '1.2rem'}}>Esperando el sorteo...</p>
                            <div className="loader"></div>
                        </div>
                    )}
                </div>

                <div className="card-principal">
                    <h2><i className="fas fa-list-alt"></i> Mi Lista de Deseos</h2>
                    <div className="wishlist-form">
                        <input name="texto" value={nuevoDeseo.texto} onChange={handleInputChange} placeholder="¿Qué te gustaría recibir?" />
                        <input name="url" value={nuevoDeseo.url} onChange={handleInputChange} placeholder="Link de referencia (opcional)" />
                        <input name="tags" value={nuevoDeseo.tags} onChange={handleInputChange} placeholder="Talla, color, etc." />
                        <button onClick={handleAddDeseo} className="btn-add-deseo"><i className="fas fa-plus"></i> Añadir a mi Lista</button>
                    </div>
                    <ul className="wishlist">
                        {miListaDeseos.map((deseo) => (
                            <li key={deseo.id}>
                                <div className="wishlist-item-main">
                                    {deseo.url ? <a href={deseo.url} target="_blank" rel="noopener noreferrer">{deseo.texto} <i className="fas fa-external-link-alt"></i></a> : <span>{deseo.texto}</span>}
                                    <div className="tags-container">{deseo.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}</div>
                                </div>
                                <button onClick={() => handleRemoveDeseo(deseo.id)} className="btn-eliminar-deseo">&times;</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* {asignacion.revelado && (<button className="fab-chat-btn" onClick={() => setShowChat(true)} title="Enviar Mensaje Anónimo"><i className="fas fa-mask"></i></button>)} */}
            {showChat && <ChatAnonimo onClose={() => setShowChat(false)} />}
            <WishlistModal isOpen={showWishlistModal} onClose={() => setShowWishlistModal(false)} recipientName={selectedRecipientWishlist.name} wishlist={selectedRecipientWishlist.items} />
        </div>
    );
}