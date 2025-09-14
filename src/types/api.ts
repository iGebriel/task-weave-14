// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface Meta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Project types
export type ProjectStatus = 'active' | 'draft' | 'completed' | 'archived';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  deletion_requested: boolean;
  deletion_requested_at: string | null;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  project: {
    name: string;
    description: string;
    status?: ProjectStatus;
  };
}

export interface UpdateProjectRequest {
  project: Partial<{
    name: string;
    description: string;
    status: ProjectStatus;
  }>;
}

// Task types
export type TaskStatus = 'draft' | 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  project: {
    id: number;
    name: string;
  };
  user: User;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  task: {
    title: string;
    description: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    project_id: number;
    user_id: number;
  };
}

export interface UpdateTaskRequest {
  task: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    project_id: number;
    user_id: number;
  }>;
}

// Query parameters
export interface ProjectsQueryParams {
  page?: number;
  per_page?: number;
  status?: ProjectStatus;
  search?: string;
}

export interface TasksQueryParams {
  page?: number;
  per_page?: number;
  project_id?: number;
  user_id?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  overdue?: boolean;
  due_soon?: boolean;
}

// Authentication response types
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_at: string;
}

// Admin dashboard types
export interface AdminNotification {
  id: number;
  notification_type: 'project_deletion_request' | 'system_alert' | 'user_registration' | 'security_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'acknowledged';
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  pending: number;
  acknowledged: number;
  by_priority: {
    high: number;
    medium: number;
    low: number;
    urgent: number;
  };
  by_type: {
    project_deletion_request: number;
    system_alert: number;
    user_registration: number;
    [key: string]: number;
  };
}

export interface TaskExportParams {
  format?: 'json' | 'csv';
  status?: TaskStatus;
  priority?: TaskPriority;
  created_after?: string;
  created_before?: string;
  due_after?: string;
  due_before?: string;
}

// Admin types
export interface AdminDashboardStats {
  projects: {
    total: number;
    active: number;
    deletion_requests: number;
  };
  tasks: {
    total: number;
    completed: number;
    in_progress: number;
    overdue: number;
  };
  users: {
    total: number;
    admins: number;
    regular: number;
  };
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
  field?: string;
}

export class ApiException extends Error {
  public readonly status: number;
  public readonly errors: string[];
  public readonly field?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.status = error.status || 500;
    this.errors = error.errors || [error.message];
    this.field = error.field;
  }
}

// HTTP client types
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}
