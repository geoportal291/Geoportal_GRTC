const db = require('../conexion');
const xlsx = require('xlsx');
const { toLatLon } = require('utm');

const parseExcelAndSave = async (fileBuffer, projectId, utmZoneInput) => {
    try {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = 'CANT. Y FA.';
        console.log('Hojas disponibles:', workbook.SheetNames);

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            console.error(`Hoja "${sheetName}" no encontrada.`);
            throw new Error(`La hoja "${sheetName}" no se encontró en el archivo Excel. Hojas disponibles: ${workbook.SheetNames.join(', ')}`);
        }

        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: null });
        console.log(`Total filas en hoja "${sheetName}": ${data.length}`);

        let isProcessingCanteras = false;
        let isProcessingFuentes = false;

        const canteras = [];
        const fuentes = [];

        // Parse UTM Zone
        let ZONE = 18;
        let HEMISPHERE = 'L'; // Default to L (South/Peru) instead of S (North)

        if (utmZoneInput) {
            const match = utmZoneInput.match(/(\d+)([a-zA-Z]?)/);
            if (match) {
                ZONE = parseInt(match[1], 10);
                if (match[2]) {
                    HEMISPHERE = match[2].toUpperCase();
                }
            }
        }
        console.log(`Usando Zona UTM: ${ZONE} ${HEMISPHERE} (Input: ${utmZoneInput})`);

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowString = row.join(' ').toLowerCase();

            // Detectar secciones
            if (rowString.includes('canteras') && !rowString.includes('entregable')) {
                console.log('>>> SECCION CANTERAS ENCONTRADA en fila', i);
                isProcessingCanteras = true;
                isProcessingFuentes = false;
                continue;
            }

            if (rowString.includes('fuentes de agua') && !rowString.includes('entregable')) {
                console.log('>>> SECCION FUENTES DE AGUA ENCONTRADA en fila', i);
                isProcessingCanteras = false;
                isProcessingFuentes = true;
                continue;
            }

            // Ignorar cabeceras
            if (rowString.includes('entregable') || rowString.includes('progresiva') || rowString.includes('coordenadas')) {
                continue;
            }

            // Indices (0-based):
            // 0: Entregable (A)
            // 1: Panel (B)
            // 2: Progresiva (C)
            // 3: Este/Latitud (D) -> UTM Easting
            // 4: Norte/Longitud (E) -> UTM Northing
            // 5: Altitud (F) -> Altitud
            // 6: Lado/Ubicación (G) -> Varía según tipo (Cantera: Lado, Fuente: Ubicacion)
            // 7: Propietario/Lado (H) -> Varía según tipo (Cantera: Propietario, Fuente: Lado)
            // 8: Propietario (I) -> Solo Fuentes

            const easting = parseFloat(row[3]);
            const northing = parseFloat(row[4]);

            // Si no hay coordenadas válidas, saltar
            if (isNaN(easting) || isNaN(northing)) continue;

            let lat = null;
            let lon = null;
            try {
                const latLon = toLatLon(easting, northing, ZONE, HEMISPHERE);
                lat = latLon.latitude;
                lon = latLon.longitude;
            } catch (e) {
                console.warn(`Error convirtiendo UTM en fila ${i}: ${e.message}`);
                continue;
            }

            if (isProcessingCanteras) {
                // Canteras Config:
                // G (6): Lado
                // H (7): Propietario
                const newItem = {
                    item_number: canteras.length + 1,
                    id_proyecto: projectId,
                    entregable: row[0],
                    panel_fotografico: row[1],
                    progresiva: row[2],
                    latitud: lat,
                    longitud: lon,
                    altitud: row[5],
                    lado: row[6],
                    propietario: row[7]
                };
                canteras.push(newItem);
                console.log(`Cantera ${newItem.item_number}:`, JSON.stringify(newItem));

            } else if (isProcessingFuentes) {
                // Fuentes Config:
                // G (6): Ubicación
                // H (7): Lado
                // I (8): Propietario
                const newItem = {
                    item_number: fuentes.length + 1,
                    id_proyecto: projectId,
                    entregable: row[0],
                    panel_fotografico: row[1],
                    progresiva: row[2],
                    latitud: lat,
                    longitud: lon,
                    altitud: row[5],
                    ubicacion: row[6],
                    lado: row[7],
                    propietario: row[8]
                };
                fuentes.push(newItem);
                console.log(`Fuente ${newItem.item_number}:`, JSON.stringify(newItem));
            }
        }

        // Insertar en Base de Datos
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            console.log(`Eliminando canteras y fuentes previas del proyecto ${projectId} (Estrategia Reemplazar)...`);
            // Estrategia "Replace": Eliminar datos antiguos del proyecto antes de insertar los nuevos
            await client.query('DELETE FROM invvial_canteras WHERE id_proyecto = $1', [projectId]);
            await client.query('DELETE FROM invvial_fuentes WHERE id_proyecto = $1', [projectId]);

            if (canteras.length > 0) {
                const canterasQuery = `
                    INSERT INTO invvial_canteras (
                        id_proyecto, entregable, panel_fotografico, progresiva, 
                        latitud, longitud, altitud, lado, propietario, item_number
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `;
                for (const c of canteras) {
                    await client.query(canterasQuery, [
                        c.id_proyecto, c.entregable, c.panel_fotografico, c.progresiva,
                        c.latitud, c.longitud, c.altitud, c.lado, c.propietario, c.item_number
                    ]);
                }
            }

            if (fuentes.length > 0) {
                const fuentesQuery = `
                    INSERT INTO invvial_fuentes (
                        id_proyecto, entregable, panel_fotografico, progresiva, 
                        latitud, longitud, altitud, ubicacion, lado, propietario, item_number
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                `;
                for (const f of fuentes) {
                    await client.query(fuentesQuery, [
                        f.id_proyecto, f.entregable, f.panel_fotografico, f.progresiva,
                        f.latitud, f.longitud, f.altitud, f.ubicacion, f.lado, f.propietario, f.item_number
                    ]);
                }
            }

            await client.query('COMMIT');
            return { success: true, message: `Procesado: ${canteras.length} canteras, ${fuentes.length} fuentes de agua.` };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error en parseExcelAndSave:', error);
        throw new Error('Error al procesar el archivo Excel: ' + error.message);
    }
};

const getCanterasByProject = async (projectId) => {
    try {
        const query = 'SELECT * FROM invvial_canteras WHERE id_proyecto = $1 ORDER BY id ASC';
        const result = await db.query(query, [projectId]);
        return result.rows;
    } catch (error) {
        throw new Error('Error al obtener canteras: ' + error.message);
    }
};

const getFuentesByProject = async (projectId) => {
    try {
        const query = 'SELECT * FROM invvial_fuentes WHERE id_proyecto = $1 ORDER BY id ASC';
        const result = await db.query(query, [projectId]);
        return result.rows;
    } catch (error) {
        throw new Error('Error al obtener fuentes de agua: ' + error.message);
    }
};

module.exports = {
    parseExcelAndSave,
    getCanterasByProject,
    getFuentesByProject
};
