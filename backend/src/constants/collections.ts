/**
 * Firestore Collection Names Constants
 */
export const COLLECTIONS = {
  USERS: 'users',
  BUYERS: 'buyers',
  FACTORIES: 'factories',
  ORDERS: 'orders',
  PRODUCTS: 'products',
  QUOTES: 'quotes',
  NOTIFICATIONS: 'notifications',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  FCM_TOKENS: 'fcm_tokens',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
