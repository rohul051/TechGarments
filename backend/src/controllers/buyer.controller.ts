import { Request, Response, NextFunction } from 'express';
import { BuyerService } from '../services/buyer.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { ApiError } from '../middlewares/error.middleware.js';

export class BuyerController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const profile = await BuyerService.getProfile(id);
      if (!profile) throw ApiError.notFound('Buyer profile not found');

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const buyerId = req.user?.uid;
      if (!buyerId) throw ApiError.unauthorized();

      const updated = await BuyerService.createOrUpdateProfile({
        ...req.body,
        id: buyerId,
      });

      res.status(200).json({
        success: true,
        message: 'Buyer profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listBuyers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const buyers = await BuyerService.listBuyers(limit);
      res.status(200).json({ success: true, count: buyers.length, data: buyers });
    } catch (error) {
      next(error);
    }
  }
}
