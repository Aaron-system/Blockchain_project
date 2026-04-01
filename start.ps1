# Blockchain App - Start All Servers
$root = $PSScriptRoot

Write-Host ""
Write-Host "  Starting Blockchain App..." -ForegroundColor Cyan
Write-Host ""

# Pre-build command strings so $root expands before being passed to child processes
$nodeCmd     = "conda activate blockchain; Set-Location `"$root\blockchain`"; python blockchain_test.py"
$clientCmd   = "conda activate blockchain; Set-Location `"$root\blockchain_client`"; python blockchain_client_test.py"
$frontendCmd = "Set-Location `"$root\frontend`"; npm run dev"

# 1. Blockchain Node (Flask :5001)
Write-Host "  [1/3] Blockchain Node   -> http://127.0.0.1:5001" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", $nodeCmd

Start-Sleep -Seconds 2

# 2. Wallet Client (Flask :8081)
Write-Host "  [2/3] Wallet Client     -> http://127.0.0.1:8081" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", $clientCmd

Start-Sleep -Seconds 2

# 3. Next.js Frontend (:3000)
Write-Host "  [3/3] Next.js Frontend  -> http://localhost:3000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

# Wait for Next.js to be ready then open browser
Write-Host ""
Write-Host "  Waiting for frontend to compile..." -ForegroundColor Yellow

$ready    = $false
$attempts = 0
while (-not $ready -and $attempts -lt 20) {
    Start-Sleep -Seconds 2
    $attempts++
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true }
    } catch { }
}

if ($ready) {
    Write-Host "  All servers ready!" -ForegroundColor Green
    Start-Process "http://localhost:3000"
} else {
    Write-Host "  Still compiling - open http://localhost:3000 manually when ready." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Close the three server windows to shut everything down." -ForegroundColor DarkGray
Write-Host ""
