import { toast } from 'sonner';
import { INotificationService } from '../interfaces';

/**
 * Sonner-based notification service implementation
 */
export class SonnerNotificationService implements INotificationService {
  success(message: string): void {
    toast.success(message);
  }

  error(message: string): void {
    toast.error(message);
  }

  info(message: string): void {
    toast.info(message);
  }

  warning(message: string): void {
    toast.warning(message);
  }

  loading(message: string): string {
    const id = toast.loading(message);
    return String(id);
  }

  dismiss(id: string): void {
    toast.dismiss(id);
  }

  /**
   * Show a custom toast with duration
   */
  custom(message: string, duration?: number): void {
    toast(message, { duration });
  }

  /**
   * Show a promise-based toast
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> {
    return toast.promise(promise, messages);
  }
}

/**
 * Console-based notification service for testing or development
 */
export class ConsoleNotificationService implements INotificationService {
  private logWithTimestamp(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  }

  success(message: string): void {
    this.logWithTimestamp('success', message);
  }

  error(message: string): void {
    this.logWithTimestamp('error', message);
  }

  info(message: string): void {
    this.logWithTimestamp('info', message);
  }

  warning(message: string): void {
    this.logWithTimestamp('warning', message);
  }

  loading(message: string): string {
    const id = `loading_${Date.now()}`;
    this.logWithTimestamp('loading', `${message} (ID: ${id})`);
    return id;
  }

  dismiss(id: string): void {
    this.logWithTimestamp('dismiss', `Dismissed notification: ${id}`);
  }
}

/**
 * No-op notification service for scenarios where notifications should be suppressed
 */
export class NoOpNotificationService implements INotificationService {
  success(): void {
    // No operation
  }

  error(): void {
    // No operation
  }

  info(): void {
    // No operation
  }

  warning(): void {
    // No operation
  }

  loading(): string {
    return 'noop';
  }

  dismiss(): void {
    // No operation
  }
}
