import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Public catalog
router.get('/', ProductController.listProducts);
router.get('/:id', ProductController.getProductById);

// Factory product management
router.post('/', requireAuth, requireRole('FACTORY', 'ADMIN'), ProductController.createProduct);
router.put('/:id', requireAuth, requireRole('FACTORY', 'ADMIN'), ProductController.updateProduct);
router.delete('/:id', requireAuth, requireRole('FACTORY', 'ADMIN'), ProductController.deleteProduct);

export default router;
