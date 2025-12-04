import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { processReferral } from './referralController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register new user
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, company_name, phone, trade, region, referral_code } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }
    
    if (!['gc', 'sub', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be gc, sub, or admin'
      });
    }
    
    // Check if email already exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a unique referral code for this user
    const namePrefix = (name || 'USER').substring(0, 3).toUpperCase();
    const randomSuffix = uuidv4().substring(0, 4).toUpperCase();
    const userReferralCode = `${namePrefix}${randomSuffix}`;
    
    // Create user with subcontractor-specific fields
    const result = await query(
      `INSERT INTO users (name, email, password, role, company_name, phone, trade, region, bidly_access, referral_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, name, email, role, company_name, phone, trade, region, subscription_tier, bidly_access, referral_code`,
      [
        name,
        email,
        hashedPassword,
        role,
        company_name || null,
        phone || null,
        role === 'sub' ? (trade || null) : null,
        role === 'sub' ? (region || null) : null,
        role === 'admin' ? true : false, // Admins get free access
        userReferralCode
      ]
    );
    
    const newUser = result;
    
    // Process referral if code was provided
    let referralResult = null;
    if (referral_code) {
      referralResult = await processReferral(referral_code, newUser[0].id, role);
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: newUser[0].id, role: newUser[0].role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      success: true,
      message: referralResult 
        ? `User registered successfully! Welcome bonus from referral applied.`
        : 'User registered successfully',
      data: {
        user: newUser[0],
        token,
        referral_bonus: referralResult?.reward || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Find user
    const users = await query(
      'SELECT id, name, email, password, role, company_name, phone, trade, region, subscription_tier, bidly_access FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    const user = users[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Remove password from response
    delete user.password;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getMe = async (req, res, next) => {
  try {
    const users = await query(
      'SELECT id, name, email, role, company_name, phone, trade, region, subscription_tier, guaranteed_invites_per_month, invites_received_this_month, bidly_access, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
};

// Verify invitation token
export const verifyInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const invitations = await query(
      `SELECT pi.*, p.title as project_title, p.description, p.location, p.bid_deadline,
              u.name as gc_name, u.company_name as gc_company
       FROM project_sub_invitations pi
       JOIN projects p ON pi.project_id = p.id
       JOIN users u ON pi.gc_id = u.id
       WHERE pi.invite_token = ? AND pi.status = 'pending'`,
      [token]
    );
    
    if (invitations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation token'
      });
    }
    
    res.json({
      success: true,
      data: invitations[0]
    });
  } catch (error) {
    next(error);
  }
};

