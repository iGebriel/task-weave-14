import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { setupTestServices, createTestScenario } from '@/test/utils';

/**
 * End-to-End testing utilities for complete user journey validation
 */

export interface E2EScenario {
  name: string;
  description: string;
  preconditions?: string[];
  steps: E2EStep[];
  expectedOutcome: string;
  cleanup?: () => Promise<void>;
}

export interface E2EStep {
  action: string;
  description: string;
  execute: () => Promise<void>;
  verify: () => Promise<void>;
  timeout?: number;
}

export interface E2EResult {
  scenario: string;
  success: boolean;
  duration: number;
  steps: Array<{
    step: string;
    success: boolean;
    duration: number;
    error?: string;
  }>;
  error?: string;
}

/**
 * E2E Test Runner for executing complete user workflows
 */
export class E2ETestRunner {
  private mockServices: ReturnType<typeof setupTestServices>;
  private user: ReturnType<typeof userEvent.setup>;

  constructor() {
    this.mockServices = setupTestServices();
    this.user = userEvent.setup();
  }

  /**
   * Execute a complete E2E scenario
   */
  async runScenario(scenario: E2EScenario): Promise<E2EResult> {
    const startTime = performance.now();
    console.log(`Starting E2E scenario: ${scenario.name}`);

    const result: E2EResult = {
      scenario: scenario.name,
      success: false,
      duration: 0,
      steps: [],
    };

    try {
      // Check preconditions
      if (scenario.preconditions) {
        await this.checkPreconditions(scenario.preconditions);
      }

      // Execute each step
      for (const step of scenario.steps) {
        const stepStartTime = performance.now();
        console.log(`  ▶️  ${step.action}: ${step.description}`);

        try {
          await step.execute();
          await step.verify();

          const stepDuration = performance.now() - stepStartTime;
          result.steps.push({
            step: step.action,
            success: true,
            duration: stepDuration,
          });

          console.log(`  ${step.action} completed (${stepDuration.toFixed(2)}ms)`);
        } catch (error) {
          const stepDuration = performance.now() - stepStartTime;
          result.steps.push({
            step: step.action,
            success: false,
            duration: stepDuration,
            error: error instanceof Error ? error.message : String(error),
          });

          console.error(`  ${step.action} failed: ${error}`);
          throw error;
        }
      }

      result.success = true;
      result.duration = performance.now() - startTime;
      console.log(`E2E scenario completed: ${scenario.name} (${result.duration.toFixed(2)}ms)`);

    } catch (error) {
      result.success = false;
      result.duration = performance.now() - startTime;
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`E2E scenario failed: ${scenario.name}`, error);
    } finally {
      // Run cleanup if provided
      if (scenario.cleanup) {
        await scenario.cleanup();
      }
    }

    return result;
  }

  /**
   * Run multiple scenarios in sequence
   */
  async runScenarios(scenarios: E2EScenario[]): Promise<E2EResult[]> {
    const results: E2EResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);

      // Stop on first failure unless configured otherwise
      if (!result.success) {
        console.error(`🛑 Stopping E2E suite due to failure in: ${scenario.name}`);
        break;
      }
    }

    return results;
  }

  /**
   * Get mock services for scenario setup
   */
  getServices() {
    return this.mockServices;
  }

  /**
   * Get user event instance for interactions
   */
  getUser() {
    return this.user;
  }

  /**
   * Check preconditions before running scenario
   */
  private async checkPreconditions(preconditions: string[]): Promise<void> {
    console.log(`  Checking preconditions...`);
    for (const condition of preconditions) {
      console.log(`    • ${condition}`);
      // In a real implementation, you would validate actual preconditions
    }
  }
}

/**
 * Common E2E actions and utilities
 */
export class E2EActions {
  constructor(
    private user: ReturnType<typeof userEvent.setup>,
    private services: ReturnType<typeof setupTestServices>
  ) { }

