import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import axiosInstance from '../../../../api/axios';
import { saveAs } from 'file-saver';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import shp from 'shpjs';
import ErrorBoundary from '../../../ErrorBoundary';

const GeoTestPage = () => {
  const [importedGeoJsonLayers, setImportedGeoJsonLayers] = React.useState([]); // array de capas

  const handleKmlFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const kmlText = e.target.result;
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
        const converted = kml(kmlDoc);

        const newLayer = {
          id: Date.now(),
          name: file.name,
          geojson: converted,
          visible: true,
        };
        setImportedGeoJsonLayers(prev => [...prev, newLayer]);
      } catch (error) {
        console.error('Error al procesar el archivo KML:', error);
        alert('Error al procesar el archivo KML. Asegúrate de que sea válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleShapefileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result;
        const geojson = await shp(buffer);

        let combinedGeoJson = { type: 'FeatureCollection', features: [] };

        if (Array.isArray(geojson)) {
          geojson.forEach(fc => {
            if (fc.type === 'FeatureCollection') {
              combinedGeoJson.features = combinedGeoJson.features.concat(fc.features);
            }
          });
        } else if (geojson.type === 'FeatureCollection') {
          combinedGeoJson = geojson;
        }

        const newLayer = {
          id: Date.now(),
          name: file.name,
          geojson: combinedGeoJson,
          visible: true,
        };
        setImportedGeoJsonLayers(prev => [...prev, newLayer]);
      } catch (error) {
        console.error('Error al procesar el Shapefile:', error);
        alert('Error al procesar el Shapefile. Asegúrate de que sea un ZIP válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleToggleLayerVisibility = (id) => {
    setImportedGeoJsonLayers(prev =>
      prev.map(layer =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const handleClearMap = () => {
    setImportedGeoJsonLayers([]);
    const kmlFileInput = document.getElementById('kml-upload');
    if (kmlFileInput) kmlFileInput.value = '';
    const shpFileInput = document.getElementById('shp-upload');
    if (shpFileInput) shpFileInput.value = '';
  };

  const handleExportKML = async () => {
    if (importedGeoJsonLayers.length === 0) {
      alert('No hay datos cargados para exportar a KML.');
      return;
    }
    const geoJsonToExport =
      importedGeoJsonLayers.find(layer => layer.visible)?.geojson ||
      importedGeoJsonLayers[0]?.geojson;

    try {
      const response = await axiosInstance.post('/api/trafico/exportar-kml', geoJsonToExport, {
        responseType: 'blob',
      });
      saveAs(response.data, 'exportacion_prueba.kml');
    } catch (error) {
      console.error('Error al exportar a KML:', error);
      alert('Error al exportar a KML.');
    }
  };

  const handleExportShapefile = async () => {
    if (importedGeoJsonLayers.length === 0) {
      alert('No hay datos cargados para exportar a Shapefile.');
      return;
    }
    const geoJsonToExport =
      importedGeoJsonLayers.find(layer => layer.visible)?.geojson ||
      importedGeoJsonLayers[0]?.geojson;

    try {
      const response = await axiosInstance.post('/api/trafico/exportar-shapefile', geoJsonToExport, {
        responseType: 'blob',
      });
      saveAs(response.data, 'exportacion_prueba.zip');
    } catch (error) {
      console.error('Error al exportar a Shapefile:', error);
      alert('Error al exportar a Shapefile.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <br />
      <h2>prueba geoespacial</h2>
      

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleExportKML} style={{ padding: '10px 20px', fontSize: '16px', border: '1px solid #007bff', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white' }}>
          Exportar a KML
        </button>
        <button onClick={handleExportShapefile} style={{ padding: '10px 20px', fontSize: '16px', border: '1px solid #007bff', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white' }}>
          Exportar a Shapefile (ZIP)
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label htmlFor="kml-upload" style={{ padding: '10px 20px', fontSize: '16px', border: '1px solid #28a745', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white' }}>
          Importar KML
        </label>
        <input id="kml-upload" type="file" accept=".kml" onChange={handleKmlFileChange} style={{ display: 'none' }} />

        <label htmlFor="shp-upload" style={{ padding: '10px 20px', fontSize: '16px', border: '1px solid #28a745', borderRadius: '5px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white' }}>
          Importar Shapefile (ZIP)
        </label>
        <input id="shp-upload" type="file" accept=".zip" onChange={handleShapefileChange} style={{ display: 'none' }} />

        {importedGeoJsonLayers.length > 0 && (
          <>
            <span style={{ fontSize: '14px', color: 'green' }}>
              {importedGeoJsonLayers.length} capa(s) cargada(s)
            </span>
            <button
              onClick={handleClearMap}
              style={{ backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Limpiar Mapa
            </button>
          </>
        )}
      </div>

      {/* Leyenda de capas */}
      {importedGeoJsonLayers.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Leyenda de Capas</h3>
          <ul>
            {importedGeoJsonLayers.map(layer => (
              <li key={layer.id}>
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => handleToggleLayerVisibility(layer.id)}
                />
                {layer.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ height: '500px', width: '100%', border: '1px solid #ccc' }}>
        <ErrorBoundary>
          <MapContainer center={[-12.61, -72.53]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
         {importedGeoJsonLayers.map(layer => (
            layer.visible && (
              <GeoJSON
                key={layer.id}
                data={layer.geojson}
                style={{ color: 'blue' }}
                pointToLayer={(feature, latlng) =>
                  L.circleMarker(latlng, {
                    radius: 8,
                    fillColor: '#ff7800',
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                  })
                }
                onEachFeature={(feature, layer) => {
                  if (feature.properties) {
                    console.log('Propiedades del feature:', feature.properties); // Para depuración
                    let popupContent = '<div style="padding: 5px; font-size: 14px;"><h4>Información de punto</h4>';
                    const name = feature.properties.name || feature.properties.Name || feature.properties.NOMBRE || 'Sin nombre';
                    const description = feature.properties.description || feature.properties.Description || feature.properties.DESCRIPCION || feature.properties.desc || '';
                    
                    popupContent += `<p><strong>Nombre:</strong> ${name}</p>`;
                    
                    if (description) {
                      popupContent += `<p><strong>Descripción:</strong> ${description}</p>`;
                    } else {
                      popupContent += `<p><em>No hay descripción disponible.</em></p>`;
                    }
                    
                    popupContent += '</div>';
                    layer.bindPopup(popupContent);
                  }
                }}
              />
            )
          ))}
        </MapContainer>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default GeoTestPage;
