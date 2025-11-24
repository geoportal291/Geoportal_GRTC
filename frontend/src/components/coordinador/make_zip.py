#!/usr/bin/env python3
# make_zip.py modificado
# Requiere Python 3.6+

import re
import os
import zipfile
import sys

JS_FILE = "rutaKML_multi.js"
SQL_FILE = "rutaKML_inserts.sql"
ZIP_FILE = "rutaKML_package.zip"

if not os.path.exists(JS_FILE):
    print(f"ERROR: no se encontró {JS_FILE} en esta carpeta.")
    sys.exit(1)

with open(JS_FILE, "r", encoding="utf-8") as f:
    contenido = f.read()

# Regex que captura objetos con "lat", "lng" y "km"
patron = re.compile(r'\{\s*"lat"\s*:\s*([-0-9.]+)\s*,\s*"lng"\s*:\s*([-0-9.]+)\s*,\s*"km"\s*:\s*"([^"]+)"\s*\}')
matches = patron.findall(contenido)

if not matches:
    print("No se encontraron puntos con el patrón esperado en el .js. Revisa el formato.")
    sys.exit(1)

# Construir INSERTs con tramo_id
rows = []
tramo_id = 1
for lat, lng, km in matches:
    if km == "0+000" and rows:  # Si encontramos un nuevo inicio de tramo (pero no en el primer punto)
        tramo_id += 1
    rows.append(f"('{km}', {lat}, {lng}, ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326), {tramo_id})")

# Armar el SQL final
sql_header = """CREATE TABLE IF NOT EXISTS ruta_kml (
    id SERIAL PRIMARY KEY,
    km VARCHAR(10),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    tramo_id INT
);

INSERT INTO ruta_kml (km, lat, lng, geom, tramo_id) VALUES
"""
sql_body = ",\n".join(rows) + ";\n"

with open(SQL_FILE, "w", encoding="utf-8") as f:
    f.write(sql_header + sql_body)

print(f"Generado: {SQL_FILE}  (líneas: {len(rows)})")

# Crear ZIP que incluya el .js original y el .sql generado
with zipfile.ZipFile(ZIP_FILE, "w", compression=zipfile.ZIP_DEFLATED) as z:
    z.write(JS_FILE)
    z.write(SQL_FILE)

print(f"Paquete creado: {ZIP_FILE}")
print("Listo — descarga el ZIP desde tu máquina o súbelo donde necesites.")
