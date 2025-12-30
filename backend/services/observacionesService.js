const db = require('../conexion');

const observacionesService = {
    // Obtener observaciones por proyecto, tipo y elemento
    getObservaciones: async (projectId, tipo, elementoId) => {
        try {
            const query = `
        SELECT o.*, u.usuario as usuario_nombre
        FROM observaciones_invvial o
        LEFT JOIN usuariost u ON o.usuario_id = u.id
        WHERE o.proyecto_id = $1 AND o.tipo_elemento = $2 AND o.elemento_id = $3
        ORDER BY o.fecha_registro DESC
      `;
            const result = await db.query(query, [projectId, tipo, elementoId]);
            return result.rows;
        } catch (error) {
            console.error('Error getting observaciones:', error);
            throw new Error('Error getting observaciones: ' + error.message);
        }
    },

    // Crear una nueva observación
    createObservacion: async (data, userId) => {
        const { proyecto_id, elemento_id, tipo_elemento, observacion } = data;
        try {
            const query = `
        INSERT INTO observaciones_invvial (proyecto_id, elemento_id, tipo_elemento, observacion, usuario_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
            const values = [proyecto_id, elemento_id, tipo_elemento, observacion, userId];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating observacion:', error);
            throw new Error('Error creating observacion: ' + error.message);
        }
    }
};

module.exports = observacionesService;
