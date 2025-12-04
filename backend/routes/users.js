import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, updateMyProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users - Get all users (with optional filters)
router.get('/', getUsers);

// PUT /api/users/me - Update own profile (authenticated)
router.put('/me', authenticate, updateMyProfile);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/users - Create new user
router.post('/', createUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

export default router;

