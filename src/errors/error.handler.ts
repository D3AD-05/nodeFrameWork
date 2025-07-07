import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { ErrorType, HttpStatusCode } from './error.types';
import { logger, logError } from '../logger/winston';
import { config } from '../config/env.config';

interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    stack?: string;
    context?: any;
  };
}

export const globalErrorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logError(error, {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: (req as any).user?.id || 'anonymous',
  });

  // Default error values
  let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let type = ErrorType.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong!';
  let context: any = undefined;

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    type = error.type;
    message = error.message;
    context = error.context;
  } else if (error.name === 'ValidationError') {
    statusCode = HttpStatusCode.UNPROCESSABLE_ENTITY;
    type = ErrorType.VALIDATION_ERROR;
    message = error.message || 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = HttpStatusCode.BAD_REQUEST;
    type = ErrorType.BAD_REQUEST_ERROR;
    message = 'Invalid resource ID';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    type = ErrorType.AUTHENTICATION_ERROR;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = HttpStatusCode.UNAUTHORIZED;
    type = ErrorType.AUTHENTICATION_ERROR;
    message = 'Token expired';
  } else if ((error as any).code === 'ER_DUP_ENTRY') {
    statusCode = HttpStatusCode.CONFLICT;
    type = ErrorType.DUPLICATE_ERROR;
    message = 'Duplicate entry found';
  } else if ((error as any).code && (error as any).code.startsWith('ER_')) {
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    type = ErrorType.DATABASE_ERROR;
    message = config.NODE_ENV === 'production' ? 'Database error occurred' : error.message;
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      type,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  };

  // Add stack trace in development
  if (config.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
  }

  // Add context if available
  if (context) {
    errorResponse.error.context = context;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper for controllers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Close server gracefully
    process.exit(1);
  });
};

// Handle uncaught exceptions
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    
    // Close server gracefully
    process.exit(1);
  });
};