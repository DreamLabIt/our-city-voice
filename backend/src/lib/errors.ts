/**
 * The one error type the app throws on purpose.
 *
 * Services throw `AppError`, the error middleware turns it into a response.
 * Anything else that reaches the middleware is treated as a bug and becomes a
 * generic 500, so an internal message never leaks to a client.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown;
  /** True for errors we raised deliberately, as opposed to crashes. */
  public readonly isOperational = true;

  constructor(
    statusCode: number,
    message: string,
    code = "APP_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, message, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "You do not have access to this resource"): AppError {
    return new AppError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(404, message, "NOT_FOUND");
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(409, message, "CONFLICT", details);
  }

  static tooManyRequests(message = "Too many requests"): AppError {
    return new AppError(429, message, "TOO_MANY_REQUESTS");
  }

  static serviceUnavailable(message: string, details?: unknown): AppError {
    return new AppError(503, message, "SERVICE_UNAVAILABLE", details);
  }
}
