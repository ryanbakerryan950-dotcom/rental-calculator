$port = 8765
$root = $PSScriptRoot

Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Set-Location $root
Write-Host "Serving $root at http://localhost:$port/"
Write-Host "IPC page: http://localhost:$port/calculadora-ipc/"
Write-Host "ICL API proxy: http://localhost:$port/api/icl?desde=2020-07-01&hasta=$(Get-Date -Format 'yyyy-MM-dd')"
py server.py $port
