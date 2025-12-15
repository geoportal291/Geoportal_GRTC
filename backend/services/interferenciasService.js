const db = require('../conexion');
const xlsx = require('xlsx');
const axios = require('axios');
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

        // Haversine formula
        const R = 6371e3; // metres
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

    // If target is beyond the route, return the last point
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
    if (!routePositions || routePositions.length < 2) {
        return 0;
    }
    for (let i = 0; i < routePositions.length - 1; i++) {
        totalDistance += calculateDistance(routePositions[i], routePositions[i + 1]);
    }
    return totalDistance;
};

const interferenciasService = {
    processExcelAndSaveInterferencias: async (fileBuffer, projectId) => {
        try {
            // 1. Get KML URL
            const kmlUrlRes = await db.query('SELECT kml_url FROM invvial WHERE id_proyecto = $1', [projectId]);
            if (kmlUrlRes.rows.length === 0 || !kmlUrlRes.rows[0].kml_url) {
                // If no KML, we can't calculate coords, but we might still save data (or throw error)
                // Existing services throw error, so we will too.
                // However, maybe we should be more lenient? Stick to pattern.
                console.warn(`No se encontró URL de KML para proyecto ${projectId}.`);
                // throw new Error(...) // Let's try to proceed without KML if possible, or fail same as others
            }

            let routesMap = {};
            let calibrations = {};

            if (kmlUrlRes.rows.length > 0 && kmlUrlRes.rows[0].kml_url) {
                const kmlUrl = kmlUrlRes.rows[0].kml_url;
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

                    const calibrationRes = await db.query('SELECT * FROM proyecto_calibracion_tramos WHERE id_proyecto = $1', [projectId]);
                    calibrations = calibrationRes.rows.reduce((acc, cal) => {
                        acc[cal.nombre_tramo.toUpperCase().trim()] = cal;
                        return acc;
                    }, {});
                } catch (e) {
                    console.error('Error loading KML/Calibration for Interferencias:', e);
                }
            }

            // 2. Process Excel
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = 'INT. ELECTRICAS';
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                console.warn(`La hoja '${sheetName}' no se encontró en el archivo Excel.`);
                // console.log('Hojas disponibles:', workbook.SheetNames);
                return { message: `No se encontró la hoja '${sheetName}', no se importaron interferencias.`, count: 0 };
            }

            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            // console.log('--- INICIO PROCESAMIENTO INTERFERENCIAS ---');
            // console.log(`Total filas en '${sheetName}': ${jsonData.length}`);

            const interferenciasData = [];
            let sinCoords = 0;

            // Start from row 2 (index 2) based on user image (Row 1=Title, Row 2=Header, Row 3=Data)
            for (let i = 2; i < jsonData.length; i++) {
                const row = jsonData[i];
                // console.log(`Procesando fila ${i + 1}:`, JSON.stringify(row));

                if (!row || row.length === 0) {
                    // console.log(`Fila ${i + 1} vacía o nula.`);
                    continue;
                }

                // Column D (index 3) but logs show it's index 2 (0-indexed array from valid columns)
                // Log: ["E-1","4","0+018","Poste electrico ","Concreto","baja tensión ","L.D."]
                // 0: Entregable (E-1)
                // 1: Panel (4)
                // 2: Progresiva (0+018)
                // 3: Tipo
                // 4: Material
                // 5: Tension
                // 6: Lado

                const progresivaStr = row[2];
                if (!progresivaStr) {
                    // console.log(`Fila ${i + 1} saltada: No tiene progresiva (Index 2).`);
                    continue;
                }

                const progresivaExcelM = progresivaToMeters(progresivaStr);
                if (isNaN(progresivaExcelM)) {
                    // console.log(`Fila ${i + 1} saltada: Progresiva inválida '${progresivaStr}'.`);
                    continue;
                }

                // Calculate Coords
                let latitud = null;
                let longitud = null;

                // Reuse calibration logic
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

                if (tramoName && calibration) {
                    const tramoNumberMatch = tramoName.match(/\d+/);
                    const tramoIdKey = tramoNumberMatch ? tramoNumberMatch[0] : null;
                    let routePositions = routesMap[tramoIdKey] || routesMap[tramoName];

                    if (routePositions) {
                        try {
                            const calInicioM = progresivaToMeters(calibration.progresiva_inicio);
                            const calFinM = progresivaToMeters(calibration.progresiva_fin);
                            const kmlRouteLength = calculateRouteLength(routePositions);
                            const calLengthM = calFinM - calInicioM;

                            const distOnKml = ((progresivaExcelM - calInicioM) / calLengthM) * kmlRouteLength;
                            if (distOnKml >= 0) {
                                const coords = calculateCoordinates(distOnKml, routePositions);
                                if (coords) {
                                    latitud = coords.latitude;
                                    longitud = coords.longitude;
                                }
                            }
                        } catch (e) {
                            console.warn(`Error calculation coords for row ${i}: ${e.message}`);
                        }
                    }
                } else {
                    // Fallback to simple geometry?
                    // Similar fallback logic as badenes
                }

                if (!latitud || !longitud) {
                    sinCoords++;
                    // console.log(`Fila ${i + 1}: No se pudieron calcular coordenadas. (Progresiva: ${progresivaStr}, TramoDetectado: ${tramoName || 'Ninguno'})`);
                    // Optional: skip or save without coords? Badenes saves anyway? 
                    // BadenesService skips if no coords logic is strict?
                    // "badenesSinCoords++; console.warn... continue;" -> It skips!
                    // I will replicate skipping behavior
                    continue;
                }

                // console.log(`Fila ${i + 1} Agregada: lat=${latitud}, lng=${longitud}`);

                interferenciasData.push({
                    id_proyecto: projectId,
                    entregable: row[0], // Index 0 based on logs
                    panel_fotografico: row[1], // Index 1
                    progresiva: progresivaStr, // Index 2
                    tipo_interferencia: row[3], // Index 3
                    material: row[4], // Index 4
                    tension: row[5], // Index 5
                    lado: row[6], // Index 6
                    latitud,
                    longitud,
                    observaciones: row[7] // Index 7 (assuming)
                });
            }

            if (interferenciasData.length === 0) {
                console.warn('No se encontraron datos válidos después del procesamiento.');
                return { message: 'No se encontraron datos de interferencias válidos.', count: 0 };
            }

            // console.log(`Guardando ${interferenciasData.length} registros en la BD...`);
            // Save to DB
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query('DELETE FROM interferencias_electricas WHERE id_proyecto = $1', [projectId]);

                const insertPromises = interferenciasData.map(item =>
                    client.query(`
                        INSERT INTO interferencias_electricas (
                            id_proyecto, entregable, panel_fotografico, progresiva, tipo_interferencia, 
                            material, tension, lado, latitud, longitud, observaciones
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    `, [
                        item.id_proyecto, item.entregable, item.panel_fotografico, item.progresiva,
                        item.tipo_interferencia, item.material, item.tension, item.lado,
                        item.latitud, item.longitud, item.observaciones
                    ])
                );

                await Promise.all(insertPromises);
                await client.query('COMMIT');
                return { message: `Se importaron ${interferenciasData.length} interferencias.`, count: interferenciasData.length };
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error CRÍTICO en processExcelAndSaveInterferencias:', error);
            throw error;
        }
    },

    getInterferenciasByProjectId: async (projectId) => {
        const res = await db.query('SELECT * FROM interferencias_electricas WHERE id_proyecto = $1 ORDER BY id', [projectId]);
        return res.rows;
    },

    deleteInterferenciasByProject: async (projectId) => {
        await db.query('DELETE FROM interferencias_electricas WHERE id_proyecto = $1', [projectId]);
        return { message: 'Interferencias eliminadas.' };
    },

    createInterferencia: async (data) => {
        const {
            id_proyecto, entregable, panel_fotografico, progresiva, tipo_interferencia,
            material, tension, lado, latitud, longitud, observaciones
        } = data;

        const result = await db.query(
            `INSERT INTO interferencias_electricas (
                id_proyecto, entregable, panel_fotografico, progresiva, tipo_interferencia, 
                material, tension, lado, latitud, longitud, observaciones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                id_proyecto, entregable, panel_fotografico, progresiva, tipo_interferencia,
                material, tension, lado, latitud, longitud, observaciones
            ]
        );
        return result.rows[0];
    },

    updateInterferencia: async (id, data) => {
        const {
            entregable, panel_fotografico, progresiva, tipo_interferencia,
            material, tension, lado, latitud, longitud, observaciones
        } = data;

        const result = await db.query(
            `UPDATE interferencias_electricas SET
                entregable = $1,
                panel_fotografico = $2,
                progresiva = $3,
                tipo_interferencia = $4,
                material = $5,
                tension = $6,
                lado = $7,
                latitud = $8,
                longitud = $9,
                observaciones = $10
             WHERE id = $11 RETURNING *`,
            [
                entregable, panel_fotografico, progresiva, tipo_interferencia,
                material, tension, lado, latitud, longitud, observaciones,
                id
            ]
        );
        return result.rows[0];
    }
};

module.exports = interferenciasService;
