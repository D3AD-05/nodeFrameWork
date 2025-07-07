import { Router } from 'express';
import { Request, Response } from 'express';
import { dbConnection } from '../db/connection';
import { formatResponse } from '../utils/common.utils';
import { asyncHandler } from '../errors/error.handler';

// Import module routes
import userRoutes from '../modules/user/user.routes';

const router = Router();

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const dbHealth = await dbConnection.healthCheck();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    database: dbHealth,
  };

  // If database is unhealthy, return 503
  if (dbHealth.status === 'unhealthy') {
    healthData.status = 'unhealthy';
    return res.status(503).json(formatResponse(healthData, 'Service partially unavailable'));
  }

  res.json(formatResponse(healthData, 'Service is healthy'));
}));

// API info endpoint
router.get('/', (req: Request, res: Response) => {
  const apiInfo = {
    name: 'Node.js Backend Framework',
    version: '1.0.0',
    description: 'Modular Node.js backend framework with TypeScript, MySQL, and Winston logging',
    endpoints: {
      health: '/health',
      users: '/users',
    },
    documentation: 'https://github.com/your-repo/docs',
  };

  res.json(formatResponse(apiInfo, 'API information'));
});

// Register module routes
router.use('/users', userRoutes);

export default router;