import { HttpClient } from '@/lib/http-client';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectsQueryParams,
  ApiResponse,
  TaskExportParams,
  ProjectStatus
} from '@/types/api';

export interface ProjectsResponse {
  projects: Project[];
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Service for managing projects - handles CRUD operations and exports
 */
export class ProjectService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Validate project ID
   */
  private validateProjectId(id: number): void {
    if (!id || id <= 0) {
      throw new Error('Invalid project ID');
    }
  }

  /**
   * Validate project name
   */
  validateProjectName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Validation error: Name is required');
    }
    if (name.length < 2) {
      throw new Error('Validation error: Name must be at least 2 characters');
    }
    if (name.length > 255) {
      throw new Error('Validation error: Name must be less than 255 characters');
    }
  }

  /**
   * Validate project description
   */
  validateProjectDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Validation error: Description is required');
    }
    if (description.length < 10) {
      throw new Error('Validation error: Description must be at least 10 characters');
    }
    if (description.length > 1000) {
      throw new Error('Validation error: Description must be less than 1000 characters');
    }
  }

  /**
   * Validate project status
   */
  validateProjectStatus(status: ProjectStatus): void {
    const validStatuses: ProjectStatus[] = ['active', 'draft', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error('Validation error: Invalid project status');
    }
  }

  /**
   * Validate create project data
   */
  private validateCreateProjectData(data: CreateProjectRequest): void {
    const { name, description, status } = data.project;

    this.validateProjectName(name);
    this.validateProjectDescription(description);

    if (status) {
      this.validateProjectStatus(status);
    }
  }

  /**
   * Validate update project data
   */
  private validateUpdateProjectData(data: UpdateProjectRequest): void {
    const { name, description, status } = data.project;

    if (name !== undefined) {
      this.validateProjectName(name);
    }

    if (description !== undefined) {
      this.validateProjectDescription(description);
    }

    if (status !== undefined) {
      this.validateProjectStatus(status);
    }

    // Check if at least one field is being updated
    if (name === undefined && description === undefined && status === undefined) {
      throw new Error('Validation error: At least one field must be provided for update');
    }
  }

  /**
   * Get all projects with optional filtering
   */
  async getProjects(params: ProjectsQueryParams = {}): Promise<ProjectsResponse> {
    try {
      const response = await this.httpClient.get<Project[]>('/projects', params);
      
      return {
        projects: response.data || [],
        meta: response.meta,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: number): Promise<Project> {
    this.validateProjectId(id);

    try {
      const response = await this.httpClient.get<Project>(`/projects/${id}`);
      return response.data!;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectRequest): Promise<Project> {
    // Validate input data
    this.validateCreateProjectData(data);

    try {
      const response = await this.httpClient.post<Project>('/projects', data);
      return response.data!;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
    this.validateProjectId(id);
    this.validateUpdateProjectData(data);

    try {
      const response = await this.httpClient.patch<Project>(`/projects/${id}`, data);
      return response.data!;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: number): Promise<void> {
    this.validateProjectId(id);

    try {
      await this.httpClient.delete(`/projects/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request project deletion (soft delete request)
   */
  async requestProjectDeletion(id: number): Promise<Project> {
    this.validateProjectId(id);

    try {
      const response = await this.httpClient.post<Project>(`/projects/${id}/request_deletion`);
      return response.data!;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel project deletion request
   */
  async cancelProjectDeletion(id: number): Promise<Project> {
    this.validateProjectId(id);

    try {
      const response = await this.httpClient.delete<Project>(`/projects/${id}/cancel_deletion`);
      return response.data!;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export project tasks in various formats
   */
  async exportProjectTasks(id: number, params: TaskExportParams = {}): Promise<any[] | void> {
    this.validateProjectId(id);

    const format = params.format || 'json';

    try {
      if (format === 'csv') {
        // Download CSV file
        const filename = `project_${id}_tasks.csv`;
        await this.httpClient.downloadFile(
          `/projects/${id}/task_exports/export`,
          filename,
          params
        );
        return; // No return value for file downloads
      } else {
        // Return JSON data
        const response = await this.httpClient.get<any[]>(
          `/projects/${id}/task_exports/export`,
          params
        );
        return response.data || [];
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get project statistics (if needed later)
   */
  async getProjectStats(id: number): Promise<any> {
    this.validateProjectId(id);

    try {
      const response = await this.httpClient.get(`/projects/${id}/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export factory function to create instance with HttpClient
export const createProjectService = (httpClient: HttpClient): ProjectService => {
  return new ProjectService(httpClient);
};