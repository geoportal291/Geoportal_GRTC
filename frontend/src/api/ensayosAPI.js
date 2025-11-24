import axiosInstance from './axios';

export const getTiposDeEnsayo = async () => {
    try {
        const response = await axiosInstance.get('/api/tipos-ensayo');
        return response.data;
    } catch (error) {
        console.error("Error fetching assay types:", error);
        throw error;
    }
};
