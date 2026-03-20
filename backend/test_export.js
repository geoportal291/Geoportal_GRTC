const tokml = require('tokml');
const fs = require('fs');

const geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "nombre": "Linea de prueba",
                "stroke": "#ff0000",
                "stroke-width": 5,
                "stroke-opacity": 1.0
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-77.03, -12.04],
                    [-77.04, -12.05]
                ]
            }
        }
    ]
};

try {
    const kmlData = tokml(geojson, {
        name: 'nombre',
        description: 'descripcion',
        documentName: 'Exportacion Geoportal',
        documentDescription: 'Archivo KML exportado desde Geoportal',
        simplestyle: true
    });
    fs.writeFileSync('test_geoportal_export.kml', kmlData, 'utf8');
    console.log("KML generated successfully. Size:", fs.statSync('test_geoportal_export.kml').size, "bytes");
} catch(e) {
    console.error("Error generating KML:", e);
}
