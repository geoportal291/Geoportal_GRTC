const pool = require('../conexion');
const XLSX = require('xlsx');
const axios = require('axios');
const { toLatLon } = require('utm');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');

// --- Helper Functions (Reused) ---
const progresivaToMeters = (progresiva) => {
    if (!progresiva) return NaN;
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

// --- Main Logic ---

const getAllHitos = async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM hitos_kilometricos WHERE id_proyecto = $1 ORDER BY id_hito_kilometrico DESC',
            [projectId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener hitos kilométricos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const createHito = async (req, res) => {
    const {
        codigo, progresiva, lado, tipo, clasificacion, material,
        latitud, longitud, altitud, observaciones,
        panel_fotografico_codigo, project_id
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO hitos_kilometricos 
            (codigo, progresiva, lado, tipo, clasificacion, material, 
            latitud, longitud, altitud, observaciones, 
            panel_fotografico_codigo, id_proyecto) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING *`,
            [codigo, progresiva, lado, tipo, clasificacion, material,
                latitud, longitud, altitud, observaciones,
                panel_fotografico_codigo, project_id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear hito kilométrico:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const processExcel = async (fileBuffer, projectId, entregableNum, utmZone) => {
    console.log(`DEBUG: Iniciando processExcel Hitos Kilométricos para proyecto ${projectId}, Zona: ${utmZone || 'Defecto 18L'}`);

    let zoneNum = 18;
    let zoneLetter = 'L';
    if (utmZone) {
        const match = String(utmZone).match(/(\d+)([a-zA-Z]+)/);
        if (match) {
            zoneNum = parseInt(match[1], 10);
            zoneLetter = match[2];
        }
    }

    const kmlUrlRes = await pool.query('SELECT kml_url FROM invvial WHERE id_proyecto = $1', [projectId]);
    if (kmlUrlRes.rows.length === 0 || !kmlUrlRes.rows[0].kml_url) {
        throw new Error(`No se encontró una URL de KML para el proyecto ${projectId}.`);
    }
    const kmlUrl = kmlUrlRes.rows[0].kml_url;

    const response = await axios.get(kmlUrl);
    const kmlText = response.data;
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    const geoJson = kml(kmlDoc);

    const routesMap = {};
    geoJson.features.forEach(feature => {
        if (feature.geometry && (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') && feature.properties && feature.properties.name) {
            const tramoName = feature.properties.name.toUpperCase().trim();
            const positions = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]
            routesMap[tramoName] = positions;

            const tramoNumberMatch = tramoName.match(/\d+/);
            if (tramoNumberMatch) {
                routesMap[tramoNumberMatch[0]] = positions;
            }
        }
    });

    const calibrationRes = await pool.query(
        'SELECT * FROM proyecto_calibracion_tramos WHERE id_proyecto = $1',
        [projectId]
    );
    const calibrations = calibrationRes.rows.reduce((acc, cal) => {
        acc[cal.nombre_tramo.toUpperCase().trim()] = cal;
        return acc;
    }, {});

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = 'SEÑALIZACION 2.0';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new Error(`La hoja "${sheetName}" no se encontró en el archivo Excel.`);
    }

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    let headerRowIndex = -1;
    const colMap = {
        codigo: -1,
        tipo: -1,
        progresiva: -1,
        lado: -1,
        material: -1,
        latitud: -1,
        longitud: -1,
        altitud: -1,
        foto: -1
    };

    for (let i = 0; i < Math.min(20, rawData.length); i++) {
        const row = rawData[i];
        if (!row) continue;

        const progIdx = row.findIndex(c => typeof c === 'string' && (c.includes('Ubicación (km)') || c.includes('Ubicacion (km)')));

        if (progIdx !== -1) {
            headerRowIndex = i;
            colMap.progresiva = progIdx;
            colMap.codigo = row.findIndex(c => typeof c === 'string' && (c.includes('Señal') || c.includes('CODIGO'))) !== -1 ? row.findIndex(c => typeof c === 'string' && (c.includes('Señal') || c.includes('CODIGO'))) : progIdx - 3;
            colMap.tipo = row.findIndex(c => typeof c === 'string' && c.includes('Tipo')) !== -1 ? row.findIndex(c => typeof c === 'string' && c.includes('Tipo')) : progIdx - 2;
            colMap.lado = row.findIndex(c => typeof c === 'string' && c.includes('Lado')) !== -1 ? row.findIndex(c => typeof c === 'string' && c.includes('Lado')) : progIdx + 1;
            colMap.material = row.findIndex(c => typeof c === 'string' && c.includes('Material')) !== -1 ? row.findIndex(c => typeof c === 'string' && c.includes('Material')) : progIdx + 3;
            colMap.latitud = row.findIndex(c => typeof c === 'string' && (c.includes('Latitud') || c.includes('LATITUD'))) !== -1 ? row.findIndex(c => typeof c === 'string' && (c.includes('Latitud') || c.includes('LATITUD'))) : progIdx + 4;
            colMap.longitud = row.findIndex(c => typeof c === 'string' && (c.includes('Longitud') || c.includes('LONGITUD'))) !== -1 ? row.findIndex(c => typeof c === 'string' && (c.includes('Longitud') || c.includes('LONGITUD'))) : progIdx + 5;
            colMap.altitud = row.findIndex(c => typeof c === 'string' && (c.includes('Altitud') || c.includes('ALTITUD'))) !== -1 ? row.findIndex(c => typeof c === 'string' && (c.includes('Altitud') || c.includes('ALTITUD'))) : progIdx + 6;
            colMap.foto = row.findIndex(c => typeof c === 'string' && (c.includes('Código Fotografía') || c.includes('Foto'))) !== -1 ? row.findIndex(c => typeof c === 'string' && (c.includes('Código Fotografía') || c.includes('Foto'))) : progIdx + 7;
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.warn('DEBUG: "Ubicación (km)" header not found. Using numeric fallbacks assuming no column A.');
        headerRowIndex = 1;
        colMap.codigo = 0;
        colMap.tipo = 1;
        colMap.progresiva = 3;
        colMap.lado = 4;
        colMap.material = 6;
        colMap.latitud = 7;
        colMap.longitud = 8;
        colMap.altitud = 9;
        colMap.foto = 10;
    }

    console.log('DEBUG: Hitos Column Map:', JSON.stringify(colMap));
    const startRowIndex = headerRowIndex + 2;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let insertedCount = 0;
        let notLocatedCount = 0;

        // Limpiar datos previos del proyecto para asegurar que es un reemplazo limpio (opcional pero recomendado para excel upload)
        // await client.query('DELETE FROM hitos_kilometricos WHERE id_proyecto = $1', [projectId]);

        for (let i = startRowIndex; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const codigo = row[colMap.codigo];
            if (!codigo) continue;

            const clasificacion = colMap.progresiva > 0 ? row[colMap.progresiva - 1] : '-';

            // *** CRITICAL FILTER: ONLY HITOS KILOMETRICOS ***
            if (!clasificacion || typeof clasificacion !== 'string' || !clasificacion.toLowerCase().includes('hito kilométrico') && !clasificacion.toLowerCase().includes('hito kilometrico')) {
                continue;
            }

            const tipo = row[colMap.tipo];
            const progresivaStr = row[colMap.progresiva];
            const lado = row[colMap.lado];
            const material = row[colMap.material];

            let coord1 = row[colMap.latitud];
            let coord2 = row[colMap.longitud];
            let altitudVal = row[colMap.altitud];
            const panel_fotografico_codigo = row[colMap.foto];

            if (typeof altitudVal === 'string') {
                altitudVal = parseFloat(altitudVal.replace(/,/g, ''));
            }
            if (isNaN(altitudVal)) altitudVal = null;

            if (typeof coord1 === 'string') coord1 = parseFloat(coord1.replace(/,/g, ''));
            if (typeof coord2 === 'string') coord2 = parseFloat(coord2.replace(/,/g, ''));

            let latitud = null;
            let longitud = null;

            if (!isNaN(coord1) && !isNaN(coord2)) {
                let easting, northing;
                if (coord1 > 1000000 && coord2 < 1000000) {
                    northing = coord1; easting = coord2;
                } else {
                    easting = coord1; northing = coord2;
                }

                if (easting > 100000 && northing > 1000000) {
                    try {
                        const { latitude, longitude: lon } = toLatLon(easting, northing, zoneNum, zoneLetter);
                        latitud = latitude;
                        longitud = lon;
                    } catch (e) {
                        // ignore conversion errors
                    }
                }
            }

            if ((!latitud || !longitud) && progresivaStr) {
                const progresivaMeters = progresivaToMeters(progresivaStr);

                if (!isNaN(progresivaMeters)) {
                    let tramoName = null;
                    let calibration = null;

                    for (const calibKey in calibrations) {
                        const cal = calibrations[calibKey];
                        const calInicioM = progresivaToMeters(cal.progresiva_inicio);
                        const calFinM = progresivaToMeters(cal.progresiva_fin);

                        if (!isNaN(calInicioM) && !isNaN(calFinM) && progresivaMeters >= calInicioM && progresivaMeters <= calFinM) {
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

                            if (calLengthM > 0 && kmlRouteLength > 0) {
                                const distOnKml = ((progresivaMeters - calInicioM) / calLengthM) * kmlRouteLength;
                                const coords = calculateCoordinates(distOnKml, routePositions);
                                if (coords) {
                                    latitud = coords.latitude;
                                    longitud = coords.longitude;
                                }
                            }
                        }
                    }
                }
            } if (!latitud || !longitud) notLocatedCount++;

            await client.query(
                `INSERT INTO hitos_kilometricos 
                (codigo, progresiva, lado, tipo, clasificacion, material, 
                latitud, longitud, altitud, observaciones, 
                panel_fotografico_codigo, id_proyecto) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [codigo, progresivaStr, lado, tipo, clasificacion, material,
                    latitud || null, longitud || null, altitudVal, null,
                    panel_fotografico_codigo, projectId]
            );
            insertedCount++;
        }

        console.log(`DEBUG: Inserted ${insertedCount} hitos. ${notLocatedCount} items had no coordinates.`);
        await client.query('COMMIT');
        return { message: 'Carga masiva de Hitos completada', insertedCount, notLocatedCount };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing Excel for Hitos:', error);
        throw error;
    } finally {
        client.release();
    }
};

