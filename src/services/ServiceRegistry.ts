import { ServiceContainer } from './container/ServiceContainer';
import { SERVICE_TOKENS } from './interfaces';
import { LocalStorageService, InMemoryStorageService } from './implementations/StorageService';
import { SonnerNotificationService, ConsoleNotificationService } from './implementations/NotificationService';
import { authServiceAdapter } from './adapters/AuthServiceAdapter';

/**
 * Service registry for configuring dependency injection
 */
export class ServiceRegistry {
  /**
   * Register all services for production environment
   */
  static registerProductionServices(container: ServiceContainer): void {
    // Storage service - use localStorage in production
    container.registerSingleton(SERVICE_TOKENS.STORAGE, () => {
      const storage = new LocalStorageService('taskweave_');

      // Fallback to in-memory if localStorage is unavailable
      if (!storage.isAvailable()) {
        console.warn('localStorage unavailable, using in-memory storage');
        return new InMemoryStorageService('taskweave_');
      }

      return storage;
    });

    // Notification service - use Sonner toast in production
    container.registerSingleton(SERVICE_TOKENS.NOTIFICATION, () => {
      return new SonnerNotificationService();
    });

    // Authentication service - use adapter for consistency
    container.registerSingleton(SERVICE_TOKENS.AUTHENTICATION, () => {
      return authServiceAdapter.getAuthService();
    });

    // Additional services can be registered here as needed
  }

  /**
   * Register all services for testing environment
   */
  static registerTestServices(container: ServiceContainer): void {
    // Storage service - use in-memory for tests
    container.registerSingleton(SERVICE_TOKENS.STORAGE, () => {
      return new InMemoryStorageService('test_');
    });

    // Notification service - use console for tests
    container.registerSingleton(SERVICE_TOKENS.NOTIFICATION, () => {
      return new ConsoleNotificationService();
    });

    // Authentication service - use adapter for consistency
    container.registerSingleton(SERVICE_TOKENS.AUTHENTICATION, () => {
      return authServiceAdapter.getAuthService();
    });
  }

  /**
   * Register all services for development environment
   */
  static registerDevelopmentServices(container: ServiceContainer): void {
    // Use production services but with additional logging
    this.registerProductionServices(container);

    // Override notification service to also log to console
    container.registerSingleton(SERVICE_TOKENS.NOTIFICATION, () => {
      return new class extends SonnerNotificationService {
        success(message: string): void {
          console.log(`[NOTIFICATION] Success: ${message}`);
          super.success(message);
        }

        error(message: string): void {
          console.error(`[NOTIFICATION] Error: ${message}`);
          super.error(message);
        }

        info(message: string): void {
          console.info(`[NOTIFICATION] Info: ${message}`);
          super.info(message);
        }

        warning(message: string): void {
          console.warn(`[NOTIFICATION] Warning: ${message}`);
          super.warning(message);
        }
      }();
    });
  }

  /**
   * Auto-register services based on environment
   */
  static registerServices(container: ServiceContainer, environment?: string): void {
    const env = environment || process.env.NODE_ENV || 'development';

    switch (env) {
      case 'production':
        this.registerProductionServices(container);
        break;
      case 'test':
        this.registerTestServices(container);
        break;
      case 'development':
      default:
        this.registerDevelopmentServices(container);
        break;
    }
  }

  /**
   * Validate that all required services are registered
   */
  static validateServiceRegistration(container: ServiceContainer): void {
    const requiredServices = [
      SERVICE_TOKENS.STORAGE,
      SERVICE_TOKENS.NOTIFICATION,
      SERVICE_TOKENS.AUTHENTICATION,
    ];

    const missingServices = requiredServices.filter(
      token => !container.isRegistered(token)
    );

    if (missingServices.length > 0) {
      throw new Error(
        `Missing required services: ${missingServices.join(', ')}`
      );
    }
  }
}
