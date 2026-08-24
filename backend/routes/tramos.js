/**
 * Rutas del dominio de tramos.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/tramos pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const ensayosService = require('../services/ensayosService');
const progresivasService = require('../services/progresivasService');
const canterasService = require('../services/canterasService');
const fuentesAguaService = require('../services/fuentesAguaService');
const { upload } = require('../config/multer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// --------------------- ENSAYOS ---------------------
// Get all assays for a specific tramo
router.get('/:tramoId/ensayos', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    console.log(`[DEBUG] GET /api/tramos/${tramoId}/ensayos hit`);
    try {
        const ensayosList = await ensayosService.getEnsayosByTramoId(tramoId);
        console.log(`[DEBUG] ensayosList count: ${ensayosList.length}`);
        const tramoInfo = await progresivasService.getProgresivaById(tramoId);
        console.log(`[DEBUG] tramoInfo found: ${!!tramoInfo}`);
        res.json({
            ensayos: ensayosList,
            tramo: tramoInfo
        });
    } catch (err) {
        console.error(`[ERROR] Error al obtener ensayos para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al obtener los ensayos del tramo', details: err.message });
    }
});

router.post('/:tramoId/upload-docx-photos', authenticateToken, upload.single('docxFile'), async (req, res) => {
    try {
        const { tramoId } = req.params;
        if (!req.file) throw new Error('No se recibió archivo DOCX.');

        const result = await progresivasService.processDocxUpload(req.file, tramoId, req.user.id);

        res.json({ status: 'ok', summary: result });
    } catch (err) {
        console.error('DOCX Upload Error:', err);
        res.status(500).json({ error: err.message, details: err.stack });
    }
});

router.get('/:tramoId/canteras', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    try {
        const canteras = await canterasService.getCanterasByTramoId(tramoId);
        res.json(canteras);
    } catch (err) {
        console.error(`Error al obtener canteras para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al obtener canteras por tramo', details: err.message });
    }
});

// --------------------- FUENTES DE AGUA ---------------------
router.get('/:tramoId/fuentes-agua', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    try {
        const fuentes = await fuentesAguaService.getFuentesAguaByTramoId(tramoId);
        res.json(fuentes);
    } catch (err) {
        console.error(`Error al obtener fuentes de agua para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al obtener fuentes de agua por tramo', details: err.message });
    }
});

// NEW: Get a single tramo by ID (using progresivasService as tramos are parent progresivas)
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const tramo = await progresivasService.getProgresivaById(id);
        if (!tramo) {
            return res.status(404).json({ error: 'Tramo no encontrado' });
        }
        res.json(tramo);
    } catch (err) {
        console.error(`Error al obtener tramo por ID ${id}:`, err);
        res.status(500).json({ error: 'Error al obtener tramo por ID', details: err.message });
    }
});

// NEW: Export assays by tramo to Excel
router.get('/:tramoId/ensayos/export-excel', authenticateToken, async (req, res) => {
    const { tramoId } = req.params;
    try {
        const fileBuffer = await ensayosService.exportEnsayosToExcelByTramo(tramoId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="ensayos_tramo_${tramoId}.xlsx"`);
        res.send(fileBuffer);
    } catch (err) {
        console.error(`Error al exportar ensayos para el tramo ${tramoId}:`, err);
        res.status(500).json({ error: 'Error al exportar ensayos a Excel', details: err.message });
    }
});

// NEW: Export assays by tramo AND type to Excel
router.get('/:tramoId/ensayos/export-excel/:tipoEnsayoId', authenticateToken, async (req, res) => {
    const { tramoId, tipoEnsayoId } = req.params;
    try {
        const fileBuffer = await ensayosService.exportEnsayosToExcelByTipo(tramoId, tipoEnsayoId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="ensayos_tramo_${tramoId}_tipo_${tipoEnsayoId}.xlsx"`);
        res.send(fileBuffer);
    } catch (err) {
        console.error(`Error al exportar ensayos para el tramo ${tramoId} y tipo ${tipoEnsayoId}:`, err);
        res.status(500).json({ error: 'Error al exportar ensayos a Excel por tipo', details: err.message });
    }
});

module.exports = router;
