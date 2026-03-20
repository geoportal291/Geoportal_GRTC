import os

filepath = r"c:\Users\PC\Desktop\proyecto\aa\geoportal\frontend\src\components\coordinador\ingeneria\geologia\map\GeologiaGeoite.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update MapLogic signature
content = content.replace(
    "const MapLogic = ({ initialRoute, onTramoSelect, highlightedTramoId, mapData, onElementoClick, onRouteLoaded, onShowDetails, graphicsImages }) => {",
    "const MapLogic = ({ geologiaCapaUrl, initialRoute, onTramoSelect, highlightedTramoId, mapData, onElementoClick, onRouteLoaded, onShowDetails, graphicsImages }) => {"
)

# 2. Add geologiaLayerRef
if "geologiaKmlLayerRef =" not in content:
    content = content.replace(
        "const poiLayerRef = React.useRef(new L.FeatureGroup());",
        "const poiLayerRef = React.useRef(new L.FeatureGroup());\n    const geologiaKmlLayerRef = React.useRef(new L.FeatureGroup());"
    )
    
# 3. Add to map
if "geologiaKmlLayerRef.current.addTo(map);" not in content:
    content = content.replace(
        "poiLayerRef.current.addTo(map);",
        "poiLayerRef.current.addTo(map);\n        geologiaKmlLayerRef.current.addTo(map);"
    )

# 4. Add the geologiaCapaUrl effect
effect_code = """
    // --- LOAD GEOLOGIA CAPA KML ---
    useEffect(() => {
        if (!map) return;
        if (!geologiaCapaUrl) {
            geologiaKmlLayerRef.current.clearLayers();
            return;
        }

        const loadCapa = async () => {
             try {
                 const res = await axiosInstance.get('/proxy?url=' + encodeURIComponent(geologiaCapaUrl), { responseType: 'text' });
                 const xmlText = res.data;
                 const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
                 const geojson = kml(doc);
                 
                 geologiaKmlLayerRef.current.clearLayers();
                 const geojsonLayer = L.geoJSON(geojson, {
                     style: { color: '#e74c3c', weight: 4 },
                     onEachFeature: (feature, layer) => {
                         if (feature.properties && feature.properties.name) {
                             layer.bindPopup(feature.properties.name);
                         }
                     }
                 });
                 geologiaKmlLayerRef.current.addLayer(geojsonLayer);
                 map.fitBounds(geojsonLayer.getBounds(), { padding: [50, 50] });
             } catch (err) {
                 console.error('Error cargando capa geologica:', err);
             }
        };
        loadCapa();
    }, [map, geologiaCapaUrl]);
"""
if "LOAD GEOLOGIA CAPA KML" not in content:
    content = content.replace(
        "// --- Variables de estado internas ---",
        effect_code + "\n        // --- Variables de estado internas ---"
    )

# 5. GeologiaGeoite signature & fetch
if "const GeologiaGeoite = ({ tabName, projectId," not in content:
    content = content.replace(
        "const GeologiaGeoite = ({ onTramoSelect, highlightedTramoId, height = '90vh', mapData, onElementoClick, onRouteLoaded, onShowDetails, graphicsImages }) => {",
        "const GeologiaGeoite = ({ tabName, projectId, onTramoSelect, highlightedTramoId, height = '90vh', mapData, onElementoClick, onRouteLoaded, onShowDetails, graphicsImages }) => {\n    const [capaAgregadaUrl, setCapaAgregadaUrl] = useState(null);\n    useEffect(() => {\n        const fetchCapa = async () => {\n            if (!projectId || !tabName) return;\n            try {\n                const res = await axiosInstance.get(`/proyectos/${projectId}/geologia-capas/${tabName}`);\n                if (res.data?.data?.file_url) setCapaAgregadaUrl(res.data.data.file_url);\n            } catch (err) {\n                setCapaAgregadaUrl(null);\n            }\n        };\n        fetchCapa();\n    }, [projectId, tabName]);"
    )

# 6. Pass capaAgregadaUrl to MapLogic
content = content.replace(
    "<MapLogic\n                    initialRoute={null}",
    "<MapLogic\n                    geologiaCapaUrl={capaAgregadaUrl}\n                    initialRoute={null}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
