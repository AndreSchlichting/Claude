# Trading Decision Lab - laedt portable Node.js herunter (einmalig)
# Wird von Start.bat aufgerufen, wenn kein Node.js gefunden wurde.
$ErrorActionPreference = 'Stop'

$v    = 'v22.12.0'
$url  = "https://nodejs.org/dist/$v/node-$v-win-x64.zip"
$zip  = Join-Path $env:TEMP 'node-portable.zip'
$dest = Join-Path $PSScriptRoot 'runtime'

Write-Host "Lade Node.js $v (ca. 30 MB) ..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

$nodeDir = Join-Path $dest 'node'
if (Test-Path $nodeDir) { Remove-Item -Recurse -Force $nodeDir }

Write-Host "Entpacke ..."
Expand-Archive -Path $zip -DestinationPath $dest -Force
Rename-Item -Path (Join-Path $dest "node-$v-win-x64") -NewName 'node'
Remove-Item $zip

Write-Host "Portable Node.js eingerichtet unter: $nodeDir"
