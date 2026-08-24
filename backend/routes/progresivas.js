/**
 * Rutas del dominio de progresivas.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/progresivas pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const progresivasService = require('../services/progresivasService');
const { upload } = require('../config/multer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:id/imagenes', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await progresivasService.getImagenesByProgresivaId(id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// NEW: Endpoint to upload KML file for a specific Progresiva (Tramo)
router.post('/:id/upload-kml', authenticateToken, upload.single('kmlFile'), async (req, res) => {
    const { id } = req.params;
    const { type } = req.body; // Extract type (trazado or puntos)
    const userId = req.user.id;

    console.log(`[DEBUG] POST /api/progresivas/${id}/upload-kml - Type: ${type}, File: ${req.file?.originalname}`);

    if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ningún archivo KML/KMZ.' });
    }

    try {
        const result = await progresivasService.uploadKmlToProgresiva(id, req.file, userId, type);
        console.log(`[DEBUG] upload-kml success for ID ${id}`);
        res.status(201).json(result);
    } catch (error) {
        console.error(`[DEBUG] Error al subir KML para la progresiva ${id}:`, error);
        res.status(500).json({ error: error.message || 'Error interno del servidor al subir KML.' });
    }
});

router.delete('/:progresivaId/kml', authenticateToken, async (req, res) => {
    const { progresivaId } = req.params;
    try {
        const result = await progresivasService.deleteKmlFromProgresiva(progresivaId);
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al eliminar KML de la progresiva ${progresivaId}:`, error);
        if (error.isCustomError) {
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al eliminar KML de la progresiva.' });
    }
});

// Obtener progresivas principales
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { selectedProjectId } = req.query; // Get selectedProjectId from query parameters
        const progresivas = await progresivasService.getProgresivas(req.user, selectedProjectId);
        res.json(progresivas);
    } catch (err) {
        console.error('Error al obtener progresivas:', err);
        res.status(500).json({ error: 'Error al obtener progresivas', details: err.message });
    }
});

// Eliminar progresivas en bulk (usando POST para mayor compatibilidad)
// NEW: Create single progresiva (for KML import etc)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const newProg = await progresivasService.createProgresiva(req.body);
        res.status(201).json(newProg);
    } catch (err) {
        console.error('Error creating progresiva:', err);
        res.status(500).json({ error: 'Error al crear progresiva', details: err.message });
    }
});

router.post('/bulk-delete', authenticateToken, async (req, res) => {
    const { ids } = req.body; // Se espera un array de IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de IDs.' });
    }
    try {
        const rowCount = await progresivasService.bulkDeleteProgresivas(ids);
        if (rowCount > 0) {
            res.json({ status: 'ok', mensaje: `${rowCount} progresivas eliminadas correctamente` });
        } else {
            res.status(404).json({ status: 'error', mensaje: 'No se encontraron progresivas para eliminar' });
        }
    } catch (err) {
        console.error('Error en POST /progresivas/bulk-delete:', err.stack); // Log the full stack
        res.status(500).json({ error: 'Error al eliminar progresivas en bulk', details: err.message, stack: err.stack }); // Also send stack in response for debugging
    }
});

// Nueva ruta para importar progresivas con creación automática de ensayos
router.post('/importar-con-ensayos', authenticateToken, async (req, res) => {
    try {
        const { parentProgresiva, reconstructedSubProgresivas, estratosSeleccionados, tiposEnsayoIds } = req.body;
        const servicePayload = {
            parentProgresiva,
            generatedChildren: reconstructedSubProgresivas,
            estratosSeleccionados,
            tiposEnsayoIds
        };
        const result = await progresivasService.importarConEnsayos(servicePayload);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error al importar con ensayos automáticos:', error);
        if (error && error.type) {
            const statusCode = error.type === 'ExcelDataValidationError' ? 400 : 500;
            res.status(statusCode).json(error);
        } else {
            res.status(500).json({ error: 'Error en /progresivas/importar-con-ensayos', details: error.message || 'Error desconocido' });
        }
    }
});

router.put('/importar-con-ensayos/:overwriteProgresivaId', authenticateToken, async (req, res) => {
    const { overwriteProgresivaId } = req.params;
    try {
        // Mapeo del payload del frontend al esperado por el servicio
        const { parentProgresiva, reconstructedSubProgresivas, estratosSeleccionados, tiposEnsayoIds } = req.body;
        const servicePayload = {
            parentProgresiva,
            generatedChildren: reconstructedSubProgresivas, // Renombrar la propiedad
            estratosSeleccionados,
            tiposEnsayoIds
        };
        const result = await progresivasService.updateAndImportConEnsayos(overwriteProgresivaId, servicePayload);
        res.status(200).json(result);
    } catch (error) {
        console.error(`Error al actualizar e importar tramo ${overwriteProgresivaId}:`, error.stack); // Loguear el stack completo
        if (error && error.type) {
            const statusCode = error.type === 'ExcelDataValidationError' ? 400 : 500;
            res.status(statusCode).json(error);
        } else {
            res.status(500).json({ error: `Error en /progresivas/importar-con-ensayos/${overwriteProgresivaId}`, details: error.message || 'Error desconocido' });
        }
    }
});

router.get('/:id/children', authenticateToken, progresivasService.getSubProgresivas);

// Nueva ruta para TODAS las sub-progresivas (para el Listado General)
router.get('/:id/children/all', authenticateToken, progresivasService.getAllSubProgresivas);

router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const progresiva = await progresivasService.getProgresivaById(id);
        if (!progresiva) {
            return res.status(404).json({ error: 'Progresiva no encontrada' });
        }
        res.json(progresiva);
    } catch (err) {
        console.error('Error al obtener progresiva por ID:', err);
        res.status(500).json({ error: 'Error al obtener progresiva por ID', details: err.message });
    }
});

router.get('/:progresivaId/page', authenticateToken, async (req, res) => {
    const { progresivaId } = req.params;
    try {
        const result = await progresivasService.getProgresivaPage(progresivaId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Error getting progresiva page', details: err.message });
    }
});

// Nueva ruta para obtener progresivas por proyectoId
router.get('/proyecto/:proyectoId', authenticateToken, async (req, res) => {
    const { proyectoId } = req.params;
    try {
        const progresivas = await progresivasService.getProgresivasByProyectoId(proyectoId);
        res.json(progresivas);
    } catch (err) {
        console.error('Error al obtener progresivas por proyectoId:', err);
        res.status(500).json({ error: 'Error al obtener progresivas por proyectoId', details: err.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await progresivasService.deleteProgresiva(id);
        if (rowCount > 0) {
            res.json({ status: 'ok', mensaje: 'Progresiva eliminada correctamente' });
        } else {
            res.status(404).json({ status: 'error', mensaje: 'Progresiva no encontrada' });
        }
    } catch (err) {
        console.error('Error al eliminar progresiva:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al eliminar progresiva' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await progresivasService.updateProgresiva(id, req.body);
        res.json(result);
    } catch (err) {
        console.error('Error al actualizar progresiva:', err);
        res.status(500).json({ error: 'Error al actualizar la progresiva', details: err.message });
    }
});

router.put('/child/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await progresivasService.updateChildProgresiva(id, req.body);
        res.json(result);
    } catch (err) {
        console.error('Error al actualizar progresiva hija:', err);
        res.status(500).json({ error: 'Error al actualizar la progresiva hija', details: err.message });
    }
});

module.exports = router;
