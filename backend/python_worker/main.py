from fastapi import FastAPI
import uvicorn

app = FastAPI()

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
from . import ocr_service

@app.post("/process-image")
async def process_image_endpoint(file: UploadFile = File(...)):
    try:
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
