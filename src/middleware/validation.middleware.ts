import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../errors/error.handler';

/**
 * Validation middleware factory
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const validationErrors: string[] = [];

      // Validate request body
      if (schema.body) {
        const { error } = schema.body.validate(req.body, { abortEarly: false });
        if (error) {
          error.details.forEach(detail => {
            validationErrors.push(detail.message);
          });
        }
      }

      // Validate request params
      if (schema.params) {
        const { error } = schema.params.validate(req.params, { abortEarly: false });
        if (error) {
          error.details.forEach(detail => {
            validationErrors.push(detail.message);
          });
        }
      }

      // Validate request query
      if (schema.query) {
        const { error } = schema.query.validate(req.query, { abortEarly: false });
        if (error) {
          error.details.forEach(detail => {
            validationErrors.push(detail.message);
          });
        }
      }

      if (validationErrors.length > 0) {
        throw AppError.validation('Validation failed', { errors: validationErrors });
      }

      next();
    }
  );
};

// Common validation schemas
export const commonSchemas = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};