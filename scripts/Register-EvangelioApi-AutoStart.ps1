#Requires -Version 5.1
# Ejecuta UNA VEZ (PowerShell): registra tarea al iniciar sesión para levantar la API en :4000.
# Requiere mismo usuario; no suele pedir administrador para "Al iniciar sesión".
$ErrorActionPreference = 'Stop'

$startScript = Join-Path $PSScriptRoot 'Start-Evangelio-API.ps1'
if (-not (Test-Path $startScript)) {
    Write-Error "Falta el script: $startScript"
}

$taskName = 'EvangelioAPI-Puerto4000'
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$arg = "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arg
$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description 'API evangelio web en http://127.0.0.1:4000 (npm run dev en server)' `
    | Out-Null

Write-Host "Listo: la tarea '$taskName' ejecutará la API al iniciar sesión."
Write-Host "Para probar ahora: Start-ScheduledTask -TaskName '$taskName'"
