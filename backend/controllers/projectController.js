import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Get all projects for GC
export const getGCProjects = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM projects WHERE gc_id = ?';
    const params = [req.user.id];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const projects = await query(sql, params);
    
    // Get counts for each project
    for (const project of projects) {
      const invitations = await query(
        'SELECT COUNT(*) as count FROM project_sub_invitations WHERE project_id = ?',
        [project.id]
      );
      const bids = await query(
        'SELECT COUNT(*) as count FROM bids WHERE project_id = ?',
        [project.id]
      );
      
      project.invitations_count = invitations[0]?.count || 0;
      project.bids_count = bids[0]?.count || 0;
    }
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// Get single project with details
export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const projects = await query(
      'SELECT * FROM projects WHERE id = ? AND gc_id = ?',
      [id, req.user.id]
    );
    
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const project = projects[0];
    
    // Get plan files
    const planFiles = await query(
      'SELECT * FROM project_plan_files WHERE project_id = ?',
      [id]
    );
    project.plan_files = planFiles;
    
    // Get AI plan summary if exists
    if (project.ai_plan_summary_id) {
      const summaries = await query(
        'SELECT * FROM ai_summaries WHERE id = ?',
        [project.ai_plan_summary_id]
      );
      project.ai_plan_summary = summaries[0] || null;
    }
    
    // Get invitations
    const invitations = await query(
      `SELECT pi.*, u.name as sub_name, u.email as sub_email, u.company_name as sub_company
       FROM project_sub_invitations pi
       LEFT JOIN users u ON pi.sub_id = u.id
       WHERE pi.project_id = ?
       ORDER BY pi.created_at DESC`,
      [id]
    );
    project.invitations = invitations;
    
    // Get bids
    const bids = await query(
      `SELECT b.*, u.name as sub_name, u.company_name as sub_company, u.email as sub_email,
              ai.summary_text as ai_summary, ai.meta as ai_meta
       FROM bids b
       JOIN users u ON b.sub_id = u.id
       LEFT JOIN ai_summaries ai ON b.ai_summary_id = ai.id
       WHERE b.project_id = ?
       ORDER BY b.created_at DESC`,
      [id]
    );
    project.bids = bids;
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// Create new project
export const createProject = async (req, res, next) => {
  try {
    const { title, description, location, bid_deadline } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Project title is required'
      });
    }
    
    const result = await query(
      `INSERT INTO projects (gc_id, title, description, location, bid_deadline, status)
       VALUES (?, ?, ?, ?, ?, 'draft')
       RETURNING *`,
      [
        req.user.id,
        title,
        description || null,
        location || null,
        bid_deadline || null
      ]
    );
    
    const newProject = result;
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update project
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, location, bid_deadline, status } = req.body;
    
    // Verify ownership
    const projects = await query('SELECT * FROM projects WHERE id = ? AND gc_id = ?', [id, req.user.id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    await query(
      `UPDATE projects 
       SET title = ?, description = ?, location = ?, bid_deadline = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title || projects[0].title,
        description !== undefined ? description : projects[0].description,
        location !== undefined ? location : projects[0].location,
        bid_deadline || projects[0].bid_deadline,
        status || projects[0].status,
        id
      ]
    );
    
    const updatedProject = await query('SELECT * FROM projects WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject[0]
    });
  } catch (error) {
    next(error);
  }
};

// Delete project
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const projects = await query('SELECT * FROM projects WHERE id = ? AND gc_id = ?', [id, req.user.id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Delete related data (cascade should handle this, but being explicit)
    await query('DELETE FROM bids WHERE project_id = ?', [id]);
    await query('DELETE FROM project_sub_invitations WHERE project_id = ?', [id]);
    await query('DELETE FROM project_plan_files WHERE project_id = ?', [id]);
    await query('DELETE FROM projects WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Invite subcontractor
export const inviteSubcontractor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { invite_email, sub_id } = req.body;
    
    if (!invite_email && !sub_id) {
      return res.status(400).json({
        success: false,
        error: 'Either invite_email or sub_id is required'
      });
    }
    
    // Verify project ownership
    const projects = await query('SELECT * FROM projects WHERE id = ? AND gc_id = ?', [id, req.user.id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Find the subcontractor to link and track their invite count
    let actualSubId = sub_id;
    let subUser = null;
    
    if (invite_email) {
      const subs = await query("SELECT * FROM users WHERE email = ? AND role = 'sub'", [invite_email]);
      if (subs.length > 0) {
        subUser = subs[0];
        actualSubId = subUser.id;
      }
    } else if (sub_id) {
      const subs = await query("SELECT * FROM users WHERE id = ? AND role = 'sub'", [sub_id]);
      if (subs.length > 0) {
        subUser = subs[0];
      }
    }
    
    const inviteToken = uuidv4();
    
    await query(
      `INSERT INTO project_sub_invitations (project_id, gc_id, sub_id, invite_email, invite_token, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        id,
        req.user.id,
        actualSubId || null,
        invite_email || (subUser ? subUser.email : null),
        inviteToken
      ]
    );
    
    // Increment the sub's monthly invite counter (Guaranteed Bid System)
    if (actualSubId) {
      await query(
        `UPDATE users 
         SET invites_received_this_month = COALESCE(invites_received_this_month, 0) + 1 
         WHERE id = ?`,
        [actualSubId]
      );
    }
    
    // Get updated sub info if exists
    let guaranteeInfo = null;
    if (subUser) {
      const updatedSub = await query(
        'SELECT invites_received_this_month, guaranteed_invites_per_month, subscription_tier FROM users WHERE id = ?',
        [actualSubId]
      );
      if (updatedSub.length > 0) {
        guaranteeInfo = {
          invites_received: updatedSub[0].invites_received_this_month,
          guaranteed: updatedSub[0].guaranteed_invites_per_month,
          tier: updatedSub[0].subscription_tier
        };
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invite_token: inviteToken,
        invite_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/bid/${id}/${inviteToken}`,
        sub_guarantee_info: guaranteeInfo
      }
    });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({
        success: false,
        error: 'Invitation already sent to this email'
      });
    }
    next(error);
  }
};

// Get projects for subcontractor
export const getSubProjects = async (req, res, next) => {
  try {
    const projects = await query(
      `SELECT DISTINCT p.*, pi.status as invitation_status, pi.invite_token, u.name as gc_name, u.company_name as gc_company
       FROM projects p
       JOIN project_sub_invitations pi ON p.id = pi.project_id
       JOIN users u ON p.gc_id = u.id
       WHERE pi.sub_id = ? OR pi.invite_email = ?
       ORDER BY p.created_at DESC`,
      [req.user.id, req.user.email]
    );
    
    // Get my_bid for each project
    for (const project of projects) {
      const bids = await query(
        'SELECT * FROM bids WHERE project_id = ? AND sub_id = ?',
        [project.id, req.user.id]
      );
      project.my_bid = bids[0] || null;
    }
    
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// Accept or decline invitation (sub)
export const respondToInvitation = async (req, res, next) => {
  try {
    const { id } = req.params; // project_id
    const { response } = req.body; // 'accepted' or 'declined'
    
    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Response must be "accepted" or "declined"'
      });
    }
    
    // Find the invitation
    const invitations = await query(
      'SELECT * FROM project_sub_invitations WHERE project_id = ? AND (sub_id = ? OR invite_email = ?)',
      [id, req.user.id, req.user.email]
    );
    
    if (invitations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }
    
    const invitation = invitations[0];
    
    // Can't change response after submitting bid
    if (response === 'declined') {
      const existingBids = await query(
        'SELECT * FROM bids WHERE project_id = ? AND sub_id = ?',
        [id, req.user.id]
      );
      if (existingBids.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot decline invitation after submitting a bid'
        });
      }
    }
    
    // Update invitation
    await query(
      `UPDATE project_sub_invitations 
       SET status = ?, responded_at = NOW(), sub_id = ? 
       WHERE id = ?`,
      [response, req.user.id, invitation.id]
    );
    
    res.json({
      success: true,
      message: `Invitation ${response} successfully`,
      data: { status: response }
    });
  } catch (error) {
    next(error);
  }
};

// Get project details for subcontractor
export const getSubProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if sub has access to this project
    const invitations = await query(
      'SELECT * FROM project_sub_invitations WHERE project_id = ? AND (sub_id = ? OR invite_email = ?)',
      [id, req.user.id, req.user.email]
    );
    
    if (invitations.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this project'
      });
    }
    
    // Track that invitation was viewed (if first time)
    const invitation = invitations[0];
    if (invitation.status === 'pending' && !invitation.viewed_at) {
      await query(
        `UPDATE project_sub_invitations 
         SET status = 'viewed', viewed_at = NOW(), sub_id = ? 
         WHERE id = ?`,
        [req.user.id, invitation.id]
      );
    }
    
    const projects = await query('SELECT * FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const project = projects[0];
    project.invitation_status = invitation.status;
    
    // Get plan files
    const planFiles = await query(
      'SELECT * FROM project_plan_files WHERE project_id = ?',
      [id]
    );
    project.plan_files = planFiles;
    
    // Get AI plan summary
    if (project.ai_plan_summary_id) {
      const summaries = await query(
        'SELECT * FROM ai_summaries WHERE id = ?',
        [project.ai_plan_summary_id]
      );
      project.ai_plan_summary = summaries[0] || null;
    }
    
    // Get user's bid if exists
    const bids = await query(
      `SELECT b.*, ai.summary_text as ai_summary, ai.meta as ai_meta
       FROM bids b
       LEFT JOIN ai_summaries ai ON b.ai_summary_id = ai.id
       WHERE b.project_id = ? AND b.sub_id = ?`,
      [id, req.user.id]
    );
    project.my_bid = bids[0] || null;
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

