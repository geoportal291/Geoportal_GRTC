import React, { useEffect, useRef, useState } from 'react';
import './SorteoAnimation.css';

const SorteoAnimation = ({ finalName, onAnimationComplete }) => {

    const [showRevealBox, setShowRevealBox] = useState(false);
    const [isLotteryDone, setIsLotteryDone] = useState(false);

    const containerRef = useRef(null);
    const lotteryIntervalRef = useRef(null); 
    const friendNameElementRef = useRef(null);
    
    // Refs para los mensajes (Evita usar document.getElementById que falla a veces)
    const msg1Ref = useRef(null);
    const msg2Ref = useRef(null);
    const msg3Ref = useRef(null);

    // GUARDAMOS EL NOMBRE EN UNA REF PARA LEERLO DENTRO DEL TIMEOUT SIN REINICIAR EL EFECTO
    const finalNameRef = useRef(finalName);

    // Actualizamos la ref cada vez que el socket te mande un nombre nuevo
    useEffect(() => {
        finalNameRef.current = finalName;
    }, [finalName]);

    const iniciarEfectoLotería = () => {
        // Leemos el nombre ACTUAL (el que haya llegado por socket)
        const textoFinal = finalNameRef.current || "???"; 
        
        let iteraciones = 0;
        const letrasPosibles = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const elemento = friendNameElementRef.current;

        if (!elemento) return;

        if (lotteryIntervalRef.current) clearInterval(lotteryIntervalRef.current);

        lotteryIntervalRef.current = setInterval(() => {
            elemento.innerText = textoFinal
                .split("")
                .map((letra, index) => {
                    if (index < iteraciones) return textoFinal[index];
                    return letrasPosibles[Math.floor(Math.random() * 26)];
                })
                .join("");

            if (iteraciones >= textoFinal.length) {
                clearInterval(lotteryIntervalRef.current);
                setIsLotteryDone(true);
            }

            iteraciones += 1 / 10; 
        }, 50); 
    };

    // --- SECUENCIA DE ANIMACIÓN (SE EJECUTA UNA SOLA VEZ AL MONTAR) ---
    useEffect(() => {
        
        // Helpers para animar los mensajes usando las Refs
        const showMessage = (ref) => ref.current?.classList.add('active');
        const hideMessage = (ref) => {
            ref.current?.classList.remove('active');
            ref.current?.classList.add('exit');
        };

        const timers = [];

        // 1. Arrancar inmediatamente (No esperamos al nombre)
        timers.push(setTimeout(() => showMessage(msg1Ref), 100));
        
        // 2. Mensaje 2 (2.0s)
        timers.push(setTimeout(() => {
            hideMessage(msg1Ref);
            showMessage(msg2Ref);
        }, 2000));

        // 3. Mensaje 3 (4.0s)
        timers.push(setTimeout(() => {
            hideMessage(msg2Ref);
            showMessage(msg3Ref);
        }, 4000));

        // 4. Revelación (6.0s) - Aquí es donde leemos el nombre
        timers.push(setTimeout(() => {
            hideMessage(msg3Ref);
            setShowRevealBox(true);
            // Esperamos un pelín para que el div se renderice y lanzamos las letras
            setTimeout(() => iniciarEfectoLotería(), 100);
        }, 6000));

        return () => {
            timers.forEach(timer => clearTimeout(timer));
            if (lotteryIntervalRef.current) clearInterval(lotteryIntervalRef.current);
        };
        
    // ARRAY DE DEPENDENCIAS VACÍO: [] 
    // Esto asegura que el efecto corra 1 sola vez y JAMÁS se reinicie por culpa del socket
    }, []); 

    // Efecto de Nieve
    useEffect(() => {
        const createSnow = () => {
            const snowCount = 60;
            const snowflakes = [];
            const container = containerRef.current || document.body;
            for (let i = 0; i < snowCount; i++) {
                const snow = document.createElement('div');
                snow.classList.add('snowflake');
                snow.style.left = Math.random() * 100 + 'vw';
                snow.style.width = Math.random() * 4 + 2 + 'px';
                snow.style.height = snow.style.width;
                snow.style.animationDuration = Math.random() * 5 + 3 + 's';
                snow.style.animationDelay = Math.random() * 5 + 's';
                snow.style.opacity = Math.random() * 0.7 + 0.3;
                container.appendChild(snow);
                snowflakes.push(snow);
            }
            return snowflakes;
        };
        const snowflakes = createSnow();
        return () => snowflakes.forEach(flake => flake.remove());
    }, []);

    return (
        <div className="sorteo-animation-container" ref={containerRef}>
            <div className="sa-message-container">
                <div ref={msg1Ref} className="sa-story-text">Consultando a los espíritus del invierno...</div>
                <div ref={msg2Ref} className="sa-story-text">Buscando entre la nieve mágica...</div>
                <div ref={msg3Ref} className="sa-story-text">El nombre se está congelando...</div>
            </div>

            <div className={`sa-reveal-box ${showRevealBox ? 'show' : ''}`} style={{display: showRevealBox ? 'flex' : 'none'}}>
                <div className="sa-intro-label">Tu Amigo Secreto es</div>
                <div className="sa-final-name" ref={friendNameElementRef}></div>
                
                {isLotteryDone && (
                    <button className="sa-btn-continuar" onClick={onAnimationComplete}>
                        Continuar
                    </button>
                )}
            </div>
        </div>
    );
};

const SorteoAnimationWrapper = (props) => (
    <div style={{ 
        margin: 0, height: '100vh', width: '100%',
        background: 'radial-gradient(circle at center, #3182cf 0%, #081b33 100%)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column',
        fontFamily: "'Cinzel Decorative', serif", overflow: 'hidden', color: '#fff',
        position: 'fixed', top: 0, left: 0, zIndex: 10000
    }}>
        <SorteoAnimation {...props} />
    </div>
);

export { SorteoAnimationWrapper as SorteoAnimation };