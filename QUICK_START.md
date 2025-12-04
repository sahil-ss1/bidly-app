# Bidly Quick Start Guide

## 🚀 Getting Started

### 1. Start Backend Server
```bash
npm run server:dev
```
Server runs on: `http://localhost:5000`

### 2. Start Frontend
```bash
npm run dev
```
Frontend runs on: `http://localhost:5173`

## 📍 Key URLs

### Landing Pages (Marketing)
- **GC Landing**: `http://localhost:5173/general-contractors`
- **Sub Landing**: `http://localhost:5173/subcontractors`

### User Pages
- **Register**: `http://localhost:5173/register`
- **Login**: `http://localhost:5173/login`
- **GC Dashboard**: `http://localhost:5173/gc/dashboard`
- **Sub Dashboard**: `http://localhost:5173/sub/dashboard`
- **Admin Dashboard**: `http://localhost:5173/admin/dashboard`

## 🔑 User Roles

### General Contractor (GC)
- Requires `bidly_access = true` (paid via Pali Builds)
- Can create projects, upload plans, invite subs, view bids
- Access: `/gc/dashboard`

### Subcontractor (Sub)
- Free to use
- Can receive invites, view projects, submit bids
- Access: `/sub/dashboard`

### Admin
- Can manage user access
- Toggle `bidly_access` for paid users
- Access: `/admin/dashboard`

## 🎯 Complete Workflow

### GC Flow
1. Register/Login as GC
2. Admin grants `bidly_access` (through Pali Builds dashboard)
3. Go to `/gc/dashboard`
4. Create project
5. Upload plan PDFs
6. Invite subcontractors (via email)
7. View submitted bids
8. Generate AI comparison

### Sub Flow
1. Register/Login as Sub
2. Receive invitation email with token
3. Click invitation link → Verify token
4. Go to `/sub/dashboard`
5. View invited projects
6. Upload bid PDF
7. Submit bid
8. Track bid status

## 🔧 Admin Tasks

### Grant Access
```bash
# Via API
PUT /api/admin/users/:id/bidly-access
Body: { "bidly_access": true }
```

Or use Admin Dashboard:
1. Login as admin
2. Go to `/admin/dashboard`
3. Find user
4. Click "Grant Access"

## 📧 Invitation Flow

1. GC creates project
2. GC invites sub via email
3. System generates invitation token
4. Sub receives email with link: `/invitation/:token`
5. Sub clicks link → Verifies token
6. Sub can now see project in dashboard

## 🤖 AI Features

### Plan Summaries
- Automatically generated when plan PDF uploaded
- Stored in `ai_summaries` table
- Accessible via project details

### Bid Summaries
- Generated when bid PDF uploaded
- Stored with bid record

### Bid Comparison
- Generated when multiple bids exist
- Compare all bids side-by-side
- Access via: `POST /api/projects/gc/:id/ai/comparison`

## 🗄️ Database Setup

### Create Database
```sql
CREATE DATABASE bidly_db;
```

### Run Schema
```bash
npm run create-table
```

### Check Database
```bash
npm run check-db
```

## 🔐 Environment Variables

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bidly_db
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Optional (for file uploads)
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_KEY_FILE=path/to/key.json

# Optional (for AI features)
GEMINI_API_KEY=your-gemini-api-key
```

## ✅ Testing Checklist

- [ ] GC can register and login
- [ ] Sub can register and login
- [ ] Admin can toggle access
- [ ] GC can create project (with access)
- [ ] GC can upload plan PDF
- [ ] GC can invite sub
- [ ] Sub can receive invite
- [ ] Sub can submit bid
- [ ] GC can view bids
- [ ] AI summaries generated
- [ ] Bid comparison works

## 🚢 Production Deployment

### Backend (Google Cloud Run)
1. Build Docker image
2. Deploy to Cloud Run
3. Set environment variables
4. Connect to Cloud SQL

### Frontend (Pali Builds Integration)
1. Build: `npm run build`
2. Integrate into Pali Builds dashboard
3. Add routes for landing pages
4. Connect Pali Builds dashboard to admin API for access management

## 📞 Support

For issues or questions:
- Check `MVP_IMPLEMENTATION_SUMMARY.md` for details
- Review API endpoints in backend routes
- Check database schema in `backend/database/schema.sql`

