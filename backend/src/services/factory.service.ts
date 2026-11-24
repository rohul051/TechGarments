import { FirestoreService } from './firestore.service.js';
import { COLLECTIONS } from '../constants/collections.js';
import { FactoryProfile } from '../types/user.types.js';
import { db } from '../config/firebase.js';

export class FactoryService {
  static async getProfile(factoryId: string): Promise<FactoryProfile | null> {
    return FirestoreService.getById<FactoryProfile>(COLLECTIONS.FACTORIES, factoryId);
  }

  static async createOrUpdateProfile(profile: FactoryProfile): Promise<FactoryProfile> {
    return FirestoreService.set<FactoryProfile>(
      COLLECTIONS.FACTORIES,
      profile.id,
      profile
    );
  }

  static async listFactories(limit = 30): Promise<FactoryProfile[]> {
    return FirestoreService.getAll<FactoryProfile>(COLLECTIONS.FACTORIES, limit);
  }

  static async filterFactories(filters: {
    country?: string;
    process?: string;
    product?: string;
    limit?: number;
  }): Promise<FactoryProfile[]> {
    let query: FirebaseFirestore.Query = db.collection(COLLECTIONS.FACTORIES);

    if (filters.country) {
      query = query.where('country', '==', filters.country);
    }
    if (filters.process) {
      query = query.where('processes', 'array-contains', filters.process);
    } else if (filters.product) {
      query = query.where('products', 'array-contains', filters.product);
    }

    const snapshot = await query.limit(filters.limit || 30).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FactoryProfile);
  }
}
