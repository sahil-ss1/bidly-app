import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addSubFields() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bidly_db',
  });

  console.log('🔧 Adding subcontractor fields to users table...\n');

  const alterQueries = [
    // Add trade column
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS trade VARCHAR(100) NULL AFTER phone`,
    // Add region column
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(255) NULL AFTER trade`,
    // Add subscription_tier column
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier ENUM('free', 'starter', 'pro', 'enterprise') DEFAULT 'free' AFTER region`,
    // Add guaranteed_invites_per_month column
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS guaranteed_invites_per_month INT DEFAULT 0 AFTER subscription_tier`,
    // Add invites_received_this_month column
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS invites_received_this_month INT DEFAULT 0 AFTER guaranteed_invites_per_month`,
    // Add indexes
    `ALTER TABLE users ADD INDEX IF NOT EXISTS idx_trade (trade)`,
    `ALTER TABLE users ADD INDEX IF NOT EXISTS idx_region (region)`,
  ];

  for (const query of alterQueries) {
    try {
      await connection.execute(query);
      console.log(`✅ Executed: ${query.substring(0, 60)}...`);
    } catch (error) {
      // Ignore errors for columns/indexes that already exist
      if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
        console.log(`⚠️  Already exists: ${query.substring(0, 60)}...`);
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    }
  }

  // Update subscription tiers with guaranteed invites
  const tierUpdates = [
    { tier: 'free', invites: 5 },
    { tier: 'starter', invites: 20 },
    { tier: 'pro', invites: 50 },
    { tier: 'enterprise', invites: 999 },
  ];

  console.log('\n📊 Setting guaranteed invite counts by tier...');
  for (const { tier, invites } of tierUpdates) {
    await connection.execute(
      'UPDATE users SET guaranteed_invites_per_month = ? WHERE subscription_tier = ? AND role = "sub"',
      [invites, tier]
    );
    console.log(`   ${tier}: ${invites} invites/month`);
  }

  console.log('\n✅ Migration complete!');
  
  // Show updated structure
  const [columns] = await connection.execute('DESCRIBE users');
  console.log('\n📋 Updated users table structure:');
  columns.forEach(col => {
    console.log(`   - ${col.Field} (${col.Type})${col.Key ? ' [' + col.Key + ']' : ''}`);
  });

  await connection.end();
}

addSubFields().catch(console.error);

