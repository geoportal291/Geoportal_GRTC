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

const puentesService = {
    processExcelAndSavePuentes: async (fileBuffer, projectId, utmZone) => {
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
                    // In GeoJSON LineString, coordinates are [lng, lat], switch to [lat, lng]
                    const positions = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    routesMap[tramoName] = positions;

                    // Also add by number key for flexibility
                    const tramoNumberMatch = tramoName.match(/\d+/);
                    if (tramoNumberMatch) {
                        routesMap[tramoNumberMatch[0]] = positions;
                    }
                }
            });
            console.log(`DEBUG: Loaded KML and built routes map. Keys: [${Object.keys(routesMap).join(', ')}]`);

            // 3. Get calibration data for the project
            const calibrationRes = await db.query(
                'SELECT * FROM proyecto_calibracion_tramos WHERE id_proyecto = $1',
                [projectId]
            );
            const calibrations = calibrationRes.rows.reduce((acc, cal) => {
                acc[cal.nombre_tramo.toUpperCase().trim()] = cal;
                return acc;
            }, {});
            console.log(`DEBUG: Loaded ${calibrationRes.rows.length} calibrations for project ${projectId}.`);

            // 4. Process Excel
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = 'OBR. ARTE';
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new Error(`La hoja '${sheetName}' no se encontró en el archivo Excel.`);
            }

            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            const puentesData = [];
            let puentesSinCoords = 0;

            // 5. Iterate through rows from row 1 (index 0)
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                const claseCell = row[4]; // Column E

                if (typeof claseCell === 'string' && claseCell.toLowerCase().includes('puente')) {
                    console.log(`DEBUG: 'Puente' encontrado en fila ${i + 1}, Columna E: "${claseCell}"`);

                    const progresivaStr = row[2]; // Column C
                    if (!progresivaStr) {
                        console.warn(`Fila ${i + 1}: Se encontró un puente pero falta la progresiva. Saltando.`);
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
                            console.error(`Could not find KML route for tramo key '${tramoIdKey}' or tramo name '${tramoName}'. Available route keys are: [${Object.keys(routesMap).join(', ')}]`);
                            console.warn(`Fila ${i + 1}: No se encontró ruta KML para el tramo '${tramoName}'. Saltando.`);
                            continue;
                        }

                        try {
                            const calInicioM = progresivaToMeters(calibration.progresiva_inicio);
                            const calFinM = progresivaToMeters(calibration.progresiva_fin);
                            const kmlRouteLength = calculateRouteLength(routePositions);
                            const calLengthM = calFinM - calInicioM;

                            if (calLengthM <= 0 || kmlRouteLength <= 0) {
                                throw new Error(`Invalid calibration or KML route length for tramo ${tramoName}.`);
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
                        console.warn(`Fila ${i + 1}: No se encontró un tramo calibrado para la progresiva '${progresivaStr}'. Usando cálculo geométrico simple.`);

                        const orderedRouteKeys = Object.keys(routesMap).sort((a, b) => {
                            const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
                            const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
                            return numA - numB;
                        });
                        let fullRoute = [];
                        orderedRouteKeys.forEach(key => {
                            const routeSegment = routesMap[key];
                            if (routeSegment && Array.isArray(routeSegment)) {
                                if (fullRoute.length > 0 && routeSegment.length > 0) {
                                    const lastPoint = fullRoute[fullRoute.length - 1];
                                    const firstPoint = routeSegment[0];
                                    if (lastPoint[0] === firstPoint[0] && lastPoint[1] === firstPoint[1]) {
                                        fullRoute.push(...routeSegment.slice(1));
                                    } else {
                                        fullRoute.push(...routeSegment);
                                    }
                                } else {
                                    fullRoute.push(...routeSegment);
                                }
                            }
                        });

                        if (fullRoute.length > 1) {
                            const coords = calculateCoordinates(progresivaExcelM, fullRoute);
                            if (coords) {
                                latitud = coords.latitude;
                                longitud = coords.longitude;
                                console.log(`Fila ${i + 1}: Coordenadas (sin calibrar) calculadas: ${latitud}, ${longitud}`);
                            }
                        } else {
                            console.warn(`Fila ${i + 1}: No se pudo construir una ruta KML completa para el cálculo geométrico.`);
                        }
                    }

                    if (latitud === null || longitud === null) {
                        puentesSinCoords++;
                        console.warn(`Fila ${i + 1}: No se pudieron calcular coordenadas para progresiva ${progresivaStr}.`);
                        continue;
                    }

                    const puente = {
                        id_proyecto: projectId,
                        entregable: row[0] || null, // Col A
                        panel_fotografico_codigo: row[1] || null, // Col B
                        progresiva: progresivaStr, // Col C
                        nombre: row[3] || null, // Col D
                        clase: claseCell, // Col E
                        tipo: row[5] || null, // Col F
                        estado: row[6] || null, // Col G
                        numero_vias: row[7] || null, // Col H
                        tablero: row[8] || null, // Col I
                        longitud_puente: parseFloat(String(row[9]).replace(/,/g, '')) || null, // Col J
                        ancho: parseFloat(String(row[10]).replace(/,/g, '')) || null, // Col K
                        latitud: latitud,
                        longitud: longitud
                    };
                    console.log(`DEBUG: Fila ${i + 1}, Datos extraídos:`, puente);

                    puentesData.push(puente);
                }
            }

            if (puentesSinCoords > 0) {
                console.warn(`Se encontraron ${puentesSinCoords} puentes a los que no se les pudo calcular coordenadas.`);
            }

            if (puentesData.length === 0) {
                return { message: 'No se encontraron datos de puentes válidos para importar.', count: 0 };
            }

            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query('DELETE FROM puentes WHERE id_proyecto = $1', [projectId]);

                const insertPromises = puentesData.map(p =>
                    client.query(
                        `INSERT INTO puentes (
                            id_proyecto, entregable, panel_fotografico_codigo, progresiva, nombre, clase,
                            tipo, estado, numero_vias, tablero, longitud_puente, ancho, latitud, longitud
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id_puente`,
                        [
                            p.id_proyecto, p.entregable, p.panel_fotografico_codigo, p.progresiva, p.nombre, p.clase,
                            p.tipo, p.estado, p.numero_vias, p.tablero, p.longitud_puente, p.ancho, p.latitud, p.longitud
                        ]
                    )
                );

                const results = await Promise.all(insertPromises);
                await client.query('COMMIT');

                return { message: `Se importaron ${results.length} puentes correctamente.`, count: results.length };

            } catch (dbError) {
                await client.query('ROLLBACK');
                console.error('Error en la transacción de base de datos al importar puentes:', dbError.message, dbError.stack);
                throw new Error('Error al guardar los puentes en la base de datos.');
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error en processExcelAndSavePuentes:', error);
            throw error;
        }
    },

    getPuentesByProjectId: async (projectId) => {
        try {
            const result = await db.query('SELECT * FROM puentes WHERE id_proyecto = $1 ORDER BY progresiva', [projectId]);
            return result.rows;
        } catch (error) {
            console.error(`Error al obtener puentes para el proyecto ${projectId}:`, error);
            throw new Error('Error al obtener puentes de la base de datos.');
        }
    },

    createPuente: async (data) => {
        try {
            const result = await db.query(
                `INSERT INTO puentes (
                    id_proyecto, entregable, panel_fotografico_codigo, progresiva, nombre, clase,
                    tipo, estado, numero_vias, tablero, longitud_puente, ancho, latitud, longitud, observaciones
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
                [
                    data.id_proyecto, data.entregable, data.panel_fotografico_codigo, data.progresiva, data.nombre, data.clase,
                    data.tipo, data.estado, data.numero_vias, data.tablero, data.longitud_puente, data.ancho, data.latitud, data.longitud, data.observaciones
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear puente:', error);
            throw new Error('Error al crear puente en la base de datos.');
        }
    },

    updatePuente: async (id, data) => {
        try {
            const fields = [];
            const values = [];
            let fieldIndex = 1;

            const updatableFields = [
                'id_proyecto', 'entregable', 'panel_fotografico_codigo', 'progresiva', 'nombre', 'clase',
                'tipo', 'estado', 'numero_vias', 'tablero', 'longitud_puente', 'ancho', 'latitud', 'longitud', 'observaciones'
            ];

            for (const field of updatableFields) {
                if (data[field] !== undefined && data[field] !== null) {
                    fields.push(`${field} = $${fieldIndex++}`);
                    values.push(data[field]);
                }
            }

            if (fields.length === 0) {
                const currentData = await db.query('SELECT * FROM puentes WHERE id_puente = $1', [id]);
                return currentData.rows[0];
            }

            values.push(id);
            const query = `UPDATE puentes SET ${fields.join(', ')} WHERE id_puente = $${fieldIndex} RETURNING *`;

            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error(`Error al actualizar puente ${id}:`, error);
            throw new Error('Error al actualizar puente en la base de datos.');
        }
    },

    deleteExcelAndPuentes: async (projectId) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM puentes WHERE id_proyecto = $1', [projectId]);
            await client.query('COMMIT');
            return { message: 'Datos de puentes eliminados correctamente.' };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error al eliminar datos de puentes del proyecto ${projectId}:`, error);
            throw new Error('Error al eliminar datos de puentes.');
        } finally {
            client.release();
        }
    }
};

module.exports = puentesService;
