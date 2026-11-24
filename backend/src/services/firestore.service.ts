import { db } from '../config/firebase.js';
import { CollectionName } from '../constants/collections.js';

export class FirestoreService {
  /**
   * Get document by ID
   */
  static async getById<T>(collection: CollectionName, id: string): Promise<T | null> {
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as T;
  }

  /**
   * Create or overwrite document with specific ID
   */
  static async set<T extends object>(
    collection: CollectionName,
    id: string,
    data: T
  ): Promise<T> {
    const docRef = db.collection(collection).doc(id);
    const now = new Date().toISOString();
    const payload = {
      ...data,
      id,
      updatedAt: now,
      createdAt: ('createdAt' in data && data.createdAt ? data.createdAt : now) as string,
    };
    await docRef.set(payload, { merge: true });
    return payload as unknown as T;
  }

  /**
   * Add a new document with an auto-generated Firestore ID
   */
  static async add<T extends object>(
    collection: CollectionName,
    data: T
  ): Promise<T & { id: string }> {
    const docRef = db.collection(collection).doc();
    const now = new Date().toISOString();
    const payload = {
      ...data,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(payload);
    return payload as T & { id: string };
  }

  /**
   * Update an existing document
   */
  static async update<T extends object>(
    collection: CollectionName,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = db.collection(collection).doc(id);
    await docRef.update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Delete document by ID
   */
  static async delete(collection: CollectionName, id: string): Promise<void> {
    await db.collection(collection).doc(id).delete();
  }

  /**
   * Query all documents in a collection
   */
  static async getAll<T>(collection: CollectionName, limit = 50): Promise<T[]> {
    const snapshot = await db.collection(collection).limit(limit).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
  }

  /**
   * Query documents where field equals value
   */
  static async queryByField<T>(
    collection: CollectionName,
    field: string,
    value: unknown,
    limit = 50
  ): Promise<T[]> {
    const snapshot = await db
      .collection(collection)
      .where(field, '==', value)
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
  }
}