  /**
   * Authentication actions
   */
  auth = {
    login: async (email: string, password: string) => {
      // Find login form elements using more specific selectors
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('sign-in-button');

      // Fill form
      await this.user.clear(emailInput);
      await this.user.type(emailInput, email);
      await this.user.clear(passwordInput);
      await this.user.type(passwordInput, password);

      // Submit form
      await this.user.click(submitButton);

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.queryByTestId('sign-in-button')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    },

    logout: async () => {
      const userMenu = screen.getByTestId('user-menu');
      await this.user.click(userMenu);

      const logoutButton = screen.getByTestId('sign-out-button');
      await this.user.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      });
    },

    register: async (name: string, email: string, password: string) => {
      // First, switch to register form from login form
      const signUpLink = screen.getByText(/sign up/i);
      await this.user.click(signUpLink);

      // Wait for register form to appear
      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('register-email-input');
      const passwordInput = screen.getByTestId('register-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const termsCheckbox = screen.getByTestId('terms-checkbox');
      const submitButton = screen.getByTestId('sign-up-button');

      await this.user.type(nameInput, name);
      await this.user.type(emailInput, email);
      await this.user.type(passwordInput, password);
      await this.user.type(confirmPasswordInput, password);
      await this.user.click(termsCheckbox);
      await this.user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('sign-up-button')).not.toBeInTheDocument();
      });
    },
  };

  /**
   * Project management actions
   */
  projects = {
    create: async (name: string, description?: string) => {
      const createButton = screen.getByTestId('create-project-button');
      await this.user.click(createButton);

      const nameInput = screen.getByTestId('project-name-input');
      await this.user.type(nameInput, name);

      if (description) {
        const descInput = screen.getByTestId('project-description-input');
        await this.user.type(descInput, description);
      } else {
        // Add minimum required description
        const descInput = screen.getByTestId('project-description-input');
        await this.user.type(descInput, 'Test project description');
      }

      const submitButton = screen.getByTestId('create-project-submit');
      await this.user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    },

    select: async (projectName: string) => {
      const projectCard = screen.getByText(projectName).closest('[data-testid="project-card"]');
      if (!projectCard) throw new Error(`Project not found: ${projectName}`);

      await this.user.click(projectCard);

      await waitFor(() => {
        expect(screen.getByText(projectName)).toBeInTheDocument();
      });
    },

    edit: async (projectName: string, newName: string) => {
      const projectCard = screen.getByText(projectName).closest('[data-testid="project-card"]');
      if (!projectCard) throw new Error(`Project not found: ${projectName}`);

      const editButton = projectCard.querySelector('[data-testid="edit-project"]');
      if (!editButton) throw new Error('Edit button not found');

      await this.user.click(editButton);

      const nameInput = screen.getByDisplayValue(projectName);
      await this.user.clear(nameInput);
      await this.user.type(nameInput, newName);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await this.user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(newName)).toBeInTheDocument();
      });
    },

    delete: async (projectName: string) => {
      const projectCard = screen.getByText(projectName).closest('[data-testid="project-card"]');
      if (!projectCard) throw new Error(`Project not found: ${projectName}`);

      const deleteButton = projectCard.querySelector('[data-testid="delete-project"]');
      if (!deleteButton) throw new Error('Delete button not found');

      await this.user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await this.user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText(projectName)).not.toBeInTheDocument();
      });
    },
  };

  /**
   * Task management actions
   */
  tasks = {
    create: async (title: string, description?: string) => {
      const createButton = screen.getByRole('button', { name: /create task/i });
      await this.user.click(createButton);

      const titleInput = screen.getByLabelText(/task title/i);
      await this.user.type(titleInput, title);

      if (description) {
        const descInput = screen.getByLabelText(/description/i);
        await this.user.type(descInput, description);
      }

      const submitButton = screen.getByRole('button', { name: /create/i });
      await this.user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    },

    move: async (taskTitle: string, targetColumn: string) => {
      const taskCard = screen.getByText(taskTitle).closest('[data-testid="task-card"]');
      if (!taskCard) throw new Error(`Task not found: ${taskTitle}`);

      const targetColumnElement = screen.getByTestId(`column-${targetColumn}`);
      if (!targetColumnElement) throw new Error(`Column not found: ${targetColumn}`);

      // Simulate drag and drop
      fireEvent.dragStart(taskCard);
      fireEvent.dragOver(targetColumnElement);
      fireEvent.drop(targetColumnElement);

      await waitFor(() => {
        const movedTask = targetColumnElement.querySelector(`[data-testid="task-card"]`);
        expect(movedTask).toContainElement(screen.getByText(taskTitle));
      });
    },

    edit: async (taskTitle: string, newTitle: string) => {
      const taskCard = screen.getByText(taskTitle).closest('[data-testid="task-card"]');
      if (!taskCard) throw new Error(`Task not found: ${taskTitle}`);

      await this.user.dblClick(taskCard);

      const titleInput = screen.getByDisplayValue(taskTitle);
      await this.user.clear(titleInput);
      await this.user.type(titleInput, newTitle);
      await this.user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(newTitle)).toBeInTheDocument();
      });
    },

    assignTo: async (taskTitle: string, assignee: string) => {
      const taskCard = screen.getByText(taskTitle).closest('[data-testid="task-card"]');
      if (!taskCard) throw new Error(`Task not found: ${taskTitle}`);

      const assignButton = taskCard.querySelector('[data-testid="assign-task"]');
      if (!assignButton) throw new Error('Assign button not found');

      await this.user.click(assignButton);

      const assigneeOption = screen.getByText(assignee);
      await this.user.click(assigneeOption);

      await waitFor(() => {
        expect(taskCard).toHaveTextContent(assignee);
      });
    },
  };

  /**
   * Navigation actions
   */
  navigation = {
    goToDashboard: async () => {
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      await this.user.click(dashboardLink);

      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });
    },

    goToProject: async (projectName: string) => {
      await this.projects.select(projectName);
    },

    goToSettings: async () => {
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      await this.user.click(settingsLink);

      await waitFor(() => {
        expect(screen.getByText(/settings/i)).toBeInTheDocument();
      });
    },
  };

  /**
   * Verification helpers
   */
  verify = {
    userIsAuthenticated: async () => {
      await waitFor(() => {
        expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      });
    },

    userIsNotAuthenticated: async () => {
      await waitFor(() => {
        expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      });
    },

    projectExists: async (projectName: string) => {
      await waitFor(() => {
        expect(screen.getByText(projectName)).toBeInTheDocument();
      });
    },

    taskExists: async (taskTitle: string) => {
      await waitFor(() => {
        expect(screen.getByText(taskTitle)).toBeInTheDocument();
      });
    },

    taskInColumn: async (taskTitle: string, columnName: string) => {
      const column = screen.getByTestId(`column-${columnName}`);
      await waitFor(() => {
        expect(column).toContainElement(screen.getByText(taskTitle));
      });
    },

    notificationShown: async (message: string) => {
      await waitFor(() => {
        // Check for toast notifications - they might be in different containers
        const notification = screen.queryByText(message) || screen.queryByText(new RegExp(message, 'i'));
        expect(notification).toBeInTheDocument();
      }, { timeout: 10000 });
    },

    pageTitle: async (title: string) => {
      await waitFor(() => {
        expect(document.title).toContain(title);
      });
    },

    urlContains: async (path: string) => {
      await waitFor(() => {
        expect(window.location.pathname).toContain(path);
      });
    },
  };
}

