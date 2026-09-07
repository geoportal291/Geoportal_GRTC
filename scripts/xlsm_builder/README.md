# Informes Excel (.xlsm) con macros — Ensayos de Mecánica de Suelos

Genera los informes Excel (.xlsm) de **Límites de Consistencia (MTC E110/E111/E108)**,
**Proctor Modificado (MTC E115)** y **Análisis Granulométrico (MTC E107)** que replica
el formato del informe PDF del Geoportal GRTC, con **fórmulas vivas** (al cambiar un
peso se recalcula humedad/LL/LP/IP/densidades) y **macro VBA integrada**.

## Arquitectura en tiempo de ejecución

```
Frontend (botón "Informe Excel")
  → GET /api/ensayos/:id/reporte-excel            (backend/index.js)
  → services/reporteExcelService.js               (arma payload {meta, datos})
  → python_worker/excel_reporte.py                (openpyxl, keep_vba=True)
      · carga backend/templates/informe_<tipo>.xlsm
      · escribe valores crudos según la hoja oculta _MAPA (ruta→celda)
      · fullCalcOnLoad: Excel recalcula las fórmulas al abrir
  → descarga Informe_<Tipo>_<código>.xlsm
```

- **Los cálculos no se hacen en Python**: son fórmulas de la plantilla
  (mismas que `config_calculos` del sistema) y Excel las recalcula al abrir.
- **Gráficos**: los de la plantilla apuntan a rangos vivos de la hoja oculta
  `_DATOS`; se actualizan solos al recalcular. La macro no los destruye.
- **Macro VBA** (`scripts/xlsm_vba/modActualizacion.bas`): botón
  "ACTUALIZAR REPORTE" (recalcula, repara gráficos si faltan y ajusta la
  impresión A4) + `Workbook_Open` (recalculo y autorreparación silenciosa).
  La especificación de gráficos para la reparación vive en la hoja oculta `_GRAFICOS`.

## Regenerar las plantillas (solo si cambia el formato)

Requiere **Microsoft Excel** instalado (para incrustar el proyecto VBA) y Python + openpyxl:

```powershell
# 1) reconstruir las bases .xlsx (formato + fórmulas + gráficos)
python scripts/xlsm_builder/construir_limites.py
python scripts/xlsm_builder/construir_proctor.py
python scripts/xlsm_builder/construir_granulometria.py

# 2) incrustar macros VBA y guardar como .xlsm  (usa COM de Excel;
#    activa "Confiar en el acceso al modelo de objetos VBA" en HKCU)
powershell -ExecutionPolicy Bypass -File scripts/xlsm_builder/inyectar_vba.ps1
```

Salida: `backend/templates/informe_{limites,proctor,granulometria}.xlsm`
(esas plantillas se comprometen al repositorio; producción **no** necesita Excel,
solo Python3 + openpyxl, que ya están en la imagen Docker del backend).

## Notas técnicas (quirks de Excel descubiertos a la fuerza)

- `COUNT(B20:B22)` cuenta también la fila 21: para sumar celdas no adyacentes
  usar `COUNT(B20,B22)`.
- En un eje logarítmico, el mínimo/máximo deben ser potencias de 10 (0.01, 100…);
  con otros valores Excel dibuja el eje vertical en medio del gráfico y recorta puntos.
- `Axis.ScaleType = xlLogarithmic` por VBA devuelve E_FAIL si el gráfico ya tiene
  series; debe aplicarse al crearlo y antes de agregarlas.
- Un salto de página automático que cae dentro de un gráfico flotante hace que
  Excel se coma las filas siguientes del área de impresión: fijar el salto con
  `row_breaks` antes de la sección de gráficos.
- Gráficos openpyxl: `x_axis.delete = False`, `y_axis.delete = False` y
  `varyColors = False` para que Excel muestre etiquetas de eje y una leyenda normal.
