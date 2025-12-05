import { query } from '../config/database.js';

// Tier priority order (higher = better)
const TIER_PRIORITY = {
  'enterprise': 4,
  'pro': 3,
  'starter': 2,
  'free': 1
};

// Get all users (with optional role filter and trade filter)
export const getUsers = async (req, res, next) => {
  try {
    const { role, trade, region } = req.query;
    let sql = `SELECT id, name, email, role, company_name, phone, trade, region, 
               subscription_tier, guaranteed_invites_per_month, invites_received_this_month,
               bidly_access, created_at FROM users`;
    const params = [];
    const conditions = [];
    
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    
    if (trade) {
      conditions.push('trade = ?');
      params.push(trade);
    }
    
    if (region) {
      conditions.push('region LIKE ?');
      params.push(`%${region}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sort by subscription tier (priority access for paid tiers), then by name
    sql += ` ORDER BY 
      CASE subscription_tier 
        WHEN 'enterprise' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'starter' THEN 3 
        ELSE 4 
      END ASC, 
      name ASC`;
    
    const users = await query(sql, params);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const users = await query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: users[0] });
  } catch (error) {
    next(error);
  }
};

// Create new user
export const createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required' 
      });
    }
    
    const newUser = await query(
      'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *',
      [name, email]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'User created successfully',
      data: newUser[0] 
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    next(error);
  }
};

// Update user
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, company_name, phone, trade, region } = req.body;
    
    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    await query(
      `UPDATE users SET 
        name = ?, 
        email = ?, 
        company_name = ?,
        phone = ?,
        trade = ?,
        region = ?,
        updated_at = NOW() 
       WHERE id = ?`,
      [
        name || existingUser[0].name, 
        email || existingUser[0].email,
        company_name !== undefined ? company_name : existingUser[0].company_name,
        phone !== undefined ? phone : existingUser[0].phone,
        trade !== undefined ? trade : existingUser[0].trade,
        region !== undefined ? region : existingUser[0].region,
        id
      ]
    );
    
    const updatedUser = await query(
      `SELECT id, name, email, role, company_name, phone, trade, region, 
              subscription_tier, bidly_access, created_at FROM users WHERE id = ?`,
      [id]
    );
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedUser[0] 
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    next(error);
  }
};

// Update own profile (authenticated user)
export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, email, company_name, phone, trade, region } = req.body;
    
    // Get current user
    const existingUser = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    await query(
      `UPDATE users SET 
        name = ?, 
        email = ?, 
        company_name = ?,
        phone = ?,
        trade = ?,
        region = ?,
        updated_at = NOW() 
       WHERE id = ?`,
      [
        name || existingUser[0].name, 
        email || existingUser[0].email,
        company_name !== undefined ? company_name : existingUser[0].company_name,
        phone !== undefined ? phone : existingUser[0].phone,
        trade !== undefined ? trade : existingUser[0].trade,
        region !== undefined ? region : existingUser[0].region,
        userId
      ]
    );
    
    const updatedUser = await query(
      `SELECT id, name, email, role, company_name, phone, trade, region, 
              subscription_tier, guaranteed_invites_per_month, invites_received_this_month,
              bidly_access, created_at FROM users WHERE id = ?`,
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedUser[0] 
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    next(error);
  }
};

// Delete user
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existingUser = await query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    await query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

