import express from 'express';
import {
  getGCProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  inviteSubcontractor,
  getSubProjects,
  getSubProject,
  respondToInvitation
} from '../controllers/projectController.js';
import { uploadPlanFile } from '../controllers/fileController.js';
import { generateComparison, getComparison } from '../controllers/aiController.js';
import { authenticate, requireRole, requireBidlyAccess } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// GC routes
router.get('/gc', authenticate, requireRole('gc'), requireBidlyAccess, getGCProjects);
router.get('/gc/:id', authenticate, requireRole('gc'), requireBidlyAccess, getProject);
router.post('/gc', authenticate, requireRole('gc'), requireBidlyAccess, createProject);
router.put('/gc/:id', authenticate, requireRole('gc'), requireBidlyAccess, updateProject);
router.delete('/gc/:id', authenticate, requireRole('gc'), requireBidlyAccess, deleteProject);
router.post('/gc/:id/invite', authenticate, requireRole('gc'), requireBidlyAccess, inviteSubcontractor);
router.post('/gc/:id/plans', authenticate, requireRole('gc'), requireBidlyAccess, upload.single('file'), uploadPlanFile);
router.post('/gc/:id/ai/comparison', authenticate, requireRole('gc'), requireBidlyAccess, generateComparison);
router.get('/gc/:id/ai/comparison', authenticate, requireRole('gc'), requireBidlyAccess, getComparison);

// Sub routes
router.get('/sub', authenticate, requireRole('sub'), getSubProjects);
router.get('/sub/:id', authenticate, requireRole('sub'), getSubProject);
router.post('/sub/:id/respond', authenticate, requireRole('sub'), respondToInvitation);

export default router;

