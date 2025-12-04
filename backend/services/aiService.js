import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import dotenv from 'dotenv';
import { query } from '../config/database.js';

dotenv.config();

// Initialize Gemini AI only if API key is provided
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Extract text from PDF
export const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// Summarize plan PDF
export const summarizePlan = async (planText) => {
  if (!genAI) {
    throw new Error('Google Gemini AI is not configured. Please set GEMINI_API_KEY in .env');
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are an assistant helping subcontractors understand construction plans. 
Summarize the attached project plans in 10-12 bullet points. Highlight:
- Scope of work
- Materials mentioned
- Deadlines and timelines
- Key constraints or requirements
- Important specifications

Keep it clear and non-technical. Format as bullet points.

Project Plans:
${planText.substring(0, 30000)}`; // Limit text length
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`Failed to summarize plan: ${error.message}`);
  }
};

// Summarize bid PDF
export const summarizeBid = async (bidText) => {
  if (!genAI) {
    throw new Error('Google Gemini AI is not configured. Please set GEMINI_API_KEY in .env');
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Summarize this subcontractor bid for the General Contractor in 8-10 bullet points. Include:
- Approximate pricing (if mentioned)
- Duration/timeline
- Inclusions
- Exclusions
- Key assumptions or conditions

Keep it concise and actionable.

Bid Document:
${bidText.substring(0, 30000)}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Try to extract pricing and duration from the summary
    const summaryText = response.text();
    const priceMatch = summaryText.match(/\$[\d,]+(?:\.\d{2})?/g);
    const durationMatch = summaryText.match(/(\d+)\s*(?:weeks?|months?|days?)/i);
    
    const meta = {
      extracted_price: priceMatch ? priceMatch[0] : null,
      extracted_duration: durationMatch ? durationMatch[0] : null,
    };
    
    return {
      summary: summaryText,
      meta,
    };
  } catch (error) {
    throw new Error(`Failed to summarize bid: ${error.message}`);
  }
};

// Compare multiple bids - Uses existing data without external AI
export const compareBids = async (bidsData) => {
  try {
    // Filter bids with valid amounts
    const bidsWithAmounts = bidsData.filter(b => b.amount && parseFloat(b.amount) > 0);
    const bidsWithoutAmounts = bidsData.filter(b => !b.amount || parseFloat(b.amount) <= 0);
    
    // Sort by amount
    const sortedBids = [...bidsWithAmounts].sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    
    // Calculate statistics
    const amounts = bidsWithAmounts.map(b => parseFloat(b.amount));
    const lowestBid = sortedBids[0];
    const highestBid = sortedBids[sortedBids.length - 1];
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const priceRange = amounts.length > 0 ? Math.max(...amounts) - Math.min(...amounts) : 0;
    
    // Build comparison text
    let comparison = `═══════════════════════════════════════════════════════════════
                          BID COMPARISON ANALYSIS
═══════════════════════════════════════════════════════════════

📊 OVERVIEW
───────────────────────────────────────────────────────────────
• Total Bids Received: ${bidsData.length}
• Bids with Pricing: ${bidsWithAmounts.length}
• Bids without Pricing: ${bidsWithoutAmounts.length}
${amounts.length > 0 ? `• Price Range: $${Math.min(...amounts).toLocaleString()} - $${Math.max(...amounts).toLocaleString()}
• Average Bid: $${avgAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
• Spread: $${priceRange.toLocaleString()} (${avgAmount > 0 ? ((priceRange / avgAmount) * 100).toFixed(1) : 0}% variance)` : ''}

═══════════════════════════════════════════════════════════════
                          BID RANKING (by Price)
═══════════════════════════════════════════════════════════════
`;
    
    // Add ranked bids
    sortedBids.forEach((bid, index) => {
      const priceDiff = index > 0 ? parseFloat(bid.amount) - parseFloat(lowestBid.amount) : 0;
      const priceDiffPercent = parseFloat(lowestBid.amount) > 0 ? (priceDiff / parseFloat(lowestBid.amount) * 100).toFixed(1) : 0;
      
      comparison += `
${index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  '} #${index + 1}. ${bid.sub_name || 'Unknown'}${bid.sub_company ? ` (${bid.sub_company})` : ''}
   └─ Amount: $${parseFloat(bid.amount).toLocaleString()}${index > 0 ? ` (+$${priceDiff.toLocaleString()}, +${priceDiffPercent}% vs lowest)` : ' ← LOWEST BID'}
   └─ Notes: ${bid.summary ? bid.summary.substring(0, 100) + (bid.summary.length > 100 ? '...' : '') : 'No notes provided'}
`;
    });
    
    // Add bids without amounts
    if (bidsWithoutAmounts.length > 0) {
      comparison += `
───────────────────────────────────────────────────────────────
BIDS WITHOUT PRICING (Requires follow-up)
───────────────────────────────────────────────────────────────
`;
      bidsWithoutAmounts.forEach((bid) => {
        comparison += `
⚠️  ${bid.sub_name || 'Unknown'}${bid.sub_company ? ` (${bid.sub_company})` : ''}
   └─ Notes: ${bid.summary ? bid.summary.substring(0, 100) + (bid.summary.length > 100 ? '...' : '') : 'No notes provided'}
`;
      });
    }
    
    // Add recommendations
    comparison += `
═══════════════════════════════════════════════════════════════
                          RECOMMENDATIONS
═══════════════════════════════════════════════════════════════

💰 LOWEST COST: ${lowestBid ? `${lowestBid.sub_name || 'Unknown'} at $${parseFloat(lowestBid.amount).toLocaleString()}` : 'No pricing available'}

📈 COST ANALYSIS:
${amounts.length >= 2 ? `   • The lowest bid is ${avgAmount > 0 ? (((avgAmount - parseFloat(lowestBid.amount)) / avgAmount) * 100).toFixed(1) : 0}% below average
   • ${priceRange > avgAmount * 0.3 ? '⚠️ Large price variance - verify scope alignment' : '✓ Prices are reasonably aligned'}` : '   • Need more bids for meaningful analysis'}

📋 NEXT STEPS:
   1. Review scope coverage for each bid
   2. Verify inclusions/exclusions match your requirements
   3. Check contractor references and past work
   4. Confirm timelines align with project schedule
${bidsWithoutAmounts.length > 0 ? `   5. Follow up with ${bidsWithoutAmounts.length} contractor(s) for pricing` : ''}

═══════════════════════════════════════════════════════════════
Generated: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════`;
    
    return comparison;
  } catch (error) {
    throw new Error(`Failed to compare bids: ${error.message}`);
  }
};

// Save AI summary to database
export const saveAISummary = async (itemType, itemId, summaryText, meta = null) => {
  try {
    const result = await query(
      `INSERT INTO ai_summaries (item_type, item_id, summary_text, meta)
       VALUES (?, ?, ?, ?)
       RETURNING id`,
      [
        itemType,
        itemId,
        summaryText,
        meta ? JSON.stringify(meta) : null
      ]
    );
    
    return result[0].id;
  } catch (error) {
    throw new Error(`Failed to save AI summary: ${error.message}`);
  }
};

