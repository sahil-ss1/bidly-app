import { uploadFile } from '../services/storageService.js';
import { query } from '../config/database.js';
import { summarizePlan, summarizeBid, extractTextFromPDF, saveAISummary } from '../services/aiService.js';

// Upload plan file
export const uploadPlanFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
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
    
    // Upload to GCS
    const uploadResult = await uploadFile(req.file, `projects/${id}/plans`);
    
    // Save to database
    const fileRecord = await query(
      `INSERT INTO project_plan_files (project_id, file_name, file_url, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [
        id,
        uploadResult.fileName,
        uploadResult.fileUrl,
        uploadResult.fileSize,
        uploadResult.mimeType
      ]
    );
    
    // Trigger AI summary if this is the first file or if summary doesn't exist
    if (!projects[0].ai_plan_summary_id) {
      try {
        // Extract text from PDF
        const pdfText = await extractTextFromPDF(req.file.buffer);
        
        // Generate summary
        const summaryText = await summarizePlan(pdfText);
        
        // Save summary
        const summaryId = await saveAISummary('plan', id, summaryText);
        
        // Link to project
        await query(
          'UPDATE projects SET ai_plan_summary_id = ? WHERE id = ?',
          [summaryId, id]
        );
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError);
        // Don't fail the upload if AI fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: fileRecord[0]
    });
  } catch (error) {
    next(error);
  }
};

// Upload bid file
export const uploadBidFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Verify project access - allow pending, viewed, or accepted invitations
    const invitations = await query(
      'SELECT * FROM project_sub_invitations WHERE project_id = ? AND (sub_id = ? OR invite_email = ?) AND status IN ("pending", "viewed", "accepted")',
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
    
    // Upload to GCS
    const uploadResult = await uploadFile(req.file, `projects/${id}/bids`);
    
    // Create bid record
    const bidResult = await query(
      `INSERT INTO bids (project_id, sub_id, bid_file_url, amount, notes, status)
       VALUES (?, ?, ?, ?, ?, 'submitted')
       RETURNING *`,
      [
        id,
        req.user.id,
        uploadResult.fileUrl,
        amount || null,
        notes || null
      ]
    );
    
    const newBid = bidResult[0];
    
    // Update invitation status
    await query(
      `UPDATE project_sub_invitations SET status = 'accepted', sub_id = ? WHERE project_id = ? AND (sub_id = ? OR invite_email = ?)`,
      [req.user.id, id, req.user.id, req.user.email]
    );
    
    // Trigger AI bid summary
    try {
      const pdfText = await extractTextFromPDF(req.file.buffer);
      const summaryResult = await summarizeBid(pdfText);
      const summaryId = await saveAISummary('bid', newBid.id, summaryResult.summary, summaryResult.meta);
      
      // Link to bid
      await query(
        'UPDATE bids SET ai_summary_id = ? WHERE id = ?',
        [summaryId, newBid.id]
      );
      
      // Update amount if extracted from AI
      if (summaryResult.meta.extracted_price) {
        const extractedAmount = parseFloat(summaryResult.meta.extracted_price.replace(/[^0-9.]/g, ''));
        if (!isNaN(extractedAmount)) {
          await query(
            'UPDATE bids SET amount = ? WHERE id = ?',
            [extractedAmount, newBid.id]
          );
        }
      }
    } catch (aiError) {
      console.error('AI bid summary generation failed:', aiError);
      // Don't fail the bid submission if AI fails
    }
    
    const bid = await query('SELECT * FROM bids WHERE id = ?', [newBid.id]);
    
    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: bid[0]
    });
  } catch (error) {
    next(error);
  }
};

