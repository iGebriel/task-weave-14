import { 
  ILoggerService, 
  INotificationService, 
  IAnalyticsService,
  IStorageService 
} from '@/services/interfaces';
import { 
  AppError, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorUtils,
  NetworkError,
  AuthenticationError,
  ValidationError 
} from '@/services/errors/ErrorTypes';

/**
 * Error handling service interface
 */
export interface IErrorHandlingService {
  handleError(error: unknown, context?: ErrorContext): Promise<void>;
  handleNetworkError(error: unknown, url?: string, method?: string): Promise<void>;
  handleValidationError(errors: ValidationResult[]): Promise<void>;
  handleBusinessError(message: string, code?: string, details?: Record<string, any>): Promise<void>;
  reportError(error: AppError): Promise<void>;
  shouldRetry(error: unknown): boolean;
  getRetryDelay(attempt: number, error?: unknown): number;
}

/**
 * Context information for error handling
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

/**
 * Error handling configuration
 */
interface ErrorHandlingConfig {
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  reportingEnabled: boolean;
  notificationEnabled: boolean;
  debugMode: boolean;
}

/**
 * Centralized error handling service
 */
export class ErrorHandlingService implements IErrorHandlingService {
  private config: ErrorHandlingConfig;
  private errorQueue: AppError[] = [];
  private isProcessingQueue = false;

  constructor(
    private logger: ILoggerService,
    private notification: INotificationService,
    private analytics: IAnalyticsService,
    private storage: IStorageService,
    config?: Partial<ErrorHandlingConfig>
  ) {
    this.config = {
      maxRetries: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 10000,
      reportingEnabled: true,
      notificationEnabled: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config,
    };

    // Process error queue periodically
    this.startQueueProcessor();
  }

  /**
   * Main error handling method
   */
  async handleError(error: unknown, context?: ErrorContext): Promise<void> {
    const appError = ErrorUtils.toAppError(error);
    const errorWithContext = this.enrichErrorWithContext(appError, context);

    // Log the error
    this.logError(errorWithContext);

    // Show user notification if appropriate
    if (this.config.notificationEnabled && this.shouldShowNotification(errorWithContext)) {
      this.showUserNotification(errorWithContext);
    }

    // Track error in analytics
    if (errorWithContext.severity !== ErrorSeverity.LOW) {
      this.trackError(errorWithContext, context);
    }

    // Queue error for reporting
    if (this.config.reportingEnabled && errorWithContext.shouldReport()) {
      this.queueErrorForReporting(errorWithContext);
    }

    // Store error for debugging if in debug mode
    if (this.config.debugMode) {
      this.storeErrorForDebug(errorWithContext);
    }
  }

  /**
   * Handle network-specific errors
   */
  async handleNetworkError(error: unknown, url?: string, method?: string): Promise<void> {
    let networkError: NetworkError;

    if (error instanceof NetworkError) {
      networkError = error;
    } else if (error instanceof Error) {
      // Try to extract status code from common error formats
      const statusCode = this.extractStatusCode(error);
      networkError = new NetworkError(error.message, statusCode, url, { method });
    } else {
      networkError = new NetworkError('Network request failed', undefined, url, { method });
    }

    await this.handleError(networkError, {
      component: 'NetworkLayer',
      action: method || 'request',
      metadata: { url, method }
    });
  }

  /**
   * Handle validation errors with field-specific details
   */
  async handleValidationError(errors: ValidationResult[]): Promise<void> {
    const primaryError = errors[0];
    const validationError = new ValidationError(
      primaryError.message,
      primaryError.field,
      primaryError.value,
      primaryError.constraint
    );

    // Add all validation errors to details
    validationError.details = {
      ...validationError.details,
      validationErrors: errors,
      fieldCount: errors.length,
    };

    await this.handleError(validationError, {
      component: 'Validation',
      action: 'validate',
      metadata: { fieldCount: errors.length }
    });

    // Show field-specific notifications
    if (this.config.notificationEnabled && errors.length <= 3) {
      errors.forEach(error => {
        this.notification.error(`${error.field}: ${error.message}`);
      });
    }
  }

  /**
   * Handle business logic errors
   */
  async handleBusinessError(
    message: string, 
    code?: string, 
    details?: Record<string, any>
  ): Promise<void> {
    const businessError = new AppError(
      message,
      ErrorCategory.BUSINESS,
      ErrorSeverity.MEDIUM,
      code,
      details
    );

    await this.handleError(businessError, {
      component: 'BusinessLogic',
      action: code || 'business_rule'
    });
  }

