# 🚀 How to Run and Test Bidly API URLs

## Quick Start

### Step 1: Start the Server

Open a terminal and run:
```bash
npm run server:dev
```

You should see:
```
✅ MySQL database connected successfully
🚀 Server running on http://localhost:5000
📊 Environment: development
```

**Keep this terminal open!**

### Step 2: Test URLs

#### Option A: Test in Browser (GET requests only)

Open these URLs in your browser:

1. **Health Check:**
   ```
   http://localhost:5000/health
   ```
   Should show: `{"status":"OK","message":"Server is running"}`

2. **Get Users:**
   ```
   http://localhost:5000/api/users
   ```
   (Returns list of users)

#### Option B: Test with PowerShell

**1. Health Check:**
```powershell
Invoke-RestMethod -Uri http://localhost:5000/health -Method Get
```

**2. Register a User:**
```powershell
$body = @{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
    role = "gc"
    company_name = "ABC Construction"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/auth/register -Method Post -Body $body -ContentType "application/json"
```

**3. Login:**
```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method Post -Body $body -ContentType "application/json"
$token = $response.data.token
```

**4. Get Current User (with token):**
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri http://localhost:5000/api/auth/me -Method Get -Headers $headers
```

**5. Create Project (GC needs bidly_access):**
```powershell
# First grant access in MySQL:
# UPDATE users SET bidly_access = TRUE WHERE email = 'john@example.com';

$headers = @{ Authorization = "Bearer $token" }
$body = @{
    title = "My First Project"
    description = "Test project"
    location = "Test Location"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/projects/gc -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

#### Option C: Use Test Scripts

**Basic API Test:**
```bash
npm run test-api
```

**Complete Flow Test (GC + Sub workflow):**
```bash
npm run test-flow
```

#### Option D: Use Postman/Insomnia

1. **Base URL:** `http://localhost:5000`

2. **Set up environment:**
   - `base_url`: `http://localhost:5000`
   - `token`: (set after login)

3. **Test flow:**
   - Register → Copy token
   - Set token in Authorization header: `Bearer {token}`
   - Test protected endpoints

## Common API Endpoints

### Public Endpoints (No Auth Required)

- `GET /health` - Health check
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/invitation/:token` - Verify invitation

### Protected Endpoints (Need Token)

**Authentication:**
- `GET /api/auth/me` - Get current user

**GC Endpoints (need bidly_access):**
- `GET /api/projects/gc` - List projects
- `POST /api/projects/gc` - Create project
- `GET /api/projects/gc/:id` - Get project details
- `POST /api/projects/gc/:id/invite` - Invite subcontractor
- `POST /api/projects/gc/:id/plans` - Upload plan PDF
- `GET /api/bids/project/:id` - Get bids
- `PUT /api/bids/:id/status` - Update bid status

**Sub Endpoints:**
- `GET /api/projects/sub` - List invited projects
- `GET /api/projects/sub/:id` - Get project details
- `POST /api/bids/project/:id` - Submit bid

## Quick Test Commands

```powershell
# 1. Start server (in one terminal)
npm run server:dev

# 2. Test health (in another terminal or browser)
Invoke-RestMethod -Uri http://localhost:5000/health

# 3. Register user
$body = @{name="Test";email="test@test.com";password="pass123";role="gc"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:5000/api/auth/register -Method Post -Body $body -ContentType "application/json"

# 4. Login and get token
$body = @{email="test@test.com";password="pass123"} | ConvertTo-Json
$r = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method Post -Body $body -ContentType "application/json"
$token = $r.data.token

# 5. Use token for authenticated requests
$h = @{Authorization="Bearer $token"}
Invoke-RestMethod -Uri http://localhost:5000/api/auth/me -Method Get -Headers $h
```

## Troubleshooting

**Server won't start:**
- Check MySQL is running
- Verify `.env` file has correct database credentials
- Check port 5000 is not in use

**"Authentication required":**
- Make sure you're including the token: `Authorization: Bearer <token>`
- Token expires after 7 days, login again

**"Bidly access required":**
- GC needs `bidly_access = TRUE`
- Run: `UPDATE users SET bidly_access = TRUE WHERE email = 'your@email.com';`

**"Route not found":**
- Make sure server is running on port 5000
- Check endpoint URL is correct

## Full API Documentation

See `backend/API_DOCUMENTATION.md` for complete API reference.

