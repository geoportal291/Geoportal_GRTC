import { useCallback, useRef } from 'react';

/**
 * Hook unificado para la gestión de elevación y exageración vertical Z.
 * Soluciona el Bug P0-2 (descalce altimétrico entre terreno, malla LandXML y cilindros).
 */
export default function useTerrainElevation() {
    const terrainCacheRef = useRef(new Map());

    /**
     * Resuelve la altura de superficie (MSL) con prioridad:
     * 1. BD `elevacion` si está presente y es finita
     * 2. Muestreo del motor de mapas
     * 3. Fallback a 0 m
     */
    const resolveSurfaceZ = useCallback((item, sampledZ = null) => {
        if (item && Number.isFinite(parseFloat(item.elevacion)) && parseFloat(item.elevacion) !== 0) {
            return parseFloat(item.elevacion);
        }
        if (Number.isFinite(sampledZ)) {
            return sampledZ;
        }
        return 0;
    }, []);

    /**
     * Aplica exageración vertical coherente a cualquier cota.
     * Fórmula única de transformación:
     * Z_render = Z_surfaceBase + ((Z_abs - Z_surfaceBase) * zExag)
     *
     * @param {number} z - Cota absoluta o relativa
     * @param {number} zExag - Factor de exageración (1x a 50x)
     * @param {object} options
     * @param {number} [options.surfaceBase] - Cota de superficie de referencia
     * @param {boolean} [options.isRelativeDepth] - Si true, z representa profundidad positiva desde la superficie
     */
    const exaggerateZ = useCallback((z, zExag = 1.0, options = {}) => {
        const factor = Math.max(1.0, parseFloat(zExag) || 1.0);
        const surfaceBase = options.surfaceBase || 0;

        if (options.isRelativeDepth) {
            // z es profundidad (ej: 0.5 m, 2.0 m). La cota exagerada desciende desde surfaceBase
            return surfaceBase - (Math.abs(z) * factor);
        }

        // Exageración relativa a la cota base de superficie
        return surfaceBase + ((z - surfaceBase) * factor);
    }, []);

    return {
        resolveSurfaceZ,
        exaggerateZ,
        terrainCache: terrainCacheRef.current
    };
}
