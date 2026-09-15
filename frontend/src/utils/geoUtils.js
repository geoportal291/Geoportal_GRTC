import proj4 from 'proj4';

export const UTM_17S = "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs";
export const UTM_18S = "+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs";
export const UTM_19S = "+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs";
export const WGS84 = "EPSG:4326";

/**
 * Detecta la zona UTM y corrige la inversión de ejes X/Y común en archivos de topografía en Perú.
 * @param {number} x - Easting
 * @param {number} y - Northing
 * @param {string} [forcedZone] - Opcional: '17S', '18S', '19S'
 */
export const processCoordinates = (x, y, forcedZone) => {
    let finalX = x;
    let finalY = y;

    // Corrección de inversión automática (Basado en la magnitud típica de Perú)
    if (x > y) {
        finalX = y;
        finalY = x;
    }

    let projection = UTM_18S; // Default
    if (forcedZone === '17S') projection = UTM_17S;
    else if (forcedZone === '19S') projection = UTM_19S;
    else if (forcedZone === '18S') projection = UTM_18S;
    else {
        // Fallback heurístico mejorado
        projection = finalX < 400000 ? UTM_19S : UTM_18S;
    }
    
    return { x: finalX, y: finalY, projection };
};

/**
 * Convierte coordenadas UTM a WGS84 (Lon/Lat) con validación de seguridad.
 * @param {number} x 
 * @param {number} y 
 * @param {string} [zone] - '17S', '18S', '19S' 
 */
export const utmToWgs84 = (x, y, zone, options = {}) => {
    const numX = parseFloat(x);
    const numY = parseFloat(y);
    
    if (!Number.isFinite(numX) || !Number.isFinite(numY) || (numX === 0 && numY === 0)) {
        if (options?.strict) {
            return null;
        }
        console.warn(`[geoUtils] Coordenadas inválidas recibidas (X=${x}, Y=${y}). Evitando salto a (0,0).`);
        return null;
    }

    const { x: correctedX, y: correctedY, projection } = processCoordinates(numX, numY, zone);
    
    const resProj = proj4(projection, WGS84, [correctedX, correctedY]);
    const [lon, lat] = resProj;
    
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        return null;
    }
    
    return { lon, lat };
};

/**
 * Formatea coordenadas para visualización técnica.
 */
export const formatCoordinates = (coords) => {
    if (!coords) return null;
    const { este, norte, elevacion } = coords;
    
    return {
        este: este?.toLocaleString('en-US', { minimumFractionDigits: 3 }),
        norte: norte?.toLocaleString('en-US', { minimumFractionDigits: 3 }),
        elevacion: elevacion?.toFixed(2)
    };
};

/**
 * Detecta la zona UTM (S) basada en la longitud WGS84.
 * @param {number} lon 
 * @returns {string} '17S', '18S' o '19S'
 */
export const getUtmZoneFromLon = (lon) => {
    if (lon >= -84 && lon < -78) return '17S';
    if (lon >= -78 && lon < -72) return '18S';
    if (lon >= -72 && lon < -66) return '19S';
    return '18S'; // Default Perú Central
};

/**
 * Espera a que el terrainProvider esté listo (ready) antes de usarlo.
 * Hace polling cada 100ms con un timeout máximo de 15 segundos.
 * @param {object} terrainProvider 
 * @returns {Promise<boolean>} true si está listo, false si agotó el timeout
 */
