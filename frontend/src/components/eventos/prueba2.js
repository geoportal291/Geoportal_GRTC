// prueba2.js - Refactored JavaScript for the Sorteo Invernal effect

// Configuración del resultado
const NOMBRE_REAL = "FERNANDO"; // Puedes cambiar este nombre según sea necesario

// Referencias DOM (se obtienen al cargar la página)
const btn = document.getElementById('btnStart');
const finalReveal = document.getElementById('finalReveal');
const friendNameElement = document.getElementById('friendName');
const msgs = [
    document.getElementById('msg1'),
    document.getElementById('msg2'),
    document.getElementById('msg3')
];
const letrasPosibles = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Crea la nieve de fondo.
 */
function initSnow() {
    const snowCount = 60;
    for (let i = 0; i < snowCount; i++) {
        const snow = document.createElement('div');
        snow.classList.add('snowflake');
        snow.style.left = Math.random() * 100 + 'vw';
        snow.style.width = Math.random() * 4 + 2 + 'px';
        snow.style.height = snow.style.width;
        snow.style.animationDuration = Math.random() * 5 + 3 + 's';
        snow.style.animationDelay = Math.random() * 5 + 's';
        snow.style.opacity = Math.random() * 0.7 + 0.3;
        document.body.appendChild(snow);
    }
}

/** Muestra un mensaje narrativo */
function showMessage(index) {
    msgs[index].classList.add('active');
}
/** Oculta un mensaje narrativo */
function hideMessage(index) {
    msgs[index].classList.remove('active');
    msgs[index].classList.add('exit');
}
/** Muestra el contenedor final */
function showFinal() {
    finalReveal.style.display = "flex";
    setTimeout(() => finalReveal.classList.add('show'), 50);
}
/**
 * Efecto de lotería que revela el nombre letra a letra.
 * @param {HTMLElement} elemento - El elemento donde se mostrará el texto.
 * @param {string} textoFinal - El nombre completo a revelar.
 */
function startLotteryEffect(elemento, textoFinal) {
    let iteraciones = 0;
    const intervalo = setInterval(() => {
        elemento.innerText = textoFinal
            .split("")
            .map((letra, index) => {
                if (index < iteraciones) {
                    return textoFinal[index];
                }
                return letrasPosibles[Math.floor(Math.random() * 26)];
            })
            .join("");
        if (iteraciones >= textoFinal.length) {
            clearInterval(intervalo);
        }
        // Cada 10 iteraciones se fija una letra nueva (más lento que antes)
        iteraciones += 1 / 10;
    }, 50);
}
/** Configura los listeners y la secuencia completa */
function setupEventListeners() {
    btn.addEventListener('click', () => {
        btn.classList.add('pulsing');
        setTimeout(() => showMessage(0), 500);
        setTimeout(() => {
            hideMessage(0);
            showMessage(1);
        }, 2500);
        setTimeout(() => {
            hideMessage(1);
            showMessage(2);
        }, 4500);
        setTimeout(() => {
            hideMessage(2);
            showFinal();
            startLotteryEffect(friendNameElement, NOMBRE_REAL);
        }, 6500);
    });
}

// Inicialización al cargar la página
initSnow();
setupEventListeners();
