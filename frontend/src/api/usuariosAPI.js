import axios from './axios';

export const getUsersGroupedByProject = async () => {
    try {
        const response = await axios.get('/api/usuarios/por-proyecto');
        return response.data;
    } catch (error) {
        console.error('Error fetching users grouped by project', error);
        // No relanzar el error, dejar que el componente decida cómo manejarlo.
    }
};
