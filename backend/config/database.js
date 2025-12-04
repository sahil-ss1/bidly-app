import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Get database configuration
const getDbConfig = () => {
  // If DATABASE_URL is provided, use it (Render, Heroku, etc.)
  if (process.env.DATABASE_URL) {
    console.log('📦 Using DATABASE_URL for connection');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
  
  // Otherwise use individual environment variables (local development)
  console.log('📦 Using individual DB env vars for connection');
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bidly_db',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

// Create connection pool
const pool = new Pool(getDbConfig());

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Test database connection
export const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL database connected successfully');
    console.log(`   Connected at: ${result.rows[0].now}`);
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    throw error;
  }
};

// Execute query helper - compatible with mysql2 style
export const query = async (sql, params = []) => {
  try {
    // Convert MySQL-style ? placeholders to PostgreSQL $1, $2, etc.
    let pgSql = sql;
    let paramIndex = 0;
    pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
    
    const result = await pool.query(pgSql, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('Query:', sql);
    throw error;
  }
};

// Get connection from pool
export const getConnection = async () => {
  return await pool.connect();
};

// For transactions
export const getClient = async () => {
  const client = await pool.connect();
  return {
    query: async (sql, params = []) => {
      let pgSql = sql;
      let paramIndex = 0;
      pgSql = pgSql.replace(/\?/g, () => `$${++paramIndex}`);
      const result = await client.query(pgSql, params);
      return result.rows;
    },
    release: () => client.release(),
    begin: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
  };
};

export default pool;
