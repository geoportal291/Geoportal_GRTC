/**
 * Rutas del dominio de alcantarillas.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/alcantarillas pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fsp = require('fs').promises;
const db = require('../conexion');
const alcantarillasService = require('../services/alcantarillasService');
const alcantarillasGraphicsService = require('../services/alcantarillasGraphicsService');
const interferenciasService = require('../services/interferenciasService');
const badenesService = require('../services/badenesService');
const puentesService = require('../services/puentesService');
const murosService = require('../services/murosService');
const { put, del } = require('@vercel/blob');
const { upload, uploadDisk } = require('../config/multer');
const { authenticateToken, authorizePermission } = require('../middleware/auth');

const router = express.Router();

// Nueva función para subir archivos Excel de alcantarillas a Vercel Blob
async function uploadAlcantarillasExcelToVercelBlob(fileBuffer, originalFilename, projectId) {
    try {
        const originalExtension = path.extname(originalFilename);
        const filename = `tramoinv/invexcel/${projectId}_${Date.now()}${originalExtension}`;
        const blob = await put(filename, fileBuffer, {
            access: 'public',
            allowOverwrite: true,
        });
        return blob.url;
    } catch (error) {
        console.error('Error al subir archivo Excel de alcantarillas a Vercel Blob:', error);
        throw new Error('Error al subir archivo Excel de alcantarillas a Vercel Blob');
    }
}

// Nuevo endpoint para subir archivos Excel de alcantarillas
router.post('/upload-excel', authenticateToken, authorizePermission('alcantarillas', 'edicion'), upload.single('excelFile'), async (req, res) => {
    const { projectId, utmZone, entregableNum } = req.body;
    const userId = req.user.id;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        if (!projectId) {
            return res.status(400).json({ error: 'projectId es requerido.' });
        }
        if (!entregableNum) {
            return res.status(400).json({ error: 'entregableNum es requerido.' });
        }

        const fileBuffer = req.file.buffer;

        // Procesar los 4 tipos de elementos con el entregable por defecto si es necesario
        const processResultAlcantarillas = await alcantarillasService.processExcelAndSaveAlcantarillas(fileBuffer, projectId, utmZone, entregableNum);
        const processResultBadenes = await badenesService.processExcelAndSaveBadenes(fileBuffer, projectId, utmZone, entregableNum);
        const processResultPuentes = await puentesService.processExcelAndSavePuentes(fileBuffer, projectId, utmZone, entregableNum);
        const processResultMuros = await murosService.processExcelAndSaveMuros(fileBuffer, projectId, utmZone, entregableNum);
        const processResultInterferencias = await interferenciasService.processExcelAndSaveInterferencias(fileBuffer, projectId);

        // Subir el archivo a Vercel Blob
        const excelUrl = await uploadAlcantarillasExcelToVercelBlob(fileBuffer, req.file.originalname, projectId);

        // Guardar la URL en la tabla invvial_excels
        await db.query(
            `INSERT INTO invvial_excels (id_proyecto, excel_url, entregable_num, uploaded_by_user_id, original_filename)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id_proyecto, entregable_num)
             DO UPDATE SET 
                excel_url = EXCLUDED.excel_url,
                uploaded_at = NOW(),
                uploaded_by_user_id = EXCLUDED.uploaded_by_user_id,
                original_filename = EXCLUDED.original_filename`,
            [projectId, excelUrl, entregableNum, userId, req.file.originalname]
        );

        const finalMessage = `Archivo Excel procesado. ${processResultAlcantarillas.message}. ${processResultBadenes.message}. ${processResultPuentes.message}. ${processResultMuros.message}. ${processResultInterferencias.message}.`;

        // --- Audit Log ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Subida de Archivo Excel de Inventario Vial', `Archivo subido para proyecto ${projectId}. URL: ${excelUrl}. Resultados: ${finalMessage}`]
        );
        // --- End Audit Log ---

        res.status(201).json({
            status: 'ok',
            message: finalMessage,
            excelUrl,
            processResult: {
                alcantarillas: processResultAlcantarillas,
                badenes: processResultBadenes,
                puentes: processResultPuentes,
                muros: processResultMuros,
                interferencias: processResultInterferencias
            },
            fileInfo: {
                excel_url: excelUrl,
                original_filename: req.file.originalname
            }
        });
    } catch (error) {
        console.error('Error en la ruta /api/alcantarillas/upload-excel:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al subir el archivo Excel de inventario vial.' });
    }
});

// Nuevo endpoint para subir archivos Excel de gráficos de alcantarillas (AHORA ASÍNCRONO)
router.post('/upload-graphics-excel', authenticateToken, authorizePermission('alcantarillas', 'edicion'), upload.single('excelFile'), async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user.id;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo Excel.' });
        }
        if (!projectId) {
            return res.status(400).json({ error: 'projectId es requerido.' });
        }

        const jobPayload = {
            filePath: req.file.path,
            originalName: req.file.originalname,
            userId: userId,
            entregable: req.body.entregable || null
        };
        const jobType = path.extname(req.file.originalname).toLowerCase() === '.rar' ? 'rar_extraction' : 'simple_file_upload';

        const newJob = await db.query(
            `INSERT INTO processing_jobs (job_type, project_id, status, payload)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [jobType, projectId, 'pending', jobPayload]
        );
        const jobId = newJob.rows[0].id;

        if (jobType === 'rar_extraction') {
            alcantarillasGraphicsService.processRarExtractionJob(jobId).catch(err => console.error(`Error no controlado en el job de extracción RAR (Job ID: ${jobId}):`, err));
        } else {
            alcantarillasGraphicsService.processSimpleUploadJob(jobId).catch(err => console.error(`Error no controlado en el job de subida simple (Job ID: ${jobId}):`, err));
        }

        res.status(202).json({
            status: 'ok',
            message: 'Archivo recibido. El procesamiento ha comenzado en segundo plano.',
            jobId: jobId
        });
    } catch (error) {
        console.error('Error en la ruta /api/alcantarillas/upload-graphics-excel:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al iniciar el procesamiento del archivo.' });
    }
});

const uploadChunk = multer({ storage: multer.memoryStorage() });

router.post('/upload-chunk', authenticateToken, authorizePermission('alcantarillas', 'edicion'), uploadChunk.single('fileChunk'), async (req, res) => {
    try {
        const { uploadId, chunkIndex } = req.body;
        const chunkBuffer = req.file.buffer;

        if (!uploadId || !chunkIndex || chunkBuffer === undefined) {
            return res.status(400).json({ error: 'uploadId, chunkIndex, and fileChunk are required.' });
        }

        const chunkDir = path.join('/tmp', uploadId);
        await fsp.mkdir(chunkDir, { recursive: true });
        const chunkPath = path.join(chunkDir, `chunk_${chunkIndex}`);
        await fsp.writeFile(chunkPath, chunkBuffer);
        res.status(200).json({ status: 'ok', message: 'Chunk received.' });
    } catch (error) {
        console.error('Error saving chunk:', error);
        res.status(500).json({ status: 'error', message: 'Failed to save chunk.' });
    }
});

router.post('/complete-upload', authenticateToken, authorizePermission('alcantarillas', 'edicion'), async (req, res) => {
    const { projectId, uploadId, originalFilename, entregable } = req.body;
    const userId = req.user.id;

    if (!projectId || !uploadId || !originalFilename) {
        return res.status(400).json({ error: 'projectId, uploadId, and originalFilename are required.' });
    }

    try {
        const result = await alcantarillasGraphicsService.reassembleAndProcessChunks(projectId, uploadId, originalFilename, userId, entregable);
        res.status(202).json(result);
    } catch (error) {
        console.error('Error al completar la subida por chunks:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al ensamblar el archivo.' });
    }
});

router.post('/upload-images', authenticateToken, authorizePermission('alcantarillas', 'edicion'), uploadDisk.single('files'), async (req, res) => {
    const { projectId, entregable } = req.body;
    const userId = req.user.id;

    try {
        if (!req.file) {
            console.log('DEBUG MANUAL UPLOAD: No file received in req.file');
            return res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        }

        console.log('DEBUG MANUAL UPLOAD: req.file:', {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size
        });

        if (!projectId) {
            return res.status(400).json({ error: 'projectId es requerido.' });
        }

        const jobPayload = {
            filePath: req.file.path,
            originalName: req.file.originalname,
            userId: userId,
            entregable: entregable || null
        };
        const jobType = path.extname(req.file.originalname).toLowerCase() === '.rar' ? 'rar_extraction' : 'simple_file_upload';

        const newJob = await db.query(
            `INSERT INTO processing_jobs (job_type, project_id, status, payload)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [jobType, projectId, 'pending', jobPayload]
        );
        const jobId = newJob.rows[0].id;

        if (jobType === 'rar_extraction') {
            alcantarillasGraphicsService.processRarExtractionJob(jobId).catch(err => console.error(`Error no controlado en el job de extracción RAR (Job ID: ${jobId}):`, err));
        } else {
            alcantarillasGraphicsService.processSimpleUploadJob(jobId).catch(err => console.error(`Error no controlado en el job de subida simple (Job ID: ${jobId}):`, err));
        }

        res.status(202).json({
            status: 'ok',
            message: 'Archivo recibido. Procesamiento iniciado.',
            jobId: jobId
        });

    } catch (error) {
        console.error(`Error en la ruta POST /api/alcantarillas/upload-images:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al subir la imagen.' });
    }
});

router.delete('/graphics/:imageId', authenticateToken, async (req, res) => {
    const { imageId } = req.params;
    const { projectId } = req.query;
    const userId = req.user.id;

    try {
        const result = await alcantarillasGraphicsService.deleteGraphicImage(imageId, projectId);

        // --- Audit Log: Eliminación de Imagen de Gráfico de Alcantarillas ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación de Imagen de Gráfico de Alcantarillas', `Imagen de gráfico ${imageId} eliminada para proyecto ${projectId} por usuario ${userId}.`]
        );
        // --- End Audit Log ---

        res.status(200).json({ status: 'ok', message: result.message });
    } catch (error) {
        console.error(`Error en la ruta DELETE /api/alcantarillas/graphics/${imageId}:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar la imagen de gráfico.' });
    }
});

router.delete('/graphics/all/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    try {
        const result = await alcantarillasGraphicsService.deleteAllGraphicImages(projectId);

        // --- Audit Log: Eliminación de Todas las Imágenes de Gráfico de Alcantarillas ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación de Todas las Imágenes de Gráfico de Alcantarillas', `Todas las imágenes de gráfico eliminadas para proyecto ${projectId} por usuario ${userId}.`]
        );
        // --- End Audit Log ---

        res.status(200).json({ status: 'ok', message: result.message });
    } catch (error) {
        console.error(`Error en la ruta DELETE /api/alcantarillas/graphics/all/${projectId}:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar todas las imágenes de gráfico.' });
    }
});

// NEW: Endpoint to delete graphic images by folder (deliverable)
router.delete('/graphics/folder/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { entregable } = req.body;
    const userId = req.user.id;

    if (!entregable) {
        return res.status(400).json({ error: 'El entregable es requerido.' });
    }

    try {
        const result = await alcantarillasGraphicsService.deleteGraphicImagesByFolder(projectId, entregable);

        // --- Audit Log ---
        await db.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación selectiva de Gráficos', `Imágenes de entregable ${entregable} eliminadas para proyecto ${projectId}.`]
        );

        res.status(200).json({ status: 'ok', message: result.message });
    } catch (error) {
        console.error(`Error en DELETE /api/alcantarillas/graphics/folder/${projectId}:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar imágenes por carpeta.' });
    }
});

// NEW: Endpoint to get all graphic images for a project
router.get('/graphics/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const images = await alcantarillasGraphicsService.getGraphicsImagesByProjectId(projectId);
        res.status(200).json(images);
    } catch (error) {
        console.error(`Error en la ruta GET /api/alcantarillas/graphics/${projectId}:`, error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al obtener imágenes de gráfico.' });
    }
});

// Endpoint para crear una nueva alcantarilla
router.post('/', authenticateToken, async (req, res) => {
    try {
        const newAlcantarilla = await alcantarillasService.createAlcantarilla(req.body);
        res.status(201).json(newAlcantarilla);
    } catch (error) {
        console.error('Error al crear alcantarilla:', error);
        res.status(500).json({ error: 'Error al crear alcantarilla', details: error.message });
    }
});

// Endpoint para actualizar una alcantarilla existente
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updatedAlcantarilla = await alcantarillasService.updateAlcantarilla(id, req.body);
        if (updatedAlcantarilla) {
            res.json(updatedAlcantarilla);
        } else {
            res.status(404).json({ error: 'Alcantarilla no encontrada' });
        }
    } catch (error) {
        console.error(`Error al actualizar alcantarilla ${id}:`, error);
        res.status(500).json({ error: 'Error al actualizar alcantarilla', details: error.message });
    }
});

// NEW: Endpoint para eliminar el archivo Excel de alcantarillas y sus datos asociados
router.delete('/delete-excel/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    const { entregableNum, tipos } = req.query; // Get entregableNum and tipos from query
    const userId = req.user.id;

    const client = await db.connect();

    try {
        // entregableNum es opcional para Canteras/Fuentes global
        const typesToDelete = tipos ? tipos.split(',') : [];
        if (typesToDelete.length === 0) {
            return res.status(400).json({ error: 'Debe especificar al menos un tipo de dato para eliminar (alcantarillas, badenes).' });
        }

        // 1. Get Excel URL (Only if entregableNum is provided)
        let excelUrl = null;
        if (entregableNum) {
            const invvialResult = await client.query(
                `SELECT excel_url FROM invvial_excels WHERE id_proyecto = $1 AND entregable_num = $2`,
                [projectId, entregableNum]
            );
            excelUrl = invvialResult.rows.length > 0 ? invvialResult.rows[0].excel_url : null;
        }

        // 2. Delete file from Vercel Blob if it exists and we are deleting all associated data
        if (excelUrl) {
            try {
                await del(excelUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
            } catch (blobError) {
                console.warn(`No se pudo eliminar el archivo de Vercel Blob: ${blobError.message}. Puede que ya no exista.`);
            }
        }

        // 3. Delete DB entries in a transaction
        let deletedMessages = [];
        await client.query('BEGIN');

        if (typesToDelete.includes('alcantarillas')) {
            await client.query('DELETE FROM alcantarillas WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de alcantarillas');
        }
        if (typesToDelete.includes('badenes')) {
            await client.query('DELETE FROM badenes WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de badenes');
        }
        if (typesToDelete.includes('interferencias')) {
            await client.query('DELETE FROM interferencias_electricas WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de interferencias');
        }
        if (typesToDelete.includes('puentes')) {
            await client.query('DELETE FROM puentes WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de puentes');
        }
        if (typesToDelete.includes('muros')) {
            await client.query('DELETE FROM muros WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de muros');
        }
        if (typesToDelete.includes('canterasfuentes')) {
            await client.query('DELETE FROM invvial_canteras WHERE id_proyecto = $1', [projectId]);
            await client.query('DELETE FROM invvial_fuentes WHERE id_proyecto = $1', [projectId]);
            deletedMessages.push('datos de canteras y fuentes de agua');
        }

        // 4. Delete the entry from invvial_excels table (Only if entregableNum is provided)
        if (entregableNum) {
            await client.query(`DELETE FROM invvial_excels WHERE id_proyecto = $1 AND entregable_num = $2`, [projectId, entregableNum]);
        }

        await client.query('COMMIT');

        // --- Audit Log ---
        const auditDetails = `Archivo Excel, ${deletedMessages.join(' y ')} eliminados para proyecto ${projectId} (entregable ${entregableNum}) por usuario ${userId}.`;
        await client.query(
            'INSERT INTO auditoria (usuario_id, accion, detalles) VALUES ($1, $2, $3)',
            [userId, 'Eliminación de Datos de Inventario Vial', auditDetails]
        );
        // --- End Audit Log ---

        res.status(200).json({ status: 'ok', message: `Archivo Excel, ${deletedMessages.join(' y ')} eliminados correctamente.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar el archivo Excel y los datos:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Error al eliminar el archivo Excel y los datos.' });
    } finally {
        client.release();
    }
});

// NEW: Endpoint to get excel info
router.get('/excel-info/:projectId/:entregableNum', authenticateToken, async (req, res) => {
    const { projectId, entregableNum } = req.params;
    try {
        const result = await db.query(
            'SELECT excel_url, original_filename FROM invvial_excels WHERE id_proyecto = $1 AND entregable_num = $2',
            [projectId, entregableNum]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Información del archivo Excel no encontrada.' });
        }
    } catch (error) {
        console.error('Error al obtener información del archivo Excel:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ALCANTARILLAS
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await alcantarillasService.deleteAlcantarilla(req.params.id);
        res.json({ message: 'Eliminado correctamente' });
    } catch (err) {
        console.error(`Error deleting alcantarilla ${req.params.id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
