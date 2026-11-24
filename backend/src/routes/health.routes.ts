import { Router } from 'express';
import { db, isFirebaseConfigured } from '../config/firebase.js';
import { config } from '../config/env.js';

const router = Router();

router.get('/', async (req, res) => {
  let firestoreStatus = 'unknown';

  if (isFirebaseConfigured) {
    try {
      // Test firestore read/write ping
      await db.collection('_healthcheck').doc('ping').set({
        timestamp: new Date().toISOString(),
      });
      firestoreStatus = 'connected';
    } catch (err: unknown) {
      firestoreStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    firestoreStatus = 'initialized (service account pending)';
  }

  res.status(200).json({
    status: 'healthy',
    service: 'techgarments-backend',
    version: '1.0.0',
    firebase: {
      projectId: config.firebase.projectId,
      isConfigured: isFirebaseConfigured,
      firestore: firestoreStatus,
      consoleUrl: `https://console.firebase.google.com/project/${config.firebase.projectId}/overview`,
      firestoreUrl: `https://console.firebase.google.com/project/${config.firebase.projectId}/firestore`,
    },
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
