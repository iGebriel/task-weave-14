import {
  ApiResponse,
  PaginatedResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsQueryParams,
} from '@/types/api';

class ApiClient {
  private baseURL = 'http://localhost:3008/api/v1';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('🌐 API Request:', { url, method: config.method || 'GET', headers: config.headers });

    try {
      const response = await fetch(url, config);
      console.log('📡 API Response:', { status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers.entries()) });
      
      const data = await response.json();
      console.log('📦 API Data:', data);
      
      if (!response.ok) {
        console.error('❌ API Error Response:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('💥 API Request Failed:', { url, error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Project Methods
  async getProjects(params: ProjectsQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Project>>> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    const endpoint = `/projects${queryString ? `?${queryString}` : ''}`;
    return this.request<PaginatedResponse<Project>>(endpoint);
  }

  async getProject(id: number): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: number, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: number): Promise<ApiResponse<null>> {
    return this.request<null>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async requestProjectDeletion(id: number): Promise<ApiResponse<Project>> {
    return this.request<Project>(`/projects/${id}/request_deletion`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
