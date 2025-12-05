import { query } from '../config/database.js';

// Submit bid
export const submitBid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, notes, bid_file_url } = req.body;
    
    // Verify project access - allow pending, viewed, or accepted invitations (no need to accept first)
    const invitations = await query(
      "SELECT * FROM project_sub_invitations WHERE project_id = ? AND (sub_id = ? OR invite_email = ?) AND status IN ('pending', 'viewed', 'accepted')",
      [id, req.user.id, req.user.email]
    );
    
    if (invitations.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to bid on this project. Please ensure you have been invited.'
      });
    }
    
    // Check if bid already exists
    const existingBids = await query(
      'SELECT * FROM bids WHERE project_id = ? AND sub_id = ?',
      [id, req.user.id]
    );
    
    if (existingBids.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Bid already submitted for this project'
      });
    }
    
    const newBid = await query(
      `INSERT INTO bids (project_id, sub_id, bid_file_url, amount, notes, status)
       VALUES (?, ?, ?, ?, ?, 'submitted')
       RETURNING *`,
      [
        id,
        req.user.id,
        bid_file_url || null,
        amount || null,
        notes || null
      ]
    );
    
    // Update invitation status if needed
    await query(
      `UPDATE project_sub_invitations SET status = 'accepted', sub_id = ? WHERE project_id = ? AND (sub_id = ? OR invite_email = ?)`,
      [req.user.id, id, req.user.id, req.user.email]
    );
    
    // TODO: Trigger AI bid summary job here
    
    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: newBid[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update bid status (GC only)
export const updateBidStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['submitted', 'reviewed', 'shortlisted', 'rejected', 'awarded'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    // Get bid and verify project ownership
    const bids = await query(
      `SELECT b.* FROM bids b
       JOIN projects p ON b.project_id = p.id
       WHERE b.id = ? AND p.gc_id = ?`,
      [id, req.user.id]
    );
    
    if (bids.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bid not found'
      });
    }
    
    await query(
      'UPDATE bids SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    // If awarded, update project status
    if (status === 'awarded') {
      await query(
        "UPDATE projects SET status = 'awarded', updated_at = NOW() WHERE id = ?",
        [bids[0].project_id]
      );
    }
    
    const updatedBid = await query('SELECT * FROM bids WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Bid status updated successfully',
      data: updatedBid[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get all bids for a project (GC only)
export const getProjectBids = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verify project ownership
    const projects = await query('SELECT * FROM projects WHERE id = ? AND gc_id = ?', [id, req.user.id]);
    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
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
    
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    next(error);
  }
};

