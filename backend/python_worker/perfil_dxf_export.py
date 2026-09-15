# -*- coding: utf-8 -*-
"""
Exporta el perfil estratigráfico a DXF (AutoCAD) replicando la lámina
que dibuja el VBA del formato oficial: base 664x220, retícula de 20
columnas de 30 unidades, escala 1 m = 100 unidades con regla cada
0.10 m, hatches por patrón SUCS y textos de clasificación.

Uso:
    python perfil_dxf_export.py --payload perfil.json --salida perfil.dxf

El payload es el mismo del exportar-excel del perfil estratigráfico
(progresivas[] con estratos[]: profundidad_inicial/final, nombre,
descripcion, nlp_clasificacion_sucs/aashto, patron.patron_svg/color).
"""
import argparse
import json
import math

import ezdxf
from ezdxf.colors import rgb2int
from ezdxf.enums import TextEntityAlignment

# ---------------------------------------------------------------- diseño
ESCALA = 100.0            # 1 m = 100 unidades
ANCHO_COLUMNA = 30.0      # ancho de cada calicata
COLS_POR_BLOQUE = 20
ANCHO_BLOQUE = 664.0      # base del formato
ALTO_BLOQUE = 220.0
X_INTERNA = 64.0          # inicio del área útil de estratos
PROF_BLOQUE = 2.0         # la lámina dibuja hasta 2.00 m (regla 0..20)
MARGEN_BLOQUE = 750.0     # separación horizontal entre bloques de 20

# patron_svg / SUCS -> patrón de AutoCAD + escala
PATRONES_ACAD = {
    "grava": ("GRAVEL", 0.6),
    "arena": ("AR-SAND", 0.5),
    "limo": ("ANSI31", 0.75),
    "arcilla": ("CLAY", 0.6),
    "roca": ("BRICK", 0.5),
    "roca_fracturada": ("ANSI37", 1.0),
    "relleno": ("EARTH", 0.6),
    "afirmado": ("ANSI32", 0.75),
    "generico": ("DOTS", 1.0),
}


def patron_de(estrato):
    patron = estrato.get("patron") or {}
    clave = (patron.get("patron_svg")
             or "").lower().strip()
    if clave in PATRONES_ACAD:
        return PATRONES_ACAD[clave]
    sucs = (estrato.get("nlp_clasificacion_sucs") or "").upper()
    if sucs.startswith("G"):
        return PATRONES_ACAD["grava"]
    if sucs.startswith("S"):
        return PATRONES_ACAD["arena"]
    if sucs.startswith("M"):
        return PATRONES_ACAD["limo"]
    if sucs.startswith("C"):
        return PATRONES_ACAD["arcilla"]
    return PATRONES_ACAD["generico"]


def color_true(estrato):
    patron = estrato.get("patron") or {}
    hexcolor = (patron.get("color_hex_sugerido") or "999999").lstrip("#")
    if len(hexcolor) != 6:
        hexcolor = "999999"
    return rgb2int(tuple(int(hexcolor[i:i + 2], 16) for i in (0, 2, 4)))


def texto(msp, s, x, y, altura=2.0, capa="TEXTOS", color=7, rot=0.0):
    if s is None:
        return
    s = str(s).strip()
    if not s:
        return
    msp.add_text(
        s, dxfattribs={
            "layer": capa, "color": color, "height": altura, "rotation": rot,
        },
    ).set_placement((x, y), align=TextEntityAlignment.MIDDLE_CENTER)


