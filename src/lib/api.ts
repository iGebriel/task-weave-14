import {
  ApiResponse,
  PaginatedResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsQueryParams,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TasksQueryParams,
  TaskExportParams,
  AdminDashboardStats,
  AdminNotification,
  NotificationStats,
} from '@/types/api';
import { HttpClient } from './http-client';

class ApiClient {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.httpClient.post<AuthResponse>('/auth/login', credentials);
  }

  async refreshToken(refreshToken: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    return this.httpClient.post<RefreshTokenResponse>('/auth/refresh', refreshToken);
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.httpClient.post<null>('/auth/logout');
  }

  // Set authentication token
  setAuthToken(token: string | null): void {
    this.httpClient.setToken(token);
  }

  // Project Methods
  async getProjects(params: ProjectsQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Project>>> {
    return this.httpClient.get<PaginatedResponse<Project>>('/projects', params);
  }

  async getProject(id: number): Promise<ApiResponse<Project>> {
    return this.httpClient.get<Project>(`/projects/${id}`);
  }

  async createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    return this.httpClient.post<Project>('/projects', data);
  }

  async updateProject(id: number, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    return this.httpClient.patch<Project>(`/projects/${id}`, data);
  }

  async deleteProject(id: number): Promise<ApiResponse<null>> {
    return this.httpClient.delete<null>(`/projects/${id}`);
  }

  async requestProjectDeletion(id: number): Promise<ApiResponse<Project>> {
    return this.httpClient.post<Project>(`/projects/${id}/request_deletion`);
  }

  async cancelProjectDeletion(id: number): Promise<ApiResponse<Project>> {
    return this.httpClient.delete<Project>(`/projects/${id}/cancel_deletion`);
  }

  // Task Methods
  async getTasks(params: TasksQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Task>>> {
    return this.httpClient.get<PaginatedResponse<Task>>('/tasks', params);
  }

  async getTask(id: number): Promise<ApiResponse<Task>> {
    return this.httpClient.get<Task>(`/tasks/${id}`);
  }

  async createTask(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    return this.httpClient.post<Task>('/tasks', data);
  }

  async updateTask(id: number, data: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    return this.httpClient.patch<Task>(`/tasks/${id}`, data);
  }

  async deleteTask(id: number): Promise<ApiResponse<null>> {
    return this.httpClient.delete<null>(`/tasks/${id}`);
  }

  // Task Export
  async exportProjectTasks(projectId: number, params: TaskExportParams = {}): Promise<any[] | void> {
    if (params.format === 'csv') {
      const filename = `project_${projectId}_tasks.csv`;
      await this.httpClient.downloadFile(
        `/projects/${projectId}/task_exports/export`,
        filename,
        params
      );
      return;
    } else {
      const response = await this.httpClient.get<any[]>(
        `/projects/${projectId}/task_exports/export`,
        params
      );
      return response.data || [];
    }
  }

  // Admin Methods
  async getAdminDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    return this.httpClient.get<AdminDashboardStats>('/admin/notifications/stats');
  }

  async getAdminNotifications(params: Record<string, any> = {}): Promise<ApiResponse<PaginatedResponse<AdminNotification>>> {
    return this.httpClient.get<PaginatedResponse<AdminNotification>>('/admin/notifications', params);
  }

  async acknowledgeNotification(id: number): Promise<ApiResponse<AdminNotification>> {
    return this.httpClient.post<AdminNotification>(`/admin/notifications/${id}/acknowledge`);
  }

  async getNotificationStats(): Promise<ApiResponse<NotificationStats>> {
    return this.httpClient.get<NotificationStats>('/admin/notifications/stats');
  }
}

export const apiClient = new ApiClient();
