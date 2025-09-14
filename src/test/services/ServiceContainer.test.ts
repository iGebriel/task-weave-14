import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer } from '@/services/container/ServiceContainer';
import { SERVICE_TOKENS } from '@/services/interfaces';
import { MockStorageService, MockNotificationService } from '../mocks/services';

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe('singleton registration', () => {
    it('should register and resolve singleton services', () => {
      const factory = () => new MockStorageService();
      container.registerSingleton(SERVICE_TOKENS.STORAGE, factory);

      const service1 = container.resolve(SERVICE_TOKENS.STORAGE);
      const service2 = container.resolve(SERVICE_TOKENS.STORAGE);

      expect(service1).toBeInstanceOf(MockStorageService);
      expect(service2).toBe(service1); // Should be the same instance
    });

    it('should create singleton instance only once', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return new MockStorageService();
      };

      container.registerSingleton(SERVICE_TOKENS.STORAGE, factory);

      container.resolve(SERVICE_TOKENS.STORAGE);
      container.resolve(SERVICE_TOKENS.STORAGE);
      container.resolve(SERVICE_TOKENS.STORAGE);

      expect(callCount).toBe(1);
    });
  });

  describe('transient registration', () => {
    it('should register and resolve transient services', () => {
      const factory = () => new MockStorageService();
      container.registerTransient(SERVICE_TOKENS.STORAGE, factory);

      const service1 = container.resolve(SERVICE_TOKENS.STORAGE);
      const service2 = container.resolve(SERVICE_TOKENS.STORAGE);

      expect(service1).toBeInstanceOf(MockStorageService);
      expect(service2).toBeInstanceOf(MockStorageService);
      expect(service2).not.toBe(service1); // Should be different instances
    });

    it('should create new instance each time for transient services', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return new MockStorageService();
      };

      container.registerTransient(SERVICE_TOKENS.STORAGE, factory);

      container.resolve(SERVICE_TOKENS.STORAGE);
      container.resolve(SERVICE_TOKENS.STORAGE);
      container.resolve(SERVICE_TOKENS.STORAGE);

      expect(callCount).toBe(3);
    });
  });

  describe('instance registration', () => {
    it('should register and resolve instance services', () => {
      const instance = new MockStorageService();
      container.registerInstance(SERVICE_TOKENS.STORAGE, instance);

      const service1 = container.resolve(SERVICE_TOKENS.STORAGE);
      const service2 = container.resolve(SERVICE_TOKENS.STORAGE);

      expect(service1).toBe(instance);
      expect(service2).toBe(instance); // Should be the same instance
    });
  });

  describe('service resolution', () => {
    it('should throw error when resolving unregistered service', () => {
      expect(() => {
        container.resolve('UnregisteredService');
      }).toThrow("Service 'UnregisteredService' is not registered");
    });

    it('should return null when trying to resolve unregistered service', () => {
      const result = container.tryResolve('UnregisteredService');
      expect(result).toBeNull();
    });

    it('should resolve registered services successfully', () => {
      const instance = new MockStorageService();
      container.registerInstance(SERVICE_TOKENS.STORAGE, instance);

      const resolved = container.tryResolve(SERVICE_TOKENS.STORAGE);
      expect(resolved).toBe(instance);
    });
  });

  describe('service registration checks', () => {
    it('should correctly report registration status', () => {
      expect(container.isRegistered(SERVICE_TOKENS.STORAGE)).toBe(false);

      container.registerInstance(SERVICE_TOKENS.STORAGE, new MockStorageService());

      expect(container.isRegistered(SERVICE_TOKENS.STORAGE)).toBe(true);
    });
  });

  describe('container management', () => {
    it('should clear all registrations and instances', () => {
      container.registerInstance(SERVICE_TOKENS.STORAGE, new MockStorageService());
      container.registerInstance(SERVICE_TOKENS.NOTIFICATION, new MockNotificationService());

      expect(container.isRegistered(SERVICE_TOKENS.STORAGE)).toBe(true);
      expect(container.isRegistered(SERVICE_TOKENS.NOTIFICATION)).toBe(true);

      container.clear();

      expect(container.isRegistered(SERVICE_TOKENS.STORAGE)).toBe(false);
      expect(container.isRegistered(SERVICE_TOKENS.NOTIFICATION)).toBe(false);
    });

    it('should get all registered service tokens', () => {
      container.registerInstance(SERVICE_TOKENS.STORAGE, new MockStorageService());
      container.registerInstance(SERVICE_TOKENS.NOTIFICATION, new MockNotificationService());

      const tokens = container.getRegisteredTokens();

      expect(tokens).toContain(SERVICE_TOKENS.STORAGE);
      expect(tokens).toContain(SERVICE_TOKENS.NOTIFICATION);
      expect(tokens).toHaveLength(2);
    });

    it('should get service registration information', () => {
      const instance = new MockStorageService();
      container.registerInstance(SERVICE_TOKENS.STORAGE, instance);

      const info = container.getServiceInfo(SERVICE_TOKENS.STORAGE);

      expect(info).toEqual({
        factory: expect.any(Function),
        lifetime: 'instance',
        instance,
      });
    });

    it('should return null for unregistered service info', () => {
      const info = container.getServiceInfo('UnregisteredService');
      expect(info).toBeNull();
    });
  });

  describe('complex dependency scenarios', () => {
    it('should handle multiple service types correctly', () => {
      const storageInstance = new MockStorageService();
      const notificationInstance = new MockNotificationService();

      container.registerInstance(SERVICE_TOKENS.STORAGE, storageInstance);
      container.registerSingleton(SERVICE_TOKENS.NOTIFICATION, () => notificationInstance);

      const storage = container.resolve(SERVICE_TOKENS.STORAGE);
      const notification1 = container.resolve(SERVICE_TOKENS.NOTIFICATION);
      const notification2 = container.resolve(SERVICE_TOKENS.NOTIFICATION);

      expect(storage).toBe(storageInstance);
      expect(notification1).toBe(notificationInstance);
      expect(notification2).toBe(notification1);
    });

    it('should allow service replacement', () => {
      const originalService = new MockStorageService();
      const replacementService = new MockStorageService();

      container.registerInstance(SERVICE_TOKENS.STORAGE, originalService);
      expect(container.resolve(SERVICE_TOKENS.STORAGE)).toBe(originalService);

      // Replace the service
      container.registerInstance(SERVICE_TOKENS.STORAGE, replacementService);
      expect(container.resolve(SERVICE_TOKENS.STORAGE)).toBe(replacementService);
    });
  });

  describe('error handling', () => {
    it('should handle factory errors gracefully', () => {
      const failingFactory = () => {
        throw new Error('Factory error');
      };

      container.registerTransient(SERVICE_TOKENS.STORAGE, failingFactory);

      expect(() => {
        container.resolve(SERVICE_TOKENS.STORAGE);
      }).toThrow('Factory error');
    });

    it('should handle singleton factory errors gracefully', () => {
      const failingFactory = () => {
        throw new Error('Singleton factory error');
      };

      container.registerSingleton(SERVICE_TOKENS.STORAGE, failingFactory);

      expect(() => {
        container.resolve(SERVICE_TOKENS.STORAGE);
      }).toThrow('Singleton factory error');

      // Second resolution should also throw (no partial state)
      expect(() => {
        container.resolve(SERVICE_TOKENS.STORAGE);
      }).toThrow('Singleton factory error');
    });
  });
});
