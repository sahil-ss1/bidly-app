import dotenv from 'dotenv';
import { query } from '../config/database.js';

dotenv.config();

async function addSubOnboardingFields() {
  try {
    console.log('🔧 Adding subcontractor onboarding fields to users table...\n');

    // Check if columns exist and add them if they don't
    const alterQueries = [
      // California license fields
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS ca_licensed VARCHAR(10) NULL`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS ca_license_number VARCHAR(100) NULL`,
      
      // Help needed fields
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS need_entity_help VARCHAR(10) NULL`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS need_insurance_help VARCHAR(10) NULL`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS need_licensing_help VARCHAR(10) NULL`,
      
      // Insurance fields
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(255) NULL`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS has_general_liability VARCHAR(10) NULL`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS general_liability_amount VARCHAR(100) NULL`,
    ];

    for (const sql of alterQueries) {
      try {
        await query(sql);
        console.log(`✅ Executed: ${sql.substring(0, 60)}...`);
      } catch (error) {
        // PostgreSQL uses different error codes
        if (error.code === '42701' || error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Column already exists: ${sql.substring(0, 60)}...`);
        } else {
          console.error(`❌ Error executing: ${sql}`);
          console.error(`   Error: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addSubOnboardingFields();

