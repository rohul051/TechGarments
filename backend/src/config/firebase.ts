import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { config } from './env.js';

let app: App;
let hasValidCredentials = false;

// Check existing apps
if (getApps().length > 0) {
  app = getApps()[0]!;
  hasValidCredentials = true;
} else {
  const resolvedKeyPath = path.resolve(process.cwd(), config.firebase.serviceAccountPath);

  if (fs.existsSync(resolvedKeyPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedKeyPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
      });
      hasValidCredentials = true;
      console.log(`[Firebase] Initialized with service account file (${resolvedKeyPath}) for project: ${config.firebase.projectId}`);
    } catch (err) {
      console.warn(`[Firebase] Failed to parse service account JSON at ${resolvedKeyPath}:`, err);
      app = initializeApp({ projectId: config.firebase.projectId });
    }
  } else if (config.firebase.clientEmail && config.firebase.privateKey) {
    try {
      app = initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
      });
      hasValidCredentials = true;
      console.log(`[Firebase] Initialized with environment credentials for project: ${config.firebase.projectId}`);
    } catch (err) {
      console.warn('[Firebase] Failed to initialize with environment credentials:', err);
      app = initializeApp({ projectId: config.firebase.projectId });
    }
  } else {
    // Development fallback without credentials file
    app = initializeApp({
      projectId: config.firebase.projectId,
    });
    console.log(`[Firebase] Initialized in default mode for project: ${config.firebase.projectId}`);
    console.log(`[Firebase Info] To perform authenticated Admin operations against Firestore, add serviceAccountKey.json to backend/ from https://console.firebase.google.com/project/${config.firebase.projectId}/settings/serviceaccounts/adminsdk`);
  }
}

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const isFirebaseConfigured = hasValidCredentials;
export { admin, FieldValue, Timestamp };
export default app;
