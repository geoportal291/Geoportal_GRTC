import os
import re

directory = r"c:\Users\PC\Desktop\proyecto\aa\geoportal\frontend\src\components\coordinador\ingeneria\geologia\tabs"

files = [
    'GeologiaTab.jsx', 'GeomorfologiaTab.jsx', 'GeologiaEstructuralTab.jsx',
    'SismicidadTab.jsx', 'GeodinamicaTab.jsx', 'GeodinamicaExternaTab.jsx',
    'CanterasTab.jsx', 'FuentesAguaDMETab.jsx', 'EstabilidadTaludesTab.jsx'
]

for filename in files:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add props to the component definition if missing
    if filename != 'GeologiaTab.jsx':
        content = re.sub(r'const (\w+Tab) = \(\) => {', r'const \1 = ({ projectData }) => {', content)
        
    # Add imports
    if 'import GeologiaLayerManager' not in content:
        content = content.replace("import GeologiaGeoite from '../map/GeologiaGeoite';", "import GeologiaGeoite from '../map/GeologiaGeoite';\nimport GeologiaLayerManager from '../map/GeologiaLayerManager';")
        
    # Add state for mapKey 
    if 'const [mapKey, setMapKey]' not in content:
        content = content.replace("const [isMapExpanded, setIsMapExpanded] = useState(false);", "const [isMapExpanded, setIsMapExpanded] = useState(false);\n    const [mapKey, setMapKey] = useState(0);")

    # Figure out tab name 
    tabNameMatch = re.search(r'const (\w+)Tab', content)
    tabNameStr = "geologia"
    if tabNameMatch:
        tabNameStr = tabNameMatch.group(1).lower()
        if tabNameStr == "geologia": tabNameStr = "geologia_local"
    
    content = re.sub(r'<GeologiaGeoite\s*mapData=\{\[\]\}\s*/>', f'<GeologiaGeoite key={{mapKey}} mapData={{[]}} tabName="{tabNameStr}" projectId={{projectData?.id_proyecto || projectData?.id}} />', content)
    
    # Inject LayerManager button in header
    button_regex = r'(<button type="button" onClick={\(\) => setIsMapExpanded\(!isMapExpanded\)} className="geoltab-expand-btn">)'
    if 'GeologiaLayerManager tabName=' not in content:
        replacement = f'''<div style={{{{ display: 'flex', gap: '10px' }}}}>
                        <GeologiaLayerManager tabName="{tabNameStr}" projectData={{projectData}} onUploadSuccess={{() => setMapKey(prev => prev + 1)}} />
                        \\1
                    </div>'''
        content = re.sub(button_regex, replacement, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Updated all tabs with LayerManager!")
