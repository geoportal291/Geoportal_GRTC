const db = require('../conexion');

const wishlistService = {
    getWishlistByUserId: async (userId) => {
        try {
            const { rows } = await db.query(
                'SELECT id, texto, url, tags FROM amigo_secreto_wishlist_items WHERE usuario_id = $1 ORDER BY creado_en DESC',
                [userId]
            );
            return rows;
        } catch (error) {
            console.error(`Error fetching wishlist for user ${userId}:`, error);
            throw new Error('Error al obtener la lista de deseos.');
        }
    },

    addWishlistItem: async (userId, itemData) => {
        const { texto, url, tags } = itemData;
        if (!texto) {
            throw new Error('El texto del deseo no puede estar vacío.');
        }
        try {
            const { rows } = await db.query(
                'INSERT INTO amigo_secreto_wishlist_items (usuario_id, texto, url, tags) VALUES ($1, $2, $3, $4) RETURNING *',
                [userId, texto, url, tags]
            );
            return rows[0];
        } catch (error) {
            console.error(`Error adding item for user ${userId}:`, error);
            throw new Error('Error al añadir el deseo a la lista.');
        }
    },

    deleteWishlistItem: async (itemId, userId) => {
        try {
            // Se verifica que el item pertenezca al usuario que intenta borrarlo
            const { rowCount } = await db.query(
                'DELETE FROM amigo_secreto_wishlist_items WHERE id = $1 AND usuario_id = $2',
                [itemId, userId]
            );
            return rowCount; // Retorna 1 si se borró, 0 si no se encontró o no tenía permiso
        } catch (error) {
            console.error(`Error deleting item ${itemId} for user ${userId}:`, error);
            throw new Error('Error al eliminar el deseo.');
        }
    }
};

module.exports = wishlistService;
