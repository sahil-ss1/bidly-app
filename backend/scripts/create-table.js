import dotenv from 'dotenv';
import { query, connectDB } from '../config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createTable = async () => {
  let connection;
  
  try {
    console.log('🔧 Creating users table...\n');
    
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Read and execute schema file
    const schemaPath = join(__dirname, '../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Remove comments and split by semicolon
    const statements = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().startsWith('use '));
    
    console.log(`Executing ${statements.length} SQL statement(s)...\n`);
    
    for (const statement of statements) {
      if (statement) {
        try {
          await query(statement);
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        } catch (err) {
          // Ignore "table already exists" errors
          if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
            throw err;
          }
          console.log(`⚠️  Table already exists, skipping...`);
        }
      }
    }
    
    console.log('\n✅ Users table created successfully!\n');
    
    // Verify table was created
    const tables = await query('SHOW TABLES LIKE "users"');
    if (tables.length > 0) {
      const columns = await query('DESCRIBE users');
      console.log('📊 Table structure:');
      columns.forEach(col => {
        const key = col.Key ? ` [${col.Key}]` : '';
        console.log(`   - ${col.Field} (${col.Type})${key}`);
      });
      console.log('\n✅ Database is ready!');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error creating table:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Authentication failed. Please check your DB_USER and DB_PASSWORD in backend/.env');
      console.error('   Create backend/.env file with:');
      console.error('   DB_HOST=localhost');
      console.error('   DB_USER=root');
      console.error('   DB_PASSWORD=your_password');
      console.error('   DB_NAME=bidly_db');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused. Make sure MySQL is running.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`   Database "${process.env.DB_NAME || 'bidly_db'}" does not exist.`);
      console.error('   Please create it first: CREATE DATABASE bidly_db;');
    } else {
      console.error(`   ${error.message}`);
    }
    
    process.exit(1);
  }
};

createTable();

