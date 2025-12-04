import { query } from '../config/database.js';

// Get all users
export const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let sql = 'SELECT id, name, email, role, company_name, phone, trade, region, subscription_tier, guaranteed_invites_per_month, invites_received_this_month, bidly_access, created_at FROM users';
    const params = [];
    
    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const users = await query(sql, params);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// Toggle bidly access
export const toggleBidlyAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bidly_access } = req.body;
    
    if (typeof bidly_access !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'bidly_access must be a boolean'
      });
    }
    
    await query(
      'UPDATE users SET bidly_access = ?, updated_at = NOW() WHERE id = ?',
      [bidly_access, id]
    );
    
    const updatedUser = await query(
      'SELECT id, name, email, role, bidly_access FROM users WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: `Bidly access ${bidly_access ? 'granted' : 'revoked'}`,
      data: updatedUser[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get all projects
export const getProjects = async (req, res, next) => {
  try {
    const projects = await query(
      `SELECT p.*, u.name as gc_name, u.company_name as gc_company
       FROM projects p
       JOIN users u ON p.gc_id = u.id
       ORDER BY p.created_at DESC`
    );
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// Update subscription tier (for subs)
export const updateSubscriptionTier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subscription_tier } = req.body;
    
    const validTiers = ['free', 'standard', 'pro', 'elite'];
    if (!validTiers.includes(subscription_tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription tier. Must be one of: ' + validTiers.join(', ')
      });
    }
    
    // Set guaranteed invites based on tier
    const tierInvites = {
      'free': 3,
      'standard': 2,
      'pro': 5,
      'elite': 10
    };
    
    await query(
      'UPDATE users SET subscription_tier = ?, guaranteed_invites_per_month = ?, updated_at = NOW() WHERE id = ?',
      [subscription_tier, tierInvites[subscription_tier], id]
    );
    
    const updatedUser = await query(
      'SELECT id, name, email, role, subscription_tier, guaranteed_invites_per_month FROM users WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: `Subscription tier updated to ${subscription_tier}`,
      data: updatedUser[0]
    });
  } catch (error) {
    next(error);
  }
};

