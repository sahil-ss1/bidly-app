# PowerShell script to test API endpoints
# Usage: .\backend\scripts\test-api.ps1

$baseUrl = "http://localhost:5000"

Write-Host "🧪 Testing API Endpoints" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Test Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Health Check: " -NoNewline
    $response | ConvertTo-Json
} catch {
    Write-Host "   ❌ Health Check failed: $_" -ForegroundColor Red
    Write-Host "   Make sure the server is running: npm run server:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Testing GET /api/users..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Get -ErrorAction Stop
    Write-Host "   ✅ GET Users: " -NoNewline
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "   ❌ GET Users failed: $_" -ForegroundColor Red
}

Write-Host "`n3. Testing POST /api/users..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Test User"
        email = "test@example.com"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ POST User created: " -NoNewline
    $response | ConvertTo-Json -Depth 3
    
    $userId = $response.data.id
    Write-Host "`n4. Testing GET /api/users/$userId..." -ForegroundColor Yellow
    try {
        $getResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/$userId" -Method Get -ErrorAction Stop
        Write-Host "   ✅ GET User by ID: " -NoNewline
        $getResponse | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "   ❌ GET User by ID failed: $_" -ForegroundColor Red
    }
    
} catch {
    Write-Host "   ❌ POST User failed: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "   (Email already exists - this is expected if you run the test multiple times)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ API Testing Complete!" -ForegroundColor Green
Write-Host "`nYou can also test manually:" -ForegroundColor Cyan
Write-Host "  - Health: http://localhost:5000/health" -ForegroundColor White
Write-Host "  - Users: http://localhost:5000/api/users" -ForegroundColor White
Write-Host "`nOr use a tool like Postman, Insomnia, or your browser for GET requests." -ForegroundColor Cyan

