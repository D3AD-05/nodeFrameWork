import mysql from 'mysql2/promise';
import { dbConfig } from '../config/database';
import { logger } from '../logger/winston';
import { AppError } from '../errors/AppError';

class DatabaseConnection {
  private pool: mysql.Pool | null = null;
  private static instance: DatabaseConnection;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        queueLimit: 0,
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      logger.info('Database connected successfully', {
        host: dbConfig.host,
        database: dbConfig.database,
        port: dbConfig.port,
      });
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw AppError.database('Failed to connect to database');
    }
  }

  public getPool(): mysql.Pool {
    if (!this.pool) {
      throw AppError.database('Database pool not initialized');
    }
    return this.pool;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }

      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      logger.error('Database connection check failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw AppError.database('Failed to close database connection');
    }
  }

  // Health check method
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    responseTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const isConnected = await this.checkConnection();
      const responseTime = Date.now() - startTime;

      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
      };
    }
  }
}

export const dbConnection = DatabaseConnection.getInstance();
export default dbConnection;