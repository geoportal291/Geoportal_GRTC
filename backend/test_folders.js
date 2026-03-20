const fs = require('fs');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');
const { injectFoldersToGeoJSON } = require('./utils/kmlFolderInjector');

const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <name>Fallas Geologicas 2024</name>
      <Placemark>
        <name>Falla Inversa Principal</name>
        <LineString>
          <coordinates>-72.5,-13.5,0 -72.6,-13.6,0</coordinates>
        </LineString>
      </Placemark>
    </Folder>
  </Document>
</kml>`;

const doc = new DOMParser().parseFromString(kmlContent, 'text/xml');
let geojsonData = kml(doc);

console.log("ANTES:");
console.log(JSON.stringify(geojsonData.features[0].properties, null, 2));

geojsonData = injectFoldersToGeoJSON(kmlContent, geojsonData);

console.log("\nDESPUES:");
console.log(JSON.stringify(geojsonData.features[0].properties, null, 2));

