from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from difflib import SequenceMatcher
import unicodedata

router = APIRouter()

class DiccionarioItem(BaseModel):
    id: int
    nombre_original_excel: str
    clasificacion_sucs: Optional[str] = None
    clasificacion_aashto: Optional[str] = None
    color_hex_sugerido: Optional[str] = '#FFFFFF'
    es_verificado_por_humano: Optional[bool] = False

class NlpRequest(BaseModel):
    texto: str
    diccionario: List[DiccionarioItem]

def normalize_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower().strip()
    # Quitar tildes para igualar "Arcilla" y "Árcilla" etc.
    text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    return text

def similitud(a: str, b: str) -> float:
    a_norm = normalize_text(a)
    b_norm = normalize_text(b)
    if not a_norm or not b_norm: 
        return 0.0
        
    if a_norm == b_norm: 
        return 1.0 # Coincidencia exacta
        
    ratio = SequenceMatcher(None, a_norm, b_norm).ratio()
    
    # Si contiene la palabra, damos un plus pero penalizamos si es un código corto (evita OL en Boloneria)
    if a_norm in b_norm or b_norm in a_norm:
        len_a = len(a_norm)
        len_b = len(b_norm)
        cobertura = min(len_a, len_b) / max(len_a, len_b)

        # Si una de las palabras tiene 2 o menos caracteres (como un código SUCS),
        # solo permitimos el match si la cobertura es alta (>80%) para evitar falsos positivos
        if min(len_a, len_b) <= 2 and cobertura < 0.8:
            return ratio

        bonus = 0.55 + (cobertura * 0.4)
        return max(bonus, ratio)

    return ratio

@router.post("/clasificar-suelo")
async def clasificar_suelo(req: NlpRequest):
    texto_buscar = req.texto.strip()
    
    if not texto_buscar:
        raise HTTPException(status_code=400, detail="Texto vacío")
        
    if not req.diccionario:
        raise HTTPException(status_code=400, detail="El diccionario está vacío")

    mejor_score = -1.0
    mejor_match = None

    for item in req.diccionario:
        # Comparar no solo contra el error de excel guardado, sino también contra el nombre SUCS matemático y AASHTO
        # Así si el usuario busca exactamente la palabra correcta ("roca") encuentra su categoría.
        score_excel = similitud(texto_buscar, item.nombre_original_excel)
        score_sucs = similitud(texto_buscar, item.clasificacion_sucs) if item.clasificacion_sucs else 0.0
        score_aashto = similitud(texto_buscar, item.clasificacion_aashto) if item.clasificacion_aashto else 0.0
        
        max_item_score = max(score_excel, score_sucs, score_aashto)

        if max_item_score > mejor_score:
            mejor_score = max_item_score
            mejor_match = item

    confianza = mejor_score * 100


    if confianza < 55:
        return {
            "encontrado": True,
            "clasificacion_sucs": "DESCONOCIDO (Requiere Revisión)",
            "clasificacion_aashto": "N/A",
            "color_hex_sugerido": "#FF0000",
            "confianza": round(confianza, 2),
            "match_original": mejor_match.nombre_original_excel if mejor_match else None,
            "advertencia": "El texto es muy diferente a todo lo conocido. Verifica la ortografía o agrégalo tú manualmente a la base de datos.",
            "es_verificado_por_humano": False
        }
    else:
        return {
            "encontrado": True,
            "clasificacion_sucs": mejor_match.clasificacion_sucs,
            "clasificacion_aashto": mejor_match.clasificacion_aashto,
            "color_hex_sugerido": mejor_match.color_hex_sugerido,
            "confianza": round(confianza, 2),
            "match_original": mejor_match.nombre_original_excel,
            "es_verificado_por_humano": mejor_match.es_verificado_por_humano
        }
