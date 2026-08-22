import psycopg2

DATABASE_URL = "postgres://postgres:postgres@localhost:5432/geoportal_local"

inserts = [
    ("arena", "SP/SW (Suelo arenoso genérico)", "A-1 / A-3", "#d2b48c", True),
    ("grava", "GP/GW (Suelo gravoso genérico)", "A-1", "#a9a9a9", True),
    ("arcilla", "CH/CL (Suelo arcilloso genérico)", "A-6 / A-7", "#cd853f", True),
    ("limo", "MH/ML (Suelo limoso genérico)", "A-4 / A-5", "#8b4513", True),
    ("roca", "Roca (Genérico)", "Roca", "#808080", True),
    ("turba", "PT", "A-8", "#4a3b32", True),
    ("afirmado", "Material de Afirmado", "A-1 / A-2", "#d9b38c", True),
    ("granular", "Material Granular Genérico", "A-1 / A-2", "#b8a99a", True),
    ("material granular", "Material Granular Genérico", "A-1 / A-2", "#b8a99a", True),
    ("roca fracturada", "Roca Fracturada / Macizo Rocoso", "Roca", "#6e6e6e", True)
]

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    for nombre, sucs, aashto, color, verificado in inserts:
        cursor.execute("""
            INSERT INTO suelos_diccionario_nlp 
            (nombre_original_excel, clasificacion_sucs, clasificacion_aashto, color_hex_sugerido, es_verificado_por_humano) 
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (nombre_original_excel) DO UPDATE SET 
                clasificacion_sucs = EXCLUDED.clasificacion_sucs,
                clasificacion_aashto = EXCLUDED.clasificacion_aashto,
                color_hex_sugerido = EXCLUDED.color_hex_sugerido,
                es_verificado_por_humano = EXCLUDED.es_verificado_por_humano;
        """, (nombre, sucs, aashto, color, verificado))
        
    print(f"Se insertaron/actualizaron {len(inserts)} términos genéricos en la base de datos.")
    
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
