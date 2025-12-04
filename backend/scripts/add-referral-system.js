import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

/**
 * Migration: Add Referral System (Growth Flywheel)
 * 
 * This script:
 * 1. Adds referral_code and referral_count to users table
 * 2. Creates referrals table for tracking
 * 3. Generates unique referral codes for existing users
 */

async function addReferralSystem() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bidly_db',
  });

  console.log('🔧 Setting up Referral System (Growth Flywheel)...\n');

  try {
    // 1. Add referral columns to users table
    console.log('📋 Adding referral columns to users table...');
    
    const userColumns = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INT NULL`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INT DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_rewards INT DEFAULT 0`,
    ];

    for (const query of userColumns) {
      try {
        await connection.execute(query);
        console.log(`   ✅ ${query.substring(0, 60)}...`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`   ⚠️  Column already exists`);
        } else {
          console.log(`   ❌ ${err.message}`);
        }
      }
    }

    // 2. Create referrals table
    console.log('\n📋 Creating referrals table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_id INT NOT NULL,
        referred_id INT NULL,
        referred_email VARCHAR(255) NOT NULL,
        referral_code VARCHAR(50) NOT NULL,
        status ENUM('pending', 'registered', 'activated', 'rewarded') DEFAULT 'pending',
        reward_type VARCHAR(50) NULL,
        reward_amount INT NULL,
        referred_role ENUM('gc', 'sub') NULL,
        registered_at TIMESTAMP NULL,
        activated_at TIMESTAMP NULL,
        rewarded_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_referrer (referrer_id),
        INDEX idx_referral_code (referral_code),
        INDEX idx_referred_email (referred_email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ Referrals table created');

    // 3. Generate referral codes for existing users
    console.log('\n📋 Generating referral codes for existing users...');
    
    const [users] = await connection.execute(
      'SELECT id, name FROM users WHERE referral_code IS NULL'
    );

    for (const user of users) {
      // Generate a short, memorable code: first 3 letters of name + random 4 chars
      const namePrefix = (user.name || 'user').substring(0, 3).toUpperCase();
      const randomSuffix = uuidv4().substring(0, 4).toUpperCase();
      const code = `${namePrefix}${randomSuffix}`;
      
      await connection.execute(
        'UPDATE users SET referral_code = ? WHERE id = ?',
        [code, user.id]
      );
      console.log(`   ✅ ${user.name}: ${code}`);
    }

    // 4. Show summary
    console.log('\n📊 Referral System Summary:');
    console.log('─'.repeat(50));
    
    const [stats] = await connection.execute(`
      SELECT 
        role,
        COUNT(*) as total_users,
        SUM(referral_count) as total_referrals
      FROM users 
      GROUP BY role
    `);
    
    stats.forEach(stat => {
      console.log(`   ${stat.role.toUpperCase()}: ${stat.total_users} users, ${stat.total_referrals || 0} referrals`);
    });

    // Reward tiers info
    console.log('\n💰 Referral Reward Tiers:');
    console.log('─'.repeat(50));
    console.log('   GC invites Sub → +5 extra guaranteed bids/month');
    console.log('   Sub invites GC → +2 extra guaranteed invites/month');
    console.log('   3+ referrals   → Unlock "Network Builder" badge');
    console.log('   10+ referrals  → Tier upgrade bonus');

    console.log('\n✅ Referral System setup complete!');

  } catch (error) {
    console.error('❌ Error setting up referral system:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addReferralSystem().catch(console.error);

