/**
 * Service setup and configuration
 * Bootstraps the dependency injection container with all services
 */

import { getContainer } from './container/ServiceContainer';
import { SERVICE_TOKENS } from './interfaces';

// Service implementations
import { authServiceAdapter } from './adapters/AuthServiceAdapter';
import { LocalStorageService } from './implementations/StorageService';
import { SonnerNotificationService } from './implementations/NotificationService';
import { DIProjectService } from './implementations/DIProjectService';
import { DITaskService } from './implementations/DITaskService';
import { BrowserNavigationService } from './implementations/NavigationService';
import { ConsoleAnalyticsService } from './implementations/AnalyticsService';
import { ConsoleLoggerService } from './implementations/LoggerService';
import { HttpService } from './implementations/HttpService';

/**
 * Set up and configure all services in the container
 */
export const setupServices = () => {
  const container = getContainer();

  // Register core services as singletons
  container.registerSingleton(SERVICE_TOKENS.STORAGE, () => new LocalStorageService());
  container.registerSingleton(SERVICE_TOKENS.NOTIFICATION, () => new SonnerNotificationService());

  // Register authentication service (singleton)
  container.registerSingleton(SERVICE_TOKENS.AUTHENTICATION, () => {
    return authServiceAdapter.getAuthService();
  });

  // Register project service with dependencies
  container.registerSingleton(SERVICE_TOKENS.PROJECT, () => {
    const storage = container.resolve(SERVICE_TOKENS.STORAGE);
    const notification = container.resolve(SERVICE_TOKENS.NOTIFICATION);
    return new DIProjectService(storage, notification);
  });

  // Register task service with dependencies
  container.registerSingleton(SERVICE_TOKENS.TASK, () => {
    const storage = container.resolve(SERVICE_TOKENS.STORAGE);
    const notification = container.resolve(SERVICE_TOKENS.NOTIFICATION);
    return new DITaskService(storage, notification);
  });

  // Register other services
  container.registerSingleton(SERVICE_TOKENS.NAVIGATION, () => new BrowserNavigationService());
  container.registerSingleton(SERVICE_TOKENS.ANALYTICS, () => new ConsoleAnalyticsService());
  container.registerSingleton(SERVICE_TOKENS.LOGGER, () => new ConsoleLoggerService());
  container.registerSingleton(SERVICE_TOKENS.HTTP, () => new HttpService());

  return container;
};

/**
 * Get a configured service container
 */
export const getConfiguredContainer = () => {
  const container = getContainer();

  // Check if already configured
  if (!container.isRegistered(SERVICE_TOKENS.STORAGE)) {
    setupServices();
  }

  return container;
};
