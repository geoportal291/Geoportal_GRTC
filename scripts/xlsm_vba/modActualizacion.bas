Attribute VB_Name = "modActualizacion"
Option Explicit

' =====================================================================
'  Geoportal GRTC - Informe Excel de Ensayos de Mecánica de Suelos
'  ------------------------------------------------------------------
'  Recalcula el informe, reconstruye los gráficos definidos en la
'  hoja oculta _GRAFICOS (una fila por serie) y ajusta la impresión A4.
'  La misma macro sirve para Límites, Proctor y Granulometría.
' =====================================================================

Public Sub ActualizarTodo()
    ' Recalcula todo el informe y reparar los gráficos SOLO si alguno falta
    ' (los gráficos de la plantilla se actualizan solos al recalcular,
    '  porque sus series apuntan a rangos vivos).
    Application.ScreenUpdating = False
    Application.CalculateFullRebuild
    RepararGraficosSiFaltan
    ConfigurarImpresion
    Application.ScreenUpdating = True
    MsgBox "Informe actualizado correctamente.", vbInformation, "Informe GRTC"
End Sub

' Reconstruye todos los gráficos a partir de la especificación _GRAFICOS.
Public Sub ReconstruirGraficos()
    Dim wsG As Worksheet, wsR As Worksheet
    Set wsG = HojaPorNombre("_GRAFICOS")
    If wsG Is Nothing Then Exit Sub
    Set wsR = HojaPorNombre("Reporte")
    If wsR Is Nothing Then Exit Sub

    Dim ultima As Long
    ultima = wsG.Cells(wsG.Rows.Count, 1).End(xlUp).Row
    If ultima < 2 Then Exit Sub

    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    EliminarGraficosPropios wsR
    Application.DisplayAlerts = True

    Dim fila As Long, idActual As String
    Dim ch As ChartObject
    idActual = ""

    ' --- 1ª pasada: crear gráficos y agregar series ---
    For fila = 2 To ultima
        If Trim(wsG.Cells(fila, 1).Value) <> "" And Trim(wsG.Cells(fila, 3).Value) <> "" Then
            ' -------- fila cabecera del gráfico (tiene id y tipo) --------
            idActual = Trim(wsG.Cells(fila, 1).Value)
            Set ch = wsR.ChartObjects.Add(0, 0, 300, 200)
            ch.Name = "GR_" & idActual
            With ch.Chart
                .ChartType = xlXYScatter
                If Trim(wsG.Cells(fila, 2).Value) <> "" Then
                    .HasTitle = True
                    .ChartTitle.Text = Trim(wsG.Cells(fila, 2).Value)
                    .ChartTitle.Font.Size = 10
                    .ChartTitle.Font.Bold = True
                End If
                ' TODA la configuración de ejes va ANTES de agregar series:
                ' con series cargadas, ScaleType devuelve E_FAIL y las
                ' escalas de un eje log se revierten a automático.
                AplicarEjes ch.Chart, wsG, fila
            End With
            ColocarGrafico ch, wsR, Trim(wsG.Cells(fila, 4).Value), _
                wsG.Cells(fila, 5).Value, wsG.Cells(fila, 6).Value
            ' la fila de cabecera también puede declarar la primera serie
            If Trim(wsG.Cells(fila, 14).Value) <> "" Then
                AgregarSerie ch.Chart, wsR.Parent, _
                    Trim(wsG.Cells(fila, 14).Value), _
                    Trim(wsG.Cells(fila, 15).Value), _
                    Trim(wsG.Cells(fila, 16).Value), _
                    Trim(wsG.Cells(fila, 17).Value), _
                    Trim(wsG.Cells(fila, 18).Value)
            End If
        ElseIf idActual <> "" And Trim(wsG.Cells(fila, 14).Value) <> "" Then
            ' -------- fila de serie del gráfico actual --------
            AgregarSerie ch.Chart, wsR.Parent, _
                Trim(wsG.Cells(fila, 14).Value), _
                Trim(wsG.Cells(fila, 15).Value), _
                Trim(wsG.Cells(fila, 16).Value), _
                Trim(wsG.Cells(fila, 17).Value), _
                Trim(wsG.Cells(fila, 18).Value)
        End If
    Next fila

    Application.ScreenUpdating = True
