import { Request, Response } from 'express';
import { userService } from './user.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../errors/error.handler';
import { formatResponse } from '../../utils/common.utils';
import { AppError } from '../../errors/AppError';

export class UserController {
  private static instance: UserController;

  private constructor() {}

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    const user = await userService.createUser(userData);
    
    res.status(201).json(formatResponse(user, 'User created successfully'));
  });

  getUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    res.json(formatResponse(user, 'User retrieved successfully'));
  });

  updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if user is updating their own profile or is admin
    if (req.user?.id !== id && req.user?.role !== 'admin') {
      throw AppError.forbidden('You can only update your own profile');
    }
    
    const user = await userService.updateUser(id, updateData);
    
    res.json(formatResponse(user, 'User updated successfully'));
  });

  deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    // Check if user is deleting their own profile or is admin
    if (req.user?.id !== id && req.user?.role !== 'admin') {
      throw AppError.forbidden('You can only delete your own profile');
    }
    
    await userService.deleteUser(id);
    
    res.json(formatResponse(null, 'User deleted successfully'));
  });

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, role, isActive } = req.query;
    
    const result = await userService.getUsers({
      pagination: {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      },
      search: search as string,
      role: role as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
    
    res.json(formatResponse(result.users, 'Users retrieved successfully', result.pagination));
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const loginData = req.body;
    const result = await userService.login(loginData);
    
    res.json(formatResponse(result, 'Login successful'));
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
      throw AppError.unauthorized('User not authenticated');
    }
    
    const user = await userService.getUserById(req.user.id);
    
    res.json(formatResponse(user, 'Profile retrieved successfully'));
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
      throw AppError.unauthorized('User not authenticated');
    }
    
    const updateData = req.body;
    const user = await userService.updateUser(req.user.id, updateData);
    
    res.json(formatResponse(user, 'Profile updated successfully'));
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
      throw AppError.unauthorized('User not authenticated');
    }
    
    const { currentPassword, newPassword } = req.body;
    
    await userService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json(formatResponse(null, 'Password changed successfully'));
  });
}

export const userController = UserController.getInstance();