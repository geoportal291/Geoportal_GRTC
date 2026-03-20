import pandas as pd
import psycopg2
from bs4 import BeautifulSoup # No estrictamente necesario pero si está
import os
from dotenv import load_dotenv

# Configura variables de entorno si tienes un archivo .env, 
# o puedes quemar temporalmente la string aquí para poblar
load_dotenv('../../backend/.env')

# Reemplaza con la ruta de tu excel que acabas de actualizar
EXCEL_PATH = 'diccionario_suelos.xlsx'

# Connection string (Ajustar a la base de datos real o local)
DATABASE_URL = os.environ.get('DATABASE_URL') 
if not DATABASE_URL:
    print("Por favor configura tu DATABASE_URL en el script temporalmente")
    exit(1)

def poblar_diccionario():
    print(f"Leyendo archivo Excel: {EXCEL_PATH} ...")
    try:
        df = pd.read_excel(EXCEL_PATH)
        df = df.where(pd.notnull(df), None) # Clean NaN values to None (NULL in SQL)
    except Exception as e:
        print(f"Error al leer el Excel {EXCEL_PATH}: {e}")
        return

    # Validar que tenga las columnas que necesitamos, ignorando mayusculas/minusculas
    columnas_lower = {c: str(c).lower().strip() for c in df.columns}
    df.rename(columns=columnas_lower, inplace=True)
    
    # Asume que tu archivo tiene estas columnas o similares
    # Puedes ajustarlas si le pusiste nombres ligeramente distintos
    col_nombre = 'nombre_original_excel'
    col_sucs = 'clasificacion_sucs_objetivo'
    col_color = 'color_hex_sugerido'
    
    # Intenta mapear AASHTO si es que lo agregaste al excel
    col_aashto = 'clasificacion_aashto_objetivo' if 'clasificacion_aashto_objetivo' in df.columns else None

    if col_nombre not in df.columns or col_sucs not in df.columns:
         print(f"El Excel DEBE tener las columnas '{col_nombre}' y '{col_sucs}'")
         print("Columnas actuales:", df.columns.tolist())
         return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        print("Conexión a Base de Datos exitosa.")

        inserciones = 0
        actualizaciones = 0

        for index, row in df.iterrows():
            nombre = str(row[col_nombre]).strip()
            sucs = str(row[col_sucs]).strip() if pd.notnull(row[col_sucs]) else None
            aashto = str(row[col_aashto]).strip() if pd.notnull(row.get(col_aashto)) else None
            color = str(row[col_color]).strip() if pd.notnull(row.get(col_color)) else '#FFFFFF'

            agregado_humano = True # Si viene del Excel, damos por hecho que un humano lo válido.

            # Upsert query (Inserta o Actualiza si existe, dependiendo del motor NLP)
            insert_query = """
                INSERT INTO public.suelos_diccionario_nlp 
                (nombre_original_excel, clasificacion_sucs, clasificacion_aashto, color_hex_sugerido, es_verificado_por_humano) 
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (nombre_original_excel) 
                DO UPDATE SET 
                    clasificacion_sucs = EXCLUDED.clasificacion_sucs,
                    clasificacion_aashto = EXCLUDED.clasificacion_aashto,
                    color_hex_sugerido = EXCLUDED.color_hex_sugerido,
                    es_verificado_por_humano = EXCLUDED.es_verificado_por_humano
                RETURNING (xmax = 0) AS inserted;
            """
            
            cur.execute(insert_query, (nombre, sucs, aashto, color, agregado_humano))
            
            # Saber si fue inserción (xmax=0) o actualización
            es_insert = cur.fetchone()[0]
            if es_insert:
                inserciones += 1
            else:
                actualizaciones += 1

        conn.commit()
        cur.close()
        conn.close()

        print("-------------------------------")
        print("¡MIGRACIÓN FINALIZADA SIN ERRORES!")
        print(f"Total estrato-reglas insertadas nuevas: {inserciones}")
        print(f"Total estrato-reglas omitidas/actualizadas por llave duplicada: {actualizaciones}")
        print("El cerebro NLP ya puede conectarse a la DB en su siguiente versión.")

    except Exception as e:
         print("Error crítico en la base de datos:", e)

if __name__ == "__main__":
    poblar_diccionario()
