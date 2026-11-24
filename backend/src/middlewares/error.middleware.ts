import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static internal(message = 'Internal server error', details?: unknown) {
    return new ApiError(500, message, details);
  }
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const message = err.message || 'An unexpected error occurred';
  const details = 'details' in err ? err.details : undefined;

  console.error(`[Error] ${req.method} ${req.url} - ${statusCode} - ${message}`);
  if (statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
}