export const waitForTerrainReady = (terrainProvider) => {
    return new Promise((resolve) => {
        if (!terrainProvider) { resolve(false); return; }

        // El proveedor de elipsoide no tiene datos que cargar (alturas siempre 0):
        // está "listo" de inmediato. Antes se agotaba el timeout de 15 s en vano.
        if (terrainProvider.constructor?.name === 'EllipsoidTerrainProvider') {
            resolve(true);
            return;
        }

        // API moderna de Cesium: terrainProvider es una Promise o tiene .ready
        if (terrainProvider.ready === true) { resolve(true); return; }

        // Si ready ya es false pero tiene readyPromise (API antigua), esperarla
        if (terrainProvider.readyPromise) {
            terrainProvider.readyPromise
                .then(() => resolve(true))
                .catch(() => resolve(false));
            return;
        }

        // Cesium ≥ 1.119 eliminó `ready`/readyPromise: los proveedores modernos
        // (p. ej. ArcGISTiledElevationTerrainProvider) completan `availability`/`tilingScheme`
        // de forma ASÍNCRONA después de construirse. Se espera (≤10 s) a que el metadato
        // exista; si no llega, se resuelve igual y los samplers aplican sus guardas.
        const maxWaitMs = 10_000;
        const intervalMs = 200;
        let elapsed = 0;
        const timer = setInterval(() => {
            if (terrainProvider.availability || elapsed >= maxWaitMs) {
                clearInterval(timer);
                resolve(true);
            } else {
                elapsed += intervalMs;
            }
        }, intervalMs);
    });
};

/**
 * Divide una petición masiva de muestreo de terreno en porciones (chunks) para evitar timeouts.
 * Espera automáticamente a que el terrainProvider esté listo antes de muestrear.
 * @param {object} Cesium - Globals
 * @param {object} terrainProvider 
 * @param {Array} cartographics 
 * @param {number} chunkSize 
 */
export const chunkedSampleTerrain = async (Cesium, terrainProvider, cartographics, chunkSize = 1000) => {
    if (!Cesium || !cartographics || cartographics.length === 0) return [];

    const zeroHeights = (cartos) => cartos.map(c => {
        const cloned = Cesium.Cartographic.clone(c);
        cloned.height = 0;
        return cloned;
    });

    // Sin proveedor: devolver ceros directamente (sin warning redundante)
    if (!terrainProvider) {
        return zeroHeights(cartographics);
    }

    // El proveedor de elipsoide no requiere espera ni red: alturas 0 directas.
    // (Antes se esperaba el timeout de waitForTerrainReady y luego se devolvían ceros igualmente.)
    if (terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
        return zeroHeights(cartographics);
    }

    // Esperar a que el terrainProvider esté listo
    const isReady = await waitForTerrainReady(terrainProvider);
    if (!isReady) {
        console.warn('[geoUtils] chunkedSampleTerrain: terrainProvider no se preparó a tiempo. Usando alturas 0.');
        return zeroHeights(cartographics);
    }

    const results = [];

    for (let i = 0; i < cartographics.length; i += chunkSize) {
        const chunk = cartographics.slice(i, i + chunkSize);
        try {
            let sampledChunk;

            // sampleTerrainMostDetailed EXIGE terrainProvider.availability, que puede ser
            // undefined en proveedores modernos mientras cargan su metadato (p. ej.
            // ArcGISTiledElevationTerrainProvider) → TypeError computeMaximumLevelAtPosition.
            // Sin availability se usa sampleTerrain a nivel fijo, que soporta cualquier proveedor.
            const sampleFn = Cesium.sampleTerrainMostDetailedAsync || Cesium.sampleTerrainMostDetailed;

            if (typeof sampleFn === 'function' && terrainProvider.availability) {
                sampledChunk = await sampleFn(terrainProvider, chunk);
            } else {
                // Nivel 13 ≈ 20-40 m/px: sobrado para posicionar calicatas.
                sampledChunk = await Cesium.sampleTerrain(terrainProvider, 13, chunk);
            }
            results.push(...sampledChunk);
        } catch (e) {
            console.error("[geoUtils] Error muestreando terreno:", e);
            // Fallback seguro en caso de error de red o de disponibilidad
            results.push(...chunk.map(c => {
                const cloned = Cesium.Cartographic.clone(c);
                cloned.height = 0;
                return cloned;
            }));
        }
    }
    return results;
};
