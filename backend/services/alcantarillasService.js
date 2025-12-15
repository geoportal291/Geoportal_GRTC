const db = require('../conexion');
const xlsx = require('xlsx');
const axios = require('axios');
const { toLatLon } = require('utm');

const alcantarillasService = {
    processExcelAndSaveAlcantarillas: async (fileBuffer, projectId, utmZone) => {
        try {
            // El archivo se recibe como un buffer, no se necesita descarga
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = 'OBR. ARTE';
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new Error(`La hoja '${sheetName}' no se encontró en el archivo Excel.`);
            }

            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            const alcantarillasData = [];

            // Iterar desde la fila 12 (índice 11)
            for (let i = 11; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row) continue;

                const claseCell = row[16]; // Columna Q
                // console.log(`DEBUG: Fila ${i + 1}, Columna Q, Valor: '${claseCell}'`);

                if (typeof claseCell === 'string' && claseCell.toLowerCase().includes('alcantarilla')) {
                    // console.log(`DEBUG: 'alcantarilla' encontrada en la fila ${i + 1}. Procesando fila...`);

                    let codigo_extraido = null;
                    const match = claseCell.match(/(?:N°|No\.|Nº)\s*(\d+)/i);
                    if (match && match[1]) {
                        codigo_extraido = match[1];
                    } else {
                        const genericMatch = claseCell.match(/\d+/);
                        if (genericMatch) {
                            codigo_extraido = genericMatch[0];
                        }
                    }

                    const easting = parseFloat(String(row[24]).replace(/,/g, '')); // Columna Y
                    const northing = parseFloat(String(row[25]).replace(/,/g, '')); // Columna Z

                    // console.log(`DEBUG: Fila ${i + 1}, Easting: ${easting}, Northing: ${northing}, utmZone received: ${utmZone}`);
                    const zoneNum = parseInt(utmZone.slice(0, -1));
                    const zoneLetter = utmZone.slice(-1);
                    // console.log(`DEBUG: Fila ${i + 1}, Parsed zoneNum: ${zoneNum}, Parsed zoneLetter: ${zoneLetter}`);
                    const latLon = toLatLon(easting, northing, zoneNum, zoneLetter);
                    // console.log(`DEBUG: Fila ${i + 1}, Lat/Lon convertidas:`, latLon);

                    const alcantarilla = {
                        id_proyecto: projectId,
                        codigo: codigo_extraido, // Extraído de la Columna Q
                        clase: row[17] || null, // Columna R
                        tipo: row[18] || null, // Columna S
                        material: null, // No especificado en el nuevo mapeo
                        diametro_lado: row[21] || null, // Columna V
                        longitud_alcantarilla: parseFloat(String(row[20]).replace(/,/g, '')) || null, // Columna U (antes luz)
                        estado: row[19] || null, // Columna T
                        observaciones: row[28] || null, // Columna AC
                        progresiva: row[15] || null, // Columna P
                        latitud: latLon.latitude,
                        longitud: latLon.longitude,
                        luz: row[23] || null, // Columna X (antes ancho)
                        alto: parseFloat(String(row[22]).replace(/,/g, '')) || null, // Columna W
                        ancho: row[23] || null, // Columna X
                        altitud: row[26] || null, // Columna AA
                        caracteristicas: row[27] || null, // Columna AB
                        panel_fotografico_codigo: row[13] || null, // Columna N
                        entregable: row[12] || null, // Columna M
                    };

                    // console.log(`DEBUG: Fila ${i + 1}, Datos extraídos:`, alcantarilla);

                    if (isNaN(alcantarilla.latitud) || isNaN(alcantarilla.longitud)) {
                        console.warn(`Fila ${i + 1}: Latitud o Longitud inválida para la alcantarilla con código ${alcantarilla.codigo || 'N/A'}. Saltando.`);
                        continue;
                    }

                    alcantarillasData.push(alcantarilla);
                }
            }

            if (alcantarillasData.length === 0) {
                return { message: 'No se encontraron datos de alcantarillas válidos para importar.', count: 0 };
            }

            // Insertar datos en la base de datos
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query('DELETE FROM alcantarillas WHERE id_proyecto = $1', [projectId]);

                const insertPromises = alcantarillasData.map(a =>
                    client.query(
                        `INSERT INTO alcantarillas (
                                id_proyecto, codigo, tipo, material, diametro_lado, longitud_alcantarilla,
                                estado, observaciones, progresiva, latitud, longitud,
                                luz, alto, ancho, altitud, caracteristicas, clase, panel_fotografico_codigo, entregable
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id_alcantarilla`,
                        [
                            a.id_proyecto, a.codigo, a.tipo, a.material, a.diametro_lado, a.longitud_alcantarilla,
                            a.estado, a.observaciones, a.progresiva, a.latitud, a.longitud,
                            a.luz, a.alto, a.ancho, a.altitud, a.caracteristicas, a.clase, a.panel_fotografico_codigo, a.entregable
                        ]
                    )
                );

                const results = await Promise.all(insertPromises);
                await client.query('COMMIT');

                return { message: `Se importaron ${results.length} alcantarillas correctamente.`, count: results.length };

            } catch (dbError) {
                await client.query('ROLLBACK');
                console.error('Error en la transacción de base de datos al importar alcantarillas:', dbError.message, dbError.stack);
                throw new Error('Error al guardar las alcantarillas en la base de datos.');
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error en processExcelAndSaveAlcantarillas:', error);
            throw error;
        }
    },

    getAlcantarillasByProjectId: async (projectId) => {
        try {
            const result = await db.query('SELECT * FROM alcantarillas WHERE id_proyecto = $1 ORDER BY progresiva', [projectId]);
            return result.rows;
        } catch (error) {
            console.error(`Error al obtener alcantarillas para el proyecto ${projectId}:`, error);
            throw new Error('Error al obtener alcantarillas de la base de datos.');
        }
    },

    createAlcantarilla: async (data) => {
        try {
            const result = await db.query(
                `INSERT INTO alcantarillas (
                    id_proyecto, codigo, tipo, material, diametro_lado, longitud_alcantarilla,
                    estado, observaciones, progresiva, latitud, longitud,
                    luz, alto, ancho, altitud, caracteristicas, clase, panel_fotografico_codigo, entregable
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
                [
                    data.id_proyecto, data.codigo, data.tipo, data.material, data.diametro_lado, data.longitud_alcantarilla,
                    data.estado, data.observaciones, data.progresiva, data.latitud, data.longitud,
                    data.luz, data.alto, data.ancho, data.altitud, data.caracteristicas, data.clase, data.panel_fotografico_codigo, data.entregable
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error al crear alcantarilla:', error);
            throw new Error('Error al crear alcantarilla en la base de datos.');
        }
    },

    updateAlcantarilla: async (id, data) => {
        try {
            const fields = [];
            const values = [];
            let fieldIndex = 1;

            const updatableFields = [
                'id_proyecto', 'codigo', 'tipo', 'material', 'diametro_lado', 'longitud_alcantarilla',
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
                // Si no hay campos para actualizar, simplemente retorna la data actual.
                // Opcionalmente, podrías consultar la base de datos para obtener el estado más reciente.
                const currentData = await db.query('SELECT * FROM alcantarillas WHERE id_alcantarilla = $1', [id]);
                return currentData.rows[0];
            }

            values.push(id);
            const query = `UPDATE alcantarillas SET ${fields.join(', ')} WHERE id_alcantarilla = $${fieldIndex} RETURNING *`;

            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error(`Error al actualizar alcantarilla ${id}:`, error);
            throw new Error('Error al actualizar alcantarilla en la base de datos.');
        }
    }
};

module.exports = alcantarillasService;
