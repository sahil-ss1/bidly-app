import { query } from '../config/database.js';
import { compareBids, saveAISummary } from '../services/aiService.js';

// Generate AI comparison for project bids
export const generateComparison = async (req, res, next) => {
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
    
    // Get all bids with their summaries
    const bids = await query(
      `SELECT b.*, u.name as sub_name, u.company_name as sub_company,
              ai.summary_text as summary, ai.meta as ai_meta
       FROM bids b
       JOIN users u ON b.sub_id = u.id
       LEFT JOIN ai_summaries ai ON b.ai_summary_id = ai.id
       WHERE b.project_id = ? AND b.status != 'rejected'
       ORDER BY b.created_at DESC`,
      [id]
    );
    
    if (bids.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 bids are required for comparison'
      });
    }
    
    // Prepare data for comparison
    const bidsData = bids.map(bid => ({
      sub_name: bid.sub_name,
      sub_company: bid.sub_company,
      amount: bid.amount,
      summary: bid.summary || 'No summary available',
      meta: bid.ai_meta ? JSON.parse(bid.ai_meta) : null
    }));
    
    // Generate comparison
    const comparisonText = await compareBids(bidsData);
    
    // Save comparison summary
    const summaryId = await saveAISummary('comparison', id, comparisonText);
    
    res.json({
      success: true,
      message: 'Comparison generated successfully',
      data: {
        summary_id: summaryId,
        comparison: comparisonText
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get AI comparison for a project
export const getComparison = async (req, res, next) => {
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
    
    const summaries = await query(
      'SELECT * FROM ai_summaries WHERE item_type = "comparison" AND item_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    
    if (summaries.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No comparison found. Generate one first.'
      });
    }
    
    res.json({
      success: true,
      data: summaries[0]
    });
  } catch (error) {
    next(error);
  }
};

