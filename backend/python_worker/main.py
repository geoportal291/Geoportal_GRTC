import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
import uvicorn
import router_3d
import router_nlp

app = FastAPI()

# Incluir las rutas delegadas al archivo router_3d.py
app.include_router(router_3d.router, prefix="/3d", tags=["Procesamiento 3D"])

# Incluir las rutas delegadas al motor NLP
app.include_router(router_nlp.router, prefix="/nlp", tags=["Motor NLP Suelos"])

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Python Worker (FastAPI)", "message": "I am alive!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# --- NEW ENDPOINT FOR OCR ---
from fastapi import UploadFile, File, HTTPException
from fastapi.responses import Response
import json

@app.post("/process-image")
async def process_image_endpoint(file: UploadFile = File(...)):
    try:
        import ocr_service
        contents = await file.read()
        result = ocr_service.process_image_from_bytes(contents)
        
        # We return the processed image binary, but we also want to send the metadata (index)
        # We can send metadata in headers or return a multipart response.
        # Simplest for Node.js axios: Return JSON with base64 OR 
        # return binary with custom headers for metadata.
        
        headers = {
            "X-Detected-Index": str(result["detected_index"]) if result["detected_index"] else "null",
            "X-OCR-Text": str(result["ocr_text"][:100].replace("\n", " ")) # Sanitized
        }
        
        return Response(content=result["processed_bytes"], media_type="image/jpeg", headers=headers)
        
    except Exception as e:
        print(f"Error in /process-image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-metadata")
async def extract_metadata_endpoint(file: UploadFile = File(...)):
    try:
        import ocr_service
        contents = await file.read()
        result = ocr_service.process_image_from_bytes(contents)
        
        # Correctly access the nested metadata dictionary
        meta = result.get("metadata", {})

        # Return JSON directly for bulk processing
        return {
            "status": "ok",
            "metadata": {
                "numero_indice": meta.get("numero_indice"),
                "ocr_text": result.get("ocr_text"),
                "fecha_hora": meta.get("fecha_hora"),
                "coordenadas_identificador": meta.get("coordenadas_identificador"),
                "ubicacion": meta.get("ubicacion"),
                "estacion": meta.get("estacion"),
                "ruta": meta.get("ruta"),
                "altitud": meta.get("altitud")
            }
        }
    except Exception as e:
        print(f"Error in /extract-metadata: {e}")
        return {"status": "error", "message": str(e)}

# --- NEW ENDPOINT FOR SHAPEFILE CONVERSION ---
import shapefile
import rarfile
import zipfile
import tempfile
import glob