def dibujar_bloque(doc, msp, px, py, progresivas, tramo_codigo):
    """Dibuja un bloque de hasta 20 calicatas con origen (px, py)."""
    # base (capas BORDE)
    x_izq, x_der = px, px + ANCHO_BLOQUE
    y_sup, y_inf = py, py - ALTO_BLOQUE
    msp.add_line((x_izq, y_sup), (x_izq, y_inf), dxfattribs={"layer": "BORDE"})
    msp.add_line((x_izq + 40, y_sup), (x_izq + 40, y_inf), dxfattribs={"layer": "BORDE"})
    msp.add_line((x_izq + X_INTERNA, y_sup), (x_izq + X_INTERNA, y_inf), dxfattribs={"layer": "BORDE"})
    msp.add_line((x_der, y_sup), (x_der, y_inf), dxfattribs={"layer": "BORDE"})
    msp.add_line((x_izq, y_sup), (x_der, y_sup), dxfattribs={"layer": "BORDE"})
    msp.add_line((x_izq, y_inf), (x_der, y_inf), dxfattribs={"layer": "BORDE"})

    # área interna y retícula de profundidad
    xx_izq = px + X_INTERNA
    yy_sup = py - 5
    msp.add_line((xx_izq, yy_sup), (px + ANCHO_BLOQUE, yy_sup), dxfattribs={"layer": "BORDE"})
    msp.add_line((xx_izq, yy_sup - PROF_BLOQUE * ESCALA + 8),
                 (px + ANCHO_BLOQUE, yy_sup - PROF_BLOQUE * ESCALA + 8),
                 dxfattribs={"layer": "BORDE"})
    for i in range(1, COLS_POR_BLOQUE):
        x = xx_izq + i * ANCHO_COLUMNA
        msp.add_line((x, yy_sup), (x, yy_sup - PROF_BLOQUE * ESCALA + 7),
                     dxfattribs={"layer": "BORDE"})

    # regla de profundidad cada 0.10 m + etiquetas (como FormPro del VBA)
    for i in range(int(PROF_BLOQUE * 10) + 1):
        y = yy_sup - i * (ESCALA / 10)
        msp.add_line((xx_izq, y), (xx_izq - 6, y), dxfattribs={"layer": "REGLA"})
        msp.add_line((xx_izq - 6, y), (xx_izq - 15, y),
                     dxfattribs={"layer": "REGLA", "linetype": "DASHED"})
        entero, dec = divmod(i, 10)
        texto(msp, f"{entero}.{dec * 10:02d}", xx_izq - 21.5, y, altura=3.0, capa="REGLA")
    texto(msp, "Profundidad (m)", xx_izq - 35, py - 75, altura=4.0, rot=90)

    # columnas de calicatas
    for idx, prog in enumerate(progresivas[:COLS_POR_BLOQUE]):
        c = idx + 1
        x0 = px + X_INTERNA + (c - 1) * ANCHO_COLUMNA
        x1 = x0 + ANCHO_COLUMNA
        xc = (x0 + x1) / 2
        texto(msp, f"C-{c}", xc, py - 4.5 + 6, altura=3.0)
        texto(msp, str(prog.get("codigo") or prog.get("nombre") or ""),
              xc, py - 4.5 + 14, altura=2.2)

        for estrato in prog.get("estratos") or []:
            try:
                pi_ = float(str(estrato.get("profundidad_inicial", 0)))
                pf_ = float(str(estrato.get("profundidad_final", 0)))
            except (TypeError, ValueError):
                continue
            if pf_ <= pi_:
                continue
            # clamp a la lámina (2.00 m)
            top = max(pi_, 0.0)
            bot = min(pf_, PROF_BLOQUE - 0.05)
            if bot <= top:
                continue
            y1 = yy_sup - top * ESCALA
            y2 = yy_sup - bot * ESCALA
            nombre_capa = f"EST_{(estrato.get('nlp_clasificacion_sucs') or 'S/D')[:8]}".replace(" ", "_")
            true_color = color_true(estrato)
            if nombre_capa not in doc.layers:
                doc.layers.add(nombre_capa, true_color=true_color)
            msp.add_lwpolyline(
                [(x0, y1), (x1, y1), (x1, y2), (x0, y2)],
                dxfattribs={"layer": nombre_capa, "true_color": true_color},
            ).close()
            # hatch por patrón SUCS
            nombre_patron, escala = patron_de(estrato)
            hatch = msp.add_hatch(dxfattribs={"layer": nombre_capa, "true_color": true_color})
            hatch.set_pattern_fill(nombre_patron, scale=escala, color=true_color)
            hatch.paths.add_polyline_path(
                [(x0, y1), (x1, y1), (x1, y2), (x0, y2)], is_closed=True)
            # textos de clasificación (SUCS arriba, AASHTO abajo del centro)
            yc = (y1 + y2) / 2
            texto(msp, estrato.get("nlp_clasificacion_sucs"), xc, yc + 2.5,
                  altura=2.0, capa=nombre_capa, color=7)
            aashto = estrato.get("nlp_clasificacion_aashto")
            if aashto:
                texto(msp, aashto, xc, yc - 2.5, altura=1.6, capa=nombre_capa, color=7)
            # línea de contacto inferior
            msp.add_line((x0, y2), (x1, y2), dxfattribs={"layer": "BORDE"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--payload", required=True)
    ap.add_argument("--salida", required=True)
    args = ap.parse_args()
    with open(args.payload, encoding="utf-8") as f:
        payload = json.load(f)

    doc = ezdxf.new("R2010", setup=True)
    msp = doc.modelspace()
    doc.layers.add("BORDE", color=7)
    doc.layers.add("REGLA", color=8)
    doc.layers.add("TEXTOS", color=3)

    tramo = payload.get("tramo") or {}
    progresivas = payload.get("progresivas") or []
    if not progresivas:
        raise SystemExit("El payload no trae progresivas")

    texto(msp, f"PERFIL ESTRATIGRÁFICO — {tramo.get('codigo', '')} {tramo.get('nombre', '')}",
          332, 30, altura=6.0, capa="TEXTOS")

    # bloques de 20 calicatas en fila (config-driven: 0, 750, 1500, ...)
    for b in range(0, len(progresivas), COLS_POR_BLOQUE):
        px = b / COLS_POR_BLOQUE * MARGEN_BLOQUE
        dibujar_bloque(doc, msp, px, 0, progresivas[b:b + COLS_POR_BLOQUE], tramo.get("codigo", ""))

    doc.saveas(args.salida)
    print(f"OK dxf: {len(progresivas)} progresivas en "
          f"{math.ceil(len(progresivas) / COLS_POR_BLOQUE)} bloque(s)")


if __name__ == "__main__":
    main()
