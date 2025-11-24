import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import axiosInstance from '../../api/axios';
import { toLatLon } from 'utm';

export default function TestMapWithRoute() {
  const [rutas, setRutas] = useState([]);
  const [stationData, setStationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("useEffect called");
    const fetchRutasAndEstaciones = async () => {
      try {
        setLoading(true);
        const [rutasResponse, elementosResponse] = await Promise.all([
          axiosInstance.get('/api/ruta-kml'),
          axiosInstance.get('/api/elementos-trafico')
        ]);

        console.log("rutasResponse:", rutasResponse);
        console.log("elementosResponse:", elementosResponse);

        setRutas(rutasResponse.data);
       const estaciones = {};
        console.log("Procesando estaciones:");
        elementosResponse.data.forEach(item => {
          if (item.tipo === 'estacion') {
            console.log(`--- Estación: ${item.id} ---`);
            console.log(`--- Estación: ${item.id} ---`);
            console.log("Coordenadas originales (raw):", item.coordenadas);
            const coordMatch = item.coordenadas.match(/(\d+\.?\d*)\s*E,\s*(\d+\.?\d*)\s*N/);
            console.log("Resultado del match (regex):", coordMatch);
            if (coordMatch && coordMatch.length === 3) {
                const easting = parseFloat(coordMatch[1]);
                const northing = parseFloat(coordMatch[2]);
                console.log("Parsed Easting:", easting, "Parsed Northing:", northing);
                const zoneNum = 18;
                const zoneLetter = 'L';

                try {
                    const latlon = toLatLon(easting, northing, zoneNum, zoneLetter);
                    item.lat = latlon.latitude;
                    item.lng = latlon.longitude;
                    console.log("Conversión exitosa. Lat:", item.lat, "Lng:", item.lng);
                } catch (e) {
                    console.error("Error converting UTM to Lat/Lon for station:", item.id, e);
                    item.lat = undefined; // Ensure lat/lng are undefined on error
                    item.lng = undefined;
                }
            } else {
                console.warn("No se pudieron parsear las coordenadas para la estación:", item.id, "Coordenadas:", item.coordenadas);
                item.lat = undefined; // Ensure lat/lng are undefined if parsing fails
                item.lng = undefined;
            }
            estaciones[item.id] = { info: item };
            console.log("Datos finales de la estación para el mapa:", estaciones[item.id]);
          }
        });
        setStationData(estaciones);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRutasAndEstaciones();
  }, []);

  if (loading) {
    return <div>CARGANDO DATOS</div>;
  }

  if (error) {
    return <div>Error al cargar datos: {error.message}</div>;
  }

  const routeSegments = rutas.map(ruta => ruta.positions);
  const initialCenter = routeSegments.length > 0 && routeSegments[0].length > 0 
    ? routeSegments[0][0] 
    : [-12.5, -72.5];

  console.log("stationData final para renderizado:", stationData);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer center={initialCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {routeSegments.map((segment, idx) => (
          <Polyline key={idx} positions={segment} pathOptions={{ color: 'red', weight: 5 }} />
        ))}
        {Object.values(stationData).map((station) => (
          station.info.lat && station.info.lng && (
            <Marker key={station.info.id} position={[station.info.lat, station.info.lng]}>
              <Popup>
                {station.info.nombre}
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}