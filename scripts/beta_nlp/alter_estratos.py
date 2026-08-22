import psycopg2
import os

DATABASE_URL = "postgres://postgres:postgres@localhost:5432/geoportal_local"

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("""
        ALTER TABLE estratos
        ADD COLUMN IF NOT EXISTS clasificacion_sucs VARCHAR(255),
        ADD COLUMN IF NOT EXISTS clasificacion_aashto VARCHAR(255),
        ADD COLUMN IF NOT EXISTS color VARCHAR(50);
    """)
    print("Columnas agregadas a estratos.")
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
