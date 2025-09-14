import { vi } from 'vitest';
import type {
  IStorageService,
  INotificationService,
  IAuthenticationService,
  IProjectService,
  ITaskService,
  INavigationService,
  IAnalyticsService,
  ILoggerService,
  IHttpService,
  LoginCredentials,
  RegisterData,
  AuthResult,
  ProjectStats,
  NavigationOptions,
  RequestConfig,
} from '@/services/interfaces';
import type { User, Project, Task, CreateProjectData, CreateTaskData, UpdateProjectData, UpdateTaskData } from '@/types';
import { createMockUser, createMockProject, createMockTask } from '../utils';

/**
 * Mock Storage Service for testing
 */
export class MockStorageService implements IStorageService {
  private storage = new Map<string, any>();

  getItem<T>(key: string): T | null {
    return this.storage.get(key) || null;
  }

  setItem<T>(key: string, value: T): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  // Test utility methods
  getAllItems(): Map<string, any> {
    return new Map(this.storage);
  }

  reset(): void {
    this.clear();
  }
}

/**
 * Mock Notification Service for testing
 */
export class MockNotificationService implements INotificationService {
  success = vi.fn();
  error = vi.fn();
  info = vi.fn();
  warning = vi.fn();
  loading = vi.fn().mockReturnValue('mock-loading-id');
  dismiss = vi.fn();

  // Test utility methods
  reset(): void {
    this.success.mockReset();
    this.error.mockReset();
    this.info.mockReset();
    this.warning.mockReset();
    this.loading.mockReset();
    this.dismiss.mockReset();
  }

  getLastSuccessMessage(): string | undefined {
    const lastCall = this.success.mock.calls[this.success.mock.calls.length - 1];
    return lastCall ? lastCall[0] : undefined;
  }

  getLastErrorMessage(): string | undefined {
    const lastCall = this.error.mock.calls[this.error.mock.calls.length - 1];
    return lastCall ? lastCall[0] : undefined;
  }
}

/**
 * Mock Authentication Service for testing
 */
export class MockAuthenticationService implements IAuthenticationService {
  private currentUser: User | null = null;
  private token: string | null = null;
  private storage: MockStorageService | null = null;
  private notification: MockNotificationService | null = null;

  getCurrentUser = vi.fn(() => this.currentUser);
  login = vi.fn();
  register = vi.fn();
  logout = vi.fn();
  refreshToken = vi.fn();
  forgotPassword = vi.fn();
  resetPassword = vi.fn();
  updateProfile = vi.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  // Allow injecting storage and notification services for proper integration
  setServices(storage: MockStorageService, notification: MockNotificationService): void {
    this.storage = storage;
    this.notification = notification;
  }

