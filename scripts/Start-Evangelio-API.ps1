#Requires -Version 5.1
# Arranca solo la API Node en el puerto 4000 (evangelio web/server).
# MongoDB debe estar disponible (servicio o proceso local); sin eso el servidor fallará al conectar.
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path $PSScriptRoot -Parent
$ServerDir = Join-Path $RepoRoot 'evangelio web\server'

if (-not (Test-Path (Join-Path $ServerDir 'package.json'))) {
    Write-Error "No se encontró el servidor en: $ServerDir"
}

try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.ReceiveTimeout = 800
    $client.SendTimeout = 800
    $client.Connect('127.0.0.1', 4000)
    $client.Close()
    exit 0
} catch {
    # Puerto libre: seguir e iniciar la API
}

Set-Location $ServerDir
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error 'npm no está en el PATH. Instala Node.js o añade npm al PATH del usuario.'
}

& npm run dev
