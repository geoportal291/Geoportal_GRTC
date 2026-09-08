# ============================================================
#  Geoportal GRTC — Informes Excel con macros
#  Agrega la carpeta indicada como "Ubicación confiable" de Excel,
#  para que los informes .xlsm descargados abran sin el bloqueo
#  de macros por origen de internet (Marca de la Web).
#
#  Uso (cada usuario, una sola vez):
#    powershell -ExecutionPolicy Bypass -File habilitar_macros_confianza.ps1
#    powershell -ExecutionPolicy Bypass -File habilitar_macros_confianza.ps1 -Carpeta "C:\InformesGRTC"
# ============================================================
param([string]$Carpeta = "$env:USERPROFILE\Downloads")

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Carpeta)) {
    New-Item -ItemType Directory -Path $Carpeta -Force | Out-Null
}
$Carpeta = (Resolve-Path $Carpeta).Path.TrimEnd("\") + "\"

# versiones de Office que usan la rama 16.0/15.0 (2016..Microsoft 365)
$versiones = @("16.0", "15.0")
$agregadas = 0

foreach ($v in $versiones) {
    $base = "HKCU:\Software\Microsoft\Office\$v\Excel\Security\Trusted Locations"
    if (-not (Test-Path $base)) {
        # si Excel nunca registró ubicaciones confiables, crear la rama
        New-Item -Path $base -Force | Out-Null | Out-Null
    }
    # evitar duplicados: si ya existe una ubicación con la misma ruta, saltar
    $yaExiste = $false
    $indice = 1
    while (Get-ItemProperty -Path "$base\Location$indice" -ErrorAction SilentlyContinue) {
        $props = Get-ItemProperty -Path "$base\Location$indice"
        if ($props.Path -ieq $Carpeta) { $yaExiste = $true }
        $indice++
    }
    if ($yaExiste) {
        Write-Host "($v) La carpeta ya estaba registrada como confiable: $Carpeta"
        continue
    }
    $loc = "$base\Location$indice"
    New-Item -Path $loc -Force | Out-Null
    New-ItemProperty -Path $loc -Name "Path" -Value $Carpeta -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $loc -Name "Description" -Value "Informes Excel Geoportal GRTC" -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $loc -Name "AllowSubFolders" -Value 1 -PropertyType DWord -Force | Out-Null
    Write-Host "($v) Agregada ubicación confiable: $Carpeta"
    $agregadas++
}

if ($agregadas -gt 0) {
    Write-Host ""
    Write-Host "Listo. Cierra Excel si estaba abierto y vuelve a descargar el informe:"
    Write-Host "los macros se habilitarán sin ningún aviso."
} else {
    Write-Host "No se hicieron cambios."
}
