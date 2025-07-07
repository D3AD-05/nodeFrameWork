import mysql from 'mysql2/promise';
import { dbConnection } from './connection';
import { logger } from '../logger/winston';
import { AppError } from '../errors/AppError';

export interface TransactionResult<T = any> {
  data: T[];
  meta: {
    affectedRows?: number;
    insertId?: number;
    changedRows?: number;
    fieldCount: number;
    warningCount: number;
  };
}

export class TransactionHelper {
  private static instance: TransactionHelper;

  private constructor() {}

  public static getInstance(): TransactionHelper {
    if (!TransactionHelper.instance) {
      TransactionHelper.instance = new TransactionHelper();
    }
    return TransactionHelper.instance;
  }

  /**
   * Execute multiple queries in a transaction
   */
  public async executeTransaction<T = any>(
    queries: Array<{ query: string; params?: any[] }>,
    logQueries: boolean = true
  ): Promise<TransactionResult<T>[]> {
    const pool = dbConnection.getPool();
    const connection = await pool.getConnection();
    const startTime = Date.now();
    const results: TransactionResult<T>[] = [];

    try {
      // Start transaction
      await connection.beginTransaction();

      if (logQueries) {
        logger.info('Transaction started', {
          queryCount: queries.length,
          timestamp: new Date().toISOString(),
        });
      }

      // Execute all queries
      for (const { query, params = [] } of queries) {
        if (logQueries) {
          logger.info('Executing transaction query', { query, params });
        }

        const [rows, fields] = await connection.execute(query, params);
        
        results.push({
          data: rows as T[],
          meta: {
            affectedRows: (fields as any)?.affectedRows,
            insertId: (fields as any)?.insertId,
            changedRows: (fields as any)?.changedRows,
            fieldCount: (fields as any)?.fieldCount || 0,
            warningCount: (fields as any)?.warningCount || 0,
          },
        });
      }

      // Commit transaction
      await connection.commit();

      const executionTime = Date.now() - startTime;
      
      if (logQueries) {
        logger.info('Transaction committed successfully', {
          executionTime: `${executionTime}ms`,
          queryCount: queries.length,
        });
      }

      return results;
    } catch (error) {
      // Rollback transaction on error
      try {
        await connection.rollback();
        
        if (logQueries) {
          logger.warn('Transaction rolled back due to error');
        }
      } catch (rollbackError) {
        logger.error('Failed to rollback transaction', {
          originalError: (error as Error).message,
          rollbackError: (rollbackError as Error).message,
        });
      }

      const executionTime = Date.now() - startTime;
      
      logger.error('Transaction failed', {
        error: (error as Error).message,
        executionTime: `${executionTime}ms`,
        queryCount: queries.length,
      });

      throw AppError.database(`Transaction failed: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Execute a callback function with transaction support
   */
  public async withTransaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>,
    logTransaction: boolean = true
  ): Promise<T> {
    const pool = dbConnection.getPool();
    const connection = await pool.getConnection();
    const startTime = Date.now();

    try {
      // Start transaction
      await connection.beginTransaction();

      if (logTransaction) {
        logger.info('Transaction started (callback mode)', {
          timestamp: new Date().toISOString(),
        });
      }

      // Execute callback
      const result = await callback(connection);

      // Commit transaction
      await connection.commit();

      const executionTime = Date.now() - startTime;
      
      if (logTransaction) {
        logger.info('Transaction committed successfully (callback mode)', {
          executionTime: `${executionTime}ms`,
        });
      }

      return result;
    } catch (error) {
      // Rollback transaction on error
      try {
        await connection.rollback();
        
        if (logTransaction) {
          logger.warn('Transaction rolled back due to error (callback mode)');
        }
      } catch (rollbackError) {
        logger.error('Failed to rollback transaction (callback mode)', {
          originalError: (error as Error).message,
          rollbackError: (rollbackError as Error).message,
        });
      }

      const executionTime = Date.now() - startTime;
      
      logger.error('Transaction failed (callback mode)', {
        error: (error as Error).message,
        executionTime: `${executionTime}ms`,
      });

      throw AppError.database(`Transaction failed: ${(error as Error).message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Execute a simple transaction with insert, update, or delete operations
   */
  public async simpleTransaction(
    operations: Array<{
      type: 'insert' | 'update' | 'delete';
      table: string;
      data?: Record<string, any>;
      conditions?: Record<string, any>;
    }>,
    logTransaction: boolean = true
  ): Promise<TransactionResult[]> {
    const queries: Array<{ query: string; params: any[] }> = [];

    // Build queries from operations
    for (const operation of operations) {
      let query = '';
      let params: any[] = [];

      switch (operation.type) {
        case 'insert':
          if (!operation.data) {
            throw AppError.badRequest('Insert operation requires data');
          }
          const insertFields = Object.keys(operation.data);
          const insertPlaceholders = insertFields.map(() => '?').join(', ');
          query = `INSERT INTO ${operation.table} (${insertFields.join(', ')}) VALUES (${insertPlaceholders})`;
          params = Object.values(operation.data);
          break;

        case 'update':
          if (!operation.data || !operation.conditions) {
            throw AppError.badRequest('Update operation requires data and conditions');
          }
          const updateFields = Object.keys(operation.data);
          const updateSet = updateFields.map(field => `${field} = ?`).join(', ');
          const updateWhere = Object.keys(operation.conditions).map(field => `${field} = ?`).join(' AND ');
          query = `UPDATE ${operation.table} SET ${updateSet} WHERE ${updateWhere}`;
          params = [...Object.values(operation.data), ...Object.values(operation.conditions)];
          break;

        case 'delete':
          if (!operation.conditions) {
            throw AppError.badRequest('Delete operation requires conditions');
          }
          const deleteWhere = Object.keys(operation.conditions).map(field => `${field} = ?`).join(' AND ');
          query = `DELETE FROM ${operation.table} WHERE ${deleteWhere}`;
          params = Object.values(operation.conditions);
          break;
      }

      queries.push({ query, params });
    }

    return await this.executeTransaction(queries, logTransaction);
  }
}

// Export singleton instance
export const transactionHelper = TransactionHelper.getInstance();
export default transactionHelper;