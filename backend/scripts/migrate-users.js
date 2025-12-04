import { query, connectDB } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateUsers = async () => {
  try {
    await connectDB();
    
    console.log('🔄 Migrating users table...\n');
    
    // Check if columns exist
    const columns = await query('DESCRIBE users');
    const columnNames = columns.map(col => col.Field);
    
    // Add password column if it doesn't exist
    if (!columnNames.includes('password')) {
      console.log('Adding password column...');
      await query('ALTER TABLE users ADD COLUMN password VARCHAR(255) AFTER email');
    }
    
    // Add role column if it doesn't exist
    if (!columnNames.includes('role')) {
      console.log('Adding role column...');
      await query("ALTER TABLE users ADD COLUMN role ENUM('gc', 'sub', 'admin') DEFAULT 'sub' AFTER password");
    }
    
    // Add company_name column if it doesn't exist
    if (!columnNames.includes('company_name')) {
      console.log('Adding company_name column...');
      await query('ALTER TABLE users ADD COLUMN company_name VARCHAR(255) NULL AFTER role');
    }
    
    // Add phone column if it doesn't exist
    if (!columnNames.includes('phone')) {
      console.log('Adding phone column...');
      await query('ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER company_name');
    }
    
    // Add bidly_access column if it doesn't exist
    if (!columnNames.includes('bidly_access')) {
      console.log('Adding bidly_access column...');
      await query('ALTER TABLE users ADD COLUMN bidly_access BOOLEAN DEFAULT FALSE AFTER phone');
    }
    
    // Add email_verified_at column if it doesn't exist
    if (!columnNames.includes('email_verified_at')) {
      console.log('Adding email_verified_at column...');
      await query('ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP NULL AFTER bidly_access');
    }
    
    // Add index on role if it doesn't exist
    try {
      await query('CREATE INDEX idx_role ON users(role)');
      console.log('Added index on role column');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') {
        throw err;
      }
      console.log('Index on role already exists');
    }
    
    // Update existing users without password (set placeholder - they'll need to reset)
    const usersWithoutPassword = await query('SELECT id FROM users WHERE password IS NULL OR password = ""');
    if (usersWithoutPassword.length > 0) {
      console.log(`\n⚠️  Found ${usersWithoutPassword.length} users without passwords.`);
      console.log('   These users will need to reset their passwords.');
    }
    
    console.log('\n✅ Users table migration completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrateUsers();

