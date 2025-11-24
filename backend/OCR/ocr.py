import easyocr
import sys
import os
import re
import json

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
    match_ruta = re.search(r"Ruta[:\s]*([\w\s-]+)", full_text, re.IGNORECASE)
    if match_ruta:
        data["ruta"] = match_ruta.group(1).strip()

    #altitud
    match_altitud = re.search(r"(?:Altitud|Altura|Elevacion|Elevación)[.:\s]*(\d+\.?\d*)\s*m", full_text, re.IGNORECASE)
    if match_altitud:
        data["altitud"] = match_altitud.group(1) + "m"

    return data

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python ocr.py <image_path>"}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image not found at {image_path}"}))
        sys.exit(1)

    try:
        reader = easyocr.Reader(['en'])
        results = reader.readtext(image_path)
        extracted_text = "\n".join([res[1] for res in results])
        
        image_filename = os.path.basename(image_path)
        parsed_data = parse_ocr_text(image_filename, extracted_text)
        
        print(json.dumps(parsed_data, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()