  private setupDefaultBehavior(): void {
    this.login.mockImplementation(async (credentials: LoginCredentials): Promise<AuthResult> => {
      try {
        const user = createMockUser({ email: credentials.email });
        const result = {
          user,
          token: `mock-token-${Date.now()}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        this.currentUser = user;
        this.token = result.token;
        
        // Integrate with storage service
        if (this.storage) {
          this.storage.setItem('user', user);
          this.storage.setItem('auth_token', result.token);
        }
        
        // Integrate with notification service
        if (this.notification) {
          this.notification.success('Successfully signed in');
        }
        
        return result;
      } catch (error) {
        if (this.notification) {
          this.notification.error('Failed to sign in');
        }
        throw error;
      }
    });

    this.register.mockImplementation(async (userData: RegisterData): Promise<AuthResult> => {
      const user = createMockUser({ name: userData.name, email: userData.email });
      const result = {
        user,
        token: `mock-token-${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      this.currentUser = user;
      this.token = result.token;
      
      // Integrate with storage service
      if (this.storage) {
        this.storage.setItem('user', user);
        this.storage.setItem('auth_token', result.token);
      }
      
      // Integrate with notification service
      if (this.notification) {
        this.notification.success('Account created successfully');
      }
      
      return result;
    });

    this.logout.mockImplementation(async () => {
      this.currentUser = null;
      this.token = null;
      
      // Update the getCurrentUser mock to return null
      this.getCurrentUser.mockReturnValue(null);
      
      // Integrate with storage service
      if (this.storage) {
        this.storage.removeItem('user');
        this.storage.removeItem('auth_token');
      }
      
      // Integrate with notification service
      if (this.notification) {
        this.notification.success('Signed out successfully');
      }
    });

    this.refreshToken.mockResolvedValue(`refresh-token-${Date.now()}`);
    this.forgotPassword.mockResolvedValue(undefined);
    this.resetPassword.mockResolvedValue(undefined);

    this.updateProfile.mockImplementation(async (userId: string, updates: Partial<User>): Promise<User> => {
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = { ...this.currentUser, ...updates };
        
        // Integrate with storage service
        if (this.storage) {
          this.storage.setItem('user', this.currentUser);
        }
        
        return this.currentUser;
      }
      throw new Error('User not found or unauthorized');
    });
  }

  // Test utility methods
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.getCurrentUser.mockReturnValue(user);
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  reset(): void {
    this.currentUser = null;
    this.token = null;
    this.getCurrentUser.mockReset();
    this.login.mockReset();
    this.register.mockReset();
    this.logout.mockReset();
    this.refreshToken.mockReset();
    this.forgotPassword.mockReset();
    this.resetPassword.mockReset();
    this.updateProfile.mockReset();
    this.setupDefaultBehavior();
  }
}

/**
 * Mock Project Service for testing
 */
export class MockProjectService implements IProjectService {
  private projects: Project[] = [];
  private notification: MockNotificationService | null = null;

  getAllProjects = vi.fn();
  getProject = vi.fn();
  createProject = vi.fn();
  updateProject = vi.fn();
  deleteProject = vi.fn();
  getProjectStats = vi.fn();
  searchProjects = vi.fn();
  getProjectsByStatus = vi.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  // Allow injecting notification service
  setNotificationService(notification: MockNotificationService): void {
    this.notification = notification;
  }

  private setupDefaultBehavior(): void {
    this.getAllProjects.mockImplementation(async () => [...this.projects]);
    
    this.getProject.mockImplementation(async (id: string) => {
      const project = this.projects.find(p => p.id === id);
      if (!project) throw new Error('Project not found');
      return project;
    });

    this.createProject.mockImplementation(async (data: CreateProjectData): Promise<Project> => {
      const project = createMockProject({ ...data, id: `project-${Date.now()}` });
      this.projects.push(project);
      
      // Trigger success notification
      if (this.notification) {
        this.notification.success('Project created successfully');
      }
      
      return project;
    });

    this.updateProject.mockImplementation(async (id: string, data: UpdateProjectData): Promise<Project> => {
      const index = this.projects.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Project not found');
      this.projects[index] = { ...this.projects[index], ...data };
      return this.projects[index];
    });

    this.deleteProject.mockImplementation(async (id: string) => {
      const index = this.projects.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Project not found');
      this.projects.splice(index, 1);
    });

    this.getProjectStats.mockResolvedValue({
      total: this.projects.length,
      active: this.projects.filter(p => p.status === 'active').length,
      completed: this.projects.filter(p => p.status === 'completed').length,
      archived: this.projects.filter(p => p.status === 'archived').length,
      draft: this.projects.filter(p => p.status === 'draft').length,
    });

    this.searchProjects.mockImplementation(async (query: string) => {
      return this.projects.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      );
    });

    this.getProjectsByStatus.mockImplementation(async (status: string) => {
      return this.projects.filter(p => p.status === status);
    });
  }

  // Test utility methods
  setProjects(projects: Project[]): void {
    this.projects = [...projects];
  }

  addProject(project: Project): void {
    this.projects.push(project);
  }

  reset(): void {
    this.projects = [];
    this.getAllProjects.mockReset();
    this.getProject.mockReset();
    this.createProject.mockReset();
    this.updateProject.mockReset();
    this.deleteProject.mockReset();
    this.getProjectStats.mockReset();
    this.searchProjects.mockReset();
    this.getProjectsByStatus.mockReset();
    this.setupDefaultBehavior();
  }
}

/**
 * Mock Task Service for testing
 */
export class MockTaskService implements ITaskService {
  private tasks: Task[] = [];

  getTasksByProject = vi.fn();
  getTask = vi.fn();
  createTask = vi.fn();
  updateTask = vi.fn();
  deleteTask = vi.fn();
  moveTask = vi.fn();
  assignTask = vi.fn();
  getTasksByAssignee = vi.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    this.getTasksByProject.mockImplementation(async (projectId: string) => {
      return this.tasks.filter(t => t.projectId === projectId);
    });

    this.getTask.mockImplementation(async (id: string) => {
      const task = this.tasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');
      return task;
    });

    this.createTask.mockImplementation(async (data: CreateTaskData): Promise<Task> => {
      const task = createMockTask({ ...data, id: `task-${Date.now()}` });
      this.tasks.push(task);
      return task;
    });

    this.updateTask.mockImplementation(async (id: string, data: UpdateTaskData): Promise<Task> => {
      const index = this.tasks.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Task not found');
      this.tasks[index] = { ...this.tasks[index], ...data };
      return this.tasks[index];
    });

    this.deleteTask.mockImplementation(async (id: string) => {
      const index = this.tasks.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Task not found');
      this.tasks.splice(index, 1);
    });

