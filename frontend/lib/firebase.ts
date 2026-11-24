import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'techgarments-cdd93',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client instance safely (singleton pattern)
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication & Cloud Firestore
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// FCM Web Push VAPID key
export const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Initialize Firebase Cloud Messaging safely in browser client
export const getClientMessaging = async (): Promise<Messaging | null> => {
  if (typeof window !== 'undefined') {
    try {
      const supported = await isSupported();
      if (supported) {
        return getMessaging(app);
      }
    } catch (err) {
      console.warn('[FCM] Messaging not supported in current client environment:', err);
    }
  }
  return null;
};

export default app;
