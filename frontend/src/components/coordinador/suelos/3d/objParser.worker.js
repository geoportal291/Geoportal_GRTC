/* eslint-disable no-restricted-globals, no-undef */
/**
 * objParser.worker.js
 * Web Worker para parsear archivos OBJ en un hilo separado.
 * Elimina el freeze de 700ms+ en el hilo principal del visor 3D.
 *
 * NOTA: Este archivo usa `self` y globals de Web Worker.
 * El comentario eslint-disable al inicio es intencional y necesario.
 *
 * Mensajes recibidos:
 *   { type: 'PARSE', payload: { objData: string, projectZone: string } }
 *
 * Mensajes emitidos:
 *   { type: 'PROGRESS', payload: { percent: number } }
 *   { type: 'DONE',     payload: { rawVertices, rawIndicesTriangulos, rawMinZ, rawMaxZ } }
 *   { type: 'ERROR',    payload: { message: string } }
 */

// ─── Conversión UTM → WGS84 (matemática directa, sin dependencias externas) ──
// No usamos importScripts porque este worker se carga como módulo ES.
// La aproximación tiene error < 1mm en la zona central de cada huso UTM.

function utmToWgs84Worker(easting, northing, zoneStr) {
    const zoneNumber = parseInt(zoneStr, 10) || 18;
    // Hemisferio Sur: restar 10,000,000 m al northing
    const N = northing - 10_000_000;
    const E = easting - 500_000;

    const k0     = 0.9996;
    const a      = 6_378_137.0;
    const eccSq  = 0.00669438;
    const e1Sq   = eccSq / (1 - eccSq);

    const M      = N / k0;
    const mu     = M / (a * (1 - eccSq / 4 - 3 * eccSq ** 2 / 64 - 5 * eccSq ** 3 / 256));

    const phi1 = mu
        + (3 * eccSq / 2 - 27 * eccSq ** 3 / 32) * Math.sin(2 * mu)
        + (21 * eccSq ** 2 / 16 - 55 * eccSq ** 4 / 32) * Math.sin(4 * mu)
        + (151 * eccSq ** 3 / 96) * Math.sin(6 * mu);

    const N1  = a / Math.sqrt(1 - eccSq * Math.sin(phi1) ** 2);
    const T1  = Math.tan(phi1) ** 2;
    const C1  = e1Sq * Math.cos(phi1) ** 2;
    const R1  = a * (1 - eccSq) / (1 - eccSq * Math.sin(phi1) ** 2) ** 1.5;
    const D   = E / (N1 * k0);

    const lat = phi1
        - (N1 * Math.tan(phi1) / R1) * (
            D ** 2 / 2
            - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * e1Sq) * D ** 4 / 24
            + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * e1Sq - 3 * C1 ** 2) * D ** 6 / 720
        );

    const lon0  = (zoneNumber - 1) * 6 - 180 + 3;
    const lonRad = (
        D
        - (1 + 2 * T1 + C1) * D ** 3 / 6
        + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * e1Sq + 24 * T1 ** 2) * D ** 5 / 120
    ) / Math.cos(phi1);

    return {
        lat: lat * 180 / Math.PI,
        lon: lon0 + lonRad * 180 / Math.PI,
    };
}

function processCoordinatesWorker(x, y) {
    // Corrección de inversión X/Y común en archivos topográficos peruanos
    return x > y ? { x: y, y: x } : { x, y };
}

// ─── Parser Principal ─────────────────────────────────────────────────────────

function parseObj(objData, projectZone) {
    const rawVertices          = [];
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
            const vx    = parseFloat(parts[2]);
            const vy    = parseFloat(parts[1]);
            const vz    = parseFloat(parts[3]);

            const { x, y } = processCoordinatesWorker(vx, vy);
            const { lon, lat } = utmToWgs84Worker(x, y, projectZone);

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
