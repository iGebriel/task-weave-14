import { ProjectTransformer } from '../ProjectTransformer';
import { Project as ApiProject } from '@/types/api';
import { Project as UIProject } from '@/types';

describe('ProjectTransformer', () => {
  const mockApiProject: ApiProject = {
    id: 123,
    name: 'Test Project',
    description: 'A test project description',
    status: 'active',
    deletion_requested: false,
    deletion_requested_at: null,
    user: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  };

  describe('apiToUi', () => {
    it('transforms API project to UI project correctly', () => {
      const result = ProjectTransformer.apiToUi(mockApiProject);

      expect(result).toEqual({
        id: '123',
        name: 'Test Project',
        description: 'A test project description',
        status: 'active',
        isPublic: false,
        owner: 'John Doe',
        collaborators: 1,
        tasksCount: 0,
        completedTasks: 0,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        deletionRequested: false,
        deletionRequestedAt: undefined,
      });
    });

    it('handles deletion requested date correctly', () => {
      const projectWithDeletion = {
        ...mockApiProject,
        deletion_requested: true,
        deletion_requested_at: '2024-01-16T12:00:00Z',
      };

      const result = ProjectTransformer.apiToUi(projectWithDeletion);

      expect(result.deletionRequested).toBe(true);
      expect(result.deletionRequestedAt).toEqual(new Date('2024-01-16T12:00:00Z'));
    });
  });

  describe('apiArrayToUi', () => {
    it('transforms array of API projects to UI projects', () => {
      const apiProjects = [mockApiProject, { ...mockApiProject, id: 456, name: 'Second Project' }];
      
      const result = ProjectTransformer.apiArrayToUi(apiProjects);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('123');
      expect(result[1].id).toBe('456');
      expect(result[1].name).toBe('Second Project');
    });

    it('handles empty array', () => {
      const result = ProjectTransformer.apiArrayToUi([]);
      expect(result).toEqual([]);
    });
  });

  describe('uiToApiCreate', () => {
    it('transforms UI project data to API create format', () => {
      const uiProject: Pick<UIProject, 'name' | 'description' | 'status'> = {
        name: 'New Project',
        description: 'New project description',
        status: 'draft',
      };

      const result = ProjectTransformer.uiToApiCreate(uiProject);

      expect(result).toEqual({
        project: {
          name: 'New Project',
          description: 'New project description',
          status: 'draft',
        },
      });
    });
  });

  describe('uiToApiUpdate', () => {
    it('transforms UI project data to API update format', () => {
      const uiProject: Partial<Pick<UIProject, 'name' | 'description' | 'status'>> = {
        name: 'Updated Project',
        status: 'active',
      };

      const result = ProjectTransformer.uiToApiUpdate(uiProject);

      expect(result).toEqual({
        project: {
          name: 'Updated Project',
          status: 'active',
        },
      });
    });

    it('handles empty update object', () => {
      const result = ProjectTransformer.uiToApiUpdate({});

      expect(result).toEqual({
        project: {},
      });
    });

    it('excludes undefined fields', () => {
      const uiProject: Partial<Pick<UIProject, 'name' | 'description' | 'status'>> = {
        name: 'Updated Project',
        description: undefined,
        status: 'active',
      };

      const result = ProjectTransformer.uiToApiUpdate(uiProject);

      expect(result).toEqual({
        project: {
          name: 'Updated Project',
          status: 'active',
        },
      });
    });
  });
});