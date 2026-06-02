export enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  PIN_INVALID = 'PIN_INVALID',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  SALE_NOT_FOUND = 'SALE_NOT_FOUND',
  SHIFT_NOT_FOUND = 'SHIFT_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  STOCK_ITEM_NOT_FOUND = 'STOCK_ITEM_NOT_FOUND',
  STORE_NOT_FOUND = 'STORE_NOT_FOUND',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  SHIFT_ALREADY_OPEN = 'SHIFT_ALREADY_OPEN',
  SHIFT_ALREADY_CLOSED = 'SHIFT_ALREADY_CLOSED',
  SHIFT_NOT_OPEN = 'SHIFT_NOT_OPEN',
  SALE_ALREADY_VOIDED = 'SALE_ALREADY_VOIDED',
  PAYMENT_AMOUNT_MISMATCH = 'PAYMENT_AMOUNT_MISMATCH',
  DUPLICATE_BARCODE = 'DUPLICATE_BARCODE',
  DUPLICATE_OFFLINE_SALE = 'DUPLICATE_OFFLINE_SALE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export type ErrorDetails = readonly unknown[];

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: ErrorDetails;

  /**
   * Creates an application error.
   * @param code Machine-readable error code.
   * @param message Human-readable error message.
   * @param statusCode HTTP status code.
   * @param details Optional structured details.
   * @returns AppError instance.
   */
  public constructor(code: ErrorCode, message: string, statusCode: number, details: ErrorDetails = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  /**
   * Creates a validation error.
   * @param details Validation details.
   * @returns ValidationError instance.
   */
  public constructor(details: ErrorDetails) {
    super(ErrorCode.VALIDATION_ERROR, 'Validation error', 400, details);
  }
}

export class NotFoundError extends AppError {
  /**
   * Creates a not found error.
   * @param code Machine-readable error code.
   * @param message Human-readable error message.
   * @returns NotFoundError instance.
   */
  public constructor(code: ErrorCode, message: string) {
    super(code, message, 404);
  }
}

export class ForbiddenError extends AppError {
  /**
   * Creates a forbidden error.
   * @returns ForbiddenError instance.
   */
  public constructor() {
    super(ErrorCode.FORBIDDEN, 'Forbidden', 403);
  }
}

export class UnauthorizedError extends AppError {
  /**
   * Creates an unauthorized error.
   * @returns UnauthorizedError instance.
   */
  public constructor() {
    super(ErrorCode.UNAUTHORIZED, 'Unauthorized', 401);
  }
}
