# Script PowerShell pour démarrer le serveur backend
Write-Host "Démarrage du serveur FastAPI..." -ForegroundColor Green
Set-Location -Path (Split-Path $MyInvocation.MyCommand.Path)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
