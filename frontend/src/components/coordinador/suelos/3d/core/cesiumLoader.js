/**
 * cesiumLoader.js
 * Carga dinámica y segura del script de Cesium (/cesium/Cesium.js) mediante un patrón Promise Singleton.
 * Previene pantallas blancas y crashes por evaluación prematura si window.Cesium no ha terminado de cargar.
 */

let cesiumLoadingPromise = null;

export function loadCesium() {
    if (window.Cesium) {
        return Promise.resolve(window.Cesium);
    }

    if (cesiumLoadingPromise) {
        return cesiumLoadingPromise;
    }

    cesiumLoadingPromise = new Promise((resolve, reject) => {
        // Verificar si el link CSS de Cesium existe, de lo contrario inyectarlo
        if (!document.querySelector('link[href*="cesium/Widgets/widgets.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/cesium/Widgets/widgets.css';
            document.head.appendChild(link);
        }

        // Inyectar el script Cesium.js
        const script = document.createElement('script');
        script.src = '/cesium/Cesium.js';
        script.async = true;

        script.onload = () => {
            if (window.Cesium) {
                resolve(window.Cesium);
            } else {
                reject(new Error('Cesium script loaded but window.Cesium is undefined.'));
            }
        };

        script.onerror = (err) => {
            cesiumLoadingPromise = null; // Permitir reintento en caso de falla de red
            reject(new Error('Failed to load Cesium script from /cesium/Cesium.js'));
        };

        document.body.appendChild(script);
    });

    return cesiumLoadingPromise;
}

export function isCesiumLoaded() {
    return typeof window !== 'undefined' && !!window.Cesium;
}
