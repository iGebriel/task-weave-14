import React, { createContext, useContext, ReactNode } from 'react';
import { ServiceContainer } from '../container/ServiceContainer';
import { ServiceErrorBoundary } from '../error/ServiceErrorBoundary';
import {
  IStorageService,
  INotificationService,
  IAuthenticationService,
  IProjectService,
  ITaskService,
  INavigationService,
  IAnalyticsService,
  ILoggerService,
  IHttpService,
  SERVICE_TOKENS
} from '../interfaces';

// Service context interface
interface ServiceContextType {
  container: ServiceContainer;
  // Convenience accessors for commonly used services
  storage: IStorageService;
  notification: INotificationService;
  auth: IAuthenticationService;
  projects: IProjectService;
  tasks: ITaskService;
  navigation: INavigationService;
  analytics: IAnalyticsService;
  logger: ILoggerService;
  http: IHttpService;
}

// Create the context
const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

// Props for the provider
interface ServiceProviderProps {
  children: ReactNode;
  container?: ServiceContainer;
}

/**
 * Service provider component that makes services available to the component tree
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  container: providedContainer
}) => {
  // Use provided container or create a default one
  const container = providedContainer || new ServiceContainer();

  // Create convenience accessors for services with error handling
  const contextValue: ServiceContextType = {
    container,
    get storage() {
      try {
        return container.resolve<IStorageService>(SERVICE_TOKENS.STORAGE);
      } catch (error) {
        console.error('Failed to resolve storage service:', error);
        throw new Error('Storage service not available');
      }
    },
    get notification() {
      try {
        return container.resolve<INotificationService>(SERVICE_TOKENS.NOTIFICATION);
      } catch (error) {
        console.error('Failed to resolve notification service:', error);
        throw new Error('Notification service not available');
      }
    },
    get auth() {
      try {
        return container.resolve<IAuthenticationService>(SERVICE_TOKENS.AUTHENTICATION);
      } catch (error) {
        console.error('Failed to resolve authentication service:', error);
        throw new Error('Authentication service not available');
      }
    },
    get projects() {
      try {
        return container.resolve<IProjectService>(SERVICE_TOKENS.PROJECT);
      } catch (error) {
        console.error('Failed to resolve project service:', error);
        throw new Error('Project service not available');
      }
    },
    get tasks() {
      try {
        return container.resolve<ITaskService>(SERVICE_TOKENS.TASK);
      } catch (error) {
        console.error('Failed to resolve task service:', error);
        throw new Error('Task service not available');
      }
    },
    get navigation() {
      try {
        return container.resolve<INavigationService>(SERVICE_TOKENS.NAVIGATION);
      } catch (error) {
        console.error('Failed to resolve navigation service:', error);
        throw new Error('Navigation service not available');
      }
    },
    get analytics() {
      try {
        return container.resolve<IAnalyticsService>(SERVICE_TOKENS.ANALYTICS);
      } catch (error) {
        console.error('Failed to resolve analytics service:', error);
        throw new Error('Analytics service not available');
      }
    },
    get logger() {
      try {
        return container.resolve<ILoggerService>(SERVICE_TOKENS.LOGGER);
      } catch (error) {
        console.error('Failed to resolve logger service:', error);
        throw new Error('Logger service not available');
      }
    },
    get http() {
      try {
        return container.resolve<IHttpService>(SERVICE_TOKENS.HTTP);
      } catch (error) {
        console.error('Failed to resolve HTTP service:', error);
        throw new Error('HTTP service not available');
      }
    },
  };

  return (
    <ServiceErrorBoundary container={container}>
      <ServiceContext.Provider value={contextValue}>
        {children}
      </ServiceContext.Provider>
    </ServiceErrorBoundary>
  );
};

/**
 * Hook to access the service context
 * Throws an error if used outside of ServiceProvider
 */
export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

/**
 * Hook to access a specific service by token
 */
export const useService = <T,>(token: string): T => {
  const { container } = useServices();
  return container.resolve<T>(token);
};

/**
 * Hook to try accessing a service (returns null if not found)
 */
export const useTryService = <T,>(token: string): T | null => {
  const { container } = useServices();
  return container.tryResolve<T>(token);
};

/**
 * Hook to access storage service
 */
export const useStorage = (): IStorageService => {
  const { storage } = useServices();
  return storage;
};

/**
 * Hook to access notification service
 */
export const useNotification = (): INotificationService => {
  const { notification } = useServices();
  return notification;
};

/**
 * Hook to access authentication service
 */
export const useAuth = (): IAuthenticationService => {
  const { auth } = useServices();
  return auth;
};

/**
 * Hook to access project service
 */
export const useProjectService = (): IProjectService => {
  const { projects } = useServices();
  return projects;
};

/**
 * Hook to access task service
 */
export const useTaskService = (): ITaskService => {
  const { tasks } = useServices();
  return tasks;
};

/**
 * Hook to access navigation service
 */
export const useNavigation = (): INavigationService => {
  const { navigation } = useServices();
  return navigation;
};

/**
 * Hook to access analytics service
 */
export const useAnalytics = (): IAnalyticsService => {
  const { analytics } = useServices();
  return analytics;
};

/**
 * Hook to access logger service
 */
export const useLogger = (): ILoggerService => {
  const { logger } = useServices();
  return logger;
};

/**
 * Hook to access HTTP service
 */
export const useHttp = (): IHttpService => {
  const { http } = useServices();
  return http;
};

/**
 * Higher-order component to inject services as props
 */
export const withServices = <P extends object,>(
  Component: React.ComponentType<P & ServiceContextType>
): React.FC<P> => {
  return (props: P) => {
    const services = useServices();
    return <Component {...props} {...services} />;
  };
};