End Sub

' Aplica escalas, títulos y formato de ejes desde la fila de cabecera de _GRAFICOS.
Private Sub AplicarEjes(cht As Chart, wsG As Worksheet, fila As Long)
    On Error Resume Next
    With cht
        ' 1) tipo de eje y posición del eje vertical (solo válidos pre-series)
        If UCase(Trim(wsG.Cells(fila, 7).Value)) = "SI" Then
            .Axes(xlCategory).ScaleType = xlLogarithmic
            .Axes(xlValue).Crosses = xlAxisCrossesMinimum
        End If
        ' 2) escalas
        If IsNumeric(wsG.Cells(fila, 8).Value) And Trim(wsG.Cells(fila, 8).Value) <> "" Then
            .Axes(xlCategory).MinimumScale = CDbl(wsG.Cells(fila, 8).Value)
        End If
        If IsNumeric(wsG.Cells(fila, 9).Value) And Trim(wsG.Cells(fila, 9).Value) <> "" Then
            .Axes(xlCategory).MaximumScale = CDbl(wsG.Cells(fila, 9).Value)
        End If
        If IsNumeric(wsG.Cells(fila, 10).Value) And Trim(wsG.Cells(fila, 10).Value) <> "" Then
            .Axes(xlValue).MinimumScale = CDbl(wsG.Cells(fila, 10).Value)
        End If
        If IsNumeric(wsG.Cells(fila, 11).Value) And Trim(wsG.Cells(fila, 11).Value) <> "" Then
            .Axes(xlValue).MaximumScale = CDbl(wsG.Cells(fila, 11).Value)
        End If
        ' 3) títulos y formato
        If Trim(wsG.Cells(fila, 12).Value) <> "" Then
            .Axes(xlCategory).HasTitle = True
            .Axes(xlCategory).AxisTitle.Text = Trim(wsG.Cells(fila, 12).Value)
            .Axes(xlCategory).AxisTitle.Font.Size = 8
        End If
        If Trim(wsG.Cells(fila, 13).Value) <> "" Then
            .Axes(xlValue).HasTitle = True
            .Axes(xlValue).AxisTitle.Text = Trim(wsG.Cells(fila, 13).Value)
            .Axes(xlValue).AxisTitle.Font.Size = 8
        End If
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
        .Legend.Font.Size = 7
        .PlotArea.Format.Fill.ForeColor.RGB = RGB(255, 255, 255)
        .ChartArea.Format.Line.ForeColor.RGB = RGB(15, 23, 42)
    End With
End Sub

Private Sub AgregarSerie(cht As Chart, wb As Workbook, nombre As String, _
                         estilo As String, refX As String, refY As String, _
                         colorHex As String)
    On Error GoTo terminar
    Dim s As Series
    Set s = cht.SeriesCollection.NewSeries
    s.Name = nombre
    If refX <> "" Then s.XValues = RangoDesdeRef(wb, refX)
    If refY <> "" Then s.Values = RangoDesdeRef(wb, refY)
    Dim color As Long
    color = ColorDesdeHex(colorHex)
    If estilo = "linea" Then
        s.ChartType = xlXYScatterLinesNoMarkers
        s.Format.Line.ForeColor.RGB = color
        s.Format.Line.Weight = 2
        s.Format.Line.DashStyle = msoLineDash
    ElseIf estilo = "linea_suave" Then
        s.ChartType = xlXYScatterSmoothNoMarkers
        s.Format.Line.ForeColor.RGB = color
        s.Format.Line.Weight = 2.25
        s.Smooth = True
    Else ' marcador
        s.ChartType = xlXYScatter
        s.Format.Line.Visible = msoFalse
        s.MarkerStyle = xlMarkerStyleCircle
        s.MarkerSize = 7
        s.MarkerBackgroundColor = color
        s.MarkerForegroundColor = color
    End If
terminar:
End Sub

