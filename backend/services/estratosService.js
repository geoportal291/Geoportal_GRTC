const db = require('../conexion');

const getEstratosByParent = async (parentId, parentType) => {
    if (!parentId || !parentType) {
        throw new Error('Se requiere el ID y el tipo de entidad padre.');
    }
    try {
        const query = `
            SELECT
                id, parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden
            FROM estratos
            WHERE parent_id = $1 AND parent_type = $2
            ORDER BY orden ASC;
        `;
        const result = await db.query(query, [parentId, parentType]);
        return result.rows;
    } catch (err) {
        console.error('Error en getEstratosByParent service:', err);
        throw new Error('Error al obtener estratos por entidad padre.');
    }
};

const createEstrato = async (estratoData) => {
    const { parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden } = estratoData;
    if (!parent_type || !parent_id || !nombre) {
        throw new Error('El tipo de padre, ID de padre y nombre del estrato son requeridos.');
    }
    try {
        const query = `
            INSERT INTO estratos (parent_type, parent_id, nombre, descripcion, cota_inicial, cota_final, orden)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const params = [
            parent_type,
            parent_id,
            nombre,
            descripcion,
            cota_inicial,
            cota_final,
            orden
        ];
        const result = await db.query(query, params);
        return result.rows[0];
    } catch (err) {
        console.error('Error en createEstrato service:', err);
        throw new Error('Error al crear el estrato.');
    }
};

const updateEstrato = async (estratoId, estratoData) => {
    const { nombre, descripcion, cota_inicial, cota_final, orden } = estratoData;
    if (!estratoId || !nombre) {
        throw new Error('El ID del estrato y el nombre son requeridos para actualizar.');
    }
    try {
        const query = `
            UPDATE estratos
            SET
                nombre = $1,
                descripcion = $2,
                cota_inicial = $3,
                cota_final = $4,
                orden = $5
            WHERE id = $6
            RETURNING *;
        `;
        const params = [
            nombre,
            descripcion,
            cota_inicial,
            cota_final,
            orden,
            estratoId
        ];
        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            throw new Error('Estrato no encontrado.');
        }
        return result.rows[0];
    } catch (err) {
        console.error('Error en updateEstrato service:', err);
        throw new Error('Error al actualizar el estrato.');
    }
};

const deleteEstrato = async (estratoId) => {
    if (!estratoId) {
        throw new Error('El ID del estrato es requerido para eliminar.');
    }
    try {
        const query = `
            DELETE FROM estratos
            WHERE id = $1
            RETURNING id;
        `;
        const result = await db.query(query, [estratoId]);
        if (result.rows.length === 0) {
            throw new Error('Estrato no encontrado.');
        }
        return result.rows[0];
    } catch (err) {
        console.error('Error en deleteEstrato service:', err);
        throw new Error('Error al eliminar el estrato.');
    }
};

module.exports = {
    getEstratosByParent,
    createEstrato,
    updateEstrato,
    deleteEstrato,
};