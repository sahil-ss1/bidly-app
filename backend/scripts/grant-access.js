import dotenv from 'dotenv';
import { query, connectDB } from '../config/database.js';

dotenv.config();

async function grantAccess() {
  try {
    await connectDB();
    
    const args = process.argv.slice(2);
    const email = args[0];
    
    if (!email) {
      console.log('Usage: node backend/scripts/grant-access.js <email>');
      console.log('Example: node backend/scripts/grant-access.js user@example.com');
      process.exit(1);
    }
    
    // Check if user exists
    const users = await query('SELECT id, name, email, role, bidly_access FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current bidly_access: ${user.bidly_access}`);
    
    // Grant access
    await query('UPDATE users SET bidly_access = TRUE WHERE email = ?', [email]);
    
    console.log(`✅ Bidly access granted to ${user.name}!`);
    console.log(`\nUser can now:`);
    console.log('- View projects');
    console.log('- Create projects');
    console.log('- Upload plans');
    console.log('- Invite subcontractors');
    console.log('- View bids');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

grantAccess();

