const fs = require('fs');
const AdmZip = require('adm-zip');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');

const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <name>Fallas Geológicas</name>
      <Placemark>
        <name>Falla Activa</name>
        <LineString>
          <coordinates>-72.5,-13.5,0 -72.6,-13.6,0</coordinates>
        </LineString>
      </Placemark>
    </Folder>
  </Document>
</kml>`;

const doc = new DOMParser().parseFromString(kmlContent, 'text/xml');
const geojsonData = kml(doc);

console.log(JSON.stringify(geojsonData.features[0].properties, null, 2));
