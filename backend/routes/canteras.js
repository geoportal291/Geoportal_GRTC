/**
 * Rutas del dominio de canteras.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/canteras pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const kmlService = require('../services/kmlService');
const canterasService = require('../services/canterasService');
const { upload } = require('../config/multer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ruta para subir una imagen y asociarla a una cantera
router.post('/upload-image', authenticateToken, upload.single('imagen_cantera'), async (req, res) => {
    const { canteraId, descripcion } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }
    if (!canteraId) {
        return res.status(400).json({ error: 'El ID de la cantera es requerido.' });
    }
    try {
        const imageUrl = await canterasService.uploadImage(req.file, req.user.id);
        const nuevaImagen = await canterasService.addImagenToCantera(canteraId, imageUrl, descripcion, req.file.originalname);
        res.status(201).json(nuevaImagen);
    } catch (error) {
        console.error('Error al subir y asociar la imagen de la cantera:', error);
        res.status(500).json({ error: 'Error al procesar la subida de la imagen.', details: error.message });
    }
});

// Ruta para subida masiva (ZIP o Múltiples Imágenes)
router.post('/:canteraId/upload-bulk', authenticateToken, upload.array('files'), async (req, res) => {
    const { canteraId } = req.params;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se subieron archivos.' });
    }
    try {
        const results = await canterasService.uploadBulkImages(req.files, canteraId, req.user.id);
        res.status(201).json({ status: 'ok', uploaded: results.length, images: results });
    } catch (error) {
        console.error('Error al subir imágenes masivas:', error);
        res.status(500).json({ error: 'Error al procesar subida masiva', details: error.message });
    }
});

// Ruta para eliminar una imagen de una cantera
router.delete('/imagenes/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await canterasService.deleteImagen(id);
        res.status(200).json({ status: 'ok', message: 'Imagen eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar la imagen de la cantera:', error);
        res.status(500).json({ error: 'Error al eliminar la imagen.' });
    }
});

// Ruta para eliminación masiva de imágenes
router.post('/imagenes/bulk-delete', authenticateToken, async (req, res) => {
    const { imageIds } = req.body;
    if (!imageIds || !Array.isArray(imageIds)) {
        return res.status(400).json({ error: 'Se requiere un array de IDs de imágenes.' });
    }
    try {
        const result = await canterasService.deleteBulkImagenes(imageIds);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al eliminar imágenes masivas:', error);
        res.status(500).json({ error: 'Error al eliminar imágenes.' });
    }
});

// --------------------- CANTERAS (Existing routes) ---------------------
router.post('/', authenticateToken, async (req, res) => {
    try {
        const canteraData = req.body;
        const userId = req.user.id;
        if (!canteraData) {
            console.error('Error: req.body (canteraData) está vacío o es undefined.');
            return res.status(400).json({ error: 'No se recibieron datos de la cantera.' });
        }
        console.log('DEBUG: /api/canteras - Recibido req.body:', JSON.stringify(canteraData, null, 2));
        const nuevaCantera = await canterasService.createCantera(canteraData, userId);
        res.status(201).json(nuevaCantera);
    } catch (error) {
        console.error('Error al crear cantera en index.js:', error.stack); // Loguear el stack completo
        res.status(500).json({ error: 'Error al crear la cantera', details: error.message });
    }
});

// NEW: UPDATE Cantera
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const updatedCantera = await canterasService.updateCantera(id, req.body);
        res.json(updatedCantera);
    } catch (error) {
        console.error(`Error al actualizar cantera ${id}:`, error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar la cantera.', details: error.message });
    }
});

router.get('/:canteraId/details', authenticateToken, async (req, res) => {
    const { canteraId } = req.params;
    try {
        const details = await canterasService.getCanteraDetailsById(canteraId);
        if (details) {
            res.json(details);
        } else {
            res.status(404).json({ error: 'Cantera no encontrada' });
        }
    } catch (err) {
        console.error(`Error al obtener detalles para la cantera ${canteraId}:`, err);
        res.status(500).json({ error: 'Error al obtener detalles de la cantera', details: err.message });
    }
});

// NEW: DELETE Cantera
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await canterasService.deleteCantera(id);
        if (rowCount === 0) {
            return res.status(404).json({ message: 'Cantera no encontrada para eliminar.' });
        }
        res.status(204).send(); // No Content
    } catch (error) {
        console.error(`Error al eliminar cantera ${id}:`, error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar la cantera.', details: error.message });
    }
});

// Rutas para la gestión de estratos de canteras
router.post('/:canteraId/estratos', authenticateToken, async (req, res) => {
    const { canteraId } = req.params;
    try {
        const nuevoEstrato = await canterasService.createCanteraEstrato(parseInt(canteraId), req.body);
        res.status(201).json(nuevoEstrato);
    } catch (err) {
        console.error('Error al crear estrato de cantera:', err);
        res.status(500).json({ error: 'Error al crear el estrato de la cantera', details: err.message });
    }
});

router.put('/estratos/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        const updatedEstrato = await canterasService.updateCanteraEstrato(parseInt(estratoId), req.body);
        res.status(200).json(updatedEstrato);
    } catch (err) {
        console.error('Error al actualizar estrato de cantera:', err);
        res.status(500).json({ error: 'Error al actualizar el estrato de la cantera', details: err.message });
    }
});

router.delete('/estratos/:estratoId', authenticateToken, async (req, res) => {
    const { estratoId } = req.params;
    try {
        await canterasService.deleteCanteraEstrato(parseInt(estratoId));
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar estrato de cantera:', err);
        res.status(500).json({ error: 'Error al eliminar el estrato de la cantera', details: err.message });
    }
});

// NEW: Endpoint to upload and associate a KML file with a cantera
router.post('/:id/kml', authenticateToken, async (req, res) => {
    const { id: canteraId } = req.params;
    const { kmlContent } = req.body; // Expect KML content directly in body
    const userId = req.user.id;
    try {
        if (!kmlContent) {
            return res.status(400).json({ error: 'No se proporcionó contenido KML.' });
        }
        // 1. Create the KML record in kml_trazados table
        const kmlTrazado = await kmlService.createKmlTrazado(kmlContent, userId);

        // 2. Associate the new KML ID with the cantera
        const updatedCantera = await canterasService.asociarKml(canteraId, kmlTrazado.id);
        res.status(200).json({
            status: 'ok',
            message: 'KML cargado y asociado a la cantera correctamente.',
            cantera: updatedCantera
        });
    } catch (error) {
        console.error(`Error al subir KML para la cantera ${canteraId}:`, error);
        if (error.isCustomError) {
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al subir KML para la cantera.' });
    }
});

module.exports = router;
