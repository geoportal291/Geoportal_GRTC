const { XMLParser } = require('fast-xml-parser');

/**
 * Parsea el KML para extraer la relación entre Placemarks y su Folder padre
 * y lo inyecta en el GeoJSON generado por togeojson.
 */
function injectFoldersToGeoJSON(kmlText, geojsonData) {
    if (!geojsonData || !geojsonData.features) return geojsonData;

    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });

        const xmlObj = parser.parse(kmlText);
        const placemarkFolderMap = new Map(); // name -> folderName

        // Helper recursivo para buscar Folders
        function traverse(node, currentFolderName) {
            if (!node) return;

            // Si es un array de nodos (ej. múltiples Folders al mismo nivel)
            if (Array.isArray(node)) {
                node.forEach(n => traverse(n, currentFolderName));
                return;
            }

            // Si encontramos un Folder, actualizamos el nombre de la carpeta actual
            if (node.Folder) {
                let folders = Array.isArray(node.Folder) ? node.Folder : [node.Folder];
                folders.forEach(f => {
                    const folderName = f.name || currentFolderName;
                    traverse(f, folderName);
                });
            }

            // Si encontramos un Placemark, lo registramos con la carpeta actual
            if (node.Placemark) {
                let placemarks = Array.isArray(node.Placemark) ? node.Placemark : [node.Placemark];
                placemarks.forEach(p => {
                    if (p.name && currentFolderName) {
                        // Guardamos la relación: Nombre del Placemark -> Nombre de la Carpeta
                        placemarkFolderMap.set(String(p.name).trim(), currentFolderName);
                    }
                });
            }

            // Continuar buscando en Document
            if (node.Document) traverse(node.Document, currentFolderName);
            if (node.kml) traverse(node.kml, currentFolderName);
        }

        traverse(xmlObj, null);

        // Inyectar en el GeoJSON
        geojsonData.features.forEach(f => {
            if (!f.properties) f.properties = {};
            const pName = f.properties.name ? String(f.properties.name).trim() : null;
            if (pName && placemarkFolderMap.has(pName)) {
                f.properties.folder = placemarkFolderMap.get(pName);
            }
        });

    } catch (e) {
        console.error("Error inyectando folders KML:", e.message);
    }

    return geojsonData;
}

module.exports = { injectFoldersToGeoJSON };
