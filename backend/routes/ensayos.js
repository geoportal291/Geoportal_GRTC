/**
 * Rutas del dominio de ensayos.
 *
 * Extraídas de index.js en la fase B4. De cada ruta sólo cambió la primera
 * línea (app.x -> router.x, y el prefijo /api/ensayos pasó al app.use del index);
 * los handlers están verbatim, sin reindentar, para que el inventario de rutas
 * pueda comprobar que no se tocó ni un carácter de su código.
 */

const express = require('express');
const ensayosService = require('../services/ensayosService');
const granulometriaService = require('../services/granulometriaService');
const limiteLiquidoService = require('../services/limiteLiquidoService');
const limitePlasticoService = require('../services/limitePlasticoService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all assays from all canteras
router.get('/canteras', authenticateToken, async (req, res) => {
    try {
        const ensayosList = await ensayosService.getAllCanteraEnsayos();
        res.json(ensayosList);
    } catch (err) {
        console.error('Error al obtener todos los ensayos de canteras:', err);
        res.status(500).json({ error: 'Error al obtener los ensayos de canteras', details: err.message });
    }
});

router.post('/base', authenticateToken, async (req, res) => {
    try {
        const newEnsayo = await ensayosService.createBaseEnsayo(req.body);
        res.status(201).json(newEnsayo);
    } catch (err) {
        console.error('Error al crear ensayo base:', err);
        res.status(500).json({ error: 'Error al crear ensayo base', details: err.message });
    }
});

// Update base assay data (name, status)
router.put('/:id/base', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nombre_ensayo, estado } = req.body;
    try {
        const updatedEnsayo = await ensayosService.updateBaseEnsayo(id, { nombre_ensayo, estado });
        res.json(updatedEnsayo);
    } catch (err) {
        console.error(`Error al actualizar ensayo base ${id}:`, err);
        res.status(500).json({ error: 'Error al actualizar ensayo base', details: err.message });
    }
});

// GET /api/ensayos/details - Nueva ruta para obtener detalles completos de ensayos
router.get('/details', async (req, res) => {
    try {
        const ensayosDetails = await ensayosService.getEnsayosDetails();
        res.json(ensayosDetails);
    } catch (err) {
        console.error('Error al obtener detalles de ensayos:', err);
        res.status(500).json({ error: 'Error al obtener detalles de ensayos', details: err.message });
    }
});

// Get a single assay by ID with all details
router.get('/details/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const ensayoDetails = await ensayosService.getEnsayoDetailsById(id);
        if (ensayoDetails) {
            res.json(ensayoDetails);
        } else {
            res.status(404).json({ error: 'Ensayo no encontrado' });
        }
    } catch (err) {
        console.error(`Error al obtener detalles para el ensayo ${id}:`, err);
        res.status(500).json({ error: 'Error al obtener detalles del ensayo', details: err.message });
    }
});

// Create or Update a full assay
router.post('/full-assay', authenticateToken, async (req, res) => {
    try {
        const result = await ensayosService.createOrUpdateFullAssay(null, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating full assay:', err);
        res.status(500).json({ error: 'Error creating full assay', details: err.message });
    }
});

router.put('/full-assay/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await ensayosService.createOrUpdateFullAssay(id, req.body);
        res.json(result);
    } catch (err) {
        console.error(`Error updating full assay ${id}:`, err);
        res.status(500).json({ error: 'Error updating full assay', details: err.message });
    }
});

// Eliminar un ensayo por ID
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rowCount = await ensayosService.deleteEnsayo(id);
        if (rowCount === 0) {
            return res.status(404).json({ mensaje: 'Ensayo no encontrado para eliminar' });
        }
        res.status(204).send(); // El ensayo fue eliminado correctamente
    } catch (err) {
        console.error('Error al eliminar ensayo:', err);
        res.status(500).json({ status: 'error', mensaje: err.message || 'No se pudo eliminar el ensayo' });
    }
});

