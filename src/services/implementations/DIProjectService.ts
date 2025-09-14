import {
  IProjectService,
  IStorageService,
  INotificationService,
  ProjectStats
} from '../interfaces';
import { Project, CreateProjectData, UpdateProjectData } from '@/types';
import { apiClient } from '@/lib/api';
import { dummyProjects, getDummyProjectsForUser } from '@/data/dummyData';

/**
 * DI-compatible Project service implementation
 */
export class DIProjectService implements IProjectService {
  private readonly PROJECTS_STORAGE_KEY = 'projects';
  private projects: Project[] = [];

  constructor(
    private storage: IStorageService,
    private notification: INotificationService
  ) {
    this.loadProjectsFromStorage();
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      const response = await apiClient.getProjects();

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load projects');
      }

      // Transform API projects to frontend format
      const projects = response.data.data.map(apiProject => ({
        id: apiProject.id.toString(),
        name: apiProject.name,
        description: apiProject.description,
        status: apiProject.status,
        createdAt: new Date(apiProject.created_at),
        updatedAt: new Date(apiProject.updated_at),
        tasksCount: 0, // This would need to be fetched separately or included in API
        owner: {
          id: apiProject.user.id.toString(),
          name: apiProject.user.name,
          email: apiProject.user.email,
        },
      }));

      // Cache projects locally
      this.projects = projects;
      this.storage.setItem(this.PROJECTS_STORAGE_KEY, projects);

      return projects;
    } catch (error) {
      // Fallback to local data if API is not accessible
      console.warn('API failed to load projects, falling back to local data:', error);
      this.notification.warning('Using offline data - some features may be limited');

      // Return cached projects or load from storage
      if (this.projects.length > 0) {
        return [...this.projects];
      }

      // Load from storage as fallback
      this.loadProjectsFromStorage();

      // If still no projects, use dummy data
      if (this.projects.length === 0) {
        this.projects = [...dummyProjects];
        this.storage.setItem(this.PROJECTS_STORAGE_KEY, this.projects);
      }

      return [...this.projects];
    }
  }

  async getProject(id: string): Promise<Project> {
    try {
      const response = await apiClient.getProject(parseInt(id));

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Project not found');
      }

      const apiProject = response.data;

      // Transform API project to frontend format
      const project: Project = {
        id: apiProject.id.toString(),
        name: apiProject.name,
        description: apiProject.description,
        status: apiProject.status,
        createdAt: new Date(apiProject.created_at),
        updatedAt: new Date(apiProject.updated_at),
        tasksCount: 0, // This would need to be fetched separately
        owner: {
          id: apiProject.user.id.toString(),
          name: apiProject.user.name,
          email: apiProject.user.email,
        },
      };

      return project;
    } catch (error) {
      // Fallback to local data if API is not accessible
      console.warn('API failed to load project, falling back to local data:', error);
      this.notification.warning('Using offline data - some features may be limited');

      // Try to find project in local cache
      const project = this.projects.find(p => p.id === id);
      if (project) {
        return { ...project };
      }

      // If not found locally, throw error
      this.notification.error('Project not found');
      throw new Error('Project not found');
    }
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    try {
      const response = await apiClient.createProject({
        project: {
          name: data.name,
          description: data.description,
          status: data.status || 'active',
        }
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create project');
      }

      const apiProject = response.data;

      // Transform API project to frontend format
      const newProject: Project = {
        id: apiProject.id.toString(),
        name: apiProject.name,
        description: apiProject.description,
        status: apiProject.status,
        color: data.color || '#3B82F6',
        ownerId: apiProject.user.id.toString(),
        collaborators: data.collaborators || [],
        createdAt: new Date(apiProject.created_at),
        updatedAt: new Date(apiProject.updated_at),
        tasksCount: 0,
        completedTasksCount: 0,
        dueDate: data.dueDate,
        tags: data.tags || [],
      };

      // Update local cache
      this.projects.push(newProject);
      this.saveProjectsToStorage();

      this.notification.success('Project created successfully');
      return { ...newProject };
    } catch (error) {
      // Fallback to local creation if API is not accessible
      console.warn('API failed to create project, creating locally:', error);
      this.notification.warning('Project created offline - will sync when connection is restored');

      // Create project locally
      const newProject: Project = {
        id: `project_${Date.now()}`,
        name: data.name,
        description: data.description,
        status: data.status || 'active',
        color: data.color || '#3B82F6',
        ownerId: data.ownerId || '1',
        collaborators: data.collaborators || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        tasksCount: 0,
        completedTasksCount: 0,
        dueDate: data.dueDate,
        tags: data.tags || [],
      };

      // Update local cache
      this.projects.push(newProject);
      this.saveProjectsToStorage();

      this.notification.success('Project created successfully (offline)');
      return { ...newProject };
    }
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    try {
      const index = this.projects.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Project not found');
      }

      const updatedProject: Project = {
        ...this.projects[index],
        ...data,
        updatedAt: new Date(),
      };

      this.projects[index] = updatedProject;
      this.saveProjectsToStorage();

      this.notification.success('Project updated successfully');
      return { ...updatedProject };
    } catch (error) {
      this.notification.error('Failed to update project');
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const index = this.projects.findIndex(p => p.id === id);
      if (index === -1) {
        throw new Error('Project not found');
      }

      this.projects.splice(index, 1);
      this.saveProjectsToStorage();

      this.notification.success('Project deleted successfully');
    } catch (error) {
      this.notification.error('Failed to delete project');
      throw error;
    }
  }

  async getProjectStats(): Promise<ProjectStats> {
    try {
      const total = this.projects.length;
      const active = this.projects.filter(p => p.status === 'active').length;
      const completed = this.projects.filter(p => p.status === 'completed').length;
      const archived = this.projects.filter(p => p.status === 'archived').length;
      const draft = this.projects.filter(p => p.status === 'draft').length;

      return {
        total,
        active,
        completed,
        archived,
        draft,
      };
    } catch (error) {
      this.notification.error('Failed to load project statistics');
      throw error;
    }
  }

  async searchProjects(query: string): Promise<Project[]> {
    try {
      if (!query.trim()) {
        return [...this.projects];
      }

      const lowercaseQuery = query.toLowerCase();
      return this.projects.filter(project =>
        project.name.toLowerCase().includes(lowercaseQuery) ||
        project.description?.toLowerCase().includes(lowercaseQuery) ||
        project.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      this.notification.error('Failed to search projects');
      throw error;
    }
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    try {
      return this.projects.filter(p => p.status === status);
    } catch (error) {
      this.notification.error('Failed to load projects by status');
      throw error;
    }
  }

  /**
   * Load projects from storage
   */
  private loadProjectsFromStorage(): void {
    const storedProjects = this.storage.getItem<Project[]>(this.PROJECTS_STORAGE_KEY);
    if (storedProjects) {
      this.projects = storedProjects.map(project => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        dueDate: project.dueDate ? new Date(project.dueDate) : undefined,
      }));
    }
  }

  /**
   * Save projects to storage
   */
  private saveProjectsToStorage(): void {
    this.storage.setItem(this.PROJECTS_STORAGE_KEY, this.projects);
  }
}