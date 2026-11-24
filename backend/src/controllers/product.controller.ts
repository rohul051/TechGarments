import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { ApiError } from '../middlewares/error.middleware.js';

export class ProductController {
  static async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, limit } = req.query;
      const products = await ProductService.listProducts(
        category as string,
        limit ? parseInt(limit as string, 10) : 50
      );
      res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      if (!product) throw ApiError.notFound('Product not found');

      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const factoryId = req.user?.uid;
      if (!factoryId) throw ApiError.unauthorized();

      const newProduct = await ProductService.createProduct({
        ...req.body,
        factoryId,
        factoryName: req.body.factoryName || 'Factory Partner',
        isAvailable: req.body.isAvailable ?? true,
      });

      res.status(201).json({
        success: true,
        message: 'Product catalog item created successfully',
        data: newProduct,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ProductService.updateProduct(id, req.body);
      res.status(200).json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);
      res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
