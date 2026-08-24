/**
 * Rutas del dominio de zonas-criticas.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/zonas-criticas pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const zonasCriticasService = require('../services/zonasCriticasService');
const { upload } = require('../config/multer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo Excel.' });
        }
        const { projectId, utmZone } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: 'Falta el ID del proyecto.' });
        }

        const result = await zonasCriticasService.processExcelAndSaveZonasCriticas(req.file.buffer, projectId, utmZone);
        res.json(result);
    } catch (err) {
        console.error('Error procesando Excel Zonas Críticas:', err);
        res.status(500).json({ error: 'Error al procesar el archivo Excel', details: err.message });
    }
});

router.get('/:projectId', authenticateToken, async (req, res) => {
    try {
        const data = await zonasCriticasService.getAllZonasCriticas(req.params.projectId);
        res.json(data);
    } catch (err) {
        console.error('Error obteniendo zonas críticas:', err);
        res.status(500).json({ error: 'Error al obtener zonas críticas', details: err.message });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await zonasCriticasService.updateZonaCritica(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Error actualizando zona crítica:', err);
        res.status(500).json({ error: 'Error actualizando zona crítica', details: err.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await zonasCriticasService.deleteZonaCritica(req.params.id);
        res.json(result);
    } catch (err) {
        console.error('Error eliminando zona crítica:', err);
        res.status(500).json({ error: 'Error eliminando zona crítica', details: err.message });
    }
});

router.delete('/delete-excel/:projectId', authenticateToken, async (req, res) => {
    try {
        await zonasCriticasService.deleteExcelAndZonasCriticas(req.params.projectId);
        res.json({ message: 'Datos eliminados correctamente' });
    } catch (err) {
        console.error('Error eliminando datos de Excel de zonas críticas:', err);
        res.status(500).json({ error: 'Error eliminando datos', details: err.message });
    }
});

// --------------------- ZONAS CRITICAS ---------------------
router.get('/by-project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await zonasCriticasService.getAllZonasCriticas(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error getting zonas criticas:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const newZona = await zonasCriticasService.createZonaCritica(req.body);
        res.status(201).json(newZona);
    } catch (err) {
        console.error('Error creating zona critica:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/project/:projectId', authenticateToken, async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await zonasCriticasService.deleteExcelAndZonasCriticas(projectId);
        res.json(result);
    } catch (err) {
        console.error('Error deleting zonas criticas:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
