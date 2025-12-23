import easyocr
import re
import cv2
import numpy as np
from PIL import Image
import io
import torch

# Initialize reader once to save loading time
# Check if GPU is available
use_gpu = torch.cuda.is_available()
print(f"Loading EasyOCR model... GPU: {use_gpu}")
reader = easyocr.Reader(['es', 'en'], gpu=use_gpu)

def reducir_a_500kb(img_pil):
    """
    Reduce una imagen PIL hasta aprox 500 KB manteniendo buena calidad.
    Returns: bytes
    """
    max_kb = 500
    calidad = 95 # Start high
    ancho, alto = img_pil.size
    
    # Copy to avoid modifying original immediately
    img = img_pil.copy()

    while True:
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=calidad, optimize=True)
        size_kb = len(buffer.getvalue()) / 1024

        if size_kb <= max_kb:
            return buffer.getvalue()

        # Reduce dimensions slightly
        ancho = int(ancho * 0.90)
        alto = int(alto * 0.90)
        img = img.resize((ancho, alto), Image.LANCZOS)

        # Reduce quality
        if calidad > 50:
            calidad -= 5
        else:
            calidad -= 2

        if calidad < 30:
            return buffer.getvalue()

def extract_all_details(text):
    """
    Extracts all specific fields from the OCR text based on improved patterns from reference code.
    """
    details = {
        "numero_indice": None,
        "fecha_hora": None,
        "coordenadas_identificador": None,
        "ubicacion": None,
        "estacion": None,
        "ruta": None,
        "altitud": None
    }

    # 1. Numero de Indice
    # Pattern: Numero de indice: 15
    # Fix: Handle 'ú' accent and variations
    match_indice = re.search(r"N[uú]mer[oa].*?[ií]ndice[:.\s]*(\d+)", text, re.IGNORECASE)
    if match_indice:
        try:
            details["numero_indice"] = int(match_indice.group(1))
        except ValueError:
            pass 

    # 2. Fecha y Hora
    # Pattern: 19 ago. 2025 9.47.14 a. m.
    # Fix: dots in time (9.47.14), spacing in am/pm (a m)
    match_fecha_hora = re.search(r"(\d{1,2}\s+[a-zA-Z]{3,}\.?\s+\d{4}\s+\d{1,2}[:.]\d{2}[:.]\d{2}.*?[aApP]\.?\s*m\.?)", text, re.IGNORECASE)
    if match_fecha_hora:
        details["fecha_hora"] = match_fecha_hora.group(1)

    # 3. Coordenadas
    # Pattern: 18L 767217 8604438
    match_coords = re.search(r"(\d{1,2}[A-Z]\s+\d{6,}\s+\d{6,})", text)
    if match_coords:
        details["coordenadas_identificador"] = match_coords.group(1)

    # 4. Ubicacion (Ciudad/Lugar)
    # Pattern: Cusco, La Convencion...
    # Fix: Capture "Cusco" explicitly if present
    match_ubicacion = re.search(r"(Cusco|Cuzco).*?(?:Provincia|Distrito|Departamento)?\s*([A-Za-z\s]+)", text, re.IGNORECASE)
    if match_ubicacion:
        # Just grab the whole matched string or meaningful part
        details["ubicacion"] = match_ubicacion.group(0)

    # 5. Estacion
    # Pattern: #E-01
    match_estacion = re.search(r"(#E-\d+)", text, re.IGNORECASE)
    if match_estacion:
        details["estacion"] = match_estacion.group(1)

    # 6. Ruta
    # Pattern: ##CU-104
    match_ruta = re.search(r"(##\s*[A-Z0-9-]+)", text)
    if match_ruta:
        details["ruta"] = match_ruta.group(1).replace(" ", "")

    # 7. Altitud
    # Pattern: Altitud:1022.2m
    match_altitud = re.search(r"(?:Altitud|Altura|Elevacion|Elevación).*?(\d+\.?\d*)\s*m", text, re.IGNORECASE)
    if match_altitud:
        details["altitud"] = match_altitud.group(1) + "m"

    print(f"DEBUG: Extracted: {details}") # Log what we found

    return details

def process_image_from_bytes(file_bytes):
    """
    Procesa una imagen en bytes:
    1. Lee con OpenCV/PIL
    2. Recorta el cuadrante inferior derecho (donde esta el cuadro negro)
    3. Realiza OCR
    4. Comprime a <500KB
    """
    try:
        # Convert bytes to numpy array for OpenCV
        nparr = np.frombuffer(file_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img_bgr is None:
            raise ValueError("Could not decode image")

        # --- OCR ---
        # --- OCR ---
        # Strategy:
        # 1. Try Bottom-Right Crop (where data usually is) to save time/noise.
        # 2. If valid data not found (or text too short), fallback to FULL IMAGE (reliable).
        
        h, w = img_bgr.shape[:2]
        
        # Relaxed Crop: 50% down, 40% right
        y_start = int(h * 0.5)
        x_start = int(w * 0.4)
        
        recorte = img_bgr[y_start:, x_start:] 

        # Safety check for tiny images
        if recorte.shape[0] < 50 or recorte.shape[1] < 50:
             recorte = img_bgr

        ocr_result = reader.readtext(recorte, detail=0) 
        texto_detectado = " ".join(ocr_result)
        
        print(f"DEBUG: Crop Text: {texto_detectado[:100]}...") # Log first 100 chars

        # Fallback: If text is too short or key markers missing, read FULL IMAGE
        # Key markers: "Indice", "Cusco", "Altitud", "Fecha"
        markers = ["indice", "cusco", "altitud", "fecha", "202"]
        has_makers = any(m in texto_detectado.lower() for m in markers)

        if len(texto_detectado) < 20 or not has_makers:
             print("DEBUG: Fallback to FULL IMAGE scan...")
             ocr_result_full = reader.readtext(img_bgr, detail=0)
             texto_detectado = " ".join(ocr_result_full)
             print(f"DEBUG: Full Text: {texto_detectado[:100]}...")

        metadata = extract_all_details(texto_detectado)
        indice = metadata["numero_indice"]

        # --- COMPRESSION ---
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        
        processed_bytes = reducir_a_500kb(img_pil)

        return {
            "processed_bytes": processed_bytes,
            "detected_index": indice,
            "ocr_text": texto_detectado,
            "metadata": metadata
        }
        
    except Exception as e:
        print(f"Error processing image: {e}")
        raise e
