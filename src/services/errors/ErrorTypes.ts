/**
 * Custom error types for better error handling and categorization
 */

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS = 'business',
  SYSTEM = 'system',
  STORAGE = 'storage',
  EXTERNAL = 'external',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Base application error class with enhanced metadata
 */
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly correlationId: string;
  public readonly recoverable: boolean;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    details?: Record<string, any>,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.severity = severity;
    this.code = code || this.generateErrorCode();
    this.details = details;
    this.timestamp = new Date();
    this.correlationId = this.generateCorrelationId();
    this.recoverable = recoverable;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private generateErrorCode(): string {
    return `${this.category.toUpperCase()}_${Date.now()}`;
  }

  private generateCorrelationId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert error to a serializable object
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      recoverable: this.recoverable,
      stack: this.stack,
    };
  }

  /**
   * Check if this error should be reported to external services
   */
  shouldReport(): boolean {
    return this.severity === ErrorSeverity.HIGH || this.severity === ErrorSeverity.CRITICAL;
  }

  /**
   * Get user-friendly message based on category and context
   */
  getUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.AUTHENTICATION:
        return 'Please sign in to continue.';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.NETWORK:
        return 'Unable to connect. Please check your internet connection.';
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorCategory.STORAGE:
        return 'Unable to save data. Please try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}

/**
 * Authentication-specific errors
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string,
    code?: string,
    details?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      code,
      details,
      true
    );
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization-specific errors
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string,
    requiredPermission?: string,
    userPermissions?: string[]
  ) {
    super(
      message,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      undefined,
      { requiredPermission, userPermissions },
      false
    );
    this.name = 'AuthorizationError';
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  public readonly statusCode?: number;
  public readonly url?: string;

  constructor(
    message: string,
    statusCode?: number,
    url?: string,
    details?: Record<string, any>
  ) {
    const severity = statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    
    super(
      message,
      ErrorCategory.NETWORK,
      severity,
      `NET_${statusCode || 'UNKNOWN'}`,
      { ...details, statusCode, url },
      true
    );
    
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.url = url;
  }

  /**
   * Check if error is due to network connectivity issues
   */
  isConnectivityError(): boolean {
    return !this.statusCode || this.statusCode === 0;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode ? this.statusCode >= 500 : false;
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode ? this.statusCode >= 400 && this.statusCode < 500 : false;
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: any;
  public readonly constraint?: string;

  constructor(
    message: string,
    field?: string,
    value?: any,
    constraint?: string
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      `VAL_${field?.toUpperCase() || 'GENERIC'}`,
      { field, value, constraint },
      true
    );
    
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.constraint = constraint;
  }
}

/**
 * Business logic-related errors
 */
export class BusinessError extends AppError {
  constructor(
    message: string,
    code?: string,
    details?: Record<string, any>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ) {
    super(
      message,
      ErrorCategory.BUSINESS,
      severity,
      code,
      details,
      true
    );
    this.name = 'BusinessError';
  }
}

/**
 * Storage-related errors
 */
export class StorageError extends AppError {
  public readonly operation: 'read' | 'write' | 'delete' | 'clear';
  public readonly key?: string;

  constructor(
    message: string,
    operation: 'read' | 'write' | 'delete' | 'clear',
    key?: string,
    details?: Record<string, any>
  ) {
    super(
      message,
      ErrorCategory.STORAGE,
      ErrorSeverity.MEDIUM,
      `STORAGE_${operation.toUpperCase()}`,
      { ...details, operation, key },
      true
    );
    
    this.name = 'StorageError';
    this.operation = operation;
    this.key = key;
  }
}

/**
 * System-level errors
 */
export class SystemError extends AppError {
  constructor(
    message: string,
    details?: Record<string, any>,
    severity: ErrorSeverity = ErrorSeverity.CRITICAL
  ) {
    super(
      message,
      ErrorCategory.SYSTEM,
      severity,
      undefined,
      details,
      false
    );
    this.name = 'SystemError';
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly operation: string;

  constructor(
    message: string,
    service: string,
    operation: string,
    details?: Record<string, any>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ) {
    super(
      message,
      ErrorCategory.EXTERNAL,
      severity,
      `EXT_${service.toUpperCase()}_${operation.toUpperCase()}`,
      { ...details, service, operation },
      true
    );
    
    this.name = 'ExternalServiceError';
    this.service = service;
    this.operation = operation;
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Convert unknown error to AppError
   */
  static toAppError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(
        error.message,
        ErrorCategory.SYSTEM,
        ErrorSeverity.MEDIUM,
        undefined,
        { originalError: error.name, stack: error.stack }
      );
    }
    
    return new AppError(
      String(error),
      ErrorCategory.SYSTEM,
      ErrorSeverity.MEDIUM,
      undefined,
      { originalValue: error }
    );
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.recoverable;
    }
    return true; // Assume unknown errors are recoverable
  }

  /**
   * Get error severity level
   */
  static getSeverity(error: unknown): ErrorSeverity {
    if (error instanceof AppError) {
      return error.severity;
    }
    return ErrorSeverity.MEDIUM;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: unknown): string {
    if (error instanceof AppError) {
      return error.getUserMessage();
    }
    return 'Something went wrong. Please try again.';
  }

  /**
   * Check if error should be reported
   */
  static shouldReport(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.shouldReport();
    }
    return true; // Report unknown errors
  }

  /**
   * Extract error details for logging
   */
  static extractErrorDetails(error: unknown): Record<string, any> {
    if (error instanceof AppError) {
      return error.toJSON();
    }
    
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    return {
      error: String(error),
      type: typeof error,
    };
  }
}
