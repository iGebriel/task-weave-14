import { Project as ApiProject } from '@/types/api';
import { Project as UIProject } from '@/types';

/**
 * ProjectTransformer service handles the transformation between API and UI project formats.
 * This separation follows the Single Responsibility Principle by extracting transformation
 * logic from UI components.
 */
export class ProjectTransformer {
  /**
   * Transforms an API project to UI project format
   */
  static apiToUi(apiProject: ApiProject): UIProject {
    return {
      id: apiProject.id.toString(),
      name: apiProject.name,
      description: apiProject.description,
      status: apiProject.status,
      isPublic: false, // API doesn't have this field, defaulting to false for now
      owner: apiProject.user.name,
      collaborators: 1, // Default to 1 (the owner), can be enhanced later
      tasksCount: 0, // Will be loaded separately if needed
      completedTasks: 0, // Will be loaded separately if needed
      createdAt: new Date(apiProject.created_at),
      deletionRequested: apiProject.deletion_requested,
      deletionRequestedAt: apiProject.deletion_requested_at 
        ? new Date(apiProject.deletion_requested_at) 
        : undefined,
    };
  }

  /**
   * Transforms multiple API projects to UI format
   */
  static apiArrayToUi(apiProjects: ApiProject[]): UIProject[] {
    return apiProjects.map(this.apiToUi);
  }

  /**
   * Transforms UI project data to API create format
   */
  static uiToApiCreate(project: Pick<UIProject, 'name' | 'description' | 'status'>) {
    return {
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
      },
    };
  }

  /**
   * Transforms UI project data to API update format
   */
  static uiToApiUpdate(project: Partial<Pick<UIProject, 'name' | 'description' | 'status'>>) {
    return {
      project: {
        ...(project.name && { name: project.name }),
        ...(project.description && { description: project.description }),
        ...(project.status && { status: project.status }),
      },
    };
  }
}