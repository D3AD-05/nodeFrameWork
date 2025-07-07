import { Request, Response, NextFunction } from 'express';
import { logApiRequest } from '../logger/winston';
import { getClientIP, getUserAgent } from '../utils/common.utils';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log the request
  const requestData = {
    ip: getClientIP(req),
    userAgent: getUserAgent(req),
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
  };

  logApiRequest(
    req.method,
    req.originalUrl,
    requestData,
    (req as AuthenticatedRequest).user?.id
  );

  // Log response when finished
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logApiRequest(
      req.method,
      req.originalUrl,
      {
        ...requestData,
        statusCode: res.statusCode,
        responseTime: `${duration}ms`,
      },
      (req as AuthenticatedRequest).user?.id
    );
  });

  next();
};