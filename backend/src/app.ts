import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

export function createApp(): Application {
  const app: Application = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: [config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging
  if (config.nodeEnv !== 'test') {
    app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root welcome route
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      service: 'TechGarments Backend API',
      version: '1.0.0',
      description: 'Cloud Firestore & Firebase Admin powered garment manufacturing backend',
      firebaseProject: config.firebase.projectId,
      docs: '/api/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
