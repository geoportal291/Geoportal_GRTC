/**
 * Rutas del dominio de tráfico.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/trafico pasó al app.use del
 * index); los handlers están verbatim, sin reindentar, para que el inventario
 * de rutas pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const path = require('path');
const axios = require('axios');
const tokml = require('tokml');

const db = require('../conexion');
const { deleteFileFromNAS } = require('../services/nasStorageService');
const { upload } = require('../config/multer');
const { authenticateToken, authorizeAdminOrCoordinator, authorizePermission } = require('../middleware/auth');

const router = express.Router();

function sanitizeTrafficPathSegment(value, fallback = 'archivo') {
    const sanitized = String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    return sanitized || fallback;
}

async function uploadTrafficFileToNAS(file, category, description, index, options = {}) {
    try {
        const targetFolder = ['trafico', sanitizeTrafficPathSegment(category, 'general')];
        const descriptionSegment = sanitizeTrafficPathSegment(description, options.defaultDescription || 'archivo');

        if (options.useDescriptionFolder !== false) {
            targetFolder.push(descriptionSegment);
        }

        const originalExtension = path.extname(file.originalname);
        const explicitBaseName = options.fileBaseName
            ? sanitizeTrafficPathSegment(options.fileBaseName, descriptionSegment)
            : null;
        const fallbackBaseName = sanitizeTrafficPathSegment(path.basename(file.originalname, originalExtension), descriptionSegment);
        const fileBaseName = explicitBaseName || fallbackBaseName;
        const fileSuffix = index !== undefined && index !== null && index !== ''
            ? `_${sanitizeTrafficPathSegment(index, '0')}`
            : `_${Date.now()}`;
        const finalFilename = `${fileBaseName}${fileSuffix}${originalExtension}`;

        return await uploadFileToNAS(file.buffer, targetFolder.join('/'), finalFilename);
    } catch (error) {
        console.error(`Error al subir archivo de tráfico (${category}) al NAS:`, error);
        throw new Error(`Error al subir archivo de tráfico (${category}) al NAS`);
    }
}

// Nuevo endpoint para subir imágenes de tráfico
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const imageUrl = await uploadTrafficFileToNAS(req.file, 'general', description, null);
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [stationId, imageUrl, description, upload_date]
        );
        res.status(201).json({ status: 'ok', message: 'Imagen subida y guardada correctamente', imageData: result.rows[0] });
    } catch (error) {
        console.error('Error al subir imagen de tráfico:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir la imagen de tráfico.' });
    }
});

// Nuevo endpoint para subir imágenes de estación de control
router.post('/estacion/upload-image', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date, index } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }

        // Verificar si la estación existe
        const stationExists = await db.query('SELECT id FROM elementos_trafico WHERE id = $1', [stationId]);
        if (stationExists.rows.length === 0) {
            return res.status(404).json({ error: `La estación con id ${stationId} no fue encontrada.` });
        }

        const imageUrl = await uploadTrafficFileToNAS(req.file, 'estacion', description, index);

        //insertar la nueva imagen en la tabla trafico_imagenes
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [stationId, imageUrl, description, upload_date, 'estacion_control']
        );

        res.status(201).json({ status: 'ok', message: 'Imagen de estación subida y guardada correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir imagen de estación de control:', error);
        // Verificar si el error es de clave foránea
        if (error.code === '23503') { // Código de error de PostgreSQL para foreign key violation
            return res.status(400).json({ status: 'error', message: `Error de referencia: la estación con id ${stationId} no existe.` });
        }
        res.status(500).json({ status: 'error', message: 'Error al subir la imagen de estación de control.' });
    }
});

//nuevo endpoint para subir imagenes de tramo
router.post('/tramo/upload-image', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { tramoId, description, upload_date, index } = req.body;
        if (!tramoId) {
            return res.status(400).json({ error: 'tramoId es requerido.' });
        }
        const imageUrl = await uploadTrafficFileToNAS(req.file, 'tramo', description, index);

        // Reutilizamos la tabla trafico_imagenes, guardando el tramoId en la columna station_id
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [tramoId, imageUrl, description, upload_date, 'tramo']
        );

        res.status(201).json({ status: 'ok', message: 'Imagen de tramo subida y guardada correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir imagen de tramo:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir la imagen de tramo.' });
    }
});

//endpoint para subir archivos e imagenes para conteovehicular
router.post('/conteovehicular/upload-file', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date, index, source_type } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const fileUrl = await uploadTrafficFileToNAS(req.file, 'conteovehicular', description, index);

        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [stationId, fileUrl, description, upload_date, source_type]
        );

        res.status(201).json({ status: 'ok', message: 'Archivo de conteo vehicular subido y guardado correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('DEBUG_CONTEO_VEHICULAR_UPLOAD_ERROR:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo de conteo vehicular.' });
    }
});

// Nuevo endpoint para subir archivos Excel de conteo vehicular
router.post('/conteovehicular/upload-excel', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        const { stationId, description } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const excelUrl = await uploadTrafficFileToNAS(req.file, 'reportconteo', stationId, Date.now(), {
            useDescriptionFolder: false,
            fileBaseName: stationId
        });
        const { DateTime } = require('luxon'); // Asegúrate de tener luxon importado al inicio si no lo está
        const upload_date = DateTime.utc().toISODate();

        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [stationId, excelUrl, description || 'Excel Conteo Vehicular', upload_date, 'conteo_vehicular_excel']
        );

        if (req.body.extractedData) {
            try {
                const parsedData = JSON.parse(req.body.extractedData);
                await db.query('UPDATE elementos_trafico SET datos_extraidos = $1 WHERE id = $2', [parsedData, stationId]);
            } catch (jsonErr) {
                console.error("Error guardando datos extraídos en DB:", jsonErr);
            }
        }

        res.status(201).json({ status: 'ok', message: 'Archivo Excel subido correctamente', excelUrl, imageData: result.rows[0] });

        // --- Audit Log: Subida de Archivo de Tráfico ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [req.user.id, 'Subida de Archivo de Tráfico', `Archivo Excel "${description || 'Excel Conteo Vehicular'}" subido para estación ${stationId} por usuario ${req.user.id}. URL: ${excelUrl}`]
        );
        // --- End Audit Log ---
    } catch (error) {
        console.error('Error al subir archivo Excel de conteo vehicular:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo Excel de conteo vehicular.' });
    }
});

// Nuevo endpoint para subir archivos Excel de Origen-Destino
router.post('/encuestaorigendestino/upload-excel', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        const { stationId, description } = req.body;
        if (!stationId) return res.status(400).json({ error: 'stationId es requerido.' });
        const excelUrl = await uploadTrafficFileToNAS(req.file, 'reportorigen', stationId, Date.now(), { useDescriptionFolder: false, fileBaseName: stationId });
        const { DateTime } = require('luxon');
        const upload_date = DateTime.utc().toISODate();
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [stationId, excelUrl, description || 'Excel Origen-Destino', upload_date, 'encuesta_origen_destino_excel']
        );

        if (req.body.extractedData) {
            try {
                const parsedData = JSON.parse(req.body.extractedData);
                await db.query('UPDATE elementos_trafico SET datos_extraidos = $1 WHERE id = $2', [parsedData, stationId]);
            } catch (jsonErr) {
                console.error("Error guardando datos extraídos en DB:", jsonErr);
            }
        }
        res.status(201).json({ status: 'ok', message: 'Archivo Excel OD subido correctamente', excelUrl, imageData: result.rows[0] });
        await db.query('INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [req.user.id, 'Subida de Archivo de Tráfico', `Archivo Excel "${description || 'Excel O-D'}" subido para estación ${stationId} por usuario ${req.user.id}. URL: ${excelUrl}`]);
    } catch (error) {
        console.error('Error al subir archivo Excel OD:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo Excel OD.' });
    }
});

// Nuevo endpoint para subir archivos Excel de Censo de Cargas
router.post('/censodecargas/upload-excel', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        const { stationId, description } = req.body;
        if (!stationId) return res.status(400).json({ error: 'stationId es requerido.' });
        const excelUrl = await uploadTrafficFileToNAS(req.file, 'reportcargas', stationId, Date.now(), { useDescriptionFolder: false, fileBaseName: stationId });
        const { DateTime } = require('luxon');
        const upload_date = DateTime.utc().toISODate();
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [stationId, excelUrl, description || 'Excel Censo de Cargas', upload_date, 'censo_de_cargas_excel']
        );

        if (req.body.extractedData) {
            try {
                const parsedData = JSON.parse(req.body.extractedData);
                await db.query('UPDATE elementos_trafico SET datos_extraidos = $1 WHERE id = $2', [parsedData, stationId]);
            } catch (jsonErr) {
                console.error("Error guardando datos extraídos en DB:", jsonErr);
            }
        }
        res.status(201).json({ status: 'ok', message: 'Archivo Excel Cargas subido correctamente', excelUrl, imageData: result.rows[0] });
        await db.query('INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [req.user.id, 'Subida de Archivo de Tráfico', `Archivo Excel "${description || 'Excel Cargas'}" subido para estación ${stationId} por usuario ${req.user.id}. URL: ${excelUrl}`]);
    } catch (error) {
        console.error('Error al subir archivo Excel Cargas:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo Excel Cargas.' });
    }
});

// Nuevo endpoint para subir archivos Excel de Encuesta de Velocidad
router.post('/encuestavelocidad/upload-excel', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        const { sectionId, description } = req.body;
        if (!sectionId) return res.status(400).json({ error: 'sectionId es requerido.' });
        const excelUrl = await uploadTrafficFileToNAS(req.file, 'reportvelocidad', sectionId, Date.now(), { useDescriptionFolder: false, fileBaseName: sectionId });
        const { DateTime } = require('luxon');
        const upload_date = DateTime.utc().toISODate();
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [sectionId, excelUrl, description || 'Excel Encuesta Velocidad', upload_date, 'encuesta_velocidad_excel']
        );

        if (req.body.extractedData) {
            try {
                const parsedData = JSON.parse(req.body.extractedData);
                await db.query('UPDATE elementos_trafico SET datos_extraidos = $1 WHERE id = $2', [parsedData, sectionId]);
            } catch (jsonErr) {
                console.error("Error guardando datos extraídos en DB:", jsonErr);
            }
        }
        res.status(201).json({ status: 'ok', message: 'Archivo Excel Velocidad subido correctamente', excelUrl, imageData: result.rows[0] });
        await db.query('INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)', [req.user.id, 'Subida de Archivo de Tráfico', `Archivo Excel "${description || 'Excel Velocidad'}" subido para tramo ${sectionId} por usuario ${req.user.id}. URL: ${excelUrl}`]);
    } catch (error) {
        console.error('Error al subir archivo Excel Velocidad:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo Excel Velocidad.' });
    }
});

// Nuevo endpoint para obtener el último archivo Excel de conteo vehicular para una estación
router.get('/conteovehicular/latest-excel/:stationId', async (req, res) => {
    const { stationId } = req.params;
    try {
        const result = await db.query(
            'SELECT image_url FROM trafico_imagenes WHERE station_id = $1 AND source_type = $2 ORDER BY upload_date DESC, id DESC LIMIT 1',
            [stationId, 'conteo_vehicular_excel']
        );
        if (result.rows.length > 0) {
            res.json({ status: 'ok', excelUrl: result.rows[0].image_url });
        } else {
            res.status(404).json({ status: 'error', message: 'No se encontró ningún archivo Excel para esta estación.' });
        }
    } catch (error) {
        console.error('Error al obtener el último archivo Excel:', error);
        res.status(500).json({ status: 'error', message: 'Error al obtener el último archivo Excel.' });
    }
});

// Nuevo endpoint para subir archivos de encuesta origen destino
router.post('/encuestaorigendestino/upload-file', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date, index, source_type } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const fileUrl = await uploadTrafficFileToNAS(req.file, 'encuestaorigendestino', description, index);

        // Insertar el nuevo archivo en la tabla trafico_imagenes
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *'
            , [stationId, fileUrl, description, upload_date, source_type]
        );
        res.status(201).json({ status: 'ok', message: 'Archivo de encuesta origen destino subido y guardado correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir archivo de encuesta origen destino:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo de encuesta origen destino.' });
    }
});

// Nuevo endpoint para subir archivos de censo de cargas
router.post('/censodecargas/upload-file', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { stationId, description, upload_date, index, source_type } = req.body;
        if (!stationId) {
            return res.status(400).json({ error: 'stationId es requerido.' });
        }
        const fileUrl = await uploadTrafficFileToNAS(req.file, 'censodecargas', description, index);

        // Insertar el nuevo archivo en la tabla trafico_imagenes
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *'
            , [stationId, fileUrl, description, upload_date, source_type]
        );
        res.status(201).json({ status: 'ok', message: 'Archivo de censo de cargas subido y guardado correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir archivo de censo de cargas:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo de censo de cargas.' });
    }
});

// Nuevo endpoint para subir archivos de encuesta de velocidad
router.post('/encuestavelocidad/upload-file', authenticateToken, authorizePermission('trafico', 'edicion'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }
        const { sectionId, description, upload_date, index, source_type } = req.body;
        if (!sectionId) {
            return res.status(400).json({ error: 'sectionId es requerido.' });
        }
        const fileUrl = await uploadTrafficFileToNAS(req.file, 'encuestavelocidad', description, index);

        // Insertar el nuevo archivo en la tabla trafico_imagenes
        const result = await db.query(
            'INSERT INTO trafico_imagenes (station_id, image_url, description, upload_date, source_type) VALUES ($1, $2, $3, $4, $5) RETURNING *'
            , [sectionId, fileUrl, description, upload_date, source_type]
        );
        res.status(201).json({ status: 'ok', message: 'Archivo de encuesta de velocidad subido y guardado correctamente', imageData: { ...result.rows[0], index } });
    } catch (error) {
        console.error('Error al subir archivo de encuesta de velocidad:', error);
        res.status(500).json({ status: 'error', message: 'Error al subir el archivo de encuesta de velocidad.' });
    }
});

// Nuevo endpoint para eliminar un grupo de imágenes de tráfico
router.delete('/delete-image-group', async (req, res) => {
    const { stationId, description, uploadDate } = req.body;
    try {
        const imagesResult = await db.query(
            'SELECT image_url FROM trafico_imagenes WHERE station_id = $1 AND description = $2 AND upload_date = $3',
            [stationId, description, uploadDate]
        );

        for (const row of imagesResult.rows) {
            try {
                await deleteFileFromNAS(row.image_url);
            } catch (nasError) {
                console.warn(`No se pudo eliminar el archivo del NAS: ${row.image_url}.`, nasError.message);
            }
        }

        const result = await db.query(
            'DELETE FROM trafico_imagenes WHERE station_id = $1 AND description = $2 AND upload_date = $3',
            [stationId, description, uploadDate]
        );

        if (result.rowCount > 0) {
            res.status(200).json({ status: 'ok', message: 'Grupo de imágenes eliminado correctamente.' });
        } else {
            res.status(404).json({ status: 'error', message: 'No se encontró el grupo de imágenes para eliminar.' });
        }
    } catch (error) {
        console.error('Error al eliminar el grupo de imágenes:', error);
        res.status(500).json({ status: 'error', message: 'Error al eliminar el grupo de imágenes.' });
    }
});

// Nuevo endpoint para eliminar una imagen individual de tráfico
router.delete('/delete-image', async (req, res) => {
    const { imageUrl } = req.body;
    try {
        try {
            await deleteFileFromNAS(imageUrl);
        } catch (nasError) {
            console.warn(`No se pudo eliminar el archivo del NAS: ${imageUrl}.`, nasError.message);
        }

        // Eliminar de la base de datos
        const result = await db.query(
            'DELETE FROM trafico_imagenes WHERE image_url = $1',
            [imageUrl]
        );
        if (result.rowCount > 0) {
            res.status(200).json({ status: 'ok', message: 'Imagen eliminada correctamente.' });
        } else {
            res.status(404).json({ status: 'error', message: 'No se encontró la imagen para eliminar.' });
        }
    } catch (error) {
        console.error('Error al eliminar la imagen:', error);
        res.status(500).json({ status: 'error', message: 'Error al eliminar la imagen.' });
    }
});

router.post('/exportar-kml', authenticateToken, (req, res) => {
    console.log('INFO: Se ha recibido una solicitud en /api/trafico/exportar-kml'); // Log de entrada
    const geojsonData = req.body;
    if (!geojsonData) {
        console.error('ERROR: No se proporcionaron datos GeoJSON en la solicitud.');
        return res.status(400).json({ error: 'No se proporcionaron datos GeoJSON.' });
    }

    try {
        const kmlData = tokml(geojsonData, {
            name: 'nombre', // Usa la propiedad 'nombre' de cada feature como el nombre del lugar
            description: 'descripcion', // Usa la propiedad 'descripcion' para la descripción
            documentName: 'Exportacion Geoportal',
            documentDescription: 'Archivo KML exportado desde Geoportal',
            simplestyle: true
        });

        res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        res.setHeader('Content-Disposition', 'attachment; filename="export.kml"');
        res.send(kmlData);
        console.log('INFO: Se ha exportado el archivo KML correctamente.');
    } catch (error) {
        console.error('ERROR: Fallo en la conversión a KML:', error.stack);
        res.status(500).json({ error: 'Error interno al generar el archivo KML.' });
    }
});

router.post('/exportar-shapefile', authenticateToken, async (req, res) => {
    console.log('INFO: Solicitud recibida para exportar Shapefile (usando shp-write)');
    const geojsonData = req.body;
    if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos GeoJSON válidos o están vacíos.' });
    }

    try {
        const uniqueExportId = Date.now();
        const shpWrite = require('@mapbox/shp-write');

        // zip() maneja múltiples tipos de geometrías y los separa en carpetas automáticamente
        const zipBuffer = await shpWrite.zip({
            type: 'FeatureCollection',
            features: geojsonData.features
        }, {
            folder: 'geoportal_export',
            outputType: 'nodebuffer',
            types: {
                point: 'mypoints',
                polygon: 'mypolygons',
                line: 'mylines'
            }
        });

        // Configurar la respuesta para la descarga
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="geoportal_shapefiles_${uniqueExportId}.zip"`);

        // Enviar el ZIP binario real para evitar archivos corruptos.
        res.send(zipBuffer);
        console.log('INFO: Archivo Shapefile (ZIP) generado y enviado correctamente.');

    } catch (error) {
        console.error('ERROR: Fallo en la exportación a Shapefile con shpWrite:', error.stack || error);
        res.status(500).json({ error: `Error interno al generar el archivo Shapefile: ${error.message || error}` });
    }
});

// Endpoint para obtener el trazado más reciente
router.get('/obtener-trazado', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT nombre, ST_AsGeoJSON(geom) AS geojson
            FROM rutas
            ORDER BY id DESC
            LIMIT 1;
        `);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'No se encontró ningún trazado.' });
        }
    } catch (err) {
        console.error('Error al obtener trazado:', err);
        res.status(500).json({ status: 'error', message: 'Error al obtener el trazado del servidor', details: err.message });
    }
});

// --------------------- TRAZADO DE MAPA ---------------------
router.post('/guardar-trazado', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { nombre, puntos } = req.body; // puntos será un array de {lat, lng}

    if (!nombre || !puntos || !Array.isArray(puntos) || puntos.length < 2) {
        return res.status(400).json({ error: 'Nombre y al menos dos puntos son requeridos para el trazado.' });
    }

    try {
        // Construir la cadena de puntos para ST_MakeLine
        // ST_MakePoint(longitude, latitude)
        const pointStrings = puntos.map(p => `ST_MakePoint(${p.lng}, ${p.lat})`).join(', ');

        const query = `
            INSERT INTO rutas (nombre, geom)
            VALUES ($1, ST_SetSRID(ST_MakeLine(ARRAY[${pointStrings}]), 4326))
            RETURNING id;
        `;

        const result = await db.query(query, [nombre]);
        res.status(201).json({ status: 'ok', message: 'Trazado guardado correctamente', id: result.rows[0].id });
    } catch (err) {
        console.error('Error al guardar trazado:', err);
        res.status(500).json({ status: 'error', message: 'Error al guardar el trazado en el servidor', details: err.message });
    }
});

router.delete('/delete-image', authenticateToken, async (req, res) => {
    const { stationId, imageUrl } = req.body;
    try {
        try {
            await deleteFileFromNAS(imageUrl);
        } catch (nasError) {
            console.warn(`No se pudo eliminar el archivo del NAS: ${imageUrl}.`, nasError.message);
        }

        const result = await db.query('DELETE FROM trafico_imagenes WHERE station_id = $1 AND image_url = $2', [stationId, imageUrl]);
        if (result.rowCount > 0) {
            res.json({ status: 'ok', message: 'Imagen eliminada correctamente' });
        } else {
            res.status(404).json({ status: 'error', message: 'Imagen no encontrada' });
        }
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({ status: 'error', message: 'Error al eliminar la imagen.' });
    }
});

// Nueva ruta para eliminar un grupo de imágenes
router.delete('/delete-image-group', authenticateToken, async (req, res) => {
    const { stationId, description, uploadDate } = req.body;
    try {
        const imagesResult = await db.query(
            'SELECT image_url FROM trafico_imagenes WHERE station_id = $1 AND description = $2 AND upload_date = $3',
            [stationId, description, uploadDate]
        );

        for (const row of imagesResult.rows) {
            try {
                await deleteFileFromNAS(row.image_url);
            } catch (nasError) {
                console.warn(`No se pudo eliminar el archivo del NAS: ${row.image_url}.`, nasError.message);
            }
        }

        const result = await db.query('DELETE FROM trafico_imagenes WHERE station_id = $1 AND description = $2 AND upload_date = $3', [stationId, description, uploadDate]);
        if (result.rowCount > 0) {
            res.json({ status: 'ok', message: `Se eliminaron ${result.rowCount} imágenes del grupo.` });
        } else {
            res.status(404).json({ status: 'error', message: 'No se encontraron imágenes para eliminar en este grupo.' });
        }
    } catch (error) {
        console.error('Error al eliminar grupo de imágenes:', error);
        res.status(500).json({ status: 'error', message: 'Error al eliminar el grupo de imágenes.' });
    }
});

router.get('/download-excel', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('URL query parameter is required.');
        }

        // Use axios to fetch the file as a stream
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        // Set the content type from the original response
        res.setHeader('Content-Type', response.headers['content-type']);
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }
        if (response.headers['content-disposition']) {
            res.setHeader('Content-Disposition', response.headers['content-disposition']);
        } else {
            const pathname = new URL(url).pathname;
            const fallbackFilename = decodeURIComponent(path.basename(pathname)) || 'archivo';
            res.setHeader('Content-Disposition', `attachment; filename="${fallbackFilename}"`);
        }
        // Pipe the stream to the response
        response.data.pipe(res);

    } catch (error) {
        console.error('Error proxying Excel download:', error);
        res.status(500).send('Error downloading file.');
    }
});

module.exports = router;
