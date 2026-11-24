import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Public RFQs board
router.get('/public', OrderController.listPublicRfqs);

// Orders for logged in user (buyer or factory)
router.get('/my', requireAuth, OrderController.getMyOrders);
router.post('/', requireAuth, OrderController.createOrder);
router.get('/:id', requireAuth, OrderController.getOrderById);
router.patch('/:id/status', requireAuth, OrderController.updateStatus);

export default router;
