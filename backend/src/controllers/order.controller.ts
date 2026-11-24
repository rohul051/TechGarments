import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { ApiError } from '../middlewares/error.middleware.js';

export class OrderController {
  static async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user?.uid;
      if (!buyerId) throw ApiError.unauthorized();

      const newOrder = await OrderService.createOrder({
        ...req.body,
        buyerId,
        buyerName: req.body.buyerName || 'Valued Buyer',
        currency: req.body.currency || 'USD',
        status: 'PENDING_QUOTE',
        specifications: req.body.specifications || {},
      });

      res.status(201).json({
        success: true,
        message: 'Order / RFQ created successfully in Firestore',
        data: newOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id);
      if (!order) throw ApiError.notFound('Order not found');

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const uid = req.user?.uid;
      const role = req.user?.role;
      if (!uid) throw ApiError.unauthorized();

      let orders;
      if (role === 'FACTORY') {
        orders = await OrderService.getOrdersByFactory(uid);
      } else {
        orders = await OrderService.getOrdersByBuyer(uid);
      }

      res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) throw ApiError.badRequest('Missing status field');

      await OrderService.updateOrderStatus(id, status);
      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listPublicRfqs(req: Request, res: Response, next: NextFunction) {
    try {
      const rfqs = await OrderService.listPublicRfqs();
      res.status(200).json({ success: true, count: rfqs.length, data: rfqs });
    } catch (error) {
      next(error);
    }
  }
}
