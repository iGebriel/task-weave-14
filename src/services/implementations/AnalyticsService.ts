import { IAnalyticsService } from '../interfaces';

/**
 * Console analytics service for development
 */
export class ConsoleAnalyticsService implements IAnalyticsService {
  private isDevelopment = process.env.NODE_ENV === 'development';

  track(event: string, properties?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log(`[Analytics] Track: ${event}`, properties);
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log(`[Analytics] Identify: ${userId}`, traits);
    }
  }

  page(name?: string, properties?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log(`[Analytics] Page: ${name || 'unknown'}`, properties);
    }
  }

  group(groupId: string, traits?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log(`[Analytics] Group: ${groupId}`, traits);
    }
  }
}

/**
 * No-op analytics service for production (privacy-focused)
 */
export class NoOpAnalyticsService implements IAnalyticsService {
  track(): void {
    // No operation - respecting user privacy
  }

  identify(): void {
    // No operation - respecting user privacy
  }

  page(): void {
    // No operation - respecting user privacy
  }

  group(): void {
    // No operation - respecting user privacy
  }
}