    this.moveTask.mockImplementation(async (taskId: string, newColumnId: string, position: number): Promise<Task> => {
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index === -1) throw new Error('Task not found');
      this.tasks[index] = { 
        ...this.tasks[index], 
        columnId: newColumnId, 
        position 
      };
      return this.tasks[index];
    });

    this.assignTask.mockImplementation(async (taskId: string, assigneeId: string): Promise<Task> => {
      const index = this.tasks.findIndex(t => t.id === taskId);
      if (index === -1) throw new Error('Task not found');
      this.tasks[index] = { 
        ...this.tasks[index], 
        assigneeId 
      };
      return this.tasks[index];
    });

    this.getTasksByAssignee.mockImplementation(async (assigneeId: string) => {
      return this.tasks.filter(t => t.assigneeId === assigneeId);
    });
  }

  // Test utility methods
  setTasks(tasks: Task[]): void {
    this.tasks = [...tasks];
  }

  addTask(task: Task): void {
    this.tasks.push(task);
  }

  reset(): void {
    this.tasks = [];
    this.getTasksByProject.mockReset();
    this.getTask.mockReset();
    this.createTask.mockReset();
    this.updateTask.mockReset();
    this.deleteTask.mockReset();
    this.moveTask.mockReset();
    this.assignTask.mockReset();
    this.getTasksByAssignee.mockReset();
    this.setupDefaultBehavior();
  }
}

/**
 * Mock Navigation Service for testing
 */
export class MockNavigationService implements INavigationService {
  private currentPath = '/';
  private searchParams = new URLSearchParams();

  navigate = vi.fn();
  goBack = vi.fn();
  replace = vi.fn();
  getCurrentPath = vi.fn(() => this.currentPath);
  getSearchParams = vi.fn(() => this.searchParams);

  // Test utility methods
  setCurrentPath(path: string): void {
    this.currentPath = path;
    this.getCurrentPath.mockReturnValue(path);
  }

  setSearchParams(params: URLSearchParams): void {
    this.searchParams = params;
    this.getSearchParams.mockReturnValue(params);
  }

  reset(): void {
    this.currentPath = '/';
    this.searchParams = new URLSearchParams();
    this.navigate.mockReset();
    this.goBack.mockReset();
    this.replace.mockReset();
    this.getCurrentPath.mockReset();
    this.getSearchParams.mockReset();
    this.getCurrentPath.mockReturnValue(this.currentPath);
    this.getSearchParams.mockReturnValue(this.searchParams);
  }
}

/**
 * Mock Analytics Service for testing
 */
export class MockAnalyticsService implements IAnalyticsService {
  track = vi.fn();
  identify = vi.fn();
  page = vi.fn();
  group = vi.fn();

  reset(): void {
    this.track.mockReset();
    this.identify.mockReset();
    this.page.mockReset();
    this.group.mockReset();
  }
}

/**
 * Mock Logger Service for testing
 */
export class MockLoggerService implements ILoggerService {
  debug = vi.fn();
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();

  reset(): void {
    this.debug.mockReset();
    this.info.mockReset();
    this.warn.mockReset();
    this.error.mockReset();
  }
}

/**
 * Mock HTTP Service for testing
 */
export class MockHttpService implements IHttpService {
  get = vi.fn();
  post = vi.fn();
  put = vi.fn();
  patch = vi.fn();
  delete = vi.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    this.get.mockResolvedValue({ success: true, data: {} });
    this.post.mockResolvedValue({ success: true, data: {} });
    this.put.mockResolvedValue({ success: true, data: {} });
    this.patch.mockResolvedValue({ success: true, data: {} });
    this.delete.mockResolvedValue({ success: true });
  }

  reset(): void {
    this.get.mockReset();
    this.post.mockReset();
    this.put.mockReset();
    this.patch.mockReset();
    this.delete.mockReset();
    this.setupDefaultBehavior();
  }
}

/**
 * Factory function to create a complete set of mock services
 */
export const createMockServices = () => {
  const storage = new MockStorageService();
  const notification = new MockNotificationService();
  const authentication = new MockAuthenticationService();
  const project = new MockProjectService();
  const task = new MockTaskService();
  const navigation = new MockNavigationService();
  const analytics = new MockAnalyticsService();
  const logger = new MockLoggerService();
  const http = new MockHttpService();

  // Wire up service dependencies
  authentication.setServices(storage, notification);
  project.setNotificationService(notification);

  return {
    storage,
    notification,
    authentication,
    project,
    task,
    navigation,
    analytics,
    logger,
    http,
  };
};

/**
 * Reset all mock services
 */
export const resetAllMockServices = (services: ReturnType<typeof createMockServices>) => {
  Object.values(services).forEach(service => {
    if ('reset' in service && typeof service.reset === 'function') {
      service.reset();
    }
  });
};
