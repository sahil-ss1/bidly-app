import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Monthly Invite Counter Reset Script
 * 
 * Run this script at the start of each month (via cron job or scheduled task)
 * to reset the invites_received_this_month counter for all subcontractors.
 * 
 * Example cron (first day of month at midnight):
 * 0 0 1 * * node backend/scripts/reset-monthly-invites.js
 */

async function resetMonthlyInvites() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bidly_db',
  });

  console.log('🔄 Resetting monthly invite counters...\n');

  try {
    // Get current stats before reset
    const [beforeStats] = await connection.execute(`
      SELECT 
        subscription_tier,
        COUNT(*) as user_count,
        SUM(invites_received_this_month) as total_invites_received,
        AVG(invites_received_this_month) as avg_invites,
        MAX(invites_received_this_month) as max_invites
      FROM users 
      WHERE role = 'sub'
      GROUP BY subscription_tier
      ORDER BY 
        CASE subscription_tier 
          WHEN 'enterprise' THEN 1 
          WHEN 'pro' THEN 2 
          WHEN 'starter' THEN 3 
          ELSE 4 
        END
    `);

    console.log('📊 Stats before reset:');
    console.log('─'.repeat(60));
    beforeStats.forEach(stat => {
      console.log(`  ${stat.subscription_tier.toUpperCase()}`);
      console.log(`    Users: ${stat.user_count}`);
      console.log(`    Total Invites: ${stat.total_invites_received || 0}`);
      console.log(`    Avg Invites: ${(stat.avg_invites || 0).toFixed(1)}`);
      console.log(`    Max Invites: ${stat.max_invites || 0}`);
    });
    console.log('─'.repeat(60));

    // Reset all counters
    const [result] = await connection.execute(`
      UPDATE users 
      SET invites_received_this_month = 0 
      WHERE role = 'sub'
    `);

    console.log(`\n✅ Reset complete! ${result.affectedRows} subcontractor(s) updated.`);

    // Log the reset
    const now = new Date();
    console.log(`\n📅 Reset performed at: ${now.toISOString()}`);
    console.log(`   Month: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`);

  } catch (error) {
    console.error('❌ Error resetting monthly invites:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetMonthlyInvites().catch(console.error);

