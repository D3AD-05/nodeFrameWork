import { userQuery } from "./user.query";
import {
  User,
  CreateUserInput,
  UpdateUserInput,
  LoginInput,
  LoginResponse,
} from "./user.types";
import { AppError } from "../../errors/AppError";
import {
  hashPassword,
  comparePassword,
  generateUUID,
} from "../../utils/common.utils";
import { generateToken } from "../../middleware/auth.middleware";
import { PaginationOptions } from "../../utils/common.utils";

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async createUser(userData: CreateUserInput): Promise<Omit<User, "password">> {
    // Check if user already exists
    const existingUser = await userQuery.exists(userData.email);
    if (existingUser) {
      throw AppError.conflict("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = await userQuery.create({
      ...userData,
      id: generateUUID(),
      password: hashedPassword,
    });
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserById(id: string): Promise<Omit<User, "password">> {
    const user = await userQuery.findById(id);

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(
    id: string,
    updateData: UpdateUserInput
  ): Promise<Omit<User, "password">> {
    // Check if user exists
    const existingUser = await userQuery.findById(id);
    if (!existingUser) {
      throw AppError.notFound("User not found");
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await userQuery.exists(updateData.email);
      if (emailExists) {
        throw AppError.conflict("User with this email already exists");
      }
    }

    const updatedUser = await userQuery.update(id, updateData);

    if (!updatedUser) {
      throw AppError.notFound("User not found");
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await userQuery.findById(id);

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const deleted = await userQuery.delete(id);

    if (!deleted) {
      throw AppError.internal("Failed to delete user");
    }
  }

  async getUsers(
    options: {
      pagination?: PaginationOptions;
      search?: string;
      role?: string;
      isActive?: boolean;
    } = {}
  ): Promise<{
    users: Omit<User, "password">[];
    pagination: any;
  }> {
    return await userQuery.findAll(options);
  }

  async login(loginData: LoginInput): Promise<LoginResponse> {
    // Find user by email
    const user = await userQuery.findByEmail(loginData.email);
    console.log(!user);

    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw AppError.unauthorized("Account is deactivated");
    }

    // Compare password
    const isPasswordValid = await comparePassword(
      loginData.password,
      user.password
    );
    console.log(isPasswordValid);

    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await userQuery.findById(id);

    if (!user) {
      throw AppError.notFound("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw AppError.unauthorized("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await userQuery.update(id, { password: hashedNewPassword } as any);
  }
}

export const userService = UserService.getInstance();
