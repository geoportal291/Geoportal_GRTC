import React, { useState, useEffect, useCallback } from 'react';  
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // Para interacciones como drag & drop
import alertify from 'alertifyjs';
import './calendar.css';  // Importa el archivo de estilos
import esLocale from '@fullcalendar/core/locales/es';  // Importamos el locale de español

export default function Calendar() {
  const [events, setEvents] = useState([]);  // Estado para los eventos del calendario
  const [modalVisible, setModalVisible] = useState(false);  // Estado para controlar la visibilidad del modal
  const [selectedEvent, setSelectedEvent] = useState(null);  // Estado para almacenar el evento seleccionado

  const API_BASE = process.env.REACT_APP_API_BASE;

  // Usamos useCallback para memorizar la función
  const fetchAnuncios = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/anuncios/activos`);
      const data = await res.json();

      console.log('Datos recuperados del backend:', data);  // Verifica si los datos llegan correctamente

      // Filtramos los anuncios para que solo se muestren los que no han expirado
      const filteredEvents = data.filter(event => {
        const fechaExpiracion = new Date(event.fecha_expiracion);
        const fechaActual = new Date();
        return fechaExpiracion >= fechaActual;  // Solo eventos cuya fecha de expiración es posterior a la fecha actual
      });

      console.log('Eventos filtrados:', filteredEvents);  // Verifica los eventos después de ser filtrados

      // Formateamos los anuncios filtrados para el calendario
      const formattedEvents = filteredEvents.map(event => {
        const fechaExpiracion = new Date(event.fecha_expiracion);

        // Convertir la fecha de expiración a formato ISO estándar (YYYY-MM-DD) para FullCalendar
        const formattedFechaExpiracion = fechaExpiracion.toISOString().split('T')[0]; // Solo la fecha (sin hora)

        // Asegurarnos de que el título no esté vacío y no tenga el valor "0"
        const title = event.titulo && event.titulo.trim() !== "" ? event.titulo : "Sin título";  // Si no tiene título, asignamos un valor por defecto

        return {
          title: title,  // Título correcto
          start: formattedFechaExpiracion,  // Solo se muestra la fecha de expiración
          end: formattedFechaExpiracion,  // Añadimos la misma fecha para mantener la coherencia
          description: event.contenido,
          expiration: fechaExpiracion.toISOString(), // Usaremos la fecha completa con hora en el modal
        };
      });

      console.log('Eventos formateados:', formattedEvents);  // Verifica los eventos después de ser formateados

      setEvents(formattedEvents);  // Actualiza el estado de eventos para el calendario
    } catch (error) {
      console.error('Error al cargar los eventos:', error);
      alertify.error('Error al cargar anuncios');
    }
  }, [API_BASE]);  // Dependencia de API_BASE

  useEffect(() => {
    fetchAnuncios();  // Llamamos a la función en el useEffect
  }, [fetchAnuncios]);

  // Función para convertir la fecha en formato local peruano
  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-PE'); // Usamos 'es-PE' para formato en español (Perú)
  };

  // Función para mostrar el modal con los detalles del evento
  const handleEventClick = (info) => {
    setSelectedEvent(info.event);  // Establecemos el evento seleccionado
    setModalVisible(true);  // Mostramos el modal
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  console.log('Eventos para el calendario:', events);  // Verifica si los eventos están bien pasados al FullCalendar

  return (
    <div>
      <h2>Calendario de Anuncios</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}  // Los eventos se pasan desde el estado
        eventClick={handleEventClick}  // Al hacer clic en un evento, muestra el modal
        locale={esLocale}  // Configuramos el idioma a español
      />

      {/* Modal Elegante */}
      {modalVisible && selectedEvent && (
        <div className={`modal-overlay ${modalVisible ? 'open' : ''}`}>
          <div className="modal-content">
            <h3>{selectedEvent.title}</h3>
            <p>{selectedEvent.extendedProps.description}</p>
            <p><strong>Expira:</strong> {formatDate(selectedEvent.extendedProps.expiration)}</p>
            <button className="close-btn" onClick={closeModal}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
