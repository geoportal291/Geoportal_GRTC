const tokml = require('tokml');
const fs = require('fs');

const geojson = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Test Point"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-77.0, -12.0]
      }
    }
  ]
};

const kmlData = tokml(geojson, {
    name: 'nombre',
    description: 'descripcion',
    documentName: 'Exportacion Geoportal',
    documentDescription: 'Archivo KML exportado desde Geoportal',
    simplestyle: true
});

fs.writeFileSync('out_node.kml', kmlData, 'utf8');
