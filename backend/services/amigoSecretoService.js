const db = require('../conexion');

const amigoSecretoService = {
    getParticipantesIds: async () => {
        try {
            const { rows } = await db.query('SELECT usuario_id FROM amigo_secreto_participantes');
            return rows.map(row => row.usuario_id);
        } catch (error) {
            console.error('Error getting participant IDs:', error);
            throw new Error('Error al obtener los participantes.');
        }
    },

    updateParticipantes: async (userIds) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            // Vaciar la tabla actual
            await client.query('TRUNCATE TABLE amigo_secreto_participantes RESTART IDENTITY');
            
            // Si no hay nuevos IDs, terminamos aquí
            if (!userIds || userIds.length === 0) {
                await client.query('COMMIT');
                return { message: 'No se seleccionaron participantes. La lista ha sido vaciada.' };
            }

            // Insertar los nuevos participantes
            const values = userIds.map((id, index) => `($${index + 1})`).join(',');
            const query = `INSERT INTO amigo_secreto_participantes (usuario_id) VALUES ${values}`;
            
            await client.query(query, userIds);
            
            await client.query('COMMIT');
            return { message: `Se han actualizado ${userIds.length} participantes.` };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating participants:', error);
            throw new Error('Error al actualizar la lista de participantes.');
        } finally {
            client.release();
        }
    },

    getMiAmigoSecreto: async (dadorUsuarioId, eventoId) => {
        try {
            const query = `
                SELECT u.nombre, u.ap_paterno, u.ap_materno
                FROM amigo_secreto_asignaciones asa
                JOIN usuariost u ON asa.receptor_usuario_id = u.id
                WHERE asa.dador_usuario_id = $1 AND asa.evento_id = $2;
            `;
            const { rows } = await db.query(query, [dadorUsuarioId, eventoId]);
            if (rows.length === 0) {
                return null; // No assignment found
            }
            const user = rows[0];
            return user.nombre;
        } catch (error) {
            console.error('Error getting secret friend:', error);
            throw new Error('Error al obtener el amigo secreto.');
        }
    }
};

module.exports = amigoSecretoService;
