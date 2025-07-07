import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Import configurations and utilities
import { config, validateConfig } from './config/env.config';
import { dbConnection } from './db/connection';
import { logger } from './logger/winston';

// Import middleware
import { requestLogger } from './middleware/request.logger';
import { generalLimiter } from './middleware/rate.limiter';
import { globalErrorHandler, handleUnhandledRejection, handleUncaughtException } from './errors/error.handler';

// Import routes
import apiRoutes from './routes/index.routes';

class App {
  public app: express.Application;
  
  constructor() {
    this.app = express();
    this.initializeConfig();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeProcessHandlers();
  }

  private initializeConfig(): void {
    try {
      validateConfig();
      logger.info('Configuration validated successfully');
    } catch (error) {
      logger.error('Configuration validation failed:', error);
      process.exit(1);
    }
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : false,
    }));

    // CORS
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // HTTP request logging (only in development)
    if (config.NODE_ENV === 'development') {
      this.app.use(morgan('combined'));
    }

    // Custom request logging
    this.app.use(requestLogger);

    // Rate limiting
    this.app.use(generalLimiter);

    logger.info('Middleware initialized successfully');
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use(config.API_PREFIX, apiRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          type: 'NOT_FOUND_ERROR',
          message: `Route ${req.originalUrl} not found`,
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          method: req.method,
        },
      });
    });

    logger.info('Routes initialized successfully');
  }

  private initializeErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(globalErrorHandler);
    
    logger.info('Error handling initialized successfully');
  }

  private initializeProcessHandlers(): void {
    // Handle unhandled promise rejections
    handleUnhandledRejection();
    
    // Handle uncaught exceptions
    handleUncaughtException();

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    try {
      // Close database connection
      await dbConnection.close();
      logger.info('Database connection closed');
      
      // Exit process
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await dbConnection.connect();
      
      // Start server
      const server = this.app.listen(config.PORT, () => {
        logger.info(`🚀 Server is running on port ${config.PORT}`);
        logger.info(`📱 Environment: ${config.NODE_ENV}`);
        logger.info(`🔗 API Prefix: ${config.API_PREFIX}`);
        
        if (config.NODE_ENV === 'development') {
          logger.info(`🌐 Health check: http://localhost:${config.PORT}${config.API_PREFIX}/health`);
          logger.info(`📖 API info: http://localhost:${config.PORT}${config.API_PREFIX}`);
        }
      });

      // Handle server errors
      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${config.PORT} is already in use`);
        } else {
          logger.error('Server error:', error);
        }
        process.exit(1);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Create and start the application
const app = new App();

// Start the server
if (require.main === module) {
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default app;