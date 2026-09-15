/**
 * useModelLoader.js
 * Hook responsable de:
 *   1. Descargar el archivo OBJ del servidor
 *   2. Parsearlo en un Web Worker (sin bloquear el hilo principal)
 *   3. Exponer progreso de carga en tiempo real
 *   4. Devolver los datos de malla listos para renderizar
 */
import { useCallback, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'https://backendgeoportal.fly.dev';

/**
 * Crea y gestiona un Web Worker de parseo OBJ.
 * Devuelve una Promise que resuelve con { rawVertices, rawIndicesTriangulos, rawMinZ, rawMaxZ }
 * y llama a onProgress(percent) durante el parseo.
 */
function parseObjWithWorker(objData, projectZone, onProgress) {
    return new Promise((resolve, reject) => {
        let worker;
        try {
            worker = new Worker(
                new URL('./objParser.worker.js', import.meta.url),
                { type: 'module' }
            );
        } catch (e) {
            // Fallback: si el Worker no carga (build antiguo), rechazamos para
            // que el llamador use el parseo síncrono de respaldo.
            reject(new Error('Worker no disponible: ' + e.message));
            return;
        }

        worker.onmessage = (event) => {
            const { type, payload } = event.data;
            if (type === 'PROGRESS' && onProgress) {
                onProgress(payload.percent);
            } else if (type === 'DONE') {
                worker.terminate();
                resolve(payload);
            } else if (type === 'ERROR') {
                worker.terminate();
                reject(new Error(payload.message));
            }
        };

        worker.onerror = (err) => {
            worker.terminate();
            reject(err);
        };

        worker.postMessage({ type: 'PARSE', payload: { objData, projectZone } });
    });
}

/**
 * Parseo síncrono de respaldo (mismo algoritmo, sin Worker).
 * Se activa si el Worker no está disponible.
 * Nota: Este sí puede causar freeze en archivos grandes.
 */
function parseObjSync(objData, projectZone, processCoordinates, utmToWgs84) {
    const rawVertices = [];
    const rawIndicesTriangulos = [];
    let minZ = Infinity;
    let maxZ = -Infinity;
    let lastWgs = null;

    const lines = objData.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('v ')) {
            const parts = line.trim().split(/\s+/);
            const vx = parseFloat(parts[2]);
            const vy = parseFloat(parts[1]);
            const vz = parseFloat(parts[3]);
            const coords = processCoordinates(vx, vy, projectZone);
            // utmToWgs84 puede devolver null (coordenada inválida): se reutiliza la última
            // conversión válida para NO romper el orden/indexado de vértices del OBJ.
            const wgs = utmToWgs84(coords.x, coords.y, projectZone) || lastWgs;
            if (wgs) lastWgs = wgs;
            const lon = wgs ? wgs.lon : 0;
            const lat = wgs ? wgs.lat : 0;
            rawVertices.push({ x: coords.x, y: coords.y, z: vz, lon, lat });
            if (vz < minZ) minZ = vz;
            if (vz > maxZ) maxZ = vz;
        } else if (line.startsWith('f ')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
                rawIndicesTriangulos.push(
                    parseInt(parts[1]) - 1,
                    parseInt(parts[2]) - 1,
                    parseInt(parts[3]) - 1
                );
            }
        }
    }
    return { rawVertices, rawIndicesTriangulos, rawMinZ: minZ, rawMaxZ: maxZ };
}

export default function useModelLoader({ userToken, processCoordinates, utmToWgs84 }) {
    const abortRef = useRef(null);

    /**
     * Descarga el OBJ del servidor y lo parsea (Worker primero, sync como fallback).
     *
     * @param {object} modelo - Objeto de modelo de la DB
     * @param {string} projectZone - '17S' | '18S' | '19S'
     * @param {function} onProgress - callback(percent: 0-100)
     * @returns {Promise<{rawVertices, rawIndicesTriangulos, rawMinZ, rawMaxZ}>}
     */
    const loadModel = useCallback(async (modelo, projectZone, onProgress) => {
        // Cancelar carga anterior si existe
        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        // ── 1. Obtener el texto OBJ ─────────────────────────────────────────────
        let objData = null;

        if (modelo.url_archivo === 'PENDIENTE' || !modelo.url_archivo) {
            throw new Error('Este modelo aún no ha sido procesado por el servidor.');
        }

        if (modelo.url_archivo === 'DB_EMBEDDED_OBJ') {
            objData = modelo.metadata?.obj_content;
            if (!objData) throw new Error('No se encontró el contenido OBJ en los metadatos de la DB.');
        } else {
            const proxyUrl = `${API_BASE}/api/modelos-3d/${modelo.id}/obj`;
            // Reintentos con backoff: cubren dos escenarios de Fly.io:
            //   1) 502/530/5xx transitorios (reinicio o saturación de la máquina).
            //   2) Arranque en frío (~10-15 s): el proxy responde sin cabeceras CORS y el
            //      fetch lanza TypeError "Failed to fetch" — también se reintenta.
            // Presupuesto total ~25 s (4 reintentos: 2s, 4s, 8s, 8s). Los 4xx no se reintentan.
            const RETRY_DELAYS_MS = [2000, 4000, 8000, 8000];
            let resp = null;
            let ultimoError = null;
            for (let intento = 0; intento <= RETRY_DELAYS_MS.length; intento++) {
                try {
                    resp = await fetch(proxyUrl, {
                        headers: { Authorization: `Bearer ${userToken}` },
                        signal: controller.signal,
                    });
                    if (resp.ok || resp.status < 500) break;
                    ultimoError = new Error(`HTTP error! status: ${resp.status}`);
                } catch (e) {
                    if (e.name === 'AbortError') throw e;
                    ultimoError = e;
                    resp = null;
                }
                if (intento < RETRY_DELAYS_MS.length) {
                    await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[intento]));
                }
            }
            if (!resp || !resp.ok) {
                if (!resp && ultimoError) throw ultimoError;
                throw new Error(`HTTP error! status: ${resp ? resp.status : 'sin respuesta'}`);
            }
            objData = await resp.text();
        }

        if (!objData || objData.trim().startsWith('<!DOCTYPE html') || objData.trim().startsWith('<html')) {
            throw new Error('El servidor devolvió HTML en lugar del modelo 3D.');
        }

        if (objData === 'PENDIENTE') {
            throw new Error('El modelo aún está siendo procesado por el servidor.');
        }

        if (onProgress) onProgress(10); // Descarga completa

        // ── 2. Parsear con Worker (sin freeze) ──────────────────────────────────
        try {
            const workerOnProgress = (p) => {
                // Mapear el progreso del worker (0-100) al rango 10-100 de la UI
                if (onProgress) onProgress(10 + Math.floor(p * 0.9));
            };
            const result = await parseObjWithWorker(objData, projectZone, workerOnProgress);
            if (onProgress) onProgress(100);
            return result;
        } catch (workerErr) {
            console.warn('[useModelLoader] Worker falló, usando parseo síncrono:', workerErr.message);
            // Fallback síncrono
            const result = parseObjSync(objData, projectZone, processCoordinates, utmToWgs84);
            if (onProgress) onProgress(100);
            return result;
        }
    }, [userToken, processCoordinates, utmToWgs84]);

    const cancelLoad = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, []);

    return { loadModel, cancelLoad };
}
