import Joi from 'joi';

export const userValidation = {
  create: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      role: Joi.string().valid('user', 'admin').default('user'),
    }),
  },

  update: {
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
    body: Joi.object({
      email: Joi.string().email(),
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
      role: Joi.string().valid('user', 'admin'),
      isActive: Joi.boolean(),
    }).min(1),
  },

  getById: {
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  },

  getUsers: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().max(100),
      role: Joi.string().valid('user', 'admin'),
      isActive: Joi.boolean(),
    }),
  },
};