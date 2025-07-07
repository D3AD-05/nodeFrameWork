import { queryExecutor } from "../../db/query.executor";
import { User, CreateUserInput, UpdateUserInput } from "./user.types";
import {
  calculatePagination,
  PaginationOptions,
} from "../../utils/common.utils";

export class UserQuery {
  private static instance: UserQuery;

  private constructor() {}

  public static getInstance(): UserQuery {
    if (!UserQuery.instance) {
      UserQuery.instance = new UserQuery();
    }
    return UserQuery.instance;
  }

  async create(userData: CreateUserInput & { id: string }): Promise<User> {
    const query = `
      INSERT INTO users ( email, password, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES  ( ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
    `;

    const params = [
      userData.email,
      userData.password,
      userData.firstName,
      userData.lastName,
      userData.role || 2,
    ];

    const response = await queryExecutor.execute(query, params);
    const result = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    return result.insertId;
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT 
        id,
        email,
        password,
        first_name as firstName,
        last_name as lastName,
        role,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users 
      WHERE id = ?
    `;

    return await queryExecutor.executeOne<User>(query, [id]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT 
        id,
        email,
        password,
        first_name as firstName,
        last_name as lastName,
        role,
        is_active as isActive
      FROM users 
      WHERE email = ?
    `;

    return await queryExecutor.executeOne<User>(query, [email]);
  }

  async update(id: string, updateData: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updateData.email !== undefined) {
      fields.push("email = ?");
      params.push(updateData.email);
    }

    if (updateData.firstName !== undefined) {
      fields.push("first_name = ?");
      params.push(updateData.firstName);
    }

    if (updateData.lastName !== undefined) {
      fields.push("last_name = ?");
      params.push(updateData.lastName);
    }

    if (updateData.role !== undefined) {
      fields.push("role = ?");
      params.push(updateData.role);
    }

    if (updateData.isActive !== undefined) {
      fields.push("is_active = ?");
      params.push(updateData.isActive);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push("updated_at = NOW()");
    params.push(id);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    await queryExecutor.execute(query, params);

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const query = "DELETE FROM users WHERE id = ?";
    const result = await queryExecutor.execute(query, [id]);

    return (result.meta.affectedRows || 0) > 0;
  }

  async findAll(
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
    const { pagination = {}, search, role, isActive } = options;

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(
        "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)"
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      conditions.push("role = ?");
      params.push(role);
    }

    if (isActive !== undefined) {
      conditions.push("is_active = ?");
      params.push(isActive);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await queryExecutor.executeOne<{ total: number }>(
      countQuery,
      params
    );
    const totalCount = countResult?.total || 0;

    // Calculate pagination
    const paginationResult = calculatePagination(totalCount, pagination);

    // Get users
    const usersQuery = `
      SELECT 
        id,
        email,
        first_name as firstName,
        last_name as lastName,
        role,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const usersParams = [
      ...params,
      paginationResult.limit,
      paginationResult.offset,
    ];
    const usersResult = await queryExecutor.execute<Omit<User, "password">>(
      usersQuery,
      usersParams
    );

    return {
      users: usersResult.data,
      pagination: {
        page: paginationResult.page,
        limit: paginationResult.limit,
        totalPages: paginationResult.totalPages,
        hasNext: paginationResult.hasNext,
        hasPrevious: paginationResult.hasPrevious,
      },
    };
  }

  async exists(email: string): Promise<boolean> {
    const query = "SELECT 1 FROM users WHERE email = ? LIMIT 1";
    const result = await queryExecutor.execute(query, [email]);

    return result.data.length > 0;
  }
}

export const userQuery = UserQuery.getInstance();
