# How to Create a New Project in Bidly

## Step-by-Step Guide

### Prerequisites
1. **You must be logged in as a GC (General Contractor)**
2. **You must have `bidly_access = true`** (granted by admin through Pali Builds dashboard)

### Steps to Create a Project

#### Option 1: If you have Bidly Access

1. **Go to GC Dashboard**
   - URL: `http://localhost:5173/gc/dashboard`
   - Or click "GC Dashboard" after login

2. **Click "Create New Project" button**
   - Located at the top right of the dashboard
   - Or click the button in the empty state message

3. **Fill out the form:**
   - **Project Title*** (Required): e.g., "Office Building Renovation"
   - **Description** (Optional): Project details
   - **Location** (Optional): Project address
   - **Bid Deadline** (Optional): When bids are due

4. **Click "Create Project"**
   - Project will be created and appear in your projects list

#### Option 2: If you DON'T have Bidly Access

You need to get access first:

1. **Check your access status:**
   - Look at the banner at the top: "Bidly Access Required"
   - Your `bidly_access` is currently `false`

2. **Get access (Admin must grant it):**
   
   **Via Admin Dashboard:**
   - Admin logs in at `/admin/dashboard`
   - Finds your user
   - Clicks "Grant Access"
   
   **Via API (for Pali Builds integration):**
   ```bash
   PUT /api/admin/users/:id/bidly-access
   Body: { "bidly_access": true }
   ```

3. **Refresh the page**
   - After admin grants access, refresh your dashboard
   - The "Create New Project" button will appear

### Quick Test (For Development)

If you want to test without Pali Builds integration, you can manually grant yourself access:

1. **Login as Admin** (or create admin user)
2. **Go to Admin Dashboard**: `/admin/dashboard`
3. **Find your GC user**
4. **Click "Grant Access"**

Or use SQL directly:
```sql
UPDATE users SET bidly_access = TRUE WHERE email = 'your-email@example.com';
```

### Troubleshooting

**Problem: "Create New Project" button not showing**
- ✅ Check if you're logged in as GC (not Sub)
- ✅ Check if `bidly_access = true` in database
- ✅ Refresh the page after getting access

**Problem: "Bidly access required" error**
- ✅ Admin needs to grant access via Admin Dashboard
- ✅ Or update database: `UPDATE users SET bidly_access = TRUE WHERE id = ?`

**Problem: Form not submitting**
- ✅ Check browser console for errors
- ✅ Make sure backend server is running (`npm run server:dev`)
- ✅ Check network tab for API errors

### After Creating a Project

Once you create a project, you can:
1. **Upload Plan PDFs**: Click on project → Upload plans
2. **Invite Subcontractors**: Click on project → Invite subs
3. **View Bids**: Click on project → See submitted bids
4. **Generate AI Comparison**: When multiple bids exist

### Example Project Data

```json
{
  "title": "Office Building Renovation",
  "description": "Complete renovation of 3-story office building including HVAC, electrical, and plumbing updates",
  "location": "123 Main St, City, State 12345",
  "bid_deadline": "2025-02-15T17:00:00"
}
```

