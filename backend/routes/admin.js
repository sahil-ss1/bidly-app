import express from 'express';
import { getUsers, toggleBidlyAccess, getProjects, updateSubscriptionTier } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require admin role
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/users', getUsers);
router.put('/users/:id/bidly-access', toggleBidlyAccess);
router.put('/users/:id/subscription-tier', updateSubscriptionTier);
router.get('/projects', getProjects);

export default router;

