import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiError } from './error.middleware.js';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return next(ApiError.badRequest('Validation failed', issues));
      }
      next(error);
    }
  };
}
