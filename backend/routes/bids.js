import express from 'express';
import {
  submitBid,
  updateBidStatus,
  getProjectBids
} from '../controllers/bidController.js';
import { uploadBidFile } from '../controllers/fileController.js';
import { authenticate, requireRole, requireBidlyAccess } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Sub routes
router.post('/project/:id', authenticate, requireRole('sub'), submitBid);
router.post('/project/:id/upload', authenticate, requireRole('sub'), upload.single('file'), uploadBidFile);

// GC routes
router.get('/project/:id', authenticate, requireRole('gc'), requireBidlyAccess, getProjectBids);
router.put('/:id/status', authenticate, requireRole('gc'), requireBidlyAccess, updateBidStatus);

export default router;

