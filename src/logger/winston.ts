import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config/env.config';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create daily rotate file transport for API calls
const apiCallsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'api-calls-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.LOG_FILE_MAX_SIZE,
  maxFiles: config.LOG_FILE_MAX_FILES,
  level: 'info',
});

// Create daily rotate file transport for GET requests
const getRequestsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'get-requests-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.LOG_FILE_MAX_SIZE,
  maxFiles: config.LOG_FILE_MAX_FILES,
  level: 'info',
});

// Create daily rotate file transport for POST/PUT requests
const postPutRequestsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'post-put-requests-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.LOG_FILE_MAX_SIZE,
  maxFiles: config.LOG_FILE_MAX_FILES,
  level: 'info',
});

// Create daily rotate file transport for DELETE requests
const deleteRequestsTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'delete-requests-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.LOG_FILE_MAX_SIZE,
  maxFiles: config.LOG_FILE_MAX_FILES,
  level: 'info',
});

// Create daily rotate file transport for errors
const errorTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'errors-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: config.LOG_FILE_MAX_SIZE,
  maxFiles: config.LOG_FILE_MAX_FILES,
  level: 'error',
});

// Main logger
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  transports: [
    errorTransport,
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],
});

// API Calls logger
export const apiLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [apiCallsTransport],
});

// GET requests logger
export const getLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [getRequestsTransport],
});

// POST/PUT requests logger
export const postPutLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [postPutRequestsTransport],
});

// DELETE requests logger
export const deleteLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [deleteRequestsTransport],
});

// Error logger
export const errorLogger = winston.createLogger({
  level: 'error',
  format: logFormat,
  transports: [errorTransport],
});

// Add console transport in development
if (config.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Helper function to log API requests
export const logApiRequest = (method: string, url: string, data?: any, userId?: string) => {
  const logData = {
    method,
    url,
    data: data || {},
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
  };

  // Log to main API logger
  apiLogger.info('API Request', logData);

  // Log to specific method loggers
  switch (method.toUpperCase()) {
    case 'GET':
      getLogger.info('GET Request', logData);
      break;
    case 'POST':
    case 'PUT':
    case 'PATCH':
      postPutLogger.info(`${method} Request`, logData);
      break;
    case 'DELETE':
      deleteLogger.info('DELETE Request', logData);
      break;
  }
};

// Helper function to log errors
export const logError = (error: Error, context?: any) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context: context || {},
    timestamp: new Date().toISOString(),
  };

  errorLogger.error('Application Error', errorData);
  logger.error('Application Error', errorData);
};