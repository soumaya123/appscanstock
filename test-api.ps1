# Script PowerShell pour tester l'API backend
Write-Host "Test de connexion à l'API backend..." -ForegroundColor Green

# Test 1: localhost
Write-Host "`nTest 1: localhost:8000" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000" -Method GET -TimeoutSec 5
    Write-Host "✅ localhost:8000 - OK" -ForegroundColor Green
} catch {
    Write-Host "❌ localhost:8000 - Échec: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: adresse IP locale
Write-Host "`nTest 2: 192.168.100.156:8000" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://192.168.100.156:8000" -Method GET -TimeoutSec 5
    Write-Host "✅ 192.168.100.156:8000 - OK" -ForegroundColor Green
} catch {
    Write-Host "❌ 192.168.100.156:8000 - Échec: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: API endpoint docs
Write-Host "`nTest 3: API docs" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/docs" -Method GET -TimeoutSec 5
    Write-Host "✅ API docs accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ API docs - Échec: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: API auth endpoint
Write-Host "`nTest 4: API auth endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1" -Method GET -TimeoutSec 5
    Write-Host "✅ API endpoint accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ API endpoint - Échec: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest terminé!" -ForegroundColor Green
