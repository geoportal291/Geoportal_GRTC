/**
 * Rutas del dominio de fuentes-agua.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/fuentes-agua pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const fuentesAguaService = require('../services/fuentesAguaService');
const { upload } = require('../config/multer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
    try {
        const fuenteData = req.body;
        const userId = req.user.id;
        if (!fuenteData) {
            return res.status(400).json({ error: 'No se recibieron datos de la fuente de agua.' });
        }
        const nuevaFuente = await fuentesAguaService.createFuenteAgua(fuenteData, userId);
        res.status(201).json(nuevaFuente);
    } catch (error) {
        console.error('Error al crear fuente de agua:', error);
        res.status(500).json({ error: 'Error al crear la fuente de agua', details: error.message });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await fuentesAguaService.updateFuenteAgua(id, req.body);
        res.json(updated);
    } catch (error) {
        console.error(`Error al actualizar fuente de agua ${id}:`, error);
        res.status(500).json({ error: 'Error al actualizar la fuente de agua.', details: error.message });
    }
});

router.get('/:fuenteId/details', authenticateToken, async (req, res) => {
    const { fuenteId } = req.params;
    try {
        const details = await fuentesAguaService.getFuenteDetailsById(fuenteId);
        if (details) {
            res.json(details);
        } else {
            res.status(404).json({ error: 'Fuente de agua no encontrada' });
        }
    } catch (err) {
        console.error(`Error al obtener detalles para la fuente de agua ${fuenteId}:`, err);
        res.status(500).json({ error: 'Error al obtener detalles de la fuente de agua', details: err.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await fuentesAguaService.deleteFuenteAgua(id);
        res.status(204).send();
    } catch (error) {
        console.error(`Error al eliminar fuente de agua ${id}:`, error);
        res.status(500).json({ error: 'Error al eliminar la fuente de agua.', details: error.message });
    }
});

router.post('/:fuenteId/upload-bulk', authenticateToken, upload.array('files'), async (req, res) => {
    const { fuenteId } = req.params;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se subieron archivos.' });
    }
    try {
        const results = await fuentesAguaService.uploadBulkImages(req.files, fuenteId, req.user.id);
        res.status(201).json({ status: 'ok', uploaded: results.length, images: results });
    } catch (error) {
        console.error('Error al subir imágenes masivas de fuente de agua:', error);
        res.status(500).json({ error: 'Error al procesar subida masiva', details: error.message });
    }
});

router.delete('/imagenes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await fuentesAguaService.deleteImagen(id);
        res.status(200).json({ status: 'ok', message: 'Imagen eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar la imagen de la fuente de agua:', error);
        res.status(500).json({ error: 'Error al eliminar la imagen.' });
    }
});

router.post('/imagenes/bulk-delete', authenticateToken, async (req, res) => {
    const { imageIds } = req.body;
    if (!imageIds || !Array.isArray(imageIds)) {
        return res.status(400).json({ error: 'Se requiere un array de IDs de imágenes.' });
    }
    try {
        const result = await fuentesAguaService.deleteBulkImagenes(imageIds);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar imágenes masivas de fuente de agua:', error);
        res.status(500).json({ error: 'Error al eliminar imágenes.' });
    }
});

router.post('/:fuenteId/estratos', authenticateToken, async (req, res) => {
    const { fuenteId } = req.params;
    try {
        const nuevoEstrato = await fuentesAguaService.createFuenteEstrato(parseInt(fuenteId), req.body);
        res.status(201).json(nuevoEstrato);
    } catch (err) {
        console.error('Error al crear muestra de fuente de agua:', err);
        res.status(500).json({ error: 'Error al crear la muestra de la fuente de agua', details: err.message });
    }
});

router.put('/estratos/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        const updatedEstrato = await fuentesAguaService.updateFuenteEstrato(parseInt(estratoId), req.body);
        res.status(200).json(updatedEstrato);
    } catch (err) {
        console.error('Error al actualizar muestra de fuente de agua:', err);
        res.status(500).json({ error: 'Error al actualizar la muestra de la fuente de agua', details: err.message });
    }
});

router.delete('/estratos/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        await fuentesAguaService.deleteFuenteEstrato(parseInt(estratoId));
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar muestra de fuente de agua:', err);
        res.status(500).json({ error: 'Error al eliminar la muestra de la fuente de agua', details: err.message });
    }
});

module.exports = router;
