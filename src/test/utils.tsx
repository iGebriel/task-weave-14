import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import type { User, Project, Task, Priority, TaskStatus, ProjectStatus } from '@/types';
import { ServiceProvider } from '@/services/context/ServiceContext';
import { getTestContainer, resetTestContainer, getMockServices } from './mocks/container';
import { TestServiceContainer } from './mocks/container';
import { SERVICE_TOKENS } from '@/services/interfaces';
import authReducer, { setUser } from '@/store/slices/authSlice';

// Re-export testing library utilities
export { screen, waitFor, act };

// Create a custom render function that includes providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface AllTheProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  serviceContainer?: TestServiceContainer;
  store?: any;
}

// Create a test Redux store
const createTestStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastLoginAttempt: null,
        ...initialState?.auth,
      },
      ...initialState,
    },
  });
};

const AllTheProviders = ({
  children,
  queryClient = createTestQueryClient(),
  serviceContainer = getTestContainer(),
  store = createTestStore()
}: AllTheProvidersProps) => {
  return (
    <Provider store={store}>
      <ServiceProvider container={serviceContainer}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </ServiceProvider>
    </Provider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  serviceContainer?: TestServiceContainer;
  store?: any;
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { queryClient, serviceContainer, store, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient} serviceContainer={serviceContainer} store={store}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Export both the original render (for direct usage) and our custom render
export { render as originalRender };

/**
 * Async render that waits for initial auth state to settle
 */
export const renderWithAuth = async (ui: ReactElement, options: CustomRenderOptions = {}) => {
  let renderResult: ReturnType<typeof render>;

  // Create a store that starts with non-loading state
  const store = options.store || createTestStore({
    auth: {
      user: null,
      isAuthenticated: false,
      isLoading: false, // Important: Don't start with loading state
      error: null,
      lastLoginAttempt: null,
    }
  });

  await act(async () => {
    renderResult = customRender(ui, { ...options, store });
  });

  // Wait for auth initialization to complete with increased timeout
  await waitFor(() => {
    // Either auth page or main app should be visible (not loading)
    const loadingText = screen.queryByText('Loading...');
    if (loadingText) {
      throw new Error('Still loading');
    }
  }, { timeout: 3000 }); // Increased timeout for React 18

  return renderResult!;
};

/**
 * Wait for authentication to resolve (either to auth page or main app)
 */
export const waitForAuthResolution = async (timeout = 3000) => {
  await waitFor(() => {
    const loadingText = screen.queryByText('Loading...');
    if (loadingText) {
      // Debug: log the current DOM state
      console.log('Still showing loading. Current DOM:', document.body.innerHTML.substring(0, 500) + '...');
      throw new Error('Still loading auth');
    }
  }, { timeout });

  // Additional small delay for any async effects to complete
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
};

// Mock data generators
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: undefined,
  role: 'owner',
  createdAt: new Date('2024-01-01'),
  projectsCount: 3,
  tasksCompleted: 15,
  ...overrides,
});

export const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: '1',
  name: 'Test Project',
  description: 'A test project for testing purposes',
  status: 'active' as ProjectStatus,
  isPublic: false,
  owner: 'John Doe',
  collaborators: 3,
  tasksCount: 10,
  completedTasks: 5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletionRequested: false,
  ...overrides,
});

