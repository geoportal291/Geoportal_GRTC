const db = require('../conexion');

/**
 * Obtiene todos los modelos 3D, opcionalmente filtrados por proyecto o tramo
 */
const getModelos3D = async (proyectoId, tramoId) => {
    try {
        let query = 'SELECT m.*, u.nombre as subido_por_nombre FROM modelos_3d m LEFT JOIN usuariost u ON m.subido_por = u.id WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (proyectoId) {
            query += ` AND m.proyecto_id = $${paramIndex}`;
            params.push(proyectoId);
            paramIndex++;
        }

        if (tramoId) {
            query += ` AND m.tramo_id = $${paramIndex}`;
            params.push(tramoId);
            paramIndex++;
        }

        query += ' ORDER BY m.fecha_subida DESC';

        const result = await db.query(query, params);
        return result.rows;
    } catch (err) {
        console.error('Error al obtener modelos 3D:', err);
        throw new Error('Error al obtener los modelos 3D.');
    }
};

/**
 * Obtiene un modelo 3D por su ID
 */
const getModelo3DById = async (id) => {
    try {
        const result = await db.query('SELECT * FROM modelos_3d WHERE id = $1 LIMIT 1', [id]);
        return result.rows[0] || null;
    } catch (err) {
        console.error('Error al obtener modelo 3D por ID:', err);
        throw new Error('Error al obtener el modelo 3D.');
    }
};

/**
 * Registra un nuevo modelo 3D en la base de datos
 */
const createModelo3D = async (modeloData) => {
    const {
        proyecto_id,
        tramo_id,
        nombre_archivo,
        tipo,
        url_archivo,
        tamano_bytes,
        subido_por,
        metadata,
        estado,
        es_tramo_completo
    } = modeloData;

    try {
        const result = await db.query(`
            INSERT INTO modelos_3d (
                proyecto_id, tramo_id, nombre_archivo, tipo, url_archivo, tamano_bytes, subido_por, metadata, estado, es_tramo_completo
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            proyecto_id || null,
            tramo_id || null,
            nombre_archivo,
            tipo,
            url_archivo,
            tamano_bytes || null,
            subido_por || null,
            metadata || null,
            estado || 'COMPLETADO',
            es_tramo_completo || false
        ]);
        return result.rows[0];
    } catch (err) {
        console.error('Error al crear registro de modelo 3D:', err);
        throw new Error('Error al registrar el modelo 3D en la base de datos.');
    }
};

/**
 * Elimina un modelo 3D por su ID
 */
const deleteModelo3D = async (id) => {
    try {
        const result = await db.query('DELETE FROM modelos_3d WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    } catch (err) {
        console.error('Error al eliminar modelo 3D:', err);
        throw new Error('Error al eliminar el modelo 3D.');
    }
};

module.exports = {
    getModelos3D,
    getModelo3DById,
    createModelo3D,
    deleteModelo3D
};
