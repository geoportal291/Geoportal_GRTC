import easyocr
from PIL import Image
import os, re, json


image_dir = 'C:/Users/duman/OneDrive/Escritorio/PROYECTO/aa/geoportal/OCR/imgs'
output_json_file = 'C:/Users/duman/OneDrive/Escritorio/PROYECTO/aa/geoportal/OCR/resultados.json'

reader = easyocr.Reader(['en'])

def parse_ocr_text(image_filename, ocr_text):
    data = {
        "nombre_imagen": image_filename,
        "numero_indice": None,
        "fecha_hora": None,
        "coordenadas_identificador": None,
        "ubicacion": None,
        "estacion": None,
        "ruta": None,
        "altitud": None
    }

    lines = ocr_text.splitlines()
    full_text = " ".join(lines)

    #numero de indice
    match_indice = re.search(r"Numero de indice:\s*(\d+)", full_text, re.IGNORECASE)
    if match_indice:
        try:
            data["numero_indice"] = int(match_indice.group(1))
        except ValueError:
            data["numero_indice"] = match_indice.group(1) 


    #fecha y hora
    match_fecha_hora = re.search(r"(\d{1,2}\s+[a-zA-Z]{3}\.?\s+\d{4}\s+\d{1,2}\.\d{2}\.\d{2}\s+(?:a\.\s*m\.?|p\.\s*m\.?))", full_text, re.IGNORECASE)
    if match_fecha_hora:
        data["fecha_hora"] = match_fecha_hora.group(1)

    #coordenadas
    match_coords = re.search(r"\b(\d{1,2}[A-Z]\s+\d{6,7}\s+\d{6,7})\b", full_text)
    if match_coords:
        data["coordenadas_identificador"] = match_coords.group(1)

    #ciudad 
    match_ubicacion = re.search(r"([A-Za-z]+,\s*[A-Za-z]+\s*\d{5,}\s*[A-Za-z]+)", full_text)
    if match_ubicacion:
        data["ubicacion"] = match_ubicacion.group(1)

    #estacion
    match_estacion = re.search(r"(#E-\d{2})", full_text)
    if match_estacion:
        data["estacion"] = match_estacion.group(1)

    # ruta
    match_ruta = re.search(r"Ruta[:\s]*(.+)", full_text, re.IGNORECASE)
    if match_ruta:
        data["ruta"] = match_ruta.group(1)

    #altitud 
    match_altitud = re.search(r"(?:Altitud|Altura|Elevacion|Elevación)[.:\s]*(\d+\.?\d*)\s*m", full_text, re.IGNORECASE)
    if match_altitud:
        data["altitud"] = match_altitud.group(1) + "m"

    return data

all_extracted_data = []

for filename in os.listdir(image_dir):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')):
        image_path = os.path.join(image_dir, filename)
        try:
            results = reader.readtext(image_path)
            extracted_text = "\n".join([res[1] for res in results])

            parsed_data = parse_ocr_text(filename, extracted_text)
            all_extracted_data.append(parsed_data)
            
            print(f"Procesado y extraído: {filename}")
        except Exception as e:
            print(f"Error procesando {filename}: {e}")
            all_extracted_data.append({
                "nombre_imagen": filename,
                "error": str(e)
            })

with open(output_json_file, 'w', encoding='utf-8') as f_out:
    json.dump(all_extracted_data, f_out, indent=4, ensure_ascii=False)

print(f"Resultados estructurados guardados en: {output_json_file}")