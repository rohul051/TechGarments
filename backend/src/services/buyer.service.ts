import { FirestoreService } from './firestore.service.js';
import { COLLECTIONS } from '../constants/collections.js';
import { BuyerProfile } from '../types/user.types.js';

export class BuyerService {
  static async getProfile(buyerId: string): Promise<BuyerProfile | null> {
    return FirestoreService.getById<BuyerProfile>(COLLECTIONS.BUYERS, buyerId);
  }

  static async createOrUpdateProfile(profile: BuyerProfile): Promise<BuyerProfile> {
    return FirestoreService.set<BuyerProfile>(
      COLLECTIONS.BUYERS,
      profile.id,
      profile
    );
  }

  static async listBuyers(limit = 20): Promise<BuyerProfile[]> {
    return FirestoreService.getAll<BuyerProfile>(COLLECTIONS.BUYERS, limit);
  }
}
