import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { BuyerService } from '../services/buyer.service.js';
import { FactoryService } from '../services/factory.service.js';
import { ApiError } from '../middlewares/error.middleware.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { Role } from '../types/user.types.js';

export class AuthController {
  /**
   * Register new user and save to Firestore
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { uid, email, password, fullName, role, phone, profileDetails } = req.body;

      if (!email || !role) {
        throw ApiError.badRequest('Missing required fields: email, role');
      }

      const userId = uid || `user_${Date.now()}`;
      const cleanEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existing = await UserService.getUserByEmail(cleanEmail);
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'User already registered',
          data: { user: existing },
        });
      }

      // Save user base record in Firestore
      const user = await UserService.createOrUpdateUser({
        uid: userId,
        email: cleanEmail,
        fullName: fullName || cleanEmail.split('@')[0],
        role: role as Role,
        phoneNumber: phone,
      });

      // If buyer, create buyer profile in Firestore
      if (role === 'BUYER') {
        await BuyerService.createOrUpdateProfile({
          id: userId,
          fullName: fullName || 'Buyer',
          email: cleanEmail,
          phone,
          companyName: profileDetails?.companyName || 'My Brand',
          buyerType: profileDetails?.buyerType || 'Clothing Brand',
          country: profileDetails?.country || 'Other',
          website: profileDetails?.website || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // If factory, create factory profile in Firestore
      if (role === 'FACTORY') {
        await FactoryService.createOrUpdateProfile({
          id: userId,
          fullName: fullName || 'Factory Partner',
          email: cleanEmail,
          phone,
          companyName: profileDetails?.companyName || 'Garment Factory Ltd',
          country: profileDetails?.country || 'Bangladesh',
          city: profileDetails?.city,
          processes: profileDetails?.processes || ['Cutting', 'Sewing', 'Finishing'],
          products: profileDetails?.products || ['T-shirt', 'Shirt'],
          monthlyCapacity: profileDetails?.monthlyCapacity || 50000,
          certifications: profileDetails?.certifications || [],
          moq: profileDetails?.moq || 500,
          verified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const fullProfile = await UserService.getFullUserProfile(userId);

      res.status(201).json({
        success: true,
        message: 'User registered successfully in Firestore',
        data: fullProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login endpoint
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw ApiError.badRequest('Email and password are required');
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await UserService.getUserByEmail(cleanEmail);

      if (!user) {
        throw ApiError.unauthorized('Invalid email or password. Please register first.');
      }

      const fullProfile = await UserService.getFullUserProfile(user.uid);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          ...fullProfile,
          token: `token_${user.uid}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync or create user in Firestore after Firebase Auth signup/login
   */
  static async syncUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { uid, email, fullName, role, phone, profileDetails } = req.body;

      if (!uid || !email || !role) {
        throw ApiError.badRequest('Missing required fields: uid, email, role');
      }

      // Save user base record in Firestore
      const user = await UserService.createOrUpdateUser({
        uid,
        email,
        fullName: fullName || email.split('@')[0],
        role: role as Role,
        phoneNumber: phone,
      });

      // If buyer, create/update buyer profile in Firestore
      if (role === 'BUYER' && profileDetails) {
        await BuyerService.createOrUpdateProfile({
          id: uid,
          fullName: fullName || 'Buyer',
          email,
          phone,
          companyName: profileDetails.companyName || 'My Brand',
          buyerType: profileDetails.buyerType || 'Clothing Brand',
          country: profileDetails.country || 'Other',
          website: profileDetails.website || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // If factory, create/update factory profile in Firestore
      if (role === 'FACTORY' && profileDetails) {
        await FactoryService.createOrUpdateProfile({
          id: uid,
          fullName: fullName || 'Factory Partner',
          email,
          phone,
          companyName: profileDetails.companyName || 'Garment Factory Ltd',
          country: profileDetails.country || 'Bangladesh',
          city: profileDetails.city,
          processes: profileDetails.processes || ['Cutting', 'Sewing', 'Finishing'],
          products: profileDetails.products || ['T-shirt', 'Shirt'],
          monthlyCapacity: profileDetails.monthlyCapacity || 50000,
          certifications: profileDetails.certifications || [],
          moq: profileDetails.moq || 500,
          verified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const fullProfile = await UserService.getFullUserProfile(uid);

      res.status(200).json({
        success: true,
        message: 'User synced successfully in Firestore',
        data: fullProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user profile from Firestore
   */
  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const uid = req.user?.uid;
      if (!uid) throw ApiError.unauthorized();

      const profile = await UserService.getFullUserProfile(uid);
      if (!profile.user) throw ApiError.notFound('User profile not found in database');

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}
