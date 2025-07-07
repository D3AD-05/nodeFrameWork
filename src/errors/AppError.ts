import { ErrorType, HttpStatusCode } from "./error.types";

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_SERVER_ERROR,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);

    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Static methods for common errors
  static badRequest(message: string, context?: any): AppError {
    return new AppError(
      message,
      ErrorType.BAD_REQUEST_ERROR,
      HttpStatusCode.BAD_REQUEST,
      true,
      context
    );
  }

  static unauthorized(
    message: string = "Unauthorized",
    context?: any
  ): AppError {
    return new AppError(
      message,
      ErrorType.AUTHENTICATION_ERROR,
      HttpStatusCode.UNAUTHORIZED,
      true,
      context
    );
  }

  static forbidden(message: string = "Forbidden", context?: any): AppError {
    return new AppError(
      message,
      ErrorType.AUTHORIZATION_ERROR,
      HttpStatusCode.FORBIDDEN,
      true,
      context
    );
  }

  static notFound(
    message: string = "Resource not found",
    context?: any
  ): AppError {
    return new AppError(
      message,
      ErrorType.NOT_FOUND_ERROR,
      HttpStatusCode.NOT_FOUND,
      true,
      context
    );
  }

  static conflict(message: string, context?: any): AppError {
    return new AppError(
      message,
      ErrorType.DUPLICATE_ERROR,
      HttpStatusCode.CONFLICT,
      true,
      context
    );
  }

  static validation(message: string, context?: any): AppError {
    return new AppError(
      message,
      ErrorType.VALIDATION_ERROR,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      true,
      context
    );
  }

  static database(message: string, context?: any): AppError {
    return new AppError(
      message,
      ErrorType.DATABASE_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      true,
      context
    );
  }

  static internal(
    message: string = "Internal server error",
    context?: any
  ): AppError {
    return new AppError(
      message,
      ErrorType.INTERNAL_SERVER_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      false,
      context
    );
  }
}
