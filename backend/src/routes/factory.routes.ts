import { Router } from 'express';
import { FactoryController } from '../controllers/factory.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public directory of factories (with filters by process, product, country)
router.get('/', FactoryController.listFactories);
router.get('/:id', FactoryController.getProfile);

// Update own factory profile
router.put('/me', requireAuth, requireRole('FACTORY', 'ADMIN'), FactoryController.updateProfile);

export default router;
