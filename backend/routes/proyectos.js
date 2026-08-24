/**
 * Rutas del dominio de proyectos.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/proyectos pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const axios = require('axios');
const { put } = require('@vercel/blob');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');
const FormData = require('form-data');
const db = require('../conexion');
const progresivasService = require('../services/progresivasService');
const proyectosService = require('../services/proyectosService');
const canterasService = require('../services/canterasService');
const alcantarillasService = require('../services/alcantarillasService');
const badenesService = require('../services/badenesService');
const { uploadFileToNAS, deleteFileFromNAS } = require('../services/blobStorageService');
const { upload } = require('../config/multer');
const { authenticateToken, authorizeGeologyManage, authorizeDisenoGeometricoManage, authorizeAdminOrCoordinator, authorizePermission } = require('../middleware/auth');

const router = express.Router();

// POST: subir KMZ con imágenes embebidas
router.post('/:id/panel-fotografico/upload-kmz', authenticateToken, authorizeAdminOrCoordinator, upload.single('kmz'), async (req, res) => {
    const { id: proyectoId } = req.params;

    if (!req.file) {
        return res.status(400).json({ status: 'error', error: 'No se subió ningún archivo KMZ.' });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA ||
        process.env.BLOB_READ_WRITE_TOKEN;

    try {
        const fileBuffer = req.file.buffer;

        // 1. Abrir el KMZ como ZIP
        const zip = new AdmZip(fileBuffer);
        const zipEntries = zip.getEntries();

        // 2. Encontrar el archivo KML principal
        const kmlEntry = zipEntries.find(e =>
            !e.isDirectory && e.entryName.toLowerCase().endsWith('.kml')
        );
        if (!kmlEntry) {
            return res.status(400).json({ status: 'error', error: 'El KMZ no contiene un archivo KML.' });
        }

        const kmlText = kmlEntry.getData().toString('utf8');

        // 3. Parsear el KML con fast-xml-parser
        const fxp = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            isArray: (name) => ['Placemark', 'Folder'].includes(name),
            allowBooleanAttributes: true,
        });
        const kmlParsed = fxp.parse(kmlText);

        const extractPlacemarks = (node) => {
            let marks = [];
            if (!node) return marks;
            if (node.Placemark) marks = marks.concat(node.Placemark);
            if (node.Folder) {
                const folders = Array.isArray(node.Folder) ? node.Folder : [node.Folder];
                folders.forEach(f => { marks = marks.concat(extractPlacemarks(f)); });
            }
            return marks;
        };

        const doc = kmlParsed?.kml?.Document || kmlParsed?.kml || {};
        const placemarks = extractPlacemarks(doc);

        // 4. Crear un mapa rápido de imágenes del ZIP
        const imageMap = {};
        zipEntries.forEach(entry => {
            if (!entry.isDirectory) {
                const lower = entry.entryName.toLowerCase();
                if (lower.match(/\.(jpe?g|png|gif|webp|bmp)$/)) {
                    imageMap[entry.entryName] = entry.getData();
                    const basename = entry.entryName.split('/').pop();
                    imageMap[basename] = entry.getData();
                }
            }
        });

        // 5. Preparar tareas de procesamiento (Subida paralela controlada a Vercel Blob)
        console.log(`[Panel Fotográfico] Procesando ${placemarks.length} elementos en lotes...`);
        const results = [];
        const CONCURRENCY_LIMIT = 15; // Lote de peticiones concurrentes a Vercel Blob

        for (let i = 0; i < placemarks.length; i += CONCURRENCY_LIMIT) {
            const chunk = placemarks.slice(i, i + CONCURRENCY_LIMIT);
            const chunkResults = await Promise.all(chunk.map(async (pm) => {
                const nombre = pm.name ? String(pm.name).trim() : null;
                const descripcion = pm.description ? String(pm.description).replace(/<[^>]+>/g, '').trim() : null;

                let lat = null, lng = null;
                const coords = pm?.Point?.coordinates;
                if (coords) {
                    const parts = String(coords).trim().split(',');
                    if (parts.length >= 2) {
                        const parsedLng = parseFloat(parts[0]);
                        const parsedLat = parseFloat(parts[1]);
                        if (!isNaN(parsedLng) && !isNaN(parsedLat)) {
                            lng = parsedLng;
                            lat = parsedLat;
                        }
                    }
                }

                let imageBuffer = null, imageFilename = null;
                const descRaw = pm.description ? String(pm.description) : '';
                const imgMatch = descRaw.match(/src=["']([^"']+\.(jpe?g|png|gif|webp|bmp))["']/i);
                if (imgMatch) {
                    const refPath = imgMatch[1];
                    const refBasename = refPath.split('/').pop();
                    imageBuffer = imageMap[refPath] || imageMap[refBasename] || null;
                    imageFilename = refBasename;
                }

                if (!imageBuffer && nombre) {
                    const matchKey = Object.keys(imageMap).find(k =>
                        k.toLowerCase().includes(nombre.toLowerCase().replace(/\s+/g, '_')) ||
                        k.toLowerCase().includes(nombre.toLowerCase().replace(/\s+/g, ''))
                    );
                    if (matchKey) {
                        imageBuffer = imageMap[matchKey];
                        imageFilename = matchKey.split('/').pop();
                    }
                }

                let imageUrl = null;
                if (imageBuffer) {
                    try {
                        const safeFilename = (imageFilename || `foto_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9-._]/g, '_');
                        const targetFolder = getGeologiaStorageFolder(proyectoId, 'panel_fotografico');
                        const finalFilename = `${Date.now()}_${safeFilename}`;

                        console.log(`[Panel Fotográfico] Subiendo a NAS QNAP: ${targetFolder}/${finalFilename}...`);
                        imageUrl = await uploadFileToNAS(imageBuffer, targetFolder, finalFilename);
                    } catch (putErr) {
                        console.error(`[Panel Fotográfico] ERROR CRÍTICO NAS QNAP (${imageFilename}):`, putErr.message);
                        if (putErr.response) console.error(`[Panel Fotográfico] Detalle error NAS:`, putErr.response.data);
                    }
                } else {
                    console.warn(`[Panel Fotográfico] No se encontró buffer de imagen para ${nombre || 'elemento sin nombre'} (${imageFilename})`);
                }
                return { nombre, descripcion, lat, lng, imageUrl, original_filename: imageFilename };
            }));
            results.push(...chunkResults);
        }

        // Solo incluimos registros que tengan URL de imagen si es requisito de la tabla, 
        // o al menos que tengan coordenadas. 
        // Si image_url es NOT NULL en la DB, debemos filtrar los que no tienen imageUrl para evitar el 500 error.
        const validResults = results.filter(r => r.imageUrl);

        if (validResults.length === 0 && results.length > 0) {
            console.error("[Panel Fotográfico] No se pudo subir ninguna imagen de las encontradas en el KMZ.");
            throw new Error("No se pudo subir ninguna imagen al NAS. Verifique la configuración de WebDAV y los permisos.");
        }

        // 6. Inserción en BD
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM geologia_fotos_panel WHERE proyecto_id = $1', [proyectoId]);

            const fotosInsertadas = [];
            for (const r of validResults) {
                const resDb = await client.query(
                    `INSERT INTO geologia_fotos_panel (proyecto_id, nombre, descripcion, lat, lng, image_url, original_filename)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                    [proyectoId, r.nombre, r.descripcion, r.lat, r.lng, r.imageUrl, r.original_filename]
                );
                fotosInsertadas.push(resDb.rows[0]);
            }
            await client.query('COMMIT');
            console.log(`[Panel Fotográfico] OK: ${fotosInsertadas.length} fotos guardadas.`);

            // 7. Extraer GeoJSON del KML para mostrar la capa base en el mapa (opcional)
            try {
                const kmlDom = new DOMParser().parseFromString(kmlText, 'text/xml');
                const geojson = kml(kmlDom);

                if (geojson && geojson.features && geojson.features.length > 0) {
                    console.log(`[Panel Fotográfico] Guardando capa GeoJSON extraída del KMZ (${geojson.features.length} elementos)...`);
                    await db.query(`
                        INSERT INTO geologia_capas (proyecto_id, tab_name, geojson_data, file_name)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (proyecto_id, tab_name) 
                        DO UPDATE SET 
                            geojson_data = EXCLUDED.geojson_data,
                            file_name = EXCLUDED.file_name,
                            uploaded_at = CURRENT_TIMESTAMP
                    `, [proyectoId, 'panel_fotografico', JSON.stringify(geojson), req.file.originalname]);
                }
            } catch (layerErr) {
                console.error('[Panel Fotográfico] Error al extraer capa GeoJSON del KMZ:', layerErr.message);
            }

            res.json({ status: 'ok', count: fotosInsertadas.length, fotos: fotosInsertadas });
        } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('[Panel Fotográfico] Error al procesar KMZ:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// GET: obtener todas las fotos del panel fotográfico
router.get('/:id/panel-fotografico', authenticateToken, async (req, res) => {
    const { id: proyectoId } = req.params;
    try {
        const result = await db.query(
            `SELECT * FROM geologia_fotos_panel WHERE proyecto_id = $1 ORDER BY id ASC`,
            [proyectoId]
        );
        res.json({ status: 'ok', fotos: result.rows });
    } catch (err) {
        console.error('[Panel Fotográfico] Error al obtener fotos:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// DELETE: limpiar/resetear todas las fotos del panel
router.delete('/:id/panel-fotografico', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    const { id: proyectoId } = req.params;
    try {
        await db.query('DELETE FROM geologia_fotos_panel WHERE proyecto_id = $1', [proyectoId]);
        res.json({ status: 'ok', message: 'Panel fotográfico limpiado exitosamente.' });
    } catch (err) {
        console.error('[Panel Fotográfico] Error al eliminar fotos:', err.message);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// Nuevo endpoint para obtener alcantarillas por ID de proyecto
router.get('/:projectId/alcantarillas', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const alcantarillas = await alcantarillasService.getAlcantarillasByProjectId(projectId);
        res.json(alcantarillas);
    } catch (error) {
        console.error(`Error al obtener alcantarillas para el proyecto ${projectId}:`, error);
        res.status(500).json({ error: 'Error al obtener alcantarillas', details: error.message });
    }
});

// --------------------- BADENES ---------------------
// Nuevo endpoint para obtener badenes por ID de proyecto
router.get('/:projectId/badenes', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const badenes = await badenesService.getBadenesByProjectId(projectId);
        res.json(badenes);
    } catch (error) {
        console.error(`Error al obtener badenes para el proyecto ${projectId}:`, error);
        res.status(500).json({ error: 'Error al obtener badenes', details: error.message });
    }
});

// --------------------- PROYECTOS ---------------------
// Listar proyectos con detalle (incluyendo los nuevos campos)
router.get('/detallado', authenticateToken, async (req, res) => {
    try {
        const proyectos = await proyectosService.getDetailedProyectos();
        res.json(proyectos);
    } catch (err) {
        console.error('Error al obtener proyectos detallados:', err);
        res.status(500).json({ error: 'Error al obtener proyectos detallados', details: err.message });
    }
});

// Nueva ruta para obtener solo los proyectos detallados asignados al usuario (o todos si es admin)
router.get('/assigned-detailed', authenticateToken, async (req, res) => {
    try {
        const { id: userId, rol_nombre: userRole } = req.user;
        let proyectos;

        if (userRole === 'ADMIN') {
            proyectos = await proyectosService.getDetailedProyectos();
        } else {
            proyectos = await proyectosService.getAssignedDetailedProyectos(userId);
        }

        res.json(proyectos);
    } catch (err) {
        console.error('Error al obtener proyectos asignados detallados:', err);
        res.status(500).json({ error: 'Error al obtener proyectos asignados detallados', details: err.message });
    }
});

// Lista simple (sin cambios, si se mantiene)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const proyectos = await proyectosService.getSimpleProyectos();
        res.json(proyectos);
    } catch (err) {
        console.error('Error al obtener proyectos:', err);
        res.status(500).json({ error: 'Error al obtener proyectos', details: err.message });
    }
});

// Obtener un proyecto por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const proyecto = await proyectosService.getProyectoById(req.params.id);
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        res.json(proyecto);
    } catch (err) {
        console.error(`Error al obtener proyecto ${req.params.id}:`, err);
        res.status(500).json({ error: 'Error al obtener proyecto', details: err.message });
    }
});

// Crear un proyecto completo con su tramo inicial y progresivas en una sola transacción
router.post('/create-full', authenticateToken, async (req, res) => {
    const { projectData, progresivaData } = req.body;
    const actorId = req.user.id; // Obtener el ID del usuario autenticado

    if (!projectData || !progresivaData) {
        return res.status(400).json({ error: 'Faltan datos del proyecto o del tramo.' });
    }

    try {
        const result = await proyectosService.createProyectoAndProgresiva(projectData, progresivaData, actorId);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error en la transacción de crear proyecto completo:', err);
        res.status(500).json({ error: 'Error al crear el proyecto completo', details: err.message });
    }
});

// Actualizar un proyecto existente
router.get('/:id/estadisticas', authenticateToken, async (req, res) => {
    try {
        const stats = await proyectosService.getProjectStatistics(req.params.id);
        res.json(stats);
    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas del proyecto.' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { projectData, progresivaData, calibrationData } = req.body;
    try {
        const result = await proyectosService.updateProyecto(id, projectData, progresivaData, calibrationData);
        res.json(result);
    } catch (err) {
        console.error(`Error al actualizar el proyecto ${id}:`, err);
        res.status(500).json({ error: 'Error al actualizar el proyecto', details: err.message });
    }
});

// Eliminar un proyecto existente
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await proyectosService.deleteProyecto(id);
        if (rowCount === 0) {
            return res.status(404).json({ mensaje: 'Proyecto no encontrado para eliminar' });
        }
        res.status(204).send(); // No content
    } catch (err) {
        console.error(`Error al eliminar el proyecto ${id}:`, err);
        res.status(500).json({ error: 'Error al eliminar el proyecto', details: err.message });
    }
});

router.get('/:proyectoId/tramos', authenticateToken, async (req, res) => {
    const { proyectoId } = req.params;
    try {
        const tramos = await progresivasService.getParentProgresivasByProyectoId(proyectoId);
        res.json(tramos);
    } catch (err) {
        console.error(`Error al obtener tramos para el proyecto ${proyectoId}:`, err);
        res.status(500).json({ error: 'Error al obtener tramos por proyecto', details: err.message });
    }
});

// Rutas para la asignación de usuarios a proyectos
// API: Asignar un usuario a un proyecto
router.post('/:projectId/assignUser', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, rolProyecto } = req.body;
        const actorId = req.user.id; // Obtener el ID del usuario autenticado
        const assignment = await proyectosService.assignUserToProjectDb(parseInt(projectId), parseInt(userId), rolProyecto, actorId);
        res.status(201).json(assignment);
    } catch (error) {
        console.error('Error al asignar usuario a proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Eliminar usuario de un proyecto
router.delete('/:projectId/removeUser/:userId', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const { projectId, userId } = req.params;
        const actorId = req.user.id; // Obtener el ID del usuario autenticado
        // El servicio espera (projectId, userId, actorId). Se eliminó rolProyecto que no estaba definido.
        const result = await proyectosService.removeUserFromProjectDb(parseInt(projectId), parseInt(userId), actorId);
        if (result) {
            res.status(200).json({ message: 'Usuario desasignado del proyecto correctamente.' });
        } else {
            res.status(404).json({ error: 'Asignación no encontrada.' });
        }
    } catch (error) {
        console.error('Error al desasignar usuario de proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Obtener miembros del equipo de un proyecto
router.get('/:projectId/assignments', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const assignments = await proyectosService.getProjectAssignments(parseInt(projectId));
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Error al obtener asignaciones del proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Obtener el historial de un proyecto
router.get('/:projectId/history', authenticateToken, authorizeAdminOrCoordinator, async (req, res) => {
    try {
        const { projectId } = req.params;
        const history = await proyectosService.getProjectHistory(parseInt(projectId));
        res.status(200).json(history);
    } catch (error) {
        console.error('Error al obtener historial del proyecto:', error);
        res.status(500).json({ error: error.message });
    }
});

// NEW: Endpoint to upload a KML file for a project
router.post('/:proyectoId/upload-kml', authenticateToken, authorizePermission('proyectos', 'edicion'), upload.single('kmlFile'), async (req, res) => {
    const { proyectoId } = req.params;
    const { file } = req; // Multer places the file here
    const userId = req.user.id;

    try {
        if (!file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo KML.' });
        }

        // Call the service function to handle KML processing and saving
        const result = await proyectosService.uploadKmlToProyecto(proyectoId, file, userId); // Pass userId
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al subir KML para el proyecto ${proyectoId}:`, error);
        // Custom error handling for service-level errors
        if (error.isCustomError) { // Assuming custom errors have an 'isCustomError' flag
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al subir KML.' });
    }
});

// --- KML Management for Projects ---
// GET the active KML for a project (optionally by section)
router.get('/:id/kml', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { section } = req.query; // e.g. 'trafico', 'invvial'
    const isLegacyBlobUrl = (value) => {
        const normalized = String(value || '').toLowerCase();
        return normalized.includes('.blob.vercel-storage.com') || normalized.includes('public.blob.vercel-storage.com');
    };

    try {
        let result;
        if (section) {
            // First try the new section-aware table
            result = await db.query(
                `SELECT kml_url
                 FROM proyectos_secciones_kml
                 WHERE id_proyecto = $1 AND seccion = $2 AND NULLIF(kml_url, '') IS NOT NULL`,
                [id, section]
            );

            // Fallback for 'invvial' section if not found in the new table
            if (result.rows.length === 0 && section === 'invvial') {
                result = await db.query(
                    `SELECT COALESCE(NULLIF(i.kml_url, ''), NULLIF(p.url_kml, '')) AS kml_url
                     FROM proyectos p
                     LEFT JOIN invvial i ON i.id_proyecto = p.id
                     WHERE p.id = $1`,
                    [id]
                );
            }
        } else {
            // Legacy/default behavior with fallback to the project-level URL
            result = await db.query(
                `SELECT COALESCE(NULLIF(i.kml_url, ''), NULLIF(p.url_kml, '')) AS kml_url
                 FROM proyectos p
                 LEFT JOIN invvial i ON i.id_proyecto = p.id
                 WHERE p.id = $1`,
                [id]
            );
        }

        if (result.rows.length > 0 && result.rows[0].kml_url) {
            const currentUrl = result.rows[0].kml_url;

            if (isLegacyBlobUrl(currentUrl)) {
                console.warn(`[KML] Se detectó URL legacy de Vercel Blob para proyecto ${id} (${section || 'default'}). Se devolverá null para evitar cargas inválidas.`);
                res.json({ url: null, blockedLegacyUrl: true });
                return;
            }

            res.json({ url: currentUrl });
        } else {
            // Return 200 with null instead of 404 to avoid console errors in the map component
            res.json({ url: null });
        }
    } catch (error) {
        console.error(`Error getting KML for project ${id}:`, error);
        res.status(500).json({ error: 'Server error while fetching KML URL.' });
    }
});

// Update a project's KML URL (optionally by section)
router.post('/:projectId/kml', authenticateToken, authorizePermission('proyectos', 'edicion'), async (req, res) => {
    const { projectId } = req.params;
    const { url, section } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'La URL del KML es requerida.' });
    }
    try {
        let result;
        const targetSection = section || 'invvial';

        // 1. Save to the section-aware table (Primary)
        result = await db.query(
            'INSERT INTO proyectos_secciones_kml (id_proyecto, seccion, kml_url) VALUES ($1, $2, $3) ON CONFLICT (id_proyecto, seccion) DO UPDATE SET kml_url = $3 RETURNING *',
            [projectId, targetSection, url]
        );

        // 2. Sync with legacy invvial table if section is invvial
        if (targetSection === 'invvial') {
            await db.query(
                'INSERT INTO invvial (id_proyecto, kml_url) VALUES ($1, $2) ON CONFLICT (id_proyecto) DO UPDATE SET kml_url = $2',
                [projectId, url]
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(`Error saving KML for project ${projectId} section ${section}:`, error);
        res.status(500).json({ error: 'Server error while saving KML URL.' });
    }
});

// NEW: Endpoint to get consolidated Map Data for Dashboard
router.get('/:id/map-data', authenticateToken, async (req, res) => {
    try {
        const data = await proyectosService.getProjectMapData(req.params.id);
        res.json(data);
    } catch (error) {
        console.error('Error fetching map data:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE the KML for a project (section-aware)
router.delete('/:id/kml', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { section } = req.query;
    const targetSection = section || 'invvial';

    try {
        // 1. Get the URL of the KML to delete it from the active storage backend.
        let getUrlResult;
        if (targetSection === 'invvial') {
            getUrlResult = await db.query('SELECT kml_url FROM invvial WHERE id_proyecto = $1', [id]);
        } else {
            getUrlResult = await db.query('SELECT kml_url FROM proyectos_secciones_kml WHERE id_proyecto = $1 AND seccion = $2', [id, targetSection]);
        }

        if (getUrlResult.rows.length > 0) {
            const { kml_url } = getUrlResult.rows[0];

            // Delete from NAS when the URL belongs to the public NAS base.
            // Legacy Vercel URLs are ignored here; the DB reference is removed below.
            if (kml_url) {
                try {
                    await deleteFileFromNAS(kml_url);
                } catch (storageErr) {
                    console.warn(`Could not delete KML from active storage ${kml_url}: ${storageErr.message}`);
                }
            }

            // 2. Delete the row from the appropriate table(s)
            if (targetSection === 'invvial') {
                await db.query('DELETE FROM invvial WHERE id_proyecto = $1', [id]);
            }

            await db.query('DELETE FROM proyectos_secciones_kml WHERE id_proyecto = $1 AND seccion = $2', [id, targetSection]);

            res.status(204).send(); // Success, no content
        } else {
            res.status(404).json({ error: 'No KML found for this project to delete.' });
        }
    } catch (error) {
        console.error(`Error deleting KML for project ${id} section ${targetSection}:`, error);
        res.status(500).json({ error: 'Server error while deleting KML.' });
    }
});

// Endpoint para exportar proyectos a Excel (marcador de posición)
router.get('/export', authenticateToken, async (req, res) => {
    try {
        const result = await proyectosService.exportProyectos();
        res.status(200).json(result);
    } catch (err) {
        console.error('Error al exportar proyectos:', err);
        res.status(500).json({ error: 'Error al exportar proyectos', details: err.message });
    }
});

// --------------------- CANTERAS ---------------------
// --- NEW: Endpoints for Calibration Data ---
router.get('/:id/calibracion', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const data = await proyectosService.getCalibracionByProyecto(id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/calibracion', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const calibracionData = req.body;
    try {
        const result = await proyectosService.saveCalibracionForProyecto(id, calibracionData);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id/calibracion', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await proyectosService.deleteCalibracionForProyecto(id);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:proyectoId/canteras', authenticateToken, async (req, res) => {
    const { proyectoId } = req.params;
    try {
        const canteras = await canterasService.getCanterasByProyectoId(proyectoId);
        res.json(canteras);
    } catch (err) {
        console.error(`Error al obtener canteras para el proyecto ${proyectoId}:`, err);
        res.status(500).json({ error: 'Error al obtener canteras', details: err.message });
    }
});

// --- GEOLOGÍA CAPAS (KML/KMZ/Shapefiles RAR/ZIP) ---
const sanitizeGeologiaStorageSegment = (value) => String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const getGeologiaStorageFolder = (proyectoId, bucketName) => {
    const safeBucket = sanitizeGeologiaStorageSegment(bucketName) || 'otros';
    return `geologia/${proyectoId}/${safeBucket}`;
};

const ensureGeologiaCapasDriveUrlColumn = async () => {
    await db.query('ALTER TABLE geologia_capas ADD COLUMN IF NOT EXISTS drive_url TEXT;');
};

router.post('/:id/geologia-capas', authenticateToken, authorizeGeologyManage, upload.single('archivo'), async (req, res) => {
    try {
        await ensureGeologiaCapasDriveUrlColumn();
        const proyectoId = parseInt(req.params.id);
        const tabName = String(req.body.tabName || '').trim();
        const file = req.file;

        if (!file || !tabName) return res.status(400).json({ status: 'error', message: 'Faltan datos' });

        console.log(`📂 [Geología] Iniciando subida para pID: ${proyectoId}, Tab: ${tabName}, Archivo: ${file.originalname} (${file.size} bytes)`);

        const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        const remoteFilename = `${Date.now()}_${cleanFilename}`;
        const targetFolder = getGeologiaStorageFolder(proyectoId, tabName);
        const storagePath = `${targetFolder}/${remoteFilename}`;
        let fileUrl;

        try {
            if (true) {
                console.log(`🗄️ [Geología] Subiendo archivo al NAS: ${storagePath}`);
                fileUrl = await uploadFileToNAS(file.buffer, targetFolder, remoteFilename);
                console.log(`✅ [Geología] Subido al NAS: ${fileUrl}`);
            } else {
                console.log(`☁️ [Geología] Intentando subir a Vercel Blob: ${storagePath}`);
                const blob = await put(storagePath, file.buffer, {
                    access: 'public',
                    token: process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA || process.env.BLOB_READ_WRITE_TOKEN
                });
                fileUrl = blob.url;
                console.log(`✅ [Geología] Subido a Vercel Blob: ${fileUrl}`);
            }
        } catch (storageErr) {
            const storageName = 'NAS';
            console.error(`❌ [Geología] Error al subir a ${storageName}:`, storageErr);
            throw new Error(`Falla en ${storageName}: ${storageErr.message}`);
        }

        let geojsonData = null;
        const ext = path.extname(file.originalname).toLowerCase();

        // If it's a RAR or ZIP (shapefile archive), send to Python worker for conversion
        if (ext === '.rar' || ext === '.zip') {
            try {
                console.log(`📦 [Geología] Enviando archivo ${ext} al Python worker...`);
                const FormData = require('form-data');
                const formData = new FormData();
                formData.append('file', file.buffer, { filename: file.originalname });

                const pythonRes = await axios.post('http://127.0.0.1:8000/convert-shapefile', formData, {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 300000 // 5 min timeout
                });

                if (pythonRes.data && pythonRes.data.status === 'ok' && pythonRes.data.geojson) {
                    geojsonData = pythonRes.data.geojson;
                    console.log(`✅ [Geología] Python worker convirtió exitosamente el ${ext}.`);
                } else {
                    console.error('❌ [Geología] Mala respuesta del Python worker:', pythonRes.data);
                    throw new Error(`Respuesta de Python inválida: ${JSON.stringify(pythonRes.data)}`);
                }
            } catch (pyErr) {
                console.error('❌ [Geología] Error en el Python worker:', pyErr.message);
                const pyErrMsg = pyErr.response ? JSON.stringify(pyErr.response.data) : pyErr.message;
                throw new Error(`Worker Python falló: ${pyErrMsg}`);
            }
        } else if (ext === '.kml' || ext === '.kmz') {
            try {
                console.log(`📍 [Geología] Procesando archivo ${ext} localmente...`);
                const { kml } = require('@tmcw/togeojson');
                const DOMParser = require('xmldom').DOMParser;
                let kmlText = '';

                if (ext === '.kmz') {
                    const AdmZip = require('adm-zip');
                    const zip = new AdmZip(file.buffer);
                    const zipEntries = zip.getEntries();
                    const kmlEntry = zipEntries.find(entry => entry.entryName.toLowerCase().endsWith('.kml'));
                    if (!kmlEntry) throw new Error('No se encontró ningún .kml en el .kmz');
                    kmlText = zip.readAsText(kmlEntry);
                } else {
                    kmlText = file.buffer.toString('utf-8');
                }

                const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
                const { injectFoldersToGeoJSON } = require('./utils/kmlFolderInjector');
                geojsonData = kml(doc);
                geojsonData = injectFoldersToGeoJSON(kmlText, geojsonData);

                if (geojsonData && geojsonData.features) {
                    let defaultLayerName = cleanFilename.replace('.kmz', '').replace('.kml', '').replace(/^[0-9]+_/, '');
                    geojsonData.features.forEach(f => {
                        if (!f.properties) f.properties = {};
                        f.properties._layer_name = f.properties.folder || f.properties.type || defaultLayerName;
                    });
                }
                console.log(`✅ [Geología] KML/KMZ procesado localmente.`);
            } catch (kmlErr) {
                console.error('❌ [Geología] Error procesando KML/KMZ:', kmlErr);
                throw new Error(`Procesamiento local falló: ${kmlErr.message}`);
            }
        }

        // Save to database (with geojson_data if available)
        console.log(`💾 [Geología] Intentando guardar en DB...`);
        const query = `
            INSERT INTO geologia_capas (proyecto_id, tab_name, file_url, file_name, geojson_data)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (proyecto_id, tab_name) DO UPDATE 
            SET file_url = EXCLUDED.file_url, file_name = EXCLUDED.file_name, 
                geojson_data = EXCLUDED.geojson_data, uploaded_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const dbResult = await db.query(query, [proyectoId, tabName, fileUrl, file.originalname, geojsonData ? JSON.stringify(geojsonData) : null]);
        console.log(`✅ [Geología] Guardado exitosamente en ID: ${dbResult.rows[0]?.id}`);
        res.status(200).json({ status: 'success', data: dbResult.rows[0] });
    } catch (err) {
        console.error('❌ [Geología] Error Final:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

const ensureDisenoGeometricoCapasTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS diseno_geometrico_capas (
            id SERIAL PRIMARY KEY,
            proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
            tab_name VARCHAR(100) NOT NULL,
            file_url TEXT NOT NULL DEFAULT '',
            file_name VARCHAR(255) NOT NULL DEFAULT '',
            drive_url TEXT,
            geojson_data JSONB,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (proyecto_id, tab_name)
        );
    `);

    await db.query('ALTER TABLE diseno_geometrico_capas ADD COLUMN IF NOT EXISTS drive_url TEXT;');
    await db.query('ALTER TABLE diseno_geometrico_capas ADD COLUMN IF NOT EXISTS geojson_data JSONB;');
    await db.query('ALTER TABLE diseno_geometrico_capas ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;');
    await db.query("ALTER TABLE diseno_geometrico_capas ALTER COLUMN file_url SET DEFAULT '';");
    await db.query("ALTER TABLE diseno_geometrico_capas ALTER COLUMN file_name SET DEFAULT '';");
};

const ensureFeatureCollection = (value) => {
    if (!value || value.type !== 'FeatureCollection' || !Array.isArray(value.features)) {
        return { type: 'FeatureCollection', features: [] };
    }

    return value;
};

const DG_COORDINATE_PRECISION = 6;

const DG_GEOJSON_WARN_BYTES = 12 * 1024 * 1024;

const DG_GEOJSON_MAX_BYTES = 20 * 1024 * 1024;

const roundCoordinateValue = (value) => {
    if (!Number.isFinite(value)) return null;
    return Number(value.toFixed(DG_COORDINATE_PRECISION));
};

const reducePointSequence = (points, maxPoints, closeRing = false) => {
    if (!Array.isArray(points) || points.length <= maxPoints) return points;

    const stride = Math.ceil(points.length / maxPoints);
    const reduced = points.filter((_, index) => index === 0 || index === points.length - 1 || index % stride === 0);

    if (closeRing && reduced.length > 2) {
        const firstPoint = JSON.stringify(reduced[0]);
        const lastPoint = JSON.stringify(reduced[reduced.length - 1]);
        if (firstPoint !== lastPoint) {
            reduced.push(reduced[0]);
        }
    }

    return reduced;
};

const compactCoordinates = (coordinates, geometryType) => {
    if (!Array.isArray(coordinates)) return coordinates;

    if (geometryType === 'Point') {
        const point = coordinates
            .slice(0, 3)
            .map((value) => roundCoordinateValue(Number(value)));

        return point.length >= 2 && point[0] !== null && point[1] !== null ? point : null;
    }

    if (geometryType === 'MultiPoint' || geometryType === 'LineString') {
        return reducePointSequence(
            coordinates
                .map((point) => compactCoordinates(point, 'Point'))
                .filter(Boolean),
            geometryType === 'LineString' ? 5000 : 8000
        );
    }

    if (geometryType === 'MultiLineString') {
        return coordinates
            .map((line) => compactCoordinates(line, 'LineString'))
            .filter((line) => Array.isArray(line) && line.length >= 2);
    }

    if (geometryType === 'Polygon') {
        return coordinates
            .map((ring) => reducePointSequence(
                ring
                    .map((point) => compactCoordinates(point, 'Point'))
                    .filter(Boolean),
                4000,
                true
            ))
            .filter((ring) => Array.isArray(ring) && ring.length >= 4);
    }

    if (geometryType === 'MultiPolygon') {
        return coordinates
            .map((polygon) => compactCoordinates(polygon, 'Polygon'))
            .filter((polygon) => Array.isArray(polygon) && polygon.length > 0);
    }

    return coordinates;
};

const compactFeatureForStorage = (feature) => {
    if (!feature || feature.type !== 'Feature') return null;

    const geometryType = feature.geometry?.type;
    if (!geometryType) return null;

    const compactedCoordinates = compactCoordinates(feature.geometry.coordinates, geometryType);
    if (!compactedCoordinates) return null;

    return {
        type: 'Feature',
        properties: feature.properties || {},
        geometry: {
            type: geometryType,
            coordinates: compactedCoordinates
        }
    };
};

const compactGeojsonForStorage = (geojsonData) => {
    const normalized = ensureFeatureCollection(geojsonData);

    return {
        type: 'FeatureCollection',
        features: normalized.features
            .map((feature) => compactFeatureForStorage(feature))
            .filter(Boolean)
    };
};

const applyDenseLayerStyling = (featureCollection) => {
    const normalized = ensureFeatureCollection(featureCollection);

    return {
        ...normalized,
        dg_meta: {
            ...(normalized.dg_meta || {}),
            denseVisualMode: true
        },
        features: normalized.features.map((feature) => {
            const geometryType = feature?.geometry?.type || '';
            const properties = { ...(feature?.properties || {}) };

            if (geometryType.includes('Point')) {
                properties.dg_marker_size = 8;
            } else if (geometryType.includes('Line')) {
                properties['stroke-width'] = Math.min(Number(properties['stroke-width']) || 4, 1);
                properties['stroke-opacity'] = Math.min(Number(properties['stroke-opacity'] ?? 1), 0.45);
            } else if (geometryType.includes('Polygon')) {
                properties['stroke-width'] = Math.min(Number(properties['stroke-width']) || 3, 1);
                properties['stroke-opacity'] = Math.min(Number(properties['stroke-opacity'] ?? 1), 0.35);
                properties['fill-opacity'] = Math.min(Number(properties['fill-opacity'] ?? 0.35), 0.08);
            }

            return {
                ...feature,
                properties
            };
        })
    };
};

const splitFeatureCollectionBySize = (featureCollection, maxBytes) => {
    const normalized = ensureFeatureCollection(featureCollection);
    const features = normalized.features || [];
    const prefix = '{"type":"FeatureCollection","features":[';
    const suffix = ']}';
    const prefixBytes = Buffer.byteLength(prefix, 'utf8');
    const suffixBytes = Buffer.byteLength(suffix, 'utf8');

    const chunks = [];
    let currentFeatures = [];
    let currentBytes = prefixBytes + suffixBytes;

    for (const feature of features) {
        const featureString = JSON.stringify(feature);
        const featureBytes = Buffer.byteLength(featureString, 'utf8');
        const separatorBytes = currentFeatures.length > 0 ? 1 : 0;

        if (prefixBytes + suffixBytes + featureBytes > maxBytes) {
            return {
                chunks: [],
                oversizedFeature: true
            };
        }

        if (currentBytes + separatorBytes + featureBytes > maxBytes && currentFeatures.length > 0) {
            chunks.push({
                type: 'FeatureCollection',
                features: currentFeatures
            });
            currentFeatures = [feature];
            currentBytes = prefixBytes + suffixBytes + featureBytes;
            continue;
        }

        currentFeatures.push(feature);
        currentBytes += separatorBytes + featureBytes;
    }

    if (currentFeatures.length > 0 || chunks.length === 0) {
        chunks.push({
            type: 'FeatureCollection',
            features: currentFeatures
        });
    }

    return {
        chunks,
        oversizedFeature: false
    };
};

router.post('/:id/diseno-geometrico-capas/blank', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const tabName = String(req.body?.tabName || '').trim();
        const displayName = String(req.body?.displayName || '').trim();

        if (!proyectoId || !tabName) {
            return res.status(400).json({ status: 'error', message: 'Faltan datos para crear la capa vacia' });
        }

        const result = await db.query(`
            INSERT INTO diseno_geometrico_capas (proyecto_id, tab_name, file_url, file_name, geojson_data)
            VALUES ($1, $2, '', $3, $4)
            RETURNING *;
        `, [
            proyectoId,
            tabName,
            displayName || tabName,
            JSON.stringify({ type: 'FeatureCollection', features: [] })
        ]);

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error en Diseno Geometrico POST /blank:', err);
        if (err.code === '23505') {
            return res.status(409).json({ status: 'error', message: 'Ya existe una capa con ese nombre' });
        }
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/:id/diseno-geometrico-capas', authenticateToken, authorizeDisenoGeometricoManage, upload.single('archivo'), async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const tabName = String(req.body.tabName || '').trim();
        const displayName = String(req.body.displayName || '').trim();
        const file = req.file;

        if (!file || !tabName) {
            return res.status(400).json({ status: 'error', message: 'Faltan datos para registrar la capa' });
        }

        const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
        const filename = `diseno-geometrico/${proyectoId}/${tabName}/${Date.now()}_${cleanFilename}`;

        const blob = await put(filename, file.buffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA || process.env.BLOB_READ_WRITE_TOKEN
        });

        let geojsonData = null;
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.rar' || ext === '.zip') {
            try {
                const formData = new FormData();
                formData.append('file', file.buffer, { filename: file.originalname });

                const pythonRes = await axios.post('http://127.0.0.1:8000/convert-shapefile', formData, {
                    headers: formData.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                    timeout: 300000
                });

                if (pythonRes.data?.status === 'ok' && pythonRes.data?.geojson) {
                    geojsonData = pythonRes.data.geojson;
                } else {
                    throw new Error(`Respuesta invalida del conversor de shapefiles: ${JSON.stringify(pythonRes.data)}`);
                }
            } catch (pythonError) {
                const workerStatus = pythonError.response?.status || 502;
                const workerDetail = pythonError.response?.data?.detail
                    || pythonError.response?.data?.message
                    || pythonError.message;
                return res.status(workerStatus).json({
                    status: 'error',
                    message: `No se pudo procesar el shapefile: ${workerDetail}`
                });
            }
        } else if (ext === '.kml' || ext === '.kmz') {
            let kmlText = '';

            if (ext === '.kmz') {
                const zip = new AdmZip(file.buffer);
                const zipEntries = zip.getEntries();
                const kmlEntry = zipEntries.find((entry) => entry.entryName.toLowerCase().endsWith('.kml'));

                if (!kmlEntry) {
                    throw new Error('No se encontro ningun archivo KML dentro del KMZ');
                }

                kmlText = zip.readAsText(kmlEntry);
            } else {
                kmlText = file.buffer.toString('utf-8');
            }

            const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
            const { injectFoldersToGeoJSON } = require('./utils/kmlFolderInjector');
            geojsonData = injectFoldersToGeoJSON(kmlText, kml(doc));

            if (geojsonData?.features) {
                const fallbackLayerName = displayName || cleanFilename.replace(/\.(kmz|kml)$/i, '').replace(/^[0-9]+_/, '');
                geojsonData.features.forEach((feature) => {
                    if (!feature.properties) feature.properties = {};
                    feature.properties._layer_name = feature.properties.folder || feature.properties.type || fallbackLayerName;
                });
            }
        }

        let geojsonPayload = null;
        let payloadCollections = [];
        if (geojsonData) {
            let compactedGeojson = compactGeojsonForStorage(geojsonData);
            geojsonPayload = JSON.stringify(compactedGeojson);
            let payloadBytes = Buffer.byteLength(geojsonPayload, 'utf8');

            console.log(`[Diseno Geometrico] GeoJSON compactado para ${file.originalname}: ${payloadBytes} bytes.`);

            if (payloadBytes > DG_GEOJSON_WARN_BYTES) {
                console.warn(`[Diseno Geometrico] GeoJSON grande detectado (${payloadBytes} bytes) para ${file.originalname}.`);
                compactedGeojson = applyDenseLayerStyling(compactedGeojson);
                geojsonPayload = JSON.stringify(compactedGeojson);
                payloadBytes = Buffer.byteLength(geojsonPayload, 'utf8');
            }

            if (payloadBytes > DG_GEOJSON_MAX_BYTES) {
                const splitResult = splitFeatureCollectionBySize(compactedGeojson, DG_GEOJSON_MAX_BYTES);

                if (splitResult.oversizedFeature || !splitResult.chunks.length) {
                    return res.status(413).json({
                        status: 'error',
                        message: 'La capa es demasiado pesada incluso despues de compactarla. Intenta simplificar el shapefile en origen.'
                    });
                }

                payloadCollections = splitResult.chunks;
                console.warn(`[Diseno Geometrico] La capa ${file.originalname} se dividira automaticamente en ${payloadCollections.length} partes.`);
            } else {
                payloadCollections = [compactedGeojson];
            }
        }

        const savedName = displayName || file.originalname;
        const savedLayers = [];

        await db.query('BEGIN');
        try {
            await db.query(`
                DELETE FROM diseno_geometrico_capas
                WHERE proyecto_id = $1
                  AND (tab_name = $2 OR tab_name LIKE $3);
            `, [proyectoId, tabName, `${tabName}__part_%`]);

            for (let index = 0; index < payloadCollections.length; index += 1) {
                const partNumber = index + 1;
                const layerTabName = index === 0 ? tabName : `${tabName}__part_${partNumber}`;
                const layerDisplayName = payloadCollections.length > 1
                    ? `${savedName} (Parte ${partNumber}/${payloadCollections.length})`
                    : savedName;
                const layerPayload = payloadCollections[index] ? JSON.stringify(payloadCollections[index]) : null;

                const layerResult = await db.query(`
                    INSERT INTO diseno_geometrico_capas (proyecto_id, tab_name, file_url, file_name, geojson_data)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *;
                `, [proyectoId, layerTabName, blob.url, layerDisplayName, layerPayload]);

                savedLayers.push(layerResult.rows[0]);
            }

            await db.query('COMMIT');
        } catch (dbError) {
            await db.query('ROLLBACK');
            throw dbError;
        }

        res.status(200).json({
            status: 'success',
            data: payloadCollections.length === 1 ? savedLayers[0] : savedLayers,
            split: payloadCollections.length > 1,
            parts: payloadCollections.length
        });
    } catch (err) {
        console.error('Error en Diseno Geometrico POST /capas:', err);
        if (String(err.message || '').includes('Connection terminated unexpectedly')) {
            return res.status(413).json({
                status: 'error',
                message: 'La capa convertida sigue siendo demasiado grande para guardarse. Intenta dividir el shapefile o reducir su detalle.'
            });
        }
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.get('/:id/diseno-geometrico-capas', authenticateToken, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const result = await db.query(`
            SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at, geojson_data, drive_url
            FROM diseno_geometrico_capas
            WHERE proyecto_id = $1
            ORDER BY uploaded_at DESC, id DESC;
        `, [proyectoId]);

        res.status(200).json({ status: 'success', data: result.rows });
    } catch (err) {
        console.error('Error en Diseno Geometrico GET /capas:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.get('/:id/diseno-geometrico-capas/:tabName', authenticateToken, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const result = await db.query(`
            SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at, geojson_data, drive_url
            FROM diseno_geometrico_capas
            WHERE proyecto_id = $1 AND tab_name = $2;
        `, [proyectoId, tabName]);

        res.status(200).json({ status: 'success', data: result.rows[0] || null });
    } catch (err) {
        console.error('Error en Diseno Geometrico GET /capas/:tabName:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.patch('/:id/diseno-geometrico-capas/:tabName/rename', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const newName = String(req.body?.newName || '').trim();

        if (!newName) {
            return res.status(400).json({ status: 'error', message: 'Falta el nuevo nombre' });
        }

        const result = await db.query(`
            UPDATE diseno_geometrico_capas
            SET file_name = $1
            WHERE proyecto_id = $2 AND tab_name = $3
            RETURNING *;
        `, [newName, proyectoId, tabName]);

        if (!result.rowCount) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada' });
        }

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error en Diseno Geometrico PATCH /rename:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.patch('/:id/diseno-geometrico-capas/:tabName/drive-link', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const driveUrl = typeof req.body?.driveUrl === 'string' ? req.body.driveUrl.trim() || null : null;

        const result = await db.query(`
            INSERT INTO diseno_geometrico_capas (proyecto_id, tab_name, drive_url, file_name, file_url)
            VALUES ($1, $2, $3, 'CARPETA CONFIGURADA', '')
            ON CONFLICT (proyecto_id, tab_name) DO UPDATE
            SET drive_url = EXCLUDED.drive_url
            RETURNING *;
        `, [proyectoId, tabName, driveUrl]);

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error en Diseno Geometrico PATCH /drive-link:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.patch('/:id/diseno-geometrico-capas/:tabName/geojson', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const fileName = String(req.body?.fileName || '').trim();
        const geojsonData = ensureFeatureCollection(req.body?.geojsonData);

        const result = await db.query(`
            UPDATE diseno_geometrico_capas
            SET geojson_data = $1,
                uploaded_at = CURRENT_TIMESTAMP,
                file_name = CASE
                    WHEN $2 <> '' THEN $2
                    ELSE file_name
                END
            WHERE proyecto_id = $3 AND tab_name = $4
            RETURNING *;
        `, [
            JSON.stringify(geojsonData),
            fileName,
            proyectoId,
            tabName
        ]);

        if (!result.rowCount) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada para guardar' });
        }

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error en Diseno Geometrico PATCH /geojson:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.delete('/:id/diseno-geometrico-capas/:tabName', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoCapasTable();

        const proyectoId = parseInt(req.params.id, 10);
        const { tabName } = req.params;
        const result = await db.query(`
            DELETE FROM diseno_geometrico_capas
            WHERE proyecto_id = $1 AND tab_name = $2
            RETURNING id;
        `, [proyectoId, tabName]);

        if (!result.rowCount) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada para eliminar' });
        }

        res.status(200).json({ status: 'success', message: 'Capa eliminada correctamente' });
    } catch (err) {
        console.error('Error en Diseno Geometrico DELETE /capas/:tabName:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

const ensureDisenoGeometricoVersionesTables = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS diseno_geometrico_versiones (
            id SERIAL PRIMARY KEY,
            proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
            version_numero INTEGER NOT NULL,
            nombre VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (proyecto_id, version_numero)
        );
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS diseno_geometrico_version_capas (
            id SERIAL PRIMARY KEY,
            version_id INTEGER NOT NULL REFERENCES diseno_geometrico_versiones(id) ON DELETE CASCADE,
            tipo VARCHAR(50) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_url TEXT NOT NULL,
            geojson_data JSONB
        );
    `);
};

router.get('/:id/diseno-geometrico-versiones', authenticateToken, async (req, res) => {
    try {
        await ensureDisenoGeometricoVersionesTables();
        const proyectoId = parseInt(req.params.id, 10);
        const result = await db.query(`
            SELECT v.id, v.version_numero, v.nombre, v.created_at,
                   json_agg(json_build_object('id', c.id, 'tipo', c.tipo, 'file_name', c.file_name, 'file_url', c.file_url, 'geojson_data', c.geojson_data)) as capas
            FROM diseno_geometrico_versiones v
            LEFT JOIN diseno_geometrico_version_capas c ON v.id = c.version_id
            WHERE v.proyecto_id = $1
            GROUP BY v.id
            ORDER BY v.version_numero DESC;
        `, [proyectoId]);
        
        const formattedData = result.rows.map(row => ({
            ...row,
            capas: row.capas.filter(c => c && c.id !== null)
        }));

        res.status(200).json({ status: 'success', data: formattedData });
    } catch (err) {
        console.error('Error GET versiones:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/:id/diseno-geometrico-versiones', authenticateToken, authorizeDisenoGeometricoManage, upload.any(), async (req, res) => {
    let transactionStarted = false;
    try {
        await ensureDisenoGeometricoVersionesTables();
        const proyectoId = parseInt(req.params.id, 10);
        const nombre = String(req.body.nombre || '').trim();
        const files = req.files || [];
        
        const versionRes = await db.query(`SELECT COALESCE(MAX(version_numero), 0) + 1 as next_v FROM diseno_geometrico_versiones WHERE proyecto_id = $1`, [proyectoId]);
        const versionNumero = versionRes.rows[0].next_v;

        await db.query('BEGIN');
        transactionStarted = true;
        
        const insertVersionRes = await db.query(`
            INSERT INTO diseno_geometrico_versiones (proyecto_id, version_numero, nombre)
            VALUES ($1, $2, $3) RETURNING id;
        `, [proyectoId, versionNumero, nombre]);
        
        const versionId = insertVersionRes.rows[0].id;
        const AdmZip = require('adm-zip');
        const { DOMParser } = require('xmldom');
        const path = require('path');
        const FormData = require('form-data');
        const axios = require('axios');
        const { kml } = require('@tmcw/togeojson');
        
        await db.query(`DELETE FROM diseno_geometrico_capas WHERE proyecto_id = $1`, [proyectoId]);

        for (const file of files) {
            let tipo = 'EXTRA';
            if (file.fieldname.startsWith('file_eje')) tipo = 'EJE';
            else if (file.fieldname.startsWith('file_bordes')) tipo = 'BORDES';
            else if (file.fieldname.startsWith('file_corte')) tipo = 'CORTE';
            else if (file.fieldname.startsWith('file_progresivas')) tipo = 'PROGRESIVAS';
            else if (file.fieldname.startsWith('file_pis')) tipo = 'PIS';

            const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
            const filename = `diseno-geometrico/${proyectoId}/v${versionNumero}/${Date.now()}_${cleanFilename}`;

            const blob = await put(filename, file.buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN_GEOLOGIA || process.env.BLOB_READ_WRITE_TOKEN
            });

            let geojsonData = null;
            const ext = path.extname(file.originalname).toLowerCase();
            
            if (ext === '.rar' || ext === '.zip') {
                const formData = new FormData();
                formData.append('file', file.buffer, { filename: file.originalname });
                try {
                    const pythonRes = await axios.post('http://127.0.0.1:8000/convert-shapefile', formData, {
                        headers: formData.getHeaders(),
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        timeout: 300000
                    });
                    if (pythonRes.data?.status === 'ok') geojsonData = pythonRes.data.geojson;
                } catch(e) { console.error('Error python worker version:', e.message); }
            } else if (ext === '.kml' || ext === '.kmz') {
                try {
                    let kmlText = '';
                    if (ext === '.kmz') {
                        const zip = new AdmZip(file.buffer);
                        const kmlEntry = zip.getEntries().find((entry) => entry.entryName.toLowerCase().endsWith('.kml'));
                        if (kmlEntry) kmlText = zip.readAsText(kmlEntry);
                    } else {
                        kmlText = file.buffer.toString('utf-8');
                    }
                    const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
                    const { injectFoldersToGeoJSON } = require('./utils/kmlFolderInjector');
                    geojsonData = injectFoldersToGeoJSON(kmlText, kml(doc));
                } catch(e) { console.error('Error parseando KML/KMZ:', e.message); }
            }
            
            if (geojsonData) {
                geojsonData = compactGeojsonForStorage(geojsonData);
            }

                await db.query(`
                INSERT INTO diseno_geometrico_version_capas (version_id, tipo, file_name, file_url, geojson_data)
                VALUES ($1, $2, $3, $4, $5);
            `, [versionId, tipo, file.originalname, blob.url, geojsonData ? JSON.stringify(geojsonData) : null]);

            await db.query(`
                INSERT INTO diseno_geometrico_capas (proyecto_id, tab_name, file_name, file_url, geojson_data)
                VALUES ($1, $2, $3, $4, $5);
            `, [proyectoId, `v_capa_${Date.now()}_${Math.floor(Math.random()*1000)}`, file.originalname, blob.url, geojsonData ? JSON.stringify(geojsonData) : null]);
        }
        
        await db.query('COMMIT');
        res.status(200).json({ status: 'success', message: 'Version creada con exito' });
    } catch (err) {
        if (transactionStarted) await db.query('ROLLBACK');
        console.error('Error POST versiones:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.delete('/:id/diseno-geometrico-versiones/:versionId', authenticateToken, authorizeDisenoGeometricoManage, async (req, res) => {
    try {
        await ensureDisenoGeometricoVersionesTables();
        const { id, versionId } = req.params;
        const result = await db.query('DELETE FROM diseno_geometrico_versiones WHERE id = $1 AND proyecto_id = $2 RETURNING id;', [versionId, id]);
        if (!result.rowCount) return res.status(404).json({ status: 'error', message: 'Version no encontrada' });
        res.status(200).json({ status: 'success', message: 'Version eliminada' });
    } catch (err) {
        console.error('Error DELETE version:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.get('/:id/geologia-capas/:tabName', authenticateToken, async (req, res) => {
    try {
        const proyectoId = parseInt(req.params.id);
        const { tabName } = req.params;
        console.log(`🔍[GET] geologia - capas: Buscando proyectoId = ${proyectoId}, tabName = ${tabName} `);

        await ensureGeologiaCapasDriveUrlColumn();
        const query = 'SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at, geojson_data, drive_url FROM geologia_capas WHERE proyecto_id = $1 AND tab_name = $2;';
        const result = await db.query(query, [proyectoId, tabName]);

        if (result.rows.length === 0) {
            console.warn(`⚠️[GET] geologia - capas: No se encontró registro para pID = ${proyectoId}, tab = ${tabName} `);
            return res.status(200).json({ status: 'success', data: null });
        }

        console.log(`✅[GET] geologia - capas: Encontrado ID = ${result.rows[0].id}, has_geojson = ${!!result.rows[0].geojson_data} `);
        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('❌ Error en GET /geologia-capas:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// NUEVA RUTA: Obtener TODAS las capas de geología de un proyecto (usada por Dashboard)
router.get('/:id/geologia-capas', authenticateToken, async (req, res) => {
    try {
        const proyectoId = parseInt(req.params.id);
        console.log(`🔍[GET] Todas las geologia - capas: Buscando proyectoId = ${proyectoId}`);

        await ensureGeologiaCapasDriveUrlColumn();
        const query = 'SELECT id, proyecto_id, tab_name, file_url, file_name, uploaded_at, geojson_data, drive_url FROM geologia_capas WHERE proyecto_id = $1;';
        const result = await db.query(query, [proyectoId]);

        res.status(200).json({ status: 'success', data: result.rows });
    } catch (err) {
        console.error('❌ Error en GET todas /geologia-capas:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// NUEVA RUTA: Eliminar capa (DELETE)
router.delete('/:id/geologia-capas/:tabName', authenticateToken, authorizeGeologyManage, async (req, res) => {
    try {
        const query = 'DELETE FROM geologia_capas WHERE proyecto_id = $1 AND tab_name = $2 RETURNING id;';
        const result = await db.query(query, [req.params.id, req.params.tabName]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada para eliminar' });
        }

        res.status(200).json({ status: 'success', message: 'Capa eliminada correctamente' });
    } catch (err) {
        console.error('Error al eliminar capa:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// NUEVA RUTA: Renombrar capa (PATCH)
router.patch('/:id/geologia-capas/:tabName/rename', authenticateToken, authorizeGeologyManage, async (req, res) => {
    try {
        await ensureGeologiaCapasDriveUrlColumn();
        const { id, tabName } = req.params;
        const { newName } = req.body;

        if (!newName) return res.status(400).json({ status: 'error', message: 'Falta el nuevo nombre' });

        const query = 'UPDATE geologia_capas SET file_name = $1 WHERE proyecto_id = $2 AND tab_name = $3 RETURNING *;';
        const result = await db.query(query, [newName, id, tabName]);

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Capa no encontrada para renombrar' });
        }

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error al renombrar capa:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- GEOLOGÍA MUESTRAS (CRUD) ---
router.patch('/:id/geologia-capas/:tabName/drive-link', authenticateToken, authorizeGeologyManage, async (req, res) => {
    try {
        await ensureGeologiaCapasDriveUrlColumn();
        const { id, tabName } = req.params;
        const rawDriveUrl = typeof req.body?.driveUrl === 'string' ? req.body.driveUrl.trim() : '';
        const driveUrl = rawDriveUrl || null;

        console.log(`📂 [Backend] Guardado inteligente de Drive Link para pID: ${id}, Tab: ${tabName}`);

        // 1. Siempre asegurar/actualizar el registro base para este Tab Name exacto
        const upsertQuery = `
            INSERT INTO geologia_capas (proyecto_id, tab_name, drive_url, file_name, file_url)
            VALUES ($1, $2, $3, 'CARPETA CONFIGURADA', '')
            ON CONFLICT (proyecto_id, tab_name) DO UPDATE
            SET drive_url = EXCLUDED.drive_url
            RETURNING *;
        `;

        let result;
        try {
            result = await db.query(upsertQuery, [id, tabName, driveUrl]);
        } catch (dbErr) {
            console.error('Error en UPSERT drive-link:', dbErr);
            throw dbErr;
        }

        // 2. Propagar el link a cualquier variante que ya exista o se cree (ej: "GRUPO - SECCIÓN A")
        try {
            await db.query(
                "UPDATE geologia_capas SET drive_url = $1 WHERE proyecto_id = $2 AND tab_name LIKE $3 || '%'",
                [driveUrl, id, tabName]
            );
        } catch (propagateErr) {
            console.warn(`Error propagando link para ${tabName}:`, propagateErr.message);
        }

        res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) {
        console.error('Error al actualizar carpeta de capa:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.get('/:id/geologia-muestras', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM geologia_muestras WHERE proyecto_id = $1 ORDER BY id DESC;';
        const result = await db.query(query, [req.params.id]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/geologia-muestras', authenticateToken, authorizeGeologyManage, upload.single('archivo'), async (req, res) => {
    try {
        const proyectoId = req.params.id;
        const { codigo, tipo_roca, progresiva, coordenada_este, coordenada_norte, latitud, longitud, formacion_litologica, descripcion } = req.body;
        let fileUrl = null;

        if (req.file) {
            const safeCode = sanitizeGeologiaStorageSegment(codigo) || 'muestra';
            const safeFilename = req.file.originalname.replace(/[^a-zA-Z0-9-._]/g, '_');
            const targetFolder = getGeologiaStorageFolder(proyectoId, 'muestras');
            const finalFilename = `${safeCode}_${Date.now()}_${safeFilename}`;
            fileUrl = await uploadFileToNAS(req.file.buffer, targetFolder, finalFilename);
        }

        const query = `
            INSERT INTO geologia_muestras 
            (proyecto_id, codigo, tipo_roca, progresiva, coordenada_este, coordenada_norte, latitud, longitud, formacion_litologica, descripcion, archivo_pdf_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
        `;
        const values = [proyectoId, codigo, tipo_roca, progresiva, coordenada_este, coordenada_norte, latitud, longitud, formacion_litologica, descripcion, fileUrl];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id/geologia-muestras/:muestraId', authenticateToken, authorizeGeologyManage, async (req, res) => {
    try {
        const query = 'DELETE FROM geologia_muestras WHERE id = $1 AND proyecto_id = $2 RETURNING *;';
        const result = await db.query(query, [req.params.muestraId, req.params.id]);
        res.status(200).json({ message: 'Eliminado', data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET - Listar todos los registros
router.get('/:id/clasificacion-materiales', authenticateToken, async (req, res) => {
    try {
        const query = 'SELECT * FROM clasificacion_materiales WHERE proyecto_id = $1 ORDER BY id ASC;';
        const result = await db.query(query, [req.params.id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error GET clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Crear un registro individual
router.post('/:id/clasificacion-materiales', authenticateToken, async (req, res) => {
    try {
        const proyectoId = req.params.id;
        const { prog_inicio, prog_fin, descripcion_geotecnica, simbolo, tramo_m,
            pct_roca_fija, pct_roca_suelta, pct_material_suelto, corte_talud,
            long_roca_fija, long_roca_suelta, long_material_suelto, porcentaje,
            grupo_formacion, descripcion_detallada } = req.body;

        const query = `
            INSERT INTO clasificacion_materiales
            (proyecto_id, prog_inicio, prog_fin, descripcion_geotecnica, simbolo, tramo_m,
             pct_roca_fija, pct_roca_suelta, pct_material_suelto, corte_talud,
             long_roca_fija, long_roca_suelta, long_material_suelto, porcentaje,
             grupo_formacion, descripcion_detallada)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *;
        `;
        const values = [proyectoId, prog_inicio, prog_fin, descripcion_geotecnica, simbolo,
            tramo_m || null, pct_roca_fija || null, pct_roca_suelta || null,
            pct_material_suelto || null, corte_talud,
            long_roca_fija || null, long_roca_suelta || null,
            long_material_suelto || null, porcentaje || null,
            grupo_formacion, descripcion_detallada];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error POST clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Subir Excel y parsear filas en batch
router.post('/:id/clasificacion-materiales/upload-excel', authenticateToken, upload.single('archivo'), async (req, res) => {
    try {
        const proyectoId = req.params.id;
        if (!req.file) return res.status(400).json({ error: 'No se proporcionó archivo' });

        const XLSX = require('xlsx');
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use raw array mode to handle complex headers with logos/merged cells
        const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (allRows.length === 0) return res.status(400).json({ error: 'El archivo Excel está vacío' });

        console.log(`[ClasMat] Total raw rows: ${allRows.length}`);
        console.log(`[ClasMat] First 3 rows:`, allRows.slice(0, 3).map(r => r.slice(0, 5)));

        // --- STEP 1: Find the header row that contains "INICIO" or "FIN" ---
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(allRows.length, 20); i++) {
            const rowStr = allRows[i].map(c => String(c).trim().toUpperCase()).join('|');
            if (rowStr.includes('INICIO') && rowStr.includes('FIN')) {
                headerRowIdx = i;
                console.log(`[ClasMat] Header row found at index ${i}: ${rowStr}`);
                break;
            }
        }

        if (headerRowIdx === -1) {
            // Fallback: look for a row that has a progresiva pattern like "0+000"
            for (let i = 0; i < allRows.length; i++) {
                const rowStr = allRows[i].join('|');
                if (/\d\+\d{3}/.test(rowStr)) {
                    headerRowIdx = i - 1; // Assume previous row is header
                    if (headerRowIdx < 0) headerRowIdx = 0;
                    console.log(`[ClasMat] Header guessed at index ${headerRowIdx} (data found at ${i})`);
                    break;
                }
            }
        }

        if (headerRowIdx === -1) {
            return res.status(400).json({ error: 'No se encontraron las columnas INICIO/FIN en el Excel. Asegúrese de que el archivo contenga los encabezados correctos.' });
        }

        // --- STEP 2: Build column index mapping from header row ---
        // Normalizar texto quitando tildes y espacios extras
        const normalizeText = (text) => {
            return String(text)
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .trim().toUpperCase()
                .replace(/\s+/g, ' '); // normalize spaces
        };

        // EXCEL CELDAS COMBINADAS: A veces "DESC GEOTECNICA" está una fila arriba de "INICIO"/"FIN".
        // Vamos a fusionar el texto de las 3 filas anteriores a los datos para armar un encabezado compuesto.
        const headerCells = [];
        const numCols = allRows[headerRowIdx].length;

        for (let col = 0; col < numCols; col++) {
            let combinedHeader = '';
            // Miramos hasta 2 filas más arriba (si existen)
            for (let r = Math.max(0, headerRowIdx - 2); r <= headerRowIdx; r++) {
                if (allRows[r] && allRows[r][col]) {
                    combinedHeader += ' ' + String(allRows[r][col]);
                }
            }
            headerCells.push(normalizeText(combinedHeader));
        }

        console.log(`[ClasMat] Normalized Header cells:`, headerCells);

        // Find column indices by fuzzy matching
        const findColIdx = (candidates) => {
            for (const candidate of candidates) {
                const normCandidate = normalizeText(candidate);
                const idx = headerCells.findIndex(h => h.includes(normCandidate));
                if (idx !== -1) return idx;
            }
            return -1;
        };

        const colIndices = {
            prog_inicio: findColIdx(['INICIO', 'PROG. INICIO', 'PROG INICIO']),
            prog_fin: findColIdx(['FIN', 'PROG. FIN', 'PROG FIN']),
            descripcion_geotecnica: findColIdx(['DESCRIPCION GEOTECNICA', 'DESC. GEOTECNICA', 'DESC GEOTECNICA', 'DESCRIPCION']),
            simbolo: findColIdx(['SIMBOLO', 'SIMB.', 'SIMB']),
            tramo_m: findColIdx(['TRAMO', 'LONGITUD', 'LONG.']),
        };

        // --- TEMPORAL PARA DEBUGGING, BORRAR LUEGO ---
        require('fs').writeFileSync(
            require('path').join(__dirname, '..', 'debug-headers.json'),
            JSON.stringify({ headerCells, colIndices }, null, 2)
        );
        // ---------------------------------------------

        // For percentage columns, find them by order — they come after TRAMO
        // Scan for "ROCA FIJA", "ROCA SUELTA", "MATERIAL SUELTO" in headers
        // These appear twice (once for %, once for longitud)
        const rfIndices = [];
        const rsIndices = [];
        const msIndices = [];
        headerCells.forEach((h, i) => {
            if (h.includes('ROCA FIJA') && !h.includes('SUELTA')) rfIndices.push(i);
            if (h.includes('ROCA SUELTA')) rsIndices.push(i);
            if (h.includes('MATERIAL') && h.includes('SUELTO')) msIndices.push(i);
        });

        colIndices.pct_roca_fija = rfIndices[0] !== undefined ? rfIndices[0] : -1;
        colIndices.pct_roca_suelta = rsIndices[0] !== undefined ? rsIndices[0] : -1;
        colIndices.pct_material_suelto = msIndices[0] !== undefined ? msIndices[0] : -1;
        colIndices.corte_talud = findColIdx(['CORTE', 'TALUD']);
        colIndices.long_roca_fija = rfIndices[1] !== undefined ? rfIndices[1] : -1;
        colIndices.long_roca_suelta = rsIndices[1] !== undefined ? rsIndices[1] : -1;
        colIndices.long_material_suelto = msIndices[1] !== undefined ? msIndices[1] : -1;
        colIndices.porcentaje = findColIdx(['PORCENTAJE']);
        colIndices.grupo_formacion = findColIdx(['UNID. LITOLOGICA', 'UNID LITOLOGICA', 'UNIDAD LITOLOGICA', 'LITOLOGIA', 'GRUPO', 'FORMACION LITOLOGICA', 'FORMACION']);
        colIndices.descripcion_detallada = -1;

        // Last column is usually "Descripcion Geotecnica" (detailed) — find the LAST column with DESC
        for (let i = headerCells.length - 1; i >= 0; i--) {
            if ((headerCells[i].includes('DESCRIPCION') || headerCells[i].includes('DETALLE') || headerCells[i].includes('DESC. DETALLADA')) && i !== colIndices.descripcion_geotecnica) {
                colIndices.descripcion_detallada = i;
                break;
            }
        }

        console.log(`[ClasMat] Column indices:`, colIndices);

        // Delete existing records
        await db.query('DELETE FROM clasificacion_materiales WHERE proyecto_id = $1', [proyectoId]);

        // --- STEP 3: Parse data rows (everything after header row) ---
        const parseNum = (val) => {
            if (val === null || val === undefined || val === '') return null;
            const str = String(val).replace(/[^0-9.\-]/g, '');
            const num = parseFloat(str);
            return isNaN(num) ? null : num;
        };

        const getVal = (row, colIdx) => {
            if (colIdx === -1 || colIdx >= row.length) return null;
            const val = row[colIdx];
            if (val === null || val === undefined || String(val).trim() === '') return null;
            return String(val).trim();
        };

        const limitLen = (str, max) => str ? String(str).substring(0, max) : null;

        let insertedCount = 0;
        for (let i = headerRowIdx + 1; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row || row.length === 0) continue;

            const prog_inicio = limitLen(getVal(row, colIndices.prog_inicio), 20);
            const prog_fin = limitLen(getVal(row, colIndices.prog_fin), 20);

            // Skip rows without progresiva data (empty or header-like)
            if (!prog_inicio && !prog_fin) continue;
            // Skip rows where progresiva looks like a header word
            if (prog_inicio && /^(INICIO|PROGRESIVA|KM)$/i.test(prog_inicio)) continue;

            const values = [
                proyectoId,
                prog_inicio,
                prog_fin,
                limitLen(getVal(row, colIndices.descripcion_geotecnica), 150),
                limitLen(getVal(row, colIndices.simbolo), 50),
                parseNum(getVal(row, colIndices.tramo_m)),
                parseNum(getVal(row, colIndices.pct_roca_fija)),
                parseNum(getVal(row, colIndices.pct_roca_suelta)),
                parseNum(getVal(row, colIndices.pct_material_suelto)),
                limitLen(getVal(row, colIndices.corte_talud), 50),
                parseNum(getVal(row, colIndices.long_roca_fija)),
                parseNum(getVal(row, colIndices.long_roca_suelta)),
                parseNum(getVal(row, colIndices.long_material_suelto)),
                parseNum(getVal(row, colIndices.porcentaje)),
                limitLen(getVal(row, colIndices.grupo_formacion), 150),
                limitLen(getVal(row, colIndices.descripcion_detallada), 500)
            ];

            await db.query(`
                INSERT INTO clasificacion_materiales
                (proyecto_id, prog_inicio, prog_fin, descripcion_geotecnica, simbolo, tramo_m,
                 pct_roca_fija, pct_roca_suelta, pct_material_suelto, corte_talud,
                 long_roca_fija, long_roca_suelta, long_material_suelto, porcentaje,
                 grupo_formacion, descripcion_detallada)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16);
            `, values);
            insertedCount++;
        }

        console.log(`✅ Clasificación de Materiales: ${insertedCount} registros importados para proyecto ${proyectoId}`);
        res.status(200).json({ status: 'ok', message: `${insertedCount} registros importados correctamente`, count: insertedCount });
    } catch (err) {
        console.error('Error upload-excel clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Eliminar un registro individual
router.delete('/:id/clasificacion-materiales/:registroId', authenticateToken, async (req, res) => {
    try {
        const query = 'DELETE FROM clasificacion_materiales WHERE id = $1 AND proyecto_id = $2 RETURNING *;';
        const result = await db.query(query, [req.params.registroId, req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.status(200).json({ message: 'Eliminado', data: result.rows[0] });
    } catch (err) {
        console.error('Error DELETE clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Eliminar TODOS los registros de un proyecto
router.delete('/:id/clasificacion-materiales', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM clasificacion_materiales WHERE proyecto_id = $1;', [req.params.id]);
        res.status(200).json({ message: `${result.rowCount} registros eliminados` });
    } catch (err) {
        console.error('Error DELETE ALL clasificacion-materiales:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
