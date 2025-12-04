import pdfParse from 'pdf-parse';

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Extract emails from uploaded file
export const extractEmails = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    let text = '';

    // Extract text based on file type
    const fileType = file.mimetype;
    const fileName = file.originalname.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Parse PDF
      try {
        const pdfData = await pdfParse(file.buffer);
        text = pdfData.text;
      } catch (pdfError) {
        return res.status(400).json({
          success: false,
          error: 'Failed to parse PDF file'
        });
      }
    } else if (
      fileType === 'text/plain' || 
      fileName.endsWith('.txt') || 
      fileName.endsWith('.csv')
    ) {
      // Plain text or CSV
      text = file.buffer.toString('utf8');
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      // For DOC/DOCX, we'll try to extract as plain text (basic approach)
      // In production, you might want to use a library like mammoth.js
      text = file.buffer.toString('utf8');
      
      // Try to clean up any binary content and keep readable text
      text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
    } else {
      // Try to read as text anyway
      text = file.buffer.toString('utf8');
    }

    // Extract all email addresses using regex
    const matches = text.match(EMAIL_REGEX) || [];
    
    // Remove duplicates and clean up
    const uniqueEmails = [...new Set(matches)]
      .map(email => email.toLowerCase().trim())
      .filter(email => {
        // Filter out common false positives
        if (email.includes('example.com')) return false;
        if (email.includes('your-email')) return false;
        if (email.includes('email@')) return false;
        if (email.length < 5) return false;
        return true;
      })
      .sort();

    res.json({
      success: true,
      data: {
        filename: file.originalname,
        emails: uniqueEmails,
        count: uniqueEmails.length
      }
    });
  } catch (error) {
    next(error);
  }
};

