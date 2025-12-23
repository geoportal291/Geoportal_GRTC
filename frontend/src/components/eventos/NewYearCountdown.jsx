import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useNavigate } from 'react-router-dom';
import './NewYearCountdown.css';

const messages = [
    "Uniendo pueblos, integrando vidas y trazando nuevas rutas.",
    "Construyendo un futuro sólido para la región este 2026.",
    "Ingeniería que conecta corazones y familias en estas fiestas.",
    "GRTC: Pavimentando el camino hacia un próspero Año Nuevo.",
    "Que la señal de la paz y el progreso llegue a cada kilómetro.",
    "Estructurando sueños, cimentando realidades."
];

const NewYearCountdown = ({ onClose }) => {
    const { width, height } = useWindowSize();
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState({});
    const [isNewYear, setIsNewYear] = useState(false);

    const [currentMessage, setCurrentMessage] = useState(messages[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessage(prev => {
                const currentIndex = messages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const currentYear = new Date().getFullYear();
            const targetDate = new Date(`January 1, ${currentYear + 1} 00:00:00`);
            const difference = +targetDate - +new Date();
            let timeLeft = {};

            if (difference > 0) {
                timeLeft = {
                    días: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutos: Math.floor((difference / 1000 / 60) % 60),
                    segundos: Math.floor((difference / 1000) % 60),
                };
            } else {
                setIsNewYear(true);
            }
            return timeLeft;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleEnter = () => {
        if (onClose) {
            onClose();
        } else {
            navigate('/coordinador/cordinadords');
        }
    };

    return (
        <div className="new-year-container">
            <Confetti
                width={width}
                height={height}
                numberOfPieces={150}
                gravity={0.05}
                colors={['#FFD700', '#FFA500', '#FFFFFF', '#C0C0C0']} // Gold, Orange, White, Silver
            />

            <div className="ny-content">
                <div className="ny-header">
                    <h1 className="ny-title">Próspero Año Nuevo</h1>
                    <h2 className="ny-year">2026</h2>
                    <p className="ny-subtitle fade-in-out">{currentMessage}</p>
                </div>

                {!isNewYear ? (
                    <div className="ny-countdown">
                        {Object.keys(timeLeft).map((interval) => (
                            <div key={interval} className="ny-time-box">
                                <span className="ny-time-value">{timeLeft[interval]}</span>
                                <span className="ny-time-label">{interval.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ny-celebration">
                        ¡Bienvenido 2026!
                    </div>
                )}

                <button className="ny-enter-btn" onClick={handleEnter}>
                    Ingresar al Sistema <i className="fas fa-arrow-right"></i>
                </button>
            </div>

            {/* Background Animations */}
            <div className="ny-stars"></div>
            <div className="ny-glow"></div>
        </div>
    );
};

export default NewYearCountdown;
