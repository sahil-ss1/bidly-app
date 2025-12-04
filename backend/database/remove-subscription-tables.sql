-- Remove subscription/payment related tables from database
-- Run this script to clean up any Stripe/subscription related database structures

USE bidly_db;

-- Drop subscriptions table if it exists
DROP TABLE IF EXISTS subscriptions;

-- Drop any other payment-related tables
DROP TABLE IF EXISTS stripe_subscriptions;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payment_history;

-- Note: The users table has bidly_access column which is NOT subscription-related
-- This is just a boolean flag for access management via Pali Builds dashboard
-- Keep this column as it's needed for access control

-- Verify tables removed
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'bidly_db' 
AND (TABLE_NAME LIKE '%subscription%' OR TABLE_NAME LIKE '%stripe%' OR TABLE_NAME LIKE '%payment%');
