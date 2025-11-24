import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

const FitBoundsControl = ({ cu104Route }) => {
  const map = useMap();
  const hasFitted = useRef(false); 

  useEffect(() => {
   
    if (map && cu104Route && cu104Route.length > 0 && !hasFitted.current) {
      const latLngs = cu104Route.map(point => [point.lat, point.lng]);
      
      // Verificar si el mapa tiene el método fitBounds y si está en un estado válido
      // Esto es una medida de seguridad adicional para el error _leaflet_pos
      if (typeof map.fitBounds === 'function' && map._container) {
        try {
          map.fitBounds(latLngs, { padding: [50, 50] });
          hasFitted.current = true; 
        } catch (error) {
          console.error("Error al ajustar los límites del mapa:", error);
        }
      }
    }
  }, [cu104Route, map]);

  return null; 
};

export default FitBoundsControl;