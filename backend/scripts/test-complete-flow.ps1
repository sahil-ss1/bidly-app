# Complete Flow Test Script
# Tests the full GC and Sub workflow

$baseUrl = "http://localhost:5000"
$gcToken = $null
$subToken = $null
$projectId = $null

Write-Host "🧪 Testing Complete Bidly Flow" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

# Step 1: Register GC
Write-Host "1. Registering GC..." -ForegroundColor Yellow
try {
    $gcBody = @{
        name = "Test GC"
        email = "gc-test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
        password = "password123"
        role = "gc"
        company_name = "Test Construction Co"
    } | ConvertTo-Json
    
    $gcResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $gcBody -ContentType "application/json" -ErrorAction Stop
    $gcToken = $gcResponse.data.token
    Write-Host "   ✅ GC registered: $($gcResponse.data.user.email)" -ForegroundColor Green
    Write-Host "   Token: $($gcToken.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Grant bidly_access to GC
Write-Host "`n2. Granting bidly_access to GC..." -ForegroundColor Yellow
Write-Host "   ⚠️  Note: In production, this happens via Pali Builds dashboard" -ForegroundColor Yellow
Write-Host "   For testing, you need to manually run:" -ForegroundColor Yellow
Write-Host "   UPDATE users SET bidly_access = TRUE WHERE email = '$($gcResponse.data.user.email)';" -ForegroundColor Cyan
Write-Host "   Press Enter after updating database..." -ForegroundColor Yellow
Read-Host

# Step 3: Register Sub
Write-Host "`n3. Registering Sub..." -ForegroundColor Yellow
try {
    $subBody = @{
        name = "Test Sub"
        email = "sub-test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
        password = "password123"
        role = "sub"
    } | ConvertTo-Json
    
    $subResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $subBody -ContentType "application/json" -ErrorAction Stop
    $subToken = $subResponse.data.token
    Write-Host "   ✅ Sub registered: $($subResponse.data.user.email)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    exit 1
}

# Step 4: GC Creates Project
Write-Host "`n4. GC creating project..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $gcToken" }
    $projectBody = @{
        title = "Test Project $(Get-Date -Format 'HHmmss')"
        description = "Test project description"
        location = "Test Location"
        bid_deadline = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ssZ")
    } | ConvertTo-Json
    
    $projectResponse = Invoke-RestMethod -Uri "$baseUrl/api/projects/gc" -Method Post -Body $projectBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
    $projectId = $projectResponse.data.id
    Write-Host "   ✅ Project created: $($projectResponse.data.title) (ID: $projectId)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   Make sure bidly_access is set to TRUE for GC" -ForegroundColor Yellow
    }
    exit 1
}

# Step 5: GC Invites Sub
Write-Host "`n5. GC inviting Sub..." -ForegroundColor Yellow
try {
    $inviteBody = @{
        invite_email = $subResponse.data.user.email
    } | ConvertTo-Json
    
    $inviteResponse = Invoke-RestMethod -Uri "$baseUrl/api/projects/gc/$projectId/invite" -Method Post -Body $inviteBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ Invitation created" -ForegroundColor Green
    Write-Host "   Invite URL: $($inviteResponse.data.invite_url)" -ForegroundColor Cyan
    $inviteToken = $inviteResponse.data.invite_token
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Sub Views Invited Projects
Write-Host "`n6. Sub viewing invited projects..." -ForegroundColor Yellow
try {
    $subHeaders = @{ Authorization = "Bearer $subToken" }
    $subProjects = Invoke-RestMethod -Uri "$baseUrl/api/projects/sub" -Method Get -Headers $subHeaders -ErrorAction Stop
    Write-Host "   ✅ Found $($subProjects.data.Count) invited project(s)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Sub may need to accept invitation first" -ForegroundColor Yellow
}

# Step 7: Sub Views Project Details
Write-Host "`n7. Sub viewing project details..." -ForegroundColor Yellow
try {
    $projectDetails = Invoke-RestMethod -Uri "$baseUrl/api/projects/sub/$projectId" -Method Get -Headers $subHeaders -ErrorAction Stop
    Write-Host "   ✅ Project details retrieved" -ForegroundColor Green
    Write-Host "   Title: $($projectDetails.data.title)" -ForegroundColor Cyan
    Write-Host "   Location: $($projectDetails.data.location)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Step 8: Sub Submits Bid (without file for now)
Write-Host "`n8. Sub submitting bid..." -ForegroundColor Yellow
try {
    $bidBody = @{
        amount = 50000.00
        notes = "Test bid submission"
    } | ConvertTo-Json
    
    $bidResponse = Invoke-RestMethod -Uri "$baseUrl/api/bids/project/$projectId" -Method Post -Body $bidBody -ContentType "application/json" -Headers $subHeaders -ErrorAction Stop
    Write-Host "   ✅ Bid submitted successfully (ID: $($bidResponse.data.id))" -ForegroundColor Green
    Write-Host "   Amount: `$$($bidResponse.data.amount)" -ForegroundColor Cyan
} catch {
    Write-Host "   ⚠️  Bid submission failed (may need to accept invitation first): $_" -ForegroundColor Yellow
}

# Step 9: GC Views Bids
Write-Host "`n9. GC viewing bids for project..." -ForegroundColor Yellow
try {
    $bids = Invoke-RestMethod -Uri "$baseUrl/api/bids/project/$projectId" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ Found $($bids.data.Count) bid(s)" -ForegroundColor Green
    if ($bids.data.Count -gt 0) {
        foreach ($bid in $bids.data) {
            Write-Host "   - Bid ID: $($bid.id), Amount: `$$($bid.amount), Status: $($bid.status)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "   ❌ Failed: $_" -ForegroundColor Red
}

# Step 10: GC Updates Bid Status
if ($bids.data.Count -gt 0) {
    Write-Host "`n10. GC updating bid status..." -ForegroundColor Yellow
    try {
        $bidId = $bids.data[0].id
        $statusBody = @{ status = "shortlisted" } | ConvertTo-Json
        $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/bids/$bidId/status" -Method Put -Body $statusBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
        Write-Host "   ✅ Bid status updated to: $($statusResponse.data.status)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    }
}

Write-Host "`n✅ Complete flow test finished!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  - GC: $($gcResponse.data.user.email)" -ForegroundColor White
Write-Host "  - Sub: $($subResponse.data.user.email)" -ForegroundColor White
Write-Host "  - Project ID: $projectId" -ForegroundColor White
Write-Host "  - Invite Token: $inviteToken" -ForegroundColor White