@app.post("/convert-shapefile")
async def convert_shapefile_endpoint(file: UploadFile = File(...)):
    """
    Receives a RAR or ZIP file containing shapefiles (.shp, .dbf, .prj, etc.)
    Extracts, parses each shapefile, and returns a combined GeoJSON FeatureCollection.
    """
    try:
        contents = await file.read()
        filename = file.filename.lower()
        
        with tempfile.TemporaryDirectory() as tmpdir:
            archive_path = os.path.join(tmpdir, file.filename)
            
            # Save uploaded file
            with open(archive_path, 'wb') as f:
                f.write(contents)
            
            extract_dir = os.path.join(tmpdir, 'extracted')
            os.makedirs(extract_dir, exist_ok=True)
            
            # Extract archive
            if filename.endswith('.rar'):
                with rarfile.RarFile(archive_path) as rf:
                    rf.extractall(extract_dir)
            elif filename.endswith('.zip'):
                with zipfile.ZipFile(archive_path) as zf:
                    zf.extractall(extract_dir)
            else:
                raise HTTPException(status_code=400, detail="Formato no soportado. Use RAR o ZIP.")
            
            # Find all .shp files recursively (case-insensitive for Linux)
            extracted_files = []
            for root, dirs, files in os.walk(extract_dir):
                for file in files:
                    extracted_files.append(os.path.join(root, file))
            
            print(f"📁 [Geoite] Archivos extraídos: {[os.path.basename(f) for f in extracted_files]}")
            
            shp_files = [f for f in extracted_files if f.lower().endswith('.shp')]
            print(f"📦 [Geoite] Shapefiles detectados: {[os.path.basename(f) for f in shp_files]}")
            
            # Identify SRS (Spatial Reference System) if .prj exists
            from pyproj import Transformer, CRS
            
            def get_transformer(shp_path):
                prj_path = shp_path.replace('.shp', '.prj')
                source_crs = None
                if os.path.exists(prj_path):
                    try:
                        with open(prj_path, 'r') as f:
                            wkt = f.read()
                            source_crs = CRS.from_wkt(wkt)
                            print(f"🌐 [Geoite] SRS detectado desde .prj para {os.path.basename(shp_path)}: {source_crs.name}")
                    except Exception as e:
                        print(f"⚠️ Error leyendo .prj: {e}")
                
                # Default fallback if no valid PRJ: UTM Zone 18S (Peru)
                if not source_crs:
                    print(f"ℹ️ [Geoite] No se detectó SRS válido. Usando UTM Zona 18S (EPSG:32718) como fallback.")
                    source_crs = CRS.from_epsg(32718)
                
                return Transformer.from_crs(source_crs, CRS.from_epsg(4326), always_xy=True)

            all_features = []
            processing_errors = []
            
            for shp_path in shp_files:
                layer_name = os.path.splitext(os.path.basename(shp_path))[0]
                transformer = None
                
                try:
                    with shapefile.Reader(shp_path) as reader:
                        fields = [f[0] for f in reader.fields[1:]]
                        
                        # Peek at first record to see if we need projection
                        needs_projection = False
                        if reader.numRecords > 0:
                            first_shape = reader.shape(0)
                            # Diferenciar entre Puntos (que no tienen bbox) y otras geometrías
                            if hasattr(first_shape, 'bbox'):
                                if abs(first_shape.bbox[0]) > 180 or abs(first_shape.bbox[1]) > 90:
                                    needs_projection = True
                            elif hasattr(first_shape, 'points') and len(first_shape.points) > 0:
                                pt = first_shape.points[0]
                                if abs(pt[0]) > 180 or abs(pt[1]) > 90:
                                    needs_projection = True
                                    
                            if needs_projection:
                                transformer = get_transformer(shp_path)
                                print(f"📍 [Geoite] Capa {layer_name} detectada con coordenadas en metros (>180/90). Reproyectando...")

                        for sr in reader.shapeRecords():
                            geom = sr.shape.__geo_interface__
                            
                            # Perform Reprojection if needed
                            if needs_projection and transformer:
                                try:
                                    if geom['type'] == 'Point':
                                        x, y = transformer.transform(geom['coordinates'][0], geom['coordinates'][1])
                                        geom['coordinates'] = [x, y]
                                    elif geom['type'] in ['LineString', 'MultiPoint']:
                                        geom['coordinates'] = [list(transformer.transform(p[0], p[1])) for p in geom['coordinates']]
                                    elif geom['type'] == 'Polygon':
                                        new_rings = []
                                        for ring in geom['coordinates']:
                                            new_rings.append([list(transformer.transform(p[0], p[1])) for p in ring])
                                        geom['coordinates'] = new_rings
                                    elif geom['type'] == 'MultiLineString':
                                        new_lines = []
                                        for line in geom['coordinates']:
                                            new_lines.append([list(transformer.transform(p[0], p[1])) for p in line])
                                        geom['coordinates'] = new_lines
                                    elif geom['type'] == 'MultiPolygon':
                                        new_polys = []
                                        for poly in geom['coordinates']:
                                            new_rings = []
                                            for ring in poly:
                                                new_rings.append([list(transformer.transform(p[0], p[1])) for p in ring])
                                            new_polys.append(new_rings)
                                        geom['coordinates'] = new_polys
                                except Exception as trans_err:
                                    # print(f"Error proyectando feature: {trans_err}")
                                    pass

                            props = dict(zip(fields, sr.record))
                            props['_layer_name'] = layer_name
                            
                            for k, v in props.items():
                                if isinstance(v, (bytes, bytearray)):
                                    try:
                                        props[k] = v.decode('utf-8')
                                    except:
                                        props[k] = str(v)
                            
                            feature = {
                                "type": "Feature",
                                "geometry": geom,
                                "properties": props
                            }
                            all_features.append(feature)
                        
                except Exception as e:
                    error_msg = f"Error procesando shapefile {layer_name}.shp: {str(e)}. (¿Falta el .shx o .dbf?)"
                    print(error_msg)
                    processing_errors.append(error_msg)
                    continue
            
            if not all_features:
                raise HTTPException(status_code=400, detail="No se pudieron leer features de los shapefiles.")
            
            geojson = {
                "type": "FeatureCollection",
                "features": all_features,
                "warnings": processing_errors if 'processing_errors' in locals() else []
            }
            
            return {
                "status": "ok",
                "layers_found": [os.path.splitext(os.path.basename(s))[0] for s in shp_files],
                "total_features": len(all_features),
                "geojson": geojson
            }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /convert-shapefile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

