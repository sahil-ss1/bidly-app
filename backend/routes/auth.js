import express from 'express';
import { register, login, getMe, verifyInvitation } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/invitation/:token', verifyInvitation);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;

