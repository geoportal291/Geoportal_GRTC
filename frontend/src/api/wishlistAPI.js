import axios from './axios';

export const getMyWishlist = async () => {
    try {
        const response = await axios.get('/api/amigo-secreto/wishlist');
        return response.data;
    } catch (error) {
        console.error('Error fetching own wishlist:', error);
        throw error;
    }
};

export const getWishlistByUserId = async (userId) => {
    try {
        const response = await axios.get(`/api/amigo-secreto/wishlist/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching wishlist for user ${userId}:`, error);
        throw error;
    }
};

export const addWishlistItem = async (itemData) => {
    // itemData should be { texto, url, tags }
    // The tags should be an array of strings if not empty
    if (itemData.tags && typeof itemData.tags === 'string') {
        itemData.tags = itemData.tags.split(',').map(t => t.trim()).filter(Boolean);
    } else if (!itemData.tags) {
        itemData.tags = [];
    }
    
    try {
        const response = await axios.post('/api/amigo-secreto/wishlist', itemData);
        return response.data;
    } catch (error) {
        console.error('Error adding wishlist item:', error);
        throw error;
    }
};

export const deleteWishlistItem = async (itemId) => {
    try {
        await axios.delete(`/api/amigo-secreto/wishlist/${itemId}`);
    } catch (error) {
        console.error(`Error deleting wishlist item ${itemId}:`, error);
        throw error;
    }
};
