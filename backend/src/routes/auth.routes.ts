import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Register new user (stores in Firestore)
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

// Sync user profile in Firestore after Firebase Auth login/signup
router.post('/sync', AuthController.syncUser);

// Get current user profile from Firestore
router.get('/me', requireAuth, AuthController.getMe);

export default router;
