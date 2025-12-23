import easyocr
import os
import re
import json
import time
import sys
import torch
import cv2
import numpy as np
from PIL import Image
import io

# ==============================
# 🔹 FUNCIÓN PARA REDUCIR IMAGEN A ~500 KB
# ==============================
def reducir_a_500kb(img):
    """
    Reduce una imagen hasta aprox 500 KB manteniendo buena calidad.
    """
    max_kb = 500
    calidad = 85
    ancho, alto = img.size

    while True:
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=calidad, optimize=True)
        peso_kb = len(buffer.getvalue()) / 1024

        if peso_kb <= max_kb:
            return buffer.getvalue()

        ancho = int(ancho * 0.92)
        alto = int(alto * 0.92)
        img = img.resize((ancho, alto), Image.LANCZOS)

        if calidad > 50:
            calidad -= 5
        else:
            calidad -= 2

        if calidad < 30:
            return buffer.getvalue()


# ==============================
# 🔹 DETECTAR ÍNDICE EN TEXTO
# ==============================
def obtener_indice_mejorado(texto):
    patrones = [
        r"n[uú]mero\s*de\s*[ií]ndice[:\s]*([0-9]+)",
        r"indice[:\s]*([0-9]+)",
        r"índice[:\s]*([0-9]+)"
    ]
    for patron in patrones:
        match = re.search(patron, texto, re.IGNORECASE)
        if match:
            return match.group(1)
    return None

# ==============================
# 🔹 LISTAR Y SELECCIONAR CARPETAS (recursivo)
# ==============================
def listar_carpetas(carpeta_base="."):
    carpetas = [d for d in os.listdir(carpeta_base) if os.path.isdir(os.path.join(carpeta_base, d))]
    if not carpetas:
        print("❌ No se encontraron carpetas dentro de esta ruta.")
        return None
    print(f"\n📁 Carpetas dentro de '{carpeta_base}':\n")
    for i, carpeta in enumerate(carpetas, start=1):
        print(f"{i}. {carpeta}")
    print("0. 🔙 Volver o seleccionar otra carpeta")
    return carpetas

