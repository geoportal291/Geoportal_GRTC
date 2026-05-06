import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import alertify from 'alertifyjs';
import './calendar.css';
import esLocale from '@fullcalendar/core/locales/es';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE;


  const fetchAnuncios = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/anuncios/activos`);
      const data = await res.json();

      console.log('Datos recuperados del backend:', data);

      const filteredEvents = data.filter(event => {
        const fechaExpiracion = new Date(event.fecha_expiracion);
        const fechaActual = new Date();
        return fechaExpiracion >= fechaActual;
      });

      console.log('Eventos filtrados:', filteredEvents);

      const formattedEvents = filteredEvents.map(event => {
        const fechaExpiracion = new Date(event.fecha_expiracion);
        const formattedFechaExpiracion = fechaExpiracion.toISOString().split('T')[0];

        const title = event.titulo && event.titulo.trim() !== "" ? event.titulo : "Sin título";
        return {
          title: title,
          start: formattedFechaExpiracion,
          end: formattedFechaExpiracion,
          description: event.contenido,
          expiration: fechaExpiracion.toISOString(),
        };
      });

      console.log('Eventos formateados:', formattedEvents);

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error al cargar los eventos:', error);
      alertify.error('Error al cargar anuncios');
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchAnuncios();
  }, [fetchAnuncios]);


  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-PE');
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  console.log('Eventos para el calendario:', events);

  return (
    <div>
      <h2>Calendario de Anuncios</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        locale={esLocale}
      />


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
