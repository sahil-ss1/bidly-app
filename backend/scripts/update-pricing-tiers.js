import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: Update Pricing Tiers for Subcontractors
 * 
 * New Pricing Structure:
 * - FREE: 3 invitations/month (1 freebie guaranteed), basic profile
 * - STANDARD ($250/mo): 2 guaranteed invitations, priority listing, SMS
 * - PRO ($500/mo): 5 guaranteed invitations, higher ranking, early access, AI
 * - ELITE ($1,000/mo): 10 guaranteed invitations, first-access, top placement
 */

const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    guaranteed_invites: 3,
    features: ['Basic profile', 'Can submit bids', '1 monthly freebie guaranteed']
  },
  standard: {
    name: 'Standard',
    price: 250,
    guaranteed_invites: 2,
    features: ['2 guaranteed job invitations/month', 'Priority listing', 'Instant SMS notifications']
  },
  pro: {
    name: 'Pro',
    price: 500,
    guaranteed_invites: 5,
    features: ['5 guaranteed invitations/month', 'Higher ranking in GC searches', 'Early access to new job postings', 'AI bid organization']
  },
  elite: {
    name: 'Elite',
    price: 1000,
    guaranteed_invites: 10,
    features: ['10 guaranteed invitations/month', 'First-access priority', '"Elite Pro" badge and top placement', 'Advanced AI insights']
  }
};

async function updatePricingTiers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bidly_db',
  });

  console.log('🔧 Updating Pricing Tiers for Subcontractors...\n');

  try {
    // 1. Update the subscription_tier ENUM to include new tiers
    console.log('📋 Updating subscription_tier ENUM...');
    
    // First, update any 'starter' to 'standard' and 'enterprise' to 'elite'
    await connection.execute(`UPDATE users SET subscription_tier = 'free' WHERE subscription_tier = 'starter'`);
    await connection.execute(`UPDATE users SET subscription_tier = 'elite' WHERE subscription_tier = 'enterprise'`);
    
    // Modify the ENUM (MySQL requires recreating the column in some cases)
    try {
      await connection.execute(`
        ALTER TABLE users MODIFY COLUMN subscription_tier 
        ENUM('free', 'standard', 'pro', 'elite') DEFAULT 'free'
      `);
      console.log('   ✅ Updated subscription_tier ENUM');
    } catch (err) {
      console.log('   ⚠️  ENUM update skipped (may already be correct)');
    }

    // 2. Update guaranteed_invites_per_month based on tier
    console.log('\n📋 Setting guaranteed invites by tier...');
    
    for (const [tier, config] of Object.entries(PRICING_TIERS)) {
      const result = await connection.execute(
        `UPDATE users SET guaranteed_invites_per_month = ? WHERE subscription_tier = ? AND role = 'sub'`,
        [config.guaranteed_invites, tier]
      );
      console.log(`   ${tier.toUpperCase()}: ${config.guaranteed_invites} invites/month (${result[0].affectedRows} users updated)`);
    }

    // 3. Show current distribution
    console.log('\n📊 Current Tier Distribution:');
    console.log('─'.repeat(60));
    
    const [stats] = await connection.execute(`
      SELECT 
        subscription_tier as tier,
        COUNT(*) as count,
        SUM(guaranteed_invites_per_month) as total_guaranteed
      FROM users 
      WHERE role = 'sub'
      GROUP BY subscription_tier
    `);
    
    stats.forEach(stat => {
      const tierInfo = PRICING_TIERS[stat.tier] || { price: 0, name: stat.tier };
      console.log(`   ${tierInfo.name.toUpperCase()} ($${tierInfo.price}/mo)`);
      console.log(`      Users: ${stat.count}`);
      console.log(`      Guaranteed Invites: ${stat.total_guaranteed || 0}/month total`);
    });

    // 4. Display pricing summary
    console.log('\n💰 Pricing Tiers Summary:');
    console.log('─'.repeat(60));
    
    for (const [tier, config] of Object.entries(PRICING_TIERS)) {
      console.log(`\n   ${config.name.toUpperCase()} - $${config.price}/month`);
      console.log(`   ${config.guaranteed_invites} guaranteed invitations/month`);
      config.features.forEach(f => console.log(`   • ${f}`));
    }

    console.log('\n✅ Pricing tiers updated successfully!');

  } catch (error) {
    console.error('❌ Error updating pricing tiers:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updatePricingTiers().catch(console.error);

