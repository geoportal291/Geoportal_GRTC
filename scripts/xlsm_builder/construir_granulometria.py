# -*- coding: utf-8 -*-
"""
Construye la plantilla base (xlsx, pre-VBA) del Informe Excel de
Análisis Granulométrico (MTC E 107) — mismo estilo que el informe PDF.

Salida: backend/templates/base/base_granulometria.xlsx
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from openpyxl import Workbook
from openpyxl.chart import ScatterChart, Reference, Series
from openpyxl.chart.marker import Marker
from openpyxl.chart.axis import ChartLines
from openpyxl.drawing.line import LineProperties
from openpyxl.styles import Border, Font, PatternFill, Side

from comun import (DIR_PLANTILLAS, OSCURO, CALC_FILL, RESULT_FILL,
                   F_LAB, F_TAB_HEAD, F_TAB_CALC, F_RESULT_VAL, F_FIRMA,
                   AL_CENTRO, AL_IZQ, banda, celda, par_ficha, definir_nombre,
                   hoja_oculta_mapa, hoja_specs_graficos,
                   cabecera_institucional, preparar_hoja)

SALIDA = os.path.join(DIR_PLANTILLAS, "base", "base_granulometria.xlsx")
FMT_PESO = "0.00"
FMT_PCT = "0.0"
FMT_MM = "0.000"
FMT_FECHA = 'dddd d" de "mmmm" de "yyyy'

# (key, etiqueta tamiz, mm) — espejo de config_tabla de granulometría
MALLAS = [
    ("malla_3p", "3\"", 75.0), ("malla_2p5", "2 1/2\"", 62.9),
    ("malla_2p", "2\"", 50.8), ("malla_1p5", "1 1/2\"", 38.1),
    ("malla_1p", "1\"", 25.4), ("malla_3p4", "3/4\"", 19.0),
    ("malla_1p2", "1/2\"", 12.7), ("malla_3p8", "3/8\"", 9.5),
    ("malla_1p4", "1/4\"", 6.3), ("malla_04", "N° 4", 4.76),
    ("malla_08", "N° 8", 2.36), ("malla_10", "N° 10", 2.0),
    ("malla_16", "N° 16", 1.1), ("malla_20", "N° 20", 0.85),
    ("malla_30", "N° 30", 0.59), ("malla_40", "N° 40", 0.425),
    ("malla_50", "N° 50", 0.297), ("malla_60", "N° 60", 0.25),
    ("malla_100", "N° 100", 0.149), ("malla_140", "N° 140", 0.106),
    ("malla_200", "N° 200", 0.075),
]
N_COARSE = 10  # 3" .. N°4 son la fracción gruesa (suma_coarse)

SUCS = [
    ("GW", "Gravas bien graduadas, mezclas grava-arena, pocos finos o sin finos."),
    ("GP", "Gravas mal graduadas, mezclas grava-arena, pocos finos o sin finos."),
    ("GM", "Gravas limosas, mezclas grava-arena-limo."),
    ("GC", "Gravas arcillosas, mezclas grava-arena-arcilla."),
    ("SW", "Arenas bien graduadas, arenas con grava, pocos finos o sin finos."),
    ("SP", "Arenas mal graduadas, arenas con grava, pocos finos o sin finos."),
    ("SM", "Arenas limosas, mezclas de arena y limo."),
    ("SC", "Arenas arcillosas, mezclas de arena y arcilla."),
    ("ML", "Limos inorgánicos y arenas muy finas, limos limpios, arenas finas, limosas o arcillosas."),
    ("CL", "Arcillas inorgánicas de plasticidad baja a media, arcillas con grava, arcillas arenosas."),
    ("OL", "Limos orgánicos y arcillas orgánicas limosas de baja plasticidad."),
    ("MH", "Limos inorgánicos, suelos arenosos finos o limosos con mica o diatomeas."),
    ("CH", "Arcillas inorgánicas de plasticidad alta."),
    ("OH", "Arcillas orgánicas de plasticidad media a alta."),
]


def construir():
    wb = Workbook()
    ws = wb.active
    ws.title = "Reporte"
    preparar_hoja(ws, [26, 10, 13, 11, 11, 11, 11, 11, 11])  # A..I

    mapa = []

    # ------------------------------------- cabecera, código y ficha técnica
    cabecera_institucional(ws, ultima_col=9)
    ws.row_dimensions[7].height = 4
    fila = 8
    banda(ws, fila, 1, 1, "CÓDIGO", fill=OSCURO)
    ws.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=9)
    for c in range(2, 10):
        celda(ws, fila, c, fill=OSCURO)
    cod = ws.cell(row=fila, column=2)
    cod.font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    cod.alignment = AL_CENTRO
    mapa.append(("meta.codigo_ensayo", f"B{fila}", "texto", None))
    ws.row_dimensions[fila].height = 20
    ws.row_dimensions[9].height = 6

    fila = 10
    par_ficha(ws, fila, 1, "PROYECTO", fill_val=RESULT_FILL)
    ws.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=9)
    for c in range(2, 10):
        celda(ws, fila, c, fill=RESULT_FILL)
    mapa.append(("meta.proyecto_nombre", f"B{fila}", "texto", None))
    fila = 11
    par_ficha(ws, fila, 1, "UBICACIÓN")
    par_ficha(ws, fila, 2, "Lugar:")
    par_ficha(ws, fila, 4, "Distrito:")
    par_ficha(ws, fila, 6, "Provincia:")
    par_ficha(ws, fila, 8, "Dpto:")
    mapa += [("meta.tramo_nombre", f"C{fila}", "texto", None),
             ("meta.distrito", f"E{fila}", "texto", None),
             ("meta.provincia", f"G{fila}", "texto", None),
             ("meta.departamento", f"I{fila}", "texto", None)]
    fila = 12
    par_ficha(ws, fila, 1, "SOLICITANTE", ancho_val=3)
    ws.merge_cells(start_row=fila, start_column=5, end_row=fila, end_column=6)
    celda(ws, fila, 5, "Fecha Muestreo:", font=F_LAB, fill="F8FAFC")
    celda(ws, fila, 6, fill="F8FAFC")
    ws.merge_cells(start_row=fila, start_column=7, end_row=fila, end_column=9)
    celda(ws, fila, 7, font=Font(name="Calibri", size=9, bold=True))
    mapa += [("meta.solicitante", f"B{fila}", "texto", None),
             ("meta.fecha_muestreo", f"G{fila}", "fecha", FMT_FECHA)]
    fila = 13
    par_ficha(ws, fila, 1, "COORDENADAS")
    par_ficha(ws, fila, 2, "E:")
    ws.merge_cells(start_row=fila, start_column=3, end_row=fila, end_column=4)
    par_ficha(ws, fila, 5, "N:")
    ws.merge_cells(start_row=fila, start_column=6, end_row=fila, end_column=7)
    par_ficha(ws, fila, 8, "Prof. (m):")
    mapa += [("meta.coordenada_este", f"C{fila}", "numero", "0.00"),
             ("meta.coordenada_norte", f"F{fila}", "numero", "0.00"),
             ("meta.profundidad", f"I{fila}", "texto", None)]
    fila = 14
    par_ficha(ws, fila, 1, "DATOS DE MUESTRA")
    par_ficha(ws, fila, 2, "Explor.:")
    par_ficha(ws, fila, 4, "Progresiva:")
    par_ficha(ws, fila, 6, "Estrato:")
    par_ficha(ws, fila, 8, "Lado:")
    mapa += [("meta.calicata", f"C{fila}", "texto", None),
             ("meta.progresiva", f"E{fila}", "texto", None),
             ("meta.estrato", f"G{fila}", "texto", None),
             ("meta.lado", f"I{fila}", "texto", None)]
    for _f in range(10, 15):            # ficha técnica compacta y pareja
        ws.row_dimensions[_f].height = 20
    # valores de ubicación/coordenadas a 9pt: sin saltos de línea que
    # descuadren la ficha ("La Convención", "0.00 - 0.20 m")
    for _ref in ("C11", "E11", "G11", "I11", "C13", "F13", "I13"):
        ws[_ref].font = Font(name="Calibri", size=9, bold=True)
    ws.row_dimensions[15].height = 6

    # ----------------------------------------------------- pesos y datos
    fila = 16
    banda(ws, fila, 1, 9, "ANÁLISIS GRANULOMÉTRICO POR TAMIZADO - MTC E 107")

    def par_doble(f, col_lab1, etiqueta1, ruta1, tipo1, fmt1, calc1,
                  col_lab2=None, etiqueta2=None, ruta2=None, tipo2=None,
                  fmt2=None, calc2=False):
        """Dos pares etiqueta/valor en una fila: A|B:C y D:E|F:G."""
        celda(ws, f, col_lab1, etiqueta1, font=F_LAB, fill="F8FAFC", align=AL_CENTRO)
        if calc1:
            ws.merge_cells(start_row=f, start_column=2, end_row=f, end_column=3)
            celda(ws, f, 2, fill=CALC_FILL)
            celda(ws, f, 3, fill=CALC_FILL)
            cel = ws.cell(row=f, column=2)
            cel.font = F_TAB_CALC
            cel.alignment = AL_CENTRO
            if fmt1:
                cel.number_format = fmt1
        else:
            ws.merge_cells(start_row=f, start_column=2, end_row=f, end_column=3)
            celda(ws, f, 2)
            celda(ws, f, 3)
            cel = ws.cell(row=f, column=2)
            cel.font = F_RESULT_VAL
            cel.alignment = AL_CENTRO
            if fmt1:
                cel.number_format = fmt1
        if not calc1:
            mapa.append((ruta1, f"B{f}", tipo1, fmt1))
        if etiqueta2:
            ws.merge_cells(start_row=f, start_column=4, end_row=f, end_column=5)
            celda(ws, f, 4, etiqueta2, font=F_LAB, fill="F8FAFC", align=AL_CENTRO)
            celda(ws, f, 5, fill="F8FAFC")
            ws.merge_cells(start_row=f, start_column=6, end_row=f, end_column=7)
            fill2 = CALC_FILL if calc2 else None
            celda(ws, f, 6, fill=fill2)
            celda(ws, f, 7, fill=fill2)
            cel = ws.cell(row=f, column=6)
            cel.font = F_TAB_CALC if calc2 else F_RESULT_VAL
            cel.alignment = AL_CENTRO
            if fmt2:
                cel.number_format = fmt2
            if not calc2:
                mapa.append((ruta2, f"F{f}", tipo2, fmt2))

    r = 17
    par_doble(r, 1, "PESO TOTAL (g)", "datos.general_fields.peso_total", "numero", FMT_PESO, False,
              4, "PESO FRAC. FINA TAMIZADA (g)", "datos.general_fields.peso_fina_tamizada", "numero", FMT_PESO, False)
    r = 18
    par_doble(r, 1, "PESO FRACCIÓN GRUESA (g)", "datos.general_fields.peso_fraccion_gruesa", "numero", FMT_PESO, True,
              4, "PESO MUESTRA LAVADA (g)", "datos.general_fields.peso_muestra_lavada", "numero", FMT_PESO, True)
    r = 19
    par_doble(r, 1, "PESO FRACCIÓN FINA (g)", "datos.general_fields.peso_fraccion_fina", "numero", FMT_PESO, True,
              4, "COEFICIENTE", "datos.general_fields.coeficiente", "numero", "0.0000", True)
    r = 20
    par_doble(r, 1, "LÍMITE LÍQUIDO (%)", "datos.general_fields.limite_liquido", "numero", FMT_PESO, False,
              4, "ÍNDICE DE PLASTICIDAD (%)", "datos.general_fields.indice_plasticidad", "numero", FMT_PESO, False)
    r = 21
    celda(ws, r, 1, "GRADACIÓN", font=F_LAB, fill="F8FAFC", align=AL_CENTRO)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=9)
    for c in range(2, 10):
        celda(ws, r, c)
    mapa.append(("datos.general_fields.gradacion", f"B{r}", "texto", None))
    ws.row_dimensions[22].height = 6

    # las fórmulas de pesos dependen de la tabla de tamices (siguiente sección)
    # fila de inicio de la tabla:
    f_tab_head = 24
    banda(ws, 23, 1, 9, "TAMIZADO")

    # ------------------------------------------------------- tabla de tamices
    cab_cols = ["Tamiz", "mm", "Masa (g)", "% Ret Parcial", "% Ret Acum.", "% que Pasa"]
    for j, nombre in enumerate(cab_cols):
        celda(ws, f_tab_head, 1 + j, nombre, font=F_TAB_HEAD, fill=OSCURO)
    ws.merge_cells(start_row=f_tab_head, start_column=6, end_row=f_tab_head, end_column=9)
    for c in range(7, 10):
        celda(ws, f_tab_head, c, fill=OSCURO)
    ws.row_dimensions[f_tab_head].height = 16

    f_ini = f_tab_head + 1                     # primera malla (3")
    f_04 = f_ini + 9                           # N° 4 (última gruesa)
    f_08 = f_ini + 10                          # N° 8 (primera fina)
    f_200 = f_ini + 20                         # N° 200 (última fina)
    f_p200 = f_200 + 1                         # <200
    f_total = f_p200 + 1                       # Total
    ptotal = f"B17"                            # peso_total (celda de entrada)
    pfina = f"F17"                             # peso_fina_tamizada
    for i, (key, etiqueta, mm) in enumerate(MALLAS):
        f = f_ini + i
        celda(ws, f, 1, etiqueta)
        cel_mm = celda(ws, f, 2, mm, formato=FMT_MM)
        cel_mm.alignment = AL_CENTRO
        celda(ws, f, 3)  # masa (entrada)
        mapa.append((f"datos.tables.granulometria.{key}.retenido", f"C{f}", "numero", FMT_PESO))
        if i < N_COARSE:
            ws[f"D{f}"] = (f"=IF(AND(N({ptotal})>0,ISNUMBER(C{f})),"
                           f"IFERROR(C{f}/{ptotal}*100,0),\"\")")
        else:
            ws[f"D{f}"] = (f"=IF(AND(N({pfina})>0,N({ptotal})>0,ISNUMBER(C{f})),"
                           f"IFERROR(C{f}/{pfina}*({ptotal}-B18)/{ptotal}*100,0),\"\")")
        ws[f"E{f}"] = f"=IF(ISNUMBER(D{f}),D{f},0)" if i == 0 else \
                      f"=IF(ISNUMBER(D{f}),E{f - 1}+D{f},E{f - 1})"
        ws[f"F{f}"] = f"=100-E{f}"
        for col, fill_calc in (("D", True), ("E", True), ("F", True)):
            if fill_calc:
                ws[f"{col}{f}"].fill = PatternFill("solid", fgColor=CALC_FILL)
                ws[f"{col}{f}"].font = F_TAB_CALC
                ws[f"{col}{f}"].number_format = FMT_PCT
        for c in range(7, 10):
            celda(ws, f, c)

    # fila < 200
    f = f_p200
    celda(ws, f, 1, "< N° 200")
    celda(ws, f, 2)
    ws[f"C{f}"] = f'=IF(AND(N({pfina})>0,N({ptotal})>0),MAX({pfina}-SUM(C{f_08}:C{f_200}),0),"")'
    ws[f"D{f}"] = (f"=IF(AND(N({pfina})>0,N({ptotal})>0,ISNUMBER(C{f})),"
                   f"IFERROR(C{f}/{pfina}*({ptotal}-B18)/{ptotal}*100,0),\"\")")
    ws[f"E{f}"] = f"=IF(ISNUMBER(D{f}),E{f_200}+D{f},E{f_200})"
    ws[f"F{f}"] = f"=100-E{f}"

    # fila Total
    f = f_total
    celda(ws, f, 1, "Total")
    celda(ws, f, 2)
    ws[f"C{f}"] = (f'=IF(AND(N({ptotal})>0,ISNUMBER(C{f_ini})),'
                   f'SUM(C{f_ini}:C{f_04})+N({pfina}),"")')
    ws[f"D{f}"] = f"=IF(ISNUMBER(C{f}),100,\"\")"
    ws[f"E{f}"] = f"=IF(ISNUMBER(D{f}),SUM(D{f_ini}:D{f_p200}),\"\")"
    ws[f"F{f}"] = f"=IF(ISNUMBER(E{f}),100-E{f},\"\")"
    for f_extra in (f_p200, f_total):
        for col in ("C", "D", "E", "F"):
            ws[f"{col}{f_extra}"].fill = PatternFill("solid", fgColor=CALC_FILL)
            ws[f"{col}{f_extra}"].font = F_TAB_CALC
            if col != "C":
                ws[f"{col}{f_extra}"].number_format = FMT_PCT
            else:
                ws[f"{col}{f_extra}"].number_format = FMT_PESO
    # refuerzo de estilo para las celdas calculadas de la tabla principal
    for i in range(len(MALLAS)):
        f = f_ini + i
        for col in ("D", "E", "F"):
            ws[f"{col}{f}"].fill = PatternFill("solid", fgColor=CALC_FILL)
            ws[f"{col}{f}"].font = F_TAB_CALC
            ws[f"{col}{f}"].number_format = FMT_PCT

    # ------------------------------------ fórmulas del bloque de pesos
    ws["B18"] = f"=IF(N({ptotal})>0,SUM(C{f_ini}:C{f_04}),\"\")"          # fracción gruesa
    ws["F18"] = (f"=IF(AND(N({ptotal})>0,N({pfina})>0),"
                 f"B18+SUM(C{f_08}:C{f_200})*B19/{pfina},\"\")")      # muestra lavada
    ws["B19"] = f"=IF(N({ptotal})>0,{ptotal}-B18,\"\")"                   # fracción fina
    ws["F19"] = f"=IF(AND(N({ptotal})>0,N({pfina})>0),IFERROR({pfina}/{ptotal},0),\"\")"  # coeficiente
    for addr in ("B18", "F18", "B19", "F19"):
        ws[addr].fill = PatternFill("solid", fgColor=CALC_FILL)
        ws[addr].font = F_TAB_CALC

    # ------------------------------------------------- resultados y SUCS
    f_res = f_total + 2
    banda(ws, f_res, 1, 9, "RESULTADOS")
    f = f_res + 1
    celda(ws, f, 1, "% GRAVA", font=F_LAB, fill="F8FAFC", align=AL_CENTRO)
    cel = celda(ws, f, 2, fill=RESULT_FILL)
    cel.value = f"=IF(ISNUMBER(E{f_04}),E{f_04},\"\")"
    cel.font = F_RESULT_VAL
    cel.number_format = '0.0" %"'
    celda(ws, f, 3, "% ARENA", font=F_LAB, fill="F8FAFC", align=AL_CENTRO)
    ws.merge_cells(start_row=f, start_column=4, end_row=f, end_column=5)
    cel = celda(ws, f, 4, fill=RESULT_FILL)
    cel.value = f"=IF(AND(ISNUMBER(F{f_04}),ISNUMBER(F{f_200})),F{f_04}-F{f_200},\"\")"
    celda(ws, f, 5, fill=RESULT_FILL)
    cel.font = F_RESULT_VAL
    cel.number_format = '0.0" %"'
    celda(ws, f, 6, "% FINOS", font=F_LAB, fill="F8FAFC", align=AL_CENTRO)
    ws.merge_cells(start_row=f, start_column=7, end_row=f, end_column=9)
    for c in range(7, 10):
        celda(ws, f, c, fill=RESULT_FILL)
    cel = ws.cell(row=f, column=7)
    cel.value = f"=IF(ISNUMBER(F{f_200}),F{f_200},\"\")"
    cel.font = F_RESULT_VAL
    cel.number_format = '0.0" %"'
    f = f_res + 2
    celda(ws, f, 1, "TMN", font=F_LAB, fill="F8FAFC", align=AL_CENTRO)
    ws.merge_cells(start_row=f, start_column=2, end_row=f, end_column=3)
    celda(ws, f, 2, fill=RESULT_FILL)
    celda(ws, f, 3, fill=RESULT_FILL)
    cel = ws.cell(row=f, column=2)
    cel.value = (f'=IFERROR(INDEX(A{f_ini}:A{f_200},'
                 f'MATCH(TRUE,INDEX(E{f_ini}:E{f_200}>0.01,0),0)),"N/A")')
    cel.font = F_RESULT_VAL
    cel.alignment = AL_CENTRO

    # tabla SUCS (referencia estática)
    f_sucs = f_res + 4
    banda(ws, f_sucs, 1, 9, "CLASIFICACIÓN SUCS (REFERENCIA)")
    ws.merge_cells(start_row=f_sucs + 1, start_column=1, end_row=f_sucs + 1, end_column=2)
    celda(ws, f_sucs + 1, 1, "SUCS", font=F_TAB_HEAD, fill=OSCURO)
    celda(ws, f_sucs + 1, 2, fill=OSCURO)
    ws.merge_cells(start_row=f_sucs + 1, start_column=3, end_row=f_sucs + 1, end_column=9)
    celda(ws, f_sucs + 1, 3, "Descripción", font=F_TAB_HEAD, fill=OSCURO)
    for c in range(4, 10):
        celda(ws, f_sucs + 1, c, fill=OSCURO)
    for i, (suc, desc) in enumerate(SUCS):
        f = f_sucs + 2 + i
        ws.merge_cells(start_row=f, start_column=1, end_row=f, end_column=2)
        celda(ws, f, 1, suc)
        celda(ws, f, 2)
        ws.merge_cells(start_row=f, start_column=3, end_row=f, end_column=9)
        cel = celda(ws, f, 3, desc)
        cel.alignment = AL_IZQ
        cel.font = Font(name="Calibri", size=8, color="111827")
        for c in range(4, 10):
            celda(ws, f, c)

    # ---------------------------------------------------------------- gráfico
    f_graf = f_sucs + len(SUCS) + 3
    from openpyxl.worksheet.pagebreak import Break
    ws.row_breaks.append(Break(id=f_sucs - 1))
    banda(ws, f_graf, 1, 9, "CURVA GRANULOMÉTRICA")

    hd = wb.create_sheet("_DATOS")
    hd.sheet_state = "hidden"
    for i in range(len(MALLAS)):
        r = 3 + i
        f = f_ini + i
        hd[f"A{r}"] = mm = MALLAS[i][2]
        hd[f"B{r}"] = f"=IF(ISNUMBER(Reporte!F{f}),Reporte!F{f},NA())"
    for nombre, ref in {"GranX": "$A$3:$A$23", "GranY": "$B$3:$B$23"}.items():
        definir_nombre(wb, nombre, "_DATOS", ref)

    ch = ScatterChart()
    ch.title = "Curva Granulométrica — % que Pasa vs Abertura de Tamiz (mm, esc. log)"
    ch.height = 12.6
    ch.width = 16.4
    ch.x_axis.scaling.logBase = 10
    # límites alineados a décadas: Excel mal dibuja ejes log con mínimo no-decada
    ch.x_axis.scaling.min = 0.01
    ch.x_axis.scaling.max = 100
    ch.y_axis.scaling.min = 0
    ch.y_axis.scaling.max = 100
    ch.x_axis.majorGridlines = ChartLines()
    ch.y_axis.majorGridlines = ChartLines()
    ch.legend.position = "b"
    ch.legend.overlay = False
    ch.varyColors = False
    ch.x_axis.delete = False
    ch.y_axis.delete = False

    xv = Reference(hd, range_string="_DATOS!$A$3:$A$23")
    yv = Reference(hd, range_string="_DATOS!$B$3:$B$23")
    s1 = Series(yv, xv, title="Curva Granulométrica")
    s1.graphicalProperties.line = LineProperties(solidFill="1E40AF", w=24000)
    s1.marker = Marker(symbol="circle", size=6)
    s1.marker.graphicalProperties.solidFill = "1E40AF"
    s1.smooth = True
    ch.series.append(s1)
    ws.add_chart(ch, f"A{f_graf + 1}")

    RG = "'_DATOS'!"
    series_specs = [
        ("curva_granulometrica", "Curva Granulométrica",
         "xy", f"A{f_graf + 1}", 620, 480, "SI", 0.01, 100, 0, 100,
         "Abertura de Tamiz (mm)", "% que Pasa",
         "Curva Granulométrica", "linea_suave", f"{RG}$A$3:$A$23", f"{RG}$B$3:$B$23", "1E40AF", 1),
        ("curva_granulometrica", "", "", "", "", "", "", "", "", "", "", "", "",
         "Tamices", "marcador", f"{RG}$A$3:$A$23", f"{RG}$B$3:$B$23", "1E40AF", 2),
    ]
    hoja_specs_graficos(wb, series_specs)

    # ---------------------------------------------------------------- firmas
    f_firma = f_graf + 31
    bloques = [("ESP. ENSAYOS GEOTECNICOS", 1, 3),
               ("ESP. SUELOS Y PAVIMENTOS", 4, 6),
               ("SUPERVISOR", 7, 9)]
    for _, ci, cf in bloques:
        for c in range(ci, cf + 1):
            ws.cell(row=f_firma, column=c).border = Border(
                top=Side(style="thin", color="0F172A"))
    for texto, ci, cf in bloques:
        ws.merge_cells(start_row=f_firma + 1, start_column=ci, end_row=f_firma + 1, end_column=cf)
        cel = ws.cell(row=f_firma + 1, column=ci, value=texto)
        cel.font = F_FIRMA
        cel.alignment = AL_CENTRO

    ws.print_area = f"A1:I{f_firma + 2}"
    hoja_oculta_mapa(wb, mapa)
    wb.calculation.fullCalcOnLoad = True
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    wb.save(SALIDA)
    print(f"OK -> {SALIDA}  (filas: hasta {f_firma + 2}, mapa: {len(mapa)} rutas)")


if __name__ == "__main__":
    construir()
