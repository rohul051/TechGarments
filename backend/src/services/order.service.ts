import { FirestoreService } from './firestore.service.js';
import { COLLECTIONS } from '../constants/collections.js';
import { Order, OrderStatus } from '../types/order.types.js';

export class OrderService {
  static async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return FirestoreService.add<Omit<Order, 'id'>>(
      COLLECTIONS.ORDERS,
      orderData as unknown as Omit<Order, 'id'>
    );
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    return FirestoreService.getById<Order>(COLLECTIONS.ORDERS, orderId);
  }

  static async getOrdersByBuyer(buyerId: string, limit = 50): Promise<Order[]> {
    return FirestoreService.queryByField<Order>(COLLECTIONS.ORDERS, 'buyerId', buyerId, limit);
  }

  static async getOrdersByFactory(factoryId: string, limit = 50): Promise<Order[]> {
    return FirestoreService.queryByField<Order>(COLLECTIONS.ORDERS, 'factoryId', factoryId, limit);
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await FirestoreService.update(COLLECTIONS.ORDERS, orderId, { status });
  }

  static async listPublicRfqs(limit = 30): Promise<Order[]> {
    return FirestoreService.queryByField<Order>(COLLECTIONS.ORDERS, 'status', 'PENDING_QUOTE', limit);
  }
}
