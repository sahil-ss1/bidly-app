# Debug: Projects Not Showing on Dashboard

## Problem
Projects exist in database but not showing on dashboard.

## Common Causes

### 1. Bidly Access Not Granted
The API requires `bidly_access = true` to view projects.

**Check:**
```sql
SELECT id, name, email, role, bidly_access FROM users WHERE role = 'gc';
```

**Fix:**
```sql
-- Grant access to specific user
UPDATE users SET bidly_access = TRUE WHERE email = 'your-email@example.com';

-- Or grant to all GCs
UPDATE users SET bidly_access = TRUE WHERE role = 'gc';
```

### 2. Check Projects in Database
```sql
SELECT * FROM projects WHERE gc_id = (SELECT id FROM users WHERE email = 'your-email@example.com');
```

### 3. Check Browser Console
Open browser DevTools (F12) → Console tab
Look for errors like:
- "Bidly access required"
- "Failed to load projects"
- Network errors

### 4. Check API Response
In browser DevTools → Network tab:
- Find request to `/api/projects/gc`
- Check Status code (should be 200, not 403)
- Check Response body

### 5. Verify Token
Check if JWT token is valid:
```javascript
// In browser console
localStorage.getItem('token')
```

## Quick Fix Script

Run this SQL to grant access:
```sql
-- Replace with your email
UPDATE users SET bidly_access = TRUE WHERE email = 'your-email@example.com';
```

Then refresh the dashboard page.

## Testing Steps

1. **Check Database:**
   ```sql
   SELECT COUNT(*) FROM projects;
   SELECT * FROM users WHERE role = 'gc';
   ```

2. **Check Access:**
   ```sql
   SELECT id, email, bidly_access FROM users WHERE role = 'gc';
   ```

3. **Grant Access:**
   ```sql
   UPDATE users SET bidly_access = TRUE WHERE id = YOUR_USER_ID;
   ```

4. **Refresh Dashboard:**
   - Hard refresh: Ctrl+F5
   - Or click Refresh button

5. **Check Console:**
   - Open DevTools (F12)
   - Check for errors
   - Check Network tab for API calls

## Admin Dashboard Fix

1. Login as admin: `/admin/dashboard`
2. Find your GC user
3. Click "Grant Access"
4. Refresh GC dashboard

