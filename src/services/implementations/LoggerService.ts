import { ILoggerService } from '../interfaces';

/**
 * Console-based logger service implementation
 */
export class ConsoleLoggerService implements ILoggerService {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private appName = 'TaskWeave';

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${this.appName}] ${level}: ${message}${metaString}`;
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    console.info(this.formatMessage('INFO', message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  error(message: string, error?: Error, meta?: any): void {
    const errorMeta = error ? { 
      error: {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      },
      ...meta 
    } : meta;
    
    console.error(this.formatMessage('ERROR', message, errorMeta));
  }
}

/**
 * No-op logger service for production or when logging should be disabled
 */
export class NoOpLoggerService implements ILoggerService {
  debug(): void {
    // No operation
  }

  info(): void {
    // No operation
  }

  warn(): void {
    // No operation
  }

  error(): void {
    // No operation
  }
}