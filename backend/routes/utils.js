import express from 'express';
import multer from 'multer';
import { extractEmails } from '../controllers/utilsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const allowedExtensions = ['.pdf', '.txt', '.csv', '.doc', '.docx'];
    
    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExt = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (hasValidType || hasValidExt) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, DOC, DOCX, TXT, or CSV files.'), false);
    }
  }
});

// POST /api/utils/extract-emails - Extract emails from uploaded file
router.post('/extract-emails', authenticateToken, upload.single('file'), extractEmails);

export default router;

