import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addBidEngineFields() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bidly_db',
  });

  console.log('🔧 Adding Bid Request Engine fields...\n');

  const alterQueries = [
    // Projects table - add trades_needed and guaranteed_min_bids
    `ALTER TABLE projects ADD COLUMN IF NOT EXISTS trades_needed JSON NULL AFTER location`,
    `ALTER TABLE projects ADD COLUMN IF NOT EXISTS guaranteed_min_bids INT DEFAULT 3 AFTER bid_deadline`,
    
    // Invitations table - update status enum to include 'viewed'
    `ALTER TABLE project_sub_invitations MODIFY COLUMN status ENUM('pending', 'viewed', 'accepted', 'declined', 'expired') DEFAULT 'pending'`,
    `ALTER TABLE project_sub_invitations ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP NULL AFTER status`,
    `ALTER TABLE project_sub_invitations ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP NULL AFTER viewed_at`,
  ];

  for (const query of alterQueries) {
    try {
      await connection.execute(query);
      console.log(`✅ Executed: ${query.substring(0, 70)}...`);
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_BAD_FIELD_ERROR') {
        console.log(`⚠️  Already exists or N/A: ${query.substring(0, 50)}...`);
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    }
  }

  // Set default guaranteed_min_bids for existing projects
  await connection.execute('UPDATE projects SET guaranteed_min_bids = 3 WHERE guaranteed_min_bids IS NULL');
  console.log('\n✅ Set default guaranteed_min_bids = 3 for existing projects');

  console.log('\n✅ Bid Request Engine fields added!');

  // Show invitation statuses
  const [invites] = await connection.execute(`
    SELECT 
      status,
      COUNT(*) as count 
    FROM project_sub_invitations 
    GROUP BY status
  `);
  
  console.log('\n📊 Current invitation status distribution:');
  invites.forEach(inv => {
    console.log(`   ${inv.status}: ${inv.count}`);
  });

  await connection.end();
}

addBidEngineFields().catch(console.error);