  /**
   * Report error to external services
   */
  async reportError(error: AppError): Promise<void> {
    try {
      const errorReport = {
        ...error.toJSON(),
        environment: process.env.NODE_ENV,
        userAgent: navigator?.userAgent,
        url: window?.location?.href,
        reportedAt: new Date().toISOString(),
      };

      // In a real application, send to error reporting service
      console.info('[ErrorHandling] Error report:', errorReport);
      
      // Could integrate with services like Sentry, Bugsnag, etc.
      // await this.sendToErrorReportingService(errorReport);
      
    } catch (reportingError) {
      this.logger.error('Failed to report error', reportingError as Error, {
        originalErrorId: error.correlationId
      });
    }
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error: unknown): boolean {
    if (!ErrorUtils.isRecoverable(error)) {
      return false;
    }

    if (error instanceof NetworkError) {
      // Retry on server errors and connectivity issues
      return error.isServerError() || error.isConnectivityError();
    }

    if (error instanceof AuthenticationError) {
      // Don't retry auth errors automatically
      return false;
    }

    if (error instanceof AppError) {
      return error.recoverable && error.severity !== ErrorSeverity.CRITICAL;
    }

    return true; // Default to retryable for unknown errors
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(attempt: number, error?: unknown): number {
    const baseDelay = this.config.baseRetryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    return Math.min(
      exponentialDelay + jitter,
      this.config.maxRetryDelay
    );
  }

  /**
   * Enrich error with contextual information
   */
  private enrichErrorWithContext(error: AppError, context?: ErrorContext): AppError {
    if (!context) return error;

    error.details = {
      ...error.details,
      context: {
        component: context.component,
        action: context.action,
        userId: context.userId,
        sessionId: context.sessionId,
        ...context.metadata,
      }
    };

    return error;
  }

  /**
   * Log error using the logger service
   */
  private logError(error: AppError): void {
    const logMethod = this.getLogMethod(error.severity);
    
    this.logger[logMethod](
      `[${error.category}] ${error.message}`,
      error,
      {
        errorId: error.correlationId,
        code: error.code,
        severity: error.severity,
        recoverable: error.recoverable,
      }
    );
  }

  /**
   * Get appropriate log method based on severity
   */
  private getLogMethod(severity: ErrorSeverity): keyof ILoggerService {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Determine if user notification should be shown
   */
  private shouldShowNotification(error: AppError): boolean {
    // Don't show notifications for low severity errors
    if (error.severity === ErrorSeverity.LOW) {
      return false;
    }

    // Don't spam users with repeated notifications
    const recentErrors = this.getRecentErrors();
    const similarErrors = recentErrors.filter(e => 
      e.category === error.category && e.code === error.code
    );

    return similarErrors.length <= 2; // Max 2 similar errors in recent timeframe
  }

  /**
   * Show user-friendly notification
   */
  private showUserNotification(error: AppError): void {
    const message = error.getUserMessage();
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.notification.error(message);
        break;
      case ErrorSeverity.HIGH:
        this.notification.error(message);
        break;
      case ErrorSeverity.MEDIUM:
        this.notification.warning(message);
        break;
      default:
        this.notification.info(message);
    }
  }

  /**
   * Track error in analytics
   */
  private trackError(error: AppError, context?: ErrorContext): void {
    this.analytics.track('error_occurred', {
      errorId: error.correlationId,
      category: error.category,
      severity: error.severity,
      code: error.code,
      recoverable: error.recoverable,
      component: context?.component,
      action: context?.action,
    });
  }

  /**
   * Queue error for batch reporting
   */
  private queueErrorForReporting(error: AppError): void {
    this.errorQueue.push(error);
    
    // Process queue immediately for critical errors
    if (error.severity === ErrorSeverity.CRITICAL && !this.isProcessingQueue) {
      this.processErrorQueue();
    }
  }

  /**
   * Store error for debugging purposes
   */
  private storeErrorForDebug(error: AppError): void {
    try {
      const debugErrors = this.storage.getItem<AppError[]>('debug_errors') || [];
      debugErrors.push(error);
      
      // Keep only last 50 errors
      if (debugErrors.length > 50) {
        debugErrors.splice(0, debugErrors.length - 50);
      }
      
      this.storage.setItem('debug_errors', debugErrors);
    } catch (storageError) {
      // Ignore storage errors when storing debug info
      this.logger.warn('Failed to store debug error', storageError as Error);
    }
  }

  /**
   * Extract status code from error object
   */
  private extractStatusCode(error: Error): number | undefined {
    // Handle common error object structures
    const errorAny = error as any;
    
    if (errorAny.status) return errorAny.status;
    if (errorAny.statusCode) return errorAny.statusCode;
    if (errorAny.code && typeof errorAny.code === 'number') return errorAny.code;
    
    // Try to parse from message
    const statusMatch = error.message.match(/status:?\s*(\d{3})/i);
    if (statusMatch) return parseInt(statusMatch[1], 10);
    
    return undefined;
  }

  /**
   * Get recent errors for duplicate detection
   */
  private getRecentErrors(): AppError[] {
    try {
      const debugErrors = this.storage.getItem<AppError[]>('debug_errors') || [];
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      return debugErrors.filter(error => 
        new Date(error.timestamp).getTime() > fiveMinutesAgo
      );
    } catch {
      return [];
    }
  }

  /**
   * Start periodic error queue processing
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.errorQueue.length > 0) {
        this.processErrorQueue();
      }
    }, 5000); // Process queue every 5 seconds
  }

  /**
   * Process queued errors for reporting
   */
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      const errorsToProcess = [...this.errorQueue];
      this.errorQueue = [];

      // Report errors in batches
      const batchSize = 10;
      for (let i = 0; i < errorsToProcess.length; i += batchSize) {
        const batch = errorsToProcess.slice(i, i + batchSize);
        await Promise.all(batch.map(error => this.reportError(error)));
      }
    } catch (processingError) {
      this.logger.error('Failed to process error queue', processingError as Error);
    } finally {
      this.isProcessingQueue = false;
    }
  }
}
