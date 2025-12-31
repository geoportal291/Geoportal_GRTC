const db = require('../conexion');
const XLSX = require('xlsx');
const axios = require('axios');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');

// --- Helper Functions (Shared logic) ---

const progresivaToMeters = (progresiva) => {
    if (progresiva === undefined || progresiva === null) return NaN;
    const cleanProgresiva = String(progresiva).replace(/km/i, '').trim();
    const parts = cleanProgresiva.split('+');
    if (parts.length === 2) {
        const km = parseFloat(parts[0]);
        const meters = parseFloat(parts[1]);
        if (!isNaN(km) && !isNaN(meters)) {
            return km * 1000 + meters;
        }
    } else if (parts.length === 1) {
        const val = parseFloat(parts[0]);
        if (!isNaN(val)) return val;
    }
    return NaN;
};

const calculateCoordinates = (targetMeters, routePositions) => {
    if (!routePositions || routePositions.length < 2) return null;

    let accumulatedDistance = 0;
    for (let i = 0; i < routePositions.length - 1; i++) {
        const p1 = routePositions[i];
        const p2 = routePositions[i + 1];

        const R = 6371e3;
        const φ1 = p1[0] * Math.PI / 180;
        const φ2 = p2[0] * Math.PI / 180;
        const Δφ = (p2[0] - p1[0]) * Math.PI / 180;
        const Δλ = (p2[1] - p1[1]) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const segmentLength = R * c;

        if (accumulatedDistance + segmentLength >= targetMeters) {
            const distanceIntoSegment = targetMeters - accumulatedDistance;
            const ratio = segmentLength === 0 ? 0 : distanceIntoSegment / segmentLength;
            const lat = p1[0] + (p2[0] - p1[0]) * ratio;
            const lon = p1[1] + (p2[1] - p1[1]) * ratio;
            return { latitude: lat, longitude: lon };
        }
        accumulatedDistance += segmentLength;
    }
    const lastPoint = routePositions[routePositions.length - 1];
    return { latitude: lastPoint[0], longitude: lastPoint[1] };
};

