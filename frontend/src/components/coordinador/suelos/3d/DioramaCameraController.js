// ─── Constantes ──────────────────────────────────────────────────────────────

const LOCAL_CAMERA_MODES = new Set(['diorama', 'firstPerson']);

const DEFAULT_DIORAMA_SIZE = 420;

// Separadas en dos bloques para mayor claridad geográfica vs validación
const GEO = {
    METERS_PER_DEGREE_LAT: 110_540,
    METERS_PER_DEGREE_LON: 111_320,
    MIN_METERS_PER_LON: 0.0001,   // antes era un magic number inline
};

const POSITION_EPSILON = 0.001; // umbral de cambio "insignificante"

const CAMERA_CONFIG = {
    local: {
        inertia: 0.05,           // Antes: 0.17 → Respuesta más directa en modo local
        maximumMovementRatio: 0.08, // Antes: 0.01 → Movimiento mucho más fluido
        zoomFactor: 6.0,         // Antes: 2.0 → Zoom más rápido y potente
        minimumZoomDistance: 1,
    },
    global: {
        inertia: 0.08,           // Antes: 0.15 → Pan más responsivo en global
        maximumMovementRatio: 0.12, // Antes: 0.05 → Más velocidad al desplazarse
        zoomFactor: 10.0,        // Antes: 5.0 → Zoom global mucho más rápido
        minimumZoomDistance: 1,
    },
};

// ─── Utilidades primitivas ────────────────────────────────────────────────────

const isFiniteNumber = (value) => Number.isFinite(value);

const safeNumber = (value, fallback = 0) =>
    isFiniteNumber(value) ? value : fallback;

const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

// ─── Exports públicos ─────────────────────────────────────────────────────────

export const isLocalCesiumCameraMode = (mode) =>
    LOCAL_CAMERA_MODES.has(mode);

/**
 * Calcula la altura máxima de cámara para el modo diorama.
 * Devuelve el mayor de tres candidatos: sobre la superficie, sobre
 * el objeto más alto, o proporcional al tamaño del diorama.
 */
export const getDioramaLocalMaxHeight = ({
    surfaceReferenceZ,
    sizeMeters,
    maxZ,
}) => {
    const surface = safeNumber(surfaceReferenceZ, 0);
    const topOfObjects = safeNumber(maxZ, surface);
    const size = safeNumber(sizeMeters, 0);

    return Math.max(
        surface + 900,          // mínimo absoluto sobre la superficie
        topOfObjects + 450,     // margen sobre el objeto más alto
        surface + size * 1.15,  // proporcional al radio del diorama
    );
};

/**
 * Aplica la configuración del controlador de cámara según el modo activo.
 * No hace nada si `controller` es nulo/undefined.
 */
export const applyDioramaCameraMode = ({ controller, mode, dioramaSize }) => {
    if (!controller) return;

    const isLocal = isLocalCesiumCameraMode(mode);
    const config = isLocal ? CAMERA_CONFIG.local : CAMERA_CONFIG.global;
    const safeDioramaSize = safeNumber(dioramaSize, DEFAULT_DIORAMA_SIZE);

    // Habilitar todos los inputs de una vez (más legible que seis líneas separadas)
    Object.assign(controller, {
        enableInputs: true,
        enableLook: true,
        enableTilt: true,
        enableTranslate: true,
        enableRotate: true,
        enableZoom: true,
        inertiaSpin: config.inertia,
        inertiaTranslate: config.inertia,
        inertiaZoom: config.inertia,
        maximumMovementRatio: config.maximumMovementRatio,
        minimumZoomDistance: config.minimumZoomDistance,
    });

    // zoomFactor es opcional en algunos controladores (ScreenSpaceCameraController)
    if ('zoomFactor' in controller) {
        controller.zoomFactor = config.zoomFactor;
    }

    controller.maximumZoomDistance = isLocal
        ? Math.max(1200, safeDioramaSize * 3.2)
        : Number.POSITIVE_INFINITY;
};

// ─── Helpers internos de clampDioramaCamera ───────────────────────────────────

/**
 * Convierte la posición cartográfica actual a desplazamientos en metros
 * respecto al centro del diorama, devuelve null si los datos son inválidos.
 */
