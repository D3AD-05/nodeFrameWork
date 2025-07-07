import { Request } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generate a random string
 */
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Generate a UUID v4
 */
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Get client IP address
 */
export const getClientIP = (req: Request): string => {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.headers["x-real-ip"] as string) ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    "unknown"
  );
};

/**
 * Get user agent
 */
export const getUserAgent = (req: Request): string => {
  return req.headers["user-agent"] || "unknown";
};

/**
 * Sanitize object by removing undefined and null values
 */
export const sanitizeObject = (
  obj: Record<string, any>
): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Convert camelCase to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Convert snake_case to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

/**
 * Convert object keys from camelCase to snake_case
 */
export const objectKeysToSnake = (
  obj: Record<string, any>
): Record<string, any> => {
  const converted: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    converted[camelToSnake(key)] = value;
  }

  return converted;
};

/**
 * Convert object keys from snake_case to camelCase
 */
export const objectKeysToCamel = (
  obj: Record<string, any>
): Record<string, any> => {
  const converted: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    converted[snakeToCamel(key)] = value;
  }

  return converted;
};

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  offset: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const calculatePagination = (
  totalCount: number,
  options: PaginationOptions = {}
): PaginationResult => {
  const { page = 1, limit = 10, maxLimit = 100 } = options;

  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(Math.max(1, limit), maxLimit);
  const offset = (normalizedPage - 1) * normalizedLimit;
  const totalPages = Math.ceil(totalCount / normalizedLimit);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset,
    totalPages,
    hasNext: normalizedPage < totalPages,
    hasPrevious: normalizedPage > 1,
  };
};

/**
 * Format response with success/error structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Omit<PaginationResult, "offset">;
  timestamp: string;
}

export const formatResponse = <T>(
  data?: T,
  message?: string,
  pagination?: Omit<PaginationResult, "offset">
): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry utility
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      await sleep(delay * attempt);
      attempt++;
    }
  }

  throw new Error("Max retry attempts reached");
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
