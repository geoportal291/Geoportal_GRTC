const db = require('../conexion');
const xlsx = require('xlsx');
const axios = require('axios');
const { toLatLon } = require('utm');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');

// Helper function to convert progresiva string (e.g., "0+100") to meters
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

// Helper function to calculate coordinates from meters along the route
const calculateCoordinates = (targetMeters, routePositions) => {
    if (!routePositions || routePositions.length < 2) return null;

    let accumulatedDistance = 0;
    for (let i = 0; i < routePositions.length - 1; i++) {
        const p1 = routePositions[i]; // [lat, lon]
        const p2 = routePositions[i + 1]; // [lat, lon]

        // Calculate distance between p1 and p2 in meters (Haversine or simple approximation for short distances)
        const R = 6371e3; // metres
        const φ1 = p1[0] * Math.PI / 180; // φ, λ in radians
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

    // If target is beyond the route, return the last point
    const lastPoint = routePositions[routePositions.length - 1];
    return { latitude: lastPoint[0], longitude: lastPoint[1] };
};

const calculateDistance = (p1, p2) => {
    const R = 6371e3; // metres
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
    if (!routePositions || routePositions.length < 2) {
        return 0;
    }
    for (let i = 0; i < routePositions.length - 1; i++) {
        totalDistance += calculateDistance(routePositions[i], routePositions[i + 1]);
    }
    return totalDistance;
};

const murosService = {
    processExcelAndSaveMuros: async (fileBuffer, projectId, utmZone, entregableDefault) => {
        try {
            // 1. Get KML URL from the same source as the frontend
            const kmlUrlRes = await db.query('SELECT kml_url FROM invvial WHERE id_proyecto = $1', [projectId]);
            if (kmlUrlRes.rows.length === 0 || !kmlUrlRes.rows[0].kml_url) {
                throw new Error(`No se encontró una URL de KML para el proyecto ${projectId}. Por favor, suba un KML en el mapa.`);
            }
            const kmlUrl = kmlUrlRes.rows[0].kml_url;

            // 2. Download and process the KML file
            const response = await axios.get(kmlUrl);
            const kmlText = response.data;
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
            const geoJson = kml(kmlDoc);

            const routesMap = {};
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

            // 3. Get calibration data for the project
            const calibrationRes = await db.query(
                'SELECT * FROM proyecto_calibracion_tramos WHERE id_proyecto = $1',
                [projectId]
            );
            const calibrations = calibrationRes.rows.reduce((acc, cal) => {
                acc[cal.nombre_tramo.toUpperCase().trim()] = cal;
                return acc;
            }, {});

            // 4. Process Excel
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = 'OBR. ARTE';
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new Error(`La hoja '${sheetName}' no se encontró en el archivo Excel.`);
            }

            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            const murosData = [];
            let murosSinCoords = 0;

            // Find Header Row and Map Columns
            let headerRowIndex = 11; // Default
            const colMap = {
                entregable: 41, // AP
                panel: 42, // AQ
                progresiva: 43, // AR
                clase: 44, // AS 
                material: 45, // AT
                estado: 46, // AU
                lado: 47, // AV
                longitud: 48, // AW
                alto: 49, // AX
                ancho: 50 // AY
            };

            // Heuristic search for header row
            for (let i = 0; i < 20; i++) {
                const row = jsonData[i];
                if (!row) continue;
                if (row.some(c => typeof c === 'string' && c.toUpperCase().includes('MURO') && c.toUpperCase().includes('PROGRESIVA'))) {
                    headerRowIndex = i;
                    const entIdx = row.findIndex(c => typeof c === 'string' && c.toUpperCase().includes('ENTREGABLE'));
                    if (entIdx !== -1) colMap.entregable = entIdx;
                    break;
                }
            }


            // 5. Iterate through rows
            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                const claseCell = row[colMap.clase];

                if (typeof claseCell === 'string' && claseCell.toLowerCase().includes('muro')) {

                    const progresivaStr = row[colMap.progresiva];
                    if (!progresivaStr) {
                        console.warn(`Fila ${i + 1}: Se encontró un muro pero falta la progresiva. Saltando.`);
                        continue;
                    }

                    const progresivaExcelM = progresivaToMeters(progresivaStr);
                    if (isNaN(progresivaExcelM)) {
                        console.warn(`Fila ${i + 1}: Formato de progresiva no válido: '${progresivaStr}'. Saltando.`);
                        continue;
                    }

                    let tramoName = null;
                    let calibration = null;

                    for (const calibKey in calibrations) {
                        const cal = calibrations[calibKey];
                        const calInicioM = progresivaToMeters(cal.progresiva_inicio);
                        const calFinM = progresivaToMeters(cal.progresiva_fin);

                        if (!isNaN(calInicioM) && !isNaN(calFinM) && progresivaExcelM >= calInicioM && progresivaExcelM <= calFinM) {
                            tramoName = cal.nombre_tramo.toUpperCase().trim();
                            calibration = cal;
                            break;
                        }
                    }

                    let latitud = null;
                    let longitud = null;

                    if (tramoName && calibration) {
                        const tramoNumberMatch = tramoName.match(/\d+/);
                        const tramoIdKey = tramoNumberMatch ? tramoNumberMatch[0] : null;

                        let routePositions = null;
                        if (tramoIdKey && routesMap[tramoIdKey]) {
                            routePositions = routesMap[tramoIdKey];
                        } else if (routesMap[tramoName]) {
                            routePositions = routesMap[tramoName];
                        }

                        if (!routePositions) {
                            console.warn(`Fila ${i + 1}: No se encontró ruta KML parcial para el tramo '${tramoName}'.`);
                            continue;
                        }

                        try {
                            const calInicioM = progresivaToMeters(calibration.progresiva_inicio);
                            const calFinM = progresivaToMeters(calibration.progresiva_fin);
                            const kmlRouteLength = calculateRouteLength(routePositions);
                            const calLengthM = calFinM - calInicioM;

                            if (calLengthM <= 0 || kmlRouteLength <= 0) {
                                throw new Error(`Invalid calibration or KML route length.`);
                            }

                            const distOnKml = ((progresivaExcelM - calInicioM) / calLengthM) * kmlRouteLength;
                            if (distOnKml >= 0) {
                                const coords = calculateCoordinates(distOnKml, routePositions);
                                if (coords) {
                                    latitud = coords.latitude;
                                    longitud = coords.longitude;
                                }
                            }
                        } catch (e) {
                            console.error(`Error processing calibrated coordinates for row ${i + 1}: ${e.message}`);
                        }
                    } else {
                        // Fallback uncalibrated
                        const orderedRouteKeys = Object.keys(routesMap).sort((a, b) => {
                            const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
                            const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
                            return numA - numB;
                        });
                        let fullRoute = [];
                        orderedRouteKeys.forEach(key => {
                            const routeSegment = routesMap[key];
                            if (routeSegment && Array.isArray(routeSegment)) fullRoute.push(...routeSegment);
                        });

                        if (fullRoute.length > 1) {
                            const coords = calculateCoordinates(progresivaExcelM, fullRoute);
                            if (coords) {
                                latitud = coords.latitude;
                                longitud = coords.longitude;
                            }
                        }
                    }

                    if (latitud === null || longitud === null) {
                        murosSinCoords++;
                        console.warn(`Fila ${i + 1}: No se pudieron calcular coordenadas para progresiva ${progresivaStr}.`);
                        continue;
                    }

                    // Determine Entregable
                    let entregableVal = row[colMap.entregable];
                    if (!entregableVal && entregableDefault) {
                        entregableVal = `E-${entregableDefault}`;
                    }
                    if (entregableVal && !String(entregableVal).toUpperCase().startsWith('E-') && !String(entregableVal).toUpperCase().startsWith('ENTREGABLE')) {
                        // Keep as is
                    }
                    if (!entregableVal && entregableDefault) entregableVal = `E-${entregableDefault}`;

                    const muro = {
                        id_proyecto: projectId,
                        entregable: entregableVal,
                        panel_fotografico_codigo: row[colMap.panel] || null,
                        progresiva: progresivaStr,
                        clase: claseCell,
                        material: row[colMap.material] || null,
                        estado: row[colMap.estado] || null,
                        lado: row[colMap.lado] || null,
                        longitud_muro: parseFloat(String(row[colMap.longitud]).replace(/,/g, '')) || null,
                        alto: parseFloat(String(row[colMap.alto]).replace(/,/g, '')) || null,
                        ancho: parseFloat(String(row[colMap.ancho]).replace(/,/g, '')) || null,
                        latitud: latitud,
                        longitud: longitud
                    };

                    murosData.push(muro);
                }
            }

            if (murosSinCoords > 0) {
                console.warn(`Se encontraron ${murosSinCoords} muros a los que no se les pudo calcular coordenadas.`);
            }

            if (murosData.length === 0) {
                return { message: 'No se encontraron datos de muros válidos para importar.', count: 0 };
            }

            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query('DELETE FROM muros WHERE id_proyecto = $1', [projectId]);

                const insertPromises = murosData.map(m =>
                    client.query(
                        `INSERT INTO muros (
                            id_proyecto, entregable, panel_fotografico_codigo, progresiva, clase, material,
                            estado, lado, longitud_muro, alto, ancho, latitud, longitud
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id_muro`,
                        [
                            m.id_proyecto, m.entregable, m.panel_fotografico_codigo, m.progresiva, m.clase, m.material,
                            m.estado, m.lado, m.longitud_muro, m.alto, m.ancho, m.latitud, m.longitud
                        ]
                    )
                );

                const results = await Promise.all(insertPromises);
                await client.query('COMMIT');

                return { message: `Se importaron ${results.length} muros correctamente.`, count: results.length };

            } catch (dbError) {
                await client.query('ROLLBACK');
                console.error('Error en la transacción de base de datos al importar muros:', dbError.message, dbError.stack);
                throw new Error('Error al guardar los muros en la base de datos.');
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error en processExcelAndSaveMuros:', error);
            throw error;
        }
    },

    getMurosByProjectId: async (projectId) => {
        try {
            const result = await db.query('SELECT * FROM muros WHERE id_proyecto = $1 ORDER BY progresiva', [projectId]);
            return result.rows;
        } catch (error) {
            console.error(`Error al obtener muros para el proyecto ${projectId}:`, error);
            throw new Error('Error al obtener muros de la base de datos.');
        }
    },

    createMuro: async (data) => {
        try {
            const result = await db.query(
                `INSERT INTO muros (
                    id_proyecto, entregable, panel_fotografico_codigo, progresiva, clase, material,
                    estado, lado, longitud_muro, alto, ancho, latitud, longitud, observaciones
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
                [
                    data.id_proyecto, data.entregable, data.panel_fotografico_codigo, data.progresiva, data.clase, data.material,
                    data.estado, data.lado, data.longitud_muro, data.alto, data.ancho, data.latitud, data.longitud, data.observaciones
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear muro:', error);
            throw new Error('Error al crear muro en la base de datos.');
        }
    },

    updateMuro: async (id, data) => {
        try {
            const fields = [];
            const values = [];
            let fieldIndex = 1;

            const updatableFields = [
                'id_proyecto', 'entregable', 'panel_fotografico_codigo', 'progresiva', 'clase', 'material',
                'estado', 'lado', 'longitud_muro', 'alto', 'ancho', 'latitud', 'longitud', 'observaciones'
            ];

            for (const field of updatableFields) {
                if (data[field] !== undefined && data[field] !== null) {
                    fields.push(`${field} = $${fieldIndex++}`);
                    values.push(data[field]);
                }
            }

            if (fields.length === 0) {
                const currentData = await db.query('SELECT * FROM muros WHERE id_muro = $1', [id]);
                return currentData.rows[0];
            }

            values.push(id);
            const query = `UPDATE muros SET ${fields.join(', ')} WHERE id_muro = $${fieldIndex} RETURNING *`;

            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error(`Error al actualizar muro ${id}:`, error);
            throw new Error('Error al actualizar muro en la base de datos.');
        }
    },

    deleteExcelAndMuros: async (projectId) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM muros WHERE id_proyecto = $1', [projectId]);
            await client.query('COMMIT');
            return { message: 'Datos de muros eliminados correctamente.' };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error al eliminar datos de muros del proyecto ${projectId}:`, error);
            throw new Error('Error al eliminar datos de muros.');
        } finally {
            client.release();
        }
    },

    deleteMuro: async (id) => {
        try {
            const result = await db.query('DELETE FROM muros WHERE id_muro = $1', [id]);
            return result.rowCount;
        } catch (error) {
            console.error(`Error al eliminar muro ${id}:`, error);
            throw new Error('Error al eliminar muro de la base de datos.');
        }
    }
};

module.exports = murosService;
