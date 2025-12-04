import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import projectRoutes from './projects.js';
import bidRoutes from './bids.js';
import adminRoutes from './admin.js';
import referralRoutes from './referrals.js';
import utilsRoutes from './utils.js';

const router = express.Router();

// Route handlers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/bids', bidRoutes);
router.use('/admin', adminRoutes);
router.use('/referrals', referralRoutes);
router.use('/utils', utilsRoutes);

export default router;

