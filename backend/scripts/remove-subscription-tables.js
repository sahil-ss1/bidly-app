import dotenv from 'dotenv';
import { connectDB, query } from '../config/database.js';

dotenv.config();

async function removeSubscriptionTables() {
  try {
    console.log('🔧 Removing subscription/payment related tables...\n');
    
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Check if subscriptions table exists
    const dbName = process.env.DB_NAME || 'bidly_db';
    const tables = await query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND (TABLE_NAME LIKE '%subscription%' OR TABLE_NAME LIKE '%stripe%' OR TABLE_NAME LIKE '%payment%')
    `, [dbName]);
    
    if (tables.length > 0) {
      console.log(`Found ${tables.length} subscription-related table(s):`);
      tables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
      console.log('');
    }
    
    // Drop subscriptions table if it exists
    try {
      await query('DROP TABLE IF EXISTS subscriptions');
      console.log('✅ Dropped subscriptions table (if it existed)');
    } catch (err) {
      if (err.code !== 'ER_BAD_TABLE_ERROR') {
        throw err;
      }
      console.log('ℹ️  subscriptions table does not exist');
    }
    
    // Drop any other payment-related tables
    const paymentTables = ['stripe_subscriptions', 'payments', 'payment_history'];
    for (const tableName of paymentTables) {
      try {
        await query(`DROP TABLE IF EXISTS ${tableName}`);
        console.log(`✅ Dropped ${tableName} table (if it existed)`);
      } catch (err) {
        // Ignore if table doesn't exist
      }
    }
    
    // Verify removal
    const remainingTables = await query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND (TABLE_NAME LIKE '%subscription%' OR TABLE_NAME LIKE '%stripe%' OR TABLE_NAME LIKE '%payment%')
    `, [dbName]);
    
    if (remainingTables.length === 0) {
      console.log('\n✅ All subscription/payment tables removed successfully!');
    } else {
      console.log('\n⚠️  Some tables still exist:');
      remainingTables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
    }
    
    console.log('\n✅ Database cleanup complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error removing tables:');
    console.error(error.message);
    process.exit(1);
  }
}

removeSubscriptionTables();

