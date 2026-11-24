import { createApp } from './app.js';
import { config } from './config/env.js';
import { isFirebaseConfigured } from './config/firebase.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`
======================================================
  👕 TechGarments Backend Server Started!
======================================================
  🚀 Server URL:       http://localhost:${config.port}
  🩺 Health Endpoint:  http://localhost:${config.port}/api/health
  🌐 Environment:      ${config.nodeEnv}
  🔥 Firebase Project: ${config.firebase.projectId}
  📦 Firebase Admin:   ${isFirebaseConfigured ? '✅ Credentials Loaded' : '⚠️ Default Mode (Credentials pending)'}
  🔗 Firebase Console: https://console.firebase.google.com/project/${config.firebase.projectId}/overview
  📁 Firestore Console:https://console.firebase.google.com/project/${config.firebase.projectId}/firestore
======================================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});
