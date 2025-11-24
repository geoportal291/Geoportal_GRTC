
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'https://backend-weathered-silence-5682.fly.dev' // URL hardcoded temporalmente para fix
});

// Interceptor para añadir el token de autenticación a cada solicitud
axiosInstance.interceptors.request.use(
  (config) => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error("Fallo al parsear el usuario desde localStorage en axios interceptor", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta (como token expirado)
export const setupInterceptors = (logout) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Aquí se podría añadir una lógica más granular si el backend devuelve un código específico para token expirado
        // Por ahora, cualquier 401 o 403 resultará en un logout para estar seguros.
        if (logout) {
          logout();
        }
      }
      return Promise.reject(error);
    }
  );
};

export default axiosInstance;

