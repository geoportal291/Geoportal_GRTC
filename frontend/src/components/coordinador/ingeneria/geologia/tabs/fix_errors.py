import os
import re

# Fix GeologiaLayerManager.jsx
layer_manager_path = r"c:\Users\PC\Desktop\proyecto\aa\geoportal\frontend\src\components\coordinador\ingeneria\geologia\map\GeologiaLayerManager.jsx"
with open(layer_manager_path, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("import axiosInstance from '../../../../../../api/axios';", "import axiosInstance from '../../../../../api/axios';")
with open(layer_manager_path, "w", encoding="utf-8") as f:
    f.write(content)

# Fix tabs
tabs_dir = r"c:\Users\PC\Desktop\proyecto\aa\geoportal\frontend\src\components\coordinador\ingeneria\geologia\tabs"
tabs = [
    'GeologiaTab.jsx', 'GeomorfologiaTab.jsx', 'GeologiaEstructuralTab.jsx',
    'GeodinamicaTab.jsx', 'GeodinamicaExternaTab.jsx',
    'CanterasTab.jsx', 'FuentesAguaDMETab.jsx', 'EstabilidadTaludesTab.jsx'
]

# The bad text:
bad_regex = re.compile(r'(<button type="button" onClick={\(\) => setIsMapExpanded\(!isMapExpanded\)} className="geoltab-expand-btn">)\s*</div>\s*(\{isMapExpanded \? [^\}]+\})\s*</button>', re.MULTILINE | re.DOTALL)

# Replacement:
replacement = r'\1\n                            \2\n                        </button>\n                    </div>'

for tab in tabs:
    tab_path = os.path.join(tabs_dir, tab)
    if not os.path.exists(tab_path):
        continue
    with open(tab_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    content = bad_regex.sub(replacement, content)
    
    with open(tab_path, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Fixed errors!")
