$port = 8765
$root = $PSScriptRoot

Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Set-Location $root
Write-Host "Serving $root at http://localhost:$port/"
Write-Host "IPC page: http://localhost:$port/calculadora-ipc/"
py -m http.server $port
