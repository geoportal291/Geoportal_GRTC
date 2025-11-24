const db = require('../conexion');
const XLSX = require('xlsx');

const uploadAlcantarillasE1Data = async (excelBuffer, userId, proyectoId) => {
    try {
        const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false }); // raw: false para obtener valores formateados

        if (!proyectoId) {
            throw new Error('El ID del proyecto es requerido para la carga de datos de alcantarillas E1.');
        }

        await db.query('BEGIN'); // Iniciar transacción

        let insertedCount = 0;
        for (const row of worksheet) {
            // Extraer datos comunes para inventario_vial_elementos
            // Asumo que el Excel puede tener columnas como 'CODIGO', 'LATITUD', 'LONGITUD', 'PROGRESIVA', 'DESCRIPCION', 'ESTADO'
            // Si no existen, serán NULL.
            const codigo_elemento = row['CODIGO'] || null;
            const latitud = row['LATITUD'] || null;
            const longitud = row['LONGITUD'] || null;
            const progresiva = row['PROGRESIVA'] || null;
            const descripcion_general = row['DESCRIPCION'] || null;
            const estado_conservacion = row['ESTADO'] || null;

            // Insertar en inventario_vial_elementos
            const elementInsertResult = await db.query(
                `INSERT INTO inventario_vial_elementos (
                    proyecto_id, tipo_elemento, codigo_elemento, descripcion_general,
                    latitud, longitud, progresiva, estado_conservacion, usuario_registro_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [
                    proyectoId, 'ALCANTARILLA', codigo_elemento, descripcion_general,
                    latitud, longitud, progresiva, estado_conservacion, userId
                ]
            );
            const elementoVialId = elementInsertResult.rows[0].id;

            // Extraer datos específicos para inventario_vial_alcantarillas
            // Asumo que el Excel puede tener columnas como 'TIPO_ALCANTARILLA', 'MATERIAL', 'DIAMETRO_LUZ', etc.
            const tipo_alcantarilla = row['TIPO_ALCANTARILLA'] || null;
            const material = row['MATERIAL'] || null;
            const diametro_luz = row['DIAMETRO_LUZ'] || null;
            const longitud_alcantarilla = row['LONGITUD_ALCANTARILLA'] || null; // Renombrado para evitar conflicto
            const altura = row['ALTURA'] || null;
            const ancho = row['ANCHO'] || null;
            const condicion_estructura = row['CONDICION_ESTRUCTURA'] || null;
            const condicion_hidraulica = row['CONDICION_HIDRAULICA'] || null;
            const fecha_ultima_inspeccion = row['FECHA_ULTIMA_INSPECCION'] ? new Date(row['FECHA_ULTIMA_INSPECCION']) : null; // Convertir a Date

            // Insertar en inventario_vial_alcantarillas
            await db.query(
                `INSERT INTO inventario_vial_alcantarillas (
                    elemento_vial_id, tipo_alcantarilla, material, diametro_luz,
                    longitud, altura, ancho, condicion_estructura, condicion_hidraulica,
                    data_excel_json, fecha_ultima_inspeccion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    elementoVialId, tipo_alcantarilla, material, diametro_luz,
                    longitud_alcantarilla, altura, ancho, condicion_estructura, condicion_hidraulica,
                    row, // Almacenar la fila completa del Excel como JSONB
                    fecha_ultima_inspeccion
                ]
            );
            insertedCount++;
        }

        await db.query('COMMIT'); // Confirmar la transacción

        return { message: `Archivo Excel procesado. ${insertedCount} registros de alcantarillas insertados.`, data: worksheet };

    } catch (error) {
        await db.query('ROLLBACK'); // Revertir la transacción en caso de error
        console.error('Error en uploadAlcantarillasE1Data:', error);
        throw new Error('Error al procesar y guardar el archivo Excel para Alcantarillas E1: ' + error.message);
    }
};
const getAlcantarillasE1Data = async (proyectoId) => {
    try {
        let query = `
            SELECT
                ive.id as elemento_vial_id,
                ive.proyecto_id,
                ive.tipo_elemento,
                ive.codigo_elemento,
                ive.descripcion_general,
                ive.latitud,
                ive.longitud,
                ive.progresiva,
                ive.estado_conservacion,
                ive.fecha_registro,
                ive.usuario_registro_id,
                ive.observaciones,
                ive.data_adicional_json,
                iva.id as alcantarilla_id,
                iva.tipo_alcantarilla,
                iva.material,
                iva.diametro_luz,
                iva.longitud as longitud_alcantarilla,
                iva.altura,
                iva.ancho,
                iva.condicion_estructura,
                iva.condicion_hidraulica,
                iva.data_excel_json,
                iva.fecha_ultima_inspeccion
            FROM
                inventario_vial_elementos ive
            JOIN
                inventario_vial_alcantarillas iva ON ive.id = iva.elemento_vial_id
            WHERE
                ive.tipo_elemento = 'ALCANTARILLA'
        `;
        const values = [];

        if (proyectoId) {
            query += ' AND ive.proyecto_id = $1';
            values.push(proyectoId);
        }

        query += ' ORDER BY ive.fecha_registro DESC';

        const result = await db.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error en getAlcantarillasE1Data:', error);
        throw new Error('Error al obtener datos de Alcantarillas E1.');
    }
};
module.exports = {
    uploadAlcantarillasE1Data,
    getAlcantarillasE1Data,
};