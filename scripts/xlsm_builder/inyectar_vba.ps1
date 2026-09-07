# Inyecta las macros VBA (scripts/xlsm_vba) en las plantillas base
# (backend/templates/base/*.xlsx) y las guarda como .xlsm en
# backend/templates/.
#
# Uso:  powershell -File inyectar_vba.ps1
# Requiere Microsoft Excel instalado. Para manipular el proyecto VBA,
# Excel necesita "Confiar en el acceso al modelo de objetos VBA";
# este script activa ese permiso a nivel de usuario (HKCU) si falta.

$ErrorActionPreference = "Stop"

$raiz     = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$dirBase  = Join-Path $raiz "backend\templates\base"
$dirVba   = Join-Path $raiz "scripts\xlsm_vba"
$dirSalida = Join-Path $raiz "backend\templates"
$moduloBas = Join-Path $dirVba "modActualizacion.bas"
$codigoTW  = Get-Content (Join-Path $dirVba "thisworkbook_code.vba") -Raw

if (-not (Test-Path $moduloBas)) { throw "No existe $moduloBas" }

# --- Permitir acceso al modelo de objetos VBA (HKCU) --------------------
$officeKeys = @("Software\Microsoft\Office\16.0\Excel\Security",
                 "Software\Microsoft\Office\15.0\Excel\Security",
                 "Software\Microsoft\Office\14.0\Excel\Security")
foreach ($k in $officeKeys) {
    try {
        $rk = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($k)
        if ($rk.GetValue("AccessVBOM") -ne 1) { $rk.SetValue("AccessVBOM", 1, "DWord") }
        $rk.Close()
    } catch { }
}

# --- Abrir Excel ---------------------------------------------------------
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$exitCode = 0

function Inyectar-Vba([string]$xlsx, [string]$xlsm) {
    $wb = $excel.Workbooks.Open($xlsx)
    try {
        $proj = $wb.VBProject
        # módulo estándar con la lógica de actualización
        $yaEsta = $false
        foreach ($c in $proj.VBComponents) {
            if ($c.Name -eq "modActualizacion") { $yaEsta = $true }
        }
        if (-not $yaEsta) { $null = $proj.VBComponents.Import($moduloBas) }
        # código de apertura en ThisWorkbook
        $tw = $null
        foreach ($c in $proj.VBComponents) {
            if ($c.Name -eq "ThisWorkbook" -and $c.Type -eq 100) { $tw = $c }
        }
        if ($tw -eq $null) { throw "No se encontró el componente ThisWorkbook" }
        $tw.CodeModule.AddFromString($codigoTW) | Out-Null
        # guardar como .xlsm (52 = xlOpenXMLWorkbookMacroEnabled)
        if (Test-Path $xlsm) { Remove-Item $xlsm -Force }
        $wb.SaveAs($xlsm, 52)
        Write-Host "OK  -> $xlsm"
    } finally {
        $wb.Close($false)
    }
}

try {
    Get-ChildItem -Path $dirBase -Filter "base_*.xlsx" | ForEach-Object {
        $nombre = $_.BaseName -replace "^base_", ""
        $xlsm = Join-Path $dirSalida ("informe_{0}.xlsm" -f $nombre)
        Inyectar-Vba $_.FullName $xlsm
    }
} catch {
    Write-Error ("Fallo la inyección de VBA: " + $_.Exception.Message +
        "  (verifica que Excel esté instalado y que 'Confiar en el acceso al modelo de objetos VBA' esté activado)")
    $exitCode = 1
} finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}

exit $exitCode
