import mysql from 'mysql2/promise';
import { dbConnection } from './connection';
import { logger } from '../logger/winston';
import { AppError } from '../errors/AppError';

export interface QueryResult<T = any> {
  data: T[];
  meta: {
    affectedRows?: number;
    insertId?: number;
    changedRows?: number;
    fieldCount: number;
    warningCount: number;
  };
}

export class QueryExecutor {
  private static instance: QueryExecutor;

  private constructor() {}

  public static getInstance(): QueryExecutor {
    if (!QueryExecutor.instance) {
      QueryExecutor.instance = new QueryExecutor();
    }
    return QueryExecutor.instance;
  }

  /**
   * Execute a single query
   */
  public async execute<T = any>(
    query: string,
    params: any[] = [],
    logQuery: boolean = true
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    let connection: mysql.PoolConnection | null = null;

    try {
      const pool = dbConnection.getPool();
      connection = await pool.getConnection();

      if (logQuery) {
        logger.info('Executing query', {
          query,
          params,
          timestamp: new Date().toISOString(),
        });
      }

      const [rows, fields] = await connection.execute(query, params);
      const executionTime = Date.now() - startTime;

      if (logQuery) {
        logger.info('Query executed successfully', {
          executionTime: `${executionTime}ms`,
          rowCount: Array.isArray(rows) ? rows.length : 0,
        });
      }

      return {
        data: rows as T[],
        meta: {
          affectedRows: (fields as any)?.affectedRows,
          insertId: (fields as any)?.insertId,
          changedRows: (fields as any)?.changedRows,
          fieldCount: (fields as any)?.fieldCount || 0,
          warningCount: (fields as any)?.warningCount || 0,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Query execution failed', {
        query,
        params,
        error: (error as Error).message,
        executionTime: `${executionTime}ms`,
      });

      throw AppError.database(`Query execution failed: ${(error as Error).message}`);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Execute a query and return only the first row
   */
  public async executeOne<T = any>(
    query: string,
    params: any[] = [],
    logQuery: boolean = true
  ): Promise<T | null> {
    const result = await this.execute<T>(query, params, logQuery);
    return result.data.length > 0 ? result.data[0] : null;
  }

  /**
   * Execute multiple queries in sequence (not in transaction)
   */
  public async executeMultiple(
    queries: Array<{ query: string; params?: any[] }>,
    logQuery: boolean = true
  ): Promise<QueryResult[]> {
    const results: QueryResult[] = [];

    for (const { query, params = [] } of queries) {
      const result = await this.execute(query, params, logQuery);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a raw query (use with caution)
   */
  public async executeRaw<T = any>(
    query: string,
    logQuery: boolean = true
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    let connection: mysql.PoolConnection | null = null;

    try {
      const pool = dbConnection.getPool();
      connection = await pool.getConnection();

      if (logQuery) {
        logger.info('Executing raw query', {
          query,
          timestamp: new Date().toISOString(),
        });
      }

      const [rows, fields] = await connection.query(query);
      const executionTime = Date.now() - startTime;

      if (logQuery) {
        logger.info('Raw query executed successfully', {
          executionTime: `${executionTime}ms`,
          rowCount: Array.isArray(rows) ? rows.length : 0,
        });
      }

      return {
        data: rows as T[],
        meta: {
          affectedRows: (fields as any)?.affectedRows,
          insertId: (fields as any)?.insertId,
          changedRows: (fields as any)?.changedRows,
          fieldCount: (fields as any)?.fieldCount || 0,
          warningCount: (fields as any)?.warningCount || 0,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Raw query execution failed', {
        query,
        error: (error as Error).message,
        executionTime: `${executionTime}ms`,
      });

      throw AppError.database(`Raw query execution failed: ${(error as Error).message}`);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Check if a record exists
   */
  public async exists(
    table: string,
    conditions: Record<string, any>
  ): Promise<boolean> {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    
    const query = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const params = Object.values(conditions);
    
    const result = await this.execute(query, params, false);
    return result.data.length > 0;
  }

  /**
   * Get count of records
   */
  public async count(
    table: string,
    conditions: Record<string, any> = {}
  ): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const params: any[] = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    const result = await this.execute<{ count: number }>(query, params, false);
    return result.data[0]?.count || 0;
  }
}

// Export singleton instance
export const queryExecutor = QueryExecutor.getInstance();
export default queryExecutor;