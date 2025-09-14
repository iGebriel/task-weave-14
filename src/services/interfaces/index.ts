import { User, Project, Task, CreateProjectData, CreateTaskData, UpdateProjectData, UpdateTaskData } from '@/types';

// Storage service interface for data persistence
export interface IStorageService {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

// Notification service interface for user feedback
export interface INotificationService {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
  warning(message: string): void;
  loading(message: string): string;
  dismiss(id: string): void;
}

// Authentication service interface
export interface IAuthenticationService {
  getCurrentUser(): User | null;
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(userData: RegisterData): Promise<AuthResult>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  updateProfile(userId: string, updates: Partial<User>): Promise<User>;
}

// Project service interface
export interface IProjectService {
  getAllProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project>;
  createProject(data: CreateProjectData): Promise<Project>;
  updateProject(id: string, data: UpdateProjectData): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  getProjectStats(): Promise<ProjectStats>;
  searchProjects(query: string): Promise<Project[]>;
  getProjectsByStatus(status: string): Promise<Project[]>;
}

// Task service interface
export interface ITaskService {
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task>;
  createTask(data: CreateTaskData): Promise<Task>;
  updateTask(id: string, data: UpdateTaskData): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  moveTask(taskId: string, newColumnId: string, position: number): Promise<Task>;
  assignTask(taskId: string, assigneeId: string): Promise<Task>;
  getTasksByAssignee(assigneeId: string): Promise<Task[]>;
}

// Navigation service interface
export interface INavigationService {
  navigate(path: string, options?: NavigationOptions): void;
  goBack(): void;
  replace(path: string, options?: NavigationOptions): void;
  getCurrentPath(): string;
  getSearchParams(): URLSearchParams;
}

// Analytics service interface
export interface IAnalyticsService {
  track(event: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  page(name?: string, properties?: Record<string, any>): void;
  group(groupId: string, traits?: Record<string, any>): void;
}

// Logger service interface
export interface ILoggerService {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}

// HTTP client service interface
export interface IHttpService {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

// Supporting types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  archived: number;
  draft: number;
}

export interface NavigationOptions {
  state?: any;
  replace?: boolean;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

// Service container interface for dependency injection
export interface IServiceContainer {
  // Registration methods
  registerSingleton<T>(token: string, factory: () => T): void;
  registerTransient<T>(token: string, factory: () => T): void;
  registerInstance<T>(token: string, instance: T): void;
  
  // Resolution methods
  resolve<T>(token: string): T;
  tryResolve<T>(token: string): T | null;
  
  // Utility methods
  isRegistered(token: string): boolean;
  clear(): void;
}

// Service tokens for type-safe dependency injection
export const SERVICE_TOKENS = {
  STORAGE: 'IStorageService',
  NOTIFICATION: 'INotificationService',
  AUTHENTICATION: 'IAuthenticationService',
  PROJECT: 'IProjectService',
  TASK: 'ITaskService',
  NAVIGATION: 'INavigationService',
  ANALYTICS: 'IAnalyticsService',
  LOGGER: 'ILoggerService',
  HTTP: 'IHttpService',
} as const;

export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS];
