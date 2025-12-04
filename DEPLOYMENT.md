# 🚀 Bidly Deployment Guide for Render

This guide explains how to deploy Bidly to Render.com with PostgreSQL database.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Database**: Render provides FREE PostgreSQL!

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd bidly
git init
git add .
git commit -m "Bidly - ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/bidly.git
git push -u origin main
```

---

### Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Configure:
   - **Name**: `bidly-db`
   - **Database**: `bidly_db`
   - **User**: (auto-generated)
   - **Region**: Choose nearest to your users
   - **Plan**: Free
4. Click **Create Database**
5. Wait for database to be created
6. Copy the **External Database URL** (starts with `postgres://...`)

---

### Step 3: Initialize Database Schema

1. In Render PostgreSQL dashboard, go to **Shell** or use any PostgreSQL client
2. Connect using the connection details provided
3. Copy and run the contents of `backend/database/schema.sql`

Or use psql locally:
```bash
psql "YOUR_EXTERNAL_DATABASE_URL" -f backend/database/schema.sql
```

---

### Step 4: Deploy Backend API

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `bidly-api` |
| **Region** | Same as database |
| **Branch** | `main` |
| **Root Directory** | Leave empty (or `bidly` if nested) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

4. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `DATABASE_URL` | (paste your PostgreSQL URL from Step 2) |
| `JWT_SECRET` | (generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `FRONTEND_URL` | `https://bidly-frontend.onrender.com` |
| `GEMINI_API_KEY` | (optional - for AI features) |

5. Click **Create Web Service**

Your API will be at: `https://bidly-api.onrender.com`

---

### Step 5: Deploy Frontend

1. Click **New** → **Static Site**
2. Connect same GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `bidly-frontend` |
| **Branch** | `main` |
| **Root Directory** | Leave empty (or `bidly` if nested) |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Add **Environment Variable**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://bidly-api.onrender.com` |

5. Add **Redirect/Rewrite Rule** (for React Router):
   - Go to **Redirects/Rewrites** tab
   - Add rule:
     - Source: `/*`
     - Destination: `/index.html`
     - Action: `Rewrite`

6. Click **Create Static Site**

Your frontend will be at: `https://bidly-frontend.onrender.com`

---

### Step 6: Create Admin User

Connect to your PostgreSQL database and run:

```sql
INSERT INTO users (name, email, password, role, bidly_access) 
VALUES (
  'Admin', 
  'admin@yourdomain.com', 
  '$2a$10$8K1p/a1p2s3d4f5g6h7j8k9l0zxcvbnmasdfghjklqwertyuiop',
  'admin', 
  TRUE
);
```

Note: Generate a proper bcrypt hash for the password, or register normally and update the role to 'admin'.

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check: `https://bidly-api.onrender.com/api/health`
- [ ] Frontend loads: `https://bidly-frontend.onrender.com`
- [ ] Can register new user
- [ ] Can login
- [ ] GC can create project
- [ ] Sub can view invitations
- [ ] Admin can manage users

---

## 🔄 Alternative: Blueprint Deployment (One-Click)

If you prefer automatic deployment:

1. Go to Render Dashboard
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create all services automatically
5. Add the manual environment variables (JWT_SECRET, GEMINI_API_KEY)

---

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check that URL starts with `postgres://` or `postgresql://`
- Ensure database is in same region as web service

### CORS Errors
- Verify `FRONTEND_URL` matches exactly
- Check browser console for specific errors

### 502/503 Errors
- Check `/api/health` endpoint
- Review logs in Render dashboard
- Free tier sleeps after 15 mins - first request may take 30s

### Build Failures
- Check Node version (needs >=18)
- Review build logs
- Ensure all dependencies in package.json

---

## 💰 Render Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Web Services | 750 hours/month, sleeps after 15 min inactivity |
| Static Sites | Unlimited |
| PostgreSQL | 1GB storage, 97 hours/month |

---

## 🔐 Security Notes

- JWT_SECRET should be unique and strong (64+ chars)
- DATABASE_URL contains credentials - never expose in logs
- Use HTTPS for all production URLs
- Set CORS to only allow your frontend domain
