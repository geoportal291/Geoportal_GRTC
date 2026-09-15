import { CesiumEngine } from './engines/CesiumEngine';
import { MapboxEngine } from './engines/MapboxEngine';

/**
 * Fábrica orquestadora de motores de mapa 3D (Cesium vs Mapbox GL JS v3).
 * Permite cambiar transparente y dinámicamente entre motores mediante la variable
 * de entorno REACT_APP_MAP_ENGINE o selección de usuario.
 */
export class MapEngineFactory {
    /**
     * Crea e inicializa una instancia del motor configurado.
     *
     * @param {HTMLElement} container - Contenedor DOM para el mapa
     * @param {object} options - Opciones de inicialización (tokens, zoom, exageración)
     * @param {string} [overrideEngine] - Opcional: 'mapbox' | 'cesium'
     * @returns {Promise<CesiumEngine|MapboxEngine>}
     */
    static async createEngine(container, options = {}, overrideEngine = null) {
        const preferredEngine = overrideEngine || process.env.REACT_APP_MAP_ENGINE || 'cesium';

        console.log(`[MapEngineFactory] Inicializando motor 3D: ${preferredEngine.toUpperCase()}`);

        if (preferredEngine.toLowerCase() === 'mapbox') {
            try {
                const engine = new MapboxEngine();
                await engine.init(container, options);
                return engine;
            } catch (err) {
                console.warn('[MapEngineFactory] Fallo al iniciar MapboxEngine, ejecutando fallback a CesiumEngine:', err);
                const fallbackEngine = new CesiumEngine();
                await fallbackEngine.init(container, options);
                return fallbackEngine;
            }
        } else {
            const engine = new CesiumEngine();
            await engine.init(container, options);
            return engine;
        }
    }
}