def seleccionar_carpeta_recursiva(carpeta_base="."):
    while True:
        carpetas = listar_carpetas(carpeta_base)
        if not carpetas:
            return carpeta_base
        try:
            opcion = int(input("\nSeleccione el número de la carpeta: "))
            if opcion == 0:
                return carpeta_base
            if 1 <= opcion <= len(carpetas):
                nueva_ruta = os.path.join(carpeta_base, carpetas[opcion - 1])
                imagenes = [f for f in os.listdir(nueva_ruta) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                if imagenes:
                    return nueva_ruta
                else:
                    print("⚠️ No se encontraron imágenes. Explorando dentro de esa carpeta...")
                    carpeta_base = nueva_ruta
            else:
                print("⚠️ Opción inválida.")
        except ValueError:
            print("⚠️ Ingrese un número válido.")

# ==============================
# 🔹 BARRA DE PROGRESO
# ==============================
def mostrar_progreso(actual, total, tiempo_inicial, nombre_actual):
    porcentaje = (actual / total) * 100
    barra = "#" * int(porcentaje // 2) + "-" * (50 - int(porcentaje // 2))
    tiempo_transcurrido = time.time() - tiempo_inicial
    if actual > 0:
        tiempo_promedio = tiempo_transcurrido / actual
        restante = (total - actual) * tiempo_promedio
    else:
        restante = 0
    minutos = int(restante // 60)
    segundos = int(restante % 60)
    sys.stdout.write(
        f"\r⏳ [{barra}] {porcentaje:5.1f}% | {nombre_actual[:25]:25s} | Tiempo restante: {minutos:02d}:{segundos:02d}"
    )
    sys.stdout.flush()


# ==============================
# 🔹 VERIFICAR ÍNDICES
# ==============================
def verificar_indices(carpeta):
    print(f"\n🔎 Verificando índices en: {carpeta}\n")
    imagenes = [f for f in os.listdir(carpeta) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    indices = []
    for nombre in imagenes:
        match = re.match(r"(\d+)\.(jpg|jpeg|png)$", nombre, re.IGNORECASE)
        if match:
            indices.append(int(match.group(1)))

    if not indices:
        print("⚠️ No se detectaron imágenes con nombres numéricos.")
        return

    indices.sort()
    max_indice = indices[-1]
    faltantes = [i for i in range(1, max_indice + 1) if i not in indices]

    print(f"📊 Total de imágenes numeradas: {len(indices)}")
    print(f"🔝 Mayor índice detectado: {max_indice}")

    if faltantes:
        print(f"⚠️ Faltan las siguientes imágenes: {faltantes}")
    else:
        print("✅ No faltan índices en la secuencia.")


# ==============================
# 🔹 PROCESAR IMÁGENES (OCR + 500 KB)
# ==============================
def procesar_imagenes(carpeta):
    usar_gpu = torch.cuda.is_available()
    dispositivo = f"GPU ({torch.cuda.get_device_name(0)})" if usar_gpu else "CPU"
    print(f"\n🚀 Usando {dispositivo}\n")

    reader = easyocr.Reader(['es', 'en'], gpu=usar_gpu)
    imagenes = [f for f in os.listdir(carpeta) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not imagenes:
        print("❌ No se encontraron imágenes en la carpeta seleccionada.")
        return

    carpeta_salida = os.path.join(carpeta, "procesadas")
    os.makedirs(carpeta_salida, exist_ok=True)

    total = len(imagenes)
    print(f"🔍 Procesando {total} imágenes en '{carpeta}'...\n")

    resultados = []
    inicio = time.time()

    for i, nombre in enumerate(imagenes, start=1):
        ruta = os.path.join(carpeta, nombre)
        try:
            img_bgr = cv2.imdecode(np.fromfile(ruta, dtype=np.uint8), cv2.IMREAD_COLOR)
            if img_bgr is None:
                continue

            h, w = img_bgr.shape[:2]
            x1 = int(w * 0.5)
            recorte = img_bgr[:, x1:w]

            ocr_result = reader.readtext(recorte)
            texto = " ".join([r[1] for r in ocr_result])
            indice = obtener_indice_mejorado(texto)
            if not indice:
                indice = "sin_indice"

            nuevo_nombre = f"{indice}.jpg"
            nueva_ruta = os.path.join(carpeta_salida, nuevo_nombre)

            # 👉 REDUCIR A 500 KB
            img_pil = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
            data = reducir_a_500kb(img_pil)
            with open(nueva_ruta, "wb") as f:
                f.write(data)

            resultados.append({"original": nombre, "nuevo": nuevo_nombre, "indice": indice})
            mostrar_progreso(i, total, inicio, nombre)

        except Exception as e:
            resultados.append({"original": nombre, "error": str(e)})

    with open(os.path.join(carpeta_salida, "resultados_ocr.json"), "w", encoding="utf-8") as f:
        json.dump(resultados, f, ensure_ascii=False, indent=2)

    print(f"\n✅ OCR completado. Imágenes guardadas en: {carpeta_salida}\n")


# ==============================
# 🔹 AGREGAR SUFIJO (500 KB)
# ==============================
def agregar_sufijo(carpeta):
    sufijo = input("Ingrese el sufijo (ejemplo: 1, 2, prueba): ").strip()
    imagenes = [f for f in os.listdir(carpeta) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not imagenes:
        print("❌ No se encontraron imágenes.")
        return

    carpeta_salida = os.path.join(carpeta, "procesadas")
    os.makedirs(carpeta_salida, exist_ok=True)

    print(f"✏️ Agregando sufijo '-{sufijo}' a {len(imagenes)} imágenes...\n")
    inicio = time.time()

    for i, nombre in enumerate(imagenes, start=1):
        base, ext = os.path.splitext(nombre)
        nuevo_nombre = f"{base}-{sufijo}{ext}"
        origen = os.path.join(carpeta, nombre)
        destino = os.path.join(carpeta_salida, nuevo_nombre)

        img = cv2.imdecode(np.fromfile(origen, dtype=np.uint8), cv2.IMREAD_COLOR)
        if img is not None:
            img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            data = reducir_a_500kb(img_pil)
            with open(destino, "wb") as f:
                f.write(data)

        mostrar_progreso(i, len(imagenes), inicio, nuevo_nombre)

    print(f"\n✅ Sufijos agregados. Imágenes guardadas en '{carpeta_salida}'.\n")


# ==============================
# 🔹 REDUCIR TAMAÑO DE IMÁGENES (500 KB)
# ==============================
def reducir_tamano_imagenes(carpeta):
    imagenes = [f for f in os.listdir(carpeta) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not imagenes:
        print("❌ No se encontraron imágenes.")
        return

    carpeta_salida = os.path.join(carpeta, "procesadas")
    os.makedirs(carpeta_salida, exist_ok=True)

    print(f"\n📦 Reducción de tamaño para {len(imagenes)} imágenes (500 KB)...\n")
    inicio = time.time()

    for i, nombre in enumerate(imagenes, start=1):
        ruta = os.path.join(carpeta, nombre)
        img = cv2.imdecode(np.fromfile(ruta, dtype=np.uint8), cv2.IMREAD_COLOR)
        if img is not None:
            img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            data = reducir_a_500kb(img_pil)
            destino = os.path.join(carpeta_salida, nombre)
            with open(destino, "wb") as f:
                f.write(data)

        mostrar_progreso(i, len(imagenes), inicio, nombre)

    print(f"\n✅ Imágenes comprimidas (500 KB) guardadas en '{carpeta_salida}'.\n")


# ==============================
# 🔹 MENÚ PRINCIPAL
# ==============================
def main():
    print("=== OCR RENOMBRADOR Y COMPRESOR ===")

    carpeta_seleccionada = seleccionar_carpeta_recursiva()
    print(f"\n📂 Carpeta seleccionada: {carpeta_seleccionada}")

    print("\n📋 Opciones:")
    print("1. Verificar secuencia de índices")
    print("2. Ejecutar OCR y renombrado")
    print("3. Agregar sufijo a imágenes")
    print("4. Reducir tamaño de imágenes a 500 KB")
    print("5. Salir")

    opcion = input("\nSeleccione una opción: ")

    if opcion == "1":
        verificar_indices(carpeta_seleccionada)
    elif opcion == "2":
        procesar_imagenes(carpeta_seleccionada)
    elif opcion == "3":
        agregar_sufijo(carpeta_seleccionada)
    elif opcion == "4":
        reducir_tamano_imagenes(carpeta_seleccionada)
    else:
        print("👋 Saliendo del programa...")

if __name__ == "__main__":
    main()
