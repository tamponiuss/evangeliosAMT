#Requires -Version 5.1
# Quita el arranque automático de la API.
$ErrorActionPreference = 'Stop'
$taskName = 'EvangelioAPI-Puerto4000'
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction Stop
Write-Host "Tarea '$taskName' eliminada."