const uploadExcel = async (req, res) => {
    const { projectId, entregableNum, utmZone } = req.body;
    try {
        const result = await processExcel(req.file.buffer, projectId || 1, entregableNum, utmZone);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteHito = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM hitos_kilometricos WHERE id_hito_kilometrico = $1', [id]);
        res.json({ message: 'Hito eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting hito:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const updateHito = async (req, res) => {
    const { id } = req.params;
    const {
        codigo, progresiva, lado, tipo, clasificacion, material,
        latitud, longitud, altitud, observaciones, panel_fotografico_codigo
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE hitos_kilometricos
             SET codigo = $1, progresiva = $2, lado = $3, tipo = $4, clasificacion = $5, 
                 material = $6, latitud = $7, longitud = $8, altitud = $9, observaciones = $10, 
                 panel_fotografico_codigo = $11
             WHERE id_hito_kilometrico = $12 RETURNING *`,
            [codigo, progresiva, lado, tipo, clasificacion, material,
                latitud, longitud, altitud, observaciones, panel_fotografico_codigo, id]
        );
        res.json(result.rows[0]);
    } catch (e) {
        console.error('Error updating hito:', e);
        res.status(500).json({ message: 'Error update' });
    }
};

module.exports = {
    getAllHitos,
    createHito,
    uploadExcel,
    deleteHito,
    updateHito
};
