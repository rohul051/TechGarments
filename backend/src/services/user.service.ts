import { FirestoreService } from './firestore.service.js';
import { COLLECTIONS } from '../constants/collections.js';
import { User, BuyerProfile, FactoryProfile } from '../types/user.types.js';

export class UserService {
  static async getUserById(uid: string): Promise<User | null> {
    return FirestoreService.getById<User>(COLLECTIONS.USERS, uid);
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const users = await FirestoreService.queryByField<User>(
      COLLECTIONS.USERS,
      'email',
      email.trim().toLowerCase(),
      1
    );
    return users.length > 0 ? users[0] : null;
  }

  static async createOrUpdateUser(user: Partial<User> & { uid: string; email: string }): Promise<User> {
    const existing = await this.getUserById(user.uid);
    const now = new Date().toISOString();
    const payload: User = {
      uid: user.uid,
      email: user.email.toLowerCase(),
      fullName: user.fullName || existing?.fullName || 'User',
      role: user.role || existing?.role || 'BUYER',
      phoneNumber: user.phoneNumber || existing?.phoneNumber,
      photoURL: user.photoURL || existing?.photoURL,
      isActive: true,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await FirestoreService.set<User>(COLLECTIONS.USERS, user.uid, payload);
    return payload;
  }

  static async getFullUserProfile(uid: string): Promise<{
    user: User | null;
    buyerProfile?: BuyerProfile | null;
    factoryProfile?: FactoryProfile | null;
  }> {
    const user = await this.getUserById(uid);
    let buyerProfile: BuyerProfile | null = null;
    let factoryProfile: FactoryProfile | null = null;

    if (user?.role === 'BUYER') {
      buyerProfile = await FirestoreService.getById<BuyerProfile>(COLLECTIONS.BUYERS, uid);
    } else if (user?.role === 'FACTORY') {
      factoryProfile = await FirestoreService.getById<FactoryProfile>(COLLECTIONS.FACTORIES, uid);
    }

    return { user, buyerProfile, factoryProfile };
  }
}
