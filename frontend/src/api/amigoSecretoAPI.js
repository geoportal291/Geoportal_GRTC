import axios from './axios';

export const getAmigoSecretoParticipantes = async () => {
    try {
        const response = await axios.get('/api/amigo-secreto/participantes');
        return response.data;
    } catch (error) {
        console.error('Error fetching Amigo Secreto participants:', error);
        throw error;
    }
};

export const updateAmigoSecretoParticipantes = async (userIds) => {
    try {
        const response = await axios.post('/api/amigo-secreto/participantes', { userIds });
        return response.data;
    } catch (error) {
        console.error('Error updating Amigo Secreto participants:', error);
        throw error;
    }
};

export const getMiAmigoAsignado = async (eventoId) => {
    try {
        const response = await axios.get(`/api/eventos/${eventoId}/asignacion`);
        return response.data;
    } catch (error) {
        console.error('Error fetching assigned friend:', error);
        throw error;
    }
};
