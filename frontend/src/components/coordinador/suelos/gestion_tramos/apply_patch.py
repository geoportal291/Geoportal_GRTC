import os

file_path = r'c:\Users\PC\Resilio Sync\geoportal\frontend\src\components\coordinador\suelos\gestion_tramos\Progresivas.jsx'
patch_path = r'c:\Users\PC\Resilio Sync\geoportal\frontend\src\components\coordinador\suelos\gestion_tramos\temp_patch_progresivas.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

with open(patch_path, 'r', encoding='utf-8') as f:
    new_function_body = f.read()

# 1. Clean Imports
# We'll replace the first chunk of imports with a clean version
# Identifying the range roughly from line 1 to 'useProgresivasData'
start_marker = "import React"
end_marker = "import useProgresivasData from '../../../../hooks/useProgresivasData';"

clean_imports = """import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Progresivas.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import SeleccionarEstratosModal from '../estratos/SeleccionarEstratosModal';
import KmlMapModal from '../mapa/KmlMapModal';
import * as XLSX from 'xlsx';
import { kml } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import { fromLatLon } from 'utm';
import JSZip from 'jszip';

import { useAuth } from '../../../../data/contexts/AuthContext';
import useProgresivasData from '../../../../hooks/useProgresivasData';"""

# Locate the mess
import_start_idx = content.find(start_marker)
import_end_idx = content.find(end_marker) + len(end_marker)

if import_start_idx != -1 and import_end_idx != -1:
    print("Replacing imports...")
    # Replace the messy imports
    content = clean_imports + content[import_end_idx:]
else:
    print("Could not locate import block efficiently, skipping import cleanup (risky)")

# 2. Key functionality replacement
# Find start of function
func_start_marker = "const handleImportKmlPoints = async (e) => {"
func_end_marker = "e.target.value = ''; // Reset input"
closing_brace_marker = "};"

start_idx = content.find(func_start_marker)
if start_idx == -1:
    print("Could not find function start")
    exit(1)

# Find the specific end lines
end_idx_content = content.find(func_end_marker, start_idx)
if end_idx_content == -1:
    print("Could not find function end content")
    exit(1)

# Find the closing brace after the end content
end_idx = content.find(closing_brace_marker, end_idx_content) + len(closing_brace_marker)

print(f"Replacing function from index {start_idx} to {end_idx}")

# Construct new content
new_content = content[:start_idx] + new_function_body + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully patched Progresivas.jsx")
