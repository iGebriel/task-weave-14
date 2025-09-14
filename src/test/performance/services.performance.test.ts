import { describe, it, expect, beforeEach } from 'vitest';
import { 
  benchmark, 
  measureServicePerformance, 
  expectPerformance,
  measureBulkOperation,
  MemoryLeakDetector,
  createPerformanceTestSuite
} from './PerformanceUtils';
import { setupTestServices, createMockUser, createMockProject, createMockTask } from '@/test/utils';

describe('Service Performance Tests', () => {
  let mockServices: ReturnType<typeof setupTestServices>;

  beforeEach(() => {
    mockServices = setupTestServices();
  });

  describe('Authentication Service Performance', () => {
    it('should login within performance threshold', async () => {
      const loginCall = () => mockServices.authentication.login({
        email: 'test@example.com',
        password: 'password123'
      });

      const result = await measureServicePerformance(
        'AuthenticationService',
        'login',
        loginCall,
        100
      );

      expect(result.average.executionTime).toBeLessThan(5); // 5ms threshold
      expectPerformance(result.average).toBeFasterThan(10);
    });

    it('should handle concurrent login requests efficiently', async () => {
      const concurrentLogins = async () => {
        const promises = Array.from({ length: 10 }, () =>
          mockServices.authentication.login({
            email: 'test@example.com',
            password: 'password123'
          })
        );
        await Promise.all(promises);
      };

      const result = await benchmark('ConcurrentLogins', concurrentLogins, 20);
      
      // Should handle 10 concurrent logins in under 50ms
      expectPerformance(result.average).toBeFasterThan(50);
    });

    it('should not leak memory during repeated operations', async () => {
      const detector = new MemoryLeakDetector();
      detector.start();

      // Perform many login operations
      for (let i = 0; i < 1000; i++) {
        await mockServices.authentication.login({
          email: `test${i}@example.com`,
          password: 'password123'
        });
      }

      const report = detector.stop();
      expect(report.isLeaking).toBe(false);
    });
  });

  describe('Project Service Performance', () => {
    it('should create projects within performance threshold', async () => {
      const createProject = () => mockServices.project.createProject({
        name: `Test Project ${Date.now()}`,
        description: 'Performance test project'
      });

      const result = await measureServicePerformance(
        'ProjectService',
        'createProject',
        createProject,
        50
      );

      expectPerformance(result.average).toBeFasterThan(3);
    });

    it('should efficiently handle bulk project operations', async () => {
      const projects = Array.from({ length: 100 }, (_, i) => ({
        name: `Bulk Project ${i}`,
        description: `Generated project ${i}`
      }));

      const createProjectOperation = (projectData: typeof projects[0]) => 
        mockServices.project.createProject(projectData);

      const result = await measureBulkOperation(
        'BulkProjectCreation',
        createProjectOperation,
        projects,
        10 // Process in batches of 10
      );

      // Bulk operations should be efficient
      expectPerformance(result.average).toBeFasterThan(500);
    });

    it('should scale project retrieval with dataset size', async () => {
      // Setup different dataset sizes
      const datasets = [10, 100, 500, 1000];
      const results: Array<{ size: number; time: number }> = [];

      for (const size of datasets) {
        // Populate projects
        const projects = Array.from({ length: size }, (_, i) => 
          createMockProject({ id: `project-${i}`, name: `Project ${i}` })
        );
        mockServices.project.setProjects(projects);

        const result = await measureServicePerformance(
          'ProjectService',
          `getAllProjects_${size}`,
          () => mockServices.project.getAllProjects(),
          20
        );

        results.push({ size, time: result.average.executionTime });
      }

      // Performance should scale reasonably (not exponentially)
      const scalingFactor = results[3].time / results[0].time;
      expect(scalingFactor).toBeLessThan(5); // Should not be more than 5x slower for 100x data
    });
  });

  describe('Task Service Performance', () => {
    it('should handle task operations efficiently', async () => {
      const suite = createPerformanceTestSuite('TaskService');

      suite.addTest('createTask', () => mockServices.task.createTask({
        title: 'Performance Test Task',
        projectId: 'project-1',
        columnId: 'todo'
      }), 100);

      suite.addTest('updateTask', async () => {
        const task = await mockServices.task.createTask({
          title: 'Task to Update',
          projectId: 'project-1',
          columnId: 'todo'
        });
        return mockServices.task.updateTask(task.id, {
          title: 'Updated Task'
        });
      }, 50);

      suite.addTest('moveTask', async () => {
        const task = await mockServices.task.createTask({
          title: 'Task to Move',
          projectId: 'project-1',
          columnId: 'todo'
        });
        return mockServices.task.moveTask(task.id, 'in-progress', 0);
      }, 50);

      const results = await suite.run();

      // All operations should be fast
      results.forEach(result => {
        expectPerformance(result.average).toBeFasterThan(10);
      });
    });

    it('should efficiently filter and sort tasks', async () => {
      // Setup large dataset
      const tasks = Array.from({ length: 1000 }, (_, i) => 
        createMockTask({ 
          id: `task-${i}`, 
          title: `Task ${i}`,
          projectId: 'project-1',
          status: i % 3 === 0 ? 'completed' : 'todo'
        })
      );
      mockServices.task.setTasks(tasks);

      const filterTasks = async () => {
        const allTasks = await mockServices.task.getTasksByProject('project-1');
        return allTasks.filter(task => task.status === 'completed');
      };

      const result = await benchmark('TaskFiltering', filterTasks, 50);
      expectPerformance(result.average).toBeFasterThan(20);
    });
  });

  describe('Cross-Service Performance', () => {
    it('should handle complex workflows efficiently', async () => {
      const complexWorkflow = async () => {
        // 1. Authenticate user
        await mockServices.authentication.login({
          email: 'workflow@example.com',
          password: 'password123'
        });

        // 2. Create project
        const project = await mockServices.project.createProject({
          name: 'Workflow Project',
          description: 'Complex workflow test'
        });

        // 3. Create multiple tasks
        const tasks = await Promise.all([
          mockServices.task.createTask({
            title: 'Task 1',
            projectId: project.id,
            columnId: 'todo'
          }),
          mockServices.task.createTask({
            title: 'Task 2',
            projectId: project.id,
            columnId: 'todo'
          }),
          mockServices.task.createTask({
            title: 'Task 3',
            projectId: project.id,
            columnId: 'todo'
          })
        ]);

        // 4. Move tasks through workflow
        await Promise.all(tasks.map(task => 
          mockServices.task.moveTask(task.id, 'in-progress', 0)
        ));

        return { project, tasks };
      };

      const result = await benchmark('ComplexWorkflow', complexWorkflow, 20);
      
      // Complex workflow should complete in reasonable time
      expectPerformance(result.average).toBeFasterThan(100);
    });

    it('should maintain performance under concurrent load', async () => {
      const concurrentWorkflows = async () => {
        // Simulate multiple users working simultaneously
        const workflows = Array.from({ length: 5 }, (_, i) => 
          (async () => {
            await mockServices.authentication.login({
              email: `user${i}@example.com`,
              password: 'password123'
            });

            const project = await mockServices.project.createProject({
              name: `Concurrent Project ${i}`,
              description: `Project for user ${i}`
            });

            return mockServices.task.createTask({
              title: `Concurrent Task ${i}`,
              projectId: project.id,
              columnId: 'todo'
            });
          })()
        );

        await Promise.all(workflows);
      };

      const result = await benchmark('ConcurrentWorkflows', concurrentWorkflows, 10);
      
      // Should handle concurrent load efficiently
      expectPerformance(result.average).toBeFasterThan(200);
    });
  });

  describe('Storage Service Performance', () => {
    it('should perform storage operations efficiently', async () => {
      const storageOperations = async () => {
        // Store data
        mockServices.storage.setItem('perf-test', { data: 'test'.repeat(1000) });
        
        // Retrieve data
        const retrieved = mockServices.storage.getItem('perf-test');
        
        // Update data
        mockServices.storage.setItem('perf-test', { ...retrieved, updated: true });
        
        // Clean up
        mockServices.storage.removeItem('perf-test');
      };

      const result = await benchmark('StorageOperations', storageOperations, 100);
      expectPerformance(result.average).toBeFasterThan(5);
    });

    it('should handle large data objects efficiently', async () => {
      const largeDataTest = () => {
        // Create large object (1MB of data)
        const largeObject = {
          data: 'x'.repeat(1024 * 1024),
          timestamp: Date.now(),
          metadata: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
        };

        mockServices.storage.setItem('large-data', largeObject);
        const retrieved = mockServices.storage.getItem('large-data');
        mockServices.storage.removeItem('large-data');

        return retrieved;
      };

      const result = await benchmark('LargeDataStorage', largeDataTest, 10);
      
      // Large data operations should complete within reasonable time
      expectPerformance(result.average).toBeFasterThan(50);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      const testOperation = () => mockServices.project.getAllProjects();
      
      // Establish baseline
      const baselineResult = await benchmark('BaselineOperation', testOperation, 50);
      
      // Simulate performance degradation
      mockServices.project.getAllProjects.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 20)); // Add 20ms delay
        return [];
      });
      
      const currentResult = await benchmark('CurrentOperation', testOperation, 50);
      
      // Should detect regression
      const hasRegression = currentResult.average.executionTime > baselineResult.average.executionTime * 1.5;
      expect(hasRegression).toBe(true);
    });
  });
});