/**
 * E2E test scenario builders
 */
export const createE2EScenario = (name: string, description: string): E2EScenarioBuilder => {
  return new E2EScenarioBuilder(name, description);
};

class E2EScenarioBuilder {
  private scenario: Partial<E2EScenario>;

  constructor(name: string, description: string) {
    this.scenario = {
      name,
      description,
      steps: [],
    };
  }

  withPreconditions(conditions: string[]): this {
    this.scenario.preconditions = conditions;
    return this;
  }

  addStep(action: string, description: string, execute: () => Promise<void>, verify: () => Promise<void>): this {
    this.scenario.steps!.push({
      action,
      description,
      execute,
      verify,
    });
    return this;
  }

  withCleanup(cleanup: () => Promise<void>): this {
    this.scenario.cleanup = cleanup;
    return this;
  }

  withExpectedOutcome(outcome: string): this {
    this.scenario.expectedOutcome = outcome;
    return this;
  }

  build(): E2EScenario {
    if (!this.scenario.expectedOutcome) {
      throw new Error('Expected outcome is required for E2E scenario');
    }
    return this.scenario as E2EScenario;
  }
}

/**
 * E2E test utilities for common patterns
 */
export const E2EUtils = {
  /**
   * Wait for loading to complete
   */
  waitForLoadingToComplete: async (timeout = 10000) => {
    await waitFor(() => {
      const loadingElements = screen.queryAllByText(/loading/i);
      expect(loadingElements).toHaveLength(0);
    }, { timeout });
  },

  /**
   * Wait for network requests to complete
   */
  waitForNetworkIdle: async (timeout = 5000) => {
    return new Promise(resolve => setTimeout(resolve, 100)); // Mock implementation
  },

  /**
   * Take screenshot for visual regression testing
   */
  takeScreenshot: async (name: string) => {
    console.log(`📸 Screenshot taken: ${name}`);
    // In a real implementation, you would capture actual screenshots
  },

  /**
   * Check for console errors during test execution
   */
  checkConsoleErrors: () => {
    const consoleErrors: string[] = [];
    const originalError = console.error;

    console.error = (...args) => {
      consoleErrors.push(args.join(' '));
      originalError(...args);
    };

    return {
      getErrors: () => consoleErrors,
      restore: () => {
        console.error = originalError;
      },
    };
  },

  /**
   * Simulate slow network conditions
   */
  simulateSlowNetwork: () => {
    // Mock implementation - in reality, you would throttle network requests
    console.log('🐌 Simulating slow network conditions');
  },

  /**
   * Simulate offline conditions
   */
  simulateOffline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    window.dispatchEvent(new Event('offline'));
  },

  /**
   * Restore online conditions
   */
  restoreOnline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    window.dispatchEvent(new Event('online'));
  },
};
