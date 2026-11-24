import { Request, Response, NextFunction } from 'express';
import { FactoryService } from '../services/factory.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { ApiError } from '../middlewares/error.middleware.js';

export class FactoryController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const profile = await FactoryService.getProfile(id);
      if (!profile) throw ApiError.notFound('Factory profile not found');

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const factoryId = req.user?.uid;
      if (!factoryId) throw ApiError.unauthorized();

      const updated = await FactoryService.createOrUpdateProfile({
        ...req.body,
        id: factoryId,
      });

      res.status(200).json({
        success: true,
        message: 'Factory profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listFactories(req: Request, res: Response, next: NextFunction) {
    try {
      const { country, process, product, limit } = req.query;

      if (country || process || product) {
        const factories = await FactoryService.filterFactories({
          country: country as string,
          process: process as string,
          product: product as string,
          limit: limit ? parseInt(limit as string, 10) : undefined,
        });
        return res.status(200).json({ success: true, count: factories.length, data: factories });
      }

      const factories = await FactoryService.listFactories(
        limit ? parseInt(limit as string, 10) : 30
      );
      res.status(200).json({ success: true, count: factories.length, data: factories });
    } catch (error) {
      next(error);
    }
  }
}
