' Código que inyectar_vba.ps1 coloca en el módulo de documento ThisWorkbook.
' Al abrir el archivo: recálculo completo, botón ACTUALIZAR y
' autorreparación de gráficos (silencioso; no muestra mensajes).

Private Sub Workbook_Open()
    On Error Resume Next
    Application.CalculateFullRebuild
    AsegurarBoton
    RepararGraficosSiFaltan
End Sub
