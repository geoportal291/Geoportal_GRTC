from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import xml.etree.ElementTree as ET

# Crear un enrutador (Router) dedicado a todo lo que es 3D y topografía
router = APIRouter()

@router.post("/analizar-landxml")
async def analizar_landxml(file: UploadFile = File(...)):
    """
    Endpoint para recibir y analizar un archivo LandXML.
    Extrae metadata básica como nombre del proyecto, unidades, y cantidad de superficies/puntos.
    """
    if not file.filename.lower().endswith('.xml'):
        raise HTTPException(status_code=400, detail="El archivo debe tener extensión .xml (LandXML)")

    try:
        # Leer el contenido en memoria
        contenido_bytes = await file.read()
        
        if not contenido_bytes:
            raise HTTPException(status_code=400, detail="El archivo subido está vacío (0 bytes).")
            
        # Intentar decodificar para evadir problemas de BOM o encodings extraños
        try:
            contenido_str = contenido_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            try:
                contenido_str = contenido_bytes.decode('utf-16')
            except UnicodeDecodeError:
                contenido_str = contenido_bytes.decode('latin-1', errors='replace')
        
        # Eliminar la declaración XML si existe, ya que pasar un string de Python con
        # declaración de encoding a ET.fromstring() causa ValueError
        import re
        contenido_str = re.sub(r"<\?xml.*?\?>", "", contenido_str, count=1).strip()
        
        if not contenido_str:
            raise HTTPException(status_code=400, detail="El archivo solo contenía la declaración XML o espacios en blanco.")
        
        # Parsear con ElementTree
        root = ET.fromstring(contenido_str)
        
        # El namespace clásico de LandXML (puede variar, así que intentamos sin strict namespace iterando)
        # Vamos a quitar el namespace de los tags para facilitar la búsqueda
        def remove_namespace(tag):
            return tag.split('}')[-1] if '}' in tag else tag

        # Metadata base
        project_name = "Desconocido"
        units = "No especificadas"
        surfaces_count = 0
        alignments_count = 0
        points_count = 0

        obj_lines = []
        all_coords = []
        vertex_id_to_obj_index = {}
        current_vertex_index = 1

        for child in root:
            clean_tag = remove_namespace(child.tag)
            
            if clean_tag == 'Project':
                project_name = child.attrib.get('name', 'Desconocido')
            elif clean_tag == 'Units':
                # Ej: <Metric areaUnit="squareMeter" linearUnit="meter".../>
                if len(child) > 0:
                    units = remove_namespace(child[0].tag) # Ej: 'Metric' o 'Imperial'
            elif clean_tag == 'Surfaces':
                # Iteramos sobre todas las superficies
                superficies_encontradas = [s for s in child if remove_namespace(s.tag) == 'Surface']
                surfaces_count = len(superficies_encontradas)
                
                for surface in superficies_encontradas:
                    surf_name = surface.attrib.get('name', f'Surface_{surfaces_count}')
                    obj_lines.append(f"o {surf_name}")
                    
                    # Buscar elemento Definition
                    definition = None
                    for s_child in surface:
                        if remove_namespace(s_child.tag) == 'Definition':
                            definition = s_child
                            break
                    
                    if definition is not None:
                        # Extraer Puntos (Pnts -> P) y Caras (Faces -> F)
                        pnts = None
                        faces = None
                        for d_child in definition:
                            if remove_namespace(d_child.tag) == 'Pnts':
                                pnts = d_child
                            elif remove_namespace(d_child.tag) == 'Faces':
                                faces = d_child
                                
                        if pnts is not None:
                            for point in pnts:
                                if remove_namespace(point.tag) == 'P':
                                    pid = point.attrib.get('id')
                                    coords = point.text.strip().split()
                                    if len(coords) >= 3:
                                        # LandXML: Y (Northing), X (Easting), Z (Elevation) - Generalmente
                                        # Lo pasamos a OBJ con la misma coordenada bruta temporalmente
                                        # OBJ format: v X Y Z
                                        v_coords = list(map(float, coords[:3]))
                                        all_coords.append(v_coords)
                                        obj_lines.append(f"v {v_coords[0]} {v_coords[1]} {v_coords[2]}")
                                        # Usar el id provisto o el índice incremental como fallback
                                        pid_key = pid if pid is not None else str(current_vertex_index)
                                        vertex_id_to_obj_index[pid_key] = current_vertex_index
                                        current_vertex_index += 1
                                        
                        if faces is not None:
                            for face in faces:
                                if remove_namespace(face.tag) == 'F':
                                    f_pids = face.text.strip().split()
                                    if len(f_pids) == 3:
                                        v1 = vertex_id_to_obj_index.get(f_pids[0])
                                        v2 = vertex_id_to_obj_index.get(f_pids[1])
                                        v3 = vertex_id_to_obj_index.get(f_pids[2])
                                        if v1 and v2 and v3:
                                            # OBJ Format: f v1 v2 v3
                                            obj_lines.append(f"f {v1} {v2} {v3}")

            elif clean_tag == 'Alignments':
                alignments_count = len([a for a in child if remove_namespace(a.tag) == 'Alignment'])
            elif clean_tag == 'CgPoints':
                cg_points = [p for p in child if remove_namespace(p.tag) == 'CgPoint']
                points_count = len(cg_points)
                for p in cg_points:
                    try:
                        pts_coords = list(map(float, p.text.strip().split()))
                        if len(pts_coords) >= 3:
                            all_coords.append(pts_coords[:3])
                            # También lo agregamos como vértice al OBJ por si acaso
                            p_id = p.get('name') or p.get('id') or f"p{len(all_coords)}"
                            vertex_id_to_obj_index[p_id] = len(all_coords) # Ojo, esto puede chocar si ya existe el ID
                            obj_lines.append(f"v {pts_coords[0]} {pts_coords[1]} {pts_coords[2]}")
                    except Exception:
                        continue

        # Calcular centro UTM y HUELLA CONVEXA promediando vértices
        total_x = 0
        total_y = 0
        total_z = 0
        vertex_count = len(all_coords)
        convex_hull = []

        if vertex_count > 0:
            for vx, vy, vz in all_coords:
                total_x += float(vx)
                total_y += float(vy)
                total_z += float(vz)
            
            centro_utm = {
                "x": total_x / vertex_count,
                "y": total_y / vertex_count,
                "z": total_z / vertex_count
            }

            # --- EXTRAER PERÍMETRO MATEMÁTICO (CONVEX HULL) ---
            # Para no saturar el servidor con los millones de puntos de un archivo de 400MB,
            # tomamos un muestreo representativo para perfilar la forma geométrica exterior.
            try:
                step = max(1, vertex_count // 10000)
                sample_coords = all_coords[::step]
                pts_2d = sorted(list(set([(float(p[0]), float(p[1])) for p in sample_coords])))
                
                if len(pts_2d) >= 3:
                    def cross(o, a, b):
                        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

                    lower = []
                    for p in pts_2d:
                        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
                            lower.pop()
                        lower.append(p)

                    upper = []
                    for p in reversed(pts_2d):
                        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
                            upper.pop()
                        upper.append(p)

                    hull_2d = lower[:-1] + upper[:-1]
                    convex_hull = [{"x": p[0], "y": p[1]} for p in hull_2d]
            except Exception as ex:
                print(f"Error calculando Convex Hull: {ex}")

        else:
            centro_utm = None

        obj_content = "\n".join(obj_lines)

        data_extraida = {
            "nombre_proyecto": project_name,
            "unidades": units,
            "cantidad_superficies": surfaces_count,
            "cantidad_alineamientos": alignments_count,
            "cantidad_puntos_control": points_count,
            "centro_utm": centro_utm,
            "borde_convexo": convex_hull,  # Exportar el perímetro exacto del plano (LandXML footprint)
            "obj_content": obj_content
        }

        return JSONResponse(content={
            "status": "success", 
            "mensaje": f"Archivo LandXML '{file.filename}' analizado correctamente.",
            "data_extraida": data_extraida
        })

    except ET.ParseError as e:
        raise HTTPException(status_code=400, detail=f"No se pudo parsear el archivo XML. Verifica que esté bien formado. Detalle: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando LandXML: {str(e)}")

@router.post("/analizar-ifc")
async def analizar_ifc(file: UploadFile = File(...)):
    """
    Endpoint para recibir y analizar un archivo IFC.
    Por ahora es un simulador hasta instalar la librería IfcOpenShell.
    """
    if not file.filename.lower().endswith('.ifc'):
        raise HTTPException(status_code=400, detail="El archivo no tiene extensión .ifc")

    try:
        # En el futuro aquí se usará ifcopenshell para extraer elementos, volúmenes y metadata.
        # import ifcopenshell
        # ifc_model = ifcopenshell.file.from_string(contents)
        
        # Contamos lineas como un simulador rápido de cuán grande es
        contents = await file.read()
        lines = contents.split(b'\n')
        line_count = len(lines)

        return JSONResponse(content={
            "status": "success", 
            "mensaje": f"Archivo IFC '{file.filename}' pre-analizado correctamente.",
            "data_extraida": {
                "lineas_ifc": line_count,
                "nota": "Instalación de ifcopenshell pendiente en el worker para metadata real"
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando IFC: {str(e)}")
