import { FirestoreService } from './firestore.service.js';
import { COLLECTIONS } from '../constants/collections.js';
import { Product } from '../types/product.types.js';
import { db } from '../config/firebase.js';

export class ProductService {
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return FirestoreService.add<Omit<Product, 'id'>>(
      COLLECTIONS.PRODUCTS,
      productData as unknown as Omit<Product, 'id'>
    );
  }

  static async getProductById(productId: string): Promise<Product | null> {
    return FirestoreService.getById<Product>(COLLECTIONS.PRODUCTS, productId);
  }

  static async getProductsByFactory(factoryId: string, limit = 50): Promise<Product[]> {
    return FirestoreService.queryByField<Product>(COLLECTIONS.PRODUCTS, 'factoryId', factoryId, limit);
  }

  static async listProducts(category?: string, limit = 50): Promise<Product[]> {
    if (category) {
      return FirestoreService.queryByField<Product>(COLLECTIONS.PRODUCTS, 'category', category, limit);
    }
    return FirestoreService.getAll<Product>(COLLECTIONS.PRODUCTS, limit);
  }

  static async updateProduct(productId: string, data: Partial<Product>): Promise<void> {
    await FirestoreService.update(COLLECTIONS.PRODUCTS, productId, data);
  }

  static async deleteProduct(productId: string): Promise<void> {
    await FirestoreService.delete(COLLECTIONS.PRODUCTS, productId);
  }
}
