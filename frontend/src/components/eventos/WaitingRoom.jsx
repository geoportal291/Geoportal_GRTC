import React, { useEffect, useState } from 'react';
import './saladeespera.css';

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
        <div className="snow-container-salaespera">
            {snowflakes.map(flake => (
                <div 
                    key={flake.id} 
                    className="snowflake-salaespera"
                    style={{
                        left: flake.left,
                        width: flake.width,
                        height: flake.width,
                        animationDuration: flake.animationDuration,
                        animationDelay: flake.animationDelay,
                        opacity: flake.opacity
                    }}
                />
            ))}
        </div>
    );
};

const WaitingRoom = ({ participantes, isOrganizer, handleStartDraw, nombreUsuario, handleRestartDraw, sorteoIniciado, handleSkipToDashboard, navigate, selectedParticipantIds = [] }) => {
    
    // Lógica para comparar participantes conectados y seleccionados
    const connectedUserIds = new Set(participantes.map(p => p.id));
    const allSelectedAreConnected = selectedParticipantIds.every(id => connectedUserIds.has(id));
    const totalSelected = selectedParticipantIds.length;
    const totalConnected = participantes.filter(p => selectedParticipantIds.includes(p.id)).length;
    
    // Lógica para encontrar los nombres de los que faltan (solo si es organizador)
    let missingParticipants = [];
    if (isOrganizer && totalSelected > 0) {
        const connectedSelectedIds = new Set(participantes.map(p => p.id));
        // Este es un placeholder, en una app real necesitaríamos una lista de todos los usuarios, no solo los conectados
        // Por ahora, asumimos que no podemos saber el nombre de alguien no conectado.
        // Se podría mejorar si AmigoSecretoDashboard pasa la lista completa de usuarios.
    }

    const canStartDraw = totalSelected > 1 && totalConnected === totalSelected;

    return (
        <div className="waiting-room-overlay-salaespera">
            {/* Inyectamos la nieve */}
            <SnowEffect />

            <div className="waiting-room-card-salaespera">
                <div className="waiting-room-header-salaespera">
                    <h2><i className="fas fa-snowflake"></i> Sala de Espera</h2>
                    <p>¡Bienvenido al frío, {nombreUsuario}!</p>
                </div>
                
                <div className="waiting-room-content-salaespera">
                    {/* PANEL IZQUIERDO */}
                    <div className="panel-salaespera">
                        <h3 className="panel-title-salaespera"><i className="fas fa-users"></i> Conectados ({participantes.length})</h3>
                        <ul className="lista-participantes-salaespera">
                            {participantes.map(p => (
                                <li key={p.id}>
                                    <i className="fas fa-user-astronaut"></i>
                                    <span>{p.nombre}</span>
                                </li>
                            ))}
                            {participantes.length === 0 && (
                                <li style={{justifyContent: 'center', fontStyle: 'italic', opacity: 0.7, gridColumn: '1 / -1', border:'none', background: 'transparent', boxShadow:'none'}}>
                                    Esperando almas...
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* PANEL DERECHO */}
                    <div className="panel-salaespera">
                        <h3 className="panel-title-salaespera"><i className="fas fa-crown"></i> Panel del Organizador</h3>
                        
                        {isOrganizer ? (
                            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                                
                                <div style={{textAlign: 'center', marginBottom: '1rem'}}>
                                    <p style={{color: '#d0e8ff'}}>Participantes del Sorteo:</p>
                                    <p style={{fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: '0.5rem 0'}}>{totalConnected} de {totalSelected}</p>
                                    <p style={{fontSize: '0.9rem', color: '#a9d5ff', fontStyle: 'italic'}}>Todos los participantes seleccionados deben estar conectados.</p>
                                </div>

                                <button 
                                    onClick={() => navigate('/eventos/amigo-secreto/gestionar')}
                                    className="btn-iniciar-salaespera"
                                    style={{marginBottom: '10px', background: '#5bc0de', order: -1}} // Ponerlo arriba
                                >
                                    <i className="fas fa-user-cog"></i> Gestionar Participantes
                                </button>

                                <button 
                                    onClick={handleStartDraw} 
                                    className="btn-iniciar-salaespera"
                                    disabled={!canStartDraw}
                                >
                                    <i className="fas fa-magic"></i> Iniciar Sorteo
                                </button>

                                {!canStartDraw && (
                                    <small className="warning-text-salaespera">
                                        {totalSelected < 2 ? "Se necesitan al menos 2 participantes." : "Faltan participantes por conectarse."}
                                    </small>
                                )}

                                <button 
                                    onClick={handleRestartDraw}
                                    className="btn-reiniciar-salaespera"
                                    disabled={!sorteoIniciado}
                                >
                                    <i className="fas fa-redo"></i> Reiniciar
                                </button>
                                
                                <button
                                    onClick={handleSkipToDashboard}
                                    className="btn-reiniciar-salaespera"
                                    style={{background: 'rgba(91, 192, 222, 0.2)', borderColor: '#5bc0de', marginTop:'5px'}}
                                >
                                    <i className="fas fa-bug"></i> Debug
                                </button>
                            </div>
                        ) : (
                            <div style={{textAlign: 'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%'}}>
                                <p style={{color:'#fff'}}>El sorteo se está congelando... ten paciencia.</p>
                                <div className="loader-salaespera"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingRoom;