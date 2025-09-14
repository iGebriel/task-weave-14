import { IServiceContainer } from '../interfaces';

// Service registration information
interface ServiceRegistration {
  factory: () => any;
  lifetime: 'singleton' | 'transient' | 'instance';
  instance?: any;
}

/**
 * Dependency injection container implementation
 * Supports singleton, transient, and instance registration patterns
 */
export class ServiceContainer implements IServiceContainer {
  private services = new Map<string, ServiceRegistration>();
  private singletonInstances = new Map<string, any>();

  /**
   * Register a singleton service (created once and reused)
   */
  registerSingleton<T>(token: string, factory: () => T): void {
    this.services.set(token, {
      factory,
      lifetime: 'singleton',
    });
  }

  /**
   * Register a transient service (created each time it's resolved)
   */
  registerTransient<T>(token: string, factory: () => T): void {
    this.services.set(token, {
      factory,
      lifetime: 'transient',
    });
  }

  /**
   * Register an existing instance
   */
  registerInstance<T>(token: string, instance: T): void {
    this.services.set(token, {
      factory: () => instance,
      lifetime: 'instance',
      instance,
    });
  }

  /**
   * Resolve a service by token
   */
  resolve<T>(token: string): T {
    const service = this.tryResolve<T>(token);
    if (!service) {
      throw new Error(`Service '${token}' is not registered`);
    }
    return service;
  }

  /**
   * Try to resolve a service, returns null if not found
   */
  tryResolve<T>(token: string): T | null {
    const registration = this.services.get(token);
    if (!registration) {
      return null;
    }

    switch (registration.lifetime) {
      case 'instance':
        return registration.instance;

      case 'singleton':
        if (!this.singletonInstances.has(token)) {
          const instance = registration.factory();
          this.singletonInstances.set(token, instance);
        }
        return this.singletonInstances.get(token);

      case 'transient':
        return registration.factory();

      default:
        throw new Error(`Unknown service lifetime: ${registration.lifetime}`);
    }
  }

  /**
   * Check if a service is registered
   */
  isRegistered(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Clear all registrations and instances
   */
  clear(): void {
    this.services.clear();
    this.singletonInstances.clear();
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredTokens(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get registration information for debugging
   */
  getServiceInfo(token: string): ServiceRegistration | null {
    return this.services.get(token) || null;
  }
}

// Global container instance
let globalContainer: ServiceContainer | null = null;

/**
 * Get the global service container instance
 */
export const getContainer = (): ServiceContainer => {
  if (!globalContainer) {
    globalContainer = new ServiceContainer();
  }
  return globalContainer;
};

/**
 * Reset the global container (useful for testing)
 */
export const resetContainer = (): void => {
  globalContainer = null;
};

/**
 * Convenience function to resolve services from global container
 */
export const resolve = <T>(token: string): T => {
  return getContainer().resolve<T>(token);
};

/**
 * Convenience function to try resolve services from global container
 */
export const tryResolve = <T>(token: string): T | null => {
  return getContainer().tryResolve<T>(token);
};
