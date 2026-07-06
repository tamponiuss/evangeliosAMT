# Crea el keystore de release para Google Play (ejecutar una sola vez).
# Guarda las contraseñas en un lugar seguro: sin ellas no podrás actualizar la app.

$ErrorActionPreference = "Stop"
$androidDir = Join-Path $PSScriptRoot ".." "EvangelioMobile" "android" | Resolve-Path
$jks = Join-Path $androidDir "evangelio-release-key.jks"
$keyProps = Join-Path $androidDir "key.properties"
$keytool = $null
if ($env:JAVA_HOME) {
    $candidate = Join-Path $env:JAVA_HOME "bin\keytool.exe"
    if (Test-Path $candidate) { $keytool = $candidate }
}
if (-not $keytool) {
    $candidate = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
    if (Test-Path $candidate) { $keytool = $candidate }
}
if (-not (Test-Path $keytool)) {
    Write-Error "No se encontró keytool. Instala Android Studio o define JAVA_HOME."
}

if (Test-Path $jks) {
    Write-Host "Ya existe: $jks"
    exit 0
}

$pass = Read-Host "Contraseña del keystore (mín. 6 caracteres, guárdala bien)"
if ($pass.Length -lt 6) {
    Write-Error "La contraseña debe tener al menos 6 caracteres."
}

$dname = "CN=Evangelio AMT, OU=Mobile, O=Tamponi, L=Bogota, ST=Cundinamarca, C=CO"
& $keytool -genkey -v `
    -keystore $jks `
    -alias evangelio `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $pass `
    -keypass $pass `
    -dname $dname

@"
storePassword=$pass
keyPassword=$pass
keyAlias=evangelio
storeFile=evangelio-release-key.jks
"@ | Set-Content -Path $keyProps -Encoding Ascii

Write-Host "Listo:"
Write-Host "  Keystore: $jks"
Write-Host "  Config:   $keyProps"
Write-Host "Guarda la contraseña; la necesitarás para cada actualización en Play Store."
