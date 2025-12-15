const db = require('../conexion');
const XLSX = require('xlsx');
const axios = require('axios');
const { toLatLon } = require('utm');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');

// --- Helper Functions ---

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

const ZonesCriticasService = {

    processExcelAndSaveZonasCriticas: async (fileBuffer, projectId, utmZone) => {
        const client = await db.connect();

        try {
            await client.query('BEGIN');
            console.log(`[ZonasCriticas] Processing Excel for project ${projectId}, UTM Zone ${utmZone}`);

            // 1. Delete
            await client.query('DELETE FROM zonas_criticas WHERE id_proyecto = $1', [projectId]);

            // 2. KML & Calibration
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
                    console.error('[ZonasCriticas] Error parsing KML:', e);
                }
            }

            const calibrationRes = await client.query('SELECT * FROM proyecto_calibracion_tramos WHERE id_proyecto = $1', [projectId]);
            const calibrations = calibrationRes.rows.reduce((acc, cal) => {
                acc[cal.nombre_tramo.toUpperCase().trim()] = cal;
                return acc;
            }, {});

            // 4. Load Excel
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('ZONA'));
            if (!sheetName) throw new Error('No se encontró la hoja "ZONAS CRITICAS".');
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            const extractedData = [];

            // Helper to process row
            const processRow = (row, originZone) => {
                let progresiva = null;
                let data = {};

                // --- ZONA 1 (Izquierda) ---
                if (originZone === 1) {
                    // Indices: 0=Entregable, 1=Foto, 2=Prog, 3=Tipo, 4=Longitud, 5=Lado
                    const progCell = row[2];
                    if (typeof progCell === 'number' || (typeof progCell === 'string' && progCell.match(/^\d/))) {
                        progresiva = progCell;
                        data = {
                            origin: 1,
                            entregable: row[0],
                            panel_fotografico_codigo: row[1],
                            progresiva: progCell,
                            tipo: row[3], // "Deslizamiento de talud"
                            longitud_zona: row[4],
                            lado: row[5],
                            clase_dano: '',
                            condicion: '',
                            observaciones: ''
                        };
                    }
                }
                // --- ZONA 2 (Derecha) ---
                else if (originZone === 2) {
                    // Indices (shifted based on logs/user info):
                    // Based on previous attempt, we looked at Col L (Index 11).
                    // Let's assume the standard offset. 
                    // Previous logs showed Col L (Index 11) was empty in the first few rows, 
                    // but maybe data starts later or the columns are slightly different.
                    // User said: "agregar un numero de seguimioento osea si es 1 o 2".
                    // Let's look for Progresiva in Col L (11) again.
                    const progCell = row[11];
                    if (typeof progCell === 'number' || (typeof progCell === 'string' && progCell.match(/^\d/))) {
                        progresiva = progCell;
                        // Map standard Zone 2 columns
                        // L=Prog(11), M=Tipo?(12), N=Clase(13), O=Cond(14), P=Obs(15)
                        data = {
                            origin: 2,
                            entregable: '', // Zone 2 usually shares? Or empty.
                            panel_fotografico_codigo: '', // Usually empty for Zone 2
                            progresiva: progCell,
                            tipo: row[12] || 'Punto Crítico (Z2)', // If empty, generic
                            longitud_zona: '',
                            lado: '',
                            clase_dano: row[13],
                            condicion: row[14],
                            observaciones: row[15]
                        };
                    }
                }
                return { progresiva, data };
            };

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];

                // Scan Zone 1
                const r1 = processRow(row, 1);
                if (r1.progresiva) extractedData.push(r1.data);

                // Scan Zone 2
                const r2 = processRow(row, 2);
                if (r2.progresiva) extractedData.push(r2.data);
            }


            // Calculate Coords & Insert
            for (const item of extractedData) {
                // Calc logic
                const progresivaM = progresivaToMeters(item.progresiva);
                let latitud = null;
                let longitud = null;

                if (!isNaN(progresivaM) && Object.keys(routesMap).length > 0) {
                    // Calibration logic matching badenes
                    let tramoName = null;
                    let calibration = null;
                    for (const calibKey in calibrations) {
                        const cal = calibrations[calibKey];
                        const calInicioM = progresivaToMeters(cal.progresiva_inicio);
                        const calFinM = progresivaToMeters(cal.progresiva_fin);
                        if (!isNaN(calInicioM) && !isNaN(calFinM) && progresivaM >= calInicioM && progresivaM <= calFinM) {
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
                            const distOnKml = ((progresivaM - calInicioM) / calLengthM) * kmlRouteLength;
                            if (distOnKml >= 0) {
                                const coords = calculateCoordinates(distOnKml, routePositions);
                                if (coords) { latitud = coords.latitude; longitud = coords.longitude; }
                            }
                        }
                    }
                }

                await client.query(
                    `INSERT INTO zonas_criticas (
                id_proyecto, codigo, progresiva, 
                latitud, longitud, altitud, 
                lado, longitud_zona, observaciones, 
                tipo, clase_dano, condicion, 
                panel_fotografico_codigo, entregable, numero_seguimiento
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                    [
                        projectId,
                        'ZC',
                        item.progresiva,
                        latitud,
                        longitud,
                        null,
                        item.lado,
                        item.longitud_zona,
                        item.observaciones,
                        item.tipo,
                        item.clase_dano,
                        item.condicion,
                        item.panel_fotografico_codigo,
                        item.entregable,
                        item.origin // numero_seguimiento (1 or 2)
                    ]
                );
            }

            await client.query('COMMIT');
            return { success: true, count: extractedData.length };

        } catch (e) {
            await client.query('ROLLBACK');
            console.error('[ZonasCriticas] Error:', e);
            throw e;
        } finally {
            client.release();
        }
    },

    getAllZonasCriticas: async (projectId) => {
        const result = await db.query('SELECT * FROM zonas_criticas WHERE id_proyecto = $1 ORDER BY id_zona_critica ASC', [projectId]);
        return result.rows;
    },

    updateZonaCritica: async (id, data) => {
        const {
            codigo, progresiva, latitud, longitud, altitud, lado, longitud_zona,
            observaciones, tipo, clase_dano, condicion, panel_fotografico_codigo, entregable, numero_seguimiento
        } = data;

        const result = await db.query(
            `UPDATE zonas_criticas SET
            codigo = COALESCE($1, codigo),
            progresiva = COALESCE($2, progresiva),
            latitud = COALESCE($3, latitud),
            longitud = COALESCE($4, longitud),
            altitud = COALESCE($5, altitud),
            lado = COALESCE($6, lado),
            longitud_zona = COALESCE($7, longitud_zona),
            observaciones = COALESCE($8, observaciones),
            tipo = COALESCE($9, tipo),
            clase_dano = COALESCE($10, clase_dano),
            condicion = COALESCE($11, condicion),
            panel_fotografico_codigo = COALESCE($12, panel_fotografico_codigo),
            entregable = COALESCE($13, entregable),
            numero_seguimiento = COALESCE($14, numero_seguimiento)
           WHERE id_zona_critica = $15 RETURNING *`,
            [codigo, progresiva, latitud, longitud, altitud, lado, longitud_zona, observaciones, tipo, clase_dano, condicion, panel_fotografico_codigo, entregable, numero_seguimiento, id]
        );
        return result.rows[0];
    },

    deleteZonaCritica: async (id) => {
        await db.query('DELETE FROM zonas_criticas WHERE id_zona_critica = $1', [id]);
        return { message: 'Eliminado correctamente' };
    },

    deleteExcelAndZonasCriticas: async (projectId) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM zonas_criticas WHERE id_proyecto = $1', [projectId]);
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};

module.exports = ZonesCriticasService;
