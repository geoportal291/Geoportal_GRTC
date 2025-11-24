import axiosInstance from './axios';

/**
 * Registra un evento de auditoría en el backend.
 * @param {string} accion - La acción que se está registrando (ej. 'PAGE_VIEW', 'BUTTON_CLICK').
 * @param {object} [detalles=null] - Un objeto con detalles adicionales sobre el evento.
 */
export const logAuditEvent = async (accion, detalles = null) => {
  try {
    await axiosInstance.post('/api/audit/log', {
      accion,
      detalles,
    });
  } catch (error) {
    // No bloquear al usuario si la auditoría falla, solo registrar en la consola.
    console.error('Error al registrar evento de auditoría:', error);
  }
};
