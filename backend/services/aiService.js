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

// Compare multiple bids
export const compareBids = async (bidsData) => {
  if (!genAI) {
    throw new Error('Google Gemini AI is not configured. Please set GEMINI_API_KEY in .env');
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    let prompt = `Compare the following subcontractor bids for the same project. For each bid, we provide: name, price, duration, and key notes.\n\n`;
    
    bidsData.forEach((bid, index) => {
      prompt += `Bid ${index + 1}:\n`;
      prompt += `- Subcontractor: ${bid.sub_name || 'Unknown'}\n`;
      prompt += `- Price: ${bid.amount ? `$${bid.amount}` : 'Not specified'}\n`;
      prompt += `- Summary: ${bid.summary || 'No summary available'}\n\n`;
    });
    
    prompt += `Please create a comparison analysis:
1. Create a comparison table in text format
2. Highlight which bid is best for: lowest cost, fastest delivery, and best overall value
3. Mention potential risks or missing items
4. Provide a recommendation

Format the response clearly with sections.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
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