const calculateDistance = (p1, p2) => {
    const R = 6371e3;
    const φ1 = p1[0] * Math.PI / 180;
    const φ2 = p2[0] * Math.PI / 180;
    const Δφ = (p2[0] - p1[0]) * Math.PI / 180;
    const Δλ = (p2[1] - p1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const calculateRouteLength = (routePositions) => {
    let totalDistance = 0;
    if (!routePositions || routePositions.length < 2) return 0;
    for (let i = 0; i < routePositions.length - 1; i++) {
        totalDistance += calculateDistance(routePositions[i], routePositions[i + 1]);
    }
    return totalDistance;
};

const EstructurasExistentesService = {

    processExcelAndSave: async (fileBuffer, projectId, utmZone) => {
        const client = await db.connect();

        try {
            await client.query('BEGIN');
            console.log(`[EstructurasExistentes] Processing Excel for project ${projectId}`);

            // 1. Delete old data
            await client.query('DELETE FROM estructuras_existentes WHERE id_proyecto = $1', [projectId]);

            // 2. Load KML & Calibration
            const kmlUrlRes = await client.query('SELECT kml_url FROM invvial WHERE id_proyecto = $1', [projectId]);
            const kmlUrl = kmlUrlRes.rows.length > 0 ? kmlUrlRes.rows[0].kml_url : null;

            const routesMap = {};
            if (kmlUrl) {
                try {
                    const response = await axios.get(kmlUrl);
                    const kmlText = response.data;
                    const parser = new DOMParser();
                    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
                    const geoJson = kml(kmlDoc);

                    geoJson.features.forEach(feature => {
                        if (feature.geometry && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') && feature.properties && feature.properties.name) {
                            const tramoName = feature.properties.name.toUpperCase().trim();
                            const positions = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                            routesMap[tramoName] = positions;
                            const tramoNumberMatch = tramoName.match(/\d+/);
                            if (tramoNumberMatch) {
                                routesMap[tramoNumberMatch[0]] = positions;
                            }
                        }
                    });
                } catch (e) {
                    console.error('[EstructurasExistentes] Error parsing KML:', e);
                }
            }

            const calibrationRes = await client.query('SELECT * FROM proyecto_calibracion_tramos WHERE id_proyecto = $1', [projectId]);
            const calibrations = calibrationRes.rows.reduce((acc, cal) => {
                acc[cal.nombre_tramo.toUpperCase().trim()] = cal;
                return acc;
            }, {});

            // 3. Parse Excel
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('ESTRUCTURA'));
            if (!sheetName) throw new Error('No se encontró la hoja "ESTRUCTURA" (o similar).');

            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            const extractedData = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const progInicio = row[2];
                const isProg = (val) => {
                    if (typeof val === 'number') return true;
                    if (typeof val === 'string' && (val.match(/^\d+\+\d+$/) || val.match(/^\d+$/))) return true;
                    return false;
                };

                if (isProg(progInicio)) {
                    extractedData.push({
                        entregable: row[0],
                        panel_fotografico: row[1],
                        progresiva_inicio: row[2],
                        progresiva_final: row[3],
                        ancho_calzada: row[4],
                        observaciones: row[5]
                    });
                }
            }

            const getCoords = (meters) => {
                if (isNaN(meters) || Object.keys(routesMap).length === 0) return null;
                let tramoName = null;
                let calibration = null;

                for (const calibKey in calibrations) {
                    const cal = calibrations[calibKey];
                    const calInicioM = progresivaToMeters(cal.progresiva_inicio);
                    const calFinM = progresivaToMeters(cal.progresiva_fin);
                    if (!isNaN(calInicioM) && !isNaN(calFinM) && meters >= calInicioM && meters <= calFinM) {
                        tramoName = cal.nombre_tramo.toUpperCase().trim();
                        calibration = cal;
                        break;
                    }
                }

                if (tramoName && calibration) {
                    const tramoNumberMatch = tramoName.match(/\d+/);
                    const tramoIdKey = tramoNumberMatch ? tramoNumberMatch[0] : null;
                    let routePositions = routesMap[tramoIdKey] || routesMap[tramoName];
                    if (routePositions) {
                        const calInicioM = progresivaToMeters(calibration.progresiva_inicio);
                        const calFinM = progresivaToMeters(calibration.progresiva_fin);
                        const kmlRouteLength = calculateRouteLength(routePositions);
                        const calLengthM = calFinM - calInicioM;
                        if (calLengthM > 0) {
                            const distOnKml = ((meters - calInicioM) / calLengthM) * kmlRouteLength;
                            if (distOnKml >= 0) {
                                return calculateCoordinates(distOnKml, routePositions);
                            }
                        }
                    }
                }
                return null;
            };

            for (const item of extractedData) {
                const startM = progresivaToMeters(item.progresiva_inicio);
                const endM = progresivaToMeters(item.progresiva_final);
                const coordsStart = getCoords(startM);
                const coordsEnd = getCoords(endM);

                await client.query(
                    `INSERT INTO estructuras_existentes (
                        id_proyecto, progresiva_inicio, progresiva_final,
                        latitud_inicio, longitud_inicio, latitud_final, longitud_final,
                        ancho_calzada, observaciones, panel_fotografico, entregable
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        projectId,
                        item.progresiva_inicio,
                        item.progresiva_final,
                        coordsStart ? coordsStart.latitude : null,
                        coordsStart ? coordsStart.longitude : null,
                        coordsEnd ? coordsEnd.latitude : null,
                        coordsEnd ? coordsEnd.longitude : null,
                        item.ancho_calzada,
                        item.observaciones,
                        item.panel_fotografico,
                        item.entregable
                    ]
                );
            }

            await client.query('COMMIT');
            return { success: true, count: extractedData.length };

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    create: async (data) => {
        const {
            id_proyecto, progresiva_inicio, progresiva_final,
            latitud_inicio, longitud_inicio, latitud_final, longitud_final,
            ancho_calzada, observaciones, panel_fotografico, entregable
        } = data;

        const result = await db.query(
            `INSERT INTO estructuras_existentes (
                id_proyecto, progresiva_inicio, progresiva_final,
                latitud_inicio, longitud_inicio, latitud_final, longitud_final,
                ancho_calzada, observaciones, panel_fotografico, entregable
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [id_proyecto, progresiva_inicio, progresiva_final,
                latitud_inicio, longitud_inicio, latitud_final, longitud_final,
                ancho_calzada, observaciones, panel_fotografico, entregable]
        );
        return result.rows[0];
    },

    update: async (id, data) => {
        const {
            progresiva_inicio, progresiva_final,
            latitud_inicio, longitud_inicio, latitud_final, longitud_final,
            ancho_calzada, observaciones, panel_fotografico, entregable
        } = data;

        const result = await db.query(
            `UPDATE estructuras_existentes SET
                progresiva_inicio = $1, progresiva_final = $2,
                latitud_inicio = $3, longitud_inicio = $4, latitud_final = $5, longitud_final = $6,
                ancho_calzada = $7, observaciones = $8, panel_fotografico = $9, entregable = $10
            WHERE id_estructura = $11 RETURNING *`,
            [progresiva_inicio, progresiva_final,
                latitud_inicio, longitud_inicio, latitud_final, longitud_final,
                ancho_calzada, observaciones, panel_fotografico, entregable, id]
        );
        return result.rows[0];
    },

    getAll: async (projectId) => {
        const result = await db.query('SELECT * FROM estructuras_existentes WHERE id_proyecto = $1 ORDER BY id_estructura ASC', [projectId]);
        return result.rows;
    },

    deleteProjectData: async (projectId) => {
        await db.query('DELETE FROM estructuras_existentes WHERE id_proyecto = $1', [projectId]);
        return { message: 'Datos eliminados correctamente' };
    },

    deleteEstructuraExistente: async (id) => {
        try {
            await db.query('DELETE FROM estructuras_existentes WHERE id_estructura = $1', [id]);
            return { message: 'Eliminado correctamente' };
        } catch (error) {
            console.error(`Error al eliminar estructura existente ${id}:`, error);
            throw new Error('Error al eliminar estructura existente de la base de datos.');
        }
    }
};

module.exports = EstructurasExistentesService;
