from PIL import Image
import numpy as np

# Nombre del archivo de imagen (debe estar en la misma carpeta que este script)
imagen_ruta = imagen_ruta = r"C:\Users\PC\Resilio Sync\geoportal (1)\Slorse\suelos.png"
salida_ruta = "imagen_ascii.txt"

# Mapa de caracteres de oscuridad (de oscuro a claro)
ascii_chars = "@%#*+=-:. "

def pixel_a_ascii(valor):
    """Convierte un valor de brillo (0-255) a un carácter ASCII"""
    return ascii_chars[int(valor / 255 * (len(ascii_chars) - 1))]

# Cargar y convertir la imagen a escala de grises
imagen = Image.open(imagen_ruta).convert("L")

# Ajustar tamaño (más ancho = más detalle)
ancho_nuevo = 150
ancho_original, alto_original = imagen.size
alto_nuevo = int(alto_original * ancho_nuevo / ancho_original / 2)
imagen = imagen.resize((ancho_nuevo, alto_nuevo))

# Convertir a matriz de píxeles
pixeles = np.array(imagen)

# Crear representación ASCII
ascii_img = "\n".join("".join(pixel_a_ascii(p) for p in fila) for fila in pixeles)

# Guardar en archivo de texto
with open(salida_ruta, "w", encoding="utf-8") as f:
    f.write(ascii_img)

print(f"✅ Imagen convertida correctamente y guardada como: {salida_ruta}")
