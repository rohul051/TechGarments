import { Router } from 'express';
import { BuyerController } from '../controllers/buyer.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public / Authenticated directory of buyers
router.get('/', BuyerController.listBuyers);
router.get('/:id', BuyerController.getProfile);

// Update own buyer profile
router.put('/me', requireAuth, requireRole('BUYER', 'ADMIN'), BuyerController.updateProfile);

export default router;
