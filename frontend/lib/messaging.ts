import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, getClientMessaging, vapidKey } from './firebase';

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'BUYER' | 'FACTORY';
  recipientId: string;
  text: string;
  attachments?: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  buyerId: string;
  buyerName: string;
  factoryId: string;
  factoryName: string;
  lastMessage: string;
  updatedAt: string;
}

/**
 * Request browser push notification permission and return FCM registration token
 */
export async function requestNotificationPermission(userId?: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[FCM] Notifications are not supported in this browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission was denied or dismissed.');
      return null;
    }

    const messaging = await getClientMessaging();
    if (!messaging) {
      console.warn('[FCM] Messaging client is unavailable.');
      return null;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
    });

    if (currentToken) {
      // Store FCM registration token in Firestore for targeted push notifications
      if (userId) {
        await setDoc(
          doc(db, 'fcm_tokens', currentToken),
          {
            userId,
            token: currentToken,
            platform: 'web',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      return currentToken;
    } else {
      console.warn('[FCM] No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error requesting notification token:', error);
    return null;
  }
}

/**
 * Listen for foreground push messages
 */
export async function onForegroundMessage(callback: (payload: MessagePayload) => void): Promise<(() => void) | null> {
  const messaging = await getClientMessaging();
  if (!messaging) return null;

  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground push message received:', payload);
    callback(payload);
  });
}

/**
 * Send a chat message between Buyer and Factory stored in Cloud Firestore
 */
export async function sendChatMessage(messageData: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<string> {
  const now = new Date().toISOString();

  // 1. Add message document to Firestore
  const docRef = await addDoc(collection(db, 'messages'), {
    ...messageData,
    createdAt: now,
  });

  // 2. Update conversation summary in Firestore
  await setDoc(
    doc(db, 'conversations', messageData.conversationId),
    {
      id: messageData.conversationId,
      buyerId: messageData.senderRole === 'BUYER' ? messageData.senderId : messageData.recipientId,
      factoryId: messageData.senderRole === 'FACTORY' ? messageData.senderId : messageData.recipientId,
      lastMessage: messageData.text,
      updatedAt: now,
    },
    { merge: true }
  );

  return docRef.id;
}

/**
 * Subscribe to real-time chat messages in Cloud Firestore
 */
export function subscribeToMessages(
  conversationId: string,
  onUpdate: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChatMessage, 'id'>),
    }));
    onUpdate(messages);
  });
}
