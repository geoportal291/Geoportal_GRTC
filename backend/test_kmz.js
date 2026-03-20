const fs = require('fs');
const AdmZip = require('adm-zip');
const { kml } = require('@tmcw/togeojson');
const { DOMParser } = require('xmldom');

try {
    // Generate a quick dummy KML
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Test Point</name>
      <Point>
        <coordinates>-72.5,-13.5,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

    // Create a KMZ
    const zip = new AdmZip();
    zip.addFile("doc.kml", Buffer.from(kmlContent, "utf8"));
    const kmzBuffer = zip.toBuffer();

    console.log("KMZ Created, size:", kmzBuffer.length);

    // Simulate backend extraction
    const readZip = new AdmZip(kmzBuffer);
    const kmlEntry = readZip.getEntries().find(e => e.entryName.toLowerCase().endsWith('.kml'));
    let extractedKml = readZip.readAsText(kmlEntry);

    console.log("Extracted KML:", extractedKml.substring(0, 50));

    const doc = new DOMParser().parseFromString(extractedKml, 'text/xml');
    const geojsonData = kml(doc);

    console.log("GeoJSON:", JSON.stringify(geojsonData, null, 2));

} catch (err) {
    console.error("Error:", err);
}
