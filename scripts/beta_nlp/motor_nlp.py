from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from difflib import SequenceMatcher
import os

app = Flask(__name__)
CORS(app)

# Ruta al archivo Excel
EXCEL_PATH = 'diccionario_suelos.xlsx'

# Crear un archivo Excel de prueba si no existe
if not os.path.exists(EXCEL_PATH):
    print(f"Creando {EXCEL_PATH} de prueba...")
    df_inicial = pd.DataFrame({
        'nombre_original_excel': ['Piedra dura', 'Arcila', 'Graaba con limo', 'Lodo negro apestoso', 'Arena limosa limpia'],
        'clasificacion_sucs_objetivo': ['Grava / Roca', 'Arcilla', 'Grava Limosa', 'Arcilla Orgánica / Turba', 'Arena Limosa'],
        'color_hex_sugerido': ['#555555', '#A0522D', '#8B4513', '#2F4F4F', '#F4A460']
    })
    df_inicial.to_excel(EXCEL_PATH, index=False)

def similitud(a, b):
    # Función de difflib para calcular ratio de similitud (0.0 a 1.0)
    if not isinstance(a, str) or not isinstance(b, str):
        return 0.0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

@app.route('/api/clasificar', methods=['POST'])
def clasificar_suelo():
    data = request.json
    texto_buscar = data.get('texto', '').strip()
    
    if not texto_buscar:
        return jsonify({'error': 'Texto vacío'}), 400

    try:
        # Cargar diccionario completo cada vez para que acepte cambios en vivo en el excel
        df = pd.read_excel(EXCEL_PATH)
        df = df.replace({np.nan: None}) # Limpiar nulos
        
        # Calcular similitud para todas las filas
        df['score'] = df['nombre_original_excel'].apply(lambda x: similitud(texto_buscar, str(x)))
        
        # Encontrar la mejor coincidencia
        mejor_match = df.loc[df['score'].idxmax()]
        
        # Si el score es muy bajo (< 50%), devolver advertencia
        confianza = mejor_match['score'] * 100
        
        if confianza < 50:
            resultado = {
                'encontrado': True,
                'clasificacion_sucs_objetivo': 'DESCONOCIDO (Requiere Revisión)',
                'color_hex_sugerido': '#FF0000', # Rojo de alerta
                'confianza': round(confianza, 2),
                'match_original': list(mejor_match['nombre_original_excel'])[0] if isinstance(mejor_match['nombre_original_excel'], pd.Series) else mejor_match['nombre_original_excel'],
                'advertencia': 'El texto es muy diferente a todo lo conocido.'
            }
        else:
            resultado = {
                'encontrado': True,
                'clasificacion_sucs_objetivo': mejor_match['clasificacion_sucs_objetivo'],
                'color_hex_sugerido': mejor_match['color_hex_sugerido'],
                'confianza': round(confianza, 2),
                'match_original': mejor_match['nombre_original_excel']
            }
            
        return jsonify(resultado)

    except Exception as e:
        print("Error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Iniciando Motor NLP Beta en puerto 8080...")
    print("Recuerda instalar requerimientos si falla:")
    print("pip install flask flask-cors pandas numpy openpyxl")
    app.run(port=8080, debug=True)
