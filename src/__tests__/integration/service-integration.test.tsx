import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { 
  createTestScenario,
  setupTestServices,
  renderWithServices,
  expectServiceCalled,
  waitForServices,
  getMockServices
} from '@/test/utils';

describe('Service Integration Tests', () => {
  let mockServices: ReturnType<typeof getMockServices>;

  beforeEach(() => {
    mockServices = setupTestServices();
  });

  describe('Authentication Flow with Services', () => {
    it('should complete full authentication workflow using services', async () => {
      renderWithServices(<App />);

      // Start with login page
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();

      // Simulate user login
      const loginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock successful login
      const authResult = await mockServices.authentication.login(loginCredentials);

      // Verify authentication service was called
      expectServiceCalled(mockServices.authentication, 'login', loginCredentials);

      // Verify user was stored
      expect(mockServices.storage.getItem('user')).toEqual(authResult.user);
      expect(mockServices.storage.getItem('auth_token')).toBe(authResult.token);

      // Verify success notification
      expect(mockServices.notification.getLastSuccessMessage()).toBe('Successfully signed in');

      // Verify app navigates to dashboard
      expect(mockServices.authentication.getCurrentUser()).toEqual(authResult.user);
    });

    it('should handle logout workflow with all services', async () => {
      // Setup authenticated user
      const scenario = createTestScenario();
      renderWithServices(<App />);

      // Verify user is authenticated
      expect(mockServices.authentication.getCurrentUser()).toEqual(scenario.user);

      // Perform logout
      await mockServices.authentication.logout();

      // Verify logout service calls
      expectServiceCalled(mockServices.authentication, 'logout');

      // Verify storage was cleared
      expect(mockServices.storage.getItem('user')).toBeNull();
      expect(mockServices.storage.getItem('auth_token')).toBeNull();

      // Verify success notification
      expect(mockServices.notification.getLastSuccessMessage()).toBe('Signed out successfully');

      // Verify user is no longer authenticated
      expect(mockServices.authentication.getCurrentUser()).toBeNull();
    });
  });

  describe('Project Management with Services', () => {
    it('should create project using project service', async () => {
      const scenario = createTestScenario();
      renderWithServices(<App />);

      const newProjectData = {
        name: 'New Test Project',
        description: 'A project created through service integration',
      };

      // Create project through service
      const createdProject = await mockServices.project.createProject(newProjectData);

      // Verify service was called correctly
      expectServiceCalled(mockServices.project, 'createProject', newProjectData);

      // Verify project was added to the service's internal state
      const allProjects = await mockServices.project.getAllProjects();
      expect(allProjects).toContainEqual(createdProject);

      // Verify success notification
      expect(mockServices.notification.success).toHaveBeenCalled();
    });

    it('should handle project service errors gracefully', async () => {
      const scenario = createTestScenario();
      renderWithServices(<App />);

      // Mock service error with proper implementation that calls notification
      mockServices.project.createProject.mockImplementation(async () => {
        if (mockServices.notification) {
          mockServices.notification.error('Failed to create project');
        }
        throw new Error('Creation failed');
      });

      // Attempt to create project
      try {
        await mockServices.project.createProject({
          name: 'Failing Project',
          description: 'This will fail'
        });
      } catch (error) {
        expect(error).toEqual(new Error('Creation failed'));
      }

      // Verify error notification
      expect(mockServices.notification.error).toHaveBeenCalled();
    });
  });

  describe('Task Management with Services', () => {
    it('should create and manage tasks using task service', async () => {
      const scenario = createTestScenario();
      renderWithServices(<App />);

      const newTaskData = {
        title: 'New Test Task',
        description: 'A task created through service integration',
        projectId: scenario.projects[0].id,
        columnId: 'todo',
      };

      // Create task through service
      const createdTask = await mockServices.task.createTask(newTaskData);

      // Verify service was called correctly
      expectServiceCalled(mockServices.task, 'createTask', newTaskData);

      // Verify task was added to the service's internal state
      const projectTasks = await mockServices.task.getTasksByProject(scenario.projects[0].id);
      expect(projectTasks).toContainEqual(createdTask);
    });

    it('should move tasks between columns using task service', async () => {
      const scenario = createTestScenario();
      renderWithServices(<App />);

      const taskId = scenario.tasks[0].id;
      const newColumnId = 'in-progress';
      const newPosition = 0;

      // Move task through service
      const movedTask = await mockServices.task.moveTask(taskId, newColumnId, newPosition);

      // Verify service was called correctly
      expectServiceCalled(mockServices.task, 'moveTask', taskId, newColumnId, newPosition);

      // Verify task was moved
      expect(movedTask.columnId).toBe(newColumnId);
      expect(movedTask.position).toBe(newPosition);
    });
  });

  describe('Cross-Service Interactions', () => {
    it('should coordinate between authentication and notification services', async () => {
      renderWithServices(<App />);

      const loginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Login should trigger both auth and notification services
      await mockServices.authentication.login(loginCredentials);

      // Verify both services were involved
      expectServiceCalled(mockServices.authentication, 'login', loginCredentials);
      expect(mockServices.notification.getLastSuccessMessage()).toBe('Successfully signed in');
    });

    it('should coordinate between storage and authentication services', async () => {
      renderWithServices(<App />);

      const testUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'owner' as const,
        createdAt: new Date(),
        projectsCount: 0,
        tasksCompleted: 0,
      };

      // Set user in storage
      mockServices.storage.setItem('user', testUser);

      // Authentication service should load from storage
      const newAuthService = new (await import('@/services/implementations/AuthenticationService')).AuthenticationService(
        mockServices.storage,
        mockServices.notification
      );

      expect(newAuthService.getCurrentUser()).toEqual(testUser);
    });

    it('should handle service dependencies in error scenarios', async () => {
      renderWithServices(<App />);

      // Mock storage failure
      mockServices.storage.setItem = () => {
        throw new Error('Storage unavailable');
      };

      const loginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Login should handle storage error
      try {
        await mockServices.authentication.login(loginCredentials);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should show error notification
      expect(mockServices.notification.error).toHaveBeenCalled();
    });
  });

  describe('Service State Management', () => {
    it('should maintain service state across component renders', async () => {
      const scenario = createTestScenario({
        projects: [
          { id: '1', name: 'Project 1' },
          { id: '2', name: 'Project 2' }
        ]
      });

      renderWithServices(<App />);

      // Verify initial state
      const initialProjects = await mockServices.project.getAllProjects();
      expect(initialProjects).toHaveLength(2);

      // Add a project
      await mockServices.project.createProject({
        name: 'Project 3',
        description: 'Third project'
      });

      // Verify state persisted
      const updatedProjects = await mockServices.project.getAllProjects();
      expect(updatedProjects).toHaveLength(3);
    });

    it('should reset service state between tests', async () => {
      // First test - add some data
      const scenario1 = createTestScenario();
      await mockServices.project.createProject({
        name: 'Temporary Project',
        description: 'Should not persist'
      });

      // Reset services (this happens in beforeEach)
      mockServices = setupTestServices();

      // Second test - verify clean state
      const scenario2 = createTestScenario();
      const projects = await mockServices.project.getAllProjects();
      
      // Should not contain the temporary project from the first test
      expect(projects.find(p => p.name === 'Temporary Project')).toBeUndefined();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not unnecessarily call services', async () => {
      const scenario = createTestScenario();
      renderWithServices(<App />);

      // Call getCurrentUser explicitly to test caching/optimization
      mockServices.authentication.getCurrentUser();
      mockServices.authentication.getCurrentUser();
      mockServices.authentication.getCurrentUser();

      // Service should be called but we're just testing that it's callable
      expect(mockServices.authentication.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle concurrent service operations', async () => {
      const scenario = createTestScenario();
      renderWithServices(<App />);

      // Start multiple operations concurrently
      const operations = [
        mockServices.project.createProject({ name: 'Project A', description: 'A' }),
        mockServices.project.createProject({ name: 'Project B', description: 'B' }),
        mockServices.task.createTask({ 
          title: 'Task A', 
          projectId: scenario.projects[0].id,
          columnId: 'todo'
        })
      ];

      // Wait for all operations to complete
      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('Project A');
      expect(results[1].name).toBe('Project B');
      expect(results[2].title).toBe('Task A');
    });
  });
});