function getCartographicDelta(Cesium, camera, { centerLat, centerLon }) {
    const pos = camera.positionCartographic;
    if (!pos) return null;

    const lon = Cesium.Math.toDegrees(pos.longitude);
    const lat = Cesium.Math.toDegrees(pos.latitude);

    // cos(centerLat) compensa la convergencia de meridianos en latitudes altas
    const rawMetersPerLon =
        GEO.METERS_PER_DEGREE_LON * Math.cos(Cesium.Math.toRadians(centerLat));

    const metersPerLon =
        Math.abs(rawMetersPerLon) > GEO.MIN_METERS_PER_LON
            ? rawMetersPerLon
            : 1;

    return {
        deltaLonMeters: (lon - centerLon) * metersPerLon,
        deltaLatMeters: (lat - centerLat) * GEO.METERS_PER_DEGREE_LAT,
        height: safeNumber(pos.height, 0),
        metersPerLon,
    };
}

/**
 * Restringe los deltas lat/lon a la elipse definida por widthLimit × depthLimit.
 * Si el punto ya está dentro de la elipse lo devuelve sin cambios.
 */
function clampToEllipse(deltaLonMeters, deltaLatMeters, widthLimit, depthLimit) {
    // Clamp rectangular primero (más rápido que ir directo a la elipse)
    let lon = clamp(deltaLonMeters, -widthLimit, widthLimit);
    let lat = clamp(deltaLatMeters, -depthLimit, depthLimit);

    // Normalizar a espacio unitario y comprobar si está fuera del círculo unitario
    const nx = lon / Math.max(widthLimit, 1);
    const ny = lat / Math.max(depthLimit, 1);
    const dist = Math.hypot(nx, ny);

    if (dist > 1) {
        lon /= dist;
        lat /= dist;
    }

    return { lon, lat };
}

/**
 * Comprueba si los valores ajustados difieren del original en más de EPSILON.
 */
function hasSignificantChange(original, clamped) {
    return (
        Math.abs(clamped.deltaLonMeters - original.deltaLonMeters) >= POSITION_EPSILON ||
        Math.abs(clamped.deltaLatMeters - original.deltaLatMeters) >= POSITION_EPSILON ||
        Math.abs(clamped.height - original.height) >= POSITION_EPSILON
    );
}

// ─── Export principal ─────────────────────────────────────────────────────────

/**
 * Calcula la corrección necesaria para mantener la cámara dentro de los límites
 * del diorama. Devuelve null si la cámara ya está dentro o si faltan datos.
 *
 * @returns {{ from, to, destination } | null}
 */
export const clampDioramaCamera = ({ Cesium, camera, constraint }) => {
    if (!Cesium || !camera || !constraint) return null;

    const {
        centerLat,
        centerLon,
        minHeight,
        halfWidthMeters,
        halfDepthMeters,
        clampHalfWidthMeters,
        clampHalfDepthMeters,
        localMaxHeight,
        maxHeight,
    } = constraint;

    // Validar que los campos mínimos del constraint sean utilizables
    if (
        !isFiniteNumber(centerLat) ||
        !isFiniteNumber(centerLon) ||
        !isFiniteNumber(minHeight)
    ) {
        return null;
    }

    const delta = getCartographicDelta(Cesium, camera, { centerLat, centerLon });
    if (!delta) return null;

    const widthLimit = safeNumber(clampHalfWidthMeters, halfWidthMeters);
    const depthLimit = safeNumber(clampHalfDepthMeters, halfDepthMeters);
    const heightLimit = safeNumber(localMaxHeight, maxHeight);

    if (
        !isFiniteNumber(widthLimit) ||
        !isFiniteNumber(depthLimit) ||
        !isFiniteNumber(heightLimit)
    ) {
        return null;
    }

    const ellipsed = clampToEllipse(
        delta.deltaLonMeters,
        delta.deltaLatMeters,
        widthLimit,
        depthLimit,
    );

    const clamped = {
        deltaLonMeters: ellipsed.lon,
        deltaLatMeters: ellipsed.lat,
        height: clamp(delta.height, minHeight, heightLimit),
    };

    if (!hasSignificantChange(delta, clamped)) return null;

    return {
        from: {
            deltaLonMeters: delta.deltaLonMeters,
            deltaLatMeters: delta.deltaLatMeters,
            height: delta.height,
        },
        to: clamped,
        destination: {
            lon: centerLon + clamped.deltaLonMeters / delta.metersPerLon,
            lat: centerLat + clamped.deltaLatMeters / GEO.METERS_PER_DEGREE_LAT,
            height: clamped.height,
        },
    };
};