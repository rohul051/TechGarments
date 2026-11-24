import { Request, Response, NextFunction } from 'express';
import { auth, isFirebaseConfigured } from '../config/firebase.js';
import { ApiError } from './error.middleware.js';
import { Role } from '../types/user.types.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: Role;
    [key: string]: unknown;
  };
}

/**
 * Middleware to verify Firebase Auth ID Token (Bearer <token>)
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authorization token provided. Format: Bearer <token>');
    }

    const idToken = authHeader.split('Bearer ')[1].trim();

    if (!isFirebaseConfigured) {
      // In dev fallback mode if credentials aren't provided yet
      // Decode or mock user for local development testing
      req.user = {
        uid: 'dev-user-id',
        email: 'developer@techgarments.demo',
        role: 'BUYER',
      };
      return next();
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken.role as Role) || 'BUYER',
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(ApiError.unauthorized('Invalid or expired Firebase authentication token'));
  }
}

/**
 * Middleware to restrict access to specific user roles
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const userRole = req.user.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole || 'None'}`
        )
      );
    }

    next();
  };
}
