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
        // Using a simple spherical approximation for now as used in frontend (leaflet's distanceTo)
        // But since we don't have leaflet here, we implement a simple Haversine
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

const badenesService = {
    processExcelAndSaveBadenes: async (fileBuffer, projectId, utmZone) => {
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
            const badenesData = [];
            let badenesSinCoords = 0;

            // 5. Iterate through rows from row 12 (index 11)
            for (let i = 11; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;

                const descripcionCell = row[34]; // Column AI

                if (typeof descripcionCell === 'string' && /^Baden N/.test(descripcionCell)) {
                    console.log(`DEBUG: 'Baden N...' encontrado en fila ${i + 1}, Columna AI: "${descripcionCell}"`);

                    const progresivaStr = row[33]; // Column AH
                    if (!progresivaStr) {
                        console.warn(`Fila ${i + 1}: Se encontró un baden pero falta la progresiva. Saltando.`);
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
                        badenesSinCoords++;
                        console.warn(`Fila ${i + 1}: No se pudieron calcular coordenadas para progresiva ${progresivaStr}.`);
                        continue; 
                    }

                    const baden = {
                        id_proyecto: projectId,
                        entregable: row[30] || null, // AE
                        panel_fotografico_codigo: row[31] || null, // AF
                        codigo: row[32] || `BAD-${i}`, // AG
                        progresiva: progresivaStr || null, // AH
                        observaciones: descripcionCell, // AI
                        clase: row[35] || null, // AJ
                        tipo: row[36] || null, // AK
                        luz: row[37] || null, // AL
                        ancho: row[38] || null, // AM
                        estado: row[39] || null, // AN
                        latitud: latitud,
                        longitud: longitud
                    };
                    console.log(`DEBUG: Fila ${i + 1}, Datos extraídos:`, baden);

                    badenesData.push(baden);
                }
            }

            if (badenesSinCoords > 0) {
                console.warn(`Se encontraron ${badenesSinCoords} badenes a los que no se les pudo calcular coordenadas.`);
            }

            if (badenesData.length === 0) {
                return { message: 'No se encontraron datos de badenes válidos para importar.', count: 0 };
            }

            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query('DELETE FROM badenes WHERE id_proyecto = $1', [projectId]);

                const insertPromises = badenesData.map(b =>
                    client.query(
                        `INSERT INTO badenes (
                            id_proyecto, codigo, tipo, estado, observaciones, progresiva, latitud, longitud,
                            luz, ancho, clase, panel_fotografico_codigo, entregable
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id_baden`,
                        [
                            b.id_proyecto, b.codigo, b.tipo, b.estado, b.observaciones, b.progresiva, b.latitud, b.longitud,
                            b.luz, b.ancho, b.clase, b.panel_fotografico_codigo, b.entregable
                        ]
                    )
                );

                const results = await Promise.all(insertPromises);
                await client.query('COMMIT');

                return { message: `Se importaron ${results.length} badenes correctamente.`, count: results.length };

            } catch (dbError) {
                await client.query('ROLLBACK');
                console.error('Error en la transacción de base de datos al importar badenes:', dbError.message, dbError.stack);
                throw new Error('Error al guardar los badenes en la base de datos.');
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error en processExcelAndSaveBadenes:', error);
            throw error;
        }
    },

    getBadenesByProjectId: async (projectId) => {
        try {
            const result = await db.query('SELECT * FROM badenes WHERE id_proyecto = $1 ORDER BY progresiva', [projectId]);
            return result.rows;
        } catch (error) {
            console.error(`Error al obtener badenes para el proyecto ${projectId}:`, error);
            throw new Error('Error al obtener badenes de la base de datos.');
        }
    },

    createBaden: async (data) => {
        try {
            const result = await db.query(
                `INSERT INTO badenes (
                    id_proyecto, codigo, tipo, material, diametro_lado, longitud_baden,
                    estado, observaciones, progresiva, latitud, longitud,
                    luz, alto, ancho, altitud, caracteristicas, clase, panel_fotografico_codigo, entregable
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
                [
                    data.id_proyecto, data.codigo, data.tipo, data.material, data.diametro_lado, data.longitud_baden,
                    data.estado, data.observaciones, data.progresiva, data.latitud, data.longitud,
                    data.luz, data.alto, data.ancho, data.altitud, data.caracteristicas, data.clase, data.panel_fotografico_codigo, data.entregable
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear badén:', error);
            throw new Error('Error al crear badén en la base de datos.');
        }
    },

    updateBaden: async (id, data) => {
        try {
            const fields = [];
            const values = [];
            let fieldIndex = 1;

            const updatableFields = [
                'id_proyecto', 'codigo', 'tipo', 'material', 'diametro_lado', 'longitud_baden',
                'estado', 'observaciones', 'progresiva', 'latitud', 'longitud',
                'luz', 'alto', 'ancho', 'altitud', 'caracteristicas', 'clase', 'panel_fotografico_codigo', 'entregable'
            ];

            for (const field of updatableFields) {
                if (data[field] !== undefined && data[field] !== null) {
                    fields.push(`${field} = $${fieldIndex++}`);
                    values.push(data[field]);
                }
            }

            if (fields.length === 0) {
                const currentData = await db.query('SELECT * FROM badenes WHERE id_baden = $1', [id]);
                return currentData.rows[0];
            }

            values.push(id);
            const query = `UPDATE badenes SET ${fields.join(', ')} WHERE id_baden = $${fieldIndex} RETURNING *`;

            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error(`Error al actualizar badén ${id}:`, error);
            throw new Error('Error al actualizar badén en la base de datos.');
        }
    },

    deleteExcelAndBadenes: async (projectId) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            // Delete badenes
            await client.query('DELETE FROM badenes WHERE id_proyecto = $1', [projectId]);

            // If there was an entry in invvial_excels for badenes, delete it too.
            // Assuming invvial_excels has a type or we just delete by project if it's shared?
            // The current invvial_excels table might be generic.
            // Let's check if we need to delete from invvial_excels.
            // For now, just deleting the data is the primary goal.

            await client.query('COMMIT');
            return { message: 'Datos de badenes eliminados correctamente.' };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error al eliminar datos de badenes del proyecto ${projectId}:`, error);
            throw new Error('Error al eliminar datos de badenes.');
        } finally {
            client.release();
        }
    }
};

module.exports = badenesService;