Private Sub ColocarGrafico(ch As ChartObject, wsR As Worksheet, _
                           ancla As String, anchoPx As Variant, altoPx As Variant)
    On Error Resume Next
    Dim r As Range
    Set r = wsR.Range(ancla)
    ch.Left = r.Left + 2
    ch.Top = r.Top + 2
    If IsNumeric(anchoPx) And anchoPx > 0 Then ch.Width = CDbl(anchoPx)
    If IsNumeric(altoPx) And altoPx > 0 Then ch.Height = CDbl(altoPx)
End Sub

Private Sub EliminarGraficosPropios(wsR As Worksheet)
    ' Elimina todos los gráficos de la hoja (los de la plantilla y los
    ' creados por esta macro) para regenerarlos desde cero.
    Dim i As Long
    For i = wsR.ChartObjects.Count To 1 Step -1
        wsR.ChartObjects(i).Delete
    Next i
End Sub

Public Function HojaPorNombre(nombre As String) As Worksheet
    On Error Resume Next
    Set HojaPorNombre = ThisWorkbook.Worksheets(nombre)
End Function

Private Function RangoDesdeRef(wb As Workbook, ref As String) As Range
    ' ref con formato 'Hoja'!$A$1:$B$5  (también acepta Hoja!$A$1)
    Dim partes() As String, nombreHoja As String
    partes = Split(ref, "!")
    If UBound(partes) < 1 Then Exit Function
    nombreHoja = Replace(partes(0), "'", "")
    Set RangoDesdeRef = wb.Worksheets(nombreHoja).Range(partes(1))
End Function

Private Function ColorDesdeHex(hexStr As String) As Long
    On Error GoTo terminar
    If Len(hexStr) = 6 Then
        ColorDesdeHex = RGB(CLng("&H" & Mid(hexStr, 1, 2)), _
                            CLng("&H" & Mid(hexStr, 3, 2)), _
                            CLng("&H" & Mid(hexStr, 5, 2)))
    End If
terminar:
End Function

' Ajusta la configuración de impresión A4 del informe.
Public Sub ConfigurarImpresion()
    Dim wsR As Worksheet
    Set wsR = HojaPorNombre("Reporte")
    If wsR Is Nothing Then Exit Sub
    On Error Resume Next
    With wsR.PageSetup
        .PaperSize = xlPaperA4
        .Orientation = xlPortrait
        .Zoom = False
        .FitToPagesWide = 1
        .FitToPagesTall = False
        .CenterHorizontally = True
        .LeftMargin = Application.InchesToPoints(0.35)
        .RightMargin = Application.InchesToPoints(0.35)
        .TopMargin = Application.InchesToPoints(0.45)
        .BottomMargin = Application.InchesToPoints(0.45)
    End With
End Sub

' Reconstruye los gráficos solo si la hoja se quedó SIN gráficos
' (p.ej. archivo dañado). Los gráficos de la plantilla se conservan:
' sus series apuntan a rangos vivos y se actualizan solos.
Public Sub RepararGraficosSiFaltan()
    Dim wsG As Worksheet, wsR As Worksheet
    Set wsG = HojaPorNombre("_GRAFICOS")
    Set wsR = HojaPorNombre("Reporte")
    If wsG Is Nothing Or wsR Is Nothing Then Exit Sub
    If wsR.ChartObjects.Count > 0 Then Exit Sub
    ReconstruirGraficos
End Sub

' Crea el botón ACTUALIZAR REPORTE si no existe.
Public Sub AsegurarBoton()
    Dim wsR As Worksheet
    Set wsR = HojaPorNombre("Reporte")
    If wsR Is Nothing Then Exit Sub
    Dim shp As Shape
    On Error Resume Next
    Set shp = wsR.Shapes("BTN_ACTUALIZAR")
    On Error GoTo 0
    If shp Is Nothing Then
        Set shp = wsR.Shapes.AddFormControl(xlButtonControl, _
            wsR.Cells(8, 10).Left + 12, wsR.Cells(8, 1).Top, 152, 20)
        shp.Name = "BTN_ACTUALIZAR"
        shp.TextFrame.Characters.Text = "ACTUALIZAR REPORTE"
        shp.TextFrame.Characters.Font.Size = 9
        shp.TextFrame.Characters.Font.Bold = True
        shp.OnAction = "ActualizarTodo"
        shp.PrintObject = False
    End If
End Sub
