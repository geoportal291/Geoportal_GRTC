const db = require('../conexion');
const xlsx = require('xlsx');
const axios = require('axios');
const { toLatLon } = require('utm');

const badenesService = {
    processExcelAndSaveBadenes: async (fileBuffer, projectId, utmZone) => {
        try {
            // El archivo se recibe como un buffer, no se necesita descarga
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = 'OBR. ARTE';
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new Error(`La hoja '${sheetName}' no se encontró en el archivo Excel.`);
            }

            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            const badenesData = [];

            // Iterar desde la fila 12 (índice 11)
            for (let i = 11; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row) continue;

                const claseCell = row[16]; // Columna Q
                console.log(`DEBUG: Fila ${i + 1}, Columna Q, Valor: '${claseCell}'`);

                if (typeof claseCell === 'string' && claseCell.toLowerCase().includes('baden')) {
                    console.log(`DEBUG: 'baden' encontrada en la fila ${i + 1}. Procesando fila...`);

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

                    console.log(`DEBUG: Fila ${i + 1}, Easting: ${easting}, Northing: ${northing}, utmZone received: ${utmZone}`);
                    const zoneNum = parseInt(utmZone.slice(0, -1));
                    const zoneLetter = utmZone.slice(-1);
                    console.log(`DEBUG: Fila ${i + 1}, Parsed zoneNum: ${zoneNum}, Parsed zoneLetter: ${zoneLetter}`);
                    const latLon = toLatLon(easting, northing, zoneNum, zoneLetter);
                    console.log(`DEBUG: Fila ${i + 1}, Lat/Lon convertidas:`, latLon);

                    const baden = {
                        id_proyecto: projectId,
                        codigo: codigo_extraido, // Extraído de la Columna Q
                        clase: row[17] || null, // Columna R
                        tipo: row[18] || null, // Columna S
                        material: null, // No especificado en el nuevo mapeo
                        diametro_lado: row[21] || null, // Columna V
                        longitud_baden: parseFloat(String(row[22]).replace(/,/g, '')) || null, // Columna W 
                        estado: row[19] || null, // Columna T
                        observaciones: row[28] || null, // Columna AC
                        progresiva: row[15] || null, // Columna P
                        latitud: latLon.latitude,
                        longitud: latLon.longitude,
                        luz: row[20] || null, // Columna U
                        alto: row[22] || null, // Columna W
                        ancho: row[23] || null, // Columna X
                        altitud: row[26] || null, // Columna AA
                        caracteristicas: row[27] || null, // Columna AB
                        panel_fotografico_codigo: row[13] || null, // Columna N
                    };

                    console.log(`DEBUG: Fila ${i + 1}, Datos extraídos:`, baden);

                    if (isNaN(baden.latitud) || isNaN(baden.longitud)) {
                        console.warn(`Fila ${i + 1}: Latitud o Longitud inválida para el badén con código ${baden.codigo || 'N/A'}. Saltando.`);
                        continue;
                    }

                    badenesData.push(baden);
                }
            }

            if (badenesData.length === 0) {
                return { message: 'No se encontraron datos de badenes válidos para importar.', count: 0 };
            }

            // Insertar datos en la base de datos
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query('DELETE FROM badenes WHERE id_proyecto = $1', [projectId]);

                const insertPromises = badenesData.map(b =>
                    client.query(
                        `INSERT INTO badenes (
                            id_proyecto, codigo, tipo, material, diametro_lado, longitud_baden,
                            estado, observaciones, progresiva, latitud, longitud,
                            luz, alto, ancho, altitud, caracteristicas, clase, panel_fotografico_codigo
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id_baden`,
                        [
                            b.id_proyecto, b.codigo, b.tipo, b.material, b.diametro_lado, b.longitud_baden,
                            b.estado, b.observaciones, b.progresiva, b.latitud, b.longitud,
                            b.luz, b.alto, b.ancho, b.altitud, b.caracteristicas, b.clase, b.panel_fotografico_codigo
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
                    luz, alto, ancho, altitud, caracteristicas, clase, panel_fotografico_codigo
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
                [
                    data.id_proyecto, data.codigo, data.tipo, data.material, data.diametro_lado, data.longitud_baden,
                    data.estado, data.observaciones, data.progresiva, data.latitud, data.longitud,
                    data.luz, data.alto, data.ancho, data.altitud, data.caracteristicas, data.clase, data.panel_fotografico_codigo
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
                'luz', 'alto', 'ancho', 'altitud', 'caracteristicas', 'clase', 'panel_fotografico_codigo'
            ];

            for (const field of updatableFields) {
                if (data[field] !== undefined && data[field] !== null) {
                    fields.push(`${field} = $${fieldIndex++}`);
                    values.push(data[field]);
                }
            }

            if (fields.length === 0) {
                // Si no hay campos para actualizar, simplemente retorna la data actual.
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
    }
};

module.exports = badenesService;
