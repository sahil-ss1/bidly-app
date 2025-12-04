# Remove Subscription Tables from Database

## Quick Method

Run this command:
```bash
npm run remove-subscription-tables
```

## Manual Method

### Option 1: Using SQL Script
```bash
mysql -u root -p bidly_db < backend/database/remove-subscription-tables.sql
```

### Option 2: Direct SQL Commands
```sql
USE bidly_db;

DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS stripe_subscriptions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payment_history;
```

### Option 3: PowerShell
```powershell
Get-Content backend/database/remove-subscription-tables.sql | mysql -u root -p bidly_db
```

## Verify Removal

Check if tables are removed:
```sql
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'bidly_db' 
AND (TABLE_NAME LIKE '%subscription%' OR TABLE_NAME LIKE '%stripe%' OR TABLE_NAME LIKE '%payment%');
```

Should return 0 rows.

## Note

The `bidly_access` column in the `users` table is **NOT** subscription-related.
- It's just a boolean flag for access management
- Managed by Pali Builds dashboard
- Keep this column - it's needed for access control

## What Gets Removed

- `subscriptions` table (if exists)
- `stripe_subscriptions` table (if exists)
- `payments` table (if exists)
- `payment_history` table (if exists)

## What Stays

- `users` table (with `bidly_access` column)
- All other core tables (projects, bids, etc.)

