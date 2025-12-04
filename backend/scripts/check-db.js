import { query, connectDB } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDatabase = async () => {
  let connection;
  
  try {
    console.log('🔍 Checking database connection...\n');
    
    await connectDB();
    console.log('✅ Database connection successful!\n');
    
    // Check if users table exists by trying to describe it
    let tableExists = false;
    try {
      await query('DESCRIBE users');
      tableExists = true;
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        tableExists = false;
      } else {
        throw error;
      }
    }
    
    if (!tableExists) {
      console.log('❌ Table "users" does not exist!');
      console.log('   Please run: Get-Content backend/database/schema.sql | mysql -u root -p bidly_db');
      process.exit(1);
    }
    
    console.log('✅ Table "users" exists\n');
    
    // Check table structure
    const columns = await query('DESCRIBE users');
    console.log('📊 Table structure:');
    console.log('   Columns:');
    columns.forEach(col => {
      const key = col.Key ? ` [${col.Key}]` : '';
      const nullInfo = col.Null === 'NO' ? ' NOT NULL' : '';
      console.log(`   - ${col.Field} (${col.Type}${nullInfo})${key}`);
    });
    
    // Check row count
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    const rowCount = countResult[0].count;
    
    console.log(`\n📈 Total records in users table: ${rowCount}`);
    
    if (rowCount > 0) {
      const sample = await query('SELECT * FROM users LIMIT 5');
      console.log('\n📝 Sample records:');
      sample.forEach(user => {
        console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
    console.log('\n✅ Database is ready!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Database check failed:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Authentication failed. Please check your DB_USER and DB_PASSWORD in .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused. Make sure MySQL is running.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`   Database "${process.env.DB_NAME || 'bidly_db'}" does not exist.`);
      console.error('   Please create it first: CREATE DATABASE bidly_db;');
    } else {
      console.error(`   ${error.message}`);
    }
    
    console.error('\n📋 Current configuration:');
    console.error(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`   DB_USER: ${process.env.DB_USER || 'root'}`);
    console.error(`   DB_NAME: ${process.env.DB_NAME || 'bidly_db'}`);
    console.error(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '(not set)'}`);
    
    process.exit(1);
  }
};

checkDatabase();

