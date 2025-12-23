const db = require('../conexion');
const xlsx = require('xlsx');
const axios = require('axios');
const { toLatLon } = require('utm');

const alcantarillasService = {
    processExcelAndSaveAlcantarillas: async (fileBuffer, projectId, utmZone, entregableDefault) => {
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

            // Find Header Row and Map Columns
            let headerRowIndex = 11; // Default fallback (Row 12)
            const colMap = {
                codigo: 16, // Q
                clase: 17, // R
                tipo: 18, // S
                estado: 19, // T
                longitud: 20, // U
                diametro: 21, // V
                alto: 22, // W
                luz: 23, // X
                easting: 24, // Y
                northing: 25, // Z
                altitud: 26, // AA
                caracteristicas: 27, // AB
                observaciones: 28, // AC
                panel: 13, // N
                entregable: 12, // M
                progresiva: 15 // P
            };

            // Heuristic search for header row
            for (let i = 0; i < 20; i++) {
                const row = jsonData[i];
                if (!row) continue;
                if (row.some(c => typeof c === 'string' && c.toUpperCase().includes('ALCANTARILLA') && c.toUpperCase().includes('CLASE'))) {
                    headerRowIndex = i;
                    // Dynamic Mapping can be added here if needed, for now we stick to observed defaults 
                    // but we verify 'Entregable' specifically
                    const entIdx = row.findIndex(c => typeof c === 'string' && c.toUpperCase().includes('ENTREGABLE'));
                    if (entIdx !== -1) colMap.entregable = entIdx;
                    break;
                }
            }

            // Iterar desde la fila siguiente al header
            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row) continue;

                const claseCell = row[colMap.codigo];

                if (typeof claseCell === 'string' && claseCell.toLowerCase().includes('alcantarilla')) {

                    let codigo_extraido = null;
                    const match = claseCell.match(/(?:N°|No\.|Nº)\s*(\d+)/i);
                    if (match && match[1]) {
                        codigo_extraido = match[1];
                    } else {
                        const genericMatch = claseCell.match(/\d+/);
                        if (genericMatch) codigo_extraido = genericMatch[0];
                    }

                    const easting = parseFloat(String(row[colMap.easting]).replace(/,/g, ''));
                    const northing = parseFloat(String(row[colMap.northing]).replace(/,/g, ''));

                    const zoneNum = parseInt(utmZone.slice(0, -1));
                    const zoneLetter = utmZone.slice(-1);
                    const latLon = toLatLon(easting, northing, zoneNum, zoneLetter);

                    // Determine Entregable: Excel value > Fallback to passed default
                    let entregableVal = row[colMap.entregable];
                    if (!entregableVal && entregableDefault) {
                        entregableVal = `E-${entregableDefault}`; // Standardize format E-1, E-2
                    }
                    if (entregableVal && !String(entregableVal).toUpperCase().startsWith('E-') && !String(entregableVal).toUpperCase().startsWith('ENTREGABLE')) {
                        // If it's just a number like '1' or '2', prefix it? 
                        // Assuming user might pass '1' for E-1.
                        // But usually Excel has 'E-1'.
                        // Let's rely on what's there if present, or Default.
                    }
                    // normalize entregable from default if needed (e.g. if default is '1', make it 'E-1')
                    if (!entregableVal && entregableDefault) entregableVal = `E-${entregableDefault}`;

                    const alcantarilla = {
                        id_proyecto: projectId,
                        codigo: codigo_extraido,
                        clase: row[colMap.clase] || null,
                        tipo: row[colMap.tipo] || null,
                        material: null,
                        diametro_lado: row[colMap.diametro] || null,
                        longitud_alcantarilla: parseFloat(String(row[colMap.longitud]).replace(/,/g, '')) || null,
                        estado: row[colMap.estado] || null,
                        observaciones: row[colMap.observaciones] || null,
                        progresiva: row[colMap.progresiva] || null,
                        latitud: latLon.latitude,
                        longitud: latLon.longitude,
                        luz: row[colMap.luz] || null,
                        alto: parseFloat(String(row[colMap.alto]).replace(/,/g, '')) || null,
                        ancho: row[colMap.luz] || null, // Assuming ancho and luz might be mapped similarly or redundant
                        altitud: row[colMap.altitud] || null,
                        caracteristicas: row[colMap.caracteristicas] || null,
                        panel_fotografico_codigo: row[colMap.panel] || null,
                        entregable: entregableVal,
                    };

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
    },


    deleteAlcantarilla: async (id) => {
        try {
            const result = await db.query('DELETE FROM alcantarillas WHERE id_alcantarilla = $1', [id]);
            return result.rowCount;
        } catch (error) {
            console.error(`Error al eliminar alcantarilla ${id}:`, error);
            throw new Error('Error al eliminar alcantarilla de la base de datos.');
        }
    }
};

module.exports = alcantarillasService;
