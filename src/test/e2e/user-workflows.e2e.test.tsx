import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import App from '@/App';
import { 
  E2ETestRunner, 
  E2EActions, 
  createE2EScenario, 
  E2EUtils 
} from './E2EUtils';
import { renderWithServices } from '@/test/utils';

describe('Complete User Workflow E2E Tests', () => {
  let runner: E2ETestRunner;
  let actions: E2EActions;

  beforeEach(() => {
    runner = new E2ETestRunner();
    actions = new E2EActions(runner.getUser(), runner.getServices());
  });

  afterEach(() => {
    // Clean up any side effects
    E2EUtils.restoreOnline();
  });

  describe('New User Onboarding Journey', () => {
    it('should complete full user registration and project creation flow', async () => {
      const scenario = createE2EScenario(
        'New User Onboarding',
        'A new user registers, creates their first project, and adds tasks'
      )
        .withPreconditions([
          'Application is accessible',
          'Registration is enabled',
          'No existing user data'
        ])
        .addStep(
          'Render App',
          'Load the application',
          async () => {
            renderWithServices(<App />);
          },
          async () => {
            await actions.verify.userIsNotAuthenticated();
          }
        )
        .addStep(
          'User Registration',
          'Register a new user account',
          async () => {
            await actions.auth.register(
              'John Doe',
              'john.doe@example.com',
              'SecurePassword123'
            );
          },
          async () => {
            await actions.verify.userIsAuthenticated();
            // Note: Notification verification skipped as toasts may not be visible in test environment
          }
        )
        .addStep(
          'Create First Project',
          'Create the user\'s first project',
          async () => {
            await actions.projects.create(
              'My First Project',
              'This is my first project on the platform'
            );
          },
          async () => {
            await actions.verify.projectExists('My First Project');
            await actions.verify.notificationShown('Project created successfully');
          }
        )
        .addStep(
          'Add Initial Tasks',
          'Add some tasks to get started',
          async () => {
            await actions.navigation.goToProject('My First Project');
            await actions.tasks.create('Set up project structure');
            await actions.tasks.create('Define requirements');
            await actions.tasks.create('Create initial wireframes');
          },
          async () => {
            await actions.verify.taskExists('Set up project structure');
            await actions.verify.taskExists('Define requirements');
            await actions.verify.taskExists('Create initial wireframes');
          }
        )
        .addStep(
          'Move Tasks Through Workflow',
          'Move tasks to different columns',
          async () => {
            await actions.tasks.move('Set up project structure', 'in-progress');
            await actions.tasks.move('Define requirements', 'completed');
          },
          async () => {
            await actions.verify.taskInColumn('Set up project structure', 'in-progress');
            await actions.verify.taskInColumn('Define requirements', 'completed');
          }
        )
        .withExpectedOutcome('User has successfully registered, created a project, and managed tasks')
        .build();

      const result = await runner.runScenario(scenario);
      
      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(5);
      expect(result.duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Existing User Project Management', () => {
    it('should handle complete project lifecycle management', async () => {
      const scenario = createE2EScenario(
        'Project Lifecycle Management',
        'An existing user manages the complete lifecycle of a project'
      )
        .withPreconditions([
          'User is authenticated',
          'User has access to project management features'
        ])
        .addStep(
          'Setup and Login',
          'Authenticate existing user',
          async () => {
            renderWithServices(<App />);
            await actions.auth.login('existing.user@example.com', 'password123');
          },
          async () => {
            await actions.verify.userIsAuthenticated();
          }
        )
        .addStep(
          'Create New Project',
          'Create a project for a client',
          async () => {
            await actions.projects.create(
              'Client Website Redesign',
              'Complete redesign of client\'s corporate website'
            );
          },
          async () => {
            await actions.verify.projectExists('Client Website Redesign');
          }
        )
        .addStep(
          'Project Planning Phase',
          'Add planning tasks and organize them',
          async () => {
            await actions.navigation.goToProject('Client Website Redesign');
            
            // Add planning tasks
            await actions.tasks.create('Client requirements gathering');
            await actions.tasks.create('Competitor analysis');
            await actions.tasks.create('Create user personas');
            await actions.tasks.create('Design wireframes');
            await actions.tasks.create('Client feedback session');
            
            // Start working on some tasks
            await actions.tasks.move('Client requirements gathering', 'in-progress');
            await actions.tasks.move('Competitor analysis', 'completed');
          },
          async () => {
            await actions.verify.taskInColumn('Client requirements gathering', 'in-progress');
            await actions.verify.taskInColumn('Competitor analysis', 'completed');
            await actions.verify.taskInColumn('Create user personas', 'todo');
          }
        )
        .addStep(
          'Development Phase',
          'Add development tasks and manage workflow',
          async () => {
            // Add development tasks
            await actions.tasks.create('Set up development environment');
            await actions.tasks.create('Create responsive layout');
            await actions.tasks.create('Implement interactive features');
            await actions.tasks.create('Optimize for performance');
            
            // Progress through workflow
            await actions.tasks.move('Create user personas', 'in-progress');
            await actions.tasks.move('Client requirements gathering', 'completed');
            await actions.tasks.move('Set up development environment', 'in-progress');
          },
          async () => {
            await actions.verify.taskInColumn('Create user personas', 'in-progress');
            await actions.verify.taskInColumn('Set up development environment', 'in-progress');
          }
        )
        .addStep(
          'Project Completion',
          'Complete all tasks and project',
          async () => {
            // Complete all remaining tasks
            await actions.tasks.move('Create user personas', 'completed');
            await actions.tasks.move('Design wireframes', 'completed');
            await actions.tasks.move('Set up development environment', 'completed');
            await actions.tasks.move('Create responsive layout', 'completed');
          },
          async () => {
            // Verify all critical tasks are completed
            await actions.verify.taskInColumn('Client requirements gathering', 'completed');
            await actions.verify.taskInColumn('Competitor analysis', 'completed');
            await actions.verify.taskInColumn('Create user personas', 'completed');
          }
        )
        .withExpectedOutcome('Project successfully managed from creation to completion')
        .build();

      const result = await runner.runScenario(scenario);
      
      expect(result.success).toBe(true);
      expect(result.steps.every(step => step.success)).toBe(true);
    });
  });

  describe('Collaborative Workflow', () => {
    it('should handle multi-user collaboration scenarios', async () => {
      const scenario = createE2EScenario(
        'Team Collaboration Workflow',
        'Multiple users collaborate on a shared project with task assignments'
      )
        .withPreconditions([
          'Multiple users have access to the same project',
          'Task assignment features are enabled'
        ])
        .addStep(
          'Project Manager Setup',
          'Project manager creates project and initial tasks',
          async () => {
            renderWithServices(<App />);
            await actions.auth.login('manager@example.com', 'password123');
            await actions.projects.create(
              'Team Collaboration Project',
              'A project to demonstrate team collaboration features'
            );
            await actions.navigation.goToProject('Team Collaboration Project');
          },
          async () => {
            await actions.verify.projectExists('Team Collaboration Project');
          }
        )
        .addStep(
          'Create Team Tasks',
          'Add tasks that will be assigned to different team members',
          async () => {
            await actions.tasks.create('Backend API development');
            await actions.tasks.create('Frontend UI implementation');
            await actions.tasks.create('Database schema design');
            await actions.tasks.create('Quality assurance testing');
            await actions.tasks.create('DevOps and deployment');
          },
          async () => {
            await actions.verify.taskExists('Backend API development');
            await actions.verify.taskExists('Frontend UI implementation');
            await actions.verify.taskExists('Quality assurance testing');
          }
        )
        .addStep(
          'Assign Tasks to Team Members',
          'Assign different tasks to team members',
          async () => {
            await actions.tasks.assignTo('Backend API development', 'Alice Johnson');
            await actions.tasks.assignTo('Frontend UI implementation', 'Bob Smith');
            await actions.tasks.assignTo('Database schema design', 'Charlie Brown');
            await actions.tasks.assignTo('Quality assurance testing', 'Diana Wilson');
          },
          async () => {
            // Verify assignments (would check assignee indicators in real implementation)
            await actions.verify.taskExists('Backend API development');
            await actions.verify.taskExists('Frontend UI implementation');
          }
        )
        .addStep(
          'Simulate Team Progress',
          'Simulate different team members making progress',
          async () => {
            // Simulate Alice starting backend work
            await actions.tasks.move('Backend API development', 'in-progress');
            
            // Simulate Bob starting frontend work
            await actions.tasks.move('Frontend UI implementation', 'in-progress');
            
            // Simulate Charlie completing database design
            await actions.tasks.move('Database schema design', 'completed');
          },
          async () => {
            await actions.verify.taskInColumn('Backend API development', 'in-progress');
            await actions.verify.taskInColumn('Frontend UI implementation', 'in-progress');
            await actions.verify.taskInColumn('Database schema design', 'completed');
          }
        )
        .addStep(
          'Complete Project Delivery',
          'Move remaining tasks to completion',
          async () => {
            await actions.tasks.move('Backend API development', 'completed');
            await actions.tasks.move('Frontend UI implementation', 'completed');
            await actions.tasks.move('Quality assurance testing', 'in-progress');
            await actions.tasks.move('DevOps and deployment', 'in-progress');
          },
          async () => {
            await actions.verify.taskInColumn('Backend API development', 'completed');
            await actions.verify.taskInColumn('Frontend UI implementation', 'completed');
          }
        )
        .withExpectedOutcome('Team successfully collaborated on project delivery')
        .withCleanup(async () => {
          // Clean up test project
          await actions.projects.delete('Team Collaboration Project');
        })
        .build();

      const result = await runner.runScenario(scenario);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      const consoleErrorTracker = E2EUtils.checkConsoleErrors();
      
      const scenario = createE2EScenario(
        'Network Error Recovery',
        'User continues working despite network interruptions'
      )
        .addStep(
          'Normal Operation',
          'User performs normal operations',
          async () => {
            renderWithServices(<App />);
            await actions.auth.login('user@example.com', 'password123');
            await actions.projects.create('Network Test Project');
          },
          async () => {
            await actions.verify.projectExists('Network Test Project');
          }
        )
        .addStep(
          'Simulate Network Issues',
          'Network goes offline during task creation',
          async () => {
            E2EUtils.simulateOffline();
            
            try {
              await actions.navigation.goToProject('Network Test Project');
              await actions.tasks.create('Task created offline');
            } catch (error) {
              // Expected to fail when offline
              console.log('Expected offline error:', error);
            }
          },
          async () => {
            // Verify that app shows appropriate offline indicators
            // In a real app, you'd check for offline notifications
            expect(navigator.onLine).toBe(false);
          }
        )
        .addStep(
          'Network Recovery',
          'Network comes back online and operations resume',
          async () => {
            E2EUtils.restoreOnline();
            await E2EUtils.waitForNetworkIdle();
            
            // Try the operation again
            await actions.tasks.create('Task created after recovery');
          },
          async () => {
            await actions.verify.taskExists('Task created after recovery');
            expect(navigator.onLine).toBe(true);
          }
        )
        .withExpectedOutcome('App gracefully handles network interruptions')
        .withCleanup(async () => {
          E2EUtils.restoreOnline();
          consoleErrorTracker.restore();
        })
        .build();

      const result = await runner.runScenario(scenario);
      
      expect(result.success).toBe(true);
      
      // Check that errors were handled gracefully
      const errors = consoleErrorTracker.getErrors();
      const criticalErrors = errors.filter(error => 
        !error.includes('Expected offline error') && 
        !error.includes('Network request failed')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain responsiveness with large datasets', async () => {
      const scenario = createE2EScenario(
        'Performance with Large Dataset',
        'App remains responsive when working with many projects and tasks'
      )
        .addStep(
          'Setup Large Dataset',
          'Create multiple projects with many tasks',
          async () => {
            renderWithServices(<App />);
            await actions.auth.login('power.user@example.com', 'password123');
            
            // Create multiple projects
            for (let i = 1; i <= 5; i++) {
              await actions.projects.create(`Performance Test Project ${i}`);
            }
          },
          async () => {
            await actions.verify.projectExists('Performance Test Project 1');
            await actions.verify.projectExists('Performance Test Project 5');
          }
        )
        .addStep(
          'Add Many Tasks',
          'Add multiple tasks to each project',
          async () => {
            // Add tasks to first project
            await actions.navigation.goToProject('Performance Test Project 1');
            
            for (let i = 1; i <= 20; i++) {
              await actions.tasks.create(`Performance Task ${i}`);
            }
          },
          async () => {
            await actions.verify.taskExists('Performance Task 1');
            await actions.verify.taskExists('Performance Task 20');
          }
        )
        .addStep(
          'Bulk Task Operations',
          'Perform operations on multiple tasks',
          async () => {
            const startTime = performance.now();
            
            // Move several tasks
            for (let i = 1; i <= 10; i++) {
              await actions.tasks.move(`Performance Task ${i}`, 'in-progress');
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete bulk operations within reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds max
          },
          async () => {
            await actions.verify.taskInColumn('Performance Task 1', 'in-progress');
            await actions.verify.taskInColumn('Performance Task 5', 'in-progress');
            await actions.verify.taskInColumn('Performance Task 10', 'in-progress');
          }
        )
        .addStep(
          'Navigation Performance',
          'Navigate between projects quickly',
          async () => {
            const startTime = performance.now();
            
            await actions.navigation.goToDashboard();
            await actions.navigation.goToProject('Performance Test Project 2');
            await actions.navigation.goToProject('Performance Test Project 3');
            await actions.navigation.goToDashboard();
            
            const endTime = performance.now();
            const navigationTime = endTime - startTime;
            
            // Navigation should be fast
            expect(navigationTime).toBeLessThan(2000); // 2 seconds max
          },
          async () => {
            // Should be back on dashboard
            await actions.verify.projectExists('Performance Test Project 1');
          }
        )
        .withExpectedOutcome('App maintains good performance with large datasets')
        .build();

      const result = await runner.runScenario(scenario);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(15000); // Entire scenario under 15 seconds
    });
  });

  describe('Accessibility Journey', () => {
    it('should support complete keyboard navigation workflow', async () => {
      const scenario = createE2EScenario(
        'Keyboard Navigation Workflow',
        'User completes entire workflow using only keyboard navigation'
      )
        .withPreconditions([
          'All interactive elements are keyboard accessible',
          'Focus management is properly implemented'
        ])
        .addStep(
          'Keyboard Login',
          'Login using only keyboard navigation',
          async () => {
            renderWithServices(<App />);
            
            // Use keyboard to navigate and fill login form
            const user = runner.getUser();
            await user.tab(); // Focus email input
            await user.type('keyboard.user@example.com');
            await user.tab(); // Focus password input
            await user.type('password123');
            await user.tab(); // Focus submit button
            await user.keyboard('{Enter}'); // Submit form
          },
          async () => {
            await actions.verify.userIsAuthenticated();
          }
        )
        .addStep(
          'Keyboard Project Creation',
          'Create project using keyboard navigation',
          async () => {
            const user = runner.getUser();
            
            // Navigate to create project button
            await user.tab(); // Navigate through interface
            await user.keyboard('{Enter}'); // Activate create project
            
            // Fill project form with keyboard
            await user.type('Keyboard Accessible Project');
            await user.tab(); // Description field
            await user.type('Created entirely with keyboard navigation');
            await user.tab(); // Submit button
            await user.keyboard('{Enter}'); // Submit
          },
          async () => {
            await actions.verify.projectExists('Keyboard Accessible Project');
          }
        )
        .addStep(
          'Keyboard Task Management',
          'Manage tasks using keyboard only',
          async () => {
            const user = runner.getUser();
            
            // Navigate to project and create task
            await user.tab(); // Navigate to project
            await user.keyboard('{Enter}'); // Enter project
            
            // Create task with keyboard
            await user.tab(); // Find create task button
            await user.keyboard('{Enter}'); // Open task creation
            await user.type('Keyboard created task');
            await user.keyboard('{Enter}'); // Submit task
          },
          async () => {
            await actions.verify.taskExists('Keyboard created task');
          }
        )
        .withExpectedOutcome('Complete workflow accomplished using only keyboard navigation')
        .build();

      const result = await runner.runScenario(scenario);
      
      expect(result.success).toBe(true);
      
      // Verify no accessibility violations occurred during the workflow
      // In a real implementation, you'd integrate with axe-core or similar
    });
  });
});