export const createMockTask = (overrides?: Partial<Task>): Task => ({
  id: '1',
  title: 'Test Task',
  description: 'A test task for testing purposes',
  status: 'todo' as TaskStatus,
  priority: 'medium' as Priority,
  assignee: 'John Doe',
  assigneeId: '1',
  dueDate: new Date('2024-12-31'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  projectId: '1',
  columnId: '1',
  position: 0,
  tags: ['testing'],
  estimatedHours: 4,
  actualHours: 2,
  dependencies: [],
  attachments: [],
  ...overrides,
});

export const createMockColumn = (overrides?: Partial<any>) => ({
  id: '1',
  title: 'To Do',
  status: 'todo' as TaskStatus,
  position: 0,
  projectId: '1',
  taskIds: [],
  color: '#3b82f6',
  isCollapsed: false,
  taskLimit: undefined,
  ...overrides,
});

// Mock functions
export const createMockHandlers = () => ({
  onTaskUpdate: vi.fn(),
  onTaskDelete: vi.fn(),
  onTaskCreate: vi.fn(),
  onProjectUpdate: vi.fn(),
  onProjectDelete: vi.fn(),
  onProjectCreate: vi.fn(),
  onProjectSelect: vi.fn(),
  onAuthSuccess: vi.fn(),
  onLogout: vi.fn(),
  onUserUpdate: vi.fn(),
});

// Wait utilities
export const waitFor = (condition: () => boolean, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout after ${timeout}ms waiting for condition`));
      } else {
        setTimeout(check, 10);
      }
    };

    check();
  });
};

// DOM testing utilities
export const getElementByTestId = (testId: string) => {
  return document.querySelector(`[data-testid="${testId}"]`);
};

export const getAllElementsByTestId = (testId: string) => {
  return document.querySelectorAll(`[data-testid="${testId}"]`);
};

// Form testing utilities
export const fillForm = async (form: HTMLFormElement, data: Record<string, string>) => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();

  for (const [name, value] of Object.entries(data)) {
    const field = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement;
    if (field) {
      await user.clear(field);
      await user.type(field, value);
    }
  }
};

// Drag and drop testing utilities
export const createDragEvent = (type: string, dataTransfer: Record<string, string> = {}) => {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      setData: vi.fn(),
      getData: vi.fn((key) => dataTransfer[key] || ''),
      dropEffect: 'move',
      effectAllowed: 'move',
      items: [],
      types: Object.keys(dataTransfer),
    },
  });
  return event as DragEvent;
};

// Local storage mocking utilities
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    get storage() {
      return { ...storage };
    },
  };
};

// Async testing utilities
export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Wait for all async operations to complete (React 18 compatible)
 */
export const waitForAsyncOperations = async () => {
  await act(async () => {
    await flushPromises();
  });
  // Additional wait for React 18 batching
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
  });
};

/**
 * Render component with proper async handling for React 18
 */
export const renderWithAsyncHandling = async (ui: ReactElement, options: CustomRenderOptions = {}) => {
  let renderResult: ReturnType<typeof render>;

  await act(async () => {
    renderResult = customRender(ui, options);
  });

  // Wait for initial render to complete
  await waitForAsyncOperations();

  return renderResult!;
};

// Error boundary testing
export const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
};

// Network request mocking
export const createMockFetch = (responses: Record<string, any> = {}) => {
  return vi.fn((url: string) => {
    const response = responses[url];

    if (!response) {
      return Promise.reject(new Error(`No mock response for ${url}`));
    }

    return Promise.resolve({
      ok: response.ok !== false,
      status: response.status || 200,
      statusText: response.statusText || 'OK',
      json: () => Promise.resolve(response.data || response),
      text: () => Promise.resolve(JSON.stringify(response.data || response)),
    });
  });
};

// Re-export everything from RTL
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export our custom render as the default render
export { customRender as render };

// Service-specific testing utilities
/**
 * Setup function for tests that need dependency injection
 * Call this at the beginning of each test to get fresh mock services
 */
export const setupTestServices = () => {
  resetTestContainer();
  return getMockServices();
};

/**
 * Render component with custom service configuration
 */
export const renderWithServices = (
  ui: ReactElement,
  serviceOverrides?: Partial<ReturnType<typeof getMockServices>>,
  options?: CustomRenderOptions
) => {
  const container = getTestContainer();

  // Apply service overrides if provided
  if (serviceOverrides) {
    Object.entries(serviceOverrides).forEach(([key, service]) => {
      const tokenKey = key.toUpperCase() as keyof typeof SERVICE_TOKENS;
      if (SERVICE_TOKENS[tokenKey]) {
        container.overrideService(SERVICE_TOKENS[tokenKey], service);
      }
    });
  }

  return customRender(ui, { ...options, serviceContainer: container });
};

/**
 * Create a test user and authenticate them in mock services
 */
export const authenticateTestUser = (userOverrides?: Partial<User>) => {
  const mockServices = getMockServices();
  const testUser = createMockUser(userOverrides);
  mockServices.authentication.setCurrentUser(testUser);
  return testUser;
};

/**
 * Create a test store with authenticated user
 */
export const createAuthenticatedTestStore = (user?: User) => {
  const testUser = user || createMockUser();
  return createTestStore({
    auth: {
      user: testUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      lastLoginAttempt: null,
    }
  });
};

/**
 * Render with authenticated user (both services and Redux)
 */
export const renderWithAuthenticatedUser = (
  ui: ReactElement,
  userOverrides?: Partial<User>,
  options?: CustomRenderOptions
) => {
  const testUser = authenticateTestUser(userOverrides);
  const store = createAuthenticatedTestStore(testUser);

  return customRender(ui, { ...options, store });
};

/**
 * Create test projects and add them to mock project service
 */
export const setupTestProjects = (projects?: Project[]) => {
  const mockServices = getMockServices();
  const testProjects = projects || [createMockProject(), createMockProject({ id: '2', name: 'Second Project' })];
  mockServices.project.setProjects(testProjects);
  return testProjects;
};

/**
 * Create test tasks and add them to mock task service
 */
export const setupTestTasks = (tasks?: Task[]) => {
  const mockServices = getMockServices();
  const testTasks = tasks || [createMockTask(), createMockTask({ id: '2', title: 'Second Task' })];
  mockServices.task.setTasks(testTasks);
  return testTasks;
};

/**
 * Wait for service operations to complete (useful for async service calls)
 */
export const waitForServices = async () => {
  // Flush promise queue
  await flushPromises();
  // Additional wait for potential service side effects
  await new Promise(resolve => setTimeout(resolve, 10));
};

/**
 * Verify service method calls with better error messages
 */
export const expectServiceCalled = (service: any, method: string, ...expectedArgs: any[]) => {
  expect(service[method]).toHaveBeenCalled();
  if (expectedArgs.length > 0) {
    expect(service[method]).toHaveBeenCalledWith(...expectedArgs);
  }
};

/**
 * Get the number of times a service method was called
 */
export const getServiceCallCount = (service: any, method: string): number => {
  return service[method]?.mock?.calls?.length || 0;
};

/**
 * Create a complete test scenario with authenticated user and data
 */
export const createTestScenario = (overrides?: {
  user?: Partial<User>;
  projects?: Project[];
  tasks?: Task[];
}) => {
  const user = authenticateTestUser(overrides?.user);
  const projects = setupTestProjects(overrides?.projects);
  const tasks = setupTestTasks(overrides?.tasks);

  return {
    user,
    projects,
    tasks,
    mockServices: getMockServices(),
  };
};

// Re-export service testing utilities
export {
  getMockServices,
  resetTestContainer,
  getTestContainer,
  resetAllTestMocks
} from './mocks/container';
export { createTestStore };
export * from './mocks/services';
