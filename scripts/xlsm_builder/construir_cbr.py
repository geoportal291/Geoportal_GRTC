# -*- coding: utf-8 -*-
"""
Construye la plantilla base (xlsx, pre-VBA) del Informe Excel de CBR
(MTC E 132), replicando el formato institucional del Geoportal GRTC.

Estructura de datos (tipo_ensayo config_key='cbr'):
  general_fields.constante_anillo / carga_patron_01 / carga_patron_02 /
                area_piston_cm2 / altura_disco_esp_pulg
  tables.datos_molde.mX.{altura_cm,diametro_cm} (+ volumen_cm3 calc)
  tables.compactacion.mX.{peso_molde_muestra_compacta,peso_molde}
  tables.capsulas.mX.{codigo_capsula,peso_capsula,capsula_suelo_humedo,capsula_suelo_seco}
  tables.absorcion.mX.{peso_despues_inmersion,peso_molde_muestra_compacta}
  tables.expansion.h{0,24,48,72,96}.mX_mm
  tables.penetracion.p{1..9}.mX_dial

Salida: backend/templates/base/base_cbr.xlsx
(el .xlsm final se crea con inyectar_vba.ps1)
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
                   AL_CENTRO, banda, celda, par_ficha, definir_nombre,
                   hoja_oculta_mapa, hoja_specs_graficos,
                   cabecera_institucional, preparar_hoja)

SALIDA = os.path.join(DIR_PLANTILLAS, "base", "base_cbr.xlsx")

FMT_PESO = "0.00"
FMT_DENS = "0.000"
FMT_PCT = "0.00"
FMT_FECHA = 'dddd d" de "mmmm" de "yyyy'

MOLDES = [("M-1 · 56 golpes", "m1"), ("M-2 · 25 golpes", "m2"), ("M-3 · 12 golpes", "m3")]
LECTURAS = [  # (clave, mm, pulg) — lecturas normales de penetración
    ("p1", 0.64, 0.025), ("p2", 1.27, 0.050), ("p3", 1.91, 0.075),
    ("p4", 2.54, 0.100), ("p5", 3.18, 0.125), ("p6", 3.81, 0.150),
    ("p7", 5.08, 0.200), ("p8", 7.62, 0.300), ("p9", 10.16, 0.400),
]
HORAS = [("Lectura 1 · 0 h", "h0"), ("Lectura 2 · 24 h", "h24"),
         ("Lectura 3 · 48 h", "h48"), ("Lectura 4 · 72 h", "h72"),
         ("Lectura 5 · 96 h", "h96")]


def construir():
    wb = Workbook()
    ws = wb.active
    ws.title = "Reporte"
    preparar_hoja(ws, [30, 11, 11, 11, 11, 11, 11, 11, 11])  # A + B..I

    mapa = []  # (ruta, celda, tipo, formato)

    # ------------------------------------------------ cabecera institucional
    cabecera_institucional(ws, ultima_col=9)
    ws.row_dimensions[7].height = 4

    # ------------------------------------------------ franja de código
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

    # ------------------------------------------------ ficha técnica
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
    par_ficha(ws, fila, 4, None)
    par_ficha(ws, fila, 5, "N:")
    ws.merge_cells(start_row=fila, start_column=6, end_row=fila, end_column=7)
    par_ficha(ws, fila, 7, None)
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
    for _f in range(10, 15):
        ws.row_dimensions[_f].height = 20
    for _ref in ("C11", "E11", "G11", "I11", "C13", "F13", "I13"):
        ws[_ref].font = Font(name="Calibri", size=9, bold=True)
    ws.row_dimensions[15].height = 6

    # ------------------------------------------------ datos del equipo
    fila = 16
    banda(ws, fila, 1, 9, "DATOS DEL EQUIPO")
    fila = 17
    par_ficha(ws, fila, 1, "Cte. del anillo (kg/div):")
    par_ficha(ws, fila, 3, "Área del pistón (cm²):")
    par_ficha(ws, fila, 7, "Altura disco esp. (pulg):")
    mapa += [("datos.general_fields.constante_anillo", f"B{fila}", "numero", "0.0000"),
             ("datos.general_fields.area_piston_cm2", f"D{fila}", "numero", "0.00"),
             ("datos.general_fields.altura_disco_esp_pulg", f"H{fila}", "numero", "0.000")]
    fila = 18
    par_ficha(ws, fila, 1, "Carga patrón al 0.1\" (kg):")
    par_ficha(ws, fila, 3, "Carga patrón al 0.2\" (kg):")
    mapa += [("datos.general_fields.carga_patron_01", f"B{fila}", "numero", "0.00"),
             ("datos.general_fields.carga_patron_02", f"D{fila}", "numero", "0.00")]
    f_cte_anillo, f_area_piston, f_altura_disco = 17, 17, 17
    f_patron_01, f_patron_02 = 18, 18
    ws.row_dimensions[19].height = 6

    # --------------------------------- moldes: datos, compactación, cápsulas
    fila = 20
    banda(ws, fila, 1, 9, "COMPACTACIÓN DE MOLDES - MTC E 132")
    f_head = fila + 1
    params = [
        ("Código de molde", "input", None),
        ("Altura del molde (cm)", "input", FMT_PESO),
        ("Diámetro del molde (cm)", "input", FMT_PESO),
        ("Volumen del molde (cm³)", "calc_num", "0.0"),
        ("Peso molde + muestra compacta (g)", "input", FMT_PESO),
        ("Peso del molde (g)", "input", FMT_PESO),
        ("Peso de la muestra compacta (g)", "calc_num", FMT_PESO),
        ("Densidad húmeda (g/cm³)", "calc_num", FMT_DENS),
        ("Cápsula N°", "input", None),
        ("Peso de la cápsula (g)", "input", FMT_PESO),
        ("Cápsula + suelo húmedo (g)", "input", FMT_PESO),
        ("Cápsula + suelo seco (g)", "input", FMT_PESO),
        ("Peso del agua (g)", "calc_num", FMT_PESO),
        ("Peso del suelo seco (g)", "calc_num", FMT_PESO),
        ("Contenido de humedad (%)", "calc_num", FMT_PCT),
        ("Densidad seca (g/cm³)", "calc_num", FMT_DENS),
    ]
    celda(ws, f_head, 1, "Parámetro", font=F_TAB_HEAD, fill=OSCURO)
    for j, (nombre, _k) in enumerate(MOLDES):
        celda(ws, f_head, 2 + j, nombre, font=F_TAB_HEAD, fill=OSCURO)
    ws.row_dimensions[f_head].height = 16
    filas = {}
    RUTA_MOLDE = {"m1": "tables.datos_molde.m1", "m2": "tables.datos_molde.m2",
                  "m3": "tables.datos_molde.m3"}
    for i, (etiqueta, tipo, formato) in enumerate(params):
        f = f_head + 1 + i
        celda(ws, f, 1, etiqueta)
        for j, (_n, k) in enumerate(MOLDES):
            col = 2 + j
            letra = chr(ord("B") + j)
            cel = celda(ws, f, col)
            if tipo == "calc_num":
                cel.fill = PatternFill("solid", fgColor=CALC_FILL)
                cel.font = F_TAB_CALC
            if formato:
                cel.number_format = formato
            if tipo == "input":
                ruta = {
                    0: f"datos.{RUTA_MOLDE[k]}.codigo_molde",
                    1: f"datos.{RUTA_MOLDE[k]}.altura_cm",
                    2: f"datos.{RUTA_MOLDE[k]}.diametro_cm",
                    4: f"datos.tables.compactacion.{k}.peso_molde_muestra_compacta",
                    5: f"datos.tables.compactacion.{k}.peso_molde",
                    8: f"datos.tables.capsulas.{k}.codigo_capsula",
                    9: f"datos.tables.capsulas.{k}.peso_capsula",
                    10: f"datos.tables.capsulas.{k}.capsula_suelo_humedo",
                    11: f"datos.tables.capsulas.{k}.capsula_suelo_seco",
                }[i]
                mapa.append((ruta, f"{letra}{f}", "texto" if i in (0, 8) else "numero", formato))
        filas[i] = f
    f_cod_molde = filas[0]
    f_altura, f_diam = filas[1], filas[2]
    f_volumen = filas[3]
    f_pmsc, f_pm = filas[4], filas[5]
    f_pmc, f_dens_hum = filas[6], filas[7]
    f_pcap, f_mcap_hum, f_mcap_sec = filas[9], filas[10], filas[11]
    f_magua, f_msec, f_hum, f_dens_sec = filas[12], filas[13], filas[14], filas[15]
    for j in range(3):
        letra = chr(ord("B") + j)
        # volumen = PI * d^2/4 * h
        ws[f"{letra}{f_volumen}"] = (f'=IF(AND(N({letra}{f_altura})>0,N({letra}{f_diam})>0),'
                                     f'ROUND(PI()*POWER({letra}{f_diam},2)*{letra}{f_altura}/4,1),"")')
        # peso muestra compacta
        ws[f"{letra}{f_pmc}"] = (f'=IF(COUNT({letra}{f_pmsc}:{letra}{f_pm})=2,'
                                 f'{letra}{f_pmsc}-{letra}{f_pm},"")')
        # densidad húmeda
        ws[f"{letra}{f_dens_hum}"] = (f'=IF(AND(ISNUMBER({letra}{f_pmc}),N({letra}{f_volumen})>0),'
                                      f'IFERROR({letra}{f_pmc}/{letra}{f_volumen},0),"")')
        # cápsulas
        ws[f"{letra}{f_magua}"] = (f'=IF(COUNT({letra}{f_mcap_hum}:{letra}{f_mcap_sec})=2,'
                                   f'{letra}{f_mcap_hum}-{letra}{f_mcap_sec},"")')
        ws[f"{letra}{f_msec}"] = (f'=IF(COUNT({letra}{f_pcap},{letra}{f_mcap_sec})=2,'
                                  f'{letra}{f_mcap_sec}-{letra}{f_pcap},"")')
        ws[f"{letra}{f_hum}"] = (f'=IF(AND(ISNUMBER({letra}{f_msec}),N({letra}{f_msec})>0),'
                                 f'IFERROR({letra}{f_magua}/{letra}{f_msec}*100,0),"")')
        # densidad seca
        ws[f"{letra}{f_dens_sec}"] = (f'=IF(AND(ISNUMBER({letra}{f_hum}),ISNUMBER({letra}{f_dens_hum})),'
                                      f'IFERROR({letra}{f_dens_hum}/(1+{letra}{f_hum}/100),0),"")')
    ws.row_dimensions[f_dens_sec + 1].height = 6

    # ------------------------------------------------ absorción
    fila = f_dens_sec + 2
    banda(ws, fila, 1, 9, "ABSORCIÓN")
    f_head = fila + 1
    celda(ws, f_head, 1, "Parámetro", font=F_TAB_HEAD, fill=OSCURO)
    for j, (nombre, _k) in enumerate(MOLDES):
        celda(ws, f_head, 2 + j, nombre, font=F_TAB_HEAD, fill=OSCURO)
    params_abs = [
        ("Peso M+MC después de inmersión (g)", "input", FMT_PESO),
        ("Peso M+MC antes de inmersión (g)", "calc_num", FMT_PESO),
        ("% de Absorción", "calc_num", FMT_PCT),
    ]
    for i, (etiqueta, tipo, formato) in enumerate(params_abs):
        f = f_head + 1 + i
        celda(ws, f, 1, etiqueta)
        for j, (_n, k) in enumerate(MOLDES):
            letra = chr(ord("B") + j)
            cel = celda(ws, f, 2 + j)
            if tipo == "calc_num":
                cel.fill = PatternFill("solid", fgColor=CALC_FILL)
                cel.font = F_TAB_CALC
            if formato:
                cel.number_format = formato
            if i == 0:
                mapa.append((f"datos.tables.absorcion.{k}.peso_despues_inmersion",
                             f"{letra}{f}", "numero", formato))
    f_pdi = f_head + 1
    f_pmi = f_head + 2
    f_absp = f_head + 3
    for j in range(3):
        letra = chr(ord("B") + j)
        ws[f"{letra}{f_pmi}"] = f'=IF(ISNUMBER({letra}{f_pmsc}),{letra}{f_pmsc},"")'
        ws[f"{letra}{f_absp}"] = (f'=IF(AND(ISNUMBER({letra}{f_pdi}),N({letra}{f_pmsc}-{letra}{f_pm})>0),'
                                  f'IFERROR(({letra}{f_pdi}-{letra}{f_pmsc})/({letra}{f_pmsc}-{letra}{f_pm})*100,0),"")')
    ws.row_dimensions[f_absp + 1].height = 6

    # ------------------------------------------------ expansión
    fila = f_absp + 2
    banda(ws, fila, 1, 9, "EXPANSIÓN (inmersión)")
    f_head = fila + 1
    cabezas = ["Lectura", "Dial M1 (mm)", "Dial M2 (mm)", "Dial M3 (mm)",
               "% Exp. M1", "% Exp. M2", "% Exp. M3"]
    celda(ws, f_head, 1, cabezas[0], font=F_TAB_HEAD, fill=OSCURO)
    for j, nombre in enumerate(cabezas[1:]):
        celda(ws, f_head, 2 + j, nombre, font=F_TAB_HEAD, fill=OSCURO)
    ws.row_dimensions[f_head].height = 16
    f_exp_filas = {}
    for i, (nombre, k) in enumerate(HORAS):
        f = f_head + 1 + i
        celda(ws, f, 1, nombre)
        for j in range(6):
            cel = celda(ws, f, 2 + j)
            if j >= 3:
                cel.fill = PatternFill("solid", fgColor=CALC_FILL)
                cel.font = F_TAB_CALC
            cel.number_format = FMT_PCT if j >= 3 else FMT_PESO
        for j, (_n, mk) in enumerate(MOLDES):
            letra_in = chr(ord("B") + j)      # diales: B, C, D
            letra_out = chr(ord("E") + j)     # %exp: E, F, G
            mapa.append((f"datos.tables.expansion.{k}.{mk}_mm", f"{letra_in}{f}", "numero", FMT_PESO))
            ws[f"{letra_out}{f}"] = (f'=IF(AND(ISNUMBER({letra_in}{f}),N($H${f_altura_disco})>0),'
                                     f'IFERROR({letra_in}{f}/25.4/$H${f_altura_disco}*100,0),"")')
        f_exp_filas[k] = f
    f_exp96 = f_exp_filas["h96"]
    ws.row_dimensions[f_exp96 + 1].height = 6

    # ------------------------------------------------ penetración
    fila = f_exp96 + 2
    banda(ws, fila, 1, 9, "PENETRACIÓN")
    f_head = fila + 1
    cabezas = ["Lectura", "Pen. (mm)", "Pen. (pulg)",
               "Dial M1", "Carga M1 (kg)", "Dial M2", "Carga M2 (kg)",
               "Dial M3", "Carga M3 (kg)"]
    for j, nombre in enumerate(cabezas):
        celda(ws, f_head, 1 + j, nombre, font=F_TAB_HEAD, fill=OSCURO)
    ws.row_dimensions[f_head].height = 16
    f_pen = {}
    for i, (k, mm, pulg) in enumerate(LECTURAS):
        f = f_head + 1 + i
        celda(ws, f, 1, f"{i + 1} · {k.upper()}")
        celda(ws, f, 2, mm, formato="0.00")
        celda(ws, f, 3, pulg, formato="0.000")
        for j in range(3):
            letra_dial = chr(ord("D") + j * 2)   # D, F, H
            letra_carga = chr(ord("E") + j * 2)  # E, G, I
            cel = celda(ws, f, 4 + j * 2)
            cel.number_format = "0.00"
            cel_carga = celda(ws, f, 5 + j * 2)
            cel_carga.fill = PatternFill("solid", fgColor=CALC_FILL)
            cel_carga.font = F_TAB_CALC
            cel_carga.number_format = FMT_PESO
            _n, mk = MOLDES[j]
            mapa.append((f"datos.tables.penetracion.{k}.{mk}_dial", f"{letra_dial}{f}", "numero", "0.00"))
            ws[f"{letra_carga}{f}"] = (f'=IF(AND(ISNUMBER({letra_dial}{f}),N($D${f_cte_anillo})>0),'
                                       f'IFERROR({letra_dial}{f}*$B${f_cte_anillo}*0.453592,0),"")')
        f_pen[k] = f
    f_p4, f_p7 = f_pen["p4"], f_pen["p7"]
    ws.row_dimensions[f_p9 := f_pen["p9"] + 1].height = 6

    # ------------------------------------------------ resultados CBR
    fila = f_p9 + 1
    banda(ws, fila, 1, 9, "RESULTADOS CBR")
    f_head = fila + 1
    celda(ws, f_head, 1, "Parámetro", font=F_TAB_HEAD, fill=OSCURO)
    for j, (nombre, _k) in enumerate(MOLDES):
        celda(ws, f_head, 2 + j, nombre, font=F_TAB_HEAD, fill=OSCURO)
    ws.row_dimensions[f_head].height = 16
    params_res = [
        ("Densidad seca (g/cm³)", "calc_num", FMT_DENS),
        ("Humedad de compactación (%)", "calc_num", FMT_PCT),
        ("% de Expansión (96 h)", "calc_num", FMT_PCT),
        ("% de Absorción", "calc_num", FMT_PCT),
        ("CBR al 0.1\" (%)", "calc_num", FMT_PCT),
        ("CBR al 0.2\" (%)", "calc_num", FMT_PCT),
        ("CBR FINAL (%)", "calc_num", FMT_PCT),
    ]
    for i, (etiqueta, tipo, formato) in enumerate(params_res):
        f = f_head + 1 + i
        celda(ws, f, 1, etiqueta)
        for j in range(3):
            cel = celda(ws, f, 2 + j)
            if tipo == "calc_num":
                cel.fill = PatternFill("solid", fgColor=CALC_FILL)
                cel.font = F_TAB_CALC
            if formato:
                cel.number_format = formato
    f_rds, f_rhum, f_rexp, f_rabs, f_rcbr1, f_rcbr2, f_rcbrf = [f_head + 1 + i for i in range(7)]
    for j in range(3):
        letra = chr(ord("B") + j)
        letra_dial = chr(ord("D") + j * 2)
        letra_carga = chr(ord("E") + j * 2)
        ws[f"{letra}{f_rds}"] = f'=IF(ISNUMBER({letra}{f_dens_sec}),{letra}{f_dens_sec},"")'
        ws[f"{letra}{f_rhum}"] = f'=IF(ISNUMBER({letra}{f_hum}),{letra}{f_hum},"")'
        ws[f"{letra}{f_rexp}"] = f'=IF(ISNUMBER({letra_out}{f_exp96}),{letra_out}{f_exp96},"")' if False else \
            f'=IF(ISNUMBER($E${f_exp96}),"","")'
        ws[f"{letra}{f_rabs}"] = f'=IF(ISNUMBER({letra}{f_absp}),{letra}{f_absp},"")'
        ws[f"{letra}{f_rcbr1}"] = (f'=IF(AND(ISNUMBER({letra_carga}{f_p4}),N($D${f_patron_01})>0),'
                                   f'IFERROR({letra_carga}{f_p4}/$B${f_patron_01}*100,0),"")')
        ws[f"{letra}{f_rcbr2}"] = (f'=IF(AND(ISNUMBER({letra_carga}{f_p7}),N($D${f_patron_02})>0),'
                                   f'IFERROR({letra_carga}{f_p7}/$D${f_patron_02}*100,0),"")')
        ws[f"{letra}{f_rcbrf}"] = (f'=IF(COUNT({letra}{f_rcbr1},{letra}{f_rcbr2})=2,'
                                   f'MAX({letra}{f_rcbr1},{letra}{f_rcbr2}),"")')
    # % de expansión por molde: columnas E/F/G de la última lectura
    for j in range(3):
        letra = chr(ord("B") + j)
        letra_exp = chr(ord("E") + j)
        ws[f"{letra}{f_rexp}"] = f'=IF(ISNUMBER({letra_exp}{f_exp96}),{letra_exp}{f_exp96},"")'
    f_cbrf_ultimo = f_rcbrf
    ws.row_dimensions[f_cbrf_ultimo + 1].height = 6

    # ------------------------------------------ ficha de resultados destacados
    fila = f_cbrf_ultimo + 2
    par_ficha(ws, fila, 1, "CBR DE DISEÑO (máx. de los moldes)", fill_val=RESULT_FILL)
    ws.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=9)
    for c in range(2, 10):
        celda(ws, fila, c, fill=RESULT_FILL)
    cel = ws.cell(row=fila, column=2)
    cel.value = f'=IF(COUNT(B{f_rcbrf}:D{f_rcbrf})=0,"",MAX(B{f_rcbrf}:D{f_rcbrf}))'
    cel.font = F_RESULT_VAL
    cel.number_format = '0.00" %"'
    cel.alignment = AL_CENTRO
    f_diseno = fila
    ws.row_dimensions[fila + 1].height = 6

    # ------------------------------------------------ gráfico
    from openpyxl.worksheet.pagebreak import Break
    f_graf = f_diseno + 2
    ws.row_breaks.append(Break(id=f_graf - 1))
    banda(ws, f_graf, 1, 9, "CURVA DE PENETRACIÓN - CARGA")

    ch = ScatterChart()
    ch.title = "Curva Carga - Penetración (MTC E 132)"
    ch.height = 12.0
    ch.width = 16.4
    ch.x_axis.majorGridlines = ChartLines()
    ch.y_axis.majorGridlines = ChartLines()
    ch.x_axis.title = "Penetración (pulg)"
    ch.y_axis.title = "Carga (kg)"
    ch.legend.position = "b"
    ch.legend.overlay = False
    ch.varyColors = False
    ch.x_axis.delete = False
    ch.y_axis.delete = False

    colores = ["1E40AF", "DC2626", "059669"]
    xref = Reference(ws, min_col=3, min_row=f_head + 1, max_row=f_p9)  # pulg
    for j, (nombre, _k) in enumerate(MOLDES):
        col_carga = 5 + j * 2  # E, G, I
        yref = Reference(ws, min_col=col_carga, min_row=f_head + 1, max_row=f_p9)
        s = Series(yref, xref, title=nombre.split(" · ")[0])
        s.graphicalProperties.line = LineProperties(solidFill=colores[j], w=24000)
        s.marker = Marker(symbol="circle", size=7)
        s.marker.graphicalProperties.solidFill = colores[j]
        s.marker.graphicalProperties.line = LineProperties(solidFill=colores[j])
        s.smooth = False
        ch.series.append(s)
    ws.add_chart(ch, f"A{f_graf + 1}")

    RG = "'Reporte'!"
    series_specs = [
        ("curva_penetracion", "Curva Carga - Penetración CBR",
         "xy", f"A{f_graf + 1}", 620, 460, "NO", "", "", "", "",
         "Penetración (pulg)", "Carga (kg)",
         "M-1", "linea", f"{RG}$C${f_head + 1}:$C${f_p9}", f"{RG}$E${f_head + 1}:$E${f_p9}", "1E40AF", 1),
        ("curva_penetracion", "", "", "", "", "", "", "", "", "", "", "", "",
         "M-2", "linea", f"{RG}$C${f_head + 1}:$C${f_p9}", f"{RG}$G${f_head + 1}:$G${f_p9}", "DC2626", 2),
        ("curva_penetracion", "", "", "", "", "", "", "", "", "", "", "", "",
         "M-3", "linea", f"{RG}$C${f_head + 1}:$C${f_p9}", f"{RG}$I${f_head + 1}:$I${f_p9}", "059669", 3),
    ]
    hoja_specs_graficos(wb, series_specs)

    # ------------------------------------------------ firmas
    f_firma = f_graf + 30
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
