import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProjectService } from '../project.service';
import { HttpClient } from '@/lib/http-client';
import { ApiException } from '@/types/api';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectsQueryParams,
  User,
  ApiResponse,
  TaskExportParams 
} from '@/types/api';

// Mock HttpClient
vi.mock('@/lib/http-client');

describe('ProjectService', () => {
  let projectService: ProjectService;
  let mockHttpClient: vi.Mocked<HttpClient>;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  };

  const mockProject: Project = {
    id: 1,
    name: 'Test Project',
    description: 'A test project for our application',
    status: 'active',
    deletion_requested: false,
    deletion_requested_at: null,
    user: mockUser,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  };

  const mockProjects = [
    mockProject,
    {
      ...mockProject,
      id: 2,
      name: 'Another Project',
      description: 'Another test project',
      status: 'completed' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock HttpClient
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      downloadFile: vi.fn(),
      setToken: vi.fn(),
      getToken: vi.fn(),
    } as any;

    projectService = new ProjectService(mockHttpClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProjects', () => {
    it('should fetch projects successfully without query parameters', async () => {
      const mockResponse: ApiResponse<Project[]> = {
        success: true,
        data: mockProjects,
        meta: {
          page: 1,
          per_page: 10,
          total: 2,
          total_pages: 1,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await projectService.getProjects();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/projects', {});
      expect(result).toEqual({
        projects: mockProjects,
        meta: mockResponse.meta,
      });
    });

    it('should fetch projects with query parameters', async () => {
      const queryParams: ProjectsQueryParams = {
        page: 2,
        per_page: 20,
        status: 'active',
        search: 'test',
      };

      const mockResponse: ApiResponse<Project[]> = {
        success: true,
        data: mockProjects,
        meta: {
          page: 2,
          per_page: 20,
          total: 2,
          total_pages: 1,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await projectService.getProjects(queryParams);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/projects', queryParams);
      expect(result.projects).toEqual(mockProjects);
      expect(result.meta).toEqual(mockResponse.meta);
    });

    it('should handle API errors when fetching projects', async () => {
      const apiError = new ApiException({
        message: 'Failed to fetch projects',
        status: 500,
      });

      mockHttpClient.get.mockRejectedValue(apiError);

      await expect(projectService.getProjects()).rejects.toThrow(ApiException);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/projects', {});
    });

    it('should handle empty response gracefully', async () => {
      const mockResponse: ApiResponse<Project[]> = {
        success: true,
        data: [],
        meta: {
          page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0,
        },
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await projectService.getProjects();

      expect(result.projects).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getProject', () => {
    it('should fetch single project successfully', async () => {
      const mockResponse: ApiResponse<Project> = {
        success: true,
        data: mockProject,
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await projectService.getProject(1);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/projects/1');
      expect(result).toEqual(mockProject);
    });

    it('should handle not found error', async () => {
      const notFoundError = new ApiException({
        message: 'Project not found',
        status: 404,
      });

      mockHttpClient.get.mockRejectedValue(notFoundError);

      await expect(projectService.getProject(999)).rejects.toThrow(ApiException);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/projects/999');
    });

    it('should validate project ID parameter', async () => {
      await expect(projectService.getProject(0)).rejects.toThrow('Invalid project ID');
      await expect(projectService.getProject(-1)).rejects.toThrow('Invalid project ID');
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const createRequest: CreateProjectRequest = {
        project: {
          name: 'New Project',
          description: 'A new project description',
          status: 'active',
        },
      };

      const mockResponse: ApiResponse<Project> = {
        success: true,
        data: {
          ...mockProject,
          name: createRequest.project.name,
          description: createRequest.project.description,
        },
        message: 'Project created successfully',
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await projectService.createProject(createRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/projects', createRequest);
      expect(result).toEqual(mockResponse.data);
    });

    it('should validate project data before creation', async () => {
      const invalidRequests = [
        {
          project: {
            name: '',
            description: 'Valid description',
          },
        },
        {
          project: {
            name: 'A',
            description: 'Valid description',
          },
        },
        {
          project: {
            name: 'Valid Name',
            description: 'Short',
          },
        },
        {
          project: {
            name: 'Valid Name',
            description: '', // Empty description
          },
        },
      ];

      for (const invalidRequest of invalidRequests) {
        await expect(
          projectService.createProject(invalidRequest as CreateProjectRequest)
        ).rejects.toThrow(/validation/i);
      }

      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should handle validation errors from API', async () => {
      const createRequest: CreateProjectRequest = {
        project: {
          name: 'Test Project',
          description: 'Test Description',
        },
      };

      const validationError = new ApiException({
        message: 'Validation failed',
        status: 422,
        errors: ['Name already exists', 'Description too short'],
      });

      mockHttpClient.post.mockRejectedValue(validationError);

      await expect(projectService.createProject(createRequest)).rejects.toThrow(ApiException);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/projects', createRequest);
    });

    it('should handle network errors during creation', async () => {
      const createRequest: CreateProjectRequest = {
        project: {
          name: 'Test Project',
          description: 'Test Description',
        },
      };

      const networkError = new ApiException({
        message: 'Network error',
        status: 0,
      });

      mockHttpClient.post.mockRejectedValue(networkError);

      await expect(projectService.createProject(createRequest)).rejects.toThrow(ApiException);
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const updateRequest: UpdateProjectRequest = {
        project: {
          name: 'Updated Project Name',
          status: 'completed',
        },
      };

      const mockResponse: ApiResponse<Project> = {
        success: true,
        data: {
          ...mockProject,
          name: updateRequest.project.name!,
          status: updateRequest.project.status!,
        },
        message: 'Project updated successfully',
      };

      mockHttpClient.patch.mockResolvedValue(mockResponse);

      const result = await projectService.updateProject(1, updateRequest);

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/projects/1', updateRequest);
      expect(result).toEqual(mockResponse.data);
    });

    it('should validate project ID for updates', async () => {
      const updateRequest: UpdateProjectRequest = {
        project: {
          name: 'Updated Name',
        },
      };

      await expect(projectService.updateProject(0, updateRequest)).rejects.toThrow('Invalid project ID');
      await expect(projectService.updateProject(-1, updateRequest)).rejects.toThrow('Invalid project ID');
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should validate update data', async () => {
      const invalidUpdates = [
        {
          project: {
            name: '',
          },
        },
        {
          project: {
            name: 'A',
          },
        },
        {
          project: {
            description: 'Short',
          },
        },
      ];

      for (const invalidUpdate of invalidUpdates) {
        await expect(
          projectService.updateProject(1, invalidUpdate as UpdateProjectRequest)
        ).rejects.toThrow(/validation/i);
      }

      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should handle update of non-existent project', async () => {
      const updateRequest: UpdateProjectRequest = {
        project: {
          name: 'Updated Name',
        },
      };

      const notFoundError = new ApiException({
        message: 'Project not found',
        status: 404,
      });

      mockHttpClient.patch.mockRejectedValue(notFoundError);

      await expect(projectService.updateProject(999, updateRequest)).rejects.toThrow(ApiException);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
        message: 'Project deleted successfully',
      };

      mockHttpClient.delete.mockResolvedValue(mockResponse);

      await projectService.deleteProject(1);

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/projects/1');
    });

    it('should validate project ID for deletion', async () => {
      await expect(projectService.deleteProject(0)).rejects.toThrow('Invalid project ID');
      await expect(projectService.deleteProject(-1)).rejects.toThrow('Invalid project ID');
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });

    it('should handle deletion of non-existent project', async () => {
      const notFoundError = new ApiException({
        message: 'Project not found',
        status: 404,
      });

      mockHttpClient.delete.mockRejectedValue(notFoundError);

      await expect(projectService.deleteProject(999)).rejects.toThrow(ApiException);
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/projects/999');
    });

    it('should handle unauthorized deletion attempts', async () => {
      const unauthorizedError = new ApiException({
        message: 'Access denied. You do not have permission for this action.',
        status: 403,
      });

      mockHttpClient.delete.mockRejectedValue(unauthorizedError);

      await expect(projectService.deleteProject(1)).rejects.toThrow(ApiException);
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/projects/1');
    });
  });

  describe('requestProjectDeletion', () => {
    it('should request project deletion successfully', async () => {
      const mockResponse: ApiResponse<Project> = {
        success: true,
        data: {
          ...mockProject,
          deletion_requested: true,
          deletion_requested_at: '2024-01-15T12:00:00Z',
        },
        message: 'Deletion request submitted successfully',
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await projectService.requestProjectDeletion(1);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/projects/1/request_deletion');
      expect(result).toEqual(mockResponse.data);
      expect(result.deletion_requested).toBe(true);
    });

    it('should validate project ID for deletion request', async () => {
      await expect(projectService.requestProjectDeletion(0)).rejects.toThrow('Invalid project ID');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('cancelProjectDeletion', () => {
    it('should cancel project deletion successfully', async () => {
      const mockResponse: ApiResponse<Project> = {
        success: true,
        data: {
          ...mockProject,
          deletion_requested: false,
          deletion_requested_at: null,
        },
        message: 'Deletion request cancelled successfully',
      };

      mockHttpClient.delete.mockResolvedValue(mockResponse);

      const result = await projectService.cancelProjectDeletion(1);

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/projects/1/cancel_deletion');
      expect(result).toEqual(mockResponse.data);
      expect(result.deletion_requested).toBe(false);
    });

    it('should validate project ID for cancellation', async () => {
      await expect(projectService.cancelProjectDeletion(0)).rejects.toThrow('Invalid project ID');
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('exportProjectTasks', () => {
    it('should export tasks as JSON successfully', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'First task',
          status: 'completed',
          priority: 'high',
          due_date: '2024-02-01T00:00:00Z',
          completed_at: '2024-01-30T10:00:00Z',
          user: mockUser,
        },
      ];

      const mockResponse: ApiResponse<any[]> = {
        success: true,
        data: mockTasks,
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const exportParams: TaskExportParams = {
        format: 'json',
        status: 'completed',
      };

      const result = await projectService.exportProjectTasks(1, exportParams);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/projects/1/task_exports/export',
        exportParams
      );
      expect(result).toEqual(mockTasks);
    });

    it('should export tasks as CSV successfully', async () => {
      const exportParams: TaskExportParams = {
        format: 'csv',
        priority: 'high',
      };

      mockHttpClient.downloadFile.mockResolvedValue(undefined);

      await projectService.exportProjectTasks(1, exportParams);

      expect(mockHttpClient.downloadFile).toHaveBeenCalledWith(
        '/projects/1/task_exports/export',
        'project_1_tasks.csv',
        exportParams
      );
    });

    it('should use default format when not specified', async () => {
      const mockResponse: ApiResponse<any[]> = {
        success: true,
        data: [],
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await projectService.exportProjectTasks(1, {});

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/projects/1/task_exports/export',
        {}
      );
      expect(result).toEqual([]);
    });

    it('should validate project ID for export', async () => {
      await expect(
        projectService.exportProjectTasks(0, { format: 'json' })
      ).rejects.toThrow('Invalid project ID');
      
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(mockHttpClient.downloadFile).not.toHaveBeenCalled();
    });

    it('should handle export errors gracefully', async () => {
      const exportError = new ApiException({
        message: 'Export failed',
        status: 500,
      });

      mockHttpClient.get.mockRejectedValue(exportError);

      await expect(
        projectService.exportProjectTasks(1, { format: 'json' })
      ).rejects.toThrow(ApiException);
    });
  });

  describe('input validation', () => {
    it('should validate project name length', () => {
      expect(() => projectService.validateProjectName('')).toThrow('Validation error: Name is required');
      expect(() => projectService.validateProjectName('A')).toThrow('Validation error: Name must be at least 2 characters');
      expect(() => projectService.validateProjectName('A'.repeat(256))).toThrow('Validation error: Name must be less than 255 characters');
      expect(() => projectService.validateProjectName('Valid Name')).not.toThrow();
    });

    it('should validate project description length', () => {
      expect(() => projectService.validateProjectDescription('')).toThrow('Validation error: Description is required');
      expect(() => projectService.validateProjectDescription('Short')).toThrow('Validation error: Description must be at least 10 characters');
      expect(() => projectService.validateProjectDescription('A'.repeat(1001))).toThrow('Validation error: Description must be less than 1000 characters');
      expect(() => projectService.validateProjectDescription('This is a valid description with enough characters')).not.toThrow();
    });

    it('should validate project status', () => {
      const validStatuses = ['active', 'draft', 'completed', 'archived'];
      
      validStatuses.forEach(status => {
        expect(() => projectService.validateProjectStatus(status as any)).not.toThrow();
      });

      expect(() => projectService.validateProjectStatus('invalid' as any)).toThrow('Validation error: Invalid project status');
    });
  });

  describe('error handling', () => {
    it('should handle rate limiting errors', async () => {
      const rateLimitError = new ApiException({
        message: 'Rate limit exceeded',
        status: 429,
      });

      mockHttpClient.get.mockRejectedValue(rateLimitError);

      await expect(projectService.getProjects()).rejects.toThrow(ApiException);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/projects', {});
    });

    it('should handle server errors', async () => {
      const serverError = new ApiException({
        message: 'Internal server error',
        status: 500,
      });

      mockHttpClient.post.mockRejectedValue(serverError);

      const createRequest: CreateProjectRequest = {
        project: {
          name: 'Test Project',
          description: 'Test Description',
        },
      };

      await expect(projectService.createProject(createRequest)).rejects.toThrow(ApiException);
    });
  });
});