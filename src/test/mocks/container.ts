import { ServiceContainer } from '@/services/container/ServiceContainer';
import { SERVICE_TOKENS } from '@/services/interfaces';
import { createMockServices, resetAllMockServices } from './services';

/**
 * Test service container that provides mock implementations for testing
 */
export class TestServiceContainer extends ServiceContainer {
  private mockServices: ReturnType<typeof createMockServices>;

  constructor() {
    super();
    this.mockServices = createMockServices();
    this.registerMockServices();
  }

  /**
   * Register all mock services with the container
   */
  private registerMockServices(): void {
    this.registerInstance(SERVICE_TOKENS.STORAGE, this.mockServices.storage);
    this.registerInstance(SERVICE_TOKENS.NOTIFICATION, this.mockServices.notification);
    this.registerInstance(SERVICE_TOKENS.AUTHENTICATION, this.mockServices.authentication);
    this.registerInstance(SERVICE_TOKENS.PROJECT, this.mockServices.project);
    this.registerInstance(SERVICE_TOKENS.TASK, this.mockServices.task);
    this.registerInstance(SERVICE_TOKENS.NAVIGATION, this.mockServices.navigation);
    this.registerInstance(SERVICE_TOKENS.ANALYTICS, this.mockServices.analytics);
    this.registerInstance(SERVICE_TOKENS.LOGGER, this.mockServices.logger);
    this.registerInstance(SERVICE_TOKENS.HTTP, this.mockServices.http);
  }

  /**
   * Get mock services for direct manipulation in tests
   */
  getMockServices() {
    return this.mockServices;
  }

  /**
   * Reset all mock services to their initial state
   */
  resetAllMocks(): void {
    resetAllMockServices(this.mockServices);
  }

  /**
   * Override a specific service for testing
   */
  overrideService<T>(token: string, service: T): void {
    this.registerInstance(token, service);
  }

  /**
   * Clear container and reinitialize with fresh mocks
   */
  resetContainer(): void {
    this.clear();
    this.mockServices = createMockServices();
    this.registerMockServices();
  }
}

// Global test container instance
let testContainer: TestServiceContainer | null = null;

/**
 * Get the global test container instance
 */
export const getTestContainer = (): TestServiceContainer => {
  if (!testContainer) {
    testContainer = new TestServiceContainer();
  }
  return testContainer;
};

/**
 * Reset the global test container
 */
export const resetTestContainer = () => {
  if (testContainer) {
    testContainer.resetContainer();
  } else {
    testContainer = new TestServiceContainer();
  }
};

/**
 * Convenience function to get mock services from global test container
 */
export const getMockServices = () => {
  return getTestContainer().getMockServices();
};

/**
 * Convenience function to reset all mocks
 */
export const resetAllTestMocks = () => {
  getTestContainer().resetAllMocks();
};