// Eliminar ensayos en bulk
router.post('/bulk-delete', authenticateToken, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de IDs.' });
    }
    try {
        const rowCount = await ensayosService.bulkDeleteEnsayos(ids);
        if (rowCount > 0) {
            res.json({ status: 'ok', mensaje: `${rowCount} ensayos eliminados correctamente` });
        } else {
            res.status(404).json({ status: 'error', mensaje: 'No se encontraron ensayos para eliminar' });
        }
    } catch (err) {
        console.error('Error en POST /ensayos/bulk-delete:', err);
        res.status(500).json({ error: 'Error al eliminar ensayos en bulk', details: err.message });
    }
});

// NEW: Ruta para crear un ensayo de granulometría
router.post('/granulometria', authenticateToken, async (req, res) => {
    try {
        const newGranulometria = await granulometriaService.createGranulometria(req.body);
        res.status(201).json(newGranulometria);
    } catch (err) {
        console.error('Error al crear ensayo de granulometría:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el ensayo de granulometría' });
    }
});

// NEW: Ruta para crear un ensayo de límite líquido
router.post('/limite-liquido', authenticateToken, async (req, res) => {
    try {
        const newLimiteLiquido = await limiteLiquidoService.createLimiteLiquido(req.body);
        res.status(201).json(newLimiteLiquido);
    } catch (err) {
        console.error('Error al crear ensayo de límite líquido:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el ensayo de límite líquido' });
    }
});

// NEW: Ruta para crear un ensayo de límite plástico
router.post('/limite-plastico', authenticateToken, async (req, res) => {
    try {
        const newLimitePlastico = await limitePlasticoService.createLimitePlastico(req.body);
        res.status(201).json(newLimitePlastico);
    } catch (err) {
        console.error('Error al crear ensayo de límite plástico:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al crear el ensayo de límite plástico' });
    }
});

// NEW: Ruta para actualizar un ensayo de granulometría
router.put('/granulometria/:ensayo_id', authenticateToken, async (req, res) => {
    const { ensayo_id } = req.params;
    try {
        const updated = await granulometriaService.updateGranulometria(ensayo_id, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Error al actualizar ensayo de granulometría:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar el ensayo de granulometría' });
    }
});

// NEW: Ruta para actualizar un ensayo de límite líquido
router.put('/limite-liquido/:ensayo_id', authenticateToken, async (req, res) => {
    const { ensayo_id } = req.params;
    try {
        const updated = await limiteLiquidoService.updateLimiteLiquido(ensayo_id, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Error al actualizar ensayo de límite líquido:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar el ensayo de límite líquido' });
    }
});

// NEW: Ruta para actualizar un ensayo de límite plástico
router.put('/limite-plastico/:ensayo_id', authenticateToken, async (req, res) => {
    const { ensayo_id } = req.params;
    try {
        const updated = await limitePlasticoService.updateLimitePlastico(ensayo_id, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Error al actualizar ensayo de límite plástico:', err);
        res.status(500).json({ status: 'error', mensaje: 'Error al actualizar el ensayo de límite plástico' });
    }
});

// EXPORTACIÓN DE ENSAYOS DE CANTERAS (POR TIPO DE ENSAYO GLOBAL)
router.get('/canteras/exportar-tipo/:tipoEnsayoId', authenticateToken, async (req, res) => {
    const { tipoEnsayoId } = req.params;
    try {
        const fileBuffer = await ensayosService.exportCanteraEnsayosToExcelByTipo(tipoEnsayoId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="ensayos_canteras_tipo_${tipoEnsayoId}.xlsx"`);
        res.send(fileBuffer);
    } catch (err) {
        console.error(`Error al exportar ensayos de cantera por tipo ${tipoEnsayoId}:`, err);
        res.status(500).json({ error: 'Error al exportar ensayos de cantera a Excel', details: err.message });
    }
});

module.exports = router;
