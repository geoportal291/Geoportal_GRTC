/* eslint-disable no-restricted-globals, no-undef */
/**
 * objParser.worker.js
 * Web Worker para parsear archivos OBJ en un hilo separado con precisión geodésica exacta (proj4).
 * Elimina el freeze de 700ms+ en el hilo principal del visor 3D.
 */
import proj4 from 'proj4';

const UTM_17S = "+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs";
const UTM_18S = "+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs";
const UTM_19S = "+proj=utm +zone=19 +south +datum=WGS84 +units=m +no_defs";
const WGS84 = "EPSG:4326";

function utmToWgs84Exact(easting, northing, zoneStr) {
    const numX = parseFloat(easting);
    const numY = parseFloat(northing);

    if (!Number.isFinite(numX) || !Number.isFinite(numY) || (numX === 0 && numY === 0)) {
        return { lon: 0, lat: 0 };
    }

    let projection = UTM_18S;
    if (zoneStr === '17S') projection = UTM_17S;
    else if (zoneStr === '19S') projection = UTM_19S;
    else if (zoneStr === '18S') projection = UTM_18S;
    else {
        projection = numX < 400000 ? UTM_19S : UTM_18S;
    }

    const [lon, lat] = proj4(projection, WGS84, [numX, numY]);
    return { lon, lat };
}

function processCoordinatesWorker(x, y) {
    // Corrección de inversión X/Y común en archivos topográficos peruanos
    return x > y ? { x: y, y: x } : { x, y };
}

// ─── Parser Principal ─────────────────────────────────────────────────────────

function parseObj(objData, projectZone) {
    const rawVertices = [];
    const rawIndicesTriangulos = [];
    let minZ = Infinity;
    let maxZ = -Infinity;

    const lines = objData.split('\n');
    const total = lines.length;
    let lastReportedPercent = 0;

    for (let i = 0; i < total; i++) {
        const ch0 = lines[i].charCodeAt(0);
        const ch1 = lines[i].charCodeAt(1);

        if (ch0 === 118 && ch1 === 32) {
            // 'v ' — vértice
            const parts = lines[i].trim().split(/\s+/);
            const vx = parseFloat(parts[2]);
            const vy = parseFloat(parts[1]);
            const vz = parseFloat(parts[3]);

            const { x, y } = processCoordinatesWorker(vx, vy);
            const { lon, lat } = utmToWgs84Exact(x, y, projectZone);

            rawVertices.push({ x, y, z: vz, lon, lat });
            if (vz < minZ) minZ = vz;
            if (vz > maxZ) maxZ = vz;

        } else if (ch0 === 102 && ch1 === 32) {
            // 'f ' — cara
            const parts = lines[i].trim().split(/\s+/);
            if (parts.length >= 4) {
                rawIndicesTriangulos.push(
                    parseInt(parts[1], 10) - 1,
                    parseInt(parts[2], 10) - 1,
                    parseInt(parts[3], 10) - 1
                );
            }
        }

        // Reportar progreso cada 5%
        const percent = Math.floor((i / total) * 100);
        if (percent >= lastReportedPercent + 5) {
            lastReportedPercent = percent;
            self.postMessage({ type: 'PROGRESS', payload: { percent } });
        }
    }

    return { rawVertices, rawIndicesTriangulos, rawMinZ: minZ, rawMaxZ: maxZ };
}

// ─── Listener de mensajes ────────────────────────────────────────────────────

self.onmessage = function (event) {
    const { type, payload } = event.data;

    if (type === 'PARSE') {
        try {
            const result = parseObj(payload.objData, payload.projectZone);
            self.postMessage({ type: 'DONE', payload: result });
        } catch (err) {
            self.postMessage({ type: 'ERROR', payload: { message: err.message } });
        }
    }
};
