const db = require('../conexion');
const xlsx = require('xlsx');
const axios = require('axios');
const { toLatLon } = require('utm');
const rutaKmlService = require('./rutaKmlService');

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

const badenesService = {
    processExcelAndSaveBadenes: async (fileBuffer, projectId, utmZone) => {
        try {
            // 1. Get Route Data for Coordinate Calculation
            const rutas = await rutaKmlService.getRutaKml();
            // Assuming we use the first route found or filter by project if needed. 
            // The current getRutaKml returns all routes grouped by tramo_id.
            // For now, we'll try to use the first available route or a specific logic if project_id was linked to tramo_id.
            // Since we don't have direct project->tramo link here easily without more queries, 
            // we will assume the first route is the relevant one or combine them.
            // BETTER APPROACH: Use the first route that has data.
            const routePositions = rutas.length > 0 ? rutas[0].positions : [];

            if (routePositions.length === 0) {
                console.warn('No se encontró una ruta KML para calcular coordenadas.');
            }

            // 2. Process Excel
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = 'OBR. ARTE';
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new Error(`La hoja '${sheetName}' no se encontró en el archivo Excel.`);
            }

            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            const badenesData = [];

            // Iterate from row 12 (index 11)
            for (let i = 11; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row) continue;

                // Column AI (Index 34) is Description/Keyword search
                const descripcionCell = row[34];

                if (typeof descripcionCell === 'string' && descripcionCell.toLowerCase().includes('baden')) {
                    console.log(`DEBUG: 'baden' encontrado en fila ${i + 1}, Columna AI.`);

                    // Extract Data from AE to AN
                    // AE (30) -> Estacion (Not used directly for DB but maybe for logic?)
                    // AF (31) -> Panel Fotografico
                    // AG (32) -> Numero del orden (Codigo?)
                    // AH (33) -> Progresiva
                    // AI (34) -> Descripcion (Already checked)
                    // AJ (35) -> Clase
                    // AK (36) -> Tipo
                    // AL (37) -> Luz
                    // AM (38) -> Ancho
                    // AN (39) -> Estado

                    const progresivaStr = row[33]; // AH
                    const progresivaMeters = progresivaToMeters(progresivaStr);

                    let latitud = null;
                    let longitud = null;

                    if (!isNaN(progresivaMeters) && routePositions.length > 0) {
                        const coords = calculateCoordinates(progresivaMeters, routePositions);
                        if (coords) {
                            latitud = coords.latitude;
                            longitud = coords.longitude;
                        }
                    }

                    // Fallback if calculation failed but we need to save it (maybe with 0,0 or null)
                    // The DB requires NOT NULL for lat/lon. 
                    // If we can't calculate, we might skip or use a default.
                    // For now, let's warn and skip if no coords, as they won't show on map.
                    if (latitud === null || longitud === null) {
                        console.warn(`Fila ${i + 1}: No se pudieron calcular coordenadas para progresiva ${progresivaStr}. Saltando.`);
                        continue;
                    }

                    const baden = {
                        id_proyecto: projectId,
                        entregable: row[30] || null, // AE
                        codigo: row[32] || `BAD-${i}`, // AG or generated
                        panel_fotografico_codigo: row[31] || null, // AF
                        progresiva: progresivaStr || null, // AH
                        clase: row[35] || null, // AJ
                        tipo: row[36] || null, // AK
                        luz: row[37] || null, // AL
                        ancho: row[38] || null, // AM
                        estado: row[39] || null, // AN
                        observaciones: row[34] || null, // AI (Description as observations)
                        latitud: latitud,
                        longitud: longitud,
                        // Other fields can be null or default
                        material: null,
                        diametro_lado: null,
                        longitud_baden: null, // Maybe 'luz' maps to this? User said AL is Luz.
                        alto: null,
                        altitud: null,
                        caracteristicas: null
                    };

                    badenesData.push(baden);
                }
            }

            if (badenesData.length === 0) {
                return { message: 'No se encontraron datos de badenes válidos para importar.', count: 0 };
            }

            // 3. Save to DB
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                // Optional: Delete existing badenes for this project if replacing?
                // Usually "Upload Excel" implies adding or replacing. 
                // The previous logic deleted all for the project. Let's stick to that for consistency or check requirements.
                // "se sube un excel y se procesa... haremos lo mismo para badenes" -> Implies same behavior.
                await client.query('DELETE FROM badenes WHERE id_proyecto = $1', [projectId]);

                const insertPromises = badenesData.map(b =>
                    client.query(
                        `INSERT INTO badenes (
                            id_proyecto, codigo, tipo, material, diametro_lado, longitud_baden,
                            estado, observaciones, progresiva, latitud, longitud,
                            luz, alto, ancho, altitud, caracteristicas, clase, panel_fotografico_codigo, entregable
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id_baden`,
                        [
                            b.id_proyecto, b.codigo, b.tipo, b.material, b.diametro_lado, b.longitud_baden,
                            b.estado, b.observaciones, b.progresiva, b.latitud, b.longitud,
                            b.luz, b.alto, b.ancho, b.altitud, b.caracteristicas, b.clase, b.panel_fotografico_codigo, b.entregable
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
