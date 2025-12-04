import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Reward constants
const REWARDS = {
  GC_INVITES_SUB: { type: 'extra_bids', amount: 5, description: '+5 guaranteed bids/month' },
  SUB_INVITES_GC: { type: 'extra_invites', amount: 2, description: '+2 guaranteed invites/month' },
  SUB_INVITES_SUB: { type: 'extra_invites', amount: 1, description: '+1 guaranteed invite/month' },
};

// Get user's referral stats
export const getReferralStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's referral code
    const users = await query(
      `SELECT referral_code, referral_count, referral_rewards, role FROM users WHERE id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const user = users[0];
    
    // Generate referral code if doesn't exist
    if (!user.referral_code) {
      const namePrefix = (req.user.name || 'USER').substring(0, 3).toUpperCase();
      const randomSuffix = uuidv4().substring(0, 4).toUpperCase();
      const code = `${namePrefix}${randomSuffix}`;
      
      await query('UPDATE users SET referral_code = ? WHERE id = ?', [code, userId]);
      user.referral_code = code;
    }
    
    // Get referral breakdown
    const referrals = await query(
      `SELECT 
        status, 
        referred_role,
        COUNT(*) as count 
       FROM referrals 
       WHERE referrer_id = ?
       GROUP BY status, referred_role`,
      [userId]
    );
    
    // Get recent referrals
    const recentReferrals = await query(
      `SELECT r.*, u.name as referred_name
       FROM referrals r
       LEFT JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    // Calculate rewards earned
    const rewardInfo = user.role === 'gc' ? REWARDS.GC_INVITES_SUB : REWARDS.SUB_INVITES_GC;
    
    res.json({
      success: true,
      data: {
        referral_code: user.referral_code,
        referral_link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${user.referral_code}`,
        total_referrals: user.referral_count || 0,
        total_rewards: user.referral_rewards || 0,
        reward_per_referral: rewardInfo,
        breakdown: referrals,
        recent_referrals: recentReferrals,
        milestones: {
          network_builder: user.referral_count >= 3,
          power_connector: user.referral_count >= 10,
          community_champion: user.referral_count >= 25
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Send referral invite
export const sendReferralInvite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email, target_role } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }
    
    // Check if email already exists as user
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'This person is already a Bidly user' 
      });
    }
    
    // Check if already invited by this user
    const existingInvites = await query(
      'SELECT id FROM referrals WHERE referrer_id = ? AND referred_email = ?',
      [userId, email]
    );
    if (existingInvites.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'You have already invited this email' 
      });
    }
    
    // Get referrer's referral code
    const users = await query('SELECT referral_code FROM users WHERE id = ?', [userId]);
    const referralCode = users[0]?.referral_code || uuidv4().substring(0, 8).toUpperCase();
    
    // Create referral record
    await query(
      `INSERT INTO referrals (referrer_id, referred_email, referral_code, referred_role, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [userId, email, referralCode, target_role || null]
    );
    
    // TODO: Send actual email here
    // For now, we just return the invite link
    
    res.status(201).json({
      success: true,
      message: 'Referral invite sent successfully',
      data: {
        email,
        referral_link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${referralCode}`,
        reward_on_signup: req.user.role === 'gc' ? REWARDS.GC_INVITES_SUB : REWARDS.SUB_INVITES_GC
      }
    });
  } catch (error) {
    next(error);
  }
};

// Process referral on registration (called during user registration)
export const processReferral = async (referralCode, newUserId, newUserRole) => {
  try {
    if (!referralCode) return null;
    
    // Find the referrer by code
    const referrers = await query(
      'SELECT id, role, referral_count, referral_rewards FROM users WHERE referral_code = ?',
      [referralCode]
    );
    
    if (referrers.length === 0) return null;
    
    const referrer = referrers[0];
    
    // Update referral record if exists
    await query(
      `UPDATE referrals 
       SET referred_id = ?, status = 'registered', registered_at = NOW(), referred_role = ?
       WHERE referral_code = ? AND status = 'pending'
       LIMIT 1`,
      [newUserId, newUserRole, referralCode]
    );
    
    // Link the new user to referrer
    await query(
      'UPDATE users SET referred_by = ? WHERE id = ?',
      [referrer.id, newUserId]
    );
    
    // Increment referrer's count
    await query(
      'UPDATE users SET referral_count = referral_count + 1 WHERE id = ?',
      [referrer.id]
    );
    
    // Apply rewards based on who invited whom
    let reward = null;
    if (referrer.role === 'gc' && newUserRole === 'sub') {
      // GC invited a Sub → GC gets more guaranteed bids
      reward = REWARDS.GC_INVITES_SUB;
      await query(
        'UPDATE users SET referral_rewards = referral_rewards + ? WHERE id = ?',
        [reward.amount, referrer.id]
      );
    } else if (referrer.role === 'sub' && newUserRole === 'gc') {
      // Sub invited a GC → Sub gets more guaranteed invites
      reward = REWARDS.SUB_INVITES_GC;
      await query(
        'UPDATE users SET guaranteed_invites_per_month = guaranteed_invites_per_month + ?, referral_rewards = referral_rewards + ? WHERE id = ?',
        [reward.amount, reward.amount, referrer.id]
      );
    } else if (referrer.role === 'sub' && newUserRole === 'sub') {
      // Sub invited a Sub → smaller reward
      reward = REWARDS.SUB_INVITES_SUB;
      await query(
        'UPDATE users SET guaranteed_invites_per_month = guaranteed_invites_per_month + ?, referral_rewards = referral_rewards + ? WHERE id = ?',
        [reward.amount, reward.amount, referrer.id]
      );
    }
    
    // Mark referral as activated
    await query(
      `UPDATE referrals 
       SET status = 'activated', activated_at = NOW(), reward_type = ?, reward_amount = ?
       WHERE referral_code = ? AND referred_id = ?`,
      [reward?.type || null, reward?.amount || 0, referralCode, newUserId]
    );
    
    return {
      referrer_id: referrer.id,
      reward
    };
  } catch (error) {
    console.error('Error processing referral:', error);
    return null;
  }
};

// Get leaderboard
export const getReferralLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await query(
      `SELECT 
        u.id, u.name, u.company_name, u.role, u.referral_count,
        u.referral_rewards
       FROM users u
       WHERE u.referral_count > 0
       ORDER BY u.referral_count DESC
       LIMIT 20`
    );
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};

